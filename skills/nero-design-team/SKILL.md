---
name: nero-design-team
description: Use whenever NERO mentions "设计团队", "NERO Design Team", "NERO design team", or the standalone shorthand "ndt"/"NDT" in a design-related request, and when creating, revising, generating, scoring, production-checking, case-library referencing, or auditing frontend UI, image-style research reports, PPT/PPTX decks, web PPT/HTML decks, 架构脉络图 / dark SVG architecture-map templates, short videos, or AI-generated visual素材 for NERO. Routes design work through NERO brand assets, design tokens, project generators, case library, export validation, shadcn/ui, Carbon, Ant Design, ECharts/G2, Satori/Sharp, Presentations, legacy PptxGenJS, Slidev, Remotion, fused PPT business-design/web-PPT rules, gpt-image-2 briefs, visual QA, visual scoring, and production checks with professional investment-banking and AI-industry standards.
---

# NERO Design Team

## Trigger

When NERO says `设计团队` in any project and the task involves UI, images, reports, PPT, web PPT, video, visual style, design review, layout, visual QA, or visual generation, treat it as a request to use NERO Design Team.

When NERO says standalone `ndt` or `NDT` in a design-related request, treat it as the shorthand alias for NERO Design Team. Do not trigger on `ndt` when it appears as part of another word or in a non-design context.

When NERO says `架构脉络图`, `用架构脉络图`, `深色节点网络架构图`, or asks to turn a system/workflow into a projector-ready dark HTML/SVG architecture map, treat it as NERO Design Team `frontend-ui` + `effective-html` route and load `$NERO_DESIGN_TEAM_HOME/prompts/effective-html/architecture-map.md`.

Do not require NERO to say the full phrase `NERO Design Team`, `nero-design-team`, `.nero-design`, or `manifest`. Those are implementation details.

Examples:

- `让设计团队看看这个界面`
- `ndt 看看这个 PPT`
- `NDT 帮我审一下这个长图`
- `用设计团队做一版 PPT`
- `设计团队帮我把这个长图做高级一点`
- `这个项目后续都按设计团队的标准来`
- `架构脉络图：把这个系统画成入口、事实底座、工作台、门禁、产物`
- `用架构脉络图画一下这个业务流程`

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
12. `presentation-handoff-contract`
13. `presentation-production-chain`

If the task mixes formats, choose the primary deliverable first and reuse assets across formats.

## Subroute Matrix

Choose the subroute before loading detailed references. If multiple rows match, apply this order:

1. Business domain beats file format: PitchBook / client material / banker material uses `pitchbook-client-material` first, then chooses PPTX, HTML, or image output.
2. Formal Office output beats local convenience: final PPTX/PDF must use the Presentations/PDF plugin route and QA gate.
3. Audit-only work stays read-only unless NERO asks to generate or revise an artifact.
4. Legacy reference skills such as `guizang-ppt-skill` and `ppt-design-reference` are reference-only, not default entrypoints.

