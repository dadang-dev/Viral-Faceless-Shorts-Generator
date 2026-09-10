"""Extract labeled frame-level review artifacts; never render or alter input MP4s."""
import argparse
import io
import hashlib
import json
import math
import subprocess
import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageStat


def run(args):
    return subprocess.run(args, check=True, capture_output=True).stdout


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("directory", type=Path)
    parser.add_argument("--label", default=None, help="Separate QA directory label for a specific review pass")
    args = parser.parse_args()
    base = args.directory.resolve()
    finance_path = base / "resolved-finance-plan.json"
    finance = json.loads(finance_path.read_text(encoding="utf-8")) if finance_path.exists() else None
    if args.label and not re.fullmatch(r"[a-zA-Z0-9_-]+", args.label):
        raise ValueError("QA label must be a plain directory name")
    out = base / (args.label or ("qa-v12" if finance else "qa-v11"))
    out.mkdir(exist_ok=True)
    video = base / "video.mp4"
    transcript = json.loads((base / "transcript.json").read_text(encoding="utf-8"))
    report = json.loads((base / "validation-report.json").read_text(encoding="utf-8"))
    probe = json.loads(run(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(video)]))
    picture = next(s for s in probe["streams"] if s["codec_type"] == "video")
    duration = float(picture["duration"])
    (out / "media-probe.json").write_text(json.dumps(probe, indent=2), encoding="utf-8")
    font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 16)
    with video.open("rb") as stream:
        video_hash = hashlib.file_digest(stream, "sha256").hexdigest()
    manifest = {"video": str(video), "videoSha256": video_hash, "duration": duration, "groups": {}, "automatedChecks": {}}

    def sheet(name, samples, columns=5, width=270):
        height = round(width * 1920 / 1080)
        contact = Image.new("RGB", (columns * width, math.ceil(len(samples) / columns) * (height + 28)), "#071426")
        frames = []
        def extract(sample):
            timestamp, label = sample
            time = max(0, min(timestamp, duration - 1 / 30))
            data = run(["ffmpeg", "-v", "error", "-ss", f"{time:.6f}", "-i", str(video), "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"])
            frame = Image.open(io.BytesIO(data)).convert("RGB")
            return time, label, frame
        with ThreadPoolExecutor(max_workers=3) as pool:
            extracted = list(pool.map(extract, samples))
        for index, (time, label, frame) in enumerate(extracted):
            filename = out / f"{name}-{index:02d}.png"
            frame.save(filename)
            x, y = (index % columns) * width, (index // columns) * (height + 28)
            contact.paste(frame.resize((width, height)), (x, y + 28))
            ImageDraw.Draw(contact).text((x + 4, y + 4), f"{time:.3f}s {label}", font=font, fill="#F5F1E8")
            frames.append({"timeSec": time, "label": label, "path": str(filename)})
        path = out / f"{name}-contact.png"
        contact.save(path)
        manifest["groups"][name] = {"contact": str(path), "frames": frames}
        print(f"QA {name}: {len(frames)} frames", flush=True)

    scenes = transcript["scenes"]
    sheet("overall", [((s["startMs"] + s["durationMs"] * .5) / 1000, s["id"]) for s in scenes])
    sheet("hook", [(i / 30, f"frame {i}") for i in range(19)], columns=7, width=216)
    # Center on the actual incoming visual start (180ms before its narration).
    boundaries = scenes[1:]
    for page in range(math.ceil(len(boundaries) / 3)):
        samples = []
        for s in boundaries[page * 3:page * 3 + 3]:
            boundary = s["startMs"] / 1000 - .18
            samples.extend((boundary + delta / 10, f"{s['id']} {delta / 10:+.1f}") for delta in range(-3, 4))
        sheet(f"boundaries-{page + 1}", samples, columns=7, width=216)
    last_word = max(w["globalEndMs"] for s in scenes for w in s["words"]) / 1000
    outro_samples = [(last_word + i / 10, f"lastWB {i / 10:+.1f}") for i in range(-3, math.floor((duration - last_word) * 10) + 1)]
    outro_samples.append((duration - 1 / 30, "final frame"))
    for page in range(math.ceil(len(outro_samples) / 12)):
        sheet(f"outro-{page + 1}", outro_samples[page * 12:(page + 1) * 12], columns=4)
    for hold in report.get("sceneDynamics", []):
        s = next(s for s in scenes if s["id"] == hold["sceneId"])
        samples = [(s["startMs"] / 1000 + offset, "hold state") for offset in range(math.ceil(s["durationMs"] / 1000))]
        for cue in hold["changes"]:
            samples.extend((cue["globalStartSec"] + delta, cue["target"]) for delta in [-.1, .5])
        sheet(f"long-hold-{s['id']}", sorted(samples))
    for h in report["gates"]["E_NUMBER_HIGHLIGHTS"]["resolved"]:
        s = next(s for s in scenes if s["id"] == h["sceneId"])
        onset = s["startMs"] / 1000 + h["startSec"]
        samples = [(onset + offset, f"metric {offset:+.2f}") for offset in [-.2, -.1, 0, .1, .18, .3, .5]]
        samples += [((s["startMs"] + s["durationMs"] * .5) / 1000, "internal"),
                    ((s["startMs"] + s["durationMs"]) / 1000 - .5, "full"),
                    ((s["startMs"] + s["durationMs"]) / 1000 - .1, "exit")]
        sheet(h["id"], samples)

    if finance:
        if str(report.get("edition", "")).startswith("1.2 editorial"):
            for chapter in report["gates"]["J_MOTION_SEMANTICS"]["editorial"]["chapters"]:
                sheet(f"chapter-{chapter['sequence']}", [(chapter["markerStart"] + i/30, f"frame {i}") for i in range(37)], columns=10, width=180)
            caption_path = base / "resolved-hero-captions.json"
            for span in json.loads(caption_path.read_text(encoding="utf-8")):
                sheet(f"caption-end-{span['sequenceId']}", [(span["endSec"] + i/30, f"end {i:+d}f") for i in range(-6, 7)], columns=7, width=216)
            sheet("editorial-cta-handoff", [(last_word + i/30, f"lastWB {i:+d}f") for i in range(-12, 16)], columns=7, width=216)
        if report.get("edition") == "1.2 editorial R2":
            dense_windows = {
                "r2-hook-chapter-1": (5.4, 6.8, 1/30),
                "r2-chapter-1-to-2": (20.0, 21.5, 1/30),
                "r2-convenience-motion": (22.0, 28.0, .2),
                "r2-chapter-2-to-3": (33.2, 35.0, 1/30),
                "r2-rounding-actual-mental": (38.0, 43.0, .2),
                "r2-rounding-frequency-result": (42.0, 48.5, .2),
                "r2-reframe-boundary": (48.0, 49.3, 1/30),
                "r2-naming-reframe": (50.0, 61.0, .5),
                "r2-cta": (60.5, duration, 1/30),
            }
            for name, (start, end, step) in dense_windows.items():
                samples=[]; current=start
                while current <= end + 1e-6:
                    samples.append((current, "dense QA")); current += step
                sheet(name, samples, columns=10 if step <= 1/30 else 5, width=180 if step <= 1/30 else 270)
        # Production-lock review: every 30fps frame through the approved Day 1 CTA handoff.
        if report.get("day") == 1 and report.get("edition") == "1.2 benchmark":
            sheet("cta-handoff", [(59.3 + i / 30, f"frame {i}") for i in range(22)], columns=11, width=180)
        sheet("visual-models", [(s["endSec"] - .6, s["id"]) for s in finance["sequences"]], columns=3, width=360)
        motion_samples = []
        chart_samples = []
        for sequence in finance["sequences"]:
            for event in sequence["motionEvents"]:
                if event["action"] == "hide":
                    continue
                for delta in [-.1, .15, .5]:
                    motion_samples.append((event["atSec"] + delta, f"{sequence['id']}:{event['id']} {delta:+.2f}"))
                numeric = any(e.get("datumId") for e in sequence["elements"] if e["id"] in event["targets"])
                if numeric:
                    chart_samples.append((event["atSec"] + .55, f"{sequence['id']}:{event['id']}"))
            samples = [(sequence["startSec"] + d, sequence["entryTransition"]) for d in [-.1, 0, .1, .3]]
            sheet(f"transition-{sequence['id']}", samples, columns=4)
        for page in range(math.ceil(len(motion_samples) / 12)):
            sheet(f"motion-events-{page+1}", motion_samples[page*12:(page+1)*12], columns=3, width=360)
        for page in range(math.ceil(len(chart_samples) / 9)):
            sheet(f"data-viz-{page+1}", chart_samples[page*9:(page+1)*9], columns=3, width=360)
        manifest["dataProvenance"] = finance["provenance"]
        manifest["motionSemantics"] = report["gates"]["J_MOTION_SEMANTICS"]

    # All-frame coarse luma checks complement (do not replace) frame review.
    raw = run(["ffmpeg", "-v", "error", "-i", str(video), "-vf", "scale=160:284", "-pix_fmt", "gray", "-fps_mode", "passthrough", "-f", "rawvideo", "-"])
    frame_size = 160 * 284
    means = [ImageStat.Stat(Image.frombytes("L", (160, 284), raw[i:i + frame_size])).mean[0] for i in range(0, len(raw), frame_size)]
    low_detail = []
    for i in range(0, len(raw), frame_size):
        picture = Image.frombytes("L", (160, 284), raw[i:i + frame_size])
        # Main visual safe area, excluding header, subtitles and platform footer.
        if ImageStat.Stat(picture.crop((11, 42, 149, 198))).stddev[0] < 5:
            low_detail.append(i // frame_size)
    manifest["automatedChecks"] = {
        "framesScanned": len(means),
        "blackFramesMeanBelow2": [i for i, value in enumerate(means) if value < 2],
        "whiteFramesMeanAbove240": [i for i, value in enumerate(means) if value > 240],
        "abruptMeanLumaChangesOver35": [i for i in range(1, len(means)) if abs(means[i] - means[i - 1]) > 35],
        "lowDetailHeroFramesStdBelow5": low_detail,
        "lastWordBoundarySec": last_word,
        "expectedProfileEntranceSec": last_word + .12,
        "note": "Threshold checks are coarse; blank hero/clipping/collision/variety require visual review.",
    }
    (out / "qa-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps(manifest["automatedChecks"], indent=2))


if __name__ == "__main__":
    main()
