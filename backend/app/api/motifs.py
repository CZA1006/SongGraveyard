"""动机相关路由:upload + motif CRUD(切片 1)。
生成接口(resurrect/grow/ghost/remix)在后续切片接入。"""
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from .. import config, db, models
from ..services import audio, llm
from ..services.relationships import compute_edges, related_ids

router = APIRouter(prefix="/api", tags=["motifs"])


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


# ---------- 上传 ----------
@router.post("/upload")
async def upload(audio_file: UploadFile = File(..., alias="audio"),
                 image: UploadFile | None = File(None)):
    if not audio_file:
        raise HTTPException(400, "audio 文件必填")

    uid = uuid.uuid4().hex[:8]
    # 原始落盘 → 转码 wav
    raw_path = config.AUDIO_DIR / f"{uid}_raw{Path(audio_file.filename or '').suffix}"
    raw_path.parent.mkdir(parents=True, exist_ok=True)
    raw_path.write_bytes(await audio_file.read())
    wav_path = config.AUDIO_DIR / f"{uid}.wav"
    try:
        dur = audio.transcode_to_wav(raw_path, wav_path)
    except Exception as e:
        raise HTTPException(400, f"音频转码失败(检查 ffmpeg / 文件格式):{e}")
    finally:
        raw_path.unlink(missing_ok=True)

    image_url = None
    if image is not None:
        img_path = config.IMAGE_DIR / f"{uid}{Path(image.filename or '').suffix or '.jpg'}"
        img_path.write_bytes(await image.read())
        image_url = f"/storage/images/{img_path.name}"

    return {
        "audioUrl": f"/storage/audio/{wav_path.name}",
        "imageUrl": image_url,
        "durationSec": dur,
    }


# ---------- 创建动机 ----------
@router.post("/motifs")
def create_motif(body: models.MotifCreate):
    mid = _new_id("motif")
    title = body.title or llm.generate_title(body.textNote, body.moodTags)
    epitaph = llm.generate_epitaph(body.textNote, body.moodTags)
    created = _now()

    with db.connect() as conn:
        conn.execute(
            """INSERT INTO motifs
               (id,title,epitaph,audio_url,image_url,text_note,created_at,
                location,mood_tags,project_tags,status,weight,is_remix,source_motif_ids)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (mid, title, epitaph, body.audioUrl, body.imageUrl, body.textNote, created,
             body.location, db.dumps(body.moodTags), db.dumps(body.projectTags),
             "buried", 0, 0, db.dumps([])),
        )
    return _fetch_detail(mid)


# ---------- 列表 ----------
@router.get("/motifs")
def list_motifs():
    with db.connect() as conn:
        rows = conn.execute("SELECT * FROM motifs ORDER BY created_at DESC").fetchall()
    return {"motifs": [models.motif_summary(r) for r in rows]}


# ---------- 详情(轮询目标)----------
# 注意:此接口被生成流程高频轮询,故 *不* 在这里自增 weight,
# 避免权重被轮询虚高。weight 由生成次数驱动(切片 4 每次生成 +N)。
@router.get("/motifs/{motif_id}")
def get_motif(motif_id: str):
    return _fetch_detail(motif_id)


def _fetch_detail(motif_id: str) -> dict:
    with db.connect() as conn:
        row = conn.execute("SELECT * FROM motifs WHERE id = ?", (motif_id,)).fetchone()
        if row is None:
            raise HTTPException(404, f"motif 不存在:{motif_id}")
        versions = conn.execute(
            "SELECT * FROM versions WHERE motif_id = ? ORDER BY created_at ASC", (motif_id,)
        ).fetchall()
        motifs = conn.execute("SELECT * FROM motifs ORDER BY id ASC").fetchall()

    edges = compute_edges(motifs)
    return models.motif_detail(row, versions=versions, related_ids=related_ids(motif_id, edges))
