import os

class SubtitleGenerator:
    def __init__(self):
        self.model = None

    def generate_subtitles(self, word_timestamps: list, audio_path: str, output_path: str) -> str:
        """
        Generate a basic .srt file. If word_timestamps is empty, fall back to Whisper.
        """
        print("Generating subtitles...")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        if not word_timestamps:
            print("No word timestamps provided by TTS. Falling back to Whisper...")
            if not self.model:
                try:
                    import whisper
                except ImportError:
                    raise RuntimeError("Whisper is not installed. Install with 'pip install openai-whisper'")
                print("Loading Whisper model (base)...")
                self.model = whisper.load_model("base")
                
            result = self.model.transcribe(audio_path, word_timestamps=True)
            word_timestamps = []
            for segment in result.get("segments", []):
                for word in segment.get("words", []):
                    word_timestamps.append({
                        "word": word["word"].strip(),
                        "start": word["start"],
                        "end": word["end"]
                    })
        
        with open(output_path, 'w', encoding='utf-8') as f:
            if not word_timestamps:
                f.write("1\n00:00:00,000 --> 00:00:05,000\nPlaceholder Subtitle\n")
                return output_path
                
            # Naive grouping (1 word per subtitle block for this demo)
            for i, item in enumerate(word_timestamps, start=1):
                start = self._format_time(item["start"])
                end = self._format_time(item["end"])
                f.write(f"{i}\n{start} --> {end}\n{item['word']}\n\n")
                
        return output_path

    def _format_time(self, seconds: float) -> str:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        msecs = int((seconds - int(seconds)) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{msecs:03d}"
