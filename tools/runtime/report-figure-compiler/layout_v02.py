"""Business-semantic layouts introduced by schema v0.2."""

from __future__ import annotations

import math

from constants import COLORS
from errors import LayoutError


PALETTE = (COLORS["primary"], COLORS["blue"], COLORS["secondary"], COLORS["accent"])
GATE_COLORS = {
    "passed": COLORS["primary"],
    "in_progress": COLORS["blue"],
    "blocked": COLORS["secondary"],
    "pending": COLORS["border"],
}
GATE_LABELS = {"passed": "已通过", "in_progress": "进行中", "blocked": "受阻", "pending": "待开始"}
METRIC_LABELS = {"value_share": "价值占比", "gross_margin": "毛利率", "profit_pool": "利润池"}


def layout_v02(builder, figure_type: str, content: dict, top: float, bottom: float) -> None:
    globals()[f"_layout_{figure_type}"](builder, content, top, bottom)


def _layout_funnel(builder, content: dict, top: float, bottom: float) -> None:
    margin = builder.profile.margin
    if content["mode"] == "quantitative":
        context = f"期间：{content['period']}｜单位：{content['unit']}｜分母：{content['denominator']}"
        builder.text(context, (margin, top, builder.profile.width - margin, top + builder.profile.fonts["label"] * 1.5), role="label", color=COLORS["muted"], max_lines=1)
    else:
        context = "阶段门状态：已通过 / 进行中 / 受阻 / 待开始"
        builder.text(context, (margin, top, builder.profile.width - margin, top + builder.profile.fonts["label"] * 1.5), role="label", color=COLORS["muted"], max_lines=1)
    top += builder.profile.fonts["label"] * 1.9
    stages = content["stages"]
    gap = max(8, builder.profile.fonts["label"] * 0.24)
    stage_height = (bottom - top - gap * (len(stages) - 1)) / len(stages)
    if stage_height < builder.profile.fonts["label"] * 2.25:
        raise LayoutError("funnel stages overflow the selected profile")
    center_x = builder.profile.width / 2
    max_width = builder.profile.width - 2 * margin
    quantitative_widths = None
    if content["mode"] == "quantitative":
        quantitative_widths = _readable_funnel_widths(
            [float(stage["value"]) for stage in stages],
            max_width,
            builder.profile.fonts["label"],
        )
        builder.ir["warnings"].append(
            "Quantitative funnel widths use a non-linear log1p readability transform with minimum visual separation. "
            "Exact value labels are authoritative; polygon widths are not linear proportions."
        )
    for index, stage in enumerate(stages):
        y0 = top + index * (stage_height + gap)
        y1 = y0 + stage_height
        if content["mode"] == "quantitative":
            width_top = quantitative_widths[index]
            width_bottom = (
                quantitative_widths[index + 1]
                if index + 1 < len(quantitative_widths)
                else max(max_width * 0.30, width_top - max(6, builder.profile.fonts["label"] * 0.35))
            )
        else:
            ratio = 1.0 - index * (0.48 / max(1, len(stages) - 1))
            width_top = max_width * ratio
            next_ratio = ratio if index == len(stages) - 1 else max(0.34, ratio - 0.055)
            width_bottom = max_width * next_ratio
        points = [
            (center_x - width_top / 2, y0),
            (center_x + width_top / 2, y0),
            (center_x + width_bottom / 2, y1),
            (center_x - width_bottom / 2, y1),
        ]
        identifier = f"funnel-stage-{index}"
        fill = PALETTE[index % len(PALETTE)] if content["mode"] == "quantitative" else GATE_COLORS[stage["gate"]]
        builder.polygon(identifier, points, fill=fill, stroke=COLORS["white"], width=2)
        if content["mode"] == "quantitative":
            headline = f"{stage['label']}｜{_number(float(stage['value']))} {content['unit']}"
        else:
            headline = f"{stage['label']}｜{GATE_LABELS[stage['gate']]}"
        if stage.get("detail"):
            headline += f"\n{stage['detail']}"
        inset = max(18, builder.profile.fonts["label"] * 0.55)
        builder.text(
            headline,
            (center_x - width_bottom / 2 + inset, y0 + 7, center_x + width_bottom / 2 - inset, y1 - 7),
            role="label",
            color=COLORS["white"] if stage.get("gate") != "pending" else COLORS["ink"],
            align="center",
            owner=identifier,
            max_lines=2,
        )


