# SongGraveyard — 产品需求文档 (PRD)

> 废弃灵感墓地:未完成音乐动机的存档、关联、复活与再创作工具
> 版本:v2(TME AI Hackathon 开发版,已并入技术选型与架构决策)

---

## 1. 产品概述

**产品名**:SongGraveyard / 废弃灵感墓地

**一句话**:SongGraveyard gives every unfinished music idea a second life. (让每一个没写完的音乐灵感拥有第二次生命。)

**定位**:面向音乐创作者的 AI 创作工具,帮助用户保存、管理、关联、并重新发展未完成的音乐动机(哼唱 / 旋律 / 歌词 / demo / 乐器片段 / 环境音 + 时间、地点、情绪、图片)。

**与 Suno 的核心区别**:Suno 从 prompt 生成歌曲;SongGraveyard 从创作者**自己的废弃素材**出发,把它们存档、关联、复活,长期沉淀成创作者的灵感资产,有利于发展成 EP / 概念专辑。

---

## 2. 目标用户

1. 新人音乐人:常用手机录旋律/哼唱,缺编曲能力,需要把片段快速变 demo。
2. 独立 / 校园创作者:有创作力但灵感分散,需要项目化管理与发展副歌/bridge。
3. 普通音乐爱好者:录生活声音与只言片语,希望低门槛、情绪化地变成音乐。
4. (远期)TME 平台创作者:从灵感 → demo → 作品草稿,接入创作社区与孵化。

---

## 3. 核心概念与 AI 引擎

### 3.1 动机 Motif
一段未完成的音乐素材 + 上下文。输入类型:
- **哼唱 / 弹唱**(有旋律,主力场景)
- **钢琴 / 吉他等乐器片段**(旋律+和声更清晰,效果通常比哼唱更好)
- **环境音**(无旋律 → 不走"跟随旋律",而是转成情绪/氛围描述喂 prompt)
- 配套:图片、文字、时间、地点、情绪标签、项目分类

动机一般很短(如 4 bars / ~10–20s)。

### 3.2 AI 引擎:ACE-Step 1.5(本轮关键选型)
经评估,主力模型从最初设想的 AudioX/MusicGen 改为 **ACE-Step 1.5**:
- **开源、MIT 许可、可商用**(解决 AudioX 的非商用 + 水印限制,利于 TME 落地叙事)
- **快**:A100 <2s、RTX 3090 <10s 出一首完整歌;质量介于 Suno v4.5 与 v5 之间
- **支持人声 + 歌词**(歌词由用户提供),也支持纯器乐;50+ 语言含中文
- 任务类型:`text2music` / `cover` / `repaint` / `lego` / `extract` / `complete`
- 模型档:`turbo`(快、质量很高、支持 cover/repaint)、`base`(支持全部任务含 complete、步数多)、`XL`(质量更高);LM 档 0.6B/1.7B/4B(复制旋律能力 弱/中/强)

### 3.3 功能 → ACE-Step 任务映射(核心设计)
| 产品功能 | 主/次 | ACE-Step 任务 | 关键参数 | 说明 |
|---|---|---|---|---|
| **Resurrect**(复活成完整 demo) | **主** | `complete` | base/XL + LM,`steps 32–64`,`duration 长` | 接着动机往下长,最忠实你的和弦/旋律。需 LM(Mac/SuperPOD/大卡) |
| **Grow into full piece**(长成完整曲) | **主** | `text2music` + 参考音频 | 动机作 `ref_audio`,LM,`duration 自由` | LM 规划完整曲式,动机做风格/情绪引导;旋律不严格跟随但更像成品歌 |
| **Remix**(多动机融合) | 主 | 先 ffmpeg/pydub 把 A+B 拼/混成一条 → `complete` / `text2music+ref` | — | ACE-Step 无原生双源融合;Lego 不适配且未成熟 |
| **Ghost**(空灵回声) | 次(情绪小功能) | `cover` | `strength≈0.4`,短(15–30s) | 故意"短、残缺、未完成感"的情绪变体。Cover 跳过 LM、免费 T4 可跑;**不发展、不变长** |

> ⚠️ 重要边界:输入是**短动机片段(非完整曲)**,所以核心生成走 `complete` / `text2music+ref`(能发展、能变长)。**Cover 输出贴着源长度、不发展**,仅用于次要的短 Ghost 回声。

---

## 4. 核心功能(MVP)

### 4.1 Capture / Bury(动机录入)
上传/录制音频 + 图片 + 文字 + tags(情绪/项目/地点),系统自动生成标题、墓志铭(LLM),存入 Graveyard,生成动机卡片。

### 4.2 Motif Card(动机卡片)
标题、墓志铭、时间地点、情绪标签、原始音频播放器、图片、状态(Buried/Ghosted/Resurrected)、权重(随点击/停留/生成次数变化)。

### 4.3 Graveyard Homepage(动机关系网络)
类 Obsidian Graph View 的节点网络。MVP 用**规则关联**(同 tag / 同地点 / 同项目 / 曾被一起 remix → 连线;点击越多节点越大)。后续再接 embedding 相似度。交互:hover 预览、点击进详情、多选进 remix、筛选/搜索。

### 4.4 Motif Detail / Memory Page
顶部视觉区(背景图+墓志铭)、Original(波形+音频+文字+图片)、Related Motifs、AI Actions(Summon Ghost / Resurrect / Grow / Remix)、Generated Versions(对比播放/下载/收藏)。

### 4.5 生成功能
Ghost / Resurrect / Grow / Remix —— 按 §3.3 映射调用 ACE-Step。**主力是 Resurrect(complete)与 Grow(text2music+ref);Ghost 为可选情绪小功能。** 每次生成存为该动机的一个 version 分支。

