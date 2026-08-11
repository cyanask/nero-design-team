#!/usr/bin/env python3
"""Private Python entrypoint behind the public Node CLI."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from compiler import compile_file, json_output, validate_file
from constants import RENDERERS, capability_manifest
from errors import FigureCompilerError
from render_png import pillow_available


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="ndt-report-figure-compiler-core")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("list")

    validate = subparsers.add_parser("validate")
    _common_spec_args(validate)

    compile_parser = subparsers.add_parser("compile")
    _common_spec_args(compile_parser)
    compile_parser.add_argument("--out", required=True, type=Path)
    compile_parser.add_argument("--receipt", type=Path)

    probe = subparsers.add_parser("probe")
    probe.add_argument("--renderer", choices=RENDERERS, default="vector-svg")
    return parser.parse_args(argv)


def _common_spec_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--spec", required=True, type=Path)
    parser.add_argument("--profile")
    parser.add_argument("--renderer")


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        if args.command == "list":
            result = capability_manifest()
        elif args.command == "probe":
            available, detail = (pillow_available() if args.renderer == "raster-canvas-png" else (True, "standard library SVG renderer"))
            result = {"status": "available" if available else "unavailable", "renderer": args.renderer, "detail": detail}
            if not available:
                print(json.dumps(result, ensure_ascii=False), file=sys.stderr)
                return 3
        elif args.command == "validate":
            result = validate_file(args.spec, profile=args.profile, renderer=args.renderer)
        else:
            result = compile_file(
                args.spec,
                args.out,
                profile=args.profile,
                renderer=args.renderer,
                receipt_path=args.receipt,
            )
        print(json_output(result))
        return 0
    except (FigureCompilerError, OSError) as error:
        print(json.dumps({"status": "failed", "error": str(error)}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
