import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  mergeProjectSpecs,
  observeProjects,
  parseArgs,
  readProjectsFile
} from "../scripts/sync-ndt-snapshot.mjs";
import { createSnapshot } from "../scripts/snapshot/snapshot-builder.mjs";
import { validateWorkbenchSnapshot } from "../src/core/snapshot-guard.mjs";

const observedAt = "2026-01-01T00:00:00.000Z";

async function projectRoot() {
  return fs.mkdtemp(path.join(os.tmpdir(), "workbench-project-"));
}

async function writeManifest(root, overrides = {}) {
  await fs.mkdir(path.join(root, ".nero-design"), { recursive: true });
  await fs.mkdir(path.join(root, "design-output"), { recursive: true });
  await fs.mkdir(path.join(root, "exports"), { recursive: true });
  await fs.mkdir(path.join(root, "screenshots"), { recursive: true });
  const manifest = {
    schema_version: "1.0.0",
    project_name: "Fixture Project",
    route: "frontend-ui",
    template: "frontend-dashboard",
    preset: null,
    project_local: {
      output_root: path.join(root, "design-output"),
      exports_root: path.join(root, "exports"),
      screenshots_root: path.join(root, "screenshots")
    },
    asset_ids: ["NDT-TPL-001", "CASE-NOT-AN-ASSET"],
    adoption_receipts: [
      {
        asset_id: "NDT-TPL-001",
        artifact_id: "hero-layout",
        state: "verified",
        source: "receipts/hero-layout.json"
      }
    ],
    case_references: [
      "CASE-FIXTURE-001",
      path.join(path.parse(root).root, "workspace", "design-team", "assets", "style-references", "example", "manifest.json"),
      path.join(path.parse(root).root, "workspace", "restricted-project", "case.json")
    ],
    qa: {
      visual_qa_manifest: null,
      visual_score_manifest: null,
      production_check_manifest: null
    },
    ...overrides
  };
  await fs.writeFile(
    path.join(root, ".nero-design", "manifest.json"),
    JSON.stringify(manifest),
    "utf8"
  );
}

