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

Application scenarios, solution labels, capability-role mappings, and boundaries are Pack data injected at the app composition root. React adapters must not import the NDT Pack directly.

Project evidence is three separate facts:

1. `ndtIntegration`: the project Manifest declares an NDT integration.
2. `declaredAssetIds`: the Manifest explicitly names stable NDT asset IDs.
3. `adoptionReceipts`: a project-local record declares adoption for a specific asset and optional artifact. The `verified` state is reserved for a future registered receipt verifier; the read-only Manifest adapter never promotes a project's self-report to verified evidence.

No layer may infer asset adoption from integration presence, case references, filenames, or directory membership.

Browser snapshots never retain project-root or package absolute paths. Recognized package references are reduced to portable relative references; unrecognized absolute references are redacted with an observation issue.

The local snapshot is a sanitized derivative observed at one time. It is never labelled live or current. The public package is explicitly `derived`, never canonical. Upstream authority and browser projection are always shown separately.

The public projection has no native desktop layer and no private preview-media pack. Registry preview declarations therefore remain `unresolved` metadata. Synthetic demo media is isolated to demo mode.
