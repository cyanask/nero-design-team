"""Strict semantic validation for schema v0.2 figure types."""

from __future__ import annotations

import math


def validate_v02_content(figure_type: str, content: dict, errors: list[str]) -> None:
    globals()[f"_validate_{figure_type}"](content, errors)


def _validate_funnel(content: dict, errors: list[str]) -> None:
    _reject_unknown(content, {"mode", "period", "unit", "denominator", "stages"}, "content", errors)
    mode = content.get("mode")
    if mode not in {"quantitative", "stage_gate"}:
        errors.append("funnel.content.mode must be quantitative or stage_gate")
    stages = content.get("stages")
    if not isinstance(stages, list) or not 2 <= len(stages) <= 7:
        errors.append("funnel.content.stages must contain 2 to 7 stages")
        return
    identifiers = []
    values = []
    for index, stage in enumerate(stages):
        path = f"content.stages[{index}]"
        if not isinstance(stage, dict):
            errors.append(f"{path} must be an object")
            continue
        _reject_unknown(stage, {"id", "label", "detail", "value", "gate"}, path, errors)
        _required_string(stage, "id", path, errors, maximum=80)
        _required_string(stage, "label", path, errors, maximum=180)
        _optional_string(stage, "detail", path, errors, maximum=400)
        if isinstance(stage.get("id"), str):
            identifiers.append(stage["id"])
        if mode == "quantitative":
            if "gate" in stage:
                errors.append(f"{path}.gate is not allowed in quantitative mode")
            value = stage.get("value")
            if not _finite_number(value) or float(value) < 0:
                errors.append(f"{path}.value must be a finite non-negative number in quantitative mode")
            else:
                values.append(float(value))
        elif mode == "stage_gate":
            if "value" in stage:
                errors.append(f"{path}.value is not allowed in stage_gate mode")
            if stage.get("gate") not in {"passed", "in_progress", "blocked", "pending"}:
                errors.append(f"{path}.gate must be passed, in_progress, blocked, or pending")
    if len(set(identifiers)) != len(identifiers):
        errors.append("funnel stage ids must be unique")
    if mode == "quantitative":
        _quantitative_context(content, errors, "funnel")
        if len(values) == len(stages) and any(right > left for left, right in zip(values, values[1:])):
            errors.append("quantitative funnel stage values must be non-increasing")
    else:
        for field in ("period", "unit", "denominator"):
            if field in content:
                errors.append(f"funnel.content.{field} is not allowed in stage_gate mode")


def _validate_line(content: dict, errors: list[str]) -> None:
    _reject_unknown(content, {"period", "unit", "denominator", "x_labels", "series"}, "content", errors)
    _quantitative_context(content, errors, "line")
    labels = content.get("x_labels")
    if not isinstance(labels, list) or not 2 <= len(labels) <= 10:
        errors.append("line.content.x_labels must contain 2 to 10 ordered labels")
        return
    for index, value in enumerate(labels):
        _string_value(value, f"content.x_labels[{index}]", errors, maximum=80)
    valid_labels = [value for value in labels if isinstance(value, str)]
    if len(valid_labels) == len(labels) and len(set(valid_labels)) != len(valid_labels):
        errors.append("line x_labels must be unique and ordered")
    series = content.get("series")
    if not isinstance(series, list) or not 1 <= len(series) <= 3:
        errors.append("line.content.series must contain 1 to 3 series")
        return
    names = []
    for index, item in enumerate(series):
        path = f"content.series[{index}]"
        if not isinstance(item, dict):
            errors.append(f"{path} must be an object")
            continue
        _reject_unknown(item, {"name", "values"}, path, errors)
        _required_string(item, "name", path, errors, maximum=120)
        if isinstance(item.get("name"), str):
            names.append(item["name"])
        values = item.get("values")
        if not isinstance(values, list) or len(values) != len(labels):
            errors.append(f"{path}.values must match x_labels")
        elif any(not _finite_number(value) for value in values):
            errors.append(f"{path}.values must contain only finite numbers")
    if len(set(names)) != len(names):
        errors.append("line series names must be unique")


