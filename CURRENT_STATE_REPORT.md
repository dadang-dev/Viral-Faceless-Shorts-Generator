# 1. EXECUTIVE SUMMARY

Tóm tắt ngắn:
* **Dự án hiện đang làm gì:** PauseFlow - hệ thống tự động hoá tạo video (TikTok/Reels) từ script thô sang video final bằng cách sinh giọng đọc (TTS), chia cảnh, tạo dummy video clips, burn phụ đề, và ghép bằng FFmpeg.
* **Pipeline hiện tại chạy được đến đâu:** Chạy được end-to-end trên giao diện GUI (từ tạo TTS -> sinh dummy clips -> ghép video cuối cùng có cả voice và subtitle hardsub). Tuy nhiên, Pipeline batch CLI (`main.py`) đang bị gãy do file script đầu vào mất định dạng.
* **Phần hoàn thành:** Giao diện React (3 bước), backend FastAPI xử lý trích xuất voice-over, Edge-TTS, fake video clip (bằng FFmpeg color filter), Whisper tạo subtitle và burn hardsub, ghép nối hoàn chỉnh.
* **Phần dang dở:** Pipeline sinh media thật (Kling/Runway/Seedance/CapCut) hoàn toàn chưa được tích hợp tự động vào API/GUI. Hệ thống hiện chỉ dựa vào người dùng thả clip vào thư mục hoặc chức năng simulate dummy clips.
* **Blocker lớn nhất:** `money-habits-ALL.md` đã đổi định dạng, không còn cấu trúc "PHẦN 2", "## Day X", "**Cảnh X" như bộ core trong folder `pauseflow/` kỳ vọng. Điều này làm hỏng pipeline cũ `main.py`. Giao diện mới đang dùng cách bypass tạm thời. 
* **Bước tiếp theo hợp lý nhất:** Đồng nhất lại định dạng file kịch bản đầu vào, quyết định chọn GUI hay CLI, và kết nối với provider sinh Video thực sự.

# 2. CURRENT PROJECT TREE

```text
project/
├── frontend/                     # React UI (Vite) cho pipeline mới
│   ├── src/App.tsx               # Giao diện chính 3 bước (Generate Voice, Simulate, Render Final)
├── pauseflow/                    # Các module core của pipeline gốc
│   ├── scene_splitter.py         # [BROKEN] Phân tách cảnh, hiện không chạy được với format script mới
│   ├── script_agent.py           # Module parse script
│   ├── prompt_generator.py       # Sinh prompt video
│   ├── media_gen/
│   │   └── manual_watch_backend.py # Backend đợi file manual copy (dùng trong main.py)
│   ├── tts/
│   │   └── edge_tts_backend.py   # Edge TTS
│   ├── subtitle_generator.py     # Whisper transcribe và tạo SRT
│   └── ffmpeg_renderer.py        # Logic ghép cũ (main.py dùng)
├── output/                       # Nơi chứa kết quả render
│   └── my-video/                 # Output của GUI (voice.mp3, clips/, subtitles.srt, final.mp4)
├── skills/
│   └── expert_copywriter.md      # Skill agent
├── main.py                       # [BROKEN] Entry point của pipeline batch cũ
├── pauseflow_server.py           # [WORKING] Entry point của backend API & UI mới
├── money-habits-ALL.md           # [INPUT] Script hiện hành (nhưng chỉ còn Day 1, mất cấu trúc cũ)
├── pauseflow-02-SPEC.md          # File Spec hệ thống
└── PROJECT_LOG.md                # [KHÔNG TÌM THẤY TRÊN HỆ THỐNG FILESYSTEM]
```
*Giải thích:*
- `pauseflow_server.py`: Trái tim hiện tại, chạy FastAPI để phục vụ GUI, bypass nhiều module trong `pauseflow/` để dùng logic ngắn gọn hơn.
- `frontend/src/App.tsx`: GUI cho phép tương tác từng bước với progress bar thời gian thực.
- `money-habits-ALL.md`: Script đang được dùng để test, bị xoá format 7 day.

# 3. CURRENT PIPELINE ARCHITECTURE

Hiện có 2 pipeline:

