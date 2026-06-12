# Remotion Short Video QA

- NERO design tokens are built with `npm run tokens` or `node ../../scripts/build-tokens.mjs`.
- The composition imports `build/themes/remotion-theme.ts` or a project-local copy of the same theme.
- Aspect ratio is explicit.
- FPS and duration are explicit.
- Test frame can be exported with `npm run still` after local dependencies are installed.
- Key frames are inspected before final export.
- Captions fit within mobile-safe width.
- Colors are not dominated by a single decorative hue and remain legible in compressed video.
- Charts remain readable after motion, transition, and final export compression.
- Any gpt-image-2 background or scene image is frame-checked after exact captions and data overlays are added.
- Data and claims are source-backed before final rendering.
- Remotion license requirements are checked before commercial use.
