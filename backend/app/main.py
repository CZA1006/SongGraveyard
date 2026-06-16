"""SongGraveyard 后端入口。
队友/前端只调本服务;本服务再调 AI 引擎(见 services/acestep.py)。"""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import config, db
from .api import motifs

app = FastAPI(title="SongGraveyard API")


# 统一错误响应:{ "error": { "code", "message" } }(对齐 API 契约)
@app.exception_handler(StarletteHTTPException)
async def _http_exc(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": f"http_{exc.status_code}", "message": str(exc.detail)}},
    )


@app.exception_handler(RequestValidationError)
async def _validation_exc(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "validation_error", "message": str(exc.errors())}},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 建目录 + 建表(目录需在挂载静态前存在)
db.init_db()

# 静态文件:上传/生成的音频图片 + 预生成池
app.mount("/storage", StaticFiles(directory=str(config.STORAGE_DIR)), name="storage")
app.mount("/pregenerated", StaticFiles(directory=str(config.PREGEN_DIR)), name="pregenerated")

app.include_router(motifs.router)


@app.get("/health")
def health():
    return {"status": "ok", "generationMode": config.GENERATION_MODE}
