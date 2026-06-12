import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const mcpRoot = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(mcpRoot, "..");
const tokenRoot = path.join(root, "tokens");
const templateRoot = path.join(root, "templates");
const scriptRoot = path.join(root, "scripts");
const caseLibraryRoot = path.join(root, "case-library");
const externalAssetRoot = path.join(root, "assets", "external");
const snapshotsIndexPath = path.join(caseLibraryRoot, "snapshots", "index.json");
const candidatesPath = path.join(caseLibraryRoot, "github-candidates.json");
const templateRegistryPath = path.join(root, "generators", "templates.json");

const version = "1.7.0";
const allowedRoutes = [
  "frontend-ui",
  "image-report",
  "ppt",
  "short-video",
  "ai-image-generation",
  "new-project",
  "project-integration",
  "case-library",
  "visual-audit",
  "visual-score",
  "production-check"
];

const artifactRoutes = ["frontend-ui", "image-report", "ppt", "short-video", "ai-image-generation"];
const tokenFiles = {
  colors: "colors.json",
  typography: "typography.json",
  spacing: "spacing.json",
  radius: "radius.json",
  shadow: "shadow.json",
  motion: "motion.json",
  chart: "chart.json"
};

const tools = [
  {
    name: "nero_design_route",
    description: "Classify a NERO design task and return the route, rules, template, and recommended tool calls.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        task: { type: "string", description: "User request or task summary." },
        preferred_route: { type: "string", enum: allowedRoutes, description: "Optional explicit route override." }
      },
      required: ["task"]
    }
  },
  {
    name: "nero_design_get_tokens",
    description: "Read NERO design tokens and token build-output status.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        token_sets: {
          type: "array",
          items: { type: "string", enum: Object.keys(tokenFiles) },
          description: "Token groups to read. Omit for all groups."
        },
        include_build_outputs: { type: "boolean", default: true }
      }
    }
  },
  {
    name: "nero_design_list_templates",
    description: "List local NERO templates, routes, package files, and QA checklists.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        route: { type: "string", enum: artifactRoutes, description: "Optional route filter." }
      }
    }
  },
  {
    name: "nero_design_get_case_snapshot",
    description: "Read a lightweight GitHub case snapshot by repo, route, or candidate id.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        repo: { type: "string", description: "Repository in owner/repo form." },
        route: { type: "string", enum: ["frontend-ui", "image-report", "ppt", "short-video"] },
        candidate_id: { type: "string" },
        include_summary: { type: "boolean", default: true },
        include_file_index: { type: "boolean", default: false }
      }
    }
  },
  {
    name: "nero_design_import_github_case",
    description: "Import a lightweight GitHub case snapshot. Defaults to dry-run; execute=true runs the local importer.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        repo: { type: "string", description: "Repository URL or owner/repo." },
        route: { type: "string", enum: ["frontend-ui", "image-report", "ppt", "short-video"] },
        candidate_id: { type: "string" },
        execute: { type: "boolean", default: false }
      },
      required: ["repo", "route"]
    }
  },
  {
    name: "nero_design_build_tokens",
    description: "Build NERO design token outputs. Defaults to dry-run; execute=true runs build-tokens.mjs.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        execute: { type: "boolean", default: false }
      }
    }
  },
  {
    name: "nero_design_generate_project",
    description: "Generate a NERO design project from a local template or initialize an existing project with .nero-design/manifest.json. Defaults to dry-run; execute=true creates files.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        mode: { type: "string", enum: ["new", "init"], default: "new" },
        route: { type: "string", enum: artifactRoutes },
        name: { type: "string" },
        out: { type: "string" },
        project_root: { type: "string" },
        execute: { type: "boolean", default: false }
      },
      required: ["route"]
    }
  },
  {
    name: "nero_design_visual_qa",
    description: "Run or preview the local visual QA script for a visual manifest.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        manifest_path: { type: "string" },
        execute: { type: "boolean", default: true }
      },
      required: ["manifest_path"]
    }
  },
  {
    name: "nero_design_score",
    description: "Run or preview the local visual scoring script for a score manifest.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        manifest_path: { type: "string" },
        execute: { type: "boolean", default: true }
      },
      required: ["manifest_path"]
    }
  },
  {
    name: "nero_design_production_check",
    description: "Run or preview the local production-check script for a production manifest.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        manifest_path: { type: "string" },
        execute: { type: "boolean", default: true }
      },
      required: ["manifest_path"]
    }
  }
];

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function readTextIfExists(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function runNode(scriptName, args = []) {
  const scriptPath = path.join(scriptRoot, scriptName);
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: root,
    encoding: "utf8"
  });
  return {
    ok: result.status === 0,
    status: result.status,
    command: [process.execPath, scriptPath, ...args],
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function commandPreview(scriptName, args = []) {
  return {
    execute: false,
    command: [process.execPath, path.join(scriptRoot, scriptName), ...args],
    note: "Dry-run only. Pass execute=true to run this local script."
  };
}

function inferRoute(task, preferredRoute) {
  if (preferredRoute && allowedRoutes.includes(preferredRoute)) return preferredRoute;
  const text = String(task || "").toLowerCase();
  const checks = [
    ["production-check", ["production", "pass/review/fail", "final check", "交付检查"]],
    ["project-integration", [".nero-design", "manifest", "integrate", "integration", "接入", "集成", "后台支持", "设计系统"]],
    ["visual-score", ["score", "scoring", "评分"]],
    ["visual-audit", ["audit", "qa", "review", "检查", "审查"]],
    ["case-library", ["case", "snapshot", "github", "案例", "快照"]],
    ["ai-image-generation", ["gpt-image", "image brief", "cover", "background", "视觉素材"]],
    ["short-video", ["remotion", "video", "short video", "短视频", "动效"]],
    ["ppt", ["ppt", "pptx", "deck", "slide", "slides", "演示", "幻灯片", "web deck", "网页ppt", "网页 ppt", "横向翻页"]],
    ["image-report", ["satori", "sharp", "long image", "report card", "长图", "研报图"]],
    ["frontend-ui", ["frontend", "dashboard", "ui", "react", "shadcn", "html", "diagram", "architecture", "single-file", "前端", "界面", "架构图", "图解", "计划页"]]
  ];
  for (const [route, keywords] of checks) {
    if (keywords.some((keyword) => text.includes(keyword))) return route;
  }
  return "frontend-ui";
}

function inferPptSubroute(task) {
  const text = String(task || "").toLowerCase();
  const hasAny = (keywords) => keywords.some((keyword) => text.includes(keyword));
  if (hasAny(["template", "source deck", "same layout", "follow this", "corporate template", "模板", "源ppt", "源 ppt", "沿用", "同样版式"])) {
    return "template-following";
  }
  if (hasAny(["html", "web ppt", "web deck", "horizontal", "swiss", "magazine", "网页", "横向翻页", "瑞士风", "杂志风", "演讲", "分享"])) {
    return "web-ppt-html";
  }
  if (hasAny(["audit", "critique", "redesign", "upgrade", "审美", "诊断", "美化", "优化", "改版", "质量门禁"])) {
    return "ppt-design-audit";
  }
  if (hasAny(["dry-run", "sample", "local template", "pptxgenjs", "轻量", "样例", "本地模板", "验证模板"])) {
    return "legacy-local-pptx";
  }
  return "formal-pptx";
}

function pptRoutingMetadata(task) {
  const pptSubroute = inferPptSubroute(task);
  const map = {
    "formal-pptx": {
      primary_engine: "Presentations",
      secondary_rules: ["references/ppt-business-design.md", "references/visual-qa.md"],
      legacy_fallback: "PptxGenJS local template only when Presentations is unavailable or a lightweight local sample is requested."
    },
    "template-following": {
      primary_engine: "Presentations template-following",
      secondary_rules: ["references/ppt-business-design.md", "references/visual-qa.md"],
      legacy_fallback: "No local PptxGenJS fallback unless the user explicitly abandons template fidelity."
    },
    "ppt-design-audit": {
      primary_engine: "NERO design review",
      secondary_rules: ["references/ppt-business-design.md", "references/visual-qa.md"],
      legacy_fallback: "No generation engine required unless the audit becomes a production task."
    },
    "web-ppt-html": {
      primary_engine: "NERO web PPT HTML route",
      secondary_rules: ["references/web-ppt.md", "references/effective-html.md", "references/ppt-business-design.md", "references/visual-qa.md"],
      guizang_refresh: {
        source_repo: "op7418/guizang-ppt-skill",
        source_url: "https://github.com/op7418/guizang-ppt-skill",
        license: "AGPL-3.0",
        license_status: "restricted",
        snapshot: path.join(caseLibraryRoot, "snapshots", "op7418__guizang-ppt-skill", "snapshot.json"),
        asset_pack: path.join(externalAssetRoot, "guizang-ppt-skill", "manifest.json"),
        validator: path.join(scriptRoot, "validate-web-ppt.mjs"),
        quality_gates: [
          "Swiss body slides use registered S01-S22 data-layout ids",
          "local images declare data-image-slot",
          "S22 image hero uses s22-hero-21x9",
          "SVG is geometry-only; visible labels stay in HTML",
          "gpt-image-2 creates素材 only; exact text and figures are layered later"
        ]
      },
      legacy_fallback: "Use old guizang-ppt-skill as read-only reference only if NERO web PPT rules are insufficient or user explicitly names it. Do not copy AGPL templates/scripts by default."
    },
    "legacy-local-pptx": {
      primary_engine: "PptxGenJS legacy local fallback",
      secondary_rules: ["references/ppt.md", "references/ppt-business-design.md", "references/visual-qa.md"],
      legacy_fallback: "This is already the fallback route; do not use as default formal PPTX production."
    }
  };
  return {
    ppt_subroute: pptSubroute,
    ...map[pptSubroute],
    fused_reference_skills: pptSubroute === "web-ppt-html"
      ? ["ppt-design-reference", "guizang-ppt-skill", "effective-html"]
      : ["ppt-design-reference", "guizang-ppt-skill"],
    deletion_policy: "Do not delete old PPT skills automatically; treat them as read-only references under NERO routing."
  };
}

function frontendTasteFusionMetadata() {
  return {
    fused_reference_skills: ["impeccable", "taste-skill"],
    fusion_scope: "NERO-calibrated frontend design-quality layer for design read, anti-slop checks, deterministic UI review, and final polish.",
    source_repositories: [
      {
        name: "pbakaus/impeccable",
        url: "https://github.com/pbakaus/impeccable",
        license: "Apache-2.0"
      },
      {
        name: "Leonxlnx/taste-skill",
        url: "https://github.com/Leonxlnx/taste-skill",
        license: "MIT"
      }
    ],
    install_policy: "Do not install external npm packages, hooks, live mode, or standalone skills by default."
  };
}

function effectiveHtmlFusionMetadata() {
  return {
    effective_html: {
      fused_reference_skills: ["effective-html"],
      source_repo: "plannotator/effective-html",
      source_url: "https://github.com/plannotator/effective-html",
      license: "MIT",
      bundled_examples_license: "Apache-2.0",
      snapshot: path.join(caseLibraryRoot, "snapshots", "plannotator__effective-html", "snapshot.json"),
      asset_pack: path.join(externalAssetRoot, "effective-html", "manifest.json"),
      use_for: [
        "self-contained HTML artifacts",
        "SVG-first architecture diagrams",
        "visual plan pages",
        "single-file HTML explainers",
        "web PPT diagram pages"
      ],
      install_policy: "Do not install as an independent default Skill. Use as NERO-fused reference only."
    }
  };
}

async function routeTool(args) {
  const route = inferRoute(args.task, args.preferred_route);
  const templateRegistry = await readJson(templateRegistryPath);
  const template = templateRegistry.routes?.[route]?.template || null;
  const ruleMap = {
    "frontend-ui": "references/frontend-ui.md",
    "image-report": "references/image-report.md",
    ppt: "references/ppt.md",
    "short-video": "references/short-video.md",
    "ai-image-generation": "references/ai-image-generation.md",
    "new-project": "references/generator.md",
    "project-integration": "references/project-integration.md",
    "case-library": "references/case-library.md",
    "visual-audit": "references/visual-qa.md",
    "visual-score": "references/visual-score.md",
    "production-check": "references/production-check.md"
  };
  const result = {
    route,
    template,
    rules: [...new Set([
      ruleMap[route],
      route === "ppt" ? "references/ppt-business-design.md" : null,
      route === "ppt" ? "references/web-ppt.md" : null,
      route === "frontend-ui" || route === "ppt" ? "references/effective-html.md" : null,
      route === "project-integration" ? "references/generator.md" : null,
      "references/visual-qa.md"
    ].filter(Boolean))],
    recommended_tools: recommendTools(route),
    boundary: "MCP-lite returns structured local context and script results. Skill remains responsible for design judgment and final review."
  };
  if (route === "frontend-ui" || route === "visual-audit") {
    Object.assign(result, frontendTasteFusionMetadata());
  }
  if (route === "frontend-ui" || route === "visual-audit" || route === "ppt") {
    Object.assign(result, effectiveHtmlFusionMetadata());
  }
  if (route === "ppt") {
    Object.assign(result, pptRoutingMetadata(args.task));
  }
  return result;
}

function recommendTools(route) {
  if (route === "case-library") return ["nero_design_get_case_snapshot", "nero_design_import_github_case"];
  if (route === "project-integration") return ["nero_design_generate_project", "nero_design_production_check"];
  if (route === "production-check") return ["nero_design_production_check"];
  if (route === "visual-score") return ["nero_design_score"];
  if (route === "visual-audit") return ["nero_design_visual_qa"];
  return ["nero_design_get_tokens", "nero_design_list_templates", "nero_design_get_case_snapshot"];
}

async function getTokens(args) {
  const selected = args.token_sets?.length ? args.token_sets : Object.keys(tokenFiles);
  const tokens = {};
  for (const name of selected) {
    if (!tokenFiles[name]) throw new Error(`Unsupported token set: ${name}`);
    tokens[name] = await readJson(path.join(tokenRoot, tokenFiles[name]));
  }
  const buildOutputs = {
    css_variables: path.join(root, "build", "css", "nero-tokens.css"),
    tailwind: path.join(root, "build", "tailwind", "nero-tailwind.cjs"),
    report_theme: path.join(root, "build", "themes", "report-theme.mjs"),
    pptx_theme: path.join(root, "build", "themes", "pptx-theme.mjs"),
    remotion_theme: path.join(root, "build", "themes", "remotion-theme.ts")
  };
  const outputStatus = {};
  if (args.include_build_outputs !== false) {
    for (const [key, filePath] of Object.entries(buildOutputs)) {
      outputStatus[key] = { path: filePath, exists: await exists(filePath) };
    }
  }
  return {
    root,
    token_root: tokenRoot,
    token_sets: selected,
    tokens,
    build_outputs: outputStatus
  };
}

async function listTemplates(args) {
  const registry = await readJson(templateRegistryPath);
  const entries = [];
  for (const [route, config] of Object.entries(registry.routes || {})) {
    if (args.route && route !== args.route) continue;
    const templatePath = path.join(templateRoot, config.template);
    entries.push({
      route,
      template: config.template,
      description: config.description,
      default_name: config.default_name,
      path: templatePath,
      exists: await exists(templatePath),
      package_json: await exists(path.join(templatePath, "package.json")),
      qa_checklist: await exists(path.join(templatePath, "qa.md"))
    });
  }
  const dirs = await fs.readdir(templateRoot, { withFileTypes: true });
  return {
    template_root: templateRoot,
    registry_version: registry.version,
    templates: entries,
    unregistered_dirs: dirs
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((name) => !entries.some((entry) => entry.template === name))
  };
}

async function resolveSnapshot(args) {
  const index = await readJson(snapshotsIndexPath);
  const candidates = await readJson(candidatesPath);
  const normalizedRepo = args.repo ? normalizeRepo(args.repo) : null;
  let entry = null;
  if (normalizedRepo) {
    entry = index.snapshots?.find((item) => normalizeRepo(item.repo) === normalizedRepo) || null;
  }
  if (!entry && args.candidate_id) {
    const candidate = candidates.candidates?.find((item) => item.id === args.candidate_id);
    if (candidate?.snapshot_path) {
      entry = index.snapshots?.find((item) => item.snapshot_path === candidate.snapshot_path) || {
        repo: candidate.repository,
        route: candidate.route,
        source_url: candidate.source_url,
        snapshot_path: candidate.snapshot_path,
        status: "unknown"
      };
    }
  }
  if (!entry && args.route) {
    entry = index.snapshots?.find((item) => item.route === args.route) || null;
  }
  return { index, candidates, entry };
}

function normalizeRepo(repo) {
  return String(repo || "")
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/\/$/i, "")
    .toLowerCase();
}

