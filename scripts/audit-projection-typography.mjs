import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PLAYWRIGHT_PATH = process.env.PLAYWRIGHT_PATH || null;
const DEFAULT_CHROME =
  process.env.CHROME_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function loadPlaywright() {
  if (PLAYWRIGHT_PATH) {
    const module = await import(PLAYWRIGHT_PATH);
    return module.chromium ? module : module.default;
  }
  try {
    const module = await import("playwright");
    return module.chromium ? module : module.default;
  } catch (error) {
    const message = [
      "Playwright is not available.",
      "Install it in the current project or set PLAYWRIGHT_PATH to a local Playwright module.",
      `Original error: ${error.message}`,
    ].join("\n");
    throw new Error(message);
  }
}

async function launchBrowser(playwright) {
  try {
    return await playwright.chromium.launch({
      headless: true,
      executablePath: DEFAULT_CHROME,
      args: ["--no-sandbox", "--disable-gpu"],
    });
  } catch {
    return await playwright.chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-gpu"],
    });
  }
}

function usage() {
  return [
    "Usage: node audit-projection-typography.mjs <html-path-or-url> <output-dir> [prefix]",
    "Example: node audit-projection-typography.mjs ./index.html ./qa projection",
  ].join("\n");
}

function targetUrl(input) {
  if (/^https?:\/\//.test(input) || input.startsWith("file://")) return input;
  return pathToFileURL(path.resolve(input)).href;
}

const input = process.argv[2];
const outputDir = process.argv[3];
const prefix = process.argv[4] || "projection_typography_audit";

if (!input || !outputDir) {
  console.error(usage());
  process.exit(1);
}

await fs.mkdir(outputDir, { recursive: true });

const playwright = await loadPlaywright();
const browser = await launchBrowser(playwright);

const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});

await page.goto(targetUrl(input), { waitUntil: "load" });
await page.waitForTimeout(1200);

const audit = await page.evaluate(async () => {
  const slides = Array.from(document.querySelectorAll("section.slide"));
  const targets = slides.length ? slides : [document.body];

  function visibleRows(root, pageNumber) {
    const candidates = Array.from(
      root.querySelectorAll("h1,h2,h3,h4,p,li,span,b,strong,em,small,td,th,div")
    );
    const rows = [];
    for (const el of candidates) {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 3 || rect.height < 3) continue;
      const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
      if (!text) continue;

      const childText = Array.from(el.children)
        .map((child) => (child.innerText || child.textContent || "").replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join(" ");
      const isHeading = /^H[1-4]$/.test(el.tagName);
      const isLeafLike = el.children.length === 0 || childText.length < text.length * 0.55 || isHeading;
      if (!isLeafLike) continue;

      const fontSize = parseFloat(style.fontSize);
      if (!Number.isFinite(fontSize)) continue;
      rows.push({
        page: pageNumber,
        tag: el.tagName.toLowerCase(),
        className: typeof el.className === "string" ? el.className.slice(0, 100) : "",
        fontSize: Number(fontSize.toFixed(2)),
        lineHeight: style.lineHeight,
        text: text.slice(0, 120),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
      });
    }
    return rows;
  }

  const pages = [];
  for (let i = 0; i < targets.length; i += 1) {
    if (window.go && slides.length) {
      window.go(i);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const rows = visibleRows(targets[i], i + 1);
    pages.push({
      page: i + 1,
      totalTextElements: rows.length,
      lt12: rows.filter((row) => row.fontSize < 12).length,
      between12and14: rows.filter((row) => row.fontSize >= 12 && row.fontSize < 14).length,
      between14and16: rows.filter((row) => row.fontSize >= 14 && row.fontSize < 16).length,
      minFontSize: rows.length ? Math.min(...rows.map((row) => row.fontSize)) : null,
      offenders: rows
        .filter((row) => row.fontSize < 13.5)
        .sort((a, b) => a.fontSize - b.fontSize || a.y - b.y || a.x - b.x)
        .slice(0, 18),
    });
  }
  return pages;
});

await browser.close();

const highRiskPages = audit
  .filter((pageResult) => pageResult.lt12 > 0 || pageResult.between12and14 >= 10)
  .map((pageResult) => ({
    page: pageResult.page,
    lt12: pageResult.lt12,
    between12and14: pageResult.between12and14,
    minFontSize: pageResult.minFontSize,
  }));

const jsonPath = path.join(outputDir, `${prefix}.json`);
const mdPath = path.join(outputDir, `${prefix}.md`);

const md = [
  "# Projection Typography Audit",
  "",
  "## Standard",
  "",
  "- Projection decks should avoid visible text below 12px in a 1920x1080 render.",
  "- Body text and transaction fields should target 13-15px or larger.",
  "- Footers, stock codes, and tags can be smaller than body text, but should not carry key meaning.",
  "",
  "## High Risk Pages",
  "",
  "| Page | <12px | 12-14px | Min |",
  "|---:|---:|---:|---:|",
  ...highRiskPages.map((p) => `| ${p.page} | ${p.lt12} | ${p.between12and14} | ${p.minFontSize ?? "-"} |`),
  "",
  "## Small Text Samples",
  "",
];

for (const pageResult of audit.filter((item) => item.offenders.length > 0)) {
  md.push(`### Page ${pageResult.page}`);
  for (const offender of pageResult.offenders.slice(0, 8)) {
    md.push(
      `- ${offender.fontSize}px / ${offender.tag}${offender.className ? `.${offender.className}` : ""} / ${offender.text}`
    );
  }
  md.push("");
}

await fs.writeFile(jsonPath, JSON.stringify({ highRiskPages, pages: audit }, null, 2), "utf8");
await fs.writeFile(mdPath, `${md.join("\n")}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      pages: audit.length,
      totalLt12: audit.reduce((sum, pageResult) => sum + pageResult.lt12, 0),
      minFontSize: Math.min(...audit.map((pageResult) => pageResult.minFontSize).filter(Number.isFinite)),
      highRiskPages,
      jsonPath,
      mdPath,
    },
    null,
    2
  )
);
