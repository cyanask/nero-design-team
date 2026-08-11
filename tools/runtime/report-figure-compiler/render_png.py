"""Optional Pillow renderer for the shared layout IR."""

from __future__ import annotations

import math
import os
from pathlib import Path

from errors import LayoutError, RendererUnavailableError


FONT_CANDIDATES = (
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/System/Library/Fonts/Supplemental/Songti.ttc",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
)


def pillow_available() -> tuple[bool, str]:
    try:
        import PIL
    except ImportError:
        return False, "Pillow is not installed"
    return True, f"Pillow {PIL.__version__}"


def render_png(ir: dict, output: Path) -> dict:
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError as error:
        raise RendererUnavailableError(
            "raster-canvas-png requires Pillow; select vector-svg or provide NERO_FIGURE_PYTHON pointing to a Pillow runtime"
        ) from error
    font_path = resolve_font()
    canvas = ir["canvas"]
    image = Image.new("RGB", (canvas["width"], canvas["height"]), canvas["background"])
    draw = ImageDraw.Draw(image)
    for shape in ir["shapes"]:
        _draw_shape(draw, shape)
    fonts = {}
    for item in ir["texts"]:
        size = int(item["font_size"])
        fonts.setdefault(size, ImageFont.truetype(str(font_path), size=size))
    checks = _validate_actual_text_geometry(ir, draw, fonts)
    for item in ir["texts"]:
        size = int(item["font_size"])
        font = fonts[size]
        for line in item["lines"]:
            draw.text((line["x"], line["y"]), line["text"], font=font, fill=item["color"], anchor="lt")
    image.save(output, format="PNG", dpi=(300, 300), optimize=True)
    return {"font": str(font_path), "checks": checks, "warnings": []}


def resolve_font() -> Path:
    configured = os.environ.get("NERO_CJK_FONT")
    if configured:
        path = Path(configured)
        if not path.is_file():
            raise LayoutError(f"NERO_CJK_FONT does not point to a readable font file: {configured}")
        return path
    candidates = FONT_CANDIDATES
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return Path(candidate)
    raise LayoutError("Chinese-capable font not found; set NERO_CJK_FONT to an installed .ttf/.otf/.ttc file")


def _validate_actual_text_geometry(ir: dict, draw, fonts: dict) -> list[dict]:
    canvas = ir["canvas"]
    owner_boxes = {item.get("id"): item["box"] for item in ir["shapes"] if item.get("id")}
    measured: list[tuple[list[float], str]] = []
    coverage_issues: list[str] = []
    boundary_issues: list[str] = []
    checked_glyphs: set[tuple[int, str]] = set()
    missing_by_size = {size: {_glyph_signature(font, sentinel) for sentinel in ("\u0378", "\u0380", "\U0010FFFF")} for size, font in fonts.items()}
    for item in ir["texts"]:
        size = int(item["font_size"])
        font = fonts[size]
        item_boxes = []
        for line in item["lines"]:
            box = [float(value) for value in draw.textbbox((line["x"], line["y"]), line["text"], font=font, anchor="lt")]
            item_boxes.append(box)
            measured.append((box, line["text"]))
            if not _inside(box, (0, 0, canvas["width"], canvas["height"])):
                boundary_issues.append(f"actual text outside canvas: {line['text'][:40]}")
            for character in line["text"]:
                key = (size, character)
                if _is_cjk(character) and key not in checked_glyphs:
                    checked_glyphs.add(key)
                    signature = _glyph_signature(font, character)
                    if signature[1] is None or signature in missing_by_size[size]:
                        coverage_issues.append(f"font lacks CJK glyph U+{ord(character):04X} ({character})")
        owner = item.get("owner")
        if owner and owner in owner_boxes:
            for box in item_boxes:
                if not _inside(box, owner_boxes[owner], inset=5):
                    boundary_issues.append(f"actual text outside owner {owner}: {item['value'][:40]}")
    collision_issues = []
    for index, (left, left_text) in enumerate(measured):
        for right, right_text in measured[index + 1 :]:
            if _overlaps(left, right, tolerance=2):
                collision_issues.append(f"actual text collision: {left_text[:24]} <> {right_text[:24]}")
    issues = [*coverage_issues, *boundary_issues, *collision_issues]
    if issues:
        raise LayoutError(f"actual font geometry QA failed with {len(issues)} issue(s): {'; '.join(issues[:12])}")
    return [
        {"id": "cjk_font_coverage", "status": "pass", "detail": f"{len(checked_glyphs)} unique CJK glyph-size pair(s)"},
        {"id": "actual_text_bounds", "status": "pass", "detail": f"{len(measured)} rendered line(s)"},
        {"id": "actual_text_collisions", "status": "pass", "detail": "0 collision(s)"},
    ]


def _glyph_signature(font, character: str):
    try:
        mask = font.getmask(character, mode="L")
        return (tuple(mask.size), mask.getbbox(), bytes(mask))
    except (OSError, UnicodeError, ValueError):
        return ((0, 0), None, b"")


def _is_cjk(character: str) -> bool:
    codepoint = ord(character)
    return (
        0x3400 <= codepoint <= 0x4DBF
        or 0x4E00 <= codepoint <= 0x9FFF
        or 0xF900 <= codepoint <= 0xFAFF
        or 0x20000 <= codepoint <= 0x3134F
    )


def _inside(inner, outer, inset: float = 0) -> bool:
    ix0, iy0, ix1, iy1 = inner
    ox0, oy0, ox1, oy1 = outer
    return ix0 >= ox0 + inset and iy0 >= oy0 + inset and ix1 <= ox1 - inset and iy1 <= oy1 - inset


def _overlaps(left, right, tolerance: float = 0) -> bool:
    lx0, ly0, lx1, ly1 = left
    rx0, ry0, rx1, ry1 = right
    return lx0 < rx1 - tolerance and rx0 < lx1 - tolerance and ly0 < ry1 - tolerance and ry0 < ly1 - tolerance


def _draw_shape(draw, shape: dict) -> None:
    stroke = shape.get("stroke")
    width = int(shape.get("stroke_width", 0))
    if shape["type"] == "rect":
        draw.rounded_rectangle(tuple(shape["box"]), radius=int(shape.get("radius", 0)), fill=shape["fill"], outline=stroke if width else None, width=width)
    elif shape["type"] == "line":
        draw.line([tuple(shape["start"]), tuple(shape["end"])], fill=stroke, width=width)
    elif shape["type"] == "circle":
        draw.ellipse(tuple(shape["box"]), fill=shape["fill"], outline=stroke if width else None, width=width)
    elif shape["type"] == "arrow":
        start, end = tuple(shape["start"]), tuple(shape["end"])
        draw.line([start, end], fill=stroke, width=width)
        angle = math.atan2(end[1] - start[1], end[0] - start[0])
        length = 16
        spread = 0.62
        points = [
            tuple(end),
            (end[0] - length * math.cos(angle - spread), end[1] - length * math.sin(angle - spread)),
            (end[0] - length * math.cos(angle + spread), end[1] - length * math.sin(angle + spread)),
        ]
        draw.polygon(points, fill=stroke)
    elif shape["type"] == "polygon":
        points = [tuple(point) for point in shape["points"]]
        draw.polygon(points, fill=shape["fill"])
        if width:
            draw.line([*points, points[0]], fill=stroke, width=width, joint="curve")
    elif shape["type"] == "polyline":
        draw.line([tuple(point) for point in shape["points"]], fill=stroke, width=width, joint="curve")
