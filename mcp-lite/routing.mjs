import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePptEngine } from "../scripts/ppt-engine-route.mjs";
import { usesKatPresentation } from "../scripts/presentation-contract.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptRoot = path.join(root, "scripts");
const caseLibraryRoot = path.join(root, "case-library");
const externalAssetRoot = path.join(root, "assets", "external");
const templateRegistryPath = path.join(root, "generators", "templates.json");
const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));

export const allowedRoutes = [
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

export const taskModes = ["create", "revise", "audit"];

function inferTaskMode(task, requested) {
  if (requested !== undefined) {
    if (!taskModes.includes(requested)) throw new Error(`Unknown task_mode: ${requested}`);
    return requested;
  }
  const text = String(task || "").toLowerCase();
  if (/(?:只|仅)(?:审|检查|评估)|不要(?:生成|制作|修改)|\b(?:audit|review|inspect)\s+only\b/.test(text)) return "audit";
  if (/修复|修改|改版|美化|优化|增加|调整|编辑|重绘|重新生成|重画|重做|\b(?:edit|revise|repair|redesign|upgrade|regenerate|recreate)\b/.test(text)) return "revise";
  if (/审阅|审查|审计|检查|评估|看看|\b(?:audit|review|inspect|critique|assess)\b/.test(text)) return "audit";
  return "create";
}

function inferRoute(task, preferredRoute, taskMode) {
  if (preferredRoute && allowedRoutes.includes(preferredRoute)) return preferredRoute;
  const text = String(task || "").toLowerCase();
  const hasAny = (keywords) => keywords.some((keyword) => text.includes(keyword));
  if (hasAny(["ppt", "pptx", "deck", "slide", "slides", "html deck", "web deck", "网页ppt", "网页 ppt", "幻灯片", "横向翻页", "spec lock", "design_spec", "style_lock", "production packet", "slide_claim_map", "narrative_variants", "content_freeze_gate", "return_to_kat", "svg qa", "风格预览", "固定舞台", "规格锁定", "生产包", "内容冻结", "叙事路线"])) {
    return "ppt";
  }
  const frontendMotion = /前端|界面|按钮|dashboard|\bui\b|popover|drawer|swipe|drag/.test(text)
    && /动效|动画|交互|拖拽|滑动|motion|animation|popover|drawer|swipe|drag/.test(text);
  if (frontendMotion && !/短视频|视频|分镜|remotion|\bvideo\b/.test(text)) return "frontend-ui";
  if (hasAny(["remotion", "video", "short video", "motion pipeline", "storyboard", "frame qa", "短视频", "动效", "分镜", "关键帧", "帧检查"])) {
    return "short-video";
  }
  const checks = [
    ["production-check", ["production", "pass/review/fail", "final check", "交付检查"]],
    ["project-integration", [".nero-design", "manifest", "integrate", "integration", "接入", "集成", "后台支持", "设计系统"]],
    ["visual-score", ["score", "scoring", "评分"]],
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
  return taskMode === "audit" ? "visual-audit" : "frontend-ui";
}

function inferFrontendProfile(task, route, requestedProfile) {
  const allowed = new Set(["default", "ai-app-ui"]);
  if (requestedProfile !== undefined && !allowed.has(requestedProfile)) {
    throw new Error(`frontend_profile must be one of: ${[...allowed].join(", ")}`);
  }
  if (requestedProfile !== undefined && route !== "frontend-ui") {
    throw new Error("frontend_profile is only supported for the frontend-ui route");
  }
  if (route !== "frontend-ui") return null;
  if (requestedProfile) return requestedProfile;

  const text = String(task || "").toLowerCase();
  const aiAppKeywords = [
    "ai app",
    "ai software",
    "agent ui",
    "agentic ui",
    "copilot",
    "tool call",
    "tool-calling",
    "human-in-the-loop",
    "ai 应用",
    "ai应用",
    "ai 软件",
    "ai软件",
    "智能体界面",
    "智能体工作台",
    "agent 界面",
    "agent工作台",
    "工具调用",
    "人工确认",
    "失败恢复",
    "生成式 ui",
    "生成式ui"
  ];
  return aiAppKeywords.some((keyword) => text.includes(keyword)) ? "ai-app-ui" : "default";
}

function frontendProfileMetadata(profile) {
  if (profile === null) return null;
  if (profile !== "ai-app-ui") {
    return {
      id: "default",
      rule: "references/frontend-ui.md",
      template_preset: null,
      status: "active"
    };
  }
  return {
    id: "ai-app-ui",
    rule: "references/ai-app-ui.md",
    template_preset: "ai-app-ui",
    design_intent_schema: "templates/frontend-dashboard/presets/ai-app-ui/design-intent.schema.json",
    state_catalog: "templates/frontend-dashboard/presets/ai-app-ui/state-catalog.json",
    scorecard: "scorecards/ai-app-ui-scorecard.json",
    status: "candidate_v0_1",
    fused_sources: [
      { repo: "outshift-open/hax", license: "Apache-2.0", role: "human-agent interaction patterns" },
      { repo: "microsoft/HAXPlaybook", license: "MIT", role: "failure-scenario and interaction review" },
      { repo: "google-labs-code/design.md", license: "Apache-2.0", role: "structured design intent and diffable projection" },
      { repo: "aa-on-ai/agentic-design-system", license: "MIT", role: "rendered-evidence review loop" }
    ],
    install_policy: "Reference-only fusion. Do not install upstream Skills, CLIs, MCP servers, SDKs or component packs by default.",
    acceptance_boundary: {
      design_contract: "separate",
      rendered_qa: "separate",
      live_behavior: "separate",
      human_acceptance: "separate"
    }
  };
}

function inferPptSubroute(task, taskMode) {
  if (taskMode === "audit") return "ppt-design-audit";
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

async function pptRoutingMetadata(task, args, taskMode, katPresentation) {
  const productionChainRequired = katPresentation;
  const pptSubroute = inferPptSubroute(task, taskMode);
  const map = {
    "formal-pptx": {
      primary_engine: null,
      secondary_rules: ["references/ppt-business-design.md", "references/ppt-production-harness.md", "references/visual-qa.md"],
      legacy_fallback: null
    },
    "template-following": {
      primary_engine: null,
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
  const engineResolution = taskMode !== "audit" && (["formal-pptx", "template-following"].includes(pptSubroute) || args.ppt_operation)
    ? await resolvePptEngine(args, pptSubroute) : null;
  return {
    ppt_subroute: pptSubroute,
    ...map[pptSubroute],
    ...(engineResolution ? { primary_engine: engineResolution.engine_id, engine_resolution: engineResolution, legacy_fallback: null } : {}),
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
    fusion_scope: "Task-driven design methods; existing styles and outside references are candidates. Read references/design-methods.md and references/reference-exploration.md.",
    taste_v2_targeted_enhancements: ["brief before style", "optional descriptive design dials", "problem-specific adjustment and rendered comparison"],
    design_dials: {
      DESIGN_VARIANCE: { meaning: "Optional description of the selected layout's experimentation", default_by_route: {} },
      MOTION_INTENSITY: { meaning: "Optional description of motion chosen for the task", default_by_route: {} },
      VISUAL_DENSITY: { meaning: "Optional description of information density chosen for the task", default_by_route: {} }
    },
    brief_inference_required: true,
    anti_slop_gate: {
      policy: "Judge hierarchy, readability, real function and task fit. No visual category is automatically banned; fabricated content and inaccessible behavior remain prohibited.",
      default_banned_patterns: [],
      exception_gate: []
    },
    shared_config_policy: "Use the selected project/brand constraints. NDT owns the method; local tokens and external styles are candidate resources, with no local reuse quota.",
    source_repositories: [
      { name: "pbakaus/impeccable", url: "https://github.com/pbakaus/impeccable", license: "Apache-2.0" },
      { name: "Leonxlnx/taste-skill", url: "https://github.com/Leonxlnx/taste-skill", license: "MIT" }
    ],
    install_policy: "Search and inspect public references with available tools; do not install upstream runtimes, packages or controllers by default."
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
      boundary: "Fused references only. NERO Design Team remains the entrypoint; the current project registry selects the formal PPTX engine.",
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
    const negated = /(?:不是|并非|不要(?:做|生成|制作|使用)?|非|无需|不需要|不使用|不走|别(?:做|生成|制作)?|不(?:做|生成|制作)|without|not(?:\s+a)?|no)\s*$/i.test(prefix);
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

function inferArchitectureDiagramRedraw(task) {
  const text = String(task || "").toLowerCase();
  const hasAny = (keywords) => keywords.some((keyword) => text.includes(keyword));
  const sourceKind = hasAny(["draw.io", "drawio", ".drawio"])
    ? "drawio"
    : hasAny(["mermaid", ".mmd"])
      ? "mermaid"
      : null;
  const redraw = sourceKind !== null || hasAny([
    "redraw", "re-draw", "recreate diagram", "old diagram", "legacy diagram",
    "重绘", "重画", "旧图", "老图", "原图改造", "重新设计这张图"
  ]);
  const grammarRules = [
    { grammar: "architecture", keywords: ["architecture diagram", "system architecture", "solution architecture", "系统架构图", "技术架构图", "应用架构图", "部署架构图", "架构图"] },
    { grammar: "flowchart", keywords: ["technical flowchart", "system flowchart", "control flowchart", "decision flowchart", "技术流程图", "系统流程图", "控制流程图", "决策流程图"] },
    { grammar: "sequence", keywords: ["sequence diagram", "时序图", "序列图", "消息时序"] },
    { grammar: "state-machine", keywords: ["state machine", "state diagram", "状态机", "状态转换图", "状态图"] },
    { grammar: "er-data-model", keywords: ["entity relationship", "er diagram", "erd", "实体关系图", "数据模型图", "er 图", "er图"] },
    { grammar: "swimlane-process", keywords: ["swimlane", "泳道图", "跨部门流程"] },
    { grammar: "data-flow-integration", keywords: ["data flow diagram", "integration diagram", "数据流图", "数据集成图", "接口集成图"] },
    { grammar: "access-matrix", keywords: ["access matrix", "permission matrix", "访问矩阵", "权限矩阵"] },
    { grammar: "organization-ownership", keywords: ["organization diagram", "ownership diagram", "组织架构图", "职责关系图", "所有权图"] },
    { grammar: "layer-stack", keywords: ["layer diagram", "layer stack", "分层架构图", "技术分层图"] },
    { grammar: "loop-flywheel", keywords: ["flywheel diagram", "feedback loop", "飞轮图", "反馈回路图", "闭环架构图"] }
  ];
  const grammarMatch = grammarRules.find((entry) => hasAny(entry.keywords)) || null;
  const sourceDriven = sourceKind !== null;
  const recommended = grammarMatch !== null || sourceDriven;
  return {
    recommended,
    subroute: recommended ? "architecture-diagram-redraw" : null,
    mode: recommended ? (redraw ? "redraw" : "fresh") : null,
    source_kind: sourceKind,
    grammar: grammarMatch?.grammar || (sourceDriven ? "select-after-structural-extraction" : null),
    fused_reference: recommended ? "diagram-design" : null,
    required_reference: recommended ? "references/architecture-diagram-redraw.md" : null,
    local_extractor: redraw ? path.join(scriptRoot, "extract-architecture-source.py") : null,
    qa_contract: recommended ? "architecture_diagram_and_redraw" : null,
    figure_compiler_boundary: "unchanged_nine_types"
  };
}

function inferFigureCompiler(task, route, architectureDiagram) {
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

  if (architectureDiagram?.recommended) {
    return {
      recommended: false,
      reason: "已识别为 NDT 架构图设计或旧图重绘；该能力是 architecture-diagram-redraw 子路由，不扩充或调用九类报告图 Figure Compiler。",
      business_family: businessFamily,
      figure_type: null,
      profile,
      renderer: null,
      missing_inputs: [],
      ...figureCompilerInputContract(null),
      ambiguous_candidates: [],
      tool: null,
      alternative_route: "architecture-diagram-redraw"
    };
  }

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

export async function routeTool(args) {
  const taskMode = inferTaskMode(args.task, args.task_mode);
  const route = inferRoute(args.task, args.preferred_route, taskMode);
  const text = String(args.task || "").toLowerCase();
  const katPresentation = usesKatPresentation(args) || (args.content_contract === undefined
    && hasUnnegatedKeyword(text, "kat") && /交接|合同|生产|handoff|contract|production/.test(text));
  const frontendProfile = inferFrontendProfile(args.task, route, args.frontend_profile);
  const architectureDiagram = inferArchitectureDiagramRedraw(args.task);
  const figureCompiler = inferFigureCompiler(args.task, route, architectureDiagram);
  if (taskMode === "audit") {
    figureCompiler.recommended = false;
    figureCompiler.tool = null;
    figureCompiler.reason = "Read-only audit; compilation requires a create or revise task.";
  }
  const figureRenderingRuleRequired = figureCompiler.recommended
    || (figureCompiler.renderer === "office-native" && figureCompiler.figure_type !== null);
  const templateRegistry = await readJson(templateRegistryPath);
  const template = taskMode === "audit" ? null : templateRegistry.routes?.[route]?.template || null;
  const pptMetadata = route === "ppt" ? await pptRoutingMetadata(args.task, args, taskMode, katPresentation) : null;
  const htmlArtifact = pptMetadata?.ppt_subroute === "web-ppt-html" || architectureDiagram.recommended
    || (route === "frontend-ui" && /html|单文件|解释器|解释这个|原型|设计变体|多方案/.test(text));
  const frontendMotion = route === "frontend-ui" && /动效|动画|交互|拖拽|滑动|motion|animation|press|popover|drawer|swipe|drag/.test(text);
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
    task_mode: taskMode,
    content_contract: katPresentation ? "kat-presentation" : "standard",
    template,
    rules: [...new Set([
      ruleMap[route],
      architectureDiagram.required_reference,
      figureRenderingRuleRequired ? "references/report-figure-rendering.md" : null,
      pptMetadata?.presentation_production_chain?.required ? "references/presentation-production-chain.md" : null,
      pptMetadata?.presentation_production_chain?.required ? "references/presentation-design-spec.md" : null,
      pptMetadata?.presentation_production_chain?.required ? "references/presentation-handoff-contract.md" : null,
      ...(pptMetadata?.secondary_rules || []),
      route === "frontend-ui" && htmlArtifact ? "references/html-native-harness.md" : null,
      frontendMotion ? "references/frontend-motion.md" : null,
      frontendProfile === "ai-app-ui" ? "references/ai-app-ui.md" : null,
      route === "short-video" ? "references/motion-video-harness.md" : null,
      htmlArtifact ? "references/effective-html.md" : null,
      route === "project-integration" ? "references/generator.md" : null,
      ["frontend-ui", "ppt", "short-video", "case-library", "visual-audit"].includes(route) ? "references/external-design-reference-boundaries.md" : null,
      "references/visual-qa.md"
    ].filter(Boolean))],
    recommended_tools: taskMode === "audit"
      ? [route === "visual-score" ? "nero_design_score" : route === "production-check" ? "nero_design_production_check"
        : route === "case-library" ? "nero_design_get_case_snapshot" : "nero_design_visual_qa"]
      : recommendTools(route, figureCompiler),
    figure_compiler: figureCompiler,
    architecture_diagram_redraw: architectureDiagram,
    frontend_profile: frontendProfileMetadata(frontendProfile),
    routing_order: ["nero-design-team Skill classification", "MCP-lite structured execution"],
    controller_boundary: {
      cross_system_controller: "GPT Work",
      visual_controller: "NERO Design Team",
      content_controller: katPresentation ? "KAT" : "Current content owner",
      formal_editable_pptx_engine: pptMetadata?.engine_resolution?.engine_id || null,
      autonomous_downstream_calls: false
    },
    state_ownership: {
      production_ledger: "GPT Work owns <project>/control/production-ledger.json",
      design_manifest: "NERO Design Team exclusively owns <project>/.nero-design/manifest.json"
    },
    next_owner: route === "ppt" && ["formal-pptx", "template-following"].includes(pptMetadata?.ppt_subroute)
      ? "Caller resolves the project engine and invokes it only after downstream_handoff passes"
      : "Return control to GPT Work after the NDT step",
    boundary: "MCP-lite returns structured local context and script results. The Skill remains responsible for route judgment; GPT Work remains responsible for cross-system control and final review."
  };
  if (route === "frontend-ui" || route === "visual-audit") {
    Object.assign(result, frontendTasteFusionMetadata());
  }
  if (htmlArtifact) {
    Object.assign(result, effectiveHtmlFusionMetadata());
  }
  if (["ppt", "short-video"].includes(route)) {
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
