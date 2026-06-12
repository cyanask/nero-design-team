# Private Overlay

Use a private overlay when your team needs local brand, project, or client-specific extensions.

Suggested layout:

```text
nero-design-team-private/
  profiles/<profile-name>/
    brand-profile.json
    master-layouts.json
    assets/
  case-library/assets/
  validation/
  local-config/
```

The public repo should remain installable without this overlay. Private overlays can be referenced through project manifests, environment variables, or local AGENTS rules.
