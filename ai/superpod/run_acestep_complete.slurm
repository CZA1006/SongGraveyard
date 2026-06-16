#!/bin/bash
#SBATCH --job-name=acestep-complete
#SBATCH --gres=gpu:1                       # H800 一张卡(80GB,足够 base/XL + 4B LM)
#SBATCH --cpus-per-task=8
#SBATCH --mem=64G
#SBATCH --time=02:00:00
#SBATCH --output=logs/acestep_%j.out
#SBATCH --error=logs/acestep_%j.err
# ↓↓↓ 这两行按你们项目分配填;不确定就问 spodsupport@ust.hk 或看 SuperPOD 的 SLURM 介绍页 ↓↓↓
#SBATCH --partition=<YOUR_PARTITION>       # 例:gpu / normal
#SBATCH --account=<YOUR_PROJECT_ACCOUNT>   # 你的 project 账号

set -e
cd "$SLURM_SUBMIT_DIR"
mkdir -p logs outputs inputs

# ---------- 环境(按 SuperPOD 实际模块名调整)----------
module purge
module load cuda            # 用 `module available` 看确切名,例如 cuda/12.4

# 模型缓存 + 离线模式(计算节点通常无外网;模型请先在登录节点预下载,见 README 步骤 0)
export HF_HOME="${HF_HOME:-$SLURM_SUBMIT_DIR/hf_cache}"
export HF_HUB_OFFLINE=1
export TRANSFORMERS_OFFLINE=1
# 若你们的计算节点其实有外网,把上面两行 OFFLINE 注释掉,首次会自动下载

# ---------- ACE-Step server 配置:最强「可续写」组合 ----------
export MPLBACKEND=Agg
export ACESTEP_API_HOST=127.0.0.1
export ACESTEP_API_PORT=8001
export ACESTEP_CONFIG_PATH=acestep-v15-base       # ★ 支持 complete;想要更高音质换 XL 版(确认确切名,如 acestep-v15-xl-base)
export ACESTEP_INIT_LLM=true                      # ★ complete 需要 LM
export ACESTEP_LM_MODEL_PATH=acestep-5Hz-lm-4B    # ★ H800 显存够,直接上最强 LM(Copy Melody=强)
export ACESTEP_LM_BACKEND=vllm                    # 大卡上 vllm 更快;若报错改成 pt
export ACESTEP_OFFLOAD_TO_CPU=false               # 80GB 显存不需要 offload
export ACESTEP_USE_FLASH_ATTENTION=true           # 大卡上可开;报错就改 false

# ---------- 起 server(后台)----------
cd "$SLURM_SUBMIT_DIR/ACE-Step-1.5"
uv run acestep-api > "$SLURM_SUBMIT_DIR/logs/server_${SLURM_JOB_ID}.log" 2>&1 &
SERVER_PID=$!

# ---------- 等就绪 → 批量生成 → 关 server ----------
export ACE_IN="$SLURM_SUBMIT_DIR/inputs"
export ACE_OUT="$SLURM_SUBMIT_DIR/outputs"
uv run python "$SLURM_SUBMIT_DIR/gen_complete.py"

kill $SERVER_PID 2>/dev/null || true
echo "JOB DONE"
