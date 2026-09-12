import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

export const resolveFrom = (base, file) => path.resolve(base, file);
export const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
export const sha256 = async (file) => crypto.createHash("sha256").update(await fs.readFile(file)).digest("hex");

const supportingExtensions = new Set([
  ".json", ".jsonl", ".ndjson", ".csv", ".tsv", ".yaml", ".yml", ".toml",
  ".js", ".mjs", ".cjs", ".ts", ".py", ".sh", ".log", ".lock", ".map"
]);

function outputRole(output, resolvedFile) {
  const inferred = supportingExtensions.has(path.extname(resolvedFile).toLowerCase()) ? "supporting" : "visual";
  const role = output.role ?? inferred;
  if (!["visual", "supporting"].includes(role)) throw new Error(`unknown output role: ${role}`);
  if (role === "supporting" && inferred !== "supporting") {
    throw new Error("visual or unknown output formats cannot be relabelled supporting to skip review");
  }
  return role;
}

async function isPreviewFile(file) {
  const bytes = await fs.readFile(file);
  switch (path.extname(file).toLowerCase()) {
    case ".png": return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    case ".jpg": case ".jpeg": return bytes[0] === 255 && bytes[1] === 216;
    case ".webp": return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    case ".pdf": return bytes.toString("ascii", 0, 5) === "%PDF-";
    case ".svg": return /<svg[\s>]/i.test(bytes.toString("utf8"));
    default: return false;
  }
}

export function isExample(document, file = "") {
  return document.is_example === true || document.evidence_kind === "example" ||
    /(?:^|[-_.])(sample|example)(?:[-_.]|$)/i.test(path.basename(file)) ||
    /^sample\b/i.test(document.artifact || "") ||
    (document.notes || []).some((note) => /structural example|sample only|示例.*不代表/i.test(String(note)));
}

export async function verifyVisualEvidence(manifest, manifestDir, outputs, qaPath, scorePath) {
  const issues = [];
  const targets = [];
  for (const output of outputs) {
    try {
      const file = await fs.realpath(resolveFrom(manifestDir, output.path));
      const stat = await fs.stat(file);
      if (!stat.isFile() || stat.size < Math.max(1, output.min_bytes || 1)) throw new Error("empty or undersized output");
      const digest = await sha256(file);
      if (output.sha256 !== undefined && output.sha256 !== digest) throw new Error("output digest is stale or mismatched");
      if (outputRole(output, file) === "visual") targets.push({ file, digest });
    } catch (error) { issues.push(`output ${output.path || "missing path"}: ${error.message}`); }
  }
  if (!targets.length) issues.push("at least one current visual output is required for this stage");
  for (const file of [qaPath, scorePath].filter(Boolean)) {
    try {
      const doc = await readJson(file);
      if (isExample(doc, file)) issues.push(`example evidence is not a project review: ${file}`);
      const reviewedAt = Date.parse(doc.reviewed_at);
      if (doc.review_status !== "passed" || !Number.isFinite(reviewedAt) || reviewedAt > Date.now() + 60000) {
        issues.push(`passed, dated review is required: ${file}`);
      }
      const bindings = Array.isArray(doc.artifact_bindings) ? doc.artifact_bindings : [];
      for (const target of targets) {
        let matched = false;
        for (const binding of bindings) {
          try {
            if (await fs.realpath(resolveFrom(path.dirname(file), binding.path)) === target.file && binding.sha256 === target.digest) matched = true;
          } catch { /* Invalid binding cannot satisfy evidence. */ }
        }
        if (!matched) issues.push(`review is missing or stale for ${target.file}: ${file}`);
      }
    } catch (error) { issues.push(`review evidence: ${error.message}`); }
  }
  for (const target of targets) {
    let matched = false;
    for (const evidence of manifest.rendered_evidence || []) {
      try {
        const source = await fs.realpath(resolveFrom(manifestDir, evidence.artifact_path));
        if (source !== target.file) continue;
        const preview = await fs.realpath(resolveFrom(manifestDir, evidence.path));
        const reviewedAt = Date.parse(evidence.reviewed_at);
        const stat = await fs.stat(preview);
        if (evidence.status === "pass" && ["screenshot", "preview", "render"].includes(evidence.kind) &&
            evidence.artifact_sha256 === target.digest && preview !== source && stat.isFile() && stat.size > 0 && await isPreviewFile(preview) &&
            evidence.sha256 === await sha256(preview) && Number.isFinite(reviewedAt) && reviewedAt <= Date.now() + 60000) matched = true;
      } catch { /* A broken preview remains unsatisfied. */ }
    }
    if (!matched) issues.push(`passed rendered evidence is missing, failed or stale for ${target.file}`);
  }
  return issues;
}

export async function verifyKatReceipt(manifest, manifestDir) {
  // Consume KAT's existing validator and reviewed-content algorithm; do not reimplement its semantics.
  const katRoot = process.env.NDT_KAT_ROOT || "";
  try {
    if (!katRoot) return ["KAT quality verification unavailable: configure NDT_KAT_ROOT; return to KAT"];
    const briefPath = manifest.kat_handoff_brief ? resolveFrom(manifestDir, manifest.kat_handoff_brief) : null;
    const brief = briefPath ? await readJson(briefPath) : {};
    const receipt = manifest.quality_core_receipt || brief.quality_core_receipt;
    if (!receipt) return ["KAT quality_core_receipt is required; return to KAT"];
    const refs = {};
    for (const [key, inputId] of [["presentation_handoff_contract", "handoff-contract"], ["slide_claim_map", "slide-claim-map"], ["content_freeze_gate", "content-freeze-gate"]]) {
      const input = brief.kat_inputs?.find((item) => item.input_id === inputId)?.path;
      const value = manifest[key] || input;
      if (!value) return [`KAT ${key} is required; return to KAT`];
      refs[key] = resolveFrom(manifest[key] ? manifestDir : path.dirname(briefPath), value);
    }
    const [handoff, claims, freeze] = await Promise.all(Object.values(refs).map(readJson));
    const binding = freeze.quality_core_binding;
    const issues = [];
    if (freeze.status !== "frozen") issues.push("KAT content freeze gate is not frozen");
    const receiptBase = manifest.quality_core_receipt ? manifestDir : path.dirname(briefPath);
    if (!receipt.source_path || await fs.realpath(resolveFrom(receiptBase, receipt.source_path)) !== await fs.realpath(refs.content_freeze_gate)) {
      issues.push("KAT receipt source_path does not match the content freeze gate");
    }
    for (const field of ["core_id", "core_version", "profile", "rules_sha256", "reviewed_content_sha256", "review_status"]) {
      if (!receipt[field] || receipt[field] !== binding?.[field]) issues.push(`KAT receipt ${field} is missing or mismatched`);
    }
    const { validatePresentationQualityBinding } = await import(pathToFileURL(path.join(katRoot, "src", "presentation", "PresentationQualityCore.ts")).href);
    issues.push(...validatePresentationQualityBinding(katRoot, handoff, claims, freeze, binding));
    return issues;
  } catch (error) {
    return [`KAT quality verification unavailable or invalid: ${error.message}; return to KAT`];
  }
}
