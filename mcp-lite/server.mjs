// Long-lived protocol bridge. Do not import NDT business modules here.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { tools, version, validateTool } from "./tool-contract.mjs";

const workerPath = fileURLToPath(new URL("./ndt-worker.mjs", import.meta.url));
const transportModes = { contentLength: "content-length", ndjson: "ndjson" };
const activeWorkers = new Set();
const processGroups = process.platform !== "win32";

function cleanupWorker(record) {
  if (!activeWorkers.delete(record)) return;
  clearTimeout(record.timer);
  try {
    // detached POSIX workers own a new group; their script descendants inherit it.
    if (processGroups && record.worker.pid) process.kill(-record.worker.pid, "SIGKILL");
    else record.worker.kill("SIGKILL");
  } catch (error) {
    if (error.code !== "ESRCH") process.stderr.write(`NDT worker cleanup failed: ${error.message}\n`);
  }
}

function cleanupWorkers() {
  for (const record of activeWorkers) cleanupWorker(record);
}

process.once("exit", cleanupWorkers);
for (const [signal, code] of [["SIGTERM", 143], ["SIGINT", 130], ["SIGHUP", 129]]) {
  process.once(signal, () => { cleanupWorkers(); process.exit(code); });
}

async function callTool(name, args = {}) {
  validateTool(name, args);
  return new Promise((resolve, reject) => {
    const worker = spawn(process.execPath, [workerPath], {
      detached: processGroups, stdio: ["pipe", "pipe", "pipe"]
    });
    const record = { worker, timer: null };
    activeWorkers.add(record);
    let failure = null;
    let outputBytes = 0;
    const stdout = [];
    const stderr = [];
    const abort = (message) => { failure ||= message; cleanupWorker(record); };
    record.timer = setTimeout(() => abort("timeout after 120000 ms"), 120000);
    const collect = (chunks) => (chunk) => {
      outputBytes += chunk.length;
      if (outputBytes > 16 * 1024 * 1024) { abort("output exceeds 16 MiB"); return; }
      chunks.push(chunk);
    };
    worker.stdout.on("data", collect(stdout));
    worker.stderr.on("data", collect(stderr));
    worker.stdout.on("error", (error) => abort(error.message));
    worker.stderr.on("error", (error) => abort(error.message));
    worker.once("error", (error) => abort(error.message));
    // Do not wait for close: inherited descendant pipes can keep that event pending.
    worker.once("exit", () => cleanupWorker(record));
    worker.once("close", (code, signal) => {
      cleanupWorker(record);
      if (failure || code !== 0) {
        const detail = Buffer.concat(stderr).toString("utf8").trim().slice(0, 2000);
        reject(new Error(`NDT worker failed: ${failure || signal || `exit ${code}`}${detail ? `; ${detail}` : ""}`));
        return;
      }
      try {
        const response = JSON.parse(Buffer.concat(stdout).toString("utf8"));
        if (response.ok !== true) throw new Error(response.error || "Invalid NDT worker result");
        if (!response.result || typeof response.result !== "object" || !response.result.ndt_revision?.digest) throw new Error("Missing NDT worker result or revision");
        // The running bridge, not a newly loaded backend, owns this identity.
        if (name === "nero_design_get_registry") response.result.mcp_server = { name: "nero-design-team", version };
        resolve(response.result);
      } catch (error) { reject(error); }
    });
    worker.stdin.on("error", () => { /* close reports early worker exit. */ });
    worker.stdin.end(JSON.stringify({ name, arguments: args }));
  });
}

function jsonTextResult(value) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

async function handleMessage(message) {
  if (message.method === "initialize") {
    return {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "nero-design-team-mcp-lite", version }
    };
  }
  if (message.method === "tools/list") {
    return { tools };
  }
  if (message.method === "tools/call") {
    const result = await callTool(message.params?.name, message.params?.arguments ?? {});
    return jsonTextResult(result);
  }
  throw new Error(`Unsupported MCP method: ${message.method}`);
}

function writeMcpMessage(message) {
  const payload = Buffer.from(JSON.stringify(message), "utf8");
  process.stdout.write(`Content-Length: ${payload.length}\r\n\r\n`);
  process.stdout.write(payload);
}

function detectTransport(buffer) {
  if (!buffer.length) return null;
  const preview = buffer.toString("utf8", 0, Math.min(buffer.length, 64)).trimStart();
  if (!preview) return null;
  if (/^Content-Length:/i.test(preview)) return transportModes.contentLength;
  if ("content-length:".startsWith(preview.toLowerCase())) return transportModes.contentLength;
  if (preview.startsWith("{") || preview.startsWith("[")) return transportModes.ndjson;
  throw new Error("Unable to detect MCP transport from first request.");
}