**A. Pipeline GUI mới (WORKING - Active) trong `pauseflow_server.py`:**
* Input Script → `extract_voiceover()` regex đơn giản (WORKING)
* Text → `edge_tts.Communicate` (WORKING, Edge-TTS sinh `voice.mp3`)
* Clip Gen → `subprocess.run(ffmpeg)` tạo clip màu xanh (WORKING, giả lập cảnh)
* Subtitle → `SubtitleGenerator` gọi model Whisper (WORKING, sinh `subtitles.srt`)
* Assembly → Gọi `ffmpeg` ghép clips + âm thanh + burn subtitle (WORKING, xuất `final.mp4`)

**B. Pipeline Batch cũ (BROKEN) trong `main.py`:**
* Input → `ScriptAgent` (PARTIAL)
* Split → `SceneSplitter` (BROKEN - do `money-habits-ALL.md` không còn header "PHẦN 2")
* Prompts → `PromptGenerator` (NOT REACHED)
* Media → `ManualWatchBackend` (NOT REACHED)
* Assembly → `FFmpegRenderer` (NOT REACHED)

# 4. ENTRY POINTS / HOW TO RUN

* **Entry point chính (GUI):**
  * Backend: `source venv/bin/activate && PYTHONPATH=. python3 pauseflow_server.py`
  * Frontend: `cd frontend && npm run dev`
* **Command chạy full batch pipeline (Cũ, bị lỗi):** `python3 main.py`
* **Command test nhỏ:** Có các script trong `examples/` như `python3 examples/test_dummy_drop.py`
* **Working directory:** Root folder `/Users/dnd/Desktop/Pauseflow`
* **Python version:** `python3` (venv macOS).
* **Dependencies chính:** `fastapi`, `uvicorn`, `edge-tts`, `openai-whisper`.
* **Phụ thuộc ngoại vi:** binary `ffmpeg` (ở venv hoặc biến môi trường).

# 5. INPUT FORMAT
* **File input chính:** `money-habits-ALL.md`
* **Parser hiện tại (GUI - `pauseflow_server.py`):**
  * Đọc thẳng toàn bộ file. Dùng regex tìm nội dung bên dưới block `**Voice-over:**`.
  * Nếu không tìm thấy, nó sẽ xoá sạch markdown (bold, heading, quote, hashtag) và gom phần chữ còn lại làm Voice.
  * Tính số lượng Scene (cảnh) bằng cách regex đếm số lần xuất hiện của chữ `Cảnh` hoặc `Scene`.
* **Format Day:** Đã bị xoá trong file hiện hành (hiện chỉ còn kịch bản của 1 video duy nhất).
* **Caption/Hashtag:** Có tồn tại trong text nhưng bị parser GUI lờ đi hoàn toàn.
* **Trường bắt buộc:** `**Voice-over:**` (để tránh voice bị sai).

# 6. DAY 1–7 CURRENT STATUS
Vì input gốc bị ghi đè chỉ còn 1 video, nên hệ thống không còn batch xử lý Day 1-7. Dưới đây là kết quả của lần test UI gần nhất (lưu ở `output/my-video/`):

| Day | Script version | Word count | Scenes | TTS duration | Subtitle | Video generated | Final duration | Status |
| --- | -------------- | ---------- | ------ | ------------ | -------- | --------------- | -------------- | ------ |
| 1 (my-video) | UI pasted | ~100 | 3 | ~29s | Có (SRT) | Có (Dummy Blue) | ~29s | WORKING |
| 2 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | BROKEN |
| 3 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | BROKEN |
| 4 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | BROKEN |
| 5 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | BROKEN |
| 6 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | BROKEN |
| 7 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | BROKEN |

# 7. CURRENT SCRIPT VERSION
* File nguồn: `money-habits-ALL.md`
* Phiên bản: Chỉ chứa duy nhất nội dung Day 1 ("3 spending habits quietly making you poorer"). Mất hoàn toàn format batch. Kịch bản đã bị sửa trực tiếp nhiều lần.

