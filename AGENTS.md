# AGENTS.md — SongGraveyard

AI 音乐创作工具:把未完成的音乐**动机**(哼唱/乐器/歌词片段)存档、关联,并用 ACE-Step 1.5 复活/发展。
完整背景见 `docs/PRD.md` 与 `docs/DEVELOPMENT.md`。**本文件是给 agent 的精简约定,冲突以本文件为准。**

## Agent 分工(本项目的 vibe coding)
- **Claude**:整体规划、架构与代码方向、任务拆解、跨模块决策。先出方案,再交给 Codex 执行。
- **Codex**:按方案写具体代码、补细节、做 review/检查、跑测试。动手前先读本文件与相关模块。

## 技术栈(具体)
- 后端:Python 3.11+ · FastAPI · Uvicorn · SQLite · FFmpeg/pydub
- 前端:Next.js(App Router)· React · TypeScript · Tailwind · React Flow · Wavesurfer.js
- AI:ACE-Step 1.5 REST API(异步)

## 常用命令
- 后端:`cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`
- 前端:`cd frontend && npm install && npm run dev`
- 测试/lint:后端 `pytest`(待补);前端 `npm run lint`

## 架构铁律(DO)
- 解耦三层:前端 → 后端 API → AI 引擎。**前端只调后端;后端只通过 `backend/app/services/acestep.py` 调 AI。**
- AI 引擎地址只从环境变量 `ACESTEP_BASE_URL` 读,**不硬编码**。
- 生成接口走**异步**:立即返回 `version_id` + `status=generating`;失败/超时**回落 `backend/pregenerated/`**。
- 所有 ACE-Step 调用都用适配器里的 `resurrect()/grow()/ghost()`,不在别处自行拼 `release_task`。
- 路由放 `app/api/`,业务逻辑放 `app/services/`。

## 功能 → ACE-Step 任务映射(要改先更新 docs/PRD.md §3.3,不要擅自改)
- **Resurrect(主)= `complete`**(续写,需 LM)
- **Grow(主)= `text2music` + 参考音频(`ref_audio`)**
- **Remix(主)= ffmpeg 拼/混 A+B → complete/text2music**
- **Ghost(次)= `cover`(低 strength,短;免费 T4 可跑)**

## 绝不(NEVER)
- 不把模型/权重塞进后端进程(后端只调远程 endpoint)。
- 不提交 `.env`/密钥/音频/模型权重(见 `.gitignore`)。
- 不在未同步 docs 的情况下改 API 契约(DEVELOPMENT §4)或数据结构(PRD §6)。
- 不用 mock 假数据冒充真实 ACE-Step 输出而不显式标注。

## 需要先确认(ASK)
引入新依赖、改 API 契约、改数据结构、改功能→任务映射、改部署方式 → 先与人/Claude 确认。
