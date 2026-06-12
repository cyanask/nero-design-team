# Report Card Image QA

- NERO design tokens are built with `npm run tokens` or `node ../../scripts/build-tokens.mjs`.
- The render script imports `build/themes/report-theme.mjs` or a project-local copy of the same theme.
- Export width and height are explicit.
- Chinese font is provided through `NERO_DESIGN_FONT` or `assets/fonts`.
- Output file exists and has nonzero size.
- Key metric has unit, period, and source note when using real data.
- Chart labels and source notes are readable at final size.
- Colors are not dominated by a single hue family unless the brief requires a monochrome treatment.
- Any AI-generated background is composited behind exact text, numbers, and charts.
- No fake data is left in a final report.