def _validate_participant_map(content: dict, errors: list[str]) -> None:
    _reject_unknown(content, {"basis", "x_axis", "y_axis", "participants"}, "content", errors)
    _required_string(content, "basis", "content", errors, maximum=400)
    for axis_name in ("x_axis", "y_axis"):
        axis = content.get(axis_name)
        path = f"content.{axis_name}"
        if not isinstance(axis, dict):
            errors.append(f"{path} must be an object")
            continue
        _reject_unknown(axis, {"label", "low", "high"}, path, errors)
        for field in ("label", "low", "high"):
            _required_string(axis, field, path, errors, maximum=100)
    participants = content.get("participants")
    if not isinstance(participants, list) or not 2 <= len(participants) <= 16:
        errors.append("participant_map.content.participants must contain 2 to 16 participants")
        return
    identifiers = []
    coordinates = []
    for index, participant in enumerate(participants):
        path = f"content.participants[{index}]"
        if not isinstance(participant, dict):
            errors.append(f"{path} must be an object")
            continue
        _reject_unknown(participant, {"id", "label", "x", "y", "category"}, path, errors)
        _required_string(participant, "id", path, errors, maximum=80)
        _required_string(participant, "label", path, errors, maximum=80)
        _optional_string(participant, "category", path, errors, maximum=80)
        if isinstance(participant.get("id"), str):
            identifiers.append(participant["id"])
        for coordinate in ("x", "y"):
            value = participant.get(coordinate)
            if not _finite_number(value) or not 0 <= float(value) <= 100:
                errors.append(f"{path}.{coordinate} must be a finite number from 0 to 100")
        if _finite_number(participant.get("x")) and _finite_number(participant.get("y")):
            coordinates.append((float(participant["x"]), float(participant["y"])))
    if len(set(identifiers)) != len(identifiers):
        errors.append("participant ids must be unique")
    if len(set(coordinates)) != len(coordinates):
        errors.append("participant coordinates must be unique")


def _validate_value_chain(content: dict, errors: list[str]) -> None:
    _reject_unknown(content, {"metric", "period", "unit", "denominator", "stages"}, "content", errors)
    metric = content.get("metric")
    if metric not in {"value_share", "gross_margin", "profit_pool"}:
        errors.append("value_chain.content.metric must be value_share, gross_margin, or profit_pool")
    _quantitative_context(content, errors, "value_chain")
    stages = content.get("stages")
    if not isinstance(stages, list) or not 2 <= len(stages) <= 7:
        errors.append("value_chain.content.stages must contain 2 to 7 ordered stages")
        return
    identifiers = []
    values = []
    for index, stage in enumerate(stages):
        path = f"content.stages[{index}]"
        if not isinstance(stage, dict):
            errors.append(f"{path} must be an object")
            continue
        _reject_unknown(stage, {"id", "label", "value", "detail"}, path, errors)
        _required_string(stage, "id", path, errors, maximum=80)
        _required_string(stage, "label", path, errors, maximum=160)
        _optional_string(stage, "detail", path, errors, maximum=300)
        if isinstance(stage.get("id"), str):
            identifiers.append(stage["id"])
        value = stage.get("value")
        if not _finite_number(value) or float(value) < 0:
            errors.append(f"{path}.value must be a finite non-negative number")
        else:
            values.append(float(value))
    if len(set(identifiers)) != len(identifiers):
        errors.append("value-chain stage ids must be unique")
    if metric == "value_share" and len(values) == len(stages) and not math.isclose(sum(values), 100.0, abs_tol=0.1):
        errors.append("value_share stage values must sum to 100")


def _quantitative_context(content: dict, errors: list[str], figure_type: str) -> None:
    for field in ("period", "unit", "denominator"):
        _required_string(content, field, f"{figure_type}.content", errors, maximum=200)


def _required_string(value: dict, key: str, path: str, errors: list[str], *, maximum: int) -> None:
    if key not in value:
        errors.append(f"missing required field: {path}.{key}")
    else:
        _string_value(value[key], f"{path}.{key}", errors, maximum=maximum)


def _optional_string(value: dict, key: str, path: str, errors: list[str], *, maximum: int) -> None:
    if key in value:
        _string_value(value[key], f"{path}.{key}", errors, maximum=maximum, allow_empty=True)


def _string_value(value: object, field: str, errors: list[str], *, maximum: int, allow_empty: bool = False) -> None:
    if not isinstance(value, str):
        errors.append(f"{field} must be a string")
    elif not allow_empty and not value.strip():
        errors.append(f"{field} must not be empty")
    elif len(value) > maximum:
        errors.append(f"{field} exceeds {maximum} characters")


def _finite_number(value: object) -> bool:
    return not isinstance(value, bool) and isinstance(value, (int, float)) and math.isfinite(float(value))


def _reject_unknown(value: dict, allowed: set[str], path: str, errors: list[str]) -> None:
    for key in sorted(set(value) - allowed):
        errors.append(f"additional property is not allowed: {path}.{key}")
