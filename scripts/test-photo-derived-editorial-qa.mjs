import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validator = path.join(root, "scripts", "visual-qa.mjs");
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ndt-photo-derived-qa-"));
const passingManifest = {
  width: 1200,
  height: 1500,
  stylePreset: "photo-derived-editorial-diptych",
  colors: ["#F3F0E8", "#26364A", "#B86F4B"],
  contrastPairs: [{ id: "title", foreground: "#26364A", background: "#F3F0E8" }],
  textBlocks: [{ id: "main-title", text: "Crossing Quiet Water", x: 80, y: 1180, w: 800, h: 160, fontSize: 48, lineHeight: 1.2 }],
  photoDerivedEditorial: {
    sourceOrientation: "landscape",
    photoAreaRatio: 0.52,
    panelAreaRatio: 0.48,
    motifWidthRatio: 0.42,
    cleanSpaceRatio: 0.72,
    photoPixelsPreserved: true,
    generatedPanelOnly: true,
    generatedExactTextUsed: false,
    exactTextOverlayDeterministic: true,
    panelBackgroundUniform: true,
    paletteSourceOnly: true,
    extraElements: [],
    cropContract: { mode: "none" },
    primaryMarkFamily: "horizontal-lines",
    supportingMarkFamilies: ["small-circles"],
    relationTrace: [
      { id: "r1", sourceFact: "bridge axis", photoRegion: "middle", relationType: "direction", preservedAs: "line", markFamily: "horizontal-lines" },
      { id: "r2", sourceFact: "two people", photoRegion: "right", relationType: "count", preservedAs: "pair", markFamily: "small-circles" },
      { id: "r3", sourceFact: "water interval", photoRegion: "lower", relationType: "spacing", preservedAs: "gap", markFamily: "horizontal-lines" }
    ],
    regeneration: { attempts: 0, outcome: "not-required" }
  }
};

try {
  const passingPath = path.join(tempDir, "passing.json");
  await fs.writeFile(passingPath, `${JSON.stringify(passingManifest, null, 2)}\n`, "utf8");
  const pass = spawnSync(process.execPath, [validator, passingPath], { cwd: root, encoding: "utf8" });
  if (pass.status !== 0) throw new Error(`passing fixture failed:\n${pass.stdout}\n${pass.stderr}`);

  const failing = structuredClone(passingManifest);
  failing.photoDerivedEditorial.relationTrace = failing.photoDerivedEditorial.relationTrace.slice(0, 2);
  failing.photoDerivedEditorial.photoPixelsPreserved = false;
  failing.photoDerivedEditorial.generatedExactTextUsed = true;
  failing.photoDerivedEditorial.regeneration.attempts = 2;
  const failingPath = path.join(tempDir, "failing.json");
  await fs.writeFile(failingPath, `${JSON.stringify(failing, null, 2)}\n`, "utf8");
  const fail = spawnSync(process.execPath, [validator, failingPath], { cwd: root, encoding: "utf8" });
  if (fail.status === 0) throw new Error("failing fixture unexpectedly passed");
  for (const expected of [
    "FAIL photo-derived original photo layer is preserved",
    "FAIL photo-derived exact text stays outside generated raster",
    "FAIL photo-derived relation trace has 3-6 facts",
    "FAIL photo-derived automatic regeneration limit"
  ]) {
    if (!fail.stdout.includes(expected)) throw new Error(`missing red-capable failure: ${expected}`);
  }
  console.log("PASS photo-derived QA accepts the public contract and rejects source, relation-trace, text-layer, and retry boundary failures");
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}
