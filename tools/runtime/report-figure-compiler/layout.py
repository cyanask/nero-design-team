"""Shared deterministic layout IR consumed by every renderer."""

from __future__ import annotations

import math
import unicodedata

from constants import COLORS, FONT_FAMILY, PROFILES
from errors import LayoutError
from layout_v02 import layout_v02


def build_layout(spec: dict) -> dict:
    profile = PROFILES[spec["profile"]]
    builder = IRBuilder(profile)
    body_top, body_bottom = _frame(builder, spec)
    if spec["figure_type"] in {"funnel", "line", "participant_map", "value_chain"}:
        layout_v02(builder, spec["figure_type"], spec["content"], body_top, body_bottom)
    else:
        layout = globals()[f"_layout_{spec['figure_type']}"]
        layout(builder, spec["content"], body_top, body_bottom)
    builder.ir["quantitative_context"] = _quantitative_context(spec)
    return builder.ir


class IRBuilder:
    def __init__(self, profile):
        self.profile = profile
        self.ir = {
            "canvas": {"width": profile.width, "height": profile.height, "background": COLORS["background"]},
            "profile": profile.identifier,
            "font": {"family": FONT_FAMILY, "roles": dict(profile.fonts)},
            "shapes": [],
            "texts": [],
            "warnings": [],
        }

    def rect(self, identifier: str, box, *, fill: str, stroke: str = COLORS["border"], width: int = 2, radius: int = 14):
        item = {
            "type": "rect",
            "id": identifier,
            "box": _box(box),
            "fill": fill,
            "stroke": stroke,
            "stroke_width": width,
            "radius": radius,
        }
        self.ir["shapes"].append(item)
        return item

    def line(self, start, end, *, stroke: str = COLORS["ink"], width: int = 3):
        x0, y0 = start
        x1, y1 = end
        self.ir["shapes"].append(
            {
                "type": "line",
                "start": [float(x0), float(y0)],
                "end": [float(x1), float(y1)],
                "box": _box((min(x0, x1) - width, min(y0, y1) - width, max(x0, x1) + width, max(y0, y1) + width)),
                "stroke": stroke,
                "stroke_width": width,
            }
        )

    def arrow(self, start, end, *, stroke: str = COLORS["ink"], width: int = 3):
        x0, y0 = start
        x1, y1 = end
        self.ir["shapes"].append(
            {
                "type": "arrow",
                "start": [float(x0), float(y0)],
                "end": [float(x1), float(y1)],
                "box": _box((min(x0, x1) - 14, min(y0, y1) - 14, max(x0, x1) + 14, max(y0, y1) + 14)),
                "stroke": stroke,
                "stroke_width": width,
            }
        )

    def circle(self, identifier: str, center, radius: float, *, fill: str, stroke: str = COLORS["border"], width: int = 2):
        x, y = center
        self.ir["shapes"].append(
            {
                "type": "circle",
                "id": identifier,
                "center": [float(x), float(y)],
                "radius": float(radius),
                "box": _box((x - radius, y - radius, x + radius, y + radius)),
                "fill": fill,
                "stroke": stroke,
                "stroke_width": width,
            }
        )

    def polygon(self, identifier: str, points, *, fill: str, stroke: str = COLORS["border"], width: int = 2):
        normalized = [[float(x), float(y)] for x, y in points]
        xs = [point[0] for point in normalized]
        ys = [point[1] for point in normalized]
        self.ir["shapes"].append(
            {
                "type": "polygon",
                "id": identifier,
                "points": normalized,
                "box": _box((min(xs), min(ys), max(xs), max(ys))),
                "fill": fill,
                "stroke": stroke,
                "stroke_width": width,
            }
        )

    def polyline(self, points, *, stroke: str = COLORS["ink"], width: int = 3):
        normalized = [[float(x), float(y)] for x, y in points]
        xs = [point[0] for point in normalized]
        ys = [point[1] for point in normalized]
        self.ir["shapes"].append(
            {
                "type": "polyline",
                "points": normalized,
                "box": _box((min(xs) - width, min(ys) - width, max(xs) + width, max(ys) + width)),
                "stroke": stroke,
                "stroke_width": width,
            }
        )

    def text(
        self,
        value: object,
        box,
        *,
        role: str,
        color: str = COLORS["ink"],
        align: str = "left",
        owner: str | None = None,
        max_lines: int | None = None,
    ) -> dict:
        x0, y0, x1, y1 = _box(box)
        size = self.profile.fonts[role]
        available = x1 - x0
        if available <= 0:
            raise LayoutError(f"text area has non-positive width for {role}")
        lines = wrap_text(str(value), available, size)
        if max_lines is not None and len(lines) > max_lines:
            raise LayoutError(f"text overflow for {role}: needs {len(lines)} lines, limit is {max_lines}: {str(value)[:80]}")
        line_height = size * 1.28
        required = len(lines) * line_height
        if required > y1 - y0 + 0.1:
            raise LayoutError(f"text overflow for {role}: needs {required:.1f}px, area is {y1-y0:.1f}px: {str(value)[:80]}")
        placed_lines = []
        min_x = x1
        max_x = x0
        for index, line in enumerate(lines):
            width = estimated_width(line, size)
            if align == "center":
                line_x = x0 + (available - width) / 2
            elif align == "right":
                line_x = x1 - width
            else:
                line_x = x0
            line_y = y0 + index * line_height
            placed_lines.append({"text": line, "x": line_x, "y": line_y, "width": width})
            min_x = min(min_x, line_x)
            max_x = max(max_x, line_x + width)
        bbox = [min_x, y0, max_x, y0 + required]
        item = {
            "type": "text",
            "value": str(value),
            "role": role,
            "font_size": size,
            "color": color,
            "align": align,
            "owner": owner,
            "lines": placed_lines,
            "box": bbox,
        }
        self.ir["texts"].append(item)
        return item


