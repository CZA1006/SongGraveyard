# ACE-Step 1.5 on HKUST SuperPOD — Complete(续写)批量生成

在一个 SLURM 作业里「起本地 server + 本地 client 调用」,把 `inputs/` 的动机用
**base 模型 + 4B LM + complete 任务**发展成更长的纯音乐,结果存到 `outputs/`。
不需要对外隧道,全程 localhost,符合 HPC 安全限制。

## 目录结构(放在你的项目目录里)
```
项目目录/
├─ ACE-Step-1.5/              # git clone 的官方仓库
├─ run_acestep_complete.slurm
├─ gen_complete.py
├─ download_models.py
├─ inputs/                    # 把你的动机音频(mp3/wav/m4a)放这里
├─ outputs/                   # 生成结果
├─ logs/
└─ hf_cache/                  # 模型缓存(预下载到这里)
```

## 一次性准备(在登录节点 slogin-* 上)
```bash
module load cuda
git clone https://github.com/ACE-Step/ACE-Step-1.5.git
cd ACE-Step-1.5 && pip install uv && uv sync && cd ..

# 步骤 0:预下载模型(计算节点通常无外网,必须先在登录节点下好)
export HF_HOME=$PWD/hf_cache
cd ACE-Step-1.5 && uv run python ../download_models.py && cd ..
```

## 提交作业
```bash
# 1) 编辑 run_acestep_complete.slurm,填好 --partition / --account
# 2) 把动机放进 inputs/
mkdir -p inputs logs outputs
sbatch run_acestep_complete.slurm

# 监控
squeue -u $USER
tail -f logs/acestep_*.out          # 主流程
tail -f logs/server_*.log           # server / 模型加载 / 报错
```
结果在 `outputs/`,每个动机会产出 `__complete.wav` 和 `__t2m_ref.wav` 两版。

## 可调旋钮(在 gen_complete.py 的 JOBS 里)
- `duration`:成品长度(秒),10–600。后摇想听出铺垫→爆发,建议 120+。
- `strength`:对原动机的忠实度。complete/cover 高(0.7–0.85)更跟随你的和弦;text2music+ref 用低(~0.3)做风格引导。
- `steps`:base 模型给 32–64 才出质量(turbo 才用 8)。
- `thinking`:complete/text2music 用 LM 规划,设 True。
- `task_type`:`complete`(续写,src_audio)/ `text2music`(配 ref_audio)/ `cover`(等长重做)。
- 多生成几版挑:AI 有随机性,跑 2–3 次很正常。

## 说明 & 注意
- **任务语义**:`complete` 是「续写/补全」专用任务,最贴近「把 20s 动机长成完整曲子」;
  但它对纯器乐片段的具体行为建议先用 1 个动机小跑验证,再批量。脚本默认同时跑
  text2music+参考音频做对比,挑效果好的那条定下来。
- **想要最高音质**:把 `ACESTEP_CONFIG_PATH` 换成 XL 版(去 README 的 Model Zoo 拿确切名,
  如 `acestep-v15-xl-base`),并在 download_models.py 里加上对应仓库。H800 80GB 跑得动。
- **partition/account/模块名/计算节点是否有外网**因人而异,填错就问 spodsupport@ust.hk。
- **Apptainer 路线**:若你们的项目要求容器化,把 `uv run ...` 换成
  `apptainer exec --nv your_image.sif ...`,其余逻辑不变。
