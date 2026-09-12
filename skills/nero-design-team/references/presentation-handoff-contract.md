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
- all presentation wording and the shared `presentation` prose-quality review;
- the frozen-text hash and quality receipt supplied to NDT.

NERO Design Team is the visual director.

NERO owns:

- visual route and design posture;
- layout system, typography, color, chart treatment, and image direction;
- proof-object selection and page rhythm;
- gpt-image-2 brief boundaries for visual素材;
- visual QA, visual score, and production-check readiness.

NERO Design Team consumes only KAT-frozen text and KAT's current quality receipt. It is not a second text author, does not load the full prose-quality projection as an independent rule engine, and does not rerun or reinterpret KAT's semantic writing review.

The caller resolves the formal editable PPTX engine from the current project's machine-readable registry or explicit task contract. NDT records the requested operation and consumes the resolved engine id; it does not choose or replace the engine.

GPT Work is the only cross-system controller. It supplies KAT-owned handoff references to NERO Design Team, receives NDT visual outputs or repair requests, resolves the PPTX operation, and invokes the selected engine only after the visual gate passes. KAT and NERO Design Team do not invoke each other or a downstream engine directly.

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
- `quality_core_receipt.source_path` pointing to the KAT `content_freeze_gate`;
- `quality_core_receipt.profile: presentation` and `review_status: passed`;
- matching core version, rules hash, and reviewed-content hash in both the receipt and `content_freeze_gate.quality_core_binding`;
- a frozen content gate and a production packet marked `ready_for_ndt`.

If these are missing, pending, failed, stale, mismatched, or not frozen, do not begin substantive visual production and do not invent them. Return the contract to KAT or mark it as content-blocked.

For v2.0 production-chain work, also check whether KAT provided:

- `slide_claim_map`;
- `narrative_variants`;
- `content_freeze_gate`;
- unresolved `return_to_kat_request` items;
- a `presentation_production_packet` linking KAT inputs, NDT outputs, output files, QA, production-check, and case archive.

If these are missing on a substantial PPT / PitchBook task, return to KAT. NDT must not use an incomplete content package as permission to write or repair slide copy.

## Visual Response

NERO Design Team returns a structured visual response to GPT Work with:

- `status`: `accepted`, `returned_for_content_repair`, or `blocked_by_visual_risk`;
- `visual_route`: `formal-pptx`, `template-following`, `web-ppt-html`, `image-first-pptx`, or `review-only`;
- `requested_content_repairs`: precise content issues that KAT must resolve;
- `visual_risks`: visual or delivery risks NERO can see before production.

The KAT-owned `presentation_handoff_contract` has a single writer: KAT. NERO Design Team must not edit it directly. GPT Work routes the NDT response back to KAT when a content-side durable update is needed; NDT-owned files stay under `design-output/`.

NERO must not change or independently polish:

- action titles, body copy, bullets, labels, captions, source notes, conclusions, or any other frozen wording;
- final conclusions;
- action titles marked as must-preserve;
- financial numbers;
- source notes;
- regulatory wording;
- claim meaning.

NERO may adjust line breaks, typography, visual emphasis, placement, spacing, and visual form only when both wording and meaning remain unchanged. Shortening, rewriting, translating, summarizing, semantic compression, new copy, or changed labels/captions always returns to KAT.

After updating the response, NERO Design Team returns control to GPT Work with `next_owner=KAT`, `next_owner=formal_pptx_engine`, or `next_owner=human_review`. It must not execute that next owner's work itself.

## Output Lane Mapping

| KAT output lane | NERO route | Formal engine |
|---|---|---|
| `native-pptx` + new formal production | `formal-pptx` | Current project registry; NERO Principal routes `new_formal_pptx` to `ppt-master-native-pptx` |
| `native-pptx` + existing deck or strict template | `template-following` | `presentations:Presentations` |
| `html-deck` | `web-ppt-html` | NERO-native HTML, not formal PPTX |
| `image-first-pptx` | `ai-image-generation` plus PPT route | Current project operation route after exact text/data layering |
| `review-only` | `ppt-design-audit` or `visual-audit-score` | none unless repair is requested |

## Return-To-KAT Conditions

Return the contract to KAT when:

- the quality receipt is missing, pending, failed, stale, mismatched, or no longer tied to the frozen current text;
- any title, body copy, bullet, label, caption, source note, or conclusion needs shortening, rewriting, translating, summarizing, or newly authored text;
- a slide has no supported claim;
- the visual route requires a chart/table that is not backed by structured data;
- the page is too dense to make readable without content cuts;
- a generated image would need to contain exact text, figures, labels, source notes, or conclusions;
- source period, unit, denominator, or regulatory wording is ambiguous;
- the requested visual could materially change the business message.

## QA Additions

For substantial decks, visual QA must include:

- contract completeness check;
- quality-receipt presence and metadata-match check against `content_freeze_gate.quality_core_binding`;
- content-preservation check against `must_preserve`;
- exact-data check for figures, periods, denominators, and source notes;
- output-lane fit check;
- NERO response status check before formal production.
- design spec and style lock presence;
- presentation production packet completeness;
- unresolved return-to-KAT issue check.

Do not report a final PPT as ready if the contract is still `draft`, `blocked_by_content`, or `returned_by_nero`, or if the presentation quality receipt is not passed and current.
