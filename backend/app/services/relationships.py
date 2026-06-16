"""规则关联 graph 计算。"""
from __future__ import annotations

from collections.abc import Iterable, Sequence

from .. import db

RELATION_PRIORITY = {
    "same_mood": 0,
    "same_project": 1,
    "same_location": 2,
    "remix": 3,
}


def _set(value) -> set[str]:
    return set(value or [])


def _jaccard(left: Iterable[str], right: Iterable[str]) -> float:
    left_set = _set(left)
    right_set = _set(right)
    union = left_set | right_set
    if not union:
        return 0.0
    return len(left_set & right_set) / len(union)


def _pair(a: str, b: str) -> tuple[str, str]:
    return (a, b) if a < b else (b, a)


def _as_motif(row) -> dict:
    if isinstance(row, dict):
        return row
    return {
        "id": row["id"],
        "moodTags": db.loads(row["mood_tags"], []),
        "projectTags": db.loads(row["project_tags"], []),
        "location": row["location"],
        "isRemix": bool(row["is_remix"]),
        "sourceMotifIds": db.loads(row["source_motif_ids"], []),
    }


def _should_replace(current: dict, relation_type: str, strength: float) -> bool:
    if strength > current["strength"]:
        return True
    if strength < current["strength"]:
        return False
    return RELATION_PRIORITY[relation_type] > RELATION_PRIORITY[current["relationType"]]


def compute_edges(motifs: Sequence[dict]) -> list[dict]:
    motif_dicts = [_as_motif(motif) for motif in motifs]
    by_id = {motif["id"]: motif for motif in motif_dicts}
    best_edges: dict[tuple[str, str], dict] = {}

    for index, left in enumerate(motif_dicts):
        for right in motif_dicts[index + 1:]:
            pair = _pair(left["id"], right["id"])
            candidates: list[tuple[str, float]] = []

            mood_strength = _jaccard(left.get("moodTags"), right.get("moodTags"))
            if mood_strength > 0:
                candidates.append(("same_mood", mood_strength))

            project_strength = _jaccard(left.get("projectTags"), right.get("projectTags"))
            if project_strength > 0:
                candidates.append(("same_project", project_strength))

            left_location = (left.get("location") or "").strip()
            right_location = (right.get("location") or "").strip()
            if left_location and left_location == right_location:
                candidates.append(("same_location", 0.5))

            if any(source_id == right["id"] for source_id in left.get("sourceMotifIds", [])) and left.get("isRemix"):
                candidates.append(("remix", 1.0))
            if any(source_id == left["id"] for source_id in right.get("sourceMotifIds", [])) and right.get("isRemix"):
                candidates.append(("remix", 1.0))

            for relation_type, strength in candidates:
                current = best_edges.get(pair)
                edge = {
                    "source": pair[0],
                    "target": pair[1],
                    "relationType": relation_type,
                    "strength": strength,
                }
                if current is None or _should_replace(current, relation_type, strength):
                    best_edges[pair] = edge

    return sorted(best_edges.values(), key=lambda edge: (edge["source"], edge["target"]))


def related_ids(motif_id: str, edges: Sequence[dict]) -> list[str]:
    related: list[str] = []
    for edge in edges:
        if edge["source"] == motif_id:
            related.append(edge["target"])
        elif edge["target"] == motif_id:
            related.append(edge["source"])
    return related
