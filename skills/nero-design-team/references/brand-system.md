# Brand System Rule

Use this rule when creating a new artifact, refreshing visual direction, building a cover, designing a PPT master, or auditing whether an output feels like NERO rather than a generic template.

## Required Files

- Brand profile: `$NERO_DESIGN_TEAM_HOME/brand/brand-profile.json`
- Master layouts: `$NERO_DESIGN_TEAM_HOME/brand/master-layouts.json`
- Cover system: `$NERO_DESIGN_TEAM_HOME/brand/cover-system.md`
- Chart style: `$NERO_DESIGN_TEAM_HOME/brand/chart-style.md`
- PPT master: `$NERO_DESIGN_TEAM_HOME/brand/ppt-master.md`

## Routing

- `frontend-ui`: use brand profile and `frontend_dashboard` layout guidance.
- `image-report`: use cover system, chart style, and `report_card_image` layout guidance.
- `ppt`: use PPT master, cover system, and chart style.
- `short-video`: use cover system, chart style, and `short_video` layout guidance.
- `ai-image-generation`: use cover system and safe overlay area rules.

## Rules

- Treat current SVG logo/wordmark as placeholders unless official NERO assets are supplied.
- Use design tokens before inventing custom colors, type, spacing, or chart palettes.
- Keep brand expression quiet, professional, and evidence-first.
- Do not let brand decoration compete with sources, figures, or conclusions.
- State when a project uses placeholder brand assets.
