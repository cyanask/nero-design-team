#!/usr/bin/env python3
"""Focused public-CLI tests for NDT Report Figure Compiler."""

from __future__ import annotations

import copy
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
CLI = ROOT / "scripts" / "report-figure-compiler.mjs"
NODE = shutil.which("node") or "node"


def base_spec(
    figure_type: str,
    content: dict,
    *,
    profile: str = "report-a4",
    renderer: str = "vector-svg",
    schema_version: str = "0.1.0",
) -> dict:
    return {
        "schema_version": schema_version,
        "figure_id": f"test-{figure_type}",
        "figure_type": figure_type,
        "title": f"{figure_type} 公开接口测试",
        "subtitle": "仅使用合成内容验证布局和渲染合同",
        "source": {"label": "资料来源：合成测试数据", "locator": "fixture://public-cli"},
        "profile": profile,
        "renderer": renderer,
        "content": content,
    }


def sample_specs() -> dict[str, dict]:
    return {
        "flow": base_spec(
            "flow",
            {
                "nodes": [
                    {"id": "a", "label": "需求变化", "detail": "终端需求和使用场景发生变化"},
                    {"id": "b", "label": "方案调整", "detail": "系统规格与关键部件重新选型"},
                    {"id": "c", "label": "订单形成", "detail": "验证、交付、回款与复购"},
                ],
                "edges": [{"from": "a", "to": "b"}, {"from": "b", "to": "c"}],
            },
        ),
        "timeline": base_spec(
            "timeline",
            {
                "events": [
                    {"period": "第一阶段", "label": "样品验证"},
                    {"period": "第二阶段", "label": "小批量交付"},
                    {"period": "第三阶段", "label": "量产爬坡"},
                    {"period": "第四阶段", "label": "稳定复购"},
                ]
            },
        ),
        "hierarchy": base_spec(
            "hierarchy",
            {
                "root": {
                    "label": "能力体系",
                    "children": [
                        {"label": "产品能力", "children": [{"label": "设计"}, {"label": "验证"}]},
                        {"label": "交付能力", "children": [{"label": "制造"}, {"label": "服务"}]},
                    ],
                }
            },
        ),
        "matrix": base_spec(
            "matrix",
            {
                "value_kind": "qualitative",
                "rows": ["方案甲", "方案乙", "方案丙"],
                "columns": ["稳定性", "可编辑性", "适用场景"],
                "cells": [
                    ["高", "低", "报告嵌入"],
                    ["高", "中", "网页与投影"],
                    ["中", "高", "Office 交接"],
                ],
            },
        ),
        "bar": base_spec(
            "bar",
            {
                "period": "2026年1—6月",
                "unit": "%",
                "denominator": "各类别样本总数",
                "categories": ["类别甲", "类别乙", "类别丙", "类别丁"],
                "series": [{"name": "占比", "values": [18, 32, 27, 41]}],
            },
        ),
        "funnel": base_spec(
            "funnel",
            {
                "mode": "quantitative",
                "period": "2026年1—6月",
                "unit": "个",
                "denominator": "进入首阶段的全部项目",
                "stages": [
                    {"id": "lead", "label": "线索", "value": 120, "detail": "已识别机会"},
                    {"id": "qualified", "label": "已确认", "value": 72, "detail": "需求与预算明确"},
                    {"id": "proposal", "label": "方案阶段", "value": 40, "detail": "进入正式评审"},
                    {"id": "won", "label": "完成转化", "value": 18, "detail": "合同已生效"},
                ],
            },
            schema_version="0.2.0",
        ),
        "line": base_spec(
            "line",
            {
                "period": "2025年第四季度至2026年第三季度",
                "unit": "%",
                "denominator": "各季度样本总数",
                "x_labels": ["2025Q4", "2026Q1", "2026Q2", "2026Q3"],
                "series": [
                    {"name": "指标甲", "values": [18, 24, 31, 38]},
                    {"name": "指标乙", "values": [28, 27, 33, 36]},
                ],
            },
            schema_version="0.2.0",
        ),
        "participant_map": base_spec(
            "participant_map",
            {
                "basis": "横轴为方案完整度，纵轴为规模化交付能力；坐标来自统一评分卡。",
                "x_axis": {"label": "方案完整度", "low": "单点能力", "high": "完整方案"},
                "y_axis": {"label": "规模化交付", "low": "验证阶段", "high": "规模交付"},
                "participants": [
                    {"id": "a", "label": "参与者甲", "x": 16, "y": 18, "category": "专业型"},
                    {"id": "b", "label": "参与者乙", "x": 72, "y": 20, "category": "平台型"},
                    {"id": "c", "label": "参与者丙", "x": 28, "y": 78, "category": "专业型"},
                    {"id": "d", "label": "参与者丁", "x": 82, "y": 76, "category": "平台型"},
                ],
            },
            schema_version="0.2.0",
        ),
        "value_chain": base_spec(
            "value_chain",
            {
                "metric": "value_share",
                "period": "2026年1—6月",
                "unit": "%",
                "denominator": "价值链利润池总额",
                "stages": [
                    {"id": "materials", "label": "上游材料", "value": 18, "detail": "关键原料与部件"},
                    {"id": "design", "label": "方案设计", "value": 32, "detail": "研发与系统集成"},
                    {"id": "manufacturing", "label": "制造交付", "value": 28, "detail": "生产、测试与交付"},
                    {"id": "service", "label": "渠道服务", "value": 22, "detail": "销售与持续服务"},
                ],
            },
            schema_version="0.2.0",
        ),
    }


