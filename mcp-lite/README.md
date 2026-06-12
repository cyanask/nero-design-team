# NERO Design Team MCP-lite

This directory contains a local, dependency-free MCP server for the NERO Design Team.

The Skill remains the rule and routing layer. MCP-lite is only the local tool execution layer for structured reads and existing script wrappers.

## Server

```text
node $NERO_DESIGN_TEAM_HOME/mcp-lite/server.mjs
```

The server speaks MCP over stdio using JSON-RPC messages with `Content-Length` framing.

Current Codex registration has not been modified by default. If a Codex MCP configuration is needed, register this command explicitly after approval.

## Tool Schemas

```text
node $NERO_DESIGN_TEAM_HOME/mcp-lite/server.mjs --list-tools
```

## Dry Run

```text
node $NERO_DESIGN_TEAM_HOME/mcp-lite/server.mjs --dry-run nero_design_get_tokens '{"token_sets":["colors"],"include_build_outputs":true}'
```

## Tools

- `nero_design_route`
- `nero_design_get_tokens`
- `nero_design_list_templates`
- `nero_design_get_case_snapshot`
- `nero_design_import_github_case`
- `nero_design_build_tokens`
- `nero_design_generate_project`
- `nero_design_visual_qa`
- `nero_design_score`
- `nero_design_production_check`

In v1.6, `nero_design_route` returns PPT-specific `ppt_subroute`, `primary_engine`, and `secondary_rules` for PPT tasks. For `web-ppt-html`, it also returns Guizang Refresh metadata: restricted license boundary, local snapshot, local asset pack, NERO validator, and Swiss/web PPT quality gates.

It also returns fused Impeccable/Taste reference metadata for `frontend-ui` and frontend-oriented `visual-audit` tasks.

It returns fused Effective HTML metadata for `frontend-ui`, `visual-audit`, and HTML/web-PPT tasks that benefit from self-contained HTML artifacts, SVG-first diagrams, visual plan pages, or no-build single-file explainers.

For project integration tasks, route to `project-integration` and use `nero_design_generate_project` with `mode="init"` to create a project-local `.nero-design/manifest.json` without copying a full template.

## Boundaries

- No API keys, tokens, cookies, or secrets are stored here.
- No global dependency install is required.
- GitHub case import is dry-run by default; `execute=true` runs the existing lightweight importer.
- Project generation is dry-run by default; `execute=true` creates local files through the existing generator.
- The MCP server does not judge aesthetics, investment-banking wording, license legality, or factual evidence. Codex plus the Skill must still review those.

## Fallback

If MCP is unavailable, Codex should read local files directly:

- Skill rules: `$CODEX_HOME/skills/nero-design-team/references/`
- Tokens: `$NERO_DESIGN_TEAM_HOME/tokens/`
- Templates: `$NERO_DESIGN_TEAM_HOME/templates/`
- Case snapshots: `$NERO_DESIGN_TEAM_HOME/case-library/snapshots/`
- External restricted assets: `$NERO_DESIGN_TEAM_HOME/assets/external/`
- Scripts: `$NERO_DESIGN_TEAM_HOME/scripts/`