describe("snapshot adapter", () => {
  it("requires explicit, unique project aliases", () => {
    const options = parseArgs([
      "--ndt-home",
      "/tmp/ndt",
      "--project",
      "sample=/tmp/project",
      "--check"
    ]);
    expect(options.projects).toEqual([{ alias: "sample", root: "/tmp/project" }]);
    expect(() =>
      parseArgs([
        "--ndt-home",
        "/tmp/ndt",
        "--project",
        "sample=/tmp/a",
        "--project",
        "sample=/tmp/b"
      ])
    ).toThrow(/Duplicate/);
  });

  it("loads and merges an explicitly authorized projects file", async () => {
    const root = await projectRoot();
    const sourcesPath = path.join(root, "project-sources.json");
    await fs.writeFile(
      sourcesPath,
      JSON.stringify({
        schemaVersion: "workbench.project-sources.v1",
        projects: [{ alias: "from-file", root }]
      }),
      "utf8"
    );

    const fromFile = await readProjectsFile(sourcesPath);
    expect(fromFile).toEqual([{ alias: "from-file", root }]);
    expect(
      parseArgs([
        "--ndt-home",
        "/tmp/ndt",
        "--projects-file",
        sourcesPath
      ]).projectsFile
    ).toBe(sourcesPath);
    expect(() =>
      mergeProjectSpecs(fromFile, [{ alias: "from-file", root: "/tmp/duplicate" }])
    ).toThrow(/Duplicate/);

    await fs.writeFile(
      sourcesPath,
      JSON.stringify({
        schemaVersion: "workbench.project-sources.v1",
        projects: [{ alias: "invalid", root: "relative/path" }]
      }),
      "utf8"
    );
    await expect(readProjectsFile(sourcesPath)).rejects.toThrow(/absolute/);
    expect(() =>
      parseArgs(["--ndt-home", "/tmp/ndt", "--projects-file", "relative.json"])
    ).toThrow(/absolute/);
  });

  it("preserves not_configured, observed_empty, and observed states", async () => {
    const none = await observeProjects([], observedAt);
    expect(none.data.index.discovery).toBe("not_configured");

    const emptyRoot = await projectRoot();
    const empty = await observeProjects([{ alias: "empty", root: emptyRoot }], observedAt);
    expect(empty.data.index.discovery).toBe("observed_empty");

    const validRoot = await projectRoot();
    await writeManifest(validRoot);
    await fs.writeFile(path.join(validRoot, "design-output", "report.pdf"), "fixture", "utf8");
    const observed = await observeProjects([{ alias: "valid", root: validRoot }], observedAt);
    expect(observed.data.index.discovery).toBe("observed");
    expect(observed.data.index.projects).toHaveLength(1);
    expect(observed.data.detailsById.valid.declaredAssetIds).toEqual(["NDT-TPL-001"]);
    expect(observed.data.detailsById.valid.ndtIntegration).toEqual({
      state: "not_declared",
      role: null,
      declaredVersion: null
    });
    expect(observed.data.detailsById.valid.adoptionReceipts).toEqual([
      {
        assetId: "NDT-TPL-001",
        artifactId: "hero-layout",
        state: "declared_unverified",
        source: "receipts/hero-layout.json"
      }
    ]);
    expect(observed.data.detailsById.valid.caseReferences).toEqual([
      "CASE-FIXTURE-001",
      "assets/style-references/example/manifest.json"
    ]);
    expect(observed.issues.some((issue) => issue.code === "ABSOLUTE_REFERENCE_REDACTED")).toBe(true);
    expect(observed.data.detailsById.valid.artifacts[0].relativePath).toBe(
      "design-output/report.pdf"
    );
    expect(JSON.stringify(observed.data)).not.toContain(validRoot);
  });

  it("does not promote self-reported receipts or expose absolute receipt paths", async () => {
    const root = await projectRoot();
    await writeManifest(root, {
      adoption_receipts: [
        {
          asset_id: "NDT-TPL-001",
          artifact_id: path.join(root, "hero-layout"),
          state: "verified",
          source: path.join(root, "receipts", "hero-layout.json")
        }
      ]
    });
    const observed = await observeProjects([{ alias: "receipts", root }], observedAt);
    expect(observed.data.detailsById.receipts.adoptionReceipts).toEqual([
      {
        assetId: "NDT-TPL-001",
        artifactId: null,
        state: "declared_unverified",
        source: null
      }
    ]);
    expect(JSON.stringify(observed.data)).not.toContain(root);
  });

  it("blocks manifest-declared paths outside the project root", async () => {
    const root = await projectRoot();
    await writeManifest(root, {
      project_local: {
        output_root: os.tmpdir(),
        exports_root: path.join(root, "exports"),
        screenshots_root: path.join(root, "screenshots")
      }
    });
    const result = await observeProjects([{ alias: "bounded", root }], observedAt);
    expect(result.issues.some((issue) => issue.code === "PATH_OUTSIDE_ALLOWED_ROOT")).toBe(true);
    expect(result.data.detailsById.bounded.artifacts).toEqual([]);
  });

  it("projects only the explicitly bundled public Registry previews", async () => {
    const ndtHome = path.resolve("..");
    const snapshot = await createSnapshot({ ndtHome, projects: [] });
    const source = JSON.parse(
      await fs.readFile(path.join(ndtHome, "registry/design-assets.json"), "utf8")
    );
    expect(validateWorkbenchSnapshot(snapshot)).toEqual([]);
    expect(source.registry_profile).toBe("public_derivative");
    expect(source.authoritative).toBe(false);
    expect(snapshot.catalog.data.assets).toHaveLength(source.assets.length);
    expect(snapshot.catalog.data.categories).toHaveLength(source.categories.length);
    expect(snapshot.catalog.data.recipes).toHaveLength(source.recipes.length);
    const resolvedPreviews = snapshot.catalog.data.assets.filter(
      (asset) => asset.preview.state === "resolved"
    );
    expect(resolvedPreviews).toHaveLength(source.assets.length);
    expect(resolvedPreviews.every((asset) => /^\.\/library-previews\/[a-z0-9-]+\.png$/i.test(asset.preview.url))).toBe(true);
    expect(snapshot.catalog.data.assets.every((asset) => asset.preview.variants.length === 0)).toBe(true);
    expect(snapshot.catalog.data.integrityIssues).toEqual([]);
    expect(snapshot.catalog.state.upstreamAuthority).toBe("derived");
    expect(snapshot.catalog.state.projection).toBe("sanitized_snapshot");
    expect(snapshot.catalog.source.fingerprint).not.toBeNull();
  });
});


describe("canonical asset state projection", () => {
  it("carries canonical fields without deriving acceptance from legacy labels", async () => {
    const { projectAssets } = await import("../scripts/snapshot/catalog-projector.mjs");
    const registry = { assets: [{ id: "A", status: "approved", maturity: "candidate", reuse_state: "reference_only", aliases: ["中文别名"] }, { id: "B", status: "passed" }] };
    const projected = projectAssets(registry, []);
    expect(projected.assets[0]).toMatchObject({ maturity: "candidate", reuseState: "reference_only", aliases: ["中文别名"] });
    expect(projected.assets[1]).toMatchObject({ maturity: "unknown", reuseState: "unknown", aliases: [] });
  });

  it("does not resolve preview paths outside the public preview directory", async () => {
    const { projectAssets } = await import("../scripts/snapshot/catalog-projector.mjs");
    const registry = { assets: [{ id: "A", preview: { source_ref: "../private/example.png" } }] };
    expect(projectAssets(registry, []).assets[0].preview).toMatchObject({ state: "unresolved", url: null });
  });
});
