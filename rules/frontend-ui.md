# Frontend design methods and requirements

Use the director process and [three-layer contract](core.md). Determine the real user task before choosing a visual direction. The current product's explicit design constraints govern revisions; new work can draw on local and external references.

## Candidate systems and tools

Use the project's existing stack when modifying it. shadcn/ui, Carbon, Ant Design and other available systems are candidates for particular component, data-density or interaction needs, not mandatory visual identities or an instruction to install dependencies. External references can contribute methods from other products or media without becoming runtime dependencies.

Read [reference exploration](reference-exploration.md) for local-first continuity or dual local/web discovery. Inspect actual references before choosing. There is no NERO token quota, mandatory font, palette, card shape, whitespace amount or required house tone.

## Choose a method

- Use M01 in [method cards](design-methods.md) for competing headings, images, data and actions.
- Use M02 for semantic grouping, spacing, desktop layout and task-appropriate density.
- Use M03 for typography roles, language coverage, long labels and source-note legibility.
- Use M04 when combining independently selected components, illustrations or styles.
- Use M05 when candidates are repetitive or repairs stop improving the result.
- Use M06 and [frontend motion](frontend-motion.md) when motion affects feedback, continuity, attention or control.

Cards, gradients, glass, expressive imagery, centered composition and neutral fonts are legitimate choices when they fit the task. Remove or change a treatment when it impairs reading, content, interaction or the intended effect; no generic aesthetic exception approval is needed. Fake statuses and invented functionality remain prohibited by the content contract.

Optional design dials (`DESIGN_VARIANCE`, `MOTION_INTENSITY`, `VISUAL_DENSITY`) may describe a selected direction. Infer them from the brief or preserve explicit user values; do not assign numeric defaults by industry or task label. A dial never waives accessibility, evidence or functionality.

## Conditional profiles

- AI applications, Agent workbenches, tool calling or human confirmation use [AI App UI](ai-app-ui.md), `frontend_profile: ai-app-ui`. Match the product's actual states and controls; do not force a chat layout.
- A self-contained explanation or plan uses [effective HTML](effective-html.md). HTML prototypes and visual variants may use [HTML harness](html-native-harness.md).
- Architecture and meaning-preserving redraw use [architecture/redraw](architecture-diagram-redraw.md).

## Representative trial and rendered review

Before a large set, build the smallest slice that exercises the chosen layout, content density and important states. Store source/asset roles, adjustments and reference previews in the current project style record. Compare alternatives with the same core content and target sizes.

Inspect the actual rendered surface. First identify the largest obstacle to the reading/action goal; change a relevant parameter or arrangement, then compare before/after. Keep strengths and protected manual edits. If the tactic is not improving the result, change the hypothesis or search rather than adding arbitrary decoration.

For a maintained app, a mockup cannot establish live behavior. Check the actual approved desktop surface, declared desktop window sizes, scrolling, controls and data-source identity. If that inspection is unavailable, report the gap and keep rendered/live/human acceptance separate.

## Scope-Aware Workflow Graph Pattern

Use this pattern when an interface renders structured workflow dependencies, `dependsOn`, a governance DAG, or a projection of a runtime state machine.

- Read topology, node identity, scope, verifier state, and edge semantics from the authoritative provider contract. Do not infer dependencies from array order, labels, card positions, or screenshots.
- Use visible group containers only when more than one real scope exists. Name the scope in text; color is reinforcement only.
- Render one ordinary DAG when all nodes share one scope; omit decorative group shells and redundant legends.
- Preserve stable node IDs, status, verifier/gate identity, and cross-scope handoffs.
- Use adaptive wrapping or a readable snake/grid for wide graphs, with stable directional flow.
- Route connectors around cards and containers; avoid ambiguous joins, collisions, and crossings that obscure prerequisites.
- Cycles, rollback, retry, reopen, and OR joins require explicit projection semantics rather than a fabricated forward AND chain.
- Validate mixed-scope and single-scope fixtures, then inspect the installed/live surface at a realistic minimum width.

Handoff: `Graph Read: authority=<source>, projection=<kind>, scopes=<values>, grouping=<mixed-only|none>, compatibility=<stable IDs>, live QA=<surface/viewport>.`

## Functional and evidence checks

- Preserve accurate, readable content and sources. Do not hide essential qualifications, clip table content or silently rewrite frozen wording to fit.
- Check long labels, intentional wrapping, zoom, contrast, heading order, focus visibility and desktop pointer/keyboard targets where applicable.
- Preserve reading and keyboard order when the layout changes; controls and table scrolling must remain usable at target sizes.
- Represent loading, empty, error, selected, disabled, active and other relevant states truthfully. AI state contracts apply only where those states exist.
- Meaningful motion retains necessary feedback, interruption and reduced-motion behavior; inspect real gestures when implemented.
- Keep evidence/units/periods and source paths traceable. A visual pattern or preview is not a source of factual claims.
- Use the selected brand/style contract consistently, including task-specific or external-origin project parameters. Evaluate coherent function and intent, not similarity to an NDT preset.

The first screen should serve the real task: a working surface, explanatory introduction, editorial opening or product presentation as appropriate. Do not replace a requested operational workflow with marketing content.

## Completion

Report the actual outcome and material gaps. Put the reference contribution, inspected previews, trial comparison, selected parameter changes and route-specific checks in the existing project QA record. Only completed observations support rendered, live or human-acceptance claims. No asset/library write is implied by a design review.
