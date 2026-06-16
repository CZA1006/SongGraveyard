"""切片 2:规则关联 graph。"""


def _create_motif(client, body: dict) -> dict:
    response = client.post("/api/motifs", json=body)
    assert response.status_code == 200, response.text
    return response.json()


def test_relationships_and_detail_related_ids(client):
    motif_a = _create_motif(client, {
        "audioUrl": "/storage/audio/a.wav",
        "textNote": "midnight hum",
        "moodTags": ["nostalgic", "lonely"],
        "projectTags": ["ep-alpha"],
        "location": "Hong Kong",
    })
    motif_b = _create_motif(client, {
        "audioUrl": "/storage/audio/b.wav",
        "textNote": "harbor demo",
        "moodTags": ["nostalgic", "dreamy"],
        "projectTags": ["ep-beta"],
        "location": "Hong Kong",
    })
    motif_c = _create_motif(client, {
        "audioUrl": "/storage/audio/c.wav",
        "title": "Harbor Remix",
        "textNote": "stitched from earlier sketches",
        "moodTags": [],
        "projectTags": [],
        "location": "",
    })

    from app import db

    with db.connect() as conn:
        conn.execute(
            "UPDATE motifs SET is_remix = 1, source_motif_ids = ? WHERE id = ?",
            (db.dumps([motif_a["id"], motif_b["id"]]), motif_c["id"]),
        )

    relationships = client.get("/api/relationships")
    assert relationships.status_code == 200, relationships.text
    edges = relationships.json()["edges"]

    def pair(x, y):
        return (x, y) if x < y else (y, x)

    expected = {
        pair(motif_a["id"], motif_b["id"]): ("same_location", 0.5),
        pair(motif_a["id"], motif_c["id"]): ("remix", 1.0),
        pair(motif_b["id"], motif_c["id"]): ("remix", 1.0),
    }
    assert len(edges) == 3
    for edge in edges:
        pair = (edge["source"], edge["target"])
        assert pair in expected
        relation_type, strength = expected[pair]
        assert edge["relationType"] == relation_type
        assert edge["strength"] == strength

    # relatedMotifIds 顺序不属于契约(随 id 排序而变,图渲染也不在乎),按集合比较
    detail_a = client.get(f"/api/motifs/{motif_a['id']}")
    assert detail_a.status_code == 200
    assert set(detail_a.json()["relatedMotifIds"]) == {motif_b["id"], motif_c["id"]}

    detail_b = client.get(f"/api/motifs/{motif_b['id']}")
    assert detail_b.status_code == 200
    assert set(detail_b.json()["relatedMotifIds"]) == {motif_a["id"], motif_c["id"]}

    detail_c = client.get(f"/api/motifs/{motif_c['id']}")
    assert detail_c.status_code == 200
    assert set(detail_c.json()["relatedMotifIds"]) == {motif_a["id"], motif_b["id"]}
