# Frontend Motion Rule

Use this rule for interactive frontend motion: press feedback, popovers, drawers,
sheets, drag/swipe behavior, carousels, reorder interactions, momentum, and
frontend-oriented motion audits.

This rule does not govern Remotion or short-video scene design. Use
`motion-video-harness.md` for that route.

## Position And Sources

NERO Design Team remains the only visual entrypoint. The following
`emilkowalski/skills` materials are fused references, not installed Skills:

- `apple-design`: responsive, direct, interruptible, velocity-aware interaction.
- `emil-design-eng`: detailed motion and component craft heuristics.
- `review-animations`: focused diff review and explicit approval criteria.
- `improve-animations`: codebase-wide audit and self-contained repair plans.
- `find-animation-opportunities`: restraint-first opportunity filtering.
- `animation-vocabulary`: precise names for motion patterns.

Source repository: `https://github.com/emilkowalski/skills`

License: MIT for the repository. Keep attribution when substantial upstream text
or code is copied. This NDT rule is a NERO-native adaptation; it does not bundle
Apple identity, SF Symbols, WWDC slides, course content, or third-party design
resources.

Local snapshot:

`$NERO_DESIGN_TEAM_HOME/case-library/snapshots/emilkowalski__skills/snapshot.json`

Primary verification references:

- Apple Designing Fluid Interfaces:
  `https://developer.apple.com/videos/play/wwdc2018/803/`
- Apple HIG Motion:
  `https://developer.apple.com/design/human-interface-guidelines/motion`
- Apple HIG Materials:
  `https://developer.apple.com/design/human-interface-guidelines/materials`
- Motion animation options:
  `https://motion.dev/docs/animate`
- MDN reduced transparency:
  `https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency`
- MDN Vibration API:
  `https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API`

## NERO Motion Position

Motion is functional before it is expressive.

For NERO work tools, motion may:

- confirm that an input was received;
- explain where a surface came from or where it went;
- preserve spatial continuity during a state change;
- make a drag, resize, reorder, or dismissal feel directly controlled;
- prevent an abrupt state change from becoming confusing.

Motion must not:

- delay access to data, evidence, controls, validation messages, or source notes;
- decorate repeated banking, disclosure, table, filter, or keyboard workflows;
- make a dense workbench feel like a launch site or consumer entertainment app;
- use translucency, bounce, sound, or haptics without a functional reason;
- become the only carrier of status, warning, error, or completion.

The task's `MOTION_INTENSITY` is a ceiling, not a target. A dial of `1` still
allows immediate press/focus feedback when it improves control confidence.

## Motion Decision Gate

Evaluate each candidate in this order.

### 1. Frequency

Frequency is a heuristic, not a universal law:

- Very frequent or keyboard-driven actions: prefer instant state change and
  minimal feedback; remove travel and flourish.
- Repeated navigation, list, hover, or filter actions: use only subtle,
  low-latency feedback when needed.
- Occasional panels, drawers, toasts, or mode changes: standard functional
  motion is allowed.
- Rare onboarding, empty-state recovery, success, or first-use moments: a
  limited delight budget is allowed when the task is not a formal work tool.

### 2. Purpose

The motion must serve at least one explicit purpose:

- `feedback`
- `spatial-consistency`
- `state-indication`
- `jarring-change-prevention`
- `explanation`
- `rare-delight`

If the only purpose is “looks more animated,” delete it.

### 3. Interaction Mode

Record whether the action comes from:

- keyboard;
- mouse/trackpad;
- direct touch;
- stylus;
- programmatic state change.

The same control may need different motion strength for direct touch and precise
pointer or keyboard input.

### 4. Business And Accessibility Risk

Reduce or remove motion when it can interfere with:

- financial comparison;
- table scanning;
- disclosure review;
- form completion;
- evidence traceability;
- error recovery;
- vestibular comfort;
- contrast or text legibility.

## Interaction Contracts

### Immediate Response

- Show press or active feedback on pointer-down when it confirms contact.
- Commit the action on release unless the product convention requires another
  behavior.
- Do not add artificial timers to the input path.
- Continuous interactions update continuously; do not wait until drag-end to
  reveal the result.

### Direct Manipulation

- Keep dragged content aligned with the pointer or finger, including the
  original grab offset.
- Use pointer capture when appropriate so tracking survives leaving the
  element bounds.
- Apply a small intent threshold before locking a drag direction.
- Protect active gestures from extra touch points that would cause a jump.

### Interruptibility

- Never lock input merely because a transition is running.
- Retarget from the current presented value, not from a stale logical target.
- Rapidly triggered UI must reverse or redirect without a visible jump.
- Use CSS transitions or WAAPI for predetermined interruptible property changes.
- Use physics-based springs or an inertia model for gestures that must preserve
  live velocity.

### Velocity And Momentum

- Track recent position and time samples during a gesture.
- When release velocity matters, pass it into a physics-based spring or inertia
  model and choose the resting target from the projected trajectory.
