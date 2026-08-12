"""Focused public-seam test for the optional high-resolution PNG report-figure preset."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    from PIL import Image
except ModuleNotFoundError:
    print(
        "UNAVAILABLE: optional Python dependency Pillow is required for the raster report-figure test.",
        file=sys.stderr,
    )
    raise SystemExit(3)


ROOT = Path(__file__).resolve().parents[1]
GENERATOR = ROOT / "scripts" / "nero-design.mjs"


def run(*args, cwd: Path | None = None):
    return subprocess.run(args, cwd=cwd or ROOT, text=True, capture_output=True)


def require(condition: bool, message: str):
    if not condition:
        raise RuntimeError(message)


def main():
    with tempfile.TemporaryDirectory(prefix="ndt-raster-report-figure-") as temp:
        temp_root = Path(temp)
        generated = run(
            "node",
            str(GENERATOR),
            "new",
            "image-report",
            "--preset",
            "高分辨率PNG报告图",
            "--name",
            "sample-raster-figure",
            "--out",
            str(temp_root),
        )
        require(generated.returncode == 0, generated.stderr or generated.stdout)

        project = temp_root / "sample-raster-figure"
        manifest = json.loads((project / ".nero-design" / "manifest.json").read_text(encoding="utf-8"))
        require(manifest["route"] == "image-report", f"unexpected route: {manifest['route']}")
        require(
            manifest["preset"] == "high-resolution-raster-report-figure",
            f"unexpected preset: {manifest['preset']}",
        )

        raster = project / "raster"
        renderer = raster / "render_figure.py"
        sample_spec = raster / "figure-spec.example.json"
        output = raster / "sample.png"
        rendered = run(sys.executable, str(renderer), str(sample_spec), "--out", str(output), cwd=raster)
        require(rendered.returncode == 0, rendered.stderr or rendered.stdout)
        require(output.is_file() and output.stat().st_size > 0, "sample PNG was not created")
        with Image.open(output) as image:
            require(image.size == (2400, 1400), f"unexpected output size: {image.size}")
            require(image.mode == "RGB", f"unexpected output mode: {image.mode}")
            dpi = image.info.get("dpi", (0, 0))
            require(min(dpi) >= 290, f"unexpected output DPI: {dpi}")

        bad_spec = json.loads(sample_spec.read_text(encoding="utf-8"))
        bad_spec["stages"][0]["lines"] = [f"拥挤测试内容第{index}项" for index in range(1, 26)]
        bad_path = raster / "bad-spec.json"
        bad_path.write_text(json.dumps(bad_spec, ensure_ascii=False, indent=2), encoding="utf-8")
        bad_output = raster / "bad.png"
        rejected = run(sys.executable, str(renderer), str(bad_path), "--out", str(bad_output), cwd=raster)
        require(rejected.returncode != 0, "overflowing figure was not rejected")
        require("layout validation failed" in rejected.stderr, rejected.stderr or rejected.stdout)
        require(not bad_output.exists(), "failed layout still produced an output PNG")

    print("PASS optional raster preset is discoverable, renders 2400px RGB PNG at 300 DPI, and rejects overflow")


if __name__ == "__main__":
    main()
