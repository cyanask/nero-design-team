# NDT Figure Compiler QA

- Validate the Figure Spec before compilation.
- Record one target profile: `report-a4`, `wechat-inline`, or `ppt-16x9`.
- Record one compiler renderer: `vector-svg` or `raster-canvas-png`; treat `office-native` as handoff-only.
- Confirm the v0.2 figure type is one of `flow`, `hierarchy`, `timeline`, `funnel`, `bar`, `line`, `participant_map`, `matrix`, or `value_chain`.
- For `flow`, keep nodes in display order and provide exactly the adjacent directed `from`/`to` edges accepted by the v0.2 contract.
- For every quantitative type, keep period, unit, denominator, and value basis consistent with its v0.2 contract.
- Confirm NDT natural-language routing did not misclassify a cover, photograph, illustration, background, or concept visual as a report figure.
- Keep the title, period, unit, denominator, and source scope consistent with the surrounding report.
- Use an exact evidence locator for formal figures when the project evidence contract requires it.
- Inspect the compiled artifact at its intended reading size; a successful compile does not establish visual or factual approval.
- Keep project facts, evidence, outputs, and receipts outside the NDT template source.
