# Short Video Rule

Use this rule for future short videos, animated research cards, data explainers, and social video formats.

## Routing

- Primary engine: Remotion.
- Use `motion-video-harness.md` when a task needs storyboard discipline, visual-to-motion conversion, or frame-level production planning.
- Reuse React components, chart components, and report-card visual tokens where possible.
- Use Magic UI or motion libraries only when motion communicates structure or emphasis.
- Convert chart scenes into video using rendered components, SVG, Canvas, or image frames.
- Use `ai-image-generation.md` for background scenes, storyboard stills, or visual texture only; exact captions, figures, charts, and source notes stay in Remotion/code.
- Use NERO design tokens for colors, captions, chart palette, safe areas, and motion rhythm.

## Design Standard

- Build tokens first with `$NERO_DESIGN_TEAM_HOME/scripts/build-tokens.mjs` when using local templates.
- Start with a clear claim, question, or key number.
- Use a storyboard before coding: scene, duration, visual, text, data source.
- Keep each scene visually simple enough for mobile viewing.
- Use captions as primary communication, not afterthoughts.
- Use motion to reveal hierarchy, not to decorate.

## Hard Bans

- No commercial Remotion use before license requirements are checked.
- No default TTS, voiceover, BGM, sound effects, upstream audio/video assets, or watermarks.
- No generated image text, numbers, subtitles, chart labels, or source notes as final video content.
- No data video without source and metric definitions.
- No fast transitions that make charts unreadable.
- No long subtitle lines that exceed mobile-safe width.
- No auto-generated visuals without frame-level QA.

## Deliverable Requirements

- Define aspect ratio before implementation: 9:16, 16:9, or 1:1.
- Define frame rate and duration.
- Verify at least one rendered frame or short sample where feasible.
- Keep source data and storyboard traceable.
- Report whether the output is storyboard-only, frame-verified, sample-rendered, or fully rendered.

## Prompt Snippet

Use the NERO Design Team short-video route: Remotion for React-based video generation, reused chart/report components where possible, and restrained motion focused on data storytelling. Build from a storyboard and verify frame readability.
