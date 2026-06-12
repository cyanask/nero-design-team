# Production Check Rule

Use this rule before treating a generated design artifact as production-ready or ready for final user delivery.

## Command

`node $NERO_DESIGN_TEAM_HOME/scripts/production-check.mjs <production-manifest.json>`

## Manifest Fields

- `artifact`: human-readable artifact name.
- `route`: `frontend-ui`, `image-report`, `ppt`, `short-video`, or `ai-image-generation`.
- `project_manifest`: path to `.nero-design/manifest.json` or equivalent project manifest.
- `visual_qa_manifest`: path to a visual QA manifest.
- `visual_score_manifest`: path to a visual score manifest.
- `expected_outputs`: optional list of generated files with `path`, `label`, and `min_bytes`.
- `case_library_record`: optional route case index used or updated.
- `gpt_image_2_used`: boolean.

## Checks

- Token outputs exist.
- Brand assets exist.
- Project manifest exists and declares route/template/version.
- Project manifest records NERO Design Team as the background support design system.
- Visual QA script passes.
- Visual score script passes and returns pass/review/fail.
- Expected output files exist and meet minimum size when declared.
- Case library record exists when declared.

## Delivery Boundary

- `pass`: delivery-ready subject to final human review and factual source checks.
- `review`: do not call final; revise visual or evidence weaknesses.
- `fail`: blocked until failed checks are fixed.

High visual score never overrides unverified facts, figures, sources, or regulatory wording.

Project production outputs should remain in the project directory. Only lightweight case summaries or reusable patterns should be promoted back to `design-team/`.
