# SongGraveyard — 阶段交接(给队友 / UI-UX)

> 日期:2026-06-17 · 本轮由 Claude 主导规划 + Codex 执行,完成 MVP 6 个垂直切片。
> 进度看板 + 冻结 API 契约见 [`PROGRESS.md`](PROGRESS.md);本文件是"我今天做到哪、你接着做什么"的速览。

---

## 1. 现在能跑通的闭环

上传动机 → 成为墓地 graph 节点 → 进详情 → ghost / resurrect / grow / remix(异步生成 + 轮询 +
原始/生成对比试听 + cached 兜底标识)。后端 9 个 pytest 全绿,前端 lint + build 全绿。

**前后端契约已冻结**,可并行开发,不要私改(改先动 `PROGRESS.md` §3)。

---

## 2. 已完成(done)

### 后端(FastAPI · SQLite · 三层解耦)
| 接口 | 说明 |
|---|---|
| `GET /health` | 自检(含当前 GENERATION_MODE) |
| `POST /api/upload` | 音频转码 wav + 可选图片,返回相对 URL |
| `POST /api/motifs` / `GET /api/motifs` / `GET /api/motifs/{id}` | 动机 CRUD,详情含 versions + relatedMotifIds |
| `POST /api/motifs/{id}/ghost\|resurrect\|grow` | 异步生成,立即返回 `versionId+generating` |
| `POST /api/remix` | 多动机合并 → 新节点 + 生成 |
| `GET /api/relationships` | 规则关联(同 mood/project/location + remix 血缘) |

- **异步核心** `services/generation.py`:`BackgroundTask`,`GENERATION_MODE = auto/cached/live`,
  实时失败/超时**回落 `pregenerated/`**,done 后置 motif 状态 + weight+1。
- **AI 只经 `services/acestep.py`**(ghost=cover / resurrect=complete / grow=text2music+ref);
  地址从 env `ACESTEP_BASE_URL` 读。
- `audio.py`(转码/时长/remix 合并)、`relationships.py`(规则+strength)。

### 前端(Next.js App Router · Tailwind · React Flow · Wavesurfer)
- `/` 墓地 graph(节点∝weight、按关系上色、点击进详情)
- `/create` 录入(文件上传 + 图片 + 文字 + tags)
- `/motif/[id]` 详情(视觉头 + 原始波形 + AI actions + 版本对比 + 2s 轮询)
- `/remix` 多选≥2 + direction → 新节点
- `lib/api.ts`(唯一后端客户端,只调后端)+ `lib/types.ts`(契约类型)
- 组件:`WaveformPlayer`、`MotifGraph`

---

## 3. 还没做 / 待办(TODO)

按优先级:

### 🔴 P0 — demo 前必须
1. **预生成池(`backend/pregenerated/`)** —— 现在是空的!`cached` 模式 / 实时失败时**没有兜底音频**,
   只会标 `failed`(不崩但没声音)。需要:≥3 个 demo case × ghost/resurrect/grow/remix 的预生成音频
   + `index.json`(结构见 `PROGRESS.md` §3 末尾)。**这是现场稳定性的命门**(PRD §9 Must / §11)。
2. **接一个真实 ACE-Step endpoint** —— 把队友 32GB Mac(或 Colab)的 cloudflared URL 填进
   `.env` 的 `ACESTEP_BASE_URL`;目前实时生成链路代码完整但**没对着真实 AI 跑通过**(测试里是 mock)。

### 🟠 P1 — 体验完整度
3. **真实 LLM**(`services/llm.py`):标题/墓志铭/caption 现在是**模板随机桩**(`_llm_complete` 恒返回 None)。
   接 OpenAI/Claude(失败要回落模板,别阻塞主流程)。
4. **录音 UI**:`/create` 现在只支持选文件;PRD 要"手机录音/哼唱"——需浏览器录音(MediaRecorder)。
5. **生成版本的下载 / 收藏**:PRD §4.4 详情页要下载/收藏,目前只播放。
6. **graph 筛选 / 搜索**:PRD §4.3,目前无。

### 🟡 P2 — Could / 远期
7. 文生图配图(预生成)、语音转文字、BPM/key、embedding 相似度关联、分享卡片。

---

## 4. 给前端 / 另一位 coding 队友

- **API 都就绪**,直接用 `lib/api.ts`(已类型化)。新页面/组件照搬现有风格即可。
- 可接的活:录音组件、下载/收藏、graph 筛选搜索、loading 动画接入、移动端布局。
- **铁律**:前端只调后端,绝不直连 AI;契约改动先改 `PROGRESS.md`。
- 想接 LLM/真实 AI 的话看 §3 的 P0/P1。

## 5. 给 UI/UX 队友

- **现有视觉基线**(可直接迭代):暗黑墓园基调,Tailwind 色板在 `frontend/tailwind.config.ts`
  的 `grave.*`(bg/panel/border/ghost/moss/warm/rebirth)。
- 已搭好但**需要你精修**的界面:
  - 墓地 graph 节点造型 / 连线 / hover 卡片(`components/MotifGraph.tsx`)
  - 详情页视觉头 + 波形 + 版本对比卡(`app/motif/[id]/page.tsx`)
  - Remix"复活仪式台"(`app/remix/page.tsx`)—— 目前是朴素选择表
- **还缺、最需要你的产出**:生成中的 loading/"召唤"动画、≥3 个 demo case 的视觉(配图/排版)、
  移动端录入流程、整体动效规范(Framer Motion 已装)。
- 风格关键词(PRD §8):dark poetic / dreamy / melancholic / **非恐怖**,memory & rebirth。

---

## 6. 怎么把它跑起来看

```bash
# 后端(需 python3.11;系统默认 python3 可能是 3.7 跑不了)
cd backend && python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt          # 需系统装 ffmpeg
cp ../.env.example ../.env
uvicorn app.main:app --reload            # localhost:8000

# 前端
cd frontend && npm install
cp .env.local.example .env.local
npm run dev                              # localhost:3000
```

> 只想看 UI:上传 / graph / 详情都能跑。**生成**需要 §3 的 ACE-Step endpoint;
> 想本地看到"出声"可临时:放几个音频进 `backend/pregenerated/` + 写 `index.json`,
> 并设 `GENERATION_MODE=cached`。

详细技术设计见 [`DEVELOPMENT.md`](DEVELOPMENT.md),产品定义见 [`PRD.md`](PRD.md)。
