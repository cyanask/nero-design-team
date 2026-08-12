import assert from "node:assert/strict";
import fs from "node:fs";
import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";

const timeoutMs = 5000;
const mcpRoot = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(mcpRoot, "server.mjs");
const assetCatalog = JSON.parse(fs.readFileSync(path.join(mcpRoot, "..", "registry", "design-assets.json"), "utf8"));
const expectedAssetCount = Array.isArray(assetCatalog.assets) ? assetCatalog.assets.length : 0;
const expectedOpenIntegrityIssues = Array.isArray(assetCatalog.integrity_issues)
  ? assetCatalog.integrity_issues.filter((issue) => issue.status === "open").length
  : 0;
const configFlagIndex = process.argv.indexOf("--codex-config");
const configPath = configFlagIndex === -1 ? null : process.argv[configFlagIndex + 1];

function parseRegisteredLaunch(filePath) {
  assert.ok(filePath, "--codex-config requires a config path");
  const source = fs.readFileSync(filePath, "utf8");
  const header = "[mcp_servers.nero_design_team]";
  const start = source.indexOf(header);
  assert.notEqual(start, -1, "nero_design_team registration is missing");
  const remainder = source.slice(start + header.length);
  const nextSection = remainder.search(/\n\s*\[/);
  const section = nextSection === -1 ? remainder : remainder.slice(0, nextSection);
  const commandMatch = section.match(/^\s*command\s*=\s*("(?:[^"\\]|\\.)*")\s*$/m);
  const argsMatch = section.match(/^\s*args\s*=\s*(\[[^\n]*\])\s*$/m);
  assert.ok(commandMatch, "nero_design_team command is missing");
  assert.ok(argsMatch, "nero_design_team args are missing");
  const command = JSON.parse(commandMatch[1]);
  const args = JSON.parse(argsMatch[1]);
  assert.equal(typeof command, "string");
  assert.ok(Array.isArray(args));
  return { command, args, label: `${command} ${args.join(" ")}` };
}

const launch = configPath
  ? parseRegisteredLaunch(configPath)
  : { command: process.execPath, args: [serverPath], label: `${process.execPath} ${serverPath}` };

function withTimeout(promise, label) {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function spawnServer() {
  const child = spawn(launch.command, launch.args, {
    stdio: ["pipe", "pipe", "pipe"]
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  return { child, getStderr: () => stderr.trim() };
}

async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    once(child, "exit").catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, 250))
  ]);
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGKILL");
  await once(child, "exit").catch(() => undefined);
}

function sendContentLength(stdin, message) {
  const payload = Buffer.from(JSON.stringify(message), "utf8");
  stdin.write(`Content-Length: ${payload.length}\r\n\r\n`);
  stdin.write(payload);
}

function sendNdjson(stdin, message) {
  stdin.write(`${JSON.stringify(message)}\n`);
}

function readContentLengthMessage(stream, state, stderr, label) {
  return withTimeout(new Promise((resolve, reject) => {
    const tryRead = () => {
      const headerEnd = state.buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) return false;
      const header = state.buffer.slice(0, headerEnd).toString("utf8");
      const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);
      if (!lengthMatch) {
        reject(new Error(`${label} missing Content-Length header.\n${stderr()}`.trim()));
        return true;
      }
      const contentLength = Number(lengthMatch[1]);
      const messageStart = headerEnd + 4;
      const messageEnd = messageStart + contentLength;
      if (state.buffer.length < messageEnd) return false;
      const raw = state.buffer.slice(messageStart, messageEnd).toString("utf8");
      state.buffer = state.buffer.slice(messageEnd);
      resolve(JSON.parse(raw));
      return true;
    };

    const onData = (chunk) => {
      state.buffer = Buffer.concat([state.buffer, chunk]);
      try {
        if (tryRead()) cleanup();
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const onEnd = () => {
      cleanup();
      reject(new Error(`${label} stdout ended unexpectedly.\n${stderr()}`.trim()));
    };
    const cleanup = () => {
      stream.off("data", onData);
      stream.off("error", onError);
      stream.off("end", onEnd);
    };

    try {
      if (tryRead()) {
        cleanup();
        return;
      }
    } catch (error) {
      cleanup();
      reject(error);
      return;
    }
    stream.on("data", onData);
    stream.on("error", onError);
    stream.on("end", onEnd);
  }), label);
}

