"""集中读取环境变量与路径。所有可调项只从这里取,便于切换部署。"""
import os
from pathlib import Path

# backend/ 目录(本文件在 backend/app/config.py)
BACKEND_DIR = Path(__file__).resolve().parent.parent

STORAGE_DIR = Path(os.environ.get("STORAGE_DIR", BACKEND_DIR / "storage")).resolve()
PREGEN_DIR = Path(os.environ.get("PREGEN_DIR", BACKEND_DIR / "pregenerated")).resolve()
DB_PATH = Path(os.environ.get("DB_PATH", STORAGE_DIR / "app.db")).resolve()

AUDIO_DIR = STORAGE_DIR / "audio"
IMAGE_DIR = STORAGE_DIR / "images"
GENERATED_DIR = STORAGE_DIR / "generated"

# 生成模式:auto=先实时失败回落 / cached=直接预生成池 / live=只实时
GENERATION_MODE = os.environ.get("GENERATION_MODE", "auto").lower()

# 允许的前端来源(CORS),逗号分隔;默认放开本地开发常用端口
CORS_ORIGINS = os.environ.get(
    "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
).split(",")


def ensure_dirs() -> None:
    for d in (STORAGE_DIR, AUDIO_DIR, IMAGE_DIR, GENERATED_DIR, PREGEN_DIR):
        d.mkdir(parents=True, exist_ok=True)
