"""Dependency-free runtime validation for the public figure specification."""

from __future__ import annotations

import copy
import json
import math
from pathlib import Path

from constants import FIGURE_TYPES, OFFICE_HANDOFF, PROFILES, RENDERERS, SCHEMA_VERSIONS, V02_FIGURE_TYPES
from errors import SpecValidationError
from validation_v02 import validate_v02_content


def load_spec(path: Path, profile_override: str | None = None, renderer_override: str | None = None) -> tuple[dict, bytes]:
    try:
        raw = path.read_bytes()
    except OSError as error:
        raise SpecValidationError(f"cannot read spec: {path}: {error}") from error
    try:
        parsed = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise SpecValidationError(f"spec must be UTF-8 JSON: {error}") from error
    if not isinstance(parsed, dict):
        raise SpecValidationError("spec root must be an object")
    spec = copy.deepcopy(parsed)
    if profile_override is not None:
        spec["profile"] = profile_override
    if renderer_override is not None:
        spec["renderer"] = renderer_override
    validate_spec(spec)
    return spec, raw


def validate_spec(spec: dict) -> None:
    errors: list[str] = []
    _reject_unknown(
        spec,
        {"schema_version", "figure_id", "figure_type", "title", "subtitle", "source", "profile", "renderer", "content"},
        "spec",
        errors,
    )
    required = ("schema_version", "figure_id", "figure_type", "title", "source", "profile", "renderer", "content")
    for field in required:
        if field not in spec:
            errors.append(f"missing required field: {field}")

    if errors:
        raise SpecValidationError("; ".join(errors))

    _expect_string(spec, "schema_version", errors, maximum=20)
    if spec.get("schema_version") not in SCHEMA_VERSIONS:
        errors.append(f"schema_version must be one of: {', '.join(SCHEMA_VERSIONS)}")
    _expect_string(spec, "figure_id", errors, maximum=120)
    _expect_string(spec, "title", errors, maximum=300)
    if "subtitle" in spec:
        _expect_string(spec, "subtitle", errors, maximum=500, allow_empty=True)

    figure_type = spec.get("figure_type")
    if figure_type not in FIGURE_TYPES:
        errors.append(f"figure_type must be one of: {', '.join(FIGURE_TYPES)}")
    elif figure_type in V02_FIGURE_TYPES and spec.get("schema_version") != "0.2.0":
        errors.append(f"figure_type {figure_type} requires schema_version 0.2.0")
    profile = spec.get("profile")
    if profile not in PROFILES:
        errors.append(f"profile must be one of: {', '.join(PROFILES)}")
    renderer = spec.get("renderer")
    if renderer == OFFICE_HANDOFF:
        errors.append("renderer office-native is handoff-only and is not implemented by this compiler")
    elif renderer not in RENDERERS:
        errors.append(f"renderer must be one of: {', '.join(RENDERERS)}")

    source = spec.get("source")
    if not isinstance(source, dict):
        errors.append("source must be an object")
    else:
        _reject_unknown(source, {"label", "locator"}, "source", errors)
        _expect_string(source, "label", errors, prefix="source.", maximum=500)
        if "locator" in source:
            _expect_string(source, "locator", errors, prefix="source.", maximum=1000, allow_empty=True)

    content = spec.get("content")
    if not isinstance(content, dict):
        errors.append("content must be an object")
    elif figure_type in V02_FIGURE_TYPES:
        validate_v02_content(figure_type, content, errors)
    elif figure_type in FIGURE_TYPES:
        globals()[f"_validate_{figure_type}"](content, errors)

    if errors:
        raise SpecValidationError("; ".join(errors))


