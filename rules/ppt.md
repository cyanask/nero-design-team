# PPT Rule

Use this rule for formal PPTX decks, research slide decks, roadshow-style decks, internal presentations, design audits, and web-based HTML decks.

NERO Design Team is the default PPT entrypoint and controller. PPT-related reference skills are fused into NERO rules; do not route to `ppt-design-reference` or `guizang-ppt-skill` as default independent entrypoints. If NERO rules are missing or the user explicitly names those older skills, read them as reference only.

## Subroutes

| Subroute | Use when | Primary engine | Supporting rules |
|---|---|---|---|
| `formal-pptx` | New editable banker, research, investor, strategy, product, or board PPTX | Presentations artifact-tool | `ppt-business-design.md`, `visual-qa.md` |
| `template-following` | User supplies a template/source PPTX, says follow this, same layout, corporate template, or source deck | Presentations template-following flow | `ppt-business-design.md`, source/template fidelity gate |
| `ppt-design-audit` | Diagnose, critique, redesign, or visually upgrade a business deck | NERO design review | `ppt-business-design.md`, `visual-qa.md` |
| `web-ppt-html` | Horizontal swipe HTML deck, magazine style, Swiss style, web PPT, share/demo talk deck | Web PPT rule | `web-ppt.md`, browser screenshot QA |
| `legacy-local-pptx` | Presentations unavailable, lightweight local sample, MCP dry-run, local template verification | PptxGenJS local template | `pptx-theme.mjs`, `pptx-deck/qa.md` |

## Engine Policy

- Formal editable PPTX defaults to the Presentations plugin and artifact-tool presentation JSX.
- Template/source PPTX work must preserve source deck skeletons through the Presentations template-following path.
- PptxGenJS is a legacy local fallback, not the default formal production path.
- Slidev is a secondary web/Markdown deck path only when the user specifically wants Markdown or live technical slides.
- Guizang Refresh v1.4 only strengthens the `web-ppt-html` route. It must not replace the Presentations-first route for formal editable PPTX.
- Swiss-style web PPT should run `scripts/validate-web-ppt.mjs <index.html> --mode swiss` before delivery.
- Data-heavy slides use ECharts/G2/Plot output as precise images or SVG, then place with exact units, labels, source notes, and footers.
- `ai-image-generation.md` applies only to covers, section dividers, background/concept visuals, or image-led pages. Exact text, figures, charts, tables, source notes, regulatory wording, and conclusions stay in PPT/HTML code.

## Design Standard

- Build or load NERO tokens before detailed styling. Use `pptx-theme.mjs` for local PPTX fallbacks.
- Decide the deck subroute before writing or generating slides.
- Each slide has one dominant conclusion, one proof object, and no filler.
- Use a stable deck system: typography, grid, color roles, chart style, image treatment, section logic, page number, and footnote placement.
- For investor, banking, research, or regulated contexts, every data-dependent claim needs source, period, unit, and denominator where relevant.
- Chinese decks prioritize typography, table legibility, numeric alignment, source notes, and editable text fidelity.

## Hard Bans

- No generic bullet slide when a chart, table, matrix, timeline, or diagram is clearer.
- No generated image text, numbers, chart labels, table values, regulatory wording, or final conclusions.
- No unaligned chart/table/title blocks.
- No tiny footnotes that fail presentation-distance readability.
- No mixed visual styles unless the change is a deliberate section system.
- No copied Guizang templates or external Skill assets into NERO by default.
- No deletion of legacy PPT skills during v1.2 fusion.

## QA Gates

- Subroute chosen and reported.
- Visual direction locked before production.
- Claim spine or page-type map exists for substantial decks.
- Contact-sheet thinking applied: thumbnails show coherent rhythm and hierarchy.
- Tables and charts are readable at presentation distance.
- Footer/source-note placement is stable.
- Final output path, dimensions, and nonzero file size are verified when an artifact is produced.

## Prompt Snippet

Use the NERO Design Team PPT route. Start from `ppt.md`, choose a PPT subroute, load `ppt-business-design.md` for business deck quality, load `web-ppt.md` for HTML/web PPT, default formal PPTX to Presentations artifact-tool, and use PptxGenJS only as a legacy local fallback.
