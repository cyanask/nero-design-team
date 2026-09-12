# Asset, style and case library

The machine-readable sources are `$NERO_DESIGN_TEAM_HOME/registry/design-team.json`, `registry/design-assets.json` and `registry/asset-taxonomy.json`. Use `nero_design_get_registry` for live reads. Catalog completeness does not prove runtime, visual quality or human acceptance.

## Distinct records

- Assets are independently reusable visual units: marks, palettes, typography, geometry, motion, components and executable templates. Whole styles/cases, prompts, tools, rules, repositories and placeholders are not active visual assets.
- Styles are versioned combinations of exact asset references, purposes, combination rules, parameters, optional templates, prompts and previews. Cases are complete examples and link separately. Existing non-visual dependencies retain their IDs in supporting resources.
- Asset taxonomy has ten visual dimensions: composition, typography, color, material, geometry, image-treatment, motion, mood, component and method. Usage tags separately identify frontend, poster, GUI, PPT, report, social or video. Unasserted dimensions stay empty; do not duplicate assets to classify them across media.

## Style lifecycle

- States remain `candidate`, `approved` and `disabled`. Only explicit NERO confirmation of the exact version permits approval and mature-style recommendation. Legacy registration, scores or preview labels do not establish approval; selecting a preset does not approve it.
- Editing appends a candidate version and preserves approved and historical manifests. Prompt changes belong to the new version.
- Deletion withdraws display/recommendation while preserving stable IDs, historical manifests and underlying sources. Retired assets leave new selectors; historical styles retain their exact references. New versions cannot add retired assets.
- The frontend and MCP read the same Registry. The canonical style service uses current-revision checks, an exclusive lock, exact-byte backups and atomic replacement. A stale lock requires inspection. Snapshot/demo modes remain read-only.

## Intake and lookup

Read the canonical `registry/README.md` for `ndt.asset-intake.v1` and `scripts/asset-library-cli.mjs check|register`. Validate source containment, independent reuse, rights, tags, a real local preview and duplicates before registering against the checked revision. A batch supports 1–1000 records; the catalog may be larger. Intake does not approve style or visual readiness.

Missing case images remain explicitly missing. Method references must not be presented as completed cases. Project photos and client material remain project-local.

Use `include_library: true` for the live catalog, `recommended_only: true` for approved recommendations, or `style_id` plus `style_version` for historical lookup. Asset filters and pagination do not silently filter style versions. Public packages may omit private style records and previews.

## External method selection

Use the relevant Registry entries for known references and search outside the catalog when the director exploration branch calls for it. Inspect actual previews and record source, version, purpose, rights and exclusions; the catalog is not a reference whitelist. Apply [external boundaries](external-design-reference-boundaries.md). Upstream methods do not become independent controllers or override the project's engine registry.

Use the existing chart, renderer or video tools selected by the medium. Formal PPTX follows the current project's engine registry; PptxGenJS remains an explicitly selected legacy option.
