"""在 SLURM 作业内调用本地 ACE-Step REST API,把 inputs/ 里的每个动机
   续写/发展成更长的纯音乐,结果存到 outputs/。
   改 JOBS 即可调风格、时长、忠实度、任务类型。"""
import os, glob, json, time, requests

BASE   = "http://127.0.0.1:8001"
IN_DIR  = os.environ.get("ACE_IN",  "inputs")
OUT_DIR = os.environ.get("ACE_OUT", "outputs")
os.makedirs(OUT_DIR, exist_ok=True)

POSTROCK = ("post-rock instrumental, melancholic and lonely, "
            "gentle fingerpicked acoustic guitar intro, slow emotional build, "
            "layered reverb-drenched electric guitars, swelling crescendo, "
            "cinematic, atmospheric, instrumental only, no vocals")

# 同一个动机跑两种路线,A/B 对比哪种「长 + 跟随你的和弦」效果最好:
JOBS = [
    # ① Complete:专用「续写/发展」任务(需要 LM),最贴近「把动机长出来」
    {"suffix": "complete", "task_type": "complete", "file_field": "src_audio",
     "prompt": POSTROCK, "lyrics": "", "duration": 120, "strength": 0.8,
     "steps": 48, "thinking": True},
    # ② text2music + 参考音频:LM 规划完整曲式,参考音频做风格引导,长度自由
    {"suffix": "t2m_ref", "task_type": "text2music", "file_field": "ref_audio",
     "prompt": POSTROCK, "lyrics": "", "duration": 120, "strength": 0.3,
     "steps": 48, "thinking": True},
]

def wait_health(timeout=2400):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            if requests.get(BASE + "/health", timeout=5).status_code == 200:
                print("server ready"); return
        except Exception:
            pass
        time.sleep(5)
    raise RuntimeError("server 未就绪,看 logs/server_*.log")

def run_one(audio_path, job):
    data = {
        "task_type": job["task_type"],
        "prompt": job["prompt"],
        "lyrics": job.get("lyrics", ""),
        "audio_duration": str(job["duration"]),
        "inference_steps": str(job["steps"]),
        "audio_cover_strength": str(job.get("strength", 0.8)),
        "thinking": "true" if job.get("thinking") else "false",
        "batch_size": "1",
        "audio_format": "wav",
    }
    field = job.get("file_field", "src_audio")
    with open(audio_path, "rb") as f:
        r = requests.post(BASE + "/release_task", data=data,
                          files={field: f}, timeout=300)
    r.raise_for_status()
    tid = r.json()["data"]["task_id"]
    print(f"submitted {os.path.basename(audio_path)} [{job['suffix']}] {tid}")
    t0 = time.time()
    while True:
        try:
            item = requests.post(BASE + "/query_result",
                                 json={"task_id_list": [tid]}, timeout=180).json()["data"][0]
        except Exception as e:
            print(f"  …polling {type(e).__name__}, {int(time.time()-t0)}s"); time.sleep(5); continue
        st = item["status"]
        if st == 1:
            res = json.loads(item["result"])[0]
            audio = requests.get(BASE + res["file"], timeout=300).content
            stem = os.path.splitext(os.path.basename(audio_path))[0]
            out = os.path.join(OUT_DIR, f"{stem}__{job['suffix']}.wav")
            with open(out, "wb") as g: g.write(audio)
            print(f"  ✅ saved {out} | dur={res.get('metas',{}).get('duration')} | {int(time.time()-t0)}s")
            return out
        if st == 2:
            raise RuntimeError("failed: " + str(item))
        print(f"  …status={st}, {int(time.time()-t0)}s"); time.sleep(5)

if __name__ == "__main__":
    wait_health()
    files = sorted(glob.glob(os.path.join(IN_DIR, "*.mp3")) +
                   glob.glob(os.path.join(IN_DIR, "*.wav")) +
                   glob.glob(os.path.join(IN_DIR, "*.m4a")))
    if not files:
        print(f"⚠️ {IN_DIR}/ 里没有音频,把动机放进去再跑"); raise SystemExit(1)
    print(f"found {len(files)} motif(s)")
    for ap in files:
        for job in JOBS:
            try:
                run_one(ap, job)
            except Exception as e:
                print("ERROR", ap, job["suffix"], repr(e))
    print("ALL DONE")
