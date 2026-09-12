# HTML Deck Style Discovery Rule

Use this rule for HTML web PPT style exploration, fixed-stage slide prototypes, visual direction previews, and browser-first presentation drafts.

## Fused Reference

- Source: `zarazhangrui/frontend-slides`
- Public snapshot status: not bundled (`not-bundled-snapshots/zarazhangrui__frontend-slides`).
- License status: permissive, but upstream templates and screenshots remain external references.

## Route

- Primary NERO route: `ppt` with subroute `web-ppt-html`.
- Use this rule only for HTML/web PPT discovery and preview.
- If final editable PPTX, Google Slides, board deck, banker deck, or client-deliverable PPTX is required, route back to `formal-pptx` or `template-following`. Resolve new formal PPTX through the current project registry; use Presentations for existing/template work and Google Slides.

## Fixed Stage Standard

- Default slide stage: `1920x1080`.
- Compose the slide as a fixed 16:9 stage and scale the whole stage in the viewport.
- Do not let body cards reflow independently as if this were a dashboard.
- Preserve selectable HTML text for exact titles, figures, sources, and speaker-visible labels.
- Use browser screenshots/contact sheets for QA before treating a deck as ready.

## Style Discovery Workflow

1. Read `web-ppt.md`, `visual-qa.md`, and this rule.
2. Define audience, speaking context, route, deliverable status, and evidence constraints.
3. For important new designs, compare two or three materially different directions using inspected local and online references. In open exploration, include a direction independent of existing presets within the task constraints; do not prescribe a fixed trio.
4. Compare the same 2-3 representative slides across styles.
5. Select one style before full deck production.
6. Archive the selected direction in project-local notes or a NERO case snapshot only after review.

## Use For

- Web PPT / HTML deck style discovery.
- Contact-sheet comparison before making a long deck.
- Fast browser-based talk deck prototypes.
- Screenshot-led or product-demo presentations.
- Translating a visual direction into a later formal PPTX brief.

## Avoid For

- Formal PPTX editing fidelity.
- Template-following from a source PPTX.
- Dense legal, financial, or banker appendices.
- Default public deployment.
- Copying upstream bold templates wholesale.

## Hard Bans

- Do not deploy to Vercel, GitHub Pages, or any public URL by default.
- Do not copy upstream `bold-template` code, screenshots, or template packs as NERO production assets.
- Do not convert exact financial facts into raster images if they need later editing or review.
- Do not use web PPT as a substitute for the current project's selected engine when the required output is a formal editable PPTX.

## QA Gate

- Slide stage is 1920x1080 or explicitly overridden.
- Browser preview opens without a build step when that is the intended delivery.
- Contact sheet shows coherent rhythm and no repeated-density fatigue.
- Text does not overflow at target desktop and presentation sizes.
- Sources, periods, units, and exact numbers remain HTML/PPT text, not generated image text.
