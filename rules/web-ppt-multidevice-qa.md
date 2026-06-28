# Web PPT Multi-Device QA Rule

Use this rule before finalizing HTML/web pitchbook decks that are intended for desktop presentation, mobile sharing, or GitHub/Cloudflare public hosting.

## Required Viewport Matrix

Desktop:

- 1920x1080: primary presentation and PDF export baseline.
- 1440x900: common laptop browser.
- 1440x800: compact desktop height.
- 1280x800: MacBook 13 full-height browser.
- 1280x720: MacBook 13 compact browser.

Mobile portrait:

- 393x852: iPhone 15 Pro baseline.
- 393x659: compact iPhone/WebView height.
- 390x844: iPhone 13 class.
- 430x932: iPhone Pro Max class.
- 360x780 and 412x915: Android/Huawei classes.

Mobile landscape:

- 844x390: iPhone landscape deck fallback.

## Mechanical Checks

- `document.documentElement.scrollWidth === window.innerWidth` for mobile states.
- Slide/page containers do not clip text-bearing children.
- For text-bearing cards, `scrollHeight <= clientHeight + 2` unless the container is intentionally scrollable.
- No important text is hidden by `overflow:hidden`, `clip`, or `text-overflow:ellipsis`.
- No low-contrast text caused by inherited color on dark cards.
- Page footer, page number, and date do not collide with safe-area or browser UI.
- Phone page count is intentional and not inflated by automatic desktop card splitting.

## Small-Height Horizontal Rules

For compact horizontal viewports such as MacBook 13 browser windows or phone landscape:

- Prefer a compact horizontal variant over global font shrinking.
- Remove secondary micro-fields before shrinking primary claims.
- Preserve key evidence: title, main figure, proof chart, and decision/action strip.
- Hide or collapse optional input/output detail rows if they cause clipping.
- Keep the large desktop layout intact at 1920x1080.

## Output Artifacts

For each QA run, produce:

- viewport screenshots.
- a contact sheet when more than six screenshots are generated.
- JSON report with overflow and clipping findings.
- a short pass/fail summary noting which viewports were checked.

## Forbidden Completion Claim

Do not say a web deck is complete when only 1920x1080 was checked. Laptop compact-height and phone portrait must be checked when the deck is intended for public sharing.
