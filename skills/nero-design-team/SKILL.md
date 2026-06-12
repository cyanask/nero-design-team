---
name: nero-design-team
description: Use whenever NERO mentions "设计团队", "NERO Design Team", or "NERO design team" in a design-related request, and when creating, revising, generating, scoring, production-checking, case-library referencing, or auditing frontend UI, image-style research reports, PPT/PPTX decks, web PPT/HTML decks, short videos, or AI-generated visual素材 for NERO. Routes design work through NERO brand assets, design tokens, project generators, case library, export validation, shadcn/ui, Carbon, Ant Design, ECharts/G2, Satori/Sharp, Presentations, legacy PptxGenJS, Slidev, Remotion, fused PPT business-design/web-PPT rules, gpt-image-2 briefs, visual QA, visual scoring, and production checks with professional investment-banking and AI-industry standards.
---

# NERO Design Team

## Trigger

When NERO says `设计团队` in any project and the task involves UI, images, reports, PPT, web PPT, video, visual style, design review, layout, visual QA, or visual generation, treat it as a request to use NERO Design Team.

Do not require NERO to say the full phrase `NERO Design Team`, `nero-design-team`, `.nero-design`, or `manifest`. Those are implementation details.

Examples:

- `让设计团队看看这个界面`
- `用设计团队做一版 PPT`
- `设计团队帮我把这个长图做高级一点`
- `这个项目后续都按设计团队的标准来`

Use this skill for design work that must be professional, dense, verifiable, and reusable across:

- frontend UI and dashboards
- image-style research reports and long images
- PPT/PPTX decks and web PPT/HTML decks
- short videos or animated data explainers
- AI-generated cover/background/concept visuals
- reusable brand-system and template-generated projects
- project-local integration with NERO Design Team as background design-system support
- visual scoring and readiness review
- case-library references and production checks

## First Step

Classify the task before designing:

1. `frontend-ui`
2. `image-report`
3. `ppt`
4. `short-video`
5. `ai-image-generation`
6. `new-project`
7. `project-integration`
8. `case-library`
9. `visual-audit`
10. `visual-score`
11. `production-check`

If the task mixes formats, choose the primary deliverable first and reuse assets across formats.

## Routing

- If `nero-design-team-mcp-lite` tools are available in the current Codex session, prefer them for structured reads and script execution:
  - `nero_design_route`
  - `nero_design_get_tokens`
  - `nero_design_list_templates`
  - `nero_design_get_case_snapshot`
  - `nero_design_import_github_case`
  - `nero_design_build_tokens`
  - `nero_design_generate_project`
  - `nero_design_visual_qa`
  - `nero_design_score`
  - `nero_design_production_check`
- If MCP-lite is unavailable or not registered, fall back to the local files and scripts listed below.
- For new artifacts or brand/style refreshes: read `references/brand-system.md`.
- `frontend-ui`: read `references/frontend-ui.md`; also read `references/effective-html.md` when the deliverable is a self-contained HTML explainer, architecture diagram, visual plan, design-review page, or single-file prototype. This route includes fused Impeccable/Taste frontend taste rules for design read, anti-slop checks, deterministic UI review, and final polish.
- `image-report`: read `references/image-report.md`.
- `ppt`: read `references/ppt.md`, then read `references/ppt-business-design.md` for formal/business decks or audits, `references/web-ppt.md` for HTML/web PPT decks, and `references/effective-html.md` when the deck needs a self-contained HTML diagram or visual plan page.
- `short-video`: read `references/short-video.md`.
- `ai-image-generation`: read `references/ai-image-generation.md`.
- `new-project`: read `references/generator.md`.
- `project-integration`: read `references/project-integration.md`, then `references/generator.md` only if a manifest must be created.
- `case-library`: read `references/case-library.md`.
- `visual-score`: read `references/visual-score.md`.
- `production-check`: read `references/production-check.md`.
- Always read `references/visual-qa.md` before finalizing design work.
- Read `references/repo-registry.md` when deciding which external repository or design system should influence the task.
- Build or load NERO tokens before detailed styling when using local templates.

## Frontend Taste Fusion

NERO Design Team is the default frontend design-quality entrypoint and controller.

`pbakaus/impeccable` and `Leonxlnx/taste-skill` are fused references for `frontend-ui` and `visual-audit`. They are not independent default entrypoints, and their npm packages, skills, hooks, live mode, and command systems must not be installed or enabled by default.

`plannotator/effective-html` is a fused reference for self-contained HTML artifacts, SVG-first architecture diagrams, and visual plan pages. It is not an independent default entrypoint and must not be installed as a standalone Skill by default.

