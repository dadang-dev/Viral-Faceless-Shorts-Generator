# Day 3 production canary — MASTER TEMPLATE v1.1

Ngày: 2026-09-08. Đã render CHỈ Day 3 và review frame-level. Day 4–7 không chạy. Đây là canary chờ user duyệt, không tự gắn APPROVED.

## A. Validation H integration

Canonical path: npm run pipeline → src/cli.ts → src/pipeline.ts::runPipeline. Batch caller cũng đi qua runPipeline. Pipeline này hiện đã khóa cho Money Habits; không thay đổi unrelated Python/news workflows.

Sau exact-script/copy/theme validation và Edge WordBoundary/transcript/number/scene validation, production pipeline tự đọc required visual-plan.json và canonical output/visual-history.json, tính lại H. Không tin report H cũ hoặc bắt user phải nhớ chạy CLI H.

H được persist trong validation-report.json.gates.H_VISUAL_VARIETY cùng productionDecision trước composeHtml/renderWithHyperframes:
- PASS → allowed nếu A–G đạt.
- WARNING → allowed nếu A–G đạt, warnings lưu đầy đủ.
- FAIL → persist blocker rồi throw PRODUCTION_BLOCKED trước renderer.
- Thiếu/hỏng plan/history hoặc sai Day → H FAIL, không silently reset/skip.
- A–G không nới lỏng; E N/A vẫn chỉ dành cho Day không có approved metric. G PENDING/FAIL vẫn chặn production.
- VALIDATE_ONLY vẫn tạo transcript/report rồi dừng không render; H FAIL vẫn trả lỗi. H WARNING không bị nâng thành blocker.

Files integration/shared:
- [pipeline.ts](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/src/pipeline.ts>)
- [production-validation.ts](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/src/contracts/production-validation.ts>)
- [visual-variety.ts](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/src/planning/visual-variety.ts>) — chỉ thêm các score component vào report, không đổi trọng số/threshold v1.1.
- [production-validation.test.ts](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/src/contracts/production-validation.test.ts>)
- [pipeline-production.test.ts](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/src/pipeline-production.test.ts>)
- [SKILL.md](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/.agents/skills/create-money-video/SKILL.md>) — workflow phản ánh production enforcement.
- [qa-money-video.py](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/scripts/qa-money-video.py>) — trích ảnh/scan QA, không sửa MP4.

Skill create-money-video dùng để giữ v1/v1.1 contracts và QA; skill-creator dùng cho cập nhật/validate rules chung.

## B. Tests

- TypeScript project typecheck: PASS, 0 errors.
- Full Vitest: 114 PASS / 0 FAIL, 17 test files. Có 20 test cases mới cho production H/decision path: 15 contract/decision cases + 5 runPipeline cases.
- Full Python unittest: 17 PASS / 0 FAIL.
- Tổng: 131 PASS / 0 FAIL.
- Skill quick_validate (UTF-8): PASS. QA utility py_compile và execution: PASS.
- Full suite đã chạy trước canary; Vitest chạy lại sau render/history update vẫn 114/114.
- Integration tests giữ source/copy/theme/scene/number validation thật; mock media I/O để kiểm chứng H PASS/WARNING chạm render boundary, H FAIL/G PENDING không gọi renderer. Test riêng chạy H thật với persisted plan/history/transcript fixtures.

## C. Exact approved Day 3 voiceText

Nguồn: [money-habits-script-v2-optimized.md](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/money-habits-script-v2-optimized.md>). Không rewrite, không chuyển sang v4. Equality qua normalization hợp đồng: PASS.

> You've probably heard 'girl math' — if I paid in cash it's free, if it's under twenty dollars it doesn't count. It's funny. It's also quietly expensive. The joke works because it's true for almost everyone, not just one group. Our brains are wired to round small numbers down to basically nothing. A seven-dollar iced coffee doesn't feel like spending. A twelve-dollar phone case 'doesn't count' because it was an accident purchase. The problem isn't the joke. It's when the joke becomes the actual system you use to decide what to buy. Try this instead: for one week, write down every 'it doesn't really count' purchase in one place. Not to guilt yourself — just to see the real number. Most people are shocked not by one purchase, but by what all the 'free' ones add up to by Sunday.

## D. Archetype decision

Primary: concept-story. Secondary: stat-reveal.

