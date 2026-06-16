"""pytest 共享配置。"""
import importlib
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))


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
    from app.api import relationships as rel
    importlib.reload(rel)
    from app import main
    importlib.reload(main)

    from fastapi.testclient import TestClient
    return TestClient(main.app)
