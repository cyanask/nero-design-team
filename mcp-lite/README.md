# NERO Design Team MCP-lite

This directory contains a local, dependency-free MCP server for the NERO Design Team.

The Skill remains the rule and routing layer. MCP-lite is only the local tool execution layer for structured reads and existing script wrappers.

## Stable bridge (interface 2.5.0)

`server.mjs` owns the long-lived protocol and bounded process forwarding. `tool-contract.mjs` owns the stable twelve-tool names/basic schemas. They do not import NDT routing, catalogs or other business modules.

`ndt-worker.mjs` accepts one JSON request over stdin, dynamically loads `ndt-runtime.mjs` in its fresh process, calls the existing handler and returns one JSON result. The runtime reuses the existing routing, library functions and CLI scripts. Business enums are validated against current NDT code/catalogs rather than cached in the bridge schema. The bridge validates the base argument types/shape first; neither layer grants execution permission.

- **Routine NDT update:** change the canonical rules, methods, business modules or data and sync affected copies. Keep `server.mjs` and `tool-contract.mjs` unchanged. The next call over the same connection loads the updated NDT.
- **Interface update:** change a tool name, argument structure, bridge behavior or connection configuration only when needed. Bump the bridge interface and refresh/reconnect the host as appropriate.
- `mcp_server.version` is the bridge version; every successful tool result also carries `ndt_revision` with digest, scope, excluded files and a non-atomic consistency note. The digest does not cover all images, case assets, project data or live model context.
- Finish source updates between calls. This mechanism reloads code per call; it does not provide an atomic multi-file deployment, roll back side effects or rewrite an active conversation's previously loaded instructions.

Each worker accepts at most 1 MiB input, has a 120-second lifetime and a combined 16 MiB output limit; nested legacy CLI calls are bounded to 110 seconds and 8 MiB output. On POSIX, each worker owns a process group and the bridge clears that group on timeout, overflow, worker exit, disconnect and shutdown. Windows currently terminates the direct worker; descendant-tree cancellation has only been validated on the local POSIX platform. Worker stdout is a single JSON envelope; diagnostic logs use stderr. Invalid JSON, worker failures, missing revision/results and failed production readiness never become success.

stdin EOF means disconnection and cancels in-flight calls. Test/CLI clients must wait for the response before closing the channel; use `--dry-run` for a one-shot read/preview.

Bounded acceptance command: `node mcp-lite/stable-update-test.mjs`. It keeps one server PID/connection for each supported protocol, changes only temporary NDT fixtures, checks that code/rule/catalog/taxonomy updates take effect without changing `tools/list`, and checks rejection, recovery and disconnect cleanup. This does not restart or validate the user's already-running host connection.

## Server

```text
node $NERO_DESIGN_TEAM_HOME/mcp-lite/server.mjs
```

The server speaks MCP over stdio using JSON-RPC with both line-delimited JSON (NDJSON) and `Content-Length` framing.

Current Codex / GPT Work stdio MCP uses line-delimited JSON (NDJSON). `server.mjs` auto-detects the first request transport, then responds using the same transport for the rest of that session:

- Codex / GPT Work: NDJSON (`{"jsonrpc":"2.0",...}\n`)
- Legacy MCP clients: `Content-Length` framed JSON-RPC

No tool schema or tool behavior changes are required for either client mode.

The server never edits Codex configuration itself. On this workstation, the approved registration should use `command = "node"` with the server path above; hard-coding an application-bundle Node path is not portable and may point to a file that does not exist. After changing registration or server code, refresh the MCP connection in the host if supported, or reopen the host. A response carrying the expected `mcp_server.version` is the check that the active connection has loaded the new server.

`--list-tools` and `smoke-test.mjs` validate the server source directly. They do not prove that an already-running Codex session has reloaded the registration.

## Route applicability

`nero_design_route` accepts optional `task_mode: create|revise|audit` and `content_contract: standard|kat-presentation`. The caller's explicit fields take precedence over keyword fallback. Read-only audits do not recommend generation/import; interface motion stays on the frontend route. A deck brief, style lock or three-direction exploration alone does not select KAT. Frontend guidance now treats style resources as candidates and leaves numeric dials unset until a task selects them. The Skill owns reference exploration and method-card selection; MCP does not perform web/image inspection by returning metadata. Library behavior below remains compatible.

## Compatible library contract

`nero_design_get_registry({})` returns `mcp_server.version`, the live `library_contract`, and `library_summary` counts for assets, active styles and cases. These counts come from the Registry on each call; the App release, system Registry and MCP server have separate versions.

Use `include_library:true` to read asset records, cases, style manifests, exact-version prompts, previews and the catalog SHA-256 revision. `limit` and `offset` paginate assets and supporting resources; they do not paginate styles or cases. Use `style_id` with `style_version` to pin a reproducible style. `recommended_only:true` alone requests the library and returns only versions explicitly approved by NERO; candidate status is not approval. Search and facet filters apply to assets and resources, not style or case names.

MCP retains all 12 tools and existing input fields. The library tool is read-only. The installed App handles authorized maintenance through the canonical Registry service; no MCP write tool is added.

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

Architecture, sequence, state-machine, ER/data-model, swimlane, data-flow,
integration, access-matrix, organization/layer, and loop/flywheel requests are
not Figure Compiler types. `nero_design_route` returns a separate
`architecture_diagram_redraw` decision with fresh/redraw mode, source kind,
grammar, NDT rule, local extractor when applicable, and the explicit
`unchanged_nine_types` boundary. draw.io and Mermaid sources stay inert and
untrusted until reconciled with current authority.

