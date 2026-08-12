import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generator = path.join(root, "scripts", "nero-design.mjs");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ndt-preset-test-"));

try {
  const result = spawnSync(process.execPath, [
    generator,
    "new",
    "ai-image-generation",
    "--preset",
    "留白杂志风",
    "--name",
    "sample-alias",
    "--out",
    tempDir
  ], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`registered preset failed:\n${result.stdout}\n${result.stderr}`);
  }

  const projectRoot = path.join(tempDir, "sample-alias");
  const manifest = JSON.parse(await fs.readFile(path.join(projectRoot, ".nero-design", "manifest.json"), "utf8"));
  if (manifest.route !== "ai-image-generation" || manifest.preset !== "minimal-zine-editorial") {
    throw new Error(`unexpected manifest route/preset: ${manifest.route}/${manifest.preset}`);
  }
  for (const file of ["brief-template.json", "prompt.md", "qa-manifest.example.json", "overlay-template.html"]) {
    await fs.access(path.join(projectRoot, file));
  }
  await fs.access(path.join(projectRoot, "theme", "nero-tokens.css"));

  const legacy = spawnSync(process.execPath, [
    generator,
    "new",
    "ai-image-generation",
    "--preset",
    "minimal-zine-editorial",
    "--name",
    "sample-legacy",
    "--out",
    tempDir
  ], { cwd: root, encoding: "utf8" });
  if (legacy.status !== 0) {
    throw new Error(`legacy preset id failed:\n${legacy.stdout}\n${legacy.stderr}`);
  }
  const legacyManifest = JSON.parse(await fs.readFile(path.join(tempDir, "sample-legacy", ".nero-design", "manifest.json"), "utf8"));
  if (legacyManifest.preset !== "minimal-zine-editorial") {
    throw new Error(`legacy preset id did not remain canonical: ${legacyManifest.preset}`);
  }

  const invalid = spawnSync(process.execPath, [
    generator,
    "new",
    "ai-image-generation",
    "--preset",
    "not-registered",
    "--name",
    "invalid",
    "--out",
    tempDir
  ], { cwd: root, encoding: "utf8" });
  if (invalid.status === 0 || !invalid.stderr.includes("Unsupported preset: not-registered")) {
    throw new Error("unknown preset was not rejected through the public generator seam");
  }

  const initWithPreset = spawnSync(process.execPath, [
    generator,
    "init",
    "ai-image-generation",
    "--project-root",
    tempDir,
    "--preset",
    "minimal-zine-editorial"
  ], { cwd: root, encoding: "utf8" });
  if (initWithPreset.status === 0 || !initWithPreset.stderr.includes("--preset is only supported by the new command")) {
    throw new Error("init accepted a preset without copying its template files");
  }

  console.log("PASS generator maps 留白杂志风 to minimal-zine-editorial, keeps the legacy id, rejects unknown presets, and blocks preset-only init state");
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}
