import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const skillSource = path.join(root, "skills", "nero-design-team");
const skillTarget = path.join(codexHome, "skills", "nero-design-team");
const force = process.argv.includes("--force");

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function rewriteInstalledPaths(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await rewriteInstalledPaths(target);
    } else if (/\.(md|json|yaml|yml)$/.test(entry.name)) {
      const text = await fs.readFile(target, "utf8");
      const next = text
        .replaceAll("$NERO_DESIGN_TEAM_HOME", root)
        .replaceAll("$CODEX_HOME", codexHome);
      await fs.writeFile(target, next, "utf8");
    }
  }
}

if ((await exists(skillTarget)) && !force) {
  console.error(`Skill already exists: ${skillTarget}`);
  console.error("Re-run with --force to overwrite it.");
  process.exit(1);
}

await fs.mkdir(path.dirname(skillTarget), { recursive: true });
await fs.cp(skillSource, skillTarget, {
  recursive: true,
  force,
  errorOnExist: !force,
});
await rewriteInstalledPaths(skillTarget);

console.log(
  JSON.stringify(
    {
      installed: true,
      design_team_home: root,
      codex_home: codexHome,
      skill_target: skillTarget,
      next_steps: [
        "Add AGENTS.template.md to your global or project AGENTS.md.",
        "Run: node doctor.mjs",
        "Optional MCP command: node mcp-lite/server.mjs --list-tools",
      ],
    },
    null,
    2
  )
);
