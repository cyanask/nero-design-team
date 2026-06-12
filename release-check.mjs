import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const ignoredDirs = new Set([".git", "node_modules", "dist", "out", "coverage"]);
const textExtensions = new Set([
  ".md",
  ".json",
  ".mjs",
  ".js",
  ".ts",
  ".tsx",
  ".css",
  ".html",
  ".yaml",
  ".yml",
  ".txt",
  ".cjs",
]);

const findings = [];
const jsonFiles = [];
const commonTokenPattern = new RegExp(
  "(" + "gh" + "p_|" + "github" + "_pat_|" + "s" + "k-" + "[A-Za-z0-9_-]{20,})"
);

function relative(filePath) {
  return path.relative(root, filePath);
}

function isTextFile(filePath) {
  return textExtensions.has(path.extname(filePath));
}

function addFinding(filePath, type, detail) {
  findings.push({ file: relative(filePath), type, detail });
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) continue;
      if (entry.name === "assets" && relative(target).startsWith("case-library")) {
        addFinding(target, "restricted-directory", "case-library/assets should stay private or ignored");
      }
      await walk(target);
    } else {
      if (entry.name === ".env" || entry.name.startsWith(".env.")) {
        addFinding(target, "env-file", "environment files must not be published");
      }
      if (entry.name === ".DS_Store") {
        addFinding(target, "system-file", ".DS_Store must not be published");
      }
      if (path.extname(entry.name) === ".json") jsonFiles.push(target);
      if (!isTextFile(target)) continue;

      const text = await fs.readFile(target, "utf8");
      if (/\/Users\/[^/\s]+/.test(text) || /\/home\/[^/\s]+/.test(text)) {
        addFinding(target, "absolute-local-path", "contains a user-home absolute path");
      }
      if (/-----BEGIN (RSA |OPENSSH |EC |DSA |)PRIVATE KEY-----/.test(text)) {
        addFinding(target, "private-key", "contains a private key block");
      }
      if (commonTokenPattern.test(text)) {
        addFinding(target, "token-pattern", "contains a common token pattern");
      }
      if (/(OPENAI_API_KEY|ANTHROPIC_API_KEY|GITHUB_TOKEN|SLACK_TOKEN)\s*[:=]\s*['"][^'"]+['"]/.test(text)) {
        addFinding(target, "secret-assignment", "contains an API token assignment");
      }
    }
  }
}

await walk(root);

for (const filePath of jsonFiles) {
  try {
    JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    addFinding(filePath, "json-parse", error.message);
  }
}

const report = {
  root,
  checked_at: new Date().toISOString(),
  status: findings.length ? "fail" : "pass",
  findings,
};

console.log(JSON.stringify(report, null, 2));
if (findings.length) process.exit(1);
