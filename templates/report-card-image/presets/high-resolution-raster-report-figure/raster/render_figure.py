"""Render a source-free explanatory flow figure from a small JSON specification."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from figure_canvas import ACCENT, INK, MUTED, PANEL, PRIMARY, SECONDARY, WHITE, FigureCanvas, FigureLayoutError


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("spec", type=Path)
    parser.add_argument("--out", type=Path)
    return parser.parse_args()


def render(spec: dict, output: Path):
    width = int(spec.get("width", 2400))
    height = int(spec.get("height", 1400))
    stages = spec.get("stages") or []
    if not 3 <= len(stages) <= 5:
        raise FigureLayoutError("flow figure requires 3 to 5 stages; split a denser chain into multiple figures")

    canvas = FigureCanvas(width, height)
    canvas.text((width / 2, 38), spec["title"], size=76, role="title", max_width=width - 180, centered=True)
    canvas.text((width / 2, 140), spec["subtitle"], size=46, role="subtitle", max_width=width - 220, fill=MUTED, centered=True)
    canvas.draw.line((80, 220, width - 80, 220), fill=INK, width=3)

    margin = 80
    gap = 42
    card_y = 310
    card_height = int(spec.get("card_height", 650))
    card_width = (width - 2 * margin - gap * (len(stages) - 1)) / len(stages)
    colors = [PRIMARY, SECONDARY, ACCENT, (83, 96, 112), PRIMARY]

    for index, stage in enumerate(stages):
        x0 = margin + index * (card_width + gap)
        x1 = x0 + card_width
        card_id = f"stage-{index + 1}"
        canvas.card(card_id, (x0, card_y, x1, card_y + card_height), fill=PANEL)
        canvas.draw.rounded_rectangle((x0, card_y, x1, card_y + 92), radius=18, fill=colors[index], outline=colors[index])
        canvas.draw.rectangle((x0, card_y + 48, x1, card_y + 92), fill=colors[index])
        canvas.text(
            ((x0 + x1) / 2, card_y + 18),
            stage["title"],
            size=44,
            role="subtitle",
            max_width=card_width - 42,
            fill=WHITE,
            owner=card_id,
            centered=True,
        )
        text_y = card_y + 126
        for line in stage.get("lines", []):
            text_y = canvas.text(
                (x0 + 24, text_y),
                f"• {line}",
                size=38,
                role="body",
                max_width=card_width - 48,
                fill=INK,
                owner=card_id,
            ) + 16
        if index < len(stages) - 1:
            canvas.arrow((x1 + 8, card_y + card_height / 2), (x1 + gap - 8, card_y + card_height / 2))

    insight_y = card_y + card_height + 72
    canvas.text(
        (width / 2, insight_y),
        spec.get("insight", "先说明关系，再由正文解释判断边界。"),
        size=40,
        role="body",
        max_width=width - 220,
        fill=MUTED,
        centered=True,
    )
    source_y = height - 100
    canvas.draw.line((80, source_y - 28, width - 80, source_y - 28), fill=(215, 220, 227), width=2)
    canvas.text((82, source_y), spec["source"], size=34, role="source", max_width=width - 164, fill=MUTED)
    canvas.save(output)


def main():
    args = parse_args()
    spec = json.loads(args.spec.read_text(encoding="utf-8"))
    output = args.out or args.spec.with_suffix(".png")
    try:
        render(spec, output)
    except FigureLayoutError as error:
        raise SystemExit(f"layout validation failed: {error}") from error
    print(f"rendered={output}")


if __name__ == "__main__":
    main()
