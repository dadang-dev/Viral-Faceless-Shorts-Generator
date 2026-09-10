---
name: create-money-video
description: Tạo hoặc render video Money Habits 9:16 cho Day 1–7 hay chủ đề tài chính bằng approved script, Edge TTS WordBoundary, Visual Variety System, Finance Motion/Data Viz và HyperFrames. Dùng khi lập scene plan, chọn visual archetype/model, tạo number highlights, validation, render hoặc QA theo MONEY HABITS — MASTER TEMPLATE v1.1/v1.2.
---

# Create Money Video

Tạo video motion graphics tiếng Anh cho TikTok, Reels hoặc Shorts. Xem shared runtime hiện tại là implementation đã được chứng minh; không đổi baseline đã khóa chỉ để “polish” một Day mới.

## v1.2 — Finance Motion / Data Visualization

v1.1 remains the locked baseline. v1.2 architecture remains approved, but its Day 1 benchmark failed deeper editorial/data-integrity review. Production batch Day 4–7 is STOPPED until corrected benchmark review and a separate batch instruction. Do not create v1.3 or redesign the render engine. For an authorized v1.2 task, read [references/finance-motion-v12.md](references/finance-motion-v12.md) and [references/editorial-data-integrity.md](references/editorial-data-integrity.md) completely. The v1.2 vocabulary supersedes the v1.1 “no new primitive” restriction only in that opt-in mode; legacy outputs remain unchanged.

# MONEY HABITS — MASTER TEMPLATE v1.1 — VISUAL VARIETY SYSTEM

MASTER TEMPLATE v1 vẫn là locked runtime baseline. Visual Variety System là tầng planning/orchestration nằm phía trên baseline này; không redesign engine, đổi theme, đổi voice, sửa approved script hoặc thay HyperFrames.

Luồng planning/render:

```text
approved script
→ full-script semantic analysis
→ content-driven archetype selection
→ semantic scene planning
→ validation H visual variety
→ existing HyperFrames building blocks
→ validation A–G
→ render
```

## Visual archetypes

Mỗi production scene plan phải có `output/day-<N>/visual-plan.json` với `primaryArchetype`, optional `secondaryArchetype`, rationale dựa trên toàn bộ script và layout direction. Mặc định chỉ 1 primary + tối đa 1 secondary; primary và secondary phải khác nhau.

Archetype hợp lệ:

- `stat-reveal`: script xoay quanh một số mạnh; context → tease → major reveal → explanation → CTA. Không overuse stat hero.
- `comparison`: expected/actual, before/after, small/large hoặc A/B; có thể split, side-by-side, stacked hay directional transition. Không thêm chữ `VS` nếu source không có.
- `accumulation`: nhiều khoản/hành vi nhỏ lặp và cộng dần; dùng stack, counter, progressive fill hoặc repeated cards. Không tự tính arithmetic chưa approved.
- `checklist-habits`: nhiều habit/sign/error/item; dùng staggered checklist, vertical list, individual cards hoặc progressive reveal, tránh biến toàn video thành bullet slideshow.
- `timeline-frequency`: daily/weekly/monthly/recurring/progression; dùng calendar markers, timeline, recurring dots hoặc repeat cycles sync transcript.
- `concept-story`: psychology/behavior ít số; dùng symbolic icon, exact-source quote layout, thought/action contrast, spotlight typography và directional movement. Không sáng tác psychological label.

Archetype là orchestration strategy, không đồng nghĩa với một HTML template. HyperFrames templates là building blocks. Ví dụ comparison có thể phối `hook → comparison → stat-hero → callout → outro`; accumulation có thể phối `hook → feature-list → repeated cards → stat-hero → outro`. Ưu tiên orchestration trước component proliferation.

## Variation budget

Giữ khoảng 60–70% consistent brand/system và 30–40% content-specific variation.

Locked: colors, typography family, subtitle, brand identity, crossfade, card language, motion quality, stat treatment và premium/editorial tone.

Variable: scene composition, card/icon arrangement, number presentation, comparison direction, timeline structure, repetition pattern, visual metaphor và scene density. Không randomize locked properties để tạo fake variety.

## Micro-visual vocabulary

