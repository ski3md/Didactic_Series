#!/usr/bin/env python3
"""Import curated lecture-bearing content into the target repo.

This script intentionally copies only vetted source payloads from a small set
of pertinent repositories, then emits normalized JSON plus provenance and
dependency manifests for repeatable re-imports.
"""

from __future__ import annotations

import hashlib
import json
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CONTENT_ROOT = ROOT / "src" / "content"
PROVENANCE_ROOT = CONTENT_ROOT / "provenance"
GITHUB_ROOT = Path("/Users/skim4/Documents/GitHub")


@dataclass(frozen=True)
class SourceFile:
    source_repo: str
    source_path: Path
    target_path: Path
    content_family: str
    content_type: str
    description: str


CURATED_FILES: list[SourceFile] = [
    SourceFile(
        source_repo="stainbrain printable",
        source_path=GITHUB_ROOT / "stainbrain printable/public/data/lectures.json",
        target_path=CONTENT_ROOT / "lectures/lectures.raw.json",
        content_family="lectures",
        content_type="lecture",
        description="Structured lecture records with slides, transcript, and entity cards.",
    ),
    SourceFile(
        source_repo="stainbrain printable",
        source_path=GITHUB_ROOT / "stainbrain printable/public/data/algorithms.json",
        target_path=CONTENT_ROOT / "algorithms/algorithms.raw.json",
        content_family="algorithms",
        content_type="algorithm",
        description="Structured diagnostic algorithms associated with lectures.",
    ),
    SourceFile(
        source_repo="stainbrain printable",
        source_path=GITHUB_ROOT / "stainbrain printable/public/data/network.json",
        target_path=CONTENT_ROOT / "network/network.raw.json",
        content_family="network",
        content_type="network",
        description="Graph/network data that supports the lecture ecosystem.",
    ),
    SourceFile(
        source_repo="board_prep",
        source_path=GITHUB_ROOT / "board_prep/frontend/public/data/content_data.json",
        target_path=CONTENT_ROOT / "tutorials/board_prep_tutorials.raw.json",
        content_family="tutorials",
        content_type="tutorial",
        description="Tutorials with markdown body, MCQs, and flashcards.",
    ),
    SourceFile(
        source_repo="board_prep",
        source_path=GITHUB_ROOT / "board_prep/frontend/public/data/ap_spec.json",
        target_path=CONTENT_ROOT / "syllabus/board_prep_ap_spec.raw.json",
        content_family="syllabus",
        content_type="syllabus-tree",
        description="Board prep syllabus tree payload used by the frontend.",
    ),
    SourceFile(
        source_repo="board_prep",
        source_path=GITHUB_ROOT / "board_prep/data/parsed_syllabus.json",
        target_path=CONTENT_ROOT / "syllabus/board_prep_parsed_syllabus.raw.json",
        content_family="syllabus",
        content_type="syllabus-topic",
        description="Board prep parsed syllabus topics.",
    ),
    SourceFile(
        source_repo="syllabus",
        source_path=GITHUB_ROOT / "syllabus/data/parsed_topics_v3.json",
        target_path=CONTENT_ROOT / "syllabus/parsed_topics_v3.raw.json",
        content_family="syllabus",
        content_type="syllabus-topic",
        description="Canonical parsed syllabus topics.",
    ),
    SourceFile(
        source_repo="syllabus",
        source_path=GITHUB_ROOT / "syllabus/data/ap_spec.txt",
        target_path=CONTENT_ROOT / "syllabus/ap_spec.raw.txt",
        content_family="syllabus",
        content_type="syllabus-source",
        description="Raw AP specification text.",
    ),
    SourceFile(
        source_repo="syllabus",
        source_path=GITHUB_ROOT / "syllabus/data/cp_spec.txt",
        target_path=CONTENT_ROOT / "syllabus/cp_spec.raw.txt",
        content_family="syllabus",
        content_type="syllabus-source",
        description="Raw CP specification text.",
    ),
]


PROJECT_MANIFESTS = {
    "Didactic_Series": {
        "repo_root": ROOT,
        "manifests": [
            ROOT / "package.json",
            ROOT / "requirements.txt",
        ],
    },
    "stainbrain printable": {
        "repo_root": GITHUB_ROOT / "stainbrain printable",
        "manifests": [
            GITHUB_ROOT / "stainbrain printable/package.json",
        ],
    },
    "board_prep": {
        "repo_root": GITHUB_ROOT / "board_prep",
        "manifests": [
            GITHUB_ROOT / "board_prep/frontend/package.json",
            GITHUB_ROOT / "board_prep/backend/requirements.txt",
        ],
    },
    "syllabus": {
        "repo_root": GITHUB_ROOT / "syllabus",
        "manifests": [
            GITHUB_ROOT / "syllabus/frontend/package.json",
            GITHUB_ROOT / "syllabus/backend/requirements.txt",
        ],
    },
}


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "untitled"


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    ensure_parent(path)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=True)
        handle.write("\n")


