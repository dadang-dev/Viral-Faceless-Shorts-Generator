# DAY 1 v1.2 EDITORIAL R2 — READY FOR FINAL VISUAL REVIEW

No v1.3, no architecture redesign, no TTS regeneration, no Day 4–7 render, and no protected Day 1–3 production output modification.

## Locked source and media

- Source: `money-habits-script-v2.1-verified.md`; SHA256 `0d79277b3c72d59aa41bb0c5848e3ebd59303ab3971b61dd4353deef52639d4f` (byte-for-byte unchanged).
- Audio SHA256 `bdc7b720675c9cc7e6a7d208d05aae97ba76e83860fe33e36f88cfdd5fdbc1a5`; reused from R1, `ttsRegenerated=false`.
- Video: `output/benchmarks/day-1-v12-editorial-r2/video.mp4`; 63.933s, 1080×1920, 30fps; SHA256 `887c6972c1102b6e25c7445678b9dd433263b523b5c38b3ae7f220c50c8d1fbb`.
- Transcript remains Edge TTS WordBoundary; Whisper is not used.

## Validation A–J and tests

| Gate | Result |
| --- | --- |
| A_SCRIPT_INTEGRITY | PASS |
| B_NO_UNAPPROVED_COPY | PASS |
| C_THEME | PASS |
| D_TRANSCRIPT | PASS |
| E_NUMBER_HIGHLIGHTS | PASS |
| F_TEMPLATE_SCENE | PASS |
| G_TESTS | PASS |
| H_VISUAL_VARIETY | PASS |
| I_FINANCE_DATA_VIZ | PASS |
| J_MOTION_SEMANTICS | PASS |
| PRODUCTION_DURATION | PASS |

Editorial subchecks: TEXT_ROLE=PASS; VISIBLE_TEXT_REDUNDANCY=PASS; HERO_HIERARCHY=PASS; SECTION_HIERARCHY=PASS; CHAPTER_DEAD_AIR=PASS; ICON_SEMANTICS=PASS; VISUAL_MODEL_VALIDITY=PASS; QUANTITY_AMBIGUITY=PASS; DOMINANT_LAYER_COLLISION=PASS; CAPTION_BOUNDARY_INTEGRITY=PASS; SECTION_CAPTION_REDUNDANCY=PASS; TEMPORAL_SPECIFICITY_INTEGRITY=PASS; ACTUAL_VS_MENTAL_INTEGRITY=PASS; MOTION_SEMANTICS=PASS.

Tests: **259 Node/Vitest + 25 Python = 284 PASS; 0 FAIL**. Typecheck, frontend build, frontend lint and Money Habits skill validation all PASS.

## Transition collision report

| Time | Outgoing dominant foreground | Incoming dominant foreground | Max semantic overlap | Result |
| --- | --- | --- | --- | --- |
| 5.915 | hook | subscriptions | 0.000s | PASS |
| 20.698 | subscriptions | convenience | 0.000s | PASS |
| 33.964 | convenience | rounding | 0.000s | PASS |
| 48.677 | rounding | reframe | 0.000s | PASS |

Global ambient crossfade remains 180ms. Dominant foreground uses 60ms outgoing fade → 20ms clean field → 100ms incoming fade. Section markers additionally enter at their own transcript-linked WordBoundary. Exact frame-index QA 1018–1031 confirms the formerly ambiguous 34s boundary is now data + MONTH → clean navy/brand → NUMBER THREE, with no shared frame.

## Caption segmentation report

| Boundary | Previous spoken sentence | Section marker | Following sentence | Caption result |
| --- | --- | --- | --- | --- |
| Number one | You just have three habits working against you without you noticing. | Number one: subscription creep. | That's fourteen dollars for a streaming app, nine for a fitness app, | PASS — previous caption ends independently; exact marker carried on canvas; following narration resumes as bottom caption |
| Number two | five for cloud storage you forgot you even signed up for — until you're paying for five apps you forgot existed. | Number two: convenience spending. | Every 'I'll just order it, I'm tired' feels like ten dollars in the moment. | PASS — previous caption ends independently; exact marker carried on canvas; following narration resumes as bottom caption |
| Number three | But ten dollars, four nights a week, is about a hundred and seventy dollars a month. | Number three: rounding it off in your head. | You think of an eighteen-dollar coffee run as 'like twenty bucks.' | PASS — previous caption ends independently; exact marker carried on canvas; following narration resumes as bottom caption |

Suppression spans: Number one 6.220–8.735s; Number two 20.987–23.596s; Number three 34.253–37.050s. `EXISTED NUMBER TWO` and `MONTH NUMBER THREE` are absent.

## Motion semantics report

