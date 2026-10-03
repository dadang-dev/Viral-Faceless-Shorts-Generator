# MASTER TEMPLATE v1.2 — RULE-LOCK AUDIT

## 2026-09-20 continuity consolidation

Current implementation guidance is linked from the skill as `references/visual-continuity.md`. Preserve objects across related semantic beats; use transcript-linked reveals for connector geometry; distinguish active/retained/secondary states within the locked palette; preserve exact WordBoundary timestamps during regrouping. Seven scene groups are a Day 2 preference, not a global quota. Day 1 already uses seven persistent visual sequences over fifteen narration slices.

These are planning and frame-review requirements. Existing element collision checks do not universally measure SVG paths or CSS pseudo-elements, and pair filtering is not proof against text ghosts. Do not claim new automated enforcement from documentation changes. The isolated Day 1 refresh runs the existing A–J and temporal/frame checks and keeps its evidence separate from historical reports below.

The refresh reproduced two local issues: Anton ink exceeded six Day 1 container types despite compile checks, and the checkout connector remained after the order moved to a frequency slot. The new benchmark enlarges/repositions the affected containers and hides the completed checkout at the repeated price phrase, before the frequency event. Existing shared hide behavior also clears attached links. No validator threshold was weakened; actual MP4 review is still required for connectors.

Scope: Day 1 v1.2 R2 revalidation and isolated Day 2 v1.2 benchmark only. Day 3–7 were not rendered or migrated.

| Rule | Classification | Enforcement / evidence |
|---|---|---|
| HERO SAFE ZONE | A — global enforced | `VISUAL_SAFE_FRAME` and compiler temporal sampling; hero/object spacing is role-aware. |
| OBJECT GAP | A — global enforced | Shared semantic pair checks (`HERO_FOREGROUND_OVERLAP`, retained-object gaps). |
| TEXT CONTAINMENT | A — global enforced | Conservative loaded-font estimate at compile time plus browser `getBoundingClientRect` and material scroll-overflow sampling. |
| ANIMATION-SWEPT BOUNDS | A — global enforced | Reveal/stack/grow/draw entrance offsets and stat-punch transforms are sampled, clamped and checked. |
| RETAINED-STATE COMPRESSION | A — global enforced | Entity-group-aware metric/card spacing; shared finance renderer metadata carries `data-kind` and `data-entity-group`. |
| SAFE FRAME | A — global enforced | Shared 70/240/1010/1340 frame; transformed bounds checked at every temporal sample. |
| TRANSFORM-AWARE MEASUREMENT | B — global validated | Actual browser snapshots use transformed `getBoundingClientRect`, loaded-font metrics and animation-timed font size; plan validation remains the pre-render blocker. |
| Caption/foreground handoff | B — global validated | Existing dominant foreground handoff contract plus role-aware browser collision checks. |
| Text economy / wording | C — planner guidance + contract | Source spans and `NO_UNAPPROVED_COPY` block semantic paraphrase; planner selects hierarchy only. |
| Semantic motion / data-viz choice | C — planner guidance + contract | Finance motion contract requires relationship-appropriate motion; no invented chart data. |
| Day 1 R2 CTA/profile details | D — Day 1-local | Protected editorial outro and CTA timing; unchanged production artifact. |
| Automatic visual temporal collision gate | E → A/B promoted in this audit | New shared validator, temporal sampler and regression suite close the previous enforcement gap. |

## Root causes found

- Day 2 raise hook moved the wallet into the hero lane during focus/punch; the shared HERO SAFE ZONE and gap check now blocks this class and the benchmark plan keeps the wallet below the lane.
- The apartment label was compressed into a card whose icon/text geometry did not retain enough room; shared node sizing/text containment plus a wider retained card preserve the exact phrase without word splitting.
- `$200 / MONTH` and the retained apartment state crossed during simultaneous compression; entity-group-aware retained metric spacing, horizontal-first motion and transcript-timed font shrink resolve it.
- Entrance transforms could request offsets outside the safe frame; shared renderer clamping now sweeps the transformed state.

## Day 2 preparation file classification

| File | Classification | Notes |
|---|---|---|
| `scripts/prepare-day2-v12.ts` | DAY2-BENCHMARK-ONLY | Copies approved Day 2 script/audio into isolated benchmark. |
| `scripts/plan-day2-v12.ts` | DAY2-BENCHMARK-ONLY | Day 2 scene/visual plan; compile-gated by shared contracts. |
| `scripts/render-day2-v12.ts` | DAY2-BENCHMARK-ONLY | Isolated A–J benchmark pipeline. |
| `scripts/render-day2-v12-render-only.ts` | DAY2-BENCHMARK-ONLY | Lightweight rerender helper; no production destination. |
| `scripts/report-day2-v12.ts` | DAY2-BENCHMARK-ONLY | Benchmark report and QA aggregation. |
| `src/contracts/day2-v12.test.ts` | SHARED-CONTRACT (Day 2 fixture) | Day 2 provenance, motion and renderer contract tests. |
| `.runtime-logs/day2-v12-vitest.json` | DAY2-BENCHMARK-ONLY | Generated test log. |
| `docs/day-2-v12-canary-review.md` | SKILL/DOC | Explicitly keeps human approval pending. |
| `scripts/plan-day1-editorial-r2.ts` | PRODUCTION-PROTECTED (benchmark-only change) | Only benchmark geometry changed; protected MP4/hash unchanged. |