def _frame(builder: IRBuilder, spec: dict) -> tuple[float, float]:
    profile = builder.profile
    margin = profile.margin
    width = profile.width
    title_area = (margin, margin * 0.42, width - margin, margin * 0.42 + profile.fonts["title"] * 2.6)
    title = builder.text(spec["title"], title_area, role="title", align="center", max_lines=2)
    cursor = title["box"][3] + profile.fonts["subtitle"] * 0.25
    subtitle = spec.get("subtitle", "")
    if subtitle:
        subtitle_area = (margin, cursor, width - margin, cursor + profile.fonts["subtitle"] * 2.7)
        item = builder.text(subtitle, subtitle_area, role="subtitle", color=COLORS["muted"], align="center", max_lines=2)
        cursor = item["box"][3] + profile.fonts["subtitle"] * 0.42
    builder.line((margin, cursor), (width - margin, cursor), stroke=COLORS["ink"], width=2)
    body_top = cursor + profile.fonts["body"] * 0.75

    source_text = spec["source"]["label"]
    if spec["source"].get("locator"):
        source_text += f"｜{spec['source']['locator']}"
    source_height = profile.fonts["source"] * 2.7
    source_y = profile.height - margin - source_height
    builder.line((margin, source_y - profile.fonts["source"] * 0.35), (width - margin, source_y - profile.fonts["source"] * 0.35), stroke=COLORS["light_line"], width=2)
    builder.text(
        source_text,
        (margin, source_y, width - margin, profile.height - margin),
        role="source",
        color=COLORS["muted"],
        max_lines=2,
    )
    return body_top, source_y - profile.fonts["body"] * 0.7


