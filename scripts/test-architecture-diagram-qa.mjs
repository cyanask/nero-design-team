import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const qaScript = path.join(root, "scripts", "visual-qa.mjs");

function baseManifest(sourceKind = "fresh") {
  return {
    route: "architecture-diagram-redraw",
    width: 1600,
    height: 900,
    colors: ["#f7f4ed", "#17313b", "#b5523a"],
    textBlocks: [],
    contrastPairs: [],
    charts: [],
    architectureDiagram: {
      question: "系统事实如何经过门禁成为交付物？",
      authoritySource: "registry/system.json",
      evidenceStatus: "verified",
      asOf: "2026-08-12",
      selectedGrammar: "architecture",
      audience: "mixed",
      detailPosture: "balanced",
      complexityDecision: "within_budget",
      behaviorLoadBearing: true,
      semanticPattern: "secure_paved_road",
      stableIdsVerified: true,
      connectorDirectionVerified: true,
      localCjkFontResolved: true,
      noTextOrConnectorCollisions: true,
      criticalMeaningNotColorOnly: true,
      staticQaStatus: "pass",
      perceptualReviewStatus: "not_run",
      outputCarrier: "svg",
      svgAccessibleNameResolved: true,
      svgDescriptionPresent: true,
      sourceKind
    }
  };
}

async function run(manifest) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "ndt-architecture-qa-"));
  const manifestPath = path.join(directory, "manifest.json");
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return spawnSync(process.execPath, [qaScript, manifestPath], { encoding: "utf8" });
}

const fresh = await run(baseManifest());
if (fresh.status !== 0) throw new Error(`fresh architecture QA failed:\n${fresh.stdout}\n${fresh.stderr}`);

const layoutOnlyManifest = baseManifest();
layoutOnlyManifest.architectureDiagram.behaviorLoadBearing = false;
delete layoutOnlyManifest.architectureDiagram.semanticPattern;
const layoutOnly = await run(layoutOnlyManifest);
if (layoutOnly.status !== 0) throw new Error(`layout-only architecture QA failed:\n${layoutOnly.stdout}\n${layoutOnly.stderr}`);

const redrawManifest = baseManifest("mermaid");
Object.assign(redrawManifest.architectureDiagram, {
  sourceSha256: "a".repeat(64),
  untrustedInertSource: true,
  sourceExecuted: false,
  sourceLinksFollowed: false,
  fidelityLedger: {
    sourceCounts: { nodes: 4, edges: 3 },
    accountedCounts: { nodes: 4, edges: 3 },
    kept: ["a", "b", "c", "d"],
    merged: [],
    dropped: [],
    relabelled: [],
    correctedRelationships: [],
    unresolved: [],
    authorityBackedCorrections: true
  }
});
const redraw = await run(redrawManifest);
if (redraw.status !== 0) throw new Error(`redraw architecture QA failed:\n${redraw.stdout}\n${redraw.stderr}`);

const invalidManifest = structuredClone(redrawManifest);
invalidManifest.architectureDiagram.fidelityLedger.accountedCounts.edges = 2;
invalidManifest.architectureDiagram.sourceLinksFollowed = true;
invalidManifest.architectureDiagram.semanticPattern = "architecture";
const invalid = await run(invalidManifest);
if (invalid.status === 0) throw new Error("invalid redraw unexpectedly passed");
if (!invalid.stdout.includes("FAIL redraw source links were not followed")) throw new Error("redraw trust-boundary failure was not detected");
if (!invalid.stdout.includes("FAIL redraw fidelity ledger accounts for every source edge")) throw new Error("redraw ledger coverage failure was not detected");
if (!invalid.stdout.includes("FAIL architecture semantic pattern is registered")) throw new Error("semantic-pattern failure was not detected");

const missingBehaviorDecision = baseManifest();
delete missingBehaviorDecision.architectureDiagram.behaviorLoadBearing;
const missingBehavior = await run(missingBehaviorDecision);
if (missingBehavior.status === 0) throw new Error("missing behavior-first decision unexpectedly passed");
if (!missingBehavior.stdout.includes("FAIL architecture behavior-first decision is recorded")) throw new Error("behavior-first decision failure was not detected");

console.log("architecture diagram QA: behavior-first, layout-only and redraw passes; semantic and redraw failures rejected");
