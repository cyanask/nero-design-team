# AI Image Generation Rule

Use this rule when a design task needs high-quality generated bitmap visuals for covers, backgrounds, concept art, chapter images, or short-video scenes.

## Routing

- Model role: `gpt-image-2` as AI Image Art Director.
- Primary output: visual asset only, not final evidence-bearing text layout.
- Downstream layout: Satori/Sharp for image reports, PptxGenJS for PPTX, Remotion for video.
- Always combine with `visual-qa.md` after exact text, numbers, charts, and source notes are overlaid.
- For substantial PPT/deck work, combine with `ppt-production-harness.md` to lock image style, palette, safe zones, and editability boundaries before production.

## Suitable Uses

- Report cover or long-image background.
- Industry concept visual, supply-chain metaphor, semiconductor or AI infrastructure scene.
- PPT cover, section divider, and supporting visual panels.
- Short-video scene background, texture, mood frame, or storyboard still.
- Early style exploration before building a coded template.

## 留白杂志风 Preset

Use `minimal-zine-editorial.md` when NERO asks for `留白杂志风` or `留白杂志风格`, or when the task needs a quiet paper-zine cover, article opener, social card, or chapter visual with large negative space, one compact subject cluster, print/scan texture, and one high-chroma anchor.

- Keep `ai-image-generation` as the route. Resolve the user-facing name `留白杂志风` to canonical preset `minimal-zine-editorial`.
- Use the preset's Variation Engine, four-paragraph prompt compiler, thumbnail review, and one-retry maximum.
- Generate visual material only. Exact titles, dates, figures, labels, logos, and source notes remain in the deterministic overlay template.
- Do not apply this preset to evidence-dense research-card bodies, dashboards, tables, charts, banker appendices, or regulatory pages.

## Photo-Derived Editorial Diptych Registered Preset

Use `photo-derived-editorial-diptych.md` when NERO asks for `摄影抽象双联画` or `照片抽象双联画`, or when a photo should remain intact as the principal layer while a restrained relationship-derived abstract panel is added below it.

- Keep `ai-image-generation` as the route; `photo-derived-editorial-diptych` is a registered method-only style/QA contract. The public generator does not bundle preset files for it.
- Generate only abstract panel material. Preserve the original photo and add exact title/subtitle text through a deterministic overlay.
- Require a 3–6 item `relation_trace`, explicit crop contract, source-photo preservation flag, adaptive photo/panel ratio, and one-retry maximum.
- Do not use it for evidence-dense cards, dashboards, tables, charts, banker appendices, regulatory pages, or a frozen manually revised artifact.
- Treat `ZzzLc0405/photo-abstract-editorial` as a method-only reference with unknown license; do not copy its Prompt, examples, or source.

## Hard Bans

- Do not ask `gpt-image-2` to produce exact Chinese body text.
- Do not ask it to render financial figures, tables, chart axis labels, company comparable data, or regulatory wording.
- Do not use generated text or generated numbers as evidence.
- Do not let generated visuals obscure source notes, chart labels, captions, or compliance language.
- Do not include API keys, private credentials, customer-sensitive evidence, or direct personal contact/payment identifiers in prompts.

## Required Workflow

1. Codex defines the brief, target format, layout hierarchy, design tokens, safe text area, and final dimensions.
2. `gpt-image-2` generates visual material under the brief.
3. Satori/Sharp, PptxGenJS, or Remotion places exact text, numbers, chart labels, source notes, and compliance wording.
4. Run visual QA for dimensions, text fit, contrast, chart readability, and evidence boundaries.

When a preset defines a stricter workflow, record its recipe, geometry, safe zones, provenance, thumbnail review, and regeneration outcome in the project-local brief and QA manifest.

## Brief Requirements

Every image brief must include:

- purpose
- audience
- final format and aspect ratio
- pixel dimensions or slide/video geometry
- visual style
- selected project visual parameters and any applicable brand/token references
- forbidden elements
- safe whitespace area
- post-production text/charts area
- negative constraints
- verification checklist

## Style Lock Addendum

For PPT covers, chapter pages, web PPT visuals, and short-video scene frames:

- Lock palette, contrast, image treatment, lens/camera metaphor, texture level, and forbidden elements.
- Define safe zones before generation, especially left text zones and right visual zones for deck chapters.
- Keep a short style-lock note with the project or artifact manifest.
- If a generated asset contains accidental text, numbers, logos, certificates, regulator names, exchange names, or source-like marks, crop, mask, blur, or regenerate before use.

## Prompt Snippet

Use the NERO Design Team ai-image-generation route. Treat gpt-image-2 as an AI Image Art Director for visual素材 only. Generate a precise brief with purpose, audience, dimensions, safe text area, selected project visual parameters, task-specific forbidden elements, and negative constraints. Exact Chinese text, financial figures, tables, charts, source notes, and formal conclusions must be added later by Satori/Sharp, PptxGenJS, or Remotion and then visually QA'd.

## Evidence-Bearing Deck Background Addendum

- Use image2 or gpt-image-2 materials only as background, cover, chapter, transition, or atmosphere assets.
- Do not accept generated Chinese text, numbers, tables, certificates, regulator names, exchange names, source notes, logos, or conclusions as final deck content.
- For evidence-led banker decks, define the image role before generation: `cover-main-visual`, `chapter-background`, or `dark-evidence-texture`.
- Require a safe text zone in the prompt. Typical chapter pages reserve the left two-thirds for HTML text and the right third for abstract texture.
- If the generated asset contains accidental text-like marks, crop, blur, mask, or regenerate before using it behind formal content.
- Record image provenance and usage boundary in the project-local design assets note; do not store customer-sensitive prompts in the global design-team asset library.