def _layout_flow(builder: IRBuilder, content: dict, top: float, bottom: float) -> None:
    if builder.profile.width < 1400:
        _layout_flow_vertical(builder, content, top, bottom)
        return
    nodes = content["nodes"]
    margin = builder.profile.margin
    gap = max(42, builder.profile.fonts["label"] * 1.35)
    width = (builder.profile.width - 2 * margin - gap * (len(nodes) - 1)) / len(nodes)
    if width < builder.profile.fonts["body"] * 5.0:
        raise LayoutError(f"flow nodes overflow horizontally: card width {width:.1f}px")
    positions = {}
    card_top = top + 16
    card_bottom = bottom - 16
    for index, node in enumerate(nodes):
        x0 = margin + index * (width + gap)
        positions[node["id"]] = (x0, card_top, x0 + width, card_bottom)
    center_y = (card_top + card_bottom) / 2
    for edge in content["edges"]:
        source = positions[edge["from"]]
        target = positions[edge["to"]]
        start = ((source[0] + source[2]) / 2, center_y)
        end = ((target[0] + target[2]) / 2, center_y)
        if target[0] > source[0]:
            start = (source[2] + 8, center_y)
            end = (target[0] - 8, center_y)
        elif target[0] < source[0]:
            start = (source[0] - 8, center_y)
            end = (target[2] + 8, center_y)
        builder.arrow(start, end, stroke=COLORS["blue"], width=4)
    for index, node in enumerate(nodes):
        x0, y0, x1, y1 = positions[node["id"]]
        identifier = f"flow-node-{index}"
        builder.rect(identifier, (x0, y0, x1, y1), fill=COLORS["panel"], width=3)
        builder.rect(f"{identifier}-head", (x0, y0, x1, y0 + builder.profile.fonts["subtitle"] * 2.0), fill=COLORS["primary"], stroke=COLORS["primary"], width=0)
        builder.text(node["label"], (x0 + 18, y0 + 14, x1 - 18, y0 + builder.profile.fonts["subtitle"] * 1.8), role="subtitle", color=COLORS["white"], align="center", owner=identifier, max_lines=2)
        if node.get("detail"):
            builder.text(node["detail"], (x0 + 22, y0 + builder.profile.fonts["subtitle"] * 2.4, x1 - 22, y1 - 22), role="body", owner=identifier)


def _layout_flow_vertical(builder: IRBuilder, content: dict, top: float, bottom: float) -> None:
    nodes = content["nodes"]
    margin = builder.profile.margin
    gap = 34
    height = (bottom - top - gap * (len(nodes) - 1)) / len(nodes)
    if height < builder.profile.fonts["body"] * 3.4:
        raise LayoutError(f"flow nodes overflow vertically: card height {height:.1f}px")
    positions = {}
    for index, node in enumerate(nodes):
        y0 = top + index * (height + gap)
        positions[node["id"]] = (margin, y0, builder.profile.width - margin, y0 + height)
    for edge in content["edges"]:
        source = positions[edge["from"]]
        target = positions[edge["to"]]
        builder.arrow(((source[0] + source[2]) / 2, source[3] + 5), ((target[0] + target[2]) / 2, target[1] - 5), stroke=COLORS["blue"], width=3)
    for index, node in enumerate(nodes):
        x0, y0, x1, y1 = positions[node["id"]]
        identifier = f"flow-node-{index}"
        builder.rect(identifier, (x0, y0, x1, y1), fill=COLORS["panel"], width=2)
        label_width = min((x1 - x0) * 0.34, 270)
        builder.text(node["label"], (x0 + 18, y0 + 16, x0 + label_width, y1 - 16), role="subtitle", color=COLORS["primary"], owner=identifier, max_lines=2)
        if node.get("detail"):
            builder.text(node["detail"], (x0 + label_width + 20, y0 + 16, x1 - 18, y1 - 16), role="body", owner=identifier, max_lines=3)


def _layout_timeline(builder: IRBuilder, content: dict, top: float, bottom: float) -> None:
    events = content["events"]
    if builder.profile.width < 1400:
        _layout_timeline_vertical(builder, events, top, bottom)
        return
    margin = builder.profile.margin
    axis_y = (top + bottom) / 2
    builder.line((margin, axis_y), (builder.profile.width - margin, axis_y), stroke=COLORS["primary"], width=5)
    step = (builder.profile.width - 2 * margin) / len(events)
    card_width = step * 0.82
    card_height = min(250, (bottom - top) * 0.36)
    for index, event in enumerate(events):
        center = margin + step * (index + 0.5)
        above = index % 2 == 0
        card_y = axis_y - card_height - 62 if above else axis_y + 62
        identifier = f"timeline-event-{index}"
        builder.line((center, axis_y), (center, card_y + card_height if above else card_y), stroke=COLORS["border"], width=3)
        builder.circle(f"timeline-dot-{index}", (center, axis_y), 13, fill=COLORS["accent"], stroke=COLORS["primary"], width=3)
        builder.rect(identifier, (center - card_width / 2, card_y, center + card_width / 2, card_y + card_height), fill=COLORS["panel"], width=2)
        builder.text(event["period"], (center - card_width / 2 + 14, card_y + 12, center + card_width / 2 - 14, card_y + 12 + builder.profile.fonts["label"] * 1.4), role="label", color=COLORS["primary"], align="center", owner=identifier, max_lines=1)
        value = event["label"] + (f"\n{event['detail']}" if event.get("detail") else "")
        builder.text(value, (center - card_width / 2 + 16, card_y + builder.profile.fonts["label"] * 1.8, center + card_width / 2 - 16, card_y + card_height - 14), role="body", align="center", owner=identifier, max_lines=4)


