from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from collections import defaultdict, deque
from dataclasses import dataclass
from pathlib import Path

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "how",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "the",
    "this",
    "to",
    "what",
    "where",
    "which",
    "who",
    "why",
    "with",
}

DEFAULT_MODEL = os.getenv("KALP_OPENAI_MODEL", "gpt-4o-mini")
MAX_CONTEXT_CHARS = 12000


@dataclass
class MemoryBundle:
    context: str
    cited_nodes: list[str]


class KalpGraphAgent:
    def __init__(self, project_path: Path, *, use_openai: bool = True, model: str = DEFAULT_MODEL):
        self.project_path = project_path.resolve()
        self.graphify_dir = self.project_path / "graphify-out"
        self.graph_path = self.graphify_dir / "graph.json"
        self.report_path = self.graphify_dir / "GRAPH_REPORT.md"
        self.html_path = self.graphify_dir / "graph.html"
        self.model = model
        self.use_openai = use_openai
        self.client = self._build_client() if use_openai else None

        self.nodes: dict[str, dict] = {}
        self.node_text: dict[str, str] = {}
        self.outgoing: dict[str, list[dict]] = defaultdict(list)
        self.incoming: dict[str, list[dict]] = defaultdict(list)
        self.report_summary = ""
        self.node_count = 0
        self.edge_count = 0

    def ensure_graph(self, *, refresh: bool) -> None:
        if refresh or not self._artifacts_exist():
            self.refresh_graph()
        self._load_graph_data()

    def refresh_graph(self) -> None:
        print(f"[Graphify] Updating graph for {self.project_path}", flush=True)
        try:
            subprocess.run(
                ["graphify", "update", str(self.project_path)],
                cwd=self.project_path,
                check=True,
            )
        except FileNotFoundError as exc:
            raise RuntimeError("Graphify CLI is not installed or not on PATH.") from exc
        except subprocess.CalledProcessError as exc:
            raise RuntimeError(f"Graphify update failed with exit code {exc.returncode}.") from exc

    def answer_question(self, query: str) -> str:
        memory = self.build_memory_bundle(query)
        if self.client is None:
            return self._render_memory_only_answer(memory)
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are the KalpZero codebase architect. Answer only from the provided "
                            "Graphify memory. If the memory does not support a conclusion, say so "
                            "clearly instead of guessing."
                        ),
                    },
                    {"role": "system", "content": f"Graphify memory:\n{memory.context}"},
                    {"role": "user", "content": query},
                ],
                temperature=0.2,
            )
            content = response.choices[0].message.content or ""
            return content.strip() or self._render_memory_only_answer(memory)
        except Exception as exc:
            return (
                f"OpenAI request failed: {exc}\n\n"
                f"{self._render_memory_only_answer(memory)}"
            )

    def build_memory_bundle(self, query: str, *, node_limit: int = 5) -> MemoryBundle:
        tokens = self._tokenize(query)
        ranked_nodes = self._rank_nodes(query, tokens)[:node_limit]
        sections = []

        if self.report_summary:
            sections.append(self.report_summary)

        if ranked_nodes:
            node_sections = [self._format_node_block(node_id) for node_id, _score in ranked_nodes]
            sections.append("Relevant Graphify nodes:\n" + "\n\n".join(node_sections))

            if len(ranked_nodes) > 1:
                path_text = self._describe_path(ranked_nodes[0][0], ranked_nodes[1][0])
                if path_text:
                    sections.append(f"Graph connection:\n{path_text}")
        else:
            sections.append("No directly matching nodes were found in Graphify memory.")

        if len(ranked_nodes) < 2:
            traversal = self._graphify_query(query)
            if traversal:
                sections.append(f"Graphify traversal:\n{traversal}")

        context = "\n\n".join(part.strip() for part in sections if part.strip())
        if len(context) > MAX_CONTEXT_CHARS:
            context = context[:MAX_CONTEXT_CHARS].rstrip() + "\n\n[Graphify context truncated]"

        return MemoryBundle(context=context, cited_nodes=[node_id for node_id, _score in ranked_nodes])

    def render_status(self) -> str:
        html_state = "present" if self.html_path.exists() else "missing"
        return "\n".join(
            [
                f"Project: {self.project_path}",
                f"Graph JSON: {self.graph_path}",
                f"Graph report: {self.report_path}",
                f"Graph HTML: {self.html_path} ({html_state})",
                f"Nodes: {self.node_count}",
                f"Edges: {self.edge_count}",
                f"Mode: {'OpenAI + Graphify memory' if self.client else 'Graphify memory only'}",
            ]
        )

    def _build_client(self):
        if OpenAI is None:
            return None
        api_key = self._find_api_key()
        if not api_key:
            return None
        return OpenAI(api_key=api_key)

    def _find_api_key(self) -> str | None:
        env_key = os.getenv("OPENAI_API_KEY") or os.getenv("KALPZERO_OPENAI_API_KEY")
        if env_key:
            return env_key

        candidate_files = [
            self.project_path / ".env",
        ]
        for path in candidate_files:
            if not path.exists():
                continue
            for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                if key.strip() in {"OPENAI_API_KEY", "KALPZERO_OPENAI_API_KEY"}:
                    return value.strip().strip("\"'")
        return None

    def _artifacts_exist(self) -> bool:
        return self.graph_path.exists() and self.report_path.exists() and self.html_path.exists()

    def _load_graph_data(self) -> None:
        if not self.graph_path.exists():
            raise FileNotFoundError(f"Graph file not found: {self.graph_path}")

        graph_data = json.loads(self.graph_path.read_text(encoding="utf-8"))
        self.nodes = {node["id"]: node for node in graph_data.get("nodes", []) if "id" in node}
        self.node_count = len(self.nodes)
        self.edge_count = len(graph_data.get("links", []))
        self.outgoing = defaultdict(list)
        self.incoming = defaultdict(list)

        for node_id, node in self.nodes.items():
            rel_path = self._relative_path(node.get("source_file"))
            parts = [
                node_id,
                str(node.get("label", "")),
                rel_path,
                str(node.get("source_location", "")),
            ]
            self.node_text[node_id] = " ".join(part for part in parts if part).lower()

        for edge in graph_data.get("links", []):
            source = edge.get("source") or edge.get("_src")
            target = edge.get("target") or edge.get("_tgt")
            if not source or not target:
                continue
            relation = edge.get("relation", "related_to")
            payload = {"neighbor": target, "relation": relation}
            reverse = {"neighbor": source, "relation": relation}
            self.outgoing[source].append(payload)
            self.incoming[target].append(reverse)

        self.report_summary = self._load_report_summary()

    def _load_report_summary(self) -> str:
        if not self.report_path.exists():
            return ""
        lines = []
        for line in self.report_path.read_text(encoding="utf-8", errors="ignore").splitlines():
            if line.startswith("## Community Hubs"):
                break
            lines.append(line.rstrip())
        return "\n".join(line for line in lines if line.strip()).strip()

    def _tokenize(self, text: str) -> list[str]:
        return [
            token
            for token in re.findall(r"[a-z0-9_./-]+", text.lower())
            if len(token) > 2 and token not in STOPWORDS
        ]

    def _rank_nodes(self, query: str, tokens: list[str]) -> list[tuple[str, float]]:
        scored = []
        lowered_query = query.lower()
        for node_id, node in self.nodes.items():
            haystack = self.node_text[node_id]
            label = str(node.get("label", "")).lower()
            rel_path = self._relative_path(node.get("source_file")).lower()
            path_parts = [part.lower() for part in Path(rel_path).parts]
            score = 0.0

            if lowered_query and lowered_query in haystack:
                score += 12.0

            for token in tokens:
                if token == label:
                    score += 10.0
                token_boundary = rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])"
                if re.search(token_boundary, label):
                    score += 9.0
                elif token in label:
                    score += 4.0

                if any(part == token or part.startswith(f"{token}.") for part in path_parts):
                    score += 8.0
                elif re.search(token_boundary, rel_path):
                    score += 7.0
                elif token in rel_path:
                    score += 4.0
                elif token in haystack:
                    score += 3.0

            score += min(len(self.outgoing.get(node_id, [])) + len(self.incoming.get(node_id, [])), 8) * 0.15
            if score > 0:
                scored.append((node_id, score))

        return sorted(scored, key=lambda item: (-item[1], self.nodes[item[0]].get("label", item[0])))

    def _format_node_block(self, node_id: str) -> str:
        node = self.nodes[node_id]
        label = node.get("label", node_id)
        rel_path = self._relative_path(node.get("source_file"))
        location = node.get("source_location", "unknown")
        outgoing = self._format_neighbors(self.outgoing.get(node_id, []))
        incoming = self._format_neighbors(self.incoming.get(node_id, []))
        snippet = self._read_source_snippet(node)

        parts = [
            f"- Node: {label}",
            f"  Id: {node_id}",
            f"  Source: {rel_path}:{location}",
        ]
        if outgoing:
            parts.append(f"  Outgoing: {outgoing}")
        if incoming:
            parts.append(f"  Incoming: {incoming}")
        if snippet:
            parts.append("  Snippet:")
            for line in snippet.splitlines():
                parts.append(f"    {line}")
        return "\n".join(parts)

    def _format_neighbors(self, edges: list[dict], *, limit: int = 5) -> str:
        if not edges:
            return ""
        rendered = []
        seen: set[tuple[str, str]] = set()
        for edge in edges:
            neighbor = edge["neighbor"]
            relation = edge.get("relation", "related_to")
            key = (neighbor, relation)
            if key in seen:
                continue
            seen.add(key)
            label = self.nodes.get(neighbor, {}).get("label", neighbor)
            rendered.append(f"{relation} -> {label}")
            if len(rendered) == limit:
                break
        return "; ".join(rendered)

    def _read_source_snippet(self, node: dict, *, radius: int = 3) -> str:
        source_file = node.get("source_file")
        line_number = self._parse_line_number(node.get("source_location"))
        if not source_file or line_number is None:
            return ""
        path = Path(source_file)
        if not path.exists():
            return ""

        lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
        start = max(line_number - radius, 1)
        end = min(line_number + radius, len(lines))
        return "\n".join(f"{index}: {lines[index - 1].rstrip()}" for index in range(start, end + 1))

    def _parse_line_number(self, location: str | None) -> int | None:
        if not location:
            return None
        match = re.search(r"L(\d+)", location)
        if not match:
            return None
        return int(match.group(1))

    def _describe_path(self, start: str, end: str) -> str:
        path = self._shortest_path(start, end)
        if not path or len(path) < 2:
            return ""
        steps = []
        for left, right in zip(path, path[1:]):
            relation = self._relation_between(left, right)
            left_label = self.nodes.get(left, {}).get("label", left)
            right_label = self.nodes.get(right, {}).get("label", right)
            steps.append(f"{left_label} -[{relation}]-> {right_label}")
        return "\n".join(steps)

    def _shortest_path(self, start: str, end: str) -> list[str]:
        if start == end:
            return [start]

        queue = deque([(start, [start])])
        visited = {start}
        while queue:
            node_id, path = queue.popleft()
            neighbors = [
                edge["neighbor"]
                for edge in self.outgoing.get(node_id, [])
            ] + [
                edge["neighbor"]
                for edge in self.incoming.get(node_id, [])
            ]
            for neighbor in neighbors:
                if neighbor in visited:
                    continue
                next_path = path + [neighbor]
                if neighbor == end:
                    return next_path
                visited.add(neighbor)
                queue.append((neighbor, next_path))
        return []

    def _relation_between(self, left: str, right: str) -> str:
        for edge in self.outgoing.get(left, []):
            if edge["neighbor"] == right:
                return edge.get("relation", "related_to")
        for edge in self.incoming.get(left, []):
            if edge["neighbor"] == right:
                return f"reverse:{edge.get('relation', 'related_to')}"
        return "related_to"

    def _graphify_query(self, question: str, *, budget: int = 900) -> str:
        try:
            result = subprocess.run(
                ["graphify", "query", question, "--graph", str(self.graph_path), "--budget", str(budget)],
                cwd=self.project_path,
                capture_output=True,
                text=True,
                check=True,
            )
        except (FileNotFoundError, subprocess.CalledProcessError):
            return ""
        return result.stdout.strip()

    def _relative_path(self, source_file: str | None) -> str:
        if not source_file:
            return "unknown"
        path = Path(source_file)
        try:
            return str(path.resolve().relative_to(self.project_path))
        except ValueError:
            return str(path)

    def _render_memory_only_answer(self, memory: MemoryBundle) -> str:
        return (
            "[Graphify memory only]\n"
            "Set OPENAI_API_KEY if you want the model to summarize this memory.\n\n"
            f"{memory.context}"
        )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Ask questions about Kalp using Graphify memory.")
    parser.add_argument(
        "--project-path",
        default=str(Path(__file__).resolve().parents[2]),
        help="Absolute or relative path to the Kalp repo root.",
    )
    parser.add_argument(
        "--question",
        help="Ask a single question and exit.",
    )
    parser.add_argument(
        "--skip-refresh",
        action="store_true",
        help="Reuse existing graphify-out artifacts instead of running graphify update first.",
    )
    parser.add_argument(
        "--no-openai",
        action="store_true",
        help="Answer using Graphify memory only, without calling OpenAI.",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help="OpenAI model name to use when OPENAI_API_KEY is available.",
    )
    return parser


