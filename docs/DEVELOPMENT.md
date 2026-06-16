# SongGraveyard — 开发文档 (DEVELOPMENT)

> 给即将新建的 GitHub repo 用的技术设计 + 上手指南。
> 团队:Coding A(后端/AI)、Coding B(前端/交互)、UI/UX(视觉/体验)。

---

## 1. 架构总览(解耦三层)

```
[前端/队友]  →  [你们的后端 API]  →  [AI 引擎 endpoint]  +  [预生成池 fallback]
  Next.js        FastAPI(常驻、稳定URL)      ACE-Step 1.5            静态音频文件
```

**核心原则:队友和前端永远只调你们自己的后端,绝不直连 AI 引擎。** 这样 AI endpoint 在背后随便换(Colab / 大卡 pod / SuperPOD),甚至临时断了,后端都能用预生成池兜底返回,对外 URL 不变。

三处 AI 部署各司其职:
| 用途 | 平台 | 模型/任务 | 备注 |
|---|---|---|---|
| **主力持久 endpoint(dev + demo)** | **队友 32GB Apple Silicon Mac**(MLX)+ cloudflared | ghost(cover)+ resurrect/grow(complete/text2music,需 LM) | 免费、不过期、不像 Colab 会断;MLX 比 NVIDIA 慢但够用;LM 用 `pt` 后端 |
| 短期加速(至 6/20 credit 到期) | AWS EC2 g5/g6(24GB,$50 credit) | base + LM + complete | 有公网 IP 可直接做 endpoint;**新账号 GPU 配额需提前申请(审批 1–2 天)**;到期前顺手批量做预生成池 |
| 免费重活批处理 / 最高质量 | **HKUST SuperPOD**(免费 pilot) | base/XL + 4B LM + `complete` | SLURM 批处理;离线;见 `ai/superpod/` |
| 备份 / 早期联调 | Colab 免费 T4 | turbo + `cover` | 已跑通;endpoint 临时、会断、URL 会变 |

---

## 2. 技术栈

**前端**:Next.js + React + Tailwind;React Flow(graph view)、Wavesurfer.js(波形/播放)、Framer Motion(动画)、Zustand(状态,可选)。
**后端**:Python + FastAPI;FFmpeg / pydub(音频处理);SQLite(MVP,够用)+ 本地文件存音频/图片。
**AI**:ACE-Step 1.5(REST API);LLM(标题/墓志铭/prompt 优化/歌词润色,任选 OpenAI/Claude/本地)。
**文生图(Could)**:Flux/SDXL via Replicate,仅精修 case 预生成。

---

## 3. 仓库结构(建议 monorepo)

```
SongGraveyard/
├─ README.md
├─ docs/
│  ├─ PRD.md
│  └─ DEVELOPMENT.md            # 本文件
├─ frontend/                    # Next.js
│  └─ src/
│     ├─ app/                   # / , /create , /motif/[id] , /remix
│     ├─ components/            # MotifGraph, WaveformPlayer, UploadForm,
│     │                         # MotifCard, RemixPanel, ComparefPlayer, Loading
│     └─ lib/api.ts             # 调后端
├─ backend/
│  ├─ app/
│  │  ├─ main.py                # FastAPI 入口
│  │  ├─ api/                   # 路由(见 §4)
│  │  ├─ services/
│  │  │  ├─ acestep.py          # ★ ACE-Step REST 适配器(唯一对接 AI 的地方)
│  │  │  ├─ llm.py              # 标题/墓志铭/prompt/歌词
│  │  │  ├─ audio.py            # ffmpeg/pydub:转码、remix 拼混、normalize
│  │  │  └─ relationships.py    # 规则关联 + 权重
│  │  ├─ models.py              # 数据模型
│  │  └─ db.py                  # SQLite
│  ├─ pregenerated/             # ★ fallback 预生成池(音频 + 元数据 json)
│  └─ storage/                  # 上传与生成的文件
├─ ai/
│  ├─ colab/ACE_Step_Colab_Endpoint.ipynb   # dev 实时 endpoint(已跑通)
│  ├─ superpod/                 # SLURM 批量 + Complete(已给:run_*.slurm / gen_complete.py / download_models.py)
│  └─ prompts/                  # prompt 模板
└─ .env.example
```

---

## 4. 后端 API 设计

所有对外接口由你们的 FastAPI 提供;内部再调 ACE-Step。

