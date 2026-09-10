# MASTER TEMPLATE v1.2 — APPROVED FOR PRODUCTION

Approval: independent visual review accepted the v1.2 architecture, finance data-viz system, motion semantics and Day 1 benchmark. This production-lock pass changes only the final CTA handoff and reusable selection guidance. Day 4–7 were not rendered.

## Exact transition fix

Root cause: the awareness finance sequence remained visible until 59.666s while the outro scene started at 59.486s. The global 180ms crossfade therefore showed the old node `TRY NAMING JUST ONE OF THEM OUT LOUD` faintly behind incoming `COMMENT 1, 2, OR 3`.

Fix: the existing transcript-resolved `That's it` event at 59.067s now hides all three awareness foreground nodes—`quiet`, `background`, and `naming`—over 180ms. Fade completes at about 59.247s. The outro scene still starts at 59.486s and `COMMENT 1, 2, OR 3` begins becoming visible around 59.567s.

The 239ms breathing interval preserves the navy background, persistent Money Habits brand/handle and active subtitle. There is no black/blank frame. The global crossfade implementation and duration remain unchanged.

Files directly involved: `scripts/plan-day1-finance-benchmark.ts`, its test fixture, and one renderer regression test. Shared `html-composer.ts`, `animations.js`, `finance-renderer.ts`, finance CSS/animation primitives, theme, audio, subtitles and HyperFrames were not changed for this fix.

## Production rule locked in the skill

A number does not automatically require a chart:

- standalone fact → stat/number reveal;
- comparison/gap → shared-scale bar/comparison;
- accumulation → retained stack/progression;
- frequency → timeline/repetition;
- state change → balance/gauge/stateful model;
- process → decision flow/process loop.

Typography remains valid when clearest. No invented/derived unapproved financial data may be introduced to enrich a visualization. Semantic motion should come from data growth, accumulation, state mutation, progressive reveal, diagram construction, frequency progression and process flow—not arbitrary transition variety.

Skill validator: PASS.

## Tests and validation

**242 PASS, 0 FAIL:** 217 Vitest + 25 Python. TypeScript typecheck, frontend build and frontend lint PASS.

| Gate | Result |
| --- | --- |
| A SCRIPT_INTEGRITY | PASS |
| B NO_UNAPPROVED_COPY | PASS |
| C THEME | PASS |
| D TRANSCRIPT | PASS |
| E NUMBER_HIGHLIGHTS | PASS |
| F TEMPLATE_SCENE | PASS |
| G TESTS | PASS |
| H VISUAL_VARIETY | PASS |
| I FINANCE_DATA_VIZ | PASS |
| J MOTION_SEMANTICS | PASS |
| PRODUCTION_DURATION | PASS |

No architecture gate, primitive, visual model, transition vocabulary, theme token, TTS or source contract changed.

## Final benchmark and QA

Video: `output/benchmarks/day-1-v12/video.mp4`

- 1080×1920, 9:16, H.264, 30fps
- video-stream duration: 64.400s
- frames: 1,932
- SHA256: `4bc2f9f747c173216680d8e302d7719cf34901126976daab2a40d0e0f6dce673`
- AAC payload identity against approved Day 1: PASS
- 13 protected source/Day 1–3 media hashes: 0 mismatches

QA: 1,932-frame scan plus 413 sampled frames across 38 groups.

The dedicated `cta-handoff` group contains all 22 frames from 59.300s through 60.000s:

- 59.300–59.533s: old foreground CTA absent; only background, persistent brand/handle and approved subtitle remain.
- about 59.567s: incoming COMMENT CTA begins fading in.
- 59.600s onward: COMMENT CTA continues cleanly with no old node behind it.

Result: no ghost text, black frame, blank background, white flash or abrupt mean-luma change. The coarse low-detail detector flags frames 1776–1786 because the intentionally cleared hero region is in its breathing state; direct frame review confirms content shell/subtitle remain and the state is expected.

Artifacts:

- `output/benchmarks/day-1-v12/qa-v12/cta-handoff-contact.png`
- `output/benchmarks/day-1-v12/qa-v12/qa-manifest.json`
- `output/benchmarks/day-1-v12/test-results.json`
- `output/benchmarks/day-1-v12/audio-isolation.json`
- `output/benchmarks/day-1-v12/baseline-preservation.json`
- `output/benchmarks/day-1-v12/validation-report.json`

Final state: **MASTER TEMPLATE v1.2 — APPROVED FOR PRODUCTION**.

STOP. Wait for an explicit Day 4–7 production batch instruction.
