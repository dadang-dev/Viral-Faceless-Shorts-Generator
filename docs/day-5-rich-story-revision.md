# Day 5 — illustrated story revision

Updated 2026-09-29. This is a new, isolated visual derivative created after comparing the source-backed Day 4 illustrated scenes with the earlier Day 5 shutter-only update. It does not overwrite either earlier Day 5 MP4 and does not change the shared crossfade default or renderer architecture.

## Scope and visual changes

- Output: [Day 5 rich-story MP4](../output/benchmarks/day-5-v12-rich-story/video.mp4), SHA256 `1dc40403fcfb8c1f433dacc1795d013c41d0196180b3f839e0b2d7a139fbe0b8`.
- Five semantic visual sequences now use large source-linked SVG story scenes: a person checking a statement; the exact `3 OR 4` versus `8 TO 12` comparison with subscription examples; a recurring charge reaching its recipient; a monthly statement scan; and a person actually looking at the statement beneath the final profile CTA.
- Navy `#0B1526`, fine `#152238` grid and static background grain, white/silver text, amber/gold accents. Existing uppercase active-word captions and all four episode-local statement-scan shutters are retained.
- Fifteen quiet synthesized SFX cues are tied to narration events or the four scene boundaries. Voice gain is `0.89`; measured final peak is `-1.9 dB`; picture packets are unchanged by the SFX mix.
- Numeric copy and qualifiers remain canonical (`3 OR 4`, `8 TO 12`). No derived values or new financial claims were added.

## Source and preservation

- Canonical narration is unchanged. The existing Day 5 voice and WordBoundary transcript are byte-identical to the transition parent; captions use the same transcript timing.
- Previous base video remains preserved at SHA256 `8cb0fbc4f13fb02ef554be12d1ba08a6029dfe8d86c833f42e30a33837e977d2`.
- Previous shutter-only derivative remains preserved at `output/benchmarks/day-5-v12-transitions/video.mp4`, SHA256 `c2d52fdd10bf21d64c4b89a7751395be28a65a010e07345316d83ac90df7ad34`.
- All 333 protected-artifact hashes in this revision's pre-run manifest match after preparation, render and SFX mix.

## QA and status

- Status: `READY_FOR_VISUAL_REVIEW`; human visual/listening approval: `PENDING`.
- MP4: 60.800s video / 60.900s container, 1080×1920, 30fps, H.264 + AAC.
- Gates: A–G PASS; H WARNING (`VISUAL_REPETITION_WARNING: layout direction repeats a recent high-similarity Day`); I PASS; J WARNING (`LOW_MOTION_DENSITY: actually-look 7.55s`). The quiet illustrated hold continues under the profile CTA; warnings are retained, not suppressed.
- Tests: 324 Node + 25 Python PASS; typecheck, frontend build and lint PASS.
- Semantic and transform-aware browser QA: illustration PASS, transition PASS; 1,138 forward/reverse samples, 1,120 art samples and 14,162 bounds checks, zero failures. Final temporal collision QA: PASS, 875 snapshots, zero failures. A missing ancillary `favicon.ico` caused a browser 404; GSAP, fonts and rendered CTA were present.
- Decoded MP4 QA: all 1,824 frames scanned; black=0, white=0, abrupt-luma=0. Eighteen coarse low-detail frames cluster around the four intentionally occluded shutter handoffs (frames 236–239, 722–725, 1141–1142, 1144–1146 and 1502–1506); the decoded transition strips were inspected. This coarse warning is disclosed and is not described as a black/white flash.
- Agent inspected the decoded overall timeline, all four transition handoffs, selected semantic-event sheets and CTA dwell. The final illustration remains visible under the CTA and the outro title is above, not over, the artwork. Subjective audio listening has not been performed; user visual/listening approval is still required.
- HyperFrames emitted its non-blocking `composition_file_too_large` advisory (545 HTML lines). No split into sub-compositions or runtime change was made.

Detailed evidence is in the output directory: `validation-report.json`, `final-gsap/qa-manifest.json`, `final-temporal-collision-report.json`, `pre-render-temporal-collision-report.json`, `transition-qa.json`, `illustration-qa.json`, `sfx-report.json`, `dense/manifest.json`, `visual-review.json` and `baseline-preservation.json`.
