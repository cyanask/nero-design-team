# Frontend UI Rule

Use this rule for web apps, dashboards, admin tools, CRM-like workflows, AI tools, and internal analytical systems.

## Routing

- Default system: shadcn/ui.
- Add Carbon when the screen is data-heavy, analytical, enterprise, or financial.
- Add Ant Design when the screen needs complex tables, filters, form validation, modals, date controls, or admin CRUD.
- Add Magic UI only for restrained visual accents, covers, launch screens, or empty states.
- Add Effective HTML when the output is a self-contained HTML explainer, architecture diagram, visual plan, or single-file design-review artifact.
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

## Effective HTML Fusion

Use `effective-html.md` when the frontend output is best delivered as one self-contained HTML file rather than a maintained app:

- visual explainers
- architecture diagrams
- HTML plan pages
- design review artifacts
- lightweight interactive concept prototypes

Do not install `plannotator/effective-html` as an independent default Skill. Use its local snapshot and reference pack only to extract NERO-native patterns: single-file discipline, SVG-first diagrams, CSS-variable themes, dark-mode handling, and pragmatic HTML plan structure.

## Design Read

Before styling a frontend UI, write a short internal design read and let it govern the implementation:

- Page kind: dashboard, admin workflow, analytical tool, CRM-like surface, AI tool, landing page, portfolio, or redesign.
- Audience: banker, analyst, issuer project team, investor, enterprise operator, technical user, or public reader.
- Existing assets: NERO tokens, brand color, typography, logo, charts, product screenshots, or project-specific UI patterns.
- Quiet constraints: regulatory seriousness, financial evidence, Chinese long labels, accessibility, repeat use, data density, and source traceability.
- Visual strength: restrained work-tool by default; only increase expressiveness when the deliverable is explicitly brand, launch, cover, portfolio, or concept oriented.

## Anti-Slop Rules

- Do not default to a centered SaaS hero, dark mesh background, purple-blue gradient, three equal feature cards, generic glassmorphism, or decorative AI stock imagery.
- Do not use Inter, Arial, or system font stacks as a lazy default when a project-specific type choice is available. Inter is acceptable only when the product intentionally needs neutral enterprise familiarity.
- Do not make every surface a rounded card. Use cards only when elevation communicates hierarchy; otherwise use spacing, dividers, section bands, or table structure.
- Do not nest cards inside cards.
- Do not make one-note palettes dominated by a single hue family unless it is an explicit brand constraint.
- Do not add motion that distracts from data, hides controls, breaks reduced-motion expectations, or exists only to make the page look more animated.
- Do not replace information architecture, SEO anchors, analytics labels, or existing accessible behavior during a redesign unless the task explicitly includes that change.

## Deterministic Review Checklist

Before calling a frontend UI done, check these mechanical issues:

- Typography hierarchy is clear; headings do not skip levels without reason; hero-scale type is not used inside dashboards, panels, or dense tables.
- Buttons, table cells, sidebar labels, tabs, badges, filters, and chart labels do not overflow at target desktop and mobile widths.
- Button text and icon buttons have stable dimensions; long Chinese labels wrap intentionally or are shortened.
- Touch targets are large enough for mobile controls when mobile use is in scope.
- Contrast passes for body text, buttons, input placeholders, form labels, helper text, focus rings, and chart labels.
- Responsive layouts collapse to single-column or task-appropriate stacked views without clipped controls.
- Loading, empty, error, selected, hover, focus, disabled, and active states exist where the workflow needs them.
- Motion respects reduced-motion settings and has a static fallback.
- Charts include unit, period, denominator, and source where relevant.
- Self-contained HTML artifacts open without a build step when that is the intended delivery mode.
- SVG-first diagrams use CSS variables/classes for theme-aware geometry where feasible.
- The page still feels like a professional NERO work tool, not a generic AI-generated template.

## Hard Bans

- No random purple-blue gradients as a default look.
- No oversized rounded cards.
- No card inside card layouts.
- No decorative images that do not clarify the product, data, or workflow.
- No in-app text explaining features, keyboard shortcuts, or design decisions unless the product itself requires it.
- No hero-style type inside dense dashboards or panels.

## Pre-Flight Gate

Frontend output is not complete until all of these are true or explicitly marked not applicable:

- The first viewport is the actual usable interface, unless the user explicitly requested a landing page or cover.
- Information density is preserved for analytical and business workflows; visual novelty does not remove necessary fields, filters, labels, or source context.
- The UI has inspected desktop and mobile states when feasible.
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
