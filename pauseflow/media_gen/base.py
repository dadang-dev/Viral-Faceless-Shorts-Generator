from abc import ABC, abstractmethod

class MediaGenBackend(ABC):
    @abstractmethod
    def generate_video(self, video_prompt: str, output_path: str) -> str:
        """
        Generate video directly from text prompt (1-step Text-to-Video).
        Saves video to output_path.
        Returns the output path.
        """
        pass
