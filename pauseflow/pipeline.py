import json
import math
import os
import re
import shutil
from pathlib import Path
from typing import Iterable, Optional

from pauseflow.aigc_labeler import AIGCLabeler
from pauseflow.ffmpeg_renderer import FFmpegRenderer
from pauseflow.prompt_generator import PromptGenerator
from pauseflow.production_rules import WORKFLOW_RULES, title_cards_for_day
from pauseflow.quality_control import probe_duration, save_report, validate_final
from pauseflow.scene_splitter import SceneSplitter
from pauseflow.script_agent import ScriptAgent
from pauseflow.subtitle_generator import SubtitleGenerator
from pauseflow.tts.edge_tts_backend import EdgeTTSBackend


DAY_SLUGS = {
    1: "3_spending_habits",
    2: "lifestyle_creep",
    3: "girl_math",
    4: "emotional_spending",
    5: "subscription_creep",
    6: "scarcity_mindset",
    7: "week_recap",
}


def _srt_seconds(value: str) -> float:
    hours, minutes, rest = value.replace(",", ".").split(":")
    return int(hours) * 3600 + int(minutes) * 60 + float(rest)


def map_voice_to_scenes(subtitle_path: Path, scene_targets: dict[str, float]) -> tuple[dict, dict]:
    """Map subtitle words to semantic scenes and reject boundaries that cut a spoken cue."""
    content = subtitle_path.read_text(encoding="utf-8")
    cues = [
        (_srt_seconds(start), _srt_seconds(end), text.strip())
        for start, end, text in re.findall(
            r"\d+\s*\n(\d\d:\d\d:\d\d,\d{3}) --> (\d\d:\d\d:\d\d,\d{3})\s*\n([^\n]+)",
            content,
        )
    ]
    ranges: dict[str, dict[str, float]] = {}
    elapsed = 0.0
    for scene, duration in scene_targets.items():
        end = round(elapsed + float(duration), 3)
        ranges[scene] = {"start": round(elapsed, 3), "end": end}
        elapsed = end

    internal_boundaries = [value["end"] for value in list(ranges.values())[:-1]]
    for boundary in internal_boundaries:
        crossing = [text for start, end, text in cues if start < boundary < end]
        if crossing:
            raise ValueError(
                f"Scene boundary {boundary:.3f}s cuts subtitle cue: {' '.join(crossing)}"
            )

    voice_text: dict[str, str] = {}
    for scene, time_range in ranges.items():
        words = [
            text for start, end, text in cues
            if start >= time_range["start"] and end <= time_range["end"]
        ]
        voice_text[scene] = " ".join(words)
    return voice_text, ranges


