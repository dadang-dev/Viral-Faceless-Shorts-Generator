# MONEY HABITS — MASTER TEMPLATE v1.1 — Review

## Approved polish contract addendum — 2026-09-08

Các phần bên dưới là architecture review lịch sử. Production H hiện đã enforce trong canonical pipeline; addendum này cập nhật planning/QA, không mở architecture phase.

- Major composition >~5s nên có meaningful internal state change theo narration. Scene dài không tự FAIL. `LONG_HOLD_OK` khác `STATIC_LONG_HOLD_WARNING`; metadata heuristic cần frame-level confirmation, chỉ visual blocker có evidence mới chặn canary.
- Variety hierarchy: content-specific composition → visual state progression → spatial arrangement → icon/object arrangement → motion direction. Adjacent examples nên dùng existing alternative phù hợp, không chỉ thay con số trong same composition. Không random motion/color, decorative idle pulse hoặc tăng scene count để game H. H thresholds/weights giữ nguyên.
- Existing `visualCues` reschedule entrance theo exact spoken phrase trong transcript; missing/ambiguous phrase và unsupported target FAIL. Reuse HTML/CSS/GSAP primitives; không new template/animation engine.
- Production duration ≥60.5s, preferred ≥60.7s. Day 3 target 60.7–61.0s bằng purposeful outro dwell: last WordBoundary +120ms → profile entrance → readable hold → video end. Giữ approved narration/speed/timing; không blank extension. Gate `I_PRODUCTION_DURATION` persist planned trước render và measured video-stream duration sau render; thiếu minimum = FAIL/NEED_DURATION_FIX. A–H không nới lỏng.
- Shared brand avatar Money Habits là `assets/money-habits-avatar.svg`, navy/off-white/gold star identity. Giữ legacy asset và immutable Day 1/2 MP4; future render dùng source mới.
- Frame QA bao gồm long holds, metric entrance/internal/full/exit, mọi boundary ±300ms, hook 0–0.60s, outro tới frame cuối. Không tự gắn CANARY PASS nếu thiếu technical/duration/visual acceptance hoặc một trong bốn câu hỏi variety = NO.


Ngày kiểm tra: 2026-09-07. Phạm vi: planning/orchestration, contracts, history, skill, tests và dry-run. Không render, không tạo TTS, không đổi approved narration hoặc shared renderer. Dừng tại đây chờ duyệt v1.1.

## A. Architecture

Approved v2 voice-over → đọc toàn bộ/semantic analysis → archetype shortlist → planner ghi primary + tối đa 1 secondary khác primary và rationale → semantic scene plan dùng 6 template hiện có → exact-source/visible-copy preflight + H → quy trình A–G và HyperFrames hiện tại khi được phép render.

`visual-plan.json` là planning sidecar, không thay `script.json` runtime schema. Schema strict không nhận field seed hoặc archetype ngoài enum. Scorer chỉ nhận full approved narration và approved metric count; không nhìn template cũ, không sinh visible copy. Đây là lexical shortlist deterministic, không thay thế reasoning của planner về toàn bộ script. Rationale ngữ nghĩa của lựa chọn cuối cùng vẫn bắt buộc.

History được derive từ scene plan và optional transcript, không có nhánh hard-code Day 1/2 trong thuật toán. Archetype/layout/icon composition của output legacy được phân loại thủ công từ nội dung và template implementation; không sửa video để ép classification.

H là CLI preflight bắt buộc theo workflow skill, chưa tự động chặn mọi legacy render entrypoint. Không claim đây là một render-pipeline hook mới. A–G và tất cả runtime settings giữ nguyên.

## B. Archetypes và audit reuse

