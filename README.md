# NERO Design Team 3.0

<img src="docs/assets/ndt-hero.svg?v=system-only" width="100%" alt="NDT 3.0: design asset management system and Skill">

English · [简体中文](README.zh-CN.md) · Apache License 2.0

NERO Design Team (NDT) is a design asset management system and companion Skill for coding agents. It provides classification, discovery, reuse, style versioning, task routing and design QA.

**Only the system and Skill are open source. NERO's asset, case and style library contents are not distributed. All three libraries start empty.**

## Three libraries, one system

| Library | Manages | Included here |
|---|---|---|
| Assets | Reusable resources, metadata, provenance and usage boundaries | Empty catalog and management mechanisms |
| Cases | Completed work, design decisions and QA records | Empty indexes and management mechanisms |
| Styles | Style definitions, applicability and version history | Empty index and management mechanisms |

Recipes organize reuse; they are not a fourth library. NERO's personal styles, finished designs, case snapshots and library previews are not bundled.

## What's included

- Skill: design-task interpretation, routing, tool use and visual QA.
- Management tools: asset discovery, case indexing, style versioning and reference boundaries.
- Frontend source: a local read-only browser for connected catalogs and source state.
- Runtime and checks: MCP, generators, deterministic figure tools, QA and release checks.
- Development support: schemas, default interface styles, minimal code templates and synthetic test fixtures. These support the software; they are not NERO's three libraries.

The public frontend does not include library editing, upload or deletion controls. Software and web UI work is desktop-only. Portrait editorial images and vertical videos remain supported media outputs.

## Quick start

```bash
git clone https://github.com/cyanask/nero-design-team.git
cd nero-design-team
node install.mjs
node doctor.mjs
```

Adopt the routing instructions in [AGENTS.template.md](AGENTS.template.md) as needed, then ask your agent for design work. An empty library must not be represented as retrieved or adopted resources.

Run the read-only frontend:

```bash
cd frontend
npm ci
npm run snapshot:sync -- --ndt-home ..
npm run dev
```

`npm run demo` uses a separate synthetic fixture, not NERO library content. See the [frontend guide](frontend/README.md).

## Documentation

[Distribution boundary](docs/oss-boundary.md) · [Private libraries](docs/private-overlay.md) · [Registry](registry/README.md) · [Skill](skills/nero-design-team/SKILL.md) · [MCP](mcp-lite/README.md) · [Contributing](CONTRIBUTING.md)

Run `npm run release:check` for distribution, licensing and empty-library checks; run `node doctor.mjs` for tool-contract checks.

## Versions and license

The current 3.0 distribution contains the system and Skill, not a resource bundle. Historical commits and older tags may still contain earlier material; empty current libraries do not mean history has been purged.

Code uses [Apache License 2.0](LICENSE). The license version is independent of the product version and does not license your own library contents. See [license notes](docs/LICENSE-NOTES.md).
