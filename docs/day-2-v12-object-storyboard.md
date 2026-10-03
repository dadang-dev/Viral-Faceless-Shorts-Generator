# Day 2 — Object-led storyboard / đề xuất để duyệt

Status: STORYBOARD_APPROVED — user “okie r đó” on 2026-09-14. Implementation is authorized for an isolated Day 2 benchmark; this does not approve the resulting MP4. Original planning notes below describe the pre-implementation proposal.

## Phạm vi

Giữ MASTER TEMPLATE v1.2, Day 1 R2, canonical voice-over, theme, captions và runtime. Chưa render, chưa sửa code, không làm Day 3–7. Bản `day-2-v12-workflow-rebuild` giữ nguyên làm đối chứng; không coi phản hồi “okie” là duyệt MP4.

Reference `gia-coin-hom-nay-29-8-2026/TEMPLATE_RULES.md` chỉ cung cấp gợi ý về hierarchy và composition. Không nhập copy, số liệu, màu, timing hoặc runtime từ reference. Review trước đã đọc HTML/CSS/JS; không tuyên bố đã xem demo MP4.

## Exact approved voiceText

Source: `money-habits-script-v2.1-verified.md`, toàn bộ Day 2, nối các đoạn bằng khoảng trắng.

> Here's something that messes with almost everyone: you can get a raise, and still feel broke six months later. That's called lifestyle creep. It's not one big decision. It's a slightly nicer apartment — two hundred dollars more a month because 'I can afford it now.' It's upgrading from a used car to a new lease. It's ordering the appetizer AND dessert instead of just picking one, because why not. Each choice feels small and reasonable in the moment. But stack them up, and your spending rises exactly as fast as your income — sometimes faster. The fix isn't depriving yourself. It's just noticing: did my spending go up because I actually wanted this, or because I could? That one question, asked honestly, catches more leaks than any budgeting app.

## Ý tưởng xuyên suốt

Primary archetype: `accumulation`; secondary: `comparison`.

Những lựa chọn riêng lẻ trở thành một cụm chi tiêu; sau đó chuyển sang quan hệ chi tiêu/thu nhập và câu hỏi tự kiểm tra. Thời gian chỉ là mở bài, không biến toàn bộ video thành timeline. Không dùng một card mới cho mỗi câu.

Các tên đoạn tiếng Việt dưới đây chỉ là ghi chú sản xuất, KHÔNG hiển thị trong video. Event anchors là cụm trong voice-over; thời điểm phải resolve từ WordBoundary, không dùng số thứ tự storyboard làm timing.

## Storyboard

