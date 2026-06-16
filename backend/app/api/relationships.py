"""关系图路由。"""
from fastapi import APIRouter

from .. import db
from ..services.relationships import compute_edges

router = APIRouter(prefix="/api", tags=["relationships"])


@router.get("/relationships")
def get_relationships():
    with db.connect() as conn:
        motifs = conn.execute("SELECT * FROM motifs ORDER BY id ASC").fetchall()
    return {"edges": compute_edges(motifs)}
