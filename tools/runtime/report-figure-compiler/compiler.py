"""Compilation orchestration across validation, IR, renderer, QA, and receipt seams."""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path

from errors import FigureCompilerError
from layout import build_layout
from qa import inspect_output, validate_ir
from receipt import build_receipt, receipt_bytes
from render_png import render_png
from render_svg import render_svg
from validation import load_spec


def validate_file(spec_path: Path, *, profile: str | None = None, renderer: str | None = None) -> dict:
    spec, _ = load_spec(spec_path, profile, renderer)
    ir = build_layout(spec)
    checks = [
        {"id": "spec_runtime_validation", "status": "pass", "detail": "schema and semantic checks passed"},
        *validate_ir(ir),
    ]
    return {
        "status": "valid",
        "figure_id": spec["figure_id"],
        "figure_type": spec["figure_type"],
        "profile": spec["profile"],
        "renderer": spec["renderer"],
        "checks": checks,
        "warnings": ir["warnings"],
    }


def compile_file(
    spec_path: Path,
    output: Path,
    *,
    profile: str | None = None,
    renderer: str | None = None,
    receipt_path: Path | None = None,
) -> dict:
    spec, raw = load_spec(spec_path, profile, renderer)
    overrides = {key: value for key, value in (("profile", profile), ("renderer", renderer)) if value is not None}
    _validate_paths(spec_path, output, receipt_path)
    ir = build_layout(spec)
    checks = [
        {"id": "spec_runtime_validation", "status": "pass", "detail": "schema and semantic checks passed"},
        *validate_ir(ir),
    ]
    expected_suffix = ".svg" if spec["renderer"] == "vector-svg" else ".png"
    if output.suffix.lower() != expected_suffix:
        raise FigureCompilerError(f"output extension must be {expected_suffix} for renderer {spec['renderer']}")
    output.parent.mkdir(parents=True, exist_ok=True)
    if receipt_path:
        receipt_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = _temporary_path(output)
    receipt_temporary: Path | None = None
    output_committed = False
    receipt_committed = False
    try:
        if spec["renderer"] == "vector-svg":
            renderer_result = render_svg(ir, temporary)
        else:
            renderer_result = render_png(ir, temporary)
        checks.extend(renderer_result["checks"])
        rendered_checks, output_info = inspect_output(temporary, spec["renderer"], spec["profile"])
        checks.extend(rendered_checks)
        warnings = [*ir["warnings"], *renderer_result["warnings"]]
        receipt = build_receipt(
            spec=spec,
            spec_raw=raw,
            output=output,
            artifact=temporary,
            overrides=overrides,
            output_info=output_info,
            font=renderer_result["font"],
            checks=checks,
            warnings=warnings,
        )
        if receipt_path:
            receipt_temporary = _temporary_path(receipt_path)
            receipt_temporary.write_bytes(receipt_bytes(receipt))
        _commit_no_replace(temporary, output)
        output_committed = True
        if receipt_path and receipt_temporary:
            _commit_no_replace(receipt_temporary, receipt_path)
            receipt_committed = True
        return receipt
    except Exception as error:
        if receipt_committed and receipt_path:
            receipt_path.unlink(missing_ok=True)
        if output_committed:
            output.unlink(missing_ok=True)
        if isinstance(error, FigureCompilerError):
            raise
        if isinstance(error, FileExistsError):
            raise FigureCompilerError(f"refusing to overwrite an existing artifact: {error.filename}") from error
        raise
    finally:
        temporary.unlink(missing_ok=True)
        if receipt_temporary:
            receipt_temporary.unlink(missing_ok=True)


def json_output(value: dict) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2)


def _validate_paths(spec_path: Path, output: Path, receipt_path: Path | None) -> None:
    named = [("spec", spec_path), ("output", output)]
    if receipt_path:
        named.append(("receipt", receipt_path))
    resolved = [(name, path.resolve()) for name, path in named]
    for index, (left_name, left) in enumerate(resolved):
        for right_name, right in resolved[index + 1 :]:
            if left == right:
                raise FigureCompilerError(f"{left_name} and {right_name} paths must be different")
    for name, path in (("output", output), ("receipt", receipt_path)):
        if path is not None and os.path.lexists(path):
            raise FigureCompilerError(f"refusing to overwrite existing {name}: {path}")


def _temporary_path(destination: Path) -> Path:
    descriptor, name = tempfile.mkstemp(prefix=f".{destination.name}.", suffix=".tmp", dir=destination.parent)
    os.close(descriptor)
    return Path(name)


def _commit_no_replace(temporary: Path, destination: Path) -> None:
    os.link(temporary, destination)
