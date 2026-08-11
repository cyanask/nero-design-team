# NERO Design Team

Agent-native design system for Codex-style coding agents.

NERO Design Team is a lightweight design operating system for frontend UI, image-style reports, deterministic report figures, PPT/PPTX decks, web PPT/HTML decks, short videos, AI-image briefs, visual QA, visual scoring, and production checks.

It is not a component library alone. It combines:

- Codex Skill routing rules
- design tokens
- reusable templates
- GitHub case snapshots
- local MCP-lite tool schemas
- generator, QA, score, and production-check scripts
- open-source-safe profile and brand examples

## What It Is For

- Turn a phrase like `设计团队` or `design team` into a structured design workflow.
- Keep design decisions grounded in tokens, templates, cases, QA gates, and output checks.
- Give AI agents a stable local reference layer instead of repeatedly opening large repositories.
- Separate public reusable design-system logic from private client, brand, or project material.

## Install

Clone the repository, then run:

```bash
node install.mjs
```

The installer copies the Skill to:

```text
$CODEX_HOME/skills/nero-design-team/
```

If `CODEX_HOME` is not set, it defaults to `~/.codex`.

After installation, add the snippet from `AGENTS.template.md` to your global or project `AGENTS.md` so Codex can route design-related requests to this Skill.

## Quick Check

```bash
node doctor.mjs
node scripts/build-tokens.mjs
node scripts/nero-design.mjs list
node mcp-lite/server.mjs --list-tools
node mcp-lite/smoke-test.mjs
node mcp-lite/report-figure-compiler-test.mjs
node release-check.mjs
```

## Core Routes

- `frontend-ui`
- `image-report`
- `ppt`
- `short-video`
- `ai-image-generation`
- `case-library`
- `visual-audit`
- `visual-score`
- `production-check`

## Figure Compiler v0.2

The `image-report` route includes a deterministic Figure Compiler for one evidence-bearing explanatory figure. It supports:

- nine figure types: flow, hierarchy, timeline, funnel, bar, line, participant map, matrix, and value chain;
- `report-a4`, `wechat-inline`, and `ppt-16x9` profiles;
- SVG output without Pillow;
- high-resolution PNG output when Python and Pillow are available;
- project-local Figure Specs and compile receipts, without a database or job service.

The compiler creates a candidate only. It does not promote, embed, commit, or publish a figure, and it does not replace native Office objects when true editability is required.

## Repository Layout

```text
skills/nero-design-team/      Codex Skill entrypoint and references
mcp-lite/                     local MCP-lite server and dry-run examples
rules/                        route rules and QA rules
tokens/                       design-token source files
templates/                    minimal project templates
scripts/                      generator, importer, QA, score, checks
tools/runtime/                deterministic local runtimes, including Figure Compiler
registry/                     machine-readable role and route index
case-library/snapshots/       lightweight GitHub reference snapshots
brand/                        open-source-safe default profile assets
profiles/                     profile examples and overlay guidance
docs/                         packaging and boundary docs
```

## Private Overlay Pattern

Keep private or client-specific material out of the public repository.

Recommended private overlay:

```text
nero-design-team-private/
  profiles/<your-profile>/
  assets/private/
  case-library/assets/
  validation/private/
```

Public snapshots should store summaries, license notes, file paths, and image URLs only. Do not store full cloned repositories, client evidence, credentials, private screenshots, private identity references, or third-party restricted assets.

## AI Image Boundary

Use AI image generation as an art-direction tool for visual material only. Exact body text, financial figures, tables, chart labels, source notes, and formal conclusions must be layered and verified outside the image model.

## License

This project is released under the Apache License 2.0. See `LICENSE` and `LICENSE-NOTES.md`.