Có thể dùng underline, circle highlight, strike-through, checkmark, x mark, arrow, divider, counter, progress bar, calendar marker, receipt strip, stacking cards, small pulse, restrained scale bump và subtle shake khi chúng hỗ trợ đúng spoken idea. Chúng không được tạo semantic claim mới, gây clutter hoặc dùng phong cách neon/cyberpunk.

Đây là vocabulary định hướng, không phải danh sách renderer đã implement. Lượt v1.1 reuse template/icon hiện có, progressive reveal và metric scale bump; không thêm calendar/progress-bar/counter/shake component hoặc tự truyền unsupported layout field. Timeline/frequency hiện biểu đạt bằng thứ tự semantic beats, exact-source text và icon sẵn có. Muốn primitive/layout mới phải báo nhu cầu kỹ thuật trước; không đổi locked renderer ngầm.

## Repetition control and history

### Intra-scene dynamics and adjacent examples

Major composition tồn tại >~5s nên có meaningful internal state change gắn với spoken semantic beat: progressive reveal, element/icon entrance, underline emphasis, object progression hoặc spatial evolution. Scene 7–9s vẫn hợp lệ; không ép scene count tăng hoặc mọi scene <5s. Existing `visualCues` chỉ reschedule entrance của target sẵn có bằng phrase resolve từ transcript; phrase thiếu/ambiguous hoặc target không tồn tại phải FAIL. Không hard-code cue time.

Phân biệt `LONG_HOLD_OK` (có state evolution) và `STATIC_LONG_HOLD_WARNING` (composition gần như giữ nguyên, chỉ subtitle đổi). Đây là planning/QA heuristic, không chứng minh bằng pixel và không auto-FAIL vì duration. Chỉ chặn visual khi frame review có evidence static quá mức có thể sửa bằng existing primitives mà không phá source contract.

Hai semantic examples liên tiếp không mặc định dùng exact same composition nếu có alternative phù hợp. Ưu tiên: content-specific composition → visual state progression → spatial arrangement → icon/object arrangement → motion direction. Không dùng idle float, decorative pulse, random shake/zoom/color hoặc arbitrary scene count để giả variety; không đổi H thresholds để né warning.

- Đọc toàn bộ approved script trước khi chọn archetype; không random hoặc chọn theo template quota.
- Cùng input phải cho planning reproducible ở mức hợp lý.
- Ghi lightweight history tại `output/visual-history.json`, derive từ `visual-plan.json`, `script.json` và optional `transcript.json` bằng `npm run visual:history`. Chỉ thêm metadata cho plan đã review; Day chưa classify được liệt kê rồi bỏ khỏi history, không đoán archetype từ template.
- `recommendVisualArchetypes` đọc full approved voice-over và approved metric count, không đọc template sequence. Đây chỉ là lexical shortlist deterministic; planner vẫn phải đọc full script và ghi rationale semantic, không coi score là quyết định bắt buộc.
- So sánh Day hiện tại với tối đa 2 Day gần nhất: archetype, scene count, template sequence, major stat placement, consecutive card scenes, layout direction và repeated icon composition.
- Cùng template không tự động là lỗi. Chỉ FAIL khi gần như copy storyboard trước một cách máy móc; WARNING khi một hay nhiều signature quá giống và cần thử composition phù hợp content hơn.

## H — VISUAL_VARIETY

Chạy `npm run visual:validate -- output/day-<N>/script.json` trước render production v1.1. Report bắt buộc gồm primary/secondary archetype, recent Days đã so sánh, similarity, repeated-template warning, repeated-layout warning và repeated-stat-placement warning.

Status:

- `PASS`: composition đủ khác recent history.
- `WARNING`: có pattern lặp đáng xem lại nhưng chưa phải copy storyboard.
- `FAIL`: score ≥0.90, template similarity ≥0.90, cùng layout, cùng icon-composition label và timing similarity ≥0.95; dừng planning và thử composition content-driven khác. Thiếu timing hoặc icon metadata thì không đủ bằng chứng FAIL.

