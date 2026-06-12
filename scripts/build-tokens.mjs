import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tokenDir = path.join(root, "tokens");
const buildDir = path.join(root, "build");

async function readJson(name) {
  return JSON.parse(await fs.readFile(path.join(tokenDir, name), "utf8"));
}

function flatten(value, prefix = []) {
  if (Array.isArray(value)) {
    return [[prefix.join("-"), value.join(", ")]];
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nested]) =>
      flatten(nested, [...prefix, key])
    );
  }
  return [[prefix.join("-"), value]];
}

function flattenObject(value, prefix = []) {
  return Object.fromEntries(flatten(value, prefix));
}

function stripHash(value) {
  return String(value).replace(/^#/, "").toUpperCase();
}

async function main() {
  const colors = await readJson("colors.json");
  const typography = await readJson("typography.json");
  const spacing = await readJson("spacing.json");
  const radius = await readJson("radius.json");
  const shadow = await readJson("shadow.json");
  const motion = await readJson("motion.json");
  const chart = await readJson("chart.json");

  const tokens = { ...colors, ...typography, ...spacing, ...radius, ...shadow, ...motion, ...chart };

  await fs.mkdir(path.join(buildDir, "css"), { recursive: true });
  await fs.mkdir(path.join(buildDir, "tailwind"), { recursive: true });
  await fs.mkdir(path.join(buildDir, "themes"), { recursive: true });

  const cssLines = flatten(tokens).map(([name, value]) => `  --nero-${name}: ${value};`);
  await fs.writeFile(
    path.join(buildDir, "css", "nero-tokens.css"),
    `:root {\n${cssLines.join("\n")}\n}\n`,
    "utf8"
  );

  const tailwindConfig = {
    theme: {
      extend: {
        colors: {
          brand: colors.color.brand,
          surface: colors.color.surface,
          text: colors.color.text,
          border: colors.color.border,
          status: colors.color.status
        },
        borderRadius: radius.radius,
        boxShadow: shadow.shadow,
        spacing: flattenObject(spacing.space),
        fontFamily: {
          sans: ["Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", "system-ui", "sans-serif"],
          mono: ["SFMono-Regular", "Consolas", "Liberation Mono", "monospace"]
        }
      }
    }
  };
  await fs.writeFile(
    path.join(buildDir, "tailwind", "nero-tailwind.cjs"),
    `module.exports = ${JSON.stringify(tailwindConfig, null, 2)};\n`,
    "utf8"
  );

  const reportTheme = {
    colors: colors.color,
    typography: typography,
    spacing: spacing.space,
    radius: radius.radius,
    shadow: shadow.shadow,
    chart: chart.chart
  };
  await fs.writeFile(
    path.join(buildDir, "themes", "report-theme.mjs"),
    `export const reportTheme = ${JSON.stringify(reportTheme, null, 2)};\n`,
    "utf8"
  );

  const pptxTheme = {
    colors: {
      ink: stripHash(colors.color.text.primary),
      muted: stripHash(colors.color.text.muted),
      line: stripHash(colors.color.border.subtle),
      accent: stripHash(colors.color.brand.primary),
      secondary: stripHash(colors.color.brand.secondary),
      gold: stripHash(colors.color.brand.accent),
      background: stripHash(colors.color.surface.canvas),
      paper: stripHash(colors.color.surface.paper)
    },
    fonts: {
      headFontFace: "Microsoft YaHei",
      bodyFontFace: "Microsoft YaHei",
      latinFontFace: "Aptos",
      lang: "zh-CN"
    },
    chartPalette: chart.chart.palette.categorical.map(stripHash),
    slide: spacing.space.slide
  };
  await fs.writeFile(
    path.join(buildDir, "themes", "pptx-theme.mjs"),
    `export const pptxTheme = ${JSON.stringify(pptxTheme, null, 2)};\n`,
    "utf8"
  );

  const remotionTheme = {
    colors: colors.color,
    typography,
    spacing: spacing.space.video,
    motion: motion.motion,
    chart: chart.chart
  };
  await fs.writeFile(
    path.join(buildDir, "themes", "remotion-theme.mjs"),
    `export const remotionTheme = ${JSON.stringify(remotionTheme, null, 2)};\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(buildDir, "themes", "remotion-theme.ts"),
    `export const remotionTheme = ${JSON.stringify(remotionTheme, null, 2)} as const;\n`,
    "utf8"
  );

  console.log(`Built NERO design tokens into ${buildDir}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
