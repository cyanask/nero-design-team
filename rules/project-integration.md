# Project Integration Rule

Use this rule when an existing project needs to use NERO Design Team as a background design system.

## Positioning

`$NERO_DESIGN_TEAM_HOME/` is the central design system. It owns rules, tokens, templates, brand assets, case snapshots, scripts, validators, and MCP-lite.

It must not become the working directory for every real project. Project-specific source files, generated images, PPTX files, screenshots, video frames, and delivery exports should remain inside the target project.

## Project Contract

Each integrated project may create:

```text
<project>/
  .nero-design/
    manifest.json
  design-output/
  exports/
  screenshots/
```

The project manifest records:

- route: `frontend-ui`, `image-report`, `ppt`, `short-video`, or `ai-image-generation`
- template used or intended
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

## Boundary Rules

- Keep generated project artifacts in the project directory.
- Keep reusable system rules, tokens, and templates in `design-team/`.
- Do not move client data, project evidence, or final delivery packages into `design-team/`.
- Do not copy restricted external assets into client-facing deliverables without license review.
- Mature outputs can be summarized into `case-library/` as lightweight snapshots.
- Reusable patterns can be promoted back to `templates/`, `rules/`, or `tokens/` only after review.

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
