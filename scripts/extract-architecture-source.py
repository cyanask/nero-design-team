#!/usr/bin/env python3
"""Extract inert structural IR from Mermaid or draw.io sources for NDT redraws.

The extractor is intentionally read-only: it prints JSON or a short summary to
stdout, never renders a diagram, follows a link, executes Mermaid/JavaScript, or
makes a network request. Extracted labels and metadata remain untrusted content.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import html
import json
import re
import struct
import sys
import urllib.parse
import zlib
from pathlib import Path
from xml.etree import ElementTree as ET


MAX_INPUT_BYTES = 16 * 1024 * 1024
MAX_XML_BYTES = 32 * 1024 * 1024
MAX_LINES = 5000
MAX_NODES = 1000
MAX_EDGES = 2000
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
SCHEMA_VERSION = "ndt.architecture-source-ir.v1"


class SourceError(ValueError):
    pass


def fail(message: str) -> "NoReturn":  # type: ignore[name-defined]
    raise SourceError(message)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def clean_text(value: str | None) -> str:
    if not value:
        return ""
    value = re.sub(r"<br\s*/?>|</p\s*>|</div\s*>", "\n", value, flags=re.I)
    value = re.sub(r"<[^>]+>", "", value)
    value = html.unescape(value).replace("\xa0", " ")
    return "\n".join(
        re.sub(r"[ \t]+", " ", line).strip()
        for line in value.splitlines()
        if line.strip()
    )


def bounded_decompress(data: bytes, wbits: int) -> bytes:
    decoder = zlib.decompressobj(wbits)
    out = decoder.decompress(data, MAX_XML_BYTES + 1)
    if len(out) > MAX_XML_BYTES or decoder.unconsumed_tail:
        fail("decoded draw.io payload exceeds the 32 MiB limit")
    out += decoder.flush(MAX_XML_BYTES + 1 - len(out))
    if len(out) > MAX_XML_BYTES:
        fail("decoded draw.io payload exceeds the 32 MiB limit")
    return out


def reject_unsafe_xml(text: str) -> None:
    upper = text.upper()
    if "<!DOCTYPE" in upper or "<!ENTITY" in upper:
        fail("draw.io DTD and entity declarations are not supported")


def decode_drawio_payload(value: str) -> str | None:
    try:
        compressed = base64.b64decode(value.strip(), validate=False)
    except (ValueError, TypeError):
        return None
    for wbits in (-15, 15, 47):
        try:
            decoded = bounded_decompress(compressed, wbits).decode("utf-8", "replace")
            return urllib.parse.unquote(decoded)
        except (zlib.error, UnicodeError):
            continue
    return None


def drawio_xml_from_png(data: bytes) -> str | None:
    offset = len(PNG_MAGIC)
    while offset + 12 <= len(data):
        length = struct.unpack(">I", data[offset : offset + 4])[0]
        chunk_type = data[offset + 4 : offset + 8]
        body_end = offset + 8 + length
        chunk_end = body_end + 4
        if chunk_end > len(data):
            fail("draw.io PNG contains a truncated metadata chunk")
        body = data[offset + 8 : body_end]
        offset = chunk_end
        if chunk_type not in {b"tEXt", b"zTXt", b"iTXt"}:
            if chunk_type == b"IEND":
                break
            continue
        key, _, payload = body.partition(b"\x00")
        if key.lower() != b"mxfile":
            continue
        try:
            if chunk_type == b"tEXt":
                value = payload
            elif chunk_type == b"zTXt":
                value = bounded_decompress(payload[1:], 15)
            else:
                compression_flag = payload[0:1]
                value = payload[2:].split(b"\x00", 2)[-1]
                if compression_flag == b"\x01":
                    value = bounded_decompress(value, 15)
        except (IndexError, zlib.error):
            fail("draw.io PNG contains invalid compressed metadata")
        return urllib.parse.unquote(value.decode("utf-8", "replace"))
    return None


def load_drawio_xml(data: bytes, suffix: str) -> str:
    if data.startswith(PNG_MAGIC):
        text = drawio_xml_from_png(data)
        if not text:
            fail("PNG does not contain embedded draw.io metadata")
        return text

    text = data.decode("utf-8", "replace").lstrip("\ufeff").strip()
    if "<mxfile" in text or "<mxGraphModel" in text:
        return text
    if suffix == ".svg" or "<svg" in text[:2000].lower():
        for match in re.finditer(r"\bcontent\s*=\s*([\"'])(.*?)\1", text, re.I | re.S):
            candidate = html.unescape(match.group(2))
            if "<mxfile" in candidate or "<mxGraphModel" in candidate:
                return candidate
        fail("SVG does not contain embedded draw.io metadata")
    inflated = decode_drawio_payload(text)
    if inflated and "<mxGraphModel" in inflated:
        return inflated
    fail("source is not a supported draw.io container")


def parse_style(value: str | None) -> dict[str, str]:
    result: dict[str, str] = {}
    for part in (value or "").split(";"):
        key, separator, item = part.strip().partition("=")
        if key:
            result[key] = item if separator else "1"
    return result


def drawio_shape(style: dict[str, str]) -> str:
    raw = style.get("shape", "")
    for marker, name in (
        ("cylinder", "database"),
        ("rhombus", "decision"),
        ("swimlane", "lane"),
        ("actor", "actor"),
        ("table", "table"),
        ("cloud", "external"),
    ):
        if marker in raw or marker in style:
            return name
    return "node"


def parse_drawio(data: bytes, suffix: str) -> list[dict]:
    xml_text = load_drawio_xml(data, suffix)
    reject_unsafe_xml(xml_text)
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as error:
        fail(f"malformed draw.io XML: {error}")

    if root.tag == "mxGraphModel":
        diagrams = [("diagram-1", "Diagram 1", root)]
    else:
        diagrams = []
        for index, diagram in enumerate(root.findall(".//diagram"), 1):
            model = diagram.find(".//mxGraphModel")
            if model is None:
                payload = (diagram.text or "").strip()
                decoded = decode_drawio_payload(payload) if payload else None
                if decoded:
                    reject_unsafe_xml(decoded)
                    try:
                        model = ET.fromstring(decoded)
                    except ET.ParseError as error:
                        fail(f"malformed draw.io page {index}: {error}")
            if model is not None:
                diagrams.append(
                    (
                        diagram.get("id") or f"diagram-{index}",
                        diagram.get("name") or f"Diagram {index}",
                        model,
                    )
                )
    if not diagrams:
        fail("draw.io source contains no readable diagram pages")

    output = []
    for diagram_id, name, model in diagrams:
        cells: dict[str, dict] = {}
        for element in model.findall(".//mxCell"):
            cell_id = element.get("id")
            if cell_id:
                cells[cell_id] = {"element": element, "object": None}
        for wrapper in model.findall(".//object") + model.findall(".//UserObject"):
            cell = wrapper.find("mxCell")
            cell_id = wrapper.get("id") or (cell.get("id") if cell is not None else None)
            if cell is not None and cell_id:
                cells[cell_id] = {"element": cell, "object": wrapper}

        nodes = []
        edges = []
        discarded_links = 0
        for cell_id, entry in cells.items():
            cell = entry["element"]
            wrapper = entry["object"]
            value = wrapper.get("label", "") if wrapper is not None else cell.get("value", "")
            style = parse_style(cell.get("style"))
            link = wrapper.get("link", "") if wrapper is not None else ""
            if link:
                discarded_links += 1
            if cell.get("vertex") == "1" and "edgeLabel" not in style:
                nodes.append(
                    {
                        "id": cell_id,
                        "label": clean_text(value),
                        "kind": drawio_shape(style),
                        "group": cell.get("parent"),
                    }
                )
            elif cell.get("edge") == "1":
                edges.append(
                    {
                        "id": cell_id,
                        "source": cell.get("source"),
                        "target": cell.get("target"),
                        "label": clean_text(value),
                        "direction": "bidirectional"
                        if style.get("startArrow", "none") not in {"", "none", "0"}
                        and style.get("endArrow", "classic") not in {"", "none", "0"}
                        else "forward",
                    }
                )
        enforce_limits(nodes, edges)
        output.append(
            diagram_record(
                diagram_id,
                name,
                "drawio",
                None,
                nodes,
                edges,
                [],
                {"links": discarded_links, "styles": len(cells), "directives": 0},
            )
        )
    return output


NODE_TOKEN = re.compile(r"^\s*([A-Za-z0-9_.:-]+)\s*(?:\[([^]]*)\]|\(([^)]*)\)|\{([^}]*)\}|[>\"']([^<\"']*)[<\"'])?")
FLOW_EDGE = re.compile(r"(<-->|<==>|-->|==>|-.->|---|--x|--o)")


def mermaid_node(token: str) -> tuple[str | None, str]:
    match = NODE_TOKEN.match(token.strip())
    if not match:
        return None, ""
    node_id = match.group(1)
    label = next((item for item in match.groups()[1:] if item is not None), node_id)
    return node_id, clean_text(label.strip('"\''))


def parse_flow(lines: list[str], diagram_id: str) -> dict:
    header = lines[0].strip().split()
    direction = header[1] if len(header) > 1 else None
    nodes: dict[str, dict] = {}
    edges = []
    unresolved = []
    discarded = {"links": 0, "styles": 0, "directives": 0}
    group_stack: list[str] = []

    def ensure(node_id: str | None, label: str = "") -> None:
        if node_id and node_id not in nodes:
            nodes[node_id] = {
                "id": node_id,
                "label": label or node_id,
                "kind": "node",
                "group": group_stack[-1] if group_stack else None,
            }
        elif node_id and label and nodes[node_id]["label"] == node_id:
            nodes[node_id]["label"] = label

    for number, raw in enumerate(lines[1:], 2):
        line = raw.strip().rstrip(";")
        if not line or line.startswith("%%"):
            continue
        lower = line.lower()
        if lower.startswith(("click ", "href ")):
            discarded["links"] += 1
            continue
        if lower.startswith(("style ", "classdef ", "class ", "linkstyle ", "theme ", "init ")):
            discarded["styles"] += 1
            continue
        if lower.startswith("subgraph "):
            group_id = line.split(None, 1)[1].strip().strip('"')
            group_stack.append(group_id)
            continue
        if lower == "end":
            if group_stack:
                group_stack.pop()
            continue
        match = FLOW_EDGE.search(line)
        if match:
            left = line[: match.start()]
            right = line[match.end() :]
            edge_label = ""
            if right.startswith("|") and "|" in right[1:]:
                edge_label, right = right[1:].split("|", 1)
            elif match.group(1) in {"-->", "---"}:
                labelled = re.match(r"\s*([^|\[({]+?)\s*(-->|---)\s*(.*)$", right)
                if labelled:
                    edge_label = labelled.group(1).strip()
                    right = labelled.group(3)
            source, source_label = mermaid_node(left)
            target, target_label = mermaid_node(right)
            if source and target:
                ensure(source, source_label)
                ensure(target, target_label)
                edges.append(
                    {
                        "id": f"edge-{len(edges) + 1}",
                        "source": source,
                        "target": target,
                        "label": clean_text(edge_label),
                        "direction": "bidirectional" if match.group(1).startswith("<") else "forward",
                    }
                )
            else:
                unresolved.append({"line": number, "text": line, "reason": "edge_not_parsed"})
            continue
        node_id, label = mermaid_node(line)
        if node_id:
            ensure(node_id, label)
        else:
            unresolved.append({"line": number, "text": line, "reason": "statement_not_parsed"})
    enforce_limits(list(nodes.values()), edges)
    return diagram_record(diagram_id, diagram_id, "flowchart", direction, list(nodes.values()), edges, unresolved, discarded)


def parse_sequence(lines: list[str], diagram_id: str) -> dict:
    nodes: dict[str, dict] = {}
    edges = []
    unresolved = []
    discarded = {"links": 0, "styles": 0, "directives": 0}
    for number, raw in enumerate(lines[1:], 2):
        line = raw.strip()
        if not line or line.startswith("%%"):
            continue
        participant = re.match(r"(?:participant|actor)\s+([^\s]+)(?:\s+as\s+(.+))?$", line, re.I)
        if participant:
            node_id = participant.group(1)
            nodes[node_id] = {"id": node_id, "label": clean_text(participant.group(2) or node_id), "kind": "actor", "group": None}
            continue
        message = re.match(r"([^\s]+)\s*(-->>|->>|-->|->|--x|-x|--)\s*([^:]+?)\s*:\s*(.*)$", line)
        if message:
            source, arrow, target, label = message.groups()
            source = source.rstrip("+-")
            target = target.strip().rstrip("+-")
            for node_id in (source, target):
                nodes.setdefault(node_id, {"id": node_id, "label": node_id, "kind": "actor", "group": None})
            edges.append({"id": f"edge-{len(edges) + 1}", "source": source, "target": target, "label": clean_text(label), "direction": "forward", "style": "dashed" if arrow.startswith("--") else "solid"})
            continue
        if re.match(r"(?:note|activate|deactivate|alt|else|opt|loop|par|and|critical|break|rect|end)\b", line, re.I):
            discarded["directives"] += 1
            continue
        unresolved.append({"line": number, "text": line, "reason": "statement_not_parsed"})
    enforce_limits(list(nodes.values()), edges)
    return diagram_record(diagram_id, diagram_id, "sequence", None, list(nodes.values()), edges, unresolved, discarded)


def parse_state(lines: list[str], diagram_id: str) -> dict:
    nodes: dict[str, dict] = {}
    edges = []
    unresolved = []
    discarded = {"links": 0, "styles": 0, "directives": 0}
    for number, raw in enumerate(lines[1:], 2):
        line = raw.strip()
        if not line or line.startswith("%%"):
            continue
        alias = re.match(r"state\s+[\"'](.+?)[\"']\s+as\s+([^\s{]+)", line, re.I)
        if alias:
            label, node_id = alias.groups()
            nodes[node_id] = {"id": node_id, "label": clean_text(label), "kind": "state", "group": None}
            continue
        transition = re.match(r"([^\s]+)\s*-->\s*([^:]+?)(?:\s*:\s*(.*))?$", line)
        if transition:
            source, target, label = transition.groups()
            source = "start" if source == "[*]" else source
            target = "end" if target.strip() == "[*]" else target.strip()
            for node_id in (source, target):
                nodes.setdefault(node_id, {"id": node_id, "label": node_id, "kind": "terminal" if node_id in {"start", "end"} else "state", "group": None})
            edges.append({"id": f"edge-{len(edges) + 1}", "source": source, "target": target, "label": clean_text(label), "direction": "forward"})
            continue
        if line in {"{", "}"} or line.lower().startswith(("direction ", "note ")):
            discarded["directives"] += 1
            continue
        node_id, label = mermaid_node(line.removeprefix("state "))
        if node_id:
            nodes.setdefault(node_id, {"id": node_id, "label": label or node_id, "kind": "state", "group": None})
        else:
            unresolved.append({"line": number, "text": line, "reason": "statement_not_parsed"})
    enforce_limits(list(nodes.values()), edges)
    return diagram_record(diagram_id, diagram_id, "state", None, list(nodes.values()), edges, unresolved, discarded)


def parse_er(lines: list[str], diagram_id: str) -> dict:
    nodes: dict[str, dict] = {}
    edges = []
    unresolved = []
    discarded = {"links": 0, "styles": 0, "directives": 0}
    in_entity = False
    for number, raw in enumerate(lines[1:], 2):
        line = raw.strip()
        if not line or line.startswith("%%"):
            continue
        if in_entity:
            if line == "}":
                in_entity = False
            else:
                discarded["directives"] += 1
            continue
        entity = re.match(r"([A-Za-z0-9_.:-]+)\s*\{$", line)
        if entity:
            node_id = entity.group(1)
            nodes.setdefault(node_id, {"id": node_id, "label": node_id, "kind": "entity", "group": None})
            in_entity = True
            continue
        relationship = re.match(r"([A-Za-z0-9_.:-]+)\s+([^\s]+)--([^\s]+)\s+([A-Za-z0-9_.:-]+)\s*:\s*(.*)$", line)
        if relationship:
            source, left_cardinality, right_cardinality, target, label = relationship.groups()
            for node_id in (source, target):
                nodes.setdefault(node_id, {"id": node_id, "label": node_id, "kind": "entity", "group": None})
            edges.append({"id": f"edge-{len(edges) + 1}", "source": source, "target": target, "label": clean_text(label), "direction": "relationship", "cardinality": {"source": left_cardinality, "target": right_cardinality}})
            continue
        unresolved.append({"line": number, "text": line, "reason": "statement_not_parsed"})
    enforce_limits(list(nodes.values()), edges)
    return diagram_record(diagram_id, diagram_id, "er", None, list(nodes.values()), edges, unresolved, discarded)


def mermaid_blocks(text: str, suffix: str) -> list[list[str]]:
    if suffix in {".md", ".markdown"}:
        blocks = re.findall(r"```mermaid\s*\n(.*?)```", text, re.I | re.S)
        return [block.splitlines() for block in blocks]
    return [text.splitlines()]


def parse_mermaid(data: bytes, suffix: str) -> list[dict]:
    text = data.decode("utf-8", "replace").lstrip("\ufeff")
    blocks = mermaid_blocks(text, suffix)
    if not blocks:
        fail("Markdown contains no fenced Mermaid diagram")
    output = []
    for index, raw_lines in enumerate(blocks, 1):
        lines = [line for line in raw_lines if line.strip()]
        if len(lines) > MAX_LINES:
            fail(f"Mermaid diagram {index} exceeds the {MAX_LINES}-line limit")
        if not lines:
            continue
        header = lines[0].strip().lower()
        diagram_id = f"diagram-{index}"
        if header.startswith(("flowchart", "graph")):
            output.append(parse_flow(lines, diagram_id))
        elif header.startswith("sequencediagram"):
            output.append(parse_sequence(lines, diagram_id))
        elif header.startswith("statediagram"):
            output.append(parse_state(lines, diagram_id))
        elif header.startswith("erdiagram"):
            output.append(parse_er(lines, diagram_id))
        else:
            output.append(diagram_record(diagram_id, diagram_id, "unsupported", None, [], [], [{"line": 1, "text": lines[0].strip(), "reason": "unsupported_grammar"}], {"links": 0, "styles": 0, "directives": 0}))
    return output


def enforce_limits(nodes: list[dict], edges: list[dict]) -> None:
    if len(nodes) > MAX_NODES:
        fail(f"diagram exceeds the {MAX_NODES}-node limit")
    if len(edges) > MAX_EDGES:
        fail(f"diagram exceeds the {MAX_EDGES}-edge limit")


def diagram_record(diagram_id: str, name: str, kind: str, direction: str | None, nodes: list[dict], edges: list[dict], unresolved: list[dict], discarded: dict) -> dict:
    return {
        "id": diagram_id,
        "name": name,
        "kind": kind,
        "direction": direction,
        "nodes": nodes,
        "edges": edges,
        "unresolved": unresolved,
        "discarded_inert_fields": discarded,
        "recommended_grammar": {
            "flowchart": "flowchart",
            "sequence": "sequence",
            "state": "state machine",
            "er": "ER / data model",
            "drawio": "select from extracted topology",
        }.get(kind, "manual review"),
    }


def source_kind(path: Path, data: bytes) -> str:
    suffix = path.suffix.lower()
    if suffix in {".mmd", ".mermaid", ".md", ".markdown"}:
        return "mermaid"
    if suffix in {".drawio", ".xml", ".png", ".svg"} or data.startswith(PNG_MAGIC):
        return "drawio"
    head = data[:2000].decode("utf-8", "replace").lower()
    if "<mxfile" in head or "<mxgraphmodel" in head:
        return "drawio"
    if re.search(r"^\s*(flowchart|graph|sequencediagram|statediagram|erdiagram)\b", head, re.M):
        return "mermaid"
    fail("cannot identify source as Mermaid or draw.io")


def build_ir(path: Path) -> dict:
    if not path.is_file():
        fail(f"source is not a readable file: {path}")
    size = path.stat().st_size
    if size > MAX_INPUT_BYTES:
        fail("input exceeds the 16 MiB limit")
    data = path.read_bytes()
    kind = source_kind(path, data)
    diagrams = parse_mermaid(data, path.suffix.lower()) if kind == "mermaid" else parse_drawio(data, path.suffix.lower())
    node_count = sum(len(item["nodes"]) for item in diagrams)
    edge_count = sum(len(item["edges"]) for item in diagrams)
    unresolved_count = sum(len(item["unresolved"]) for item in diagrams)
    return {
        "schema_version": SCHEMA_VERSION,
        "trust": "untrusted_inert_content",
        "source": {
            "path": str(path.resolve()),
            "format": kind,
            "bytes": len(data),
            "sha256": sha256(data),
        },
        "safety": {
            "rendered": False,
            "executed_source": False,
            "followed_links": False,
            "network_access": False,
            "resource_limits": {"input_bytes": MAX_INPUT_BYTES, "xml_bytes": MAX_XML_BYTES, "lines": MAX_LINES, "nodes": MAX_NODES, "edges": MAX_EDGES},
        },
        "summary": {"diagrams": len(diagrams), "nodes": node_count, "edges": edge_count, "unresolved": unresolved_count},
        "diagrams": diagrams,
        "fidelity_ledger_template": {
            "status": "pending_redraw",
            "source_counts": {"nodes": node_count, "edges": edge_count},
            "kept": [],
            "merged": [],
            "dropped": [],
            "relabelled": [],
            "corrected_relationships": [],
            "unresolved": [],
            "output_counts": None,
            "detail_posture": None,
            "audience": None,
        },
        "authority_warning": "Extracted topology is a redraw input, not proof that the source is current or true.",
    }


def summary_text(ir: dict) -> str:
    lines = [
        f"Source: {ir['source']['path']}",
        f"Format: {ir['source']['format']}",
        f"SHA-256: {ir['source']['sha256']}",
        f"Diagrams: {ir['summary']['diagrams']} · Nodes: {ir['summary']['nodes']} · Edges: {ir['summary']['edges']} · Unresolved: {ir['summary']['unresolved']}",
        "Trust: untrusted inert content; no rendering, execution, link following, or network access",
        "Fidelity ledger: pending redraw",
        f"Warning: {ir['authority_warning']}",
    ]
    for diagram in ir["diagrams"]:
        lines.append(f"- {diagram['id']}: {diagram['kind']} · {len(diagram['nodes'])} nodes · {len(diagram['edges'])} edges · {len(diagram['unresolved'])} unresolved")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract inert Mermaid/draw.io structural IR for NDT redraws.")
    parser.add_argument("source", type=Path)
    parser.add_argument("--format", choices=("json", "summary"), default="summary")
    args = parser.parse_args()
    try:
        ir = build_ir(args.source)
    except (OSError, SourceError) as error:
        print(f"extract-architecture-source: {error}", file=sys.stderr)
        return 2
    if args.format == "json":
        print(json.dumps(ir, ensure_ascii=False, indent=2))
    else:
        print(summary_text(ir))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
