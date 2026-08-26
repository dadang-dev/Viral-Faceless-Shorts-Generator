import os
import subprocess
import yaml
from pauseflow.ffmpeg_renderer import FFmpegRenderer

def load_config():
    with open('config.yaml', 'r') as f:
        return yaml.safe_load(f)

def generate_dummy_media(ffmpeg_path: str, output_dir: str):
    """Generate actual playable media files using ffmpeg so the renderer has valid input."""
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Generate 2 dummy video clips (2 seconds each, red and blue)
    clip1 = os.path.join(output_dir, "scene_1.mp4")
    clip2 = os.path.join(output_dir, "scene_2.mp4")
    subprocess.run([ffmpeg_path, "-y", "-f", "lavfi", "-i", "color=c=red:s=720x1280:d=2", "-c:v", "libx264", clip1], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run([ffmpeg_path, "-y", "-f", "lavfi", "-i", "color=c=blue:s=720x1280:d=2", "-c:v", "libx264", clip2], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # 2. Generate dummy voice audio (4 seconds of 440Hz sine wave)
    voice = os.path.join(output_dir, "voice.mp3")
    subprocess.run([ffmpeg_path, "-y", "-f", "lavfi", "-i", "sine=f=440:d=4", voice], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # 3. Generate dummy background music (4 seconds of pink noise)
    music = os.path.join(output_dir, "bg_music.mp3")
    subprocess.run([ffmpeg_path, "-y", "-f", "lavfi", "-i", "anoisesrc=c=pink:d=4", music], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # 4. Generate dummy subtitle file
    sub = os.path.join(output_dir, "subtitles.srt")
    with open(sub, "w", encoding="utf-8") as f:
        f.write("1\n00:00:00,000 --> 00:00:02,000\nThis is scene one (Red)\n\n")
        f.write("2\n00:00:02,000 --> 00:00:04,000\nThis is scene two (Blue)\n\n")
        
    return [clip1, clip2], voice, music, sub

def test_phase3():
    print("\n--- Testing Phase 3: FFmpeg Renderer ---")
    config = load_config()
    ffmpeg_path = config.get("renderer", {}).get("ffmpeg_path", "ffmpeg")
    bg_vol = config.get("renderer", {}).get("bg_music_volume", 0.15)
    
    output_dir = os.path.join(os.getcwd(), "output", "test_phase3")
    final_output = os.path.join(output_dir, "final_test.mp4")
    
    print(f"Generating dummy playable media with {ffmpeg_path}...")
    try:
        video_clips, voice_path, music_path, sub_path = generate_dummy_media(ffmpeg_path, output_dir)
        print("Dummy media generated.")
    except Exception as e:
        print(f"Failed to generate dummy media. Is ffmpeg path correct? Path: {ffmpeg_path}")
        return

    print("Running FFmpegRenderer...")
    renderer = FFmpegRenderer(ffmpeg_path=ffmpeg_path, bg_music_volume=bg_vol)
    try:
        renderer.render(video_clips, voice_path, sub_path, music_path, final_output)
        print(f"\n--- Phase 3 Test: PASS ---")
        print(f"Final video saved at: {final_output}")
    except Exception as e:
        print(f"\n--- Phase 3 Test: FAIL ---")
        
if __name__ == "__main__":
    test_phase3()
