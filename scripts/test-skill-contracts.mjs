import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { routeTool } from "../mcp-lite/routing.mjs";
import { evaluateScore } from "./score-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ndt-skill-contract-"));
const results = [];
let sequence = 0;
async function check(name, run) {
  try { await run(); results.push({ name, status: "pass" }); }
  catch (error) { results.push({ name, status: "fail", reason: error.message }); }
}
async function cli(script, manifest, prefix) {
  const file = path.join(tmp, `${++sequence}.json`);
  await fs.writeFile(file, JSON.stringify(manifest));
  const run = spawnSync(process.execPath, [path.join(root, script), file], { encoding: "utf8" });
  const line = run.stdout.split("\n").find(item => item.startsWith(prefix));
  assert.ok(line, run.stderr || run.stdout);
  return { exit: run.status, ...JSON.parse(line.slice(prefix.length)) };
}
async function production(route, extra = {}, projectExtra = {}) {
  const project = path.join(tmp, `${++sequence}.project.json`);
  await fs.writeFile(project, JSON.stringify({ route, template: "fixture", design_team_version: "fixture", ...projectExtra }));
  return cli("scripts/production-check.mjs", { artifact: "Contract fixture", route, project_manifest: project,
    stage: "design_contract", presentation_chain_required: false, ...extra }, "Production result: ");
}
const ordinaryScores = { route_fit: 9, brand_tokens: 11, layout_typography: 12,
  information_hierarchy: 12, data_integrity: 14, chart_quality: 10, output_qa: 10, ai_image_boundary: 5 };