Đã đọc lại full source: câu đùa → cơ chế coi nhẹ khoản nhỏ → hai ví dụ → joke thành decision system → ghi nhận purchases một tuần → nhìn thấy hệ quả. $7 coffee và $12 phone case hỗ trợ cùng một cơ chế, không phải A-vs-B. Lựa chọn giống dry-run vì semantic evidence vẫn phù hợp, không hard-code để test PASS.

Variation thực tế: 3 full-frame typography scenes (hook primitive được reuse ở body/reframe), 2 stat reveals liền nhau giữa video, 2 feature-list + 2 callout, 1 outro; không comparison cards. Ten beats gộp các câu cùng ý, không thêm scene vô nghĩa.

## E. Scene plan

Time dưới đây là narration start/end từ transcript (giây). Incoming visual bắt đầu sớm hơn narration 0.180s cho crossfade, trừ scene 1. Outro có hold theo baseline; không dùng các time này làm hard-coded input.

| # | Time | Exact source span | Template | Visual purpose |
| --- | --- | --- | --- | --- |
| 1 | 0.000–1.744 | You've probably heard 'girl math' — | hook | Mở bằng câu nói quen thuộc; typography gọn, brand nhận ra ngay |
| 2 | 1.944–6.840 | if I paid in cash it's free, if it's under twenty dollars it doesn't count. | feature-list | Hai lời tự biện hộ cùng một cơ chế, dùng list chứ không VS |
| 3 | 7.040–16.141 | It's funny. It's also quietly expensive. The joke works because it's true for almost everyone, not just one group. | hook | Gộp joke/universality thành một beat; typography toàn khung |
| 4 | 16.341–21.655 | Our brains are wired to round small numbers down to basically nothing. | callout | Giải thích cơ chế round-down trước ví dụ |
| 5 | 21.855–25.524 | A seven-dollar iced coffee doesn't feel like spending. | stat-hero | Ví dụ thứ nhất; riêng $7, timing theo WordBoundary |
| 6 | 25.724–30.831 | A twelve-dollar phone case 'doesn't count' because it was an accident purchase. | stat-hero | Ví dụ thứ hai; riêng $12 nối tiếp, không đối đầu |
| 7 | 31.031–38.567 | The problem isn't the joke. It's when the joke becomes the actual system you use to decide what to buy. | hook | Reframe: từ joke thành decision system; quay lại typography |
| 8 | 38.767–46.227 | Try this instead: for one week, write down every 'it doesn't really count' purchase in one place. | feature-list | Hành động một tuần; progressive list nguyên văn |
| 9 | 46.427–50.069 | Not to guilt yourself — just to see the real number. | callout | Reframe không phán xét; card ngắn và tách CTA |
| 10 | 50.269–57.137 | Most people are shocked not by one purchase, but by what all the 'free' ones add up to by Sunday. | outro | Kết bằng cumulative observation; profile CTA sau lời cuối |

Visible strings + source mapping đầy đủ trong [validation-report.json](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/output/day-3/validation-report.json>) → B_NO_UNAPPROVED_COPY.visibleText (27 entries).

## F. Number highlights

Config: [number_highlights.json](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/output/day-3/number_highlights.json>).

```json
{
  "version": "1.0",
  "day": 3,
  "source": "money-habits-script-v2-optimized.md",
  "items": [
    {
      "id": "iced-coffee-7",
      "spokenPhrase": "seven-dollar",
      "canonicalText": "seven-dollar iced coffee",
      "displayText": "$7",
      "context": "iced coffee",
      "template": "stat-hero",
      "sceneId": "scene-5",
      "target": "stat.value"
    },
    {
      "id": "phone-case-12",
      "spokenPhrase": "twelve-dollar",
      "canonicalText": "twelve-dollar phone case",
      "displayText": "$12",
      "context": "phone case",
      "template": "stat-hero",
      "sceneId": "scene-6",
      "target": "stat.value"
    }
  ]
}
```

| Metric | Scene | Local phrase window (s) | Global phrase window (s) | Timing source |
| --- | --- | --- | --- | --- |
| $7 | scene-5 | 0.187–0.984 | 22.042–22.839 | transcript.json |
| $12 | scene-6 | 0.203–0.921 | 25.927–26.645 | transcript.json |

Metric scale bump bắt đầu từ phrase onset, theo shared animation scale 1→1.1→1; không tự kéo toàn phrase thành một zoom dài hoặc hard-code time. WordBoundary cues được tạo bởi Edge TTS, không Whisper. Hai scene đầu reuse cache đúng hash text/voice/speed; tám scene còn lại synthesize lại theo plan mới.