Reports, Word/PDF, and diligence use `report-a4`; WeChat/公众号 uses `wechat-inline`; PPT/slide uses `ppt-16x9`. Report and WeChat default to `raster-canvas-png`; PPT defaults to `vector-svg`. Explicit editable/native requests return `office-native` as handoff-only and do not recommend the compiler. Covers, photography, illustration, backgrounds, and concept visuals return `recommended=false` with `ai-image-generation` as the alternative route. When `recommended=true`, `recommended_tools` includes `nero_design_compile_report_figure`.

`nero_design_compile_report_figure` wraps the central `scripts/report-figure-compiler.mjs` CLI. It accepts `action=list|validate|compile`. `list` accepts no paths or compile overrides. `validate` requires `project_root` and `spec_path` and rejects compile-only `profile`/`renderer` overrides. `compile` requires `project_root`, `spec_path`, and `output_path`, with optional `receipt_path`, `profile`, and `renderer`. Relative paths resolve from `project_root`; spec, output, and receipt paths must remain contained there. The project root must exist outside the NDT canonical root, and output or receipt paths may not resolve back into NDT through symlinks. The default `execute=false` returns only a command preview and does not write a figure, receipt, Registry record, or job state.

Dry-run preview:

```text
node $NERO_DESIGN_TEAM_HOME/mcp-lite/server.mjs --dry-run nero_design_compile_report_figure '{"action":"compile","project_root":"/path/to/project","spec_path":"specs/figure-spec.json","output_path":"exports/figure.svg","profile":"report-a4","renderer":"vector-svg","execute":false}'
```

`nero_design_generate_project` accepts `preset` when `mode="new"` and forwards it to the registered generator. `mode="init"` rejects `preset` because initialization does not copy template files.

For AI application, Agent UI, Copilot, tool-calling, generative UI or
human-confirmation frontend work, `nero_design_route` keeps the route as
`frontend-ui` and returns `frontend_profile.id="ai-app-ui"`. The response adds
`$NERO_DESIGN_TEAM_HOME/skills/nero-design-team/references/ai-app-ui.md`, the registered frontend-dashboard preset,
design-intent schema, state catalog, route-specific scorecard, fused-source
metadata and explicit design/rendered/live/human acceptance boundaries.

`nero_design_generate_project` also accepts
`frontend_profile="ai-app-ui"`. With `mode="new"`, the generator applies the
registered `ai-app-ui` preset even when `preset` is omitted. With `mode="init"`,
it records NDT rule, schema, state-catalog and scorecard references in the
project manifest without copying template files. No new MCP tool or top-level
route is added.

`nero_design_production_check` consumes the CLI's structured production result and returns `stage`, `readiness_status`, `design_contract_passed`, `ready_for_downstream`, `final_delivery_ready`, and the detailed `readiness` result. Only a passed `downstream_handoff` authorizes a caller handoff; only a passed `final_delivery` indicates final-file readiness. A process exit or design-contract pass alone authorizes neither. See `rules/production-check.md` for current-file review bindings and KAT receipt requirements.

For PPT routing, supply `project_root` or an absolute `engine_registry_path`, and an explicit `ppt_operation` where needed. The operation route is read from the current project registry. A caller's `engine_resolution` may be reused when its operation, engine and registry source digest match. Missing, ambiguous or stale inputs return pending and no primary engine; the tool never invokes an engine.

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

2026-09-08: routing advice was extracted into `routing.mjs` after repeated route changes and corrections had shared the protocol/execution file. `server.mjs` retains tool schemas, transport, handlers and write-path guards; `routing.mjs` owns task classification, reference metadata and recommendations without executing a downstream tool. The tool surface is unchanged. The extracted recommendation boundary is covered by full before/after response comparison and the existing protocol/figure-routing tests.

Keep the remaining transport/execution code cohesive. File length is a review signal, not a mandate to create more adapters or modules.

## Fallback

If MCP is unavailable, Codex should read local files directly:

- Skill rules: `$CODEX_HOME/skills/nero-design-team/references/`
- Canonical rules: `$NERO_DESIGN_TEAM_HOME/rules/`
- Tokens: `$NERO_DESIGN_TEAM_HOME/tokens/`
- Templates: `$NERO_DESIGN_TEAM_HOME/templates/`
- Case snapshots: `$NERO_DESIGN_TEAM_HOME/case-library/snapshots/`
- External restricted assets: not bundled; keep them in an explicitly private overlay
- Scripts: `$NERO_DESIGN_TEAM_HOME/scripts/`

Asset library v2.4 keeps all twelve tool names and existing Route behavior. With `include_library:true`, `nero_design_get_registry` returns `taxonomy`, `dimensions`, `categories`, `total`, `offset`, `limit`, and the matching live `assets`. Ten visual dimensions are distinct from `use_case_tags`. Pass `tags:{"component":["SVG图形"]}`, `use_case_tags:["frontend","PPT"]`, `search`, `offset`, and `limit` (1–1000). All selected values use AND semantics, including values in the same dimension. Omit pagination to retain the previous full-catalog read. Legacy query keys `graphics`, `imageTreatment`, and `usage` remain readable aliases. Register new assets through the local `ndt.asset-intake.v1` checked-revision workflow in `registry/README.md`; MCP does not gain a write tool.
