# Presentation entry

Select the requested operation and then read [PPT rules](ppt.md) and [business design](ppt-business-design.md). An audit stays read-only and needs no generation engine.

| Lane | Additional references and engine |
|---|---|
| New formal editable PPTX | Caller resolves the current project's operation registry; [production harness](ppt-production-harness.md) for substantial work |
| Current/template PPTX | Preserve the current deck and manual edits; use the project's template/edit route and before/after comparison |
| HTML/web deck | [web PPT](web-ppt.md), [style discovery](html-deck-style-discovery.md), [multi-device QA](web-ppt-multidevice-qa.md) |
| Explicit lightweight local sample | Legacy PptxGenJS only when selected; never a silent formal fallback |

Load [image generation](ai-image-generation.md) only when imagery is needed. External engines and references retain their registered version, rights and execution boundaries. Source metadata lives in the Registry; upstream template/media packs are not automatically reusable assets.

## Selected KAT contract

Apply this section only when the user or existing task/project has selected KAT. Set `content_contract: kat-presentation`; ordinary work uses `standard`. A PPT request, deck brief, slide plan, design spec, style lock or three-direction exploration alone does not select KAT.

- Read [handoff contract](presentation-handoff-contract.md). For the production chain also read [production packet](presentation-production-chain.md), [design spec](presentation-design-spec.md) and [production checks](production-check.md).
- KAT is the sole text owner. Require frozen wording plus the passed current `presentation` quality receipt matching the freeze gate. Consume that review; do not run a second prose review or change wording.
- Line breaks, placement, spacing, typography and non-semantic emphasis are NDT's responsibility. Shortening, translation, relabelling, new copy and changed facts or meaning return to KAT through the caller.
- Preserve KAT's immutable packet. The caller owns progression and its production ledger; NDT returns its visual package or content-repair request.
- Keep the existing design spec, style lock, selected exploration direction, current-file QA and output-engine gates at their applicable stages.

`collaboration.json` is a recommendation-only declaration for selected KAT work. It consumes caller-resolved `ppt_operation`/`formal_output_engine` and current quality evidence; it neither implements the gates nor invokes another Skill, grants permission or updates a ledger. Engine tokens remain `ppt_master_native_pptx` and `presentations`.

## Completion

Report the selected lane/engine and current artifact checks. For KAT work also record receipt status, frozen-text preservation and any return-to-KAT request. Keep materially used reference and asset details in project-local QA evidence. A visual score does not replace content, editability, preview or final acceptance gates.
