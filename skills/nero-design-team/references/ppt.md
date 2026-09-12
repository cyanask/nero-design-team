# PPT Rule

Use this rule for formal PPTX decks, research slide decks, roadshow-style decks, internal presentations, design audits, and web-based HTML decks.

NERO Design Team is the default PPT visual entrypoint and visual controller. GPT Work remains the cross-system controller and invokes the engine selected for the current operation after the visual gate. PPT-related reference skills are fused into NERO rules; do not route to `ppt-design-reference` or `guizang-ppt-skill` as default independent entrypoints. If NERO rules are missing or the user explicitly names those older skills, read them as reference only.

## Subroutes

| Subroute | Use when | Primary engine | Supporting rules |
|---|---|---|---|
| `formal-pptx` | New editable banker, research, investor, strategy, product, or board PPTX | Current project registry; NERO Principal routes `new_formal_pptx` to `ppt-master-native-pptx` | `ppt-business-design.md`, `visual-qa.md` |
| `template-following` | User supplies a template/source PPTX, says follow this, same layout, corporate template, or source deck | Presentations template-following flow | `ppt-business-design.md`, source/template fidelity gate |
| `ppt-design-audit` | Diagnose, critique, redesign, or visually upgrade a business deck | NERO design review | `ppt-business-design.md`, `ppt-production-harness.md`, `visual-qa.md` |
| `web-ppt-html` | Horizontal swipe HTML deck, magazine style, Swiss style, web PPT, share/demo talk deck | Web PPT rule | `web-ppt.md`, `html-deck-style-discovery.md`, browser screenshot QA |
| `legacy-local-pptx` | Explicit lightweight local sample, MCP dry-run, or local template verification | PptxGenJS local template | `pptx-theme.mjs`, `pptx-deck/qa.md` |

## Engine Policy

- Resolve the PPTX operation from the current project's machine-readable engine registry before formal production. In NERO Principal, `new_formal_pptx` defaults to `ppt-master-native-pptx`.
- Template/source PPTX work must preserve source deck skeletons through the Presentations template-following path.
- PptxGenJS is an explicit-only legacy local route, not a silent fallback or default formal production path.
- Slidev is a secondary web/Markdown deck path only when the user specifically wants Markdown or live technical slides.
- Guizang Refresh v1.4 only strengthens the `web-ppt-html` route. It must not replace the project-selected route for formal editable PPTX.
- Frontend Slides reference only strengthens fixed-stage HTML deck style discovery. It must not replace formal PPTX or deploy web decks by default.
- The unpinned PPT Master reference only strengthens production discipline: spec lock, SVG QA, native editability, and AI image style lock. A pinned `ppt-master-native-pptx` adapter may become the default only through a project registry and its own acceptance gates.
- When KAT provides a `presentation_handoff_contract`, read `presentation-handoff-contract.md` before visual production. Treat KAT as content director and NERO Design Team as visual director.
- For substantial KAT-to-NDT presentation production, read `presentation-production-chain.md` and `presentation-design-spec.md`. Require or create a production packet, design spec, style lock, and visual exploration record before claiming production readiness.
- Swiss-style web PPT should run `scripts/validate-web-ppt.mjs <index.html> --mode swiss` before delivery.
- Data-heavy slides use ECharts/G2/Plot output as precise images or SVG, then place with exact units, labels, source notes, and footers.
- `ai-image-generation.md` applies only to covers, section dividers, background/concept visuals, or image-led pages. Exact text, figures, charts, tables, source notes, regulatory wording, and conclusions stay in PPT/HTML code.

## Existing Deck Follow-up Rule

- When revising an existing PPTX, the current PPTX is the visual source of truth. Inspect and render it first; do not regenerate from stale scripts, old exports, or earlier versions.
- Treat user manual visual edits as intentional constraints. Preserve removals of logos, masks, overlays, boxes, page rhythm, image crops, and typography unless the user explicitly asks to undo them.
- For template-following or revision tasks, compare before/after contact sheets and call out any deliberate visual deviation.


## Design Standard

