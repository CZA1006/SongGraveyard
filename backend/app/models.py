"""Pydantic 请求/响应模型 + DB 行 → API dict 的序列化(对齐 PRD §6 / DEVELOPMENT §4)。"""
from typing import List, Optional

from pydantic import BaseModel, Field

from . import db


# ---------- 请求体 ----------
class MotifCreate(BaseModel):
    audioUrl: str
    imageUrl: Optional[str] = None
    textNote: Optional[str] = None
    location: Optional[str] = None
    moodTags: List[str] = Field(default_factory=list)
    projectTags: List[str] = Field(default_factory=list)
    title: Optional[str] = None


class GenerateRequest(BaseModel):
    """resurrect / grow 共用。"""
    style: Optional[str] = None
    instruments: List[str] = Field(default_factory=list)
    mood: Optional[str] = None
    lyrics: Optional[str] = None
    duration: Optional[int] = None


class GhostRequest(BaseModel):
    duration: Optional[int] = None


class RemixRequest(BaseModel):
    motifIds: List[str] = Field(..., min_length=2)
    direction: Optional[str] = None


# ---------- 行 → API dict ----------
def version_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "type": row["type"],
        "status": row["status"],
        "audioUrl": row["audio_url"],
        "source": row["source"],
        "params": db.loads(row["params"], {}),
        "error": row["error"],
        "createdAt": row["created_at"],
        "completedAt": row["completed_at"],
    }


def motif_summary(row) -> dict:
    """列表用,轻量,不含 versions。"""
    return {
        "id": row["id"],
        "title": row["title"],
        "epitaph": row["epitaph"],
        "imageUrl": row["image_url"],
        "status": row["status"],
        "weight": row["weight"],
        "moodTags": db.loads(row["mood_tags"], []),
        "projectTags": db.loads(row["project_tags"], []),
        "location": row["location"],
        "createdAt": row["created_at"],
    }


def motif_detail(row, versions=None, related_ids=None) -> dict:
    """详情用,含 versions + relatedMotifIds。"""
    return {
        "id": row["id"],
        "title": row["title"],
        "epitaph": row["epitaph"],
        "audioUrl": row["audio_url"],
        "imageUrl": row["image_url"],
        "textNote": row["text_note"],
        "createdAt": row["created_at"],
        "location": row["location"],
        "moodTags": db.loads(row["mood_tags"], []),
        "projectTags": db.loads(row["project_tags"], []),
        "status": row["status"],
        "weight": row["weight"],
        "isRemix": bool(row["is_remix"]),
        "sourceMotifIds": db.loads(row["source_motif_ids"], []),
        "relatedMotifIds": related_ids or [],
        "versions": [version_to_dict(v) for v in (versions or [])],
    }
