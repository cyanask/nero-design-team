# Project Integration Rule

Use this rule when an existing project needs to use NERO Design Team as a background design system.

## Positioning

`$NERO_DESIGN_TEAM_HOME/` is the central design system. It owns rules, tokens, templates, brand assets, case snapshots, scripts, validators, and MCP-lite.

It must not become the working directory for every real project. Project-specific source files, generated images, PPTX files, screenshots, video frames, and delivery exports should remain inside the target project.

## Project Contract

Each integrated project may create:

```text
<project>/
  control/
    production-ledger.json
  .nero-design/
    manifest.json
  design-output/
  exports/
  screenshots/
```

`control/production-ledger.json` is optional for standalone design work and required for GPT Work cross-system production. GPT Work owns it. NERO Design Team may read it for current gate and artifact references, but it must not become a second workflow controller.

The project manifest records:

- route: `frontend-ui`, `image-report`, `ppt`, `short-video`, or `ai-image-generation`
- template used or intended
- selected frontend profile when the route is `frontend-ui`; `ai-app-ui`
  additionally records the NDT rule, design-intent schema, state catalog and
  route-specific scorecard paths
- NERO Design Team root and version
- token build outputs used
- brand assets referenced
- case references consulted
- local output, export, and screenshot paths
- visual QA, visual score, and production-check manifests
- gpt-image-2 usage and boundaries

## Commands

Initialize an existing project:

`node $NERO_DESIGN_TEAM_HOME/scripts/nero-design.mjs init <route> --project-root <existing-project-dir>`

Generate a new local project from a NERO template:

`node $NERO_DESIGN_TEAM_HOME/scripts/nero-design.mjs new <route> --name <project-name> --out <target-parent-dir>`

Both commands create `.nero-design/manifest.json` in the project directory.

NERO Design Team is the exclusive writer of `.nero-design/manifest.json`. KAT and other backend systems may record its expected path but must not create, overwrite, or maintain it.

## Boundary Rules

- GPT Work is the only cross-system controller; NERO Design Team controls the visual route only.
- Route through the NERO Design Team Skill before using MCP-lite or local scripts.
- NERO Design Team must return control to GPT Work after visual generation, QA, score, or production-check instead of calling KAT or a downstream PPTX engine directly.
- Treat `control/production-ledger.json` as GPT Work owned and `.nero-design/manifest.json` as NERO Design Team owned. Neither file replaces the other.
- Keep generated project artifacts in the project directory.
- Keep reusable system rules, tokens, and templates in `design-team/`.
- Do not move client data, project evidence, or final delivery packages into `design-team/`.
- Do not copy restricted external assets into client-facing deliverables without license review.
- Mature outputs can be summarized into `case-library/` as lightweight snapshots.
- Reusable patterns can be promoted back to `templates/`, the upstream Skill references, or `tokens/` only after review; `rules/` is a generated compatibility view.
- For `frontend_profile: ai-app-ui`, a generated project manifest or static
  template proves design-system binding only. Record rendered QA, live behavior
  and human acceptance separately.

## Completion Report

When using this rule, report:

- project path
- route
- template
- manifest path
- whether tokens and brand assets were referenced
- where outputs should be written
- whether QA, visual score, or production-check ran
- whether any pattern should be promoted back to the central design system
- next owner returned to GPT Work
