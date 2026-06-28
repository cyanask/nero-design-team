# Presentation Handoff Contract Rule

Use this rule when a PPT, PitchBook, research deck, board deck, client material, or web PPT is handed from KAT to NERO Design Team.

## Role Split

KAT is the content director.

KAT owns:

- audience and meeting context;
- story spine and ghost deck;
- slide action titles and slide roles;
- evidence refs and claims;
- exact financial figures, periods, denominators, source notes, and regulatory wording;
- content constraints and return-to-KAT conditions.

NERO Design Team is the visual director.

NERO owns:

- visual route and design posture;
- layout system, typography, color, chart treatment, and image direction;
- proof-object selection and page rhythm;
- gpt-image-2 brief boundaries for visual素材;
- visual QA, visual score, and production-check readiness.

Presentations remains the default formal editable PPTX production engine.

## Intake Checklist

Before visual production, confirm the handoff includes:

- `deck_brief.output_lane`
- `story_spine.ghost_deck_titles`
- one `slide_content_specs[]` item per planned slide;
- `action_title`, `role`, and `key_message` for every slide;
- `evidence_refs` or `open_questions` for every fact-dependent slide;
- `content_constraints.must_preserve`;
- `handoff_controls.exact_text_fields`;
- `handoff_controls.exact_data_fields`;
- `handoff_controls.return_to_kat_when`.

If these are missing, do not invent them. Return the contract to KAT or mark it as content-blocked.

For v2.0 production-chain work, also check whether KAT provided:

- `slide_claim_map`;
- `narrative_variants`;
- `content_freeze_gate`;
- unresolved `return_to_kat_request` items;
- a `presentation_production_packet` linking KAT inputs, NDT outputs, output files, QA, production-check, and case archive.

If these are missing on a substantial PPT / PitchBook task, the deck can still be explored visually, but it must not be reported as production-ready.

## Visual Response

NERO may update the contract's `nero_response` with:

- `status`: `accepted`, `returned_for_content_repair`, or `blocked_by_visual_risk`;
- `visual_route`: `formal-pptx`, `template-following`, `web-ppt-html`, `image-first-pptx`, or `review-only`;
- `requested_content_repairs`: precise content issues that KAT must resolve;
- `visual_risks`: visual or delivery risks NERO can see before production.

NERO must not silently change:

- final conclusions;
- action titles marked as must-preserve;
- financial numbers;
- source notes;
- regulatory wording;
- claim meaning.

## Output Lane Mapping

| KAT output lane | NERO route | Formal engine |
|---|---|---|
| `native-pptx` | `formal-pptx` or `template-following` | Presentations |
| `html-deck` | `web-ppt-html` | NERO-native HTML, not formal PPTX |
| `image-first-pptx` | `ai-image-generation` plus PPT route | Presentations after exact text/data layering |
| `review-only` | `ppt-design-audit` or `visual-audit-score` | none unless repair is requested |

## Return-To-KAT Conditions

Return the contract to KAT when:

- a slide has no supported claim;
- the visual route requires a chart/table that is not backed by structured data;
- the page is too dense to make readable without content cuts;
- a generated image would need to contain exact text, figures, labels, source notes, or conclusions;
- source period, unit, denominator, or regulatory wording is ambiguous;
- the requested visual could materially change the business message.

## QA Additions

For substantial decks, visual QA must include:

- contract completeness check;
- content-preservation check against `must_preserve`;
- exact-data check for figures, periods, denominators, and source notes;
- output-lane fit check;
- NERO response status check before formal production.
- design spec and style lock presence;
- presentation production packet completeness;
- unresolved return-to-KAT issue check.

Do not report a final PPT as ready if the contract is still `draft`, `blocked_by_content`, or `returned_by_nero`.