def _layout_timeline_vertical(builder: IRBuilder, events: list[dict], top: float, bottom: float) -> None:
    margin = builder.profile.margin
    axis_x = margin + 42
    builder.line((axis_x, top + 10), (axis_x, bottom - 10), stroke=COLORS["primary"], width=4)
    step = (bottom - top) / len(events)
    for index, event in enumerate(events):
        center_y = top + step * (index + 0.5)
        identifier = f"timeline-event-{index}"
        builder.circle(f"timeline-dot-{index}", (axis_x, center_y), 10, fill=COLORS["accent"], stroke=COLORS["primary"], width=2)
        builder.rect(identifier, (axis_x + 34, center_y - step * 0.40, builder.profile.width - margin, center_y + step * 0.40), fill=COLORS["panel"], width=2)
        builder.text(event["period"], (axis_x + 50, center_y - step * 0.34, axis_x + 230, center_y + step * 0.34), role="label", color=COLORS["primary"], owner=identifier, max_lines=2)
        value = event["label"] + (f"：{event['detail']}" if event.get("detail") else "")
        builder.text(value, (axis_x + 244, center_y - step * 0.34, builder.profile.width - margin - 16, center_y + step * 0.34), role="body", owner=identifier, max_lines=3)


def _layout_hierarchy(builder: IRBuilder, content: dict, top: float, bottom: float) -> None:
    levels: list[list[dict]] = []

    def visit(node: dict, depth: int, parent: str | None, path: str) -> None:
        while len(levels) <= depth:
            levels.append([])
        item = {"id": path, "label": node["label"], "parent": parent}
        levels[depth].append(item)
        for index, child in enumerate(node.get("children", [])):
            visit(child, depth + 1, path, f"{path}-{index}")

    visit(content["root"], 0, None, "root")
    margin = builder.profile.margin
    usable_width = builder.profile.width - 2 * margin
    level_height = (bottom - top) / len(levels)
    card_height = min(120, level_height * 0.54)
    positions = {}
    for depth, level in enumerate(levels):
        gap = max(18, builder.profile.fonts["label"] * 0.6)
        card_width = (usable_width - gap * (len(level) - 1)) / len(level)
        minimum = builder.profile.fonts["label"] * 5.2
        if card_width < minimum or card_height < builder.profile.fonts["label"] * 2.7:
            raise LayoutError(f"hierarchy overflow at level {depth + 1}: {len(level)} nodes do not fit the selected profile")
        y0 = top + depth * level_height + (level_height - card_height) / 2
        for index, item in enumerate(level):
            x0 = margin + index * (card_width + gap)
            positions[item["id"]] = (x0, y0, x0 + card_width, y0 + card_height)
    for level in levels[1:]:
        for item in level:
            parent = positions[item["parent"]]
            child = positions[item["id"]]
            builder.line(((parent[0] + parent[2]) / 2, parent[3]), ((child[0] + child[2]) / 2, child[1]), stroke=COLORS["border"], width=3)
    for depth, level in enumerate(levels):
        for item in level:
            box = positions[item["id"]]
            identifier = f"hierarchy-{item['id']}"
            fill = COLORS["primary"] if depth == 0 else COLORS["panel"]
            color = COLORS["white"] if depth == 0 else COLORS["ink"]
            builder.rect(identifier, box, fill=fill, stroke=COLORS["primary"] if depth == 0 else COLORS["border"], width=2)
            builder.text(item["label"], (box[0] + 14, box[1] + 12, box[2] - 14, box[3] - 12), role="label", color=color, align="center", owner=identifier, max_lines=2)


