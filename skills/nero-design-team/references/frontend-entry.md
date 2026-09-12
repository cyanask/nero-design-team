# Frontend entry

Read [frontend rules](frontend-ui.md) for the current UI task. Start from the actual user goal and any explicitly selected visual system. Apply the director exploration branch and inspect real reference previews.

This route accepts desktop software and desktop web interfaces only. Mobile/tablet targets, phone-specific companions and responsive mobile adaptation are unsupported and must return without code generation, revision, scoring or QA.

| Condition | Additional rule |
|---|---|
| AI application, Agent workbench, tool calling or human confirmation | [AI App UI](ai-app-ui.md), with `frontend_profile: ai-app-ui` |
| Meaningful press, popover, drawer, gesture or interruptible animation | [frontend motion](frontend-motion.md); remain on `frontend-ui` |
| Self-contained HTML explainer or visual plan | [effective HTML](effective-html.md) |
| HTML prototype or design variants | [HTML harness](html-native-harness.md) |
| System diagram or source redraw | [architecture/redraw](architecture-diagram-redraw.md) |

Use only the matching [visual QA](visual-qa.md) sections. Static design checks, rendered evidence, live controls and human acceptance remain distinct.

NDT-calibrated external methods are already in these rules. Read source/version/license metadata from the Registry when materially using an external reference; do not install upstream Skills or packages as parallel design controllers.

Asset/style/case maintenance uses [library contract](repo-registry.md). The maintenance app's button placement and deletion UI are product requirements, not requirements for unrelated frontend designs.
