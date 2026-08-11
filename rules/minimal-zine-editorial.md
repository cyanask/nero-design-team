# 留白杂志风规则

Use this rule when a cover, article opener, chapter divider, social card, or concept visual needs a quiet paper-zine language with large negative space, one compact subject cluster, restrained typography, and one visible high-chroma anchor.

This is a NERO-native fused preset derived from `LiamGvchi/gc-minimal-zine-poster`. It is not an independent Skill, runtime, brand pack, or source of factual evidence.

`留白杂志风` is the user-facing name and invocation alias. `minimal-zine-editorial` remains the canonical preset id for manifests, file paths, and backward compatibility.

## Routing

- Primary route: `ai-image-generation`; ask for `留白杂志风`, which resolves to canonical preset `minimal-zine-editorial`.
- Secondary routes: `image-report` covers and dividers, `ppt` or `web-ppt-html` covers and chapter pages.
- Keep evidence-dense report bodies, dashboards, tables, charts, and regulatory pages on their normal NDT routes.
- Generate background or subject material first; add exact text, numbers, labels, logos, and source notes later with deterministic HTML/SVG, Satori/Sharp, Presentations, or Remotion.

## Use For

- WeChat or essay covers where one visual metaphor can carry the theme.
- Research-report covers and section dividers without evidence-bearing text inside the generated image.
- PPT or web-PPT chapter visuals with a protected text-safe zone.
- Social cards that need a quiet editorial rather than commercial-advertising tone.
- Early style exploration before a coded NERO-native template is finalized.

## Disabled When

- Exact financial figures, tables, chart labels, source notes, regulatory wording, or formal conclusions must appear inside the raster image.
- The page is an evidence-dense research card, operational dashboard, form, table, or banker appendix.
- The output would directly reuse an upstream example image as public or client-facing material.
- The style would override an approved brand system, mature deck benchmark, or manually revised canonical artifact.
- The task would install the upstream Skill as a parallel NDT entrypoint.

## Style Language

Default visual contract:

- Canvas: `poster-3x5`, `social-4x5`, `social-1x1`, or `slide-16x9`.
- Negative space: target `0.70-0.90` of the canvas.
- Subject cluster: target `0.08-0.25` of the canvas and keep it away from unsafe edges.
- Image anchor: one object, fragment, cutout, silhouette, photo crop, specimen, printed illustration, texture window, or small conceptual relation.
- Typography: serif, typewriter, or monospaced exact text in the deterministic overlay layer; generated microtext may only be non-evidence texture and should be removed when it resembles facts or labels.
- Color: one high-chroma anchor supported by paper, gray, and black. Target either `0.008-0.025` of the full canvas or `0.15-0.35` of the subject cluster.
- Reproduction: matte paper, diffuse light, flat scan, xerox softness, risograph grain, halftone degradation, letterpress bleed, scan noise, paper fibers, or slight misregistration.
- Mood: quiet, archival, diary-like, distant, memory-like, restrained editorial.

Avoid full-bleed scenes, advertising headline stacks, logo lockups, CTA treatment, glossy mockups, cinematic lighting, 3D depth, neon, cute-cartoon language, dense scrapbooks, and long generated text blocks.

## Variation Engine

Select and record exactly one value from each axis:

- Layout: `center-fragment`, `lower-left-float`, `upper-right-block`, `dual-panel`, `irregular-cutout`, `type-led`, `dot-orbit`, `single-specimen`.
- Anchor: `faded-photo`, `torn-clipping`, `flat-silhouette`, `solid-color-block`, `printed-illustration`, `object-specimen`, `geometric-overlay`, `texture-window`.
- Typography: `floating-fragments`, `edge-pressed-phrase`, `archive-microtext`, `diagonal-words`, `ghost-text`, `letterpress-object`, `text-in-block`, `almost-textless`.
- Texture: `xerox`, `risograph`, `letterpress`, `halftone`, `film-grain`, `scan-noise`, `paper-mottling`, `selective-motion-blur`.
- Mood: `quiet`, `summer`, `solitude`, `childhood`, `seaside`, `afternoon`, `night`, `memory`, `slight-surrealism`.
- Accent: choose one explicit high-chroma hue and material form.

Do not repeat the same full recipe tuple within the three most recent visible outputs. Content fit outranks random novelty; when the metaphor is weak, change the anchor before adding more objects.

## Prompt Compiler

Compile the image prompt into four compact paragraphs:

1. Canvas, paper surface, negative-space target, cluster size, location, and protected safe zone.
2. One content-derived visual metaphor, anchor type, and paper/print treatment.
3. Accent hue, material form, visual share, sparse typographic texture, and reproduction defects.
4. Flat scanned mood, hard avoids, and the instruction that exact text and data remain outside the generated image.

Return the final prompt, selected recipe, output geometry, safe-zone contract, provenance note, and QA manifest path with the generated visual material.

## Generation Control

1. Create the brief and lock one recipe before generation.
2. Generate one image using the selected geometry and safe-zone contract.
3. Inspect at thumbnail scale.
4. Require the subject cluster and high-chroma anchor to remain visible without zooming.
5. If the anchor is absent, washed out, imperceptible, or the safe zone is contaminated, tighten only the failed constraint and regenerate once.
6. Never automatically regenerate more than once. If the second result still fails, return `visual_not_ready` and the failed gate.
7. Record whether the recipe duplicates any of the three most recent visible outputs.

## Deterministic Overlay

- Generated raster content is a background or subject layer only.
- Exact Chinese and English titles, dates, names, figures, labels, logos, captions, source notes, and compliance language must remain editable HTML/SVG, Office, or code-rendered objects.
- Use the NERO-native overlay template shipped with the preset for `poster-3x5`, `social-4x5`, `social-1x1`, and `slide-16x9`.
- Crop, mask, blur, or regenerate accidental source-like text, numbers, signatures, exchange names, certificates, and logos before compositing.

## QA Contract

For `留白杂志风` (canonical preset `minimal-zine-editorial`), the visual QA manifest must include:

- registered output format and dimensions;
- negative-space and subject-cluster ratios;
- selected recipe tuple;
- color-anchor canvas or cluster share;
- thumbnail anchor visibility and washout judgment;
- recent-recipe duplicate judgment;
- regeneration attempts and outcome;
- confirmation that exact text was not accepted from the generated raster layer.

Static manifest checks do not prove aesthetic readiness. Final browser/render comparison or a real generated A/B sample remains a representative validation step.

## Source And Rights Boundary

- Upstream: `https://github.com/LiamGvchi/gc-minimal-zine-poster`.
- Upstream repository license: MIT; retain attribution when substantial rule text is reused.
- The six upstream JPEG examples stay as remote snapshot references. They are not copied into NDT, not NERO-owned assets, and not cleared client-delivery material.
- NERO-native rules, structured presets, overlay templates, and QA gates created from the abstracted pattern may be reused under NDT governance.
