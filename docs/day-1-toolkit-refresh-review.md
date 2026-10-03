# Day 1 toolkit refresh — READY FOR VISUAL REVIEW

This is an isolated benchmark generated after consolidating the Day 2 continuity lessons into the Money Habits rules. It does not replace or modify the approved Day 1 R2 artifact.

## Output

- Video: `output/benchmarks/day-1-v12-toolkit-refresh/video.mp4`
- SHA256: `baebefff31419a5395b850d3e9dab024c6d8dc03938eb9af602f4bb65d045d99`
- Duration: `63.933s`, 1080×1920, 30fps
- QA frames and contacts: `output/benchmarks/day-1-v12-toolkit-refresh/refresh/`
- Temporal report: `output/benchmarks/day-1-v12-toolkit-refresh/refresh-temporal-collision-report.json`
- Protected comparison: `output/benchmarks/day-1-v12-toolkit-refresh/protected-artifacts.json`

## Changes carried into the toolkit

- Connected visual states retain an object while its price, frequency or emphasis changes.
- SVG connectors and future objects are hidden until their transcript-linked event and cleared when the state changes.
- Gold/amber/off-white roles distinguish retained, active and secondary states without changing numeric values.
- Scene regrouping preserves exact narration, WordBoundary times and all remapped scene references.
- Day 1 metric containers reserve loaded Anton ink height; the completed checkout object clears before the order moves into the frequency track.

## Validation

| Gate | Result |
| --- | --- |
| A–J | PASS |
| Node/Vitest | 277 PASS |
| Python | 25 PASS |
| Temporal browser QA | PASS — 926 snapshots, 0 failures |
| Full frame scan | 1,918 frames; black=0, white=0, abrupt-luma=0 |
| Protected artifacts | PASS — 172 files, changed=0 |

The frame scanner reports coarse low-detail advisories near fades and the outro; these are review prompts, not collision failures. Human visual approval remains pending.
