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
- `office_outputs`: optional list of formal Office files to inspect with the local OfficeCLI adapter. Each item may include `path`, `label`, `qa_dir`, `required_preview`, and `block_on_officecli`.
- `case_library_record`: optional route case index used or updated.
- `gpt_image_2_used`: boolean.
- `presentation_chain_required`: boolean. Use for KAT x NDT PPT production-chain checks.
- `presentation_production_packet`: required for PPT production-chain readiness.
- `design_spec`: required for PPT production-chain readiness.
- `style_lock`: required for PPT production-chain readiness.
- `visual_exploration`: required for PPT production-chain readiness.

Relative path fields are resolved from the production manifest file's directory. Absolute paths are used as-is.

## Checks

- Token outputs exist.
- Brand assets exist.
- Project manifest exists and declares route/template/version.
- Project manifest records NERO Design Team as the background support design system.
- Visual QA script passes.
- Visual score script passes and returns pass/review/fail.
- Expected output files exist and meet minimum size when declared.
- Office output files exist when declared. OfficeCLI QA and preview reports are attached when the local adapter is available; missing OfficeCLI is nonblocking unless `block_on_officecli` is true.
- For PPT production-chain work, production packet, design spec, style lock, and visual exploration files exist and parse as JSON.
- Case library record exists when declared.

## Delivery Boundary

- `pass`: delivery-ready subject to final human review and factual source checks.
- `review`: do not call final; revise visual or evidence weaknesses.
- `fail`: blocked until failed checks are fixed.

High visual score never overrides unverified facts, figures, sources, or regulatory wording.

For KAT x NDT presentation production, high visual score also never overrides missing content freeze, missing style lock, or unresolved return-to-KAT issues.

Project production outputs should remain in the project directory. Only lightweight case summaries or reusable patterns should be promoted back to `design-team/`.
