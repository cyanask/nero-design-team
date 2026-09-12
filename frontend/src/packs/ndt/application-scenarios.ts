import type { ApplicationScenarioCatalog } from "../../core/application-scenarios";

export const ndtApplicationScenarioCatalog = {
  contractVersion: "workbench.application-scenarios.v1",
  scenarios: [
    {
      id: "product-ui",
      label: "产品界面（App / 软件）",
      description: "面向业务系统、内部工具和复杂交互流程的界面设计。",
      styleIntent: "结构清晰、状态可见、交互克制，优先保证复杂工作流可读可操作。",
      boundary: "界面方案不替代业务规则、数据真源与权限判断。",
      representativeAssetId: "NDT-TPL-001"
    },
    {
      id: "web-html",
      label: "网页与 HTML",
      description: "面向可浏览网页、交互说明和结构化线上展示的设计。",
      styleIntent: "以响应式信息架构组织复杂关系，兼顾屏幕阅读与交互探索。",
      boundary: "HTML 是可浏览交付，不自动等同生产部署或正式发布。",
      representativeAssetId: "NDT-EXT-001"
    },
    {
      id: "business-document",
      label: "商业报告与文档",
      description: "面向正式报告、分析材料和文档内嵌图表的设计。",
      styleIntent: "以证据、层级和可复核阅读为先，图文服务于文档主线。",
      boundary: "图表与版式不得改变原始数据口径或正式结论。",
      representativeAssetId: "NDT-CAS-008"
    },
    {
      id: "presentation",
      label: "PPT 与演示汇报",
      description: "面向正式汇报、提案和连续叙事型演示材料的设计。",
      styleIntent: "单页单结论，跨页形成清晰叙事链，并保留正式商务克制感。",
      boundary: "视觉编排不替代专业复核；正式 PPTX 仍需可编辑与版式 QA。",
      representativeAssetId: "NDT-SNP-006"
    },
    {
      id: "visual-communication",
      label: "图片与视觉传播",
      description: "面向研究配图、编辑设计、品牌识别和图像传播的视觉表达。",
      styleIntent: "以统一视觉语言承载信息密度，根据传播载体选择构图和节奏。",
      boundary: "参考案例只提供构图和语言，不继承项目事实、品牌权利或视觉成熟度。",
      representativeAssetId: "NDT-CAS-015"
    },
    {
      id: "motion-video",
      label: "视频与动态内容",
      description: "面向短视频、动态图形和时间轴叙事的视听设计。",
      styleIntent: "以节奏、字幕和镜头关系服务信息理解，避免动效喧宾夺主。",
      boundary: "视频模板不授予素材版权、配音或外发权限。",
      representativeAssetId: "NDT-TPL-005"
    }
  ],
  solutions: [
    {
      recipeId: "ai-app-workbench",
      label: "AI 应用工作台",
      summary: "为 AI 应用组织任务状态、人工控制、来源证据和失败恢复入口。",
      primaryScenarioId: "product-ui",
      supportingScenarioIds: ["web-html"],
      avoidScenarioIds: ["business-document", "presentation", "visual-communication", "motion-video"],
      directDeliverables: ["AI 界面设计合同", "状态目录与前端起始模板"],
      downstreamTargets: ["接入真实服务的应用界面"],
      boundary: "沿用 frontend-ui 下的 ai-app-ui 规则；设计状态与示例不证明后端已接通，也不代表真实任务或交付已完成。"
    },
    {
      recipeId: "internal-workbench",
      label: "内部工作台与分析后台",
      summary: "为复杂业务流程组织导航、状态、数据操作和复核入口。",
      primaryScenarioId: "product-ui",
      supportingScenarioIds: ["web-html"],
      avoidScenarioIds: ["business-document", "presentation", "visual-communication", "motion-video"],
      directDeliverables: ["可运行的工作台前端界面"],
      downstreamTargets: ["浏览器工作台", "桌面封装候选"],
      boundary: "适合持续操作型界面，不推荐替代静态汇报、单张传播图或正式文档。"
    },
    {
      recipeId: "dual-trajectory-evidence-map",
      label: "双轨迹证据图谱",
      summary: "以阶段轴、事件节点和证据检查器呈现复杂双轨迹。",
      primaryScenarioId: "product-ui",
      supportingScenarioIds: ["web-html"],
      avoidScenarioIds: ["business-document", "motion-video"],
      directDeliverables: ["交互式轨迹图谱界面"],
      downstreamTargets: ["网页展示", "静态导出图"],
      boundary: "只复用信息架构和交互合同；不得继承案例事实、公司身份或视觉成熟度。"
    },
    {
      recipeId: "architecture-map",
      label: "交互式架构脉络图",
      summary: "把系统、流程或数据关系组织成可浏览的结构化地图。",
      primaryScenarioId: "web-html",
      supportingScenarioIds: ["visual-communication", "presentation"],
      avoidScenarioIds: ["product-ui", "motion-video"],
      directDeliverables: ["可交互 HTML 架构图"],
      downstreamTargets: ["PNG/PDF 快照", "PPTX 插图"],
      boundary: "关系与状态必须来自当前真源；它是 HTML/SVG 解释器，不应误荐成业务工作台，也不证明系统已经部署。"
    },
    {
      recipeId: "embedded-report-figure",
      label: "报告与演示结构图",
      summary: "为既有商务文档制作服务于正文结论的单图或图表。",
      primaryScenarioId: "business-document",
      supportingScenarioIds: ["presentation", "visual-communication"],
      avoidScenarioIds: ["product-ui", "motion-video"],
      directDeliverables: ["报告内嵌图稿（SVG/PNG）"],
      downstreamTargets: ["DOCX/PDF 中的单图位置", "PPTX 插图"],
      boundary: "只提供文档内嵌图，不虚构整份 DOCX 方案，也不得改变数据口径或正式结论。"
    },
    {
      recipeId: "formal-pptx",
      label: "正式可编辑 PPTX",
      summary: "制作可编辑、可复核并适合正式汇报的演示文稿。",
      primaryScenarioId: "presentation",
      supportingScenarioIds: ["business-document"],
      avoidScenarioIds: ["product-ui", "motion-video"],
      directDeliverables: ["可编辑 PPTX"],
      downstreamTargets: ["PDF 汇报版", "现场演示"],
      boundary: "必须从当前权威材料出发并完成版式 QA；不得用视觉处理替代专业复核。"
    },
    {
      recipeId: "presentation-chain",
      label: "演示生产链",
      summary: "先组织结构化内容生产包，再交给下游渲染器生成演示载体。",
      primaryScenarioId: "presentation",
      supportingScenarioIds: ["web-html", "business-document"],
      avoidScenarioIds: ["product-ui", "motion-video"],
      directDeliverables: ["JSON 生产包", "Markdown 生产包"],
      downstreamTargets: ["PPTX 演示文稿", "HTML 演示页面", "PDF 汇报版"],
      boundary: "JSON/Markdown 才是直接产物；PPTX、HTML 和 PDF 只是下游目标，不得宣称已生成。"
    },
    {
      recipeId: "research-image",
      label: "研究长图与社交卡",
      summary: "把研究事实和主线转化为可传播、可复核的图像表达。",
      primaryScenarioId: "visual-communication",
      supportingScenarioIds: ["business-document", "presentation"],
      avoidScenarioIds: ["product-ui", "motion-video"],
      directDeliverables: ["研究配图稿"],
      downstreamTargets: ["公众号图像", "报告插图", "PPTX 插图"],
      boundary: "图像不得新增未核实事实、来源、数字或研究结论。"
    },
    {
      recipeId: "ai-image-brief",
      label: "AI 图像 Brief",
      summary: "把构图、主体、质感、限制和用途整理成图像生成说明。",
      primaryScenarioId: "visual-communication",
      supportingScenarioIds: ["presentation", "business-document"],
      avoidScenarioIds: ["product-ui", "motion-video"],
      directDeliverables: ["图像生成 Brief"],
      downstreamTargets: ["PNG 图像", "JPG 图像"],
      boundary: "Brief 是直接产物；PNG/JPG 仅是下游生成目标，生成前仍需单独执行和验证。"
    },
    {
      recipeId: "minimal-zine-editorial",
      label: "留白杂志风",
      summary: "以留白、强层级和杂志式编排建立克制的编辑视觉。",
      primaryScenarioId: "visual-communication",
      supportingScenarioIds: ["business-document", "presentation"],
      avoidScenarioIds: ["product-ui", "motion-video"],
      directDeliverables: ["风格规范与版式建议"],
      downstreamTargets: ["研究长图", "报告页面", "PPTX 页面"],
      boundary: "用于选择主视觉语言，不替代内容结构、品牌规范或交付格式。"
    },
    {
      recipeId: "cold-white-business-editorial",
      label: "冷白商业分析组图",
      summary: "以冷白底色、清晰网格和有限强调色形成专业商务秩序。",
      primaryScenarioId: "visual-communication",
      supportingScenarioIds: ["business-document", "presentation"],
      avoidScenarioIds: ["product-ui", "motion-video"],
      directDeliverables: ["风格规范与版式建议"],
      downstreamTargets: ["商务报告页面", "PPTX 页面", "研究图像"],
      boundary: "风格选择不得削弱数据辨识、来源标注和正式材料可读性。"
    },
    {
      recipeId: "financial-broadsheet-investigative",
      label: "财经事件调查组图",
      summary: "用报纸式密度、标题层级和证据栏组织调查型金融叙事。",
      primaryScenarioId: "visual-communication",
      supportingScenarioIds: ["business-document", "presentation", "web-html"],
      avoidScenarioIds: ["product-ui", "motion-video"],
      directDeliverables: ["调查型编辑版式规范"],
      downstreamTargets: ["研究长图", "专题页面", "PPTX 页面"],
      boundary: "视觉上的调查感不能替代证据链，也不得暗示未经复核的指控或结论。"
    },
    {
      recipeId: "research-series-identity-cover",
      label: "跨比例研究系列封面",
      summary: "用稳定身份区和可替换场景区建立系列化研究封面。",
      primaryScenarioId: "visual-communication",
      supportingScenarioIds: ["business-document", "presentation"],
      avoidScenarioIds: ["product-ui", "motion-video"],
      directDeliverables: ["系列封面版式"],
      downstreamTargets: ["横版封面", "方形裁切", "移动端预览"],
      boundary: "只复用裁切稳定的版式合同；标题、标识、数据和来源必须由程序化文字层承载。"
    },
    {
      recipeId: "photo-derived-editorial-diptych",
      label: "摄影抽象双联画",
      summary: "以两幅相关画面并置，构造有节奏的照片编辑叙事。",
      primaryScenarioId: "visual-communication",
      supportingScenarioIds: ["business-document", "presentation"],
      avoidScenarioIds: ["product-ui", "motion-video"],
      directDeliverables: ["双联画构图方案"],
      downstreamTargets: ["专题配图", "报告跨页", "PPTX 页面"],
      boundary: "必须确认照片来源、肖像权和编辑许可，不得将合成画面当作事实证据。"
    },
    {
      recipeId: "editorial-handwritten-research-note",
      label: "编辑式手写研究笔记",
      summary: "以手写批注、摘录和结构化正文营造研究过程感。",
      primaryScenarioId: "visual-communication",
      supportingScenarioIds: ["business-document", "web-html", "presentation", "product-ui"],
      avoidScenarioIds: ["motion-video"],
      directDeliverables: ["手写研究笔记版式"],
      downstreamTargets: ["研究卡片", "文章配图", "HTML 解释页", "PPTX 页面", "报告边栏"],
      boundary: "手写感只是一种视觉语言，不得伪造真实批注、签字、原始记录或证据；产品 UI 仅限解释区、引导阅读和空状态。"
    },
    {
      recipeId: "short-video",
      label: "短视频",
      summary: "用镜头、字幕、节奏和声音组织短时长信息叙事。",
      primaryScenarioId: "motion-video",
      supportingScenarioIds: ["visual-communication"],
      avoidScenarioIds: ["product-ui", "business-document"],
      directDeliverables: ["短视频时间轴与字幕方案"],
      downstreamTargets: ["MP4 成片", "平台发布版本"],
      boundary: "成片与发布均是后续动作；素材版权、配音授权和外发权限必须另行确认。"
    }
  ],
  roles: [
    {
      id: "workflow",
      label: "做法与流程",
      description: "Skill、规则和 Prompt 负责确定任务步骤、边界与检查顺序。",
      selectionGuidance: "通常依据任务类型自动匹配，不要求用户逐项挑选 Skill、规则或 Prompt。"
    },
    {
      id: "scaffold",
      label: "起始模板",
      description: "模板提供交付物的起始结构、页面骨架和基础占位。",
      selectionGuidance: "在确认交付格式后选择一个最接近目标的模板作为起始结构。"
    },
    {
      id: "visual-language",
      label: "视觉风格",
      description: "风格包定义主视觉语言、排版气质、色彩关系与图像方向。",
      selectionGuidance: "按受众、内容密度和传播场景选择一个主风格，避免多套风格并列竞争。"
    },
    {
      id: "building-block",
      label: "设计部件",
      description: "品牌规范、设计 Token 等资产为方案提供可复用的基础构件。",
      selectionGuidance: "在品牌和项目边界允许时自动组装，必要时再人工指定或替换。"
    },
    {
      id: "quality-gate",
      label: "交付检查",
      description: "工具负责渲染、检查、对比和交付前验证。",
      selectionGuidance: "根据交付格式在导出前运行相应检查，不能用工具可用性代替验证结果。"
    },
    {
      id: "reference",
      label: "参考案例",
      description: "案例、快照和外部包提供方向、对照与历史上下文。",
      selectionGuidance: "只在需要时引用，并复核来源、适用边界和当前视觉成熟度。"
    }
  ],
  categoryRoles: [
    { categoryId: "rules", categoryLabel: "规则包", roleId: "workflow" },
    { categoryId: "prompts", categoryLabel: "Prompt 包", roleId: "workflow" },
    { categoryId: "templates", categoryLabel: "生产模板", roleId: "scaffold" },
    { categoryId: "style-packs", categoryLabel: "风格参考包", roleId: "visual-language" },
    { categoryId: "brand", categoryLabel: "品牌基础", roleId: "building-block" },
    { categoryId: "tokens", categoryLabel: "设计令牌", roleId: "building-block" },
    { categoryId: "tools", categoryLabel: "工具与质量门", roleId: "quality-gate" },
    { categoryId: "cases", categoryLabel: "案例模式", roleId: "reference" },
    { categoryId: "snapshots", categoryLabel: "外部快照", roleId: "reference" },
    { categoryId: "external-packs", categoryLabel: "外部参考包", roleId: "reference" }
  ]
} as const satisfies ApplicationScenarioCatalog;
