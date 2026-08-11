# Visual QA Rule

Apply this rule before calling any design output complete.

## Universal Checks

- The design matches the stated output type: UI, image report, PPT, or video.
- The design matches the audience: investment banking, AI industry research, financial analysis, or internal tooling.
- NERO design tokens are applied or deliberately overridden with a stated reason.
- Important numbers have units, period, and source where relevant.
- Text does not overflow or collide with nearby elements.
- Long Chinese labels have enough space and line-height.
- Color is not dominated by a single hue family unless deliberately required.
- Contrast is sufficient for dense information.
- Layout is aligned to a visible grid.
- Repeated elements have consistent spacing, radius, typography, and state styling.
- The output does not use decorative elements that compete with evidence.
- If `gpt-image-2` was used, generated visuals are treated as素材 only and exact text/data/charts were overlaid by code.
- No generated text, financial numbers, table cells, chart labels, regulatory wording, or source notes are accepted as evidence.

## UI Checks

- Desktop and mobile states are inspected when feasible.
- Tables remain readable and controls remain usable.
- Buttons and icons have stable sizes.
- Static style previews, screenshots, and `design-output/*.html` do not replace real-app UI QA. For maintained local apps, inspect the actual running app with real/project-native data before calling the UI complete.
- Real-app QA should include vertical scrolling, table/control horizontal scrolling, desktop and narrow/mobile widths, text overflow, and whether visible values match the active data source.
- Hover, selected, empty, loading, and error states exist where the workflow needs them.

## Effective HTML Checks

Use this gate for self-contained HTML explainers, architecture diagrams, visual plan pages, and HTML/web PPT diagram pages.

- The artifact opens without a build step when that is the intended delivery.
- Light/dark mode, if present, uses CSS variables and does not flash wrong colors before paint.
- SVG diagrams use theme-aware CSS variables/classes where feasible.
- SVG labels, HTML labels, node labels, and flow captions are readable at target desktop/projector sizes.
- The diagram simplifies architecture or process understanding instead of duplicating every implementation detail.
- Upstream sample data, product names, copywriting, and visual identity are removed.
- Exact facts, figures, source notes, and regulatory conclusions remain verified HTML text, not raster images.

## Presentation Harness Checks

Use this gate when `html-native-harness.md`, `html-deck-style-discovery.md`, or `ppt-production-harness.md` materially influenced an output.

- External references are reported as reference-only, snapshot, or restricted asset, not as NERO-owned material.
- Substantial decks have a spec lock or a stated reason for skipping it.
- Fixed-stage HTML decks use a 16:9 stage such as 1920x1080 and scale the full stage as one unit.
- Style-discovery previews compare the same content skeleton across directions.
- Formal PPTX outputs preserve required native editability for titles, body text, figures, tables, chart labels, and source notes where feasible.
- SVGs do not hide exact financial numbers, regulatory conclusions, source notes, or body text as uneditable paths unless explicitly accepted.
- No upstream template pack, audio/video media, watermark, demo asset, or provider config was copied into the deliverable by default.

## Mature Deck Reference Gate

Use this gate whenever the user names benchmark pages, an approved wave, a manually adjusted deck, or a mature prior version.

- Inspect the final runtime artifact, not only source objects or intermediate CSS. Confirm physical page mapping, merge/override priority, visible frozen fields, and expected card/node counts; stale or shadowed specs are a hard fail.
- Render the exact current artifact and compare changed pages with the named benchmark pages at the same scale. A contact sheet must show the same title axis, information-area weight, dark/light hierarchy, footer discipline, and overall maturity.
- Convert relative CSS units to physical pixels/points at the delivery canvas. Honor the task typography contract; for A4 landscape banker decks without a stricter contract, body and secondary information must be at least 11pt and source notes at least 8.5pt.
- Treat technical, design, and aesthetic gates separately. Script parsing, field preservation, DOM validity, or overflow checks cannot substitute for design and aesthetic approval.
- If final browser/render evidence or benchmark comparison is missing, report `visual_not_ready`; never report `visual_ready`, `mature`, or `ready_for_human_review` from V0/static checks alone.
- When review is wave-based or a prior wave was rejected, obtain human approval for the repaired wave before producing later pages.

## Frontend Taste Pre-Flight

Use this gate for `frontend-ui` and frontend-oriented `visual-audit` tasks. It fuses NERO-calibrated Impeccable/Taste checks without installing or invoking those external tools.

