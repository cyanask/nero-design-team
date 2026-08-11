# High-Resolution Raster Report Figure QA

- Select `raster-canvas-png` explicitly for the current figure family; do not persist it as a global default.
- Render with Python/Pillow to RGB PNG at 300 DPI and at least 2,100 px width.
- Keep title, subtitle, body, label, and source typography at or above the preset floors.
- Split or lengthen dense figures instead of shrinking text.
- Treat any canvas overflow, card overflow, text collision, missing Chinese font, or undersized type as a hard failure.
- Keep one primary cognitive task per figure.
- Keep quantitative tables and editable data charts in native Office form when appropriate.
- Match image content to caption, sequence, period, unit, and source after embedding.
- Do not repeat the source below the figure when the same source already appears inside it.
- Place explanatory prose between adjacent evidence-bearing figures in the final document.
