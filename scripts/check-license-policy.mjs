import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootFlag = process.argv.indexOf("--root");
if (rootFlag !== -1 && !process.argv[rootFlag + 1]) throw new Error("--root requires a directory");
const root = await fs.realpath(path.resolve(rootFlag === -1 ? scriptRoot : process.argv[rootFlag + 1]));
const errors = [];
const required = ["LICENSE", "docs/LICENSE-NOTES.md", "package.json", "docs/third-party-metadata.json"];
for (const name of required) {
  try { await fs.access(path.join(root, name)); } catch { errors.push({ type: "missing-license-file", file: name }); }
}

const packageDocument = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
if (packageDocument.license !== "Apache-2.0") errors.push({ type: "package-license", value: packageDocument.license });
const licenseText = await fs.readFile(path.join(root, "LICENSE"), "utf8");
if (!/Apache License\s+Version 2\.0/i.test(licenseText)) errors.push({ type: "license-text", detail: "LICENSE is not Apache-2.0" });

const metadata = JSON.parse(await fs.readFile(path.join(root, "docs/third-party-metadata.json"), "utf8"));
const metadataByRepo = new Map((metadata.references || []).map((entry) => [entry.repo.toLowerCase(), entry]));
const snapshotRoot = path.join(root, "case-library", "snapshots");
for (const entry of await fs.readdir(snapshotRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const directory = path.join(snapshotRoot, entry.name);
  const snapshot = JSON.parse(await fs.readFile(path.join(directory, "snapshot.json"), "utf8"));
  const policy = metadataByRepo.get(String(snapshot.repo || "").toLowerCase());
  if (!policy) errors.push({ type: "missing-third-party-metadata", repo: snapshot.repo, file: path.relative(root, directory) });
  if (policy && policy.license_status !== snapshot.license_status) errors.push({ type: "license-status-mismatch", repo: snapshot.repo, metadata: policy.license_status, snapshot: snapshot.license_status });
  if (["unknown", "restricted"].includes(snapshot.license_status)) {
    const files = await fs.readdir(directory);
    const forbidden = files.filter((name) => !["snapshot.json", "file-index.json", "license-summary.md", "summary.md"].includes(name));
    if (forbidden.length) errors.push({ type: "non-metadata-bundled", repo: snapshot.repo, files: forbidden });
  }
}

const consolidatedPath = path.join(snapshotRoot, "public-metadata.json");
try {
  const consolidated = JSON.parse(await fs.readFile(consolidatedPath, "utf8"));
  const seen = new Set();
  for (const snapshot of consolidated.snapshots || []) {
    const repo = String(snapshot.upstream_ref || "").toLowerCase();
    if (!repo) { errors.push({ type: "public-metadata-repo-missing", id: snapshot.id }); continue; }
    if (seen.has(repo)) errors.push({ type: "public-metadata-duplicate", repo });
    seen.add(repo);
    const policy = metadataByRepo.get(repo);
    if (!policy) { errors.push({ type: "missing-third-party-metadata", repo: snapshot.upstream_ref, file: path.relative(root, consolidatedPath) }); continue; }
    if (snapshot.status !== policy.metadata_status) errors.push({ type: "metadata-status-mismatch", repo: snapshot.upstream_ref, expected: policy.metadata_status, actual: snapshot.status });
    if (snapshot.rights !== policy.rights) errors.push({ type: "metadata-rights-mismatch", repo: snapshot.upstream_ref, expected: policy.rights, actual: snapshot.rights });
    if (policy.bundling !== "metadata-only" || snapshot.source_boundary?.metadata_only !== true || snapshot.source_boundary?.external_material_bundled !== false) {
      errors.push({ type: "metadata-only-boundary", repo: snapshot.upstream_ref });
    }
  }
} catch (error) {
  if (error.code !== "ENOENT") errors.push({ type: "public-metadata-parse", detail: error.message });
}

for (const entry of metadata.references || []) {
  if (!["permissive", "restricted", "unknown"].includes(entry.license_status)) errors.push({ type: "invalid-license-status", repo: entry.repo, status: entry.license_status });
  if (["restricted", "unknown"].includes(entry.license_status) && entry.bundling !== "metadata-only") errors.push({ type: "restricted-bundling", repo: entry.repo, bundling: entry.bundling });
}

console.log(JSON.stringify({ status: errors.length ? "fail" : "pass", checked_at: new Date().toISOString(), references: metadata.references?.length || 0, errors }, null, 2));
if (errors.length) process.exit(1);
