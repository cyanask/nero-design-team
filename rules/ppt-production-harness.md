# PPT Production Harness Rule

Use this rule when NERO Design Team needs stricter PPT production discipline: spec lock, serial production, SVG QA, native editability, or AI-image style consistency.

## Fused Reference

- Source: `hugohe3/ppt-master`
- Local snapshot: `$NERO_DESIGN_TEAM_HOME/case-library/snapshots/hugohe3__ppt-master/snapshot.json`
- License status: permissive, but upstream examples, SVGs, and PPTX files remain reference-only.

## Boundary

This rule improves NERO's production harness. It does not replace the formal Office route.

- Formal PPTX / Google Slides: Presentations plugin remains primary.
- Local `PptxGenJS`: legacy fallback only.
- `ppt-master`: reference-only for production discipline, not a default runtime or dependency set.
- KAT x NDT production-chain work must use KAT artifacts for content locks and NDT artifacts for design locks; do not collapse them into one uncontrolled prompt.

## Spec Lock

Before producing a substantial deck, create or infer a concise spec:

- `purpose`: why the deck exists and who will read it.
- `output`: formal PPTX, template-following PPTX, web PPT HTML, image deck, or audit only.
- `page_system`: cover, section, conclusion, proof, table, chart, matrix, timeline, appendix.
- `visual_system`: typography, grid, palette, chart style, image treatment, footer/source placement.
- `editability`: which elements must remain editable as text, shapes, charts, or tables.
- `source_boundary`: what facts/numbers are verified, assumed, placeholder, or forbidden.
- `asset_boundary`: which images are owned, generated, external-reference, or forbidden.
- `qa_gates`: render, overlap, typography, SVG, source notes, export size, and production-trace cleanup.

Lock this spec before full production. If the user changes the deck direction, update the spec first, then regenerate or revise.

## Production Pipeline

1. Route and subroute decision.
2. Content spine and page-type map.
3. KAT slide claim map, narrative variant, and content freeze gate when the deck comes from KAT.
4. NDT design spec, style lock, and three-direction visual exploration.
5. Asset and data boundary check.
6. Page production.
7. SVG/native-editability QA.
8. Render/contact-sheet QA.
9. Production-trace cleanup.
10. Final report with used route, engine, tokens, templates, references, QA, and unverified items.

## SVG QA

- Use SVG for geometry, diagrams, icons, and non-editable decorative marks only when it improves precision.
- Do not place exact financial numbers, regulatory conclusions, footnotes, source labels, or body text as SVG paths if editability is required.
- Visible SVG text should be avoided in web PPT and audited in PPTX.
- Check viewBox, clipping, text-to-path side effects, color contrast, and scaling.

## Native Editability

- Editable PPTX should preserve titles, body text, table text, chart labels, and source notes as editable objects where feasible.
- Rasterized pages are acceptable only for covers/backgrounds/section art or when NERO explicitly accepts non-editable output.
- If exact numbers are generated as images, treat that as a QA failure unless it was explicitly approved as final raster export.

## AI Image Style Lock

- Use `ai-image-generation.md` before any generated image.
- Lock style words, palette, lens/camera treatment, forbidden elements, and safe text zones.
- Generated images may supply cover, chapter, background, mood, or scene素材 only.
- Exact titles, Chinese正文, figures, chart labels, tables, source notes, and conclusions are layered later through Presentations, HTML, Satori/Sharp, or Remotion.

## Hard Bans

- Do not install heavy dependencies by default.
- Do not run image search, TTS, watermark removal, or provider-specific generation by default.
- Do not write `.env`, API keys, tokens, cookies, or provider secrets.
- Do not copy large SVG/PPTX example folders into NERO.
- Do not let this rule override Presentations for formal PPTX.
- Do not call a formal deck production-ready until the production packet, design spec, style lock, and required PPTX QA evidence are present or explicitly marked unverified.

## Completion Gate

Report whether a spec was locked, what remained editable, what was rasterized, which QA gates ran, and which production risks remain.
