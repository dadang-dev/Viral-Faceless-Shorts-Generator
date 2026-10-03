import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

import yaml

from pauseflow.pipeline import PauseFlowPipeline, map_voice_to_scenes
from pauseflow.production_rules import DAY_TITLE_CARDS, GROUPED_VIDEO_TITLE_CARDS
from pauseflow.quality_control import probe_media
from pauseflow.scene_splitter import SceneSplitter
from pauseflow.script_agent import ScriptAgent


ROOT = Path(__file__).resolve().parents[1]


class CorePipelineTests(unittest.TestCase):
    def test_locked_audio_is_longer_than_sixty_seconds(self):
        path = ROOT / "output" / "day-1" / "voice.mp3"
        self.assertTrue(path.is_file(), "Run Day 1 validation/TTS before the acceptance suite")
        # Prefer the same explicit runtime binary used by frame-level QA. The
        # Windows App Execution Alias can resolve `ffprobe` while denying
        # child-process execution, so an injected path is the portable escape.
        ffprobe = os.environ.get("MONEYHABITS_FFPROBE") or shutil.which("ffprobe")
        self.assertIsNotNone(ffprobe)
        result = subprocess.run(
            [ffprobe, "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
            capture_output=True, text=True, check=True,
        )
        self.assertGreater(float(result.stdout.strip()), 60.0)

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
        scenes = SceneSplitter(str(ROOT / "video-prompts-8-10s.md")).split_script("Day 1")
        self.assertEqual(7, len(scenes))
        for scene in scenes:
            prompt = scene.visual_idea
            self.assertIn("Image-to-video from the approved grouped", prompt)
            self.assertRegex(prompt, r"(?i)(do not|no new|never|with no)")
            self.assertRegex(prompt, r"(?i)(hold|final .+ still|last .+ still)")

    def test_all_video_prompts_follow_locked_image_to_video_rules(self):
        splitter = SceneSplitter(str(ROOT / "video-prompts-8-10s.md"))
        expected_counts = (7, 7, 7, 7, 7, 7, 7)
        for day, expected_count in enumerate(expected_counts, 1):
            scenes = splitter.split_script(f"Day {day}")
            self.assertEqual(expected_count, len(scenes))
            for scene in scenes:
                prompt = scene.visual_idea
                self.assertTrue(
                    prompt.startswith("Image-to-video from the approved grouped"),
                    f"Day {day} scene {scene.scene_id} is not an image-to-video prompt",
                )
                self.assertRegex(prompt, r"(?i)(single|one) continuous(?: [a-z0-9:]+){0,2} shot")
                self.assertRegex(prompt, r"(?i)(preserve|lock)")
                self.assertRegex(prompt, r"(?i)(do not|no new|never|with no)")
                self.assertRegex(prompt, r"(?i)(hold|final .+ still|last .+ still)")
                self.assertRegex(prompt, r"(?i)(?:generation )?duration: \d+(?:\.\d+)? seconds?")

    def test_every_generated_video_is_capped_at_ten_seconds(self):
        splitter = SceneSplitter(str(ROOT / "video-prompts-8-10s.md"))
        generation_duration_pattern = __import__("re").compile(
            r"(?i)(?:generation )?duration:\s*(\d+(?:\.\d+)?)\s+seconds?"
        )
        for day in range(1, 8):
            for scene in splitter.split_script(f"Day {day}"):
                match = generation_duration_pattern.search(scene.visual_idea)
                self.assertIsNotNone(match, f"Missing generation duration in Day {day} scene {scene.scene_id}")
                self.assertLessEqual(
                    float(match.group(1)), 10.0,
                    f"Day {day} scene {scene.scene_id} exceeds the provider's 10-second limit",
                )
                self.assertGreaterEqual(
                    float(match.group(1)), 8.0,
                    f"Day {day} scene {scene.scene_id} is shorter than the 8-second grouping target",
                )

    def test_video_prompt_durations_remain_voice_locked(self):
        expected = {
            1: [9.8, 9.36, 9.659, 8.021, 9.08, 9.599, 8.481],
            2: [9.199, 8.7, 9.5, 9.521, 9.239, 9.941, 9.9],
            3: [8.4, 9.639, 9.48, 9.52, 9.68, 9.601, 9.68],
            4: [9.359, 9.641, 9.66, 9.999, 9.801, 9.899, 9.641],
            5: [8.599, 9.381, 9.819, 8.36, 9.1, 9.441, 9.3],
            6: [9.599, 8.341, 9.919, 9.9, 9.92, 8.641, 9.18],
            7: [9.32, 9.8, 9.959, 9.801, 9.699, 9.921, 9.5],
        }
        splitter = SceneSplitter(str(ROOT / "video-prompts-8-10s.md"))
        for day, expected_durations in expected.items():
            scenes = splitter.split_script(f"Day {day}")
            self.assertEqual(expected_durations, [scene.duration_estimate_sec for scene in scenes])

    def test_grouped_video_prompts_map_to_all_locked_voice_words(self):
        splitter = SceneSplitter(str(ROOT / "video-prompts-8-10s.md"))
        expected_totals = (64.0, 66.0, 66.0, 68.0, 64.0, 65.5, 68.0)
        for day, expected_total in enumerate(expected_totals, 1):
            scenes = splitter.split_script(f"Day {day}")
            subtitle_version = "v4_timing" if day == 1 else "v3_timing"
            subtitle_path = ROOT / "output" / subtitle_version / f"day{day}" / "subtitles.srt"
            voice_text, ranges = map_voice_to_scenes(
                subtitle_path,
                {str(scene.scene_id): scene.duration_estimate_sec for scene in scenes},
            )
            self.assertEqual(7, len(voice_text))
            self.assertTrue(all(voice_text.values()))
            self.assertAlmostEqual(expected_total, ranges["7"]["end"])

    def test_video_prompts_lock_scene_specific_numbers_and_title_plates(self):
        splitter = SceneSplitter(str(ROOT / "video-prompts-8-10s.md"))
        required_labels = {
            (2, 2): ["+$200 / MONTH"],
            (2, 4): ["SPENDING ↑ = INCOME ↑"],
            (2, 6): ["INCOME +20%", "SAVINGS: SAME"],
            (3, 3): ["$7", "$12"],
            (3, 4): ["$20"],
            (3, 5): ["$300–$400 / MONTH"],
            (4, 2): ["10 MINUTES"],
            (4, 3): ["RELIEF: 10 MIN", "BILL: STILL HERE"],
            (4, 6): ["TIRED", "BORED", "ANXIOUS"],
            (5, 2): ["GUESS: 3–4", "ACTUAL: 8–12"],
            (5, 5): ["5 MINUTES"],
            (5, 6): ["+1 MONTH", "10 SEC EACH"],
            (6, 6): ["$5"],
            (7, 6): ["five numbered tokens 1 through 5"],
        }
        all_scenes = {
            (day, scene.scene_id): scene
            for day in range(1, 8)
            for scene in splitter.split_script(f"Day {day}")
        }
        for key, labels in required_labels.items():
            for label in labels:
                self.assertIn(label, all_scenes[key].visual_idea, f"Missing {label!r} in Day {key[0]} scene {key[1]}")
        for day, cards in GROUPED_VIDEO_TITLE_CARDS.items():
            for scene_id in cards:
                prompt = all_scenes[(day, int(scene_id))].visual_idea.lower()
                self.assertRegex(prompt, r"(headline|title|plate)")
                self.assertRegex(prompt, r"(clear|unobstructed|empty|blank)")

    def test_source_contract_uses_approved_v2_and_auxiliary_metadata(self):
        config = yaml.safe_load((ROOT / "config.yaml").read_text(encoding="utf-8"))
        self.assertEqual("money-habits-script-v2.1-verified.md", config["project"]["script_path"])
        self.assertEqual("money-habits-ALL.md", config["project"]["auxiliary_script_path"])
        pipeline = PauseFlowPipeline(config, root=ROOT)
        result = pipeline.script_agent.generate_script("Day 1")
        self.assertIn("three habits working against you", result.script)
        self.assertIn("about a hundred and seventy dollars a month", result.script)
        self.assertIn("over two hundred dollars a month", result.script)
        self.assertNotIn("entire grocery budget", result.script)
        self.assertNotIn("three habits spending in the background", result.script)
        self.assertIn("#MoneyHabits", result.caption)

    def test_no_v4_voice_source_in_runtime_config(self):
        config_text = (ROOT / "config.yaml").read_text(encoding="utf-8")
        self.assertNotIn('script_path: "money-habits-ALL-v4.md"', config_text)


if __name__ == "__main__":
    unittest.main()
