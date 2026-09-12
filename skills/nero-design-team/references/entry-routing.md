# Route details

`设计团队` and standalone `NDT`/`ndt` invoke this Skill in a design context. Choose the operation and primary deliverable using [the entrypoint](../SKILL.md); a name inside another word or a non-design request is not a trigger.

## Named presets

| User wording | Existing route and local contract |
|---|---|
| 手写风格 | Cross-format `editorial-handwritten-research-note`; [handwriting](handwritten-research-note.md) |
| 留白杂志风 / 留白杂志风格 | `ai-image-generation` + `minimal-zine-editorial`; [zine entry](minimal-zine-entry.md) |
| 摄影抽象双联画 / 照片抽象双联画 | `ai-image-generation` + `photo-derived-editorial-diptych`; [diptych](photo-derived-editorial-diptych.md) |
| 架构脉络图 / 深色节点网络架构图 | `frontend-ui` + [effective HTML](effective-html.md); use `not-bundled-prompts-effective-html-architecture-map.md` |
| 移动端 / 手机端 / 平板 App、网页或适配 | Unsupported in NDT 3.0; return without generation or QA |

A named style selects the route, not approval of the style version. Exact content remains governed by the target medium.

The mobile prohibition applies to software and web interfaces, including audits and previews. It does not prohibit portrait editorial graphics, WeChat images or vertical video canvases, which remain media outputs under their own routes.

## Mixed and specialized requests

- Client/PitchBook context first resolves its content owner and banker design constraints, then the visual output format.
- For a single explanatory report/WeChat/PPT figure, read [figure entry](figure-compiler-entry.md). An entire article or deck is not one figure.
- Architecture, sequence, state, ER, swimlane, loop, organization, data-flow and access-matrix diagrams use [architecture/redraw](architecture-diagram-redraw.md). This does not expand Figure Compiler's nine types.
- An interactive explanation uses `frontend-ui` + [effective HTML](effective-html.md), `artifact_mode: concept_explainer`, and the caller/content-owner's `explanation_brief`.
- AI application design remains `frontend-ui` with `frontend_profile: ai-app-ui`. Interface motion remains frontend work; an exported video uses `short-video`.
- Mixed media share assets but retain their own readability, editability and QA requirements. Select the primary output before production.

## Structured tool use

After Skill-first judgment, pass `task_mode: create|revise|audit`, the existing `preferred_route`, and any `frontend_profile`, `ppt_operation` or `content_contract` to `nero_design_route`. Explicit fields take precedence over keyword inference. A read-only audit never recommends generation/import; a request to revise or regenerate after checking remains actionable within its authorization.

`content_contract: kat-presentation` is selected by user/project authority. Existing KAT handoff fields also retain their gates; `presentation_chain_required: false` cannot waive supplied KAT evidence. Generic style/design vocabulary does not select KAT.

Use [tool layer](mcp-tool-layer.md) for MCP or local fallback. When MCP is unavailable, keep the chosen route and use existing local files/scripts. Generic maintenance edits begin upstream; the public `skills/nero-design-team/` package owns the projected references and `rules/` is its generated compatibility view.
