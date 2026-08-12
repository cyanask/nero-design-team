#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const core = join(workspaceRoot, "tools", "runtime", "report-figure-compiler", "cli.py");
const args = process.argv.slice(2);

if (!existsSync(core)) {
  process.stderr.write(`Figure Compiler core is missing: ${core}\n`);
  process.exit(2);
}

const command = args[0];
const renderer = resolveRenderer(args);
const requiresPillow = command === "compile" && renderer === "raster-canvas-png";
const candidates = pythonCandidates();
const failures = [];
let selected = null;

for (const candidate of candidates) {
  const probeRenderer = requiresPillow ? "raster-canvas-png" : "vector-svg";
  const probe = spawnSync(candidate, [core, "probe", "--renderer", probeRenderer], {
    encoding: "utf8",
    env: process.env,
    timeout: 10000,
  });
  if (probe.status === 0) {
    selected = candidate;
    break;
  }
  const detail = (probe.stderr || probe.error?.message || `exit ${probe.status}`).trim();
  failures.push(`${candidate}: ${detail}`);
}

if (!selected) {
  const need = requiresPillow ? "a Python runtime with Pillow" : "a Python 3 runtime able to import the compiler core";
  process.stderr.write(`Figure Compiler could not find ${need}.\n${failures.join("\n")}\n`);
  process.exit(3);
}

const result = spawnSync(selected, [core, ...args], {
  stdio: "inherit",
  env: process.env,
});
if (result.error) {
  process.stderr.write(`Figure Compiler failed to start ${selected}: ${result.error.message}\n`);
  process.exit(2);
}
process.exit(result.status ?? 2);

function pythonCandidates() {
  const ordered = [];
  if (process.env.NERO_FIGURE_PYTHON) ordered.push(process.env.NERO_FIGURE_PYTHON);
  ordered.push("python3");
  const discovered = spawnSync("which", ["-a", "python3"], { encoding: "utf8" });
  if (discovered.status === 0) {
    ordered.push(...discovered.stdout.split(/\r?\n/).map((value) => value.trim()).filter(Boolean));
  }
  const bundled = [
    join(workspaceRoot, "tools", "runtime", "report-figure-compiler", ".venv", "bin", "python3"),
    join(workspaceRoot, "tools", "runtime", "python", "bin", "python3"),
    join(workspaceRoot, ".venv", "bin", "python3"),
  ];
  ordered.push(...bundled.filter((candidate) => existsSync(candidate)));
  return [...new Set(ordered)];
}

function resolveRenderer(argv) {
  const explicit = optionValue(argv, "--renderer");
  if (explicit) return explicit;
  const specPath = optionValue(argv, "--spec");
  if (!specPath) return null;
  try {
    const parsed = JSON.parse(readFileSync(resolve(specPath), "utf8"));
    return typeof parsed.renderer === "string" ? parsed.renderer : null;
  } catch {
    return null;
  }
}

function optionValue(argv, option) {
  const index = argv.indexOf(option);
  if (index >= 0 && index + 1 < argv.length) return argv[index + 1];
  const assignment = argv.find((value) => value.startsWith(`${option}=`));
  return assignment ? assignment.slice(option.length + 1) : null;
}