Exact heuristic: so với 2 entry có Day nhỏ hơn hiện tại và gần nhất; template similarity = LCS/max length; scene-count similarity = min/max; primary match = 0/1; layout match = 0/1. Stat similarity chỉ đo vị trí scene `stat-hero`: nếu cùng số lượng khác 0 thì max(0, 1 − 4 × mean absolute delta của vị trí/scene count), còn lại 0. Score = 0.45×template + 0.10×count + 0.20×primary + 0.15×layout + 0.10×stat. Report làm tròn score/template 3 chữ số trước threshold. Timing similarity = mean(min/max duration từng scene) từ transcript, chỉ khi cùng scene count.

WARNING khi template ≥0.85; hoặc cùng layout và score ≥0.65; hoặc stat ≥0.85 và score ≥0.65; hoặc cùng icon label; hoặc cùng max consecutive card run ≥4 và template ≥0.85. Card = comparison/feature-list/callout, không tính stat-hero. Không có warning thì PASS; report `historyCoverage` none/one/two để không nhầm thiếu history với đã kiểm đủ. Layout/icon labels là metadata planner khai báo, không phải pixel/frame analysis.

CLI H vẫn dùng được để preflight không TTS/render. Canonical Money Habits production path (`npm run pipeline` → `src/pipeline.ts::runPipeline`, gồm batch caller) bắt buộc tính lại H sau transcript, ghi vào `validation-report.json.gates.H_VISUAL_VARIETY` cùng `productionDecision`, trước compose/render. PASS cho phép render; WARNING cho phép render và phải lưu warnings; FAIL chặn render. Thiếu/hỏng visual-plan hoặc canonical history là FAIL, không silent skip. Không áp contract này vào unrelated Python/news pipelines hoặc shared renderer. H không thay A–G. `npm run visual:dry-run` chỉ in shortlist Day 3/5/6 từ approved source, không ghi production plan.

Gate H không làm yếu mandatory A–G và tuyệt đối không cho phép đổi semantic copy để tạo variety.

# MASTER TEMPLATE v1 LOCKED CONTRACT

## Locked render baseline

- Render 1080×1920, 30 fps, vertical 9:16.
- Dùng HyperFrames với HTML/CSS/GSAP và Chrome headless.
- Dùng shared templates trong `src/render/templates/`.
- Giữ scene crossfade ở 180 ms.
- Không đổi baseline theo từng Day nếu không có technical reason đã được báo rõ.

## Locked TTS and timing baseline

Luôn dùng:

```json
"voice": {
  "provider": "edge-tts",
  "voiceId": "en-US-AndrewMultilingualNeural",
  "speed": 0.8
}
```

`speed: 0.8` là hệ số pipeline chuyển thành Edge TTS synthesis rate `-20%` bằng `(speed - 1) × 100`. Đây không phải post-processing slowdown.

- Lấy timestamp từ Edge TTS `WordBoundary` và ghi timing contract vào `output/day-<N>/transcript.json`.
- Không dùng Whisper hoặc manual timestamp.
- Không chèn silence hay làm chậm bất thường để ép video vượt 60 giây.
- Nếu approved narration ngắn hơn target, report `SHORT_APPROVED_NARRATION` và giữ `padded: false`.
- Được dùng purposeful outro dwell sau spoken content: last WordBoundary → +120ms → profile entrance → readable CTA hold → end. Không blank/black extension, filler narration, duplicate CTA, đổi speed hoặc kéo scene giữa video. Production video duration phải ≥60.5s; preferred ≥60.7s (Day 3 target 60.7–61.0s). Ghi planned và measured video-stream duration vào production report; dưới minimum = FAIL/`NEED_DURATION_FIX`. Audio duration warning không thay measured-video gate.

## Source of truth

- Lấy voice-over nguyên văn từ canonical `money-habits-script-v2.1-verified.md`. Day 1 có đúng ba correction đã được user duyệt; Day 2–7 giữ nguyên byte. `money-habits-script-v2-optimized.md` chỉ là lịch sử, không fallback cho production mới.
- Chỉ dùng `money-habits-ALL.md` cho metadata, caption, hashtag hoặc engagement data khi có nội dung phù hợp.
- Không dùng `money-habits-ALL-v4.md` thay voice-over approved v2.
- Không dùng voiceText cũ, summary, paraphrase hoặc LLM rewrite.

Luồng bắt buộc:

