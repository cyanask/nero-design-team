# LiamGvchi/gc-minimal-zine-poster Snapshot

Route: image-report, with `ai-image-generation` as the execution route
Source: https://github.com/LiamGvchi/gc-minimal-zine-poster
License status: permissive
Last reviewed: 2026-07-28

## Design Value

Use the upstream project as an attributed reference for quantitative negative-space composition, a six-axis variation recipe, a compact prompt compiler, thumbnail-scale anchor review, and one targeted regeneration.

NDT implements these patterns as `留白杂志风`; the canonical preset id remains `minimal-zine-editorial`. It does not install the upstream Skill as a parallel controller.

## Asset Boundary

- The upstream repository contains one `SKILL.md` and six generated JPEG examples, not editable production templates.
- The six JPEGs remain remote image references; no upstream image has been copied into NDT.
- Exact text, figures, labels, logos, and sources remain deterministic overlay objects.
- The local overlay template, structured brief, preset manifest, and QA gate are NERO-native adaptations.

## Call Hint

```text
node scripts/nero-design.mjs new ai-image-generation --preset 留白杂志风 --name <project-name> --out <target-parent-dir>
```

Read the local rule and style manifest before generation. Use `file-index.json` only when upstream path context is needed.
