# SCENE V3 TIMING AUDIT

Phạm vi: chỉ Step 4 — khôi phục subtitle timing và audit scene structure. Voice-over v3, input canonical-derived, PHẦN 2, Style Bible và media đều không bị sửa.

## 1. Subtitle environment result

- **PASS:** `SubtitleGenerator` chạy lại được chỉ bằng process PATH trỏ tới `venv/bin`.
- Cách chạy: `PATH="$PWD/venv/bin:$PATH" venv/bin/python scratch_step4.py`.
- Whisper tìm thấy static binary `venv/bin/ffmpeg`; không cài/download ffmpeg mới, không sửa system PATH, không sửa core code.
- SRT đã được sinh cho đủ Day 1–7 tại `output/v3_timing/day1..day7/subtitles.srt`.
- Day 1 dùng audio đã khóa tại `output/v2_duration_test/day1/voice.mp3`; Day 2–7 dùng audio tại `output/v3_duration_test/dayN/voice.mp3`.

## 2. Audio/SRT timing table

| Day | Audio duration | Subtitle generated | SRT final end | Sync delta |
|---|---:|:---:|---:|---:|
| Day 1 | 62.16s | YES | 61.08s | -1.08s |
| Day 2 | 66.26s | YES | 65.34s | -0.92s |
| Day 3 | 66.77s | YES | 65.70s | -1.07s |
| Day 4 | 68.81s | YES | 67.80s | -1.01s |
| Day 5 | 64.63s | YES | 63.58s | -1.05s |
| Day 6 | 66.19s | YES | 65.08s | -1.11s |
| Day 7 | 67.97s | YES | 66.94s | -1.03s |

Delta âm khoảng 0.9–1.1 giây là khoảng lặng cuối audio. Timing đủ tốt cho scene audit. Nội dung Whisper có vài lỗi nhận dạng số/từ, nhưng timestamp và semantic boundary vẫn rõ; đây không phải subtitle copy/styling audit.

## 3. Current scene timing map Day 1–7

Các mốc dưới đây lấy từ SRT thật và được đặt tại semantic boundary gần nhất. Khoảng trống ngắn giữa các câu là pause tự nhiên trong audio, không phải thiếu nội dung.

