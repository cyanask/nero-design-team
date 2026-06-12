import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

const requiredDirs = [
  "skills/nero-design-team",
  "rules",
  "tokens",
  "templates",
  "scripts",
  "mcp-lite",
  "registry",
  "case-library/snapshots",
  "scorecards",
  "brand",
];

const requiredFiles = [
  "README.md",
  "AGENTS.template.md",
  "LICENSE-NOTES.md",
  "skills/nero-design-team/SKILL.md",
  "registry/design-team.json",
  "scripts/build-tokens.mjs",
  "scripts/nero-design.mjs",
  "mcp-lite/server.mjs",
  "case-library/snapshots/index.json",
];

async function exists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const missingDirs = [];
  for (const dir of requiredDirs) {
    if (!(await exists(dir))) missingDirs.push(dir);
  }

  const missingFiles = [];
  for (const file of requiredFiles) {
    if (!(await exists(file))) missingFiles.push(file);
  }

  const build = spawnSync(process.execPath, ["scripts/build-tokens.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  const mcp = spawnSync(process.execPath, ["mcp-lite/server.mjs", "--list-tools"], {
    cwd: root,
    encoding: "utf8",
  });

  const report = {
    root,
    missingDirs,
    missingFiles,
    tokenBuild: {
      status: build.status === 0 ? "pass" : "fail",
      stderr: build.status === 0 ? "" : build.stderr.trim(),
    },
    mcpListTools: {
      status: mcp.status === 0 ? "pass" : "fail",
      stderr: mcp.status === 0 ? "" : mcp.stderr.trim(),
    },
  };

  console.log(JSON.stringify(report, null, 2));
  if (missingDirs.length || missingFiles.length || build.status !== 0 || mcp.status !== 0) {
    process.exit(1);
  }
}

await main();
