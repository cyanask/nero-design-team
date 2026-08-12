import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function main() {
  const args = process.argv.slice(2);
  const rootFlag = args.indexOf("--ndt-root");
  let explicitRoot = null;
  if (rootFlag !== -1) {
    explicitRoot = args[rootFlag + 1];
    if (!explicitRoot) {
      throw new Error("--ndt-root requires a path");
    }
    args.splice(rootFlag, 2);
  }

  const ndtRoot = explicitRoot || process.env.NERO_DESIGN_TEAM_HOME;
  if (!ndtRoot) {
    throw new Error("Set NERO_DESIGN_TEAM_HOME or pass --ndt-root <path>");
  }

  const cliPath = path.resolve(ndtRoot, "scripts", "report-figure-compiler.mjs");
  if (!fs.existsSync(cliPath)) {
    throw new Error(`NDT Figure Compiler CLI not found: ${cliPath}`);
  }

  const result = spawnSync(process.execPath, [cliPath, ...args], {
    stdio: "inherit"
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
