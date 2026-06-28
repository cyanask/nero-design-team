# Effective HTML Rule

Use this rule when NERO Design Team creates or audits self-contained HTML
artifacts, SVG-first diagrams, HTML plan pages, visual explainers, lightweight
prototypes, or web PPT pages.

This rule fuses `plannotator/effective-html` into NERO Design Team as a
reference system. It does not install `effective-html` as an independent
default Skill.

## Source Boundary

- Source repository: `https://github.com/plannotator/effective-html`
- Reviewed remote HEAD: `50260e15d9a0d1b8522f0625694718d735bf31ab`
- Reviewed remote push date: `2026-06-19`
- Release/tag status: no releases or tags observed during review
- Upstream shape: `html`, `html-diagram`, and `html-plan` remain separate
  skills
- Upstream signal: PR #6 proposes a single `effective-html` router; use this
  as a design signal only, not as copied implementation
- Main repository license: MIT
- Bundled `html-effectiveness` examples license: Apache-2.0
- Local snapshot: `$NERO_DESIGN_TEAM_HOME/case-library/snapshots/plannotator__effective-html/snapshot.json`
- Local reference pack: `$NERO_DESIGN_TEAM_HOME/assets/external/effective-html/manifest.json`
- Local prompt pack: `$NERO_DESIGN_TEAM_HOME/prompts/effective-html/`

Use the source as reference only. Build NERO-native HTML/CSS/JS with NERO
tokens, NERO brand constraints, and task-specific content.

## Router Model

NERO Design Team remains the only entrypoint. When an artifact may benefit from
effective-html, first use the local router prompt:

`$NERO_DESIGN_TEAM_HOME/prompts/effective-html/router.md`

Valid outcomes:

- `use_effective_html`: use as a fused reference for this artifact.
- `partial_reference_only`: consult only a narrow pattern such as SVG or dark
  mode.
- `do_not_use_effective_html`: use another NERO route.

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
- Final financial facts, regulatory conclusions, or source notes without
  evidence review.
- Word, Excel, database, evidence-store, or inquiry-response tasks where visual
  HTML is not the primary deliverable.
- Direct copy of upstream examples, sample data, or copywriting.
- Any flow that installs upstream `effective-html` as a standalone default
  Skill.

## Core Rules

- Prefer self-contained HTML when the deliverable should be shared, opened, or
  reviewed without a build step.
- Use hand-rolled CSS variables for tokens instead of hard-coded one-off colors.
- Include light/dark theme support only when it improves review or presentation;
  it must not add clutter.
- If dark mode is included, use an apply-before-paint script in `<head>` and
  persist the user choice safely.
- For diagrams, simplify the system into a visual model first; avoid prose-heavy
  panels.
- Use SVG for geometry, flows, architecture, and spatial relationships when it
  improves comprehension.
- Style SVG through CSS variables/classes where feasible so the diagram follows
  theme and token changes.
- Keep exact labels, figures, source notes, and conclusions as verified HTML
  text.
- Do not use AI-generated images to carry exact labels, financial numbers, or
  architecture facts.

## NERO Adaptation

- NERO tokens override upstream palettes and typography.
- NERO information density overrides decorative minimalism when the artifact is
  for analysts, bankers, or internal workflows.
- NERO web PPT rules override upstream deck style when the artifact is a deck.
- NERO frontend UI rules override upstream single-file examples when the
  artifact is a reusable app surface.
- NERO visual QA remains the final gate.

## Prompt Pack

Use these prompts for controlled execution:

- `router.md`: route selection.
- `refresh.md`: read-only reference-pack delta check.
- `pattern-extraction.md`: abstract reusable patterns without copying content.
- `nero-adapter.md`: convert patterns into NERO-native rules.
- `html-artifact.md`: build standalone HTML artifacts.
- `svg-diagram.md`: build SVG-first diagrams.
- `visual-plan.md`: build HTML plan pages.
- `qa.md`: review effective-html-influenced artifacts.
- `production-check.md`: pre-publication/client-delivery check.
- `sedimentation.md`: extract reusable rules after a project.

## QA Checklist

- Artifact opens as a standalone HTML file when that is the intended format.
- No build-only dependency is introduced unless the target project already
  requires one.
- The first viewport communicates the actual artifact, not a marketing hero.
- Light/dark mode, if present, uses CSS variables and does not flash
  incorrectly before paint.
- SVG diagrams do not rely on hard-coded colors that break dark mode.
- SVG labels, HTML labels, node labels, flow captions, and chart labels are
  readable at target display size.
- Text does not overflow in cards, chips, nodes, sidebars, buttons, or slide
  frames.
- Diagrams reduce complexity instead of duplicating every implementation detail.
- Sample data, placeholder copy, upstream product names, and upstream visual
  identity are removed.
- Exact business facts, figures, source notes, and regulatory wording are
  verified outside the visual reference.