| 方法 | 路径 | 作用 | 内部映射 |
|---|---|---|---|
| POST | `/api/upload` | 上传音频/图片 | audio.py 转码统一为 wav |
| POST | `/api/motifs` | 创建动机(含 LLM 生成标题/墓志铭) | llm.py |
| GET | `/api/motifs` | 列出所有动机 | db |
| GET | `/api/motifs/{id}` | 动机详情 | db |
| POST | `/api/motifs/{id}/resurrect` | **主**:复活成完整 demo(body:风格/配器/情绪/可选歌词) | llm 拼 caption → `acestep.complete`(Mac/大卡)或预生成池兜底 |
| POST | `/api/motifs/{id}/grow` | **主**:长成完整曲 | llm 拼 caption → `acestep.text2music + ref_audio` 或兜底 |
| POST | `/api/remix` | 多动机融合(body:motifIds[]) | `audio.merge(A,B)` → `complete` / `text2music+ref` |
| POST | `/api/motifs/{id}/ghost` | 次(情绪小功能):短空灵回声 | `acestep.cover(strength=0.4)`,免费 T4 可跑 |
| GET | `/api/relationships` | 关联网络 | relationships.py |

**异步约定(重要)**:生成接口立即返回 `version_id` + `status=generating`,前端轮询 `GET /api/motifs/{id}` 看 version 状态。后端内部用 ACE-Step 的异步流程(见 §5),并对超时/失败自动回落预生成池(`status` 标 `done` 但来源 cached)。

---

## 5. ACE-Step 适配器(`services/acestep.py`)

ACE-Step 是异步 REST,三步:
1. `POST {BASE}/release_task` → 拿 `task_id`(multipart 上传 `src_audio`,或 text2music 用 `ref_audio`)
2. `POST {BASE}/query_result` `{"task_id_list":[id]}` 轮询直到 `data[0].status==1`
3. `GET {BASE}{result.file}` 下载音频(`result` 是 JSON 字符串,解析后取 `file`)

最小实现(已在 Colab 验证通):
```python
import requests, json, time

def _gen(base, src_path, *, task_type, file_field="src_audio", prompt="", lyrics="",
         strength=0.8, duration=90, steps=48, thinking=True, fmt="mp3"):
    data = {"task_type": task_type, "prompt": prompt, "lyrics": lyrics,
            "audio_cover_strength": str(strength), "audio_duration": str(duration),
            "inference_steps": str(steps), "thinking": "true" if thinking else "false",
            "batch_size": "1", "audio_format": fmt}
    with open(src_path, "rb") as f:
        tid = requests.post(f"{base}/release_task", data=data,
                            files={file_field: f}, timeout=300).json()["data"]["task_id"]
    while True:
        item = requests.post(f"{base}/query_result",
                 json={"task_id_list":[tid]}, timeout=180).json()["data"][0]
        if item["status"] == 1:
            res = json.loads(item["result"])[0]
            return requests.get(base + res["file"], timeout=300).content
        if item["status"] == 2: raise RuntimeError("gen failed")
        time.sleep(3)

# 主:复活成完整 demo —— 续写(需 LM,Mac/大卡)
def resurrect(base, p, caption, lyrics=""):
    return _gen(base, p, task_type="complete", prompt=caption, lyrics=lyrics,
                strength=0.8, duration=90, steps=48)

# 主:长成完整曲 —— LM 规划曲式 + 动机做风格引导(需 LM)
def grow(base, p, caption, lyrics=""):
    return _gen(base, p, task_type="text2music", file_field="ref_audio",
                prompt=caption, lyrics=lyrics, strength=0.3, duration=120, steps=48)

# 次:短空灵回声(cover,跳过 LM,免费 T4 可跑)
def ghost(base, p):
    return _gen(base, p, task_type="cover", strength=0.4, duration=20, steps=8, thinking=False,
                prompt="ghostly ambient, fragile, reverb-heavy, dreamy")
```
`BASE` 来自环境变量(见 §7),便于在 Mac/Colab/SuperPOD/pod 间切换。**ghost 走 cover 不需 LM;resurrect/grow 走 complete/text2music 需 LM(Mac/SuperPOD/大卡),现场建议优先用预生成池。适配器内部要做:超时/502 重试 + 失败回落预生成池。**

---

## 6. LLM 用法(`services/llm.py`)
- 生成**标题 / 墓志铭 / 情绪标签**(动机创建时)
- 把 Resurrect 页的**风格/配器/情绪按钮 + 用户文字 → 拼成 ACE-Step 的 caption**(prompt 优化)
- (可选)润色/补全歌词
- 全部要有**模板兜底**(LLM 超时就用模板),不阻塞主流程。

---

## 7. 环境变量(`.env.example`)
```
# 后端
DATABASE_URL=sqlite:///./storage/app.db
STORAGE_DIR=./storage
PREGEN_DIR=./pregenerated

# AI 引擎(切换部署只改这一行)
ACESTEP_BASE_URL=https://xxxx.trycloudflare.com   # Colab 实时 / 或 pod 公网 URL
ACESTEP_API_KEY=                                   # 若 server 开了鉴权

# LLM / 文生图(可选)
LLM_API_KEY=
IMAGE_API_KEY=
```

---

## 8. 上手 / 运行

