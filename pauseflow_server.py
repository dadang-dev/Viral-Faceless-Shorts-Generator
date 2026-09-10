import os
import re
import shutil
import subprocess
import sys
import threading
import base64
import csv
import io
import json
import mimetypes
import tempfile
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Literal, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request as URLRequest, urlopen

import uvicorn
import yaml
import edge_tts
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, field_validator

from pauseflow.pipeline import DAY_SLUGS, PauseFlowPipeline
from pauseflow.production_rules import DAY_TITLE_CARDS, WORKFLOW_RULES
from pauseflow.quality_control import probe_duration
from pauseflow.tts.edge_tts_backend import EdgeTTSBackend
from pauseflow.production_review import production_catalog, production_review, artifact_path


ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")
REFERENCE_DIR = ROOT / "assets" / "reference_sheets"
REFERENCE_TYPES = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}
EDGE_VOICE_CACHE: list[dict] = []
EDGE_VOICE_FALLBACK = [
    {"ShortName": "en-US-ChristopherNeural", "Locale": "en-US", "Gender": "Male", "FriendlyName": "Christopher (US)"},
    {"ShortName": "en-US-GuyNeural", "Locale": "en-US", "Gender": "Male", "FriendlyName": "Guy (US)"},
    {"ShortName": "en-US-AndrewMultilingualNeural", "Locale": "en-US", "Gender": "Male", "FriendlyName": "Andrew Multilingual (US)"},
    {"ShortName": "en-US-BrianMultilingualNeural", "Locale": "en-US", "Gender": "Male", "FriendlyName": "Brian Multilingual (US)"},
    {"ShortName": "en-US-JennyNeural", "Locale": "en-US", "Gender": "Female", "FriendlyName": "Jenny (US)"},
    {"ShortName": "en-US-AriaNeural", "Locale": "en-US", "Gender": "Female", "FriendlyName": "Aria (US)"},
    {"ShortName": "en-US-AvaMultilingualNeural", "Locale": "en-US", "Gender": "Female", "FriendlyName": "Ava Multilingual (US)"},
    {"ShortName": "en-US-EmmaMultilingualNeural", "Locale": "en-US", "Gender": "Female", "FriendlyName": "Emma Multilingual (US)"},
]


def load_pipeline() -> PauseFlowPipeline:
    with (ROOT / "config.yaml").open("r", encoding="utf-8") as handle:
        config = yaml.safe_load(handle)
    return PauseFlowPipeline(config, root=ROOT)


