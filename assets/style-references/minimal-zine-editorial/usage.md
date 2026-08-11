# 留白杂志风使用说明

## Status

- NERO-native fused style preset.
- Upstream rule reference: `LiamGvchi/gc-minimal-zine-poster`, MIT.
- Upstream JPEGs remain remote snapshot references and are not NERO-owned assets.
- Do not install the upstream Skill as a parallel NDT controller.

## Safe Workflow

1. Route through NDT `ai-image-generation` and ask for `留白杂志风`; the canonical preset id remains `minimal-zine-editorial`.
2. Lock one recipe tuple and one output format.
3. Generate visual material with a protected safe zone.
4. Review the subject and color anchor at thumbnail scale.
5. Regenerate at most once, only for the failed constraint.
6. Add exact text, dates, labels, figures, logos, and source notes with the deterministic overlay template.
7. Run `visual-qa.mjs` with a `minimalZine` manifest before any delivery claim.

## Generator

```text
node scripts/nero-design.mjs new ai-image-generation --preset 留白杂志风 --name <project-name> --out <target-parent-dir>

The legacy `--preset minimal-zine-editorial` command remains supported for existing projects and scripts.
```

The generated project contains the structured brief, prompt compiler, overlay template, and QA example. It does not install dependencies or invoke image generation automatically.

The overlay loads project-local NDT tokens from `theme/nero-tokens.css`. The aged-paper ground and the selected high-chroma image anchor are deliberate preset-level overrides; exact overlay text, muted metadata, and the fallback accent remain mapped to NDT tokens.

## Rights Boundary

Reference the six upstream examples for composition and QA only. Do not copy them into public or client deliverables. The NERO-native template and rules may be reused, but attribution to the upstream MIT source must remain in the style manifest.
