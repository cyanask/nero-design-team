# NDT Figure Compiler v0.2：嵌入式报告图

Use this rule for one explanatory, evidence-bearing figure embedded in Word, PDF, WeChat, a PPT page, or another long-form deliverable: industry chains, process flows, transmission mechanisms, capability maps, market structures, competitive positioning, and similar diagrams.

## 用户使用合同

NERO 只需说“调用 NDT，把这段内容画成报告图/公众号图/PPT 图”。NDT 先判断该请求是否是一张结构解释图；如适用，自动选择图型、profile 和 renderer。不要向用户要求 CLI、Figure Spec、renderer 或其他技术参数。

以下请求不进入 Compiler：封面、摄影、概念插画、场景图，以及以氛围或点击意愿为主要目的的视觉素材。这些请求转 `ai-image-generation`。完整文章、完整 Word 文档或完整 PPT 也不等于一张结构图；其中边界清楚的单张解释图可以进入 Compiler。

| 交付语境 | 默认选择 |
|---|---|
| 报告、Word、PDF、尽调 | `report-a4` + PNG（稳定版式优先） |
| 公众号、微信内嵌图 | `wechat-inline` + PNG |
| PPT 的单张解释图 | `ppt-16x9` + SVG |
| 明确要求真正可编辑 | `office-native` / Presentations handoff；不作为 Compiler 的运行时编译输出 |

NDT 只在以下情况问一个聚焦问题：证据依据、期间、单位、分母或项目根目录缺失且会改变结论，或“稳定版式”与“真正可编辑”的选择会改变交付结果。图型、密度、画布和 renderer 的其他选择不需要用户逐项确认。

## 自动图型选择

`supported_types=current`：`flow`、`hierarchy`、`timeline`、`funnel`、`bar`、`line`、`participant_map`、`matrix`、`value_chain`。这是 v0.2 当前已支持的枚举，不是规划覆盖。

| 图型 | 适用内容 |
|---|---|
| `flow` | 产业链、业务流程、传导链 |
| `hierarchy` | 分类层级、产品边界 |
| `timeline` | 时间轴、产能爬坡 |
| `funnel` | 漏斗、阶段门 |
| `bar` | 市场规模、柱图比较 |
| `line` | 趋势、折线图 |
| `participant_map` | 参与者地图、竞争格局 |
| `matrix` | 同业画像、指标矩阵 |
| `value_chain` | 价值链、利润分布 |

## Figure Compiler Contract

Figure Compiler is a central runtime with thin internal CLI and MCP entry points. Each project keeps its own Figure Spec, outputs, and compile receipts. There is no frontend, database, or job service. CLI and MCP are internal/advanced interfaces; do not surface them unless NERO explicitly requests technical usage.

Each Figure Spec must declare its schema version, figure identifier, figure type, visual content or data model, profile, renderer, title, and source reference. It must contain enough figure-local content to compile a repeatable candidate. Project facts, client identity, and source locators remain in the project. The Compiler does not create, resolve, move, or become the system of record for evidence.

Version 0.2 currently supports the figure types in `supported_types=current`: `flow`, `hierarchy`, `timeline`, `funnel`, `bar`, `line`, `participant_map`, `matrix`, and `value_chain`; the profiles `report-a4`, `wechat-inline`, and `ppt-16x9`; and the renderers `vector-svg` and `raster-canvas-png`. `office-native` remains handoff-only and is not implemented by the runtime.

One semantic Spec may be compiled for more than one profile, but it must not be mechanically scaled. A profile may change the canvas, layout density, and type size. It must not change the facts, numbers, units, periods, sources, or meaning of the conclusion.

Every successful compile creates a project-local candidate output and a compile receipt. The receipt identifies the Spec, profile, renderer, and generated output so the project can distinguish a candidate from the current output and superseded outputs. Compilation never promotes an output to current automatically, and does not embed it, commit it, or make it a formal use of the figure.

When a persisted receipt is requested, that receipt is the project-side commit marker. An output without its matching receipt after an interrupted process is an orphan candidate and must not be promoted or embedded. The JSON Schema describes the portable structural contract; the runtime validator remains authoritative for relational constraints such as adjacent flow edges, hierarchy depth and node count.

