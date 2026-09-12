# System-only distribution

NDT publishes its system code and Skill, not NERO's asset, case or style libraries.

All three library indexes must be empty in a release. Personal styles, cases, external snapshots, library metadata and preview media must not be copied from the private workspace, even when an earlier release called them public-safe.

Generic software support remains distributable: schemas, default UI tokens, minimal implementation templates, system icons, Skill instructions, deterministic runtimes and synthetic test fixtures. Fixtures are not library entries or observed user results.

Local library additions remain private. The public frontend is read-only, not a complete editing UI.

Run `npm run release:check` against a clean candidate. Preserve this boundary in the canonical OSS projection policy so later syncs cannot restore library content.

This policy governs current and future distributions. Historical commits, tags and downloads require a separate history-removal operation; current-file deletion cannot retract downloaded copies.
