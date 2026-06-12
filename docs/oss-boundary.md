# OSS Boundary

The public package should stay portable, reusable, and free of private material.

## Public Core

- Skill routing rules
- MCP-lite tool server
- route rules and QA rules
- design tokens
- minimal templates
- generator and validation scripts
- lightweight case snapshots
- open-source-safe profile examples

## Private Overlay

Keep these in a separate private repository or local-only directory:

- official brand assets
- client screenshots or delivery files
- real customer data or evidence
- private case assets
- paid templates
- restricted third-party visual assets
- machine-specific validation history

## Release Gate

Before publishing, run:

```bash
node release-check.mjs
```

The check scans for absolute local paths, common credential patterns, private environment files, dependency folders, JSON parse errors, and accidental restricted asset directories.
