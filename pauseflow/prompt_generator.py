from pydantic import BaseModel
from typing import List
from pauseflow.scene_splitter import SceneOutput

class PromptOutput(BaseModel):
    scene_id: int
    image_prompt: str
    video_prompt: str
    is_aigc: bool = False

class PromptGenerator:
    def __init__(self, style_bible_path: str):
        with open(style_bible_path, 'r', encoding='utf-8') as f:
            self.style_bible = f.read().strip()

    def generate_prompts(self, scenes: List[SceneOutput], style_bible: str = "") -> List[PromptOutput]:
        print("Generating image and video prompts for scenes...")
        active_style_bible = style_bible.strip() or self.style_bible
        prompts = []
        for scene in scenes:
            # Replace the placeholder from the markdown prompt with the actual style bible
            video_prompt = scene.visual_idea.replace("[+ Style Bible]", active_style_bible)
            if "[+ Style Bible]" not in scene.visual_idea:
                video_prompt = f"{active_style_bible}\n{video_prompt}"
            image_prompt = scene.image_visual_idea.replace("[+ Style Bible]", active_style_bible)
            if image_prompt and "[+ Style Bible]" not in scene.image_visual_idea:
                image_prompt = f"{active_style_bible}\n{image_prompt}"
            if not image_prompt:
                image_prompt = (
                    "Create a single vertical 9:16 still keyframe for this scene. "
                    "Show the clearest story moment with a deliberate composition, consistent characters "
                    "and props, and no captions, logos, UI, motion blur, or multi-panel layout. "
                    f"Use the attached character reference sheet. Scene brief: {video_prompt}"
                )

            # Provider-ready prompts are one continuous line. The UI may wrap text visually,
            # but no authored newline or empty line is sent to an image/video provider.
            video_prompt = " ".join(line.strip() for line in video_prompt.splitlines() if line.strip())
            image_prompt = " ".join(line.strip() for line in image_prompt.splitlines() if line.strip())
            
            prompts.append(PromptOutput(
                scene_id=scene.scene_id,
                image_prompt=image_prompt,
                video_prompt=video_prompt,
                is_aigc=scene.is_aigc
            ))
        return prompts
