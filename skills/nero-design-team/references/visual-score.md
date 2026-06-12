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

## Interpretation

- `pass`: 82 points or above. Ready or close to ready after normal final review.
- `review`: 68-81 points. Direction is usable but cleanup is required.
- `fail`: below 68 points. Do not deliver until core issues are fixed.

## Hard Rule

Even a high score does not override evidence problems. If facts, figures, sources, or regulatory wording are unverified, mark the artifact as not final.
