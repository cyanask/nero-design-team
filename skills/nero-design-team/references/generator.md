# Generator Rule

Use this rule when starting a new frontend UI, image report, PPTX deck, short-video, or gpt-image-2 brief project from NERO Design Team templates.

For existing projects that only need NERO Design Team as a background design system, use `project-integration.md` first.

## Command

List available routes:

`node $NERO_DESIGN_TEAM_HOME/scripts/nero-design.mjs list`

Create a project:

`node $NERO_DESIGN_TEAM_HOME/scripts/nero-design.mjs new <route> --name <project-name> --out <target-parent-dir>`

Create an AI image brief with a registered preset:

`node $NERO_DESIGN_TEAM_HOME/scripts/nero-design.mjs new ai-image-generation --preset 留白杂志风 --name <project-name> --out <target-parent-dir>`

The legacy `--preset minimal-zine-editorial` form remains supported and resolves to the same canonical preset.

`photo-derived-editorial-diptych` is a method-only style/QA contract in the public package, not a bundled generator preset. Do not pass it to `nero-design new --preset`; read `photo-derived-editorial-diptych.md` and keep user photos and project composites project-local.

Initialize an existing project without copying a template:

`node $NERO_DESIGN_TEAM_HOME/scripts/nero-design.mjs init <route> --project-root <existing-project-dir>`

Supported routes:

- `frontend-ui`
- `image-report`
- `ppt`
- `short-video`
- `ai-image-generation`

## Behavior

- Builds NERO tokens before copying a template.
- Copies one local template into a new project directory.
- Applies a registered route preset when `--preset` is supplied and records it in `.nero-design/manifest.json`.
- Copies current token theme assets into the generated project's `theme/` directory.
- Localizes template imports so generated projects reference their own `theme/` files.
- Creates `.nero-design/manifest.json`.
- Creates project-local `design-output/`, `exports/`, and `screenshots/` directories.
- Refuses to overwrite an existing target directory.
- Refuses to overwrite an existing `.nero-design/manifest.json`.
- Refuses unknown presets or presets registered for another route.
- Does not install dependencies globally or automatically.

## Handoff

After generation:

- Install only the local dependencies needed by that template.
- Replace sample data and placeholder conclusions.
- Apply brand-system, visual-qa, and visual-score rules before final delivery.
- Keep project deliverables in the project directory; promote only reusable patterns back to NERO Design Team.