- Record the selected visual system before detailed styling. NERO token themes are candidates or dependencies of an explicitly chosen local template.
- Decide the deck subroute before writing or generating slides.
- For substantial PPT work, apply `ppt-production-harness.md`: lock purpose, output, page system, visual system, editability, source boundary, asset boundary, and QA gates before full production.
- For substantial PPT work coming from KAT, require a `presentation_handoff_contract` or state why the contract is unavailable. Use it as the source for slide intent, evidence refs, exact text/data boundaries, and return-to-KAT conditions.
- For production-chain PPT work, also require the KAT-side `slide_claim_map`, `narrative_variants`, and `content_freeze_gate`, plus the NDT-side `design_spec`, `style_lock`, and `visual_exploration`.
- Each slide has one dominant conclusion, one proof object, and no filler.
- Use a stable deck system: typography, grid, color roles, chart style, image treatment, section logic, page number, and footnote placement.
- For investor, banking, research, or regulated contexts, every data-dependent claim needs source, period, unit, and denominator where relevant.
- Chinese decks prioritize typography, table legibility, numeric alignment, source notes, and editable text fidelity.

## Hard Bans

- Compare bullets, charts, tables, matrices, timelines or diagrams by how well they explain the page; no page type is banned by default.
- No generated image text, numbers, chart labels, table values, regulatory wording, or final conclusions.
- No unaligned chart/table/title blocks.
- No tiny footnotes that fail presentation-distance readability.
- No mixed visual styles unless the change is a deliberate section system.
- No copied Guizang templates or external Skill assets into NERO by default.
- No copied Frontend Slides bold templates or PPT Master SVG/PPTX example packs into NERO by default.
- Do not report formal PPTX readiness without recording PPTX editability, preview/screenshot, overflow, chart readability, and source-note preservation checks or explicitly marking them unverified.
- No deletion of legacy PPT skills during v1.2 fusion.
- Read-only web/image reference search follows the director exploration branch. Dependency installation, TTS, watermark removal, provider setup and external publication retain their existing permission boundaries.

## QA Gates

- Subroute chosen and reported.
- Visual direction locked before production.
- Spec lock applied for substantial decks, or deliberately skipped with reason.
- Claim spine or page-type map exists for substantial decks.
- If a KAT handoff exists, its contract status, output lane, must-preserve fields, and exact data fields are checked before visual work.
- Contact-sheet thinking applied: thumbnails show coherent rhythm and hierarchy.
- Native editability and SVG text/path risks checked when the output is formal PPTX or SVG-heavy.
- Tables and charts are readable at presentation distance.
- Footer/source-note placement is stable.
- Final output path, dimensions, and nonzero file size are verified when an artifact is produced.

## Prompt Snippet

Use the NERO Design Team PPT route. Start from `ppt.md`, choose a PPT subroute, load `presentation-handoff-contract.md` when KAT or a handoff contract is involved, load `presentation-production-chain.md` and `presentation-design-spec.md` when production-chain work is in scope, load `ppt-business-design.md` for business deck quality, load `web-ppt.md` for HTML/web PPT, resolve formal PPTX through the current project registry, and use PptxGenJS only as an explicitly selected legacy local fallback.

## Structured project engine selection

`nero_design_route` accepts `project_root`, optional `engine_registry_path`, and `ppt_operation` (`new_formal_pptx`, `existing_pptx_edit`, `strict_template_following`, `google_slides`, or `inspection_or_repair`). The caller should supply the operation when natural-language intent is ambiguous.

Without an explicit registry path, the tool checks only the project root's `00_workbench/pptx-engine-registry.json`, `pptx-engine-registry.json`, and `.nero-design/pptx-engine-registry.json`; multiple candidates require an explicit path. It reads the registry's selected operation rather than imposing a global engine. Missing/invalid project context returns `engine_resolution.status: pending`, `primary_engine: null`, and the missing input.

An existing caller result may be supplied as `engine_resolution` with `operation`, `engine_id`, `source_path`, and `source_sha256`. NDT verifies the binding against the current registry and reuses it; stale/mismatched results stay pending. All results are recommendation-only (`controller: caller`, `execution: none`) and never invoke an engine or choose a silent fallback.

Natural-language routing treats `可编辑` and `editable` as output capabilities, not edit operations. Explicit operation selection takes precedence; template-following remains specialized; a creation request such as `新建正式可编辑 PPTX` resolves to `new_formal_pptx`, while editing an existing deck resolves to `existing_pptx_edit`.