function readNdjsonMessage(stream, state, stderr, label) {
  return withTimeout(new Promise((resolve, reject) => {
    const tryRead = () => {
      const newlineIndex = state.buffer.indexOf("\n");
      if (newlineIndex === -1) return false;
      const rawLine = state.buffer.slice(0, newlineIndex).replace(/\r$/, "");
      state.buffer = state.buffer.slice(newlineIndex + 1);
      if (!rawLine.trim()) return tryRead();
      resolve(JSON.parse(rawLine));
      return true;
    };

    const onData = (chunk) => {
      state.buffer += chunk;
      try {
        if (tryRead()) cleanup();
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const onEnd = () => {
      cleanup();
      reject(new Error(`${label} stdout ended unexpectedly.\n${stderr()}`.trim()));
    };
    const cleanup = () => {
      stream.off("data", onData);
      stream.off("error", onError);
      stream.off("end", onEnd);
    };

    try {
      if (tryRead()) {
        cleanup();
        return;
      }
    } catch (error) {
      cleanup();
      reject(error);
      return;
    }
    stream.on("data", onData);
    stream.on("error", onError);
    stream.on("end", onEnd);
  }), label);
}

function assertToolList(response, label) {
  const tools = response?.result?.tools;
  assert.ok(Array.isArray(tools), `${label} should return a tools array`);
  assert.equal(tools.length, 12, `${label} should expose 12 tools`);
  const names = tools.map((tool) => tool.name);
  assert.ok(names.includes("nero_design_route"), `${label} should include nero_design_route`);
  assert.ok(names.includes("nero_design_get_registry"), `${label} should include nero_design_get_registry`);
  assert.ok(names.includes("nero_design_compile_report_figure"), `${label} should include nero_design_compile_report_figure`);
  assert.ok(names.includes("nero_design_production_check"), `${label} should include nero_design_production_check`);
}

function assertPptRoute(response, label) {
  const text = response?.result?.content?.[0]?.text;
  assert.equal(typeof text, "string", `${label} should return JSON text content`);
  const route = JSON.parse(text);
  assert.equal(route.route, "ppt", `${label} should classify the task as ppt`);
  assert.equal(route.primary_engine, "Presentations", `${label} should route formal PPTX to Presentations`);
  assert.equal(route.routing_order?.[0], "nero-design-team Skill classification", `${label} should keep Skill-first routing`);
  assert.equal(route.controller_boundary?.cross_system_controller, "GPT Work", `${label} should keep GPT Work as cross-system controller`);
  assert.equal(route.controller_boundary?.autonomous_downstream_calls, false, `${label} should block autonomous downstream calls`);
}

function assertTemplateRegistry(response, label) {
  const text = response?.result?.content?.[0]?.text;
  assert.equal(typeof text, "string", `${label} should return JSON text content`);
  const result = JSON.parse(text);
  assert.equal(result.templates?.[0]?.template, "pptx-deck", `${label} should return the PPT template`);
  assert.equal(result.unregistered_dirs.includes("presentation-production-chain"), false, `${label} should not misclassify a registered template`);
}

function assertDesignRegistry(response, label) {
  const text = response?.result?.content?.[0]?.text;
  assert.equal(typeof text, "string", `${label} should return JSON text content`);
  const result = JSON.parse(text);
  assert.equal(result.registry_id, "nero-design-team", `${label} should return the NDT Registry`);
  const expectedAuthority = result.registry_profile === "private_canonical";
  assert.equal(result.authoritative, expectedAuthority, `${label} should preserve the Registry profile's authority boundary`);
  assert.equal(result.asset_catalog?.assets, expectedAssetCount, `${label} should derive the asset count from the active Registry`);
  assert.equal(result.asset_catalog?.open_integrity_issues, expectedOpenIntegrityIssues, `${label} should derive open integrity issues from the active Registry`);
}

async function runContentLengthSmoke() {
  const { child, getStderr } = spawnServer();
  const state = { buffer: Buffer.alloc(0) };
  try {
    sendContentLength(child.stdin, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "smoke-test", version: "1.0.0" } }
    });
    const initializeResponse = await readContentLengthMessage(child.stdout, state, getStderr, "content-length initialize");
    assert.equal(initializeResponse?.result?.protocolVersion, "2024-11-05");

    sendContentLength(child.stdin, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {}
    });
    const toolsResponse = await readContentLengthMessage(child.stdout, state, getStderr, "content-length tools/list");
    assertToolList(toolsResponse, "content-length tools/list");

    sendContentLength(child.stdin, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "nero_design_route",
        arguments: { task: "制作正式投行PPTX" }
      }
    });
    const routeResponse = await readContentLengthMessage(child.stdout, state, getStderr, "content-length tools/call");
    assertPptRoute(routeResponse, "content-length tools/call");

    sendContentLength(child.stdin, {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "nero_design_list_templates", arguments: { route: "ppt" } }
    });
    const templateResponse = await readContentLengthMessage(child.stdout, state, getStderr, "content-length template registry");
    assertTemplateRegistry(templateResponse, "content-length template registry");

    sendContentLength(child.stdin, {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: { name: "nero_design_get_registry", arguments: {} }
    });
    const registryResponse = await readContentLengthMessage(child.stdout, state, getStderr, "content-length design registry");
    assertDesignRegistry(registryResponse, "content-length design registry");
    console.log("content-length smoke ok");
  } finally {
    child.stdin.end();
    await stopChild(child);
  }
}

