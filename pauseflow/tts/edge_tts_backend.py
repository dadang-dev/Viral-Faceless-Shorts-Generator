import asyncio
import os
import re
from typing import Literal

import edge_tts

from pauseflow.tts.base import TTSBackend


PunctuationMode = Literal["natural", "enhanced", "minimal"]
TICKS_PER_SECOND = 10_000_000


def prepare_tts_text(text: str, punctuation_mode: PunctuationMode = "natural") -> str:
    """Prepare plain text for Edge TTS without using unsupported custom SSML."""
    text = text.strip()
    if punctuation_mode == "natural":
        return text
    if punctuation_mode == "enhanced":
        text = re.sub(r"\.{3,}|…", ". ", text)
        text = re.sub(r"\s*[—–]\s*", "; ", text)
        text = re.sub(r"\s*;\s*", "; ", text)
        return re.sub(r"[ \t]+", " ", text).strip()
    if punctuation_mode == "minimal":
        text = re.sub(r"[,;:…—–]+", " ", text)
        text = re.sub(r"\.{2,}", ".", text)
        return re.sub(r"\s+", " ", text).strip()
    raise ValueError(f"Unsupported punctuation mode: {punctuation_mode}")


class EdgeTTSBackend(TTSBackend):
    def __init__(
        self,
        voice: str = "en-US-ChristopherNeural",
        rate: str = "+0%",
        volume: str = "+0%",
        pitch: str = "+0Hz",
        punctuation_mode: PunctuationMode = "natural",
    ):
        self.voice = voice
        self.rate = rate
        self.volume = volume
        self.pitch = pitch
        self.punctuation_mode = punctuation_mode

    def generate_audio(self, text: str, output_path: str) -> dict:
        print(f"EdgeTTS generating audio with {self.voice}: {text[:30]}...")
        return asyncio.run(self.generate_audio_async(text, output_path))

    async def generate_audio_async(self, text: str, output_path: str) -> dict:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        processed_text = prepare_tts_text(text, self.punctuation_mode)
        communicate = edge_tts.Communicate(
            processed_text,
            self.voice,
            rate=self.rate,
            volume=self.volume,
            pitch=self.pitch,
            boundary="WordBoundary",
        )
        word_timestamps = []
        with open(output_path, "wb") as audio:
            async for message in communicate.stream():
                if message["type"] == "audio":
                    audio.write(message["data"])
                elif message["type"] == "WordBoundary":
                    start = float(message["offset"]) / TICKS_PER_SECOND
                    duration = float(message["duration"]) / TICKS_PER_SECOND
                    word_timestamps.append({
                        "word": str(message["text"]).strip(),
                        "start": start,
                        "end": start + duration,
                    })
        return {
            "word_timestamps": word_timestamps,
            "processed_text": processed_text,
            "settings": {
                "voice": self.voice,
                "rate": self.rate,
                "volume": self.volume,
                "pitch": self.pitch,
                "punctuation_mode": self.punctuation_mode,
            },
        }
