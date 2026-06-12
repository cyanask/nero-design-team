# PPTX Deck QA

- NERO design tokens are built with `npm run tokens` or `node ../../scripts/build-tokens.mjs`.
- The deck imports `build/themes/pptx-theme.mjs` or a project-local copy of the same theme.
- Generated `.pptx` file exists and has nonzero size.
- Cover, section divider, and data slide use consistent typography and grid.
- Tables have readable headers and enough cell padding.
- All real figures include source notes or traceable references.
- Chart colors use `chart.palette.categorical` and remain readable in presentation mode.
- Any gpt-image-2 visual is used as cover/section/background material only; exact text and figures are placed by PPTX code.
- No final deck contains placeholder or sample conclusions.
