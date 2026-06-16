"""异步生成核心:ghost / resurrect / grow 共用。

铁律(AGENTS / DEVELOPMENT §4、§9):
- 立即创建 version(status=generating)并返回 version_id;真正生成在 BackgroundTask 里跑。
- GENERATION_MODE 控制行为:
    auto   = 先实时,失败/超时回落 pregenerated/
    cached = 直接用 pregenerated/(demo 现场保命)
    live   = 只实时,失败即 failed(不回落)
- 实时只经 services/acestep.py;AI 地址由 acestep 从 env 读。
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import HTTPException

from .. import config, db
from . import acestep, audio, llm

# 生成类型 → motif 完成后的状态
_DONE_STATUS = {
    "ghost": "ghosted",
    "resurrect": "resurrected",
    "grow": "resurrected",
    "remix": "resurrected",
}


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _url_to_path(url: str) -> Path:
    """把 /storage/.. 相对 URL 映射回文件系统路径。"""
    if url.startswith("/storage/"):
        return config.STORAGE_DIR / url[len("/storage/"):]
    # 兜底:当成相对 storage 的文件名
    return config.STORAGE_DIR / url.lstrip("/")


def _pregen_fallback(motif_id: str, gen_type: str) -> str | None:
    """查预生成池:motif_id→type 命中,否则 _default→type。返回 /pregenerated/<file> 或 None。"""
    index_path = config.PREGEN_DIR / "index.json"
    if not index_path.exists():
        return None
    try:
        data = json.loads(index_path.read_text(encoding="utf-8"))
    except (ValueError, OSError):
        return None
    entry = data.get(motif_id) or data.get("_default") or {}
    fname = entry.get(gen_type)
    if fname and (config.PREGEN_DIR / fname).exists():
        return f"/pregenerated/{fname}"
    return None


def _call_acestep(gen_type: str, src_path: str, params: dict, text_note: str | None):
    """按类型调适配器,返回 (audio_bytes, meta)。"""
    duration = params.get("duration")
    if gen_type == "ghost":
        return acestep.ghost(src_path, duration=duration or 20)
    caption = llm.build_caption(
        style=params.get("style"),
        instruments=params.get("instruments"),
        mood=params.get("mood"),
        text_note=text_note,
    )
    lyrics = params.get("lyrics") or ""
    if gen_type == "resurrect":
        return acestep.resurrect(src_path, caption, lyrics=lyrics, duration=duration or 90)
    if gen_type == "remix":
        return acestep.resurrect(src_path, caption, lyrics=lyrics, duration=duration or 90)
    if gen_type == "grow":
        return acestep.grow(src_path, caption, lyrics=lyrics, duration=duration or 120)
    raise ValueError(f"未知生成类型:{gen_type}")


def _run_generation(version_id: str, motif_id: str, gen_type: str, params: dict) -> None:
    """后台任务:实时优先 / 回落预生成,落库 version + motif 状态。"""
    mode = config.GENERATION_MODE
    audio_url: str | None = None
    source: str | None = None
    status = "failed"
    error: str | None = None

    # 取 motif 的源音频路径 + 文字
    with db.connect() as conn:
        row = conn.execute(
            "SELECT audio_url, text_note FROM motifs WHERE id = ?", (motif_id,)
        ).fetchone()
    src_url = row["audio_url"] if row else None
    text_note = row["text_note"] if row else None

    # 1) 实时(cached 模式跳过)
    if mode != "cached" and src_url:
        try:
            audio, _meta = _call_acestep(gen_type, str(_url_to_path(src_url)), params, text_note)
            out = config.GENERATED_DIR / f"{version_id}.mp3"
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_bytes(audio)
            audio_url = f"/storage/generated/{out.name}"
            source = "live"
            status = "done"
        except Exception as exc:  # noqa: BLE001 — 失败需回落,不能让后台任务崩
            if mode == "live":
                error = f"live generation failed: {exc}"

    # 2) 回落预生成池(live 模式不回落)
    if status != "done" and mode != "live":
        fb = _pregen_fallback(motif_id, gen_type)
        if fb:
            audio_url, source, status, error = fb, "cached", "done", None
        elif not error:
            error = "no live result and no pregenerated fallback"

    # 3) 落库
    with db.connect() as conn:
        conn.execute(
            """UPDATE versions SET status=?, audio_url=?, source=?, error=?, completed_at=?
               WHERE id=?""",
            (status, audio_url, source, error, _now(), version_id),
        )
        if status == "done":
            conn.execute(
                "UPDATE motifs SET status=?, weight=weight+1 WHERE id=?",
                (_DONE_STATUS.get(gen_type, "resurrected"), motif_id),
            )


def start_generation(motif_id: str, gen_type: str, params: dict, background_tasks) -> str:
    """创建 generating 版本并调度后台任务,返回 version_id。"""
    version_id = f"ver_{uuid.uuid4().hex[:8]}"
    with db.connect() as conn:
        conn.execute(
            """INSERT INTO versions (id, motif_id, type, status, params, created_at)
               VALUES (?,?,?,?,?,?)""",
            (version_id, motif_id, gen_type, "generating",
             db.dumps_obj(params), _now()),
        )
    background_tasks.add_task(_run_generation, version_id, motif_id, gen_type, params)
    return version_id


def start_remix(
    motif_ids: list[str],
    direction: str | None,
    params: dict,
    background_tasks,
) -> tuple[str, str]:
    """创建 remix motif,合并源音频,再复用异步生成核心调度 remix version。"""
    with db.connect() as conn:
        placeholders = ",".join("?" for _ in motif_ids)
        rows = conn.execute(
            f"SELECT * FROM motifs WHERE id IN ({placeholders})", motif_ids
        ).fetchall()

    by_id = {row["id"]: row for row in rows}
    missing = [motif_id for motif_id in motif_ids if motif_id not in by_id]
    if missing:
        raise HTTPException(404, f"motif 不存在:{missing[0]}")

    src_paths = [_url_to_path(by_id[motif_id]["audio_url"]) for motif_id in motif_ids]
    for src_path in src_paths:
        if not src_path.exists():
            raise HTTPException(400, f"源音频不存在:{src_path}")

    motif_id = f"motif_{uuid.uuid4().hex[:8]}"
    dst_path = config.AUDIO_DIR / f"{motif_id}.wav"
    audio.merge(src_paths, dst_path)

    note = (direction or "").strip() or " / ".join(row["title"] for row in rows)
    title = f"Remix of {len(motif_ids)} motifs"
    epitaph = llm.generate_epitaph(note, [])
    created = _now()
    audio_url = f"/storage/audio/{dst_path.name}"

    with db.connect() as conn:
        conn.execute(
            """INSERT INTO motifs
               (id,title,epitaph,audio_url,image_url,text_note,created_at,
                location,mood_tags,project_tags,status,weight,is_remix,source_motif_ids)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                motif_id,
                title,
                epitaph,
                audio_url,
                None,
                note,
                created,
                None,
                db.dumps([]),
                db.dumps([]),
                "buried",
                0,
                1,
                db.dumps(motif_ids),
            ),
        )

    remix_params = {**(params or {}), "direction": direction}
    version_id = start_generation(motif_id, "remix", remix_params, background_tasks)
    return motif_id, version_id
