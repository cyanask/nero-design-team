import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { sha256 } from "./production-evidence.mjs";
import { resolveBrandAssets, isBlockedBrandAsset } from "./asset-policy.mjs";
import { validateGlobalTrigger } from "./validate-registry.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "ndt-five-contracts-"));
const checks = [];
const write = async (name, value) => {
  const file = path.join(tmp, name);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, typeof value === "string" ? value : JSON.stringify(value));
  return file;
};
const run = (script, ...args) => spawnSync(process.execPath, [path.join(root, script), ...args], { encoding: "utf8" });
const clone = (value) => structuredClone(value);
async function production(manifest) {
  const file = await write("production.json", manifest);
  const result = run("scripts/production-check.mjs", file);
  const line = result.stdout.split("\n").find((item) => item.startsWith("Production result: "));
  assert.ok(line, result.stderr || result.stdout);
  return JSON.parse(line.slice("Production result: ".length));
}
async function check(name, fn) { await fn(); checks.push(name); console.log(`PASS ${name}`); }
const time = new Date().toISOString();
const artifact = await write("view.html", "<!doctype html><html lang='zh'><title>审查样板</title><p>当前输出</p></html>");
const preview = path.join(tmp, "preview.png");
await fs.writeFile(preview, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64"));
const binding = { path: artifact, sha256: await sha256(artifact) };
const qa = { artifact: "test review", width: 100, height: 100, colors: ["#000000", "#ffffff"],
  review_status: "passed", reviewed_at: time, artifact_bindings: [binding] };
const scorecard = JSON.parse(await fs.readFile(path.join(root, "scorecards/visual-scorecard.json"), "utf8"));
const score = { artifact: "test review", route: "frontend-ui", review_status: "passed", reviewed_at: time,
  scores: Object.fromEntries(scorecard.criteria.map((c) => [c.id, c.weight])), artifact_bindings: [binding] };
const project = await write("project.json", { route: "frontend-ui", template: "frontend-dashboard", design_team: { version: "test", role: "background-support-design-system" } });
const base = { route: "frontend-ui", artifact: "test review", project_manifest: project,
  visual_qa_manifest: await write("qa.json", qa), visual_score_manifest: await write("score.json", score),
  visual_outputs: [{ path: artifact }], expected_outputs: [{ path: artifact }],
  rendered_evidence: [{ kind: "screenshot", status: "pass", reviewed_at: time, path: preview, sha256: await sha256(preview), artifact_path: artifact, artifact_sha256: binding.sha256 }] };

await check("design contract does not authorize an engine or final delivery", async () => {
  const result = await production({ ...base, stage: "design_contract", expected_outputs: [], visual_outputs: [] });
  assert.equal(result.status, "pass"); assert.equal(result.ready_for_downstream, false); assert.equal(result.final_delivery_ready, false);
});
await check("visual handoff succeeds without final PPTX", async () => {
  const result = await production({ ...base, stage: "downstream_handoff", expected_outputs: [{ path: path.join(tmp, "not-created.pptx") }] });
  assert.equal(result.status, "pass"); assert.equal(result.ready_for_downstream, true); assert.equal(result.final_delivery_ready, false);
});
await check("current final output with bound reviews and preview passes", async () => {
  const result = await production(base); assert.equal(result.status, "pass"); assert.equal(result.final_delivery_ready, true); assert.equal(result.human_accepted, false);
});
for (const [name, edit] of [
  ["no output", (m) => { m.expected_outputs = []; }],
  ["missing preview", (m) => { m.rendered_evidence = []; }],
  ["failed preview", (m) => { m.rendered_evidence[0].status = "failed"; }],
  ["stale preview source", (m) => { m.rendered_evidence[0].artifact_sha256 = "0".repeat(64); }],
  ["changed preview bytes", (m) => { m.rendered_evidence[0].sha256 = "0".repeat(64); }],
  ["source file relabelled as preview", (m) => { m.rendered_evidence[0].path = artifact; m.rendered_evidence[0].sha256 = binding.sha256; }],
  ["example manifest", (m) => { m.is_example = true; }]
]) await check(`${name} cannot pass final delivery`, async () => {
  const value = clone(base); edit(value); const result = await production(value); assert.notEqual(result.status, "pass"); assert.equal(result.final_delivery_ready, false);
});
await check("copied example QA and score are not project evidence", async () => {
  for (const field of ["visual_qa_manifest", "visual_score_manifest"]) {
    const value = clone(base); const doc = clone(field === "visual_qa_manifest" ? qa : score); doc.is_example = true;
    value[field] = await write("copied-evidence.json", doc); assert.notEqual((await production(value)).status, "pass");
  }
});
await check("changed output invalidates unchanged review and preview receipts", async () => {
  const original = await fs.readFile(artifact); await fs.appendFile(artifact, "changed");
  assert.notEqual((await production(base)).status, "pass"); await fs.writeFile(artifact, original);
});
for (const cardName of ["visual-scorecard.json", "ai-app-ui-scorecard.json"]) {
  const card = JSON.parse(await fs.readFile(path.join(root, "scorecards", cardName), "utf8"));
  const doc = { ...score, scorecard: cardName, scores: Object.fromEntries(card.criteria.map((c) => [c.id, c.weight])) };
  await check(`${cardName}: scorer and production agree`, async () => {
    const file = await write("selected-score.json", doc); const standalone = run("scripts/score-visual.mjs", file);
    assert.equal(standalone.status, 0, standalone.stderr); assert.match(standalone.stdout, /Score: 100\/100/);
    assert.deepEqual((await production({ ...base, visual_score_manifest: file })).score, { scorecard: cardName, total: 100, rating: "pass" });
  });
  for (const fault of ["missing", "excess", "unknown"]) await check(`${cardName}: ${fault} rejected by both entrances`, async () => {
    const invalid = clone(doc); const criterion = card.criteria[0];
    if (fault === "missing") delete invalid.scores[criterion.id];
    if (fault === "excess") invalid.scores[criterion.id] = criterion.weight + 1;
    if (fault === "unknown") invalid.scorecard = "unknown.json";
    const file = await write("invalid-score.json", invalid);
    assert.notEqual(run("scripts/score-visual.mjs", file).status, 0);
    assert.equal((await production({ ...base, visual_score_manifest: file })).status, "fail");
  });
}

const katRoot = process.env.NDT_KAT_ROOT || "";
if (katRoot) {
const kat = await import(pathToFileURL(path.join(katRoot, "src/presentation/PresentationQualityCore.ts")).href);
const handoff = { deck_brief: { title: "Frozen title" }, slide_content_specs: [] };
const claims = { slides: [] };
const freeze = { status: "frozen", frozen_items: [], change_protocol: "return to KAT" };
freeze.quality_core_binding = kat.createReviewedPresentationQualityBinding(katRoot, handoff, claims, freeze, { status: "passed", reviewed_by: "test fixture", findings: [] }, time);
const freezePath = await write("freeze.json", freeze);
const ppt = { ...base, route: "ppt", project_manifest: await write("ppt-project.json", { route: "ppt", template: "presentation-production-chain", design_team_version: "test" }),
  presentation_production_packet: await write("packet.json", { status: "ready_for_ndt", gates: [{ gate_id: "kat-content-freeze", owner: "KAT", status: "pass" }] }),
  design_spec: await write("design.json", { visual_owner: "NERO Design Team", content_owner: "KAT" }),
  style_lock: await write("lock.json", { status: "locked" }), visual_exploration: await write("exploration.json", { status: "selected", selected_direction_id: "one" }),
  presentation_handoff_contract: await write("handoff.json", handoff), slide_claim_map: await write("claims.json", claims), content_freeze_gate: freezePath,
  quality_core_receipt: { ...freeze.quality_core_binding, source_path: freezePath }, stage: "downstream_handoff", expected_outputs: [] };
await check("KAT-bound PPT handoff passes with no final PPTX", async () => { assert.equal((await production(ppt)).ready_for_downstream, true); });
await check("draft style lock keeps PPT handoff in review", async () => {
  const draft = await write("draft-lock.json", { status: "draft" });
  const result = await production({ ...ppt, style_lock: draft });
  assert.equal(result.status, "review"); assert.equal(result.ready_for_downstream, false);
});
for (const fault of ["missing", "mismatch", "failed", "stale-content"]) await check(`KAT ${fault} blocks handoff`, async () => {
  const value = clone(ppt);
  if (fault === "missing") delete value.quality_core_receipt;
  if (fault === "mismatch") value.quality_core_receipt.rules_sha256 = "0".repeat(64);
  if (fault === "failed") value.quality_core_receipt.review_status = "failed";
  if (fault === "stale-content") value.presentation_handoff_contract = await write("changed-handoff.json", { ...handoff, deck_brief: { title: "Changed" } });
  assert.notEqual((await production(value)).status, "pass");
});

}
const registry = { schema_version: 1, authority: "machine_source", registry_version: "1.0.0", operation_routes: {
  new_formal_pptx: { engine_id: "project-native", mode: "default" }, existing_pptx_edit: { engine_id: "project-edit", mode: "specialized" },
  strict_template_following: { engine_id: "project-template", mode: "specialized" } } };
const registryPath = await write("00_workbench/pptx-engine-registry.json", registry);
const route = (args) => {
  const result = run("mcp-lite/server.mjs", "--dry-run", "nero_design_route", JSON.stringify({ task: "NDT PPTX", ...args }));
  assert.equal(result.status, 0, result.stderr); return JSON.parse(result.stdout);
};
await check("three PPT operations follow the current project registry", async () => {
  for (const [operation, entry] of Object.entries(registry.operation_routes)) assert.equal(route({ project_root: tmp, ppt_operation: operation }).primary_engine, entry.engine_id);
});
await check("natural-language template and existing-deck requests remain distinct", async () => {
  assert.equal(route({ project_root: tmp, task: "NDT 按已有模板制作 PPTX" }).primary_engine, "project-template");
  assert.equal(route({ project_root: tmp, task: "NDT 编辑现有 PPTX" }).primary_engine, "project-edit");
});
await check("new editable decks are creation requests, not edits", async () => {
  for (const task of ["NDT 新建正式可编辑 PPTX", "NDT 生成一份原生可编辑 PPTX", "NDT Create a new editable PPTX", "NDT 参考已有资料新建可编辑 PPTX"]) {
    const result = route({ project_root: tmp, task });
    assert.equal(result.engine_resolution.operation, "new_formal_pptx", task);
    assert.equal(result.primary_engine, "project-native", task);
  }
  assert.equal(route({ project_root: tmp, task: "NDT 编辑现有可编辑 PPTX" }).primary_engine, "project-edit");
  assert.equal(route({ project_root: tmp, task: "NDT 用已有模板新建可编辑 PPTX" }).primary_engine, "project-template");
  assert.equal(route({ project_root: tmp, task: "NDT 新建可编辑 PPTX", ppt_operation: "existing_pptx_edit" }).primary_engine, "project-edit");
});
await check("missing and stale engine resolution stay pending without fallback", async () => {
  assert.equal(route({}).engine_resolution.status, "pending");
  const resolved = route({ project_root: tmp }).engine_resolution;
  const reuse = { operation: resolved.operation, engine_id: resolved.engine_id, source_path: resolved.source_path, source_sha256: resolved.source_sha256 };
  assert.equal(route({ project_root: tmp, engine_resolution: reuse }).engine_resolution.reused_caller_resolution, true);
  reuse.source_sha256 = "0".repeat(64);
  const stale = route({ project_root: tmp, engine_resolution: reuse }); assert.equal(stale.primary_engine, null); assert.equal(stale.engine_resolution.status, "pending");
});
await check("global directive paraphrase passes; missing directive or target fails", async () => {
  const source = await write("AGENTS.md", "- 需要视觉审查时，使用 `nero-design-team`。\n");
  const target = await write("test-skill.md", "---\nname: nero-design-team\n---\nNDT visual design");
  const trigger = { source, target_skill: target, source_skill_id: "nero-design-team" };
  assert.equal((await validateGlobalTrigger(trigger)).ok, true);
  assert.equal((await validateGlobalTrigger({ ...trigger, target_skill: path.join(tmp, "missing.md") })).ok, false);
  await fs.writeFile(source, "其他规则\n"); assert.equal((await validateGlobalTrigger(trigger)).ok, false);
  await fs.writeFile(source, "视觉使用 nero-design-team-other\n"); assert.equal((await validateGlobalTrigger(trigger)).ok, false);
  await fs.writeFile(source, "installed nero-design-team\n"); assert.equal((await validateGlobalTrigger(trigger)).ok, false);
});
await check("generator omits quarantined mark", async () => {
  const target = path.join(tmp, "generated"); await fs.mkdir(target);
  const result = run("scripts/nero-design.mjs", "init", "frontend-ui", "--project-root", target);
  assert.equal(result.status, 0, result.stderr);
  const generated = JSON.parse(await fs.readFile(path.join(target, ".nero-design/manifest.json"), "utf8"));
  const catalog = JSON.parse(await fs.readFile(path.join(root, "registry/design-assets.json"), "utf8"));
  if (catalog.integrity_issues.some((item) => item.source_ref === "brand/assets/nero-mark.svg" && item.status === "open")) {
    assert.equal(generated.brand_assets.mark, null); assert.equal(generated.brand_assets.mark_status, "quarantined");
  } else { assert.equal(generated.brand_assets.mark_status, "available_reference"); }
});
await check("asset status fixtures exclude quarantined art and allow absent or approved marks", async () => {
  const assetsRoot = path.join(tmp, "brand-fixture");
  await write("brand-fixture/brand/brand-profile.json", { brand_assets: { mark: "brand/mark.svg" } });
  await write("brand-fixture/brand/mark.svg", "<svg/>");
  const catalog = { integrity_issues: [{ source_ref: "brand/mark.svg", status: "open" }], assets: [] };
  await write("brand-fixture/registry/design-assets.json", catalog);
  assert.equal((await resolveBrandAssets(assetsRoot)).mark, null);
  catalog.integrity_issues = []; await write("brand-fixture/registry/design-assets.json", catalog);
  assert.equal((await resolveBrandAssets(assetsRoot)).mark_status, "available_reference");
  await write("brand-fixture/brand/brand-profile.json", { brand_assets: {} });
  assert.equal((await resolveBrandAssets(assetsRoot)).mark_status, "unavailable");
});
for (const [name, asset, issues] of [
  ["normalized quarantine overrides positive legacy status", { status: "可直接引用", reuse_state: "quarantined" }, []],
  ["legacy quarantine overrides positive normalized state", { status: "QUARANTINED", reuse_state: "reusable" }, []],
  ["legacy blocked status remains restricted", { status: "blocked" }, []],
  ["legacy retired status remains restricted", { status: "retired" }, []],
  ["Chinese prohibition remains restricted", { status: "禁止复用", reuse_state: "conditional" }, []],
  ["open integrity issue overrides reusable state", { status: "可直接引用", reuse_state: "reusable" }, [{ source_ref: "brand/mark.svg", status: "open" }]]
]) await check(`brand policy: ${name}`, async () => {
  const assetsRoot = path.join(tmp, "brand-policy");
  const mark = await write("brand-policy/brand/mark.svg", "<svg/>");
  const alias = path.join(assetsRoot, "brand/alias.svg");
  try { await fs.symlink("mark.svg", alias); } catch (error) { if (error.code !== "EEXIST") throw error; }
  await write("brand-policy/registry/design-assets.json", { assets: [{ ...asset, source_ref: "brand/mark.svg" }], integrity_issues: issues });
  for (const declared of ["brand/mark.svg", "brand/alias.svg", "$NERO_DESIGN_TEAM_HOME/brand/mark.svg"]) {
    await write("brand-policy/brand/brand-profile.json", { brand_assets: { mark: declared } });
    assert.equal((await resolveBrandAssets(assetsRoot)).mark_status, "quarantined", `${name}: ${declared}`);
    assert.equal(await isBlockedBrandAsset(assetsRoot, mark), true);
    assert.equal(await isBlockedBrandAsset(assetsRoot, alias), true);
  }
});
await check("brand policy does not block valid optional references or missing artwork", async () => {
  const assetsRoot = path.join(tmp, "brand-policy-positive");
  const mark = await write("brand-policy-positive/brand/mark.svg", "<svg/>");
  for (const reuse_state of ["reusable", "conditional", "reference_only", "placeholder", "unknown", undefined]) {
    await write("brand-policy-positive/registry/design-assets.json", { assets: [{ status: "登记参考", reuse_state, source_ref: "brand/mark.svg" }], integrity_issues: [{ source_ref: "brand/mark.svg", status: "closed" }] });
    await write("brand-policy-positive/brand/brand-profile.json", { brand_assets: { mark: "brand/mark.svg" } });
    assert.equal((await resolveBrandAssets(assetsRoot)).mark_status, "available_reference");
    assert.equal(await isBlockedBrandAsset(assetsRoot, mark), false);
  }
  await write("brand-policy-positive/brand/brand-profile.json", { brand_assets: { mark: "brand/missing.svg" } });
  assert.equal((await resolveBrandAssets(assetsRoot)).mark_status, "unavailable");
  await assert.rejects(isBlockedBrandAsset(assetsRoot, path.join(assetsRoot, "brand/missing.svg")), { code: "ENOENT" });
  await fs.symlink("missing.svg", path.join(assetsRoot, "brand/broken.svg"));
  await write("brand-policy-positive/brand/brand-profile.json", { brand_assets: { mark: "brand/broken.svg" } });
  assert.equal((await resolveBrandAssets(assetsRoot)).mark_status, "unavailable");
  await assert.rejects(isBlockedBrandAsset(assetsRoot, path.join(assetsRoot, "brand/broken.svg")), { code: "ENOENT" });
});
await check("brand policy resolves directory and source aliases without blocking siblings", async () => {
  const assetsRoot = path.join(tmp, "brand-directory");
  const mark = await write("brand-directory/brand/restricted/mark.svg", "<svg/>");
  const sibling = await write("brand-directory/brand/restricted-safe/mark.svg", "<svg/>");
  await fs.symlink("restricted", path.join(assetsRoot, "brand/alias"));
  const outward = path.join(assetsRoot, "brand/restricted/outward.svg");
  await fs.symlink("../restricted-safe/mark.svg", outward);
  for (const source_ref of ["brand/restricted/", "$NERO_DESIGN_TEAM_HOME/brand/alias/"]) {
    const negative = { source_ref, reuse_state: "quarantined", status: "可直接引用" };
    const positive = { source_ref, reuse_state: "reusable", status: "可直接引用" };
    for (const assets of [[positive, negative], [negative, positive]]) {
      await write("brand-directory/registry/design-assets.json", { assets });
      assert.equal(await isBlockedBrandAsset(assetsRoot, mark), true);
      assert.equal(await isBlockedBrandAsset(assetsRoot, outward), true);
      assert.equal(await isBlockedBrandAsset(assetsRoot, path.join(assetsRoot, "brand/alias/outward.svg")), true);
      assert.equal(await isBlockedBrandAsset(assetsRoot, sibling), false);
      for (const declared of ["brand/alias/mark.svg", "brand/restricted/outward.svg", "brand/alias/outward.svg"]) {
        await write("brand-directory/brand/brand-profile.json", { brand_assets: { mark: declared } });
        assert.equal((await resolveBrandAssets(assetsRoot)).mark_status, "quarantined");
      }
    }
  }
});
const supportingReport = await write("build-report.json", { status: "pass", artifact_sha256: binding.sha256 });
const supportingScript = await write("builder.mjs", "// Build source retained as evidence, never executed by this test.\n");
await check("nonvisual reports and scripts do not require visual reviews or previews", async () => {
  const result = await production({ ...base, expected_outputs: [...base.expected_outputs,
    { path: supportingReport, sha256: await sha256(supportingReport) }, { path: supportingScript, role: "supporting", min_bytes: 1 }] });
  assert.equal(result.status, "pass", JSON.stringify(result.reviews));
  assert.equal(result.final_delivery_ready, true);
});
await check("missing or stale supporting attachments still block delivery", async () => {
  for (const output of [{ path: path.join(tmp, "missing.json") }, { path: supportingReport, sha256: "0".repeat(64) }]) {
    assert.notEqual((await production({ ...base, expected_outputs: [...base.expected_outputs, output] })).status, "pass");
  }
});
await check("a visual output cannot be relabelled supporting to skip QA", async () => {
  const result = await production({ ...base, expected_outputs: [{ path: artifact, role: "supporting" }], rendered_evidence: [] });
  assert.notEqual(result.status, "pass");
});
await check("an attachment-only bundle cannot pass a visual delivery gate", async () => {
  const result = await production({ ...base, expected_outputs: [{ path: supportingReport }], rendered_evidence: [] });
  assert.notEqual(result.status, "pass");
});
await check("unknown roles fail closed and explicit visual roles retain preview requirements", async () => {
  for (const output of [{ path: artifact, role: "unknown" }, { path: supportingReport, role: "visual" }]) {
    assert.notEqual((await production({ ...base, expected_outputs: [...base.expected_outputs, output] })).status, "pass");
  }
});
await check("MCP distinguishes contract, handoff and delivery", async () => {
  for (const stage of ["design_contract", "downstream_handoff", "final_delivery"]) {
    const file = await write("mcp-production.json", { ...base, stage });
    const input = [{ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1" } } },
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "nero_design_production_check", arguments: { manifest_path: file, execute: true } } }];
    // EOF means disconnect/cancel. Keep the request channel open until its response arrives.
    const response = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [path.join(root, "mcp-lite/server.mjs")], { stdio: ["pipe", "pipe", "pipe"] });
      let buffer = ""; let stderr = ""; let done = false;
      const timer = setTimeout(() => { if (!done) { done = true; child.kill("SIGTERM"); reject(new Error("MCP stage fixture timed out")); } }, 15000);
      child.stderr.on("data", chunk => { stderr += chunk; });
      child.stdout.on("data", chunk => {
        buffer += chunk;
        while (buffer.includes("\n")) {
          const index = buffer.indexOf("\n"); const line = buffer.slice(0, index); buffer = buffer.slice(index + 1);
          if (!line.trim()) continue;
          const item = JSON.parse(line);
          if (item.id === 2 && !done) { done = true; clearTimeout(timer); child.stdin.end(); resolve(item); }
        }
      });
      child.once("error", error => { if (!done) { done = true; clearTimeout(timer); reject(error); } });
      child.once("close", () => { if (!done) { done = true; clearTimeout(timer); reject(new Error(stderr || "MCP closed without the stage response")); } });
      child.stdin.write(input.map(JSON.stringify).join("\n") + "\n");
    });
    assert.equal(response.error, undefined, response.error?.message);
    const body = JSON.parse(response.result.content[0].text);
    assert.equal(body.stage, stage); assert.equal(body.ready_for_downstream, stage === "downstream_handoff"); assert.equal(body.final_delivery_ready, stage === "final_delivery");
  }
});
console.log(JSON.stringify({ status: "pass", checks: checks.length, fixture_root: tmp, verification: "V1_local_contracts_only_no_render_or_human_acceptance" }));
