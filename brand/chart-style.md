# NERO Chart Style

Use for charts in frontend UI, image reports, PPTX decks, and short videos.

## Defaults

- Palette: `chart.palette.categorical`.
- Axis label: `chart.axis.label`.
- Grid line: `chart.axis.grid`.
- Annotation: `chart.annotation`.
- Font: Chinese labels use `font.cn.body`; English labels use `font.en.body`.

## Required Evidence Fields

- Metric name.
- Unit.
- Period.
- Denominator when relevant.
- Source note or traceable source path.

## Bans

- No fake chart axes in generated images.
- No decorative shapes that change data geometry.
- No chart without readable labels at final output size.
- No unverified figures in final visual artifacts.
