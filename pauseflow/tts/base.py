from abc import ABC, abstractmethod

class TTSBackend(ABC):
    @abstractmethod
    def generate_audio(self, text: str, output_path: str) -> dict:
        """
        Generate audio from text and save to output_path.
        Returns a dictionary which may contain 'word_timestamps'.
        """
        pass