| Archetype | Trigger | Main visual grammar | Existing components reused |
| --- | --- | --- | --- |
| stat-reveal | Số liệu là điểm nhấn chính | Context → reveal → giải thích | hook, stat-hero, callout, outro; metric scale bump |
| comparison | Expected/actual, before/after, A/B thực sự | Hai ý tương phản → nhận ra khác biệt | comparison stacked cards và icon; hook/callout/outro; stat-hero khi phù hợp |
| accumulation | Nhiều khoản/lựa chọn nhỏ cộng dần | Example → repeat → stack ý → hệ quả | feature-list progressive reveal, chuỗi callout/comparison, stat-hero nếu có tổng approved |
| checklist-habits | Nhiều habits/signs/errors | Giới thiệu → từng mục → reframe | feature-list, callout, comparison cho ví dụ; không ép mọi mục cùng layout |
| timeline-frequency | Daily/weekly/monthly/recurring | Các beat theo thứ tự/tần suất đã được nói | Chuỗi callout/feature-list, stat-hero cho frequency metric; timing theo transcript |
| concept-story | Psychology/behavior, số chỉ hỗ trợ | Concept → tình huống → hệ quả → reframe | hook, callout, exact-source typography, icon hiện có, comparison nếu source thực sự tương phản |

Archetype không đồng nghĩa với một HTML template. Không có fixed sequence quota. Giữ 60–70% brand/system, 30–40% variation như editorial guideline, không giả vờ đây là phép đo pixel tự động.

Reuse đã kiểm tra trong composer/animations: comparison icon bên phải stacked cards; SVG receipt/subscription/mental motif; feature-list rule reveal và bullet stagger; outro underline/checkmark; stat/metric scale bump. Calendar, progress bar, animated counter, strike-through, circle overlay và shake là vocabulary có thể cân nhắc, không phải capability mới đã được implement. Không đưa unsupported field vào runtime schema. Với phạm vi planning này chưa cần component mới.

## C. Files changed

Danh sách dưới đây là phạm vi v1.1, không bao gồm dirty files từ công việc trước trong workspace.

| Nhóm | Files |
| --- | --- |
| Planner + contract H | `src/planning/visual-variety.ts` |
| Orchestration CLI | `scripts/update-visual-history.ts`, `scripts/validate-visual-variety.ts`, `scripts/dry-run-visual-variety.ts` |
| Commands | `package.json`: visual:history, visual:validate, visual:dry-run |
| Skill | `.agents/skills/create-money-video/SKILL.md` |
| Tests | `src/planning/visual-variety.test.ts` |
| Classification sidecars | `output/day-1/visual-plan.json`, `output/day-2/visual-plan.json` |
| Generated metadata/reports | `output/visual-history.json`, `output/day-1/visual-variety-report.json`, `output/day-2/visual-variety-report.json` |
| Review | `docs/master-template-v1.1-review.md` |
| Renderer | NONE |

Skill create-money-video giữ locked baseline và bổ sung workflow H; skill-creator được dùng để kiểm tra cấu trúc skill và phân biệt capability hiện có với vocabulary định hướng.

## D. New components

NONE.

## E. Day 1/2 classification

| Day | Primary | Secondary | Reason |
| --- | --- | --- | --- |
| 1 | checklist-habits | stat-reveal | Narration có ba habit được đánh số: subscription creep, convenience spending, rounding down in your head; số tiền là ví dụ hỗ trợ và gần $300/month là reveal hệ quả. |
| 2 | concept-story | accumulation | Giải thích lifestyle creep bằng apartment/car/food choices, rồi nói rõ các lựa chọn stack lên khiến spending tăng theo income; kết bằng câu hỏi tự nhận biết, không phải video xoay quanh $200. |

Signature derive từ output hiện có:

- Day 1: 15 scene; stat-hero tại 7, 11; max consecutive card run 5.
- Day 2: 11 scene; stat-hero tại 4; max consecutive card run 6.
- Cả hai dùng hướng dọc; comparison có icon bên phải mỗi card và stat có motif đơn. Dùng cùng composition label phản ánh điểm giống này, không đặt hai nhãn tùy ý để né warning.
- H Day 1: PASS, coverage none (không có prior Day; không đồng nghĩa đã so sánh đủ hai video).
- H Day 2: WARNING, coverage one, so với Day 1. Score 0.523; template similarity 0.667; warning icon composition lặp. Không warning sequence/layout/stat-placement theo threshold; không FAIL. Timing similarity null vì scene counts khác nhau.