| Subroute | Use when | Primary engine / controller | Required references / skills | Completion gates |
|---|---|---|---|---|
| `pitchbook-client-material` | PitchBook, 客户材料, 拜访材料, A股 IPO 诊断, 投行商业材料 | NERO Design Team controls visual route; content may use `investment-banking-pitchbook-content` or `a-share-ipo-diagnostic-pitchbook`; formal visual QA may use `nero-design-team-investment-banking-pitchbook` | `references/investment-banking-pitchbook.md`, `references/ppt-business-design.md`, `references/visual-qa.md` | Formal delivery language gate, production-trace cleanup, visual QA, source/evidence consistency |
| `formal-pptx` | Editable formal PPTX, roadshow, board deck, research/strategy/product deck | Presentations plugin / artifact-tool | `references/ppt.md`, `references/ppt-business-design.md`, `references/ppt-production-harness.md`, `references/visual-qa.md` | Render/preview QA, spec/editability gate, layout overlap check, source notes, final file path |
| `template-following` | Source/template PPTX, follow-this deck, same-layout request, corporate template | Presentations template-following flow | `references/ppt.md`, source deck inspection, `references/ppt-business-design.md`, `references/ppt-production-harness.md` | Before/after render comparison, template fidelity, no stale regeneration |
| `presentation-handoff-contract` | KAT hands over a `presentation_handoff_contract`, deck brief, slide plan, story spine, evidence-to-slide map, or content/visual boundary for PPT | NERO Design Team visual intake; KAT remains content owner | `references/presentation-handoff-contract.md`, `references/ppt.md`, `references/ppt-business-design.md`, `references/visual-qa.md` | Contract completeness, output lane fit, must-preserve check, exact data/text boundary, return-to-KAT decision |
| `presentation-production-chain` | KAT x NDT production packet, slide claim map, narrative variants, content freeze, return-to-KAT, design spec, style lock, three-direction exploration, or formal presentation production readiness | KAT owns content; NERO Design Team owns visual production; Presentations owns formal PPTX output | `references/presentation-production-chain.md`, `references/presentation-design-spec.md`, `references/presentation-handoff-contract.md`, `references/ppt-production-harness.md`, `references/visual-qa.md`, `references/visual-score.md` | Packet completeness, content freeze compliance, design spec/style lock, visual exploration, PPTX QA readiness, production-check |
| `web-ppt-html` | Web PPT, horizontal swipe deck, magazine-style PPT, Swiss deck, demo/share HTML deck, HTML style preview | NERO-native HTML; Guizang/Frontend Slides/Huashu only as fused references | `references/web-ppt.md`, `references/html-deck-style-discovery.md`, `references/web-ppt-multidevice-qa.md`, `references/visual-qa.md` | Browser QA, desktop/mobile screenshots, contact sheet, navigation, image slots, PDF pagination if exported |
| `image-card-report` | Long image, research card, visual report card, cover/thumbnail, information graphic | Image-report route; image generation only for suitable visual素材 | `references/image-report.md`, `references/ai-image-generation.md` when generating images, `references/visual-qa.md` | Dimensions, text fit, export size, no generated exact financial text |
| `frontend-ui` | Dashboard, web app UI, admin/workbench screen, frontend prototype, HTML-native prototype, design variants | Frontend UI route | `references/frontend-ui.md`, `references/html-native-harness.md`, `references/effective-html.md` when self-contained HTML is needed | Responsive QA, accessibility basics, overflow checks, browser verification |
| `visual-audit-score` | Review, diagnose, score, production check, readiness check without new artifact | Design Team QA route | `references/visual-qa.md`, `references/visual-score.md`, `references/production-check.md` | Findings first, severity, screenshots/evidence when available, no unasked generation |
| `ai-image-generation` | Cover/background/concept visual素材, style exploration, image prompt/brief | AI image art-direction route | `references/ai-image-generation.md` | Exact text/numbers stay outside generated image, usage boundaries reported |
| `short-video` | Short video, animated explainer, Remotion-style visual narrative, still-to-motion pipeline | Short-video route | `references/short-video.md`, `references/motion-video-harness.md` | Script/storyboard, render path, duration/aspect checks, frame QA |
| `project-integration` | Existing project should adopt NERO Design Team as background design system | Project integration route | `references/project-integration.md`, `references/generator.md` only if manifest is needed | `.nero-design/manifest.json` read/created, outputs remain in target project |

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
- Canonical design-system rules live under `$NERO_DESIGN_TEAM_HOME/rules/`. This Skill's `references/` files are a runtime mirror for Codex Skill packaging. When editing rules, keep the source rule and Skill reference mirror aligned.
- For new artifacts or brand/style refreshes: read `references/brand-system.md`.
- If the user says `架构脉络图` or asks for a dark projector-ready node-network architecture map: read `references/frontend-ui.md`, `references/effective-html.md`, `references/visual-qa.md`, then use `$NERO_DESIGN_TEAM_HOME/prompts/effective-html/architecture-map.md` and the case asset `$NERO_DESIGN_TEAM_HOME/case-library/assets/frontend-ui/hermes-workbench-architecture-map/`.
- `frontend-ui`: read `references/frontend-ui.md`; also read `references/html-native-harness.md` for HTML-native prototypes, design variants, brand-asset protocol, or multi-format visual exploration; also read `references/effective-html.md` when the deliverable is a self-contained HTML explainer, architecture diagram, visual plan, design-review page, or single-file prototype. This route includes fused Impeccable/Taste frontend taste rules for design read, anti-slop checks, deterministic UI review, and final polish.
- `image-report`: read `references/image-report.md`.
- `ppt`: read `references/ppt.md`, then read `references/presentation-handoff-contract.md` when KAT, a deck brief, slide plan, story spine, evidence-to-slide map, or `presentation_handoff_contract` is involved; then read `references/ppt-business-design.md` for formal/business decks or audits, `references/ppt-production-harness.md` for spec lock, native editability, SVG QA, or substantial PPT production discipline, `references/web-ppt.md` and `references/html-deck-style-discovery.md` for HTML/web PPT decks, and `references/effective-html.md` when the deck needs a self-contained HTML diagram or visual plan page.
- `presentation-production-chain`: read `references/presentation-production-chain.md`, `references/presentation-design-spec.md`, `references/presentation-handoff-contract.md`, `references/ppt-production-harness.md`, `references/visual-qa.md`, and `references/visual-score.md`. Use when the task mentions production packet, slide claim map, narrative variants, content freeze, return-to-KAT, design spec, style lock, three-direction exploration, or PPTX production readiness.
- `short-video`: read `references/short-video.md`; also read `references/motion-video-harness.md` for storyboard discipline, still-to-motion conversion, or frame-level production planning.
- `ai-image-generation`: read `references/ai-image-generation.md`.
- `new-project`: read `references/generator.md`.
- `project-integration`: read `references/project-integration.md`, then `references/generator.md` only if a manifest must be created.
- `case-library`: read `references/case-library.md`.
- `presentation-handoff-contract`: read `references/presentation-handoff-contract.md`, then choose the downstream PPT subroute from the contract's `deck_brief.output_lane`.
- For KAT x NDT presentation production packets: use the `presentation-production-chain` route before final PPTX, web PPT, image, or video output.
- For any third-party repo, template, screenshot, sample, skill, or asset reference: read `references/external-design-reference-boundaries.md`.
- `visual-score`: read `references/visual-score.md`.
- `production-check`: read `references/production-check.md`.
- Always read `references/visual-qa.md` before finalizing design work.
- Read `references/repo-registry.md` when deciding which external repository or design system should influence the task.
- Build or load NERO tokens before detailed styling when using local templates.