app = FastAPI(title="PauseFlow Money Habits API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EdgeTTSSettings(BaseModel):
    voice: str = "en-US-ChristopherNeural"
    rate: int = 0
    pitch: int = 0
    volume: int = 0
    punctuation_mode: Literal["natural", "enhanced", "minimal"] = "natural"

    @field_validator("voice")
    @classmethod
    def validate_voice(cls, value):
        value = value.strip()
        if not re.fullmatch(r"[A-Za-z0-9-]{5,100}", value):
            raise ValueError("Edge TTS voice không hợp lệ")
        return value

    @field_validator("rate", "pitch", "volume")
    @classmethod
    def validate_adjustment(cls, value, info):
        limits = {"rate": (-50, 100), "pitch": (-50, 50), "volume": (-50, 100)}
        lower, upper = limits[info.field_name]
        if not lower <= value <= upper:
            raise ValueError(f"{info.field_name} must be between {lower} and {upper}")
        return value


class EdgeTTSPreviewRequest(EdgeTTSSettings):
    text: str = "You're not bad with money. Pause, notice the pattern... then choose one habit."

    @field_validator("text")
    @classmethod
    def validate_text(cls, value):
        value = value.strip()
        if not value or len(value) > 600:
            raise ValueError("Preview text phải có từ 1 đến 600 ký tự")
        return value


def edge_tts_options(settings: EdgeTTSSettings) -> dict:
    return {
        "voice": settings.voice,
        "rate": f"{settings.rate:+d}%",
        "pitch": f"{settings.pitch:+d}Hz",
        "volume": f"{settings.volume:+d}%",
        "punctuation_mode": settings.punctuation_mode,
    }


class DaysRequest(BaseModel):
    days: List[int]
    regenerate_audio: bool = False
    media_type: Literal["image", "video"] = "video"
    tts_settings: Optional[EdgeTTSSettings] = None

    @field_validator("days")
    @classmethod
    def validate_days(cls, value):
        normalized = sorted(set(value))
        if not normalized or any(day not in DAY_SLUGS for day in normalized):
            raise ValueError("days must contain values from 1 to 7")
        return normalized


class RenderSettings(BaseModel):
    voice_volume: float = 1.0
    music_volume: float = 0.15
    subtitle_font_size: int = 20
    subtitle_margin_bottom: int = 55
    subtitle_color: Literal["white", "yellow"] = "white"
    subtitle_style: Literal["outline", "box"] = "outline"

    @field_validator("voice_volume")
    @classmethod
    def validate_voice_volume(cls, value):
        if not 0.5 <= value <= 2.0:
            raise ValueError("voice_volume must be between 0.5 and 2.0")
        return value

    @field_validator("music_volume")
    @classmethod
    def validate_music_volume(cls, value):
        if not 0 <= value <= 0.5:
            raise ValueError("music_volume must be between 0 and 0.5")
        return value

    @field_validator("subtitle_font_size")
    @classmethod
    def validate_font_size(cls, value):
        if not 12 <= value <= 40:
            raise ValueError("subtitle_font_size must be between 12 and 40")
        return value

    @field_validator("subtitle_margin_bottom")
    @classmethod
    def validate_subtitle_margin(cls, value):
        if not 10 <= value <= 120:
            raise ValueError("subtitle_margin_bottom must be between 10 and 120")
        return value


class RenderRequest(DaysRequest):
    render_settings: RenderSettings = RenderSettings()


class TimelineCue(BaseModel):
    start: float
    end: float
    text: str


class TimelineRequest(BaseModel):
    cues: List[TimelineCue]


class ImageGenerationRequest(BaseModel):
    provider: Literal["gemini", "openai"] = "gemini"
    quality: Literal["draft", "standard", "high"] = "standard"


class ImageProviderKeyRequest(BaseModel):
    provider: Literal["gemini", "openai"]
    api_key: str

    @field_validator("api_key")
    @classmethod
    def validate_api_key(cls, value):
        value = value.strip()
        if len(value) < 10 or len(value) > 500 or "\n" in value or "\r" in value:
            raise ValueError("API key không hợp lệ")
        return value


@app.get("/api/health")
def health():
    return {"status": "ok", "pipeline": "money-habits-v4"}


def _config_adjustment(value: object) -> int:
    match = re.search(r"[-+]?\d+", str(value or "0"))
    return int(match.group()) if match else 0


@app.get("/api/tts/voices")
async def edge_tts_voices():
    global EDGE_VOICE_CACHE
    source = "live"
    if not EDGE_VOICE_CACHE:
        try:
            EDGE_VOICE_CACHE = await edge_tts.list_voices()
        except Exception:
            EDGE_VOICE_CACHE = EDGE_VOICE_FALLBACK
            source = "fallback"
    voices = []
    for voice in EDGE_VOICE_CACHE:
        tag = voice.get("VoiceTag") or {}
        voices.append({
            "short_name": voice.get("ShortName", ""),
            "locale": voice.get("Locale", ""),
            "gender": voice.get("Gender", ""),
            "friendly_name": voice.get("FriendlyName") or voice.get("ShortName", ""),
            "categories": tag.get("ContentCategories", []),
            "personalities": tag.get("VoicePersonalities", []),
        })
    voices.sort(key=lambda item: (item["locale"], item["gender"], item["short_name"]))
    config = load_pipeline().config.get("tts", {})
    return {
        "source": source,
        "voices": voices,
        "settings": {
            "voice": config.get("voice", "en-US-ChristopherNeural"),
            "rate": _config_adjustment(config.get("rate", 0)),
            "pitch": _config_adjustment(config.get("pitch", 0)),
            "volume": _config_adjustment(config.get("volume", 0)),
            "punctuation_mode": config.get("punctuation_mode", "natural"),
        },
        "punctuation_modes": {
            "natural": "Giữ nguyên dấu câu; Edge TTS tự ngắt và lên xuống giọng theo ngữ cảnh.",
            "enhanced": "Nhấn rõ hơn ở dấu ba chấm, gạch ngang và chấm phẩy.",
            "minimal": "Bỏ qua dấu phẩy, chấm phẩy, hai chấm, gạch ngang và dấu ba chấm; vẫn giữ .?!",
        },
    }


@app.post("/api/tts/preview")
async def edge_tts_preview(req: EdgeTTSPreviewRequest):
    descriptor, temporary_name = tempfile.mkstemp(prefix="moneyhabit_tts_", suffix=".mp3")
    os.close(descriptor)
    temporary = Path(temporary_name)
    try:
        await EdgeTTSBackend(**edge_tts_options(req)).generate_audio_async(req.text, str(temporary))
        payload = temporary.read_bytes()
        if len(payload) < 1000:
            raise RuntimeError("Edge TTS không trả về audio hợp lệ")
        return StreamingResponse(
            io.BytesIO(payload),
            media_type="audio/mpeg",
            headers={"Cache-Control": "no-store", "Content-Length": str(len(payload))},
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Không thể tạo bản nghe thử Edge TTS: {exc}") from exc
    finally:
        temporary.unlink(missing_ok=True)


@app.get("/api/project")
def project():
    pipeline = load_pipeline()
    return {
        "name": "Money Habits",
        "script": str(pipeline.script_path),
        "voice": pipeline.config["tts"]["voice"],
        "media_workflow": "CapCut Pro / Seedance manual clips",
        "days": [{"day": day, "slug": slug} for day, slug in DAY_SLUGS.items()],
    }


@app.get("/api/day-content/{day}")
def day_content(day: int):
    if day not in DAY_SLUGS:
        raise HTTPException(status_code=404, detail="Day must be from 1 to 7")
    content = load_pipeline().script_agent.generate_script(f"Day {day}")
    script_text = content.script.strip()
    if script_text.startswith('"') and script_text.endswith('"'):
        script_text = script_text[1:-1].strip()
    return {
        "day": day,
        "script": script_text,
        "caption": content.caption,
        "engagement_prompt": content.engagement_prompt,
    }


@app.get("/api/reference-sheet-prompt")
def reference_sheet_prompt():
    path = ROOT / "assets" / "money_habits_character_props_sheet_prompt_v2.txt"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Reference sheet prompt not found")
    return {"prompt": path.read_text(encoding="utf-8").strip()}


def current_reference_sheet():
    for suffix in REFERENCE_TYPES.values():
        path = REFERENCE_DIR / f"money_habits_character_props{suffix}"
        if path.is_file() and path.stat().st_size > 0:
            return path
    return None


def image_provider_status():
    return {
        "gemini": {"configured": bool(os.environ.get("GEMINI_API_KEY")), "model": os.environ.get("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image")},
        "openai": {"configured": bool(os.environ.get("OPENAI_API_KEY")), "model": os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-2")},
    }


def _save_local_api_key(provider: str, api_key: str):
    variable = "GEMINI_API_KEY" if provider == "gemini" else "OPENAI_API_KEY"
    env_path = ROOT / ".env"
    lines = env_path.read_text(encoding="utf-8").splitlines() if env_path.is_file() else []
    replacement = f"{variable}={api_key}"
    updated = []
    found = False
    for line in lines:
        if line.startswith(f"{variable}="):
            updated.append(replacement)
            found = True
        else:
            updated.append(line)
    if not found:
        if updated and updated[-1].strip():
            updated.append("")
        updated.append(replacement)
    env_path.write_text("\n".join(updated) + "\n", encoding="utf-8")
    try:
        os.chmod(env_path, 0o600)
    except OSError:
        pass
    os.environ[variable] = api_key


def _post_json(url: str, payload: dict, headers: dict, timeout: int = 180) -> dict:
    request = URLRequest(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json", **headers}, method="POST")
    try:
        with urlopen(request, timeout=timeout) as response:
            return json.load(response)
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[-800:]
        raise HTTPException(status_code=502, detail=f"Image provider rejected the request: {detail}")
    except URLError as error:
        raise HTTPException(status_code=502, detail=f"Cannot reach image provider: {error.reason}")


def _generate_gemini_image(prompt: str, reference: Path, quality: str) -> bytes:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=409, detail="GEMINI_API_KEY chưa được cấu hình ở backend")
    model = os.environ.get("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-image")
    mime = mimetypes.guess_type(reference.name)[0] or "image/png"
    payload = {
        "contents": [{"parts": [
            {"inline_data": {"mime_type": mime, "data": base64.b64encode(reference.read_bytes()).decode("ascii")}},
            {"text": prompt + "\nPreserve the character identity and visual language from the supplied reference image."},
        ]}],
        "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "9:16"}},
    }
    data = _post_json(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        payload, {"x-goog-api-key": api_key},
    )
    for candidate in data.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                return base64.b64decode(inline["data"])
    raise HTTPException(status_code=502, detail="Gemini không trả về dữ liệu ảnh")


def _generate_openai_image(prompt: str, reference: Path, quality: str) -> bytes:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=409, detail="OPENAI_API_KEY chưa được cấu hình ở backend")
    boundary = f"----PauseFlow{uuid.uuid4().hex}"
    fields = {
        "model": os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-2"),
        "prompt": prompt + "\nPreserve the character identity and visual language from the supplied reference image.",
        "size": "1024x1536", "quality": {"draft": "low", "standard": "medium", "high": "high"}[quality],
        "output_format": "png", "n": "1",
    }
    chunks = []
    for name, value in fields.items():
        chunks.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode())
    mime = mimetypes.guess_type(reference.name)[0] or "image/png"
    chunks.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"image[]\"; filename=\"{reference.name}\"\r\nContent-Type: {mime}\r\n\r\n".encode() + reference.read_bytes() + b"\r\n")
    chunks.append(f"--{boundary}--\r\n".encode())
    request = URLRequest("https://api.openai.com/v1/images/edits", data=b"".join(chunks), headers={"Authorization": f"Bearer {api_key}", "Content-Type": f"multipart/form-data; boundary={boundary}"}, method="POST")
    try:
        with urlopen(request, timeout=240) as response:
            data = json.load(response)
    except HTTPError as error:
        raise HTTPException(status_code=502, detail=f"OpenAI rejected the request: {error.read().decode('utf-8', errors='replace')[-800:]}")
    except URLError as error:
        raise HTTPException(status_code=502, detail=f"Cannot reach OpenAI: {error.reason}")
    encoded = (data.get("data") or [{}])[0].get("b64_json")
    if not encoded:
        raise HTTPException(status_code=502, detail="OpenAI không trả về dữ liệu ảnh")
    return base64.b64decode(encoded)


