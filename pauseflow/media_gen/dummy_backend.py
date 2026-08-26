import os
import shutil
from pauseflow.media_gen.base import MediaGenBackend

class DummyMediaGenBackend(MediaGenBackend):
    def __init__(self, fallback_video_path: str = None):
        self.fallback_video_path = fallback_video_path

    def generate_video(self, video_prompt: str, output_path: str) -> str:
        print(f"Dummy MediaGen generating video for: {video_prompt[:30]}...")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        if self.fallback_video_path and os.path.exists(self.fallback_video_path):
            shutil.copy2(self.fallback_video_path, output_path)
        else:
            with open(output_path, 'wb') as f:
                f.write(b'dummy video content')
        return output_path
