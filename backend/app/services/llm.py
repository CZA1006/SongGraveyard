"""LLM 辅助:标题 / 墓志铭 / caption 拼接。

铁律:全部有模板兜底,LLM 不可用也不阻塞主流程。
真实 LLM 接入留在 _llm_complete();未配置 LLM_API_KEY 时直接走模板。
"""
import os
import random

LLM_API_KEY = os.environ.get("LLM_API_KEY", "")

_TITLE_WORDS = ["Echo", "Fragment", "Lullaby", "Drift", "Ember", "Hollow", "Murmur", "Tide"]
_EPITAPHS = [
    "A melody that never found its words.",
    "A chorus that never found its song.",
    "Half-remembered, never finished.",
    "It hummed once, then fell silent.",
    "A spark buried before it could burn.",
]


def _llm_complete(prompt: str) -> str | None:
    """真实 LLM 调用占位。未配置 key 返回 None,调用方回落模板。"""
    if not LLM_API_KEY:
        return None
    # TODO: 接 OpenAI/Claude;失败需返回 None 让上层兜底。
    return None


def generate_title(text_note: str | None, mood_tags: list[str]) -> str:
    note = (text_note or "").strip()
    out = _llm_complete(f"Give a short poetic song-fragment title for: {note} {mood_tags}")
    if out:
        return out[:60]
    mood = (mood_tags[0].capitalize() + " ") if mood_tags else ""
    return f"{mood}{random.choice(_TITLE_WORDS)}"


def generate_epitaph(text_note: str | None, mood_tags: list[str]) -> str:
    out = _llm_complete(f"Write a one-line wistful epitaph for an unfinished music idea: {text_note}")
    if out:
        return out[:120]
    return random.choice(_EPITAPHS)


def build_caption(style=None, instruments=None, mood=None, text_note=None) -> str:
    """把风格/配器/情绪/文字拼成 ACE-Step caption。"""
    parts = []
    if style:
        parts.append(style)
    if mood:
        parts.append(f"{mood} mood")
    if instruments:
        parts.append(", ".join(instruments))
    if text_note:
        parts.append(text_note.strip())
    caption = ", ".join(p for p in parts if p)
    return caption or "emotional, melodic, full arrangement"
