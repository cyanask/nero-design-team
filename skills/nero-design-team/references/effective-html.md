# Effective HTML Rule

Use this rule when NERO Design Team creates or audits self-contained HTML artifacts, SVG-first diagrams, HTML plan pages, visual explainers, lightweight prototypes, or web PPT pages.

This rule fuses `plannotator/effective-html` into NERO Design Team as a reference system. It does not install `effective-html` as an independent default Skill.

## Source Boundary

- Source repository: `https://github.com/plannotator/effective-html`
- Main repository license: MIT
- Bundled `html-effectiveness` examples license: Apache-2.0
- Local snapshot: `$NERO_DESIGN_TEAM_HOME/case-library/snapshots/plannotator__effective-html/snapshot.json`
- Local reference pack: `not-bundled-reference: effective-html`

Use the source as reference only. Build NERO-native HTML/CSS/JS with NERO tokens, NERO brand constraints, and task-specific content.

## When To Use

- Single-file HTML explainers.
- HTML design-review artifacts.
- Architecture, stack, process, and system diagrams.
- HTML plan pages.
- Web PPT pages that need diagram-first explanation.
- Lightweight interactive prototypes that should open without a build step.

## When Not To Use

- Formal editable PPTX.
- Complex enterprise CRUD screens that need a real app architecture.
- Final financial facts, regulatory conclusions, or source notes without evidence review.
- Direct copy of upstream examples, sample data, or copywriting.

## Core Rules

- Prefer self-contained HTML when the deliverable should be shared, opened, or reviewed without a build step.
- Use hand-rolled CSS variables for tokens instead of hard-coded one-off colors.
- Include light/dark theme support only when it improves review or presentation; it must not add clutter.
- If dark mode is included, use an apply-before-paint script in `<head>` and persist the user choice safely.
- For diagrams, simplify the system into a visual model first; avoid prose-heavy panels.
- Use SVG for geometry, flows, architecture, and spatial relationships when it improves comprehension.
- Style SVG through CSS variables/classes where feasible so the diagram follows theme and token changes.
- Keep exact labels, figures, source notes, and conclusions as verified HTML text.
- Do not use AI-generated images to carry exact labels, financial numbers, or architecture facts.

## NERO Adaptation

- NERO tokens override upstream palettes and typography.
- NERO information density overrides decorative minimalism when the artifact is for analysts, bankers, or internal workflows.
- NERO web PPT rules override upstream deck style when the artifact is a deck.
- NERO frontend UI rules override upstream single-file examples when the artifact is a reusable app surface.
- NERO visual QA remains the final gate.

## QA Checklist

- Artifact opens as a standalone HTML file when that is the intended format.
- No build-only dependency is introduced unless the target project already requires one.
- The first viewport communicates the actual artifact, not a marketing hero.
- Light/dark mode, if present, uses CSS variables and does not flash incorrectly before paint.
- SVG diagrams do not rely on hard-coded colors that break dark mode.
- SVG labels, HTML labels, and chart labels are readable at target display size.
- Text does not overflow in cards, chips, nodes, sidebars, buttons, or slide frames.
- Diagrams reduce complexity instead of duplicating every implementation detail.
- Sample data, placeholder copy, or upstream brand language is removed.
- Exact business facts, figures, and regulatory wording are verified outside the visual reference.
