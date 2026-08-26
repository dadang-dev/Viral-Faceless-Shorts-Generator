# INPUT V2 VALIDATION REPORT

Báo cáo kết quả quá trình tạo và kiểm thử file input `money-habits-ALL-v2.md` dựa trên nguồn canonical và phiên bản tối ưu V2.

## 1. Nội dung File

*   **Nguồn base (Canonical):** `money-habits-ALL.md` (giữ nguyên PHẦN 1 cấu trúc, PHẦN 2, các caption, hashtag, engagement prompt, style metadata, scene breakdown).
*   **Nguồn merge (V2):** `money-habits-script-v2-optimized.md` (chỉ bóc tách và thay thế nội dung block `**Voice-over:**`).
*   **Trạng thái file mới:** `money-habits-ALL-v2.md` đã được tạo thành công, bảo toàn tính toàn vẹn của mọi section ngoại trừ nội dung Voice-over đã được cập nhật thành bản dài hơn (v2).

## 2. Kết quả Validation từ Core Modules

Script kiểm thử chạy trực tiếp `ScriptAgent`, `SceneSplitter`, và `PromptGenerator` từ thư mục `pauseflow/`:

| Ngày | Parser Status | Scenes (PHẦN 2) | Voice-over Length (chars) | Video Prompts |
| :--- | :--- | :--- | :--- | :--- |
| Day 1 | ✅ PASS | 5 | 905 | 5 |
| Day 2 | ✅ PASS | 4 | 755 | 4 |
| Day 3 | ✅ PASS | 4 | 787 | 4 |
| Day 4 | ✅ PASS | 4 | 748 | 4 |
| Day 5 | ✅ PASS | 4 | 761 | 4 |
| Day 6 | ✅ PASS | 4 | 827 | 4 |
| Day 7 | ✅ PASS | 3 | 652 | 3 |

**Nhận xét:**
*   Đủ Day 1–7 trong PHẦN 1.
*   Mỗi Day có đúng 1 Voice-over, parse thành công.
*   `SceneSplitter` đọc trơn tru từ PHẦN 2 và trả về chính xác số lượng cảnh theo từng Day.
*   `PromptGenerator` tạo prompt video thành công cho tổng cộng 28 cảnh của cả tuần.
*   Không có nội dung rác (fallback) hay script bị lọt từ dự án "Pause to Breathe".

## 3. Verify Regression Claim

`Does main.py's previous parser regression disappear with money-habits-ALL-v2.md? YES`

**Chứng minh:**
Lỗi `ValueError: Could not find PHẦN 2 in the script file` hoặc `Could not find section for Day X` trong các báo cáo trước đều bắt nguồn từ việc UI lưu đè cấu trúc Markdown gốc bằng một khối văn bản phẳng mất định dạng. 

Với file `money-habits-ALL-v2.md` được xây dựng lại từ bản canonical chuẩn, output từ Python CLI xác nhận các hàm `agent.generate_script(day_id)` và `splitter.split_script(day_id)` gọi thành công cho toàn bộ 7 vòng lặp mà không ném ra bất kỳ Exception nào. Lỗ hổng Regex đã tự động được vá nhờ việc khôi phục cấu trúc văn bản.

## 4. Danh sách các file được tác động

1.  `money-habits-ALL-v2.md`: File tạo mới (đóng vai trò nguồn đầu vào chuẩn bị cho Migration Step 2).
2.  `scratch_merge.py`: Script tạm được tạo để xử lý bóc tách và chạy validate.
3.  `reports/input_v2_validation.md`: Báo cáo này.

**(Các file mã nguồn `pauseflow/` và `pauseflow_server.py` tuyệt đối chưa bị thay đổi).**
