"""ACE-Step 1.5 适配器:唯一对接 AI 引擎的地方。
- resurrect = complete(续写,需 LM)
- grow      = text2music + 参考音频(完整曲式,需 LM)
- ghost     = cover(低 strength,短,跳过 LM,免费 T4 可跑)
BASE 来自 env ACESTEP_BASE_URL,可在 Mac / Colab / SuperPOD / pod 间切换。
"""
import os, json, time, requests

BASE = os.environ.get("ACESTEP_BASE_URL", "http://127.0.0.1:8001").rstrip("/")
API_KEY = os.environ.get("ACESTEP_API_KEY", "")
_HEADERS = {"Authorization": f"Bearer {API_KEY}"} if API_KEY else {}


def _submit(src_path, data, file_field, retries=6):
    """提交任务,容忍 502 / 超时(后端可能在 warmup)。"""
    for attempt in range(retries):
        try:
            with open(src_path, "rb") as f:
                r = requests.post(f"{BASE}/release_task", data=data,
                                  files={file_field: f}, headers=_HEADERS, timeout=300)
            if r.status_code >= 500:
                time.sleep(10); continue
            r.raise_for_status()
            return r.json()["data"]["task_id"]
        except (requests.exceptions.ReadTimeout, requests.exceptions.ConnectionError):
            time.sleep(10)
    raise RuntimeError("ACE-Step submit 失败:检查 ACESTEP_BASE_URL / server 是否在线")


def _poll(task_id, max_wait=1800):
    t0 = time.time()
    while time.time() - t0 < max_wait:
        try:
            item = requests.post(f"{BASE}/query_result",
                                 json={"task_id_list": [task_id]},
                                 headers=_HEADERS, timeout=180).json()["data"][0]
        except Exception:
            time.sleep(5); continue
        if item["status"] == 1:
            res = json.loads(item["result"])[0]
            audio = requests.get(BASE + res["file"], headers=_HEADERS, timeout=300).content
            return audio, res
        if item["status"] == 2:
            raise RuntimeError(f"generation failed: {item}")
        time.sleep(5)
    raise TimeoutError("生成超时")


def _gen(src_path, *, task_type, file_field="src_audio", prompt="", lyrics="",
         strength=0.8, duration=90, steps=48, thinking=True, fmt="mp3"):
    data = {
        "task_type": task_type, "prompt": prompt, "lyrics": lyrics,
        "audio_cover_strength": str(strength), "audio_duration": str(duration),
        "inference_steps": str(steps), "thinking": "true" if thinking else "false",
        "batch_size": "1", "audio_format": fmt,
    }
    tid = _submit(src_path, data, file_field)
    audio, meta = _poll(tid)
    return audio, meta


# ---- 主:复活成完整 demo(续写)----
def resurrect(src_path, caption, lyrics="", duration=90):
    return _gen(src_path, task_type="complete", prompt=caption, lyrics=lyrics,
                strength=0.8, duration=duration, steps=48)

# ---- 主:长成完整曲(LM 规划曲式 + 动机做风格引导)----
def grow(src_path, caption, lyrics="", duration=120):
    return _gen(src_path, task_type="text2music", file_field="ref_audio",
                prompt=caption, lyrics=lyrics, strength=0.3, duration=duration, steps=48)

# ---- 次:空灵回声(cover,免费 T4 可跑)----
def ghost(src_path, duration=20):
    return _gen(src_path, task_type="cover", strength=0.4, duration=duration,
                steps=8, thinking=False,
                prompt="ghostly ambient, fragile, distant, reverb-heavy, dreamy, unfinished")

# 提示:resurrect/grow 需 LM(Mac/SuperPOD/大卡);现场建议优先用 pregenerated/ 兜底。
