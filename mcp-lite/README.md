# NERO Design Team MCP-lite

This directory contains a local, dependency-free MCP server for the NERO Design Team.

The Skill remains the rule and routing layer. MCP-lite is only the local tool execution layer for structured reads and existing script wrappers.

## Server

```text
node $NERO_DESIGN_TEAM_HOME/mcp-lite/server.mjs
```

The server speaks MCP over stdio using JSON-RPC with both line-delimited JSON (NDJSON) and `Content-Length` framing.

Current Codex / GPT Work stdio MCP uses line-delimited JSON (NDJSON). `server.mjs` auto-detects the first request transport, then responds using the same transport for the rest of that session:

- Codex / GPT Work: NDJSON (`{"jsonrpc":"2.0",...}\n`)
- Legacy MCP clients: `Content-Length` framed JSON-RPC

No tool schema or tool behavior changes are required for either client mode.

The server never edits Codex configuration itself. On this workstation, the approved registration should use `command = "node"` with the server path above; hard-coding an application-bundle Node path is not portable and may point to a file that does not exist. Restart Codex after changing MCP configuration so the app can rediscover the tools.

`--list-tools` and `smoke-test.mjs` validate the server source directly. They do not prove that an already-running Codex session has reloaded the registration.

## Tool Schemas

```text
node $NERO_DESIGN_TEAM_HOME/mcp-lite/server.mjs --list-tools
```

## Protocol Smoke Test

```text
node $NERO_DESIGN_TEAM_HOME/mcp-lite/smoke-test.mjs
```

The smoke test starts the server twice and verifies `initialize`, `tools/list`, and a real `nero_design_route` call over both NDJSON and `Content-Length` framing.

Focused Figure Compiler protocol and path-boundary test:

```text
node $NERO_DESIGN_TEAM_HOME/mcp-lite/report-figure-compiler-test.mjs
```

This test uses MCP NDJSON for authorized execution; it does not use `--dry-run` as an execution bypass.

To validate the actual Codex registration command and arguments:

```text
node $NERO_DESIGN_TEAM_HOME/mcp-lite/smoke-test.mjs --codex-config $CODEX_HOME/config.toml
```

## Dry Run

```text
node $NERO_DESIGN_TEAM_HOME/mcp-lite/server.mjs --dry-run nero_design_get_tokens '{"token_sets":["colors"],"include_build_outputs":true}'
```

`--dry-run` is preview-only. It forces `execute=false` and rejects an explicit `execute=true`; real execution is available only through an MCP protocol call with the strict boolean `execute:true`.

## Tools

- `nero_design_route`
- `nero_design_get_registry`
- `nero_design_get_tokens`
- `nero_design_list_templates`
- `nero_design_get_case_snapshot`
- `nero_design_import_github_case`
- `nero_design_build_tokens`
- `nero_design_generate_project`
- `nero_design_compile_report_figure`
- `nero_design_visual_qa`
- `nero_design_score`
- `nero_design_production_check`

`nero_design_get_registry` reads the authoritative local Registry contract and returns its truth domains, downstream-copy boundary, verification contract, canonical asset count, and explicitly tracked integrity issues. It does not treat Registry completeness as runtime or production maturity.

`nero_design_route` returns a structured `figure_compiler` decision for every natural-language task: `recommended`, `reason`, `business_family`, `figure_type`, `profile`, `renderer`, `missing_inputs`, and `tool`, plus `alternative_route` when the compiler is not suitable. The nine supported figure intentions are:

- `flow`: 产业链、业务流程、传导链
- `hierarchy`: 分类层级、产品边界
- `timeline`: 时间轴、产能爬坡
- `funnel`: 漏斗、阶段门
- `bar`: 市场规模、柱图
- `line`: 趋势、折线
- `participant_map`: 参与者地图、竞争格局
- `matrix`: 同业画像、指标矩阵
- `value_chain`: 价值链、利润分布

Reports, Word/PDF, and diligence use `report-a4`; WeChat/公众号 uses `wechat-inline`; PPT/slide uses `ppt-16x9`. Report and WeChat default to `raster-canvas-png`; PPT defaults to `vector-svg`. Explicit editable/native requests return `office-native` as handoff-only and do not recommend the compiler. Covers, photography, illustration, backgrounds, and concept visuals return `recommended=false` with `ai-image-generation` as the alternative route. When `recommended=true`, `recommended_tools` includes `nero_design_compile_report_figure`.

