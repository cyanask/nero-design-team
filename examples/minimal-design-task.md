# Minimal Design Task

Example trigger:

```text
Use the design team to create a compact frontend dashboard for an AI industry research workflow.
```

Expected agent flow:

1. Route to `frontend-ui`.
2. Load tokens and frontend rules.
3. Use `templates/frontend-dashboard`.
4. Check case snapshots if useful.
5. Run visual QA and optional scoring.
6. Report route, tokens, template, references, QA, and remaining unverified items.