try {
  for (const route of ["ppt", "formal-pptx", "template-following", "pitchbook-client-material"]) {
    await check(`${route}: ordinary content needs no KAT packet`, async () => {
      const result = await production(route);
      assert.equal(result.status, "pass", JSON.stringify(result.reviews));
      assert.equal(result.ready_for_downstream, false);
      assert.equal(result.final_delivery_ready, false);
      assert.equal(result.human_accepted, false);
    });
  }
  await check("a selected KAT contract cannot be disabled by a false flag", async () => {
    for (const context of [{ content_contract: "kat-presentation" }, { kat_handoff_brief: "missing.json" }, { presentation_production_packet: "missing.json" }]) {
      const result = await production("ppt", context);
      assert.notEqual(result.status, "pass");
      assert.ok(result.reviews.some(item => item.label === "KAT quality receipt"));
    }
    assert.notEqual((await production("ppt", {}, { content_contract: "kat-presentation" })).status, "pass");
  });
  await check("ordinary final delivery still requires current output evidence", async () => {
    const result = await production("ppt", { stage: "final_delivery" });
    assert.notEqual(result.status, "pass");
    assert.equal(result.final_delivery_ready, false);
  });
  await check("caller-controlled ordinary work still requires its production ledger", async () => {
    const result = await production("ppt", { gpt_work_controlled: true });
    assert.notEqual(result.status, "pass");
    assert.ok(result.reviews.some(item => item.label === "GPT Work production ledger is declared"));
  });
  await check("Chinese PPT audit remains read-only", async () => {
    const result = await routeTool({ task: "只审阅这个 PPT，不要生成新文件" });
    assert.equal(result.task_mode, "audit");
    assert.equal(result.ppt_subroute, "ppt-design-audit");
    assert.equal(result.engine_resolution ?? null, null);
    assert.deepEqual(result.recommended_tools, ["nero_design_visual_qa"]);
  });
  await check("button motion stays in frontend design", async () => {
    const result = await routeTool({ task: "请给这个前端按钮增加轻微动效" });
    assert.equal(result.route, "frontend-ui");
    assert.ok(result.rules.includes("references/frontend-motion.md"));
    assert.equal(result.rules.includes("references/motion-video-harness.md"), false);
  });
  await check("AI UI audits keep the relevant frontend profile", async () => {
    const result = await routeTool({ task: "审查这个 AI 软件前端的人工确认界面" });
    assert.equal(result.task_mode, "audit");
    assert.equal(result.route, "frontend-ui");
    assert.equal(result.frontend_profile.id, "ai-app-ui");
    assert.equal(result.figure_compiler.recommended, false);
  });
  await check("an explicit request to regenerate after inspection remains actionable", async () => {
    const result = await routeTool({ task: "NDT，检查后重新生成产业链报告图" });
    assert.equal(result.task_mode, "revise");
    assert.equal(result.figure_compiler.recommended, true);
    assert.ok(result.recommended_tools.includes("nero_design_compile_report_figure"));
  });
  await check("read-only case lookup never recommends import", async () => {
    const result = await routeTool({ task: "检查案例", preferred_route: "case-library", task_mode: "audit" });
    assert.deepEqual(result.recommended_tools, ["nero_design_get_case_snapshot"]);
  });
  await check("a structured route and mode override keyword inference", async () => {
    const result = await routeTool({ task: "审核截图中的短视频按钮", task_mode: "revise", preferred_route: "frontend-ui" });
    assert.equal(result.route, "frontend-ui");
    assert.equal(result.task_mode, "revise");
  });
  await check("style exploration alone does not select KAT", async () => {
    const result = await routeTool({ task: "给这个 PPT 做三方案 style_lock" });
    assert.equal(result.presentation_production_chain.required, false);
    assert.equal(result.controller_boundary.content_controller, "Current content owner");
    assert.equal(result.rules.includes("references/web-ppt.md"), false);
  });
  await check("an explicit KAT selection retains the production contract", async () => {
    const result = await routeTool({ task: "制作 PPT", content_contract: "kat-presentation" });
    assert.equal(result.presentation_production_chain.required, true);
    assert.ok(result.rules.includes("references/presentation-handoff-contract.md"));
  });
  await check("declining KAT does not select it by keyword", async () => {
    const result = await routeTool({ task: "制作 PPT，不使用 KAT 生产合同" });
    assert.equal(result.content_contract, "standard");
  });
  await check("ordinary scores normalize only applicable weights", async () => {
    const result = await evaluateScore({ route: "image-report", scores: ordinaryScores });
    assert.equal(result.total, 100);
    assert.equal(result.applicable_points, 83);
    assert.deepEqual(result.not_applicable.map(row => row.id), ["handoff_boundary", "presentation_chain_readiness"]);
  });
  await check("missing required scores cannot be marked not applicable by the caller", async () => {
    const scores = { ...ordinaryScores }; delete scores.data_integrity;
    await assert.rejects(evaluateScore({ route: "image-report", scores, not_applicable: ["data_integrity"] }), /data_integrity/);
  });
  await check("KAT scoring still requires the handoff criteria", async () => {
    await assert.rejects(evaluateScore({ route: "ppt", content_contract: "kat-presentation", scores: ordinaryScores }), /handoff_boundary/);
    await assert.rejects(evaluateScore({ route: "ppt", scores: ordinaryScores }, { content_contract: "kat-presentation" }), /handoff_boundary/);
  });
  await check("known absent charts and AI imagery omit only those optional criteria", async () => {
    const scores = { ...ordinaryScores }; delete scores.chart_quality; delete scores.ai_image_boundary;
    const result = await evaluateScore({ route: "image-report", has_charts: false, gpt_image_2_used: false, scores });
    assert.equal(result.total, 100);
    assert.equal(result.applicable_points, 68);
    await assert.rejects(evaluateScore({ route: "image-report", scores }), /chart_quality/);
  });
  await check("QA reports missing coverage and never claims rendered acceptance", async () => {
    const result = await cli("scripts/visual-qa.mjs", { route: "frontend-ui", width: 100, height: 100,
      colors: ["#000000", "#ffffff"] }, "QA result: ");
    assert.equal(result.evidence_kind, "manifest_checks");
    assert.ok(result.not_checked.includes("text_fit"));
    assert.ok(result.not_checked.includes("contrast"));
    assert.equal(result.rendered_qa_passed, false);
    assert.equal(result.human_accepted, false);
  });
  await check("palette variety never requires aesthetic exception approval", async () => {
    for (const colors of [["#222222"], ["#ffffff", "#dddddd", "#222222"], ["#220000", "#880000", "#ee0000"]]) {
      const result = await cli("scripts/visual-qa.mjs", { width: 100, height: 100, colors }, "QA result: ");
      assert.equal(result.exit, 0);
      assert.equal(result.status, "pass");
    }
  });
  await check("open style choices do not waive readability or color syntax", async () => {
    for (const extra of [{ colors: ["invalid"] }, { colors: ["#eeeeee"], contrastPairs: [{ foreground: "#eeeeee", background: "#ffffff" }] }]) {
      const result = await cli("scripts/visual-qa.mjs", { width: 100, height: 100, ...extra }, "QA result: ");
      assert.equal(result.exit, 1);
    }
  });
  await check("frontend tool guidance leaves aesthetic choices to the task", async () => {
    const result = await routeTool({ task: "Design a colorful editorial GUI", preferred_route: "frontend-ui" });
    assert.deepEqual(result.anti_slop_gate.default_banned_patterns, []);
    for (const dial of Object.values(result.design_dials)) assert.deepEqual(dial.default_by_route, {});
  });
  await check("rule synchronization detects drift and preserves exact rollback bytes", async () => {
    const home = path.join(tmp, "sync-fixture");
    for (const dir of ["scripts", "registry", "rules", "skill-source/nero-design-team/references"]) {
      await fs.mkdir(path.join(home, dir), { recursive: true });
    }
    await fs.copyFile(path.join(root, "scripts/sync-skill.mjs"), path.join(home, "scripts/sync-skill.mjs"));
    await fs.writeFile(path.join(home, "registry/design-team.json"), JSON.stringify({ registry_profile: "private_canonical" }));
    await fs.writeFile(path.join(home, "skill-source/nero-design-team/references/one.md"), "canonical\n");
    await fs.writeFile(path.join(home, "rules/one.md"), "prior manual bytes\n");
    const run = (...args) => spawnSync(process.execPath, [path.join(home, "scripts/sync-skill.mjs"), ...args], { encoding: "utf8" });
    assert.equal(run().status, 1);
    assert.equal(await fs.readFile(path.join(home, "rules/one.md"), "utf8"), "prior manual bytes\n");
    const written = run("--write", "--backup", path.join(home, "rollback"));
    assert.equal(written.status, 0, written.stderr);
    assert.equal(await fs.readFile(path.join(home, "rollback/rules/one.md"), "utf8"), "prior manual bytes\n");
    assert.equal(await fs.readFile(path.join(home, "rules/one.md"), "utf8"), "canonical\n");
    assert.equal(run().status, 0);
  });
} finally {
  await fs.rm(tmp, { recursive: true, force: true });
}
for (const result of results) console.log(`${result.status.toUpperCase()} ${result.name}${result.reason ? `: ${result.reason}` : ""}`);
console.log(JSON.stringify({ checks: results.length, passed: results.filter(item => item.status === "pass").length, verification: "V1_local_contracts" }));
if (results.some(item => item.status === "fail")) process.exitCode = 1;