Use the fused rules only as NERO-calibrated design guidance:

- Start with NERO audience, evidence hierarchy, data density, and brand tokens.
- Use Taste-style design read before styling: page type, audience, brand assets, regulatory or business constraints, and desired visual strength.
- Use Impeccable-style deterministic review before finalizing: typography hierarchy, contrast, overflow, touch targets, headings, responsive behavior, motion fallback, and obvious AI-default patterns.
- Preserve professional work-tool readability over novelty. Do not push dashboards, disclosure tools, financial analysis screens, or internal workflows toward marketing-site or Awwwards-style aesthetics unless NERO explicitly asks for that direction.
- Report `fused_reference_skills: impeccable, taste-skill` when these rules materially influenced a frontend UI or visual-audit result.
- Report `fused_reference_skills: effective-html` when the local effective-html snapshot or reference pack materially influenced a self-contained HTML artifact, visual plan, or architecture diagram.

Effective HTML local references:

- Source repo: `https://github.com/plannotator/effective-html`
- License: MIT for the main repo; Apache-2.0 for bundled `html-effectiveness` examples.
- Local snapshot: `$NERO_DESIGN_TEAM_HOME/case-library/snapshots/plannotator__effective-html/snapshot.json`
- Local reference pack: `not-bundled-reference: effective-html`
- Use as reference only. Build NERO-native HTML/CSS/JS with NERO tokens and verified task content.

## PPT Fusion

NERO Design Team is the default PPT entrypoint and controller.

PPT subroutes:

1. `formal-pptx`: formal editable banker, research, investor, strategy, product, or board PPTX. Default to the Presentations plugin and artifact-tool.
2. `template-following`: source/template PPTX, same-layout, follow-this, corporate template, or source-deck work. Use the Presentations template-following path.
3. `ppt-design-audit`: design diagnosis, visual upgrade, commercial deck critique, and quality gates. Use fused NERO rules from `ppt-business-design.md`.
4. `web-ppt-html`: horizontal swipe HTML deck, magazine-style PPT, Swiss-style PPT, demo/share/web deck. Use fused NERO rules from `web-ppt.md`, including the v1.4 Guizang Refresh rules for Swiss locked layouts, screenshot handling, image slots, local restricted assets, and browser QA.
5. `legacy-local-pptx`: PptxGenJS local template fallback only when Presentations is unavailable, a lightweight local sample is needed, or MCP/local template validation is the task.

`ppt-design-reference` and `guizang-ppt-skill` are fused reference skills. Do not use them as default independent entrypoints. If NERO rules are missing or the user explicitly names an old skill, read the old skill as a reference only. Do not delete those old skills automatically.

Guizang Refresh v1.4:

- Source repo: `https://github.com/op7418/guizang-ppt-skill`
- License: `AGPL-3.0`
- Local snapshot: `$NERO_DESIGN_TEAM_HOME/case-library/snapshots/op7418__guizang-ppt-skill/snapshot.json`
- Local restricted asset pack: `not-bundled-restricted-reference: guizang-ppt-skill`
- NERO validator: `$NERO_DESIGN_TEAM_HOME/scripts/validate-web-ppt.mjs`
- Use the asset pack as `restricted-reference` only. Do not treat downloaded assets as NERO-owned brand assets or public/client deliverable assets without separate license review.
- For Swiss-style HTML decks, enforce registered layout ids, image slots, screenshot preservation, and exact text/data layering in HTML.

For PPT completion, report the chosen `ppt_subroute`, primary engine, whether legacy PptxGenJS was used, whether any fused reference rule was used, and which QA gates were verified.

## MCP-lite Tool Layer

Local MCP-lite server:

`$NERO_DESIGN_TEAM_HOME/mcp-lite/server.mjs`

Use MCP-lite as a tool layer only. It can read tokens, list templates, read case snapshots, import lightweight GitHub snapshots, run token builds, generate projects, run visual QA, run visual scoring, and run production checks.

MCP-lite must not replace design judgment, investment-banking wording review, factual evidence review, license/legal review, or gpt-image-2 usage boundaries.

MCP-lite is not assumed to be registered in every Codex session. When it is unavailable, use:

- Token files under `$NERO_DESIGN_TEAM_HOME/tokens/`
- Templates under `$NERO_DESIGN_TEAM_HOME/templates/`
- Case snapshots under `$NERO_DESIGN_TEAM_HOME/case-library/snapshots/`
- External restricted assets under `not-bundled-external-assets/`
- Effective HTML reference pack under `not-bundled-external-assets/effective-html/`
- Scripts under `$NERO_DESIGN_TEAM_HOME/scripts/`