def _drawtext_escape(value: str) -> str:
    return value.replace("\\", r"\\").replace("'", r"\'").replace(":", r"\:")


def _title_card_filters(title_spec: object, font_path: Path) -> list[str]:
    """Build a high-contrast mobile title card while supporting old string manifests."""
    show_seconds = 0.0
    if isinstance(title_spec, dict):
        kicker = str(title_spec.get("kicker", "")).strip()
        raw_lines = title_spec.get("lines", [])
        lines = [str(line).strip() for line in raw_lines if str(line).strip()] if isinstance(raw_lines, list) else []
        show_seconds = max(0.0, float(title_spec.get("show_seconds", 0) or 0))
    else:
        kicker = ""
        lines = [str(title_spec).strip()] if str(title_spec).strip() else []
    if not lines:
        return []

    font = _drawtext_escape(str(font_path))
    enable = f":enable='between(t,0,{show_seconds:.3f})'" if show_seconds else ""
    filters = [
        "drawbox=x=iw*0.065:y=ih*0.135:w=iw*0.87:h=ih*0.235:color=0x07172F@0.90:t=fill" + enable,
        "drawbox=x=iw*0.065:y=ih*0.135:w=14:h=ih*0.235:color=0x59E1D5@1:t=fill" + enable,
    ]
    if kicker:
        filters.append(
            f"drawtext=fontfile='{font}':text='{_drawtext_escape(kicker)}'"
            ":fontcolor=0x59E1D5:fontsize=42"
            ":x=w*0.115:y=h*0.17" + enable
        )
    headline_size = 76 if max(len(line) for line in lines) <= 18 else 66
    first_line_y = 0.225 if kicker else 0.19
    line_gap = 0.058
    for index, line in enumerate(lines[:2]):
        filters.append(
            f"drawtext=fontfile='{font}':text='{_drawtext_escape(line)}'"
            f":fontcolor=white:fontsize={headline_size}:borderw=2:bordercolor=black@0.30"
            f":shadowx=3:shadowy=5:shadowcolor=black@0.55:x=w*0.115:y=h*{first_line_y + index * line_gap:.3f}" + enable
        )
    return filters


def _scene_title_spec(manifest: dict, scene: int) -> Optional[object]:
    scene_key = str(scene)
    return (
        manifest.get("title_cards", {}).get(scene_key)
        or manifest.get("title_carryovers", {}).get(scene_key)
    )


def _convert_image_to_scene_clip(
    pipeline: PauseFlowPipeline,
    image_path: Path,
    destination: Path,
    target_seconds: float,
    title_text: Optional[object] = None,
):
    ffmpeg = pipeline.config["renderer"]["ffmpeg_path"]
    ffmpeg_path = str(ROOT / ffmpeg) if ffmpeg != "ffmpeg" else ffmpeg
    video_filter = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"
    if title_text:
        font_path = ROOT / "trendscraper" / "src" / "fonts" / "Montserrat-ExtraBold.ttf"
        for title_filter in _title_card_filters(title_text, font_path):
            video_filter += f",{title_filter}"
    video_filter += ",format=yuv420p"
    result = subprocess.run([
        ffmpeg_path, "-y", "-loop", "1", "-i", str(image_path), "-t", str(target_seconds),
        "-vf", video_filter,
        "-r", "30", "-c:v", "libx264", "-an", str(destination)
    ], capture_output=True, text=True)
    if result.returncode != 0:
        raise HTTPException(status_code=500, detail="Không thể chuyển ảnh thành clip: " + result.stderr[-2000:])


@app.get("/api/reference-sheet")
def reference_sheet_status():
    path = current_reference_sheet()
    return {"attached": path is not None, "filename": path.name if path else None,
            "size_bytes": path.stat().st_size if path else 0}


@app.get("/api/reference-sheet/image")
def reference_sheet_image():
    path = current_reference_sheet()
    if path is None:
        raise HTTPException(status_code=404, detail="Reference sheet image not found")
    media_type = next(kind for kind, suffix in REFERENCE_TYPES.items() if path.suffix == suffix)
    return FileResponse(path, media_type=media_type, headers={"Cache-Control": "no-cache"})


