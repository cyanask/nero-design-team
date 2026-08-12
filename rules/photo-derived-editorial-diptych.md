# Photo-Derived Editorial Diptych

This registered NERO-native method/QA contract has canonical id `photo-derived-editorial-diptych` and user-facing alias `摄影抽象双联画`. The public package bundles its rule and method-only style contract, but no generator preset, Prompt, template, source photo, private case asset, or visual-baseline artifact.

## Routing

- Primary route: `ai-image-generation`.
- Secondary route: `image-report` for covers, dividers, social cards, or non-evidence editorial visuals.
- It is not an independent Skill and does not replace formal infographics, PPTX, or evidence-bearing report cards.

## Core Method

`DECONSTRUCT → SELECTIVE PRESERVATION → ABSTRACT / DISTILL → RECONSTRUCT`

1. Treat the uploaded photograph as the sole content source and identify 3–6 decisive facts: relationships, scale, axes, direction, intervals, occlusion, depth, rhythm, light, color roles, or negative space.
2. Record a `relation_trace` mapping every retained fact to a panel mark.
3. Prefer relationships over contours. Keep only the minimum identity cues for distinctive architecture or objects.
4. Reconstruct the relationships with the fewest marks so the panel reads as abstract first and photo-specific second.

Do not make a thumbnail, tracing, filter, complete illustration, generic icon, or infographic.

## Three-Layer Contract

### Original-photo layer

- Use the original photo as an independent layer.
- Default to proportional scaling; record `crop_rect`, `object_position`, and reason when cropping.
- Never ask an image model to redraw, extend, replace, retouch, or alter the photo.

### Abstract relation layer

- Prefer deterministic SVG/HTML marks. Use image generation only for the panel, never the complete work.
- Use one primary mark family and at most two supporting families.
- Every mark maps to a `relation_trace` fact.
- Use a uniform neutral ivory `#F3F0E8` panel; exclude gradients, textures, noise, shadows, glow, bands, and stains.

### Exact-text layer

- Render title text through deterministic HTML/SVG/Satori/Sharp; default to 2–5 English words.
- Use a subtitle only when it adds meaning; default to 3–7 words.
- Do not accept generated titles, numbers, locations, legends, swatches, logos, watermarks, or source-like text.

## Geometry And Color

- Landscape photo area: 38%–52% of output height.
- Portrait architecture/person photo area: 55%–68%.
- Near-square photo area: 48%–58%.
- A recorded variance of about eight percentage points is allowed when composition requires it; do not mechanically split 50/50.
- Default motif width is 30%–42% of the panel; axes, bridges, or crowds may extend to 45%–68%.
- Clean panel space is 65%–80%.
- Extract color only from the photo: one primary, one dark structural, one light/neutral, and at most one or two small accents.

## QA Contract

Record output dimensions, source-photo identity and preservation, crop contract, 3–6 `relation_trace` entries, mark families, `photo_area_ratio`, `panel_area_ratio`, `motif_width_ratio`, `clean_space_ratio`, panel uniformity, generated exact-text boundary, extra elements, thumbnail review, and retry outcome. Automatic regeneration is limited to one panel-only retry; after a second failure return `visual_not_ready`.

## Disabled When

- Exact financial, source, regulatory, or evidence-bearing text must be inside generated imagery.
- The output is an evidence-dense report card, dashboard, form, table, chart, banker appendix, or frozen manually revised artifact.
- The user asks to copy upstream examples, source, or unlicensed assets.

## Source Boundary

This method-only adaptation was inspired by `ZzzLc0405/photo-abstract-editorial`. The upstream license is unknown; its Prompt, examples, and source are not bundled or used as NDT/client assets.