async function getCaseSnapshot(args) {
  const { index, candidates, entry } = await resolveSnapshot(args);
  if (!entry) {
    return {
      status: "not_found",
      snapshots_index: snapshotsIndexPath,
      known_snapshots: index.snapshots || [],
      matching_candidates: (candidates.candidates || []).filter((candidate) => {
        if (args.route && candidate.route !== args.route) return false;
        if (args.repo && normalizeRepo(candidate.repository) !== normalizeRepo(args.repo)) return false;
        if (args.candidate_id && candidate.id !== args.candidate_id) return false;
        return true;
      })
    };
  }
  const snapshot = await readJson(entry.snapshot_path);
  const summaryPath = path.join(path.dirname(entry.snapshot_path), "summary.md");
  const summary = args.include_summary === false ? undefined : await readTextIfExists(summaryPath);
  const fileIndex = args.include_file_index ? await readJson(snapshot.file_index_path) : undefined;
  return {
    status: "ready",
    entry,
    snapshot,
    summary_path: summaryPath,
    summary,
    file_index: fileIndex,
    call_rule: "Read summary first; use file-index only for path-level context; do not copy source or assets without license review."
  };
}

async function importGithubCase(args) {
  const commandArgs = [args.repo, "--route", args.route];
  if (args.candidate_id) commandArgs.push("--candidate-id", args.candidate_id);
  if (!args.execute) return commandPreview("import-github-case.mjs", commandArgs);
  return runNode("import-github-case.mjs", commandArgs);
}