Shared rule-lock implementation is in `src/contracts/visual-collision.ts`, `src/contracts/finance-motion.ts`, `src/render/finance-renderer.ts`, `src/render/templates/finance-animations.js` and `src/render/templates/finance.css`; these are shared runtime/contract changes, but no protected output artifact was rewritten.

## Validation evidence

- Day 1 R2 compile-time geometry: PASS; no protected Day 1–3 production hash changed.
- Day 2 isolated benchmark: A–J PASS; Edge TTS WordBoundary transcript; number highlight resolves from transcript; 270 Node + 25 Python tests PASS.
- Temporal browser sampler: 774 snapshots, phases entrance/early-hold/midpoint/late-hold/exit/event-boundary/interval, 0 failures.
- Synthetic regression suite: 5 test cases / 11 assertions PASS, covering hero/object, retained card/tag, text overflow (including rendered scroll overflow), transformed clipping and caption/foreground collision.
- Temporal failures: before rule-lock, the three confirmed Day 2 regression classes (hero/object, apartment containment, retained card/metric) were reproducible; after shared fixes and final rerender, 0/774 sampled snapshots failed.

Status: Day 2 remains `READY FOR VISUAL REVIEW` / `PENDING_HUMAN_REVIEW`. No Day 3–7 work was run.

## 2026-09-14 workflow rebuild — QA evidence correction

The historical sampler above substituted a simplified GSAP timeline and did not verify that the intended font faces actually loaded. Those historical snapshot counts must not be described as proof of the actual GSAP renderer. The current sampler loads real GSAP, requires loaded Anton/Inter, records the GSAP version and binds the result to the sampled HTML SHA256. Failed asset/runtime loading blocks QA rather than silently falling back.

Text measurement now compares transformed scroll/ink extent with the semantic parent and padding. Anton ink can extend beyond its line-height box while still fitting the parent; treating every such line-box extension as container overflow was a false-positive measurement. The real-font check also found actual insufficient metric/payoff parent heights in Day 2; these were enlarged locally. A regression in `visual-collision.test.ts` preserves the real ink-overflow failure even when the nominal line rectangle fits.

Sampling is not complete visual proof. In particular, readable text/text ghosts during a same-lane internal transition still require frame review; the existing pair filter does not universally reject them. Day 2's planner now blocks its hook if the outgoing headline's 180ms hide overlaps the incoming phrase anchor. The unnecessary 10s sentence card was removed after MP4 review found a ghosted internal handoff. Do not waive workflow STEP 8 based on the automated PASS.

`qa-money-video.py` now fails on a missing requested frame rather than substituting a late frame. Day 2 QA includes full-timeline samples and exact-frame dense event sheets. Current rebuild evidence and any remaining review gate live in `docs/migration-status.md` and `docs/day-2-v12-workflow-rebuild-review.md`; prior reports remain historical. Shared render architecture and protected MP4s were not changed by this QA correction.

## 2026-09-28 explicitly requested visible transitions

The shared 180 ms crossfade remains the default and its duration is unchanged. When a user explicitly requests a more visible scene-to-scene transition, allow an episode-local authored treatment rather than treating the old “avoid decorative wipes” preference as an absolute ban. Bind it to actual visual-sequence boundaries resolved from the plan/transcript; preserve voice, WordBoundary and caption timing; keep masking inside the safe viewport and clear of brand/captions; and inspect dense entry/travel/cover/exit states, backward seeks and decoded MP4 frames. This is not a global shutter/wipe style rule, does not authorize architecture changes, and does not imply SFX. The Day 4 implementation and its evidence remain scoped to [its revision report](day-4-transitions-revision.md) and current migration status; automated QA still does not constitute human approval.

## 2026-09-29 Day 5 transition derivative

An explicitly requested Day 5 update now has its own guarded CLI branch and benchmark destination. Four 0.64s statement-scan shutters are bound to the existing plan-resolved visual-sequence boundaries; the Day 4 branch is not reused, and no shared renderer/default or other Day changes. Canonical narration, WordBoundary, captions and existing audio are unchanged; no SFX were added. The result is READY_FOR_VISUAL_REVIEW with human approval pending. See [Day 5 transitions revision](day-5-transitions-revision.md) and [migration status](migration-status.md). This is evidence for the scoped Day 5 exception only.