## Default Standards

- Default language: Chinese for user-facing explanations unless the artifact itself requires English.
- Default visual tone: restrained, professional, evidence-first, high information density.
- Default audience: investment banking, A-share IPO advisory, AI industry research, and business/financial analysis.
- Default system positioning: `$NERO_DESIGN_TEAM_HOME/` is the central design system and background support layer, not a catch-all project workspace.
- Default brand root: `$NERO_DESIGN_TEAM_HOME/brand/`.
- Default token root: `$NERO_DESIGN_TEAM_HOME/tokens/`.
- Default token build command: `node $NERO_DESIGN_TEAM_HOME/scripts/build-tokens.mjs`.
- Default generator command: `node $NERO_DESIGN_TEAM_HOME/scripts/nero-design.mjs new <route> --name <project-name> --out <target-parent-dir>`.
- Default project integration command: `node $NERO_DESIGN_TEAM_HOME/scripts/nero-design.mjs init <route> --project-root <existing-project-dir>`.
- Default scoring command: `node $NERO_DESIGN_TEAM_HOME/scripts/score-visual.mjs <score-manifest.json>`.
- Default production-check command: `node $NERO_DESIGN_TEAM_HOME/scripts/production-check.mjs <production-manifest.json>`.
- Do not make a marketing landing page unless explicitly requested.
- Do not use random purple-blue gradients, oversized rounded cards, card-inside-card structures, or decorative images that do not carry information.
- Distinguish verified facts, assumptions, and placeholders in design outputs.
- Treat gpt-image-2 as an AI Image Art Director for visual素材 only.
- Never rely on gpt-image-2 for exact Chinese body text, financial figures, tables, chart axis labels, source notes, regulatory wording, or formal conclusions.

## Template Root

Reusable local templates live at:

`$NERO_DESIGN_TEAM_HOME/templates/`

Use these as starting points when creating new artifacts:

- `frontend-dashboard`
- `report-card-image`
- `pptx-deck`
- `remotion-short-video`
- `gpt-image-brief`

Do not install dependencies globally. For each real project, use the local project package file and install only what that template needs.

## Project Integration

For existing projects, NERO Design Team should be used as a background design system:

- create or read `<project>/.nero-design/manifest.json`;
- keep project outputs in the target project, usually `design-output/`, `exports/`, and `screenshots/`;
- reference NERO tokens, brand assets, templates, case snapshots, QA scripts, and scoring scripts from `$NERO_DESIGN_TEAM_HOME/`;
- do not move client data, final delivery files, or project evidence into `design-team/`;
- promote only reusable patterns back to `templates/`, `rules/`, `tokens/`, or `case-library/` after review.

## Token Outputs

Generated token outputs live at:

- CSS variables: `$NERO_DESIGN_TEAM_HOME/build/css/nero-tokens.css`
- Tailwind snippet: `$NERO_DESIGN_TEAM_HOME/build/tailwind/nero-tailwind.cjs`
- Image report theme: `$NERO_DESIGN_TEAM_HOME/build/themes/report-theme.mjs`
- PPTX theme: `$NERO_DESIGN_TEAM_HOME/build/themes/pptx-theme.mjs`
- Remotion theme: `$NERO_DESIGN_TEAM_HOME/build/themes/remotion-theme.ts`

## Brand And Scoring

Brand assets and layout guidance live at:

`$NERO_DESIGN_TEAM_HOME/brand/`

Visual scorecards live at:

`$NERO_DESIGN_TEAM_HOME/scorecards/`

Case library lives at:

`$NERO_DESIGN_TEAM_HOME/case-library/`

Export validation reports live at:

`$NERO_DESIGN_TEAM_HOME/validation/`

Treat current NERO SVG logo/wordmark assets as local placeholders unless official assets are supplied.

## Completion Bar

Before final response:

- Report which route was used.
- Report whether brand assets or placeholder brand assets were used.
- Report which token outputs were used or built.
- Report which template or repository references were used.
- Report whether the generator was used.
- Report whether `.nero-design/manifest.json` was created or read for project integration tasks.
- Report whether gpt-image-2 was used, briefed, or deliberately avoided.
- Report visual QA and visual score when performed.
- Report production-check status when performed.
- Report whether the artifact was archived to or matched against the case library.
- Report what was actually generated or changed.
- Report what was verified and what remains unverified.
- If a visual artifact was generated, include file paths and whether dimensions/output size were checked.
