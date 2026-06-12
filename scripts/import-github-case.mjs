import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const caseLibraryRoot = path.join(root, "case-library");
const candidatesPath = path.join(caseLibraryRoot, "github-candidates.json");
const snapshotsRoot = path.join(caseLibraryRoot, "snapshots");
const snapshotsIndexPath = path.join(snapshotsRoot, "index.json");
const allowedRoutes = new Set(["frontend-ui", "image-report", "ppt", "short-video"]);
const maxSummaryChars = 1200;
const maxFileIndex = 40;
const maxImages = 6;

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function usage() {
  return [
    "Usage:",
    "  node scripts/import-github-case.mjs <owner/repo-or-url> --route <route> --candidate-id <id>",
    "",
    "Routes:",
    "  frontend-ui, image-report, ppt, short-video",
    "",
    "Behavior:",
    "  Creates case-library/snapshots/<owner>__<repo>/",
    "  Stores README summary, license summary, key file path index, and image URLs only.",
    "  Does not clone repositories, install dependencies, or copy source files."
  ].join("\n");
}

function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    return { help: true };
  }
  const [repoInput, ...rest] = argv;
  const options = { repoInput };
  for (let index = 0; index < rest.length; index += 1) {
    const key = rest[index];
    const value = rest[index + 1];
    if (key === "--route") {
      options.route = value;
      index += 1;
    } else if (key === "--candidate-id") {
      options.candidateId = value;
      index += 1;
    } else {
      throw new Error(`Unknown option: ${key}`);
    }
  }
  return options;
}