| Day | Current Scene | VO start | VO end | Approx duration | Content covered | Current visual | Assessment |
|---|---|---:|---:|---:|---|---|---|
| 1 | Scene 1 | 0.00s | 5.44s | 5.44s | “Not bad with money”; ba thói quen chạy ngầm | Ví tiền rò rỉ coins | OK |
| 1 | Scene 2 | 6.66s | 19.02s | 12.36s | Subscription creep và năm app bị quên | Price tags/app icons tăng dần | TOO LONG |
| 1 | Scene 3 | 20.24s | 33.24s | 13.00s | Convenience spending; $10 x bốn tối so với grocery | Delivery bags chồng lên nhau | TOO LONG |
| 1 | Scene 4 | 34.26s | 47.52s | 13.26s | Rounding down; $18 thành “twenty”; gần $300/tháng | 18 morph thành 20 và counter | TOO LONG |
| 1 | Scene 5 | 48.56s | 61.08s | 12.52s | Không careless; naming một habit để bắt đầu thay đổi | Lightbulb CTA | TOO LONG |
| 2 | Scene 1 | 0.00s | 8.34s | 8.34s | Có raise nhưng vẫn broke; định nghĩa lifestyle creep | Hai paycheck | OK |
| 2 | Scene 2 | 9.20s | 36.04s | 26.84s | Apartment, car lease, appetizer/dessert; spending bắt kịp income | House/car/delivery morph | NEEDS SPLIT |
| 2 | Scene 3 | 36.92s | 59.92s | 23.00s | Promotion tạo baseline đắt hơn; saving không đổi; câu hỏi “wanted vs money available” | Speech bubble/question mark | CONTENT MISMATCH |
| 2 | Scene 4 | 60.68s | 65.34s | 4.66s | Một câu hỏi bắt leak tốt hơn budgeting app | Magnifier quét bar chart | OK |
| 3 | Scene 1 | 0.00s | 10.18s | 10.18s | “Girl math” examples; funny nhưng quietly expensive | Speech bubble + counter | TOO LONG |
| 3 | Scene 2 | 11.22s | 48.76s | 37.54s | Cognitive rounding, coffee/case, write-off, $20 swipes, joke thành buying system | Price tags thành pile + total | NEEDS SPLIT |
| 3 | Scene 3 | 49.70s | 59.22s | 9.52s | Ghi lại mọi purchase “doesn't count” trong một tuần | Notebook/checkmarks | OK |
| 3 | Scene 4 | 60.14s | 65.70s | 5.56s | Bất ngờ vì tổng các món “free” đến Chủ nhật | Gold number count-up | OK |
| 4 | Scene 1 | 0.00s | 4.66s | 4.66s | Emotional spending là wiring, không phải willpower | Brain, stress cloud, shopping bag | OK |
| 4 | Scene 2 | 5.44s | 19.32s | 13.88s | Stress/bored/exhausted; relief khoảng 10 phút; order/coffee examples | Clock countdown | NEEDS PROMPT UPDATE |
| 4 | Scene 3 | 20.26s | 61.80s | 41.54s | Biology; mood premium; package/bill guilt cycle; hỏi cảm xúc; urge tự qua | Cart dừng + question mark | NEEDS SPLIT |
| 4 | Scene 4 | 62.66s | 67.80s | 5.14s | Không cần discipline; cần câu hỏi trước checkout | Checkout button | OK |
| 5 | Scene 1 | 0.00s | 7.64s | 7.64s | Đoán số subscription rồi kiểm tra statement | Grid app icons + counter | OK |
| 5 | Scene 2 | 8.60s | 21.20s | 12.60s | Guess 3–4 so với actual 8–12; các subscription bị quên | Guess 4 vs actual 11 | TOO LONG |
| 5 | Scene 3 | 22.34s | 58.50s | 36.16s | Forgettable-by-design; permanent income; friction/cancel delay; monthly review habit | Calendar + checkmark | NEEDS SPLIT |
| 5 | Scene 4 | 59.08s | 63.58s | 4.50s | Không cần cực đoan; chỉ cần thực sự nhìn | Statement + magnifier | OK |
| 6 | Scene 1 | 0.00s | 6.70s | 6.70s | Saving khó không phải math mà là scarcity mindset | Piggy bank, coins bật ra | OK |
| 6 | Scene 2 | 7.60s | 44.86s | 37.26s | Ký ức thiếu tiền; saving thấy unsafe; “spend less” sai tầng; checking vs savings; loss framing | Shield chặn coin | NEEDS SPLIT |
| 6 | Scene 3 | 45.74s | 59.20s | 13.46s | Bắt đầu $5/tuần; mục tiêu là dạy não saving không phải mất tiền | $5 coin vào piggy bank | TOO LONG |
| 6 | Scene 4 | 59.84s | 65.08s | 5.24s | Khi thấy an toàn thì tăng amount; safety trước | Piggy bank đầy dần | OK |
| 7 | Scene 1 | 0.00s | 43.38s | 43.38s | Recap năm habit; điểm chung là không noticing; attention/awareness là budget | Montage năm icon | NEEDS SPLIT |
| 7 | Scene 2 | 44.28s | 60.98s | 16.70s | Chọn một habit/một câu hỏi; không cần overhaul | Số 1–5, chọn một | TOO LONG |
| 7 | Scene 3 | 61.62s | 66.94s | 5.32s | Hỏi bắt đầu với habit nào; comment và follow-up | Reply bubble | OK |

### Visual-load conclusion

- Day 1 giữ đúng năm semantic section nhưng bốn scene 2–5 dài 12–13 giây, vượt xa clip prompt 4–6 giây; chỉ cần tách CTA/action, không cần phá nhỏ cả ba habit.
- Day 2–6 mỗi ngày có ít nhất một scene đang gánh 27–42 giây và nhiều semantic changes. Đây là lỗi cấu trúc, không thể giải quyết sạch bằng loop.
- Day 7 scene montage đang gánh 43 giây gồm recap, thesis, spreadsheet, attention và awareness; visual v1 không phản ánh phần giải thích mới của v3.
- Hook/CTA ngắn nhìn chung vẫn đúng. Nút thắt nằm ở body mở rộng của v3.

## 4. Current prompt-duration gap

