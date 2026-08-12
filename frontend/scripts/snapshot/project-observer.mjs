import {
  artifactExtensions,
  asNullableText,
  asText,
  asTextList,
  issueRecord,
  maxArtifactDepth,
  maxArtifactDirs,
  maxArtifactFiles,
  maxJsonBytes,
  mediaTypeFor,
  path,
  posix,
  fs,
  sha256,
  stableNdtAssetIds,
  within
} from "./shared.mjs";

async function scanArtifactDirectory(projectRoot, directory, alias, counters, issues, depth = 0) {
  if (depth > maxArtifactDepth) {
    issues.push(issueRecord("SCAN_LIMIT_EXCEEDED", "warning", alias + ": artifact depth exceeded", "projects", alias));
    return [];
  }
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    issues.push(issueRecord("ACCESS_DENIED", "warning", alias + ": artifact directory unavailable", "projects", alias));
    return [];
  }

  const artifacts = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const candidate = path.join(directory, entry.name);
    const stat = await fs.lstat(candidate);
    if (stat.isSymbolicLink()) {
      issues.push(issueRecord("PATH_OUTSIDE_ALLOWED_ROOT", "warning", alias + ": symlink skipped", "projects", alias));
      continue;
    }
    const real = await fs.realpath(candidate);
    if (!within(projectRoot, real)) {
      issues.push(issueRecord("PATH_OUTSIDE_ALLOWED_ROOT", "blocked", alias + ": path escaped project root", "projects", alias));
      continue;
    }
    if (stat.isDirectory()) {
      counters.directories += 1;
      if (counters.directories > maxArtifactDirs) {
        issues.push(issueRecord("SCAN_LIMIT_EXCEEDED", "warning", alias + ": directory limit exceeded", "projects", alias));
        break;
      }
      artifacts.push(
        ...(await scanArtifactDirectory(projectRoot, real, alias, counters, issues, depth + 1))
      );
      continue;
    }
    if (!stat.isFile()) continue;
    counters.files += 1;
    if (counters.files > maxArtifactFiles) {
      issues.push(issueRecord("SCAN_LIMIT_EXCEEDED", "warning", alias + ": file limit exceeded", "projects", alias));
      break;
    }
    if (!artifactExtensions.has(path.extname(entry.name).toLowerCase())) {
      issues.push(issueRecord("UNSUPPORTED_ARTIFACT_TYPE", "info", alias + ": unsupported artifact skipped", "projects", alias));
      continue;
    }
    const relativePath = posix(path.relative(projectRoot, real));
    artifacts.push({
      id: "artifact-" + sha256(alias + ":" + relativePath).slice(0, 16),
      relativePath,
      mediaType: mediaTypeFor(real),
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      declaration: "observed_file_candidate",
      explicitVersion: null,
      readiness: null
    });
  }
  return artifacts;
}

async function resolveProjectChild(projectRoot, candidate) {
  if (typeof candidate !== "string") return null;
  const resolved = path.isAbsolute(candidate) ? path.resolve(candidate) : path.resolve(projectRoot, candidate);
  try {
    const stat = await fs.lstat(resolved);
    if (stat.isSymbolicLink()) throw new Error("PATH_OUTSIDE_ALLOWED_ROOT");
    const real = await fs.realpath(resolved);
    if (!within(projectRoot, real)) throw new Error("PATH_OUTSIDE_ALLOWED_ROOT");
    return real;
  } catch (error) {
    if (error?.code === "ENOENT") {
      const parent = await fs.realpath(path.dirname(resolved));
      const normalizedMissing = path.join(parent, path.basename(resolved));
      if (!within(projectRoot, normalizedMissing)) throw new Error("PATH_OUTSIDE_ALLOWED_ROOT");
      return normalizedMissing;
    }
    throw error;
  }
}

