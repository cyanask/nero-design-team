# Web PPT Rule

Use this rule for horizontal swipe HTML decks, magazine-style web PPT, Swiss-style web PPT, demo-day decks, internal talks, product/story decks, share decks, screenshot-led talks, and HTML contact-sheet visual drafts.

This rule fuses the useful parts of `op7418/guizang-ppt-skill` into NERO Design Team as NERO-calibrated rules. It does not make Guizang templates, scripts, or assets the default NERO production path.

It can also use `plannotator/effective-html` as a reference for self-contained HTML artifacts, SVG-first architecture diagrams, theme-aware CSS variables, and pragmatic HTML plan pages. Effective HTML is a reference layer, not an independent default Skill.

It can also use `zarazhangrui/frontend-slides` as a reference for fixed 1920x1080 HTML stages, three-direction style previews, and style-discovery contact sheets. Frontend Slides is a reference layer, not a deployment or template-copy path.

It can use `alchaincyf/huashu-design` as a reference for HTML-native design variants and brand-asset protocol. Huashu is a harness reference, not a source of default audio, watermarks, upstream assets, or provider configuration.

## Routing

- Use `web-ppt-html` when the user asks for HTML PPT, web deck, horizontal swipe deck, magazine PPT, Swiss style, share/demo talk deck, or strong visual speaking deck.
- Do not use this route for formal banker PPTX, template-following PPTX, dense appendix, or decks that require collaborative PowerPoint editing.
- If the user needs final editable PPTX, route to `formal-pptx` or `template-following` instead.

## Style Choices

- `editorial-magazine`: serif-led titles, editorial rhythm, image grids, warm or ink-like tone. Best for industry observation, founder story, humanistic narrative, launch story, and image-led talks.
- `swiss-data`: sans-serif, strict grid, high contrast, large numbers, disciplined color accents. Best for AI/product/engineering/data talks, annual summaries, system diagrams, KPI pages, and evidence walls.
- `effective-html-diagram`: self-contained HTML stage with SVG-first architecture or process diagram, light prose, and theme-aware CSS variables. Best for system architecture, product stack, roadmap logic, and technical explanation pages inside a web deck.
- `style-discovery-contact-sheet`: fixed-stage 1920x1080 preview set comparing 2-3 NERO-native directions before deck production. Best when the user cannot yet choose a visual style.
- Pick one style per deck. Do not mix class systems, typography systems, or theme logic across styles.

## Style Discovery

Use `html-deck-style-discovery.md` when a web PPT needs direction selection before full production.

- Generate at most three representative directions.
- Use the same content skeleton across directions.
- Compare contact sheets before writing the full deck.
- Do not deploy previews publicly by default.
- Do not copy upstream bold templates; rebuild the chosen direction with NERO tokens.

## Guizang Refresh v1.4

NERO can reference the refreshed Guizang system for:

- locked Swiss-style body layouts
- screenshot beautification and ratio adaptation
- local screenshot background assets
- image slot planning before generation
- HTML deck QA checks
- map/location relationship slides
- gpt-image-2 visual brief discipline for deck素材

Reference repository:

`https://github.com/op7418/guizang-ppt-skill`

Local restricted asset pack:

`$NERO_DESIGN_TEAM_HOME/assets/external/guizang-ppt-skill/`

License boundary:

- Upstream license: `AGPL-3.0`.
- Asset pack status: `restricted-reference`.
- Do not treat upstream templates, scripts, or downloaded visuals as NERO-owned assets.
- Do not use these assets in client-facing or public deliverables without a separate license decision.
- For normal NERO production, extract design rules and build NERO-native HTML/CSS instead of copying upstream templates.

## Required Planning

- Confirm style, audience, speaking context, duration, source material, image/screenshot needs, theme constraints, and hard content requirements when they affect structure.
- If the user only has a topic, propose a narrative arc: hook, context, core argument, shift, takeaway.
- If style is not locked, run a fixed-stage style-discovery pass before production.
- Plan slide rhythm before writing HTML: cover, section dividers, dense proof pages, image pages, data hero pages, and closing.
- Every slide section must declare a theme state such as light, dark, hero light, or hero dark.
- Avoid more than three consecutive pages with the same visual density or theme.
- For substantial Swiss-style decks, draft a page map before HTML:
  `page -> data-layout -> reason -> image_slot -> evidence/source note`.

## Screenshot And Image Handling