| Time range | Narration progression | Main visual progression | Meaningful events | Result |
| --- | --- | --- | --- | --- |
| 15.162–18.803s | you forgot you even signed up for → until you're paying for five apps | three named subscriptions dim progressively → restore/reorganize → exactly two anonymous objects enter → 5 APPS | forget-streaming@15.162, forget-fitness@15.912, forget-cloud@16.240, restore-known@17.771, five-total@18.803 | PASS |
| 24.207–27.932s | I'll just order it, I'm tired → ten dollars | order action node → drawn connection → bag/order state → confirmation focus → $10 reveal | ordering@24.088, order-confirm@25.838, price@27.182 | PASS |
| 38.051–43.827s | eighteen-dollar → like twenty bucks → three times a week | actual $18 remains anchored → separate ghost/dashed ~$20 mental overlay → actual purchase object moves into count-only frequency meter | price@38.051, mental@40.317, merge-object@42.421, weekly@42.421 | PASS |
| 51.151–60.881s | quietly in the background → try naming just one → break the cycle | three habit objects recede → naming/microphone activates in foreground → clean CTA handoff | background@51.869, notice@53.892, foreground@54.767, handoff@60.272 | PASS / LONG_HOLD_OK |

## Data semantics report

| Relationship | Actual data/state | Mental/concept state | Visual encoding | Integrity |
| --- | --- | --- | --- | --- |
| convenience spending | $10; 4 nights/week; ABOUT $170/month | — | actual order → 4 active of 7 neutral unlabeled count nodes → approved approximate monthly result | PASS; no weekday claims, no invented values |
| rounding psychology | $18 actual; 3 times/week; OVER $200/month | ~$20 mental approximation | anchored gold $18 + offset translucent/dashed ~$20; repeated coffee derives from actual object | PASS; mental value never replaces actual or becomes calculation input |

## Frame QA

- Dense QA: `output/benchmarks/day-1-v12-editorial-r2/r2-final/`; 64 contact groups and 1110 sampled frames.
- Exact boundary frames: `output/benchmarks/day-1-v12-editorial-r2/qa-exact-boundary/`.
- Automated scan: 1918 frames; black=0, white=0, abrupt luma=0.
- Required windows reviewed: 5.4–6.8, 20.0–21.5, 22–28, 33.2–35.0, 38–43, 42–48.5, 48–49.3, 50–61, 60.5–end.

## Protected production hashes

All 13 protected hashes match before/after. Full record: `output/benchmarks/day-1-v12-editorial-r2/baseline-preservation.json`.

| Production video | SHA256 |
| --- | --- |
| output/day-1/video.mp4 | 52afb46ae4d478a3f396514be9527fedcc830db4f754133dc0ed4a83ba90a8c8 |
| output/day-2/video.mp4 | c237b02e5869c11c0681fb093dd03d0e702fffaf3d937a8f6fe30fbac34850c5 |
| output/day-3/video.mp4 | ca272c19f0ea841b04dec0a539a5e979b198b542bbf132d664554c54228abf23 |

## Acceptance answers

1. **YES** — Zero readable dominant-foreground collision at all four reviewed major boundaries.
2. **YES** — Subtitle chunks are sentence/chapter aware.
3. **YES** — Number One/Two/Three are no longer merged into previous captions.
4. **YES** — Section-marker subtitles are non-redundant.
5. **YES** — Subscription forgetting evolves visually.
6. **YES** — Convenience order quote evolves before $10.
7. **YES** — Frequency visuals encode counts without weekdays.
8. **YES** — $18 remains actual while ~$20 is mental only.
9. **YES** — Monthly result derives from repeated actual purchase behavior.
10. **YES** — Reframe HERO has a clean entrance.
11. **YES** — Hook, five-app total, validated metrics and CTA remain correct.
12. **YES** — Video remains clean/premium rather than over-animated.

## Files changed

- `.agents/skills/create-money-video/references/editorial-data-integrity.md`
- `scripts/plan-day1-editorial-r2.ts`
- `scripts/render-day1-editorial-r2.ts`
- `scripts/qa-money-video.py`
- `scripts/report-day1-editorial-r2.ts`
- `src/contracts/finance-motion.ts`
- `src/contracts/hero-captions.ts`
- `src/contracts/editorial-validation.ts`
- `src/contracts/editorial-validation.test.ts`
- `src/render/finance-renderer.ts`
- `src/render/finance-renderer.test.ts`
- `src/render/html-composer.ts`
- `src/render/html-composer.test.ts`
- `src/render/templates/animations.js`
- `src/render/templates/finance.css`

Generated R2 artifacts are confined to `output/benchmarks/day-1-v12-editorial-r2/`. Genuine remaining issues: none blocking; HyperFrames still emits its nonblocking 491-line composition-size advisory. This patch changes editorial/runtime behavior only and does not alter the approved v1.2 architecture.