async function readQaEvidence(projectRoot, manifest, alias, issues) {
  const evidence = [];
  const declarations = [
    ["visual_qa_manifest", "input_manifest"],
    ["visual_score_manifest", "input_manifest"],
    ["production_check_manifest", "input_manifest"]
  ];
  for (const [key, kind] of declarations) {
    const reference = manifest.qa?.[key];
    if (!reference) {
      evidence.push({
        kind,
        state: "not_declared",
        relativeSource: null,
        reportedStatus: null
      });
      continue;
    }
    try {
      const target = await resolveProjectChild(projectRoot, reference);
      const stat = await fs.stat(target);
      if (stat.size > maxJsonBytes) throw new Error("SOURCE_TOO_LARGE");
      JSON.parse(await fs.readFile(target, "utf8"));
      evidence.push({
        kind,
        state: "observed",
        relativeSource: posix(path.relative(projectRoot, target)),
        reportedStatus: null
      });
    } catch {
      issues.push(issueRecord("BROKEN_REFERENCE", "warning", alias + ": QA declaration is unavailable", "projects", alias));
      evidence.push({
        kind,
        state: "broken_reference",
        relativeSource: null,
        reportedStatus: null
      });
    }
  }
  return evidence;
}

export async function observeProjects(projectSpecs, observedAt) {
  const issues = [];
  if (!projectSpecs.length) {
    return {
      state: {
        upstreamAuthority: "project_local",
        availability: "not_checked",
        configuration: "not_configured",
        runtime: "not_applicable",
        freshnessAtObservation: "unknown",
        projection: "project_manifest_snapshot"
      },
      data: {
        index: { discovery: "not_configured", projects: [] },
        detailsById: {}
      },
      issues: [issueRecord("ROOT_NOT_CONFIGURED", "info", "No project aliases were configured", "projects")]
    };
  }

  const projects = [];
  const detailsById = {};
  let observedRoots = 0;
  for (const spec of projectSpecs) {
    try {
      const projectRoot = await fs.realpath(spec.root);
      const manifestPath = path.join(projectRoot, ".nero-design", "manifest.json");
      let manifest;
      try {
        const manifestStat = await fs.lstat(manifestPath);
        if (manifestStat.isSymbolicLink()) throw new Error("PATH_OUTSIDE_ALLOWED_ROOT");
        if (manifestStat.size > maxJsonBytes) throw new Error("SOURCE_TOO_LARGE");
        manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
      } catch (error) {
        if (error?.code === "ENOENT") {
          observedRoots += 1;
          continue;
        }
        throw error;
      }
      observedRoots += 1;
      if (manifest.schema_version !== "1.0.0") {
        projects.push({
          id: spec.alias,
          name: spec.alias,
          route: null,
          manifestState: "unsupported_schema"
        });
        issues.push(issueRecord("UNSUPPORTED_SCHEMA", "warning", spec.alias + ": unsupported project manifest", "projects", spec.alias));
        continue;
      }

      const projectIssues = [];
      const counters = { directories: 0, files: 0 };
      const artifacts = [];
      const declaredDirs = [
        manifest.project_local?.output_root,
        manifest.project_local?.exports_root,
        manifest.project_local?.screenshots_root
      ];
      for (const declared of declaredDirs) {
        if (!declared) continue;
        try {
          const target = await resolveProjectChild(projectRoot, declared);
          artifacts.push(
            ...(await scanArtifactDirectory(projectRoot, target, spec.alias, counters, projectIssues))
          );
        } catch {
          projectIssues.push(
            issueRecord("PATH_OUTSIDE_ALLOWED_ROOT", "blocked", spec.alias + ": declared directory escaped root", "projects", spec.alias)
          );
        }
      }
      const qaEvidence = await readQaEvidence(projectRoot, manifest, spec.alias, projectIssues);
      const caseReferences = projectCaseReferences(projectRoot, manifest, spec.alias, projectIssues);
      issues.push(...projectIssues);
      const detail = {
        id: spec.alias,
        name: asText(manifest.project_name, spec.alias),
        manifestVersion: asNullableText(manifest.schema_version),
        route: asNullableText(manifest.route),
        template: asNullableText(manifest.template),
        preset: asNullableText(manifest.preset),
        ndtIntegration: {
          state: manifest.design_team && typeof manifest.design_team === "object"
            ? "declared"
            : "not_declared",
          role: asNullableText(manifest.design_team?.role),
          declaredVersion: asNullableText(manifest.design_team?.version)
        },
        declaredAssetIds: stableNdtAssetIds(
          manifest.declared_asset_ids,
          manifest.asset_ids,
          manifest.capability_refs,
          manifest.design_team?.declared_asset_ids,
          manifest.design_team?.asset_ids
        ),
        adoptionReceipts: projectAdoptionReceipts(manifest),
        caseReferences,
        artifacts,
        qaEvidence
      };
      detailsById[spec.alias] = detail;
      projects.push({
        id: spec.alias,
        name: detail.name,
        route: detail.route,
        manifestState: "observed"
      });
    } catch {
      issues.push(issueRecord("ACCESS_DENIED", "warning", spec.alias + ": project root unavailable", "projects", spec.alias));
    }
  }

  const discovery = projects.length
    ? "observed"
    : observedRoots
      ? "observed_empty"
      : "unavailable";
  return {
    state: {
      upstreamAuthority: "project_local",
      availability: discovery === "unavailable" ? "unreadable" : "observed_available",
      configuration: "configured",
      runtime: "not_applicable",
      freshnessAtObservation: "unknown",
      projection: "project_manifest_snapshot"
    },
    data: {
      index: { discovery, projects },
      detailsById
    },
    issues
  };
}