def _layout_line(builder, content: dict, top: float, bottom: float) -> None:
    margin = builder.profile.margin
    context = f"期间：{content['period']}｜单位：{content['unit']}｜分母：{content['denominator']}"
    builder.text(context, (margin, top, builder.profile.width * 0.58, top + builder.profile.fonts["label"] * 2.7), role="label", color=COLORS["muted"], max_lines=2)
    legend_x = builder.profile.width * 0.62
    legend_step = (builder.profile.width - margin - legend_x) / len(content["series"])
    for index, series in enumerate(content["series"]):
        x0 = legend_x + index * legend_step
        builder.line((x0, top + builder.profile.fonts["label"] * 0.55), (x0 + 28, top + builder.profile.fonts["label"] * 0.55), stroke=PALETTE[index], width=5)
        builder.text(series["name"], (x0 + 38, top, x0 + legend_step - 4, top + builder.profile.fonts["label"] * 1.5), role="label", max_lines=1)
    chart_top = top + builder.profile.fonts["label"] * 3.2
    chart_bottom = bottom - builder.profile.fonts["label"] * 3.6
    chart_left = margin + builder.profile.fonts["label"] * 3.0
    chart_right = builder.profile.width - margin
    values = [float(value) for series in content["series"] for value in series["values"]]
    minimum = min(values)
    maximum = max(values)
    if math.isclose(minimum, maximum):
        padding = max(1.0, abs(maximum) * 0.1)
        minimum -= padding
        maximum += padding
    else:
        padding = (maximum - minimum) * 0.08
        minimum -= padding
        maximum += padding
    builder.line((chart_left, chart_top), (chart_left, chart_bottom), stroke=COLORS["ink"], width=3)
    builder.line((chart_left, chart_bottom), (chart_right, chart_bottom), stroke=COLORS["ink"], width=3)
    for step in range(5):
        y = chart_top + (chart_bottom - chart_top) * step / 4
        value = maximum - (maximum - minimum) * step / 4
        builder.line((chart_left, y), (chart_right, y), stroke=COLORS["light_line"], width=2)
        builder.text(_number(value), (margin, y - builder.profile.fonts["label"] * 0.65, chart_left - 14, y + builder.profile.fonts["label"] * 0.7), role="label", color=COLORS["muted"], align="right", max_lines=1)
    labels = content["x_labels"]
    step_x = (chart_right - chart_left) / (len(labels) - 1)
    for index, label in enumerate(labels):
        x = chart_left + index * step_x
        builder.text(
            label,
            (
                x - step_x * 0.44,
                chart_bottom + builder.profile.fonts["label"] * 1.6,
                x + step_x * 0.44,
                bottom,
            ),
            role="label",
            align="center",
            max_lines=2,
        )
    for series_index, series in enumerate(content["series"]):
        points = []
        for index, raw in enumerate(series["values"]):
            x = chart_left + index * step_x
            y = chart_top + (maximum - float(raw)) / (maximum - minimum) * (chart_bottom - chart_top)
            points.append((x, y))
        builder.polyline(points, stroke=PALETTE[series_index], width=5)
        for point_index, point in enumerate(points):
            builder.circle(f"line-point-{series_index}-{point_index}", point, 8, fill=COLORS["white"], stroke=PALETTE[series_index], width=4)