**Coding A(后端 + AI)** —— 需 Python 3.11+(系统默认 `python3` 可能是 3.7,跑不了;务必用 `python3.11`)
```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# 装 ffmpeg(系统级:macOS `brew install ffmpeg`)
cp ../.env.example ../.env        # 填 ACESTEP_BASE_URL,按需设 GENERATION_MODE
uvicorn app.main:app --reload     # http://localhost:8000  (/health 自检)
pytest                            # 跑后端测试
```
AI 引擎:**主力用队友 32GB Mac** 起 `acestep-api`(macOS/MLX,LM 用 `pt` 后端)+ cloudflared 暴露公网 URL,填进 `.env` 的 `ACESTEP_BASE_URL`(持久、能跑 complete)。早期/备份可用 `ai/colab/ACE_Step_Colab_Endpoint.ipynb`;大批量预生成走 `ai/superpod/`;EC2 $50 可在 6/20 前加速并批量预生成。

**Coding B(前端)** —— 脚手架已就绪,直接装依赖
```bash
cd frontend
npm install
cp .env.local.example .env.local  # NEXT_PUBLIC_API_BASE=http://localhost:8000
npm run dev                       # http://localhost:3000
# lib/api.ts 里 BASE = 后端地址,不直连 ACE-Step
```

**UI/UX**:产出 graph node / motif card / loading 动画 / 详情页视觉规范,喂给 B;先出流程图与信息架构。

---

## 9. 预生成池(fallback,务必做)
现场不赌实时生成。用 SuperPOD 批量为 ≥3 个 demo case 生成 ghost/resurrect/grow/remix 各版本,放 `backend/pregenerated/`,配 `index.json` 映射 `motif_id → version → file`。后端生成接口超时/失败时直接返回对应 cached 文件,前端显示 "using cached generation"。

---

## 10. 12 天计划(三人并行)

| 天 | Coding A(后端/AI) | Coding B(前端) | UI/UX |
|---|---|---|---|
| 1 | 锁定 API 契约;Colab endpoint 跑通(✅已通) | 项目脚手架 | 流程图+信息架构 |
| 2–3 | upload + 创建 motif + SQLite + acestep 适配器 | 上传流程 + 列表 | wireframe |
| 4–5 | relationships 规则+权重接口 | Graph view + 进详情 | 高保真视觉 |
| 6–7 | resurrect(complete)+ ghost 接口 + 异步 + fallback | 详情页 + 波形 + 对比播放器 | 动画/组件规范 |
| 8 | remix(ffmpeg 拼混 → complete/text2music) | Remix 交互 | Remix 台视觉 |
| 9 | SuperPOD 批量预生成池 + Grow(text2music+ref) | loading + 打磨 | 墓地视觉打磨 |
| 10 | fallback 接好;稳定性 | 联调修 bug | demo case 视觉 |
| 11 | demo 当天 endpoint(队友 Mac,预热)+ 彩排 | — | pitch deck + demo video |
| 12 | 修 bug、压缩提交、检查链接、彩排 | | |

---

## 11. 约束与决策记录(给后来者)
- **AI 引擎 = ACE-Step 1.5**(MIT,可商用,快,支持人声/纯器乐)。替代了最初设想的 AudioX(非商用+水印+慢)与 MusicGen(纯器乐)。
- **输入是短动机(非完整曲),核心生成不是 Cover**:**Resurrect = `complete`(续写)**、**Grow = `text2music`+参考音频(完整曲式)**,均需 LM,免费 T4 会 OOM → 放 **32GB Mac** / SuperPOD / 24GB+ 卡。
- **Ghost = `cover`(低 strength)**,是次要情绪小功能:**Cover 输出≈源长度、不发展**,但跳过 LM、免费 T4 可跑,适合做"短而残缺的回声"。
- **部署主力 = 队友 32GB Apple Silicon Mac(MLX)+ cloudflared**:免费、持久、不像 Colab 会断,且能跑 `complete`(免费 Colab T4 做不到)。EC2 $50 仅作 6/20 credit 到期前的短期加速(新账号 GPU 配额要立刻申请);SuperPOD 做大批量预生成;Colab 作备份。
- **Remix = 先 ffmpeg/pydub 合并 A+B,再走 `complete` / `text2music+ref`**(ACE-Step 无双源融合;Lego 是"给一条轨加层"且未成熟,不用)。
- **Colab 配置坑(已解)**:子进程要 `MPLBACKEND=Agg`;免费 T4 要 `ACESTEP_INIT_LLM=false` + `OFFLOAD_TO_CPU=false`(否则加载 1.7B LM 撑爆系统 RAM,退出码 137)+ 请求 `batch_size=1`。
- **环境音输入**走"转情绪描述喂 prompt",不走旋律跟随。
- **画面 = A+B**:页面排版为主 + 精修 case 用文生图(预生成)。
- **部署解耦**:队友只调你们后端;AI endpoint 可切换;预生成池兜底。
