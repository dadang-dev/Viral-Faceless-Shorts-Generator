import os
from pauseflow.tts.base import TTSBackend

class DummyTTSBackend(TTSBackend):
    def generate_audio(self, text: str, output_path: str) -> dict:
        print(f"Dummy TTS generating audio for text: {text[:30]}...")
        # Create a dummy empty wav/mp3 file
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(b'dummy audio content')
        
        # Return fake timestamps
        return {
            "word_timestamps": [
                {"word": "When", "start": 0.0, "end": 0.5},
                {"word": "was", "start": 0.5, "end": 1.0},
            ]
        }
