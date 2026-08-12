import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

function option(name, fallback = null) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  if (!args[index + 1]) throw new Error(`${name} requires a value`);
  return args[index + 1];
}

const canonicalRoot = path.resolve(option("--canonical-root", scriptRoot));
const policyPath = path.resolve(canonicalRoot, option("--policy", "registry/oss-sync-policy.json"));
const publicRootValue = option("--public-root");
const publicRoot = publicRootValue ? path.resolve(publicRootValue) : null;
const allowedModes = new Set(["copy", "rewrite", "derivative", "exclude", "public_only"]);

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(dir) {
  if (!(await exists(dir))) return [];
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if ([".DS_Store", ".git", "__pycache__", "node_modules"].includes(entry.name)) continue;
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(target));
    else files.push(target);
  }
  return files;
}

function normalize(relativePath) {
  return relativePath.split(path.sep).join("/").replace(/^\.\//, "");
}

function globRegex(glob) {
  let pattern = "";
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    if (char === "*" && glob[index + 1] === "*") {
      pattern += ".*";
      index += 1;
    } else if (char === "*") {
      pattern += "[^/]*";
    } else if ("\\^$+?.()|{}[]".includes(char)) {
      pattern += `\\${char}`;
    } else {
      pattern += char;
    }
  }
  return new RegExp(`^${pattern}$`);
}

function matches(filePath, glob) {
  return globRegex(glob).test(filePath);
}

function mapDestination(sourcePath, projection) {
  if (!projection.source || !projection.destination) return null;
  if (projection.source.endsWith("/**") && projection.destination.endsWith("/**")) {
    const sourcePrefix = projection.source.slice(0, -3);
    const destinationPrefix = projection.destination.slice(0, -3);
    return `${destinationPrefix}${sourcePath.slice(sourcePrefix.length)}`;
  }
  return projection.destination;
}

function mapSource(destinationPath, projection) {
  if (!projection.source || !projection.destination) return null;
  if (projection.source.endsWith("/**") && projection.destination.endsWith("/**")) {
    const sourcePrefix = projection.source.slice(0, -3);
    const destinationPrefix = projection.destination.slice(0, -3);
    return `${sourcePrefix}${destinationPath.slice(destinationPrefix.length)}`;
  }
  return projection.source;
}

async function sha256(filePath) {
  return crypto.createHash("sha256").update(await fs.readFile(filePath)).digest("hex");
}

function addFinding(collection, id, detail) {
  collection.push({ id, detail });
}

