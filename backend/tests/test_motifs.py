"""切片 1 最小测试:upload + motif CRUD。
用临时 DB/storage,避免污染真实数据;不打真实 AI。"""
import importlib
import io
import wave

import pytest


@pytest.fixture()
def client(tmp_path, monkeypatch):
    # 指向临时目录,隔离测试
    monkeypatch.setenv("STORAGE_DIR", str(tmp_path / "storage"))
    monkeypatch.setenv("PREGEN_DIR", str(tmp_path / "pregen"))
    monkeypatch.setenv("DB_PATH", str(tmp_path / "app.db"))

    from app import config as cfg
    importlib.reload(cfg)
    from app import db as dbmod
    importlib.reload(dbmod)
    from app import models as m
    importlib.reload(m)
    from app.api import motifs as mt
    importlib.reload(mt)
    from app import main
    importlib.reload(main)

    from fastapi.testclient import TestClient
    return TestClient(main.app)


def _wav_bytes(seconds=1) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(8000)
        w.writeframes(b"\x00\x00" * 8000 * seconds)
    return buf.getvalue()


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_upload_then_create_and_fetch(client):
    # upload
    up = client.post("/api/upload",
                     files={"audio": ("hum.wav", _wav_bytes(), "audio/wav")})
    assert up.status_code == 200, up.text
    audio_url = up.json()["audioUrl"]
    assert audio_url.startswith("/storage/audio/")
    assert up.json()["durationSec"] > 0

    # create motif(无 title → LLM/模板生成)
    cr = client.post("/api/motifs", json={
        "audioUrl": audio_url, "textNote": "late night idea",
        "moodTags": ["nostalgic"], "projectTags": ["night walk"],
        "location": "Hong Kong",
    })
    assert cr.status_code == 200, cr.text
    motif = cr.json()
    assert motif["id"].startswith("motif_")
    assert motif["title"]
    assert motif["epitaph"]
    assert motif["status"] == "buried"
    assert motif["moodTags"] == ["nostalgic"]
    assert motif["versions"] == []

    # list
    ls = client.get("/api/motifs")
    assert ls.status_code == 200
    assert any(x["id"] == motif["id"] for x in ls.json()["motifs"])

    # detail(轮询目标,不应因 GET 而虚高 weight)
    d1 = client.get(f"/api/motifs/{motif['id']}")
    assert d1.status_code == 200
    assert d1.json()["weight"] == 0

    # 404 返回统一错误形状 { error: { code, message } }
    nf = client.get("/api/motifs/motif_nope")
    assert nf.status_code == 404
    assert nf.json()["error"]["code"] == "http_404"