## G. Validation A–H

| Gate | Status | Evidence |
| --- | --- | --- |
| A SCRIPT_INTEGRITY | PASS | concatenated voiceText == approved v2 sau normalization |
| B NO_UNAPPROVED_COPY | PASS | 27 visible strings trace approved/config/platform UI |
| C THEME | PASS (CSS/HTML token contract) | Navy/off-white/gold, không cyan/purple dark-neon token; xem asset note bên dưới |
| D TRANSCRIPT | PASS | Edge TTS en-US-AndrewMultilingualNeural, speed 0.8, WordBoundary, 138 cues |
| E NUMBER_HIGHLIGHTS | PASS | 2/2 resolve từ transcript |
| F TEMPLATE_SCENE | PASS | ScriptSchema hợp lệ, 10 scene, positive timing, không illegal overlap |
| G TESTS | PASS | 114 Vitest + 17 Python; typecheck PASS |
| H VISUAL_VARIETY | WARNING → ALLOWED | So với Day 2 và Day 1; retained vertical layout warning |

H detailed components (0–1; không phải percentages confidence):

| Compare | Total | Template sequence | Scene count | Primary | Layout | Stat placement | Icon composition | Timing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Day 2 | 0.686 | 0.545 | 0.909 | 1 | 1 | 0.000 | 0 | N/A (khác số scene) |
| Day 1 | 0.523 | 0.533 | 0.667 | 0 | 1 | 0.667 | 0 | N/A (khác số scene) |

Score giữ nguyên 0.45×template + 0.10×scene count + 0.20×primary + 0.15×layout + 0.10×stat placement. Icon composition là metadata signature, không pixel similarity. Day 3 vẫn reuse stat motif dù whole-signature icon score bằng 0; không claim mọi icon mới.

Warning: VISUAL_REPETITION_WARNING: layout direction repeats a recent high-similarity Day.
Không sequence/stat-placement warning, không repeated-card-run warning. Max consecutive cards Day 3 = 2; Day 1 = 5; Day 2 = 6. Stats Day 3 ở 5/6, Day 1 ở 7/11, Day 2 ở 4. H WARNING được review và giữ nguyên; không đổi nhãn vertical để né threshold.

Report productionDecision.allowed = true. A–G vẫn bắt buộc. H FAIL case đã được chứng minh chặn render trong tests.

## H. Render

- [video.mp4](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/output/day-3/video.mp4>)
- Container duration: 59.400s.
- Video stream: 59.366667s, 1781 frames; 1080×1920, 9:16, 30fps.
- Codecs: H.264 High / AAC LC; yuv420p, BT.709.
- 10 scenes. Voice track: 57.137s.
- Duration status: SHORT_APPROVED_NARRATION, padded=false. Video chưa vượt 60s; không sửa script/speed/hold để ép đủ.
- Bản Day 3 trước canary được giữ ở [backup Day 3](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/output/archive/day-3-pre-v11-20260908/video.mp4>).
- Renderer changes: NONE. Không re-render Day 1/2/4–7.

## I. QA artifacts và kết quả

[Overall contact sheet](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/output/day-3/qa-v11/overall-contact.png>) — 10 representative frames.
[Hook 0–0.60s](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/output/day-3/qa-v11/hook-contact.png>) — 19 samples, interval 1/30s.
[Boundaries 1–3](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/output/day-3/qa-v11/boundaries-1-contact.png>), [Boundaries 4–6](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/output/day-3/qa-v11/boundaries-2-contact.png>), [Boundaries 7–9](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/output/day-3/qa-v11/boundaries-3-contact.png>) — toàn bộ 9 visual boundaries ±300ms, interval100ms, 63 samples.
[Outro phần 1](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/output/day-3/qa-v11/outro-1-contact.png>), [Outro phần 2](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/output/day-3/qa-v11/outro-2-contact.png>) — last WordBoundary−300ms tới +2s, 24 samples.
[$7 metric](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/output/day-3/qa-v11/iced-coffee-7-contact.png>), [$12 metric](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/output/day-3/qa-v11/phone-case-12-contact.png>) — 18 samples bao gồm onset, peak scale, return, full state và exit.
[QA manifest + full-resolution frames](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/output/day-3/qa-v11/qa-manifest.json>).
[ffprobe metadata](<C:/Users/PC/OneDrive/Desktop/VIBECODE/P1 MoneyHabit/output/day-3/qa-v11/media-probe.json>).