- Ask for screenshot purpose when relevant: faithful display, beautified screenshot, redesigned concept, or UI context image.
- Preserve exact screenshot text/data when the screenshot is evidence or product proof.
- Use generated visuals only for background, concept, or non-evidence imagery.
- Put exact labels, figures, tables, and conclusions in HTML/CSS/JS, not in generated images.
- Image filenames should be stable and semantic when a real project is created.
- Programmatic screenshot adaptation is the default for real screenshots: create a target-ratio canvas, use quiet background, scale the screenshot proportionally, preserve text, and do not redraw unless the original is unusable.
- gpt-image-2 can redesign a screenshot only when the goal is concept illustration, UI context, or non-evidence visual storytelling. It cannot carry final text, financial numbers, chart labels, or regulatory conclusions.
- For architecture or process visuals, prefer SVG/HTML labels over raster images when exact wording, arrows, or interaction sequence matters.
- Decide the image slot before generating or adapting an image. Common slots: `s22-hero-21x9`, `s15-grid-21x9`, `s16-brief-21x9`, `frame-16x10`, `frame-4x3`.
- Same image group means same ratio, same visual scale, same edge treatment, and same background intensity.

## Swiss Locked Mode

Use this only when `style = swiss-data`.

- Body slides must use registered Swiss body layouts `S01` to `S22`.
- New cover and closing slides can use NERO-native cover/closing systems, but they must not invent a new body slide family.
- Each slide section must include `data-layout="Sxx"` or an explicit cover/closing id.
- Do not invent `P23`, `P24`, `Swiss Image Split`, `Swiss Evidence Grid`, or ad hoc evidence-wall structures.
- Single large image: use S22-style 21:9 hero strip.
- Multiple images: adapt S15/S16 matrix/card skeletons.
- Geography, location, route, or relationship map: use `S08 + Swiss Map Component` logic. Keep `data-layout="S08"`, use HTML markers/cards, and keep static fallback.
- SVG may draw geometry, lines, circles, arrows, or paths only. Visible labels must be HTML, not `<text>` inside SVG.
- Top Chinese titles are left/top aligned except statement/split layouts. Do not center body-slide headings.
- Swiss text must stay readable for projection: body >= 18px, card/caption/timeline labels >= 16px, meta labels >= 14px.
- Use the Swiss weight ladder: larger type can be lighter, small text must be heavier. Do not use 300-weight small Chinese text.

## Local Asset Pack

Use the local asset pack only after checking `manifest.json` and `usage.md`.

Recommended internal uses:

- quick screenshot background experiments
- private draft decks
- visual direction comparison
- gpt-image-2 brief references
- regression examples for NERO-native web PPT templates

Not allowed by default:

- public/client deliverables
- NERO brand master assets
- direct template transplant
- direct script transplant
- claiming these assets are original NERO assets

## HTML Deck QA

- No placeholder title, `[必填]`, sample conclusion, or fake data remains.
- All slide classes used by generated sections exist in the chosen template or local CSS.
- Typography, spacing, and theme rhythm are consistent.
- Text does not overflow at desktop and mobile preview sizes where applicable.
- Images are not stretched, blurred, or cropped in a way that blocks inspection.
- Navigation works with keyboard and touch where the deck provides it.
- Browser screenshot/contact-sheet review passes before final delivery.
- Self-contained HTML pages open without a build step when that is the intended delivery mode.
- Dark mode, if included, uses CSS variables and does not break SVG/text contrast.
- For Swiss-style decks, run:
  `node scripts/validate-web-ppt.mjs <index.html> --mode swiss`
- Required Swiss checks:
  - all body slides declare registered layout ids
  - local images declare image slots
  - S22 hero images use `s22-hero-21x9`
  - no visible SVG text
  - no placeholder text
  - no forbidden experimental layout names
  - no `object-position:top center` on S22 photo slots

## Boundaries

- Do not copy Guizang full templates into NERO by default.
- Use old Guizang Skill only as a read-only reference if NERO rules are insufficient or the user explicitly names it.
- Do not call external image APIs or write keys. If gpt-image-2 is used, prepare a NERO brief and composite exact text later.
- Do not enable TTS, copy audio/video assets, add watermarks, or deploy public web decks by default.
- AGPL source assets are restricted references. For public or client-facing work, rebuild visuals through NERO tokens, user-owned素材, or gpt-image-2 briefs with exact text layered in HTML.

## Fixed Stage And HTML Texture Addendum

- For projection-oriented HTML decks, use a fixed 16:9 stage and scale the entire stage inside the viewport. Do not rely on responsive reflow for slide composition.
- Keep interactive HTML behavior: navigation, selectable text, accessible source notes, and CSS-rendered typography should remain live. Avoid turning pages into flat screenshot images.
- Strengthen HTML texture with subtle layered backgrounds, low-opacity grid/rule systems, hover-safe navigation, and crisp CSS shadows or borders; do not add decorative effects that compete with evidence.
- For chapter divider pages, place text in the left two-thirds safe zone and background pattern or image in the right third. Do not place vertical divider lines over the visual zone.
- Cover pages may use stronger bitmap presence, but exact title, date, logo, source, and all business conclusions must remain HTML/CSS layers.
- Run a title-wrap pass for Chinese deck titles: no line should contain a single trailing Chinese character unless deliberately designed as a typographic device.
