# Day 3 v1.2 — ready for visual review

Date: 2026-09-24. Authorization: “Làm tiếp day3”, resumed by “tiếp tục”.
Human approval: **PENDING**. No Day 4–7 authorization.

## Artifact

- [Final review MP4](../output/benchmarks/day-3-v12-differentactually/video.mp4)
- SHA256: `c54d785dc732f215b438952b9553aafa53d616aeaaa87fc6a11ba0f0bf51cf9e`
- Video: 1080×1920, 30fps, 1,824 frames, H.264, 60.800s picture; AAC audio, 60.900s container.
- Brand: DifferentActually / @differentactually / DAILY HABITS.
- [Overview](../output/benchmarks/day-3-v12-differentactually/final-gsap/overall-contact.png), [dense corrected movement](../output/benchmarks/day-3-v12-differentactually/dense/coffee-align.png), [final CTA](../output/benchmarks/day-3-v12-differentactually/final-gsap/outro-4-contact.png).

## Source and plan

The complete exact approved voiceText is preserved in [script.txt](../output/benchmarks/day-3-v12-differentactually/script.txt) and the [full-script storyboard](day-3-v12-storyboard.md). Canonical file SHA256 remains `0d79277b3c72d59aa41bb0c5848e3ebd59303ab3971b61dd4353deef52639d4f`. Narration was not rewritten; legacy Edge AndrewMultilingualNeural audio was copied byte-for-byte, with all 138 WordBoundary cues and absolute timings unchanged.

Primary concept-story, secondary accumulation: four connected visual sequences span audio slices 1–2 (quoted excuses), 3–4 (quiet cost / attention recedes), 5–7 (retained actual purchases), 8–10 (one-week observation ledger). Finance primitive events resolve from exact source spans. Only $7 and $12 are numeric data; no sum, $0 label, invented frequency or exact $20 threshold price. The one-week interval remains source-exact text. Last WordBoundary 57.206s; profile enters at 57.326s; purposeful CTA dwell reaches 60.8s without changing narration speed.

## Validation

| Gate | Result |
| --- | --- |
| A source/narration integrity | PASS |
| B source-supported visible copy | PASS |
| C locked theme | PASS |
| D transcript / Edge WordBoundary | PASS |
| E $7 / $12 phrase-linked highlights | PASS |
| F source scenes / timing | PASS |
| G tests | PASS — 285 Node, 25 Python; typecheck, frontend build/lint |
| H visual variety | PASS — compared with Days 2/1; similarity 0.536 / 0.373 |
| I numeric/data integrity | PASS — literal independent prices; no derived data |
| J motion semantics | WARNING — 6.71s and 5.15s slower holds; editorial subchecks PASS |
| Caption integrity | PASS — exact scoped hero coverage plus uppercase karaoke |
| Collision / temporal geometry | PASS — compiler and 777 real-GSAP browser samples |
| MP4 frame scan | PASS — 1,824 frames; black=0, white=0, abrupt-luma=0 |
| Duration / resolution / fps / streams | PASS — measured video + audio |
| Skill validation | PASS |
| Protected artifact comparison | PASS — 127 fresh before/after hashes unchanged |
| Human approval | PENDING |

Eight coarse low-detail warnings (frames 208, 652–653, 1159–1160, 1718–1720) were inspected in consecutive handoff/outro frames. They show brief foreground clearance over the persistent navy/brand, not sustained blank footage. The two slower motion holds retain prices/records while narration develops the behavioral point; the warnings remain visible for human pace judgment. HyperFrames also emits a nonblocking 502-line composition-size advisory. No architecture change was made to silence it.

## Pixel review and correction

Reviewed MP4-derived full-timeline samples, hook frames 0–18, all source boundaries ±300ms, numeric entrances, consecutive frames for risky events, and the CTA through the last frame. First-pass review caught record occlusion during simultaneous widening. The local plan now declares a shared observation-record group and lowers the case record before widening. The existing shared geometry contract rejects the old path; a new regression test proves it. Dense final frames show separated paths, retained objects and no caption collision.

This is agent inspection and automated validation, not human visual approval or a claim that every frame was manually viewed. Final evidence is bound to the MP4 hash. `attempt1-*` folders contain diagnostic images from the rejected first pass and are not final evidence.

## Changes and evidence

Added isolated scripts `prepare-day3-v12.ts`, `plan-day3-v12.ts`, `render-day3-v12.ts`, `qa-day3-dense.ts`, `report-day3-v12.ts`; five tests in `src/contracts/day3-v12.test.ts`; Day 3 storyboard/review and current handoff/status. No shared rendering component or architecture change. Phone-case SVG and ledger CSS are scoped to Day 3, reusing existing primitives. Day 1 protected regression fixtures ran in the full suite; protected media were not rerendered.

Evidence under the benchmark: `validation-report.json`, `test-results.json`, `caption-coverage.json`, `editorial-validation.json`, `numeric-integrity.json`, `final-temporal-collision-report.json`, `final-gsap/qa-manifest.json`, `dense/manifest.json`, `visual-review.json`, `baseline-preservation.json`.