## 正式视觉交付门禁

Before final client-facing design delivery, run a production-trace cleanup and 视觉 QA pass.

- Remove 制作痕迹 from visible pages, notes, captions, filenames when visible, exported PDF text, screenshots, and QA reports that will be shared.
- Remove design-process wording such as `设计思路`, `改版原则`, `制作逻辑`, `处理方式`, prompt/model/tool notes, local paths, debug labels, and internal screenshot provenance from formal body pages.
- For PPTX/PDF/HTML outputs, check pagination, text overlap, line breaks, PDF export, screenshot completeness, desktop/mobile viewport fit, and source/evidence consistency before reporting completion.
- Keep required source/caliber notes, evidence boundaries, unresolved review items, and license restrictions, but move implementation details to the quality report or internal handoff instead of the client-facing artifact.

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
- Local reference pack: `$NERO_DESIGN_TEAM_HOME/assets/external/effective-html/manifest.json`
- Use as reference only. Build NERO-native HTML/CSS/JS with NERO tokens and verified task content.

## Presentation Harness Fusion v1.8

NERO Design Team is the only entrypoint and controller for presentation harness work.

The following projects are fused references, not standalone default routes:

- `alchaincyf/huashu-design`
  - Use for HTML-native prototypes, design variants, brand-asset protocol, visual QA thinking, and motion/video pipeline planning.
  - Read `references/html-native-harness.md` and `references/motion-video-harness.md`.
  - Do not enable TTS, copy audio/video assets, add watermarks, write provider configuration, or migrate upstream assets wholesale.
- `zarazhangrui/frontend-slides`
  - Use for fixed 1920x1080 HTML deck style discovery, three-direction previews, contact sheets, and web PPT preview discipline.
  - Read `references/html-deck-style-discovery.md` and `references/web-ppt.md`.
  - Do not replace formal PPTX, deploy publicly by default, or copy upstream bold-template code wholesale.
- `hugohe3/ppt-master`
  - Use for design spec/spec lock, serial PPT production discipline, SVG QA, native editability, and AI image style-lock thinking.
  - Read `references/ppt-production-harness.md`, `references/ppt.md`, and `references/ai-image-generation.md`.
  - Do not replace Presentations as the formal PPTX primary route, install heavy dependencies, run image search/TTS/watermark removal, or copy large SVG/PPTX examples.

Local lightweight snapshots:

- `$NERO_DESIGN_TEAM_HOME/case-library/snapshots/alchaincyf__huashu-design/snapshot.json`
- `$NERO_DESIGN_TEAM_HOME/case-library/snapshots/zarazhangrui__frontend-slides/snapshot.json`
- `$NERO_DESIGN_TEAM_HOME/case-library/snapshots/hugohe3__ppt-master/snapshot.json`

Always pair external project references with `references/external-design-reference-boundaries.md`.

## PPT Fusion

NERO Design Team is the default PPT entrypoint and controller.

PPT subroutes:

