# Repository Registry

This page is only the external-repository selection view. The authoritative machine-readable NERO Design Team Registry lives at `$NERO_DESIGN_TEAM_HOME/registry/design-team.json`; its asset subregistry lives at `$NERO_DESIGN_TEAM_HOME/registry/design-assets.json`.

Use `nero_design_get_registry` or run `node $NERO_DESIGN_TEAM_HOME/scripts/validate-registry.mjs` when the question is about NDT truth domains, source/runtime/OSS boundaries, asset coverage, or Registry integrity. Do not infer runtime or production maturity from Registry completeness.

Use the repository list below only to choose references without loading entire external repositories.

## Design Direction

- `alexpate/awesome-design-systems`: mature design systems, governance, component taxonomy, token discipline.
- `bradtraversy/design-resources-for-developers`: fonts, colors, icons, and candidate design resources.

## Frontend UI

- `shadcn-ui/ui`: default React UI baseline and accessible component composition.
- `carbon-design-system/carbon`: dense analytical tools and enterprise information hierarchy.
- `ant-design/ant-design`: complex tables, forms, filters, validation, modals, date controls, and admin workflows.
- `birobirobiro/awesome-shadcn-ui`: shadcn ecosystem index for blocks, registries, dashboards, and extensions.
- `magicuidesign/magicui`: restrained accent only; do not use for dense core workflows.
- `pbakaus/impeccable`: fused reference for detector-style frontend design review, anti-pattern checks, and final UI polish. Do not install hooks, live mode, or npm packages by default.
- `Leonxlnx/taste-skill`: fused reference for four targeted frontend upgrades: anti-slop rules, `DESIGN_VARIANCE` / `MOTION_INTENSITY` / `VISUAL_DENSITY`, brief inference before code, and shared configuration discipline. Use only NERO-calibrated excerpts, not a standalone default route.
- `plannotator/effective-html`: fused reference for self-contained HTML artifacts, SVG-first architecture diagrams, visual plan pages, and single-file HTML explainers. Do not install as an independent default Skill or copy upstream examples directly.
- `emilkowalski/skills`: fused reference for responsive and interruptible interaction motion, gesture physics, restraint-first motion decisions, animation audits, repair-plan structure, and motion vocabulary. Use `frontend-motion.md`; do not install the upstream skills as parallel NDT entrypoints or copy Apple/third-party identity assets.

## Charts

- `apache/echarts`: production Chinese/business charting and interactive dashboards.
- `antvis/G2`: visualization grammar and data storytelling.
- `observablehq/plot`: concise exploratory charts.

## Image Reports

- `vercel/satori`: JSX/HTML-like static layout to SVG.
- `thx/resvg-js`: SVG to PNG rendering with font support.
- `lovell/sharp`: image resize, crop, composite, compression, and format conversion.
- `puppeteer/puppeteer`: browser screenshots and visual QA when CSS fidelity matters.

## PPT And Video

- `gitbrent/PptxGenJS`: native PPTX generation for formal editable decks.
- `slidevjs/slidev`: Markdown/web slide decks.
- `plannotator/effective-html`: reference for HTML/web PPT diagram pages, no-build single-file artifacts, SVG stages, and dark-mode-aware CSS variable patterns.
- `remotion-dev/remotion`: React-based programmatic video generation. Check license before commercial use.

## AI Image Generation

- `OpenAI gpt-image-2`: generate high-quality visual素材 for covers, backgrounds, chapter visuals, video scenes, and style exploration.
- `LiamGvchi/gc-minimal-zine-poster`: fused reference for minimal paper-zine prompt grammar, quantitative negative-space composition, variation recipes, thumbnail review, and one-retry color-anchor correction. Use the NERO-native `留白杂志风` alias backed by canonical preset `minimal-zine-editorial`; do not install the upstream Skill as a parallel entrypoint or copy its JPEG examples into NDT.
- Boundary: never use generated text, numbers, tables, chart labels, regulatory wording, or source notes as final evidence.
- Required handoff: create a brief first, then add exact content through Satori/Sharp, PptxGenJS, or Remotion, then run visual QA.
