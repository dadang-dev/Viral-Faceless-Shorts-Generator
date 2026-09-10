"""Read-only projection of canonical Money Habits production artifacts for the GUI."""
import json
from pathlib import Path

ARTIFACTS = {
    "validation": "validation-report.json", "script": "script.json",
    "transcript": "transcript.json", "numbers": "number_highlights.json",
    "visual-plan": "visual-plan.json", "tests": "test-results.json",
    "qa-manifest": "qa-v11/qa-manifest.json",
    "poster": "qa-v11/overall-00.png",
    "visual-variety": "visual-variety-report.json",
    "overall": "qa-v11/overall-contact.png", "hook": "qa-v11/hook-contact.png",
    "boundaries-1": "qa-v11/boundaries-1-contact.png",
    "boundaries-2": "qa-v11/boundaries-2-contact.png",
    "boundaries-3": "qa-v11/boundaries-3-contact.png",
    "outro-1": "qa-v11/outro-1-contact.png", "outro-2": "qa-v11/outro-2-contact.png",
    "outro-3": "qa-v11/outro-3-contact.png", "outro-4": "qa-v11/outro-4-contact.png",
    "long-hold-3": "qa-v11/long-hold-scene-3-contact.png",
    "long-hold-7": "qa-v11/long-hold-scene-7-contact.png",
    "long-hold-8": "qa-v11/long-hold-scene-8-contact.png",
    "long-hold-10": "qa-v11/long-hold-scene-10-contact.png",
    "metric-7": "qa-v11/iced-coffee-7-contact.png",
    "metric-12": "qa-v11/phone-case-12-contact.png",
}


def day_directory(root: Path, day: int) -> Path:
    if day not in range(1, 8):
        raise ValueError("Day must be from 1 to 7")
    return root / "output" / f"day-{day}"


def artifact_path(root: Path, day: int, key: str) -> Path:
    base = day_directory(root, day).resolve()
    if key not in ARTIFACTS:
        raise ValueError("Unknown artifact")
    target = (base / ARTIFACTS[key]).resolve()
    if not target.is_relative_to(base):
        raise ValueError("Artifact must stay inside the Day output")
    return target


def production_review(root: Path, day: int) -> dict:
    base = day_directory(root, day)
    errors = []

    def read(name):
        path = base / name
        if not path.is_file():
            return None
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(value, dict):
                raise ValueError("Expected JSON object")
            return value
        except (ValueError, OSError) as exc:
            errors.append(f"{name}: {exc}")
            return None

    script = read("script.json") or {}
    validation = read("validation-report.json")
    preflight_h = read("visual-variety-report.json")
    production_h = (validation or {}).get("gates", {}).get("H_VISUAL_VARIETY")
    plan = read("visual-plan.json")
    transcript = read("transcript.json") or {}
    probe = read("qa-v11/media-probe.json") or {}
    video = base / "video.mp4"
    timings = {s["id"]: s for s in transcript.get("scenes", [])}
    scenes = []
    for index, scene in enumerate(script.get("scenes", [])):
        timing = timings.get(scene.get("id"))
        scenes.append({
            "index": index + 1, "id": scene.get("id"), "voiceText": scene.get("voiceText", ""),
            "template": scene.get("templateData", {}).get("template", "unknown"),
            "start": timing["startMs"] / 1000 if timing else None,
            "end": (timing["startMs"] + timing["durationMs"]) / 1000 if timing else None,
        })
    artifacts = [{"key": key, "image": name.endswith(".png"), "url": f"/api/production/{day}/artifacts/{key}"}
                 for key, name in ARTIFACTS.items() if artifact_path(root, day, key).is_file()]
    streams = probe.get("streams", [])
    video_stream = next((s for s in streams if s.get("codec_type") == "video"), {})
    audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), {})
    return {
        "day": day, "title": script.get("metadata", {}).get("title", f"Day {day}"),
        "videoAvailable": video.is_file(), "videoVersion": str(video.stat().st_mtime_ns) if video.is_file() else None,
        "validation": validation, "visualPlan": plan, "scenes": scenes, "artifacts": artifacts, "errors": errors,
        "visualVariety": production_h or preflight_h,
        "hSource": "production" if production_h else "preflight" if preflight_h else "none",
        "media": {"duration": probe.get("format", {}).get("duration"), "width": video_stream.get("width"),
                  "height": video_stream.get("height"), "fps": video_stream.get("avg_frame_rate"),
                  "videoCodec": video_stream.get("codec_name"), "audioCodec": audio_stream.get("codec_name")},
    }


def production_catalog(root: Path) -> dict:
    days = []
    for day in range(1, 8):
        review = production_review(root, day)
        report = review["validation"] or {}
        days.append({"day": day, "title": review["title"], "videoAvailable": review["videoAvailable"],
                     "hStatus": (review["visualVariety"] or {}).get("status", "NOT_RUN"), "hSource": review["hSource"],
                     "generatedAt": report.get("generatedAt", "")})
    reviewed = [d for d in days if d["hSource"] == "production"]
    latest = max(reviewed, key=lambda d: d["generatedAt"])["day"] if reviewed else 1
    return {"days": days, "latestDay": latest, "version": "MASTER TEMPLATE v1.1"}
