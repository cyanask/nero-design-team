# NERO Design Team Public Frontend

This package is a read-only React browser for the public NERO Design Team Registry bundled in this repository.

It exposes the current public-safe frontend architecture: application-scenario routing, solution detail pages, an asset directory, source-state envelopes, explicit project declarations, adoption receipts, and fail-closed deep links. It does not bundle private project data, client media, identity assets, native desktop packaging, or a private preview pack.

## Run the synthetic demo

```bash
npm install
npm run demo
```

Demo mode uses `public/demo/snapshot.json`. The fixture is synthetic and must not be treated as observed NDT data.

## Read the bundled public Registry

From `frontend/`:

```bash
npm run snapshot:sync -- --ndt-home ..
npm run dev
```

The generated snapshot stays under `.local/` and is never part of the public package. Public Registry media references remain metadata-only because private or restricted previews are intentionally not bundled.

Project roots are optional and must be explicitly authorized with `--project alias=/absolute/path` or an absolute `--projects-file`. The adapter redacts absolute paths and never promotes self-reported adoption into verified evidence.

## Checks

```bash
npm run typecheck
npm run snapshot:check -- --ndt-home ..
npm run projection:check -- --package-root ..
npm test
```

Maintainers can additionally compare the public projection with a private source checkout:

```bash
npm run projection:check -- --package-root .. --source-root /absolute/path/to/source
```

This nested package is marked `private` to prevent accidental standalone npm publication. The repository root license applies.