async function buildTokens(args) {
  if (!args.execute) return commandPreview("build-tokens.mjs");
  return runNode("build-tokens.mjs");
}

async function generateProject(args) {
  const commandArgs = [args.mode === "init" ? "init" : "new", args.route];
  if (args.name) commandArgs.push("--name", args.name);
  if (args.out) commandArgs.push("--out", args.out);
  if (args.project_root) commandArgs.push("--project-root", args.project_root);
  if (!args.execute) return commandPreview("nero-design.mjs", commandArgs);
  return runNode("nero-design.mjs", commandArgs);
}

async function visualQa(args) {
  if (!args.execute) return commandPreview("visual-qa.mjs", [args.manifest_path]);
  return runNode("visual-qa.mjs", [args.manifest_path]);
}

async function score(args) {
  if (!args.execute) return commandPreview("score-visual.mjs", [args.manifest_path]);
  return runNode("score-visual.mjs", [args.manifest_path]);
}

async function productionCheck(args) {
  if (!args.execute) return commandPreview("production-check.mjs", [args.manifest_path]);
  return runNode("production-check.mjs", [args.manifest_path]);
}

async function callTool(name, args = {}) {
  const handlers = {
    nero_design_route: routeTool,
    nero_design_get_tokens: getTokens,
    nero_design_list_templates: listTemplates,
    nero_design_get_case_snapshot: getCaseSnapshot,
    nero_design_import_github_case: importGithubCase,
    nero_design_build_tokens: buildTokens,
    nero_design_generate_project: generateProject,
    nero_design_visual_qa: visualQa,
    nero_design_score: score,
    nero_design_production_check: productionCheck
  };
  const handler = handlers[name];
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  return handler(args);
}

