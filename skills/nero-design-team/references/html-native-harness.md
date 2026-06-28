# HTML Native Harness Rule

Use this rule when NERO Design Team needs HTML-native visual production, multi-format prototypes, design variants, brand-asset protocol, or a bridge from visual exploration to PPT/image/video outputs.

## Fused Reference

- Source: `alchaincyf/huashu-design`
- Local snapshot: `$NERO_DESIGN_TEAM_HOME/case-library/snapshots/alchaincyf__huashu-design/snapshot.json`
- License status: permissive, but upstream assets are still external references and are not NERO-owned brand assets.

## Use For

- HTML-native app or web visual prototypes.
- Multiple visual directions before choosing one.
- Brand asset intake rules: logo, colors, typography, screenshots, existing product UI, and forbidden usage.
- Visual QA loops for HTML artifacts before exporting PNG/PDF/PPT-like outputs.
- Motion or short-video planning when a coded visual system should become animated scenes.

## NERO Workflow

1. Route through NERO Design Team first.
2. Define route, audience, output format, target size, tokens, brand assets, and evidence-bearing content.
3. Produce a small style matrix only when a direction is not already locked.
4. Use NERO tokens and local project assets; do not copy upstream HTML, media, or brand examples as production assets.
5. Build the chosen NERO-native artifact.
6. Run `visual-qa.md`; for web/PPT-like output also use `web-ppt.md` or `html-deck-style-discovery.md` as applicable.

## Variant Discipline

- Use 2-3 meaningfully different variants, not many decorative permutations.
- Variants should differ by information hierarchy, density, typography rhythm, image treatment, or interaction model.
- Keep one shared content model across variants so the comparison is about design quality, not different arguments.
- Record the chosen direction and why it fits NERO's audience.

## Brand Asset Protocol

- Treat supplied brand assets as project-local inputs unless NERO explicitly promotes them to the central design system.
- Do not move client/project assets into `$NERO_DESIGN_TEAM_HOME/` by default.
- If a project needs a reusable brand package, write a manifest that records asset source, allowed use, route, tokens, and expiry/review status.
- External repo images, audio, sample screenshots, and logos are reference-only unless separately licensed and approved.

## Hard Bans

- Do not enable TTS, audio generation, voice cloning, background music, or sound effects by default.
- Do not copy upstream audio, video, PNG, HTML demos, watermarks, or full asset folders into NERO.
- Do not add default watermarks to NERO outputs unless NERO explicitly asks for watermarking.
- Do not write API keys, provider config, cookies, tokens, or secrets.
- Do not treat generated images as carriers of exact text, financial data, tables, chart labels, source notes, or regulatory conclusions.

## Completion Gate

Report:

- route and output format;
- whether a style matrix was used;
- tokens and brand assets used;
- whether any external reference was used and at what boundary;
- visual QA results;
- remaining unverified export or license risks.
