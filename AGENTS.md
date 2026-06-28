# OSS Agent Rules

This repository is the public derivative of NERO Design Team, not the canonical local source.

## Public Derivative Boundary

- Do not make generic design-team rule changes here first.
- Make canonical changes in the private/local `design-team/skill-source/nero-design-team/` tree, then sync this public derivative.
- This repository may keep public-safe rewrites only.

## Allowed Differences

- Replace absolute local paths with `$NERO_DESIGN_TEAM_HOME`.
- Replace private or restricted resources with `not-bundled-*` placeholders.
- Omit or rewrite private examples, screenshots, validation history, and local-only prompt packs.
- Keep public examples, OSS-safe scripts, public tokens, and OSS-safe snapshots.

## Required Checks

- Do not leave stale references. If `skills/nero-design-team/SKILL.md` names a reference, the file must exist under `skills/nero-design-team/references/` or the reference must be rewritten.
- Before publish or packaging work, run the repository release gate when available.
- Do not publish private overlays, client assets, local validation history, credentials, or restricted third-party assets.
