# NDT Figure Compiler preset

This preset adds a source-free Figure Spec, focused QA notes, and a thin project-local wrapper. It does not copy the compiler runtime or layout logic into the generated project.

## Start

Set the canonical NERO Design Team root, then validate or compile the sample:

```sh
export NERO_DESIGN_TEAM_HOME="/path/to/design-team"
node compile-report-figure.mjs validate --spec figure-spec.example.json
node compile-report-figure.mjs compile --spec figure-spec.example.json --out exports/sample-flow.svg
```

Alternatively pass the root explicitly:

```sh
node compile-report-figure.mjs --ndt-root /path/to/design-team list
```

The wrapper forwards arguments to `scripts/report-figure-compiler.mjs`. Supported public commands are `list`, `validate --spec`, and `compile --spec --out [--profile] [--renderer] [--receipt]`.

The v0.2 Figure Spec contract supports nine figure types: `flow`, `hierarchy`, `timeline`, `funnel`, `bar`, `line`, `participant_map`, `matrix`, and `value_chain`. `flow` nodes stay in display order and require exactly one adjacent `from`/`to` edge between each pair; flow edges do not carry extra labels. Quantitative figures must keep period, unit, denominator, and source scope explicit where the type contract requires them.

When the user starts from natural language, call NDT routing first. `nero_design_route` returns a structured `figure_compiler` decision with the selected business family, figure type, profile, renderer, missing inputs, and tool. The project-local CLI wrapper remains an internal execution surface; users do not need to choose it directly.

## Boundaries

- The example is synthetic and carries no project evidence or client facts.
- Replace the example source label and optional locator with project-local, verified evidence before formal use.
- Keep the Figure Spec, output, and receipt in the target project.
- Reports, Word/PDF, and diligence default to `report-a4`; WeChat/公众号 defaults to `wechat-inline`; PPT/slide defaults to `ppt-16x9`.
- Report and WeChat routes default to `raster-canvas-png`; PPT defaults to `vector-svg`.
- `office-native` is a handoff capability, not a compiler renderer. Explicit editable/native requests must be handed to the Office production owner instead of invoking the compiler.
- Covers, photography, illustration, backgrounds, and concept visuals route to `ai-image-generation`, not Figure Compiler.
- Do not copy or fork the central runtime into the project.
