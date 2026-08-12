import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const flag = process.argv.indexOf("--root");
if (flag !== -1 && !process.argv[flag + 1]) throw new Error("--root requires a directory");
const root = await fs.realpath(path.resolve(flag === -1 ? scriptRoot : process.argv[flag + 1]));
const manifest = JSON.parse(await fs.readFile(path.join(root, "release-manifest.json"), "utf8"));
const allowedRoots = new Set(manifest.allowed_root_entries || []);
const allowedFiles = new Set(manifest.files || []);
const allowedBinaryExtensions = new Set((manifest.allowed_binary_extensions || []).map((value) => value.toLowerCase()));
const allowedExecutables = new Set(manifest.allowed_executable_files || []);
const allowedSymlinks = new Set(manifest.allowed_symlinks || []);
const errors = [];
const actualFiles = new Set();
const textExtensions = new Set(["", ".md", ".json", ".mjs", ".js", ".cjs", ".ts", ".tsx", ".py", ".sh", ".css", ".html", ".svg", ".xml", ".yaml", ".yml", ".txt", ".toml", ".csv"]);

const relativeFile = (target) => path.relative(root, target).split(path.sep).join("/");

const insideRoot = (target) => {
  const value = path.relative(root, target);
  return value === "" || (value !== ".." && !value.startsWith(`..${path.sep}`));
};

async function visit(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    const relative = relativeFile(target);
    if (relative === ".git" || relative.startsWith(".git/")) continue;
    if (entry.isSymbolicLink()) {
      actualFiles.add(relative);
      let resolved;
      try { resolved = await fs.realpath(target); } catch (error) { errors.push({ type: "broken-symlink", file: relative, detail: error.message }); continue; }
      if (!insideRoot(resolved)) errors.push({ type: "symlink-escape", file: relative, resolved });
      if (!allowedSymlinks.has(relative)) errors.push({ type: "unallowed-symlink", file: relative });
      continue;
    }
    if (entry.isDirectory()) { await visit(target); continue; }
    if (!entry.isFile()) { errors.push({ type: "unsupported-entry", file: relative }); continue; }
    actualFiles.add(relative);

    const stat = await fs.stat(target);
    if ((stat.mode & 0o111) !== 0 && !allowedExecutables.has(relative)) errors.push({ type: "unallowed-executable", file: relative });
    const extension = path.extname(entry.name).toLowerCase();
    if (!textExtensions.has(extension) && !allowedBinaryExtensions.has(extension)) errors.push({ type: "unallowed-binary", file: relative, extension });
    if (textExtensions.has(extension)) {
      const handle = await fs.open(target, "r");
      const sample = Buffer.alloc(8192);
      const { bytesRead } = await handle.read(sample, 0, sample.length, 0);
      await handle.close();
      if (sample.subarray(0, bytesRead).includes(0) && !allowedBinaryExtensions.has(extension)) errors.push({ type: "binary-content", file: relative });
    }
  }
}

if (!Array.isArray(manifest.files) || !manifest.files.length) errors.push({ type: "missing-file-inventory", detail: "release-manifest.json must declare exact relative files" });
if (allowedFiles.size !== (manifest.files || []).length) errors.push({ type: "duplicate-file-inventory-entry" });
for (const file of allowedFiles) {
  if (!file || path.posix.isAbsolute(file) || /^[A-Za-z]:/.test(file) || file.includes("\\") || path.posix.normalize(file) !== file || file === ".." || file.startsWith("../") || /[*?\[\]{}]/.test(file)) {
    errors.push({ type: "invalid-file-inventory-entry", file });
  }
}

for (const entry of await fs.readdir(root, { withFileTypes: true })) {
  if (!allowedRoots.has(entry.name)) errors.push({ type: "unknown-root-entry", entry: entry.name });
}
await visit(root);
for (const file of actualFiles) {
  if (!allowedFiles.has(file)) errors.push({ type: "unknown-release-file", file });
}
for (const file of allowedFiles) {
  if (!actualFiles.has(file)) errors.push({ type: "missing-release-file", file });
}

const packageDocument = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
const packageFiles = new Set(packageDocument.files || []);
for (const required of ["assets", "brand", "build", "case-library", "docs", "examples", "generators", "mcp-lite", "profiles", "registry", "rules", "scorecards", "scripts", "skills", "templates", "tokens", "tools", "release-check.mjs", "release-manifest.json", "third-party-metadata.json"]) {
  if (!packageFiles.has(required)) errors.push({ type: "package-files-missing", entry: required });
}

console.log(JSON.stringify({ status: errors.length ? "fail" : "pass", checked_at: new Date().toISOString(), root, errors }, null, 2));
if (errors.length) process.exit(1);