| Day | Voice duration | Prompt v1 total | Gap (voice - prompt) | Prompt/scene thiếu footage nếu giữ nguyên |
|---|---:|---:|---:|---|
| Day 1 | 62.16s | 24s | 38.16s | Scene 2 (6s), 3 (5s), 4 (5s), 5 (4s) |
| Day 2 | 66.26s | 23s | 43.26s | Scene 1 (5s), 2 (8s), 3 (5s); Scene 4 gần đủ |
| Day 3 | 66.77s | 21s | 45.77s | Scene 1 (5s), 2 (7s), 3 (5s), 4 (4s) |
| Day 4 | 68.81s | 20s | 48.81s | Scene 2 (5s), 3 (5s), 4 (4s); Scene 1 gần đủ |
| Day 5 | 64.63s | 21s | 43.63s | Scene 1 (6s), 2 (5s), 3 (5s); Scene 4 gần đủ |
| Day 6 | 66.19s | 21s | 45.19s | Scene 1 (5s), 2 (6s), 3 (5s), 4 (5s) |
| Day 7 | 67.97s | 18s | 49.97s | Scene 1 (8s), 2 (5s); Scene 3 gần đủ |

“Gần đủ” chỉ nói về raw duration; khi tạo clip thật vẫn cần đủ tail/transition. Không đề xuất slow motion, freeze frame, loop vô hạn hay kéo tốc độ clip để lấp gap.

## 5. Proposed scene count Day 1–7

| Day | Voice duration | Current scenes | Avg sec/current scene | Current prompt seconds | Proposed scenes | Main reason |
|---|---:|---:|---:|---:|---:|---|
| Day 1 | 62.16s | 5 | 12.43s | 24s | 6 | Ba habit map tốt; tách reflection khỏi action/CTA |
| Day 2 | 66.26s | 4 | 16.57s | 23s | 7 | Tách examples, stacking effect, promotion baseline và question |
| Day 3 | 66.77s | 4 | 16.69s | 21s | 7 | Scene 2 hiện gánh toàn bộ cơ chế và hậu quả |
| Day 4 | 68.81s | 4 | 17.20s | 20s | 7 | Tách relief, mood premium, guilt cycle và intervention |
| Day 5 | 64.63s | 4 | 16.16s | 21s | 7 | Tách actual count, business model, friction và monthly review |
| Day 6 | 66.19s | 4 | 16.55s | 21s | 7 | Tách origin, unsafe feeling, bad advice và checking-vs-savings |
| Day 7 | 67.97s | 3 | 22.66s | 18s | 6 | Montage 43 giây cần tách recap, common thread và awareness thesis |

**Tổng hiện tại: 28 scenes. Tổng đề xuất: 47 scenes.** Đây là proposal, chưa được implement.

### Day 1 — Current 5, proposed 6

| Scene | VO section / timing | Purpose | Reuse existing prompt | New/updated visual concept |
|---|---|---|:---:|---|
| 1 | 0.00–5.44s | Hook: vấn đề là ba habit chạy ngầm | YES | Ví tiền rò rỉ; cần clip/tail phủ đủ hook |
| 2 | 6.66–19.02s | Subscription creep | YES | Price tags/app icons tích lũy |
| 3 | 20.24–33.24s | Convenience spending | YES | Delivery bags + coins draining |
| 4 | 34.26–47.52s | Rounding down và monthly total | YES | 18→20 rồi counter lên monthly total |
| 5 | 48.56–52.92s | Reframe: không careless, chỉ chạy nền | NO | Ba icon habit mờ chạy phía sau một người/outline trung tâm |
| 6 | 53.70–61.08s | Action: gọi tên một habit | UPDATE | Reuse lightbulb, thêm một trong ba icon được highlight/labeled |

### Day 2 — Current 4, proposed 7

