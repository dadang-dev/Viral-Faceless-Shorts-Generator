# PauseFlow — Automated AI Video Pipeline Spec
### Cho dự án "Pause to Breathe" (TikTok/Reels thị trường Mỹ)

---

## 1. Mục tiêu

Người dùng chỉ cần nhập **chủ đề hoặc script thô** (ví dụ: "Ngày hôm nay tôi thấy quá tải" hoặc một đoạn script có sẵn), chương trình sẽ tự động:

1. Viết/chỉnh sửa script theo đúng giọng văn thương hiệu (Real & Raw + Micro-storytelling, tiếng Anh, tông mindfulness/slow-living).
2. Chia script thành các phân cảnh (scene breakdown), mỗi cảnh có hook/nhịp cảm xúc riêng.
3. Với mỗi cảnh, tự quyết định **1-step (text-to-video)** hay **2-step (image-to-video)** dựa trên độ phức tạp của cảnh, rồi sinh prompt tương ứng — áp dụng Style Bible cố định để giữ đồng bộ hình ảnh xuyên suốt các video.
4. Sinh ảnh (nếu 2-step) → sinh video cho từng cảnh qua backend AI video (có thể cấu hình: Kling / Runway Gen-3 / Pika / Veo...).
5. Tạo giọng đọc **tiếng Anh** (chính, cho thị trường Mỹ) bằng TTS API — có toggle chuyển sang tiếng Việt (Vbee API) nếu sau này cần bản song ngữ.
6. Tự động tạo subtitle (căn thời gian khớp với voice-over).
7. Gắn **metadata nhãn AI-generated content** cho từng cảnh (đúng chính sách TikTok).
8. Dùng **FFmpeg** ghép video + voice + subtitle + nhạc nền (chọn từ thư viện sound trending hoặc nhạc mộc mặc định) → xuất file MP4 1080x1920 (9:16), sẵn sàng đăng TikTok.

---

## 2. Kiến trúc tổng quan

```
[Input: chủ đề / script thô]
        │
        ▼
┌─────────────────────┐
│ 1. ScriptAgent        │  → viết/chỉnh script theo brand voice
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│ 2. SceneSplitter       │  → chia thành 2-4 cảnh, gắn hook/nhịp
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│ 3. PromptGenerator     │  → sinh prompt ảnh + video mỗi cảnh
│    (áp Style Bible)    │     + quyết định 1-step / 2-step
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│ 4. MediaGenBackend     │  → gọi API sinh ảnh (nếu cần) → sinh video
│    (pluggable)         │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│ 5. TTSModule           │  → sinh voice-over (EN mặc định / VN optional)
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│ 6. SubtitleGenerator   │  → căn thời gian, xuất .srt
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│ 7. AIGCLabeler         │  → gắn metadata nhãn AI cho từng cảnh
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│ 8. FFmpegRenderer      │  → ghép video+voice+sub+nhạc → MP4 1080p
└─────────────────────┘
        │
        ▼
   [Output: MP4 + .srt + metadata.json]
```

---

## 3. Tích hợp (Modules)

| Module | Vai trò | Ghi chú |
|---|---|---|
| **MediaGenBackend** | Backend chính sinh ảnh/video AI | Pluggable — hỗ trợ Kling, Runway Gen-3, Pika, hoặc Veo qua Google Flow/FlowKit nếu người dùng có tài khoản Google Ultra. Cấu hình qua `config.yaml`, không hardcode 1 provider. |
| **StyleConsistencyManager** (tuỳ chọn) | Giữ đồng bộ phong cách hình ảnh giữa các cảnh/ngày | Quản lý seed cố định hoặc reference image xuyên suốt tuần; nếu không bật, hệ thống vẫn chạy bằng cách nhúng Style Bible vào mọi prompt. |
| **TTSModule** | Sinh giọng đọc | Mặc định: ElevenLabs hoặc OpenAI TTS (giọng Anh-Mỹ, tông ấm/chậm). Có toggle `lang: vi` dùng Vbee API cho bản tiếng Việt song song nếu cần. |
| **SubtitleGenerator** | Tạo phụ đề khớp giọng đọc | Dùng Whisper (hoặc timestamp có sẵn từ TTS API nếu provider trả về word-level timing) để căn subtitle chính xác theo từng câu đã viết ở ScriptAgent, tránh lệch nhịp. |
| **AIGCLabeler** | Gắn nhãn AI-generated | Ghi metadata JSON đánh dấu cảnh nào là ảnh/video AI photorealistic → cần bật toggle khi đăng TikTok thủ công (hệ thống không tự đăng, chỉ nhắc/gắn cờ). |
| **FFmpegRenderer** | Ghép media cuối cùng | Input: video clips theo thứ tự cảnh + audio voice + audio nhạc nền (mix, nhạc nhỏ hơn giọng) + file .srt (burn-in hoặc soft sub tuỳ chọn) → Output MP4 1080x1920, H.264. |

