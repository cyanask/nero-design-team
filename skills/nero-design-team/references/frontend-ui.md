# Frontend UI Rule

Use this rule for web apps, dashboards, admin tools, CRM-like workflows, AI tools, and internal analytical systems.

## Routing

- Default system: shadcn/ui.
- Add Carbon when the screen is data-heavy, analytical, enterprise, or financial.
- Add Ant Design when the screen needs complex tables, filters, form validation, modals, date controls, or admin CRUD.
- Add Magic UI only for restrained visual accents, covers, launch screens, or empty states.
- Add Effective HTML when the output is a self-contained HTML explainer, architecture diagram, visual plan, or single-file design-review artifact.
- Add `frontend-motion.md` when the interface includes meaningful press, popover, drawer, sheet, drag, swipe, carousel, momentum, or interruptible motion behavior.
- Use NERO design tokens for color, typography, spacing, radius, chart palette, and motion before custom styling.

## Design Standard

- Build tokens first with `$NERO_DESIGN_TEAM_HOME/scripts/build-tokens.mjs` when using local templates.
- First screen should be the actual working interface unless the user explicitly asks for a landing page.
- Prefer dense but organized information over oversized marketing sections.
- Use stable layout constraints for sidebars, tables, toolbars, cards, and responsive grids.
- Use icons for tools and compact controls where available.
- Use restrained contrast, clear grouping, and visible hierarchy.
- Preserve business readability before visual novelty.

## Frontend Taste Fusion

This route fuses NERO-calibrated ideas from `pbakaus/impeccable` and `Leonxlnx/taste-skill`.

- Treat both projects as design-quality references, not as installed dependencies or independent workflow entrypoints.
- Do not run `npx impeccable`, `npx skills add`, hooks, live mode, browser injection, or external package installs unless NERO explicitly asks for that in a real project.
- Apply the extracted rules only when they improve NERO work-tool quality: investment-banking interfaces, AI industry research tools, dashboards, admin systems, and analytical workflows.
- `Leonxlnx/taste-skill` v2 is used only for four targeted NERO upgrades: anti-slop checks, controllable visual dials, brief inference before code, and shared configuration discipline.
- Do not import Taste's marketing-site bias into NERO dashboards, data tables, disclosure workbenches, or dense analytical tools.

## Frontend Motion Fusion

Use `frontend-motion.md` for interaction motion that materially affects control confidence, spatial continuity, direct manipulation, or accessibility.

- `emilkowalski/skills` is a fused reference, not an installed dependency or independent NDT route.
- Apply motion purpose and frequency gates before choosing curves, durations, or springs.
- Keep banking, disclosure, evidence, table, filter, and keyboard workflows immediate and low-motion.
- Use physics-based spring or inertia behavior when live gesture velocity must be inherited; do not substitute a duration-based spring that cannot carry velocity.
- Treat reduced transparency and web haptics as progressive enhancements with functional fallbacks.
- Report `fused_reference_skills: emilkowalski/apple-design, review-animations, improve-animations` when the rule materially affects implementation or audit findings.

## Effective HTML Fusion

Use `effective-html.md` when the frontend output is best delivered as one self-contained HTML file rather than a maintained app:

- visual explainers
- architecture diagrams
- HTML plan pages
- design review artifacts
- lightweight interactive concept prototypes

Do not install `plannotator/effective-html` as an independent default Skill. Use its local snapshot and reference pack only to extract NERO-native patterns: single-file discipline, SVG-first diagrams, CSS-variable themes, dark-mode handling, and pragmatic HTML plan structure.

## Design Read

Before styling or writing frontend code, write a short internal design read and let it govern the implementation:

- Page kind: dashboard, admin workflow, analytical tool, CRM-like surface, AI tool, landing page, portfolio, or redesign.
- Audience: banker, analyst, issuer project team, investor, enterprise operator, technical user, or public reader.
- Existing assets: NERO tokens, brand color, typography, logo, charts, product screenshots, or project-specific UI patterns.
- Quiet constraints: regulatory seriousness, financial evidence, Chinese long labels, accessibility, repeat use, data density, and source traceability.
- Visual strength: restrained work-tool by default; only increase expressiveness when the deliverable is explicitly brand, launch, cover, portfolio, or concept oriented.

For substantial frontend work, report this as one compact line before implementation:

`Design Read: <page kind> for <audience>, using <design system / token base>, with <visual language>, dials <DESIGN_VARIANCE>/<MOTION_INTENSITY>/<VISUAL_DENSITY>.`

If the design read could lead to materially different visual directions, ask exactly one clarifying question before generating code. Do not ask a multi-question design interview.

## Taste Dials

Use these dials to make the visual direction explicit and controllable. NERO or the task may override them; otherwise infer them from the design read.

