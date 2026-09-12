# Architecture Boundary

    public NDT package + explicit project roots
                  |
          snapshot adapter
                  |
       workbench.snapshot.v1
                  |
           React adapter
                  |
          NDT Pack + Core

Core is reusable. Another distribution can replace the Pack and snapshot producer while retaining the read envelope, orthogonal source-state axes, routes, guards, and React adapter.

Application scenarios, solution labels, capability-role mappings, and boundaries are Pack data injected at the app composition root. React adapters receive scenario and studio-selection datasets from the composition root; shared Pack formatters remain presentation helpers.

Project evidence is three separate facts:

1. `ndtIntegration`: the project Manifest declares an NDT integration.
2. `declaredAssetIds`: the Manifest explicitly names stable NDT asset IDs.
3. `adoptionReceipts`: a project-local record declares adoption for a specific asset and optional artifact. The `verified` state is reserved for a future registered receipt verifier; the read-only Manifest adapter never promotes a project's self-report to verified evidence.

No layer may infer asset adoption from integration presence, case references, filenames, or directory membership.

Browser snapshots never retain project-root or package absolute paths. Recognized package references are reduced to portable relative references; unrecognized absolute references are redacted with an observation issue.

The local snapshot is a sanitized derivative observed at one time. It is never labelled live or current. The public package is explicitly `derived`, never canonical. Upstream authority and browser projection are always shown separately.

The public projection has no native desktop layer and no private preview-media pack. Registry preview declarations therefore remain `unresolved` metadata. Synthetic demo media is isolated to demo mode.


## Desktop studio information hierarchy

The approved primary destinations are Studio, Asset Library and My Projects. The studio combines a Pack-owned selection of registered assets with the six existing task scenarios. Search uses the existing shared asset filter; there is no second catalog.

Asset detail is a secondary page. App composition stores the entering route with its browser history entry as session-local navigation context; the detail returns to the studio, library, solution or project that opened it. A fresh direct asset link defaults to Asset Library. This context grants no asset eligibility or execution permission. Library filters and studio search survive their detail-return path.

The interface is desktop-only with a 900px minimum. Phone navigation, duplicated phone titles and phone detail panels are removed; desktop window resizing and reduced-motion behavior remain. The compact sidebar logo uses a separate tightly framed copy of the existing symbol, not a replacement of the official App icon or quarantined mark.

Version 1.0.0 still requires NERO's explicit satisfaction confirmation. Structural approval and technical checks do not establish that baseline.