@app.put("/api/reference-sheet")
async def attach_reference_sheet(request: Request):
    media_type = request.headers.get("content-type", "").split(";", 1)[0].lower()
    suffix = REFERENCE_TYPES.get(media_type)
    if suffix is None:
        raise HTTPException(status_code=415, detail="Chỉ nhận ảnh PNG, JPG hoặc WebP")
    REFERENCE_DIR.mkdir(parents=True, exist_ok=True)
    destination = REFERENCE_DIR / f"money_habits_character_props{suffix}"
    temporary = REFERENCE_DIR / ".reference.uploading"
    size = 0
    try:
        with temporary.open("wb") as handle:
            async for chunk in request.stream():
                size += len(chunk)
                if size > 25_000_000:
                    raise HTTPException(status_code=413, detail="Ảnh vượt quá giới hạn 25 MB")
                handle.write(chunk)
        if size < 32:
            raise HTTPException(status_code=400, detail="File ảnh rỗng hoặc không hợp lệ")
        os.replace(temporary, destination)
        for other_suffix in set(REFERENCE_TYPES.values()) - {suffix}:
            old_path = REFERENCE_DIR / f"money_habits_character_props{other_suffix}"
            if old_path.exists():
                old_path.unlink()
    finally:
        if temporary.exists():
            temporary.unlink()
    return {"status": "success", "filename": destination.name, "size_bytes": size}


def stream_mp4(request: Request, path: Path):
    if not path.is_file() or path.stat().st_size == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    size = path.stat().st_size
    range_header = request.headers.get("range")
    headers = {"Accept-Ranges": "bytes", "Cache-Control": "no-cache"}
    if not range_header:
        return FileResponse(path, media_type="video/mp4", headers=headers)
    try:
        value = range_header.removeprefix("bytes=").split(",", 1)[0]
        start_text, end_text = value.split("-", 1)
        start = int(start_text) if start_text else 0
        end = int(end_text) if end_text else min(start + 4 * 1024 * 1024 - 1, size - 1)
        end = min(end, size - 1)
        if start < 0 or start >= size or end < start:
            raise ValueError
    except ValueError:
        raise HTTPException(status_code=416, detail="Invalid byte range")

    def content():
        with path.open("rb") as handle:
            handle.seek(start)
            remaining = end - start + 1
            while remaining:
                chunk = handle.read(min(1024 * 1024, remaining))
                if not chunk:
                    break
                remaining -= len(chunk)
                yield chunk

    headers.update({
        "Content-Range": f"bytes {start}-{end}/{size}",
        "Content-Length": str(end - start + 1),
    })
    return StreamingResponse(content(), status_code=206, media_type="video/mp4", headers=headers)


@app.get("/api/videos/{day}/scenes/{scene}")
def preview_scene(day: int, scene: int, request: Request):
    if day not in DAY_SLUGS:
        raise HTTPException(status_code=404, detail="Day must be from 1 to 7")
    pipeline = load_pipeline()
    return stream_mp4(request, pipeline.day_dir(day) / "manual_clips" / f"scene_{scene}.mp4")


@app.get("/api/videos/{day}/final")
def preview_final(day: int, request: Request):
    if day not in DAY_SLUGS:
        raise HTTPException(status_code=404, detail="Day must be from 1 to 7")
    mg_path = ROOT / "output" / f"day-{day}" / "video.mp4"
    if mg_path.is_file():
        return stream_mp4(request, mg_path)
    pipeline = load_pipeline()
    final_path = pipeline.day_dir(day) / "final.mp4"
    return stream_mp4(request, final_path)


def parse_srt_timestamp(value: str) -> float:
    hours, minutes, rest = value.split(":")
    seconds, milliseconds = rest.split(",")
    return int(hours) * 3600 + int(minutes) * 60 + int(seconds) + int(milliseconds) / 1000


def format_srt_timestamp(value: float) -> str:
    milliseconds = max(0, round(value * 1000))
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    seconds, milliseconds = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"


def read_srt(path: Path):
    blocks = re.split(r"\n\s*\n", path.read_text(encoding="utf-8-sig").strip())
    cues = []
    for block in blocks:
        lines = block.splitlines()
        if len(lines) < 3 or " --> " not in lines[1]:
            continue
        start, end = lines[1].split(" --> ", 1)
        cues.append({"start": parse_srt_timestamp(start), "end": parse_srt_timestamp(end), "text": "\n".join(lines[2:])})
    return cues


@app.get("/api/timeline/{day}")
def timeline(day: int):
    if day not in DAY_SLUGS:
        raise HTTPException(status_code=404, detail="Day must be from 1 to 7")
    output_dir = load_pipeline().day_dir(day)
    voice_path, subtitle_path = output_dir / "voice.mp3", output_dir / "subtitles.srt"
    if not voice_path.is_file() or not subtitle_path.is_file():
        raise HTTPException(status_code=409, detail=f"Day {day} chưa được Prepare")
    ffmpeg = load_pipeline().config["renderer"]["ffmpeg_path"]
    ffmpeg_path = str(ROOT / ffmpeg) if ffmpeg != "ffmpeg" else ffmpeg
    manifest_path = output_dir / "manifest.json"
    import json
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.is_file() else {}
    targets = manifest.get("scene_target_seconds", {})
    scenes = []
    cursor = 0.0
    for scene in range(1, int(manifest.get("scene_count", 0)) + 1):
        target = float(targets.get(str(scene), 0))
        clip = output_dir / "manual_clips" / f"scene_{scene}.mp4"
        scenes.append({"scene": scene, "start": cursor, "end": cursor + target, "duration": target,
                       "attached": clip.is_file() and clip.stat().st_size > 0})
        cursor += target
    return {"day": day, "duration": probe_duration(ffmpeg_path, str(voice_path)),
            "cues": read_srt(subtitle_path), "scenes": scenes}


@app.get("/api/voice/{day}")
def preview_voice(day: int):
    if day not in DAY_SLUGS:
        raise HTTPException(status_code=404, detail="Day must be from 1 to 7")
    path = load_pipeline().day_dir(day) / "voice.mp3"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Voice not found")
    return FileResponse(path, media_type="audio/mpeg", headers={"Cache-Control": "no-cache", "Accept-Ranges": "bytes"})


@app.put("/api/voice/{day}")
async def replace_voice(day: int, request: Request):
    if day not in DAY_SLUGS:
        raise HTTPException(status_code=404, detail="Day must be from 1 to 7")
    if request.headers.get("content-type", "").split(";", 1)[0] not in {"audio/mpeg", "audio/mp3"}:
        raise HTTPException(status_code=415, detail="Chỉ nhận file MP3")
    output_dir = load_pipeline().day_dir(day)
    destination = output_dir / "voice.mp3"
    if not output_dir.is_dir():
        raise HTTPException(status_code=409, detail=f"Day {day} chưa được Prepare")
    temporary = output_dir / ".voice.uploading.mp3"
    size = 0
    try:
        with temporary.open("wb") as handle:
            async for chunk in request.stream():
                size += len(chunk)
                if size > 100_000_000:
                    raise HTTPException(status_code=413, detail="Voice vượt quá giới hạn 100 MB")
                handle.write(chunk)
        if size < 1000:
            raise HTTPException(status_code=400, detail="File MP3 rỗng hoặc không hợp lệ")
        backups = output_dir / "backups"
        backups.mkdir(exist_ok=True)
        if destination.exists():
            shutil.copy2(destination, backups / f"voice_{datetime.now():%Y%m%d_%H%M%S}.mp3")
        os.replace(temporary, destination)
    finally:
        if temporary.exists():
            temporary.unlink()
    return {"status": "success", "size_bytes": size}


