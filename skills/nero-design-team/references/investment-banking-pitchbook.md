# Investment Banking Pitch Book Rule

Use this rule for formal investment-banking pitch books, sponsor introductions, IPO advisory decks, refinancing capability decks, M&A case books, and client coverage materials.

## Visual Direction

- Default style: restrained banker book, deep navy + controlled gold + cool blue-grey paper.
- The deck should feel like a working investment-banking execution book, not a marketing brochure.
- Prefer matrices, ledgers, tombstones, transaction architecture diagrams, ranking dashboards, client maps, and source appendices.
- Avoid low-density slogan pages, decorative card stacks, repeated blank chapter pages, warm cream/pink/orange card systems, and generic bullet slides.

## Page Patterns

- `Cover Lockup`: background image may be used, but exact title/date/brand text must be code-rendered and readable.
- `Service Chain Matrix`: show pre-IPO advisory, IPO, follow-on financing, and M&A as one service chain.
- `Ranking Dashboard`: separate complete-year data from YTD or stage data; show source boundary in appendix.
- `Client Industry Map`: group clients by industry using company-name chips or verified logo assets; do not paste screenshot-style logo walls.
- `Tombstone Matrix`: code goes beside company name; field area should use `Value / Result / Execution` or equivalent three-layer structure.
- `Case Deep Dive`: one hero tombstone plus timeline, use-of-proceeds, workbench, and status boundary.
- `Transaction Architecture`: for backdoor, restructuring, asset purchase/sale, or M&A cases; show structure, difficulty, value, and execution task.
- `Execution Mechanism`: show team/process/resource mechanism and client-facing deliverables.
- `Source Appendix`: put factual boundaries, links, and methodology only at the end.

## Projection Readability

- Rendered visible text should not fall below 12px in a 1920x1080 deck preview.
- Body text, table cells, transaction field values, and service explanations should target 13-15px or larger.
- Company names, transaction names, key amounts, and regulatory status should be 16px+ when feasible.
- Page footers, page labels, stock codes, and short tags can be smaller than body text, but should still remain at or above 12px for projection decks.
- If a dense page cannot meet the readability floor, reduce repeated fields, split the page, or convert a table to a tombstone/ledger structure.

## Content And Evidence Boundary

- Never use a generated image as evidence for Chinese text, financial figures, regulatory status, source links, tables, or chart labels.
- Do not let body pages explain the design process, rewrite process, asset sources, or production notes.
- Project-specific company names, amounts, rankings, regulatory status, and source links are not reusable facts for new decks.
- Source and methodology notes belong in an appendix, not in client-facing body pages unless required for the business point.

## Workflow

1. Route the task as `ppt` or `ppt/html-pdf`.
2. Establish the banker-book visual system and page patterns before building pages.
3. Build or reuse a template with stable page furniture and tokens.
4. Render all pages to PNG and create a contact sheet.
5. Run visual QA, visual score, and projection typography audit before delivery.
6. Keep final PDF/PPTX in the user workspace; store only lightweight design references in global case library.

## Reusable Local Example

- Case id: `ppt-002-investment-banking-pitchbook-v10-2`
- Local full sample path: `private-local-sample-not-bundled/asset_manifest.json`
- Global case asset path: `$NERO_DESIGN_TEAM_HOME/case-library/assets/ppt/sinolink-ib-pitchbook-v10-2/`

## Mobile Responsive Addendum

- Current demonstration baseline: V10.2 responsive HTML.
- Desktop: preserve horizontal banker deck.
- Phone: use one-screen vertical paging; do not use long-image scroll.
- Use `visualViewport.height || innerHeight` for `--phone-page-h`; do not rely on `100svh` alone.
- Required phone tiers: `phone-small`, `phone-standard`, `phone-large`, `phone-android`, `phone-wechat`.
- QA must cover Huawei Android, Android WeChat, iPhone13, iPhone13 WeChat compact height, iPhone15Pro, iPhone15Pro compact height, iPhone Pro Max, mobile landscape, and desktop regression.
