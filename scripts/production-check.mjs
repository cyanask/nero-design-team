import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const codexHome = process.env.CODEX_HOME || path.join(process.env.HOME || "~", ".codex");

const requiredTokenOutputs = [
  "build/css/nero-tokens.css",
  "build/tailwind/nero-tailwind.cjs",
  "build/themes/report-theme.mjs",
  "build/themes/pptx-theme.mjs",
  "build/themes/remotion-theme.ts"
];

const requiredBrandAssets = [
  "brand/brand-profile.json",
  "brand/master-layouts.json",
  "brand/assets/nero-mark.svg",
  "brand/assets/nero-wordmark.svg"
];

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

function expandPortablePath(filePath) {
  if (!filePath) return filePath;
  return filePath
    .replaceAll("$NERO_DESIGN_TEAM_HOME", root)
    .replaceAll("${NERO_DESIGN_TEAM_HOME}", root)
    .replaceAll("$CODEX_HOME", codexHome)
    .replaceAll("${CODEX_HOME}", codexHome);
}

function resolvePortablePath(filePath) {
  return path.resolve(expandPortablePath(filePath));
}

function runNode(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: "utf8"
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function scoreRating(total, scorecard) {
  if (total >= scorecard.pass_threshold) return "pass";
  if (total >= scorecard.review_threshold) return "review";
  return "fail";
}

async function scoreSummary(scoreManifestPath) {
  const scorecard = await readJson(path.join(root, "scorecards", "visual-scorecard.json"));
  const manifest = await readJson(scoreManifestPath);
  const total = scorecard.criteria.reduce((sum, criterion) => {
    const value = manifest.scores?.[criterion.id];
    if (!Number.isFinite(value)) {
      throw new Error(`Missing numeric score for ${criterion.id}`);
    }
    if (value < 0 || value > criterion.weight) {
      throw new Error(`Score for ${criterion.id} must be between 0 and ${criterion.weight}`);
    }
    return sum + value;
  }, 0);
  return {
    total,
    rating: scoreRating(total, scorecard),
    passThreshold: scorecard.pass_threshold,
    reviewThreshold: scorecard.review_threshold
  };
}

function usage() {
  return "Usage: node scripts/production-check.mjs <production-manifest.json>";
}

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    throw new Error(usage());
  }

  const manifest = await readJson(resolvePortablePath(manifestPath));
  const checks = [];
  const push = (ok, label, detail = "") => checks.push({ ok, label, detail });

  for (const rel of requiredTokenOutputs) {
    push(await exists(path.join(root, rel)), `token output exists: ${rel}`);
  }

  for (const rel of requiredBrandAssets) {
    push(await exists(path.join(root, rel)), `brand asset exists: ${rel}`);
  }

  if (!manifest.project_manifest) {
    push(false, "project manifest is declared");
  } else {
    const projectManifestPath = resolvePortablePath(manifest.project_manifest);
    const projectManifestExists = await exists(projectManifestPath);
    push(projectManifestExists, "project manifest exists", projectManifestPath);
    if (projectManifestExists) {
      const projectManifest = await readJson(projectManifestPath);
      const designTeamVersion = projectManifest.design_team_version || projectManifest.design_team?.version;
      const designTeamRole = projectManifest.design_team?.role || "";
      push(Boolean(projectManifest.route), "project manifest has route", projectManifest.route || "");
      push(Boolean(projectManifest.template), "project manifest has template", projectManifest.template || "");
      push(Boolean(designTeamVersion), "project manifest has design team version", designTeamVersion || "");
      if (projectManifest.design_team) {
        push(
          designTeamRole === "background-support-design-system",
          "project manifest records design-team support role",
          designTeamRole
        );
      }
    }
  }

  if (!manifest.visual_qa_manifest) {
    push(false, "visual QA manifest is declared");
  } else {
    const qaManifestPath = resolvePortablePath(manifest.visual_qa_manifest);
    const qaResult = runNode(path.join(root, "scripts", "visual-qa.mjs"), [qaManifestPath]);
    push(qaResult.ok, "visual QA passes", qaResult.ok ? qaResult.stdout.split("\n")[0] : qaResult.stderr || qaResult.stdout);
  }

  let rating = "fail";
  if (!manifest.visual_score_manifest) {
    push(false, "visual score manifest is declared");
  } else {
    const scoreManifestPath = resolvePortablePath(manifest.visual_score_manifest);
    const scoreResult = runNode(path.join(root, "scripts", "score-visual.mjs"), [scoreManifestPath]);
    const summary = await scoreSummary(scoreManifestPath);
    rating = summary.rating;
    push(scoreResult.ok, "visual score script passes", `score ${summary.total}/100 rating ${summary.rating}`);
  }

  for (const output of manifest.expected_outputs || []) {
    const outputPath = resolvePortablePath(output.path);
    const outputExists = await exists(outputPath);
    push(outputExists, `expected output exists: ${output.label || path.basename(outputPath)}`, outputPath);
    if (outputExists && output.min_bytes) {
      const stat = await fs.stat(outputPath);
      push(stat.size >= output.min_bytes, `expected output size: ${output.label || path.basename(outputPath)}`, `${stat.size}/${output.min_bytes} bytes`);
    }
  }

  if (manifest.case_library_record) {
    push(await exists(resolvePortablePath(manifest.case_library_record)), "case library record exists", manifest.case_library_record);
  }

  const failed = checks.filter((check) => !check.ok);
  const status = failed.length > 0 ? "fail" : rating;

  console.log(`Production status: ${status}`);
  console.log(`Artifact: ${manifest.artifact || "unnamed"}`);
  console.log(`Route: ${manifest.route || "unknown"}`);
  console.log(`gpt-image-2: ${manifest.gpt_image_2_used ? "used or briefed" : "not used"}`);
  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} ${check.label}${check.detail ? ` - ${check.detail}` : ""}`);
  }

  if (status === "fail") {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