134 labeled review samples; mỗi sample có PNG nguyên độ phân giải nguồn. Đã xem tất cả contact sheets bằng mắt, bao gồm đối chiếu Day 1 boundary sheet và Day 2 overall sheet.

Observed:
- Không thấy clipping, subtitle collision hoặc prolonged ghosting tại các frame review.
- Crossfade có two-scene blend ngắn tại +100ms; scene trước đã biến mất khoảng +200ms. Không nhầm blend đã approved với illegal overlap.
- Hook có initial fade state trống hero ở ~0–0.033s, chữ bắt đầu hiện ~0.067s, đọc được khoảng0.133–0.167s và gần full-state0.35s. Không claim frame0 có headline đầy đủ.
- Hai stat scale lên rồi về mặc định; active subtitle word gold, từ đã đọc trở lại off-white.
- Last WordBoundary: 57.206s. Profile entrance target: 57.326s (+120ms). Frame review thấy subtitle đã hết trước profile đi lên; không collision.
- Không thấy dark-neon cyan/purple leak trong template/subtitle. Avatar raster kế thừa ở profile vẫn có nét xanh dương; chưa recolor vì brand asset đã dùng trong Day 1/2. C kiểm token không phải chứng nhận mọi pixel đều nằm trong palette.
- Coarse all-frame luma scan: không black/white full-frame hoặc abrupt luma jump vượt threshold. Đây không thay visual review vùng hero.

## J. Visual variety assessment

1. **Khác Day 1 nhìn thấy được? Có.** Day 1 đi qua numbered habits và nhiều paired example cards; Day 3 dùng psychological narrative, large thought typography và hai ví dụ stat nối tiếp.
2. **Khác Day 2 nhìn thấy được? Có, trong vocabulary master hiện có.** Day 2 card-heavy với 6 cards liên tiếp; Day 3 chỉ tối đa2, có typography ở introduction/thought/reframe và không comparison card.
3. **Content-driven, không random? Có.** Hai metric cùng một cơ chế không bị ép thành VS; reframe có emphasis riêng; one-week action dùng list. Scene count giảm do gộp ý liên quan, không nhằm game score.
4. **Money Habits nhận ra ngay? Có.** Top-left identity, navy/gold/off-white, typography family, subtitle, card styling, restrained glow và outro giữ nguyên.

Không claim hoàn toàn mới về geometry: wallet vẫn lặp3 lần và stat-card motif vẫn giống nhau. Đây là reuse có chủ đích trong phạm vi canary, không pre-build calendar/progress bar hay icon library mới.

## K. Shared code changes và preservation

Shared changes chỉ ở orchestration/validation/report/skill và test/QA utility như mục A. Không thay template HTML/CSS/GSAP, subtitle renderer, TTS client, source markdown hoặc brand assets.

Day-specific: script.json, visual-plan.json, number_highlights.json, test-results.json, generated transcript/voice/HTML/subtitles/video/report và qa-v11 artifacts. output/visual-history.json thêm canary Day 3 sau internal review; không đồng nghĩa user đã approved.

SHA-256 trước/sau xác nhận toàn bộ src/render, approved v2 source và MP4 Day 1/2 không đổi. Render regression Day 1/2: NOT REQUIRED; existing regression tests: PASS.

## L. Remaining issues

- Video 59.4s, chưa đạt mốc >60s; approved narration ở speed0.8 chỉ57.14s. Muốn vượt60s cần quyết định về approved content/timing contract, không tự sửa.
- H WARNING về vertical layout so với Day2 còn nguyên; composition đã khác nhưng coarse metadata không đo pixel geometry.
- Shared wallet motif xuất hiện3 lần; hai stats vẫn dùng generic payment-card icon, chưa có coffee/phone-case motif riêng. Không thêm primitive theo scope.
- Raster avatar ở outro có xanh dương kế thừa. CSS/HTML theme gate không scan palette ảnh; nếu yêu cầu mọi pixel navy/off-white/gold cần duyệt asset phù hợp trước.
- HyperFrames có advisory composition_file_too_large (460 lines) và Node DEP0190 warning trong shared runner; render hoàn tất. Không refactor renderer để xử lý advisory ngoài phạm vi.
- Không gọi canary APPROVED thay user. STOP sau Day3; Day4–7 chưa chạy trong lượt này.