| Scene | VO section / timing | Purpose | Reuse existing prompt | New/updated visual concept |
|---|---|---|:---:|---|
| 1 | 0.00–8.34s | Raise nhưng vẫn broke; name lifestyle creep | YES | Hai paycheck timeline |
| 2 | 9.20–25.72s | Apartment, car, food examples | UPDATE | Reuse morph sequence nhưng kéo đủ ba examples |
| 3 | 26.68–36.04s | Những lựa chọn nhỏ stack; spending theo income | NO | Các expense bars xếp chồng và đuổi kịp income bar |
| 4 | 36.92–45.02s | Promotion thành baseline đắt hơn | NO | Pay raise nâng floor/baseline thay vì tạo khoảng trống |
| 5 | 46.16–49.82s | Income +20%, savings đứng yên | NO | Hai bars: income tăng, savings flat |
| 6 | 50.70–59.92s | Fix không phải deprivation; wanted vs available money | UPDATE | Reuse speech bubble, hiển thị hai nhánh lựa chọn |
| 7 | 60.68–65.34s | Honest question catches leaks | YES | Magnifier quét bar chart/leaks |

### Day 3 — Current 4, proposed 7

| Scene | VO section / timing | Purpose | Reuse existing prompt | New/updated visual concept |
|---|---|---|:---:|---|
| 1 | 0.00–10.18s | “Girl math” hook; funny nhưng expensive | YES | Speech bubble + ticking counter |
| 2 | 11.22–19.74s | Universal cognitive rounding mechanism | NO | Small prices visually round toward zero/nothing |
| 3 | 20.70–33.96s | Coffee/case examples và mental write-off | UPDATE | Reuse price tags/pile, show two concrete items |
| 4 | 34.58–41.86s | Invisible $20 swipes thành $300–400 | NO | Repeated card swipes drain account meter |
| 5 | 42.68–48.76s | Joke biến thành decision system | NO | Joke bubble morphs into checkout decision flow |
| 6 | 49.70–59.22s | One-week tracking exercise | YES | Notebook/checkmarks |
| 7 | 60.14–65.70s | Sunday total reveal | YES | Gold total count-up |

### Day 4 — Current 4, proposed 7

| Scene | VO section / timing | Purpose | Reuse existing prompt | New/updated visual concept |
|---|---|---|:---:|---|
| 1 | 0.00–4.66s | Wiring, không phải willpower | YES | Brain→stress→shopping bag |
| 2 | 5.44–19.32s | Trigger và 10-minute relief examples | UPDATE | Reuse clock; thêm order/coffee trigger states |
| 3 | 20.26–31.40s | Biology; relief ngắn, bill dài; mood premium | NO | Relief meter rơi nhanh trong khi bill còn lại |
| 4 | 32.22–44.10s | Package arrival tạo stress/guilt cycle | NO | Package→bill→stress loop hữu hạn |
| 5 | 45.00–52.62s | Intervention question trước checkout | UPDATE | Reuse paused cart + “what am I feeling?” |
| 6 | 53.28–61.80s | Naming tired/bored/anxious làm urge qua | NO | Ba emotion labels xuất hiện, urge meter giảm |
| 7 | 62.66–67.80s | Honest-question CTA | YES | Checkout button glow rồi dừng/fade |

### Day 5 — Current 4, proposed 7

| Scene | VO section / timing | Purpose | Reuse existing prompt | New/updated visual concept |
|---|---|---|:---:|---|
| 1 | 0.00–7.64s | Guess rồi kiểm tra statement | YES | App grid + counter |
| 2 | 8.60–21.20s | Guess 3–4 vs actual 8–12 và examples | UPDATE | Reuse comparison, reveal cloud/trial/fitness icons |
| 3 | 22.34–27.18s | Forgettable by design/business model | NO | Subscription tiles fade from attention while charges persist |
| 4 | 27.80–35.42s | Charge thành permanent income; “bank on friction” | NO | Recurring arrow từ account sang company |
| 5 | 36.16–48.12s | Cancel friction và thêm một tháng phí | NO | Cancel path/maze, calendar lật thêm tháng |
| 6 | 48.92–58.50s | Monthly statement review, 10 seconds mỗi charge | UPDATE | Reuse calendar + checkmark, add statement scan |
| 7 | 59.08–63.58s | Không extreme; chỉ cần nhìn | YES | Statement + magnifier |

### Day 6 — Current 4, proposed 7

