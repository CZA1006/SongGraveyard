"""切片 6:Remix 多动机融合 -> 新节点。"""
import io
import wave


def _wav_bytes(seconds=1, amplitude=0) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(8000)
        frame = int(amplitude).to_bytes(2, "little", signed=True)
        w.writeframes(frame * 8000 * seconds)
    return buf.getvalue()


def _make_motif(client, name: str, audio: bytes) -> dict:
    up = client.post(
        "/api/upload",
        files={"audio": (f"{name}.wav", audio, "audio/wav")},
    )
    assert up.status_code == 200, up.text
    cr = client.post(
        "/api/motifs",
        json={"audioUrl": up.json()["audioUrl"], "title": name, "moodTags": [name]},
    )
    assert cr.status_code == 200, cr.text
    return cr.json()


def _pair(left: str, right: str) -> tuple[str, str]:
    return (left, right) if left < right else (right, left)


def test_remix_creates_new_node_generates_and_links_sources(client, monkeypatch):
    from app.services import acestep

    monkeypatch.setattr(acestep, "resurrect", lambda *a, **k: (b"FAKE", {}))

    first = _make_motif(client, "first", _wav_bytes(amplitude=120))
    second = _make_motif(client, "second", _wav_bytes(seconds=2, amplitude=240))

    response = client.post(
        "/api/remix",
        json={"motifIds": [first["id"], second["id"]], "direction": "blend into a chorus"},
    )
    assert response.status_code == 202, response.text
    body = response.json()
    assert body["motifId"].startswith("motif_")
    assert body["versionId"].startswith("ver_")
    assert body["status"] == "generating"

    detail = client.get(f"/api/motifs/{body['motifId']}")
    assert detail.status_code == 200, detail.text
    motif = detail.json()
    assert motif["isRemix"] is True
    assert motif["sourceMotifIds"] == [first["id"], second["id"]]
    assert motif["audioUrl"].startswith("/storage/audio/")
    assert motif["status"] == "resurrected"
    assert motif["weight"] == 1

    assert len(motif["versions"]) == 1
    version = motif["versions"][0]
    assert version["id"] == body["versionId"]
    assert version["type"] == "remix"
    assert version["status"] == "done"
    assert version["source"] == "live"

    rel = client.get("/api/relationships")
    assert rel.status_code == 200, rel.text
    remix_edges = {
        (edge["source"], edge["target"]): edge
        for edge in rel.json()["edges"]
        if edge["relationType"] == "remix"
    }
    for source_id in (first["id"], second["id"]):
        edge = remix_edges[_pair(body["motifId"], source_id)]
        assert edge["strength"] == 1.0
