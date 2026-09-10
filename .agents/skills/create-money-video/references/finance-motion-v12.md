# Finance Motion / Data Visualization v1.2

Status: architecture approved, editorial/data-integrity benchmark revision pending visual review. The later review supersedes the earlier production-lock status. Follow `editorial-data-integrity.md`; Day 1–3 approved production MP4s are immutable and Day 4–7 remain stopped.

## Semantic data-viz selection

A numeric value does not automatically require a chart. Choose the visual model from the relationship the approved content actually supports:

- one standalone fact → stat/number reveal may be sufficient;
- comparison or gap → shared-scale bar/comparison;
- accumulation → retained stack or progression;
- frequency → timeline/repetition;
- state change → balance/gauge/stateful model;
- process → decision flow/process loop.

Use typography when it is the clearest semantic choice. Do not add charts, derived values or unapproved financial data merely to make a composition look richer. Motion variety should come primarily from data growth, accumulation, state mutation, progressive reveal, diagram construction, frequency progression and process flow—not arbitrary wipes, spins or morphs.

## Planning

Approved v2 → semantic analysis → existing archetype → visual model → provenance → phrase-linked events → semantic transitions → shared HyperFrames primitives → A–J and duration → MP4/frame QA.

Typography is a considered fallback, not the default for every idea. Consider charts, diagrams, accumulation, comparison, stateful objects, flows and timelines. Sequences may span contiguous approved audio slices without destroying their DOM state. Never alter audio/WordBoundary for layout convenience.

Read `docs/master-template-v1.2-audit.md` for the completed reference/component audit. Reference media are VISUAL_REFERENCE_ONLY: no copy, financial numbers/claims, labels, CTA, brand or 1:1 layout may enter production. In particular, reference arithmetic does not authorize a derived total.

## Contracts and runtime

`data_visualizations.json` uses strict `FinancePlanSchema` in `src/contracts/finance-motion.ts`. Set `script.metadata.visualSystem` to `1.2`; missing sidecar must FAIL. Every numerical datum requires exact approved scene/span/value/unit/qualifier provenance. Approved-derived data additionally needs literal inputs, formula, spans, output and a matching external user approval record passed to the compiler. Planner data cannot self-approve a derivation. No approval → `DERIVED_DATA_APPROVAL_REQUIRED`, no silent calculation or skip. Unsupported numeric notation FAILS, not guesses.

Conceptual elements use exact approved copy spans or unlabeled shapes, not invented psychology labels. Geometry must not strengthen a claim: common zero baseline, scale, orientation and units for compared bars; preserve “almost” as qualified metric copy rather than an exact-magnitude bar. No invented dates, frequencies, balances, projections or intermediate financial labels.

Five opt-in primitives live in `finance-renderer.ts`, `finance.css` and `finance-animations.js`: data bar; retained stack item; counted-marker track; node/path; exact metric reveal/steps. Bar updates support validated balance decreases; comparison reuses common-scale bars; decision and loop reuse nodes/paths. No new chart library or eight parallel full-template systems.

Events reference approved scene/spoken spans; resolve timing from existing `transcript.json` WordBoundary. Missing/ambiguous/out-of-sequence phrases, early numbers, mutation before reveal and missing targets must FAIL. Numerical elements start hidden; each sequence needs a readable non-numeric entry state to avoid blank boundaries. Shared outro/profile behavior remains separate.

Keep `number_highlights.json` as the emphasis authority; provenance does not replace it. Benchmark validation verifies that highlight timing matches actual plotted events. No hard-coded event timestamps, Whisper, new TTS or silent rewrite.

Transitions derive from meaning: new topic → 180ms crossfade; same object → state update/focus; accumulation → push/stack; comparison → split/expand; validated major metric → restrained punch; process/timeline → directional progression. No random selection, decorative pulse quota or invented counter values.

During dense narration, consider meaningful events about every 1.5–3s when semantics justify them, not by timer. Subtitle changes, shimmer and idle floating do not count. Preserve v1.1 archetypes/history/H thresholds and adjacent-composition rules. Finance events feed the existing long-hold heuristic via `financeVisualCues`; also review full visual sequences so audio-slice boundaries are not mistaken for visual resets.

## Validation and review

I_FINANCE_DATA_VIZ rejects missing/invented provenance, reference inputs, unapproved derivation, changed units/qualifiers and misleading scales. J_MOTION_SEMANTICS rejects uncommunicated models or functionally static major multi-beat sequences without justification; low density and unmotivated typography may WARN. Deliberate minimalism is not automatically FAIL. Schema/GSAP tests are not proof of rendered pixels.

A–H remain mandatory. New I/J must be supplied together; FAIL blocks, WARNING requires review. v1.2 benchmark uses PRODUCTION_DURATION; legacy I_PRODUCTION_DURATION remains enforced for backward compatibility. Do not weaken duration thresholds or source gates.

Mobile primitive bounds are x70–1010, y240–1340, copy40px or larger, max5 count markers. One takeaway per state; no dense dashboard/table or tiny axes. Bounds checks do not prove actual text fits: inspect MP4 frames for clipping, overlap, subtitle collisions, stale states, early values and transition flashes.

Day1 benchmark: `npx tsx scripts/plan-day1-finance-benchmark.ts`, then `npx tsx scripts/render-finance-benchmark.ts --render`. Destination: `output/benchmarks/day-1-v12/`. Runner reuses byte-identical voice/transcript/ASS/SRT plus approved AAC packets; no TTS. It runs full tests, validates and checks baseline hashes. Day1 planner is editorial configuration, not hard-coded shared renderer behavior. Do not write canonical history before user review.

QA: use `scripts/qa-money-video.py` with the authorized benchmark directory, Pillow and FFmpeg. Review overall, hook, every boundary±300ms, metrics, motion/data-viz/transition sheets, outro through final frame and full-frame scan. The current editorial patch requires all 12 acceptance answers with evidence; stop at READY FOR VISUAL REVIEW. Earlier benchmark runner/reuse instructions above describe historical v2 only and cannot be used to substitute old audio for corrected v2.1 narration.
