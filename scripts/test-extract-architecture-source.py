#!/usr/bin/env python3

from __future__ import annotations

import base64
import json
import subprocess
import sys
import tempfile
import unittest
import urllib.parse
import zlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "extract-architecture-source.py"


class ExtractArchitectureSourceTest(unittest.TestCase):
    def run_extract(self, path: Path) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), str(path), "--format", "json"],
            text=True,
            capture_output=True,
            check=False,
        )

    def test_mermaid_is_parsed_without_following_links_or_styles(self):
        source = """# Review

```mermaid
flowchart LR
  A[用户] -->|提交| B{门禁}
  B --> C[Skill]
  click A "https://example.com/do-not-open"
  style B fill:#f00
```
"""
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "diagram.md"
            path.write_text(source, encoding="utf-8")
            result = self.run_extract(path)
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["summary"], {"diagrams": 1, "nodes": 3, "edges": 2, "unresolved": 0})
        self.assertEqual(payload["trust"], "untrusted_inert_content")
        self.assertFalse(payload["safety"]["followed_links"])
        self.assertEqual(payload["diagrams"][0]["discarded_inert_fields"]["links"], 1)
        self.assertEqual(payload["diagrams"][0]["discarded_inert_fields"]["styles"], 1)
        self.assertEqual(payload["fidelity_ledger_template"]["status"], "pending_redraw")

    def test_compressed_drawio_page_produces_nodes_edges_and_digest(self):
        model = """<mxGraphModel><root>
<mxCell id="0"/><mxCell id="1" parent="0"/>
<mxCell id="a" value="入口" vertex="1" parent="1"><mxGeometry x="0" y="0" width="80" height="40" as="geometry"/></mxCell>
<mxCell id="b" value="事实层" vertex="1" parent="1"><mxGeometry x="120" y="0" width="80" height="40" as="geometry"/></mxCell>
<mxCell id="e" value="读取" edge="1" source="a" target="b" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>
</ro""" + "ot></mxGraphModel>"
        encoded = urllib.parse.quote(model).encode("utf-8")
        compressor = zlib.compressobj(level=9, wbits=-15)
        payload = base64.b64encode(compressor.compress(encoded) + compressor.flush()).decode("ascii")
        source = f'<mxfile><diagram id="d1" name="架构">{payload}</diagram></mxfile>'
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "system.drawio"
            path.write_text(source, encoding="utf-8")
            result = self.run_extract(path)
        self.assertEqual(result.returncode, 0, result.stderr)
        output = json.loads(result.stdout)
        self.assertEqual(output["summary"]["nodes"], 2)
        self.assertEqual(output["summary"]["edges"], 1)
        self.assertEqual(output["diagrams"][0]["edges"][0]["source"], "a")
        self.assertEqual(len(output["source"]["sha256"]), 64)

    def test_drawio_dtd_fails_closed(self):
        source = '<!DOCTYPE foo [<!ENTITY xxe SYSTEM "' + "file:" + '///etc/passwd">]><mxGraphModel><root/></mxGraphModel>'
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "unsafe.drawio"
            path.write_text(source, encoding="utf-8")
            result = self.run_extract(path)
        self.assertEqual(result.returncode, 2)
        self.assertIn("DTD and entity declarations", result.stderr)

    def test_sequence_state_and_er_grammars_have_distinct_semantics(self):
        cases = {
            "sequence.mmd": "sequenceDiagram\nparticipant U as 用户\nU->>S: 请求\nS-->>U: 响应\n",
            "state.mmd": "stateDiagram-v2\n[*] --> Draft\nDraft --> Approved: approve\nApproved --> [*]\n",
            "er.mmd": "erDiagram\nUSER ||--o{ TASK : owns\nUSER {\n string id\n}\n",
        }
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            kinds = []
            for filename, source in cases.items():
                path = root / filename
                path.write_text(source, encoding="utf-8")
                result = self.run_extract(path)
                self.assertEqual(result.returncode, 0, result.stderr)
                kinds.append(json.loads(result.stdout)["diagrams"][0]["kind"])
        self.assertEqual(kinds, ["sequence", "state", "er"])


if __name__ == "__main__":
    unittest.main()
