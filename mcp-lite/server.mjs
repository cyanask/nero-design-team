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
const designRegistryPath = path.join(root, "registry", "design-team.json");
const designAssetCatalogPath = path.join(root, "registry", "design-assets.json");

const version = "2.3.0";
const transportModes = {
  contentLength: "content-length",
  ndjson: "ndjson"
};
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

const artifactRoutes = ["frontend-ui", "image-report", "ppt", "presentation-production-chain", "short-video", "ai-image-generation"];
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
    name: "nero_design_get_registry",
    description: "Read the authoritative NERO Design Team Registry contract and its asset-catalog summary.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        include_integrity_issues: {
          type: "boolean",
          default: true,
          description: "Include tracked open asset-integrity issues."
        }
      }
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
    description: "Generate a NERO design project from a local template, optionally with a registered preset, or initialize an existing project with .nero-design/manifest.json. Presets apply only to mode=new. Defaults to dry-run; execute=true creates files.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        mode: { type: "string", enum: ["new", "init"], default: "new" },
        route: { type: "string", enum: artifactRoutes },
        name: { type: "string" },
        out: { type: "string" },
        project_root: { type: "string" },
        preset: { type: "string" },
        execute: { type: "boolean", default: false }
      },
      required: ["route"]
    }
  },
  {
    name: "nero_design_compile_report_figure",
    description: "List, validate, or compile a structured report Figure Spec through the central NDT CLI. Defaults to command preview; execute=true runs the local compiler.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        action: { type: "string", enum: ["list", "validate", "compile"] },
        project_root: { type: "string" },
        spec_path: { type: "string" },
        output_path: { type: "string" },
        receipt_path: { type: "string" },
        profile: { type: "string", enum: ["report-a4", "wechat-inline", "ppt-16x9"] },
        renderer: { type: "string", enum: ["vector-svg", "raster-canvas-png"] },
        execute: { type: "boolean", default: false }
      },
      required: ["action"],
      oneOf: [
        {
          "title": "List compiler capabilities",
          "properties": { "action": { "const": "list" } },
          "not": {
            "anyOf": [
              { "required": ["project_root"] },
              { "required": ["spec_path"] },
              { "required": ["output_path"] },
              { "required": ["receipt_path"] },
              { "required": ["profile"] },
              { "required": ["renderer"] }
            ]
          }
        },
        {
          "title": "Validate a project-local Figure Spec",
          "properties": { "action": { "const": "validate" } },
          "required": ["project_root", "spec_path"],
          "not": {
            "anyOf": [
              { "required": ["output_path"] },
              { "required": ["receipt_path"] },
              { "required": ["profile"] },
              { "required": ["renderer"] }
            ]
          }
        },
        {
          "title": "Compile a project-local Figure Spec",
          "properties": { "action": { "const": "compile" } },
          "required": ["project_root", "spec_path", "output_path"]
        }
      ]
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
        execute: { type: "boolean", default: false }
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
        execute: { type: "boolean", default: false }
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
        execute: { type: "boolean", default: false }
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

