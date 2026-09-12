# Public Asset Registry

## Asset tags and style versions

`asset-taxonomy.json` is the single vocabulary for ten visual dimensions: `composition`, `typography`, `color`, `material`, `geometry`, `image-treatment`, `motion`, `mood`, `component`, `method`. Every asset has all ten arrays, at least one supported visual label, and a separate nonempty `use_case_tags` array drawn from `frontend / poster / GUI / PPT / report / social / video`. Unasserted dimensions remain empty. `tag_dimensions` is a checked compatibility projection, not a second vocabulary.

Stable IDs, original categories, sources, routes and `asset_version` references remain compatible. Categories describe source kinds only. Query aliases accept old `graphics`, `imageTreatment` and `usage` names without persisting a second classification. Migration versions identify catalog metadata, not source-file releases or visual acceptance. Method/component classification does not promote reuse or style approval.

Style manifests contain asset/version/use references, rules, parameters, optional template references and previews. `scripts/style-library.mjs` is the shared local read/write seam. Each save appends a candidate; approval requires NERO confirmation of that exact candidate; replacing an approved version retires its recommendation but preserves its manifest. Delete sets a tombstone, preserving historical lookup by style ID and version. Writes require the current revision, take an exclusive lock, back up exact previous bytes to `registry/style-history/`, then atomically replace the catalog. A lock left by an interrupted process is fail-closed and requires inspection before removal.

The frontend refreshes while open and immediately after a save. MCP reads the file on each call. Any private downstream export remains a sanitized asset projection; private style manifests are not exported to downstream systems or public packages. No asset files or historical project manifests are changed by style operations.

## Unified asset intake

Start with `registry/asset-intake.example.json` and replace its illustrative fields. The source must already exist inside this design library. A directory asset lists its member files; every new asset must declare `asset_type` and a real preview using `preview.source_ref` for a local PNG/JPEG/WebP thumbnail up to 2 MB. Nothing is downloaded or copied by intake.

1. Run `node scripts/asset-library-cli.mjs check <manifest.json>` to validate the whole batch and obtain the current revision. This does not write.
2. Run `node scripts/asset-library-cli.mjs register <manifest.json> <revision>` to atomically append the validated batch. Missing/unknown tags, source escapes, duplicate IDs, duplicate source scopes, identical registered file contents and stale revisions fail without partial writes.
3. The live App and MCP read the same Registry. New IDs appear without a snapshot rebuild, with their required source-backed previews; registered dynamic previews load on demand. The asset grid paginates at 105 items, while filtering searches the entire catalog. MCP supports `offset`/`limit` up to 1000 per page.

IDs use the existing category prefix and at least three digits, so a category can grow beyond 999. One batch supports up to 1000 records; the catalog has no 1000-record ceiling. New entries default to candidate/conditional. A content fingerprint is taken at registration for exact-file comparison, and asset/style operations use the same revision lock and exact-byte backup in `registry/style-history/`. Existing records are never overwritten by intake. The source files remain owned by their existing paths.

Taxonomy changes start in the one canonical vocabulary and increment its version; update affected records and the checked build-time frontend mirror together. Runtime UI and MCP prefer the live vocabulary. `scripts/test-asset-library.mjs` and the frontend catalog tests cover intake, duplicate handling, rollback, shared concurrency, multi-scene retrieval and catalogs beyond 1000 records.

## Asset, style and case boundaries

The asset library contains independently reusable visual units only: brand marks, palettes, typography, spacing, geometry, shadows, motion, components and executable templates. Whole styles, complete cases, prompts, rules, tools, repository snapshots, placeholders and duplicate token outputs must not enter `assets`. Every active asset has a source-backed local preview.

Complete registered cases live in `cases`, exposed at `#/cases`. A missing finished image stays explicitly missing; a method reference must be labelled as a reference. `supporting_resources` preserves non-browsable source dependencies and old IDs. Legacy links resolve to the case page or a reference notice. Source files needed by styles, routes or history are retained.

Each current style version combines concrete asset IDs and versions, rules and parameters with its own `prompts`. `case_ids` links complete examples; `resource_ids` preserves production references. A save appends a candidate and never rewrites an old version. Only an explicit NERO decision can approve it. Recipes keep typed `asset_ids`, `case_ids` and `resource_ids`; a workflow may legitimately have no direct visual asset.

Check the generated rule view with `node scripts/sync-skill.mjs`; an authorized refresh requires an exact-byte backup using `--write --backup <new-directory>`.