- `DESIGN_VARIANCE` controls layout experimentation. `1` is rigid enterprise symmetry; `10` is experimental editorial composition.
- `MOTION_INTENSITY` controls animation depth. `1` is static utility; `10` is cinematic motion or scroll storytelling.
- `VISUAL_DENSITY` controls information per viewport. `1` is airy brand/campaign work; `10` is cockpit-level analytical density.

NERO defaults:

- Dashboards, admin tools, disclosure workbenches, financial analysis UIs: `3 / 1 / 8`.
- AI research tools, analytical explainers, evidence portals: `4 / 2 / 7`.
- Public portfolio, launch page, case room, lightweight product site: `6 / 3 / 5`.
- Brand concept, hero cover, visual exploration, image-first prototype: `7 / 4 / 4`.

Rules:

- Higher `DESIGN_VARIANCE` cannot break information architecture, Chinese label readability, table scanning, source traceability, or form completion.
- Higher `MOTION_INTENSITY` must have reduced-motion fallback and must never hide data, controls, validation messages, or evidence/source notes.
- Lower `VISUAL_DENSITY` is allowed only when the deliverable is explicitly brand, launch, cover, portfolio, or conceptual. Dense work tools should not be made sparse just to look premium.
- If NERO manually sets dials, preserve the numbers and explain any safety adjustment.

## Anti-Slop Rules

- Treat centered SaaS heroes, dark mesh backgrounds, purple-blue gradients, three equal feature cards, generic glassmorphism, decorative AI stock imagery, fake status tags, and ornamental labels as high-risk default patterns, not permanent bans.
- Default-ban these patterns when they are used only because the model reached for an AI template.
- Allow them only through the exception gate below, when they are supported by the brief, brand system, content structure, or high-quality visual assets.
- Do not use a hero section when the first screen should be an actual dashboard, admin workflow, table, form, evidence room, or workbench. Exception: a product/brand cover, launch page, case room, or PPT-like chapter screen explicitly needs a hero.
- Do not use three feature cards unless the product truly has three peer-level feature groups. For workflows, prefer task lanes, evidence groups, progressive disclosure, or table-plus-detail layouts.
- Do not use glassmorphism as a default material. Use it only for covers, launch/brand moments, HUD-style overlays, or clearly separated panels where contrast and accessibility remain intact.
- Do not use decorative pills, fake status tags, version stamps, section numbers, scroll cues, city/time strips, image labels, or photo-credit captions unless they carry real product meaning.
- Do not use Inter, Arial, or system font stacks as a lazy default when a project-specific type choice is available. Inter is acceptable only when the product intentionally needs neutral enterprise familiarity.
- Do not make every surface a rounded card. Use cards only when elevation communicates hierarchy; otherwise use spacing, dividers, section bands, or table structure.
- Do not nest cards inside cards.
- Do not make one-note palettes dominated by a single hue family unless it is an explicit brand constraint.
- Do not add motion that distracts from data, hides controls, breaks reduced-motion expectations, or exists only to make the page look more animated.
- Do not show duplicate CTA intents in nav, hero, footer, and sticky controls. Pick one label per action intent.
- Do not replace information architecture, SEO anchors, analytics labels, or existing accessible behavior during a redesign unless the task explicitly includes that change.

## Exception Gate

Default-banned patterns may be used only when all of these are true:

- Task fit: the pattern matches the deliverable type, such as brand page, cover, launch, chapter divider, concept visual, or high-level explainer.
- Content fit: the pattern expresses real information structure, not filler. For example, three cards map to three actual peer groups; status tags map to real state.
- Asset fit: gradients, photos, glass, or decorative treatments come from NERO tokens, brand assets, case references, or generated素材 with a clear visual role.
- Readability fit: Chinese labels, charts, tables, source notes, buttons, and body text remain readable at target desktop and mobile sizes.
- Evidence fit: the pattern does not invent facts, fake statuses, fake metrics, fake logos, source notes, regulatory language, or financial conclusions.
- QA fit: contrast, overflow, responsive layout, reduced-motion fallback, and information hierarchy pass visual QA.

If any gate fails, replace the pattern with a simpler NERO-native layout.

## Shared Configuration Discipline

Taste-style rules must be shared from one source, not copied into divergent tool prompts.

- NERO Design Team is the source of truth for NERO-calibrated frontend taste rules.
- Codex uses this Skill and `$NERO_DESIGN_TEAM_HOME/rules/frontend-ui.md`.
- Project-local integrations should reference `.nero-design/manifest.json` and the NDT rule path rather than pasting a private fork of the rules.
- Claude Code, Cursor, or other tools may reference the same NDT prompt snippet or the upstream `taste-skill` install command only when NERO explicitly wants cross-tool sharing.
- If an external tool installs upstream `taste-skill`, map its output back into NDT dials and QA gates; do not let upstream defaults override NERO tokens, business readability, or formal delivery boundaries.

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

