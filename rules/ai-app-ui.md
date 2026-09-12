# AI App UI Rule

Use this rule when the NERO Design Team `frontend-ui` route designs or audits an
AI application, Agent workbench, Copilot surface, tool-calling interface,
generative UI, or another interface where model activity and human control must
remain legible.

Profile id: `ai-app-ui`.

This is an NDT-native frontend design profile. It does not install an upstream
Skill, add a top-level route, implement an Agent runtime, or make the interface
the authority for permissions, workflow state, evidence, or completion.

## Fused Source Boundary

NDT extracts only the parts that improve frontend design decisions:

| Source | NDT extraction | Explicit exclusion |
|---|---|---|
| `outshift-open/hax` | Control, clarity, recovery, collaboration, traceability and human-in-the-loop patterns | SDK, CLI, components, deployment and agent controller |
| `microsoft/HAXPlaybook` | Failure-scenario planning and the 18-guideline interaction review | Archived application runtime and Microsoft branding |
| `google-labs-code/design.md` | Structured design intent, normative tokens, rationale and diffable project projection | Independent token authority and external CLI dependency |
| `aa-on-ai/agentic-design-system` | Intent, baseline, rubric, rendered evidence, review and revision loop | Standalone Skill pack, MCP server, grader and installer |

AG-UI, A2UI and MCP Apps may inform visible state vocabulary, trusted component
catalogs and embedded-surface boundaries. NDT does not absorb their transport,
schema runtime, host security implementation or protocol authority.

## Design Intent Contract

Before selecting layout or components, record:

- `primary_job`: the user's real task and accepted outcome;
- `user_role`: the person responsible for interpreting or approving the result;
- `assistance_mode`: workbench, Copilot, document collaboration, form-driven,
  command surface or embedded panel;
- `capability_boundary`: what the AI can and cannot do from this surface;
- `high_impact_actions`: actions that need preview, confirmation or takeover;
- `evidence_priority`: which sources, unknowns and verification states must stay visible;
- `required_states`: states the interface must render for this task;
- `recovery_actions`: cancel, edit, retry, undo, reopen or human takeover;
- `design_dials`: `DESIGN_VARIANCE`, `MOTION_INTENSITY` and `VISUAL_DENSITY`;
- `acceptance_viewports`: the real desktop window sizes to inspect; every width is at least 900px.

The project `.nero-design/manifest.json` records the selected profile and paths
to the project-local design-intent schema, state catalog and scorecard. A
generated `DESIGN.md` may be used as a coding-agent projection, but it must be
derived from NDT tokens, this rule and the project design intent. It must not
become a competing design-system truth.

## Interaction Invariants

### Control

- Show the capability boundary before the user relies on the system.
- For a high-impact action, show the action, target, scope and expected effect
  before confirmation.
- Keep confirm, cancel and human-takeover actions visually distinct.
- Do not present a decorative confirmation control when the underlying action
  cannot actually be stopped or withheld.

### Clarity

- Distinguish suggested, planned, running, waiting, partial, completed, failed
  and verified states in text. Color may reinforce but never carry the state alone.
- Keep partial output visually different from a final result.
- Keep completion separate from verification. `completed` must not silently
  imply `verified`.
- Show source, evidence or unknown-state affordances where the product claims a
  source-backed result.
- Present concise operational rationale when useful. Never expose or simulate
  private chain-of-thought.

### Recovery

- Every recoverable failure names the failed operation and the available next action.
- Provide edit, retry, undo, reopen or an explicit not-available explanation
  according to the real product contract.
- Preserve the user's accepted work when retrying a later step.
- Avoid dead-end error cards that only say something went wrong.

### Collaboration

- Make clear whether the next turn belongs to the AI, the user or another named role.
- When waiting for input or approval, identify exactly what is needed and what
  remains paused.
- Keep long-running work interruptible when the product supports interruption.
- Do not fabricate progress percentages, background activity, notifications or status.

### Traceability

- Record actions as user-visible operational history when that history affects
  trust, recovery or review.
- Show a diff when an AI action changes user-owned content or a prior accepted result.
- Keep timestamps, source links and version labels only when they carry real state.
- A polished timeline is not evidence unless its entries come from the active product state.

## State Catalog

The NDT preset provides the following reusable state vocabulary:

| State | Required visible meaning | Minimum useful action |
|---|---|---|
| `idle` | No task is running | Start or select a task |
| `planning` | A proposed plan exists but execution has not started | Review, edit or start |
| `running` | Work is actively progressing | Inspect and cancel when supported |
| `waiting_user` | A precise user input is required | Provide input or cancel |
| `waiting_approval` | A bounded action is held for confirmation | Confirm, reject or revise |
| `partial` | Some usable output exists and more work remains | Inspect, continue or stop |
| `completed` | The requested operation ended | Review result or open history |
| `verified` | A separate applicable check passed | Inspect verification evidence |
| `failed` | A named operation failed | Retry, edit inputs or take over |
| `cancelled` | Work stopped without pretending to complete | Resume or start again when supported |

Projects may omit a state only when the design intent records why it cannot
occur or is handled by another visible surface.

## Pattern Selection

Do not assume every AI application is a chat product.

- Use a workbench when users compare evidence, states, tools or several outputs.
- Use a Copilot pattern when assistance stays subordinate to an existing task.
- Use document collaboration when the artifact and its revisions are primary.
- Use a form-driven pattern when inputs and approvals are structured and repeatable.
- Use a command surface when expert speed and keyboard control matter.
- Use an embedded panel when the host product remains the primary context.

The selected pattern must preserve Chinese-label readability, keyboard and
focus order, desktop-window behavior, source visibility and the project's chosen
information density.

## NDT Production Loop

Use the smallest loop that produces reviewable evidence:

`intent → baseline → task-specific rubric → build → rendered evidence → review → revise or retain`

- `intent` binds the design to a real user task and stop condition.
- `baseline` records current product rules, tokens, components and relevant states.
- `rubric` combines this profile's hard gates with task-specific checks.
- `rendered evidence` names the tested state and viewport; source inspection is
  not a substitute for the rendered surface.
- Repeated accepted findings may be promoted into NDT rules, templates or case
  patterns. One example does not automatically become a universal rule.

## Acceptance Boundary

NDT may verify rule coverage, schema validity, template generation, static
accessibility structure and rendered screenshots. It must keep these claims separate:

- `design_contract_passed`: required rules and state patterns are represented;
- `rendered_qa_passed`: selected states and viewports were visually inspected;
- `live_behavior_observed`: controls and state transitions worked on the real app;
- `human_accepted`: NERO accepted the actual interaction and visual result.

Only the evidence actually exercised may be reported. Static files, a generated
project manifest or a passing score do not prove live cancellation, confirmation,
undo, streaming, tool execution or human takeover.

## Completion Report

For this profile, report:

- `frontend_profile: ai-app-ui`;
- design-intent and state-catalog paths;
- fused sources that materially affected the design;
- states and viewports inspected;
- confirmation, recovery, evidence and history patterns applied;
- scorecard and QA status;
- rendered, live-behavior and human-acceptance boundaries separately.
