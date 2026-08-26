import json
import os
from typing import List
from pauseflow.prompt_generator import PromptOutput

class AIGCLabeler:
    def __init__(self):
        pass

    def label_scenes(self, prompts: List[PromptOutput], output_dir: str):
        print("Labeling AIGC content...")
        
        aigc_count = 0
        total_scenes = len(prompts)
        scenes_meta = []
        
        for prompt in prompts:
            scenes_meta.append({
                "scene_id": prompt.scene_id,
                "aigc_label_required": prompt.is_aigc
            })
            if prompt.is_aigc:
                aigc_count += 1
                
        metadata = {
            "scenes": scenes_meta,
            "uses_ai_generated_media": total_scenes > 0,
            "requires_aigc_label": aigc_count > 0,
            "platform_disclosure_recommended": total_scenes > 0,
            "review_required_before_publish": True,
        }
                
        os.makedirs(output_dir, exist_ok=True)
        metadata_path = os.path.join(output_dir, "metadata.json")
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)
            
        warning_msg = (
            "⚠️ Pre-publish review required. Because the media is generated with "
            f"CapCut/Seedance, enable the platform AI-content disclosure when applicable. "
            f"Scene-level strict label flags: {aigc_count}/{total_scenes}."
        )
        # Keep console output ASCII-safe because the Windows service may use a
        # legacy code page (for example cp1252), where emoji/Vietnamese raises
        # UnicodeEncodeError and aborts the entire Prepare request.
        print(f"\nPre-publish AI-content review required.\nMetadata saved to {metadata_path}\n")
        
        return metadata_path, warning_msg
