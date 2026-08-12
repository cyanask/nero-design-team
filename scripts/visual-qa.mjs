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

function hue(hex) {
  const [r, g, b] = hex.replace("#", "").match(/.{1,2}/g).map((part) => parseInt(part, 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const delta = max - min;
  if (max === r) return ((g - b) / delta + (g < b ? 6 : 0)) * 60;
  if (max === g) return ((b - r) / delta + 2) * 60;
  return ((r - g) / delta + 4) * 60;
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
  push(Number.isFinite(photoAreaRatio) && Number.isFinite(panelAreaRatio) && Math.abs(photoAreaRatio + panelAreaRatio - 1) <= 0.01, "photo-derived photo and panel ratios sum to one", `${photoAreaRatio ?? "?"}+${panelAreaRatio ?? "?"}`);
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
    push(Boolean(fact.id && fact.sourceFact && fact.photoRegion && fact.relationType && fact.preservedAs && fact.markFamily), `photo-derived relation trace is complete: ${fact.id || `fact-${index + 1}`}`);
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

  const colors = [...new Set((manifest.colors || []).filter((value) => /^#[0-9a-f]{6}$/i.test(value)))];
  if (colors.length > 1) {
    const hues = colors.map(hue);
    const spread = Math.max(...hues) - Math.min(...hues);
    push(spread >= 24 || colors.length <= 2, "color palette is not one-note", `${Math.round(spread)}deg hue spread`);
  } else {
    push(false, "color palette is not one-note", "fewer than two valid colors supplied");
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
  if (results.some((result) => !result.ok)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
