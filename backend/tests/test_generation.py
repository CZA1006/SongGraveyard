"""切片 4/5:异步生成核心 + pregen 回落。
全部 monkeypatch acestep,绝不打真实 AI。
注:TestClient 会在请求返回前跑完 BackgroundTask,故 POST 后直接 GET 即可见结果。"""
import io
import json
import wave


def _wav_bytes(seconds=1) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(8000)
        w.writeframes(b"\x00\x00" * 8000 * seconds)
    return buf.getvalue()


def _make_motif(client) -> dict:
    up = client.post("/api/upload", files={"audio": ("h.wav", _wav_bytes(), "audio/wav")})
    assert up.status_code == 200, up.text
    cr = client.post("/api/motifs", json={"audioUrl": up.json()["audioUrl"], "moodTags": ["x"]})
    assert cr.status_code == 200, cr.text
    return cr.json()


def _only_version(client, motif_id: str) -> dict:
    versions = client.get(f"/api/motifs/{motif_id}").json()["versions"]
    assert len(versions) == 1
    return versions[0]


def _write_pregen(default_map: dict):
    from app import config
    config.PREGEN_DIR.mkdir(parents=True, exist_ok=True)
    (config.PREGEN_DIR / "index.json").write_text(
        json.dumps({"_default": default_map}), encoding="utf-8"
    )
    for fname in default_map.values():
        (config.PREGEN_DIR / fname).write_bytes(b"CACHED")


def test_ghost_live_success(client, monkeypatch):
    from app.services import acestep
    monkeypatch.setattr(acestep, "ghost", lambda *a, **k: (b"FAKE", {}))

    motif = _make_motif(client)
    r = client.post(f"/api/motifs/{motif['id']}/ghost", json={})
    assert r.status_code == 202
    assert r.json()["status"] == "generating"

    v = _only_version(client, motif["id"])
    assert v["type"] == "ghost"
    assert v["status"] == "done"
    assert v["source"] == "live"
    assert v["audioUrl"].startswith("/storage/generated/")
    # motif 状态 → ghosted,weight 因生成 +1
    detail = client.get(f"/api/motifs/{motif['id']}").json()
    assert detail["status"] == "ghosted"
    assert detail["weight"] >= 1


def test_auto_fallback_to_pregenerated(client, monkeypatch):
    from app.services import acestep
    def _boom(*a, **k):
        raise RuntimeError("ai down")
    monkeypatch.setattr(acestep, "ghost", _boom)
    _write_pregen({"ghost": "def_ghost.mp3"})

    motif = _make_motif(client)
    client.post(f"/api/motifs/{motif['id']}/ghost", json={})

    v = _only_version(client, motif["id"])
    assert v["status"] == "done"
    assert v["source"] == "cached"
    assert v["audioUrl"] == "/pregenerated/def_ghost.mp3"


def test_cached_mode_skips_live(client, monkeypatch):
    from app import config
    from app.services import acestep
    called = {"n": 0}
    def _track(*a, **k):
        called["n"] += 1
        return (b"FAKE", {})
    monkeypatch.setattr(acestep, "ghost", _track)
    monkeypatch.setattr(config, "GENERATION_MODE", "cached")
    _write_pregen({"ghost": "def_ghost.mp3"})

    motif = _make_motif(client)
    client.post(f"/api/motifs/{motif['id']}/ghost", json={})

    v = _only_version(client, motif["id"])
    assert v["source"] == "cached"
    assert called["n"] == 0  # cached 模式不打实时


def test_live_mode_failure_marks_failed(client, monkeypatch):
    from app import config
    from app.services import acestep
    monkeypatch.setattr(config, "GENERATION_MODE", "live")
    monkeypatch.setattr(acestep, "ghost", lambda *a, **k: (_ for _ in ()).throw(RuntimeError("x")))

    motif = _make_motif(client)
    client.post(f"/api/motifs/{motif['id']}/ghost", json={})

    v = _only_version(client, motif["id"])
    assert v["status"] == "failed"
    assert v["error"]


def test_resurrect_live_success(client, monkeypatch):
    from app.services import acestep
    captured = {}
    def _fake_resurrect(src, caption, lyrics="", duration=90):
        captured["caption"] = caption
        return (b"FAKE", {})
    monkeypatch.setattr(acestep, "resurrect", _fake_resurrect)

    motif = _make_motif(client)
    r = client.post(f"/api/motifs/{motif['id']}/resurrect",
                    json={"style": "lofi", "mood": "nostalgic", "instruments": ["piano"]})
    assert r.status_code == 202

    v = _only_version(client, motif["id"])
    assert v["type"] == "resurrect"
    assert v["status"] == "done"
    assert v["source"] == "live"
    assert "lofi" in captured["caption"]
