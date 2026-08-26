import os
import sys

# Add the parent directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from pauseflow.script_agent import ScriptAgent
from pauseflow.scene_splitter import SceneSplitter

def test_parser():
    script_path = "money-habits-ALL-v4.md"
    agent = ScriptAgent(script_path)
    splitter = SceneSplitter(script_path)
    
    print(f"--- Testing Markdown Parser for {script_path} ---")
    
    for i in range(1, 8):
        day = f"Day {i}"
        try:
            output = agent.generate_script(day)
            scenes = splitter.split_script(day)
            print(f"\n✅ {day} Parsed Successfully!")
            print(f"   Script Snippet: {output.script[:80]}...")
            print(f"   Caption: {output.caption}")
            print(f"   Hashtags: {output.hashtags}")
            print(f"   Engagement: {output.engagement_prompt}")
            print(f"   Scenes count: {len(scenes)}")
            for scene in scenes:
                print(f"     - Scene {scene.scene_id} [{scene.duration_estimate_sec}s]: {scene.visual_idea[:60]}...")
        except Exception as e:
            print(f"\n❌ {day} Parsing Failed: {e}")
            sys.exit(1)

if __name__ == "__main__":
    test_parser()
