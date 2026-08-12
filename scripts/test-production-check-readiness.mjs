import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ndt-production-gate-"));

async function writeJson(name, value) {
  const filePath = path.join(fixtureRoot, name);
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return filePath;
}

function runCheck(manifestPath) {
  const result = spawnSync(process.execPath, [path.join(root, "scripts", "production-check.mjs"), manifestPath], {
    cwd: root,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
}

function runMcpCheck(manifestPath) {
  const requests = [
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "production-readiness-test", version: "1.0.0" } }
    },
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "nero_design_production_check",
        arguments: { manifest_path: manifestPath, execute: true }
      }
    }
  ];
  const result = spawnSync(process.execPath, [path.join(root, "mcp-lite", "server.mjs")], {
    cwd: root,
    encoding: "utf8",
    input: `${requests.map((request) => JSON.stringify(request)).join("\n")}\n`
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const responses = result.stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const response = responses.find((item) => item.id === 2);
  assert.ok(response, "MCP production-check response is missing");
  assert.equal(response.error, undefined, JSON.stringify(response.error));
  return JSON.parse(response.result.content[0].text);
}

const projectManifestPath = await writeJson("project-manifest.json", {
  route: "ppt",
  template: "presentation-production-chain",
  design_team: { role: "background-support-design-system", version: "test" }
});
const packetPath = await writeJson("packet.json", {
  status: "ready_for_ndt",
  gates: [
    { gate_id: "kat-content-freeze", owner: "KAT", status: "pass" },
    { gate_id: "ndt-visual-score", owner: "NERO Design Team", status: "not_run" }
  ]
});
const ledgerPath = await writeJson("production-ledger.json", {
  controller: "gpt_work",
  status: "waiting_for_ndt",
  current_owner: "ndt",
  gates: [{ gate_id: "content", owner: "kat", status: "pass", ref_paths: ["kat-artifacts/handoff.json"], notes: [] }]
});
const designSpecPath = await writeJson("design-spec.json", {
  visual_owner: "NERO Design Team",
  content_owner: "KAT",
  formal_output_engine: "Presentations"
});
const styleLockPath = await writeJson("style-lock.json", { status: "draft" });
const explorationPath = await writeJson("visual-exploration.json", { status: "draft", selected_direction_id: "" });
const manifestPath = await writeJson("production-manifest.json", {
  artifact: "production gate regression fixture",
  route: "ppt",
  presentation_chain_required: true,
  gpt_work_controlled: true,
  production_ledger: ledgerPath,
  project_manifest: projectManifestPath,
  visual_qa_manifest: path.join(root, "scripts", "sample-visual-qa-manifest.json"),
  visual_score_manifest: path.join(root, "scorecards", "sample-score-manifest.json"),
  presentation_production_packet: packetPath,
  design_spec: designSpecPath,
  style_lock: styleLockPath,
  visual_exploration: explorationPath,
  expected_outputs: [],
  case_library_record: path.join(root, "case-library", "ppt.json"),
  gpt_image_2_used: false
});

const reviewOutput = runCheck(manifestPath);
assert.match(reviewOutput, /^Production status: review/m);
assert.match(reviewOutput, /REVIEW presentation style lock is finalized/);
const reviewMcp = runMcpCheck(manifestPath);
assert.equal(reviewMcp.readiness_status, "review");
assert.equal(reviewMcp.ready_for_downstream, false);

await writeJson("style-lock.json", { status: "locked" });
await writeJson("visual-exploration.json", { status: "selected", selected_direction_id: "conservative-banker" });

const passOutput = runCheck(manifestPath);
assert.match(passOutput, /^Production status: pass/m);
assert.doesNotMatch(passOutput, /^REVIEW /m);
const passMcp = runMcpCheck(manifestPath);
assert.equal(passMcp.readiness_status, "pass");
assert.equal(passMcp.ready_for_downstream, true);

console.log(JSON.stringify({ status: "pass", review_gate: "review", finalized_gate: "pass", fixture_root: fixtureRoot }, null, 2));