```text
approved Day section
→ exact voiceText
→ Edge TTS en-US-AndrewMultilingualNeural at rate -20%
→ WordBoundary
→ transcript.json
```

Trước scene planning, đọc toàn bộ section của Day và report exact approved voiceText sẽ dùng.

## No-paraphrase and visible-copy contract

Cho phép LLM quyết định semantic scene boundaries, template, layout, icon, visual hierarchy, animation và stat emphasis. Không cho phép LLM viết lại narration; sáng tác hook/catchy headline, summary headline, conceptual label hay outro semantic copy; thay số; thêm claim/advice; hoặc hiển thị text không truy được về approved source.

Mọi visible semantic string phải trace được tới approved Day script hoặc explicitly approved config/metadata/platform UI. Ví dụ không dùng `THE $200 TRAP` nếu cụm đó không tồn tại trong approved source/config. Nếu không trace được, gate `NO_UNAPPROVED_COPY` phải FAIL.

## Semantic scene planning

- Quyết định scene count theo semantic beats; không có editorial fixed count như 12–19.
- Tuân thủ giới hạn kỹ thuật hiện tại của `ScriptSchema` là 3–30 scene. Day 2 có 11 scene và là output hợp lệ.
- Không chia máy móc một scene cho mỗi câu.
- Ưu tiên hook, concept introduction, example, contrast, numerical reveal, consequence, reframing và CTA.
- Xem templates là vocabulary, không phải fixed sequence; không copy order Day 1 sang Day khác.
- Không bắt buộc mọi video có `feature-list`, `comparison` hoặc `stat-hero`.

MASTER TEMPLATE v1 là visual system:

> same brand DNA, content-specific scene composition.

Trong v1.1, nguyên tắc này được diễn đạt thêm là: **Brand consistency ≠ layout repetition.**

## Theme contract

```text
navyDeep:    #071426
navySurface: #0D2038
navyRaised:  #132B47
textPrimary: #F5F1E8
textMuted:   #C9C2B5
accentGold:  #D7A928
accentAmber: #F2C14E
```

- Dùng navy cho background/surfaces, off-white cho primary text và chỉ gold/amber làm accent.
- Không cyan, purple, dark-neon hoặc random per-video accent.
- Giữ thin gold borders, controlled radius và premium/editorial feel.
- Giữ gold glow restrained ở mức hiện tại; không tăng tùy Day hoặc tạo gaming/cyberpunk neon.

## Shared visual rules

### Crossfade

Dùng shared 180 ms crossfade. Không tạo black/white flash, blank hero area, CSS reset frame hoặc two-scene ghosting kéo dài.

### Subtitle

- Dùng shared ASS renderer với `MarginV = 450`.
- Giữ uppercase behavior hiện tại.
- Chỉ active spoken word hiện tại bằng gold; từ đã đọc trả default off-white.
- Đồng bộ bằng `transcript.json` WordBoundary, không manual timing.

### Hook

- Bắt đầu entrance tại `0.00s`, không dead intro.
- Khoảng `0.15s` phải readable; khoảng `0.35s` gần full-state.
- Hook copy phải là span approved, không sáng tác lại.

### Metric emphasis

Đồng bộ stat/metric zoom với approved spoken phrase qua transcript. Giữ shared emphasis hiện tại: scale lên nhẹ rồi trở về mặc định.

### Outro

- Lấy last spoken timing từ last `WordBoundary`, không từ arbitrary scene duration.
- Giữ `ttBase = last spoken word + 120ms`.
- Chỉ animate profile/follow CTA sau spoken subtitle cuối; không collision.

### Branding

- Giữ Money Habits identity top-left.
- Không persistent `#MoneyHabits` hoặc duplicate branding quá mức.
- Chỉ dùng optional handle theo shared implementation; handle phải yield cho profile card ở outro.
- Canonical Money Habits avatar dùng `assets/money-habits-avatar.svg` (navy/off-white/gold star mark), không legacy `assets/avatar.png`. Áp dụng future renders; không sửa immutable MP4 Day đã approved. Không cần pixel-level theme validator; inspect brand assets và outro frames.

## Number highlights contract

Tạo `output/day-<N>/number_highlights.json` cho mọi approved metric cần emphasis, gồm approved spoken phrase/canonical text, display text, scene, target và optional disambiguation context.

