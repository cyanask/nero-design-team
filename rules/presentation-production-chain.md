# Presentation Production Chain Rule

Use this rule for KAT x NDT Presentation Production Chain v2.0.

## Purpose

This chain turns a KAT-owned content package into an NDT-owned visual production package without merging responsibilities.

KAT owns:

- narrative variants;
- slide intent;
- slide-to-claim mapping;
- evidence and source references;
- exact numbers, source notes, regulatory wording, and locked conclusions;
- content freeze gates and return-to-KAT resolution.
- all presentation wording, the `presentation` prose-quality review, frozen-text hash, and handoff quality receipt.

NERO Design Team owns:

- design route;
- design spec;
- style lock;
- three-direction visual exploration;
- gpt-image-2 briefs for visual素材 only;
- visual QA, visual score, production-check, and case archive readiness.

NERO Design Team consumes only KAT-frozen text and the passed current quality receipt. It does not load the prose-quality projection as a second rule engine and does not author, shorten, rewrite, translate, summarize, or add presentation text.

Formal editable PPTX uses the current project's registered operation route. In NERO Principal, `new_formal_pptx` resolves to `ppt-master-native-pptx`; existing-deck editing, strict template following, Google Slides, inspection, and repair resolve to `presentations:Presentations`.

GPT Work is the only cross-system controller. It invokes KAT, NERO Design Team, and the project-selected PPTX engine separately, owns gate progression in `control/production-ledger.json`, and passes artifact references between systems. KAT and NERO Design Team do not call each other or a downstream engine directly.

## Required Packet

For substantial PPT / PitchBook / board deck work, require or create a `presentation_production_packet` that links:

- KAT `presentation_handoff_contract`;
- KAT `slide_claim_map`;
- KAT `narrative_variants`;
- KAT `content_freeze_gate`;
- KAT handoff `quality_core_receipt`, matching the freeze gate's `quality_core_binding`;
- NDT `design_spec`;
- NDT `style_lock`;
- NDT `visual_exploration`;
- gpt-image-2 brief path when used;
- output target paths;
- content QA, visual QA, visual score, production-check, and case archive status.

If the packet is missing, report that the chain is incomplete instead of claiming production readiness.

The `presentation_production_packet` is a KAT-owned immutable handoff snapshot. It may declare expected NDT/output paths, but NDT and GPT Work must not mutate its status or gates. Actual owner transitions, NDT readiness, selected-engine status, and human approval live only in `control/production-ledger.json`.

## Stage Gates

1. Content gate: KAT contract and slide claim map are present; `content_freeze_gate` is frozen; the `presentation` quality receipt is passed, current, and metadata-matched.
2. Visual gate: NDT design spec, style lock, and visual exploration are present.
3. Output gate: target format and engine are explicit.
4. QA gate: content QA, visual QA, score, and production-check are recorded.
5. Archive gate: reusable case archive decision is recorded.

Only GPT Work advances the cross-system gate. KAT may report `ready_for_ndt`; NERO Design Team may report `visual_ready` or `return_to_kat`; the selected PPTX engine may report export status. Each system returns control to GPT Work after its own step.

## Return-To-KAT

Return to KAT when:

- the quality receipt is missing, pending, failed, stale, mismatched, or no longer tied to the frozen text;
- any title, body copy, bullet, label, caption, source note, or conclusion requires changed or newly authored wording;
- a slide lacks a supported claim;
- a number, unit, period, denominator, or source note is ambiguous;
- the visual route requires content cuts that alter meaning;
- NDT would need to invent a conclusion, evidence source, chart label, or financial figure;
- gpt-image-2 would need to render exact text, figures, tables, chart labels, or regulatory wording.

Do not silently patch these issues in the visual layer.

## Completion Report

For this route, final replies must report:

- KAT inputs consumed;
- quality-receipt status and whether KAT-frozen wording remained unchanged;
- NDT outputs created or missing;
- chosen visual route and formal output engine;
- whether gpt-image-2 was used or only briefed;
- visual QA and score status;
- production-check status;
- whether the case was archived;
- unresolved return-to-KAT items.
- next owner returned to GPT Work.
