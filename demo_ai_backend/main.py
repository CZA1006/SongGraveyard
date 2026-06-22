"""Local ACE-Step terminal client.

Boots the ACE-Step REST API server (sibling folder ../ACE-Step-1.5),
prompts the user for music-generation inputs, submits a job, polls
for completion, and downloads the resulting audio.

Usage:
    python main.py                # interactive prompts (auto-starts server)
    python main.py --no-serve     # assume server already running on :8001
    python main.py --health       # only check server reachability
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Optional
from urllib.parse import quote

import requests


HERE = Path(__file__).resolve().parent
ACE_DIR = (HERE.parent / "ACE-Step-1.5").resolve()
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8001
OUT_DIR = HERE / "outputs"


def base_url(host: str, port: int) -> str:
    return f"http://{host}:{port}"


def server_alive(url: str, timeout: float = 2.0) -> bool:
    try:
        r = requests.get(f"{url}/docs", timeout=timeout)
        return r.status_code < 500
    except requests.RequestException:
        return False


def start_server() -> subprocess.Popen:
    script = ACE_DIR / "start_api_server_macos.sh"
    if not script.is_file():
        raise FileNotFoundError(f"Cannot find {script}. Is ACE-Step-1.5 in the expected place?")

    print(f"[serve] launching {script.name} (first run can take minutes)")
    log_path = HERE / "server.log"
    log_fh = open(log_path, "ab", buffering=0)
    proc = subprocess.Popen(
        ["bash", str(script)],
        cwd=str(ACE_DIR),
        stdout=log_fh,
        stderr=subprocess.STDOUT,
        stdin=subprocess.DEVNULL,
        env={**os.environ, "PYTHONUNBUFFERED": "1"},
    )
    print(f"[serve] pid={proc.pid}, logs -> {log_path}")
    return proc


def wait_until_ready(url: str, timeout_s: int = 600) -> None:
    print(f"[serve] waiting for {url} (up to {timeout_s}s)")
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        if server_alive(url, timeout=2.0):
            print("[serve] ready")
            return
        time.sleep(3)
    raise TimeoutError(f"Server at {url} did not become ready within {timeout_s}s")


def ask(prompt: str, default: Optional[str] = None, allow_empty: bool = True) -> str:
    suffix = f" [{default}]" if default else ""
    while True:
        val = input(f"{prompt}{suffix}: ").strip()
        if not val:
            if default is not None:
                return default
            if allow_empty:
                return ""
            print("  (required)")
            continue
        return val


def ask_float(prompt: str, default: float) -> float:
    while True:
        raw = input(f"{prompt} [{default}]: ").strip()
        if not raw:
            return default
        try:
            return float(raw)
        except ValueError:
            print("  not a number")


def ask_multiline(prompt: str) -> str:
    print(f"{prompt}:")
    lines: list[str] = []
    while True:
        try:
            line = input()
        except EOFError:
            break
        if line.strip() == "END":
            break
        lines.append(line)
    text = "\n".join(lines).strip()
    if text:
        word_count = len(text.split())
        print(f"  [captured {word_count} words, {len(lines)} lines]")
    else:
        print("  [empty -> instrumental]")
    return text


def ask_int(prompt: str, default: int) -> int:
    while True:
        raw = input(f"{prompt} [{default}]: ").strip()
        if not raw:
            return default
        try:
            return int(raw)
        except ValueError:
            print("  not an integer")


def collect_inputs() -> tuple[dict[str, Any], dict[str, Path], int]:
    """Return (form_fields, files_to_upload).

    Local files must be uploaded via multipart/form-data; the server rejects
    absolute filesystem paths in JSON for security.
    """
    print()
    print("=== ACE-Step input ===")
    task_type = ask(
        "task_type (text2music | retake | repaint | edit | extend | audio2audio)",
        default="text2music",
    )

    fields: dict[str, Any] = {"task_type": task_type}

    print()
    print("completion mode:")
    print("  1) none            - use your caption + lyrics as-is")
    print("  2) format-existing - LM cleans/expands your scattered scraps into [verse]/[chorus] structure")
    print("  3) from-scratch    - LM writes full caption + lyrics from a one-line vibe description")
    mode = ask("choose 1/2/3", default="1")

    if mode == "3":
        fields["sample_mode"] = True
        fields["thinking"] = True
        fields["use_cot_lyrics"] = True
        fields["sample_query"] = ask(
            "describe the song in one line (e.g. 'dreamy indie pop about late-night drives')",
            allow_empty=False,
        )
        # In sample_mode the LM produces both caption and lyrics — leave prompt/lyrics blank.
        fields["prompt"] = ""
        fields["lyrics"] = ""
    else:
        fields["prompt"] = ask(
            "caption / prompt (style, genre, mood, instruments)",
            allow_empty=task_type != "text2music",
        )
        fields["lyrics"] = ask_multiline(
            "lyrics (paste full text; use [verse]/[chorus] tags; blank = instrumental)\n"
            "  -> finish with a line containing only 'END' (or Ctrl-D)"
        )
        if mode == "2":
            fields["thinking"] = True
            fields["use_format"] = True
            fields["use_cot_lyrics"] = True

    fields["audio_duration"] = ask_float(
        "duration seconds (target full song length, e.g. 180; -1 = random 30-240)",
        default=180.0,
    )
    fields["inference_steps"] = ask_int("inference steps (27 default, 40-50 for higher fidelity)", default=27)
    fields["guidance_scale"] = ask_float("guidance scale (15 default; lower=looser, higher=stricter)", default=15.0)

    model = ask(
        "model (acestep-v15-base = higher quality / acestep-v15-turbo = ~3x faster)",
        default="acestep-v15-base",
    )
    fields["model"] = model

    infer_method = ask(
        "infer_method (ode = deterministic, smoother / sde = stochastic, more 'alive')",
        default="sde",
    )
    fields["infer_method"] = infer_method
    # SDE benefits from random seed; otherwise honor what's already set.
    fields.setdefault("use_random_seed", True)

    takes = ask_int("how many takes to generate (each is a separate run, different seed)", default=1)

    files: dict[str, Path] = {}
    if task_type in {"retake", "repaint", "edit", "extend", "audio2audio"}:
        src = ask("source audio file path", allow_empty=False)
        files["ctx_audio"] = Path(src).expanduser().resolve()

    ref = ask("optional reference audio path (style transfer; blank to skip)")
    if ref:
        files["ref_audio"] = Path(ref).expanduser().resolve()

    return fields, files, max(1, takes)


def submit(url: str, fields: dict[str, Any], files: dict[str, Path]) -> str:
    if files:
        missing = [str(p) for p in files.values() if not p.is_file()]
        if missing:
            raise FileNotFoundError(f"Audio file(s) not found: {missing}")
        form = {k: (str(v) if not isinstance(v, bool) else ("true" if v else "false"))
                for k, v in fields.items()}
        opened = {k: (p.name, open(p, "rb"), "application/octet-stream")
                  for k, p in files.items()}
        try:
            r = requests.post(f"{url}/release_task", data=form, files=opened, timeout=120)
        finally:
            for _, fh, _ in opened.values():
                try:
                    fh.close()
                except Exception:
                    pass
    else:
        r = requests.post(f"{url}/release_task", json=fields, timeout=60)

    if r.status_code >= 400:
        try:
            print(f"[error] server said: {r.json()}")
        except Exception:
            print(f"[error] body: {r.text[:500]}")
    r.raise_for_status()
    body = r.json()
    data = body.get("data") if isinstance(body, dict) else None
    task_id = (data or body).get("task_id") if isinstance((data or body), dict) else None
    if not task_id:
        raise RuntimeError(f"Unexpected /release_task response: {body}")
    print(f"[job] task_id={task_id}")
    return task_id


def poll(
    url: str,
    task_id: str,
    poll_s: int = 5,
    timeout_s: int = 3600,
    heartbeat_s: int = 30,
) -> dict[str, Any]:
    deadline = time.time() + timeout_s
    started = time.time()
    last_status = None
    last_progress_text = None
    last_progress = None
    last_stage = None
    last_heartbeat = 0.0
    consecutive_errors = 0

    def fmt_elapsed() -> str:
        s = int(time.time() - started)
        return f"{s // 60:d}m{s % 60:02d}s"

    while time.time() < deadline:
        try:
            r = requests.post(
                f"{url}/query_result",
                json={"task_id_list": json.dumps([task_id])},
                timeout=120,
            )
            r.raise_for_status()
        except (requests.Timeout, requests.ConnectionError) as exc:
            consecutive_errors += 1
            if time.time() - last_heartbeat >= heartbeat_s:
                print(f"[heartbeat {fmt_elapsed()}] worker busy ({type(exc).__name__} x{consecutive_errors}); inference in progress")
                last_heartbeat = time.time()
            time.sleep(poll_s)
            continue

        consecutive_errors = 0
        body = r.json()
        items = body.get("data") if isinstance(body, dict) else body
        item = items[0] if isinstance(items, list) and items else {}

        status = item.get("status")
        progress_text = item.get("progress_text")

        # `result` is a JSON-encoded list; first entry carries progress/stage/file.
        first: dict[str, Any] = {}
        result_raw = item.get("result")
        if isinstance(result_raw, str):
            try:
                parsed = json.loads(result_raw)
                if isinstance(parsed, list) and parsed:
                    first = parsed[0]
            except json.JSONDecodeError:
                pass
        elif isinstance(result_raw, list) and result_raw:
            first = result_raw[0]

        progress = first.get("progress")
        stage = first.get("stage")
        file_path = first.get("file") or item.get("file")

        changed = (
            status != last_status
            or progress != last_progress
            or stage != last_stage
            or progress_text != last_progress_text
        )
        due_for_heartbeat = time.time() - last_heartbeat >= heartbeat_s

        if changed or due_for_heartbeat:
            pct = f"{float(progress) * 100:.1f}%" if isinstance(progress, (int, float)) else "?"
            msg = progress_text or "(no log)"
            if len(msg) > 120:
                msg = msg[:117] + "..."
            print(f"[progress {fmt_elapsed()}] status={status} stage={stage} progress={pct} | {msg}")
            last_status = status
            last_progress = progress
            last_stage = stage
            last_progress_text = progress_text
            last_heartbeat = time.time()

        if file_path:
            # Normalize so the caller's downloader sees `file`.
            first.setdefault("file", file_path)
            return first
        if isinstance(status, int) and status >= 3:
            raise RuntimeError(f"Job failed: {first or item}")
        time.sleep(poll_s)
    raise TimeoutError(f"Job {task_id} did not finish within {timeout_s}s")


def download_audio(url: str, file_path: str, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    name = Path(file_path).name or f"acestep_{int(time.time())}.mp3"
    dest = out_dir / name

    if file_path.startswith(("http://", "https://")):
        api = file_path
    elif file_path.startswith("/v1/") or "?path=" in file_path:
        # Server already returned an API-shaped URL; just attach the host.
        api = f"{url}{file_path}"
    elif file_path.startswith("/"):
        # Raw absolute filesystem path -> ask /v1/audio to serve it.
        api = f"{url}/v1/audio?path={quote(file_path)}"
    else:
        api = f"{url}/{file_path.lstrip('/')}"

    print(f"[fetch] {api}")
    with requests.get(api, stream=True, timeout=120) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            shutil.copyfileobj(r.raw, f)
    print(f"[fetch] saved -> {dest}")
    return dest


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--host", default=DEFAULT_HOST)
    p.add_argument("--port", type=int, default=DEFAULT_PORT)
    p.add_argument("--no-serve", action="store_true", help="Don't auto-launch the server")
    p.add_argument("--health", action="store_true", help="Only check that the server is reachable")
    p.add_argument("--ready-timeout", type=int, default=600)
    args = p.parse_args()

    url = base_url(args.host, args.port)

    if args.health:
        print("alive" if server_alive(url) else "unreachable")
        return 0

    proc: Optional[subprocess.Popen] = None
    if not server_alive(url):
        if args.no_serve:
            print(f"Server not reachable at {url} and --no-serve set. Start it first.")
            return 1
        proc = start_server()
        wait_until_ready(url, timeout_s=args.ready_timeout)
    else:
        print(f"[serve] reusing running server at {url}")

    try:
        fields, files, takes = collect_inputs()
        print()
        print("[submit] fields:")
        print(json.dumps(fields, indent=2))
        if files:
            print("[submit] uploads:")
            for k, p in files.items():
                print(f"  {k} <- {p}")
        print(f"[plan] generating {takes} take(s)")

        run_stamp = int(time.time())
        results: list[Path] = []
        for i in range(1, takes + 1):
            print()
            print(f"========== take {i}/{takes} ==========")
            task_id = submit(url, fields, files)
            result = poll(url, task_id)

            final_caption = result.get("prompt") or ""
            final_lyrics = result.get("lyrics") or ""
            if final_caption:
                print()
                print("[caption used]")
                print(final_caption)
            if final_lyrics:
                print()
                print("[final lyrics]")
                print(final_lyrics)
                print()

            path = result.get("file") or ""
            if not path:
                print(f"[take {i}] no file path in result: {result}")
                continue
            saved = download_audio(url, path, OUT_DIR)
            # Write the lyrics + caption next to the audio so you have a record.
            if final_lyrics or final_caption:
                sidecar = saved.with_suffix(".txt")
                sidecar.write_text(
                    f"# caption\n{final_caption}\n\n# lyrics\n{final_lyrics}\n",
                    encoding="utf-8",
                )
                print(f"[meta] saved -> {sidecar}")
            if takes > 1:
                renamed = saved.with_name(f"run{run_stamp}_take{i}_{saved.name}")
                saved.rename(renamed)
                saved = renamed
                print(f"[take {i}] -> {saved}")
            results.append(saved)

        print()
        print(f"[done] {len(results)} file(s) saved:")
        for p in results:
            print(f"  {p}")
        return 0
    except KeyboardInterrupt:
        print("\n[abort] interrupted")
        return 130
    finally:
        if proc is not None:
            print(f"[serve] server still running in background. Stop it with: kill {proc.pid}")


if __name__ == "__main__":
    sys.exit(main())