function projectAdoptionReceipts(manifest) {
  const receipts = [
    ...asReceiptList(manifest.adoption_receipts),
    ...asReceiptList(manifest.design_team?.adoption_receipts)
  ];
  const seen = new Set();
  const projected = [];
  for (const receipt of receipts) {
    if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) continue;
    const [assetId] = stableNdtAssetIds(receipt.asset_id, receipt.assetId);
    if (!assetId) continue;
    const artifactId = projectReferenceId(receipt.artifact_id ?? receipt.artifactId);
    const source = projectRelativeReference(
      receipt.source ?? receipt.receipt_ref ?? receipt.receiptRef
    );
    const rawState = asNullableText(receipt.state ?? receipt.status);
    // A project Manifest may report that a receipt is verified, but this read-only
    // adapter has no registered receipt schema or signature verifier. Never promote
    // that self-report into verified evidence.
    const state = rawState === "invalid" ? "invalid" : "declared_unverified";
    const key = [assetId, artifactId ?? "", source ?? "", state].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    projected.push({ assetId, artifactId, state, source });
  }
  return projected;
}

function projectReferenceId(value) {
  const text = asNullableText(value);
  if (!text || text.length > 160 || /[\\/]/.test(text) || text.startsWith("~")) return null;
  return text;
}

function projectCaseReferences(projectRoot, manifest, alias, issues) {
  const references = [];
  const seen = new Set();
  for (const value of asTextList(manifest.case_references)) {
    let projected = value;
    if (path.isAbsolute(value)) {
      const resolved = path.resolve(value);
      if (within(projectRoot, resolved)) {
        projected = posix(path.relative(projectRoot, resolved));
      } else {
        projected = canonicalReferenceSuffix(value);
        if (!projected) {
          issues.push(issueRecord(
            "ABSOLUTE_REFERENCE_REDACTED",
            "info",
            alias + ": absolute case reference was removed from the browser snapshot",
            "projects",
            alias
          ));
          continue;
        }
      }
    } else if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) {
      const normalized = posix(path.normalize(value));
      if (normalized === ".." || normalized.startsWith("../") || normalized.startsWith("~")) {
        continue;
      }
      projected = normalized;
    }
    if (!seen.has(projected)) {
      seen.add(projected);
      references.push(projected);
    }
  }
  return references;
}

function canonicalReferenceSuffix(value) {
  const segments = posix(path.normalize(value)).split("/").filter(Boolean);
  const allowedRoots = new Set([
    "assets",
    "brand",
    "case-library",
    "generators",
    "prompts",
    "registry",
    "rules",
    "skill-source",
    "templates",
    "tokens"
  ]);
  const index = segments.findIndex((segment) => allowedRoots.has(segment));
  return index >= 0 ? segments.slice(index).join("/") : null;
}

function projectRelativeReference(value) {
  const text = asNullableText(value);
  if (!text || path.isAbsolute(text) || /^[a-z][a-z0-9+.-]*:/i.test(text) || text.startsWith("~")) {
    return null;
  }
  const normalized = posix(path.normalize(text));
  if (normalized === "." || normalized === ".." || normalized.startsWith("../")) return null;
  return normalized;
}

function asReceiptList(value) {
  return Array.isArray(value) ? value : value && typeof value === "object" ? [value] : [];
}
