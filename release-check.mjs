import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const strict = args.includes("--strict");
const rootFlag = args.indexOf("--root");
if (rootFlag !== -1 && !args[rootFlag + 1]) throw new Error("--root requires a directory");
const requestedRoot = path.resolve(rootFlag === -1 ? scriptRoot : args[rootFlag + 1]);
const root = await fs.realpath(requestedRoot);
const rootStat = await fs.stat(root);
if (!rootStat.isDirectory()) throw new Error(`Release root is not a directory: ${root}`);

const textExtensions = new Set([
  "", ".md", ".json", ".mjs", ".mts", ".js", ".cjs", ".ts", ".tsx", ".py", ".sh",
  ".css", ".html", ".svg", ".xml", ".yaml", ".yml", ".txt", ".toml", ".csv"
]);
const privateDirectories = new Set([
  ".git", ".codex", ".agents", "node_modules", "coverage", "validation", "private", "client-assets", "evidence"
]);
const findings = [];
const warnings = [];
const jsonFiles = [];
let filesScanned = 0;
let textFilesScanned = 0;

const tokenPatterns = [
  ["github-token", new RegExp(["gh", "p_[A-Za-z0-9]{20,}"].join(""))],
  ["github-pat", new RegExp(["github", "_pat_[A-Za-z0-9_]{20,}"].join(""))],
  ["openai-token", new RegExp(["s", "k-[A-Za-z0-9_-]{20,}"].join(""))],
  ["aws-access-key", new RegExp(["AK", "IA[0-9A-Z]{16}"].join(""))],
  ["jwt", /eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}/]
];
const secretAssignment = new RegExp(
  "(?:OPENAI_API_KEY|ANTHROPIC_API_KEY|GITHUB_TOKEN|SLACK_TOKEN|AWS_SECRET_ACCESS_KEY|PASSWORD|PRIVATE_KEY)" +
  "\\s*[:=]\\s*['\\\"][^'\\\"]{8,}['\\\"]",
  "i"
);

function relative(filePath) {
  const value = path.relative(root, filePath);
  return value || ".";
}

function insideRoot(filePath) {
  const value = path.relative(root, filePath);
  return value === "" || (value !== ".." && !value.startsWith(`..${path.sep}`));
}

function addFinding(filePath, type, detail) {
  findings.push({ file: relative(filePath), type, detail });
}

function addWarning(filePath, type, detail) {
  warnings.push({ file: relative(filePath), type, detail });
}

async function isProbablyText(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (!textExtensions.has(extension)) return false;
  const handle = await fs.open(filePath, "r");
  try {
    const sample = Buffer.alloc(8192);
    const { bytesRead } = await handle.read(sample, 0, sample.length, 0);
    return !sample.subarray(0, bytesRead).includes(0);
  } finally {
    await handle.close();
  }
}

function scanText(filePath, text) {
  const slash = "\\/";
  const privateHomePatterns = [
    new RegExp(`${slash}Users${slash}[A-Za-z0-9._-]+(?:${slash}[^\\s'\"\`)>,]*)?`, "g"),
    new RegExp(`${slash}home${slash}[A-Za-z0-9._-]+(?:${slash}[^\\s'\"\`)>,]*)?`, "g"),
    new RegExp(`${slash}root(?:${slash}[^\\s'\"\`)>,]*)?`, "g"),
    new RegExp(`${slash}private${slash}(?:var|tmp)(?:${slash}[^\\s'\"\`)>,]*)?`, "g"),
    /[A-Za-z]:\\(?:Users|Documents and Settings)\\[^\s'"`)>,]+/g,
    /file:\/{2,3}(?:Users|home|root|private|var|etc|opt)\/[^\s'"`)>,]*/g
  ];
  for (const pattern of privateHomePatterns) {
    const match = pattern.exec(text);
    if (match && !match[0].includes("<") && !match[0].includes("$NERO_DESIGN_TEAM_HOME")) {
      addFinding(filePath, "absolute-local-path", `contains ${match[0].slice(0, 120)}`);
      break;
    }
  }
  if (/-----BEGIN (?:RSA |OPENSSH |EC |DSA |)PRIVATE KEY-----/.test(text)) {
    addFinding(filePath, "private-key", "contains a private key block");
  }
  for (const [type, pattern] of tokenPatterns) {
    if (pattern.test(text)) addFinding(filePath, type, "contains a credential-shaped token");
  }
  if (secretAssignment.test(text)) addFinding(filePath, "secret-assignment", "contains a credential assignment");
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const target = path.join(directory, entry.name);
    const targetRelative = relative(target);
    if (entry.isSymbolicLink()) {
      let resolved;
      try {
        resolved = await fs.realpath(target);
      } catch (error) {
        addFinding(target, "broken-symlink", error.message);
        continue;
      }
      if (!insideRoot(resolved)) addFinding(target, "symlink-escape", `resolves outside root to ${resolved}`);
      else addWarning(target, "symlink", `release artifact contains a symlink to ${relative(resolved)}`);
      continue;
    }
    if (entry.isDirectory()) {
      if (privateDirectories.has(entry.name) || targetRelative === `case-library${path.sep}assets` || targetRelative === `assets${path.sep}private`) {
        addFinding(target, "private-directory", "private or worktree-only directory is present in the release artifact");
      }
      await walk(target);
      continue;
    }
    if (!entry.isFile()) {
      addFinding(target, "unsupported-file-type", "entry is not a regular file, directory, or symlink");
      continue;
    }

    filesScanned += 1;
    if (entry.name === ".env" || entry.name.startsWith(".env.")) addFinding(target, "env-file", "environment files must not be published");
    if ([".DS_Store", "Thumbs.db", "desktop.ini"].includes(entry.name)) addFinding(target, "system-file", "system metadata must not be published");
    if (path.extname(entry.name).toLowerCase() === ".json") jsonFiles.push(target);

    if (await isProbablyText(target)) {
      textFilesScanned += 1;
      scanText(target, await fs.readFile(target, "utf8"));
    } else {
      addWarning(target, "binary-file", "binary or unrecognized file requires allowlist review");
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

const status = findings.length || (strict && warnings.length) ? "fail" : warnings.length ? "review" : "pass";
const report = {
  root,
  strict,
  checked_at: new Date().toISOString(),
  status,
  summary: { files_scanned: filesScanned, text_files_scanned: textFilesScanned, warnings: warnings.length, errors: findings.length },
  warnings,
  findings
};

console.log(JSON.stringify(report, null, 2));
if (status === "fail") process.exit(1);
