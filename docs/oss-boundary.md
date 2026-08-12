# OSS Boundary

The public package should stay portable, reusable, and free of private material.

## Public Core

- Skill routing rules
- MCP-lite tool server
- route rules and QA rules
- design tokens
- minimal templates
- generator and validation scripts
- deterministic local runtimes and source-free examples
- lightweight case snapshots
- open-source-safe profile examples
- public-safe frontend source and synthetic demo fixture
- NERO-native style contracts without external fonts, identity assets, or project facts

## Private Overlay

Keep these in a separate private repository or local-only directory:

- official brand assets
- client screenshots or delivery files
- real customer data or evidence
- private case assets
- paid templates
- restricted third-party visual assets
- machine-specific validation history
- native desktop wrappers, private preview media, and project-specific frontend manifests

## Release Gate

Before publishing, run:

```bash
node release-check.mjs
```

The check scans for absolute local paths, common credential patterns, private environment files, dependency folders, JSON parse errors, and accidental restricted asset directories.

Run the gate against a clean tracked export or release candidate. A private overlay may coexist beside the source checkout, but it must not be copied into the publish candidate.
