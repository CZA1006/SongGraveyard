"""音频处理:转码统一 wav、读时长、(切片6)remix 合并。依赖 pydub + 系统 ffmpeg。"""
from pathlib import Path

from pydub import AudioSegment


def transcode_to_wav(src_path: Path, dst_path: Path) -> float:
    """转码为 wav,返回时长(秒)。"""
    audio = AudioSegment.from_file(src_path)
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    audio.export(dst_path, format="wav")
    return round(len(audio) / 1000.0, 2)


def duration_sec(path: Path) -> float:
    return round(len(AudioSegment.from_file(path)) / 1000.0, 2)


def merge(paths: list[Path], dst_path: Path) -> float:
    """切片6 remix:按顺序叠加多源(等长对齐到最长)。返回时长。"""
    if not paths:
        raise ValueError("merge 需要至少一个音频")
    segments = [AudioSegment.from_file(p) for p in paths]
    longest = max(len(s) for s in segments)
    base = AudioSegment.silent(duration=longest)
    for seg in segments:
        base = base.overlay(seg)
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    base.export(dst_path, format="wav")
    return round(len(base) / 1000.0, 2)
