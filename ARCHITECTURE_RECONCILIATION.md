# ARCHITECTURE RECONCILIATION

Báo cáo này đánh giá mức độ sai lệch giữa mã nguồn hiện tại của GUI (`pauseflow_server.py`) và kiến trúc Canonical đã chốt trong `PROJECT_LOG.md`. Mục tiêu là giữ lại trải nghiệm UI tốt nhất nhưng khôi phục toàn bộ business logic gốc để tránh technical debt và phá vỡ cấu trúc.

## 1. Trạng thái phân bổ logic (Core vs GUI)

| Component | Logic Canonical (Source of truth) | Trạng thái ở GUI (`pauseflow_server.py`) | Phân tích sai lệch |
| :--- | :--- | :--- | :--- |
| **Parsing Kịch Bản** | `ScriptAgent` | ⚠️ Bị bypass | GUI tự viết hàm `extract_voiceover()` cào phẳng markdown bằng regex thay vì dùng parser chuẩn. |
| **Chia Cảnh (Scene)** | `SceneSplitter` | 🛑 Bị bypass | GUI tự đếm chữ "Cảnh" trong text; nếu không có thì **hardcode 3 scene**. Không dùng logic parse cấu trúc Markdown "PHẦN 2". |
| **Sinh Prompt AI** | `PromptGenerator` | 🛑 Bị bypass | GUI không chạy sinh prompt, chỉ ghi "stub" file `scene_1.txt` rỗng. |
| **Sinh Giọng Đọc** | `EdgeTTSBackend` | ⚠️ Duplicate Code | GUI import thẳng `edge_tts.Communicate` thay vì khởi tạo class backend canonical. |
| **Tạo Video** | `ManualWatchBackend` | 🛑 Bị bypass | GUI tự dùng FFmpeg sinh dummy clip 15s màn hình xanh qua endpoint `simulate-drop`. |
| **Tạo Phụ Đề** | `SubtitleGenerator` | ✅ Gọi đúng | Endpoint `render-final` có gọi đúng class này. |
| **Assembly Video** | `FFmpegRenderer` | ⚠️ Duplicate Code | GUI viết đè một cụm lệnh `subprocess.run(ffmpeg ...)` cực kỳ cồng kềnh trong `render-final`, bỏ quên volume mix nhạc nền của module cũ. |

## 2. Hardcode & Hack phát hiện trong `pauseflow_server.py`

*   **Regex Voice-over riêng (`extract_voiceover`)**: Nếu không tìm thấy tag `**Voice-over:**`, script sẽ chạy fallback strip hết HTML/Markdown để tạo thành voice.
*   **Default 3 scenes**: Hardcode rõ ràng ở `render_quick`: `if scene_count == 0: scene_count = 3`.
*   **Dummy 15-second clips**: Endpoint `simulate-drop` tạo clip 15s cố định thay vì dựa trên `duration_estimate_sec` thực tế của từng cảnh.
*   **FFmpeg Assembly Duplicate**: Logic merge, burn hardsub, ghép voice được code cứng tại `render-final`, bỏ qua file `ffmpeg_renderer.py` đã viết chuẩn xác trước đó.

## 3. Module nào "Dead", module nào "Bị bỏ quên"?

*   **KHÔNG CÓ MODULE NÀO THỰC SỰ DEAD**. Tất cả các file trong thư mục `pauseflow/` đều chứa logic cốt lõi đúng chuẩn theo quyết định của `PROJECT_LOG.md`.
*   **Module bị bỏ quên do Regression Input**: `ScriptAgent`, `SceneSplitter`, `PromptGenerator` bị bỏ rơi hoàn toàn vì file `money-habits-ALL.md` đã bị mất đi cấu trúc "Ngày X" và "Cảnh Y". Frontend thấy lỗi parse liền viết hàm regex cào bằng để vượt rào (bypass).

## 4. Đề xuất kiến trúc lai (Hybrid Architecture)

Chúng ta có thể GIỮ LẠI React GUI (với UX từng bước rất tốt) nhưng BẮT BUỘC GUI chỉ được đóng vai trò **Orchestrator** (người điều phối), không được phép chứa Business Logic.

**Luồng hoạt động mới đề xuất:**

1.  **Bước 1: Parse & TTS (`/api/render-quick`)**:
    *   GUI truyền cấu trúc Script v2 tối ưu (kèm PHẦN 2 Prompt).
    *   Backend gọi `ScriptAgent` để parse → gọi `SceneSplitter` để chia cảnh → gọi `PromptGenerator` để sinh & ghi file prompt thật vào `pending_prompts/`.
    *   Backend gọi `EdgeTTSBackend` sinh audio.
2.  **Bước 2: Video Creation (`/api/manual-check`)**:
    *   Bỏ nút "Simulate Dummy". Đổi thành luồng: Báo cho user đọc prompt ở `pending_prompts/` → Dùng CapCut tạo video → Bỏ vào `manual_clips/`.
    *   GUI có nút "Xác nhận đã có đủ Clip" gọi polling `ManualWatchBackend` trong background để kiểm tra số lượng file MP4 có bằng số lượng Prompt hay chưa.
3.  **Bước 3: Assembly (`/api/render-final`)**:
    *   Backend gọi `SubtitleGenerator` sinh SRT.
    *   Backend gọi `FFmpegRenderer` để merge toàn bộ (bao gồm mix nhạc nền mặc định).

## 5. MIGRATION PLAN (Các bước thực thi)

*Dưới đây là kế hoạch sửa đổi tuần tự. Vui lòng duyệt trước khi thực thi.*

### Step 1: Phục hồi Dữ liệu Đầu vào (Nguồn sự thật)
*   **Hành động**: Trộn `money-habits-script-v2-optimized.md` (nội dung voiceover mới) và `money-habits-ai-prompts.md` (cấu trúc cảnh) thành một file `money-habits-ALL.md` chuẩn tắc (có chia rõ PHẦN 1 và PHẦN 2).
*   **File ảnh hưởng**: `money-habits-ALL.md`.

### Step 2: Khôi phục Core Logic trong GUI Bước 1
*   **Hành động**: Xoá bỏ hàm `extract_voiceover()` và `edge_tts` trực tiếp trong `pauseflow_server.py`. Chỉnh endpoint `/api/render-quick` để import và khởi tạo `ScriptAgent`, `SceneSplitter`, `PromptGenerator`, và `EdgeTTSBackend`. 
*   **File ảnh hưởng**: `pauseflow_server.py`.

### Step 3: Tích hợp Manual Watch Backend cho Bước 2
*   **Hành động**: Đổi endpoint `/api/simulate-drop` thành API để kiểm tra tính đầy đủ của thư mục `manual_clips/` dựa trên `ManualWatchBackend`. Sửa frontend xoá nút Simulate đi, thay bằng nút "Xác nhận Clips".
*   **File ảnh hưởng**: `pauseflow_server.py`, `frontend/src/App.tsx`.

### Step 4: Gỡ Duplicate FFmpeg trong Bước 3
*   **Hành động**: Xoá toàn bộ logic `subprocess.run(ffmpeg ...)` trong endpoint `/api/render-final`. Gọi thẳng `FFmpegRenderer().render(...)`.
*   **File ảnh hưởng**: `pauseflow_server.py`.