function jsonTextResult(value) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

async function handleMessage(message) {
  if (message.method === "initialize") {
    return {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "nero-design-team-mcp-lite", version }
    };
  }
  if (message.method === "tools/list") {
    return { tools };
  }
  if (message.method === "tools/call") {
    const result = await callTool(message.params?.name, message.params?.arguments || {});
    return jsonTextResult(result);
  }
  throw new Error(`Unsupported MCP method: ${message.method}`);
}

function writeMcpMessage(message) {
  const payload = Buffer.from(JSON.stringify(message), "utf8");
  process.stdout.write(`Content-Length: ${payload.length}\r\n\r\n`);
  process.stdout.write(payload);
}

function startMcpServer() {
  let buffer = Buffer.alloc(0);
  process.stdin.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      const headerEnd = buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) return;
      const header = buffer.slice(0, headerEnd).toString("utf8");
      const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);
      if (!lengthMatch) throw new Error("Missing Content-Length header.");
      const contentLength = Number(lengthMatch[1]);
      const messageStart = headerEnd + 4;
      const messageEnd = messageStart + contentLength;
      if (buffer.length < messageEnd) return;
      const raw = buffer.slice(messageStart, messageEnd).toString("utf8");
      buffer = buffer.slice(messageEnd);
      const message = JSON.parse(raw);
      if (message.id === undefined) continue;
      handleMessage(message)
        .then((result) => {
          writeMcpMessage({ jsonrpc: "2.0", id: message.id, result });
        })
        .catch((error) => {
          writeMcpMessage({
            jsonrpc: "2.0",
            id: message.id,
            error: { code: -32000, message: error.message }
          });
        });
    }
  });
}

function usage() {
  return [
    "Usage:",
    "  node mcp-lite/server.mjs",
    "  node mcp-lite/server.mjs --list-tools",
    "  node mcp-lite/server.mjs --dry-run <tool-name> '<json-args>'",
    "",
    "This server has no external npm dependencies and does not register itself with Codex."
  ].join("\n");
}

async function main() {
  const [command, toolName, rawArgs] = process.argv.slice(2);
  if (command === "--help" || command === "-h") {
    console.log(usage());
    return;
  }
  if (command === "--list-tools") {
    console.log(JSON.stringify({ server: "nero-design-team-mcp-lite", version, tools }, null, 2));
    return;
  }
  if (command === "--dry-run") {
    if (!toolName) throw new Error("Missing tool name.");
    const args = rawArgs ? JSON.parse(rawArgs) : {};
    const result = await callTool(toolName, args);
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command) throw new Error(usage());
  startMcpServer();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
