import { readTaxonomy, dimensionLabels, sourceIdentity, validateAssetMetadata, validateAssetSources, referenceRecords } from './asset-library.mjs';
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { planSkillSync } from './sync-skill.mjs';

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

function isContained(basePath, targetPath) {
  const relativePath = path.relative(basePath, targetPath);
  return relativePath === "" || (
    relativePath !== ".." &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

function containsParentTraversal(value) {
  return String(value).replaceAll("\\", "/").split("/").includes("..");
}

function resolveContained(basePath, value) {
  const reference = String(value || "");
  if (!reference || path.isAbsolute(reference) || path.win32.isAbsolute(reference) || containsParentTraversal(reference)) return null;
  const resolved = path.resolve(basePath, reference);
  return isContained(basePath, resolved) ? resolved : null;
}

function isInsideRoot(filePath) {
  return isContained(root, filePath);
}

async function resolveExistingReference(candidate) {
  const attempts = [candidate];
  if (!path.extname(candidate)) {
    for (const extension of [".md", ".json", ".mjs", ".js", ".ts", ".tsx", ".css", ".html", ".py", ".svg"]) {
      attempts.push(`${candidate}${extension}`);
    }
    for (const indexName of ["index.md", "index.json", "index.mjs", "index.js", "index.ts", "index.tsx", "index.html"]) {
      attempts.push(path.join(candidate, indexName));
    }
  }
  for (const attempt of attempts) {
    if (isInsideRoot(attempt) && await exists(attempt)) return attempt;
  }
  return null;
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

function collectNdtAssetReferences(value, location = "$") {
  if (typeof value === "string") {
    return /^NDT-[A-Z]+-[0-9]{3}$/.test(value) ? [{ id: value, location }] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectNdtAssetReferences(item, `${location}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => collectNdtAssetReferences(item, `${location}.${key}`));
  }
  return [];
}

async function validateEmbeddedAssetReferenceClosure(assetIds) {
  const roots = [
    path.join(root, "assets", "style-references"),
    path.join(root, "assets", "reference-metadata"),
    path.join(root, "case-library", "public-contracts"),
    path.join(root, "case-library", "snapshots", "public-metadata.json")
  ];
  const jsonFiles = [];
  for (const target of roots) {
    if (!(await exists(target))) continue;
    const stat = await fs.stat(target);
    if (stat.isDirectory()) jsonFiles.push(...(await walkFiles(target)).filter((filePath) => path.extname(filePath) === ".json"));
    else if (path.extname(target) === ".json") jsonFiles.push(target);
  }
  const missing = [];
  let references = 0;
  for (const filePath of new Set(jsonFiles)) {
    const document = await readJson(filePath);
    for (const reference of collectNdtAssetReferences(document)) {
      references += 1;
      if (!assetIds.has(reference.id)) missing.push({ file: path.relative(root, filePath), ...reference });
    }
  }
  record(!missing.length, "embedded-asset-id-closure", missing.length ? JSON.stringify(missing) : `${references} embedded NDT asset-id references resolve`);
}

function isNotBundledReference(value) {
  return /(^|[/:])not-bundled(?:-|\/|:)/i.test(value);
}

function normalizeReferenceToken(value) {
  return String(value)
    .trim()
    .replace(/^[('"`]+|[)'"`,.;:]+$/g, "")
    .replace(/#.*$/, "");
}

function looksLikeLocalReference(value) {
  if (!value || /[<>*{}\[\]]/.test(value)) return false;
  if (/^(?:https?:|mailto:|data:|npm:|node:|#)/i.test(value)) return false;
  if (isNotBundledReference(value)) return false;
  if (/^\$[A-Z0-9_]+(?:\/|$)/.test(value) && !value.startsWith("$NERO_DESIGN_TEAM_HOME/")) return false;
  if (/^\//.test(value)) return false;
  if (/\s/.test(value)) return false;
  if (/^@[A-Za-z0-9_.-]+\//.test(value)) return false;
  if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value) && !value.startsWith("./") && !value.startsWith("../")) {
    const first = value.split("/", 1)[0];
    if (!new Set(["assets", "brand", "build", "case-library", "docs", "examples", "generators", "mcp-lite", "profiles", "registry", "rules", "scorecards", "scripts", "skills", "templates", "tokens", "tools", "references"]).has(first)) return false;
  }
  return value.startsWith("./") || value.startsWith("../") || value.startsWith("$NERO_DESIGN_TEAM_HOME/") || value.startsWith("references/") || /\/[A-Za-z0-9_.-]+\.(?:md|json|mjs|js|ts|tsx|css|html|py|svg|xml|sh|yaml|yml)$/.test(value);
}

function extractRecognizableReferences(filePath, text) {
  const references = new Set();
  const add = (raw) => {
    const value = normalizeReferenceToken(raw);
    if (looksLikeLocalReference(value)) references.add(value);
  };
  const addExplicit = (raw) => {
    const value = normalizeReferenceToken(raw);
    if (!value || isNotBundledReference(value) || /^(?:https?:|mailto:|data:|npm:|node:|#)/i.test(value)) return;
    if (/^\$[A-Z0-9_]+(?:\/|$)/.test(value) && !value.startsWith("$NERO_DESIGN_TEAM_HOME/")) return;
    if (/\s|[<>*{}\[\]]/.test(value)) return;
    references.add(value);
  };
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".md") {
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) add(match[1]);
    for (const match of text.matchAll(/`([^`\n]+)`/g)) {
      for (const token of match[1].split(/\s+/)) add(token);
    }
  }
  if ([".js", ".mjs", ".ts", ".tsx"].includes(extension)) {
    for (const match of text.matchAll(/(?:from\s+|import\s*\(|require\s*\()\s*["']([^"']+)["']/g)) add(match[1]);
  }
  if ([".css", ".html", ".svg", ".xml"].includes(extension)) {
    for (const match of text.matchAll(/(?:url\(|(?:src|href)=)["']?([^"')\s>]+)/gi)) add(match[1]);
  }
  if (extension === ".json") {
    try {
      const document = JSON.parse(text);
      const visit = (value, key = "", parent = null) => {
        const isExplicitPathField = /(?:^|_)(?:path|file|source_ref|style_contract|scorecard)$/i.test(key);
        const isRootedReference = typeof value === "string" && (value.startsWith("$NERO_DESIGN_TEAM_HOME/") || /^(?:\.\.?\/|assets\/|brand\/|build\/|case-library\/|docs\/|examples\/|generators\/|mcp-lite\/|profiles\/|registry\/|rules\/|scorecards\/|scripts\/|skills\/|templates\/|tokens\/|tools\/)/.test(value));
        const projectLocalArgument = parent && typeof parent === "object" && "project_root" in parent && ["spec_path", "output_path", "receipt_path"].includes(key);
        if (typeof value === "string" && isExplicitPathField && !projectLocalArgument) addExplicit(value);
        else if (typeof value === "string" && isRootedReference) add(value);
        else if (Array.isArray(value)) value.forEach((item) => visit(item, key, value));
        else if (value && typeof value === "object") Object.entries(value).forEach(([childKey, item]) => visit(item, childKey, value));
      };
      visit(document);
    } catch {
      // JSON parse failures are reported by the subregistry and release gates.
    }
  }
  return [...references];
}

async function validateLocalReferenceClosure({ allowPrivateOverlayReferences = false } = {}) {
  const allFiles = await walkFiles(root);
  const filesByBasename = new Map();
  for (const filePath of allFiles) {
    const basename = path.basename(filePath);
    if (!filesByBasename.has(basename)) filesByBasename.set(basename, []);
    filesByBasename.get(basename).push(filePath);
  }
  const candidates = allFiles.filter((filePath) => {
    const relativePath = path.relative(root, filePath);
    const extension = path.extname(filePath).toLowerCase();
    if (relativePath === path.join("frontend", "public-projection.json")) return false;
    if (relativePath === path.join("frontend", "public", "demo", "snapshot.json")) return false;
    if (relativePath.startsWith(`case-library${path.sep}snapshots${path.sep}`) && path.basename(filePath) !== "snapshot.json") return false;
    return extension === ".md" || extension === ".json" || (relativePath.startsWith(`templates${path.sep}`) && [".mjs", ".js", ".ts", ".tsx", ".css", ".html", ".svg", ".xml"].includes(extension));
  });
  const missing = [];
  let recognized = 0;
  for (const filePath of candidates) {
    const text = await fs.readFile(filePath, "utf8");
    for (const reference of extractRecognizableReferences(filePath, text)) {
      recognized += 1;
      if (allowPrivateOverlayReferences && (reference.startsWith("case-library/assets/") || reference.startsWith("assets/private/"))) continue;
      if (reference.startsWith(".nero-design/")) continue;
      let target;
      if (reference.startsWith("$NERO_DESIGN_TEAM_HOME/")) {
        target = path.resolve(root, reference.slice("$NERO_DESIGN_TEAM_HOME/".length));
      } else if (reference.startsWith("references/") && path.relative(root, filePath).startsWith(`skills${path.sep}nero-design-team${path.sep}`)) {
        target = path.resolve(root, "skills", "nero-design-team", reference);
      } else if (/^(?:assets|brand|build|case-library|docs|examples|generators|mcp-lite|profiles|registry|rules|scorecards|scripts|skills|templates|tokens|tools)\//.test(reference)) {
        target = path.resolve(root, reference);
      } else {
        target = path.resolve(path.dirname(filePath), reference);
      }
      let resolved = isInsideRoot(target) ? await resolveExistingReference(target) : null;
      if (!resolved && !reference.includes("/")) {
        const matches = filesByBasename.get(reference) || [];
        if (matches.length === 1) resolved = matches[0];
        if (matches.length > 1) continue;
      }
      if (!resolved) {
        missing.push({ file: path.relative(root, filePath), reference });
      }
    }
  }
  record(!missing.length, "local-reference-closure", missing.length ? JSON.stringify(missing) : `${recognized} recognizable Markdown, JSON, and template references resolve`);
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
  const taxonomy = await readTaxonomy(root);
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
  record(assets.taxonomy_version === taxonomy.version && JSON.stringify(assets.tag_dimensions) === JSON.stringify(dimensionLabels(taxonomy)), 'asset-taxonomy-version', `catalog=${assets.taxonomy_version}; taxonomy=${taxonomy.version}`);
  const invalidTags = (assets.assets || []).flatMap(asset => validateAssetMetadata(asset, taxonomy, assets.categories || []).map(field => ({ id: asset.id, field })));
  record(!invalidTags.length, 'asset-ten-dimension-contract', invalidTags.length ? JSON.stringify(invalidTags) : `${assets.assets.length} assets have ten valid dimensions, visual labels, separate use cases and classification evidence`);
  const seenSources = new Set();
  const repeatedSources = (assets.assets || []).filter(asset => {
    if (String(asset.source_ref).startsWith('not-bundled-')) return false;
    const identity = sourceIdentity(asset);
    if (seenSources.has(identity)) return true;
    seenSources.add(identity); return false;
  }).map(asset => asset.id);
  record(!repeatedSources.length, 'asset-source-scope-uniqueness', repeatedSources.length ? repeatedSources.join(', ') : 'No identical source and member scopes');
  const assetIds = new Set();
  const activeIds = new Set(assets.assets.map(asset => asset.id));
  const duplicateIds = [];
  const missingSources = [];
  const invalidCategories = [];
  const unsafeSources = [];
  const notBundledSources = [];
  const missingFragments = [];
  const missingMembers = [];
  const unsafeMembers = [];
  for (const asset of referenceRecords(assets)) {
    if (assetIds.has(asset.id)) duplicateIds.push(asset.id);
    assetIds.add(asset.id);
    if (activeIds.has(asset.id) && !categoryIds.has(asset.category)) invalidCategories.push({ id: asset.id, category: asset.category });
    const [sourceRef, fragment] = String(asset.source_ref || "").split("#", 2);
    if (!privateCanonical && sourceRef.startsWith("not-bundled-")) {
      notBundledSources.push({ id: asset.id, source_ref: asset.source_ref });
      continue;
    }
    const sourcePath = resolveContained(root, sourceRef);
    if (!sourcePath) {
      unsafeSources.push({ id: asset.id, source_ref: asset.source_ref });
      continue;
    }
    if (!(await exists(sourcePath))) {
      missingSources.push({ id: asset.id, source_ref: asset.source_ref });
      continue;
    }
    const sourceRealPath = await fs.realpath(sourcePath);
    if (!isContained(root, sourceRealPath)) {
      unsafeSources.push({ id: asset.id, source_ref: asset.source_ref, reason: "symlink_escape" });
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
    if (Array.isArray(asset.members)) {
      const sourceStat = await fs.stat(sourceRealPath);
      const memberBase = sourceStat.isDirectory() ? sourceRealPath : path.dirname(sourceRealPath);
      for (const member of asset.members) {
        const memberPath = resolveContained(memberBase, member);
        if (!memberPath) {
          unsafeMembers.push({ id: asset.id, source_ref: asset.source_ref, member });
          continue;
        }
        if (!(await exists(memberPath))) {
          missingMembers.push({ id: asset.id, source_ref: asset.source_ref, member, resolved: path.relative(root, memberPath) });
          continue;
        }
        const memberRealPath = await fs.realpath(memberPath);
        if (!isContained(memberBase, memberRealPath)) {
          unsafeMembers.push({ id: asset.id, source_ref: asset.source_ref, member, reason: "symlink_escape" });
        }
      }
    }
  }
  const invalidStates = (assets.assets || []).filter((asset) =>
    !["registered", "reference", "candidate", "unknown"].includes(asset.maturity) ||
    !["reusable", "conditional", "reference_only", "placeholder", "quarantined", "unknown"].includes(asset.reuse_state)
  ).map((asset) => asset.id);
  record(!invalidStates.length, "asset-state-contract", invalidStates.length ? invalidStates.join(", ") : "Maturity and reuse state are explicit; neither implies acceptance");
  record(!duplicateIds.length, "asset-id-uniqueness", duplicateIds.length ? duplicateIds.join(", ") : `${assetIds.size} unique ids`);
  record(!invalidCategories.length, "asset-categories", invalidCategories.length ? JSON.stringify(invalidCategories) : `${categoryIds.size} categories resolve`);
  record(!unsafeSources.length, "asset-source-boundary", unsafeSources.length ? JSON.stringify(unsafeSources) : "All source_ref values are relative and contained");
  record(!missingSources.length, "asset-source-coverage", missingSources.length ? JSON.stringify(missingSources) : `${assetIds.size - notBundledSources.length} bundled source_ref values resolve; ${notBundledSources.length} explicitly not bundled`);
  record(!missingFragments.length, "asset-fragment-closure", missingFragments.length ? JSON.stringify(missingFragments) : "All JSON fragment source_ref values resolve");
  record(!unsafeMembers.length, "asset-member-boundary", unsafeMembers.length ? JSON.stringify(unsafeMembers) : "All asset members are relative and contained by their source directory or file parent");
  record(!missingMembers.length, "asset-member-closure", missingMembers.length ? JSON.stringify(missingMembers) : "Directory source_ref members resolve from the directory; file source_ref members resolve from its parent");

  const invalidRecipeReferences = [];
  for (const recipe of assets.recipes || []) {
    for (const [field, records] of [['asset_ids', assets.assets], ['case_ids', assets.cases || []], ['resource_ids', assets.supporting_resources || []]]) {
      for (const id of recipe[field] || []) if (!records.some(item => item.id === id)) invalidRecipeReferences.push({recipe: recipe.id, field, id});
    }
  }
  record(!invalidRecipeReferences.length, 'recipe-asset-closure', invalidRecipeReferences.length ? JSON.stringify(invalidRecipeReferences) : 'All typed recipe references resolve');
  const previewErrors = [];
  for (const asset of assets.assets) { try { await validateAssetSources(root, asset); } catch (error) { previewErrors.push({id: asset.id, error: error.message}); } }
  record(!previewErrors.length, 'asset-real-preview-coverage', previewErrors.length ? JSON.stringify(previewErrors) : 'Every active public asset has a real source preview');
  await validateEmbeddedAssetReferenceClosure(assetIds);

  const issueSources = new Set((assets.integrity_issues || []).filter((issue) => issue.status === "open").map((issue) => issue.source_ref));
  const brandProfile = await readJson(path.join(root, "brand", "brand-profile.json"));
  const brandMark = brandProfile.brand_assets?.mark;
  if (brandMark && await exists(brandMark)) {
    const markText = await fs.readFile(brandMark, "utf8");
    const placeholderIsExplicit = /NERO Design Team placeholder mark/i.test(markText);
    record(placeholderIsExplicit, "brand-mark-integrity", placeholderIsExplicit ? "Public placeholder identity is explicit" : "Public brand mark must declare its placeholder identity");
  }

  const canonicalSkill = privateCanonical ? registry.skill_distribution?.canonical : path.join(root, "skills", "nero-design-team");
  try {
    const ruleChanges = await planSkillSync(root);
    record(ruleChanges.length === 0, "skill-rule-view-parity", ruleChanges.length
      ? ruleChanges.map(item => path.relative(root, item.destination)).join(", ")
      : "Compatibility rule files match the authored Skill references");
  } catch (error) { record(false, "skill-rule-view-parity", error.message); }
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

  const sourceArg = process.argv.indexOf("--global-rules");
  const trigger = { ...registry.global_trigger_route };
  if (sourceArg >= 0) trigger.source = process.argv[sourceArg + 1];
  const triggerCheck = await validateGlobalTrigger(trigger);
  if (!privateCanonical && triggerCheck.unavailable) warn("global-trigger-source", triggerCheck.detail);
  else record(triggerCheck.ok, "global-trigger-source", triggerCheck.detail);

  await validateOssSkill(privateCanonical ? registry.skill_distribution?.oss : canonicalSkill);
  await validateLocalReferenceClosure({ allowPrivateOverlayReferences: !privateCanonical });

  if (privateCanonical) {
    const ossProjectRoot = path.resolve(registry.skill_distribution.oss, "..", "..");
    const ossValidator = path.join(ossProjectRoot, "scripts", "validate-registry.mjs");
    const projection = spawnSync(process.execPath, [path.join(root, "scripts", "check-oss-projection.mjs"), "--public-root", ossProjectRoot], { cwd: root, encoding: "utf8" });
    record(projection.status === 0, "oss-projection-closure", projection.status === 0 ? "Canonical-to-public projection is complete" : projection.stderr.trim() || projection.stdout.trim());
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
    summary: { checks: checks.length, passed: checks.filter((item) => item.status === "pass").length, warnings: warnings.length, errors: errors.length, assets: activeIds.size, not_bundled_assets: notBundledSources.length, open_integrity_issues: issueSources.size },
    checks,
    warnings,
    errors
  };
  console.log(JSON.stringify(report, null, 2));
  if (errors.length) process.exit(1);
}

function runPathBoundarySelfTest() {
  const fixtureRoot = path.resolve(path.sep, "tmp", "ndt-validator-fixture");
  const memberBase = path.join(fixtureRoot, "rules");
  const cases = [
    {
      id: "source-parent-traversal",
      pass: resolveContained(fixtureRoot, "foo/../../../etc/passwd") === null
    },
    {
      id: "member-parent-traversal",
      pass: resolveContained(memberBase, "../rules/x.md") === null
    },
    {
      id: "source-contained-control",
      pass: resolveContained(fixtureRoot, "rules/frontend-ui.md") === path.join(fixtureRoot, "rules", "frontend-ui.md")
    },
    {
      id: "member-contained-control",
      pass: resolveContained(memberBase, "frontend-ui.md") === path.join(memberBase, "frontend-ui.md")
    }
  ];
  const failures = cases.filter((item) => !item.pass);
  console.log(JSON.stringify({ status: failures.length ? "fail" : "pass", cases }, null, 2));
  if (failures.length) process.exit(1);
}

export async function validateGlobalTrigger(trigger) {
  if (!trigger?.source || !(await exists(trigger.source))) return { ok: false, unavailable: true, detail: "Global rule source is unavailable" };
  const globalRules = await fs.readFile(trigger.source, "utf8");
  const skillId = trigger.source_skill_id || "nero-design-team";
  const escapedId = skillId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const idPattern = new RegExp(`(^|[^a-zA-Z0-9_-])${escapedId}(?=$|[^a-zA-Z0-9_-])`);
  const activeLine = globalRules.split("\n").some((line) => idPattern.test(line) && /视觉|设计|visual|design/i.test(line.replaceAll(skillId, "")) && !/禁止使用|不再使用|do not use|disabled/i.test(line));
  const targetPresent = Boolean(trigger.target_skill && await exists(trigger.target_skill));
  const targetText = targetPresent ? await fs.readFile(trigger.target_skill, "utf8") : "";
  return { ok: activeLine && targetPresent && new RegExp(`^name:\\s*["']?${escapedId}["']?\\s*$`, "m").test(targetText), detail: `skill=${skillId}; directive=${activeLine}; target=${targetPresent}` };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--self-test-path-boundaries")) runPathBoundarySelfTest();
  else await main();
}