def _layout_participant_map(builder, content: dict, top: float, bottom: float) -> None:
    margin = builder.profile.margin
    basis_height = builder.profile.fonts["label"] * 2.7
    builder.text(f"定位依据：{content['basis']}", (margin, top, builder.profile.width - margin, top + basis_height), role="label", color=COLORS["muted"], max_lines=2)
    axis_row_top = top + basis_height + builder.profile.fonts["label"] * 0.25
    chart_top = axis_row_top + builder.profile.fonts["label"] * 2.95
    chart_bottom = bottom - builder.profile.fonts["label"] * 2.5
    chart_left = margin + builder.profile.fonts["label"] * 2.8
    chart_right = builder.profile.width - margin
    builder.arrow((chart_left, chart_bottom), (chart_right, chart_bottom), stroke=COLORS["ink"], width=3)
    builder.arrow((chart_left, chart_bottom), (chart_left, chart_top), stroke=COLORS["ink"], width=3)
    x_axis = content["x_axis"]
    y_axis = content["y_axis"]
    builder.text(
        f"纵轴：{y_axis['label']}",
        (chart_left, axis_row_top, chart_right, axis_row_top + builder.profile.fonts["label"] * 1.35),
        role="label",
        color=COLORS["primary"],
        max_lines=1,
    )
    builder.text(
        f"{y_axis['low']}（下）→ {y_axis['high']}（上）",
        (
            chart_left,
            axis_row_top + builder.profile.fonts["label"] * 1.45,
            chart_right,
            chart_top,
        ),
        role="label",
        color=COLORS["muted"],
        max_lines=1,
    )
    builder.text(f"{x_axis['low']} ← {x_axis['label']} → {x_axis['high']}", (chart_left, chart_bottom + 18, chart_right, bottom), role="label", align="center", max_lines=1)
    # Bubble diameter must hold a five-CJK-character participant label plus one category line.
    radius = max(46, builder.profile.fonts["label"] * 2.9)
    categories = []
    for participant in content["participants"]:
        category = participant.get("category", "未分类")
        if category not in categories:
            categories.append(category)
    positioned = []
    for index, participant in enumerate(content["participants"]):
        x = chart_left + radius + float(participant["x"]) / 100 * (chart_right - chart_left - radius * 2)
        y = chart_bottom - radius - float(participant["y"]) / 100 * (chart_bottom - chart_top - radius * 2)
        positioned.append((index, participant, x, y))
    for left_index, left, left_x, left_y in positioned:
        for right_index, right, right_x, right_y in positioned[left_index + 1 :]:
            distance = math.hypot(right_x - left_x, right_y - left_y)
            if distance < radius * 2 + 4:
                raise LayoutError(
                    "participant-map circles overlap in the selected profile: "
                    f"{left['id']} <> {right['id']}; preserve coordinates or choose a larger profile"
                )
    for index, participant, x, y in positioned:
        category = participant.get("category", "未分类")
        identifier = f"participant-{index}"
        builder.circle(identifier, (x, y), radius, fill=PALETTE[categories.index(category) % len(PALETTE)], stroke=COLORS["white"], width=3)
        label = participant["label"]
        if participant.get("category"):
            label += f"\n{participant['category']}"
        builder.text(label, (x - radius + 10, y - radius + 9, x + radius - 10, y + radius - 9), role="label", color=COLORS["white"], align="center", owner=identifier, max_lines=2)


def _layout_value_chain(builder, content: dict, top: float, bottom: float) -> None:
    margin = builder.profile.margin
    context = f"指标：{METRIC_LABELS[content['metric']]}｜期间：{content['period']}｜单位：{content['unit']}｜分母：{content['denominator']}"
    builder.text(context, (margin, top, builder.profile.width - margin, top + builder.profile.fonts["label"] * 1.5), role="label", color=COLORS["muted"], max_lines=1)
    top += builder.profile.fonts["label"] * 2.0
    if builder.profile.width < 1400:
        _value_chain_vertical(builder, content, top, bottom)
    else:
        _value_chain_horizontal(builder, content, top, bottom)


def _value_chain_horizontal(builder, content: dict, top: float, bottom: float) -> None:
    stages = content["stages"]
    margin = builder.profile.margin
    gap = max(34, builder.profile.fonts["label"] * 1.1)
    card_width = (builder.profile.width - 2 * margin - gap * (len(stages) - 1)) / len(stages)
    if card_width < builder.profile.fonts["body"] * 4.4:
        raise LayoutError("value-chain stages overflow horizontally")
    maximum = max(float(stage["value"]) for stage in stages) or 1.0
    center_y = (top + bottom) / 2
    for index in range(len(stages) - 1):
        left = margin + index * (card_width + gap) + card_width
        builder.arrow((left + 7, center_y), (left + gap - 7, center_y), stroke=COLORS["blue"], width=4)
    for index, stage in enumerate(stages):
        x0 = margin + index * (card_width + gap)
        identifier = f"value-chain-{index}"
        builder.rect(identifier, (x0, top, x0 + card_width, bottom), fill=COLORS["panel"], stroke=COLORS["border"], width=2)
        builder.rect(f"{identifier}-head", (x0, top, x0 + card_width, top + builder.profile.fonts["label"] * 2.15), fill=PALETTE[index % len(PALETTE)], stroke=PALETTE[index % len(PALETTE)], width=0)
        builder.text(stage["label"], (x0 + 14, top + 10, x0 + card_width - 14, top + builder.profile.fonts["label"] * 1.95), role="label", color=COLORS["white"], align="center", owner=identifier, max_lines=2)
        builder.text(f"{_number(float(stage['value']))} {content['unit']}", (x0 + 14, top + builder.profile.fonts["label"] * 2.6, x0 + card_width - 14, top + builder.profile.fonts["label"] * 4.4), role="subtitle", color=COLORS["primary"], align="center", owner=identifier, max_lines=1)
        if stage.get("detail"):
            builder.text(stage["detail"], (x0 + 18, top + builder.profile.fonts["label"] * 5.0, x0 + card_width - 18, bottom - builder.profile.fonts["label"] * 1.8), role="body", owner=identifier, max_lines=5)
        bar_width = (card_width - 36) * float(stage["value"]) / maximum
        builder.rect(f"{identifier}-bar", (x0 + 18, bottom - builder.profile.fonts["label"] * 1.2, x0 + 18 + max(4, bar_width), bottom - 18), fill=PALETTE[index % len(PALETTE)], stroke=PALETTE[index % len(PALETTE)], width=0, radius=3)


