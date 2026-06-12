# Case Library Rule

Use this rule when selecting examples, saving good outputs, or asking Codex to follow NERO's proven design patterns.

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
- Prefer local snapshots over opening complete GitHub repositories. Read `snapshots/index.json`, then the matching `summary.md`, then `snapshot.json`; open `file-index.json` only when path-level context is needed.
- Snapshots are lightweight references. They store README summaries, license notes, key file paths, and image URLs only. They must not contain cloned `.git` directories, `node_modules`, copied source files, or downloaded assets by default.
- Snapshot image URLs are references for later visual review, not local assets and not evidence.
- If NERO explicitly asks to save design assets, store them outside snapshots under `not-bundled-external-assets/<source>/` with a `manifest.json`, `usage.md`, source URL, license status, and allowed/disabled usage boundaries.
- Restricted asset packs can support local reference, private drafts, and gpt-image-2 briefs, but must not become NERO brand assets or public/client-facing deliverable assets without separate license review.
- If a snapshot is `blocked`, use its `blocked_reason` and `license-summary.md` to decide whether to retry, choose another candidate, or request a narrower source.
- Do not treat a case as evidence for facts, figures, market claims, or regulatory conclusions.
- Do not store client-sensitive evidence, secrets, credentials, direct personal contact/payment identifiers, or private files.
- When adding a new case, include the route, template, token usage, score, QA outcome, and usage boundary.
- Promote a GitHub snapshot into a route-specific formal case only after visual review, license boundary review, and NERO token/template adaptation.

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
