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

NERO Design Team owns:

- design route;
- design spec;
- style lock;
- three-direction visual exploration;
- gpt-image-2 briefs for visual素材 only;
- visual QA, visual score, production-check, and case archive readiness.

Formal editable PPTX still defaults to the Presentations plugin.

## Required Packet

For substantial PPT / PitchBook / board deck work, require or create a `presentation_production_packet` that links:

- KAT `presentation_handoff_contract`;
- KAT `slide_claim_map`;
- KAT `narrative_variants`;
- KAT `content_freeze_gate`;
- NDT `design_spec`;
- NDT `style_lock`;
- NDT `visual_exploration`;
- gpt-image-2 brief path when used;
- output target paths;
- content QA, visual QA, visual score, production-check, and case archive status.

If the packet is missing, report that the chain is incomplete instead of claiming production readiness.

## Stage Gates

1. Content gate: KAT contract, slide claim map, and content freeze gate are present.
2. Visual gate: NDT design spec, style lock, and visual exploration are present.
3. Output gate: target format and engine are explicit.
4. QA gate: content QA, visual QA, score, and production-check are recorded.
5. Archive gate: reusable case archive decision is recorded.

## Return-To-KAT

Return to KAT when:

- a slide lacks a supported claim;
- a number, unit, period, denominator, or source note is ambiguous;
- the visual route requires content cuts that alter meaning;
- NDT would need to invent a conclusion, evidence source, chart label, or financial figure;
- gpt-image-2 would need to render exact text, figures, tables, chart labels, or regulatory wording.

Do not silently patch these issues in the visual layer.

## Completion Report

For this route, final replies must report:

- KAT inputs consumed;
- NDT outputs created or missing;
- chosen visual route and formal output engine;
- whether gpt-image-2 was used or only briefed;
- visual QA and score status;
- production-check status;
- whether the case was archived;
- unresolved return-to-KAT items.