def _value_chain_vertical(builder, content: dict, top: float, bottom: float) -> None:
    stages = content["stages"]
    margin = builder.profile.margin
    gap = 24
    height = (bottom - top - gap * (len(stages) - 1)) / len(stages)
    if height < builder.profile.fonts["body"] * 3.0:
        raise LayoutError("value-chain stages overflow vertically")
    maximum = max(float(stage["value"]) for stage in stages) or 1.0
    for index in range(len(stages) - 1):
        y = top + (index + 1) * height + index * gap
        builder.arrow((builder.profile.width / 2, y + 4), (builder.profile.width / 2, y + gap - 4), stroke=COLORS["blue"], width=3)
    for index, stage in enumerate(stages):
        y0 = top + index * (height + gap)
        identifier = f"value-chain-{index}"
        builder.rect(identifier, (margin, y0, builder.profile.width - margin, y0 + height), fill=COLORS["panel"], width=2)
        label_width = min(260, (builder.profile.width - 2 * margin) * 0.31)
        builder.text(stage["label"], (margin + 16, y0 + 12, margin + label_width, y0 + height - 12), role="label", color=COLORS["primary"], owner=identifier, max_lines=2)
        builder.text(f"{_number(float(stage['value']))} {content['unit']}", (margin + label_width + 14, y0 + 12, margin + label_width + 210, y0 + height - 12), role="subtitle", color=COLORS["secondary"], owner=identifier, max_lines=1)
        if stage.get("detail"):
            builder.text(stage["detail"], (margin + label_width + 230, y0 + 12, builder.profile.width - margin - 22, y0 + height - 12), role="body", owner=identifier, max_lines=2)
        bar_x = builder.profile.width - margin - 190
        bar_width = 160 * float(stage["value"]) / maximum
        builder.rect(f"{identifier}-bar", (bar_x, y0 + height - 22, bar_x + max(4, bar_width), y0 + height - 12), fill=PALETTE[index % len(PALETTE)], stroke=PALETTE[index % len(PALETTE)], width=0, radius=2)


def _number(value: float) -> str:
    if value.is_integer():
        return f"{int(value):,}"
    return f"{value:,.2f}".rstrip("0").rstrip(".")


def _readable_funnel_widths(values: list[float], max_width: float, label_size: float) -> list[float]:
    maximum = max(values) if values else 0.0
    minimum_width = max_width * 0.32
    visual_range = max_width - minimum_width
    denominator = math.log1p(maximum) if maximum > 0 else 1.0
    desired = [minimum_width + visual_range * math.log1p(value) / denominator for value in values]
    minimum_gap = max(6.0, label_size * 0.35)
    widths = [desired[0]]
    for index in range(1, len(values)):
        if values[index] == values[index - 1]:
            widths.append(widths[-1])
        else:
            widths.append(min(desired[index], widths[-1] - minimum_gap))
    if widths[-1] < minimum_width:
        distinct_steps = sum(left != right for left, right in zip(values, values[1:]))
        safe_gap = (max_width - minimum_width) / max(1, distinct_steps)
        widths = [max_width]
        for index in range(1, len(values)):
            widths.append(widths[-1] if values[index] == values[index - 1] else widths[-1] - safe_gap)
    return widths
