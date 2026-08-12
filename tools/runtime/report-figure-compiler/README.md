# NDT Figure Compiler runtime

Central deterministic backend for project-local, evidence-bearing figures. Projects keep their own Specs, source locators, outputs, and receipts; they call this runtime through the public Node entrypoint instead of copying layout code.

## Public CLI

```sh
node scripts/report-figure-compiler.mjs list
node scripts/report-figure-compiler.mjs validate --spec /path/to/figure.json
node scripts/report-figure-compiler.mjs compile --spec /path/to/figure.json --out /path/to/candidate.svg --receipt /path/to/candidate.receipt.json
```

Set `NERO_FIGURE_PYTHON` when a specific Python runtime is required. `vector-svg` uses the Python standard library. `raster-canvas-png` additionally requires Pillow and fails closed when no compatible runtime is available.

## v0.1 contract

- Figure types: `flow`, `timeline`, `hierarchy`, `matrix`, `bar`.
- Profiles: `report-a4`, `wechat-inline`, `ppt-16x9`.
- Renderers: `vector-svg`, `raster-canvas-png`.
- `office-native` is handoff-only and is not implemented by this runtime.

## v0.2 additions

Compiler `0.2.0` keeps schema `0.1.0` valid for the original five figure types. The four new types require `schema_version: 0.2.0`:

- `funnel`: quantitative conversion funnel or qualitative stage-gate snapshot. A `stage_gate` value records each stage's current status; it is not a state machine or transition history.
- `line`: quantitative trend series. `x_labels` are rendered in the exact input order; the compiler does not infer or sort chronology.
- `participant_map`: a two-axis competitive positioning map with normalized `x`/`y` coordinates and a stated scoring `basis`. It does not model ecosystem relationship lines or network edges.
- `value_chain`: ordered value-chain stages with a declared profit/value metric and quantitative context. Schema v0.2 accepts non-negative values only, including for `gross_margin`; negative margin and loss stages require a future signed-value layout contract.

Use a separate network or ecosystem-map contract if explicit participant relationships are required; do not infer them from `participant_map` coordinates.

### Runtime-authoritative constraints

`figure.schema.json` validates the field whitelist, scalar types, enumerations, ranges, basic array bounds, and constraints that standard JSON Schema can express. It is not sufficient by itself to predict final acceptance. The public CLI runtime validator and profile-aware layout QA are authoritative for:

- non-increasing quantitative-funnel values and unique stage ids;
- line-series length matching the supplied `x_labels` and unique series names;
- `value_share` stages summing to 100 within tolerance;
- participant id/coordinate uniqueness and circle collision after coordinates are mapped to the final profile.

Quantitative funnel polygon widths use a non-linear `log1p` readability transform plus minimum visual separation, so distinct values remain visibly distinct. Exact numeric labels are authoritative; polygon widths are not linear proportions. The compile receipt repeats this warning.

Compilation creates a candidate only. It refuses to overwrite an existing output or receipt. A persisted receipt is the project-side commit marker; an output without its matching receipt after an interrupted process is an orphan and must not be promoted or embedded. Final Word, PDF, WeChat, or PPT usage still requires target-format visual QA.

## Focused verification

```sh
python3 scripts/test-report-figure-compiler.py
node mcp-lite/report-figure-compiler-test.mjs
```

The runtime has no database, job queue, frontend, document writer, PPTX writer, or Registry write authority.
