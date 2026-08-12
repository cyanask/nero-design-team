# HTML Deck Style Discovery Rule

Use this rule for HTML web-PPT style exploration, fixed-stage slide prototypes, visual-direction previews, and browser-first presentation drafts.

## Fused Reference

- Source: `zarazhangrui/frontend-slides`.
- Public snapshot: `not-bundled-snapshots/zarazhangrui__frontend-slides`.
- License status: permissive; upstream templates and screenshots remain external references.

## Route

- Primary route: `ppt`, subroute `web-ppt-html`.
- Use only for HTML/web-PPT discovery and preview.
- Formal editable PPTX, Google Slides, board, banker, or client-deliverable PPTX returns to `formal-pptx` or `template-following` and Presentations.

## Fixed Stage Standard

- Default to `1920x1080` and scale the whole 16:9 stage in the viewport.
- Do not independently reflow body cards as a dashboard.
- Preserve selectable HTML text for exact titles, figures, sources, and visible labels.
- Use browser screenshots and contact sheets before treating a deck as ready.

## Style Discovery Workflow

1. Read `web-ppt.md`, `visual-qa.md`, and this rule.
2. Define audience, speaking context, route, delivery state, and evidence constraints.
3. When style is unlocked, compare at most three directions: `banker-swiss`, `editorial-research`, and `technical-product`.
4. Use the same two or three representative slides across directions.
5. Lock one style before full production.
6. Archive the direction only after review and within the approved project-local or case-snapshot boundary.

## Use For

- Web-PPT style discovery and contact-sheet comparisons.
- Fast browser talk-deck prototypes.
- Screenshot-led/product-demo presentations.
- A visual direction brief for later formal PPTX.

## Avoid For

- Formal PPTX editing fidelity or source-template following.
- Dense legal, financial, or banker appendices.
- Default public deployment.
- Wholesale copying of upstream templates.

## Hard Bans

- Do not deploy by default.
- Do not copy upstream code, screenshots, or template packs as NERO assets.
- Do not rasterize exact financial facts that need editing or review.
- Do not substitute web-PPT for Presentations when editable PPTX is required.

## QA Gate

- Stage is 1920x1080 or explicitly overridden.
- Intended no-build browser preview opens.
- Contact sheet has coherent rhythm without repeated-density fatigue.
- Text does not overflow at target sizes.
- Sources, periods, units, and exact numbers remain text layers, not generated-image text.