def copy_raw_sources() -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for item in CURATED_FILES:
        if not item.source_path.exists():
            raise FileNotFoundError(f"Missing curated source: {item.source_path}")

        ensure_parent(item.target_path)
        shutil.copy2(item.source_path, item.target_path)

        record: dict[str, Any] = {
            "sourceRepo": item.source_repo,
            "sourcePath": str(item.source_path),
            "targetPath": str(item.target_path.relative_to(ROOT)),
            "contentFamily": item.content_family,
            "contentType": item.content_type,
            "description": item.description,
            "sizeBytes": item.target_path.stat().st_size,
            "sha256": sha256_file(item.target_path),
        }

        if item.target_path.suffix == ".json":
            data = load_json(item.target_path)
            if isinstance(data, list):
                record["recordCount"] = len(data)
            elif isinstance(data, dict):
                record["recordCount"] = len(data)
                if isinstance(data.get("nodes"), list):
                    record["nodes"] = len(data["nodes"])
                if isinstance(data.get("links"), list):
                    record["links"] = len(data["links"])
                if isinstance(data.get("extended"), dict):
                    record["extended"] = len(data["extended"])

        records.append(record)
    return records


def parse_requirements(path: Path) -> list[str]:
    dependencies: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if " #" in stripped:
            stripped = stripped.split(" #", 1)[0].strip()
        dependencies.append(stripped)
    return dependencies


def collect_dependency_manifest() -> dict[str, Any]:
    manifest: dict[str, Any] = {"projects": {}, "compatibilityNotes": []}

    for project_name, project_info in PROJECT_MANIFESTS.items():
        project_entry: dict[str, Any] = {
            "repoRoot": str(project_info["repo_root"]),
            "manifests": [],
        }
        for manifest_path in project_info["manifests"]:
            if not manifest_path.exists():
                continue

            entry: dict[str, Any] = {
                "path": str(manifest_path),
                "sha256": sha256_file(manifest_path),
            }

            if manifest_path.name == "package.json":
                pkg = load_json(manifest_path)
                entry["type"] = "package.json"
                entry["name"] = pkg.get("name")
                entry["version"] = pkg.get("version")
                entry["dependencies"] = pkg.get("dependencies", {})
                entry["devDependencies"] = pkg.get("devDependencies", {})
            elif manifest_path.name == "requirements.txt":
                entry["type"] = "requirements.txt"
                entry["dependencies"] = parse_requirements(manifest_path)
            else:
                continue

            project_entry["manifests"].append(entry)

        manifest["projects"][project_name] = project_entry

    manifest["compatibilityNotes"] = [
        "The target app currently uses React 18 and Vite 4.",
        "stainbrain printable uses React 19 and Vite 6, so content should be imported before any UI component reuse.",
        "board_prep and syllabus backend requirements are intentionally recorded for reference but are not required for a data-only import.",
        "react-markdown and remark-gfm are the first likely target additions if imported markdown bodies are rendered in-app.",
    ]
    return manifest


def normalize_lectures(raw_path: Path) -> list[dict[str, Any]]:
    lectures = load_json(raw_path)
    normalized: list[dict[str, Any]] = []
    for lecture in lectures:
        normalized.append(
            {
                "id": lecture.get("id") or slugify(lecture.get("title", "")),
                "sourceRepo": "stainbrain printable",
                "sourcePath": str(raw_path.relative_to(ROOT)),
                "contentType": "lecture",
                "title": lecture.get("title"),
                "category": lecture.get("category"),
                "summary": lecture.get("description"),
                "body": lecture.get("transcript", "").strip(),
                "learningObjectives": [],
                "slides": lecture.get("slides", []),
                "mcqs": [],
                "flashcards": [],
                "references": [],
                "tags": [lecture.get("category")] if lecture.get("category") else [],
                "provenance": {
                    "entityCardsCount": len(lecture.get("entityCards", [])),
                    "slideCount": len(lecture.get("slides", [])),
                    "entityCards": lecture.get("entityCards", []),
                },
            }
        )
    return normalized


def normalize_algorithms(raw_path: Path) -> list[dict[str, Any]]:
    algorithms = load_json(raw_path)
    normalized: list[dict[str, Any]] = []
    for algorithm in algorithms:
        normalized.append(
            {
                "id": algorithm.get("id") or slugify(algorithm.get("title", "")),
                "sourceRepo": "stainbrain printable",
                "sourcePath": str(raw_path.relative_to(ROOT)),
                "contentType": "algorithm",
                "title": algorithm.get("title"),
                "category": algorithm.get("category"),
                "summary": algorithm.get("summary"),
                "body": "",
                "learningObjectives": [],
                "slides": [],
                "mcqs": [],
                "flashcards": [],
                "references": [],
                "tags": [algorithm.get("category")] if algorithm.get("category") else [],
                "provenance": {
                    "startNodeId": algorithm.get("startNodeId"),
                    "nodeCount": len(algorithm.get("nodes", [])),
                    "nodes": algorithm.get("nodes", []),
                },
            }
        )
    return normalized