function readContentLengthMessage(buffer) {
  const crlfHeaderEnd = buffer.indexOf("\r\n\r\n");
  const lfHeaderEnd = crlfHeaderEnd === -1 ? buffer.indexOf("\n\n") : -1;
  const headerEnd = crlfHeaderEnd !== -1 ? crlfHeaderEnd : lfHeaderEnd;
  if (headerEnd === -1) return null;
  const separatorLength = crlfHeaderEnd !== -1 ? 4 : 2;
  const header = buffer.slice(0, headerEnd).toString("utf8");
  const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);
  if (!lengthMatch) throw new Error("Missing Content-Length header.");
  const contentLength = Number(lengthMatch[1]);
  const messageStart = headerEnd + separatorLength;
  const messageEnd = messageStart + contentLength;
  if (buffer.length < messageEnd) return null;
  return {
    raw: buffer.slice(messageStart, messageEnd).toString("utf8"),
    rest: buffer.slice(messageEnd)
  };
}

function readNdjsonMessage(buffer) {
  const newlineIndex = buffer.indexOf("\n");
  if (newlineIndex === -1) return null;
  const rawLine = buffer.slice(0, newlineIndex).toString("utf8").replace(/\r$/, "");
  return {
    raw: rawLine,
    rest: buffer.slice(newlineIndex + 1)
  };
}

function writeMcpMessageForTransport(message, transport) {
  if (transport === transportModes.ndjson) {
    process.stdout.write(`${JSON.stringify(message)}\n`);
    return;
  }
  writeMcpMessage(message);
}

function dispatchMessage(message, transport) {
  if (!message || typeof message !== "object" || Array.isArray(message)) {
    writeMcpMessageForTransport({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid request" } }, transport);
    return;
  }
  if (message.id === undefined) return;
  handleMessage(message)
    .then((result) => {
      writeMcpMessageForTransport({ jsonrpc: "2.0", id: message.id, result }, transport);
    })
    .catch((error) => {
      writeMcpMessageForTransport({
        jsonrpc: "2.0",
        id: message.id,
        error: { code: -32000, message: error.message }
      }, transport);
    });
}

function startMcpServer() {
  const disconnect = () => { cleanupWorkers(); process.exit(0); };
  process.stdin.once("end", disconnect);
  process.stdin.once("close", disconnect);
  process.stdin.once("error", disconnect);
  process.stdout.once("error", () => { cleanupWorkers(); process.exit(1); });
  let buffer = Buffer.alloc(0);
  let transport = null;
  process.stdin.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      transport ||= detectTransport(buffer);
      const parsed = transport === transportModes.ndjson
        ? readNdjsonMessage(buffer)
        : readContentLengthMessage(buffer);
      if (!parsed) return;
      buffer = parsed.rest;
      if (!parsed.raw.trim()) continue;
      try {
        dispatchMessage(JSON.parse(parsed.raw), transport);
      } catch (error) {
        writeMcpMessageForTransport({ jsonrpc: "2.0", id: null, error: { code: -32700, message: error.message } }, transport);
      }
    }
  });
}

function usage() {
  return [
    "Usage:",
    "  node mcp-lite/server.mjs",
    "  node mcp-lite/server.mjs --list-tools",
    "  node mcp-lite/server.mjs --dry-run <tool-name> '<json-args>'",
    "",
    "This server has no external npm dependencies and does not register itself with Codex."
  ].join("\n");
}

async function main() {
  const [command, toolName, rawArgs] = process.argv.slice(2);
  if (command === "--help" || command === "-h") {
    console.log(usage());
    return;
  }
  if (command === "--list-tools") {
    console.log(JSON.stringify({ server: "nero-design-team-mcp-lite", version, tools }, null, 2));
    return;
  }
  if (command === "--dry-run") {
    if (!toolName) throw new Error("Missing tool name.");
    const args = rawArgs ? JSON.parse(rawArgs) : {};
    if (!args || typeof args !== "object" || Array.isArray(args)) {
      throw new Error("Tool arguments must be a JSON object.");
    }
    if (Object.hasOwn(args, "execute") && typeof args.execute !== "boolean") throw new Error("execute must be a boolean");
    if (args.execute === true) {
      throw new Error("--dry-run refuses execute=true; use MCP protocol for an explicitly authorized execution");
    }
    const result = await callTool(toolName, args);
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command) throw new Error(usage());
  startMcpServer();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
