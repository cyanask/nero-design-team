import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const officeCliAdapter = process.env.NERO_OFFICECLI_ADAPTER || "";

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

function resolveFrom(baseDir, filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath);
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

function slug(value) {
  return String(value || "office-output")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "office-output";
}

async function jsonExistsAndParses(filePath) {
  if (!(await exists(filePath))) {
    return { ok: false, detail: filePath };
  }
  try {
    await readJson(filePath);
    return { ok: true, detail: filePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, detail: `${filePath}: ${message}` };
  }
}

async function runOfficeCliAdapter(action, filePath, outDir) {
  if (!officeCliAdapter) {
    return {
      ok: true,
      status: "unavailable",
      detail: "OfficeCLI adapter unavailable: set NERO_OFFICECLI_ADAPTER to enable Office output QA."
    };
  }

  if (!(await exists(officeCliAdapter))) {
    return {
      ok: true,
      status: "unavailable",
      detail: `OfficeCLI adapter unavailable: ${officeCliAdapter}`
    };
  }

  await fs.mkdir(outDir, { recursive: true });
  const result = spawnSync(process.execPath, [officeCliAdapter, action, filePath, "--out", outDir], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, OFFICECLI_SKIP_UPDATE: "1" }
  });
  const stdout = result.stdout.trim();
  const stderr = result.stderr.trim();

  let parsed = null;
  try {
    parsed = stdout ? JSON.parse(stdout) : null;
  } catch {
    return {
      ok: false,
      status: "failed",
      detail: stderr || stdout || "OfficeCLI adapter did not return JSON"
    };
  }

  const status = parsed?.status || (result.status === 0 ? "pass" : "failed");
  return {
    ok: result.status === 0 && status !== "failed",
    status,
    detail: `${status}; report ${path.join(outDir, `officecli_${action}_report.json`)}`,
    report: parsed
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

  const resolvedManifestPath = path.resolve(manifestPath);
  const manifestDir = path.dirname(resolvedManifestPath);
  const manifest = await readJson(resolvedManifestPath);
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
    const projectManifestPath = resolveFrom(manifestDir, manifest.project_manifest);
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

  const presentationChainRequired =
    manifest.presentation_chain_required === true ||
    ["ppt", "formal-pptx", "template-following", "pitchbook-client-material"].includes(manifest.route);

  if (presentationChainRequired) {
    const chainFields = [
      ["presentation_production_packet", "presentation production packet"],
      ["design_spec", "presentation design spec"],
      ["style_lock", "presentation style lock"],
      ["visual_exploration", "presentation visual exploration"]
    ];
    for (const [field, label] of chainFields) {
      if (!manifest[field]) {
        push(false, `${label} is declared`);
        continue;
      }
      const result = await jsonExistsAndParses(resolveFrom(manifestDir, manifest[field]));
      push(result.ok, `${label} exists and parses`, result.detail);
    }
  }

  if (!manifest.visual_qa_manifest) {
    push(false, "visual QA manifest is declared");
  } else {
    const qaManifestPath = resolveFrom(manifestDir, manifest.visual_qa_manifest);
    const qaResult = runNode(path.join(root, "scripts", "visual-qa.mjs"), [qaManifestPath]);
    push(qaResult.ok, "visual QA passes", qaResult.ok ? qaResult.stdout.split("\n")[0] : qaResult.stderr || qaResult.stdout);
  }

  let rating = "fail";
  if (!manifest.visual_score_manifest) {
    push(false, "visual score manifest is declared");
  } else {
    const scoreManifestPath = resolveFrom(manifestDir, manifest.visual_score_manifest);
    const scoreResult = runNode(path.join(root, "scripts", "score-visual.mjs"), [scoreManifestPath]);
    const summary = await scoreSummary(scoreManifestPath);
    rating = summary.rating;
    push(scoreResult.ok, "visual score script passes", `score ${summary.total}/100 rating ${summary.rating}`);
  }

  for (const output of manifest.expected_outputs || []) {
    const outputPath = resolveFrom(manifestDir, output.path);
    const outputExists = await exists(outputPath);
    push(outputExists, `expected output exists: ${output.label || path.basename(outputPath)}`, outputPath);
    if (outputExists && output.min_bytes) {
      const stat = await fs.stat(outputPath);
      push(stat.size >= output.min_bytes, `expected output size: ${output.label || path.basename(outputPath)}`, `${stat.size}/${output.min_bytes} bytes`);
    }
  }

  for (const output of manifest.office_outputs || []) {
    const outputPath = resolveFrom(manifestDir, output.path);
    const label = output.label || path.basename(outputPath);
    const outputExists = await exists(outputPath);
    push(outputExists, `office output exists: ${label}`, outputPath);
    if (!outputExists) continue;

    const qaDir = output.qa_dir
      ? resolveFrom(manifestDir, output.qa_dir)
      : path.join(manifestDir, "officecli-qa", slug(label));
    const qaResult = await runOfficeCliAdapter("qa", outputPath, qaDir);
    const qaOk = output.block_on_officecli
      ? qaResult.status === "pass"
      : qaResult.ok || qaResult.status === "unavailable";
    push(qaOk, `office output QA: ${label}`, qaResult.detail);

    if (output.required_preview) {
      const previewResult = await runOfficeCliAdapter("preview", outputPath, qaDir);
      const previewOk = output.block_on_officecli
        ? previewResult.status === "pass"
        : previewResult.ok || previewResult.status === "unavailable";
      push(previewOk, `office output preview: ${label}`, previewResult.detail);
    }
  }

  if (manifest.case_library_record) {
    const caseLibraryPath = resolveFrom(manifestDir, manifest.case_library_record);
    push(await exists(caseLibraryPath), "case library record exists", caseLibraryPath);
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