async function main() {
  const policy = await readJson(policyPath);
  const errors = [];
  const warnings = [];
  const checks = [];
  const projections = Array.isArray(policy.projections) ? policy.projections : [];
  const canonicalFiles = (await walkFiles(canonicalRoot)).map((filePath) => normalize(path.relative(canonicalRoot, filePath)));
  const modeCoverage = Object.fromEntries([...allowedModes].map((mode) => [mode, { rules: 0, canonical_files: 0, public_files: 0 }]));

  if (policy.schema_version !== "1.0.0") addFinding(errors, "policy-schema", `Unsupported schema_version=${policy.schema_version}`);
  if (policy.fail_closed !== true) addFinding(errors, "policy-fail-closed", "fail_closed must be true");
  const invalidModes = projections.filter((entry) => !allowedModes.has(entry.mode)).map((entry) => ({ id: entry.id, mode: entry.mode }));
  if (invalidModes.length) addFinding(errors, "projection-modes", invalidModes);
  for (const mode of allowedModes) {
    const count = projections.filter((entry) => entry.mode === mode).length;
    modeCoverage[mode].rules = count;
    if (!count) addFinding(errors, "projection-mode-coverage", `No ${mode} projection is declared`);
  }

  const governedCanonical = canonicalFiles.filter((filePath) => (policy.canonical_scopes || []).some((glob) => matches(filePath, glob)));
  const unknownCanonical = governedCanonical.filter((filePath) => !projections.some((entry) => entry.source && matches(filePath, entry.source)));
  if (unknownCanonical.length) addFinding(errors, "canonical-scope-coverage", unknownCanonical);
  else checks.push({ id: "canonical-scope-coverage", status: "pass", detail: `${governedCanonical.length} governed canonical files are classified` });

  for (const projection of projections) {
    const sourceMatches = projection.source ? canonicalFiles.filter((filePath) => matches(filePath, projection.source)) : [];
    modeCoverage[projection.mode].canonical_files += sourceMatches.length;
    if (Number.isInteger(projection.expected_source_count) && sourceMatches.length !== projection.expected_source_count) {
      addFinding(errors, `source-count:${projection.id}`, `expected=${projection.expected_source_count}; actual=${sourceMatches.length}`);
    }
    if (projection.source && projection.required === true && !sourceMatches.length) {
      addFinding(errors, `source-required:${projection.id}`, projection.source);
    }
  }

  let publicFiles = [];
  if (publicRoot) {
    if (!(await exists(publicRoot))) addFinding(errors, "public-root", `Missing public root: ${publicRoot}`);
    else publicFiles = (await walkFiles(publicRoot)).map((filePath) => normalize(path.relative(publicRoot, filePath)));

    const governedPublic = publicFiles.filter((filePath) => (policy.public_scopes || []).some((glob) => matches(filePath, glob)));
    const isClassifiedPublicFile = (filePath, entry) => {
      if (!entry.destination || !matches(filePath, entry.destination)) return false;
      if (["exclude", "public_only"].includes(entry.mode)) return true;
      const sourcePath = mapSource(filePath, entry);
      return sourcePath !== null && canonicalFiles.includes(sourcePath);
    };
    const unknownPublic = governedPublic.filter((filePath) => !projections.some((entry) => isClassifiedPublicFile(filePath, entry)));
    if (unknownPublic.length) addFinding(errors, "unknown-public-scope-files", unknownPublic);
    else checks.push({ id: "unknown-public-scope-files", status: "pass", detail: `${governedPublic.length} governed public files are classified` });

    for (const projection of projections) {
      const destinationMatches = projection.destination ? publicFiles.filter((filePath) => isClassifiedPublicFile(filePath, projection)) : [];
      modeCoverage[projection.mode].public_files += destinationMatches.length;
      if (projection.mode === "exclude") {
        if (destinationMatches.length) addFinding(errors, `excluded-public-files:${projection.id}`, destinationMatches);
        continue;
      }
      if (projection.mode === "public_only") continue;

      const sourceMatches = canonicalFiles.filter((filePath) => matches(filePath, projection.source));
      for (const sourcePath of sourceMatches) {
        const destinationPath = mapDestination(sourcePath, projection);
        const destinationExists = publicFiles.includes(destinationPath);
        if (projection.required === true && !destinationExists) {
          addFinding(errors, `missing-public-file:${projection.id}`, destinationPath);
          continue;
        }
        if (!destinationExists) continue;
        if (projection.mode === "copy") {
          const sourceDigest = await sha256(path.join(canonicalRoot, sourcePath));
          const publicDigest = await sha256(path.join(publicRoot, destinationPath));
          if (sourceDigest !== publicDigest) addFinding(errors, `copy-drift:${projection.id}`, destinationPath);
        }
        if (projection.mode === "rewrite") {
          const text = await fs.readFile(path.join(publicRoot, destinationPath), "utf8");
          if (/\/(?:Users|home)\/[^/\s]+/.test(text)) addFinding(errors, `rewrite-private-path:${projection.id}`, destinationPath);
        }
      }
      for (const requiredPath of projection.required_destinations || []) {
        if (!publicFiles.includes(requiredPath)) addFinding(errors, `missing-public-file:${projection.id}`, requiredPath);
      }
    }
  } else {
    warnings.push({ id: "public-root-not-provided", detail: "Canonical coverage was checked; target parity requires --public-root <path>." });
  }

  const report = {
    status: errors.length ? "fail" : warnings.length ? "review" : "pass",
    policy: { id: policy.policy_id, schema_version: policy.schema_version, path: normalize(path.relative(canonicalRoot, policyPath)) },
    roots: { canonical: canonicalRoot, public: publicRoot },
    summary: {
      projection_rules: projections.length,
      governed_canonical_files: governedCanonical.length,
      governed_public_files: publicRoot ? publicFiles.filter((filePath) => (policy.public_scopes || []).some((glob) => matches(filePath, glob))).length : null,
      errors: errors.length,
      warnings: warnings.length
    },
    coverage: modeCoverage,
    checks,
    warnings,
    errors
  };
  console.log(JSON.stringify(report, null, 2));
  if (errors.length) process.exit(1);
}

await main();
