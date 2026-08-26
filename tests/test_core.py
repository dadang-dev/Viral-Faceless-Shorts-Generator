import json
import tempfile
import unittest
from pathlib import Path

import yaml

from pauseflow.pipeline import PauseFlowPipeline, map_voice_to_scenes
from pauseflow.production_rules import DAY_TITLE_CARDS
from pauseflow.quality_control import probe_media
from pauseflow.scene_splitter import SceneSplitter
from pauseflow.script_agent import ScriptAgent


ROOT = Path(__file__).resolve().parents[1]


class CorePipelineTests(unittest.TestCase):
    def test_locked_audio_is_longer_than_sixty_seconds(self):
        ffmpeg = str(ROOT / "venv/bin/ffmpeg")
        for day in range(1, 8):
            version = "v4_duration_test" if day == 1 else "v3_duration_test"
            path = ROOT / "output" / version / f"day{day}" / "voice.mp3"
            # Audio-only files do not have video dimensions, so inspect duration directly.
            result = __import__("subprocess").run([ffmpeg, "-i", str(path)], capture_output=True, text=True)
            match = __import__("re").search(r"Duration: (\d\d):(\d\d):(\d\d\.\d+)", result.stderr)
            self.assertIsNotNone(match)
            hours, minutes, seconds = match.groups()
            duration = int(hours) * 3600 + int(minutes) * 60 + float(seconds)
            self.assertGreater(duration, 60.0)

    def test_v4_preserves_locked_voice_and_scene_counts(self):
        v3 = ScriptAgent(str(ROOT / "money-habits-ALL-v3.md"))
        v4 = ScriptAgent(str(ROOT / "money-habits-ALL-v4.md"))
        splitter = SceneSplitter(str(ROOT / "money-habits-ALL-v4.md"))
        for day, expected in enumerate((19, 13, 13, 13, 13, 12, 15), 1):
            key = f"Day {day}"
            if day > 1:
                self.assertEqual(v3.generate_script(key).script, v4.generate_script(key).script)
            else:
                self.assertIn("more than a hundred and seventy dollars", v4.generate_script(key).script)
                self.assertIn("basically fifteen", v4.generate_script(key).script)
            self.assertEqual(expected, len(splitter.split_script(key)))

    def test_all_scene_boundaries_follow_complete_spoken_ideas(self):
        splitter = SceneSplitter(str(ROOT / "money-habits-ALL-v4.md"))
        expected_counts = (19, 13, 13, 13, 13, 12, 15)
        for day, expected_count in enumerate(expected_counts, 1):
            scenes = splitter.split_script(f"Day {day}")
            subtitle_version = "v4_timing" if day == 1 else "v3_timing"
            subtitle_path = ROOT / "output" / subtitle_version / f"day{day}" / "subtitles.srt"
            targets = {
                str(scene.scene_id): scene.duration_estimate_sec
                for scene in scenes
            }
            voice_text, ranges = map_voice_to_scenes(subtitle_path, targets)
            self.assertEqual(expected_count, len(voice_text))
            self.assertTrue(all(voice_text.values()))
            self.assertAlmostEqual(
                sum(scene.duration_estimate_sec for scene in scenes),
                ranges[str(expected_count)]["end"],
            )

    def test_each_day_has_configured_title_cards(self):
        for day in range(1, 8):
            self.assertIn(day, DAY_TITLE_CARDS)
            self.assertTrue(DAY_TITLE_CARDS[day])

    def test_day1_scene_boundaries_follow_spoken_ideas(self):
        scenes = SceneSplitter(str(ROOT / "money-habits-ALL-v4.md")).split_script("Day 1")
        expected_durations = [
            1.8, 4.9, 2.7, 2.9, 1.6, 3.1, 3.3, 3.0, 2.9, 2.3,
            6.9, 3.1, 3.0, 1.6, 6.7, 5.3, 3.9, 1.5, 3.5,
        ]
        self.assertEqual(expected_durations, [scene.duration_estimate_sec for scene in scenes])
        self.assertAlmostEqual(64.0, sum(expected_durations))
        boundaries = []
        elapsed = 0.0
        for duration in expected_durations:
            boundaries.append((round(elapsed, 1), round(elapsed + duration, 1)))
            elapsed += duration
        self.assertEqual((6.7, 9.4), boundaries[2])   # Number one: subscription creep
        self.assertEqual((20.3, 23.3), boundaries[7])  # Number two: convenience spending
        self.assertEqual((35.4, 38.5), boundaries[11]) # Number three: rounding down in your head

    def test_day1_video_prompts_are_locked_image_to_video_shots(self):
        scenes = SceneSplitter(str(ROOT / "money-habits-ALL-v4.md")).split_script("Day 1")
        self.assertEqual(19, len(scenes))
        for scene in scenes:
            prompt = scene.visual_idea
            self.assertIn("Image-to-video from the approved scene image", prompt)
            self.assertRegex(prompt, r"(?i)(do not|no new|never|with no)")
            self.assertRegex(prompt, r"(?i)(hold|final .+ still|last .+ still)")

    def test_prepare_creates_complete_nonblocking_package(self):
        config = yaml.safe_load((ROOT / "config.yaml").read_text(encoding="utf-8"))
        with tempfile.TemporaryDirectory() as directory:
            config["project"]["output_dir"] = directory
            pipeline = PauseFlowPipeline(config, root=ROOT)
            output = pipeline.prepare([1])[0]
            manifest = json.loads((output / "manifest.json").read_text(encoding="utf-8"))
            self.assertEqual(19, manifest["scene_count"])
            self.assertEqual(19, len(list((output / "pending_prompts").glob("scene_*.txt"))))
            self.assertEqual(["3 QUIET HABITS"], manifest["title_cards"]["2"]["lines"])
            first_image_prompt = (output / "pending_prompts" / "image" / "scene_1.txt").read_text(encoding="utf-8")
            self.assertIn("colorful polished 2.5D editorial illustration", first_image_prompt)
            self.assertIn("green dollar bills", first_image_prompt)
            self.assertNotIn("single gold/amber accent color", first_image_prompt)
            for prompt_path in (output / "pending_prompts").glob("**/scene_*.txt"):
                prompt_text = prompt_path.read_text(encoding="utf-8").rstrip("\n")
                self.assertNotIn("\n", prompt_text)
            self.assertTrue((output / "voice.mp3").is_file())
            self.assertTrue((output / "subtitles.srt").is_file())
            self.assertTrue((output / "metadata.json").is_file())

    def test_render_fails_fast_when_manual_clips_are_missing(self):
        config = yaml.safe_load((ROOT / "config.yaml").read_text(encoding="utf-8"))
        with tempfile.TemporaryDirectory() as directory:
            config["project"]["output_dir"] = directory
            pipeline = PauseFlowPipeline(config, root=ROOT)
            pipeline.prepare([1])
            with self.assertRaisesRegex(FileNotFoundError, "Missing manual CapCut clips"):
                pipeline.render([1])


if __name__ == "__main__":
    unittest.main()
