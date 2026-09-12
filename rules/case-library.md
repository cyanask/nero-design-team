# Case Library Rule

Use this rule when selecting or retaining examples. Cases are candidates whose fit must be judged from actual previews; follow the director's local/web exploration branch.

## Root

`$NERO_DESIGN_TEAM_HOME/case-library/`

## Indexes

- `frontend-ui.json`
- `image-report.json`
- `ppt.json`
- `short-video.json`
- `github-candidates.json`
- `snapshots/index.json`

## Required Case Fields

- `id`
- `name`
- `purpose`
- `style`
- `tokens`
- `template`
- `score`
- `applies_to`
- `disabled_when`
- `notes`

## Rules

- Use cases as visual and workflow references only.
- Keep external GitHub candidates separate from internal NERO cases until they pass visual review and license checks.
- For a known local case, use its snapshot index and focused metadata instead of opening an entire repository. New-direction exploration also searches outside the local catalog; inspect the actual selected preview before judging fit.
- Snapshots are lightweight references. They store README summaries, license notes, key file paths, and image URLs only. They must not contain cloned `.git` directories, `node_modules`, copied source files, or downloaded assets by default.
- Snapshot image URLs are references for later visual review, not local assets and not evidence.
- If a user explicitly asks to save restricted design assets, store them outside this public package under `<private-overlay>/assets/external/<source>/` with a `manifest.json`, `usage.md`, source URL, license status, and allowed/disabled usage boundaries.
- Restricted asset packs can support local reference, private drafts, and gpt-image-2 briefs, but must not become NERO brand assets or public/client-facing deliverable assets without separate license review.
- If a snapshot is `blocked`, use its `blocked_reason` and `license-summary.md` to decide whether to retry, choose another candidate, or request a narrower source.
- Do not treat a case as evidence for facts, figures, market claims, or regulatory conclusions.
- Do not store client-sensitive evidence, secrets, credentials, direct personal contact/payment identifiers, or private files.
- When adding a new case, include the route, template, token usage, score, QA outcome, and usage boundary.
- Promote a reference into an eligible case only after actual visual review and rights checks. A source page or method is not itself an independently reusable visual asset, and a NERO token conversion is not required.

## Snapshot Import

Command:

`node $NERO_DESIGN_TEAM_HOME/scripts/import-github-case.mjs <owner/repo-or-url> --route <route> --candidate-id <id>`

Supported routes:

- `frontend-ui`
- `image-report`
- `ppt`
- `short-video`

Default limits:

- README summary: up to 1200 characters.
- Key file index: up to 40 paths.
- Image references: up to 6 URLs.

Import boundaries:

- Do not clone the repository.
- Do not install dependencies.
- Do not copy full source code.
- Do not download images unless NERO explicitly asks for saved thumbnails.
- Use the snapshot as design reference only; license review still controls copying or reuse.

## v1.8 Presentation Harness Snapshots

The following snapshots strengthen the presentation harness layer:

- `alchaincyf/huashu-design`: HTML-native variants, brand asset protocol, visual QA, and motion/video pipeline reference.
- `zarazhangrui/frontend-slides`: fixed 1920x1080 HTML deck style discovery and web PPT preview reference.
- `hugohe3/ppt-master`: design spec/spec lock, PPT production pipeline, SVG QA, native editability, and AI image style-lock reference.

Use these through `external-design-reference-boundaries.md`. The snapshots themselves are not default runtimes, not NERO-owned asset packs, and not replacements for a project registry or its selected engine. A separately pinned and accepted adapter may be registered by a project without promoting the snapshot into runtime authority.

## Asset classification and browsing

The stable asset catalog keeps `category` for asset kind, `routes` and Recipes for use, and `rights` for rights boundaries. Legacy `status` remains a source-readable label; it is not a combined acceptance field.

Current catalog records declare independent fields:

- `maturity`: `registered`, `reference`, `candidate`, or `unknown`.
- `reuse_state`: `reusable`, `conditional`, `reference_only`, `placeholder`, `quarantined`, or `unknown`.

Registered/reusable describes the catalog declaration, never human or production acceptance. Conditions, rights and source issues remain applicable. Missing fields in old snapshots display unknown rather than being inferred from words such as passed or approved. Explicit quarantine, legacy blocking labels and open source issues must not be erased by a positive or missing new field. Brand generation and delivery checks share the same negative-state and resolved-path checks, including aliases and files inside quarantined directories; unavailable optional artwork allows a no-icon layout. Placeholder and reference-only assets retain their declared limits instead of being promoted to formal brand acceptance.

The maintained frontend starts with application scenarios; its asset directory starts with all assets. Preview availability is an explicit filter, not eligibility. Space-separated search terms must all match the asset's indexed fields, including aliases. Use the existing case and Recipe IDs; do not duplicate the catalog in the frontend Pack. Scenario cards, directory filters, inspectors and copied instructions must preserve the same effective reuse restrictions. Instructions carry actual purpose, conditions/notes, rights and preview boundaries separately. Selecting a visible asset preserves the current browsing filters; an external deep link only clears constraints that hide its target.

## Active case catalog and deletion

- `registry/design-assets.json` `cases` is the active case-library eligibility list. Route-specific case JSON files retain source definitions for historical references; their presence does not reactivate a removed case. Do not recommend an archived case as an active example.
- User-confirmed case deletion uses `mutateCase` through the existing local Registry bridge with an expected revision. It removes the case from the active list, retains its record in `supporting_resources`, and preserves source files and style-version history. Recipe references become historical resource references.
- Style and case cards expose explicit delete controls, confirmation, cancellation and unavailable-state feedback. Demo/snapshot-only views are not writable. Confirmation binds the reviewed revision; a concurrent change must fail without overwriting it.
- A historical case reference may remain in an immutable style version. Display it as removed, without an active-case link; it must not block editing the style.
- Original-project preview recovery records source hashes, source version or date, transformation and local-use boundaries. A source prototype is labelled as a prototype; it is never counted as a finished case. Private source previews stay outside the public derivative.