function inferRoute(task, preferredRoute) {
  if (preferredRoute && allowedRoutes.includes(preferredRoute)) return preferredRoute;
  const text = String(task || "").toLowerCase();
  const hasAny = (keywords) => keywords.some((keyword) => text.includes(keyword));
  if (hasAny(["ppt", "pptx", "deck", "slide", "slides", "html deck", "web deck", "网页ppt", "网页 ppt", "幻灯片", "横向翻页", "spec lock", "design_spec", "style_lock", "production packet", "slide_claim_map", "narrative_variants", "content_freeze_gate", "return_to_kat", "svg qa", "风格预览", "固定舞台", "规格锁定", "生产包", "内容冻结", "叙事路线"])) {
    return "ppt";
  }
  if (hasAny(["remotion", "video", "short video", "motion pipeline", "storyboard", "frame qa", "短视频", "动效", "分镜", "关键帧", "帧检查"])) {
    return "short-video";
  }
  const checks = [
    ["production-check", ["production", "pass/review/fail", "final check", "交付检查"]],
    ["project-integration", [".nero-design", "manifest", "integrate", "integration", "接入", "集成", "后台支持", "设计系统"]],
    ["visual-score", ["score", "scoring", "评分"]],
    ["visual-audit", ["audit", "qa", "review", "inspect", "evaluate", "assess", "diagnose", "检查", "审查", "看看", "复核", "审阅", "诊断", "评价", "评估"]],
    ["case-library", ["case", "snapshot", "github", "案例", "快照"]],
    ["ai-image-generation", ["gpt-image", "image brief", "cover", "background", "视觉素材", "封面", "摄影", "照片", "插画", "概念视觉", "背景图", "文章头图", "主视觉", "题图", "海报"]],
    ["short-video", ["remotion", "video", "short video", "motion pipeline", "storyboard", "frame qa", "短视频", "动效", "分镜", "帧检查"]],
    ["ppt", ["ppt", "pptx", "deck", "slide", "slides", "html deck", "style preview", "style discovery", "fixed stage", "1920x1080", "spec lock", "design_spec", "style_lock", "production packet", "slide_claim_map", "narrative_variants", "content_freeze_gate", "return_to_kat", "svg qa", "production harness", "演示", "幻灯片", "web deck", "网页ppt", "网页 ppt", "横向翻页", "风格预览", "固定舞台", "规格锁定", "生产纪律", "生产包", "内容冻结", "叙事路线"]],
    ["image-report", ["satori", "sharp", "long image", "report card", "report figure", "word", "pdf", "diligence", "长图", "研报图", "报告图", "尽调", "公众号", "微信", "产业链", "业务流程", "传导链", "分类层级", "产品边界", "时间轴", "产能爬坡", "漏斗", "阶段门", "市场规模", "柱图", "趋势", "折线", "参与者地图", "竞争格局", "同业画像", "指标矩阵", "价值链", "利润分布"]],
    ["frontend-ui", ["frontend", "dashboard", "ui", "react", "shadcn", "html", "html-native", "diagram", "architecture", "single-file", "variant", "brand asset protocol", "前端", "界面", "架构图", "图解", "计划页", "设计变体", "多方案", "品牌资产协议"]]
  ];
  for (const [route, keywords] of checks) {
    const matches = route === "ai-image-generation"
      ? keywords.some((keyword) => hasUnnegatedKeyword(text, keyword))
      : keywords.some((keyword) => text.includes(keyword));
    if (matches) return route;
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
  const text = String(task || "").toLowerCase();
  const hasAny = (keywords) => keywords.some((keyword) => text.includes(keyword));
  const productionChainRequired = hasAny([
    "production packet",
    "presentation production",
    "slide_claim_map",
    "narrative_variants",
    "content_freeze_gate",
    "return_to_kat",
    "style_lock",
    "three-direction",
    "三方案",
    "生产包",
    "内容冻结",
    "叙事路线",
    "打回 kat",
    "打回kat"
  ]);
  const pptSubroute = inferPptSubroute(task);
  const map = {
    "formal-pptx": {
      primary_engine: "Presentations",
      secondary_rules: ["references/ppt-business-design.md", "references/ppt-production-harness.md", "references/visual-qa.md"],
      legacy_fallback: "PptxGenJS local template only when Presentations is unavailable or a lightweight local sample is requested."
    },
    "template-following": {
      primary_engine: "Presentations template-following",
      secondary_rules: ["references/ppt-business-design.md", "references/ppt-production-harness.md", "references/visual-qa.md"],
      legacy_fallback: "No local PptxGenJS fallback unless the user explicitly abandons template fidelity."
    },
    "ppt-design-audit": {
      primary_engine: "NERO design review",
      secondary_rules: ["references/ppt-business-design.md", "references/ppt-production-harness.md", "references/visual-qa.md"],
      legacy_fallback: "No generation engine required unless the audit becomes a production task."
    },
    "web-ppt-html": {
      primary_engine: "NERO web PPT HTML route",
      secondary_rules: ["references/web-ppt.md", "references/html-deck-style-discovery.md", "references/html-native-harness.md", "references/effective-html.md", "references/ppt-business-design.md", "references/visual-qa.md"],
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
    presentation_production_chain: {
      required: productionChainRequired,
      rules: productionChainRequired
        ? ["references/presentation-production-chain.md", "references/presentation-design-spec.md", "references/presentation-handoff-contract.md"]
        : [],
      required_artifacts: productionChainRequired
        ? ["presentation_handoff_contract", "slide_claim_map", "narrative_variants", "content_freeze_gate", "presentation_production_packet", "design_spec", "style_lock", "visual_exploration"]
        : []
    },
    fused_reference_skills: pptSubroute === "web-ppt-html"
      ? ["ppt-design-reference", "guizang-ppt-skill", "effective-html", "frontend-slides", "huashu-design", "ppt-master"]
      : ["ppt-design-reference", "guizang-ppt-skill", "ppt-master"],
    deletion_policy: "Do not delete old PPT skills automatically; treat them as read-only references under NERO routing."
  };
}

function frontendTasteFusionMetadata() {
  return {
    fused_reference_skills: ["impeccable", "taste-skill"],
    fusion_scope: "NERO-calibrated frontend design-quality layer for design read, anti-slop checks, controllable visual dials, deterministic UI review, shared configuration discipline, and final polish.",
    taste_v2_targeted_enhancements: [
      "anti-slop rules against AI-default templates",
      "DESIGN_VARIANCE / MOTION_INTENSITY / VISUAL_DENSITY dials",
      "Brief Inference and one-line Design Read before code",
      "shared configuration discipline across Codex, Claude Code, Cursor, and project prompts"
    ],
    design_dials: {
      DESIGN_VARIANCE: {
        meaning: "layout experimentation; 1 is rigid enterprise symmetry, 10 is experimental editorial composition",
        default_by_route: {
          dense_work_tool: 3,
          analytical_explainer: 4,
          public_portfolio_or_launch: 6,
          brand_concept: 7
        }
      },
      MOTION_INTENSITY: {
        meaning: "animation depth; 1 is static utility, 10 is cinematic motion or scroll storytelling",
        default_by_route: {
          dense_work_tool: 1,
          analytical_explainer: 2,
          public_portfolio_or_launch: 3,
          brand_concept: 4
        }
      },
      VISUAL_DENSITY: {
        meaning: "information per viewport; 1 is airy brand work, 10 is cockpit-level analytical density",
        default_by_route: {
          dense_work_tool: 8,
          analytical_explainer: 7,
          public_portfolio_or_launch: 5,
          brand_concept: 4
        }
      }
    },
    brief_inference_required: true,
    anti_slop_gate: {
      policy: "Default-ban high-risk AI template patterns, but allow them through an explicit exception gate when they are task-fit, content-fit, asset-fit, readable, evidence-safe, and QA-passing.",
      default_banned_patterns: [
        "purple-blue gradients used only as an AI default",
        "centered marketing heroes for dashboards/workbenches",
        "three-card feature rows without three real peer groups",
        "default glassmorphism without a cover/brand/HUD role",
        "decorative pills, fake status tags, version stamps, section numbers, scroll cues, or photo-credit captions without real meaning"
      ],
      exception_gate: [
        "task fit",
        "content fit",
        "asset fit",
        "readability fit",
        "evidence fit",
        "visual QA fit"
      ]
    },
    shared_config_policy: "NERO Design Team remains the source of truth. Other tools may reference NDT rules or upstream taste-skill only when explicitly requested; upstream defaults must be mapped back into NDT tokens, dials, and QA gates.",
    source_repositories: [
      {
        name: "pbakaus/impeccable",
        url: "https://github.com/pbakaus/impeccable",
        license: "Apache-2.0"
      },
      {
        name: "Leonxlnx/taste-skill",
        url: "https://github.com/Leonxlnx/taste-skill",
        license: "MIT",
        source_version_note: "v2 experimental concepts are fused as targeted rules, not installed as an independent default skill."
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

function presentationHarnessFusionMetadata() {
  return {
    presentation_harness_fusion_v1_8: {
      boundary: "Fused references only. NERO Design Team remains the entrypoint; Presentations remains primary for formal PPTX.",
      references: [
        {
          name: "huashu-design",
          repo: "alchaincyf/huashu-design",
          snapshot: path.join(caseLibraryRoot, "snapshots", "alchaincyf__huashu-design", "snapshot.json"),
          use_for: ["HTML-native prototypes", "design variants", "brand asset protocol", "motion/video pipeline planning"],
          avoid_for: ["default TTS/audio", "watermarks", "provider config", "full asset migration"]
        },
        {
          name: "frontend-slides",
          repo: "zarazhangrui/frontend-slides",
          snapshot: path.join(caseLibraryRoot, "snapshots", "zarazhangrui__frontend-slides", "snapshot.json"),
          use_for: ["fixed 1920x1080 HTML deck", "style discovery", "contact-sheet preview"],
          avoid_for: ["formal PPTX replacement", "default deployment", "copying bold templates"]
        },
        {
          name: "ppt-master",
          repo: "hugohe3/ppt-master",
          snapshot: path.join(caseLibraryRoot, "snapshots", "hugohe3__ppt-master", "snapshot.json"),
          use_for: ["design_spec/spec_lock", "PPT production discipline", "SVG QA", "native editability", "AI image style lock"],
          avoid_for: ["Presentations replacement", "heavy dependency install", "image search/TTS/watermark removal", "large example copy"]
        }
      ],
      required_boundary_rule: "references/external-design-reference-boundaries.md"
    }
  };
}

const figureCompilerTypes = [
  {
    figure_type: "value_chain",
    business_family: "value-chain-profit-distribution",
    keywords: ["value chain", "profit pool", "价值链", "利润分布", "利润池"]
  },
  {
    figure_type: "participant_map",
    business_family: "participant-competition-landscape",
    keywords: ["participant map", "competitive landscape", "参与者地图", "竞争格局", "玩家地图"]
  },
  {
    figure_type: "matrix",
    business_family: "peer-profile-metrics",
    keywords: ["peer profile", "metric matrix", "comparison matrix", "同业画像", "指标矩阵", "对比矩阵"]
  },
  {
    figure_type: "funnel",
    business_family: "stage-gate-funnel",
    keywords: ["funnel", "stage gate", "stage-gate", "漏斗", "阶段门", "转化漏斗"]
  },
  {
    figure_type: "timeline",
    business_family: "timeline-capacity-ramp",
    keywords: ["timeline", "capacity ramp", "ramp-up", "时间轴", "产能爬坡", "爬坡进度", "里程碑"]
  },
  {
    figure_type: "hierarchy",
    business_family: "classification-product-boundary",
    keywords: ["hierarchy", "taxonomy", "product boundary", "分类层级", "产品边界", "层级结构"]
  },
  {
    figure_type: "line",
    business_family: "trend-series",
    keywords: ["line chart", "trend line", "折线", "趋势线", "趋势图", "走势"]
  },
  {
    figure_type: "bar",
    business_family: "market-size-comparison",
    keywords: ["bar chart", "market size", "柱图", "柱状图", "市场规模"]
  },
  {
    figure_type: "flow",
    business_family: "industry-process-transmission",
    keywords: ["industry chain", "business flow", "process flow", "transmission chain", "产业链", "业务流程", "工艺流程", "传导链"]
  }
];

const explicitFigureTypeRules = [
  { figure_type: "flow", keywords: ["flowchart", "flow chart", "流程图"] },
  { figure_type: "hierarchy", keywords: ["hierarchy chart", "层级图", "树状图", "分类图"] },
  { figure_type: "timeline", keywords: ["timeline chart", "时间轴图"] },
  { figure_type: "funnel", keywords: ["funnel chart", "漏斗图"] },
  { figure_type: "bar", keywords: ["bar chart", "柱图", "柱状图"] },
  { figure_type: "line", keywords: ["line chart", "折线图", "趋势线图"] },
  { figure_type: "participant_map", keywords: ["participant map", "参与者地图", "玩家地图"] },
  { figure_type: "matrix", keywords: ["metric matrix", "comparison matrix", "指标矩阵", "对比矩阵"] },
  { figure_type: "value_chain", keywords: ["value chain chart", "价值链图", "利润分布图"] }
];

const figureCompilerMissingInputs = {
  flow: ["nodes", "edges", "source"],
  hierarchy: ["root", "source"],
  timeline: ["events", "source"],
  funnel: ["mode", "stages", "source"],
  bar: ["period", "unit", "denominator", "categories", "series", "source"],
  line: ["period", "unit", "denominator", "x_labels", "series", "source"],
  participant_map: ["basis", "x_axis", "y_axis", "participants", "source"],
  matrix: ["rows", "columns", "cells", "value_kind", "source"],
  value_chain: ["metric", "period", "unit", "denominator", "stages", "source"]
};

const figureCompilerConditionalInputs = {
  matrix: [
    { when: "value_kind=quantitative", required: ["period", "unit", "denominator"] }
  ],
  funnel: [
    { when: "mode=quantitative", required: ["period", "unit", "denominator", "stages[].value"] },
    { when: "mode=stage_gate", required: ["stages[].gate"] }
  ]
};

const figureCompilerAutoDerivedFields = ["schema_version", "figure_id", "title", "profile", "renderer"];

function hasUnnegatedKeyword(text, keyword) {
  let offset = 0;
  while (offset <= text.length - keyword.length) {
    const index = text.indexOf(keyword, offset);
    if (index === -1) return false;
    const prefix = text.slice(Math.max(0, index - 14), index);
    const negated = /(?:不是|并非|不要(?:做|生成|制作)?|非|无需|不需要|别(?:做|生成|制作)?|不(?:做|生成|制作)|not(?:\s+a)?|no)\s*$/i.test(prefix);
    if (!negated) return true;
    offset = index + keyword.length;
  }
  return false;
}

function figureCompilerInputContract(figureType) {
  return {
    missing_inputs_scope: "business_payload",
    auto_derived_fields: figureType ? [...figureCompilerAutoDerivedFields] : [],
    conditional_inputs: figureType ? (figureCompilerConditionalInputs[figureType] || []) : []
  };
}

function inferFigureCompiler(task, route) {
  const text = String(task || "").toLowerCase();
  const hasAny = (keywords) => keywords.some((keyword) => text.includes(keyword));
  const explicitCandidates = explicitFigureTypeRules
    .filter((entry) => hasAny(entry.keywords))
    .map((entry) => entry.figure_type);
  const businessMatch = figureCompilerTypes.find((entry) => hasAny(entry.keywords)) || null;
  const selectedFigureType = explicitCandidates.length === 1
    ? explicitCandidates[0]
    : explicitCandidates.length === 0
      ? businessMatch?.figure_type || null
      : null;
  const selectedTypeContract = figureCompilerTypes.find((entry) => entry.figure_type === selectedFigureType) || null;
  const businessFamily = businessMatch?.business_family || selectedTypeContract?.business_family || null;
  const auditOnly = hasAny([
    "audit", "review", "inspect", "check", "evaluate", "assess", "diagnose",
    "审查", "检查", "评审", "审核", "点评", "看看", "复核", "审阅", "诊断", "评价", "评估"
  ]) && !hasAny([
    "create", "generate", "regenerate", "recreate", "render", "compile", "turn into", "produce", "revise",
    "制作", "做成", "画成", "生成", "重新生成", "重画", "重做", "编译", "转成", "改成", "可视化", "创建", "输出一张"
  ]);
  const normalizedText = text.replace(/\s+/g, "");
  const wholeDeliverable = /(?:完整(?:的)?|全套(?:的)?|整套(?:的)?|整份(?:的)?)(?:投行)?(?:的)?(?:ppt|文章|word|报告)/i.test(normalizedText)
    || /\b(?:full|entire|complete)\s+(?:investment banking\s+)?(?:ppt|deck|article|word|report)\b/i.test(text);
  const explicitSingleFigure = hasAny([
    "one figure", "single figure", "this figure", "one slide", "this slide",
    "单张", "这一张", "这一页", "本页", "一张图", "一幅图", "单页"
  ]) || /(?:一张|一幅)(?:报告|解释)?图/i.test(text)
    || /(?:其中|中的)(?:的)?(?:一张|1张|一页|1页|单页)[^，。；;]{0,24}(?:流程图|层级图|树状图|时间轴(?:图)?|漏斗图|柱状?图|折线图|参与者地图|指标矩阵|价值链图|产业链图|竞争格局图|解释图|报告图)/i.test(text);
  const excludedVisual = [
    "cover", "background", "photography", "photo", "illustration", "concept visual",
    "封面", "背景图", "摄影", "照片", "插画", "概念视觉", "概念图", "人物图", "文章头图", "主视觉", "题图", "海报"
  ].some((keyword) => hasUnnegatedKeyword(text, keyword));
  const editableNative = hasAny([
    "office-native", "editable", "native object", "native chart", "可编辑", "原生对象", "原生图表", "office 原生", "office原生"
  ]);
  const profile = hasAny(["wechat", "weixin", "公众号", "微信"])
    ? "wechat-inline"
    : hasAny(["ppt", "pptx", "slide", "slides", "deck", "演示", "幻灯片"])
      ? "ppt-16x9"
      : "report-a4";
  const renderer = editableNative
    ? "office-native"
    : hasAny(["png", "raster", "位图"])
      ? "raster-canvas-png"
      : hasAny(["svg", "vector", "矢量"])
        ? "vector-svg"
        : profile === "ppt-16x9"
          ? "vector-svg"
          : "raster-canvas-png";

  if (auditOnly) {
    return {
      recommended: false,
      reason: "这是查看、复核、审阅、诊断或评估任务，不是新的确定性报告图生成请求；Figure Compiler 保持不调用。",
      business_family: businessFamily,
      figure_type: selectedFigureType,
      profile,
      renderer: null,
      missing_inputs: [],
      ...figureCompilerInputContract(selectedFigureType),
      ambiguous_candidates: explicitCandidates.length > 1 ? explicitCandidates : [],
      tool: null,
      alternative_route: "visual-audit"
    };
  }
  if (wholeDeliverable && !explicitSingleFigure) {
    return {
      recommended: false,
      reason: "请求对象是完整 PPT、文章、Word 或报告，未明确其中一张解释图；不得把整份交付误路由为 Figure Compiler。",
      business_family: businessFamily,
      figure_type: selectedFigureType,
      profile,
      renderer: null,
      missing_inputs: ["single_figure_scope"],
      ...figureCompilerInputContract(selectedFigureType),
      ambiguous_candidates: explicitCandidates.length > 1 ? explicitCandidates : [],
      tool: null,
      alternative_route: route
    };
  }
  if (excludedVisual) {
    return {
      recommended: false,
      reason: "封面、摄影、插画、背景或概念视觉属于 AI 图像艺术指导，不属于结构化 Figure Spec 编译。",
      business_family: null,
      figure_type: null,
      profile,
      renderer: null,
      missing_inputs: [],
      ...figureCompilerInputContract(null),
      ambiguous_candidates: [],
      tool: null,
      alternative_route: "ai-image-generation"
    };
  }
  if (explicitCandidates.length > 1) {
    return {
      recommended: false,
      reason: "同一请求包含多个明确图型，无法安全自动选择；需先确认唯一 figure_type。",
      business_family: businessFamily,
      figure_type: null,
      profile,
      renderer: null,
      missing_inputs: ["figure_type"],
      ...figureCompilerInputContract(null),
      ambiguous_candidates: explicitCandidates,
      tool: null,
      alternative_route: route
    };
  }
  if (!selectedFigureType) {
    return {
      recommended: false,
      reason: "未识别到九类确定性报告图意图；保留当前 NDT 路由，不自动调用 Figure Compiler。",
      business_family: null,
      figure_type: null,
      profile,
      renderer: null,
      missing_inputs: ["figure_type"],
      ...figureCompilerInputContract(null),
      ambiguous_candidates: [],
      tool: null,
      alternative_route: route
    };
  }
  if (renderer === "office-native") {
    return {
      recommended: false,
      reason: "已识别结构化报告图，但明确要求 Office 原生可编辑对象；office-native 仅作 handoff，不由 Figure Compiler 编译。",
      business_family: businessFamily,
      figure_type: selectedFigureType,
      profile,
      renderer,
      missing_inputs: figureCompilerMissingInputs[selectedFigureType],
      ...figureCompilerInputContract(selectedFigureType),
      ambiguous_candidates: [],
      tool: null,
      alternative_route: profile === "ppt-16x9" ? "ppt/formal-pptx" : "office-native-handoff"
    };
  }
  return {
    recommended: true,
    reason: `已识别 ${selectedFigureType} 确定性报告图；${profile} 默认使用 ${renderer}。`,
    business_family: businessFamily,
    figure_type: selectedFigureType,
    profile,
    renderer,
    missing_inputs: figureCompilerMissingInputs[selectedFigureType],
    ...figureCompilerInputContract(selectedFigureType),
    ambiguous_candidates: [],
    tool: "nero_design_compile_report_figure",
    alternative_route: null
  };
}

async function routeTool(args) {
  const route = inferRoute(args.task, args.preferred_route);
  const figureCompiler = inferFigureCompiler(args.task, route);
  const figureRenderingRuleRequired = figureCompiler.recommended
    || (figureCompiler.renderer === "office-native" && figureCompiler.figure_type !== null);
  const templateRegistry = await readJson(templateRegistryPath);
  const template = templateRegistry.routes?.[route]?.template || null;
  const pptMetadata = route === "ppt" ? pptRoutingMetadata(args.task) : null;
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
      figureRenderingRuleRequired ? "references/report-figure-rendering.md" : null,
      pptMetadata?.presentation_production_chain?.required ? "references/presentation-production-chain.md" : null,
      pptMetadata?.presentation_production_chain?.required ? "references/presentation-design-spec.md" : null,
      pptMetadata?.presentation_production_chain?.required ? "references/presentation-handoff-contract.md" : null,
      route === "ppt" ? "references/ppt-business-design.md" : null,
      route === "ppt" ? "references/ppt-production-harness.md" : null,
      route === "ppt" ? "references/web-ppt.md" : null,
      route === "ppt" ? "references/html-deck-style-discovery.md" : null,
      route === "frontend-ui" ? "references/html-native-harness.md" : null,
      route === "short-video" ? "references/motion-video-harness.md" : null,
      route === "frontend-ui" || route === "ppt" ? "references/effective-html.md" : null,
      route === "project-integration" ? "references/generator.md" : null,
      ["frontend-ui", "ppt", "short-video", "case-library", "visual-audit"].includes(route) ? "references/external-design-reference-boundaries.md" : null,
      "references/visual-qa.md"
    ].filter(Boolean))],
    recommended_tools: recommendTools(route, figureCompiler),
    figure_compiler: figureCompiler,
    routing_order: ["nero-design-team Skill classification", "MCP-lite structured execution"],
    controller_boundary: {
      cross_system_controller: "GPT Work",
      visual_controller: "NERO Design Team",
      content_controller: "KAT when content work is required",
      formal_editable_pptx_engine: "Presentations",
      autonomous_downstream_calls: false
    },
    state_ownership: {
      production_ledger: "GPT Work owns <project>/control/production-ledger.json",
      design_manifest: "NERO Design Team exclusively owns <project>/.nero-design/manifest.json"
    },
    next_owner: route === "ppt" && ["formal-pptx", "template-following"].includes(pptMetadata?.ppt_subroute)
      ? "GPT Work invokes Presentations only after NDT reports visual_ready"
      : "Return control to GPT Work after the NDT step",
    boundary: "MCP-lite returns structured local context and script results. The Skill remains responsible for route judgment; GPT Work remains responsible for cross-system control and final review."
  };
  if (route === "frontend-ui" || route === "visual-audit") {
    Object.assign(result, frontendTasteFusionMetadata());
  }
  if (route === "frontend-ui" || route === "visual-audit" || route === "ppt") {
    Object.assign(result, effectiveHtmlFusionMetadata());
  }
  if (["frontend-ui", "ppt", "short-video", "visual-audit", "case-library"].includes(route)) {
    Object.assign(result, presentationHarnessFusionMetadata());
  }
  if (route === "ppt") {
    Object.assign(result, pptMetadata);
  }
  return result;
}

function recommendTools(route, figureCompiler = null) {
  const withFigureCompiler = (items) => figureCompiler?.recommended
    ? [...new Set([...items, "nero_design_compile_report_figure"])]
    : items;
  if (route === "case-library") return withFigureCompiler(["nero_design_get_case_snapshot", "nero_design_import_github_case"]);
  if (route === "project-integration") return withFigureCompiler(["nero_design_generate_project", "nero_design_production_check"]);
  if (route === "production-check") return withFigureCompiler(["nero_design_production_check"]);
  if (route === "visual-score") return withFigureCompiler(["nero_design_score"]);
  if (route === "visual-audit") return withFigureCompiler(["nero_design_visual_qa"]);
  return withFigureCompiler(["nero_design_get_tokens", "nero_design_list_templates", "nero_design_get_case_snapshot"]);
}

async function getRegistry(args) {
  const registry = await readJson(designRegistryPath);
  const assets = await readJson(designAssetCatalogPath);
  return {
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
  const match = result.stdout.match(/^Production status:\s*(pass|review|fail)$/m);
  const readinessStatus = match?.[1] || (result.ok ? "unknown" : "fail");
  return {
    ...result,
    readiness_status: readinessStatus,
    ready_for_downstream: readinessStatus === "pass"
  };
}

async function callTool(name, args = {}) {
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

function detectTransport(buffer) {
  if (!buffer.length) return null;
  const preview = buffer.toString("utf8", 0, Math.min(buffer.length, 64)).trimStart();
  if (!preview) return null;
  if (/^Content-Length:/i.test(preview)) return transportModes.contentLength;
  if ("content-length:".startsWith(preview.toLowerCase())) return transportModes.contentLength;
  if (preview.startsWith("{") || preview.startsWith("[")) return transportModes.ndjson;
  throw new Error("Unable to detect MCP transport from first request.");
}

function readContentLengthMessage(buffer) {
  const crlfHeaderEnd = buffer.indexOf("\r\n\r\n");
  const lfHeaderEnd = crlfHeaderEnd === -1 ? buffer.indexOf("\n\n") : -1;
  const headerEnd = crlfHeaderEnd !== -1 ? crlfHeaderEnd : lfHeaderEnd;
  if (headerEnd === -1) return null;
  const separatorLength = crlfHeaderEnd !== -1 ? 4 : 2;
  const header = buffer.slice(0, headerEnd).toString("utf8");
  const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);
  if (!lengthMatch) throw new Error("Missing Content-Length header.");
  const contentLength = Number(lengthMatch[1]);
  const messageStart = headerEnd + separatorLength;
  const messageEnd = messageStart + contentLength;
  if (buffer.length < messageEnd) return null;
  return {
    raw: buffer.slice(messageStart, messageEnd).toString("utf8"),
    rest: buffer.slice(messageEnd)
  };
}

function readNdjsonMessage(buffer) {
  const newlineIndex = buffer.indexOf("\n");
  if (newlineIndex === -1) return null;
  const rawLine = buffer.slice(0, newlineIndex).toString("utf8").replace(/\r$/, "");
  return {
    raw: rawLine,
    rest: buffer.slice(newlineIndex + 1)
  };
}

function writeMcpMessageForTransport(message, transport) {
  if (transport === transportModes.ndjson) {
    process.stdout.write(`${JSON.stringify(message)}\n`);
    return;
  }
  writeMcpMessage(message);
}

function dispatchMessage(message, transport) {
  if (message.id === undefined) return;
  handleMessage(message)
    .then((result) => {
      writeMcpMessageForTransport({ jsonrpc: "2.0", id: message.id, result }, transport);
    })
    .catch((error) => {
      writeMcpMessageForTransport({
        jsonrpc: "2.0",
        id: message.id,
        error: { code: -32000, message: error.message }
      }, transport);
    });
}

function startMcpServer() {
  let buffer = Buffer.alloc(0);
  let transport = null;
  process.stdin.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (true) {
      transport ||= detectTransport(buffer);
      const parsed = transport === transportModes.ndjson
        ? readNdjsonMessage(buffer)
        : readContentLengthMessage(buffer);
      if (!parsed) return;
      buffer = parsed.rest;
      if (!parsed.raw.trim()) continue;
      const message = JSON.parse(parsed.raw);
      dispatchMessage(message, transport);
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
    if (!args || typeof args !== "object" || Array.isArray(args)) {
      throw new Error("Tool arguments must be a JSON object.");
    }
    shouldExecute(args);
    if (args.execute === true) {
      throw new Error("--dry-run refuses execute=true; use MCP protocol for an explicitly authorized execution");
    }
    const result = await callTool(toolName, { ...args, execute: false });
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
