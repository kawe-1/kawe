"""
Aethex TTS helper — wraps POST /tts with automatic chunking and WAV concatenation.

Aethex limits synchronous TTS to 650 characters per request.
This module splits longer texts at sentence boundaries, synthesizes
each chunk, and stitches the resulting WAV files back into one.
"""
from __future__ import annotations

import io
import os
import re
import wave
from typing import Optional

import requests

AETHEX_BASE = "https://api.aethexai.com/api/v1"
MAX_CHARS = 600          # safely under the 650-char API limit
REQUEST_TIMEOUT = 30     # seconds per TTS call

# Languages Aethex TTS explicitly supports
SUPPORTED_LANGUAGES = {"english", "french"}

# Dialect → Aethex language mapping
DIALECT_MAP = {
    "pidgin":  "english",   # Nigerian Pidgin is English-based; Aethex reads it fine
    "yoruba":  None,        # not supported → caller falls back to Gemini
    "hausa":   None,
    "igbo":    None,
}


def _headers() -> dict:
    key = os.getenv("AETHEX_API_KEY", "")
    if not key:
        raise ValueError("AETHEX_API_KEY is not set in environment variables.")
    return {"X-API-Key": key, "Content-Type": "application/json"}


def _split_text(text: str, max_chars: int = MAX_CHARS) -> list[str]:
    """
    Break text into chunks of at most `max_chars`, preferring sentence boundaries.
    """
    if len(text) <= max_chars:
        return [text]

    chunks: list[str] = []
    current = ""

    # Split on sentence-ending punctuation followed by whitespace
    sentences = re.split(r"(?<=[.!?])\s+", text)

    for sentence in sentences:
        if not sentence:
            continue

        # Sentence itself is too long — split at commas
        if len(sentence) > max_chars:
            parts = re.split(r",\s*", sentence)
            for part in parts:
                if not part:
                    continue
                if len(current) + len(part) + 2 <= max_chars:
                    current += (", " if current else "") + part
                else:
                    if current:
                        chunks.append(current.strip())
                    # Hard-cut if even the part is too long
                    current = part[:max_chars]
        elif len(current) + len(sentence) + 1 <= max_chars:
            current += (" " if current else "") + sentence
        else:
            if current:
                chunks.append(current.strip())
            current = sentence

    if current:
        chunks.append(current.strip())

    return [c for c in chunks if c] or [text[:max_chars]]


def _concat_wavs(parts: list[bytes]) -> bytes:
    """Concatenate multiple WAV byte blobs into a single WAV file."""
    if len(parts) == 1:
        return parts[0]

    all_frames = b""
    params = None

    for part in parts:
        with wave.open(io.BytesIO(part)) as w:
            if params is None:
                params = w.getparams()
            all_frames += w.readframes(w.getnframes())

    out = io.BytesIO()
    with wave.open(out, "wb") as w:
        w.setparams(params)
        w.writeframes(all_frames)

    return out.getvalue()


def synthesize(
    text: str,
    voice_id: Optional[str] = None,
    language: str = "english",
) -> bytes:
    """
    Convert text to speech via Aethex and return WAV bytes.

    Automatically splits the text into ≤600-char chunks, calls
    POST /tts for each, and stitches the results together.

    Raises ValueError if AETHEX_API_KEY is missing.
    Raises requests.HTTPError on API errors.
    """
    text = text.strip()
    if not text:
        raise ValueError("Text cannot be empty.")

    # Resolve dialect aliases
    resolved_lang = DIALECT_MAP.get(language.lower(), language.lower())
    if resolved_lang is None:
        raise ValueError(
            f"Language '{language}' is not supported by Aethex TTS. "
            "Use Gemini TTS for this language."
        )
    if resolved_lang not in SUPPORTED_LANGUAGES:
        resolved_lang = "english"  # safe fallback

    voice_id = voice_id or os.getenv("AETHEX_VOICE_ID") or None
    headers = _headers()
    chunks = _split_text(text)
    audio_parts: list[bytes] = []

    for chunk in chunks:
        if not chunk.strip():
            continue
        payload: dict = {"text": chunk, "language": resolved_lang}
        if voice_id:
            payload["voice_id"] = voice_id

        resp = requests.post(
            f"{AETHEX_BASE}/tts",
            headers=headers,
            json=payload,
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        audio_parts.append(resp.content)

    if not audio_parts:
        raise ValueError("Aethex returned no audio.")

    return _concat_wavs(audio_parts)


def list_voices(language: str = "english") -> list[dict]:
    """Return the Aethex voice catalog for a given language."""
    resp = requests.get(
        f"{AETHEX_BASE}/voices",
        headers=_headers(),
        params={"language": language},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()
