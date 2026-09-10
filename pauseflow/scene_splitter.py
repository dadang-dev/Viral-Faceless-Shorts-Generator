import os
import re
from typing import List
from pydantic import BaseModel

class SceneOutput(BaseModel):
    scene_id: int
    voice_line: str
    visual_idea: str
    image_visual_idea: str = ""
    duration_estimate_sec: float
    is_aigc: bool = False

class SceneSplitter:
    def __init__(self, script_path: str):
        self.script_path = script_path
        if not os.path.exists(script_path):
            raise FileNotFoundError(f"Script file not found: {script_path}")
            
        with open(script_path, 'r', encoding='utf-8') as f:
            self.content = f.read()

    def split_script(self, day_identifier: str) -> List[SceneOutput]:
        print(f"Extracting scenes for {day_identifier} from Part 2 of {self.script_path}...")
        
        # Find Part 2
        part2_match = re.search(r'# PHẦN 2 — Prompt ảnh/video AI cho từng cảnh(.*)', self.content, re.DOTALL | re.IGNORECASE)
        if not part2_match:
            raise ValueError("Could not find PHẦN 2 in the script file.")
            
        part2_content = part2_match.group(1)
        
        # Find the specific day within Part 2
        pattern = rf"(## {day_identifier}\b.*?)(?=\n## Day \d|\n# PHẦN \d|\Z)"
        day_match = re.search(pattern, part2_content, re.DOTALL | re.IGNORECASE)
        if not day_match:
            raise ValueError(f"Could not find section for {day_identifier} in Part 2.")
            
        day_content = day_match.group(1)
        
        # Extract scenes
        # Each scene starts with **Cảnh X
        scenes = []
        scene_blocks = re.split(r'\n\*\*Cảnh \d+', day_content)
        
        for i in range(1, len(scene_blocks)):
            block = scene_blocks[i]
            
            # Extract video prompt
            # - *Prompt video:* `...`
            prompt_match = re.search(r'-\s*\*Prompt video:\*\s*`(.*?)`', block, re.DOTALL | re.IGNORECASE)
            image_prompt_match = re.search(r'-\s*\*Prompt ảnh:\*\s*`(.*?)`', block, re.DOTALL | re.IGNORECASE)
            
            if prompt_match:
                video_prompt = prompt_match.group(1).strip()
                
                # Try to extract duration from the prompt (e.g. "4 seconds")
                # Prefer declarations such as "within 6 seconds", "cover 13 seconds"
                # or "create a fast 14-second..." over internal pacing numbers.
                # A provider may cap generated clips below the locked voice target.
                # In that case the uploaded clip is safely retimed by the Fit scene action.
                voice_target = re.search(
                    r'\bvoice target(?: after attachment)?:\s*(\d+(?:\.\d+)?)\s+seconds?\b',
                    video_prompt,
                    re.IGNORECASE,
                )
                declared_duration = re.search(
                    r'\b(?:within|cover|duration:)\s+(\d+(?:\.\d+)?)\s+seconds?\b|'
                    r'\bcreate\s+an?\s+(?:\w+\s+){0,3}?(\d+(?:\.\d+)?)-second\b|'
                    r'\b9:16\s+vertical,\s*(\d+(?:\.\d+)?)\s+seconds?\b',
                    video_prompt,
                    re.IGNORECASE,
                )
                if voice_target:
                    duration = float(voice_target.group(1))
                elif declared_duration:
                    duration = float(next(value for value in declared_duration.groups() if value))
                else:
                    duration_matches = re.findall(r'(?<![.\d])(\d+)\s*seconds?\b', video_prompt, re.IGNORECASE)
                    duration = float(duration_matches[-1]) if duration_matches else 5.0
                
                # Check for AIGC requirements (2-step or photorealistic)
                is_aigc = False
                if '2-step' in block.lower() or 'photorealistic' in video_prompt.lower():
                    is_aigc = True
                
                scenes.append(SceneOutput(
                    scene_id=i,
                    voice_line="", # Voice line is no longer mapped 1-to-1 here, and isn't used by TTS anyway
                    visual_idea=video_prompt,
                    image_visual_idea=image_prompt_match.group(1).strip() if image_prompt_match else "",
                    duration_estimate_sec=duration,
                    is_aigc=is_aigc
                ))
                
        return scenes
