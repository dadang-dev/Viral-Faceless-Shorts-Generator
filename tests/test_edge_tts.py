import unittest

from pauseflow.pipeline import retime_scene_targets_from_words
from pauseflow.tts.edge_tts_backend import prepare_tts_text


class EdgeTTSSettingsTests(unittest.TestCase):
    def test_natural_punctuation_is_preserved(self):
        source = "Wait, really... yes — now!"
        self.assertEqual(source, prepare_tts_text(source, "natural"))

    def test_enhanced_punctuation_strengthens_long_breaks(self):
        self.assertEqual(
            "Wait. really; yes; now.",
            prepare_tts_text("Wait... really — yes; now.", "enhanced"),
        )

    def test_minimal_punctuation_removes_soft_breaks(self):
        self.assertEqual(
            "Wait really yes now.",
            prepare_tts_text("Wait, really… yes — now.", "minimal"),
        )

    def test_generated_word_boundaries_retime_scenes_without_cutting_words(self):
        targets = {"1": 3.0, "2": 3.0, "3": 3.0}
        words = [
            {"word": f"w{index}", "start": float(index) + 0.1239, "end": float(index) + 0.6239}
            for index in range(9)
        ]
        result = retime_scene_targets_from_words(
            targets,
            words,
            9.6,
            {"1": "one two three", "2": "four five six", "3": "seven eight nine"},
        )
        self.assertEqual({"1": 3.123, "2": 3.0, "3": 3.477}, result)


if __name__ == "__main__":
    unittest.main()