`nero_design_compile_report_figure` wraps the central `scripts/report-figure-compiler.mjs` CLI. It accepts `action=list|validate|compile`. `list` accepts no paths or compile overrides. `validate` requires `project_root` and `spec_path` and rejects compile-only `profile`/`renderer` overrides. `compile` requires `project_root`, `spec_path`, and `output_path`, with optional `receipt_path`, `profile`, and `renderer`. Relative paths resolve from `project_root`; spec, output, and receipt paths must remain contained there. The project root must exist outside the NDT canonical root, and output or receipt paths may not resolve back into NDT through symlinks. The default `execute=false` returns only a command preview and does not write a figure, receipt, Registry record, or job state.

Dry-run preview:

```text
node $NERO_DESIGN_TEAM_HOME/mcp-lite/server.mjs --dry-run nero_design_compile_report_figure '{"action":"compile","project_root":"/path/to/project","spec_path":"specs/figure-spec.json","output_path":"exports/figure.svg","profile":"report-a4","renderer":"vector-svg","execute":false}'
```

`nero_design_generate_project` accepts `preset` when `mode="new"` and forwards it to the registered generator. `mode="init"` rejects `preset` because initialization does not copy template files.

`nero_design_production_check` returns `readiness_status` (`pass`, `review`, or `fail`) and `ready_for_downstream`. A successful process exit with `readiness_status=review` is not permission to invoke a downstream engine.

In v1.8, `nero_design_route` returns PPT-specific `ppt_subroute`, `primary_engine`, and `secondary_rules` for PPT tasks. For `web-ppt-html`, it returns Guizang Refresh metadata plus the v1.8 presentation harness references: Huashu HTML-native harness, Frontend Slides fixed-stage style discovery, and PPT Master production/spec-lock discipline.

It also returns fused Impeccable/Taste reference metadata for `frontend-ui` and frontend-oriented `visual-audit` tasks.

It returns fused Effective HTML metadata for `frontend-ui`, `visual-audit`, and HTML/web-PPT tasks that benefit from self-contained HTML artifacts, SVG-first diagrams, visual plan pages, or no-build single-file explainers.

It returns `presentation_harness_fusion_v1_8` metadata for `frontend-ui`, `ppt`, `short-video`, `visual-audit`, and `case-library` tasks that need external design-reference context. These entries are reference-only and do not install upstream runtimes or copy upstream assets.

For project integration tasks, route to `project-integration` and use `nero_design_generate_project` with `mode="init"` to create a project-local `.nero-design/manifest.json` without copying a full template.

## Boundaries

- No API keys, tokens, cookies, or secrets are stored here.
- No global dependency install is required.
- GitHub case import is dry-run by default; `execute=true` runs the existing lightweight importer.
- Project generation is dry-run by default; `execute=true` creates local files through the existing generator.
- Figure compilation is dry-run by default; `execute=true` invokes the central Node CLI directly, without a job queue or Registry write.
- The MCP server does not judge aesthetics, investment-banking wording, license legality, or factual evidence. Codex plus the Skill must still review those.

## Module Health Decision

`module_health_decision=keep_cohesive`. The 800+ line server was reviewed during the Figure Compiler integration. The new capability reuses the existing handler registry, `commandPreview`, and single script-execution seam; project-path helpers only guard that seam. It does not introduce a second execution authority, job queue, database, Registry writer, or background service. Focused MCP protocol tests cover strict execution booleans, dry-run non-execution, project containment and symlink-aware write boundaries, real temporary SVG/receipt compilation, and generator preset propagation. This evidence supports keeping one dependency-free stdio server without an unrelated refactor.

## Fallback

If MCP is unavailable, Codex should read local files directly:

- Skill rules: `$CODEX_HOME/skills/nero-design-team/references/`
- Canonical rules: `$NERO_DESIGN_TEAM_HOME/rules/`
- Tokens: `$NERO_DESIGN_TEAM_HOME/tokens/`
- Templates: `$NERO_DESIGN_TEAM_HOME/templates/`
- Case snapshots: `$NERO_DESIGN_TEAM_HOME/case-library/snapshots/`
- External restricted assets: not bundled; keep them in an explicitly private overlay
- Scripts: `$NERO_DESIGN_TEAM_HOME/scripts/`