function parseRepo(input) {
  if (!input) {
    throw new Error("Missing repository input.");
  }
  const clean = input.trim().replace(/\.git$/, "");
  const githubMatch = clean.match(/github\.com[:/]+([^/]+)\/([^/#?]+)/i);
  const simpleMatch = clean.match(/^([^/\s]+)\/([^/\s]+)$/);
  const match = githubMatch || simpleMatch;
  if (!match) {
    throw new Error(`Cannot parse GitHub repo: ${input}`);
  }
  return {
    owner: match[1],
    repo: match[2]
  };
}

async function readJsonIfExists(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return response.json();
}

function decodeBase64(content) {
  return Buffer.from(String(content || "").replace(/\n/g, ""), "base64").toString("utf8");
}

async function fetchOptionalContent(owner, repo, endpoint) {
  try {
    const data = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/${endpoint}`);
    return {
      data,
      text: data.content ? decodeBase64(data.content) : ""
    };
  } catch (error) {
    return {
      data: null,
      text: "",
      error: error.message
    };
  }
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+]\(([^)]+)\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function summarizeReadme(readme) {
  const text = stripMarkdown(readme);
  if (!text) return "";
  return text.length > maxSummaryChars ? `${text.slice(0, maxSummaryChars).trim()}...` : text;
}

function absolutizeImageUrl(src, owner, repo, branch, readmePath) {
  if (!src || /^data:/i.test(src)) return null;
  if (/^https?:\/\//i.test(src)) return src;
  const readmeDir = path.posix.dirname(readmePath || "README.md");
  const normalized = path.posix.normalize(path.posix.join(readmeDir === "." ? "" : readmeDir, src));
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${normalized}`;
}

function extractImageRefs(markdown, owner, repo, branch, readmePath) {
  const refs = [];
  const markdownImage = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const htmlImage = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  for (const regex of [markdownImage, htmlImage]) {
    let match;
    while ((match = regex.exec(markdown)) && refs.length < maxImages) {
      const url = absolutizeImageUrl(match[1], owner, repo, branch, readmePath);
      if (url && !refs.includes(url)) refs.push(url);
    }
  }
  return refs;
}

function pathRelevance(filePath) {
  const lower = filePath.toLowerCase();
  const patterns = [
    ["readme", 100],
    ["license", 98],
    ["package.json", 94],
    ["components", 88],
    ["dashboard", 86],
    ["examples", 84],
    ["demo", 82],
    ["template", 80],
    ["theme", 78],
    ["docs", 72],
    ["app", 64],
    ["src", 60],
    ["pages", 56],
    ["public", 48]
  ];
  for (const [needle, score] of patterns) {
    if (lower.includes(needle)) return score;
  }
  return 0;
}

function shouldIndexPath(filePath) {
  const lower = filePath.toLowerCase();
  const blockedSegments = [
    "__image_snapshots__",
    "__snapshots__",
    ".github/issue_template/",
    "node_modules/",
    ".next/",
    ".turbo/",
    "coverage/",
    "dist/",
    "build/",
    ".cache/"
  ];
  return !blockedSegments.some((segment) => lower.includes(segment));
}

function classifyPath(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.includes("license")) return "license";
  if (lower.includes("readme")) return "readme";
  if (lower.includes("package.json")) return "package";
  if (lower.includes("component")) return "component";
  if (lower.includes("dashboard")) return "dashboard";
  if (lower.includes("example") || lower.includes("demo")) return "example";
  if (lower.includes("theme")) return "theme";
  if (lower.includes("doc")) return "docs";
  if (lower.match(/\.(png|jpg|jpeg|webp|gif|svg)$/)) return "image";
  return "path";
}

function selectKeyFiles(tree) {
  return (tree || [])
    .filter((item) => item.type === "blob")
    .filter((item) => shouldIndexPath(item.path))
    .map((item) => ({
      path: item.path,
      type: classifyPath(item.path),
      relevance: pathRelevance(item.path)
    }))
    .filter((item) => item.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance || a.path.localeCompare(b.path))
    .slice(0, maxFileIndex);
}

function detectLicenseStatus(licenseData, licenseText) {
  const spdx = licenseData?.license?.spdx_id || "";
  const key = licenseData?.license?.key || "";
  const haystack = `${spdx} ${key} ${licenseText.slice(0, 500)}`.toLowerCase();
  const permissive = ["mit", "apache-2.0", "bsd-2-clause", "bsd-3-clause", "isc", "mpl-2.0"];
  const restricted = ["gpl", "agpl", "lgpl", "polyform", "cc-by-nc", "non-commercial"];
  if (permissive.some((item) => haystack.includes(item))) return "permissive";
  if (restricted.some((item) => haystack.includes(item))) return "restricted";
  return "unknown";
}

function inferKeyPatterns(fileIndex, candidate) {
  const patterns = [];
  const paths = fileIndex.map((item) => item.path.toLowerCase()).join("\n");
  if (paths.includes("dashboard")) patterns.push("dashboard layout and analytics workspace structure");
  if (paths.includes("component")) patterns.push("reusable component taxonomy");
  if (paths.includes("theme")) patterns.push("theme or token organization");
  if (paths.includes("example") || paths.includes("demo")) patterns.push("example-driven pattern extraction");
  if (candidate?.style) patterns.push(candidate.style);
  return [...new Set(patterns)].slice(0, 6);
}

function buildSummaryMarkdown(snapshot) {
  return [
    `# ${snapshot.repo} Snapshot`,
    "",
    `Route: ${snapshot.route}`,
    `Source: ${snapshot.source_url}`,
    `License status: ${snapshot.license_status}`,
    "",
    "## Design Value",
    snapshot.purpose || "Design reference candidate.",
    "",
    "## Style",
    snapshot.style || "No style summary available.",
    "",
    "## Applies To",
    ...(snapshot.applies_to || []).map((item) => `- ${item}`),
    "",
    "## Disabled When",
    ...(snapshot.disabled_when || []).map((item) => `- ${item}`),
    "",
    "## Call Hint",
    `Use this snapshot as a lightweight design reference for ${snapshot.template}. Read snapshot.json first, then file-index.json only if paths are needed. Do not treat it as factual evidence or copy source/assets without license review.`,
    "",
    "## README Summary",
    snapshot.readme_summary || "README unavailable or empty."
  ].join("\n");
}

function buildLicenseSummary(snapshot, licenseData, licenseError) {
  const licenseName = licenseData?.license?.name || "Unknown";
  const spdx = licenseData?.license?.spdx_id || "NOASSERTION";
  return [
    `# ${snapshot.repo} License Summary`,
    "",
    `License file found: ${licenseData ? "yes" : "no"}`,
    `License: ${licenseName}`,
    `SPDX: ${spdx}`,
    `Status: ${snapshot.license_status}`,
    licenseError ? `Fetch note: ${licenseError}` : "",
    "",
    "## Usage Boundary",
    "- Reference layout, component taxonomy, interaction patterns, and workflow ideas.",
    "- Do not copy brand assets, logos, illustrations, page copy, or source code into NERO artifacts without separate license review.",
    "- Snapshot metadata is a design reference, not factual evidence."
  ].filter(Boolean).join("\n");
}

async function updateCandidateSnapshot(candidateId, snapshotPath) {
  if (!candidateId) return;
  const data = await readJsonIfExists(candidatesPath, null);
  if (!data?.candidates) return;
  let changed = false;
  for (const candidate of data.candidates) {
    if (candidate.id === candidateId) {
      candidate.snapshot_path = snapshotPath;
      changed = true;
      break;
    }
  }
  if (changed) {
    data.updated_at = todayIsoDate();
    await writeJson(candidatesPath, data);
  }
}

async function updateSnapshotsIndex(entry) {
  const index = await readJsonIfExists(snapshotsIndexPath, {
    version: "1.0.0",
    updated_at: todayIsoDate(),
    purpose: "Lightweight local snapshots for GitHub design references. No full repository clones, no copied source files.",
    snapshots: []
  });
  index.updated_at = todayIsoDate();
  index.snapshots = (index.snapshots || []).filter((item) => item.repo !== entry.repo);
  index.snapshots.push(entry);
  index.snapshots.sort((a, b) => a.repo.localeCompare(b.repo));
  await writeJson(snapshotsIndexPath, index);
}

async function loadCandidate(candidateId) {
  if (!candidateId) return null;
  const data = await readJsonIfExists(candidatesPath, null);
  return data?.candidates?.find((item) => item.id === candidateId) || null;
}

async function writeBlockedSnapshot(context, reason) {
  const { owner, repo, route, candidateId, candidate, snapshotDir } = context;
  await fs.mkdir(snapshotDir, { recursive: true });
  const snapshotPath = path.join(snapshotDir, "snapshot.json");
  const fileIndexPath = path.join(snapshotDir, "file-index.json");
  const snapshot = {
    status: "blocked",
    blocked_reason: reason,
    repo: `${owner}/${repo}`,
    route,
    source_url: `https://github.com/${owner}/${repo}`,
    candidate_id: candidateId || null,
    purpose: candidate?.purpose || "",
    style: candidate?.style || "",
    tokens: candidate?.tokens || [],
    template: candidate?.template || "",
    license_status: "unknown",
    applies_to: candidate?.applies_to || [],
    disabled_when: candidate?.disabled_when || [],
    notes: candidate?.notes || "Import blocked before GitHub metadata could be fetched.",
    readme_summary: "",
    key_patterns: [],
    image_refs: [],
    file_index_path: fileIndexPath
  };
  await writeJson(snapshotPath, snapshot);
  await writeJson(fileIndexPath, { repo: snapshot.repo, files: [] });
  await fs.writeFile(path.join(snapshotDir, "summary.md"), buildSummaryMarkdown(snapshot), "utf8");
  await fs.writeFile(path.join(snapshotDir, "license-summary.md"), buildLicenseSummary(snapshot, null, reason), "utf8");
  await updateSnapshotsIndex({
    repo: snapshot.repo,
    route,
    source_url: snapshot.source_url,
    snapshot_path: snapshotPath,
    license_status: "unknown",
    token_budget_hint: "Read summary.md first; snapshot import is blocked.",
    updated_at: todayIsoDate(),
    status: "blocked"
  });
  await updateCandidateSnapshot(candidateId, snapshotPath);
}

async function importSnapshot(options) {
  const { owner, repo } = parseRepo(options.repoInput);
  if (!allowedRoutes.has(options.route)) {
    throw new Error(`Unsupported route: ${options.route || "(missing)"}. ${usage()}`);
  }

  const candidate = await loadCandidate(options.candidateId);
  const snapshotDir = path.join(snapshotsRoot, `${owner}__${repo}`);
  const context = { owner, repo, route: options.route, candidateId: options.candidateId, candidate, snapshotDir };

  try {
    const repoData = await fetchJson(`https://api.github.com/repos/${owner}/${repo}`);
    const branch = repoData.default_branch || "main";
    const readme = await fetchOptionalContent(owner, repo, "readme");
    const license = await fetchOptionalContent(owner, repo, "license");
    const treeData = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
    const fileIndex = selectKeyFiles(treeData.tree);
    const fileIndexPath = path.join(snapshotDir, "file-index.json");
    const snapshotPath = path.join(snapshotDir, "snapshot.json");
    const licenseStatus = detectLicenseStatus(license.data, license.text);

    await fs.mkdir(snapshotDir, { recursive: true });

    const snapshot = {
      status: "ready",
      repo: `${owner}/${repo}`,
      route: options.route,
      source_url: repoData.html_url || `https://github.com/${owner}/${repo}`,
      candidate_id: options.candidateId || null,
      purpose: candidate?.purpose || repoData.description || "GitHub design reference candidate.",
      style: candidate?.style || "",
      tokens: candidate?.tokens || [],
      template: candidate?.template || "",
      license_status: licenseStatus,
      applies_to: candidate?.applies_to || [],
      disabled_when: candidate?.disabled_when || [],
      notes: candidate?.notes || "Imported as lightweight local snapshot. Use as design reference only.",
      readme_summary: summarizeReadme(readme.text),
      key_patterns: inferKeyPatterns(fileIndex, candidate),
      image_refs: extractImageRefs(readme.text, owner, repo, branch, readme.data?.path || "README.md"),
      file_index_path: fileIndexPath
    };

    await writeJson(snapshotPath, snapshot);
    await writeJson(fileIndexPath, {
      repo: snapshot.repo,
      source_url: snapshot.source_url,
      default_branch: branch,
      truncated_by_github: Boolean(treeData.truncated),
      max_files: maxFileIndex,
      files: fileIndex
    });
    await fs.writeFile(path.join(snapshotDir, "summary.md"), buildSummaryMarkdown(snapshot), "utf8");
    await fs.writeFile(path.join(snapshotDir, "license-summary.md"), buildLicenseSummary(snapshot, license.data, license.error), "utf8");

    await updateSnapshotsIndex({
      repo: snapshot.repo,
      route: snapshot.route,
      source_url: snapshot.source_url,
      snapshot_path: snapshotPath,
      license_status: snapshot.license_status,
      token_budget_hint: "Read summary.md first, then snapshot.json; open file-index.json only when paths are needed.",
      updated_at: todayIsoDate(),
      status: "ready"
    });
    await updateCandidateSnapshot(options.candidateId, snapshotPath);

    console.log(`Imported lightweight snapshot: ${snapshotPath}`);
  } catch (error) {
    await writeBlockedSnapshot(context, error.message);
    console.error(`Snapshot import blocked: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  await importSnapshot(options);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
