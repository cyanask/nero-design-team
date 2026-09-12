# Production Check Rule

Run `node scripts/production-check.mjs <production-manifest.json>` from the NDT package. This check validates the requested stage, not human acceptance or factual correctness.

## Applicability

Use this structured checker when the project, caller or task requires governed handoff/delivery readiness. Ordinary small visual edits or simple file delivery do not automatically select it; they still need current-file and actual-preview checks, readable/correct content and concise reporting. A selected KAT/caller-controlled or other required production contract cannot be deselected merely by calling the task small. Once invoked, this checker retains every required stage, QA/score, current-hash, path and human-acceptance boundary below; there is no lightweight pass bypass.

## Stages

Set `stage` explicitly. Omission means `final_delivery` and never restores the old checklist-only pass.

| Stage | Required evidence | Successful result |
|---|---|---|
| `design_contract` | Project manifest with route, template and design-system version; for a selected KAT contract, production packet, design spec and current KAT content-quality receipt | Contract checks passed; no engine or final delivery authorization |
| `downstream_handoff` | Design contract plus finalized PPT style/exploration when applicable, current visual outputs, bound QA/score reviews and rendered evidence | Caller may invoke the project-selected output engine; final PPTX need not exist |
| `final_delivery` | Applicable design contract plus actual final outputs, bound QA/score reviews and rendered evidence for every declared visual output | Ready for final human review; never human acceptance |

`pass`, `review`, and `fail` describe only the requested stage. Missing, stale, failed or mismatched required evidence never passes. A process exit of zero alone is not a delivery or handoff decision.

## Manifest

- `artifact`, `route`, `project_manifest` identify the current project and must agree with its route.
- `stage` selects the stage above.
- `content_contract` is `standard` or `kat-presentation`. Use the current project's selected contract; file format alone does not select KAT. Existing KAT owners, packet templates or handoff fields retain the KAT checks, even if `presentation_chain_required` is false. Routing, scoring and production share `scripts/presentation-contract.mjs` for this decision.
- `visual_qa_manifest` and `visual_score_manifest` are required after the contract stage.
- `visual_outputs` lists `{path, min_bytes?, sha256?, role?}` for intermediate visual files at `downstream_handoff`.
- `expected_outputs` lists `{path, min_bytes?, sha256?, role?}` for actual final files at `final_delivery`. At least one is required. Future final outputs are ignored during intermediate handoff.
- `rendered_evidence` binds actual previews to those outputs; see below.
- `office_outputs` optionally requests the existing OfficeCLI QA/preview adapter during final delivery; it does not replace the bound rendered-evidence requirements. Existing `required_preview`, `block_on_officecli` and `qa_dir` fields remain supported.
- `case_library_record` and `gpt_image_2_used` retain their existing meanings.

Output roles are `visual` and `supporting`. Machine data, source and log extensions (`.json`, `.jsonl`, `.ndjson`, `.csv`, `.tsv`, `.yaml`, `.yml`, `.toml`, `.js`, `.mjs`, `.cjs`, `.ts`, `.py`, `.sh`, `.log`, `.lock`, `.map`) default to supporting. They still require a nonempty file, the declared minimum size, and a matching `sha256` when supplied; they do not require a visual score binding or rendered preview. All other formats default to visual. An explicit `visual` role can request stricter review; visual/unknown formats cannot be relabelled `supporting` to waive it. At least one current visual output is required for a visual handoff or delivery; an attachment-only bundle cannot pass.

Relative paths resolve from the containing manifest. A review manifest's bindings resolve from that review's directory.

Both QA and score manifests must carry `review_status: "passed"`, an ISO `reviewed_at`, and `artifact_bindings: [{"path": "current-output.html", "sha256": "<current file SHA-256>"}]` covering every visual output of the requested stage. Review status records an actual review; it must not be inferred from a high score. Scorecard selection and computation are shared with `score-visual.mjs`.

Each `rendered_evidence` entry contains:

```json
{
  "kind": "screenshot",
  "status": "pass",
  "reviewed_at": "<ISO review timestamp>",
  "artifact_path": "<current output path>",
  "artifact_sha256": "<current output SHA-256>",
  "path": "<actual screenshot or preview file>",
  "sha256": "<preview file SHA-256>"
}
```

Allowed kinds are `screenshot`, `preview`, and `render`. Outputs/previews must be nonempty files. Preview files are separate PNG/JPEG/WebP/PDF/SVG files with matching format signatures; an output cannot serve as its own preview. Digests must match current bytes; changed output or preview bytes invalidate the receipt. Timestamps must be valid and not in the future. There is no arbitrary age-based expiry for unchanged files. This verifies evidence integrity, not whether a reviewer judged aesthetics correctly.

Bundled sample/example files and documents marked `is_example: true` cannot satisfy a real production review. Copying a sample and retaining its example marker does not change that boundary. Produce actual project reviews instead of relabelling examples.

## KAT PPT handoff

Only selected KAT presentation checks require `presentation_production_packet` and `design_spec`. Beyond contract stage also require `style_lock` in `locked`/`approved` state and `visual_exploration` with a selected direction and finalized status. Ordinary PPT work retains the current-output and applicable visual gates without inventing KAT materials. A KAT packet may remain `ready_for_ndt`; do not rewrite its immutable handoff snapshot.

Supply either the KAT `kat_handoff_brief` file, or explicit `quality_core_receipt`, `presentation_handoff_contract`, `slide_claim_map`, and `content_freeze_gate` fields. Explicit content paths are relative to the production manifest; paths read from a handoff brief are relative to that brief. The caller should resolve any host/project-relative paths before handoff.

The receipt's `source_path` must identify the actual frozen gate. Core id/version/profile, rules digest, reviewed-content digest and review status must match `content_freeze_gate.quality_core_binding`. NDT reuses KAT's `validatePresentationQualityBinding` export from `$NDT_KAT_ROOT/src/presentation/PresentationQualityCore.ts`, including current projection metadata, content hashing and unresolved-finding checks. It never creates a substitute content review.

The local KAT installation is used by default. `NDT_KAT_ROOT` may identify the configured KAT installation; public packages require this environment reference. A missing validator or unsupported Node TypeScript runtime returns review with a reason, never pass. Return missing, failed or stale content evidence to KAT.

If `gpt_work_controlled: true`, provide the caller-owned `production_ledger`; the existing controller, content-gate and NDT-stage checks still apply.

## Structured result

The CLI emits one `Production result: <JSON>` line plus readable diagnostics. MCP consumes this structured result and exposes `stage`, `readiness_status`, `design_contract_passed`, `ready_for_downstream`, `final_delivery_ready`, reasons and `next_action`.

Only a passed `downstream_handoff` sets `ready_for_downstream`. Only a passed `final_delivery` sets `final_delivery_ready`. `human_accepted` remains false. Missing or malformed structured results fail closed.

`qa_coverage` reports manifest checks and unobserved dimensions; it is not rendered acceptance. `score_coverage` reports applicable weight and omitted criteria. Production supplies the selected project/task context to the scorer; a score file cannot waive that context. Formal visual evidence and KAT content gates remain independent of score normalization.

## Focused verification

`node scripts/test-production-check-readiness.mjs` exercises the public CLI/MCP seams with local fixtures. Its synthetic previews verify contract behavior only; they are not rendered or human-acceptance evidence for a real artifact.
