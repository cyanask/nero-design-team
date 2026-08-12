# Contributing to NERO Design Team

Thanks for helping improve the public NERO Design Team distribution.

This repository accepts changes that are reusable, attributable, and safe to publish. It is a public derivative, so a technically useful contribution can still be out of scope when it contains private, client-specific, identity-bearing, or redistribution-restricted material.

## Good Contributions

- bug fixes with a focused regression test;
- clearer installation, routing, or boundary documentation;
- public-safe design rules and deterministic QA checks;
- synthetic fixtures that reproduce a general design problem;
- portability and accessibility improvements;
- metadata-only references with an explicit source and license boundary.

## Do Not Submit

- client names, evidence, screenshots, deliverables, or project facts;
- credentials, environment files, absolute local paths, or validation history;
- official or private identity assets;
- paid templates, copied third-party examples, or assets without redistribution rights;
- generated exact financial text, figures, chart labels, source notes, or regulatory wording presented as evidence.

If an issue may expose a secret, private identity, client material, or a security vulnerability, do not include the sensitive material in a public issue. First reduce it to a safe reproduction or contact the maintainers through an available private GitHub reporting channel.

## Before You Open a Pull Request

Keep the change narrow and explain:

1. the design or engineering problem;
2. which public route, asset, or runtime is affected;
3. the source and redistribution boundary of any external reference;
4. the validation you ran;
5. what remains unverified.

Run the root checks relevant to your change:

```bash
npm run registry:check
npm run test:mcp
npm run test:figure-compiler
npm run frontend:projection
npm run release:check
```

For public frontend changes, also run:

```bash
cd frontend
npm ci
npm run typecheck
npm test
```

Visual changes are not complete from source checks alone. Include target dimensions or viewports and describe the rendered states you inspected. Keep screenshots synthetic and free of private material.

## Registry and Asset Rules

- Use stable IDs and keep Registry references closed.
- Prefer contracts, rules, and synthetic fixtures over copied media.
- Mark placeholders as placeholders.
- Keep public Registry media metadata-only unless redistribution rights are established.
- Do not infer verified adoption from a project reference or self-reported manifest.
- A generated or compiled artifact remains a candidate until its explicit QA and promotion gates pass.

## Commit and Pull Request Style

Use a short, outcome-oriented title. Keep unrelated cleanup out of the same pull request. A good description states what changed, why it is public-safe, which checks passed, and any remaining limitation.

By contributing, you agree that your contribution is licensed under the repository's [Apache License 2.0](LICENSE).
