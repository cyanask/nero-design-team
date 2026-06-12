#!/usr/bin/env node
import fs from "node:fs";

function usage() {
  return [
    "Usage:",
    "  node scripts/validate-web-ppt.mjs <index.html> [--mode swiss|generic] [--allow-experimental]",
    "",
    "Checks:",
    "  generic: slide presence, placeholders, SVG text, local image slots",
    "  swiss: registered S01-S22 body layouts, S22 image slot, top-center image crop risks"
  ].join("\n");
}

function parseArgs(argv) {
  const options = { mode: "generic", allowExperimental: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--help" || value === "-h") {
      options.help = true;
    } else if (value === "--mode") {
      options.mode = argv[index + 1] || "";
      index += 1;
    } else if (value === "--allow-experimental") {
      options.allowExperimental = true;
    } else if (!options.file) {
      options.file = value;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  return options;
}

function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

function collectSlides(html) {
  const pattern = /<section\b[^>]*class=["'][^"']*\bslide\b[^"']*["'][^>]*>[\s\S]*?<\/section>/gi;
  return [...html.matchAll(pattern)].map((match, index) => {
    const section = match[0];
    const tag = section.match(/^<section\b[^>]*>/i)?.[0] || "";
    return { index: index + 1, section, tag };
  });
}

function attr(tag, name) {
  const pattern = new RegExp(`\\b${name}=["']([^"']+)["']`, "i");
  return tag.match(pattern)?.[1] || "";
}

function tagHasClass(tag, className) {
  const classAttr = attr(tag, "class");
  return classAttr.split(/\s+/).includes(className);
}

function localImageTags(section) {
  return [...section.matchAll(/<img\b[^>]*\bsrc=["']images\//gi)].map((match) => {
    const start = match.index || 0;
    const end = section.indexOf(">", start);
    return section.slice(start, end >= 0 ? end + 1 : start);
  });
}

function validate(options) {
  if (options.help) return { help: true };
  if (!options.file) throw new Error(usage());
  if (!["generic", "swiss"].includes(options.mode)) {
    throw new Error(`Unsupported mode: ${options.mode}`);
  }

  const raw = fs.readFileSync(options.file, "utf8");
  const html = stripComments(raw);
  const slides = collectSlides(html);
  const errors = [];
  const warnings = [];
  const allowedSwiss = new Set([
    "SWISS-COVER-ASCII",
    "SWISS-CLOSING-ASCII",
    ...Array.from({ length: 22 }, (_, index) => `S${String(index + 1).padStart(2, "0")}`)
  ]);

  if (slides.length === 0) {
    errors.push("No slide sections found. Expected <section class=\"slide\">.");
  }

  if (/\[必填\]|TODO|PLACEHOLDER|示例结论|sample conclusion/i.test(html)) {
    errors.push("Placeholder or sample text remains in the deck.");
  }

  for (const slide of slides) {
    if (/<svg\b[\s\S]*?<text\b/i.test(slide.section)) {
      errors.push(`Slide ${slide.index}: SVG contains visible <text>; use HTML labels instead.`);
    }

    for (const [imageIndex, tag] of localImageTags(slide.section).entries()) {
      if (!/\bdata-image-slot=["']/.test(tag)) {
        errors.push(`Slide ${slide.index}: local image ${imageIndex + 1} has no data-image-slot.`);
      }
    }

    if (options.mode !== "swiss") continue;

    const layout = attr(slide.tag, "data-layout");
    const isCoverOrClosing = tagHasClass(slide.tag, "cover") || tagHasClass(slide.tag, "closing");
    if (!layout && !isCoverOrClosing) {
      errors.push(`Slide ${slide.index}: missing data-layout in Swiss mode.`);
    } else if (layout && !allowedSwiss.has(layout)) {
      errors.push(`Slide ${slide.index}: unregistered Swiss data-layout "${layout}".`);
    }

    if (!options.allowExperimental && /\b(P23|P24|Swiss Image Split|Swiss Evidence Grid|swiss-img-split|swiss-img-grid)\b/i.test(slide.section)) {
      errors.push(`Slide ${slide.index}: experimental Swiss layout detected; use S22 or S15/S16 adaptations.`);
    }

    const statementLike = ["S03", "S09", "S10", "SWISS-COVER-ASCII", "SWISS-CLOSING-ASCII"].includes(layout);
    const top = slide.section.slice(0, 1800);
    if (!statementLike && /text-align\s*:\s*center/i.test(top)) {
      errors.push(`Slide ${slide.index}: centered top text found; Swiss body headings should stay left/top aligned.`);
    }

    if (layout === "S22") {
      if (!/data-image-slot=["']s22-hero-21x9["']/.test(slide.section)) {
        errors.push(`Slide ${slide.index}: S22 requires data-image-slot="s22-hero-21x9".`);
      }
      if (/object-position\s*:\s*top center/i.test(slide.section)) {
        errors.push(`Slide ${slide.index}: S22 uses object-position:top center; use center 35% or center center.`);
      }
    }

    if (/font-size\s*:\s*(10|11|12|13)px/i.test(slide.section)) {
      warnings.push(`Slide ${slide.index}: very small fixed font size found; projection text may be unreadable.`);
    }
  }

  return { help: false, errors, warnings, slideCount: slides.length };
}

try {
  const options = parseArgs(process.argv.slice(2));
  const result = validate(options);
  if (result.help) {
    console.log(usage());
    process.exit(0);
  }
  for (const warning of result.warnings) {
    console.warn(`Warning: ${warning}`);
  }
  if (result.errors.length) {
    console.error("Web PPT validation failed:");
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`Web PPT validation passed: ${result.slideCount} slide(s), mode=${options.mode}.`);
} catch (error) {
  console.error(error.message);
  process.exit(2);
}
