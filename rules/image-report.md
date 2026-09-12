# Image Report Rule

Use this rule for research cards, WeChat long images, industry-report visuals, financial summaries, social cards, and exportable PNG/JPEG/WebP report assets.

## 结构图自动路由

- 当用户只说“调用 NDT，把这段内容画成报告图/公众号图/PPT 图”时，先判断它是否是一张结构解释图；如适用，读取 `report-figure-rendering.md` 并由 Figure Compiler v0.2 自动选择图型、profile 与 renderer。
- 不要求用户选择 PNG、SVG、Office-native 或技术参数。默认：报告/Word/PDF/尽调使用 `report-a4` + PNG；公众号/微信使用 `wechat-inline` + PNG；PPT 解释图使用 `ppt-16x9` + SVG；明确要求真正可编辑时转 `office-native` / Presentations handoff。
- 仅当证据、期间、单位、分母、项目根目录缺失并会改变结论，或“稳定版式”与“真正可编辑”的选择会改变交付时，才问一个聚焦问题。完整合同、候选状态和 QA 边界以 `report-figure-rendering.md` 为准。

## Routing

- Layout and design direction: select from the audience, reading goal and inspected local/web references; density and tone are task choices.
- Charts: ECharts for production Chinese/business charts; G2 for data storytelling; Observable Plot for quick exploratory visuals.
- Static rendering: Satori plus resvg-js when SVG/PNG card output is enough.
- Browser rendering: Puppeteer when CSS fidelity, complex layout, or real browser screenshots matter.
- Post-processing: Sharp for resize, crop, compression, compositing, and final export variants.
- Use `ai-image-generation.md` only for cover/background/concept visuals; exact text, numbers, tables, and charts stay in Satori/Sharp or browser-rendered code.
- Use `留白杂志风` (`minimal-zine-editorial.md`) only for sparse covers or section dividers. Do not apply its poster density to evidence-bearing report-card bodies.
- Use `photo-derived-editorial-diptych.md` only for photo-led covers, section dividers, social cards, or other non-evidence editorial visuals. Keep the source photo independent, require a `relation_trace`, and layer exact text deterministically.
- Record the selected project theme, chart palette, typography and export geometry; local NERO tokens are candidate resources.

## Design Standard

- Build tokens first with `$NERO_DESIGN_TEAM_HOME/scripts/build-tokens.mjs` when using local templates.
- Compose for the actual information and reading context; do not delete necessary research content to force a sparse poster treatment.
- Put the conclusion or key number near the top.
- Keep chart titles explicit and metrics traceable.
- Use consistent margins, section rhythm, and numeric alignment.
- Preserve Chinese typography quality; avoid fallback font surprises.
- Use callouts sparingly and only for decision-relevant insights.

## Hard Bans

- No unverified numbers in image outputs.
- No generated image text or numbers as evidence.
- No chart without unit, period, or denominator when relevant.
- No decorative chart shapes that distort data.
- No image export without checking target dimensions.
- No low-contrast small text in dense cards.

## Export Targets

- WeChat long image: define exact width, usually 1080px or 1242px.
- Report card: define exact viewport and pixel ratio.
- Social card: define exact aspect ratio before layout.
- Multi-card carousel: keep each card independently readable.
- AI-generated background: verify clean overlay zones before compositing exact content.

## Prompt Snippet

Use the NERO Design Team image-report route: task-led reference exploration and composition, available ECharts/G2 for charts, the appropriate deterministic or browser renderer, and image post-processing where needed. Output must be a professional Chinese research visual with traceable metrics, readable labels, and verified export size.
