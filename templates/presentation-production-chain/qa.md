# Presentation Production Chain QA

- KAT `presentation_handoff_contract` exists and is not draft.
- KAT `slide_claim_map` maps every slide to claims, evidence, data sources, and locked items.
- KAT `narrative_variants` records the selected story logic.
- KAT `content_freeze_gate` lists exact/semantic locks before NDT production.
- NDT `design_spec` records route, typography, layout, chart, image, and QA requirements.
- NDT `style_lock` records the selected visual system and prohibited changes.
- NDT visual exploration has three directions or a documented reason for skipping.
- gpt-image-2 is restricted to visual素材, not exact text/data.
- Formal PPTX uses Presentations unless explicitly unavailable.
- Production-check records pass/review/fail and unresolved return-to-KAT items.
