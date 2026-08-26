import os
import time
from pauseflow.media_gen.base import MediaGenBackend

class ManualWatchBackend(MediaGenBackend):
    def __init__(self, project_dir: str, timeout_sec: int = 1800, check_interval_sec: int = 5):
        self.pending_dir = os.path.join(project_dir, "pending_prompts")
        self.clips_dir = os.path.join(project_dir, "manual_clips")
        self.timeout_sec = timeout_sec
        self.check_interval_sec = check_interval_sec
        
        os.makedirs(self.pending_dir, exist_ok=True)
        os.makedirs(self.clips_dir, exist_ok=True)

    def generate_video(self, video_prompt: str, output_path: str) -> str:
        # output_path is typically output_dir/clips/scene_{id}.mp4
        # We need to extract scene_id from output_path or just use the basename
        basename = os.path.basename(output_path)
        scene_id_str = basename.replace(".mp4", "")
        
        # 1. Write the prompt to pending_prompts
        prompt_file = os.path.join(self.pending_dir, f"{scene_id_str}.txt")
        with open(prompt_file, "w", encoding="utf-8") as f:
            f.write(video_prompt)
            
        print(f"\n[MANUAL ACTION REQUIRED]")
        print(f"-> Prompt for {scene_id_str} written to: {prompt_file}")
        print(f"-> Please generate the video in CapCut using Seedance.")
        
        # 2. Watch for the output video in manual_clips
        expected_clip_path = os.path.join(self.clips_dir, basename)
        print(f"-> Waiting for you to place the generated video at: {expected_clip_path}")
        print(f"-> Timeout in {self.timeout_sec // 60} minutes...\n")
        
        start_time = time.time()
        while True:
            if os.path.exists(expected_clip_path):
                # Ensure the file is not empty and has finished copying (rough check)
                if os.path.getsize(expected_clip_path) > 0:
                    print(f"Detected {basename}! Continuing pipeline...")
                    # Copy or symlink to output_path expected by the rest of the pipeline
                    import shutil
                    os.makedirs(os.path.dirname(output_path), exist_ok=True)
                    shutil.copy2(expected_clip_path, output_path)
                    return output_path
                
            elapsed = time.time() - start_time
            if elapsed > self.timeout_sec:
                raise TimeoutError(f"Timeout waiting for manual clip: {expected_clip_path}")
                
            time.sleep(self.check_interval_sec)
