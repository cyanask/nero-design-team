"""Stable public capabilities and profile contracts."""

from __future__ import annotations

from dataclasses import dataclass


COMPILER_NAME = "ndt-report-figure-compiler"
COMPILER_VERSION = "0.2.0"
SCHEMA_VERSION = "0.2.0"
SCHEMA_VERSIONS = ("0.1.0", "0.2.0")

LEGACY_FIGURE_TYPES = ("flow", "timeline", "hierarchy", "matrix", "bar")
V02_FIGURE_TYPES = ("funnel", "line", "participant_map", "value_chain")
FIGURE_TYPES = (*LEGACY_FIGURE_TYPES, *V02_FIGURE_TYPES)
RENDERERS = ("vector-svg", "raster-canvas-png")
OFFICE_HANDOFF = "office-native"


@dataclass(frozen=True)
class Profile:
    identifier: str
    width: int
    height: int
    margin: int
    fonts: dict[str, int]


PROFILES = {
    "report-a4": Profile(
        "report-a4",
        2400,
        1500,
        96,
        {"title": 72, "subtitle": 44, "body": 38, "label": 34, "source": 32},
    ),
    "wechat-inline": Profile(
        "wechat-inline",
        1080,
        1350,
        52,
        {"title": 42, "subtitle": 28, "body": 26, "label": 22, "source": 20},
    ),
    "ppt-16x9": Profile(
        "ppt-16x9",
        1920,
        1080,
        72,
        {"title": 48, "subtitle": 30, "body": 26, "label": 22, "source": 18},
    ),
}

COLORS = {
    "background": "#FFFFFF",
    "ink": "#1D252C",
    "muted": "#53616B",
    "border": "#AEBBC3",
    "panel": "#F5F7F8",
    "primary": "#1F4E5F",
    "secondary": "#6F4E37",
    "accent": "#C6A15B",
    "blue": "#4C7182",
    "light_line": "#D7DCE3",
    "white": "#FFFFFF",
}

FONT_FAMILY = "PingFang SC, Hiragino Sans GB, Noto Sans CJK SC, Arial Unicode MS, sans-serif"


def capability_manifest() -> dict:
    return {
        "compiler": {"name": COMPILER_NAME, "version": COMPILER_VERSION},
        "schema_versions": list(SCHEMA_VERSIONS),
        "figure_types": list(FIGURE_TYPES),
        "profiles": [
            {"id": item.identifier, "width": item.width, "height": item.height}
            for item in PROFILES.values()
        ],
        "renderers": [
            {"id": "vector-svg", "status": "implemented", "dependency": "python-standard-library"},
            {"id": "raster-canvas-png", "status": "implemented", "dependency": "Pillow-optional"},
            {
                "id": OFFICE_HANDOFF,
                "status": "handoff-only",
                "implemented": False,
                "reason": "Use the report owner or Office production engine for editable native objects.",
            },
        ],
        "module_health_decision": "keep_cohesive",
        "module_health_reason": "Each module exposes one stable seam and the public CLI has focused tests.",
    }
