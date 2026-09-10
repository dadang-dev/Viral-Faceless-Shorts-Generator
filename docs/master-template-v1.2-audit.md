# MASTER TEMPLATE v1.2 — pre-implementation audit

Scope: separate Day 1 benchmark only. Day 1–3 MP4s immutable; Day 4–7 blocked pending review. References are **VISUAL_REFERENCE_ONLY**, never content inputs.

## A. Reference audit

Inspected all 9 raster PDF pages using Poppler, full-duration MP4 contact sheets at 2-second intervals, and 0.5-second motion samples in A 10–19s / B 10–22s. These samples establish visual-state evolution; they are not audio alignment measurements. Production timing must come from the approved transcript, not reference timestamps.

| Reference pattern | Meaning | Reusable principle | Copy directly? |
| --- | --- | --- | --- |
| PDF p2 battery partition | An unseen process consumes a persistent resource | Preserve an object while its state changes; never infer a balance or percentage | NO |
| PDF p3 stacked layers | Separate recurring charges coexist | Introduce items at narration phrases and retain prior items | NO |
| PDF p4 fork | Trigger leads to a choice/consequence | Connect approved nodes; do not invent the alternate outcome | NO |
| PDF p5 paired bars | Perceived/actual magnitude can differ | Shared baseline and scale; keep exact qualifiers and approved direction | NO |
| PDF p6 matrix | Habit/trigger/behavior are related fields | Translate dense rows into sequential mobile states | NO |
| PDF p7–9 process/interrupt | Awareness interrupts an automatic process | Change focus/path state, not new psychology labels or promises of restored money | NO |
| A 10–16s sequential subscription rows | Spoken costs enter one at a time | Phrase-linked object/value introduction; prior rows persist | NO |
| A 22–28s object → price → frequency → consequence | Each spoken development changes the model | Distinct semantic events, not decorative pulse quotas | NO |
| A 34–42s coffee/value/frequency sequence | A numerical relationship unfolds progressively | Delay labels/numbers until their spoken phrase | NO |
| B 8–48s persistent balance with expense groups | Multiple topics can mutate a stable visual state | Reuse the same DOM object across compatible audio boundaries | NO |
| B 50–62s interrupted groups and restored balance | End-state reframe | Learn continuity only; Day 1 does not authorize a numerical balance or guaranteed restoration | NO |

Reference hazards: A introduces a subscription sum; both videos/PDF contain convenience totals and mental-value wording that differ from approved Day 1. None is imported. The approved Day 1 comparison is **18 / “like twenty bucks”**, not 18/15. No arithmetic “correction” of the approved narration is authorized. Its “almost three hundred” remains a quoted literal claim, never a calculated chart total.

Artifacts: `output/benchmarks/reference-audit-v12/` (9 PDF pages, A/B overview and dense motion sheets). Originals remain in `C:/Users/PC/Downloads/`.

## B. Existing-system audit (completed before implementation)

| Proposed vocabulary | Existing support | Decision |
| --- | --- | --- |
| Data bar | CSS scaleX/scaleY and GSAP transform support; no value-linked chart | New bar primitive, reuse transforms/theme |
| Stacked cost | Comparison cards/icons and entrances, but no persistent multi-beat stack | Extend card/icon vocabulary with retained item state |
| Balance drain | No numeric reservoir; same bar geometry is reusable | Configuration of bar state update; require explicit starting/remaining values |
| Accumulation timeline | Approved frequency text only; no visual count track | New counted-marker primitive; no invented weekday/date labels |
| Comparison gap | Two independent cards and metric zoom | Reuse data bar with common baseline/scale; optional unnumbered gap |
| Decision flow | Icons/typography but no connected state path | New node/path primitive |
| Process loop | No persistent active-node/interruption state | Configuration of node/path primitive |
| Number counter/roll | Existing exact metric and restrained 1.1× punch | Extend metric reveal; exact approved steps only, no invented displayed in-between amounts |

Reuse: ScriptSchema, approved-source extraction/integrity, WordBoundary transcript, number_highlights, v1.1 archetypes/history/H, long-hold diagnostics, brand shell, styles/theme, subtitle ASS, outro/profile timing, HyperFrames runner and media QA.

Five reusable finance primitives: bar, retained stack item, counted marker track, node/path, exact metric reveal. Typography remains the existing sixth fallback, not another template system. All are opt-in to preserve legacy HTML/animation behavior.

## Exact approved Day 1 voice-over (read before planning)

You're not bad with money. You just have three habits working against you without you noticing. Number one: subscription creep. That's fourteen dollars for a streaming app, nine for a fitness app, five for cloud storage you forgot you even signed up for — until you're paying for five apps you forgot existed. Number two: convenience spending. Every 'I'll just order it, I'm tired' feels like ten dollars in the moment. But ten dollars, four nights a week, is more than most people's entire grocery budget. Number three: rounding down in your head. You think of an eighteen-dollar coffee run as 'like twenty bucks.' Do that three times a week, and you've quietly spent almost three hundred dollars a month on 'basically nothing.' None of these make you careless. They just run quietly in the background. This week, try naming just one of them out loud. That's it. Naming it is the first habit you break.

## Architecture decision

Approved v2 → exact existing voice/transcript → semantic archetype plan → `data_visualizations.json` → provenance checks → phrase-resolved motion events → semantic transitions → opt-in shared SVG/CSS/GSAP primitives → A–J + duration gate → separate render → frame QA → READY FOR VISUAL REVIEW.

Keep the 15 approved audio slices byte-identical. Visual sequences may span contiguous slices without destroying state; the narration and ASS timeline do not change. A separate benchmark runner must refuse canonical `output/day-N` destinations and reuse audio/transcript/subtitles without TTS.

Gate naming: v1.2 uses I_FINANCE_DATA_VIZ and J_MOTION_SEMANTICS plus descriptive PRODUCTION_DURATION. Legacy I_PRODUCTION_DURATION remains recognized for old reports; no weakening of A–H or duration thresholds.