---

## 4. Cấu trúc thư mục đề xuất

```
pauseflow/
├── README.md
├── requirements.txt
├── config.yaml                  # chọn provider ảnh/video/TTS, style bible, brand voice
├── pauseflow/
│   ├── __init__.py
│   ├── script_agent.py          # Module 1
│   ├── scene_splitter.py        # Module 2
│   ├── prompt_generator.py      # Module 3
│   ├── media_gen/
│   │   ├── base.py              # interface chung
│   │   ├── kling_backend.py
│   │   ├── runway_backend.py
│   │   └── veo_flowkit_backend.py
│   ├── tts/
│   │   ├── base.py
│   │   ├── elevenlabs_backend.py
│   │   └── vbee_backend.py
│   ├── subtitle_generator.py    # Module 6
│   ├── aigc_labeler.py          # Module 7
│   └── ffmpeg_renderer.py       # Module 8
├── assets/
│   ├── style_bible.txt          # nội dung Style Bible cố định (dán vào mọi prompt ảnh)
│   ├── music_library/           # nhạc nền mộc mặc định
│   └── brand_voice.md           # giọng văn thương hiệu để ScriptAgent tham chiếu
├── output/
│   └── {date}_{topic_slug}/
│       ├── final.mp4
│       ├── subtitles.srt
│       └── metadata.json
└── examples/
    └── demo_day1.py
```

---

## 5. Luồng xử lý chi tiết + schema dữ liệu

### Bước 1 — ScriptAgent
**Input:** `topic: str` (chủ đề hoặc script thô)
**Output:**
```json
{
  "script": "When was the last time you actually stopped?...",
  "caption": "You don't need a vacation...",
  "hashtags": ["#PauseToBreathe", "#SlowLiving", "#MindfulMoments"],
  "engagement_prompt": "Drop a 🍵 if you needed this today."
}
```
ScriptAgent dùng `brand_voice.md` làm system prompt (giọng Real & Raw, câu ngắn, không lời khuyên y tế) để đảm bảo mọi script mới vẫn đúng chất giọng đã thiết lập ở tuần đầu.

### Bước 2 — SceneSplitter
**Input:** script từ bước 1
**Output:** danh sách 2-4 scene object:
```json
[
  {
    "scene_id": 1,
    "voice_line": "When was the last time you actually stopped?",
    "visual_idea": "close-up hands wrapped around steaming tea cup, morning light",
    "duration_estimate_sec": 4
  }
]
```

### Bước 3 — PromptGenerator
Với mỗi scene, quyết định `mode: "1-step" | "2-step"` dựa trên rule đơn giản:
- Cảnh có nhân vật/đối tượng "hero" lặp lại xuyên thương hiệu (tay, người, đèn lồng cận cảnh) → `2-step` (ảnh trước để kiểm soát bố cục, rồi mới animate).
- Cảnh phụ/chuyển tiếp/hiệu ứng đơn giản (ánh sáng, bokeh, lá cây đung đưa) → `1-step` (text-to-video thẳng).

**Output mỗi scene:**
```json
{
  "scene_id": 1,
  "mode": "2-step",
  "image_prompt": "close-up of hands wrapped around a ceramic tea cup... [+ Style Bible]",
  "video_prompt": "steam slowly rising and drifting from the tea cup..."
}
```
`image_prompt` luôn tự động nối thêm nội dung `assets/style_bible.txt` ở cuối để đảm bảo đồng bộ.

### Bước 4 — MediaGenBackend
- Nếu `mode == "2-step"`: gọi image API → nhận ảnh → gọi video API dạng image-to-video với ảnh đó làm input.
- Nếu `mode == "1-step"`: gọi thẳng text-to-video API với `video_prompt`.
- Retry tối đa 2 lần nếu output lỗi format hoặc tỷ lệ khung sai (phải đúng 9:16).
- Lưu từng clip vào `output/{date}_{topic_slug}/clips/scene_{id}.mp4`.

### Bước 5 — TTSModule
- Input: toàn bộ `voice_line` của các scene ghép lại (hoặc từng câu riêng nếu cần timing chính xác hơn).
- Output: file audio `voice.mp3` + (nếu provider hỗ trợ) word-level timestamps để bước 6 dùng trực tiếp, không cần chạy lại Whisper.
- Cấu hình giọng: Anh-Mỹ, tông trầm, tốc độ chậm (~0.9x mặc định) — khớp tinh thần chậm rãi của thương hiệu.

### Bước 6 — SubtitleGenerator
- Nếu có timestamp từ TTS → dùng trực tiếp để xuất `.srt`.
- Nếu không có → chạy Whisper align voice.mp3 với script gốc để lấy timestamp.
- Mỗi dòng phụ đề giới hạn ~6-8 từ để dễ đọc trên mobile.

