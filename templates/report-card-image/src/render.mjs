import fs from "node:fs/promises";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { reportTheme } from "../../../build/themes/report-theme.mjs";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const outDir = path.join(root, "out");
const theme = reportTheme;
const fontCandidates = [
  process.env.NERO_DESIGN_FONT,
  path.join(root, "assets", "fonts", "NotoSansSC-Regular.otf"),
  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"
].filter(Boolean);

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const fontPath = await firstExisting(fontCandidates);
  const fontData = fontPath ? await fs.readFile(fontPath).catch(() => null) : null;

  if (!fontData) {
    throw new Error(
      `Missing font. Set NERO_DESIGN_FONT or place a Chinese font at ${path.join(root, "assets", "fonts", "NotoSansSC-Regular.otf")}`
    );
  }

  const svg = await satori(card(), {
    width: 1080,
    height: 1440,
    fonts: [
      {
        name: "Noto Sans SC",
        data: fontData,
        weight: 400,
        style: "normal"
      }
    ]
  });

  const pngBuffer = new Resvg(svg, {
    fitTo: { mode: "width", value: 1080 }
  })
    .render()
    .asPng();

  await sharp(pngBuffer)
    .png({ quality: 95 })
    .toFile(path.join(outDir, "report-card.png"));
}

async function firstExisting(paths) {
  for (const candidate of paths) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next configured font path.
    }
  }
  return null;
}

function card() {
  return {
    type: "div",
    props: {
      style: {
        width: "1080px",
        height: "1440px",
        display: "flex",
        flexDirection: "column",
        padding: "72px",
        background: theme.colors.surface.canvas,
        color: theme.colors.text.primary,
        fontFamily: "Noto Sans SC"
      },
      children: [
        sectionHeader(),
        keyNumber(),
        bodyPanel(),
        footer()
      ]
    }
  };
}

function sectionHeader() {
  return {
    type: "div",
    props: {
      style: { display: "flex", flexDirection: "column", gap: "12px" },
      children: [
        text("AI INDUSTRY RESEARCH", 24, theme.colors.text.secondary),
        text("AI 产业链周度信号", 58, theme.colors.text.primary, 700),
        text("口径：公开资料、公司公告、产业链跟踪；示例模板不含真实投资结论。", 24, theme.colors.text.muted)
      ]
    }
  };
}

function keyNumber() {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        marginTop: "72px",
        padding: "44px",
        border: `2px solid ${theme.colors.border.subtle}`,
        background: theme.colors.surface.paper
      },
      children: [
        text("42", 112, theme.colors.brand.primary, 700),
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", marginLeft: "32px" },
            children: [
              text("条产业信号进入复核队列", 34, theme.colors.text.primary, 700),
              text("其中 7 条为高影响信号，需在正式输出前完成来源核验。", 26, theme.colors.text.secondary)
            ]
          }
        }
      ]
    }
  };
}

function bodyPanel() {
  const items = [
    ["光模块", "订单能见度提升，关注海外云厂商 CapEx 节奏。"],
    ["先进封装", "扩产节奏分化，需拆分工艺和客户口径。"],
    ["HBM", "价格维持强势，跟踪供需与良率改善。"]
  ];

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        marginTop: "56px"
      },
      children: items.map(([title, desc]) => ({
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "column",
            padding: "28px 32px",
            background: theme.colors.surface.paper,
            border: `1px solid ${theme.colors.border.subtle}`
          },
          children: [text(title, 32, theme.colors.text.primary, 700), text(desc, 25, theme.colors.text.secondary)]
        }
      }))
    }
  };
}

function footer() {
  return {
    type: "div",
    props: {
      style: {
        marginTop: "auto",
        display: "flex",
        justifyContent: "space-between",
        color: theme.colors.text.muted,
        fontSize: "22px"
      },
      children: ["NERO Design Team", "Generated report-card template"]
    }
  };
}

function text(value, fontSize, color, fontWeight = 400) {
  return {
    type: "div",
    props: {
      style: { fontSize, color, fontWeight, lineHeight: 1.28 },
      children: value
    }
  };
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