| Đoạn / anchor | Hình ảnh chính và diễn biến | Trạng thái giữ lại / điều không làm |
| --- | --- | --- |
| 1. “Here's something…” → “you can get a raise” | Mở bằng vật thể ví đủ lớn để nhận ra ngay, cùng hook exact-source. Tại “raise”, ví mở nhẹ để biểu đạt thay đổi thu nhập, không phun tiền hoặc hiện số dư. | Ví là vật thể mở bài, không icon nhỏ bên dưới một vùng chữ khổng lồ. Không vẽ mức tăng lương. |
| 2. “still feel broke” → “six months later” → “lifestyle creep” | Lịch trở thành dominant object. Lật một lớp trang không ghi ngày khi cụm thời gian bắt đầu; chốt **6 MONTHS** tại phrase được resolve. Ví còn như một chi tiết phụ, không có phép đo mức tiền. “LIFESTYLE CREEP” là marker ngắn khi được đọc. | Lật trang biểu thị thời gian, không countdown 1–6, không lịch có ngày/tháng tự đặt. “It's not one big decision” nằm ở subtitle, không thêm sentence card. |
| 3. “a slightly nicer apartment” → “two hundred dollars more a month” | Căn hộ dạng SVG lớn, không bọc trong card label. Từng nét cửa/mái hoàn thiện khi căn hộ được giới thiệu. Giá **$200 / MONTH** xuất hiện trong lane riêng cùng qualifier **MORE**; punch nhẹ đúng voice. | Giá là phần tăng thêm, không phải tổng tiền thuê. Đến ví dụ xe, căn hộ và giá thu về vùng retained phía trên nhưng vẫn đủ đọc. |
| 4. “a used car” → “a new lease” | Xe cũ hiện thành vật thể ở lane chính. Đến “a new lease”, trạng thái xe mới chiếm focus; trạng thái cũ lùi/dim, vẫn phân biệt bằng hai nhãn exact-source. | Không dựng thêm bảng hai card giống căn hộ. Không dùng mũi tên xéo. Không gán giá xe, nợ hoặc mức tiết kiệm. |
| 5. “the appetizer AND dessert” → “instead of just picking one” | Bố cục bàn ăn nhìn từ trên: đĩa món khai vị xuất hiện, rồi đĩa tráng miệng riêng cùng tồn tại. Vật thể khác rõ xe/căn hộ. | Đây là AND, không VS, không thay đĩa trước bằng đĩa sau. Đúng hai nhóm món được nói đến, không đồ ăn phụ hoặc giá tự thêm. |
| 6. “Each choice feels small…” → “stack them up” | Giữ chính căn hộ, xe đang được chọn và hai món; thu về một cụm tích lũy có thứ tự. Đến “stack them up”, các nhóm hội tụ vào bố cục chung, không reset thành headline đơn độc. | Tích lũy lựa chọn, không cộng tiền; không vẽ thêm bản sao của vật thể cũ. Không giữ cả xe cũ và mới như hai khoản mua. Giá căn hộ phải ẩn sạch trước khi bị thu nhỏ quá mức. |
| 7. “your spending rises exactly as fast as your income” → “sometimes faster” | Cụm lựa chọn lùi thành context. Hai dải lớn, không phải underline mỏng: SPENDING/INCOME theo nhãn exact-source đầy đủ. Cùng điểm bắt đầu, đầu dải đi cùng nhau khi mô tả cùng tốc độ; chi tiêu vượt khi “sometimes faster”. | Đây là schematic định tính, không chart đo tiền: không trục, tick, tỷ lệ, số dư hoặc phần trăm. Không suy ra spending lớn hơn income ở mọi thời điểm. Không giữ dải dưới nhãn nếu chuyển động không truyền được quan hệ. |
| 8. “The fix isn't depriving yourself” | Một nhịp typography có chủ đích, exact full phrase, cho người xem nghỉ sau đoạn nhiều vật thể. Các lựa chọn chỉ lùi khỏi focus; không bị gạch bỏ hoặc phá hủy. | Không diễn giải thành cấm mua nhà/xe/đồ ăn. Không thêm transition để đủ quota. |
| 9. “did my spending go up…” → “because I actually wanted this” → “because I could” | Hai vùng đối chiếu thoáng: heart và wallet đủ lớn, nhãn đặt bên dưới ở vùng riêng. Focus lần lượt theo voice, sau đó cả hai rõ để người xem đối chiếu. | Không có đường nối chạy qua chữ; không đánh dấu đúng/sai, good/bad. Nhãn dài được wrap và giữ khoảng hở khi icon scale. |
| 10. “That one question, asked honestly…” → kết | Hai lựa chọn lùi, giữ một điểm focus trung tính cho câu hỏi; THAT ONE QUESTION làm payoff. Không vẽ tiền được hoàn lại hoặc kết quả tiết kiệm. Cuối WordBoundary mới handoff sang profile/outro hiện có. | Không thêm câu CTA mới. Không để payoff và profile đè nhau. Dwell có nội dung, không kéo dài bằng frame trống. |

Đây là 10 beat review, không áp đặt 10 audio slices hoặc 10 template resets. Các beat 3–6 phải cùng một chuỗi retained-state; việc split technical scenes không được làm mất continuity.

## Visible-copy inventory / provenance

Caption: toàn bộ approved narration, uppercase, chỉ từ đang đọc gold rồi về off-white. Hero-carries-caption chỉ được dùng sau khi kiểm tra exact full-span coverage.

