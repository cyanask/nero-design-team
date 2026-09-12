// Bounded persistent-connection acceptance. Only a temporary NDT copy is mutated.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ndt-stable-bridge-"));
const results = [];
const digest = value => createHash("sha256").update(value).digest("hex");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const legacyIndex = process.argv.indexOf("--legacy-server");
const legacy = legacyIndex < 0 ? null : path.resolve(process.argv[legacyIndex + 1]);

async function copyTree(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const item of await fs.readdir(from, { withFileTypes: true })) {
    if (item.name === "__pycache__" || item.name === ".DS_Store" || item.name === "node_modules" ||
      /(?:^|[-_.])(test|tests|smoke|fixture|fixtures)(?:$|[-_.])/i.test(item.name)) continue;
    const source = path.join(from, item.name); const target = path.join(to, item.name);
    if (item.isDirectory()) await copyTree(source, target);
    else if (item.isFile() && /\.(mjs|py|json|md|yaml)$/.test(item.name)) await fs.copyFile(source, target);
  }
}
async function fixture(name) {
  const home = path.join(temp, name);
  for (const relative of ["mcp-lite", "scripts", "tokens", "generators", "tools/runtime/report-figure-compiler"]) {
    await copyTree(path.join(root, relative), path.join(home, relative));
  }
  await fs.mkdir(path.join(home, "registry"), { recursive: true });
  for (const item of await fs.readdir(path.join(root, "registry"), { withFileTypes: true })) {
    if (item.isFile() && item.name.endsWith(".json")) await fs.copyFile(path.join(root, "registry", item.name), path.join(home, "registry", item.name));
  }
  const privateSkill = path.join(root, "skill-source/nero-design-team");
  const skill = await fs.stat(privateSkill).then(() => "skill-source/nero-design-team", () => "skills/nero-design-team");
  await copyTree(path.join(root, skill), path.join(home, skill));
  if (legacy) await fs.copyFile(legacy, path.join(home, "mcp-lite/server.mjs"));
  return { home, skill: path.join(home, skill, "SKILL.md") };
}

