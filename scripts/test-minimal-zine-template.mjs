import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(root, "templates", "gpt-image-brief", "presets", "minimal-zine-editorial", "overlay-template.html");
const html = await fs.readFile(templatePath, "utf8");

for (const marker of [
  "<!doctype html>",
  '<meta charset="utf-8" />',
  'theme/nero-tokens.css',
  'data-format="poster-3x5"',
  'data-format="social-4x5"',
  'data-format="social-1x1"',
  'data-format="slide-16x9"',
  'data-field="eyebrow"',
  'data-field="title"',
  'data-field="meta"',
  'data-field="source"',
  "generatedVisualUrl"
]) {
  if (!html.includes(marker)) throw new Error(`missing template contract marker: ${marker}`);
}

for (const tag of ["html", "head", "style", "body", "main", "section", "script"]) {
  const opens = html.match(new RegExp(`<${tag}(?:\\s|>)`, "gi"))?.length || 0;
  const closes = html.match(new RegExp(`</${tag}>`, "gi"))?.length || 0;
  if (opens !== closes) throw new Error(`unbalanced ${tag} tags: ${opens}/${closes}`);
}

if (/https?:\/\//i.test(html)) {
  throw new Error("overlay template must not depend on remote runtime assets");
}

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
if (scripts.length !== 1) throw new Error(`expected one inline script, found ${scripts.length}`);
new vm.Script(scripts[0], { filename: templatePath });

console.log("PASS minimal-zine overlay has a closed HTML5 structure, four formats, deterministic text fields, no remote dependency, and valid inline JavaScript");
