import os
import datetime
import re
import yaml

from pauseflow.script_agent import ScriptAgent
from pauseflow.scene_splitter import SceneSplitter
from pauseflow.prompt_generator import PromptGenerator
from pauseflow.aigc_labeler import AIGCLabeler
from pauseflow.subtitle_generator import SubtitleGenerator
from pauseflow.ffmpeg_renderer import FFmpegRenderer
from pauseflow.tts.edge_tts_backend import EdgeTTSBackend
from pauseflow.media_gen.manual_watch_backend import ManualWatchBackend

def load_config():
    with open('config.yaml', 'r') as f:
        return yaml.safe_load(f)

def run_pipeline(topic: str):
    config = load_config()
    
    # 1. Setup paths
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    topic = "Day 1 - 3 spending habits quietly making you poorer"
    
    # Create safe slug: remove all non-alphanumeric, keep spaces/dashes, then replace spaces with dashes
    safe_topic = re.sub(r'[^\w\s-]', '', topic)
    slug = re.sub(r'[-\s]+', '_', safe_topic).strip('_').lower()
    
    output_dir = os.path.join(os.getcwd(), "output", f"{date_str}_{slug}")
    clips_dir = os.path.join(output_dir, "clips")
    os.makedirs(clips_dir, exist_ok=True)
    
    # 2. Init Modules
    script_agent = ScriptAgent("money-habits-ALL-v4.md")
    scene_splitter = SceneSplitter("money-habits-ALL-v4.md")
    prompt_generator = PromptGenerator(config['style']['style_bible_path'])
    
    # Use EdgeTTS for build/demo as requested
    tts_backend = EdgeTTSBackend()
    
    # Use CapCut Semi-Auto Watch Backend
    media_gen = ManualWatchBackend(project_dir=output_dir, timeout_sec=1800, check_interval_sec=5)
    
    subtitle_gen = SubtitleGenerator()
    aigc_labeler = AIGCLabeler()
    
    # Read ffmpeg path from environment (for Docker) or fallback to config
    ffmpeg_path = os.environ.get("FFMPEG_PATH") or config.get("renderer", {}).get("ffmpeg_path", "ffmpeg")
    renderer = FFmpegRenderer(ffmpeg_path=ffmpeg_path)
    
    # --- Pipeline Execution ---
    print(f"\n--- Starting PauseFlow Pipeline for: '{topic}' ---")
    
    # Step 2: Script Generation (Markdown parser)
    script_output = script_agent.generate_script("Day 1")
    print(script_output.script)
    
    # Step 2: Scenes (Markdown parser)
    scenes = scene_splitter.split_script("Day 1")
    
    # Step 3: Prompts
    prompts = prompt_generator.generate_prompts(scenes)
    
    # Step 4: Media Generation (Manual via CapCut)
    video_clips = []
    for prompt in prompts:
        clip_path = os.path.join(clips_dir, f"scene_{prompt.scene_id}.mp4")
        media_gen.generate_video(prompt.video_prompt, clip_path)
        video_clips.append(clip_path)
        
    # Step 5: TTS
    voice_path = os.path.join(output_dir, "voice.mp3")
    tts_result = tts_backend.generate_audio(script_output.script, voice_path)
    
    # Step 6: Subtitles
    sub_path = os.path.join(output_dir, "subtitles.srt")
    subtitle_gen.generate_subtitles(tts_result.get("word_timestamps", []), voice_path, sub_path)
    
    # Step 7: AIGC Labeler (Metadata & Warnings)
    aigc_labeler.label_scenes(prompts, output_dir)
    
    # Step 8: FFmpeg Render
    final_output = os.path.join(output_dir, "final.mp4")
    music_placeholder = os.path.join(os.getcwd(), "assets", "music_library", "default.mp3")
    renderer.render(video_clips, voice_path, sub_path, music_placeholder, final_output)
    
    print(f"\n--- Pipeline Complete! Output saved to: {final_output} ---")

if __name__ == "__main__":
    run_pipeline("Day 1 - 3 spending habits quietly making you poorer")
