# Báo cáo Cập nhật: Phase 2 (Trọng tâm Media & Gen AI)

## Trạng thái: Hoàn thành

Theo yêu cầu điều chỉnh kế hoạch, Phase 2 đã được cập nhật hoàn chỉnh với các thành phần mới:

### 1. [TTS Backend (Edge TTS)](file:///Users/dnd/Desktop/Pauseflow/pauseflow/tts/edge_tts_backend.py)
- Đã cài đặt thư viện `edge-tts` (thêm vào `requirements.txt`).
- `EdgeTTSBackend` được thiết lập làm mặc định (free, không cần API key) cho quá trình build/demo, tạo ra file audio từ text một cách nhanh chóng.

### 2. [Subtitle Generator (Whisper Fallback)](file:///Users/dnd/Desktop/Pauseflow/pauseflow/subtitle_generator.py)
- Đã cài đặt thư viện `openai-whisper` (thêm vào `requirements.txt`).
- Khi Edge TTS không trả về word-level timestamp, `SubtitleGenerator` tự động nhận diện (fallback) và load model Whisper (`base`) để tiến hành transcribe audio nhằm lấy timestamp chính xác từng từ, sau đó xuất ra file chuẩn `.srt`.

### 3. Media Gen (Manual Watch Backend - Bán Tự Động)
- Tạo module `ManualWatchBackend` thay cho Google Flow/Veo.
- Pipeline ghi các prompt sinh video ra thư mục `pending_prompts/scene_{id}.txt` và tạm dừng vòng lặp (timeout 30 phút).
- Hệ thống sẽ liên tục watch thư mục `manual_clips/` mỗi 5s. Bạn chỉ cần copy prompt vào app CapCut (Seedance), tải video về đổi tên thành `scene_{id}.mp4` và thả vào thư mục chờ. Pipeline sẽ tự động bắt lấy file và chạy tiếp!
- Mọi logic 2-step (sinh ảnh tĩnh) đã được loại bỏ hoàn toàn khỏi Interface `media_gen/base.py`. Các provider hiện tại chỉ nhận input là `video_prompt` (Text-to-Video).

### 4. Tích hợp Pipeline ([demo_day1.py](file:///Users/dnd/Desktop/Pauseflow/examples/demo_day1.py))
- Pipeline chính đã được sửa đổi để sử dụng `EdgeTTSBackend` và `ManualWatchBackend` (Bán tự động CapCut), đồng thời truyền đường dẫn audio vào `SubtitleGenerator` để thực hiện Whisper fallback.

### 5. Lưu ý: Module AIGCLabeler
- **Module `aigc_labeler.py` (Bước 7) đang được TẠM HOÃN**. Module này sẽ được dời sang làm ở một Phase bổ sung sau khi hoàn thành Phase 3 (FFmpeg Render) và test xong luồng chính yếu. Một dòng TODO đã được thêm vào file pipeline để nhắc nhở không đăng video thật lên TikTok nếu thiếu nhãn cảnh báo này.

### 6. Kết quả Kiểm thử (Đã xác minh)
- **Phương thức test:** Chạy script độc lập `test_phase2.py` với input tĩnh, không gọi đến Phase 1 (không cần `OPENAI_API_KEY`).
- **Môi trường:** Đã tạo Virtual Environment, cài đặt `numpy<2`, `edge-tts`, `openai-whisper` và tải một bản build tĩnh của `ffmpeg` vào `venv/bin/` để tránh lỗi Errno 2.
- **Kết quả:** **PASS**. File âm thanh `voice.mp3` được tạo từ Edge TTS và file phụ đề `subtitles.srt` với độ chính xác timestamp theo cấp độ từ (word-level) đã được Whisper (`base` model) xuất thành công.

> [!NOTE]
> Mời bạn review mã nguồn Phase 2. Toàn bộ Phase 1 và Phase 2 hiện đã phản ánh đúng 100% cấu trúc bạn yêu cầu. 
> 
> Nếu mọi thứ đã sẵn sàng, chúng ta có thể chuyển sang kiểm thử luồng bằng cách cung cấp các thông tin API thực tế trong `.env` (như OPENAI_API_KEY) để tiến tới khâu chốt Phase 3 (FFmpeg Render)!
