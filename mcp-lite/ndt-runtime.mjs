import { readLibrary } from '../scripts/style-library.mjs';
import { readTaxonomy } from '../scripts/asset-library.mjs';
import { routeTool, allowedRoutes, taskModes } from "./routing.mjs";
import { contentContracts } from "../scripts/presentation-contract.mjs";
import { pptOperations } from "../scripts/ppt-engine-route.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { version, validateTool } from "./tool-contract.mjs";
import { createHash } from "node:crypto";

const mcpRoot = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(mcpRoot, "..");
const tokenRoot = path.join(root, "tokens");
const templateRoot = path.join(root, "templates");
const scriptRoot = path.join(root, "scripts");
const caseLibraryRoot = path.join(root, "case-library");
const snapshotsIndexPath = path.join(caseLibraryRoot, "snapshots", "index.json");
const candidatesPath = path.join(caseLibraryRoot, "github-candidates.json");
const templateRegistryPath = path.join(root, "generators", "templates.json");
const designRegistryPath = path.join(root, "registry", "design-team.json");
const designAssetCatalogPath = path.join(root, "registry", "design-assets.json");

const assetTaxonomy = await readTaxonomy(root);


const tokenFiles = {
  colors: "colors.json",
  typography: "typography.json",
  spacing: "spacing.json",
  radius: "radius.json",
  shadow: "shadow.json",
  motion: "motion.json",
  chart: "chart.json"
};


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
    encoding: "utf8",
    timeout: 110000,
    maxBuffer: 8 * 1024 * 1024
  });
  return {
    ok: result.status === 0,
    status: result.status,
    command: [process.execPath, scriptPath, ...args],
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || result.error?.message || "").trim()
  };
}

function commandPreview(scriptName, args = []) {
  return {
    execute: false,
    command: [process.execPath, path.join(scriptRoot, scriptName), ...args],
    note: "Dry-run only. Pass execute=true to run this local script."
  };
}

function shouldExecute(args) {
  if (Object.hasOwn(args, "execute") && typeof args.execute !== "boolean") {
    throw new Error("execute must be a boolean");
  }
  return args.execute === true;
}

function requireNonEmptyString(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value;
}

