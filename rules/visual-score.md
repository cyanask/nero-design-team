# Visual Score Rule

Use this rule after visual QA when deciding whether a design artifact is ready, needs review, or must be reworked.

## Scorecard

Primary scorecard:

`$NERO_DESIGN_TEAM_HOME/scorecards/visual-scorecard.json`

For `frontend_profile: ai-app-ui`, use the route-specific scorecard:

`$NERO_DESIGN_TEAM_HOME/scorecards/ai-app-ui-scorecard.json`

Set `scorecard: "ai-app-ui-scorecard.json"` in the score manifest. The shared
scoring script resolves registered scorecard file names only from the NDT
`scorecards/` directory; it does not accept arbitrary paths.

Run:

`node $NERO_DESIGN_TEAM_HOME/scripts/score-visual.mjs <score-manifest.json>`

## Criteria

- Route and deliverable fit.
- Brand and token consistency.
- Layout and typography.
- Information hierarchy.
- Data and evidence integrity.
- Chart quality.
- Output QA.
- gpt-image-2 boundary.
- KAT/NERO handoff boundary when a presentation handoff exists.
- Presentation production chain readiness when PPT / PitchBook production is in scope.

## Applicability and interpretation

The registered scorecard owns weights, applicability and pass/review thresholds. Do not duplicate numeric thresholds in task instructions.

- KAT handoff and presentation-chain criteria apply only to a selected KAT contract, using the same applicability function as production checks.
- Explicit `has_charts: false` or `gpt_image_2_used: false` omits the corresponding optional criterion. Unknown presence retains the check. Record these facts from the artifact; they are not arbitrary score exemptions.
- Required criteria still need valid numeric scores. A caller's free-form `not_applicable` list cannot waive them.
- Normalize earned points over applicable weight to the scorecard's total. Report both the normalized score and the omitted criteria; preserve old extra score fields for compatibility without counting inapplicable ones.
- `pass` supports the next applicable review; `review` needs cleanup; `fail` blocks delivery. None overrides the gates below.

## Hard Rule

Even a high score does not override evidence problems. If facts, figures, sources, or regulatory wording are unverified, mark the artifact as not final.

For KAT-sourced PPT work, a high score also does not override the handoff contract. If NERO changed must-preserve content or patched content gaps visually instead of returning them to KAT, mark the artifact as not final.

For production-chain PPT work, a high score also does not override missing production structure. If `presentation_production_packet`, `design_spec`, `style_lock`, or required visual exploration records are missing, mark readiness as `review` or `fail` even when the page visuals look strong.

For AI App UI work, a high score does not prove real confirmation, cancellation,
undo, retry, streaming, tool execution or human takeover. Report design-contract,
rendered, live-behavior and human-acceptance evidence separately.

## Production evidence binding

`score-visual.mjs` and `production-check.mjs` share `scripts/score-core.mjs`. Both select the declared scorecard and enforce the same numeric fields, weights and thresholds. A standalone score is arithmetic evidence only. Actual handoff/final review additionally requires the current-file bindings, review status and rendered evidence defined in `production-check.md`. Example scores never authorize delivery.