def _validate_flow(content: dict, errors: list[str]) -> None:
    _reject_unknown(content, {"nodes", "edges"}, "content", errors)
    nodes = content.get("nodes")
    edges = content.get("edges")
    if not isinstance(nodes, list) or not 2 <= len(nodes) <= 6:
        errors.append("flow.content.nodes must contain 2 to 6 nodes")
        return
    identifiers: list[str] = []
    for index, node in enumerate(nodes):
        if not isinstance(node, dict):
            errors.append(f"flow node {index} must be an object")
            continue
        _reject_unknown(node, {"id", "label", "detail"}, f"content.nodes[{index}]", errors)
        _expect_string(node, "id", errors, prefix=f"content.nodes[{index}].", maximum=80)
        _expect_string(node, "label", errors, prefix=f"content.nodes[{index}].", maximum=240)
        if "detail" in node:
            _expect_string(node, "detail", errors, prefix=f"content.nodes[{index}].", maximum=1200, allow_empty=True)
        if isinstance(node.get("id"), str):
            identifiers.append(node["id"])
    if len(set(identifiers)) != len(identifiers):
        errors.append("flow node ids must be unique")
    if not isinstance(edges, list) or len(edges) != len(nodes) - 1:
        errors.append("flow.content.edges must contain exactly one adjacent edge between each ordered node")
        return
    for index, edge in enumerate(edges):
        if not isinstance(edge, dict):
            errors.append(f"flow edge {index} must be an object")
            continue
        _reject_unknown(edge, {"from", "to"}, f"content.edges[{index}]", errors)
        _expect_string(edge, "from", errors, prefix=f"content.edges[{index}].", maximum=80)
        _expect_string(edge, "to", errors, prefix=f"content.edges[{index}].", maximum=80)
        if index + 1 < len(identifiers) and (edge.get("from"), edge.get("to")) != (identifiers[index], identifiers[index + 1]):
            errors.append(
                f"flow edge {index} must be the adjacent directed edge {identifiers[index]} -> {identifiers[index + 1]}"
            )


def _validate_timeline(content: dict, errors: list[str]) -> None:
    _reject_unknown(content, {"events"}, "content", errors)
    events = content.get("events")
    if not isinstance(events, list) or not 2 <= len(events) <= 10:
        errors.append("timeline.content.events must contain 2 to 10 events")
        return
    for index, event in enumerate(events):
        if not isinstance(event, dict):
            errors.append(f"timeline event {index} must be an object")
            continue
        _reject_unknown(event, {"period", "label", "detail"}, f"content.events[{index}]", errors)
        prefix = f"content.events[{index}]."
        _expect_string(event, "period", errors, prefix=prefix, maximum=80)
        _expect_string(event, "label", errors, prefix=prefix, maximum=240)
        if "detail" in event:
            _expect_string(event, "detail", errors, prefix=prefix, maximum=1200, allow_empty=True)


def _validate_hierarchy(content: dict, errors: list[str]) -> None:
    _reject_unknown(content, {"root"}, "content", errors)
    root = content.get("root")
    if not isinstance(root, dict):
        errors.append("hierarchy.content.root must be an object")
        return
    count = 0

    def visit(node: dict, path: str, depth: int) -> None:
        nonlocal count
        count += 1
        if depth > 5:
            errors.append("hierarchy depth must not exceed 5")
            return
        _reject_unknown(node, {"label", "children"}, path, errors)
        _expect_string(node, "label", errors, prefix=f"{path}.", maximum=300)
        children = node.get("children", [])
        if not isinstance(children, list):
            errors.append(f"{path}.children must be an array")
            return
        for index, child in enumerate(children):
            if not isinstance(child, dict):
                errors.append(f"{path}.children[{index}] must be an object")
            else:
                visit(child, f"{path}.children[{index}]", depth + 1)

    visit(root, "content.root", 1)
    if not 2 <= count <= 30:
        errors.append("hierarchy must contain 2 to 30 nodes")


