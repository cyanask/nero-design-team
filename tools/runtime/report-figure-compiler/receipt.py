"""Compile receipt creation and atomic JSON persistence."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from constants import COMPILER_NAME, COMPILER_VERSION


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical_spec_bytes(spec: dict) -> bytes:
    return json.dumps(spec, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def build_receipt(
    *,
    spec: dict,
    spec_raw: bytes,
    output: Path,
    artifact: Path | None = None,
    overrides: dict,
    output_info: dict,
    font: str,
    checks: list[dict],
    warnings: list[str],
) -> dict:
    input_hash = sha256_bytes(spec_raw)
    effective_hash = sha256_bytes(canonical_spec_bytes(spec))
    return {
        "status": "generated",
        "generation_status": "succeeded",
        "artifact_state": "candidate",
        "figure_id": spec["figure_id"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "compiler": {"name": COMPILER_NAME, "version": COMPILER_VERSION},
        "spec": {
            "figure_id": spec["figure_id"],
            "schema_version": spec["schema_version"],
            "input_sha256": input_hash,
            "effective_spec_sha256": effective_hash,
            "sha256": effective_hash,
            "overrides": overrides,
        },
        "profile": spec["profile"],
        "renderer": spec["renderer"],
        "output": {"path": str(output), "sha256": sha256_file(artifact or output), **output_info},
        "font": font,
        "checks": checks,
        "warnings": warnings,
    }


def receipt_bytes(receipt: dict) -> bytes:
    return (json.dumps(receipt, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
