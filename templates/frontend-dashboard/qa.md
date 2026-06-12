# Frontend Dashboard QA

- NERO design tokens are built with `npm run tokens` or `node ../../scripts/build-tokens.mjs`.
- CSS variables from `build/css/nero-tokens.css` are applied or replaced by project-local equivalents after copying.
- shadcn/ui is used as the component baseline; Carbon informs dense analytical layout; Ant Design is used only when complex enterprise tables/forms justify it.
- Desktop layout inspected.
- Mobile layout inspected.
- Text does not overflow buttons, table cells, metric cards, or navigation.
- Tables remain horizontally scrollable on narrow screens.
- Colors are not dominated by random gradients or a single decorative hue.
- Chart palettes use `chart.palette.categorical` and remain readable for Chinese labels.
- Buttons have stable dimensions and accessible labels.
- The first screen is the working interface, not a marketing page.
