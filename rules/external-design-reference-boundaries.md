# External Design Reference Boundaries

Use this rule whenever NERO Design Team references a third-party repository, skill, template, screenshot, visual system, or design asset.

## Default Position

External projects are fused references, lightweight snapshots, prompt/rule inspirations, QA examples, or case-library candidates. They are not NERO-owned brand assets, installed runtimes, factual evidence, license clearance, or replacements for NERO Design Team routing and formal Office production.

## Allowed By Default

- Store repository URL, route, purpose, license conclusion, README summary, small image URL list, and key file path index.
- Extract rules, constraints, workflow ideas, page taxonomy, QA gates, and prompt structure.
- Use screenshots or upstream images as private visual references only when the license and context allow.
- Read specific files only when a task names them and the license/use boundary is clear.

## Not Allowed By Default

- Clone full repositories or install global dependencies.
- Copy source code, templates, SVG/PPTX examples, media, audio, logos, screenshots, or design assets wholesale.
- Write `.env`, API keys, provider configs, cookies, tokens, or credentials.
- Enable external TTS, image search, watermark removal, deployment, analytics, or background services.
- Treat upstream sample copy, generated data, or demo visuals as NERO facts.

## License Handling

- `permissive`: rules and small metadata can be referenced; brand and asset copying still requires a task-specific need and license check.
- `restricted`: metadata-only in the public package; use only for internal learning, QA examples, or separately cleared private drafts.
- `unknown`: metadata-only candidate; do not use assets or code in production.

Snapshot license status is a lightweight signal, not a legal opinion.

## gpt-image-2 Boundary

- External visual references may inform style briefs.
- Do not put customer-sensitive material, secrets, exact financial tables, regulatory text, or direct personal/payment identifiers into image prompts.
- Generated images remain visual material; exact text, data, labels, and conclusions are overlaid later by code or Office tooling.

## Promotion Policy

Promote only reusable, NERO-native abstractions back into `rules/`, `tokens/`, `templates/`, `prompts/`, or `case-library/`. Do not promote external assets into `brand/` or `assets/` as owned materials without source, license, and explicit approval.

## Completion Gate

When an external reference materially affects a deliverable, report the repository or snapshot, license status, extracted pattern, excluded material, and remaining license or validation risk.
