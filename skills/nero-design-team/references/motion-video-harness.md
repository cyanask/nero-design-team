# Motion Video Harness Rule

Use this rule when a NERO design task needs motion thinking, short video, animated explainers, frame-level QA, or a still-to-motion pipeline.

## Fused Reference

- Source: `alchaincyf/huashu-design`
- Local snapshot: `$NERO_DESIGN_TEAM_HOME/case-library/snapshots/alchaincyf__huashu-design/snapshot.json`
- Primary NERO production route remains `short-video.md` and Remotion.

## Use For

- Turning a report card, deck chapter, product concept, or data claim into a short visual narrative.
- Planning scene rhythm before building Remotion components.
- Creating motion variants from a stable design system.
- Checking whether a static visual can become a clean video without losing evidence hierarchy.

## Motion Pipeline

1. Define claim, audience, aspect ratio, duration, and output channel.
2. Write a storyboard: scene, duration, visual layer, text/caption, data/source, transition.
3. Reuse NERO tokens for type, color, chart palette, safe areas, and motion timing.
4. Use gpt-image-2 only for background/scene素材 when needed.
5. Implement exact captions, numbers, charts, and source notes in Remotion/code.
6. Render at least one key frame or short segment when feasible.
7. Run `visual-qa.md` and `short-video.md` gates.

## Motion Defaults

- Motion should reveal hierarchy, not decorate.
- Captions are primary communication for social/mobile viewing.
- Keep scene density lower than PPT and image reports.
- Use slower, cleaner transitions for charts and financial data.
- Preserve reduced-motion fallback when the same component is reused in UI or HTML.

## Hard Bans

- No TTS, voiceover, BGM, sound effects, or audio asset copying by default.
- No generated subtitles, numbers, chart labels, or source notes as final content.
- No fast motion that makes charts unreadable.
- No commercial Remotion output before license requirements are checked.
- No upstream audio/video assets, watermarks, or demo media copied into NERO.

## QA Gate

- Aspect ratio, frame rate, duration, and safe area are explicit.
- Key frames show readable captions and charts.
- Exact text/numbers/sources are code-rendered or manually verified overlays.
- Generated scene images do not contain accidental fake text or data.
- Export status is stated honestly: storyboard only, frame verified, sample rendered, or full video rendered.
