import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import { validateWorkbenchSnapshot } from "../../src/core/snapshot-guard.mjs";

export const adapterVersion = "0.1.0";
export const maxJsonBytes = 2 * 1024 * 1024;
export const maxArtifactDepth = 4;
export const maxArtifactDirs = 256;
export const maxArtifactFiles = 2000;
export const artifactExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".pdf",
  ".pptx",
  ".docx",
  ".xlsx",
  ".html",
  ".mp4",
  ".mov",
  ".webm",
  ".json",
  ".md",
  ".txt",
  ".csv"
]);
export const tokenFiles = [
  "colors.json",
  "typography.json",
  "spacing.json",
  "radius.json",
  "shadow.json",
  "motion.json",
  "chart.json"
];
export const aliasPattern = /^[a-z0-9][a-z0-9_-]{1,63}$/;
export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

let schemaValidator;

export const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
export const posix = (value) => value.split(path.sep).join("/");
export const asText = (value, fallback = "") => {
  if (typeof value === "string") return value;
  if (isRecord(value)) {
    for (const key of ["zh", "zh_cn", "name", "label", "en"]) {
      if (typeof value[key] === "string") return value[key];
    }
  }
  return fallback;
};
export const asNullableText = (value) => (typeof value === "string" ? value : null);
export const asTextList = (value) =>
  Array.isArray(value)
    ? value.filter((item) => typeof item === "string")
    : typeof value === "string"
      ? [value]
      : [];

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function sortForStableJson(value) {
  if (Array.isArray(value)) return value.map(sortForStableJson);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortForStableJson(value[key])])
  );
}

export function stableStringify(value) {
  return JSON.stringify(sortForStableJson(value));
}

export function within(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function resolvePackageReference(root, reference) {
  const marker = "$NERO_DESIGN_TEAM_HOME";
  if (reference === marker) return root;
  if (reference.startsWith(marker + "/")) {
    return path.join(root, reference.slice(marker.length + 1));
  }
  return reference;
}

export function safeRelative(root, candidate) {
  const resolved = path.resolve(resolvePackageReference(root, candidate));
  if (!within(root, resolved)) throw new Error("PATH_OUTSIDE_ALLOWED_ROOT");
  return posix(path.relative(root, resolved));
}

export function safeFact(value) {
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value !== "string") return null;
  if (value.startsWith("/") || value.includes("\\")) return null;
  return value.length > 1000 ? value.slice(0, 1000) : value;
}

export function flattenFacts(value, prefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenFacts(item, prefix + "/" + index));
  }
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, nested]) =>
      flattenFacts(nested, prefix + "/" + key.replaceAll("~", "~0").replaceAll("/", "~1"))
    );
  }
  const safe = safeFact(value);
  return safe === null && value !== null ? [] : [{ key: prefix || "/", value: safe }];
}

export async function readJson(filePath, maxBytes = maxJsonBytes) {
  const stat = await fs.stat(filePath);
  if (stat.size > maxBytes) throw new Error("SOURCE_TOO_LARGE");
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

export async function validateSnapshotSchema(snapshot) {
  if (!schemaValidator) {
    const schema = await readJson(
      path.join(repositoryRoot, "schemas", "workbench-snapshot-v1.schema.json")
    );
    schemaValidator = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
  }
  const valid = schemaValidator(snapshot);
  return valid
    ? []
    : (schemaValidator.errors || []).map((error) =>
        (error.instancePath || "$") + " " + error.message
      );
}

export async function readPackageJson(root, reference) {
  const portable = resolvePackageReference(root, reference);
  const candidate = path.isAbsolute(portable) ? portable : path.resolve(root, portable);
  const real = await fs.realpath(candidate);
  if (!within(root, real)) throw new Error("PATH_OUTSIDE_ALLOWED_ROOT");
  return { data: await readJson(real), path: real, relative: safeRelative(root, real) };
}

export function parseProjectSpec(value) {
  const separator = value.indexOf("=");
  if (separator <= 0 || separator === value.length - 1) {
    throw new Error("Project must use alias=/absolute/path");
  }
  const alias = value.slice(0, separator);
  const root = value.slice(separator + 1);
  if (!aliasPattern.test(alias)) throw new Error("Invalid project alias: " + alias);
  if (!path.isAbsolute(root)) throw new Error("Project root must be absolute for alias: " + alias);
  return { alias, root };
}

export function mergeProjectSpecs(...specLists) {
  const projects = specLists.flat();
  const aliases = new Set();
  for (const project of projects) {
    if (aliases.has(project.alias)) throw new Error("Duplicate project alias: " + project.alias);
    aliases.add(project.alias);
  }
  return projects;
}

export function parseProjectsFilePath(value) {
  if (!value || !path.isAbsolute(value)) {
    throw new Error("Projects file must be an absolute JSON path");
  }
  return path.resolve(value);
}

export async function readProjectsFile(filePath) {
  const payload = await readJson(parseProjectsFilePath(filePath));
  if (!isRecord(payload) || payload.schemaVersion !== "workbench.project-sources.v1") {
    throw new Error("Projects file schemaVersion must be workbench.project-sources.v1");
  }
  if (!Array.isArray(payload.projects)) {
    throw new Error("Projects file projects must be an array");
  }
  const projects = payload.projects.map((project) => {
    if (!isRecord(project) || typeof project.alias !== "string" || typeof project.root !== "string") {
      throw new Error("Projects file entries require alias and root");
    }
    return parseProjectSpec(project.alias + "=" + project.root);
  });
  return mergeProjectSpecs(projects);
}

export function stableNdtAssetIds(...values) {
  const ids = values.flatMap(asTextList);
  return [...new Set(ids.filter((value) => /^NDT-[A-Z0-9]+-[0-9]{3}$/.test(value)))];
}

export function findRegistryAsset(assets, sourceId, category) {
  const base = sourceId.split("#", 1)[0];
  return (
    assets.find(
      (asset) =>
        (!category || asset.category === category) &&
        typeof asset.source_ref === "string" &&
        (asset.source_ref === sourceId ||
          asset.source_ref === base ||
          sourceId.startsWith(asset.source_ref + "#") ||
          sourceId.startsWith(asset.source_ref + "/"))
    ) || null
  );
}

export function domainRecord({
  domain,
  sourceId,
  label,
  sourceVersion = null,
  rawStatus = null,
  rights = null,
  facts = [],
  registryAsset = null,
  issueCodes = []
}) {
  return {
    domain,
    sourceId,
    registryAssetId: registryAsset?.id ?? null,
    label,
    sourceVersion,
    rawStatus,
    rights,
    facts,
    issueCodes
  };
}

export async function publicRegistryFingerprint(root) {
  const registry = await readPackageJson(root, "registry/design-team.json");
  const assets = await readPackageJson(root, "registry/design-assets.json");
  return sha256(stableStringify({ registry: registry.data, assets: assets.data }));
}

export function issueRecord(code, severity, message, sourceId, subjectId) {
  return {
    code,
    severity,
    message,
    ...(sourceId ? { sourceId } : {}),
    ...(subjectId ? { subjectId } : {})
  };
}

export function mediaTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const map = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".html": "text/html",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
    ".json": "application/json",
    ".md": "text/markdown",
    ".txt": "text/plain",
    ".csv": "text/csv"
  };
  return map[extension] || null;
}

export { fs, path };
export { validateWorkbenchSnapshot };