function client(home, transport) {
  const child = spawn(process.execPath, [path.join(home, "mcp-lite/server.mjs")], { cwd: home, stdio: ["pipe", "pipe", "pipe"] });
  let buffer = Buffer.alloc(0); let sequence = 0; let stderr = "";
  const pending = new Map();
  child.stderr.on("data", chunk => { stderr += chunk; });
  child.stdout.on("data", chunk => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length) {
      let length; let offset;
      if (transport === "ndjson") {
        const index = buffer.indexOf(10); if (index < 0) return;
        length = index; offset = index + 1;
      } else {
        const index = buffer.indexOf("\r\n\r\n"); if (index < 0) return;
        const match = /Content-Length:\s*(\d+)/i.exec(buffer.subarray(0, index).toString());
        assert.ok(match, "response has Content-Length");
        const start = index + 4; const size = Number(match[1]); if (buffer.length < start + size) return;
        buffer = buffer.subarray(start); length = size; offset = size;
      }
      const raw = buffer.subarray(0, length).toString(); buffer = buffer.subarray(offset);
      if (!raw.trim()) continue;
      const response = JSON.parse(raw); const waiter = pending.get(response.id);
      if (waiter) { clearTimeout(waiter.timer); pending.delete(response.id); waiter.resolve(response); }
    }
  });
  child.on("exit", () => {
    for (const waiter of pending.values()) { clearTimeout(waiter.timer); waiter.reject(new Error(`Bridge exited: ${stderr}`)); }
    pending.clear();
  });
  const request = (method, params = {}) => {
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Request timed out: ${method}; ${stderr}`)); }, 20000);
      pending.set(id, { resolve, reject, timer });
      const bytes = Buffer.from(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
      if (transport === "ndjson") child.stdin.write(Buffer.concat([bytes, Buffer.from("\n")]));
      else child.stdin.write(Buffer.concat([Buffer.from(`Content-Length: ${bytes.length}\r\n\r\n`), bytes]));
    });
  };
  return {
    child, request,
    call: (name, args = {}) => request("tools/call", { name, arguments: args }),
    async close() {
      if (child.exitCode !== null || child.signalCode !== null) return;
      const exited = once(child, "exit"); child.stdin.end();
      await Promise.race([exited, delay(1000)]);
      if (child.exitCode === null && child.signalCode === null) { child.kill("SIGTERM"); await Promise.race([exited, delay(1000)]); }
      if (child.exitCode === null && child.signalCode === null) { child.kill("SIGKILL"); await exited; }
    }
  };
}
function body(response) {
  assert.equal(response.error, undefined, response.error?.message);
  return JSON.parse(response.result.content.find(item => item.type === "text").text);
}
async function rejects(c, name, args, pattern) {
  const result = await c.call(name, args);
  assert.ok(result.error, `Expected rejection: ${name}`);
  assert.match(result.error.message, pattern);
}

try {
  for (const transport of ["ndjson", "content-length"]) {
    const { home, skill } = await fixture(transport); const c = client(home, transport);
    try {
      const pid = c.child.pid;
      const initial = await c.request("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "persistent-fixture", version: "1" } });
      const toolList = (await c.request("tools/list")).result;
      const serverDigest = digest(await fs.readFile(path.join(home, "mcp-lite/server.mjs")));
      const first = body(await c.call("nero_design_route", { task: "Design a frontend UI", preferred_route: "frontend-ui" }));
      const routingPath = path.join(home, "mcp-lite/routing.mjs");
      const routing = await fs.readFile(routingPath, "utf8");
      assert.ok(routing.includes(JSON.stringify(first.fusion_scope)), "fixture locates the current public guidance literal");
      await fs.writeFile(routingPath, routing.replace(JSON.stringify(first.fusion_scope), JSON.stringify("Fixture updated NDT guidance")));
      const second = body(await c.call("nero_design_route", { task: "Design a frontend UI", preferred_route: "frontend-ui" }));
      // This fails against the pre-refactor server because its imported router stays cached.
      assert.equal(second.fusion_scope, "Fixture updated NDT guidance", "same connection must execute changed NDT code");
      assert.notEqual(second.ndt_revision.digest, first.ndt_revision.digest);
      await fs.appendFile(skill, "\nUpdated fixture task rule.\n");
      const third = body(await c.call("nero_design_route", { task: "Design a frontend UI", preferred_route: "frontend-ui" }));
      assert.notEqual(third.ndt_revision.digest, second.ndt_revision.digest, "rule update changes its independently reported revision");
      const catalogPath = path.join(home, "registry/design-team.json"); const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
      catalog.version = "fixture-catalog-next"; await fs.writeFile(catalogPath, JSON.stringify(catalog));
      const catalogResult = body(await c.call("nero_design_get_registry"));
      assert.equal(catalogResult.version, "fixture-catalog-next");
      assert.equal(catalogResult.mcp_server.version, "2.5.0");
      assert.notEqual(catalogResult.ndt_revision.digest, third.ndt_revision.digest);
      const runtimePath = path.join(home, "mcp-lite/ndt-runtime.mjs");
      const runtimeSource = await fs.readFile(runtimePath, "utf8");
      const runtimeChanged = runtimeSource.replace('mcp_server: { name: "nero-design-team", version }', 'mcp_server: { name: "nero-design-team", version: "fixture-backend-label" }');
      assert.notEqual(runtimeChanged, runtimeSource);
      await fs.writeFile(runtimePath, runtimeChanged);
      assert.equal(body(await c.call("nero_design_get_registry")).mcp_server.version, "2.5.0", "backend updates cannot relabel the running bridge");
      await fs.writeFile(runtimePath, runtimeSource);
      await rejects(c, "nero_design_get_registry", { use_case_tags: ["fixture-medium"] }, /use_case_tags/);
      const taxonomyPath = path.join(home, "registry/asset-taxonomy.json"); const taxonomy = JSON.parse(await fs.readFile(taxonomyPath, "utf8"));
      taxonomy.use_cases.push({ id: "fixture-medium", label: "Fixture medium" }); await fs.writeFile(taxonomyPath, JSON.stringify(taxonomy));
      body(await c.call("nero_design_get_registry", { use_case_tags: ["fixture-medium"], limit: 1 }));
      assert.equal(c.child.pid, pid); assert.equal(c.child.exitCode, null);
      assert.equal(initial.result.serverInfo.version, "2.5.0");
      assert.deepEqual((await c.request("tools/list")).result, toolList, "business changes do not change the tool catalog");
      assert.equal(digest(await fs.readFile(path.join(home, "mcp-lite/server.mjs"))), serverDigest);
      results.push(`${transport}: same PID/connection sees code, rule, catalog and taxonomy updates with unchanged interface`);

      await rejects(c, "not_a_tool", {}, /Unknown tool/);
      await rejects(c, "nero_design_build_tokens", { execute: "true" }, /boolean/);
      await rejects(c, "nero_design_route", { task: "Inspect", preferred_route: "not-a-route" }, /preferred_route/);
      await rejects(c, "nero_design_compile_report_figure", { action: "validate" }, /project_root/);
      const project = path.join(temp, `${transport}-project`); await fs.mkdir(project);
      await fs.writeFile(path.join(project, "spec.json"), "{}");
      await fs.writeFile(path.join(temp, "outside.json"), "{}");
      await rejects(c, "nero_design_compile_report_figure", { action: "validate", project_root: project, spec_path: "../outside.json" }, /contained|outside/);
      await rejects(c, "nero_design_compile_report_figure", { action: "compile", project_root: home, spec_path: "registry/design-team.json", output_path: "forbidden.svg" }, /NDT|canonical|outside/);
      const preview = body(await c.call("nero_design_compile_report_figure", { action: "compile", project_root: project, spec_path: "spec.json", output_path: "preview.svg" }));
      assert.equal(preview.execute, false); assert.equal(await fs.stat(path.join(project, "preview.svg")).then(() => true, () => false), false);
      await fs.writeFile(path.join(project, "project.json"), JSON.stringify({ route: "frontend-ui", template: "fixture", design_team_version: "fixture" }));
      const manifest = path.join(project, "production.json");
      await fs.writeFile(manifest, JSON.stringify({ route: "frontend-ui", artifact: "Contract check", project_manifest: "project.json", stage: "final_delivery", expected_outputs: [] }));
      const failedDelivery = body(await c.call("nero_design_production_check", { manifest_path: manifest, execute: true }));
      assert.equal(failedDelivery.final_delivery_ready, false); assert.notEqual(failedDelivery.readiness_status, "pass");
      await fs.writeFile(routingPath, `throw new Error("Fixture backend failure");\n${routing}`);
      await rejects(c, "nero_design_route", { task: "Inspect" }, /Fixture backend failure/);
      await fs.writeFile(routingPath, routing);
      body(await c.call("nero_design_get_registry"));
      assert.equal(c.child.pid, pid); assert.deepEqual((await c.request("tools/list")).result, toolList);
      results.push(`${transport}: parameter/path/dry-run/evidence failures and backend recovery retain their boundaries`);
    } finally { await c.close(); }
  }
  if (!legacy) {
    const { home } = await fixture("disconnect"); const c = client(home, "ndjson");
    const ready = path.join(temp, "worker-started"); const forbidden = path.join(temp, "orphan-write");
    const worker = path.join(home, "mcp-lite/ndt-worker.mjs");
    await fs.writeFile(worker, `import { spawn } from 'node:child_process';\nimport fs from 'node:fs';\nspawn(process.execPath, ['-e', ${JSON.stringify(`setTimeout(() => require('node:fs').writeFileSync(${JSON.stringify(forbidden)}, 'orphan'), 1800)`)}], { stdio: 'ignore' });\nfs.writeFileSync(${JSON.stringify(ready)}, 'ready');\nawait new Promise(resolve => setTimeout(resolve, 30000));\n`);
    try {
      const pending = c.call("nero_design_get_registry").catch(() => null);
      for (let i = 0; i < 100 && !(await fs.stat(ready).then(() => true, () => false)); i++) await delay(20);
      assert.equal(await fs.stat(ready).then(() => true, () => false), true, "test worker started its child");
      await c.close(); await pending; await delay(2000);
      assert.equal(await fs.stat(forbidden).then(() => true, () => false), false, "disconnect must stop owned workers and descendants");
      results.push("disconnect: owned worker descendants cannot continue writing after the bridge closes");
    } finally { await c.close(); }
  }
  console.log(JSON.stringify({ status: "pass", verification: "V2_bounded_persistent_connection_fixture", checks: results }, null, 2));
} finally {
  await fs.rm(temp, { recursive: true, force: true });
}