### Bước 7 — AIGCLabeler
- Với mỗi scene có `mode == "2-step"` hoặc prompt chứa từ khoá photorealistic → gắn `"aigc_label_required": true` trong `metadata.json`.
- Cảnh dạng minh hoạ/painterly (như kiểu đã đổi ở Ngày 6 trong bản trước) → `"aigc_label_required": false`.
- Xuất cảnh báo rõ ràng ở cuối log: *"⚠️ Nhớ bật toggle AI-generated content khi đăng — X/Y cảnh trong video này cần gắn nhãn."*

### Bước 8 — FFmpegRenderer
Lệnh FFmpeg mẫu (ghép clip theo thứ tự + mix audio + burn subtitle):
```bash
ffmpeg -f concat -safe 0 -i clips_list.txt \
  -i voice.mp3 -i background_music.mp3 \
  -filter_complex "[1:a]volume=1.0[a1];[2:a]volume=0.15[a2];[a1][a2]amix=inputs=2:duration=first[aout]" \
  -map 0:v -map "[aout]" \
  -vf "subtitles=subtitles.srt:force_style='FontSize=18,PrimaryColour=&HFFFFFF&'" \
  -c:v libx264 -crf 18 -preset medium -s 1080x1920 \
  -c:a aac -shortest \
  output/final.mp4
```

---

## 6. Demo yêu cầu build trước

Dựng thử pipeline hoàn chỉnh với đúng nội dung **Ngày 1** đã có sẵn (không cần AI viết script mới, dùng làm test case để verify toàn bộ luồng):

- **Input:** script Ngày 1 — "When was the last time you actually stopped?"
- **Style:** Real & Raw + Micro-storytelling (theo `brand_voice.md` + `style_bible.txt` đã thiết lập)
- **Scenes:** 3 cảnh đúng như đã thiết kế (tách trà → cửa sổ sáng → nền kết mời tương tác)
- **Voice:** tiếng Anh, giọng nữ/nam ấm áp, chậm (chọn theo gu thương hiệu)
- **Subtitle:** tiếng Anh, burn-in
- **Nhạc nền:** 1 file piano/acoustic mộc trong `music_library/` (placeholder, sau này thay bằng trending sound thủ công vì trending sound đổi theo tuần, không nên tự động hoá phần này)
- **Output:** `output/2026-08-09_day1-pause/final.mp4`, 1080x1920, kèm `metadata.json` ghi rõ cảnh nào cần gắn nhãn AIGC.

---

## 7. Yêu cầu chất lượng code (đưa vào Antigravity)

- **Production-ready:** có xử lý lỗi (try/except quanh mọi API call), retry logic, log rõ ràng từng bước.
- **Cấu trúc module rõ ràng:** mỗi bước 1-8 là 1 module riêng, độc lập test được (unit test cơ bản cho `scene_splitter` và `prompt_generator` vì đây là 2 bước không phụ thuộc API ngoài).
- **`config.yaml`** cho phép đổi provider (image/video/TTS) mà không sửa code — dùng pattern interface (`base.py` mỗi module có abstract class, các backend implement theo).
- **`README.md`** gồm: cách cài đặt, cách set API key (`.env`), cách chạy demo Ngày 1, giải thích cấu trúc thư mục, cách thêm provider mới.
- **`requirements.txt`** liệt kê đầy đủ dependency (ffmpeg-python hoặc gọi subprocess trực tiếp, openai/elevenlabs SDK, whisper nếu dùng, pyyaml, requests...).
- **Không hardcode API key** — luôn đọc từ biến môi trường.
- **Style Bible và brand voice tách riêng file text/markdown** (không nhúng cứng trong code) để dễ chỉnh sau này khi thương hiệu thay đổi tông.

---

## 8. Lưu ý khi đưa cho Antigravity build

- Vì các nhà cung cấp video AI (Kling, Runway, Veo/FlowKit...) có API/cách xác thực khác nhau và có thể thay đổi, nên **ưu tiên thiết kế interface chung trước, code từng backend cụ thể sau** — Antigravity nên implement `media_gen/base.py` xong rồi mới nối API thật.
- Bước 6 (Subtitle) và Bước 5 (TTS) nên tách rõ, vì có thể provider TTS không trả timestamp — cần chỗ fallback (Whisper) rõ ràng trong code, không giả định luôn có sẵn.
- Nhạc nền trending KHÔNG nên tự động hoá (vì thay đổi theo tuần và cần con người chọn cảm quan) — hệ thống chỉ tự ghép nhạc mặc định trong `music_library/`, phần thay nhạc trending để làm thủ công sau khi có bản render.
