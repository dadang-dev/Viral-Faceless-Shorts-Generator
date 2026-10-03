# Days 4–7 v1.2 — review handoff

Verified 2026-09-27. Status: **READY_FOR_VISUAL_REVIEW** for each video.
Human approval: **PENDING**, independently for each artifact. Automated and agent QA are not human approval.

## Artifacts and measured QA

All videos: 1080×1920, 30fps, H.264 video + AAC audio, uppercase WordBoundary-timed captions, locked DifferentActually identity.

| Day | MP4 | Picture / container seconds | Decoded frames | Real-GSAP temporal samples | H | J |
| --- | --- | --- | --- | --- | --- | --- |
| 4 | [Video](../output/benchmarks/day-4-v12-differentactually/video.mp4) | 60.800 / 60.900 | 1824 | 717 PASS | WARNING | WARNING |
| 5 | [Video](../output/benchmarks/day-5-v12-differentactually/video.mp4) | 60.800 / 60.900 | 1824 | 726 PASS | PASS | WARNING |
| 6 | [Video](../output/benchmarks/day-6-v12-differentactually/video.mp4) | 63.267 / 63.300 | 1898 | 742 PASS | WARNING | WARNING |
| 7 | [Video](../output/benchmarks/day-7-v12-differentactually/video.mp4) | 60.800 / 60.900 | 1824 | 627 PASS | PASS | WARNING |

SHA256:

- Day 4: `9e697173472f377a1e7ca4984aefee53898eff5a4be3a67cbfbc660c46fbd72b`
- Day 5: `8cb0fbc4f13fb02ef554be12d1ba08a6029dfe8d86c833f42e30a33837e977d2`
- Day 6: `40fa09ae432eb494ab096104764cf6c0bc9807467858fa7b518371303f9f244b`
- Day 7: `27df07c77b32ebb2506f37da4e206dd0a92119bede43e803a07c8161521ae6fd`

## Required gates

For all four: source integrity PASS; transcript integrity PASS; timing integrity PASS; caption integrity PASS; numeric integrity PASS; semantic/editorial validation PASS; visual collision validation PASS; temporal collision validation PASS; frame QA PASS after sampled agent review; duration/resolution/fps/audio PASS; protected-artifact hash check PASS (251 files unchanged).

A script integrity, B approved copy, C theme, D transcript, E number highlights, F template/scene, G tests and I finance/data-viz: **PASS** for all four. H/J results are explicitly listed above, not silently treated as PASS. No required gate skipped.

300 Node + 25 Python tests PASS; typecheck, frontend build/lint and skill validation PASS. Final Node evidence: `.runtime-logs/days4-7-final-vitest.json`. All decoded-frame scans report zero black, white and abrupt-luma flags. Low-detail flags: 11/9/7/8 frames for Days 4/5/6/7 respectively, reviewed as brief handoff/CTA clearances. Pixel inspection used decoded contact sheets, dense semantic boundaries and timelines; not every frame was manually inspected. Actual-browser temporal checks supplement that inspection, with GSAP loaded.

## Warnings retained for human judgment

- H: Day 4 layout direction resembles Day 3; Day 6 resembles Day 4. Batch-local history includes new Days 4–7 without changing canonical history or approval state.
- J Day 4: `feeling-relief` 9.32s; `checkout-feeling` 6.94s.
- J Day 5: `charge-attention` 7.46s.
- J Day 6: `tight-wallet` 6.25s; `knowing-feeling` 6.29s; `weekly-safekeeping` 7.36s.
- J Day 7: `single-choice` 9.10s. Final profile dwell is 11.33s; pacing approval remains pending.
- HyperFrames composition-size advisory remains. No renderer architecture changes were made to remove an advisory.

## Scope and corrections

The create-money-video skill guided source-linked semantic plans, literal numeric encoding, temporal sampling and review gates. Narration, reused canonical audio and WordBoundary timing remain unchanged. Shared renderer/contracts and model/runtime configuration were not changed for this batch.

Day 5 preserves literal 3 OR 4 and 8 TO 12, including OR/TO in captions; numeric ink fits its containers. No invented aggregate or midpoint. Day 6 shows only source-supported $5 with A WEEK, not a derived balance. Day 7 reveals five categories sequentially without choosing a habit for the viewer. Last finance states clear before the existing editorial outro; final CTA copy is source-exact, including ACTUALLY LOOK and TELL ME BELOW. Regression tests cover these invariants.

Prior diagnostic sheets are retained under attempt1 directories where present; they are not evidence for current MP4s. No protected media was deleted or overwritten. No commit or push performed.

## Evidence

Each linked report contains the final video hash, all gate results, temporal input hash, protected comparison and the exact list of agent-reviewed images:

- [Day 4 report](../output/benchmarks/day-4-v12-differentactually/validation-report.json) · [overview](../output/benchmarks/day-4-v12-differentactually/final-gsap/overall-contact.png)
- [Day 5 report](../output/benchmarks/day-5-v12-differentactually/validation-report.json) · [overview](../output/benchmarks/day-5-v12-differentactually/final-gsap/overall-contact.png)
- [Day 6 report](../output/benchmarks/day-6-v12-differentactually/validation-report.json) · [overview](../output/benchmarks/day-6-v12-differentactually/final-gsap/overall-contact.png)
- [Day 7 report](../output/benchmarks/day-7-v12-differentactually/validation-report.json) · [overview](../output/benchmarks/day-7-v12-differentactually/final-gsap/overall-contact.png)

Next action: human visual review. Do not promote these artifacts to approved production or rerender them without the corresponding user decision.
