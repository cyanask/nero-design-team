import {
  adapterVersion,
  asNullableText,
  asText,
  fs,
  issueRecord,
  isRecord,
  path,
  publicRegistryFingerprint,
  readPackageJson,
  sha256,
  stableStringify,
  validateSnapshotSchema,
  validateWorkbenchSnapshot
} from "./shared.mjs";
import { projectAssets, projectCatalogDomains } from "./catalog-projector.mjs";
import { observeProjects } from "./project-observer.mjs";

export async function createSnapshot(options) {
  const root = await fs.realpath(path.resolve(options.ndtHome));
  const registry = (await readPackageJson(root, "registry/design-team.json")).data;
  if (
    registry.registry_profile !== "public_derivative" ||
    registry.authoritative !== false ||
    !isRecord(registry.authority?.truth_domains)
  ) {
    throw new Error("UNSUPPORTED_SCHEMA: NDT root is not a public derivative package");
  }
  const assetsRegistry = (await readPackageJson(root, "registry/design-assets.json")).data;
  if (
    assetsRegistry.registry_profile !== "public_derivative" ||
    assetsRegistry.authoritative !== false
  ) {
    throw new Error("UNSUPPORTED_SCHEMA: asset catalog is not a public derivative");
  }
  const registryFingerprint = await publicRegistryFingerprint(root);
  const observedAt = new Date().toISOString();
  const openIntegrityIssues = (assetsRegistry.integrity_issues || []).filter(
    (item) => !String(item.status || "").startsWith("resolved")
  );
  const catalogProjection = await projectCatalogDomains(
    root,
    assetsRegistry.assets || [],
    openIntegrityIssues
  );
  const projectedAssets = projectAssets(assetsRegistry, catalogProjection.knownRoutes);
  const domainRecords = catalogProjection.domainRecords;
  const unboundDomainRecords = domainRecords
    .filter((record) => record.registryAssetId === null)
    .map((record) => ({
      domain: record.domain,
      sourceId: record.sourceId,
      issueCode: "UNBOUND_DOMAIN_RECORD"
    }));
  const integrityIssues = openIntegrityIssues.map((item) => ({
    id: asText(item.id),
    severity: asText(item.severity, "warning"),
    assetIds: projectedAssets.assets
      .filter((asset) => asset.sourceRef === item.source_ref)
      .map((asset) => asset.id)
  }));
  const catalogIssues = openIntegrityIssues.map((item) =>
    issueRecord(
      asText(item.id, "INTEGRITY_ISSUE"),
      item.severity === "error" ? "error" : "warning",
      asText(item.detail, "Open integrity issue"),
      "registry/design-assets.json"
    )
  );

  const projectProjection = await observeProjects(options.projects, observedAt);
  const base = {
    schemaVersion: "workbench.snapshot.v1",
    snapshotId: "",
    snapshotFingerprint: "",
    catalog: {
      contractVersion: "workbench.read.v1",
      adapterVersion,
      observedAt,
      source: {
        id: asText(registry.registry_id, "design-team"),
        sourceSchemaVersion: asNullableText(registry.schema_version),
        sourceVersion: asNullableText(registry.version),
        fingerprint: registryFingerprint
      },
      state: {
        upstreamAuthority: "derived",
        availability: "observed_available",
        configuration: "configured",
        runtime: "not_observed",
        freshnessAtObservation: "fingerprint_match_at_observation",
        projection: "sanitized_snapshot"
      },
      data: {
        ...projectedAssets,
        domainRecords,
        integrityIssues,
        unboundDomainRecords
      },
      issues: catalogIssues
    },
    projects: {
      contractVersion: "workbench.read.v1",
      adapterVersion,
      observedAt,
      source: {
        id: "project-roots",
        sourceSchemaVersion: "1.0.0",
        sourceVersion: null,
        fingerprint: null
      },
      state: projectProjection.state,
      data: projectProjection.data,
      issues: projectProjection.issues
    }
  };

  const fingerprintPayload = structuredClone(base);
  fingerprintPayload.catalog.observedAt = "";
  fingerprintPayload.projects.observedAt = "";
  const snapshotFingerprint = sha256(stableStringify(fingerprintPayload));
  base.snapshotFingerprint = snapshotFingerprint;
  base.snapshotId =
    "snap-" +
    observedAt.replaceAll(/[^0-9]/g, "").slice(0, 14) +
    "-" +
    snapshotFingerprint.slice(0, 12);

  const guardIssues = validateWorkbenchSnapshot(base);
  if (guardIssues.length) {
    throw new Error("UNSUPPORTED_SCHEMA: " + guardIssues.map((item) => item.message).join("; "));
  }
  const schemaIssues = await validateSnapshotSchema(base);
  if (schemaIssues.length) {
    throw new Error("UNSUPPORTED_SCHEMA: " + schemaIssues.join("; "));
  }
  return base;
}

export async function atomicWrite(outDir, snapshot) {
  await fs.mkdir(outDir, { recursive: true });
  const target = path.join(outDir, "snapshot.json");
  const temporary = path.join(outDir, ".snapshot." + process.pid + ".tmp");
  await fs.writeFile(temporary, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  const parsed = JSON.parse(await fs.readFile(temporary, "utf8"));
  const issues = validateWorkbenchSnapshot(parsed);
  if (issues.length) throw new Error("UNSUPPORTED_SCHEMA: temporary snapshot failed guard");
  const schemaIssues = await validateSnapshotSchema(parsed);
  if (schemaIssues.length) throw new Error("UNSUPPORTED_SCHEMA: temporary snapshot failed schema");
  await fs.rename(temporary, target);
  return target;
}
