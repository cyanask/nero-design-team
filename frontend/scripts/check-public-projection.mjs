import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  if (!args[index + 1]) throw new Error(`${flag} requires a directory`);
  return args[index + 1];
};
const packageRoot = await fs.realpath(path.resolve(valueAfter("--package-root") || path.join(frontendRoot, "..")));
const sourceValue = valueAfter("--source-root");
const sourceRoot = sourceValue ? await fs.realpath(path.resolve(sourceValue)) : null;
const policy = JSON.parse(await fs.readFile(path.join(frontendRoot, "public-projection.json"), "utf8"));
const errors = [];
const ignoredDirectories = new Set([".git", ".playwright-cli", "node_modules", ".local", "dist-public", "dist-demo", "coverage"]);

const posix = (value) => value.split(path.sep).join("/");
async function filesUnder(root, relative = "") {
  const output = [];
  for (const entry of await fs.readdir(path.join(root, relative), { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const file = posix(path.join(relative, entry.name));
    if (entry.isDirectory()) output.push(...await filesUnder(root, file));
    else if (entry.isFile()) output.push(file);
    else errors.push({ type: "unsupported-entry", file });
  }
  return output.sort();
}

const copied = new Set(policy.copiedFiles || []);
const rewritten = new Set(policy.rewrittenFiles || []);
const publicOnly = new Set(policy.publicOnlyFiles || []);
const governed = new Set([...copied, ...rewritten, ...publicOnly]);
const publicFiles = await filesUnder(frontendRoot);

for (const file of publicFiles) if (!governed.has(file)) errors.push({ type: "unclassified-public-file", file });
for (const file of governed) if (!publicFiles.includes(file)) errors.push({ type: "missing-public-file", file });
if (governed.size !== copied.size + rewritten.size + publicOnly.size) {
  errors.push({ type: "duplicate-projection-classification" });
}

const fragments = [
  ["/", "Users", "/"].join(""),
  ["/", "home", "/"].join(""),
  ["/", "private", "/", "tmp", "/"].join("")
];
const scopedFragments = [
  ["nero-design-team", "-frontend"].join(""),
  ["private", "_canonical"].join("")
];
for (const file of publicFiles) {
  if (file === "scripts/check-public-projection.mjs") continue;
  if (!["", ".css", ".html", ".js", ".json", ".md", ".mjs", ".mts", ".svg", ".ts", ".tsx", ".txt", ".yaml", ".yml"].includes(path.extname(file).toLowerCase())) continue;
  const text = await fs.readFile(path.join(frontendRoot, file), "utf8");
  for (const fragment of [...fragments, ...scopedFragments]) {
    if (text.includes(fragment)) errors.push({ type: "forbidden-public-fragment", file, fragment });
  }
}

const designRegistry = JSON.parse(await fs.readFile(path.join(packageRoot, "registry/design-team.json"), "utf8"));
const assetRegistry = JSON.parse(await fs.readFile(path.join(packageRoot, "registry/design-assets.json"), "utf8"));
if (designRegistry.registry_profile !== "public_derivative" || designRegistry.authoritative !== false) {
  errors.push({ type: "invalid-public-registry-profile", file: "registry/design-team.json" });
}
if (assetRegistry.registry_profile !== "public_derivative" || assetRegistry.authoritative !== false) {
  errors.push({ type: "invalid-public-registry-profile", file: "registry/design-assets.json" });
}
const scenarioSource = await fs.readFile(path.join(frontendRoot, "src/packs/ndt/application-scenarios.ts"), "utf8");
const scenarioAssets = [...scenarioSource.matchAll(/representativeAssetId: "([^"]+)"/g)].map((match) => match[1]);
const scenarioRecipes = [...scenarioSource.matchAll(/recipeId: "([^"]+)"/g)].map((match) => match[1]);
const assetIds = new Set((assetRegistry.assets || []).map((asset) => asset.id));
const catalogIds = new Set([
  ...(assetRegistry.assets || []),
  ...(assetRegistry.cases || []),
  ...(assetRegistry.supporting_resources || [])
].map((item) => item.id));
const recipeIds = new Set((assetRegistry.recipes || []).map((recipe) => recipe.id));
for (const id of scenarioAssets) if (!catalogIds.has(id)) errors.push({ type: "unknown-scenario-catalog-id", id });
for (const id of scenarioRecipes) if (!recipeIds.has(id)) errors.push({ type: "unknown-scenario-recipe", id });

if (sourceRoot) {
  const sourcePackage = JSON.parse(await fs.readFile(path.join(sourceRoot, "package.json"), "utf8"));
  if (policy.sourceBaseline?.version && sourcePackage.version !== policy.sourceBaseline.version) {
    errors.push({ type: "source-baseline-version-drift", expected: policy.sourceBaseline.version, actual: sourcePackage.version });
  }
  const sourceFiles = await filesUnder(sourceRoot);
  const excluded = (file) => (policy.excludedPrefixes || []).some((prefix) => file === prefix || file.startsWith(prefix));
  for (const file of sourceFiles) {
    if (!copied.has(file) && !rewritten.has(file) && !excluded(file)) {
      errors.push({ type: "unclassified-source-file", file });
    }
  }
  for (const file of copied) {
    try {
      const [source, projected] = await Promise.all([
        fs.readFile(path.join(sourceRoot, file)),
        fs.readFile(path.join(frontendRoot, file))
      ]);
      if (!source.equals(projected)) errors.push({ type: "copied-file-drift", file });
    } catch (error) {
      errors.push({ type: "missing-copied-source", file, detail: error.message });
    }
  }
  for (const file of rewritten) {
    try { await fs.stat(path.join(sourceRoot, file)); }
    catch { errors.push({ type: "missing-rewrite-source", file }); }
  }
}

const report = {
  status: errors.length ? "fail" : "pass",
  frontendRoot,
  packageRoot,
  sourceChecked: Boolean(sourceRoot),
  counts: {
    publicFiles: publicFiles.length,
    copied: copied.size,
    rewritten: rewritten.size,
    publicOnly: publicOnly.size,
    registryAssets: assetIds.size,
    registryRecipes: recipeIds.size
  },
  errors
};
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exit(1);
