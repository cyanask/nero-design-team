# Generator QA

- `node scripts/nero-design.mjs list` lists all supported routes.
- `new <route>` builds tokens before copying the template.
- Existing target directories are not overwritten.
- Generated project contains `nero-design-manifest.json`.
- Manifest records route, template, design-team version, token outputs, and brand asset paths.
- Generated project contains local `theme/` assets copied from current token build.
- Template imports are localized to the generated project's `theme/` directory.
- No dependencies are installed globally or automatically.
