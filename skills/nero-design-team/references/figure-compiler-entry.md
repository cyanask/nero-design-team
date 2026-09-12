# Figure entry

For one explanatory report, WeChat or PPT figure, read [Figure Compiler contract](report-figure-rendering.md). NDT chooses the supported type, profile and renderer from the content and target carrier; technical parameters need not be exposed to the user.

The contract owns the nine supported types, default output mappings, editability handoff, evidence questions and candidate/receipt rules. A whole article or deck does not become one figure; a bounded figure within it may use the compiler.

Covers, photographs and conceptual imagery use [image generation](ai-image-generation.md). Technical diagrams and draw.io/Mermaid redraws use [architecture/redraw](architecture-diagram-redraw.md).

Compilation produces a candidate. The target project owns its evidence and final embedding/visual acceptance; a compile receipt never promotes the figure automatically.
