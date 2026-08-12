"""Standard-library SVG renderer for the shared layout IR."""

from __future__ import annotations

import math
from pathlib import Path
from xml.etree import ElementTree as ET


def render_svg(ir: dict, output: Path) -> dict:
    canvas = ir["canvas"]
    root = ET.Element(
        "svg",
        {
            "xmlns": "http://www.w3.org/2000/svg",
            "width": str(canvas["width"]),
            "height": str(canvas["height"]),
            "viewBox": f"0 0 {canvas['width']} {canvas['height']}",
            "role": "img",
        },
    )
    ET.SubElement(root, "rect", {"width": "100%", "height": "100%", "fill": canvas["background"]})
    for shape in ir["shapes"]:
        _draw_shape(root, shape)
    family = ir["font"]["family"]
    for item in ir["texts"]:
        for line in item["lines"]:
            element = ET.SubElement(
                root,
                "text",
                {
                    "x": _number(line["x"]),
                    "y": _number(line["y"]),
                    "fill": item["color"],
                    "font-family": family,
                    "font-size": _number(item["font_size"]),
                    "dominant-baseline": "hanging",
                    "textLength": _number(max(line["width"], 0.01)),
                    "lengthAdjust": "spacingAndGlyphs",
                },
            )
            element.text = line["text"]
    tree = ET.ElementTree(root)
    ET.indent(tree, space="  ")
    tree.write(output, encoding="utf-8", xml_declaration=True)
    return {
        "font": f"{family} (not embedded)",
        "checks": [
            {
                "id": "svg_text_length_constraints",
                "status": "pass",
                "detail": "every text line has deterministic textLength/lengthAdjust",
            }
        ],
        "warnings": [
            "SVG fonts are not embedded; textLength constrains advance width, but final visual QA in the target viewer is still required."
        ],
    }


def _draw_shape(root, shape: dict) -> None:
    common = {"stroke": shape.get("stroke", "none"), "stroke-width": str(shape.get("stroke_width", 0))}
    if shape["type"] == "rect":
        x0, y0, x1, y1 = shape["box"]
        ET.SubElement(
            root,
            "rect",
            {
                "x": _number(x0),
                "y": _number(y0),
                "width": _number(x1 - x0),
                "height": _number(y1 - y0),
                "rx": str(shape.get("radius", 0)),
                "fill": shape["fill"],
                **common,
            },
        )
    elif shape["type"] == "line":
        (x0, y0), (x1, y1) = shape["start"], shape["end"]
        ET.SubElement(root, "line", {"x1": _number(x0), "y1": _number(y0), "x2": _number(x1), "y2": _number(y1), "fill": "none", **common})
    elif shape["type"] == "circle":
        x, y = shape["center"]
        ET.SubElement(root, "circle", {"cx": _number(x), "cy": _number(y), "r": _number(shape["radius"]), "fill": shape["fill"], **common})
    elif shape["type"] == "arrow":
        (x0, y0), (x1, y1) = shape["start"], shape["end"]
        ET.SubElement(root, "line", {"x1": _number(x0), "y1": _number(y0), "x2": _number(x1), "y2": _number(y1), "fill": "none", **common})
        angle = math.atan2(y1 - y0, x1 - x0)
        length = 16
        spread = 0.62
        points = [
            (x1, y1),
            (x1 - length * math.cos(angle - spread), y1 - length * math.sin(angle - spread)),
            (x1 - length * math.cos(angle + spread), y1 - length * math.sin(angle + spread)),
        ]
        ET.SubElement(root, "polygon", {"points": " ".join(f"{_number(x)},{_number(y)}" for x, y in points), "fill": shape["stroke"]})
    elif shape["type"] == "polygon":
        ET.SubElement(
            root,
            "polygon",
            {
                "points": " ".join(f"{_number(x)},{_number(y)}" for x, y in shape["points"]),
                "fill": shape["fill"],
                **common,
            },
        )
    elif shape["type"] == "polyline":
        ET.SubElement(
            root,
            "polyline",
            {
                "points": " ".join(f"{_number(x)},{_number(y)}" for x, y in shape["points"]),
                "fill": "none",
                "stroke-linejoin": "round",
                "stroke-linecap": "round",
                **common,
            },
        )


def _number(value: float) -> str:
    return f"{float(value):.2f}".rstrip("0").rstrip(".")
