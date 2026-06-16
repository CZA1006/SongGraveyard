# SongGraveyard — 实施进度 & API 契约(锁定版)

> 本文件是 **MVP 垂直切片** 的进度看板 + **冻结的请求/响应 schema**。
> 与 `DEVELOPMENT.md §4`(路由总表)、`PRD.md §6`(数据结构)互补,冲突以 docs 的更新为准。
> 改契约前先改本文件 + 对应 docs,再动代码(AGENTS 铁律)。

最后更新:2026-06-17

---

## 1. 切片进度

| # | 切片 | 后端 | 前端 | 测试 | 状态 |
|---|---|---|---|---|---|
| 0 | 地基(config/db/models/CORS/静态挂载) | ✅ | ✅ api.ts+types | ✅ 启动+health | **done** |
| 1 | upload + motif CRUD | ✅ | ✅ `/create`、`/` 列表、`/motif/[id]` 最小版 | ✅ pytest 2 passed | **done** |
| 2 | graph 规则关联 + 权重 | ✅ relationships.py、`GET /relationships` | ✅ React Flow graph | ✅ | **done** |
| 3 | 详情页 | (复用 GET 详情) | ⬜ 视觉头/波形/AI actions/对比 | ⬜ | todo |
| 4 | ghost 生成(异步 + pregen 回落) | ⬜ BackgroundTask + 回落 + ghost 路由 | ⬜ 按钮+轮询+ComparePlayer | ⬜ | todo |
| 5 | resurrect + grow | ⬜ 复用异步框架 | ⬜ 风格/配器/情绪/歌词 UI | ⬜ | todo |
| 6 | remix(ffmpeg 合并 → 新节点) | ⬜ audio.merge → 生成 | ⬜ `/remix` | ⬜ | todo |

---

## 2. 关键决策(已锁定)

- **生成模式** `GENERATION_MODE = auto | cached | live`(env,默认 `auto`)。代码三模式都支持;**彩排/demo 当天切 `cached`**。ghost 不受限,默认实时短 cover。
- **异步** 用 FastAPI `BackgroundTasks`(进程内,无 Celery)。生成接口立即返回 `versionId + status=generating`,前端轮询 `GET /api/motifs/{id}`。
- **回落顺序**:实时失败/超时 → `pregenerated/index.json` 的 `motif_id→type` → `_default→type` → 否则 `status=failed`。
- **Remix** 支持 ≥2 个动机;产出**新 motif 节点**(`isRemix=true`、`sourceMotifIds`),关系连回所有源。
- **weight** 不在 GET 详情自增(会被轮询虚高);由**生成次数**驱动(切片 4)。
- **错误响应**统一 `{ "error": { "code", "message" } }`。
- **后端 Python 3.11+**;系统默认 `python3` 可能是 3.7,务必 `python3.11 -m venv .venv`。

---

## 3. 冻结的 API 契约

> 所有时间 ISO8601。资源 URL 为相对路径(`/storage/..`、`/pregenerated/..`),前端用 `resolveAsset()` 补全。
> 错误统一:`{ "error": { "code": str, "message": str } }`。

### POST `/api/upload`  (multipart/form-data)  ✅
```
req:  audio=<file 必填>  image=<file 可选>
res:  { "audioUrl": "/storage/audio/ab12.wav",
        "imageUrl": "/storage/images/ab12.jpg" | null,
        "durationSec": 14.2 }
```

### POST `/api/motifs`  (json)  ✅
```
req:  { "audioUrl": str(必填), "imageUrl"?: str, "textNote"?: str,
        "location"?: str, "moodTags"?: [str], "projectTags"?: [str], "title"?: str }
res:  Motif(完整,见下)        // title/epitaph 缺省时 llm.py 生成(模板兜底)
```

### GET `/api/motifs`  ✅
```
res:  { "motifs": [ MotifSummary ] }
MotifSummary = { id,title,epitaph,imageUrl,status,weight,
                 moodTags:[str],projectTags:[str],location,createdAt }
```

### GET `/api/motifs/{id}`  ✅(轮询目标)
```
res:  Motif {
        id,title,epitaph,audioUrl,imageUrl,textNote,createdAt,location,
        moodTags:[str], projectTags:[str], status, weight,
        isRemix:bool, sourceMotifIds:[str], relatedMotifIds:[str],
        versions:[ Version ] }
Version = { id, type:("ghost"|"resurrect"|"grow"|"remix"),
            status:("generating"|"done"|"failed"),
            audioUrl|null, source:("live"|"cached")|null,
            params:{}, error:str|null, createdAt, completedAt|null }
```

### POST `/api/motifs/{id}/resurrect`  (json)  ⬜ 切片5
```
req:  { "style"?: str, "instruments"?: [str], "mood"?: str, "lyrics"?: str, "duration"?: int }
res:  202 { "versionId": "ver_x", "status": "generating" }
```

### POST `/api/motifs/{id}/grow`  (json)  ⬜ 切片5  —— 同 resurrect 形状,内部 acestep.grow()

### POST `/api/motifs/{id}/ghost`  (json)  ⬜ 切片4
```
req:  { "duration"?: int }     // 默认 20s
res:  202 { "versionId": "ver_x", "status": "generating" }   // 成功后 motif.status→"ghosted"
```

### POST `/api/remix`  (json)  ⬜ 切片6
```
req:  { "motifIds": [str](≥2), "direction"?: str }
res:  202 { "motifId": "motif_new", "versionId": "ver_x", "status": "generating" }
```

### GET `/api/relationships`  ✅ 切片2
```
res:  { "edges": [ { "source":str, "target":str,
                     "relationType":"same_mood"|"same_project"|"same_location"|"remix",
                     "strength":0.0~1.0 } ] }
```

### 预生成池 `backend/pregenerated/index.json`
```jsonc
{ "motif_001": { "ghost":"g1.mp3","resurrect":"r1.mp3","grow":"gr1.mp3" },
  "_default":  { "ghost":"gdef.mp3","resurrect":"rdef.mp3","grow":"grdef.mp3" } }
```