## Deterministic Review Checklist

Before calling a frontend UI done, check these mechanical issues:

- Typography hierarchy is clear; headings do not skip levels without reason; hero-scale type is not used inside dashboards, panels, or dense tables.
- Buttons, table cells, sidebar labels, tabs, badges, filters, and chart labels do not overflow at target desktop and mobile widths.
- Button text and icon buttons have stable dimensions; long Chinese labels wrap intentionally or are shortened.
- Touch targets are large enough for mobile controls when mobile use is in scope.
- Contrast passes for body text, buttons, input placeholders, form labels, helper text, focus rings, and chart labels.
- Responsive layouts collapse to single-column or task-appropriate stacked views without clipped controls.
- Loading, empty, error, selected, hover, focus, disabled, and active states exist where the workflow needs them.
- Meaningful motion has a named purpose, respects the selected `MOTION_INTENSITY`, remains interruptible where needed, and has a verified reduced-motion fallback.
- Charts include unit, period, denominator, and source where relevant.
- Self-contained HTML artifacts open without a build step when that is the intended delivery mode.
- SVG-first diagrams use CSS variables/classes for theme-aware geometry where feasible.
- The page still feels like a professional NERO work tool, not a generic AI-generated template.

## Default Bans And Exception Gate

- Default-ban random purple-blue gradients, oversized rounded cards, card-inside-card layouts, decorative images, and hero-style type inside dense dashboards or panels.
- Allow a default-banned pattern only when it passes the Exception Gate above and improves the actual deliverable.
- Never allow decorative images, generated素材, labels, or visual effects to carry exact facts, financial figures, source notes, regulatory wording, or formal conclusions.
- Do not put in-app text explaining design decisions, implementation details, keyboard shortcuts, or feature claims unless the product itself requires it.

## Pre-Flight Gate

Frontend output is not complete until all of these are true or explicitly marked not applicable:

- The first viewport is the actual usable interface, unless the user explicitly requested a landing page or cover.
- Information density is preserved for analytical and business workflows; visual novelty does not remove necessary fields, filters, labels, or source context.
- The UI has inspected desktop and mobile states when feasible.
- Style-direction HTML files, mockups, and `design-output/*.html` are exploration artifacts only. They do not count as final UI acceptance for a maintained local app.
- For local apps, final acceptance must inspect the real running surface at the project URL when feasible, using real or project-native data. Verify vertical page scroll, horizontal table/table-control scroll, desktop width, narrow/mobile width, text overflow, and core controls on the actual app, not only in a static preview.
- For Streamlit or similar local GUI surfaces, the QA target is the live app URL, such as the project-defined `localhost` port, after style rules have been applied to the actual app code.
- Core controls have loading, empty, error, selected, hover, and focus states where needed.
- No generated imagery, placeholder copy, or decorative element carries factual claims, numbers, source notes, or regulatory wording.

## Evidence Portfolio / Case Room Pattern

Use this pattern for browser-first resumes, personal portfolio pages, founder profiles, or expert profiles where the reviewer should click into proof rather than read a flat biography.

- Lead with one or two evidence portals, not a role taxonomy or generic skill grid.
- Each portal should map to a concrete case room: background, role, method, outputs, and transferable value.
- Keep internal design thinking, route labels, and QA rationale out of the visible artifact body; those belong in project notes or `.nero-design` files.
- For bilingual pages, write Chinese and English as independent content layers and preserve active interaction state when switching language.
- Avoid repeated meaning between portal title, section heading, capability summary, and project cards; each layer should add new evidence.
- For AI-build portfolios, use a consistent chain: scenario, evidence or data structure, workflow or agent loop, quality gate, output.
- On mobile, do not show two controls that switch the same item. Keep one obvious project switcher and hide duplicate tabs, pills, or rails.
- Treat visual assets as supporting atmosphere or structure only. Exact facts, dates, figures, project roles, and regulatory wording must remain HTML text from verified or user-provided sources.

## Deliverable Requirements

- State which token outputs were used: CSS variables, Tailwind snippet, or project-local theme copy.
- Include desktop and mobile responsive states.
- Verify text does not overflow buttons, cards, table cells, labels, or sidebars.
- Verify charts, tables, filters, and controls remain usable at target widths.
- For local apps, run the dev server and visually inspect screenshots when feasible.

## Prompt Snippet

Use the NERO Design Team frontend UI route: shadcn/ui as the component baseline, Carbon for information density, Ant Design for complex enterprise controls, and Magic UI only as a restrained accent. Apply the fused Impeccable/Taste rules as NERO-calibrated design-quality checks: read the page type and audience first, avoid AI-default visual patterns, then run deterministic review for typography, overflow, contrast, responsive behavior, states, and motion fallback. The interface should feel like a professional work tool for investment banking or AI industry research, not a marketing landing page.
