# NDT Skill maintenance contract

## Authoring and distribution

Author generic changes in the upstream canonical Skill, then project them into this public package at `skills/nero-design-team/`. `skills/nero-design-team/references/core.md` owns the common authority, evidence and visual requirements. Medium references own their specialized applications. Source/release history stays in the Registry or maintenance documents.

Existing `rules/*.md` paths remain a generated compatibility view for tools and callers. Do not edit them separately or remove stable paths. The installed Skill is an exact mirror. OSS is a public-safe derivative; its generic logic comes from this source.

1. Save the exact current files before changing them, including any dirty OSS files in scope.
2. Edit the canonical Skill, relevant registered data and existing tool seams.
3. Run `node scripts/test-skill-contracts.mjs`; when stage/evidence or scoring changes, also run `node scripts/test-production-check-readiness.mjs`.
4. Check views with `node scripts/sync-skill.mjs --runtime`. For a configured deployment, an authorized refresh uses `--write --backup <new-directory>`; previous target bytes and the change plan are preserved. Source/runtime extras or symlinks require review.
5. Project only the canonical changes into OSS using `registry/oss-sync-policy.json`. Preserve existing public-safe substitutions and unrelated dirty changes. Keep public rule files equal to their projected Skill references. Validate the source, runtime and OSS Skill packages with `quick_validate.py`.
6. Run `node scripts/validate-registry.mjs`. It checks rule-view parity, runtime parity, public projection, references and any declared sanitized downstream export. If the source Registry changed, refresh that private export through its owning workflow and rerun the check.

These are local contract checks, not App builds, deployment, rendered artifact acceptance or permission to restart a host. The stable bridge version and per-call NDT revision are separate; observe a changed bridge through the actual host before describing that host as refreshed.

## Selected task contract

- `task_mode` separates create, revise and audit. Explicit caller values take precedence; audit does not recommend generation/import.
- `content_contract` separates ordinary content from selected KAT presentation work. `scripts/presentation-contract.mjs` is shared by route recommendations, production checks and scoring. Legacy KAT owners, templates and handoff fields retain their gates; a false flag cannot waive them.
- The registered scorecard owns criterion applicability and weight. Required checks remain required, omitted checks are reported, and scores normalize over applicable weight. Production supplies its own project/task context, so score manifests cannot opt out of that contract.
- The three production stages and current-file evidence checks remain intact. QA manifests expose their checked fields and missing coverage; they do not claim actual rendering or live behavior.


## Method-first design revision (2026-09-12)

The director owns one six-step method: goal, inspected local/web references, directions, a composed trial, render-based improvement and candidate retention. Core rules distinguish task requirements, optional methods and candidate resources. Reference discovery is open; explicit task identity, content, functioning controls and readable delivery remain protected. No local reuse quota or general aesthetic ban is applied. Six original schematic method comparisons are bundled with the Skill and are not mature styles or real UI acceptance evidence.

The exploration branch and real tool capabilities live in the Skill's reference-exploration document. The current package has no new internet MCP, search service, controller, style database or model route. Existing render and library tools remain the execution seams. Source MCP 2.4.3 only updates its task-design guidance; a live connection must still be observed before claiming it has refreshed.

Official structure references: [Skills](https://developers.openai.com/codex/skills/) and [MCP](https://developers.openai.com/codex/mcp/). The method source record is in Registry `design_method_sources`; the examples are original and no upstream art or client material is bundled.

## Stable bridge and task-size follow-up (2026-09-12)

Clear local fixes or small additions within an existing design may inspect, edit and inspect again without a new search, direction set, teaching example, style manifest, separate trial or score. This does not waive selected content, accessibility, client or production contracts; invoking the production checker still enforces its complete stage contract.

The MCP bridge interface is now 2.5.0. Daily NDT rule/code/catalog updates belong to the per-call runtime and do not bump the bridge version or require reconnection while the interface is compatible. First migration to this bridge requires one reconnect. Schema/bridge/configuration changes remain separate interface updates. See the MCP README for module ownership, limits, fingerprint scope and cleanup.

The user-approved persistent-connection acceptance uses `node mcp-lite/stable-update-test.mjs` with an isolated temporary copy (V2 bounded runtime slice). It must demonstrate changed NDT behavior/revision in the same process/connection and unchanged tools, plus retained path/execute/evidence failures and worker cleanup. Do not substitute a new-process test for this acceptance. Source and installed-host observations remain distinct.