function isContained(parentPath, candidatePath) {
  const relative = path.relative(parentPath, candidatePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function nearestExistingRealPath(candidatePath) {
  let current = candidatePath;
  while (true) {
    try {
      return await fs.realpath(current);
    } catch (error) {
      if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
      const parent = path.dirname(current);
      if (parent === current) throw error;
      current = parent;
    }
  }
}

async function resolveProjectBoundary(rawProjectRoot) {
  const projectRoot = path.resolve(requireNonEmptyString(rawProjectRoot, "project_root"));
  let realProjectRoot;
  try {
    realProjectRoot = await fs.realpath(projectRoot);
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`project_root does not exist: ${projectRoot}`);
    throw error;
  }
  const stat = await fs.stat(realProjectRoot);
  if (!stat.isDirectory()) throw new Error(`project_root must be a directory: ${projectRoot}`);

  const realNdtRoot = await fs.realpath(root);
  if (isContained(root, projectRoot) || isContained(realNdtRoot, realProjectRoot)) {
    throw new Error(`project_root must be outside the NDT canonical root: ${root}`);
  }
  return { projectRoot, realProjectRoot, realNdtRoot };
}

async function resolveContainedProjectPath(boundary, rawPath, name, { mustExist = false, writeTarget = false } = {}) {
  const candidate = path.resolve(boundary.projectRoot, requireNonEmptyString(rawPath, name));
  if (!isContained(boundary.projectRoot, candidate)) {
    throw new Error(`${name} must be contained in project_root`);
  }

  let realCandidate;
  if (mustExist) {
    try {
      realCandidate = await fs.realpath(candidate);
    } catch (error) {
      if (error.code === "ENOENT") throw new Error(`${name} does not exist: ${candidate}`);
      throw error;
    }
  } else {
    realCandidate = await nearestExistingRealPath(candidate);
  }
  if (!isContained(boundary.realProjectRoot, realCandidate)) {
    throw new Error(`${name} resolves outside project_root`);
  }
  if (writeTarget && (isContained(root, candidate) || isContained(boundary.realNdtRoot, realCandidate))) {
    throw new Error(`${name} must not write inside the NDT canonical root`);
  }
  return candidate;
}

async function getRegistry(args) {
  const registry = await readJson(designRegistryPath);
  const assets = await readJson(designAssetCatalogPath);
  return {
    mcp_server: { name: "nero-design-team", version },
    library_contract: assets.library_contract,
    library_summary: { assets: assets.assets?.length || 0, styles: (assets.styles || []).filter(style => !style.deleted_at).length, cases: assets.cases?.length || 0 },
    registry_id: registry.registry_id,
    schema_version: registry.schema_version,
    version: registry.version,
    updated_at: registry.updated_at,
    authoritative: registry.authoritative,
    registry_profile: registry.registry_profile,
    system_classification: registry.system_classification,
    canonical_root: registry.authority?.canonical_root,
    truth_domains: registry.authority?.truth_domains,
    downstream_copies: registry.authority?.downstream_copies,
    verification: registry.verification,
    asset_catalog: {
      registry_id: assets.registry_id,
      version: assets.version,
      updated_at: assets.updated_at,
      authoritative: assets.authoritative,
      categories: assets.categories?.length || 0,
      recipes: assets.recipes?.length || 0,
      assets: assets.assets?.length || 0,
      open_integrity_issues: (assets.integrity_issues || []).filter((issue) => issue.status === "open").length
    },
    integrity_issues: args.include_integrity_issues === false ? undefined : assets.integrity_issues || [],
    library: args.include_library || args.recommended_only || args.style_id || args.search || args.tags || args.use_case_tags || args.limit !== undefined || args.offset !== undefined ? await readLibrary(root, { styleId: args.style_id, version: args.style_version, recommendedOnly: args.recommended_only, search: args.search, tags: args.tags, use_case_tags: args.use_case_tags, offset: args.offset, limit: args.limit }) : undefined,
    taxonomy_summary: { version: assets.taxonomy_version, visual_dimensions: assets.tag_dimensions, use_case_field: 'use_case_tags', classified_assets: assets.assets.filter(a => Object.values(a.tags || {}).some(values => values.length)).length },
    style_summary: { candidates: (assets.styles || []).filter(s => !s.deleted_at).flatMap(s => s.versions).filter(v => v.status === "candidate").length, approved: (assets.styles || []).filter(s => !s.deleted_at).flatMap(s => s.versions).filter(v => v.status === "approved" && v.approval?.by === "NERO").length },
    maturity_boundary: registry.verification?.maturity_boundary
  };
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
  const registeredTemplates = new Set(Object.values(registry.routes || {}).map((config) => config.template));
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
      .filter((name) => !registeredTemplates.has(name))
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
  const execute = shouldExecute(args);
  const commandArgs = [args.repo, "--route", args.route];
  if (args.candidate_id) commandArgs.push("--candidate-id", args.candidate_id);
  if (!execute) return commandPreview("import-github-case.mjs", commandArgs);
  return runNode("import-github-case.mjs", commandArgs);
}

async function buildTokens(args) {
  if (!shouldExecute(args)) return commandPreview("build-tokens.mjs");
  return runNode("build-tokens.mjs");
}

async function generateProject(args) {
  const execute = shouldExecute(args);
  const mode = args.mode === undefined || args.mode === "new" ? "new" : args.mode;
  if (!["new", "init"].includes(mode)) throw new Error("mode must be one of: new, init");
  if (mode === "init" && args.preset !== undefined) {
    throw new Error("mode=init does not accept preset because init does not copy template files");
  }
  const commandArgs = [mode, args.route];
  if (args.name) commandArgs.push("--name", args.name);
  if (args.out) commandArgs.push("--out", args.out);
  if (args.project_root) commandArgs.push("--project-root", args.project_root);
  if (args.preset) commandArgs.push("--preset", args.preset);
  if (args.frontend_profile) commandArgs.push("--frontend-profile", args.frontend_profile);
  if (!execute) return commandPreview("nero-design.mjs", commandArgs);
  return runNode("nero-design.mjs", commandArgs);
}

async function compileReportFigure(args) {
  const execute = shouldExecute(args);
  const action = args.action;
  if (!["list", "validate", "compile"].includes(action)) {
    throw new Error("action must be one of: list, validate, compile");
  }
  const pathArguments = ["project_root", "spec_path", "output_path", "receipt_path", "profile", "renderer"];
  if (action === "list") {
    const supplied = pathArguments.find((name) => args[name] !== undefined);
    if (supplied) throw new Error(`list does not accept ${supplied}`);
    const preview = commandPreview("report-figure-compiler.mjs", ["list"]);
    if (!execute) return preview;
    return runNode("report-figure-compiler.mjs", ["list"]);
  }

  if (!args.project_root) throw new Error(`${action} requires project_root`);
  if (!args.spec_path) throw new Error(`${action} requires spec_path`);
  if (action === "validate" && (args.output_path !== undefined || args.receipt_path !== undefined)) {
    throw new Error("validate does not accept output_path or receipt_path");
  }
  if (action === "validate" && (args.profile !== undefined || args.renderer !== undefined)) {
    throw new Error("validate does not accept compile-only profile or renderer overrides");
  }
  if (action === "compile" && !args.output_path) throw new Error("compile requires output_path");

  const boundary = await resolveProjectBoundary(args.project_root);
  const specPath = await resolveContainedProjectPath(boundary, args.spec_path, "spec_path", { mustExist: true });

  const commandArgs = [action, "--spec", specPath];
  if (args.profile) commandArgs.push("--profile", args.profile);
  if (args.renderer) commandArgs.push("--renderer", args.renderer);
  if (action === "compile") {
    const outputPath = await resolveContainedProjectPath(boundary, args.output_path, "output_path", { writeTarget: true });
    commandArgs.push("--out", outputPath);
    if (args.receipt_path) {
      const receiptPath = await resolveContainedProjectPath(boundary, args.receipt_path, "receipt_path", { writeTarget: true });
      commandArgs.push("--receipt", receiptPath);
    }
  }
  if (!execute) return { ...commandPreview("report-figure-compiler.mjs", commandArgs), project_root: boundary.projectRoot };
  return { ...runNode("report-figure-compiler.mjs", commandArgs), project_root: boundary.projectRoot };
}

async function visualQa(args) {
  if (!shouldExecute(args)) return commandPreview("visual-qa.mjs", [args.manifest_path]);
  return runNode("visual-qa.mjs", [args.manifest_path]);
}

async function score(args) {
  if (!shouldExecute(args)) return commandPreview("score-visual.mjs", [args.manifest_path]);
  return runNode("score-visual.mjs", [args.manifest_path]);
}

async function productionCheck(args) {
  if (!shouldExecute(args)) return commandPreview("production-check.mjs", [args.manifest_path]);
  const result = runNode("production-check.mjs", [args.manifest_path]);
  const line = result.stdout.split("\n").find((entry) => entry.startsWith("Production result: "));
  let readiness = null;
  try { readiness = line ? JSON.parse(line.slice("Production result: ".length)) : null; } catch { /* Missing/invalid structured result never authorizes downstream work. */ }
  return {
    ...result,
    readiness_status: readiness?.status || "fail",
    stage: readiness?.stage || null,
    ready_for_downstream: result.ok && readiness?.ready_for_downstream === true,
    final_delivery_ready: result.ok && readiness?.final_delivery_ready === true,
    design_contract_passed: result.ok && readiness?.design_contract_passed === true,
    readiness
  };
}

export async function callTool(name, args = {}) {
  validateTool(name, args);
  await validateBusinessArguments(name, args);
  const handlers = {
    nero_design_route: routeTool,
    nero_design_get_registry: getRegistry,
    nero_design_get_tokens: getTokens,
    nero_design_list_templates: listTemplates,
    nero_design_get_case_snapshot: getCaseSnapshot,
    nero_design_import_github_case: importGithubCase,
    nero_design_build_tokens: buildTokens,
    nero_design_generate_project: generateProject,
    nero_design_compile_report_figure: compileReportFigure,
    nero_design_visual_qa: visualQa,
    nero_design_score: score,
    nero_design_production_check: productionCheck
  };
  const handler = handlers[name];
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  return handler(args);
}

async function validateBusinessArguments(name, args) {
  const check = (key, values, value = args[key]) => {
    if (value !== undefined && !values.includes(value)) throw new Error(`Unsupported ${key}: ${value}`);
  };
  if (name === "nero_design_route") {
    check("task_mode", taskModes);
    check("content_contract", contentContracts);
    check("ppt_operation", pptOperations);
    check("preferred_route", allowedRoutes);
    check("operation", pptOperations, args.engine_resolution?.operation);
  }
  check("frontend_profile", ["default", "ai-app-ui"]);
  if (name === "nero_design_get_registry") {
    for (const value of args.use_case_tags || []) check("use_case_tags", assetTaxonomy.use_cases.map(item => item.id), value);
  }
  if (["nero_design_list_templates", "nero_design_generate_project"].includes(name)) {
    const registry = await readJson(templateRegistryPath);
    check("route", Object.keys(registry.routes));
    if (args.preset !== undefined) {
      const presets = registry.routes[args.route]?.presets || {};
      check("preset", Object.entries(presets).flatMap(([id, preset]) => [id, ...(preset.aliases || [])]));
    }
  }
  if (["nero_design_get_case_snapshot", "nero_design_import_github_case"].includes(name)) {
    check("route", ["frontend-ui", "image-report", "ppt", "short-video"]);
  }
  if (name === "nero_design_compile_report_figure") {
    check("profile", ["report-a4", "wechat-inline", "ppt-16x9"]);
    check("renderer", ["vector-svg", "raster-canvas-png"]);
  }
}

// A deterministic core-source fingerprint, not an atomic filesystem snapshot or an asset digest.
export async function ndtRevision() {
  let skillDirectory;
  for (const candidate of ["skill-source/nero-design-team", "skills/nero-design-team"]) {
    try {
      if ((await fs.stat(path.join(root, candidate))).isDirectory()) { skillDirectory = candidate; break; }
    } catch (error) {
      if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
    }
  }
  if (!skillDirectory) throw new Error("NDT Skill directory missing: expected skill-source/nero-design-team or skills/nero-design-team");
  const scope = ["mcp-lite/routing.mjs", "mcp-lite/ndt-runtime.mjs", "mcp-lite/ndt-worker.mjs",
    "scripts/**/*.mjs", "scripts/**/*.py", "tools/runtime/report-figure-compiler/**/*.py",
    `${skillDirectory}/**/*.md`, "registry/*.json", "tokens/*.json", "generators/templates.json"];
  const files = [];
  async function collect(relative, extension, recursive = true) {
    for (const entry of await fs.readdir(path.join(root, relative), { withFileTypes: true })) {
      if (/(?:^|[-_.])(test|tests|smoke|fixture|fixtures)(?:$|[-_.])/i.test(entry.name) || entry.name === "__pycache__") continue;
      const child = path.posix.join(relative, entry.name);
      if (entry.isDirectory() && recursive) await collect(child, extension, recursive);
      else if (entry.isFile() && child.endsWith(extension)) files.push(child);
    }
  }
  files.push("mcp-lite/routing.mjs", "mcp-lite/ndt-runtime.mjs", "mcp-lite/ndt-worker.mjs", "generators/templates.json");
  await collect("scripts", ".mjs");
  await collect("scripts", ".py");
  await collect("tools/runtime/report-figure-compiler", ".py");
  await collect(skillDirectory, ".md");
  await collect("registry", ".json", false);
  await collect("tokens", ".json", false);
  const hash = createHash("sha256");
  for (const file of files.sort()) {
    const bytes = await fs.readFile(path.join(root, file));
    hash.update(JSON.stringify([file, bytes.length]) + "\n");
    hash.update(bytes);
  }
  return { algorithm: "sha256", digest: hash.digest("hex"), scope, file_count: files.length,
    excludes: ["stable MCP bridge and tool contract", "tests/smoke/fixtures", "template and case assets", "images and fonts", "external project files", "files outside the listed scope"],
    consistency: "core files read before dispatch; not an atomic snapshot" };
}