# 8. CURRENT SCENE STRUCTURE
* **Mỗi Day bao nhiêu scene:** GUI gán mặc định là 3 scene nếu không đếm được chữ "Cảnh"/"Scene".
* **Scene duration:** Bị hardcode là 15 giây cho mỗi scene khi tạo clip giả lập (`color=c=blue:s=1080x1920:d=15`). FFmpeg sau đó sẽ tự cắt ngắn cờ `-shortest` cho vừa độ dài Voice.
* **Prompt video:** Hiện KHÔNG được lấy từ file. GUI chỉ tạo clip màu trơn (dummy).

# 9. TTS STATUS
* **Provider:** Edge-TTS.
* **Voice:** `en-US-ChristopherNeural` (Giọng nam trầm, tiếng Anh).
* **Speed:** Normal mặc định của Edge-TTS.
* **File output:** `output/my-video/voice.mp3`.
* **Cách đo duration:** Không cần đo trước; FFmpeg tự động trim hình ảnh dựa theo độ dài thực tế của file `voice.mp3`.
* **Fallback provider:** Không có.

# 10. SUBTITLE STATUS
* **Format:** file `.srt` (phụ đề tiêu chuẩn).
* **Module:** `pauseflow.subtitle_generator.SubtitleGenerator` tích hợp chung `openai-whisper` (Base model).
* **Timestamp:** Phân tích trực tiếp từ file `voice.mp3` thông qua Whisper.
* **Sync:** Cực kì chuẩn vì được map bằng model AI lên đúng audio đã sinh ra.
* **Burn-in:** Hardsub được burn bằng bộ lọc `subtitles='subtitles.srt'` của FFmpeg (Chữ trắng, viền outline đen).

# 11. MEDIA / VIDEO GENERATION STATUS
* **Backend hiện dùng:** "DUMMY BACKEND" (Tạo clip xanh lam trơn bằng FFmpeg) thông qua `/api/simulate-drop`.
* **CapCut / Seedance:** NOT IMPLEMENTED tự động. Backend chỉ có class chờ người dùng tự làm bằng tay (`ManualWatchBackend`) và copy file mp4 vào `manual_clips/`.
* Hệ thống hiện tại **KHÔNG TỐN CREDIT** tạo AI video vì code tự động gọi API sinh Video chưa từng được cài đặt và kích hoạt trong đường dẫn GUI.

# 12. VIDEO ASSEMBLY STATUS
* **Module:** FFmpeg (được gọi bằng `subprocess` trong `pauseflow_server.py:render_final`).
* **Ghép clip:** Dùng FFmpeg `concat` demuxer (qua file `concat.txt`).
* **Audio:** Gắn đè và giữ nguyên (`-c:a aac -map 0:v:0 -map 1:a:0`). Giới hạn độ dài bằng `-shortest`.
* **Subtitle:** Hardsub burn trực tiếp.
* **Resolution/Aspect Ratio:** Phụ thuộc 100% vào các clip input. (Vì là dummy 1080x1920 nên video cuối là 1080x1920 (9:16)). Export `.mp4` chuẩn `libx264`.

# 13. CONFIG / ENVIRONMENT
* **File:** `.env.example`, `config.yaml`
* Biến môi trường:
  * `FFMPEG_PATH`: (Optional) Path chỉ tới FFmpeg binary.
* **Lưu ý:** `config.yaml` chứa các setup AI nhưng API GUI hiện hành bỏ qua phần lớn file này (bị hardcode).

# 14. DEPENDENCIES
* Python: `fastapi`, `uvicorn`, `edge-tts`, `openai-whisper`.
* Hệ thống: `ffmpeg` (đã được setup chạy tốt trong môi trường venv).

# 15. LATEST SUCCESSFUL RUN
* Ngày/Giờ: `2026-08-11T01:10`
* Command: Bấm nút "Bước 3: Render Final Video" trên UI.
* Input: `money-habits-ALL.md` (Day 1).
* Stages thành công: Voice Extractor -> TTS -> Simulator -> Concat -> Subtitle Burn.
* Output files: `final.mp4` (đủ voice + subtitle, nền xanh), `subtitles.srt`, `voice.mp3`.
* Duration (Video): ~29 giây.

