import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const digest = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
async function files(dir) {
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if ([".DS_Store", "__pycache__"].includes(entry.name)) continue;
    if (entry.isSymbolicLink()) throw new Error(`Symlink is not a Skill sync target: ${path.join(dir, entry.name)}`);
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await files(target));
    else if (entry.isFile()) result.push(target);
  }
  return result.sort();
}

export async function planSkillSync(home, includeRuntime = false) {
  const registry = JSON.parse(await fs.readFile(path.join(home, "registry/design-team.json"), "utf8"));
  const source = path.join(home, registry.registry_profile === "private_canonical" ? "skill-source/nero-design-team" : "skills/nero-design-team");
  const pairs = (await files(path.join(home, "rules"))).map(destination => ({
    source: path.join(source, "references", path.relative(path.join(home, "rules"), destination)), destination,
    backup_name: path.join("rules", path.relative(path.join(home, "rules"), destination))
  }));
  if (includeRuntime) {
    const runtime = registry.skill_distribution?.runtime;
    if (!runtime) throw new Error("No configured installed Skill path");
    const sourceFiles = await files(source);
    const relative = new Set(sourceFiles.map(file => path.relative(source, file)));
    for (const file of await files(runtime)) {
      if (!relative.has(path.relative(runtime, file))) throw new Error(`Runtime-local file needs review: ${file}`);
    }
    pairs.push(...sourceFiles.map(file => ({ source: file, destination: path.join(runtime, path.relative(source, file)),
      backup_name: path.join("runtime", path.relative(source, file)) })));
  }
  const plan = [];
  for (const pair of pairs) {
    if ((await fs.lstat(pair.source)).isSymbolicLink()) throw new Error(`Symlink source needs review: ${pair.source}`);
    const bytes = await fs.readFile(pair.source);
    let previous = null;
    try {
      if ((await fs.lstat(pair.destination)).isSymbolicLink()) throw new Error(`Symlink target needs review: ${pair.destination}`);
      previous = await fs.readFile(pair.destination);
    } catch (error) { if (error.code !== "ENOENT") throw error; }
    if (previous?.equals(bytes)) continue;
    plan.push({ ...pair, before: previous === null ? null : digest(previous), after: digest(bytes) });
  }
  return plan;
}

async function main() {
  const args = process.argv.slice(2);
  const backupIndex = args.indexOf("--backup");
  const backup = backupIndex < 0 ? null : args[backupIndex + 1];
  const recognized = args.filter((_, index) => index !== backupIndex + 1 || backupIndex < 0);
  if (recognized.some(arg => !["--runtime", "--write", "--backup"].includes(arg))) throw new Error("Usage: sync-skill.mjs [--runtime] [--write --backup <new-directory>]");
  const plan = await planSkillSync(root, args.includes("--runtime"));
  if (args.includes("--write") && plan.length) {
    if (!backup) throw new Error("--write requires --backup <new-directory>");
    await fs.mkdir(path.resolve(backup), { recursive: false });
    // Back up every destination and pin source/target bytes before the first write.
    for (const entry of plan) {
      if (digest(await fs.readFile(entry.source)) !== entry.after) throw new Error(`Source changed during sync: ${entry.source}`);
      let before = null;
      try { before = await fs.readFile(entry.destination); } catch (error) { if (error.code !== "ENOENT") throw error; }
      if ((before === null ? null : digest(before)) !== entry.before) throw new Error(`Target changed during sync: ${entry.destination}`);
      if (before !== null) {
        const file = path.join(path.resolve(backup), entry.backup_name);
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, before, { flag: "wx" });
      }
    }
    await fs.writeFile(path.join(path.resolve(backup), "plan.json"), JSON.stringify(plan, null, 2) + "\n", { flag: "wx" });
    for (const entry of plan) {
      const bytes = await fs.readFile(entry.source);
      if (digest(bytes) !== entry.after) throw new Error(`Source changed before write: ${entry.source}`);
      let current = null;
      try { current = await fs.readFile(entry.destination); } catch (error) { if (error.code !== "ENOENT") throw error; }
      if ((current === null ? null : digest(current)) !== entry.before) throw new Error(`Target changed before write: ${entry.destination}`);
      await fs.mkdir(path.dirname(entry.destination), { recursive: true });
      await fs.writeFile(entry.destination, bytes);
    }
  }
  console.log(JSON.stringify({ status: plan.length && !args.includes("--write") ? "drift" : "pass", changed: plan.length, files: plan }, null, 2));
  if (plan.length && !args.includes("--write")) process.exitCode = 1;
}
if (process.argv[1] && await fs.realpath(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