WARNING này là đặc điểm của hai output đã approved, không thu hồi approval hoặc tự sửa video. Future planning nên thử composition phù hợp nội dung hơn và review warning; không đổi semantic copy để giảm score.

## F. Day 3/5/6 dry-run — không render

`npm run visual:dry-run` đọc trực tiếp toàn bộ voice-over từng Day trong approved v2 và numeric config hiện có; in nguyên văn source cùng shortlist. Không ghi production scene plan, không tạo media. Các diễn giải sau là rationale nội bộ, không phải copy được phép hiển thị trên video.

| Day | Proposed primary | Proposed secondary | Full-script rationale |
| --- | --- | --- | --- |
| 3 | concept-story | stat-reveal | “Girl math”/joke trở thành decision system là trục chính; $7 coffee và $12 phone case là hai ví dụ cùng cơ chế, KHÔNG phải hai lựa chọn đối đầu. Cuối script là ghi nhận purchases một tuần, không tự tính tổng mới. |
| 5 | comparison | timeline-frequency | Guess 3–4 đối lập actual 8–12 là contrast thực sự. Phần sau chuyển sang thói quen monthly statement review, quan sát recurring charge ten seconds each; không phải chỉ phóng to hai con số. |
| 6 | concept-story | timeline-frequency | Scarcity/fear/safety là trục chính; $5/week là bước nhỏ để tạo cảm giác an toàn, không phải trọng tâm tích lũy tổng tiền. Nhấn weekly repetition/progression, không tự suy ra annual savings. |

Scorer hỗ trợ cùng shortlist trên: Day 3 concept-story 7/stat-reveal 4; Day 5 comparison 8/timeline-frequency 5; Day 6 concept-story 12/timeline-frequency 7. Những số này là heuristic nội bộ, không confidence xác suất. Chưa có future scene plan nên chưa chấm H cho Day 3/5/6.

## G. Validation H — exact logic

1. Parse strict visual plan; primary/secondary thuộc enum, secondary khác primary, rationale tối thiểu 10 ký tự; CLI parse ScriptSchema và numeric config. Day của plan phải khớp numeric file. Chạy lại SCRIPT_INTEGRITY và NO_UNAPPROVED_COPY trước report. Source của voice lấy từ approved v2, không từ script.json cũ.
2. History loader chỉ coi ENOENT là empty; JSON/schema hỏng phải throw. Reject trùng Day và scene metadata không nhất quán. History updater chỉ skip Day thiếu visual-plan, có log rõ; thiếu script của Day đã classify phải fail. Lưu theo Day tăng dần. Day 3–7 hiện chưa classify nên không tự suy diễn vào history.
3. Chọn hai entry có Day nhỏ hơn current Day và lớn nhất. Không so chính mình/future Day; coverage none/one/two được report.
4. `T = LCS(template sequences) / max(scene counts)`. `C = min(scene counts) / max(scene counts)`. `A = 1` khi cùng primary, còn lại 0. `L = 1` khi cùng layout label, còn lại 0.
5. Stat positions là chỉ số 1-based của scene stat-hero, không bao gồm số liệu trong comparison. Nếu cả hai có cùng số stat khác 0: `S = max(0, 1 - 4 * mean(abs(position/currentCount - priorPosition/priorCount)))`; còn lại S=0.
6. Score `0.45*T + 0.10*C + 0.20*A + 0.15*L + 0.10*S`. Score và T được làm tròn 3 chữ số trước threshold. Secondary được lưu/report nhưng không góp vào score hiện tại.
7. Icon match = hai composition label không rỗng và bằng nhau. Card templates = comparison, feature-list, callout; stat-hero không tính card. Card-run match = cùng max run và current run ≥4.
8. Khi hai transcript có cùng scene count và IDs khớp script tương ứng, timing similarity = mean(min(duration_i, prior_duration_i)/max(duration_i, prior_duration_i)). Không đủ timing hoặc scene counts khác thì null. Không hard-code timestamp, không synthesis lại transcript.
9. WARNING nếu T≥0.85; hoặc L=1 và score≥0.65; hoặc S≥0.85 và score≥0.65; hoặc icon match; hoặc card-run match và T≥0.85.
10. FAIL chỉ khi đồng thời score≥0.90, T≥0.90, L=1, icon match, timing similarity khác null và ≥0.95. Thiếu icon/timing evidence thì chỉ có thể WARNING. Không có warning thì PASS.