The thin CLI and MCP surface exposes `list`, `validate`, and `compile` for internal or advanced use. `validate` checks a Spec without producing an output; `compile` produces only a candidate. SVG compilation must not require Pillow. PNG compilation requires an available Pillow runtime and fails closed when it is unavailable. Unsupported types, profiles, renderers, invalid Specs, or missing required runtimes must fail closed.

The Compiler is not for photographic covers or conceptual illustrations. It does not take over a complete WeChat article, Word document, or PPTX. A compiled candidate still requires final visual QA in the intended Word, PDF, or PPT deliverable before formal use.

## Raster Canvas Contract

Use the registered `high-resolution-raster-report-figure` preset when `raster-canvas-png` is selected.

- Render with Python and Pillow to an RGB PNG at 300 DPI.
- Use a 2,100 px or 2,400 px canvas width for a figure embedded at approximately 15.5–16 cm in an A4 Word body.
- At 2,400 px width, use at least 72 px for the title, 44 px for the subtitle, 38 px for body text, 34 px for labels, and 32 px for the source note. Split or lengthen the figure instead of reducing these floors.
- Keep one primary cognitive task per figure. Split industry chain, cost formation, bargaining power, BOM impact, and market sizing when combining them would force dense text or mixed logic.
- Allow a taller canvas or multiple figures. Page compactness does not override readability.
- Keep Latin technical tokens such as `TLVR`, `PMIC/VRM`, `48/54V`, and `design-in` intact when wrapping.
- Use restrained color to encode hierarchy or category. Color is permitted; decorative gradients, card nesting, and ornamental shapes remain out of scope.
- Put a source note inside the figure only when the report design calls for it. Do not repeat the same source immediately below the figure.
- Rebuild the whole PNG when its content changes. Do not patch visible text directly inside the exported bitmap.

## Diagram, Chart, and Table Boundary

- Convert text-only comparison tables to diagrams only when relationships, hierarchy, sequence, or positioning become easier to understand.
- Keep quantitative tables as native Word or Office tables when readers need exact values, row comparison, or later editing.
- Prefer native Office charts when the chart is primarily a data object and the underlying series must stay editable.
- Do not use a raster diagram merely to avoid designing a readable table.

## Report Composition Boundary

The report owner, not NDT, controls document semantics and placement.

- Match every embedded image to its actual caption and sequence; fail when the mapping is uncertain.
- Put explanatory prose between adjacent figures. Do not stack two evidence-bearing figures without a paragraph that explains the transition.
- Keep figure title, body discussion, data period, unit, and source scope consistent.
- Preserve project data, evidence, captions, report files, and client identity in the target project. NDT owns only the reusable rendering method, template, and QA rules.

## Fail-Closed QA

Before saving the PNG, fail on:

- text outside the canvas;
- text outside its registered card or panel;
- overlapping text boxes;
- typography below the declared minimum for its role;
- missing or unresolved Chinese fonts;
- output dimensions below the selected canvas contract.

After embedding, inspect the final report at its intended reading size. Source-level geometry checks do not replace final Word or PDF visual QA.

## Advanced Template Entry

Use this section only when NERO explicitly requests a technical starter or CLI workflow.

Create a multi-profile Figure Compiler starter:

`node $NERO_DESIGN_TEAM_HOME/scripts/nero-design.mjs new image-report --preset "NDT Figure Compiler" --name <project-name> --out <target-parent-dir>`

The starter keeps only a source-free Spec, QA notes, and a thin wrapper. It calls the central runtime and does not fork compiler or layout code into the project.

For the legacy single-flow Pillow starter, use the registered raster preset:

Create a project using the registered preset:

`node $NERO_DESIGN_TEAM_HOME/scripts/nero-design.mjs new image-report --preset 高分辨率PNG报告图 --name <project-name> --out <target-parent-dir>`

The preset contains a Pillow canvas helper, a source-free sample specification, and a deterministic flow-figure renderer. Replace the sample with project-local, source-backed content.
