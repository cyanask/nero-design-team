"""Fail-closed checks over shared layout IR and rendered outputs."""

from __future__ import annotations

from pathlib import Path

from constants import PROFILES
from errors import FigureCompilerError, LayoutError


def validate_ir(ir: dict) -> list[dict]:
    checks: list[dict] = []
    issues: list[str] = []
    canvas = ir["canvas"]
    profile = PROFILES[ir["profile"]]
    width = canvas.get("width")
    height = canvas.get("height")
    if width != profile.width or height != profile.height or width <= 0 or height <= 0:
        issues.append(f"canvas does not match profile {profile.identifier}: {width}x{height}")
    checks.append(_check("canvas", not issues, f"{width}x{height}; profile={profile.identifier}"))

    boundary_issues: list[str] = []
    for item in [*ir["shapes"], *ir["texts"]]:
        if not _inside_canvas(item["box"], width, height):
            boundary_issues.append(f"{item['type']} outside canvas: {item['box']}")
    owner_boxes = {item.get("id"): item["box"] for item in ir["shapes"] if item.get("id")}
    for item in ir["texts"]:
        owner = item.get("owner")
        if owner:
            if owner not in owner_boxes:
                boundary_issues.append(f"text references missing owner: {owner}")
            elif not _contains(owner_boxes[owner], item["box"], inset=5):
                boundary_issues.append(f"text outside owner {owner}: {item['value'][:48]}")
    checks.append(
        _check(
            "ir_estimated_element_bounds",
            not boundary_issues,
            f"{len(boundary_issues)} issue(s); text extents use conservative IR estimates",
        )
    )
    issues.extend(boundary_issues)

    font_issues = [
        f"{item['role']} {item['font_size']}px < {profile.fonts[item['role']]}px"
        for item in ir["texts"]
        if item["role"] not in profile.fonts or item["font_size"] < profile.fonts[item["role"]]
    ]
    checks.append(_check("font_role_floors", not font_issues, f"{len(ir['texts'])} text block(s)"))
    issues.extend(font_issues)

    collision_issues = []
    texts = ir["texts"]
    for index, left in enumerate(texts):
        for right in texts[index + 1 :]:
            if _overlaps(left["box"], right["box"], tolerance=2):
                collision_issues.append(f"text collision: {left['value'][:32]} <> {right['value'][:32]}")
    checks.append(
        _check(
            "ir_estimated_text_collisions",
            not collision_issues,
            f"{len(collision_issues)} collision(s); not an actual-font claim",
        )
    )
    issues.extend(collision_issues)

    context = ir.get("quantitative_context")
    quantitative_ok = context is None or all(isinstance(context.get(key), str) and context[key].strip() for key in ("period", "unit", "denominator"))
    checks.append(_check("quantitative_context", quantitative_ok, "not-applicable" if context is None else "period/unit/denominator present"))
    if not quantitative_ok:
        issues.append("quantitative context is incomplete")

    if issues:
        summary = "; ".join(issues[:12])
        raise LayoutError(f"layout QA failed with {len(issues)} issue(s): {summary}")
    return checks


def inspect_output(path: Path, renderer: str, profile_id: str) -> tuple[list[dict], dict]:
    try:
        size = path.stat().st_size
    except OSError as error:
        raise FigureCompilerError(f"cannot inspect rendered output: {error}") from error
    if size <= 0:
        raise FigureCompilerError("rendered output is empty")
    checks = [_check("output_nonempty", True, f"{size} bytes")]
    profile = PROFILES[profile_id]
    if renderer == "vector-svg":
        prefix = path.read_text(encoding="utf-8")[:500]
        if "<svg" not in prefix:
            raise FigureCompilerError("SVG output does not contain an svg root")
        checks.append(_check("svg_document", True, "svg root present"))
        return checks, {"width": profile.width, "height": profile.height, "format": "SVG"}

    try:
        from PIL import Image
    except ImportError as error:
        raise FigureCompilerError("PNG inspection requires Pillow in the selected Python runtime") from error
    with Image.open(path) as image:
        dpi = image.info.get("dpi", (0, 0))
        dimensions = image.size
        mode = image.mode
    expected_dpi = profile_id != "report-a4" or all(abs(float(value) - 300.0) <= 1.0 for value in dpi[:2])
    expected_width = profile_id != "report-a4" or dimensions[0] == 2400
    if mode != "RGB" or not expected_dpi or not expected_width:
        raise FigureCompilerError(
            f"PNG output contract failed: mode={mode}, size={dimensions}, dpi={dpi}; report-a4 requires RGB 2400px/300DPI"
        )
    checks.extend(
        [
            _check("png_rgb", True, mode),
            _check("png_dimensions", True, f"{dimensions[0]}x{dimensions[1]}"),
            _check("png_dpi", True, f"{dpi[0]:.2f}x{dpi[1]:.2f}"),
        ]
    )
    return checks, {"width": dimensions[0], "height": dimensions[1], "format": "PNG", "mode": mode, "dpi": list(dpi[:2])}


def _check(identifier: str, passed: bool, detail: str) -> dict:
    return {"id": identifier, "status": "pass" if passed else "fail", "detail": detail}


def _inside_canvas(box, width: float, height: float) -> bool:
    x0, y0, x1, y1 = box
    return x0 >= 0 and y0 >= 0 and x1 <= width and y1 <= height and x1 >= x0 and y1 >= y0


def _contains(outer, inner, inset: float = 0) -> bool:
    ox0, oy0, ox1, oy1 = outer
    ix0, iy0, ix1, iy1 = inner
    return ix0 >= ox0 + inset and iy0 >= oy0 + inset and ix1 <= ox1 - inset and iy1 <= oy1 - inset


def _overlaps(left, right, tolerance: float = 0) -> bool:
    lx0, ly0, lx1, ly1 = left
    rx0, ry0, rx1, ry1 = right
    return lx0 < rx1 - tolerance and rx0 < lx1 - tolerance and ly0 < ry1 - tolerance and ry0 < ly1 - tolerance