- The first viewport is the real working interface unless the user explicitly asked for a landing page, cover, or portfolio.
- The design read is clear before code or styling: page kind, audience, existing assets, quiet constraints, visual strength, and selected `DESIGN_VARIANCE` / `MOTION_INTENSITY` / `VISUAL_DENSITY`.
- If the design read was ambiguous, exactly one key clarification was asked, or a reasonable default was explicitly stated.
- The three dials match the task: high density for dashboards and analytical tools, low motion for finance/disclosure tools, higher variance only for brand/launch/portfolio/concept work.
- Generic AI patterns are either absent or passed the Exception Gate: purple-blue gradients, centered template hero, three equal feature cards, card-inside-card, excessive glassmorphism, decorative stock imagery, and default Inter/system typography without intent.
- Dashboards, admin workflows, evidence rooms, and table/form screens do not open with a marketing hero unless the task is explicitly a cover, launch, case room, or chapter-style presentation surface.
- Three-card feature rows, fake status pills, version stamps, section-number labels, scroll cues, city/time strips, photo-credit captions, and decorative image labels are absent unless they carry real product meaning and pass the Exception Gate.
- Any exception is justified by task fit, content fit, asset fit, readability fit, evidence fit, and QA fit.
- CTA labels are readable, do not wrap awkwardly at desktop widths, and do not duplicate the same action intent under different names.
- Dense business workflows preserve filters, labels, source context, units, periods, and data density before visual novelty.
- Static style previews and `design-output/*.html` are only style exploration artifacts; maintained local apps need final QA on the real running surface, not only on a static preview.
- Loading, empty, error, selected, hover, focus, disabled, and active states are present where the workflow needs them.
- Text does not overflow buttons, tables, sidebars, badges, chart labels, or compact controls at target widths.
- Typography, contrast, touch targets, heading order, responsive collapse, and reduced-motion fallback pass a mechanical review.
- The result still reads as a NERO investment-banking, AI research, or internal analytical tool; it is not pushed toward a marketing or Awwwards style unless explicitly requested.
- If upstream `taste-skill` or another tool influenced the output, the result is mapped back to NERO tokens, NDT dials, and this QA gate rather than treated as a separate design authority.

## Frontend Motion Checks

Use this gate when `frontend-motion.md` materially influences a `frontend-ui` or frontend-oriented `visual-audit` task.

- Every material animation has an explicit purpose: feedback, spatial consistency, state indication, jarring-change prevention, explanation, or rare delight.
- Very frequent, keyboard-driven, table, filter, disclosure, and evidence-review actions remain immediate and do not gain decorative travel.
- Press feedback appears without artificial input delay; continuous gestures update continuously.
- Dragged content preserves the grab offset, uses pointer capture when needed, and does not jump when another touch point appears.
- Rapidly repeated or reversible interactions retarget from the current presented value and do not lock input while motion completes.
- Gestures that must preserve release velocity use a physics-based spring or inertia model; duration-based spring timing is not mistaken for velocity handoff.
- Momentum-driven interactions choose their resting target from the projected trajectory rather than release position alone when that behavior is expected.
- Over-drag uses bounded progressive resistance instead of an unexplained hard stop where rubber-banding is appropriate.
- Popovers, menus, drawers, and sheets preserve a coherent origin and enter/exit path; viewport-level modals remain centered when appropriate.
- Motion tokens come from `tokens/motion.json` or a documented project-local mapping; near-duplicate ad hoc curves and durations are absent.
- `prefers-reduced-motion` behavior is tested; movement, overshoot, and parallax are removed while necessary state feedback remains.
- Reduced transparency, contrast, sound, vibration, and haptics are progressive enhancements and never the only status or warning channel.
- High-risk interactions are inspected in slow motion or frame-by-frame; material touch gestures are checked on a real device when feasible.
- Upstream repository, MIT status, extracted patterns, and excluded Apple/third-party assets are reported when the fused reference materially affects the result.

## Image Report Checks

- Export dimensions are explicit.
- Pixel output exists and is nonzero size.
- Charts are readable at final display size.
- Source notes and metric definitions are visible or otherwise traceable.
- AI-generated backgrounds have clean overlay zones and do not compete with exact text/charts.

## Embedded Report Figure Checks

Use this gate with `report-figure-rendering.md` for figures placed inside Word, PDF, or other long-form reports.

- The selected rendering mode is recorded as `raster-canvas-png`, `vector-svg`, or `office-native`; it was selected for this task or batch, not inherited as a hidden global default.
- A raster canvas is at least 2,100 px wide, saved as RGB PNG at 300 DPI, and readable when embedded at the intended document width.
- Title, subtitle, body, label, and source-note typography meet the selected canvas floors; dense content was split or lengthened instead of shrunk.
- No text crosses the canvas, card, or panel boundary, and no two text boxes collide.
- Each figure performs one primary explanatory job; unrelated industry-chain, cost, BOM, bargaining, or sizing logic is not compressed into one image.
- Text-only comparisons became diagrams only when the relationship is clearer; exact quantitative comparisons remain native tables or charts when editability matters.
- Figure content, caption, sequence, period, unit, and source scope agree.
- The report does not repeat a source line directly below a figure that already contains the same source.
- Adjacent evidence-bearing figures are separated by explanatory prose in the final document.
- Source-level geometry checks are supplemented by final Word or PDF visual inspection at the intended reading size.

