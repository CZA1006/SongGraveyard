# SongGraveyard 🎧🪦

> 废弃灵感墓地 —— 让每一个没写完的音乐灵感拥有第二次生命。
> TME AI Hackathon 项目。
>
> 仓库:https://github.com/CZA1006/SongGraveyard

把未完成的音乐动机(哼唱 / 旋律 / 歌词 / demo / 乐器片段 / 环境音 + 时间、地点、情绪、图片)
"埋进"墓地,系统把它们变成可浏览、可关联、可复活的节点,并用 AI 把它们发展成新的版本。
与 Suno 的区别:Suno 从 prompt 生歌;SongGraveyard 从创作者**自己的废弃素材**出发。

## 文档
- 产品需求:[`docs/PRD.md`](docs/PRD.md)(Word:`docs/PRD.docx`)
- 开发文档:[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)(Word:`docs/DEVELOPMENT.docx`)
- **进度看板 + 冻结的 API 契约**:[`docs/PROGRESS.md`](docs/PROGRESS.md)

## 目录结构
```
SongGraveyard/
├─ docs/                 # PRD / 开发文档(md + docx)
├─ frontend/             # Next.js App Router(已脚手架:/、/create、/motif/[id])
├─ backend/              # FastAPI
│  ├─ app/api/           # 路由(upload + motif CRUD 已就绪)
│  ├─ app/services/      # acestep.py(AI 唯一出口)/ llm.py / audio.py
│  └─ tests/             # pytest
├─ ai/
│  ├─ colab/             # 免费 T4 实时 endpoint(已跑通,做 ghost/dev)
│  ├─ superpod/          # SLURM 批处理 + complete/text2music(做 resurrect/grow/预生成池)
│  └─ prompts/           # prompt 模板
├─ AGENTS.md / CLAUDE.md   # 给 AI agent(Codex/Claude)的约定
├─ .env.example
└─ README.md
```

## 快速开始
**后端**(需 Python 3.11+;系统默认 `python3` 可能是 3.7,务必用 `python3.11`)
```bash
cd backend
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # 填好 ACESTEP_BASE_URL、按需设 GENERATION_MODE
uvicorn app.main:app --reload          # http://localhost:8000  (/health 自检)
pytest                                  # 跑后端测试
```
**前端**(脚手架已就绪,直接装依赖)
```bash
cd frontend
npm install
cp .env.local.example .env.local        # NEXT_PUBLIC_API_BASE=http://localhost:8000
npm run dev                             # http://localhost:3000
```
**AI 引擎(三选一,见 DEVELOPMENT §1)**
- 主力:队友 32GB Mac 起 `acestep-api`(MLX)+ cloudflared → 公网 URL 填进 `.env`
- 批量/最高质量:`ai/superpod/`(HKUST SuperPOD)
- 备份/早期:`ai/colab/ACE_Step_Colab_Endpoint.ipynb`(免费 T4)

## 功能 → ACE-Step 任务(简表,详见 PRD §3.3)
| 功能 | 主/次 | 任务 |
|---|---|---|
| Resurrect(复活成完整 demo) | 主 | `complete` |
| Grow(长成完整曲) | 主 | `text2music` + 参考音频 |
| Remix(多动机融合) | 主 | 拼/混 A+B → complete/text2music |
| Ghost(空灵回声,短) | 次 | `cover`(低 strength) |

## 团队
Coding A(后端/AI)· Coding B(前端/交互)· UI/UX(视觉/体验)

## License
MIT(见 `LICENSE`)。注:AI 引擎 ACE-Step 1.5 为 MIT,可商用。
