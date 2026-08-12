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

## Router Model

Choose the route from the intended artifact and its operating boundary, not
from the presence of the word `HTML` alone.

1. Identify the primary artifact: standalone explainer, SVG-first diagram,
   visual plan, web-PPT page, lightweight prototype, maintained app surface,
   or formal Office output.
2. Decide whether one file can preserve the required behavior, evidence text,
   accessibility, and review context without a build step.
3. Apply one route outcome:
   - `use_effective_html`: self-contained HTML is the primary deliverable and
     Effective HTML materially improves its structure or diagram grammar.
   - `partial_reference_only`: reuse only a diagram, token, or review pattern;
     the maintained app, web-PPT, or target project remains the primary route.
   - `do_not_use_effective_html`: formal editable Office output, a real app
     architecture, or a non-HTML artifact should use its native route.
4. Record the primary artifact, verified inputs, placeholders, forbidden uses,
   required QA gates, and the next NDT prompt or route. A route outcome is a
   recommendation, not permission to publish, deploy, or replace evidence.

Route selection must remain deterministic for the same task contract. Do not
change route because an upstream example looks attractive or because a single
file is easier to generate.

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

## Additional Default Bans

- Do not turn an explainer, plan, architecture map, or review artifact into a
  marketing landing page unless that is the requested deliverable.
- Do not add fake browser chrome, terminals, logs, status badges, version
  labels, metrics, controls, or interactions that are not part of the content
  contract.
- Do not use a framework, CDN, remote font, remote script, or build-only asset
  in an artifact promised to be self-contained.
- Do not use canvas or raster screenshots for relationships that need readable,
  selectable, theme-aware SVG or HTML labels.
- Do not hide critical facts, sources, controls, or navigation behind hover,
  animation, color alone, or a pointer-only interaction.
- Do not put design rationale, implementation notes, prompt residue, internal
  paths, or upstream attribution boilerplate into the visible artifact unless
  the requested review surface requires it.
- Do not use dark mode, animation, decorative grids, glow, glass, or node
  networks as automatic signals of technical sophistication. They must pass
  the frontend exception gate and improve the actual explanation.

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
- Local asset, font, script, stylesheet, and link references resolve; a
  self-contained artifact makes no unintended network request.
- The browser console has no uncaught errors, missing-asset failures, or broken
  theme initialization on first paint.
- Semantic heading order, landmark structure, keyboard access, focus states,
  and accessible names exist where the artifact is interactive.
- SVG diagrams expose readable text and, when the graphic needs a standalone
  accessible name, an appropriate title or description.
- Critical content remains available with JavaScript disabled when the stated
  artifact contract is primarily explanatory rather than application-like.
- Meaningful motion respects reduced-motion preferences and does not gate
  navigation, reading, or evidence access.
- Desktop and narrow-width layouts preserve reading order, source proximity,
  and connector meaning; projector or print views are checked when those are
  named delivery contexts.
- Facts, assumptions, placeholders, and source notes remain distinguishable in
  both light and dark themes.
- The recorded route outcome still matches the final artifact; an exploration
  page is not reported as a maintained app, formal deck, or published surface.