### 4.6 "画面"(本轮决策:A+B 混合)
- **A(主)**:用用户上传的照片 + 文字 + 波形排版成沉浸式记忆页(纯前端/设计,零模型成本)。
- **B(精修 case)**:1–2 个 demo 用文生图(Flux/SDXL)按 mood/地点生成配图,**预生成、不实时**。

---

## 5. 用户流程(核心)

上传哼唱/乐器动机 + 图片 + 一句话 → 系统生成标题/墓志铭 → 成为墓地节点 → 点节点进详情 → Summon Ghost → Resurrect(选风格/配器/情绪 + 可选歌词)→ 对比 original/ghost/resurrected → 保存。
多动机:多选两个同源动机 → Remix Together → 选融合方向 → 生成新节点并与原动机相连。

---

## 6. 数据结构

```jsonc
// Motif
{
  "id": "motif_001",
  "title": "Midnight Humming",
  "epitaph": "A chorus that never found its song.",
  "audioUrl": "/audio/original_001.wav",
  "imageUrl": "/images/memory_001.jpg",
  "textNote": "...",
  "createdAt": "2026-06-16T21:30:00",
  "location": "Hong Kong",
  "moodTags": ["nostalgic","lonely"],
  "projectTags": ["night walk"],
  "status": "buried",          // buried | ghosted | resurrected
  "weight": 12,
  "relatedMotifIds": ["motif_002"],
  "versions": [
    {
      "id": "ver_001",
      "type": "ghost",                       // ghost | resurrect | grow | remix
      "audioUrl": "...",
      "params": {"task":"cover","strength":0.4},
      "status": "done",                      // generating | done | failed
      "source": "live",                      // live | cached(预生成池回落)
      "error": null,                          // failed 时的原因,否则 null
      "createdAt": "...",
      "completedAt": "..."                   // done/failed 时填,否则 null
    }
  ]
}
// Relationship
{ "source":"motif_001", "target":"motif_002", "relationType":"same_mood", "strength":0.82 }
```
> Version 字段说明(配合异步生成与 fallback):
> - `status: generating|done|failed` —— 生成接口立即返回 `generating`,前端轮询详情看状态。
> - `source: live|cached` —— `cached` 表示实时失败/超时后回落 `backend/pregenerated/`,前端显示 "using cached generation"。
> - `id / error / completedAt` —— 异步追踪所需的增量字段。

---

## 7. 页面结构
- Web:`/`(Graveyard 网络)、`/create`(录入)、`/motif/{id}`(详情)、`/remix`
- 手机:聚焦录入 workflow(录音 + 拍照 + 语音输文字 + 一键 bury + 查看结果),graph 可简化成列表/卡片

---

## 8. UI/UX 方向
关键词:dark poetic / digital graveyard / music memory / dreamy / melancholic /**非恐怖**。
配色:深黑/暗蓝黑底 + 幽灵蓝/雾绿/暖白点缀;生成结果可用更亮的 rebirth 色。
Homepage 像"音乐星图/灵感墓园";Detail 像"音乐记忆页";Remix 像"复活仪式台"。

---

## 9. MVP 范围
**Must**:音频/图片/文字上传、创建 motif、卡片、Graph view、详情页、播放器、**Resurrect(complete,现场可用预生成池兜底)**、original/generated 对比、≥3 个预生成 demo case。
**Should**:**Grow(text2music+ref)**、**Ghost(短 cover 情绪回声)**、Remix、节点权重、tag 关联、生成 loading 动画、标题/墓志铭自动生成、风格选择按钮。
**Could**:地图视图、语音转文字、BPM/key 识别、相似度、分享卡片、文生图配图。
**Won't(MVP)**:完整 DAW、多轨编辑、专业 mixing、用户系统、付费、复杂版权、大规模云存储。

---

## 10. 成功指标
Demo:1 分钟内上传一个动机 / 看到节点 / 播放 original / 生成 ghost / 生成 resurrect / 理解 graph / **全流程不崩**。
产品(远期):人均上传数、每动机生成次数、Ghost/Resurrect 点击率、Remix 使用率、保存率、分享率、回访率、动机→完整作品转化率。

---

## 11. 风险与对策
| 风险 | 对策 |
|---|---|
| 模型生成慢/不稳/现场崩 | **预生成池**(SuperPOD 批量做好)+ 前端"using cached generation";把生成定义为 reinterpretation 而非精确续写 |
| 输入是短动机、要发展成长曲 | 核心走 `complete` / `text2music+ref`(需 LM,放 Mac/SuperPOD/大卡);Cover 仅做短 Ghost,不承担发展 |
| 免费 Colab T4 显存小 | ghost/resurrect 用 Colab/Mac 即可;Complete/长片段放 **32GB Mac**、SuperPOD 或 24GB+ 卡 |
| 跟随哼唱效果不稳 | 优先用钢琴/吉他干净动机;哼唱可加 Basic Pitch 预处理;多生成几版挑 |
| 范围过大 | 严守 Must;Remix=Should;Grow=Could;不做 DAW |
| 视觉太恐怖 | 定义为 poetic digital graveyard,温和暗色+发光,强调 memory/rebirth |

---

## 12. TME 生态价值(Pitch)
开场:每个音乐人都有一座废弃灵感的墓地。
区别:Suno 从 prompt 生歌;我们从创作者自己的未完成素材出发,存档→关联→复活,沉淀成可发展成 EP/概念专辑的资产。
落地:腾讯音乐人 / QQ 音乐社区 / 全民 K 歌 / 创作活动 / AI 创作工具箱 / 作品孵化 —— 激活创作者、提升创作频率、沉淀素材数据、发现潜力 demo 与新人。
(注:demo 用研究/开源模型;ACE-Step 为 MIT 可商用,生产化无授权障碍。)
