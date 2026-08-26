import json
import re
import subprocess
from pathlib import Path


def probe_duration(ffmpeg_path: str, media_path: str) -> float:
    result = subprocess.run(
        [ffmpeg_path, "-hide_banner", "-i", media_path],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    match = re.search(r"Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)", result.stderr)
    if not match:
        raise ValueError(f"Could not read duration: {media_path}")
    hours, minutes, seconds = match.groups()
    return round(int(hours) * 3600 + int(minutes) * 60 + float(seconds), 2)


def probe_media(ffmpeg_path: str, media_path: str) -> dict:
    result = subprocess.run(
        [ffmpeg_path, "-hide_banner", "-i", media_path],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    output = result.stderr
    duration_match = re.search(r"Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)", output)
    video_match = re.search(r"Video:.*?\b(\d{2,5})x(\d{2,5})\b", output)
    if not duration_match or not video_match:
        raise ValueError(f"Could not probe media: {media_path}")
    hours, minutes, seconds = duration_match.groups()
    duration = int(hours) * 3600 + int(minutes) * 60 + float(seconds)
    width, height = map(int, video_match.groups())
    return {
        "path": str(Path(media_path).resolve()),
        "duration_seconds": round(duration, 2),
        "width": width,
        "height": height,
        "has_video": "Video:" in output,
        "has_audio": "Audio:" in output,
    }


def validate_final(ffmpeg_path: str, media_path: str, minimum_seconds: float = 60.0) -> dict:
    report = probe_media(ffmpeg_path, media_path)
    checks = {
        "duration_over_60_seconds": report["duration_seconds"] > minimum_seconds,
        "portrait_orientation": report["height"] > report["width"],
        "has_video": report["has_video"],
        "has_audio": report["has_audio"],
    }
    report["checks"] = checks
    report["pass"] = all(checks.values())
    return report


def save_report(report: dict, output_path: str) -> None:
    Path(output_path).write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
