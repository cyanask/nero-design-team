import fs from "node:fs/promises";

function luminance(hex) {
  const rgb = hex.replace("#", "").match(/.{1,2}/g).map((part) => {
    const channel = parseInt(part, 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrastRatio(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

function estimateTextCapacity(block) {
  const lineHeight = block.lineHeight || 1.35;
  const fontSize = block.fontSize || 14;
  const charsPerLine = Math.max(1, Math.floor(block.w / (fontSize * 0.56)));
  const lines = Math.max(1, Math.floor(block.h / (fontSize * lineHeight)));
  return charsPerLine * lines;
}

function within(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function evaluateArchitectureDiagram(manifest, push) {
  if (manifest.route !== "architecture-diagram-redraw") return;

  const spec = manifest.architectureDiagram || {};
  const evidenceStatuses = new Set(["verified", "partial", "unknown"]);
  const detailPostures = new Set(["faithful", "balanced", "simplified"]);
  const audiences = new Set(["engineer", "mixed", "executive"]);
  const complexityDecisions = new Set(["within_budget", "split", "exception_justified"]);
  const perceptualStatuses = new Set(["pass", "not_run", "failed"]);
  const semanticPatterns = new Set([
    "fan_in_queue",
    "stage_semantic_slots",
    "unstructured_to_structured",
    "paired_policy_traces",
    "secure_paved_road",
    "governance_control_catalog",
    "compensating_security_layers"
  ]);

  push(Boolean(spec.question), "architecture question is explicit", spec.question || "missing");
  push(Boolean(spec.authoritySource), "architecture authority source is explicit", spec.authoritySource || "missing");
  push(evidenceStatuses.has(spec.evidenceStatus), "architecture evidence status is registered", spec.evidenceStatus || "missing");
  push(Boolean(spec.asOf), "architecture as-of boundary is explicit", spec.asOf || "missing");
  push(Boolean(spec.selectedGrammar), "architecture grammar is selected", spec.selectedGrammar || "missing");
  push(audiences.has(spec.audience), "architecture audience is registered", spec.audience || "missing");
  push(detailPostures.has(spec.detailPosture), "architecture detail posture is registered", spec.detailPosture || "missing");
  push(complexityDecisions.has(spec.complexityDecision), "architecture complexity decision is recorded", spec.complexityDecision || "missing");
  push(typeof spec.behaviorLoadBearing === "boolean", "architecture behavior-first decision is recorded", String(spec.behaviorLoadBearing ?? "missing"));
  if (spec.behaviorLoadBearing === true) {
    push(semanticPatterns.has(spec.semanticPattern), "architecture semantic pattern is registered", spec.semanticPattern || "missing");
  } else if (spec.semanticPattern !== undefined && spec.semanticPattern !== null) {
    push(semanticPatterns.has(spec.semanticPattern), "architecture semantic pattern is registered", spec.semanticPattern || "missing");
  }
  push(spec.stableIdsVerified === true, "architecture stable ids are verified");
  push(spec.connectorDirectionVerified === true, "architecture connector direction is verified");
  push(spec.localCjkFontResolved === true, "architecture local CJK font resolves");
  push(spec.noTextOrConnectorCollisions === true, "architecture text and connector collisions are absent");
  push(spec.criticalMeaningNotColorOnly === true, "architecture meaning does not depend on color alone");
  push(spec.staticQaStatus === "pass", "architecture static QA passes", spec.staticQaStatus || "missing");
  push(perceptualStatuses.has(spec.perceptualReviewStatus), "architecture perceptual-review status is explicit", spec.perceptualReviewStatus || "missing");

  if (spec.outputCarrier === "svg" || spec.outputCarrier === "html+svg") {
    push(spec.svgAccessibleNameResolved === true, "architecture SVG accessible name resolves");
    push(spec.svgDescriptionPresent === true, "architecture SVG description is present");
  }

  if (spec.sourceKind === "fresh") return;

  push(new Set(["drawio", "mermaid"]).has(spec.sourceKind), "redraw source kind is supported", spec.sourceKind || "missing");
  push(/^[a-f0-9]{64}$/i.test(spec.sourceSha256 || ""), "redraw source SHA-256 is recorded", spec.sourceSha256 || "missing");
  push(spec.untrustedInertSource === true, "redraw source is handled as untrusted inert content");
  push(spec.sourceExecuted === false, "redraw source was not executed");
  push(spec.sourceLinksFollowed === false, "redraw source links were not followed");

  const ledger = spec.fidelityLedger || {};
  const sourceCounts = ledger.sourceCounts || {};
  const accountedCounts = ledger.accountedCounts || {};
  push(Number.isInteger(sourceCounts.nodes) && sourceCounts.nodes >= 0, "redraw source node count is recorded", String(sourceCounts.nodes ?? "missing"));
  push(Number.isInteger(sourceCounts.edges) && sourceCounts.edges >= 0, "redraw source edge count is recorded", String(sourceCounts.edges ?? "missing"));
  push(accountedCounts.nodes === sourceCounts.nodes, "redraw fidelity ledger accounts for every source node", `${accountedCounts.nodes ?? "?"}/${sourceCounts.nodes ?? "?"}`);
  push(accountedCounts.edges === sourceCounts.edges, "redraw fidelity ledger accounts for every source edge", `${accountedCounts.edges ?? "?"}/${sourceCounts.edges ?? "?"}`);
  for (const field of ["kept", "merged", "dropped", "relabelled", "correctedRelationships", "unresolved"]) {
    push(Array.isArray(ledger[field]), `redraw fidelity ledger field is present: ${field}`);
  }
  push(ledger.authorityBackedCorrections === true, "redraw relationship corrections are authority-backed");
}

function evaluatePhotoDerivedEditorial(manifest, push) {
  if (manifest.stylePreset !== "photo-derived-editorial-diptych") return;

  const spec = manifest.photoDerivedEditorial || {};
  const orientation = spec.sourceOrientation;
  const photoAreaRatio = spec.photoAreaRatio;
  const panelAreaRatio = spec.panelAreaRatio;
  const photoRanges = {
    landscape: [0.38, 0.60],
    portrait: [0.55, 0.76],
    square: [0.48, 0.66]
  };
  const [photoMin, photoMax] = photoRanges[orientation] || [NaN, NaN];
  const trace = Array.isArray(spec.relationTrace) ? spec.relationTrace : [];
  const retry = spec.regeneration || {};
  const crop = spec.cropContract || {};
  const titleBlock = (manifest.textBlocks || []).find((block) => block.id === "main-title");
  const titleWords = (titleBlock?.text || "").trim().split(/\s+/).filter(Boolean);

  push(Boolean(photoRanges[orientation]), "photo-derived source orientation is registered", orientation || "missing");
  push(within(photoAreaRatio, photoMin, photoMax), "photo-derived photo area matches source orientation", String(photoAreaRatio ?? "missing"));
  push(within(panelAreaRatio, 0.24, 0.62), "photo-derived panel area is explicit", String(panelAreaRatio ?? "missing"));
  push(
    Number.isFinite(photoAreaRatio) && Number.isFinite(panelAreaRatio) && Math.abs(photoAreaRatio + panelAreaRatio - 1) <= 0.01,
    "photo-derived photo and panel ratios sum to one",
    `${photoAreaRatio ?? "?"}+${panelAreaRatio ?? "?"}`
  );
  push(within(spec.motifWidthRatio, 0.30, 0.68), "photo-derived motif width is restrained", String(spec.motifWidthRatio ?? "missing"));
  push(within(spec.cleanSpaceRatio, 0.65, 0.80), "photo-derived clean space", String(spec.cleanSpaceRatio ?? "missing"));
  push(spec.photoPixelsPreserved === true, "photo-derived original photo layer is preserved");
  push(spec.generatedPanelOnly === true, "photo-derived generated layer is panel-only");
  push(spec.generatedExactTextUsed === false, "photo-derived exact text stays outside generated raster");
  push(spec.exactTextOverlayDeterministic === true, "photo-derived exact text uses deterministic overlay");
  push(spec.panelBackgroundUniform === true, "photo-derived panel background is uniform");
  push(spec.paletteSourceOnly === true, "photo-derived palette comes only from source photo");
  push(Array.isArray(spec.extraElements) && spec.extraElements.length === 0, "photo-derived panel has no extra elements", JSON.stringify(spec.extraElements || []));
  push(crop.mode === "none" || (crop.mode === "explicit" && Boolean(crop.cropRect)), "photo-derived crop contract is explicit", crop.mode || "missing");
  push(Boolean(spec.primaryMarkFamily), "photo-derived primary mark family is recorded", spec.primaryMarkFamily || "missing");
  push(Array.isArray(spec.supportingMarkFamilies) && spec.supportingMarkFamilies.length <= 2, "photo-derived supporting mark family limit", String(spec.supportingMarkFamilies?.length ?? "missing"));
  push(trace.length >= 3 && trace.length <= 6, "photo-derived relation trace has 3-6 facts", String(trace.length));
  for (const [index, fact] of trace.entries()) {
    push(
      Boolean(fact.id && fact.sourceFact && fact.photoRegion && fact.relationType && fact.preservedAs && fact.markFamily),
      `photo-derived relation trace is complete: ${fact.id || `fact-${index + 1}`}`
    );
  }
  push(titleWords.length >= 2 && titleWords.length <= 5, "photo-derived title has 2-5 words", String(titleWords.length));
  push(Number.isInteger(retry.attempts) && retry.attempts >= 0 && retry.attempts <= 1, "photo-derived automatic regeneration limit", String(retry.attempts ?? "missing"));
  push(retry.outcome === "not-required" || retry.outcome === "pass", "photo-derived regeneration outcome", retry.outcome || "missing");
}

function evaluateMinimalZine(manifest, push) {
  if (manifest.stylePreset !== "minimal-zine-editorial") return;

  const spec = manifest.minimalZine || {};
  const formats = {
    "poster-3x5": 3 / 5,
    "social-4x5": 4 / 5,
    "social-1x1": 1,
    "slide-16x9": 16 / 9
  };
  const expectedRatio = formats[spec.format];
  const actualRatio = manifest.width / manifest.height;
  push(Boolean(expectedRatio), "minimal-zine format is registered", spec.format || "missing");
  push(Boolean(expectedRatio) && Math.abs(actualRatio - expectedRatio) <= 0.01, "minimal-zine aspect ratio matches format", `${manifest.width || "?"}x${manifest.height || "?"}`);
  push(within(spec.negativeSpaceRatio, 0.70, 0.90), "minimal-zine negative space", String(spec.negativeSpaceRatio ?? "missing"));
  push(within(spec.subjectClusterRatio, 0.08, 0.25), "minimal-zine subject cluster", String(spec.subjectClusterRatio ?? "missing"));

  const recipe = spec.recipe || {};
  for (const field of ["layout", "anchor", "typography", "texture", "mood", "accent"]) {
    push(Boolean(recipe[field]), `minimal-zine recipe field: ${field}`, recipe[field] || "missing");
  }
  push(recipe.duplicateOfRecent === false, "minimal-zine recipe differs from recent outputs");

  const colorAnchor = spec.colorAnchor || {};
  const colorSharePass = within(colorAnchor.canvasShareRatio, 0.008, 0.025)
    || within(colorAnchor.clusterShareRatio, 0.15, 0.35);
  push(colorSharePass, "minimal-zine color anchor share", `canvas=${colorAnchor.canvasShareRatio ?? "?"}; cluster=${colorAnchor.clusterShareRatio ?? "?"}`);

  const thumbnail = spec.thumbnailReview || {};
  push(thumbnail.anchorVisible === true, "minimal-zine anchor visible at thumbnail scale");
  push(thumbnail.colorWashedOut === false, "minimal-zine color anchor is not washed out");
  push(thumbnail.safeZoneContaminated === false, "minimal-zine safe zone remains clean");

  const regeneration = spec.regeneration || {};
  const attemptsValid = Number.isInteger(regeneration.attempts) && regeneration.attempts >= 0 && regeneration.attempts <= 1;
  push(attemptsValid, "minimal-zine automatic regeneration limit", String(regeneration.attempts ?? "missing"));
  push(regeneration.required !== true || (regeneration.attempts === 1 && regeneration.outcome === "pass"), "minimal-zine retry outcome", regeneration.outcome || "not-required");
  push(spec.generatedExactTextUsed === false, "minimal-zine exact text stays outside generated raster");
}

function evaluate(manifest) {
  const results = [];
  const push = (ok, label, detail = "") => results.push({ ok, label, detail });

  push(
    Number.isFinite(manifest.width) && Number.isFinite(manifest.height) && manifest.width > 0 && manifest.height > 0,
    "output dimensions are explicit",
    `${manifest.width || "?"}x${manifest.height || "?"}`
  );

  for (const block of manifest.textBlocks || []) {
    const capacity = estimateTextCapacity(block);
    const length = Array.from(block.text || "").length;
    push(length <= capacity, `text fits: ${block.id || "unnamed"}`, `${length}/${capacity} estimated chars`);
  }

  if (Array.isArray(manifest.colors) && manifest.colors.length) {
    push(manifest.colors.every(value => /^#[0-9a-f]{6}$/i.test(value)),
      "declared color values use valid hex syntax", `${manifest.colors.length} supplied colors`);
  }

  for (const pair of manifest.contrastPairs || []) {
    const ratio = contrastRatio(pair.foreground, pair.background);
    push(ratio >= (pair.largeText ? 3 : 4.5), `contrast passes: ${pair.id || "pair"}`, ratio.toFixed(2));
  }

  for (const chart of manifest.charts || []) {
    push(Boolean(chart.title && chart.xLabel && chart.yLabel), `chart labels present: ${chart.id || "chart"}`);
    push(Boolean(chart.unit || chart.denominator), `chart unit or denominator present: ${chart.id || "chart"}`);
    push((chart.minFontSize || 0) >= 10, `chart readable font size: ${chart.id || "chart"}`, `${chart.minFontSize || "?"}px`);
  }

  evaluatePhotoDerivedEditorial(manifest, push);
  evaluateMinimalZine(manifest, push);
  evaluateArchitectureDiagram(manifest, push);

  return results;
}

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    throw new Error("Usage: node scripts/visual-qa.mjs <visual-manifest.json>");
  }
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const results = evaluate(manifest);
  for (const result of results) {
    console.log(`${result.ok ? "PASS" : "FAIL"} ${result.label}${result.detail ? ` - ${result.detail}` : ""}`);
  }
  const notChecked = [
    ...(!manifest.colors?.length ? ["color_syntax"] : []),
    ...(!manifest.textBlocks?.length ? ["text_fit"] : []),
    ...(!manifest.contrastPairs?.length ? ["contrast"] : []),
    ...(!manifest.charts?.length ? ["chart_labels"] : []),
    "rendered_layout", "live_behavior", "human_acceptance"
  ];
  console.log(`QA result: ${JSON.stringify({
    status: results.some(result => !result.ok) ? "fail" : "pass",
    evidence_kind: "manifest_checks", checked: results, not_checked: notChecked,
    rendered_qa_passed: false, live_behavior_observed: false, human_accepted: false
  })}`);
  if (results.some((result) => !result.ok)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