- Do not select a snap target only from the release position when a flick is
  expected to travel.
- Duration-based `duration + bounce` springs are acceptable for authored visual
  timing, but Motion's official documentation says they do not incorporate
  existing velocity. Do not use them as a substitute for gesture velocity
  handoff.

### Boundaries

- Prefer progressive resistance over a hard stop when over-drag is allowed.
- Keep rubber-banding continuous and bounded; it must not reveal invalid data
  or enable an invalid action.
- Snap back or settle clearly so the final state is unambiguous.

### Spatial Consistency

- Enter and exit along a coherent path.
- Anchor popovers, menus, and sheets to their trigger or interaction source.
- Keep modals centered when they are viewport-level tasks rather than
  trigger-anchored surfaces.
- Preserve the same information and control meaning before, during, and after
  motion.

## Materials And Typography

- Translucent material is a functional floating layer, not a page-wide style.
- Never stack translucent surfaces when contrast becomes ambiguous.
- Provide an opaque or higher-contrast fallback.
- Use responsive type scale, line-height, and tracking deliberately; do not
  copy Apple typography or identity assets.
- Exact Chinese labels, figures, table content, and source notes remain stable
  DOM text during motion.

## Tokens

Use `tokens/motion.json` instead of hand-typing near-duplicate values.

Semantic duration guidance:

- `press`: immediate control feedback.
- `tooltip`: small transient surface.
- `control`: common UI state transition.
- `panel`: occasional drawer, sheet, or panel.
- `slow`: exceptional explanatory or large-surface transition; justify it.

Spring tokens are descriptive parameters. Map them to the target engine and
verify the rendered feel. Do not assume a damping-ratio/response pair is a
drop-in API for Motion, CSS, Remotion, or another library.

## Performance

- Prefer compositor-friendly `transform` and `opacity` for motion that can be
  expressed that way.
- Do not treat “transform and opacity only” as an absolute rule: measure when
  layout, clip, filter, SVG, or view-transition effects are necessary.
- Avoid `transition: all`.
- Keep animation work out of data-fetch, validation, and high-frequency render
  paths.
- Test the actual framework and browser; do not assume a library shorthand is
  categorically hardware-accelerated or unaccelerated.
- Use slow-motion and frame-by-frame inspection for timing, origin, and
  coordinated-property defects.
- Test drag and touch behavior on a real device when the interaction is
  material to acceptance.

## Accessibility And Browser Support

- `prefers-reduced-motion`: replace travel, parallax, overshoot, and elastic
  movement with a static change or short opacity/color feedback.
- Reduced motion means reduced movement, not loss of state feedback.
- `prefers-reduced-transparency`: treat as progressive enhancement because
  browser support is limited; the base design must remain legible without it.
- `prefers-contrast`: keep boundaries and text legible when contrast is raised.
- Web vibration and haptics are optional enhancements with limited support.
  Never depend on them for confirmation or warning.
- Gate hover-only motion behind input capability checks when touch devices are
  in scope.

## Audit Modes

### Focused Review

Use for a diff or bounded component. Report:

| Severity | Location | Current behavior | Required change | Reason | Verification |
| --- | --- | --- | --- | --- | --- |

Approval is earned only when all applicable high-severity findings are resolved
or explicitly accepted.

### Codebase-Wide Motion Audit

Use for “improve the animations” or “audit the motion.”

1. Map framework, motion libraries, tokens, gesture handlers, and current
   conventions.
2. Map interaction frequency and product personality.
3. Audit purpose, timing, physicality, interruptibility, performance,
   accessibility, cohesion, and missed opportunities.
4. Rank findings by user impact and recurrence.
5. Create one self-contained plan per accepted finding.

Each implementation plan must include:

- exact file and line;
- current behavior;
- target behavior and token names;
- repo conventions to preserve;
- bounded steps and do-not-touch scope;
- mechanical verification;
- slow-motion or real-device feel check;
- drift stop condition.

Audit-only work is read-only unless NERO explicitly asks to implement the
accepted plans.

### Opportunity Search

Return at most five to seven high-conviction motion opportunities for a whole
app, fewer for one view. Record frequency, purpose, interaction mode, and why
each rejected candidate was rejected.

## Completion Gate

A motion-bearing frontend is not complete until:

- every material animation has a named purpose;
- high-frequency actions remain immediate;
- drag/swipe behavior is direct and interruptible;
- velocity-bearing gestures use an appropriate physics/inertia model;
- reduced-motion behavior is verified;
- text, data, controls, errors, and source notes remain readable;
- desktop and relevant touch/mobile behavior are inspected;
- slow-motion or frame-level review covers high-risk interactions;
- upstream references, license, and extracted patterns are reported;
- no Apple or third-party identity/design asset is presented as NERO-owned.

When this rule materially influences a result, report:

`fused_reference_skills: emilkowalski/apple-design, review-animations, improve-animations`