| Main-canvas copy dự kiến | Role | Exact source span / phép trình bày |
| --- | --- | --- |
| YOU CAN GET A RAISE | HERO | “you can get a raise” |
| STILL FEEL BROKE | HERO | “still feel broke” |
| 6 MONTHS | DATA_LABEL | “six months”; numeral normalization, không thêm ngày |
| LIFESTYLE CREEP | SECTION_MARKER | “lifestyle creep” |
| A SLIGHTLY NICER APARTMENT | DATA_LABEL | “a slightly nicer apartment” |
| $200 / MONTH + MORE | DATA_LABEL | “two hundred dollars more a month”; numeral/unit formatting, MORE bắt buộc đứng cùng metric |
| A USED CAR / A NEW LEASE | DATA_LABEL | “a used car” / “a new lease” |
| THE APPETIZER / DESSERT | DATA_LABEL | “the appetizer” / “dessert”; quan hệ AND do hai vật thể cùng tồn tại |
| YOUR SPENDING / YOUR INCOME | DATA_LABEL | “your spending” / “your income” |
| THE FIX ISN'T DEPRIVING YOURSELF | HERO | “The fix isn't depriving yourself” |
| BECAUSE I ACTUALLY WANTED THIS / BECAUSE I COULD | STRUCTURAL_LABEL | Hai exact spans tương ứng; không thêm dấu kết luận |
| THAT ONE QUESTION | HERO / outro carry | “That one question” |

Brand/profile: chỉ tái sử dụng cấu hình đã duyệt, không phát sinh wording mới. Trước implementation phải inventory chính xác các chuỗi của config vào gate B; tài liệu này không tự cấp approval cho config mới.

## Phần kỹ thuật cần làm sau khi duyệt

- Lịch lật trang và SVG món khai vị/tráng miệng riêng là đề xuất mở rộng artwork/motion có scope, CHƯA được implement. Reuse HTML/SVG/GSAP; không engine mới, thư viện chart mới hay stock/AIGC pipeline.
- Bố cục căn hộ/xe/món ăn phải là object-led, không chỉ phóng lớn icon bên trong các card cũ. Cần kiểm tra khả năng renderer hiện có trước khi chọn field/primitive; không truyền schema fields chưa hỗ trợ.
- Dải spending/income phải có metadata định tính và validation không ngụ ý số liệu. Nếu primitive hiện tại bắt buộc numerical data, dùng node/path schematic hợp lệ; không bịa datum để vượt schema.
- Nhãn MORE bổ sung ngữ nghĩa còn thiếu trong price treatment hiện tại, lấy đúng source, không đổi voice. `number_highlights.json` vẫn là authority cho 6 MONTHS và $200 / MONTH, timing từ transcript.
- Layout dùng shared safe frame x70–1010/y240–1340, hero gap28px, entity gap24px, neighbor gap18px, copy tối thiểu40px. Dành lane caption riêng. QA phải đo cả đường di chuyển và loaded-font ink, không chỉ endpoint.
- Giữ navy/off-white/gold: #071426, #0D2038, #132B47, #F5F1E8, #C9C2B5, #D7A928, #F2C14E. Global180ms crossfade và dominant foreground handoff hiện có không đổi.

## Tiêu chí duyệt storyboard và QA tiếp theo

1. Tắt tiếng vẫn nhận ra: thời gian trôi → các lựa chọn tích lũy → spending chạy theo income → câu hỏi tự kiểm tra.
2. Căn hộ, xe, bữa ăn có silhouette/composition khác nhau; không phải ba hàng card đổi icon.
3. “Stack them up” dùng lại vật thể đã thấy, không thay bằng chữ mới trên nền trống.
4. Mỗi motion có phrase anchor và ý nghĩa; không idle float/shimmer/pulse để giả chuyển động.
5. Không số liệu mới, không card narration thừa, không connector lạc hoặc icon đè nhãn.

Sau khi storyboard được duyệt mới chuyển thành plan/schema và isolated benchmark mới. Khi đó chạy source/transcript/highlight checks, full relevant tests và A–J; kiểm tra real-GSAP temporal geometry, MP4 cả timeline, dense frames ở lịch/thu cụm/dải so sánh/heart-wallet/outro, hash bảo vệ và human review. H PASS không tự chứng minh video hấp dẫn.

## Kết quả lượt này

Đã đọc required context và toàn bộ Day 2; lập semantic plan, copy inventory và ràng buộc numeric. Không chỉnh source hoặc output. Render, A–J runtime, tests, measured duration, MP4 QA và protected hash comparison: NOT APPLICABLE cho lượt documentation-only này, không kế thừa PASS của video cũ cho storyboard mới. Chưa xác nhận visual approval; chờ duyệt kế hoạch.