```text
approved phrase
→ Edge TTS
→ transcript.json
→ phrase resolver
→ metric/stat-hero timing
```

Nếu phrase không resolve chính xác một lần trong scene đã khai báo, FAIL. Không đoán, silently skip, approximate hoặc fallback manual timestamp.

## Mandatory validation A–G before render

- **A — SCRIPT_INTEGRITY:** approved voiceText bằng final concatenated voiceText sau normalization hợp lý.
- **B — NO_UNAPPROVED_COPY:** audit mọi visible semantic string và source span.
- **C — THEME:** active render không có forbidden cyan, purple hoặc dark-neon token.
- **D — TRANSCRIPT:** Edge TTS, approved voice, WordBoundary, `transcript.json`, không Whisper.
- **E — NUMBER_HIGHLIGHTS:** mọi approved metric phrase resolve từ transcript.
- **F — TEMPLATE / SCENE:** schema/template hợp lệ; không invalid timing, zero-duration, illegal overlap hoặc text vượt schema constraints. Kiểm tra visual overflow tiếp trong QA.
- **G — TESTS:** TypeScript typecheck, Node/Vitest, Python khi relevant và regression tests.

Nếu mandatory gate FAIL, STOP; không silently continue.

## Workflow

1. Đọc và report exact approved Day voice-over trước planning.
2. Đọc toàn bộ script, chọn content-driven primary archetype và tối đa một secondary; ghi `visual-plan.json` với rationale.
3. Chia theo semantic beats; tạo `output/day-<N>/script.json` không đổi narration.
4. Tạo `output/day-<N>/number_highlights.json` từ approved metrics.
5. Refresh history của các plan đã review và chạy validation H; nếu FAIL thì dừng planning, nếu WARNING phải review rationale/composition, thử phương án hợp content hơn. Không đổi narration để né warning.
6. Chạy validation-only để tạo TTS/transcript và kiểm tra A–F.
7. Chạy relevant tests, ghi PASS cho G rồi validation lại; chạy lại H với transcript mới, review warning, sau đó mới ghi plan đã review vào history.
8. Chỉ khi A–H chấp nhận được, render đúng Day được yêu cầu bằng `npm run pipeline -- output/day-<N>/script.json`.
9. Không batch Day kế tiếp khi đang chờ review.

## Post-render QA

Sau mỗi render, kiểm tra overall timeline; mọi boundary ±300 ms ở interval 100 ms hoặc tốt hơn; hook 0.00–0.60s; outro quanh last WordBoundary; và mọi metric/stat scene ở entrance/full-state/exit.

Với scene dài, sample thêm các semantic internal states; với adjacent examples, kiểm tra content-driven differentiation. Outro QA phải tới final video frame để chứng minh dwell có CTA readable, không blank extension. H WARNING acceptable nếu frame QA và bốn câu hỏi (khác hai Day gần nhất, content-driven, brand nhận ra ngay) đều YES; không tự gắn CANARY PASS nếu còn blocking acceptance.

Tìm black frame, blank hero area, flash, abnormal ghosting, duplicate, z-index issue, clipping, overflow, subtitle collision, safe-area issue và CSS reset state. Không báo PASS chỉ dựa vào render exit code.

## Day-specific issue versus master bug

### DAY_SPECIFIC

Issue content/layout chỉ ảnh hưởng Day hiện tại. Có thể sửa local và chạy lại validation/QA tương ứng.

### MASTER_COMPONENT_BUG

Nếu sửa shared component: report root cause và files changed; chạy full relevant tests; regression Day 1 MASTER; xác nhận approved Day 1 visual không silently thay đổi. Không dùng Day mới làm lý do redesign/polish tùy ý Master v1.

## SFX

SFX là `OPTIONAL / FUTURE SOUND-DESIGN PHASE`. Không fail vì library trống và không tự mở SFX workstream nếu chưa được yêu cầu.

## Final report

Báo exact voiceText, archetype/rationale, scene plan/source spans, number highlights, validation A–H, similarity/history, exact tests, files changed, new components, render metadata, QA paths, Day 1 regression nếu có shared render change và remaining issues thực tế.
