# Visual Score Rule

Use this rule after visual QA when deciding whether a design artifact is ready, needs review, or must be reworked.

## Scorecard

Primary scorecard:

`$NERO_DESIGN_TEAM_HOME/scorecards/visual-scorecard.json`

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

## Interpretation

- `pass`: 82 points or above. Ready or close to ready after normal final review.
- `review`: 68-81 points. Direction is usable but cleanup is required.
- `fail`: below 68 points. Do not deliver until core issues are fixed.

## Hard Rule

Even a high score does not override evidence problems. If facts, figures, sources, or regulatory wording are unverified, mark the artifact as not final.

For KAT-sourced PPT work, a high score also does not override the handoff contract. If NERO changed must-preserve content or patched content gaps visually instead of returning them to KAT, mark the artifact as not final.

For production-chain PPT work, a high score also does not override missing production structure. If `presentation_production_packet`, `design_spec`, `style_lock`, or required visual exploration records are missing, mark readiness as `review` or `fail` even when the page visuals look strong.
