# Design method cards

Consult a matching card when diagnosis is unclear, a new method is useful or repeated changes are not helping. View its teaching example only when needed to understand the method; an obvious local repair does not require a card or example. Actual inspection of the current work and any adopted reference remains necessary. These original schematics demonstrate a change in method, not a required style or a proven result for the user's project. The examples preserve their illustrative content; do not treat their colors, fonts or spacing as universal tokens.

| Problem | Card |
|---|---|
| Competing focal points | M01 — Hierarchy |
| Crowding or unclear relationships | M02 — Grouping and spacing |
| Weak text hierarchy or tiring reading | M03 — Typography roles |
| References/assets look pasted together | M04 — Cross-asset composition |
| Directions are repetitive or uninspired | M05 — Search by method |
| Motion distracts or breaks continuity | M06 — Motion purpose |

## M01 — Hierarchy

- **Problem:** headings, imagery, metrics and actions compete for first attention.
- **Evidence:** identify the intended first reading target; inspect a thumbnail or brief glance and record which element actually dominates. Distinguish observed reviewer feedback from the model's hypothesis.
- **Action:** choose the primary target, then change relative size, contrast, placement or surrounding space. Assign supporting content a secondary role; preserve all necessary wording and data.
- **Effect check:** compare the same content at the same size. Is the intended target found first, and can the reader still locate the next action and evidence?
- **Do not apply mechanically:** emergency warnings or truly equal peer items may need multiple comparable focal points. Do not shrink essential qualifications to manufacture hierarchy.
- [View the hierarchy comparison](../assets/methods/hierarchy.png).

## M02 — Grouping and spacing

- **Problem:** the page feels crowded, scattered, or makes it unclear which labels, values and controls belong together.
- **Evidence:** trace the task sequence and real semantic groups. Look for equal gaps separating both related and unrelated items, accidental alignment and hidden scroll/overflow.
- **Action:** tighten spacing inside a group and separate groups, align useful reading axes, rebalance columns or use a divider/container where it clarifies membership. Adjust density to the task; add no arbitrary whitespace target.
- **Effect check:** at the actual narrow and wide sizes, can readers match related items and reach required content without losing reading order? Retain all necessary information.
- **Do not apply mechanically:** a time-critical monitoring screen may need dense adjacency; a narrative cover may use open space. Neither is a universal model for the other.
- [View the grouping comparison](../assets/methods/grouping.png).

## M03 — Typography roles

- **Problem:** headings blend into body text, numeric columns are hard to scan, or long text is tiring.
- **Evidence:** inspect the actual font, language coverage, role hierarchy, line length/height, contrast and rendering at target size or zoom. Font names alone do not demonstrate readability.
- **Action:** first coordinate family, size, weight, line height and spacing by semantic role; change families when the brief and observed problem justify it. Preserve numeric alignment, long labels and explicit brand locks.
- **Effect check:** headings are distinguishable, the long passage remains comfortable, and source notes/units stay legible without clipping or fallback glyphs.
- **Do not apply mechanically:** display lettering may be appropriate for a cover but not a dense table; neutral system fonts can be the right choice. Do not ban a family by name.
- [View the typography comparison](../assets/methods/typography.png).

## M04 — Cross-asset composition

- **Problem:** useful references or independent assets look like separate style packages pasted together.
- **Evidence:** identify each asset's purpose and the conflicting typography, spacing, color roles, material strength, line weight or motion behavior. Preserve distinctions that actually convey meaning.
- **Action:** choose a dominant direction and give other assets explicit roles. Adapt their type relationships, spacing, palette semantics and material intensity through a small project-local parameter set. Borrow a method or component, not every trait of a package.
- **Effect check:** the assets form one understandable reading/action sequence while their useful functions survive; compare real trial renders. Check whether the combination fits the subject, not whether it resembles NDT.
- **Do not apply mechanically:** intentional contrast, editorial collage or separate state categories can be valid. Unification should not erase hierarchy, brand requirements or meaning.
- [View the composition comparison](../assets/methods/composition.png).

## M05 — Search by method

- **Problem:** local candidates do not fit, all directions look alike, or iteration changes decoration without improving the result.
- **Evidence:** name the missing operation: hierarchy, grouping, navigation, status, explanation, rhythm, material or motion. Verify that candidate directions differ in composition/experience rather than just hue.
- **Action:** search local and online references by that operation and the audience. A GUI may borrow editorial grouping or instrument-state clarity. Inspect the actual example, extract the relevant relationship, and exclude unrelated brand/content or unlicensed material. In open exploration retain an independently composed direction within the task constraints.
- **Effect check:** explain the different intended effects and reference contributions; test a representative slice with the same task content. Local reuse count is not a quality measure.
- **Do not apply mechanically:** local repair or strict template following does not require broad discovery every time. Search availability and viewing gaps must remain explicit.
- [View superficial variants versus distinct directions](../assets/methods/exploration.png).

## M06 — Motion purpose

- **Problem:** animation obscures content, delays repeated work, breaks object continuity, or contributes no useful meaning.
- **Evidence:** name its purpose (feedback, spatial change, causality, progression or deliberate emphasis), action frequency and interaction contract. Observe the actual transition, interruption and reduced-motion state.
- **Action:** keep the useful relationship and adjust motion to that role. Preserve immediate control feedback and interruptibility where supported. Use an equivalent static state; remove motion only when it contributes no useful effect or violates a constraint.
- **Effect check:** users can track the change and still control the interface; labels/evidence remain accessible. Test actual behavior and reduced-motion support when implementing it. A frame sequence alone cannot prove live interaction.
- **Do not apply mechanically:** expressive motion can suit a launch, lesson or film. No global duration, low-motion setting or ban on animation replaces task judgment.
- [View schematic continuity frames](../assets/methods/motion.png).

## Source and example boundary

The task-driven framing draws on [Anthropic frontend design](https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md). Problem-specific diagnosis and adjustment organization draws on [Impeccable critique](https://impeccable.style/docs/critique/), [layout](https://impeccable.style/docs/layout/) and [typeset](https://impeccable.style/docs/typeset/). These are selected methods, not imported style bans or installed controllers. NDT's task, authority and evidence contracts remain its own.

The PNG comparisons are original, synthetic instructional examples built by the [bundled renderer](../scripts/render-method-examples.py) in this Skill. No upstream screenshots, client material or font files are bundled. They are not registered mature styles; a successful example render does not validate a future project.