@app.put("/api/timeline/{day}")
def save_timeline(day: int, req: TimelineRequest):
    if day not in DAY_SLUGS:
        raise HTTPException(status_code=404, detail="Day must be from 1 to 7")
    output_dir = load_pipeline().day_dir(day)
    subtitle_path, voice_path = output_dir / "subtitles.srt", output_dir / "voice.mp3"
    if not subtitle_path.is_file() or not voice_path.is_file():
        raise HTTPException(status_code=409, detail=f"Day {day} chưa được Prepare")
    if not req.cues:
        raise HTTPException(status_code=400, detail="Timeline phải có ít nhất một subtitle")
    previous_end = 0.0
    for index, cue in enumerate(req.cues, 1):
        if cue.start < 0 or cue.end <= cue.start or not cue.text.strip():
            raise HTTPException(status_code=400, detail=f"Cue {index} không hợp lệ")
        if cue.start < previous_end - 0.001:
            raise HTTPException(status_code=400, detail=f"Cue {index} đang chồng lên cue trước")
        previous_end = cue.end
    ffmpeg = load_pipeline().config["renderer"]["ffmpeg_path"]
    ffmpeg_path = str(ROOT / ffmpeg) if ffmpeg != "ffmpeg" else ffmpeg
    voice_duration = probe_duration(ffmpeg_path, str(voice_path))
    if req.cues[-1].end > voice_duration + 0.5:
        raise HTTPException(status_code=400, detail="Subtitle kết thúc sau voice quá 0.5 giây")
    backups = output_dir / "backups"
    backups.mkdir(exist_ok=True)
    shutil.copy2(subtitle_path, backups / f"subtitles_{datetime.now():%Y%m%d_%H%M%S}.srt")
    blocks = []
    for index, cue in enumerate(req.cues, 1):
        blocks.append(f"{index}\n{format_srt_timestamp(cue.start)} --> {format_srt_timestamp(cue.end)}\n{cue.text.strip()}")
    subtitle_path.write_text("\n\n".join(blocks) + "\n", encoding="utf-8")
    return {"status": "success", "cue_count": len(req.cues), "duration": voice_duration}


@app.get("/api/status")
def status():
    return {"days": load_pipeline().status(range(1, 8))}


@app.get("/api/production")
def get_production_catalog():
    return production_catalog(ROOT)


@app.get("/api/production/{day}")
def get_production_review(day: int):
    try:
        return production_review(ROOT, day)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/production/{day}/artifacts/{key}")
def get_production_artifact(day: int, key: str):
    try:
        path = artifact_path(ROOT, day, key)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Artifact not available")
    return FileResponse(path, headers={"Cache-Control": "no-cache"})


@app.get("/api/production-rules")
def production_rules():
    return {"workflow": WORKFLOW_RULES, "title_cards": DAY_TITLE_CARDS}


@app.get("/api/prompts/{day}")
def prompts(day: int, media_type: Literal["image", "video"] = "video"):
    if day not in DAY_SLUGS:
        raise HTTPException(status_code=404, detail="Day must be from 1 to 7")

    mg_script = ROOT / "output" / f"day-{day}" / "script.json"
    if mg_script.is_file():
        import json
        script_data = json.loads(mg_script.read_text(encoding="utf-8"))
        items = []
        for idx, s in enumerate(script_data.get("scenes", []), 1):
            t_data = s.get("templateData", {})
            template_name = t_data.get("template", "card")
            if template_name == "hook":
                prompt_desc = f"[Hook] {t_data.get('headline', '')} — {t_data.get('subhead', '')}"
            elif template_name == "stat-hero":
                prompt_desc = f"[Stat Card] {t_data.get('value', '')} | {t_data.get('label', '')} ({t_data.get('context', '')})"
            elif template_name == "comparison":
                left = t_data.get("left", {})
                right = t_data.get("right", {})
                prompt_desc = f"[Comparison] {left.get('label', '')}: {left.get('value', '')} vs {right.get('label', '')}: {right.get('value', '')}"
            elif template_name == "feature-list":
                bullets = ", ".join(t_data.get("bullets", []))
                prompt_desc = f"[Feature List] {t_data.get('title', '')}: {bullets}"
            elif template_name == "callout":
                prompt_desc = f"[Callout] {t_data.get('tag', '')}: \"{t_data.get('statement', '')}\""
            else:
                prompt_desc = f"[{template_name.title()}] {t_data.get('ctaTop', '')} — {t_data.get('channelName', '')}"

            voice_file = ROOT / "output" / f"day-{day}" / "voice" / f"{s.get('id')}.mp3"
            items.append({
                "scene": idx,
                "prompt": prompt_desc,
                "voice_text": s.get("voiceText", ""),
                "start_seconds": (idx - 1) * 3.5,
                "end_seconds": idx * 3.5,
                "title_card": t_data.get("headline") or t_data.get("statement") or t_data.get("title"),
                "attached": voice_file.is_file(),
                "size_bytes": voice_file.stat().st_size if voice_file.is_file() else 0,
                "target_seconds": 3.5,
                "actual_seconds": 3.5 if voice_file.is_file() else 0,
            })
        return {"day": day, "media_type": media_type, "prompts": items}

    pipeline = load_pipeline()
    prompt_dir = pipeline.day_dir(day) / "pending_prompts"
    if not prompt_dir.is_dir():
        raise HTTPException(status_code=409, detail=f"Day {day} chưa được Prepare")
    manifest_path = pipeline.day_dir(day) / "manifest.json"
    if not manifest_path.is_file():
        raise HTTPException(status_code=409, detail=f"Day {day} chưa được Prepare")
    import json
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("media_type", "video") != media_type:
        raise HTTPException(
            status_code=409,
            detail=f"Day {day} đang được Prepare ở chế độ {manifest.get('media_type')}; hãy Prepare lại ở chế độ {media_type}.",
        )
    manual_dir = pipeline.day_dir(day) / "manual_clips"
    ffmpeg = pipeline.config["renderer"]["ffmpeg_path"]
    ffmpeg_path = str(ROOT / ffmpeg) if ffmpeg != "ffmpeg" else ffmpeg
    selected_prompt_dir = prompt_dir / media_type
    if not selected_prompt_dir.is_dir():
        selected_prompt_dir = prompt_dir
    items = []
    for path in sorted(
        selected_prompt_dir.glob("scene_*.txt"),
        key=lambda item: int(item.stem.split("_")[-1]),
    ):
        scene_number = int(path.stem.split("_")[-1])
        clip_path = manual_dir / f"scene_{scene_number}.mp4"
        actual_duration = probe_duration(ffmpeg_path, str(clip_path)) if clip_path.is_file() else 0
        items.append({
            "scene": scene_number,
            "prompt": path.read_text(encoding="utf-8").strip(),
            "voice_text": manifest.get("scene_voice_text", {}).get(str(scene_number), ""),
            "start_seconds": manifest.get("scene_time_ranges", {}).get(str(scene_number), {}).get("start", 0),
            "end_seconds": manifest.get("scene_time_ranges", {}).get(str(scene_number), {}).get("end", 0),
            "title_card": manifest.get("title_cards", {}).get(str(scene_number)),
            "attached": clip_path.is_file() and clip_path.stat().st_size > 0,
            "size_bytes": clip_path.stat().st_size if clip_path.is_file() else 0,
            "target_seconds": manifest.get("scene_target_seconds", {}).get(str(scene_number), 0),
            "actual_seconds": actual_duration,
        })
    return {"day": day, "media_type": media_type, "prompts": items}


