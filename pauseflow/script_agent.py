import os
import re
from typing import List
from pydantic import BaseModel

class ScriptOutput(BaseModel):
    script: str
    caption: str
    hashtags: List[str]
    engagement_prompt: str

class SceneOutput(BaseModel):
    scene: str
    visuals: str
    audio: str

class ScriptAgent:
    def __init__(self, script_path: str, metadata_path: str | None = None):
        self.script_path = script_path
        if not os.path.exists(script_path):
            raise FileNotFoundError(f"Script file not found: {script_path}")
            
        with open(script_path, 'r', encoding='utf-8') as f:
            self.content = f.read()
        self.metadata_content = ""
        if metadata_path:
            if not os.path.exists(metadata_path):
                raise FileNotFoundError(f"Metadata file not found: {metadata_path}")
            with open(metadata_path, 'r', encoding='utf-8') as f:
                self.metadata_content = f.read()

    def generate_script(self, day_identifier: str) -> ScriptOutput:
        """
        day_identifier should be something like 'Day 1'
        """
        print(f"Parsing script for: {day_identifier} from {self.script_path}")
        
        # Regex to find the section for the specific day
        # Look for ## Day 1 — "..." up to the next ## Day X or EOF
        pattern = rf"(## {day_identifier}\b.*?)(?=\n## Day \d|\n# PHẦN \d|\Z)"
        match = re.search(pattern, self.content, re.DOTALL | re.IGNORECASE)
        if not match:
            raise ValueError(f"Could not find section for {day_identifier} in the script file.")
            
        day_content = match.group(1)
        
        # Extract Voice-over
        # Format: **Voice-over:**\n> "line1"\n> "line2"
        vo_match = re.search(r'\*\*Voice-over:\*\*\s*\n(.*?)(?=\n\*\*Caption:\*\*|\Z)', day_content, re.DOTALL)
        if not vo_match:
            raise ValueError(f"Could not extract Voice-over for {day_identifier}")
            
        raw_vo = vo_match.group(1).strip()
        # Remove the blockquote characters '>' and quotes
        vo_lines = []
        for line in raw_vo.split('\n'):
            line = line.strip()
            if line.startswith('>'):
                line = line[1:].strip()
            if line.startswith('"') and line.endswith('"'):
                line = line[1:-1].strip()
            if line:
                vo_lines.append(line)
        script_text = " ".join(vo_lines)
        
        # Extract Caption
        metadata_scope = self.metadata_content or day_content
        caption_match = re.search(r'\*\*Caption:\*\*(.*?)(?=\n\*\*Engagement prompt:\*\*)', metadata_scope, re.DOTALL)
        caption_text = caption_match.group(1).strip() if caption_match else ""
        if caption_text.startswith('"') and caption_text.endswith('"'):
            caption_text = caption_text[1:-1].strip()
            
        # Extract Hashtags from caption
        hashtags = re.findall(r'#\w+', caption_text)
        
        # Extract Engagement prompt
        eng_match = re.search(r'\*\*Engagement prompt:\*\*\s*"(.*?)"', metadata_scope, re.DOTALL)
        engagement_prompt = eng_match.group(1).strip() if eng_match else ""
        
        return ScriptOutput(
            script=script_text,
            caption=caption_text,
            hashtags=hashtags,
            engagement_prompt=engagement_prompt
        )