def normalize_tutorials(raw_path: Path) -> list[dict[str, Any]]:
    tutorials = load_json(raw_path)
    normalized: list[dict[str, Any]] = []
    for tutorial in tutorials:
        topic = tutorial.get("topic", "Untitled Topic")
        tutorial_meta = tutorial.get("tutorial", {})
        mcqs = tutorial.get("mcqs", [])
        flashcards = tutorial.get("flashcards", [])
        normalized.append(
            {
                "id": slugify(topic),
                "sourceRepo": "board_prep",
                "sourcePath": str(raw_path.relative_to(ROOT)),
                "contentType": "tutorial",
                "title": topic,
                "category": None,
                "summary": tutorial_meta.get("title"),
                "body": tutorial_meta.get("content", "").strip(),
                "learningObjectives": [],
                "slides": [],
                "mcqs": mcqs,
                "flashcards": flashcards,
                "references": [],
                "tags": [topic],
                "provenance": {
                    "tutorialTitle": tutorial_meta.get("title"),
                    "mcqCount": len(mcqs),
                    "flashcardCount": len(flashcards),
                },
            }
        )
    return normalized


def normalize_syllabus(raw_path: Path) -> list[dict[str, Any]]:
    topics = load_json(raw_path)
    normalized: list[dict[str, Any]] = []
    for topic in topics:
        path_context = topic.get("path_context") or []
        summary = " > ".join(path_context) if path_context else topic.get("clean_title") or topic.get("title")
        normalized.append(
            {
                "id": topic.get("topic_id") or slugify(topic.get("title", "")),
                "sourceRepo": "syllabus",
                "sourcePath": str(raw_path.relative_to(ROOT)),
                "contentType": "syllabus-topic",
                "title": topic.get("title"),
                "category": topic.get("category_id"),
                "summary": summary,
                "body": "",
                "learningObjectives": [],
                "slides": [],
                "mcqs": [],
                "flashcards": [],
                "references": [],
                "tags": [topic.get("difficulty")] if topic.get("difficulty") else [],
                "provenance": topic,
            }
        )
    return normalized


def build_catalog(
    lectures: list[dict[str, Any]],
    algorithms: list[dict[str, Any]],
    tutorials: list[dict[str, Any]],
    syllabus_topics: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "counts": {
            "lectures": len(lectures),
            "algorithms": len(algorithms),
            "tutorials": len(tutorials),
            "syllabusTopics": len(syllabus_topics),
        },
        "sources": [
            "stainbrain printable",
            "board_prep",
            "syllabus",
        ],
        "normalizedOutputs": {
            "lectures": "src/content/lectures/lectures.normalized.json",
            "algorithms": "src/content/algorithms/algorithms.normalized.json",
            "tutorials": "src/content/tutorials/tutorials.normalized.json",
            "syllabus": "src/content/syllabus/syllabus.normalized.json",
        },
    }


def main() -> None:
    PROVENANCE_ROOT.mkdir(parents=True, exist_ok=True)

    source_records = copy_raw_sources()
    dependency_manifest = collect_dependency_manifest()

    lectures_raw = CONTENT_ROOT / "lectures/lectures.raw.json"
    algorithms_raw = CONTENT_ROOT / "algorithms/algorithms.raw.json"
    tutorials_raw = CONTENT_ROOT / "tutorials/board_prep_tutorials.raw.json"
    syllabus_raw = CONTENT_ROOT / "syllabus/parsed_topics_v3.raw.json"

    lectures_normalized = normalize_lectures(lectures_raw)
    algorithms_normalized = normalize_algorithms(algorithms_raw)
    tutorials_normalized = normalize_tutorials(tutorials_raw)
    syllabus_normalized = normalize_syllabus(syllabus_raw)

    write_json(CONTENT_ROOT / "lectures/lectures.normalized.json", lectures_normalized)
    write_json(CONTENT_ROOT / "algorithms/algorithms.normalized.json", algorithms_normalized)
    write_json(CONTENT_ROOT / "tutorials/tutorials.normalized.json", tutorials_normalized)
    write_json(CONTENT_ROOT / "syllabus/syllabus.normalized.json", syllabus_normalized)
    write_json(
        CONTENT_ROOT / "catalog.json",
        build_catalog(
            lectures_normalized,
            algorithms_normalized,
            tutorials_normalized,
            syllabus_normalized,
        ),
    )
    write_json(PROVENANCE_ROOT / "source_manifest.json", {"sources": source_records})
    write_json(PROVENANCE_ROOT / "dependency_manifest.json", dependency_manifest)

    print("Imported curated lecture content successfully.")
    print(f"Lectures: {len(lectures_normalized)}")
    print(f"Algorithms: {len(algorithms_normalized)}")
    print(f"Tutorials: {len(tutorials_normalized)}")
    print(f"Syllabus topics: {len(syllabus_normalized)}")


if __name__ == "__main__":
    main()
