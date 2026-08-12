import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validator = path.join(root, "scripts", "visual-qa.mjs");
const passingFixture = path.join(root, "scripts", "sample-minimal-zine-visual-qa-manifest.json");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ndt-minimal-zine-qa-"));

try {
  const pass = spawnSync(process.execPath, [validator, passingFixture], { cwd: root, encoding: "utf8" });
  if (pass.status !== 0) {
    throw new Error(`passing fixture failed:\n${pass.stdout}\n${pass.stderr}`);
  }

  const failingManifest = JSON.parse(await fs.readFile(passingFixture, "utf8"));
  failingManifest.minimalZine.thumbnailReview.anchorVisible = false;
  failingManifest.minimalZine.regeneration.attempts = 2;
  failingManifest.minimalZine.generatedExactTextUsed = true;
  const failingFixture = path.join(tempDir, "failing.json");
  await fs.writeFile(failingFixture, `${JSON.stringify(failingManifest, null, 2)}\n`, "utf8");
  const fail = spawnSync(process.execPath, [validator, failingFixture], { cwd: root, encoding: "utf8" });
  if (fail.status === 0) {
    throw new Error("failing fixture unexpectedly passed");
  }
  for (const expected of [
    "FAIL minimal-zine anchor visible at thumbnail scale",
    "FAIL minimal-zine automatic regeneration limit",
    "FAIL minimal-zine exact text stays outside generated raster"
  ]) {
    if (!fail.stdout.includes(expected)) {
      throw new Error(`missing red-capable failure: ${expected}`);
    }
  }

  console.log("PASS minimal-zine QA accepts the registered contract and rejects three critical boundary failures");
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}
