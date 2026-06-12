import pptxgen from "pptxgenjs";
import fs from "node:fs/promises";
import { pptxTheme } from "../../../build/themes/pptx-theme.mjs";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "NERO Design Team";
pptx.subject = "NERO research deck template";
pptx.title = "AI Industry Research";
pptx.company = "NERO";
pptx.lang = "zh-CN";
pptx.theme = {
  headFontFace: pptxTheme.fonts.headFontFace,
  bodyFontFace: pptxTheme.fonts.bodyFontFace,
  lang: pptxTheme.fonts.lang
};

const colors = pptxTheme.colors;

cover();
section("01", "核心结论", "先给判断，再给证据和口径边界");
dataSlide();

await fs.mkdir("out", { recursive: true });
await pptx.writeFile({ fileName: "out/nero-research-template.pptx" });

function cover() {
  const slide = pptx.addSlide();
  slide.background = { color: colors.background };
  slide.addText("AI INDUSTRY RESEARCH", {
    x: 0.65,
    y: 0.55,
    w: 5.5,
    h: 0.28,
    fontFace: "Aptos",
    fontSize: 11,
    color: colors.muted,
    bold: true
  });
  slide.addText("AI 产业链周度信号", {
    x: 0.65,
    y: 1.4,
    w: 8.6,
    h: 0.7,
    fontSize: 30,
    bold: true,
    color: colors.ink
  });
  slide.addText("示例模板：用于结构、版式和导出流程验证，不含真实投资结论。", {
    x: 0.65,
    y: 2.4,
    w: 8.6,
    h: 0.35,
    fontSize: 13,
    color: colors.muted
  });
  footer(slide);
}

function section(index, title, subtitle) {
  const slide = pptx.addSlide();
  slide.background = { color: colors.ink };
  slide.addText(index, {
    x: 0.7,
    y: 0.72,
    w: 1.4,
    h: 0.5,
    fontSize: 17,
    bold: true,
    color: "FFFFFF"
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.7,
    y: 1.35,
    w: 9.8,
    h: 0,
    line: { color: "FFFFFF", transparency: 50, width: 1 }
  });
  slide.addText(title, {
    x: 0.7,
    y: 2.1,
    w: 8.4,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: "FFFFFF"
  });
  slide.addText(subtitle, {
    x: 0.7,
    y: 3.0,
    w: 8.4,
    h: 0.4,
    fontSize: 14,
    color: "DDE7EB"
  });
}

function dataSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };
  slide.addText("重点链条复核矩阵", {
    x: 0.55,
    y: 0.38,
    w: 8,
    h: 0.35,
    fontSize: 18,
    bold: true,
    color: colors.ink
  });
  slide.addText("示例数据，正式使用前必须替换为可追溯来源。", {
    x: 0.55,
    y: 0.75,
    w: 8,
    h: 0.25,
    fontSize: 9.5,
    color: colors.muted
  });

  const rows = [
    ["链条", "核心变化", "影响", "证据状态"],
    ["光模块", "订单能见度提升", "高", "已核对"],
    ["先进封装", "扩产节奏分化", "中", "需补充口径"],
    ["HBM", "价格维持强势", "高", "跟踪中"]
  ];

  slide.addTable(rows, {
    x: 0.55,
    y: 1.25,
    w: 9.6,
    h: 2.2,
    border: { type: "solid", color: colors.line, width: 0.5 },
    color: colors.ink,
    fontFace: "Microsoft YaHei",
    fontSize: 10,
    margin: 0.08,
    fill: { color: "FFFFFF" },
    autoFit: false,
    valign: "mid",
    rowH: 0.42
  });
  footer(slide);
}

function footer(slide) {
  slide.addShape(pptx.ShapeType.line, {
    x: 0.55,
    y: 6.86,
    w: 12.2,
    h: 0,
    line: { color: colors.line, width: 0.5 }
  });
  slide.addText("NERO Design Team | Template", {
    x: 0.55,
    y: 6.95,
    w: 4,
    h: 0.18,
    fontSize: 7.5,
    color: colors.muted
  });
}
