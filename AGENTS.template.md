# NERO Design Team Routing Snippet

Add this to your global or project `AGENTS.md` after installing the Skill.

```md
## Design Team Priority

When the user mentions "设计团队", "design team", "NERO Design Team", or a local project-specific design-team trigger in a design-related task, Codex must first use:

`$CODEX_HOME/skills/nero-design-team/SKILL.md`

Apply this route for frontend UI, image-style reports, PPT/PPTX, web PPT/HTML decks, short video, visual style, layout, visual QA, visual generation, design review, case-library lookup, visual scoring, and production checks.

NDT 3.0 handles software and web interfaces on desktop only. Mobile/tablet UI, phone-specific web companions, and responsive mobile adaptation must return unsupported without generation, revision, scoring, or QA. Portrait graphics and vertical videos remain media outputs.

Do not require the user to mention implementation details such as `.nero-design`, MCP, manifest, token, or template names.
```

For a private profile, replace the trigger words and profile name as needed.