@app.get("/api/prompts/{day}/export.csv")
def export_prompts_csv(day: int, media_type: Literal["image", "video"] = "video"):
    if day not in DAY_SLUGS:
        raise HTTPException(status_code=404, detail="Day must be from 1 to 7")
    pipeline = load_pipeline()
    output_dir = pipeline.day_dir(day)
    manifest_path = output_dir / "manifest.json"
    prompt_dir = output_dir / "pending_prompts" / media_type
    if not manifest_path.is_file() or not prompt_dir.is_dir():
        raise HTTPException(status_code=409, detail=f"Day {day} chưa được Prepare")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("media_type", "video") != media_type:
        raise HTTPException(
            status_code=409,
            detail=f"Day {day} đang được Prepare ở chế độ {manifest.get('media_type')}; hãy Prepare lại ở chế độ {media_type}.",
        )
    buffer = io.StringIO(newline="")
    writer = csv.writer(buffer)
    writer.writerow(["scene", "target_seconds", "media_type", "title_card", "prompt"])
    for path in sorted(prompt_dir.glob("scene_*.txt"), key=lambda item: int(item.stem.split("_")[-1])):
        scene = int(path.stem.split("_")[-1])
        writer.writerow([
            scene,
            manifest.get("scene_target_seconds", {}).get(str(scene), 0),
            media_type,
            manifest.get("title_cards", {}).get(str(scene), ""),
            " ".join(path.read_text(encoding="utf-8").split()),
        ])
    filename = f"day{day}_{media_type}_prompts.csv"
    return StreamingResponse(
        iter([("\ufeff" + buffer.getvalue()).encode("utf-8")]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/api/image-providers")
def get_image_providers():
    return {"providers": image_provider_status()}


@app.put("/api/image-provider-key")
def save_image_provider_key(req: ImageProviderKeyRequest):
    _save_local_api_key(req.provider, req.api_key)
    return {"status": "success", "provider": req.provider, "configured": True}


@app.get("/api/generated-images/{day}/{scene}")
def generated_image(day: int, scene: int):
    if day not in DAY_SLUGS:
        raise HTTPException(status_code=404, detail="Day must be from 1 to 7")
    path = load_pipeline().day_dir(day) / "generated_images" / f"scene_{scene}.png"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Scene chưa có ảnh được tạo")
    return FileResponse(path, media_type="image/png", headers={"Cache-Control": "no-cache"})


@app.post("/api/generate-image/{day}/{scene}")
def generate_scene_image(day: int, scene: int, req: ImageGenerationRequest):
    if day not in DAY_SLUGS:
        raise HTTPException(status_code=404, detail="Day must be from 1 to 7")
    pipeline = load_pipeline()
    output_dir = pipeline.day_dir(day)
    manifest_path = output_dir / "manifest.json"
    prompt_path = output_dir / "pending_prompts" / "image" / f"scene_{scene}.txt"
    reference = current_reference_sheet()
    if not manifest_path.is_file() or not prompt_path.is_file():
        raise HTTPException(status_code=409, detail=f"Day {day} chưa được Prepare ở chế độ ảnh")
    if reference is None:
        raise HTTPException(status_code=409, detail="Hãy attach Character & Props reference trước khi tạo ảnh")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if str(scene) not in manifest.get("scene_target_seconds", {}):
        raise HTTPException(status_code=404, detail=f"Scene {scene} không tồn tại trong Day {day}")
    prompt = prompt_path.read_text(encoding="utf-8").strip()
    image_bytes = _generate_gemini_image(prompt, reference, req.quality) if req.provider == "gemini" else _generate_openai_image(prompt, reference, req.quality)
    generated_dir = output_dir / "generated_images"
    generated_dir.mkdir(parents=True, exist_ok=True)
    image_path = generated_dir / f"scene_{scene}.png"
    temporary_image = generated_dir / f".scene_{scene}.png.generating"
    temporary_image.write_bytes(image_bytes)
    os.replace(temporary_image, image_path)
    manual_dir = output_dir / "manual_clips"
    manual_dir.mkdir(exist_ok=True)
    clip_path = manual_dir / f"scene_{scene}.mp4"
    temporary_clip = manual_dir / f".scene_{scene}.generated.mp4"
    _convert_image_to_scene_clip(
        pipeline, image_path, temporary_clip,
        float(manifest["scene_target_seconds"][str(scene)]),
        _scene_title_spec(manifest, scene),
    )
    os.replace(temporary_clip, clip_path)
    return {"status": "success", "day": day, "scene": scene, "provider": req.provider, "image_url": f"/api/generated-images/{day}/{scene}"}


@app.put("/api/clips/{day}/{scene}")
async def attach_clip(day: int, scene: int, request: Request, replace: bool = False,
                      media_type: Literal["image", "video"] = "video"):
    if day not in DAY_SLUGS:
        raise HTTPException(status_code=404, detail="Day must be from 1 to 7")
    pipeline = load_pipeline()
    manifest_path = pipeline.day_dir(day) / "manifest.json"
    if not manifest_path.is_file():
        raise HTTPException(status_code=409, detail=f"Day {day} chưa được Prepare")

    import json
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    expected = f"scene_{scene}.mp4"
    if expected not in manifest["expected_clips"]:
        raise HTTPException(status_code=404, detail=f"Scene {scene} không tồn tại trong Day {day}")
    content_type = request.headers.get("content-type", "").split(";", 1)[0]
    allowed_images = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}
    if media_type == "video" and content_type != "video/mp4":
        raise HTTPException(status_code=415, detail="Chế độ video chỉ nhận file MP4")
    if media_type == "image" and content_type not in allowed_images:
        raise HTTPException(status_code=415, detail="Chế độ ảnh chỉ nhận PNG, JPG hoặc WebP")

    manual_dir = pipeline.day_dir(day) / "manual_clips"
    manual_dir.mkdir(parents=True, exist_ok=True)
    destination = manual_dir / expected
    if destination.exists() and not replace:
        raise HTTPException(status_code=409, detail="Scene đã có clip; chọn Replace để thay file")

    suffix = ".mp4" if media_type == "video" else allowed_images[content_type]
    temporary = manual_dir / f".scene_{scene}{suffix}.uploading"
    size = 0
    try:
        with temporary.open("wb") as handle:
            async for chunk in request.stream():
                size += len(chunk)
                if size > 1_500_000_000:
                    raise HTTPException(status_code=413, detail="File vượt quá giới hạn 1.5 GB")
                handle.write(chunk)
        if size < 12:
            raise HTTPException(status_code=400, detail="File tải lên rỗng hoặc không hợp lệ")
        if media_type == "video":
            with temporary.open("rb") as handle:
                header = handle.read(64)
            if b"ftyp" not in header:
                raise HTTPException(status_code=400, detail="File không có header MP4 hợp lệ")
            os.replace(temporary, destination)
        else:
            target_seconds = float(manifest.get("scene_target_seconds", {}).get(str(scene), 5))
            generated_dir = pipeline.day_dir(day) / "generated_images"
            generated_dir.mkdir(parents=True, exist_ok=True)
            saved_image = generated_dir / f"scene_{scene}.png"
            shutil.copy2(temporary, saved_image)
            _convert_image_to_scene_clip(
                pipeline, temporary, destination, target_seconds,
                _scene_title_spec(manifest, scene),
            )
        original = manual_dir / "originals" / expected
        if original.exists():
            original.unlink()
    finally:
        if temporary.exists():
            temporary.unlink()
    return {
        "status": "success",
        "day": day,
        "scene": scene,
        "filename": expected,
        "size_bytes": size,
    }


@app.post("/api/fit-duration/{day}/{scene}")
def fit_scene_duration(day: int, scene: int):
    """Retime one scene to its locked voice/subtitle target without shifting other scenes."""
    if day not in DAY_SLUGS:
        raise HTTPException(status_code=404, detail="Day must be from 1 to 7")
    pipeline = load_pipeline()
    output_dir = pipeline.day_dir(day)
    manifest_path = output_dir / "manifest.json"
    if not manifest_path.is_file():
        raise HTTPException(status_code=409, detail=f"Day {day} chưa được Prepare")

    import json
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    expected = f"scene_{scene}.mp4"
    if expected not in manifest["expected_clips"]:
        raise HTTPException(status_code=404, detail=f"Scene {scene} không tồn tại trong Day {day}")
    clip = output_dir / "manual_clips" / expected
    if not clip.is_file():
        raise HTTPException(status_code=409, detail=f"Scene {scene} chưa có clip")
    target_duration = float(manifest.get("scene_target_seconds", {}).get(str(scene), 0))
    if target_duration <= 0:
        raise HTTPException(status_code=409, detail=f"Scene {scene} chưa có target duration")

    ffmpeg_config = pipeline.config["renderer"]["ffmpeg_path"]
    ffmpeg = str(ROOT / ffmpeg_config) if ffmpeg_config != "ffmpeg" else ffmpeg_config
    backup_dir = output_dir / "manual_clips" / "originals"
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup = backup_dir / clip.name
    source = backup if backup.exists() else clip
    source_duration = probe_duration(ffmpeg, str(source))
    factor = target_duration / source_duration
    adjustment_percent = abs(factor - 1) * 100
    if adjustment_percent > 20:
        raise HTTPException(
            status_code=409,
            detail=f"Scene {scene} cần chỉnh {adjustment_percent:.1f}%, vượt ngưỡng an toàn 20%; nên thay clip.",
        )
    if adjustment_percent < 0.15:
        return {"status": "unchanged", "message": f"Scene {scene} đã khớp target", "factor": factor}

    if not backup.exists():
        shutil.copy2(clip, backup)
    temporary = clip.with_name(f".{clip.stem}.retimed.mp4")
    command = [
        ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
        "-filter:v", f"setpts={factor:.8f}*PTS", "-t", f"{target_duration:.3f}",
        "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-pix_fmt", "yuv420p", str(temporary),
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        if temporary.exists():
            temporary.unlink()
        raise HTTPException(status_code=500, detail=f"Không thể chỉnh {clip.name}: {result.stderr[-300:]}")
    os.replace(temporary, clip)
    new_duration = round(probe_duration(ffmpeg, str(clip)), 2)
    return {
        "status": "success",
        "scene": scene,
        "mode": "slow_down" if factor > 1 else "speed_up",
        "adjustment_percent": round(adjustment_percent, 2),
        "before_seconds": round(source_duration, 2),
        "after_seconds": new_duration,
        "target_seconds": target_duration,
        "backup": str(backup),
    }


@app.post("/api/prepare")
def prepare(req: DaysRequest):
    try:
        paths = load_pipeline().prepare(
            req.days,
            regenerate_audio=req.regenerate_audio,
            media_type=req.media_type,
            tts_settings=edge_tts_options(req.tts_settings) if req.tts_settings else None,
        )
        return {"status": "success", "output_dirs": [str(path) for path in paths]}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/render")
def render(req: RenderRequest):
    try:
        paths = load_pipeline().render(req.days, settings=req.render_settings.model_dump())
        return {"status": "success", "final_videos": [str(path) for path in paths]}
    except FileNotFoundError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/show-folder/{day}")
def show_output_folder(day: int):
    if day not in DAY_SLUGS:
        raise HTTPException(status_code=404, detail="Day must be from 1 to 7")
    output_dir = ROOT / "output" / f"day-{day}"
    if not output_dir.is_dir():
        output_dir = load_pipeline().day_dir(day)
    if not output_dir.is_dir():
        raise HTTPException(status_code=404, detail=f"Day {day} output folder not found")
    target = output_dir.resolve()
    target_str = str(target)
    if sys.platform == "win32":
        try:
            os.startfile(target_str)
        except OSError as exc:
            raise HTTPException(status_code=500, detail=f"Could not open output folder: {exc}") from exc
        return {"status": "success", "path": target_str}
    elif sys.platform == "darwin":
        command = ["open", target_str]
    else:
        command = ["xdg-open", target_str]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise HTTPException(status_code=500, detail="Could not open file manager")
    return {"status": "success", "path": target_str}


MOTION_RENDER_STATE: dict[int, dict] = {}


def _run_motion_graphic_worker(day: int):
    script_path = ROOT / "output" / f"day-{day}" / "script.json"
    cmd = ["npm", "run", "pipeline", "--", f"output/day-{day}/script.json"]
    MOTION_RENDER_STATE[day] = {
        "status": "running",
        "percent": 5,
        "stage": "Khởi tạo pipeline...",
        "detail": "",
    }
    
    try:
        proc = subprocess.Popen(
            cmd,
            cwd=str(ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            shell=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        
        for line in proc.stdout:
            clean_line = line.strip()
            if not clean_line:
                continue
            
            # Match HyperFrames percentage, e.g. "  54%  Capturing frame 1110/1749"
            pct_match = re.search(r'(\d{1,3})%\s+(.+)', clean_line)
            if pct_match:
                pct = int(pct_match.group(1))
                action = pct_match.group(2).strip()
                # Scale HyperFrames 0-100% to 35-85% of overall process
                scaled_pct = 35 + int(pct * 0.50)
                MOTION_RENDER_STATE[day]["percent"] = min(88, max(MOTION_RENDER_STATE[day]["percent"], scaled_pct))
                MOTION_RENDER_STATE[day]["stage"] = f"{action} ({MOTION_RENDER_STATE[day]['percent']}%)"
                MOTION_RENDER_STATE[day]["detail"] = clean_line
            elif "[1/8]" in clean_line or "Load env" in clean_line:
                MOTION_RENDER_STATE[day]["percent"] = max(MOTION_RENDER_STATE[day]["percent"], 10)
                MOTION_RENDER_STATE[day]["stage"] = "Kiểm tra kịch bản..."
            elif "[4/8]" in clean_line or "TTS scene" in clean_line:
                MOTION_RENDER_STATE[day]["percent"] = max(MOTION_RENDER_STATE[day]["percent"], 20)
                MOTION_RENDER_STATE[day]["stage"] = "Đang sinh giọng đọc AI (Edge TTS)..."
            elif "[5/8]" in clean_line or "Concat voice" in clean_line:
                MOTION_RENDER_STATE[day]["percent"] = max(MOTION_RENDER_STATE[day]["percent"], 28)
                MOTION_RENDER_STATE[day]["stage"] = "Đang ghép audio & SFX..."
            elif "[6/8]" in clean_line or "Compose HTML" in clean_line:
                MOTION_RENDER_STATE[day]["percent"] = max(MOTION_RENDER_STATE[day]["percent"], 33)
                MOTION_RENDER_STATE[day]["stage"] = "Đang dựng bố cục Motion Graphics..."
            elif "Merging scene subtitles" in clean_line:
                MOTION_RENDER_STATE[day]["percent"] = max(MOTION_RENDER_STATE[day]["percent"], 89)
                MOTION_RENDER_STATE[day]["stage"] = "Đang ghép phụ đề SRT..."
            elif "Burning subtitles" in clean_line:
                MOTION_RENDER_STATE[day]["percent"] = max(MOTION_RENDER_STATE[day]["percent"], 93)
                MOTION_RENDER_STATE[day]["stage"] = "Đang burn subtitle & lồng nhạc nền (93%)..."
            elif "Burned subtitles complete" in clean_line:
                MOTION_RENDER_STATE[day]["percent"] = max(MOTION_RENDER_STATE[day]["percent"], 98)
                MOTION_RENDER_STATE[day]["stage"] = "Đang lưu video hoàn thiện..."
                
        proc.wait()
        if proc.returncode == 0:
            video_path = ROOT / "output" / f"day-{day}" / "video.mp4"
            if video_path.is_file():
                MOTION_RENDER_STATE[day] = {
                    "status": "completed",
                    "percent": 100,
                    "stage": "Render hoàn tất 100%!",
                    "detail": str(video_path),
                }
            else:
                MOTION_RENDER_STATE[day] = {
                    "status": "error",
                    "percent": 0,
                    "stage": "Lỗi: Không tìm thấy video sau khi render",
                    "detail": "",
                }
        else:
            MOTION_RENDER_STATE[day] = {
                "status": "error",
                "percent": 0,
                "stage": f"Render thất bại (mã lỗi {proc.returncode})",
                "detail": "",
            }
    except Exception as exc:
        MOTION_RENDER_STATE[day] = {
            "status": "error",
            "percent": 0,
            "stage": f"Lỗi ngoại lệ: {str(exc)}",
            "detail": str(exc),
        }


@app.post("/api/render-motion-graphic/{day}")
def render_motion_graphic(day: int):
    if day not in DAY_SLUGS:
        raise HTTPException(status_code=404, detail="Day must be from 1 to 7")
    script_path = ROOT / "output" / f"day-{day}" / "script.json"
    if not script_path.is_file():
        raise HTTPException(status_code=404, detail=f"Kịch bản Day {day} chưa tồn tại ({script_path})")
    
    current = MOTION_RENDER_STATE.get(day)
    if current and current.get("status") == "running":
        return {"status": "already_running", "day": day}
        
    thread = threading.Thread(target=_run_motion_graphic_worker, args=(day,), daemon=True)
    thread.start()
    return {"status": "started", "day": day}


@app.get("/api/render-motion-graphic-progress/{day}")
def get_motion_graphic_progress(day: int):
    if day not in DAY_SLUGS:
        raise HTTPException(status_code=404, detail="Day must be from 1 to 7")
    return MOTION_RENDER_STATE.get(day, {"status": "idle", "percent": 0, "stage": "", "detail": ""})


@app.get("/api/motion-graphic-video/{day}")
def get_motion_graphic_video(day: int):
    video_path = ROOT / "output" / f"day-{day}" / "video.mp4"
    if not video_path.is_file():
        raise HTTPException(status_code=404, detail=f"Chưa có video Motion Graphic cho Day {day}")
    return FileResponse(str(video_path), media_type="video/mp4")


if __name__ == "__main__":
    uvicorn.run("pauseflow_server:app", host="127.0.0.1", port=8000, reload=False)
