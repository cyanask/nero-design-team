# Motion Video Harness Rule

Use this rule for motion thinking, short video, animated explainers, frame-level QA, or a still-to-motion pipeline.

## Fused Reference

- Source: `alchaincyf/huashu-design`.
- Public snapshot: `not-bundled-snapshots/alchaincyf__huashu-design`.
- Primary production remains `short-video.md` and Remotion.

## Use For

- Turning a report card, deck chapter, product concept, or data claim into a short visual narrative.
- Planning scene rhythm before Remotion implementation.
- Creating motion variants from a stable design system.
- Assessing whether a static visual can move without losing evidence hierarchy.

## Motion Pipeline

1. Define claim, audience, aspect ratio, duration, and channel.
2. Write a storyboard with scene, duration, visual layer, text/caption, data/source, and transition.
3. Reuse NERO tokens for type, color, chart palette, safe areas, and timing.
4. Use generated imagery only for background/scene material when needed.
5. Implement exact captions, numbers, charts, and sources in code.
6. Render at least one key frame or short segment when feasible and authorized.
7. Run `visual-qa.md` and `short-video.md` gates.

## Motion Defaults

- Motion reveals hierarchy; it does not decorate.
- Captions are primary for social/mobile viewing.
- Scene density is lower than PPT and image reports.
- Charts and financial data use slower, cleaner transitions.
- Preserve reduced-motion fallback when components are reused in UI/HTML.

## Hard Bans

- No TTS, voiceover, BGM, effects, or audio copying by default.
- No generated subtitles, numbers, chart labels, or source notes as final content.
- No motion that makes data unreadable.
- No commercial Remotion output before license requirements are checked.
- No upstream media, watermarks, or demo assets copied into NERO.

## QA Gate

- Aspect ratio, frame rate, duration, and safe area are explicit.
- Key frames show readable captions and charts.
- Exact content is code-rendered or manually verified.
- Generated scene imagery has no fake text/data.
- Export status is honestly stated: storyboard only, frame verified, sample rendered, or full video rendered.
