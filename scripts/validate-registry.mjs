import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(root, "registry", "design-team.json");
const assetCatalogPath = path.join(root, "registry", "design-assets.json");
const checks = [];
const errors = [];
const warnings = [];

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function record(ok, id, detail) {
  checks.push({ id, status: ok ? "pass" : "fail", detail });
  if (!ok) errors.push({ id, detail });
}

function warn(id, detail) {
  warnings.push({ id, detail });
  checks.push({ id, status: "warning", detail });
}

function resolveLocal(value) {
  if (path.isAbsolute(value)) return value;
  return path.resolve(root, value);
}

async function walkFiles(dir) {
  const result = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if ([".DS_Store", "__pycache__"].includes(entry.name)) continue;
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walkFiles(target));
    else result.push(target);
  }
  return result;
}

async function treeDigest(dir) {
  const hash = crypto.createHash("sha256");
  const files = await walkFiles(dir);
  for (const filePath of files) {
    hash.update(path.relative(dir, filePath));
    hash.update("\0");
    hash.update(await fs.readFile(filePath));
    hash.update("\0");
  }
  return { digest: hash.digest("hex"), files: files.length };
}

function collectAbsolutePaths(value, location = "$") {
  if (typeof value === "string") {
    const macHomePrefix = `${path.sep}Users${path.sep}`;
    return value.startsWith(macHomePrefix) && !value.includes("<") ? [{ location, value }] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectAbsolutePaths(item, `${location}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => collectAbsolutePaths(item, `${location}.${key}`));
  }
  return [];
}

function containsJsonFragment(value, fragment) {
  if (Array.isArray(value)) return value.some((item) => containsJsonFragment(item, fragment));
  if (!value || typeof value !== "object") return false;
  if (value.id === fragment) return true;
  return Object.values(value).some((item) => containsJsonFragment(item, fragment));
}

async function validateOssSkill(ossRoot) {
  const skillPath = path.join(ossRoot, "SKILL.md");
  if (!(await exists(skillPath))) {
    warn("oss-skill-unavailable", `OSS Skill is not available at ${skillPath}`);
    return;
  }
  const skillText = await fs.readFile(skillPath, "utf8");
  const referenceNames = [...skillText.matchAll(/references\/([A-Za-z0-9._-]+\.md)/g)].map((match) => match[1]);
  const missing = [];
  for (const name of new Set(referenceNames)) {
    if (!(await exists(path.join(ossRoot, "references", name)))) missing.push(name);
  }
  record(!missing.length, "oss-reference-closure", missing.length ? `Missing: ${missing.join(", ")}` : `${new Set(referenceNames).size} references resolve`);

  const textFiles = (await walkFiles(ossRoot)).filter((filePath) => [".md", ".yaml", ".yml"].includes(path.extname(filePath)));
  const privatePaths = [];
  for (const filePath of textFiles) {
    const text = await fs.readFile(filePath, "utf8");
    if (/\/Users\/[^/\s]+/.test(text) || /\/home\/[^/\s]+/.test(text)) {
      privatePaths.push(path.relative(ossRoot, filePath));
    }
  }
  record(!privatePaths.length, "oss-path-sanitization", privatePaths.length ? `Private paths in: ${privatePaths.join(", ")}` : "No private absolute paths in OSS Skill text");
}

async function main() {
  const registry = await readJson(registryPath);
  const assets = await readJson(assetCatalogPath);
  const privateCanonical = registry.registry_profile === "private_canonical";

  record(registry.schema_version === "1.0.0", "registry-schema", `schema_version=${registry.schema_version}`);
  record(registry.registry_id === "nero-design-team", "registry-id", `registry_id=${registry.registry_id}`);
  record(registry.authoritative === privateCanonical, "registry-authority", `profile=${registry.registry_profile}; authoritative=${registry.authoritative}`);
  if (privateCanonical) {
    record(registry.authority?.canonical_root === root, "canonical-root", registry.authority?.canonical_root || "missing");
  } else {
    record(registry.authority?.public_package_root === "$NERO_DESIGN_TEAM_HOME", "public-package-root", registry.authority?.public_package_root || "missing");
  }

  for (const [domain, domainPath] of Object.entries(registry.authority?.truth_domains || {})) {
    record(await exists(resolveLocal(domainPath)), `truth-domain:${domain}`, domainPath);
  }

  for (const entry of registry.subregistries || []) {
    const target = resolveLocal(entry.path);
    const present = await exists(target);
    record(present || entry.required !== true, `subregistry:${entry.id}`, entry.path);
    if (present && path.extname(target) === ".json") {
      try {
        await readJson(target);
      } catch (error) {
        record(false, `subregistry-json:${entry.id}`, error.message);
      }
    }
  }

  const declaredPaths = collectAbsolutePaths(registry);
  const missingDeclaredPaths = [];
  for (const item of declaredPaths) {
    if (!(await exists(item.value))) missingDeclaredPaths.push(item);
  }
  record(!missingDeclaredPaths.length, "declared-absolute-paths", missingDeclaredPaths.length ? JSON.stringify(missingDeclaredPaths) : `${declaredPaths.length} paths resolve`);

  record(assets.schema_version === registry.asset_catalog?.schema_version, "asset-schema", `asset=${assets.schema_version}; root=${registry.asset_catalog?.schema_version}`);
  record(assets.authoritative === privateCanonical, "asset-authority", `profile=${assets.registry_profile}; authoritative=${assets.authoritative}`);
  record(privateCanonical ? assets.source_root === root : assets.source_root === "$NERO_DESIGN_TEAM_HOME", "asset-source-root", assets.source_root || "missing");

  const categoryIds = new Set((assets.categories || []).map((category) => category.id));
  const assetIds = new Set();
  const duplicateIds = [];
  const missingSources = [];
  const invalidCategories = [];
  const unsafeSources = [];
  const notBundledSources = [];
  const missingFragments = [];
  for (const asset of assets.assets || []) {
    if (assetIds.has(asset.id)) duplicateIds.push(asset.id);
    assetIds.add(asset.id);
    if (!categoryIds.has(asset.category)) invalidCategories.push({ id: asset.id, category: asset.category });
    const [sourceRef, fragment] = String(asset.source_ref || "").split("#", 2);
    if (!privateCanonical && sourceRef.startsWith("not-bundled-")) {
      notBundledSources.push({ id: asset.id, source_ref: asset.source_ref });
      continue;
    }
    if (!sourceRef || path.isAbsolute(sourceRef) || sourceRef.startsWith("..")) {
      unsafeSources.push({ id: asset.id, source_ref: asset.source_ref });
      continue;
    }
    const sourcePath = path.resolve(root, sourceRef);
    if (!(await exists(sourcePath))) {
      missingSources.push({ id: asset.id, source_ref: asset.source_ref });
      continue;
    }
    if (fragment) {
      if (path.extname(sourcePath) !== ".json") {
        missingFragments.push({ id: asset.id, source_ref: asset.source_ref, reason: "fragment_source_not_json" });
      } else {
        try {
          const sourceDocument = await readJson(sourcePath);
          if (!containsJsonFragment(sourceDocument, fragment)) {
            missingFragments.push({ id: asset.id, source_ref: asset.source_ref, reason: "fragment_not_found" });
          }
        } catch (error) {
          missingFragments.push({ id: asset.id, source_ref: asset.source_ref, reason: `json_parse_error: ${error.message}` });
        }
      }
    }
  }
  record(!duplicateIds.length, "asset-id-uniqueness", duplicateIds.length ? duplicateIds.join(", ") : `${assetIds.size} unique ids`);
  record(!invalidCategories.length, "asset-categories", invalidCategories.length ? JSON.stringify(invalidCategories) : `${categoryIds.size} categories resolve`);
  record(!unsafeSources.length, "asset-source-boundary", unsafeSources.length ? JSON.stringify(unsafeSources) : "All source_ref values are relative and contained");
  record(!missingSources.length, "asset-source-coverage", missingSources.length ? JSON.stringify(missingSources) : `${assetIds.size - notBundledSources.length} bundled source_ref values resolve; ${notBundledSources.length} explicitly not bundled`);
  record(!missingFragments.length, "asset-fragment-closure", missingFragments.length ? JSON.stringify(missingFragments) : "All JSON fragment source_ref values resolve");

  const missingRecipeAssets = [];
  for (const recipe of assets.recipes || []) {
    for (const assetId of recipe.asset_ids || []) {
      if (!assetIds.has(assetId)) missingRecipeAssets.push({ recipe: recipe.id, asset_id: assetId });
    }
  }
  record(!missingRecipeAssets.length, "recipe-asset-closure", missingRecipeAssets.length ? JSON.stringify(missingRecipeAssets) : `${(assets.recipes || []).length} recipes reference bundled assets only`);

  const issueSources = new Set((assets.integrity_issues || []).filter((issue) => issue.status === "open").map((issue) => issue.source_ref));
  const brandProfile = await readJson(path.join(root, "brand", "brand-profile.json"));
  const brandMark = brandProfile.brand_assets?.mark;
  if (brandMark && await exists(brandMark)) {
    const markText = await fs.readFile(brandMark, "utf8");
    const placeholderIsExplicit = /NERO Design Team placeholder mark/i.test(markText);
    record(placeholderIsExplicit, "brand-mark-integrity", placeholderIsExplicit ? "Public placeholder identity is explicit" : "Public brand mark must declare its placeholder identity");
  }

  const canonicalSkill = privateCanonical ? registry.skill_distribution?.canonical : path.join(root, "skills", "nero-design-team");
  const runtimeSkill = registry.skill_distribution?.runtime;
  if (privateCanonical && canonicalSkill && runtimeSkill && await exists(canonicalSkill) && await exists(runtimeSkill)) {
    const canonical = await treeDigest(canonicalSkill);
    const runtime = await treeDigest(runtimeSkill);
    record(canonical.digest === runtime.digest, "skill-runtime-parity", `canonical=${canonical.digest}; runtime=${runtime.digest}; files=${canonical.files}/${runtime.files}`);
  } else if (!privateCanonical) {
    record(await exists(canonicalSkill), "public-skill-package", canonicalSkill);
  } else {
    record(false, "skill-runtime-parity", "Canonical or runtime Skill tree is unavailable");
  }

  if (registry.global_trigger_route?.source && await exists(registry.global_trigger_route.source)) {
    const globalRules = await fs.readFile(registry.global_trigger_route.source, "utf8");
    record(globalRules.includes(registry.global_trigger_route.source_section), "global-trigger-source", registry.global_trigger_route.source_section);
  } else {
    warn("global-trigger-source", "Global rule source is unavailable in this environment");
  }

  await validateOssSkill(privateCanonical ? registry.skill_distribution?.oss : canonicalSkill);

  if (privateCanonical) {
    const ossProjectRoot = path.resolve(registry.skill_distribution.oss, "..", "..");
    const ossValidator = path.join(ossProjectRoot, "scripts", "validate-registry.mjs");
    if (await exists(ossValidator)) {
      const result = spawnSync(process.execPath, [ossValidator], { cwd: ossProjectRoot, encoding: "utf8" });
      record(result.status === 0, "oss-registry-contract", result.status === 0 ? "Public derivative Registry validates" : result.stderr.trim() || result.stdout.trim());
    } else {
      warn("oss-registry-contract", `OSS Registry validator is unavailable at ${ossValidator}`);
    }
  }

  record(true, "private-export-determinism", "Not applicable to the public derivative");

  const report = {
    status: errors.length ? "fail" : warnings.length ? "review" : "pass",
    checked_at: new Date().toISOString(),
    registry: { id: registry.registry_id, version: registry.version, profile: registry.registry_profile },
    summary: { checks: checks.length, passed: checks.filter((item) => item.status === "pass").length, warnings: warnings.length, errors: errors.length, assets: assetIds.size, not_bundled_assets: notBundledSources.length, open_integrity_issues: issueSources.size },
    checks,
    warnings,
    errors
  };
  console.log(JSON.stringify(report, null, 2));
  if (errors.length) process.exit(1);
}

await main();
