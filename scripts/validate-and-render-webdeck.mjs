#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [htmlPath, outDir = path.join(process.cwd(), 'webdeck-qa')] = process.argv.slice(2);
if (!htmlPath) {
  console.error('Usage: node validate-and-render-webdeck.mjs <deck.html> [out-dir]');
  process.exit(2);
}

const configuredRoot = process.env.NERO_DESIGN_TEAM_HOME?.trim();
if (configuredRoot && !path.isAbsolute(configuredRoot)) {
  console.error('NERO_DESIGN_TEAM_HOME must be an absolute path when set.');
  process.exit(2);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const designRoot = configuredRoot ? path.resolve(configuredRoot) : path.resolve(scriptDir, '..');
const validator = path.join(designRoot, 'scripts', 'validate-web-ppt.mjs');
const typography = path.join(designRoot, 'scripts', 'audit-projection-typography.mjs');

function run(label, scriptPath, args) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`${label} failed with status ${result.status ?? 'unknown'}`);
    process.exit(result.status || 1);
  }
}

if (!fs.existsSync(htmlPath)) {
  console.error(`HTML file not found: ${htmlPath}`);
  process.exit(1);
}

for (const requiredScript of [validator, typography]) {
  if (!fs.existsSync(requiredScript)) {
    console.error(`Required QA script is unavailable: ${path.relative(designRoot, requiredScript)}`);
    process.exit(1);
  }
}

fs.mkdirSync(outDir, { recursive: true });
run('Web PPT validation', validator, [htmlPath, '--mode', 'swiss']);
run('Projection typography audit', typography, [htmlPath, outDir, 'webdeck']);
console.log(`Webdeck validation completed. QA output: ${outDir}`);