## 留白杂志风检查

Use this gate when `留白杂志风` (canonical rule `minimal-zine-editorial.md`) materially influences an output.

- The format is registered as `poster-3x5`, `social-4x5`, `social-1x1`, or `slide-16x9`, and the output dimensions match that ratio.
- Negative space is recorded and falls within `0.70-0.90` unless a documented exception is approved.
- The subject cluster occupies `0.08-0.25` of the canvas and stays outside unsafe edges.
- The selected layout, anchor, typography, texture, mood, and accent form are recorded as one recipe tuple.
- The same full recipe tuple was not repeated within the three most recent visible outputs.
- The high-chroma anchor occupies `0.008-0.025` of the canvas or `0.15-0.35` of the subject cluster.
- Thumbnail review confirms the subject and color anchor remain visible without zooming and are not washed out.
- Automatic regeneration ran no more than once and records the failed constraint and final outcome.
- Exact titles, dates, names, figures, labels, logos, and source notes are deterministic overlay objects, not accepted from the generated raster layer.
- Upstream sample images are reported as remote references only and are not treated as NERO-owned or client-delivery assets.

## 摄影抽象双联画检查

Use this gate when `photo-derived-editorial-diptych` materially influences an output.

- The source photo and generated abstract panel are separate layers; `photoPixelsPreserved` is true.
- `photoAreaRatio` matches the source orientation range, `panelAreaRatio` is explicit, and the two ratios sum to one within 0.01.
- `motifWidthRatio` remains within the registered restrained range and `cleanSpaceRatio` remains 0.65–0.80.
- A complete 3–6 item `relationTrace` maps source facts to panel marks; supporting mark families do not exceed two.
- The panel background is uniform; no generated title, subtitle, number, date, location, color swatch, legend, logo, watermark, texture, gradient, shadow, or unsupported extra element is accepted.
- Exact title/subtitle text is deterministic overlay content and `generatedExactTextUsed` is false.
- Automatic regeneration is limited to one panel-only retry; after a second failure return `visual_not_ready`.
- The upstream `ZzzLc0405/photo-abstract-editorial` repository remains method-only with unknown license; its Prompt and examples are not NDT assets.

## PPT Checks

- PPTX exists and has nonzero size.
- Slide titles, footers, charts, and tables align across pages.
- Repeated slide types use consistent layouts.
- Table headers and numeric columns are readable.
- AI-generated cover or section visuals are behind exact PPTX text and do not contain fake evidence.

## Video Checks

- Aspect ratio, frame rate, and duration are explicit.
- Key frames are inspected.
- Captions fit within mobile-safe boundaries.
- Motion does not hide the data or make charts unreadable.
- AI-generated scene images are checked after captions, figures, and chart overlays are added.

## Script Check

For a quick structured pass, create a visual manifest and run:

`node $NERO_DESIGN_TEAM_HOME/scripts/visual-qa.mjs <visual-manifest.json>`

## Score Handoff

After QA, use `visual-score.md` when the artifact needs a readiness judgment. QA checks whether specific requirements pass; scoring summarizes quality and delivery readiness.

## Projection Typography Audit

For HTML/PDF decks and projection-oriented PPT outputs, run a rendered typography check when small text may affect presentation readability.

Command:

`node $NERO_DESIGN_TEAM_HOME/scripts/audit-projection-typography.mjs <html-path-or-url> <output-dir> [prefix]`

Acceptance guidance:

- Visible text below 12px in a 1920x1080 render should be treated as a review item.
- Body text, transaction fields, table cells, and workflow notes should target 13-15px or larger.
- Company names, key amounts, and regulatory status should be 16px+ when feasible.
- If typography fails, reduce repeated fields, split pages, or switch from sparse tables to tombstones/ledgers instead of shrinking text.

## HTML Deck Contact Sheet And Publish QA

- Render high-risk slides and a full contact sheet before declaring an HTML deck ready.
- High-risk pages include cover, management conclusion, table-heavy case pages, evidence maps, path-judgment matrices, work-plan pages, chapter dividers, dark statement pages, and closing pages.
- Check title wrapping, especially one-character second lines in Chinese headings.
- Check body-bottom pressure, table readability, footer/source overlap, logo collision, and background-image interference.
- For fixed-stage decks, verify the stage scales as one unit and does not reflow body cards independently.
- For published GitHub Pages or public HTML, run an online assertion after deployment: HTTP 200, expected title text, expected CSS markers, expected asset paths, and no stale pre-update markers.
- Keep screenshots/contact sheets as project-local QA evidence, not global reusable content unless anonymized.
