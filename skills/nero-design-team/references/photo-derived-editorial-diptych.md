# Photo-Derived Editorial Diptych

This is a registered NERO-native preset, canonical id `photo-derived-editorial-diptych`, user-facing alias `摄影抽象双联画`. Its reusable rule, template, prompt, style-pack, and case contracts are registered as part of the NDT asset system.

## Routing

- Primary route: `ai-image-generation`.
- Secondary route: `image-report` for covers, dividers, social cards, or non-evidence editorial visuals.
- Do not install it as an independent Skill or treat it as a replacement for NERO Design Team, formal infographics, PPTX, or evidence-bearing report cards.

## Core method

Use:

`DECONSTRUCT → SELECTIVE PRESERVATION → ABSTRACT / DISTILL → RECONSTRUCT`

1. Treat the uploaded photograph as the sole content source and identify 3–6 decisive facts: subject relationships, scale, axes, direction, intervals, occlusion, depth, rhythm, light, color roles, or negative space.
2. Record a `relation_trace` mapping every retained fact to a panel mark.
3. Prefer relationships over contours. Keep only the minimum identity cues needed for distinctive architecture or objects.
4. Reconstruct the relationships with the fewest marks so the panel reads as abstract first and photo-specific second.

Do not make a thumbnail, tracing, filter, complete illustration, generic icon, or infographic.

## Three-layer contract

### Original-photo layer

- Use the original photograph as an independent layer.
- Default to proportional scaling; record `crop_rect`, `object_position`, and the reason whenever cropping is needed.
- Never ask an image model to redraw, extend, replace, retouch, or alter the photograph.

### Abstract relation layer

- Prefer deterministic SVG/HTML marks. Use image generation only for an abstract panel, never for the complete work.
- Use one primary mark family and no more than two supporting families.
- Every mark must map to a `relation_trace` fact.
- Keep the panel background uniform neutral ivory `#F3F0E8`; exclude gradients, textures, noise, shadows, glow, bands, and stains.

### Exact-text layer

- Render the English title through deterministic HTML/SVG/Satori/Sharp; default to 2–5 words.
- Use a subtitle only when it adds meaning; default to 3–7 words.
- Do not accept generated titles, numbers, locations, legends, swatches, logos, watermarks, or source-like text from raster output.

## QA contract

Record output dimensions, source-photo preservation, crop contract, a 3–6 item `relation_trace`, geometry ratios, mark-family counts, panel uniformity, exact-text boundary, extra elements, thumbnail review, and retry outcome. Automatic regeneration is limited to one panel-only retry; after a second failure return `visual_not_ready`.

## Disabled when

- Exact financial, source, regulatory, or evidence-bearing text must be inside generated imagery.
- The output is an evidence-dense report card, dashboard, form, table, chart, banker appendix, or frozen manually revised artifact.
- The user asks to copy upstream examples, source, or unlicensed assets.

## Source boundary

This rule is a method-only adaptation inspired by `ZzzLc0405/photo-abstract-editorial`. The upstream license is unknown; do not copy its Prompt, examples, or source into the public package or client deliverables.
