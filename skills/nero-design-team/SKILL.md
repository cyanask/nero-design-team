---
name: nero-design-team
description: NERO 的视觉设计与验收入口，响应 NDT、设计团队及指定风格。按目标理解、本地与互联网参考探索、方向比较、编排试样和看图改进组织 UI、报告图、PPT、架构图与视频设计；保护内容与交付底线，不预设统一风格。
---

# NERO Design Team

NDT owns visual design and its QA. The caller owns task progression; the current content owner owns facts and wording. Use this Skill for NDT/设计团队 requests in a design context.

## Design method

Keep the design method stable and the reference sources open. [Core](references/core.md) separates required task constraints, optional problem-solving methods, and candidate styles/assets. The brief decides the appearance; NDT has no mandatory house skin or local-asset quota.

Scale the work before choosing steps. A clear, bounded repair or small addition within an existing design may go directly **inspect current output → make the authorized change → inspect the result**. It needs no new reference search, direction set, teaching example, style manifest, separate trial or score unless the problem or an existing project contract requires one. Briefly record the result in the current task. Important new directions use the applicable steps below; six steps are a method, not a mandatory checklist for every request.

1. **Understand the goal.** Identify audience, reading priority, intended action and protected content/brand/output requirements. Distinguish `create`, `revise` and read-only `audit`; ask only about missing information that changes the outcome.
2. **Find and inspect references.** Search the local style/asset/case library. For new overall directions, requested freshness, missing suitable references or dissatisfaction, also search the web by the missing design method. View actual previews before judging fit; names and tags only locate candidates. Use [reference exploration](references/reference-exploration.md) for the automatic branch and real tool paths.
3. **Propose directions.** For important new designs, propose two or three materially different approaches, explaining intended effect, borrowed parts and task fit. In open exploration, retain a direction independent of existing presets while respecting explicit task constraints. A color swap alone is not a new direction.
4. **Compose and sample.** When selecting or combining a new visual system, keep a project-local style record with reference/asset roles, combination rules and adjustable parameters. Build one representative page/frame or the smallest meaningful slice before a full set. Reuse a selected existing manifest when sufficient.
5. **Look and improve.** Inspect the actual render at its target size, identify the most consequential problem, consult a [method card](references/design-methods.md) when useful, and compare before/after. Code checks and self-scores do not establish visual quality. Keep fixes local; if repeated attempts stop improving the result, reopen reference search.
6. **Retain useful work.** New references remain candidates with provenance and inspected-preview records. Save a combination as an approved library style only after NERO confirms that exact version; append rather than overwrite. Use the existing library intake/versioning path.

The caller controls task progression; NDT controls visual decisions. An audit performs inspection and reports directions without generating/revising work or registering assets. Explicit requirements for user direction selection remain pending until answered; ordinary implementation choices do not create extra approval steps.

Classify intent before tools. `nero_design_route` serializes the selected `task_mode`, `preferred_route`, `frontend_profile`, `ppt_operation` and `content_contract`. MCP supplies local context and execution tools; it does not perform web exploration or replace Skill judgment.

## Deliverable selection

| Deliverable | Read first | Add only when applicable |
|---|---|---|
| Frontend UI | [frontend entry](references/frontend-entry.md) | AI application profile, interaction motion or self-contained HTML |
| One report/WeChat/PPT figure | [figure entry](references/figure-compiler-entry.md) | [image report](references/image-report.md) for report cards or long images |
| Architecture diagram or redraw | [architecture/redraw](references/architecture-diagram-redraw.md) | [effective HTML](references/effective-html.md) for an HTML carrier; Archify when its typed-renderer contract is selected |
| PPTX or HTML deck | [presentation entry](references/presentation-entry.md) | Template fidelity, web-deck QA or an explicitly selected KAT contract |
| Generated image素材 | [image generation](references/ai-image-generation.md) | A named style's local contract |
| Short video | [short video](references/short-video.md) | [motion/video harness](references/motion-video-harness.md) for storyboard-to-motion production |

Business context precedes visual styling: client/PitchBook work also reads [banker design](references/investment-banking-pitchbook.md) and [business PPT design](references/ppt-business-design.md). General banker content belongs to `investment-banking-client-materials`; issuer-specific IPO advice belongs to `a-share-ipo-company-advisory`. NDT consumes their approved content.

For visual audits, use the relevant medium's rule and [visual QA](references/visual-qa.md). Load [scoring](references/visual-score.md) only when a score or readiness decision is needed. An audit does not create, revise or import assets.

## Conditional contracts

- `手写风格`: [handwritten research note](references/handwritten-research-note.md).
- `留白杂志风`: [minimal zine](references/minimal-zine-entry.md).
- `摄影抽象双联画` / `照片抽象双联画`: [photo-derived diptych](references/photo-derived-editorial-diptych.md).
- Other aliases, mixed requests and `架构脉络图`: [route details](references/entry-routing.md).
- KAT is selected only by the user or an existing task/project contract. A deck, brief, style lock or three-direction exploration alone does not select KAT. For selected KAT work, preserve the frozen-text, quality-receipt and return-to-KAT gates in [presentation entry](references/presentation-entry.md).
- Read [brand guidance](references/brand-system.md) to distinguish user-required identity from candidate NERO resources; external material uses [reference boundaries](references/external-design-reference-boundaries.md).

A named style selects a production route, not human approval of that style version. Asset, style and case lifecycle rules live in [library contract](references/repo-registry.md).

## Tools and project location

The local design-system root is `$NERO_DESIGN_TEAM_HOME/`. Project facts, drafts, exports and screenshots stay in the target project.

- Use [MCP/local tools](references/mcp-tool-layer.md) when a deterministic tool helps. On a new task or changed `ndt_revision`, read the current relevant Skill files; rules already read in a conversation are not retroactively refreshed.
- Use [project delivery](references/project-delivery-entry.md) for tokens, templates and integration.
- Use [library contract](references/repo-registry.md) for asset/style intake or reuse, and [case library](references/case-library.md) for cases.
- Generic rules are authored in the upstream canonical Skill. This public package keeps them in `skills/nero-design-team/`; `rules/` is a generated compatibility view. Maintenance procedures belong to the workspace, not a design task.

## Completion

Before calling an artifact complete, apply the matching sections of [visual QA](references/visual-qa.md) and remove visible production traces while preserving necessary sources, limitations and rights notices.

Use [production checks](references/production-check.md) when the project or task requires governed handoff/delivery readiness. An ordinary small visual delivery may record the current file, actual preview, checks and gaps briefly; it does not need separate QA/score manifests merely because it is being handed to the user. Existing content, regulatory, client and selected workflow requirements remain binding. The stages are distinct: `design_contract`, `downstream_handoff`, `final_delivery`. A successful exit or high score is insufficient; use the matching structured readiness flag and current-file evidence. Human acceptance remains separate.

Return the selected operation/route, artifact paths or read-only findings, checks actually performed, material gaps and next owner. Put technical receipts and materially used asset/reference details in project-local QA records; summarize only what helps the user assess the result. Apply route-specific reporting requirements when that route is active.

Return content changes to the current content owner. NDT does not call KAT or a downstream PPTX engine, grant permissions, or update the caller's production ledger.
