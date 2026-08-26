import os
import time
import subprocess
import glob

def generate_dummy():
    print("Watching for pending prompts across all output directories...")
    processed = set()
    
    # Run endlessly to catch all 7 days
    while True:
        output_dirs = glob.glob("output/*")
        
        for project_dir in output_dirs:
            pending_dir = os.path.join(project_dir, "pending_prompts")
            clips_dir = os.path.join(project_dir, "manual_clips")
            
            if os.path.exists(pending_dir):
                os.makedirs(clips_dir, exist_ok=True)
                for txt_file in os.listdir(pending_dir):
                    if txt_file.endswith(".txt"):
                        # Use a unique identifier for the processed set to avoid collisions between days
                        unique_key = os.path.join(project_dir, txt_file)
                        if unique_key not in processed:
                            scene_name = txt_file.replace(".txt", ".mp4")
                            output_mp4 = os.path.join(clips_dir, scene_name)
                            
                            print(f"\n[Simulator] Found {txt_file} in {project_dir}! Generating dummy 15s clip...")
                            
                            tmp_mp4 = output_mp4 + ".tmp"
                            
                            # Copy the pre-rendered test.mp4 to tmp, then rename
                            import shutil
                            if os.path.exists("test.mp4"):
                                shutil.copy2("test.mp4", tmp_mp4)
                            else:
                                # Fallback if test.mp4 is missing
                                cmd = ["venv/bin/ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=blue:s=1080x1920:d=15", "-c:v", "libx264", tmp_mp4]
                                subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                                
                            # Atomic rename to prevent race condition
                            os.rename(tmp_mp4, output_mp4)
                            
                            processed.add(unique_key)
                            print(f"[Simulator] Dropped {scene_name} into {clips_dir}!")
                            
        time.sleep(2)

if __name__ == "__main__":
    generate_dummy()
