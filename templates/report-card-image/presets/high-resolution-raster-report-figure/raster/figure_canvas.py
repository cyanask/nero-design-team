"""Deterministic high-resolution PNG canvas with fail-closed text geometry QA."""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


# NDT report-theme color tokens, kept local so generated projects stay portable.
WHITE = (255, 255, 255)
INK = (29, 37, 44)
MUTED = (83, 97, 107)
BORDER = (174, 187, 195)
PANEL = (245, 247, 248)
PRIMARY = (31, 78, 95)
SECONDARY = (111, 78, 55)
ACCENT = (198, 161, 91)

MIN_FONT_BY_ROLE = {
    "title": 72,
    "subtitle": 44,
    "body": 38,
    "label": 34,
    "source": 32,
}

_WRAP_UNIT = re.compile(r"[A-Za-z0-9]+(?:\s*[/.,\-]\s*[A-Za-z0-9]+)*|[^A-Za-z0-9]+")
_LINE_START_PUNCT = "，。；：、）】》」’”！？/"


class FigureLayoutError(RuntimeError):
    pass


@dataclass(frozen=True)
class TextRecord:
    box: tuple[float, float, float, float]
    text: str
    role: str
    size: int
    owner: str | None


class FigureCanvas:
    def __init__(self, width: int = 2400, height: int = 1400, background=WHITE):
        self.image = Image.new("RGB", (width, height), background)
        self.draw = ImageDraw.Draw(self.image)
        self.width = width
        self.height = height
        self.font_path = resolve_cjk_font()
        self.text_records: list[TextRecord] = []
        self.cards: dict[str, tuple[float, float, float, float]] = {}

    def font(self, size: int):
        return ImageFont.truetype(str(self.font_path), size=size)

    def card(self, card_id: str, box, fill=PANEL, outline=BORDER, radius: int = 18):
        if card_id in self.cards:
            raise ValueError(f"duplicate card id: {card_id}")
        normalized = tuple(float(value) for value in box)
        self.cards[card_id] = normalized
        self.draw.rounded_rectangle(normalized, radius=radius, fill=fill, outline=outline, width=3)

    def text(
        self,
        xy,
        value: str,
        *,
        size: int,
        role: str,
        max_width: float,
        fill=INK,
        owner: str | None = None,
        centered: bool = False,
        line_height: float = 1.32,
    ) -> float:
        font = self.font(size)
        lines = smart_wrap(self.draw, value, font, max_width)
        x, y = xy
        step = int(size * line_height)
        for line in lines:
            bbox = self.draw.textbbox((0, 0), line, font=font)
            line_width = bbox[2] - bbox[0]
            line_x = x - line_width / 2 if centered else x
            self.draw.text((line_x, y), line, font=font, fill=fill)
            placed = self.draw.textbbox((line_x, y), line, font=font)
            self.text_records.append(TextRecord(tuple(float(v) for v in placed), line, role, size, owner))
            y += step
        return y

    def arrow(self, start, end, fill=INK, width: int = 5):
        x0, y0 = start
        x1, y1 = end
        self.draw.line((x0, y0, x1, y1), fill=fill, width=width)
        head = 18
        self.draw.polygon([(x1, y1), (x1 - head, y1 - 12), (x1 - head, y1 + 12)], fill=fill)

    def validate(self) -> list[str]:
        issues: list[str] = []
        if self.width < 2100:
            issues.append(f"canvas width {self.width}px is below the 2100px report-figure floor")
        if self.image.mode != "RGB":
            issues.append(f"canvas mode must be RGB, found {self.image.mode}")

        for record in self.text_records:
            x0, y0, x1, y1 = record.box
            minimum = MIN_FONT_BY_ROLE.get(record.role)
            if minimum is None:
                issues.append(f"unknown typography role: {record.role}")
            elif record.size < minimum:
                issues.append(
                    f"font below floor for {record.role}: {record.size}px < {minimum}px ({record.text[:24]})"
                )
            if x0 < 0 or y0 < 0 or x1 > self.width or y1 > self.height:
                issues.append(f"canvas overflow: {record.text[:24]} box={record.box}")
            if record.owner:
                card = self.cards.get(record.owner)
                if card is None:
                    issues.append(f"text references unknown card {record.owner}: {record.text[:24]}")
                elif not contains(card, record.box, margin=10):
                    issues.append(f"card overflow in {record.owner}: {record.text[:24]} box={record.box}")

        for index, left in enumerate(self.text_records):
            for right in self.text_records[index + 1 :]:
                if overlaps(left.box, right.box, tolerance=3):
                    issues.append(f"text collision: {left.text[:18]} <> {right.text[:18]}")
        return issues

    def save(self, output: Path):
        issues = self.validate()
        if issues:
            summary = "\n".join(f"- {issue}" for issue in issues[:40])
            raise FigureLayoutError(f"{len(issues)} issue(s)\n{summary}")
        output.parent.mkdir(parents=True, exist_ok=True)
        self.image.save(output, format="PNG", dpi=(300, 300), optimize=True)


def resolve_cjk_font() -> Path:
    configured = os.environ.get("NERO_CJK_FONT")
    candidates = [
        configured,
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Supplemental/Songti.ttc",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return Path(candidate)
    raise FigureLayoutError(
        "Chinese font not found. Set NERO_CJK_FONT to an installed CJK .ttf/.otf/.ttc file."
    )


def smart_wrap(draw, text: str, font, max_width: float) -> list[str]:
    if max_width <= 0:
        raise FigureLayoutError(f"max_width must be positive, found {max_width}")
    units = _WRAP_UNIT.findall(str(text))
    lines: list[str] = []
    current = ""
    for unit in units:
        candidate = current + unit
        if text_width(draw, candidate, font) <= max_width:
            current = candidate
            continue
        if current:
            lines.append(current)
            current = ""
        for character in unit:
            if current and text_width(draw, current + character, font) > max_width:
                lines.append(current)
                current = character
            else:
                current += character
    if current:
        lines.append(current)
    for index in range(1, len(lines)):
        while lines[index] and lines[index][0] in _LINE_START_PUNCT:
            punctuation = lines[index][0]
            if text_width(draw, lines[index - 1] + punctuation, font) > max_width + 36:
                break
            lines[index - 1] += punctuation
            lines[index] = lines[index][1:]
    return [line for line in lines if line]


def text_width(draw, value: str, font) -> float:
    box = draw.textbbox((0, 0), value, font=font)
    return float(box[2] - box[0])


def contains(outer, inner, margin: float = 0) -> bool:
    ox0, oy0, ox1, oy1 = outer
    ix0, iy0, ix1, iy1 = inner
    return ix0 >= ox0 + margin and iy0 >= oy0 + margin and ix1 <= ox1 - margin and iy1 <= oy1 - margin


def overlaps(left, right, tolerance: float = 0) -> bool:
    lx0, ly0, lx1, ly1 = left
    rx0, ry0, rx1, ry1 = right
    return lx0 < rx1 - tolerance and rx0 < lx1 - tolerance and ly0 < ry1 - tolerance and ry0 < ly1 - tolerance