class PublicCliTests(unittest.TestCase):
    maxDiff = None

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="ndt-figure-compiler-")
        self.directory = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def write_spec(self, name: str, spec: dict) -> Path:
        path = self.directory / f"{name}.json"
        path.write_text(json.dumps(spec, ensure_ascii=False, indent=2), encoding="utf-8")
        return path

    def run_cli(self, *args: object, env: dict | None = None, expect: int = 0) -> subprocess.CompletedProcess:
        command = [NODE, str(CLI), *(str(arg) for arg in args)]
        result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True, env=env, check=False)
        self.assertEqual(result.returncode, expect, msg=f"command={command}\nstdout={result.stdout}\nstderr={result.stderr}")
        return result

    def test_list_contract(self):
        result = self.run_cli("list")
        manifest = json.loads(result.stdout)
        self.assertEqual(manifest["compiler"]["version"], "0.2.0")
        self.assertEqual(manifest["schema_versions"], ["0.1.0", "0.2.0"])
        self.assertEqual(
            set(manifest["figure_types"]),
            {"flow", "timeline", "hierarchy", "matrix", "bar", "funnel", "line", "participant_map", "value_chain"},
        )
        office = next(item for item in manifest["renderers"] if item["id"] == "office-native")
        self.assertEqual(office["status"], "handoff-only")
        self.assertFalse(office["implemented"])

    def test_all_nine_figure_types_validate_through_node_cli(self):
        for figure_type, spec in sample_specs().items():
            with self.subTest(figure_type=figure_type):
                path = self.write_spec(figure_type, spec)
                result = self.run_cli("validate", "--spec", path)
                payload = json.loads(result.stdout)
                self.assertEqual(payload["status"], "valid")
                self.assertEqual(payload["figure_type"], figure_type)

    def test_new_figure_types_require_schema_v02_while_legacy_v01_remains_valid(self):
        legacy = self.write_spec("legacy-v01", sample_specs()["flow"])
        self.assertEqual(json.loads(self.run_cli("validate", "--spec", legacy).stdout)["status"], "valid")
        for figure_type in ("funnel", "line", "participant_map", "value_chain"):
            with self.subTest(figure_type=figure_type):
                invalid = copy.deepcopy(sample_specs()[figure_type])
                invalid["schema_version"] = "0.1.0"
                spec = self.write_spec(f"{figure_type}-v01", invalid)
                result = self.run_cli("validate", "--spec", spec, expect=2)
                self.assertIn("requires schema_version 0.2.0", result.stderr)

    def test_svg_compile_and_explicit_receipt(self):
        spec = self.write_spec("flow-svg", sample_specs()["flow"])
        output = self.directory / "flow.svg"
        receipt = self.directory / "flow.receipt.json"
        result = self.run_cli("compile", "--spec", spec, "--out", output, "--receipt", receipt)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["status"], "generated")
        self.assertEqual(payload["generation_status"], "succeeded")
        self.assertEqual(payload["artifact_state"], "candidate")
        self.assertEqual(payload["compiler"]["version"], "0.2.0")
        self.assertEqual(payload["figure_id"], "test-flow")
        self.assertGreater(output.stat().st_size, 0)
        self.assertIn("<svg", output.read_text(encoding="utf-8"))
        self.assertIn("textLength=", output.read_text(encoding="utf-8"))
        self.assertTrue(any("not embedded" in warning for warning in payload["warnings"]))
        stored = json.loads(receipt.read_text(encoding="utf-8"))
        self.assertEqual(stored["figure_id"], "test-flow")
        self.assertEqual(stored["output"]["sha256"], payload["output"]["sha256"])

    def test_all_profiles_compile_through_overrides(self):
        spec = self.write_spec("profile-source", sample_specs()["flow"])
        effective_hashes = set()
        input_hashes = set()
        for profile in ("report-a4", "wechat-inline", "ppt-16x9"):
            with self.subTest(profile=profile):
                output = self.directory / f"{profile}.svg"
                result = self.run_cli(
                    "compile",
                    "--spec",
                    spec,
                    "--out",
                    output,
                    "--profile",
                    profile,
                    "--renderer",
                    "vector-svg",
                )
                payload = json.loads(result.stdout)
                self.assertEqual(payload["profile"], profile)
                self.assertEqual(payload["spec"]["sha256"], payload["spec"]["effective_spec_sha256"])
                self.assertEqual(payload["spec"]["overrides"], {"profile": profile, "renderer": "vector-svg"})
                effective_hashes.add(payload["spec"]["effective_spec_sha256"])
                input_hashes.add(payload["spec"]["input_sha256"])
                self.assertGreater(output.stat().st_size, 0)
        self.assertEqual(len(effective_hashes), 3)
        self.assertEqual(len(input_hashes), 1)

    def test_new_types_compile_in_all_profiles_and_emit_visible_svg_shapes(self):
        shape_markers = {
            "funnel": "<polygon",
            "line": "<polyline",
            "participant_map": "<circle",
            "value_chain": "<rect",
        }
        for figure_type, marker in shape_markers.items():
            spec = self.write_spec(f"{figure_type}-profiles", sample_specs()[figure_type])
            for profile in ("report-a4", "wechat-inline", "ppt-16x9"):
                with self.subTest(figure_type=figure_type, profile=profile):
                    output = self.directory / f"{figure_type}-{profile}.svg"
                    payload = json.loads(
                        self.run_cli(
                            "compile",
                            "--spec",
                            spec,
                            "--out",
                            output,
                            "--profile",
                            profile,
                        ).stdout
                    )
                    self.assertEqual(payload["generation_status"], "succeeded")
                    self.assertIn(marker, output.read_text(encoding="utf-8"))

    def test_stage_gate_funnel_contract(self):
        stage_gate = base_spec(
            "funnel",
            {
                "mode": "stage_gate",
                "stages": [
                    {"id": "g1", "label": "立项门", "gate": "passed", "detail": "需求已确认"},
                    {"id": "g2", "label": "验证门", "gate": "in_progress", "detail": "样品验证中"},
                    {"id": "g3", "label": "量产门", "gate": "pending", "detail": "等待前序完成"},
                ],
            },
            schema_version="0.2.0",
        )
        spec = self.write_spec("stage-gate", stage_gate)
        self.assertEqual(json.loads(self.run_cli("validate", "--spec", spec).stdout)["status"], "valid")

    def test_quantitative_funnel_distinct_values_have_strictly_decreasing_svg_widths(self):
        spec_value = copy.deepcopy(sample_specs()["funnel"])
        spec_value["content"]["stages"] = [
            {"id": "top", "label": "首阶段", "value": 100},
            {"id": "middle", "label": "中阶段", "value": 35},
            {"id": "bottom", "label": "末阶段", "value": 1},
        ]
        spec = self.write_spec("funnel-readable-transform", spec_value)
        output = self.directory / "funnel-readable-transform.svg"
        receipt = self.directory / "funnel-readable-transform.receipt.json"
        payload = json.loads(
            self.run_cli("compile", "--spec", spec, "--out", output, "--receipt", receipt).stdout
        )
        root = ET.parse(output).getroot()
        polygons = root.findall(".//{http://www.w3.org/2000/svg}polygon")
        self.assertEqual(len(polygons), 3)
        top_widths = []
        for polygon in polygons:
            points = [tuple(float(value) for value in point.split(",")) for point in polygon.attrib["points"].split()]
            top_widths.append(abs(points[1][0] - points[0][0]))
        self.assertGreater(top_widths[0], top_widths[1])
        self.assertGreater(top_widths[1], top_widths[2])
        self.assertTrue(any("not linear proportions" in warning for warning in payload["warnings"]))
        svg = output.read_text(encoding="utf-8")
        self.assertIn("100 个", svg)
        self.assertIn("35 个", svg)
        self.assertIn("1 个", svg)

    def test_equals_style_profile_and_renderer_options(self):
        spec = self.write_spec("equals-options", sample_specs()["flow"])
        output = self.directory / "equals.svg"
        result = self.run_cli(
            "compile",
            "--spec",
            spec,
            "--out",
            output,
            "--profile=ppt-16x9",
            "--renderer=vector-svg",
        )
        payload = json.loads(result.stdout)
        self.assertEqual(payload["profile"], "ppt-16x9")
        self.assertEqual(payload["renderer"], "vector-svg")

    def test_quantitative_matrix_value_kind_contract(self):
        spec_value = base_spec(
            "matrix",
            {
                "value_kind": "quantitative",
                "period": "2026年1—6月",
                "unit": "%",
                "denominator": "各行样本总数",
                "rows": ["方案甲", "方案乙"],
                "columns": ["指标一", "指标二"],
                "cells": [[12.5, 30], [18, 26.5]],
            },
        )
        spec = self.write_spec("matrix-quantitative", spec_value)
        payload = json.loads(self.run_cli("validate", "--spec", spec).stdout)
        self.assertEqual(payload["status"], "valid")

    def test_report_png_is_2400_rgb_300dpi_using_available_pillow_runtime(self):
        pillow_python = self.find_pillow_python()
        if pillow_python is None:
            self.skipTest("no local Pillow runtime; positive PNG path is environment-optional")
        spec_value = copy.deepcopy(sample_specs()["bar"])
        spec_value["renderer"] = "raster-canvas-png"
        spec = self.write_spec("bar-png", spec_value)
        output = self.directory / "bar.png"
        receipt = self.directory / "bar.receipt.json"
        env = os.environ.copy()
        env["NERO_FIGURE_PYTHON"] = pillow_python
        result = self.run_cli("compile", "--spec", spec, "--out", output, "--receipt", receipt, env=env)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["output"]["width"], 2400)
        self.assertEqual(payload["output"]["mode"], "RGB")
        self.assertAlmostEqual(payload["output"]["dpi"][0], 300.0, delta=1.0)
        check_ids = {item["id"] for item in payload["checks"]}
        self.assertTrue({"cjk_font_coverage", "actual_text_bounds", "actual_text_collisions"}.issubset(check_ids))
        inspection = subprocess.run(
            [
                pillow_python,
                "-c",
                "import json,sys; from PIL import Image; im=Image.open(sys.argv[1]); print(json.dumps({'size':im.size,'mode':im.mode,'dpi':im.info.get('dpi')}))",
                str(output),
            ],
            text=True,
            capture_output=True,
            check=True,
        )
        image = json.loads(inspection.stdout)
        self.assertEqual(image["size"][0], 2400)
        self.assertEqual(image["mode"], "RGB")
        self.assertAlmostEqual(image["dpi"][0], 300.0, delta=1.0)

    def test_new_types_render_png_with_shared_shape_ir_when_pillow_is_available(self):
        pillow_python = self.find_pillow_python()
        if pillow_python is None:
            self.skipTest("no local Pillow runtime; positive PNG path is environment-optional")
        env = os.environ.copy()
        env["NERO_FIGURE_PYTHON"] = pillow_python
        for figure_type in ("funnel", "line", "participant_map", "value_chain"):
            with self.subTest(figure_type=figure_type):
                spec = self.write_spec(f"{figure_type}-png", sample_specs()[figure_type])
                output = self.directory / f"{figure_type}.png"
                payload = json.loads(
                    self.run_cli(
                        "compile",
                        "--spec",
                        spec,
                        "--out",
                        output,
                        "--renderer",
                        "raster-canvas-png",
                        env=env,
                    ).stdout
                )
                self.assertEqual(payload["output"]["format"], "PNG")
                self.assertGreater(output.stat().st_size, 0)
                color_probe = subprocess.run(
                    [
                        pillow_python,
                        "-c",
                        "import sys; from PIL import Image; im=Image.open(sys.argv[1]).convert('RGB'); print(sum(1 for pixel in im.getdata() if pixel==(31,78,95)))",
                        str(output),
                    ],
                    text=True,
                    capture_output=True,
                    check=True,
                )
                self.assertGreater(int(color_probe.stdout.strip()), 50, "expected visible primary-color semantic shapes")

    def test_invalid_specs_fail_without_output_or_receipt(self):
        cases = {}
        invalid = copy.deepcopy(sample_specs()["flow"])
        invalid["figure_type"] = "network"
        cases["invalid-type"] = invalid

        no_source = copy.deepcopy(sample_specs()["flow"])
        no_source.pop("source")
        cases["missing-source"] = no_source

        no_context = copy.deepcopy(sample_specs()["bar"])
        no_context["content"].pop("denominator")
        cases["missing-quantitative-context"] = no_context

        root_extra = copy.deepcopy(sample_specs()["flow"])
        root_extra["unexpected"] = True
        cases["root-additional-property"] = root_extra

        source_extra = copy.deepcopy(sample_specs()["flow"])
        source_extra["source"]["unexpected"] = True
        cases["source-additional-property"] = source_extra

        flow_content_extra = copy.deepcopy(sample_specs()["flow"])
        flow_content_extra["content"]["unexpected"] = True
        cases["flow-content-additional-property"] = flow_content_extra

        flow_node_extra = copy.deepcopy(sample_specs()["flow"])
        flow_node_extra["content"]["nodes"][0]["unexpected"] = True
        cases["flow-node-additional-property"] = flow_node_extra

        flow_edge_label = copy.deepcopy(sample_specs()["flow"])
        flow_edge_label["content"]["edges"][0]["label"] = "不再支持"
        cases["flow-edge-label-removed"] = flow_edge_label

        flow_non_adjacent = copy.deepcopy(sample_specs()["flow"])
        flow_non_adjacent["content"]["edges"] = [{"from": "a", "to": "c"}, {"from": "c", "to": "b"}]
        cases["flow-must-be-adjacent-chain"] = flow_non_adjacent

        timeline_extra = copy.deepcopy(sample_specs()["timeline"])
        timeline_extra["content"]["events"][0]["unexpected"] = True
        cases["timeline-event-additional-property"] = timeline_extra

        hierarchy_extra = copy.deepcopy(sample_specs()["hierarchy"])
        hierarchy_extra["content"]["root"]["children"][0]["unexpected"] = True
        cases["hierarchy-node-additional-property"] = hierarchy_extra

        matrix_missing_kind = copy.deepcopy(sample_specs()["matrix"])
        matrix_missing_kind["content"].pop("value_kind")
        cases["matrix-missing-value-kind"] = matrix_missing_kind

        matrix_qualitative_number = copy.deepcopy(sample_specs()["matrix"])
        matrix_qualitative_number["content"]["cells"][0][0] = 1
        cases["matrix-qualitative-number"] = matrix_qualitative_number

        matrix_quantitative_text = copy.deepcopy(sample_specs()["matrix"])
        matrix_quantitative_text["content"].update(
            {"value_kind": "quantitative", "period": "2026年", "unit": "%", "denominator": "样本总数"}
        )
        cases["matrix-quantitative-text"] = matrix_quantitative_text

        bar_series_extra = copy.deepcopy(sample_specs()["bar"])
        bar_series_extra["content"]["series"][0]["unexpected"] = True
        cases["bar-series-additional-property"] = bar_series_extra

        bar_negative = copy.deepcopy(sample_specs()["bar"])
        bar_negative["content"]["series"][0]["values"][1] = -1
        cases["bar-negative-value"] = bar_negative

        funnel_increasing = copy.deepcopy(sample_specs()["funnel"])
        funnel_increasing["content"]["stages"][2]["value"] = 90
        cases["funnel-values-must-decrease"] = funnel_increasing

        funnel_mode_mix = copy.deepcopy(sample_specs()["funnel"])
        funnel_mode_mix["content"]["stages"][0]["gate"] = "passed"
        cases["funnel-mode-fields-must-not-mix"] = funnel_mode_mix

        line_mismatch = copy.deepcopy(sample_specs()["line"])
        line_mismatch["content"]["series"][0]["values"].pop()
        cases["line-series-length-mismatch"] = line_mismatch

        line_extra = copy.deepcopy(sample_specs()["line"])
        line_extra["content"]["series"][0]["unexpected"] = True
        cases["line-series-additional-property"] = line_extra

        line_bad_label = copy.deepcopy(sample_specs()["line"])
        line_bad_label["content"]["x_labels"][0] = {"unexpected": True}
        cases["line-x-label-must-be-string"] = line_bad_label

        participant_out_of_range = copy.deepcopy(sample_specs()["participant_map"])
        participant_out_of_range["content"]["participants"][0]["x"] = 101
        cases["participant-coordinate-range"] = participant_out_of_range

        participant_duplicate = copy.deepcopy(sample_specs()["participant_map"])
        participant_duplicate["content"]["participants"][1]["id"] = "a"
        cases["participant-id-unique"] = participant_duplicate

        value_share_sum = copy.deepcopy(sample_specs()["value_chain"])
        value_share_sum["content"]["stages"][0]["value"] = 19
        cases["value-share-must-sum-to-100"] = value_share_sum

        value_chain_negative = copy.deepcopy(sample_specs()["value_chain"])
        value_chain_negative["content"]["stages"][0]["value"] = -1
        cases["value-chain-non-negative"] = value_chain_negative

        value_chain_extra = copy.deepcopy(sample_specs()["value_chain"])
        value_chain_extra["content"]["stages"][0]["unexpected"] = True
        cases["value-chain-stage-additional-property"] = value_chain_extra

        overflow = copy.deepcopy(sample_specs()["flow"])
        overflow["profile"] = "wechat-inline"
        overflow["content"]["nodes"][0]["detail"] = "超出画布的密集说明" * 55
        cases["layout-overflow"] = overflow

        for name, value in cases.items():
            with self.subTest(case=name):
                spec = self.write_spec(name, value)
                output = self.directory / f"{name}.svg"
                receipt = self.directory / f"{name}.receipt.json"
                result = self.run_cli("compile", "--spec", spec, "--out", output, "--receipt", receipt, expect=2)
                self.assertIn('"status": "failed"', result.stderr)
                self.assertFalse(output.exists())
                self.assertFalse(receipt.exists())

    def test_participant_map_near_coordinates_fail_closed_without_artifacts(self):
        spec_value = copy.deepcopy(sample_specs()["participant_map"])
        spec_value["content"]["participants"][1].update({"x": 20, "y": 20})
        spec = self.write_spec("participant-near-overlap", spec_value)
        output = self.directory / "participant-near-overlap.svg"
        receipt = self.directory / "participant-near-overlap.receipt.json"
        result = self.run_cli("compile", "--spec", spec, "--out", output, "--receipt", receipt, expect=2)
        self.assertIn("circles overlap", result.stderr)
        self.assertFalse(output.exists())
        self.assertFalse(receipt.exists())

    def test_participant_map_svg_uses_vertical_direction_language(self):
        spec = self.write_spec("participant-axis-direction", sample_specs()["participant_map"])
        output = self.directory / "participant-axis-direction.svg"
        self.run_cli("compile", "--spec", spec, "--out", output)
        svg = output.read_text(encoding="utf-8")
        self.assertIn("纵轴：规模化交付", svg)
        self.assertIn("验证阶段（下）→ 规模交付（上）", svg)
        self.assertNotIn("验证阶段 ← 规模化交付 → 规模交付", svg)

    def test_bar_maximum_first_and_middle_categories_do_not_collide(self):
        for name, values in (("first", [99, 20, 35]), ("middle", [20, 99, 35])):
            with self.subTest(maximum=name):
                spec_value = copy.deepcopy(sample_specs()["bar"])
                spec_value["content"]["categories"] = ["甲", "乙", "丙"]
                spec_value["content"]["series"][0]["values"] = values
                spec = self.write_spec(f"bar-max-{name}", spec_value)
                output = self.directory / f"bar-max-{name}.svg"
                payload = json.loads(self.run_cli("compile", "--spec", spec, "--out", output).stdout)
                self.assertEqual(payload["generation_status"], "succeeded")

    def test_existing_outputs_receipts_and_path_aliases_are_rejected_without_overwrite(self):
        spec = self.write_spec("no-overwrite", sample_specs()["flow"])

        output = self.directory / "existing.svg"
        output.write_text("existing-output", encoding="utf-8")
        receipt = self.directory / "new.receipt.json"
        self.run_cli("compile", "--spec", spec, "--out", output, "--receipt", receipt, expect=2)
        self.assertEqual(output.read_text(encoding="utf-8"), "existing-output")
        self.assertFalse(receipt.exists())

        output2 = self.directory / "new.svg"
        receipt2 = self.directory / "existing.receipt.json"
        receipt2.write_text("existing-receipt", encoding="utf-8")
        self.run_cli("compile", "--spec", spec, "--out", output2, "--receipt", receipt2, expect=2)
        self.assertFalse(output2.exists())
        self.assertEqual(receipt2.read_text(encoding="utf-8"), "existing-receipt")

        alias = self.directory / "spec-alias.json"
        alias.symlink_to(spec)
        output3 = self.directory / "path-alias.svg"
        self.run_cli("compile", "--spec", spec, "--out", output3, "--receipt", alias, expect=2)
        self.assertFalse(output3.exists())
        self.assertTrue(alias.is_symlink())

        original_spec = spec.read_text(encoding="utf-8")
        self.run_cli("compile", "--spec", spec, "--out", spec, expect=2)
        self.assertEqual(spec.read_text(encoding="utf-8"), original_spec)

        same_destination = self.directory / "same.svg"
        self.run_cli("compile", "--spec", spec, "--out", same_destination, "--receipt", same_destination, expect=2)
        self.assertFalse(same_destination.exists())

    def test_successful_compile_leaves_no_temporary_files(self):
        spec = self.write_spec("temp-clean", sample_specs()["flow"])
        output = self.directory / "clean.svg"
        receipt = self.directory / "clean.receipt.json"
        self.run_cli("compile", "--spec", spec, "--out", output, "--receipt", receipt)
        leftovers = [path.name for path in self.directory.iterdir() if path.name.startswith(".clean")]
        self.assertEqual(leftovers, [])

    def test_configured_font_without_cjk_coverage_fails_before_png_is_saved(self):
        pillow_python = self.find_pillow_python()
        latin_font = Path("/System/Library/Fonts/HelveticaNeue.ttc")
        if pillow_python is None or not latin_font.is_file():
            self.skipTest("requires local Pillow plus a known Latin-only macOS font")
        spec_value = copy.deepcopy(sample_specs()["bar"])
        spec_value["renderer"] = "raster-canvas-png"
        spec = self.write_spec("missing-cjk", spec_value)
        output = self.directory / "missing-cjk.png"
        receipt = self.directory / "missing-cjk.receipt.json"
        env = os.environ.copy()
        env["NERO_FIGURE_PYTHON"] = pillow_python
        env["NERO_CJK_FONT"] = str(latin_font)
        result = self.run_cli("compile", "--spec", spec, "--out", output, "--receipt", receipt, env=env, expect=2)
        self.assertIn("CJK", result.stderr)
        self.assertFalse(output.exists())
        self.assertFalse(receipt.exists())

    def test_png_without_pillow_fails_clearly_and_leaves_no_output(self):
        fake_bin = self.directory / "fake-bin"
        fake_bin.mkdir()
        fake_python = fake_bin / "python3"
        fake_python.write_text("#!/bin/sh\necho 'Pillow is not installed' >&2\nexit 3\n", encoding="utf-8")
        fake_python.chmod(0o755)
        spec_value = copy.deepcopy(sample_specs()["bar"])
        spec_value["renderer"] = "raster-canvas-png"
        spec = self.write_spec("no-pillow", spec_value)
        output = self.directory / "no-pillow.png"
        receipt = self.directory / "no-pillow.receipt.json"
        env = os.environ.copy()
        env["PATH"] = str(fake_bin)
        env["NERO_FIGURE_PYTHON"] = str(fake_python)
        result = self.run_cli("compile", "--spec", spec, "--out", output, "--receipt", receipt, env=env, expect=3)
        self.assertIn("Pillow", result.stderr)
        self.assertFalse(output.exists())
        self.assertFalse(receipt.exists())

    @staticmethod
    def find_pillow_python() -> str | None:
        candidates = [os.environ.get("NERO_FIGURE_PYTHON"), "/usr/bin/python3", sys.executable]
        for candidate in candidates:
            if not candidate:
                continue
            result = subprocess.run([candidate, "-c", "import PIL"], capture_output=True, check=False)
            if result.returncode == 0:
                return candidate
        return None


if __name__ == "__main__":
    unittest.main(verbosity=2)