async function runNdjsonSmoke() {
  const { child, getStderr } = spawnServer();
  const state = { buffer: "" };
  child.stdout.setEncoding("utf8");
  try {
    sendNdjson(child.stdin, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "smoke-test", version: "1.0.0" } }
    });
    const initializeResponse = await readNdjsonMessage(child.stdout, state, getStderr, "ndjson initialize");
    assert.equal(initializeResponse?.result?.protocolVersion, "2024-11-05");

    sendNdjson(child.stdin, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {}
    });
    const toolsResponse = await readNdjsonMessage(child.stdout, state, getStderr, "ndjson tools/list");
    assertToolList(toolsResponse, "ndjson tools/list");

    sendNdjson(child.stdin, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "nero_design_route",
        arguments: { task: "制作正式投行PPTX" }
      }
    });
    const routeResponse = await readNdjsonMessage(child.stdout, state, getStderr, "ndjson tools/call");
    assertPptRoute(routeResponse, "ndjson tools/call");

    sendNdjson(child.stdin, {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "nero_design_list_templates", arguments: { route: "ppt" } }
    });
    const templateResponse = await readNdjsonMessage(child.stdout, state, getStderr, "ndjson template registry");
    assertTemplateRegistry(templateResponse, "ndjson template registry");

    sendNdjson(child.stdin, {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: { name: "nero_design_get_registry", arguments: {} }
    });
    const registryResponse = await readNdjsonMessage(child.stdout, state, getStderr, "ndjson design registry");
    assertDesignRegistry(registryResponse, "ndjson design registry");
    console.log("ndjson smoke ok");
  } finally {
    child.stdin.end();
    await stopChild(child);
  }
}

await runContentLengthSmoke();
await runNdjsonSmoke();
if (configPath) console.log(`registered command smoke ok: ${launch.label}`);
