"""SQLite 封装:建表 + 连接 + 行转 dict。MVP 够用,单文件库。"""
import json
import sqlite3
from contextlib import contextmanager

from . import config

_SCHEMA = """
CREATE TABLE IF NOT EXISTS motifs (
    id               TEXT PRIMARY KEY,
    title            TEXT NOT NULL,
    epitaph          TEXT NOT NULL,
    audio_url        TEXT NOT NULL,
    image_url        TEXT,
    text_note        TEXT,
    created_at       TEXT NOT NULL,
    location         TEXT,
    mood_tags        TEXT NOT NULL DEFAULT '[]',
    project_tags     TEXT NOT NULL DEFAULT '[]',
    status           TEXT NOT NULL DEFAULT 'buried',
    weight           INTEGER NOT NULL DEFAULT 0,
    is_remix         INTEGER NOT NULL DEFAULT 0,
    source_motif_ids TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS versions (
    id           TEXT PRIMARY KEY,
    motif_id     TEXT NOT NULL,
    type         TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'generating',
    audio_url    TEXT,
    source       TEXT,
    params       TEXT NOT NULL DEFAULT '{}',
    error        TEXT,
    created_at   TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY (motif_id) REFERENCES motifs(id)
);
"""


def init_db() -> None:
    config.ensure_dirs()
    with connect() as conn:
        conn.executescript(_SCHEMA)


@contextmanager
def connect():
    conn = sqlite3.connect(str(config.DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


# ---- JSON 列辅助 ----
def loads(value, default):
    if value is None:
        return default
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return default


def dumps(value) -> str:
    return json.dumps(value or [], ensure_ascii=False)
