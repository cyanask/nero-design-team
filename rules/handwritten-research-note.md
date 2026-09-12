# 手写风格规则

`手写风格` maps to the NDT canonical style preset `editorial-handwritten-research-note@1.x`.

This is a cross-format editorial notation system. It may change expression and visual treatment, but it does not change evidence authority, factual verification, financial caliber, regulatory wording, or formal output ownership.

## Core contract

- Lead with the conclusion.
- Keep one primary judgment per line or visual block.
- Use warm paper, black ink, restrained yellow marker, and green deterministic data traces.
- Apply the handwriting treatment to the text, numerals, and chart geometry themselves; the style is not an annotation-only skin.
- In strict mode, CJK must resolve to genuine handwriting families such as `Hannotate SC` / `HanziPen SC`; Kaiti, Songti, Xingkai, PingFang, and generic serif fallback are prohibited.
- Treat handwritten marks as attention guidance, never as evidence.
- Keep exact text, numbers, chart labels, dates, units, source notes, and compliance wording in deterministic layers.
- Preserve a quiet professional rhythm; avoid childish doodles, scrapbook density, or decorative noise.

## Adapters

- `response`: short clauses, deliberate line breaks, sparse annotation syntax, explicit uncertainty and next step. The chat renderer may not expose custom font or marker backgrounds.
- `image-report`: HTML/CSS/SVG or programmatic layers; text and numerals use the registered handwritten treatment, while bars, axes, and curves use deterministic hand-drawn vector geometry. Marker, circle, underline, and strike-through remain separate annotation overlays.
- `web-ppt-html`: NERO-native CSS variables and inline SVG for the declared desktop stage.
- `ppt`: the current project's operation route owns formal editable PPTX production; use native text, chart, and vector annotation objects. NERO Principal routes new formal production to `ppt-master-native-pptx` and existing/template work to Presentations.
- `frontend-ui`: use the style for explanations, guided evidence reading, or empty states, not dense operational chrome.

## Hard boundaries

- Do not use for formal regulatory filing pages, dense banker appendices, or audit schedules unless the project explicitly approves a restrained annotation derivative.
- Do not let generated raster carry exact text, financial figures, tables, chart axes, source notes, or regulatory wording.
- Do not bundle external fonts or source images into NDT.
- Do not call a project `visual_ready` until its own visual, declared desktop-size, font, and output-engine QA passes.

## Required reference

Use the registered `editorial-handwritten-research-note` style contract and its strict-handwriting master contract; keep any project-specific examples and local font paths outside the public package.