| Scene | VO section / timing | Purpose | Reuse existing prompt | New/updated visual concept |
|---|---|---|:---:|---|
| 1 | 0.00–6.70s | Scarcity mindset hook | YES | Coins bật khỏi piggy bank |
| 2 | 7.60–20.68s | Ký ức thiếu tiền khiến saving thấy unsafe | UPDATE | Reuse shield; timeline từ past stress tới present dollar |
| 3 | 21.66–33.30s | Vì sao “just spend less” không xử lý fear | NO | Advice card trượt qua, fear layer vẫn còn |
| 4 | 34.16–44.86s | Checking là survival; savings thấy như mất | NO | Split checking/savings, coin transfer cảm giác biến mất |
| 5 | 45.74–52.36s | Bắt đầu rất nhỏ: $5/tuần | YES | $5 coin vào piggy bank |
| 6 | 53.22–59.20s | Mục tiêu là retrain safety, không phải amount | NO | Safety/shield chuyển từ chặn sang bao quanh savings |
| 7 | 59.84–65.08s | Tăng dần sau khi thấy an toàn | YES | Piggy bank/progress bar đầy dần |

### Day 7 — Current 3, proposed 6

| Scene | VO section / timing | Purpose | Reuse existing prompt | New/updated visual concept |
|---|---|---|:---:|---|
| 1 | 0.00–7.50s | Recap năm habits | YES | Montage icon tuần |
| 2 | 8.54–16.56s | Điểm chung: không bad with money, chỉ không noticing | NO | Năm icon cùng đi vào vùng spotlight/awareness |
| 3 | 17.56–29.84s | Không cần spreadsheet; một honest question; đừng overcomplicate | NO | Spreadsheet co lại, một question card nổi bật |
| 4 | 30.70–43.38s | Attention mastery; awareness là ultimate budget | NO | Attention spotlight phân bổ energy có chủ đích |
| 5 | 44.28–60.98s | Chọn đúng một habit; không overhaul | UPDATE | Reuse số 1–5, chọn/circle một số |
| 6 | 61.62–66.94s | Comment + next-week follow-up | YES | Reply bubble/arrow |

## 6. Prompts reusable unchanged

Giữ nguyên **concept và nội dung prompt**; khi implement vẫn phải bảo đảm generated footage/tail phủ timing thật:

- Day 1: current Scene 1, 2, 3, 4.
- Day 2: current Scene 1, 4.
- Day 3: current Scene 1, 3, 4.
- Day 4: current Scene 1, 4.
- Day 5: current Scene 1, 4.
- Day 6: current Scene 1, 3, 4.
- Day 7: current Scene 1, 3.

Tổng: **18 prompt concepts reusable unchanged**. “Unchanged” không có nghĩa clip 4–8 giây hiện tại tự đủ phủ audio; duration production sẽ được chốt ở bước implement sau khi user duyệt proposal.

## 7. Prompts requiring update

- Day 1 current Scene 5: lightbulb vẫn hợp CTA nhưng cần biểu đạt “name one habit”.
- Day 2 current Scene 2: morph sequence cần ba ví dụ rõ; current Scene 3 cần đổi từ question mark chung sang lựa chọn “wanted vs money available”.
- Day 3 current Scene 2: giữ price-tag accumulation nhưng scope hẹp lại cho coffee/case examples.
- Day 4 current Scene 2: clock cần gắn với stress/order/coffee; current Scene 3 chỉ nên gánh intervention question.
- Day 5 current Scene 2: comparison cần reveal examples; current Scene 3 chuyển thành monthly review/statement scan.
- Day 6 current Scene 2: shield prompt chỉ giữ phần past scarcity/unsafe; không gánh checking-vs-savings.
- Day 7 current Scene 2: giữ chọn 1–5 nhưng phủ cả “one habit, not all five, no overhaul”.

## 8. New prompts required

Proposal cần **19 prompt concepts mới**:

- Day 1: 1 — background habits/reframe.
- Day 2: 3 — expense stacking, expensive baseline, income-vs-savings.
- Day 3: 3 — cognitive rounding, invisible swipes/account drain, joke-to-decision-system.
- Day 4: 3 — mood premium, guilt cycle, emotion labels/urge reduction.
- Day 5: 3 — forgettable-by-design, recurring company income, cancel friction.
- Day 6: 3 — ineffective advice/fear, checking-vs-savings loss framing, safety retraining.
- Day 7: 3 — common thread, honest-question simplification, awareness/attention thesis.

Không cần thay Style Bible. Không có evidence cần sửa voice-over v3; voice v3 tiếp tục **LOCKED**. Không tạo v4, không generate media, không dùng CapCut/Seedance và không tiêu credit trong Step 4.