# 16. LATEST FAILED RUNS / KNOWN ERRORS
* **Stage:** Khởi chạy `python3 main.py`
* **Error:** Lỗi Regex `ValueError: Could not find PHẦN 2 in the script file.` trong `scene_splitter.py`.
* **Nguyên nhân:** File `money-habits-ALL.md` không còn tuân theo cấu trúc markdown cũ.

# 17. CHANGES SINCE PROJECT_LOG.md
*(Note: File `PROJECT_LOG.md` không tồn tại ở thư mục gốc, đối chiếu theo `pauseflow-02-SPEC.md` và code structure cũ)*

## A. Changes consistent with PROJECT_LOG
* Triển khai xuất sắc Edge-TTS, Whisper SRT và FFmpeg Pipeline Assembly. Subtitles và voice khớp hoàn hảo.

## B. Changes NOT recorded in PROJECT_LOG
* Bổ sung giao diện ReactUI Web và FastAPI phục vụ theo từng bước lẻ thay vì script CLI chạy một mạch (batch).
* Tính năng "Simulate Dummy Video" để pass nhanh quy trình render không cần chờ CapCut.

## C. Potential conflicts
* Code `main.py` và các bộ Parser (`scene_splitter.py`) mong đợi cấu trúc "Ngày 1 -> Cảnh 1", trong khi UI server `pauseflow_server.py` đang dùng regex cào phẳng text (cào bỏ hashtag/cấu trúc). Nếu chuyển về lại Batch Process sẽ xảy ra xung đột dữ liệu input lớn.

# 18. TECHNICAL DEBT / TEMPORARY HACKS
* **Hardcode Path:** UI đang hardcode đổ mọi clip vào folder `output/my-video/`.
* **Hardcode logic:** Hardcode mặc định 3 clip 15s nếu không đoán ra từ "Cảnh".
* **Duplication:** Lệnh FFmpeg Assembly nằm ở 2 file riêng biệt (`ffmpeg_renderer.py` cũ và `pauseflow_server.py` mới).
* **Dead Code:** Nhiều file trong `pauseflow/` hiện đang dead code vì UI không còn gọi đến chúng.

# 19. SOURCE OF TRUTH MAP
| Information            | Current source of truth | Ghi Chú |
| ---------------------- | ----------------------- | --------|
| Product decisions      | `pauseflow-02-SPEC.md`  | `PROJECT_LOG.md` is Missing/Deleted. |
| Voice-over scripts     | `money-habits-ALL.md`   | Chỉ còn Day 1, format bị phá vỡ. |
| Pipeline orchestration | `pauseflow_server.py`   | (Trái tim của hệ thống hiện hành). |
| Video prompts          | NULL                    | Bị bỏ qua, dùng Dummy video xanh lam. |

# 20. EXACT CURRENT HANDOFF POINT

`WHERE SHOULD THE NEXT AI CONTINUE?`

* **Đã xong:** Giao diện 3 bước hoàn chỉnh, có progress bar. Khâu nối FFmpeg, TTS Edge, tạo Subtitles Whisper hoạt động hoàn hảo.
* **Đang dang dở:** Logic AI tạo video hình ảnh thật. `money-habits-ALL.md` đang bị mất cấu trúc.
* **Hành động tiếp theo nên là:**
  1. Hỏi User xem họ có file `PROJECT_LOG.md` không, hay ý họ là `pauseflow-02-SPEC.md`.
  2. Quyết định rõ: tiếp tục build UI cho Video Lẻ, hay sửa lại file Input để phục hồi khả năng Batch Processing của `main.py`.
  3. Cài đặt API sinh video thật (như Capcut/Seedance/Kling API) để thay thế cho nút Sinh Video Xanh Lam (Dummy).
* **Điều KHÔNG nên làm:** Không đụng vào logic ghép video FFmpeg (ở cuối `pauseflow_server.py`) vì nó đang chạy tốt, rất khó chỉnh chọc.

# 21. GIT / FILE CHANGES
* **Git:** Hệ thống KHÔNG sử dụng `git` (Không có `.git`). 
* Files chỉnh sửa nhiều nhất gần đây: `pauseflow_server.py`, `frontend/src/App.tsx`.
