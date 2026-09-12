# Project delivery

The NDT root is `$NERO_DESIGN_TEAM_HOME/`. Reuse its `tokens/`, `brand/`, `templates/`, `case-library/`, `scorecards/` and `scripts/` through their registered paths.

## New and existing projects

Read [project integration](project-integration.md) when the project is adopting NDT; read [generator](generator.md) only when a starter or integration manifest is needed. Inspect the current project manifest before creating one.

- Project data, work, screenshots and exports stay in that project.
- NDT owns `.nero-design/manifest.json`. The caller owns any cross-system `control/production-ledger.json`; standalone work does not require that ledger.
- Record the route, selected profile, materially used resources and QA evidence. AI App UI additionally binds its design intent, state catalog and scorecard.
- Promote reusable patterns only through authorized library maintenance. Do not move client evidence or final project files into the central library.

## Tokens and assets

Use the current token outputs under `build/css/`, `build/tailwind/` and `build/themes/`. Rebuild only when the task needs missing or stale outputs; never hand-edit generated token files.

Use [brand guidance](brand-system.md) to separate selected identity requirements from candidates, and the live Registry for asset availability, placeholders and quarantine. Template choices come from `generators/templates.json`; a starter is not a rendered or accepted artifact.

Use [visual QA](visual-qa.md), [scoring](visual-score.md) and [stage checks](production-check.md) only at their applicable task stages. Shared source/version/license metadata belongs in the Registry and project-local review records.