1. `formal-pptx`: formal editable banker, research, investor, strategy, product, or board PPTX. Default to the Presentations plugin and artifact-tool.
2. `template-following`: source/template PPTX, same-layout, follow-this, corporate template, or source-deck work. Use the Presentations template-following path.
3. `ppt-design-audit`: design diagnosis, visual upgrade, commercial deck critique, and quality gates. Use fused NERO rules from `ppt-business-design.md` and `ppt-production-harness.md`.
4. `web-ppt-html`: horizontal swipe HTML deck, magazine-style PPT, Swiss-style PPT, demo/share/web deck. Use fused NERO rules from `web-ppt.md` and `html-deck-style-discovery.md`, including the v1.4 Guizang Refresh rules for Swiss locked layouts, screenshot handling, image slots, local restricted assets, and browser QA.
5. `legacy-local-pptx`: PptxGenJS local template fallback only when Presentations is unavailable, a lightweight local sample is needed, or MCP/local template validation is the task.

`ppt-design-reference`, `guizang-ppt-skill`, `frontend-slides`, and `ppt-master` are fused reference sources. Do not use them as default independent entrypoints. If NERO rules are missing or the user explicitly names an old skill/source, read the old source as a reference only. Do not delete old skills automatically.

Guizang Refresh v1.4:

- Source repo: `https://github.com/op7418/guizang-ppt-skill`
- License: `AGPL-3.0`
- Local snapshot: `$NERO_DESIGN_TEAM_HOME/case-library/snapshots/op7418__guizang-ppt-skill/snapshot.json`
- Local restricted asset pack: `$NERO_DESIGN_TEAM_HOME/assets/external/guizang-ppt-skill/manifest.json`
- NERO validator: `$NERO_DESIGN_TEAM_HOME/scripts/validate-web-ppt.mjs`
- Use the asset pack as `restricted-reference` only. Do not treat downloaded assets as NERO-owned brand assets or public/client deliverable assets without separate license review.
- For Swiss-style HTML decks, enforce registered layout ids, image slots, screenshot preservation, and exact text/data layering in HTML.

For PPT completion, report the chosen `ppt_subroute`, primary engine, whether legacy PptxGenJS was used, whether any fused reference rule was used, and which QA gates were verified.

## KAT Presentation Handoff

KAT is the content director and NERO Design Team is the visual director. If a PPT task arrives from KAT or includes a `presentation_handoff_contract`, deck brief, slide plan, story spine, evidence-to-slide map, or explicit content/visual boundary, read `references/presentation-handoff-contract.md` before visual production.

NERO may choose the visual route, layout system, image direction, chart treatment, visual QA, visual score, and production-check path. NERO must return to KAT instead of silently changing conclusions, financial figures, source notes, regulatory wording, claim meaning, or must-preserve action titles.

Formal editable PPTX still defaults to Presentations. The handoff contract controls content and visual boundaries; it is not a local PPTX renderer.

## KAT x NDT Production Chain v2.0

Use this when NERO asks for a full presentation chain, production packet, slide claim map, narrative variants, content freeze gate, return-to-KAT mechanism, design spec, style lock, or three-direction PPT visual exploration.

KAT remains the content director. NERO Design Team remains the visual director. Presentations remains the formal editable PPTX engine.

Required production-chain artifacts:

- KAT: `presentation_handoff_contract`, `slide_claim_map`, `narrative_variants`, `content_freeze_gate`, and any `return_to_kat_request`.
- NDT: `design_spec`, `style_lock`, `visual_exploration`, gpt-image-2 brief when needed, visual QA, visual score, production-check.
- Output: explicit target format and output engine.
- Validation: content QA, visual QA, score, production-check, and case archive decision.

Do not report production readiness if the packet, design spec, style lock, or PPTX QA evidence is missing; report the missing gate instead.

## MCP-lite Tool Layer

Local MCP-lite server:

`$NERO_DESIGN_TEAM_HOME/mcp-lite/server.mjs`

Use MCP-lite as a tool layer only. It can read tokens, list templates, read case snapshots, import lightweight GitHub snapshots, run token builds, generate projects, run visual QA, run visual scoring, and run production checks.

MCP-lite must not replace design judgment, investment-banking wording review, factual evidence review, license/legal review, or gpt-image-2 usage boundaries.

MCP-lite is not assumed to be registered in every Codex session. When it is unavailable, use:

- Token files under `$NERO_DESIGN_TEAM_HOME/tokens/`
- Templates under `$NERO_DESIGN_TEAM_HOME/templates/`
- Case snapshots under `$NERO_DESIGN_TEAM_HOME/case-library/snapshots/`
- External restricted assets under `$NERO_DESIGN_TEAM_HOME/assets/external/`
- Effective HTML reference pack under `$NERO_DESIGN_TEAM_HOME/assets/external/effective-html/`
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
- `presentation-production-chain`

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
