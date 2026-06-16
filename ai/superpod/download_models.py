"""在【登录节点】(有外网)先把模型下到 hf_cache/,之后计算节点离线用。
   用法:  export HF_HOME=$PWD/hf_cache && python download_models.py
   注意:确切仓库 ID 请对照 ACE-Step-1.5 README 的 Model Zoo 链接;以下为常见命名,
   若 404 就去 Model Zoo 点对应模型的 HuggingFace 链接拿准确 ID。"""
import os
os.environ.setdefault("HF_HOME", os.path.join(os.getcwd(), "hf_cache"))
from huggingface_hub import snapshot_download

REPOS = [
    "ACE-Step/acestep-v15-base",     # DiT(支持 complete)
    "ACE-Step/acestep-5Hz-lm-4B",    # 最强 LM
    # 如需 XL/VAE 等额外权重,按 Model Zoo 再加
]
for repo in REPOS:
    try:
        print("downloading", repo, "…")
        snapshot_download(repo)
        print("  ok")
    except Exception as e:
        print("  ⚠️", repo, "失败:", e, "→ 去 Model Zoo 确认确切仓库 ID")
print("HF_HOME =", os.environ["HF_HOME"])