def _layout_matrix(builder: IRBuilder, content: dict, top: float, bottom: float) -> None:
    rows = content["rows"]
    columns = content["columns"]
    margin = builder.profile.margin
    numeric = content["value_kind"] == "quantitative"
    if numeric:
        context = f"期间：{content['period']}｜单位：{content['unit']}｜分母：{content['denominator']}"
        builder.text(context, (margin, top, builder.profile.width - margin, top + builder.profile.fonts["label"] * 1.5), role="label", color=COLORS["muted"], max_lines=1)
        top += builder.profile.fonts["label"] * 1.8
    table_width = builder.profile.width - 2 * margin
    first_width = max(builder.profile.fonts["label"] * 5.8, table_width * 0.18)
    cell_width = (table_width - first_width) / len(columns)
    row_height = (bottom - top) / (len(rows) + 1)
    if cell_width < builder.profile.fonts["body"] * 3.2 or row_height < builder.profile.fonts["body"] * 2.1:
        raise LayoutError("matrix rows or columns overflow the selected profile")
    builder.rect("matrix-corner", (margin, top, margin + first_width, top + row_height), fill=COLORS["primary"], stroke=COLORS["white"], width=2, radius=0)
    for column_index, column in enumerate(columns):
        x0 = margin + first_width + column_index * cell_width
        identifier = f"matrix-column-{column_index}"
        builder.rect(identifier, (x0, top, x0 + cell_width, top + row_height), fill=COLORS["primary"], stroke=COLORS["white"], width=2, radius=0)
        builder.text(column, (x0 + 10, top + 8, x0 + cell_width - 10, top + row_height - 8), role="label", color=COLORS["white"], align="center", owner=identifier, max_lines=2)
    for row_index, row_label in enumerate(rows):
        y0 = top + (row_index + 1) * row_height
        label_id = f"matrix-row-{row_index}"
        builder.rect(label_id, (margin, y0, margin + first_width, y0 + row_height), fill=COLORS["panel"], stroke=COLORS["white"], width=2, radius=0)
        builder.text(row_label, (margin + 12, y0 + 8, margin + first_width - 12, y0 + row_height - 8), role="label", color=COLORS["primary"], owner=label_id, max_lines=2)
        for column_index, value in enumerate(content["cells"][row_index]):
            x0 = margin + first_width + column_index * cell_width
            identifier = f"matrix-cell-{row_index}-{column_index}"
            fill = COLORS["background"] if row_index % 2 == 0 else COLORS["panel"]
            builder.rect(identifier, (x0, y0, x0 + cell_width, y0 + row_height), fill=fill, stroke=COLORS["white"], width=2, radius=0)
            builder.text(value, (x0 + 10, y0 + 8, x0 + cell_width - 10, y0 + row_height - 8), role="body", align="center", owner=identifier, max_lines=2)


