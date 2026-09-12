# Stable MCP bridge and current NDT execution

Use only the tool needed by the task. NDT owns design judgment and task-size decisions; the caller owns progression and permissions. Web discovery, image viewing and rendering remain the actual tools described in [reference exploration](reference-exploration.md).

## Update boundary

The configured entry remains `$NERO_DESIGN_TEAM_HOME/mcp-lite/server.mjs`. Bridge interface 2.5.0 retains the twelve tool names and basic argument structures. The long-lived bridge loads only its fixed protocol/tool contract. Every tool call starts a short-lived NDT worker which reads the current business code, rules and catalogs, then exits.

- Routine updates to NDT rules, methods, supported business values, catalogs and execution logic do not require reconnecting this bridge while the interface is compatible.
- Initial migration from the older embedded implementation requires one reconnect. Changes to tool names/argument structure, the bridge itself or connection settings still need the corresponding interface refresh/reconnect.
- `mcp_server.version` identifies the bridge. `ndt_revision` identifies the core files observed for this call and declares its exact scope/exclusions. It is not an atomic release snapshot, an asset approval, or visual/human acceptance.
- At the start of a task or when `ndt_revision` changes, reread the current relevant Skill files. Existing conversation context is not retroactively rewritten. Complete multi-file updates between calls; do not treat live file editing during a call as an atomic upgrade.

The bridge does not become an arbitrary command executor. Current NDT business validation still rejects unsupported values; path, type, execute/dry-run, source/asset and production-evidence boundaries remain applicable. A worker failure cannot authorize handoff or delivery.

## Existing tools

Use the Registry tool for live assets/styles/cases, the token/template/case tools for focused reads, and the existing generator/compiler/QA/score/production tools only at their applicable stages. Generation and script execution still default to preview; `execute: true` requires the task's existing authorization. Audit-only work does not become generation.

`nero_design_get_registry` supports `include_library`, search/facets and asset pagination. Use `style_id`/`style_version` for historical versions and `recommended_only` for approved recommendations. Names/tags locate candidates; actual preview inspection remains a separate step. The tool is read-only; approved asset/style writes use the existing revision-checked services.

Keep small repairs small: direct current-output inspection, authorized change and result inspection need no extra MCP calls, separate style manifest or score unless the problem or selected project contract requires them.

## Local fallback

If MCP is unavailable, read the same canonical Registry, tokens, templates and reference files and use the existing local CLI scripts. `server.mjs --dry-run <tool-name> '<json-arguments>'` remains a read/preview entry and rejects `execute: true`; it uses the same per-call NDT logic. There is no second controller, HTTP daemon or model route.

Worker lifetime/limits, same-connection acceptance and synchronization are maintenance details in the workspace MCP README. Tool results and version metadata do not prove that the user's existing host connection has loaded a newly changed bridge.
