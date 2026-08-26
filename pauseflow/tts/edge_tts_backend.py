import os
import asyncio
import edge_tts
from pauseflow.tts.base import TTSBackend

class EdgeTTSBackend(TTSBackend):
    def __init__(self, voice="en-US-ChristopherNeural"):
        self.voice = voice

    def generate_audio(self, text: str, output_path: str) -> dict:
        print(f"EdgeTTS generating audio for text: {text[:30]}...")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # edge_tts is async, we need to run it in an event loop
        asyncio.run(self._generate_async(text, output_path))
        
        # Edge TTS CLI provides subtitles, but programmatically it's a bit tricky to extract word timestamps.
        # We will return an empty list for word_timestamps to trigger the Whisper fallback in SubtitleGenerator, 
        # or we could parse the edge_tts subtitles. For simplicity in Phase 2, we return empty.
        return {
            "word_timestamps": []
        }

    async def _generate_async(self, text: str, output_path: str):
        communicate = edge_tts.Communicate(text, self.voice)
        await communicate.save(output_path)
