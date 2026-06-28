# Brand Lockup Governance

Use this rule when revising logos, wordmarks, lockups, nav brands, public package brand assets, or cross-product brand consistency.

## Operating Principle

Brand work is not screenshot tracing. First identify the source-of-truth geometry and the product context, then decide whether the asset, the rendered size, or both should change.

## Source Of Truth

- Search for existing generated marks, SVG assets, canvas drawing functions, and approved screenshots before recreating a logo by eye.
- If an approved product already has the right mark, reuse its geometry, colors, typography proportions, and spacing as the master reference.
- Prefer a project-level brand asset over an external placeholder when the mark is accepted for a real product family.
- Keep public asset paths stable when the publishing boundary is strict; replace the file contents instead of adding sidecar assets unless the user explicitly approves a boundary expansion.

## Asset Versus Display Size

- Separate master asset quality from per-surface display size.
- Do not shrink or distort the SVG master just because one nav bar needs a smaller logo.
- Use CSS or renderer parameters for surface-specific sizing.
- Keep the lockup aspect ratio intact; use `object-fit: contain` or equivalent layout constraints.

## Lockup Composition

- If the asset contains the full lockup, remove duplicated HTML/CSS wordmark text.
- Preserve `alt` or `aria-label` such as `AIpha Research Desk` so accessibility and validation still have text.
- On dark nav bars, do not wrap the mark in a white tile unless the brand system explicitly requires it.
- Avoid over-tracking compact uppercase subtitles; NERO research tools should feel precise, not decorative.

## Size Hierarchy

- Match size to product role, not brand ego.
- Report covers, cards, and editorial lead images can use larger lockups.
- Dense repeat-use tools, dashboards, and news radars should treat the logo as system chrome; it should be smaller than the data and status controls.
- When borrowing from a stronger/editorial product, start at 70-80% of that product's rendered lockup size. If it still competes with the interface, reduce to about 60-70%.
- Do not universalize one pixel size. Record the ratio and the reason. For the AIpha case study, Serenity Lens can carry a larger lockup, while AIpha-Radar settled on a smaller tool-nav size of roughly `112x36` desktop and `90x29` mobile for the same lockup aspect ratio.

## Public Package Boundaries

- Before publishing, list public files and verify the whitelist.
- Do not publish JSON, manifests, archives, local-only outputs, mapping tables, caches, rejected queues, or structured research assets when the user requested an HTML-only public package.
- If a public repo already contains old sidecars, remove them only in the temporary publishing clone and only when that is part of the approved public package boundary.

## QA Checklist

- Render the real output, not just the source asset.
- Confirm exactly one visible logo instance unless the layout intentionally needs more.
- Confirm no duplicated `.wordmark`, `.aipha-word`, or equivalent text appears beside a full lockup asset.
- Confirm desktop and mobile dimensions are explicit and do not overlap status chips, toggles, or primary controls.
- Search generated HTML/CSS for old dimensions after resizing.
- Compare visual weight against the nearest approved sibling product.
- If published, verify the live page after the deployment status is built, not only the local package.

## Failure Modes To Avoid

- Recreating an approved logo from a screenshot when the original drawing code or asset exists.
- Treating a larger logo as automatically more premium.
- Changing the master SVG to solve a single surface's layout problem.
- Adding new public brand files when a strict whitelist requires the same asset path.
- Saying the frontend is updated before regenerating the actual HTML package.
