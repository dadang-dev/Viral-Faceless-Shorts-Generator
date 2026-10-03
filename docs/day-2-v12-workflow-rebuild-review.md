# Day 2 v1.2 — Workflow rebuild / READY FOR VISUAL REVIEW

Human approval is PENDING. Only Day 2 was rendered. Day 1 R2, legacy Day 1–3 and the prior Day 2 benchmark remain unchanged. No Day 3–7 work; no architecture/version or runtime/model changes.

## Result

- MP4: [video](../output/benchmarks/day-2-v12-workflow-rebuild/video.mp4), 60.800000s, 1080×1920, 30fps, 1824 decoded frames.
- SHA256: `f88f9ed2212c22d88cd15501094d445fde2682ca7a1e02133573fb43f6c415cc`.
- Tests: 272 Node + 25 Python PASS; typecheck, frontend build/lint PASS; skill validator PASS.
- Real Chrome/GSAP 3.14.2: 773 temporal samples, zero reported geometry failures; Anton/Inter loaded, HTML hash verified.
- All-frame luminance checks: zero black/white/abrupt-luma flags. Low-detail flags at intentional handoffs remain advisory, not proof of blankness.
- Protected files: 44 fresh hash comparisons PASS.

## Visual decisions and root causes

1. Centered source-exact 6 MONTHS/calendar reveal replaces duplicate SIX MONTHS LATER canvas copy. The wallet clears before it enters; the complete phrase remains in karaoke captions.
2. One retained apartment/car/food accumulation; no diagonal connectors. Spending/income use growing underline tracks, not outlined text cards, with no quantitative scale.
3. Removed the IT'S NOT ONE BIG DECISION sentence card: it produced a ghosted foreground during the old 10s handoff. Narration remains unchanged in subtitles.
4. Opening raise headline now fades from its final WordBoundary (4.593s), completes at 4.773s, before broke begins at 5.012s. Planner explicitly rejects overlapping handoff timings; wallet/navy/brand remain visible.
5. Wanted/could labels increased to 48px, centered below separate icons; metric/payoff parents enlarged to contain real Anton glyph ink.
6. QA previously substituted a simplified timeline for real GSAP and could measure fallback fonts. The sampler now requires real GSAP/loaded fonts, measures scaled glyph overflow against the semantic parent, and binds evidence to HTML hash. Missing frame extraction now FAILS rather than substituting a late frame.

## Gates

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

H uses existing history/thresholds; full comparison details are in [validation report](../output/benchmarks/day-2-v12-workflow-rebuild/validation-report.json). Automated checks are not human approval. Shared render/runtime code was not changed in this rebuild.

## Scene plan and provenance

Primary concept-story; secondary accumulation. Eleven unchanged audio slices form six persistent visual sequences: raise/time jump → retained lifestyle accumulation → qualitative parallel rise → deprivation reframe → wanted/could fork → question payoff. Scene-specific changes reduce sentence cards while retaining the approved v1.2 visual vocabulary.

Every main-canvas string and source span: [editorial inventory](../output/benchmarks/day-2-v12-workflow-rebuild/editorial-validation.json). Full analysis: [analysis](../output/benchmarks/day-2-v12-workflow-rebuild/full-script-analysis.json). Phrase-linked events: [resolved plan](../output/benchmarks/day-2-v12-workflow-rebuild/resolved-finance-plan.json).

## Exact approved voiceText

Here's something that messes with almost everyone: you can get a raise, and still feel broke six months later. That's called lifestyle creep. It's not one big decision. It's a slightly nicer apartment — two hundred dollars more a month because 'I can afford it now.' It's upgrading from a used car to a new lease. It's ordering the appetizer AND dessert instead of just picking one, because why not. Each choice feels small and reasonable in the moment. But stack them up, and your spending rises exactly as fast as your income — sometimes faster. The fix isn't depriving yourself. It's just noticing: did my spending go up because I actually wanted this, or because I could? That one question, asked honestly, catches more leaks than any budgeting app.

## Number highlights

```json
{
  "version": "1.0",
  "day": 2,
  "source": "money-habits-script-v2.1-verified.md",
  "items": [
    {
      "id": "six-months",
      "sceneId": "scene-2",
      "spokenPhrase": "six months later",
      "canonicalText": "six months later",
      "displayText": "6 MONTHS",
      "context": "six months later",
      "target": "stat.value",
      "template": "stat-hero"
    },
    {
      "id": "apartment-increase",
      "sceneId": "scene-4",
      "spokenPhrase": "two hundred dollars",
      "canonicalText": "two hundred dollars",
      "displayText": "$200 / MONTH",
      "context": "more a month",
      "target": "stat.value",
      "template": "stat-hero"
    }
  ]
}
```

Timing resolves only from the reused canonical-matching Edge TTS AndrewMultilingualNeural WordBoundary transcript. No TTS regeneration, silence padding or narration edits.

## Theme

navyDeep #071426; navySurface #0D2038; navyRaised #132B47; textPrimary #F5F1E8; textMuted #C9C2B5; accentGold #D7A928; accentAmber #F2C14E. Uppercase captions; current word gold, previous words return off-white. Global 180ms baseline unchanged.

## Review evidence and limitations

Inspected groups: day2-timeline-00, day2-timeline-20, day2-timeline-40, day2-timeline-60, day2-dense-caption-bridge, day2-dense-clear-raise-on-broke, day2-dense-metric-secondary, day2-dense-metric-pressure, day2-dense-wanted, day2-dense-could, day2-dense-payoff-clear-copy, boundaries-1, boundaries-2, boundaries-3, boundaries-4, six-months, apartment-increase, long-hold-scene-8, outro-6. See [observations](../output/benchmarks/day-2-v12-workflow-rebuild/review-observations.json), [MP4-bound QA](../output/benchmarks/day-2-v12-workflow-rebuild/release/qa-manifest.json), [temporal QA](../output/benchmarks/day-2-v12-workflow-rebuild/release-temporal-collision-report.json). Inspection uses decoded frames across the full timeline and dense event frames, not a claim of uninterrupted human playback. Sampling does not mathematically prove every possible collision; no blocking finding remains in the inspected frames. Human pacing/aesthetic approval remains pending.

## Files changed this rebuild

- DAY2-BENCHMARK-ONLY: scripts/prepare-day2-v12.ts, scripts/plan-day2-v12.ts, scripts/render-day2-v12.ts, scripts/report-day2-workflow-rebuild.ts; generated isolated benchmark sidecars/video/QA.
- QA tooling: scripts/qa-temporal-collision.ts, scripts/qa-money-video.py.
- Regression/fixture tests: src/contracts/visual-collision.test.ts, src/contracts/day2-v12.test.ts.
- Docs: this report, docs/migration-status.md, docs/master-template-v1.2-rule-lock-audit.md.
- AGENTS.md and workflow.md were read and followed, not rewritten in this render task. Existing unrelated worktree edits were preserved.

## Workflow handoff

STEPS 0–9 complete: context/scope, exact source, analysis/plan, preflight, implementation, isolated render, A–J/tests, temporal/frame QA, provenance and review artifacts. STEP 10: STOP for user review. STEP 11/next-Day work NOT AUTHORIZED.