def _layout_bar(builder: IRBuilder, content: dict, top: float, bottom: float) -> None:
    margin = builder.profile.margin
    context = f"期间：{content['period']}｜单位：{content['unit']}｜分母：{content['denominator']}"
    builder.text(context, (margin, top, builder.profile.width * 0.62, top + builder.profile.fonts["label"] * 1.5), role="label", color=COLORS["muted"], max_lines=1)
    legend_x = builder.profile.width * 0.64
    legend_step = (builder.profile.width - margin - legend_x) / len(content["series"])
    palette = (COLORS["primary"], COLORS["secondary"], COLORS["accent"])
    for index, series in enumerate(content["series"]):
        x0 = legend_x + index * legend_step
        builder.rect(f"bar-legend-swatch-{index}", (x0, top + 4, x0 + 26, top + 30), fill=palette[index], stroke=palette[index], width=0, radius=2)
        builder.text(series["name"], (x0 + 36, top, x0 + legend_step - 6, top + builder.profile.fonts["label"] * 1.5), role="label", max_lines=1)
    # Reserve a complete label row between context/legend and the tallest value label.
    chart_top = top + builder.profile.fonts["label"] * 3.7
    chart_bottom = bottom - builder.profile.fonts["label"] * 2.8
    chart_left = margin + builder.profile.fonts["label"] * 2.1
    chart_right = builder.profile.width - margin
    values = [float(value) for series in content["series"] for value in series["values"]]
    minimum = min(0.0, min(values))
    maximum = max(0.0, max(values))
    if math.isclose(minimum, maximum):
        maximum = minimum + 1.0
    scale = (chart_bottom - chart_top) / (maximum - minimum)
    baseline = chart_top + maximum * scale
    builder.line((chart_left, chart_top), (chart_left, chart_bottom), stroke=COLORS["ink"], width=3)
    builder.line((chart_left, baseline), (chart_right, baseline), stroke=COLORS["ink"], width=3)
    categories = content["categories"]
    group_width = (chart_right - chart_left) / len(categories)
    bar_gap = max(4, group_width * 0.04)
    bar_width = min(84, (group_width * 0.74 - bar_gap * (len(content["series"]) - 1)) / len(content["series"]))
    if bar_width < 10:
        raise LayoutError("bar categories and series overflow the selected profile")
    for category_index, category in enumerate(categories):
        group_center = chart_left + group_width * (category_index + 0.5)
        total_width = bar_width * len(content["series"]) + bar_gap * (len(content["series"]) - 1)
        group_start = group_center - total_width / 2
        for series_index, series in enumerate(content["series"]):
            value = float(series["values"][category_index])
            value_y = chart_top + (maximum - value) * scale
            y0, y1 = sorted((baseline, value_y))
            if math.isclose(y0, y1):
                y0 -= 2
            x0 = group_start + series_index * (bar_width + bar_gap)
            builder.rect(f"bar-{category_index}-{series_index}", (x0, y0, x0 + bar_width, y1), fill=palette[series_index], stroke=palette[series_index], width=0, radius=2)
            label_y = y0 - builder.profile.fonts["label"] * 1.35 if value >= 0 else y1 + 5
            builder.text(_format_number(value), (x0 - group_width * 0.10, label_y, x0 + bar_width + group_width * 0.10, label_y + builder.profile.fonts["label"] * 1.3), role="label", align="center", max_lines=1)
        builder.text(category, (group_center - group_width * 0.46, chart_bottom + 14, group_center + group_width * 0.46, bottom), role="label", align="center", max_lines=2)


def _quantitative_context(spec: dict) -> dict | None:
    content = spec["content"]
    if (
        spec["figure_type"] in {"bar", "line", "value_chain"}
        or (spec["figure_type"] == "matrix" and content["value_kind"] == "quantitative")
        or (spec["figure_type"] == "funnel" and content["mode"] == "quantitative")
    ):
        return {key: content[key] for key in ("period", "unit", "denominator")}
    return None


def wrap_text(value: str, max_width: float, font_size: float) -> list[str]:
    lines: list[str] = []
    for paragraph in value.splitlines() or [""]:
        current = ""
        for character in paragraph:
            candidate = current + character
            if current and estimated_width(candidate, font_size) > max_width:
                lines.append(current.rstrip())
                current = character.lstrip()
            else:
                current = candidate
        if current or not lines:
            lines.append(current.rstrip())
    return [line for line in lines if line] or [""]


def estimated_width(value: str, font_size: float) -> float:
    units = 0.0
    for character in value:
        east_asian = unicodedata.east_asian_width(character)
        if east_asian in {"W", "F", "A"}:
            units += 1.0
        elif character.isspace():
            units += 0.34
        elif character.isupper():
            units += 0.66
        elif character.islower() or character.isdigit():
            units += 0.58
        else:
            units += 0.45
    return units * font_size


def _format_number(value: float) -> str:
    if value.is_integer():
        return f"{int(value):,}"
    return f"{value:,.2f}".rstrip("0").rstrip(".")


def _box(values) -> list[float]:
    return [float(value) for value in values]
