import { evaluateScore } from "./score-core.mjs";
import { usesKatPresentation } from "./presentation-contract.mjs";
import { isExample, verifyVisualEvidence, verifyKatReceipt } from "./production-evidence.mjs";
import { isBlockedBrandAsset } from "./asset-policy.mjs";
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
  "brand/master-layouts.json"
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
    const value = await readJson(filePath);
    return { ok: true, detail: filePath, value };
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
  const stage = manifest.stage || "final_delivery";
  const stages = ["design_contract", "downstream_handoff", "final_delivery"];
  if (!stages.includes(stage)) throw new Error(`Unknown production stage: ${stage}`);
  const checks = [];
  const reviews = [];
  const push = (ok, label, detail = "") => checks.push({ ok, label, detail });
  const review = (condition, label, detail = "") => {
    if (!condition) reviews.push({ label, detail });
  };

  push(!isExample(manifest, resolvedManifestPath), "production manifest is project evidence, not an example");
  let projectManifest = null;
  let qaManifestPath = null;
  let scoreManifestPath = null;
  let scoreResult = null;
  let qaSummary = null;
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
      projectManifest = await readJson(projectManifestPath);
      const pptRoutes = new Set(["ppt", "formal-pptx", "template-following", "pitchbook-client-material"]);
      push(projectManifest.route === manifest.route || (pptRoutes.has(projectManifest.route) && pptRoutes.has(manifest.route)), "project and production routes agree");
      push(!isExample(projectManifest, projectManifestPath), "project manifest is not an example");
      for (const name of ["mark", "wordmark"]) {
        const declared = projectManifest.brand_assets?.[name];
        if (declared) {
          const actual = resolveFrom(path.dirname(projectManifestPath), declared);
          try {
            push(!(await isBlockedBrandAsset(root, actual)), `brand reference is not quarantined: ${name}`);
          } catch (error) { push(false, `brand reference is available: ${name}`, error.message); }
        }
      }
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

  const presentationChainRequired = usesKatPresentation(manifest, projectManifest);

  if (presentationChainRequired) {
    const chainArtifacts = {};
    const chainFields = [
      ["presentation_production_packet", "presentation production packet"],
      ["design_spec", "presentation design spec"],
      ...(stage === "design_contract" ? [] : [
        ["style_lock", "presentation style lock"],
        ["visual_exploration", "presentation visual exploration"]
      ])
    ];
    for (const [field, label] of chainFields) {
      if (!manifest[field]) {
        push(false, `${label} is declared`);
        continue;
      }
      const result = await jsonExistsAndParses(resolveFrom(manifestDir, manifest[field]));
      push(result.ok, `${label} exists and parses`, result.detail);
      if (result.ok) chainArtifacts[field] = result.value;
    }

    const qualityIssues = await verifyKatReceipt(manifest, manifestDir);
    for (const issue of qualityIssues) review(false, "KAT quality receipt", issue);
    const packet = chainArtifacts.presentation_production_packet;
    if (packet) {
      review(
        ["ready_for_ndt", "ready_for_output", "ready_for_archive"].includes(packet.status),
        "KAT presentation packet is ready for downstream ownership",
        `status ${packet.status || "missing"}`
      );
      const contentGate = Array.isArray(packet.gates)
        ? packet.gates.find((gate) => gate.owner === "KAT" || gate.gate_id === "kat-content-freeze")
        : null;
      review(contentGate?.status === "pass", "KAT content gate has passed", `status ${contentGate?.status || "missing"}`);
    }

    const styleLock = chainArtifacts.style_lock;
    if (styleLock) {
      review(["locked", "approved"].includes(styleLock.status), "presentation style lock is finalized", `status ${styleLock.status || "missing"}`);
    }

    const exploration = chainArtifacts.visual_exploration;
    if (exploration) {
      review(Boolean(exploration.selected_direction_id), "visual exploration has a selected direction", exploration.selected_direction_id || "no direction selected");
      review(["selected", "locked", "approved", "complete"].includes(exploration.status), "visual exploration is finalized", `status ${exploration.status || "missing"}`);
    }
  }

  if (manifest.production_ledger) {
    const ledgerResult = await jsonExistsAndParses(resolveFrom(manifestDir, manifest.production_ledger));
    push(ledgerResult.ok, "GPT Work production ledger exists and parses", ledgerResult.detail);
    if (ledgerResult.ok) {
      const ledger = ledgerResult.value;
      review(ledger.controller === "gpt_work", "production ledger is GPT Work owned", `controller ${ledger.controller || "missing"}`);
      review(
        ["waiting_for_ndt", "ready_for_presentations", "waiting_for_presentations", "ready_for_human_review", "approved"].includes(ledger.status),
        "production ledger is at or beyond the NDT stage",
        `status ${ledger.status || "missing"}`
      );
      const contentGate = Array.isArray(ledger.gates) ? ledger.gates.find((gate) => gate.gate_id === "content") : null;
      review(contentGate?.status === "pass", "production ledger content gate has passed", `status ${contentGate?.status || "missing"}`);
    }
  } else if (manifest.gpt_work_controlled === true) {
    review(false, "GPT Work production ledger is declared", "production_ledger missing");
  }

  const contractPassed = checks.every((check) => check.ok) && reviews.length === 0;
  if (stage !== "design_contract") {
    if (!manifest.visual_qa_manifest) {
      push(false, "visual QA manifest is declared");
    } else {
      qaManifestPath = resolveFrom(manifestDir, manifest.visual_qa_manifest);
      const qaResult = runNode(path.join(root, "scripts", "visual-qa.mjs"), [qaManifestPath]);
      push(qaResult.ok, "visual QA passes", qaResult.ok ? qaResult.stdout.split("\n")[0] : qaResult.stderr || qaResult.stdout);
      try {
        const line = qaResult.stdout.split("\n").find(item => item.startsWith("QA result: "));
        qaSummary = JSON.parse(line?.slice("QA result: ".length));
        push(qaSummary.evidence_kind === "manifest_checks", "QA evidence scope is explicit");
      } catch { push(false, "QA evidence scope is explicit", "Missing or invalid structured QA result"); }
    }


    if (!manifest.visual_score_manifest) {
      push(false, "visual score manifest is declared");
    } else {
      scoreManifestPath = resolveFrom(manifestDir, manifest.visual_score_manifest);
      try {
        scoreResult = await evaluateScore(await readJson(scoreManifestPath), {
          ...projectManifest, ...manifest, presentation_chain_required: presentationChainRequired
        });
        push(scoreResult.rating !== "fail", "visual score passes", `score ${scoreResult.total}/${scoreResult.scorecard.total_points} rating ${scoreResult.rating}`);
      } catch (error) { push(false, "visual score is valid", error.message); }
    }
    const outputs = stage === "final_delivery" ? manifest.expected_outputs : manifest.visual_outputs;
    const evidenceIssues = await verifyVisualEvidence(manifest, manifestDir, Array.isArray(outputs) ? outputs : [], qaManifestPath, scoreManifestPath);
    for (const issue of evidenceIssues) review(false, "current visual evidence", issue);
  }

  for (const output of (stage === "final_delivery" ? manifest.expected_outputs : []) || []) {
    const outputPath = resolveFrom(manifestDir, output.path);
    const outputExists = await exists(outputPath);
    push(outputExists, `expected output exists: ${output.label || path.basename(outputPath)}`, outputPath);
    if (outputExists && output.min_bytes) {
      const stat = await fs.stat(outputPath);
      push(stat.size >= output.min_bytes, `expected output size: ${output.label || path.basename(outputPath)}`, `${stat.size}/${output.min_bytes} bytes`);
    }
  }

  for (const output of (stage === "final_delivery" ? manifest.office_outputs : []) || []) {
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
  const rating = scoreResult?.rating || "pass";
  const status = failed.length > 0 ? "fail" : reviews.length > 0 || rating === "review" ? "review" : rating;
  const summary = {
    stage, status,
    design_contract_passed: contractPassed,
    ready_for_downstream: status === "pass" && stage === "downstream_handoff",
    final_delivery_ready: status === "pass" && stage === "final_delivery",
    human_accepted: false,
    content_contract: presentationChainRequired ? "kat-presentation" : "standard",
    qa_coverage: qaSummary ? { evidence_kind: qaSummary.evidence_kind, not_checked: qaSummary.not_checked,
      rendered_qa_passed: false, live_behavior_observed: false, human_accepted: false } : null,
    score_coverage: scoreResult ? { applicable_points: scoreResult.applicable_points, not_applicable: scoreResult.not_applicable } : null,
    score: scoreResult ? { scorecard: scoreResult.scorecardName, total: scoreResult.total, rating: scoreResult.rating } : null,
    next_action: status === "pass" ? (stage === "design_contract" ? "Prepare and review visual outputs" : stage === "downstream_handoff" ? "Caller invokes the project-selected output engine" : "Submit current outputs for human acceptance") : "Resolve the failed checks and review reasons, then rerun this stage",
    checks, reviews
  };
  console.log(`Production result: ${JSON.stringify(summary)}`);

  console.log(`Production status: ${status}`);
  console.log(`Artifact: ${manifest.artifact || "unnamed"}`);
  console.log(`Route: ${manifest.route || "unknown"}`);
  console.log(`gpt-image-2: ${manifest.gpt_image_2_used ? "used or briefed" : "not used"}`);
  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} ${check.label}${check.detail ? ` - ${check.detail}` : ""}`);
  }
  for (const item of reviews) {
    console.log(`REVIEW ${item.label}${item.detail ? ` - ${item.detail}` : ""}`);
  }

  if (status === "fail") {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