class PauseFlowPipeline:
    """Core Money Habits pipeline; GUI and CLI should orchestrate this class."""

    def __init__(self, config: dict, root: Optional[Path] = None):
        self.root = (root or Path.cwd()).resolve()
        self.config = config
        self.script_path = self.root / config["project"]["script_path"]
        self.output_root = self.root / config["project"]["output_dir"]
        self.script_agent = ScriptAgent(str(self.script_path))
        self.scene_splitter = SceneSplitter(str(self.script_path))
        self.prompt_generator = PromptGenerator(str(self.root / config["style"]["style_bible_path"]))
        self.aigc_labeler = AIGCLabeler()

    def day_dir(self, day: int) -> Path:
        return self.output_root / f"day{day}_{DAY_SLUGS[day]}"

    def prepare(self, days: Iterable[int], regenerate_audio: bool = False, media_type: str = "video") -> list[Path]:
        prepared = []
        for day in days:
            day_id = f"Day {day}"
            output_dir = self.day_dir(day)
            pending_dir = output_dir / "pending_prompts"
            manual_dir = output_dir / "manual_clips"
            pending_dir.mkdir(parents=True, exist_ok=True)
            image_prompt_dir = pending_dir / "image"
            video_prompt_dir = pending_dir / "video"
            image_prompt_dir.mkdir(exist_ok=True)
            video_prompt_dir.mkdir(exist_ok=True)
            manual_dir.mkdir(parents=True, exist_ok=True)

            script = self.script_agent.generate_script(day_id)
            scenes = self.scene_splitter.split_script(day_id)
            day_style = (self.root / "assets" / "style_bible_day1.txt").read_text(encoding="utf-8")
            prompts = self.prompt_generator.generate_prompts(scenes, style_bible=day_style)
            for prompt in prompts:
                (pending_dir / f"scene_{prompt.scene_id}.txt").write_text(
                    prompt.video_prompt + "\n", encoding="utf-8"
                )
                (video_prompt_dir / f"scene_{prompt.scene_id}.txt").write_text(
                    prompt.video_prompt + "\n", encoding="utf-8"
                )
                (image_prompt_dir / f"scene_{prompt.scene_id}.txt").write_text(
                    prompt.image_prompt + "\n", encoding="utf-8"
                )

            voice_path = output_dir / "voice.mp3"
            subtitle_path = output_dir / "subtitles.srt"
            if regenerate_audio:
                EdgeTTSBackend(voice=self.config["tts"]["voice"]).generate_audio(
                    script.script, str(voice_path)
                )
                self._with_ffmpeg_path(
                    lambda: SubtitleGenerator().generate_subtitles([], str(voice_path), str(subtitle_path))
                )
            else:
                source_audio = self._locked_audio(day)
                timing_version = "v4_timing" if day == 1 else "v3_timing"
                source_srt = self.root / "output" / timing_version / f"day{day}" / "subtitles.srt"
                if not source_audio.exists() or not source_srt.exists():
                    raise FileNotFoundError(
                        f"Locked audio/SRT missing for Day {day}; rerun with --regenerate-audio"
                    )
                shutil.copy2(source_audio, voice_path)
                shutil.copy2(source_srt, subtitle_path)

            scene_targets = {str(scene.scene_id): float(scene.duration_estimate_sec) for scene in scenes}
            ffmpeg_path = self._get_ffmpeg_path()
            voice_duration = probe_duration(ffmpeg_path, str(voice_path))
            target_total = sum(scene_targets.values())
            if scenes and target_total < voice_duration:
                last_key = str(scenes[-1].scene_id)
                scene_targets[last_key] = round(
                    scene_targets[last_key] + math.ceil((voice_duration - target_total + 0.1) * 10) / 10,
                    1,
                )
            scene_voice_text, scene_time_ranges = map_voice_to_scenes(subtitle_path, scene_targets)

            self.aigc_labeler.label_scenes(prompts, str(output_dir))
            manifest = {
                "day": day,
                "media_type": media_type,
                "source": str(self.script_path.relative_to(self.root)),
                "voice_locked": not regenerate_audio,
                "scene_count": len(scenes),
                "prompt_duration_seconds": sum(s.duration_estimate_sec for s in scenes),
                "manual_clip_directory": str(manual_dir),
                "expected_clips": [f"scene_{i}.mp4" for i in range(1, len(scenes) + 1)],
                "scene_target_seconds": scene_targets,
                "scene_voice_text": scene_voice_text,
                "scene_time_ranges": scene_time_ranges,
                "title_cards": title_cards_for_day(day),
                "workflow_rules": WORKFLOW_RULES,
                "caption": script.caption,
                "hashtags": script.hashtags,
                "engagement_prompt": script.engagement_prompt,
            }
            (output_dir / "manifest.json").write_text(
                json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
            )
            prepared.append(output_dir)
            print(f"Prepared {day_id}: {len(scenes)} prompts -> {output_dir}")
        return prepared

    def render(self, days: Iterable[int], settings: Optional[dict] = None) -> list[Path]:
        outputs = []
        render_settings = settings or {}
        renderer = FFmpegRenderer(
            ffmpeg_path=self._get_ffmpeg_path(),
            bg_music_volume=float(render_settings.get("music_volume", self.config["renderer"]["bg_music_volume"])),
        )
        for day in days:
            output_dir = self.day_dir(day)
            manifest_path = output_dir / "manifest.json"
            if not manifest_path.exists():
                raise FileNotFoundError(f"Day {day} is not prepared: {manifest_path}")
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            clips = [output_dir / "manual_clips" / name for name in manifest["expected_clips"]]
            missing = [str(path) for path in clips if not path.is_file() or path.stat().st_size == 0]
            if missing:
                raise FileNotFoundError("Missing manual CapCut clips:\n" + "\n".join(missing))
            voice_duration = probe_duration(renderer.ffmpeg_path, str(output_dir / "voice.mp3"))
            footage_duration = round(sum(probe_duration(renderer.ffmpeg_path, str(path)) for path in clips), 2)
            if footage_duration < voice_duration:
                raise RuntimeError(
                    f"Footage is {footage_duration:.2f}s but voice is {voice_duration:.2f}s; "
                    f"attach at least {voice_duration - footage_duration:.2f}s more real footage"
                )
            final_path = output_dir / "final.mp4"
            subtitle_settings = {
                "voice_volume": float(render_settings.get("voice_volume", 1.0)),
                "subtitle_font_size": int(render_settings.get("subtitle_font_size", 20)),
                "subtitle_margin_bottom": int(render_settings.get("subtitle_margin_bottom", 55)),
                "subtitle_color": render_settings.get("subtitle_color", "white"),
                "subtitle_style": render_settings.get("subtitle_style", "outline"),
            }
            renderer.render(
                video_clips=[str(path) for path in clips],
                voice_path=str(output_dir / "voice.mp3"),
                sub_path=str(output_dir / "subtitles.srt"),
                music_path=str(self.root / self.config["renderer"]["music_path"]),
                output_path=str(final_path),
                **subtitle_settings,
            )
            qc = validate_final(renderer.ffmpeg_path, str(final_path))
            save_report(qc, str(output_dir / "qc_report.json"))
            if not qc["pass"]:
                raise RuntimeError(f"Day {day} failed QC checks: {qc['checks']}")
            outputs.append(final_path)
            print(f"Rendered day{day} -> {final_path}")
        return outputs

    def status(self, days: Iterable[int]) -> list[dict]:
        result = []
        for day in days:
            output_dir = self.day_dir(day)
            manifest_path = output_dir / "manifest.json"
            if not manifest_path.exists():
                result.append({"day": day, "prepared": False, "clips": "0/0", "footage_seconds": 0, "voice_seconds": 0, "ready": False, "rendered": False})
                continue
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            clip_paths = [output_dir / "manual_clips" / name for name in manifest["expected_clips"]]
            found = sum(path.is_file() for path in clip_paths)
            ffmpeg_path = self._get_ffmpeg_path()
            footage = round(sum(probe_duration(ffmpeg_path, str(path)) for path in clip_paths if path.is_file()), 2)
            voice_path = output_dir / "voice.mp3"
            voice = probe_duration(ffmpeg_path, str(voice_path)) if voice_path.is_file() else 0
            result.append({
                "day": day,
                "prepared": True,
                "clips": f"{found}/{manifest['scene_count']}",
                "footage_seconds": footage,
                "voice_seconds": voice,
                "ready": found == manifest["scene_count"] and footage >= voice,
                "rendered": (output_dir / "final.mp4").is_file(),
            })
        return result

    def _locked_audio(self, day: int) -> Path:
        version = "v4_duration_test" if day == 1 else "v3_duration_test"
        return self.root / "output" / version / f"day{day}" / "voice.mp3"

    def _get_ffmpeg_path(self) -> str:
        ffmpeg = os.environ.get("FFMPEG_PATH") or self.config.get("renderer", {}).get("ffmpeg_path", "ffmpeg")
        if ffmpeg != "ffmpeg" and (self.root / ffmpeg).exists():
            return str(self.root / ffmpeg)
        return ffmpeg

    def _with_ffmpeg_path(self, callback):
        ffmpeg = os.environ.get("FFMPEG_PATH") or self.config.get("renderer", {}).get("ffmpeg_path", "ffmpeg")
        target = self.root / ffmpeg
        if target.exists():
            bin_dir = str(target.parent)
            previous = os.environ.get("PATH", "")
            os.environ["PATH"] = bin_dir + os.pathsep + previous
            try:
                return callback()
            finally:
                os.environ["PATH"] = previous
        return callback()
