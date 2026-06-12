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