Layout/icon labels là metadata khai báo được kiểm tra trong planning, không phải computer vision. H là heuristic bảo thủ, không chứng minh mọi video PASS có visual hoàn toàn khác nhau. Nếu chưa có transcript, chạy H trước TTS để review composition và chạy lại sau khi validation-only tạo transcript. Gate A–G vẫn bắt buộc; H không thay kiểm tra nguồn, theme, transcript, number highlights, scene safety hay frame QA.

## H. Tests

| Check | Kết quả cuối |
| --- | --- |
| TypeScript project typecheck | PASS, 0 errors |
| Typecheck riêng 3 CLI scripts với Node types | PASS, 0 errors |
| Vitest full suite | 94 PASS / 0 FAIL, 15 files |
| Visual Variety tests trong tổng Vitest | 19 PASS / 0 FAIL |
| Python unittest discover -s tests -v | 17 PASS / 0 FAIL |
| skill-creator quick_validate (-X utf8) | PASS |
| CLI history + H Day 1/2 | Thành công; Day 1 PASS, Day 2 WARNING như mục E |
| Day 3/5/6 dry-run | Thành công; không ghi production plan/media |

Tổng automated test cases: 111 PASS / 0 FAIL. Lần sandbox đầu có 2 Vitest spawn EPERM và Python không tìm thấy ffprobe; full rerun ngoài sandbox thành công, không đổi tests/renderer để né lỗi. Skill validator mặc định Windows cp1252 không đọc được tiếng Việt; chạy lại với UTF-8 thành công. Không claim đã chạy lại TTS/render hoặc toàn bộ media QA.

## I. MASTER v1 regression

Render regression: NOT REQUIRED — shared renderer không đổi. Existing automated regression suite: PASS.

Đối chiếu SHA-256 trước/sau lượt hoàn thiện này: toàn bộ files trong src/render, approved v2 script và hai MP4 đều UNCHANGED.

- Day 1 MP4: `52AFB46AE4D478A3F396514BE9527FEDCC830DB4F754133DC0ED4A83BA90A8C8`
- Day 2 MP4: `C237B02E5869C11C0681FB093DD03D0E702FFFAF3D937A8F6FE30FBAC34850C5`
- Approved v2: `C1E3BEBA4461D625ADC0B29975E1516EC3C195DF3C96147ABC0A638BD4D31464`

Giữ HyperFrames, 1080×1920/30fps, AndrewMultilingualNeural/speed 0.8/WordBoundary, navy/off-white/gold, current glow, subtitle MarginV 450 và current-word gold, crossfade 180ms, hook frame 0, number_highlights/transcript timing, outro +120ms, no persistent hashtag và A–G.

## J. Remaining gaps

- Shortlist lexical chưa tự hiểu ngữ nghĩa như human planner; không thay bước đọc full script/rationale review.
- H là preflight độc lập qua skill/CLI, chưa tự enforce khi ai đó gọi thẳng legacy renderer/batch.
- Layout/icon similarity dựa metadata coarse, không đo geometry/pixel. Cần người lập plan khai báo nhất quán; kiểm tra frame-level vẫn riêng.
- Vị trí stat hiện chỉ đếm stat-hero; số liệu comparison được exact-source audit nhưng chưa góp vào stat-placement score.
- Chưa có calendar/progress/counter runtime mới; dùng orchestration primitives hiện có. Muốn geometry mới cần yêu cầu implementation riêng, không giả vờ đã có.
- Day 1/2 có card runs 5/6 và icon composition giống nhau; giữ nguyên output approved, dùng thông tin này để tránh future mechanical repetition.

STOP: Chờ user review MASTER TEMPLATE v1.1. Không render Day 3 hoặc batch Day 3–7 trong lượt này.
