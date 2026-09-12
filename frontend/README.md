# NERO Design Team Public Frontend

This package is a read-only React browser for the public NERO Design Team Registry bundled in this repository.

Version `0.5.0` is the desktop-only public derivative reviewed against the accepted private frontend `0.5.11` source baseline. Shared scenario, Registry, source-state, desktop-window, and accessibility contracts are retained. Mobile/tablet adaptation, native packaging, local Registry mutation UI, private preview media, and the private desktop visual shell are deliberately excluded.

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

The generated snapshot stays under `.local/` and is never part of the public package. The 12 active public assets resolve only to the explicitly bundled synthetic/source-render previews under `public/library-previews/`; private and restricted previews remain unbundled metadata.

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

## Asset directory semantics

The application-scenario entry is retained. The asset directory defaults to all assets; previews are an optional filter. Space-separated search terms match together, including canonical aliases. Reuse state and maturity come from canonical asset metadata and do not imply acceptance; older snapshots without those fields display unknown. The frontend remains read-only. Source validation does not update an already-built desktop application.


## Information flow implementation (2026-09-08)

The same six scenarios now expose sixteen registered solutions, including the AI app workbench under product UI. Solution rows distinguish direct outputs from downstream targets. The directory keeps category, recipe, reuse state and preview filters independent; selection keeps them in place. A solution-to-asset link carries a session-local return context without changing public routes.

The single asset inspector puts purpose and restrictions before its copy action. Copy failures expose the complete text for manual recovery, and late copy completion cannot mark another asset copied. Layout uses existing NDT token variables and a minimum 900px desktop canvas. Current-file validation remains separate from browser and installed-app acceptance. Existing local project snapshots are not overwritten by this presentation change.
