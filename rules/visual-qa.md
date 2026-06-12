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

## Frontend Taste Pre-Flight

Use this gate for `frontend-ui` and frontend-oriented `visual-audit` tasks. It fuses NERO-calibrated Impeccable/Taste checks without installing or invoking those external tools.

- The first viewport is the real working interface unless the user explicitly asked for a landing page, cover, or portfolio.
- The design read is clear: page kind, audience, existing assets, quiet constraints, and visual strength.
- The output avoids generic AI patterns: purple-blue gradients, centered template hero, three equal feature cards, card-inside-card, excessive glassmorphism, decorative stock imagery, and default Inter/system typography without intent.
- Dense business workflows preserve filters, labels, source context, units, periods, and data density before visual novelty.
- Loading, empty, error, selected, hover, focus, disabled, and active states are present where the workflow needs them.
- Text does not overflow buttons, tables, sidebars, badges, chart labels, or compact controls at target widths.
- Typography, contrast, touch targets, heading order, responsive collapse, and reduced-motion fallback pass a mechanical review.
- The result still reads as a NERO investment-banking, AI research, or internal analytical tool; it is not pushed toward a marketing or Awwwards style unless explicitly requested.

## Image Report Checks

- Export dimensions are explicit.
- Pixel output exists and is nonzero size.
- Charts are readable at final display size.
- Source notes and metric definitions are visible or otherwise traceable.
- AI-generated backgrounds have clean overlay zones and do not compete with exact text/charts.

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
