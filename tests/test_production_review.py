import json
import tempfile
import unittest
from pathlib import Path

from pauseflow.production_review import production_review, production_catalog, artifact_path


class ProductionReviewTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="money-review-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.base = self.root / "output" / "day-3"
        self.base.mkdir(parents=True)

    def save(self, name, value):
        (self.base / name).write_text(json.dumps(value), encoding="utf-8")

    def test_missing_report_is_not_presented_as_pass(self):
        review = production_review(self.root, 3)
        self.assertIsNone(review["validation"])
        self.assertFalse(review["videoAvailable"])
        self.assertEqual(review["artifacts"], [])

    def test_warning_and_production_decision_are_not_reinterpreted(self):
        report = {"gates": {"H_VISUAL_VARIETY": {"status": "WARNING", "warnings": ["Repeated layout"]}},
                  "productionDecision": {"allowed": True, "blockedBy": []}}
        self.save("validation-report.json", report)
        self.assertEqual(production_review(self.root, 3)["validation"], report)

    def test_preflight_h_is_labeled_without_fabricating_production_decision(self):
        self.save("visual-variety-report.json", {"status": "WARNING"})
        review = production_review(self.root, 3)
        self.assertEqual(review["hSource"], "preflight")
        self.assertEqual(review["visualVariety"]["status"], "WARNING")
        self.assertIsNone(review["validation"])

    def test_fail_report_does_not_hide_existing_video(self):
        self.save("validation-report.json", {"gates": {"H_VISUAL_VARIETY": {"status": "FAIL"}}, "productionDecision": {"allowed": False}})
        (self.base / "video.mp4").write_bytes(b"existing video")
        review = production_review(self.root, 3)
        self.assertTrue(review["videoAvailable"])
        self.assertFalse(review["validation"]["productionDecision"]["allowed"])

    def test_scene_times_come_from_transcript(self):
        self.save("script.json", {"scenes": [{"id": "x", "voiceText": "Exact voice", "templateData": {"template": "hook"}}]})
        self.save("transcript.json", {"scenes": [{"id": "x", "startMs": 200, "durationMs": 1234}]})
        self.assertEqual(production_review(self.root, 3)["scenes"][0]["end"], 1.434)

    def test_malformed_json_is_reported_not_silently_passed(self):
        (self.base / "validation-report.json").write_text("{broken", encoding="utf-8")
        review = production_review(self.root, 3)
        self.assertIsNone(review["validation"])
        self.assertIn("validation-report.json", review["errors"][0])

    def test_catalog_prefers_latest_day_with_h_not_unreviewed_old_video(self):
        self.save("validation-report.json", {"generatedAt": "2026-09-08T01:00:00Z", "gates": {"H_VISUAL_VARIETY": {"status": "WARNING"}}})
        later = self.root / "output" / "day-7"
        later.mkdir()
        (later / "video.mp4").write_bytes(b"old")
        self.assertEqual(production_catalog(self.root)["latestDay"], 3)

    def test_artifact_allowlist_rejects_path_traversal(self):
        for key in ["../script.json", "../../.env", "video.mp4"]:
            with self.assertRaises(ValueError):
                artifact_path(self.root, 3, key)
        with self.assertRaises(ValueError):
            artifact_path(self.root, 99, "validation")
        self.assertEqual(artifact_path(self.root, 3, "validation"), self.base / "validation-report.json")