def _validate_matrix(content: dict, errors: list[str]) -> None:
    _reject_unknown(
        content,
        {"value_kind", "rows", "columns", "cells", "period", "unit", "denominator"},
        "content",
        errors,
    )
    value_kind = content.get("value_kind")
    if value_kind not in {"qualitative", "quantitative"}:
        errors.append("matrix.content.value_kind must be qualitative or quantitative")
    rows = content.get("rows")
    columns = content.get("columns")
    cells = content.get("cells")
    if not isinstance(rows, list) or not 1 <= len(rows) <= 12:
        errors.append("matrix.content.rows must contain 1 to 12 labels")
        return
    if not isinstance(columns, list) or not 1 <= len(columns) <= 8:
        errors.append("matrix.content.columns must contain 1 to 8 labels")
        return
    for index, value in enumerate(rows):
        _string_value(value, f"content.rows[{index}]", errors, maximum=180)
    for index, value in enumerate(columns):
        _string_value(value, f"content.columns[{index}]", errors, maximum=180)
    if not isinstance(cells, list) or len(cells) != len(rows):
        errors.append("matrix.content.cells row count must match content.rows")
        return
    for row_index, row in enumerate(cells):
        if not isinstance(row, list) or len(row) != len(columns):
            errors.append(f"matrix cell row {row_index} must match content.columns")
            continue
        for column_index, value in enumerate(row):
            if value_kind == "qualitative":
                if not isinstance(value, str) or not value.strip():
                    errors.append(f"qualitative matrix cell [{row_index}][{column_index}] must be non-empty text")
            elif value_kind == "quantitative":
                if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(float(value)):
                    errors.append(f"quantitative matrix cell [{row_index}][{column_index}] must be a finite number")
    if value_kind == "quantitative":
        _validate_quantitative_context(content, errors, "matrix")


def _validate_bar(content: dict, errors: list[str]) -> None:
    _reject_unknown(content, {"period", "unit", "denominator", "categories", "series"}, "content", errors)
    _validate_quantitative_context(content, errors, "bar")
    categories = content.get("categories")
    series = content.get("series")
    if not isinstance(categories, list) or not 1 <= len(categories) <= 12:
        errors.append("bar.content.categories must contain 1 to 12 labels")
        return
    for index, value in enumerate(categories):
        _string_value(value, f"content.categories[{index}]", errors, maximum=120)
    if not isinstance(series, list) or not 1 <= len(series) <= 3:
        errors.append("bar.content.series must contain 1 to 3 series")
        return
    for index, item in enumerate(series):
        if not isinstance(item, dict):
            errors.append(f"bar series {index} must be an object")
            continue
        _reject_unknown(item, {"name", "values"}, f"content.series[{index}]", errors)
        _expect_string(item, "name", errors, prefix=f"content.series[{index}].", maximum=120)
        values = item.get("values")
        if not isinstance(values, list) or len(values) != len(categories):
            errors.append(f"bar series {index} values must match categories")
            continue
        for value_index, value in enumerate(values):
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(float(value)):
                errors.append(f"bar value [{index}][{value_index}] must be a finite number")
            elif float(value) < 0:
                errors.append(f"bar value [{index}][{value_index}] must be non-negative in schema v0.1")


def _validate_quantitative_context(content: dict, errors: list[str], figure_type: str) -> None:
    for field in ("period", "unit", "denominator"):
        value = content.get(field)
        if not isinstance(value, str) or not value.strip():
            errors.append(f"{figure_type}.content.{field} is required for quantitative figures")


def _expect_string(
    value: dict,
    key: str,
    errors: list[str],
    *,
    prefix: str = "",
    maximum: int,
    allow_empty: bool = False,
) -> None:
    if key not in value:
        errors.append(f"missing required field: {prefix}{key}")
        return
    _string_value(value[key], f"{prefix}{key}", errors, maximum=maximum, allow_empty=allow_empty)


def _string_value(value: object, field: str, errors: list[str], *, maximum: int, allow_empty: bool = False) -> None:
    if not isinstance(value, str):
        errors.append(f"{field} must be a string")
    elif not allow_empty and not value.strip():
        errors.append(f"{field} must not be empty")
    elif len(value) > maximum:
        errors.append(f"{field} exceeds {maximum} characters")


def _reject_unknown(value: dict, allowed: set[str], path: str, errors: list[str]) -> None:
    for key in sorted(set(value) - allowed):
        errors.append(f"additional property is not allowed: {path}.{key}")
