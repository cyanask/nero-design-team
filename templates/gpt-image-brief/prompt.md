# GPT Image Brief Prompt

Use this prompt as the first draft for `gpt-image-2`. Replace bracketed fields before generation.

```text
Create a high-quality visual asset for [purpose].

Audience: investment banking and AI industry research professionals.
Final format: [format], [width]x[height], [aspect ratio].
Visual tone: restrained, professional, evidence-first, premium research visual, not a marketing poster.
Design tokens to echo: NERO color.brand.primary #1f4e5f, color.brand.accent #c6a15b, color.surface.canvas #f5f7f8, color.text.primary #1d252c.

Composition:
- Reserve [safe area] for exact text and charts that will be added later.
- Keep the reserved area low-noise and high-contrast.
- Use visual elements that support [industry/theme], but do not create fake charts or fake dashboards.

Forbidden:
- No readable Chinese or English body text.
- No financial numbers, tables, chart axes, labels, regulatory wording, company comparable data, signatures, API keys, or private evidence.
- No random purple-blue gradients, over-rounded SaaS cards, or decorative clutter.

The image should be usable as a background or cover visual after exact text, figures, charts, and source notes are overlaid by code.
```