def interactive_loop(agent: KalpGraphAgent) -> int:
    print("\n" + "=" * 60)
    print("KALP GRAPHIFY AGENT")
    print("=" * 60)
    print(agent.render_status())
    print("\nCommands: html, status, refresh, exit")
    print("Ask any repo question to answer from Graphify memory.\n")

    while True:
        user_input = input("Ask about Kalp architecture (or 'exit'): ").strip()
        if not user_input:
            continue
        lowered = user_input.lower()
        if lowered in {"exit", "quit"}:
            return 0
        if lowered == "html":
            print(f"\nGraph HTML: {agent.html_path}\n")
            continue
        if lowered == "status":
            print(f"\n{agent.render_status()}\n")
            continue
        if lowered == "refresh":
            agent.ensure_graph(refresh=True)
            print(f"\nGraphify refreshed.\nGraph HTML: {agent.html_path}\n")
            continue

        print("\nThinking...")
        answer = agent.answer_question(user_input)
        print(f"\n[Kalp-AI]: {answer}\n")
        print("-" * 40)


def main() -> int:
    args = build_parser().parse_args()
    project_path = Path(args.project_path).resolve()
    agent = KalpGraphAgent(project_path, use_openai=not args.no_openai, model=args.model)
    agent.ensure_graph(refresh=not args.skip_refresh)

    if args.question:
        print(agent.render_status())
        print()
        print(agent.answer_question(args.question))
        return 0

    return interactive_loop(agent)


if __name__ == "__main__":
    sys.exit(main())
