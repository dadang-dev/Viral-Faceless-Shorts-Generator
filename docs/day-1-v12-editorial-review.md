# DAY 1 v1.2 EDITORIAL/DATA-INTEGRITY PATCH — READY FOR VISUAL REVIEW

Architecture remains v1.2. No v1.3, no engine redesign, no production Day 1–3 rerender and no Day 4–7 render. This benchmark awaits the user's independent visual review, not production approval.

## Source revision and exact diff

Canonical: `money-habits-script-v2.1-verified.md`. Historical v2 remains untouched. Exactly three Day 1 substitutions; Day 2–7 are byte-identical. The original document heading remains historical wording to avoid a fourth unrequested source edit.

```diff
- But ten dollars, four nights a week, is more than most people's entire grocery budget.
+ But ten dollars, four nights a week, is about a hundred and seventy dollars a month.
- Number three: rounding down in your head.
+ Number three: rounding it off in your head.
- Do that three times a week, and you've quietly spent almost three hundred dollars a month on 'basically nothing.'
+ Do that three times a week, and you've quietly spent over two hundred dollars a month on 'basically nothing.'
```

Source SHA256: `0d79277b3c72d59aa41bb0c5848e3ebd59303ab3971b61dd4353deef52639d4f`.

## Root causes

Root causes addressed: historical Day 1 itself contained an unsupported budget comparison and inconsistent monthly arithmetic/rounding terminology; literal provenance alone did not reconcile relationships. The previous visual plan promoted narration into main-canvas fragments, represented app total as an additive group, delayed meaningful chapter objects, and used a comparison gap/linked sentence boxes for the wrong semantics. Caption rendering lacked scoped full-hero coverage. Frame QA additionally exposed an object path over a price, superimposed metric-update glyphs, and a frame-zero CSS state awaiting GSAP. Fixes stay within the existing v1.2 primitives and opt-in editorial mode.

## Exact final voice-over

You're not bad with money. You just have three habits working against you without you noticing. Number one: subscription creep. That's fourteen dollars for a streaming app, nine for a fitness app, five for cloud storage you forgot you even signed up for — until you're paying for five apps you forgot existed. Number two: convenience spending. Every 'I'll just order it, I'm tired' feels like ten dollars in the moment. But ten dollars, four nights a week, is about a hundred and seventy dollars a month. Number three: rounding it off in your head. You think of an eighteen-dollar coffee run as 'like twenty bucks.' Do that three times a week, and you've quietly spent over two hundred dollars a month on 'basically nothing.' None of these make you careless. They just run quietly in the background. This week, try naming just one of them out loud. That's it. Naming it is the first habit you break.

Edge TTS en-US-AndrewMultilingualNeural, speed 0.8 / rate -20%. Only scenes 8, 9 and 11 were resynthesized; unchanged original scene audio/WordBoundary cues reused. New transcript offsets, full voice track and captions rebuilt. No Whisper and no reference-derived voice or data.

## Output and duration

- Video: `output/benchmarks/day-1-v12-editorial/video.mp4`.
- Measured video duration: **63.933s**, 1080×1920, 30fps.
- MP4 SHA256: `9474bf69306690cf681401ade8c0842946daca31ad41706273341ecf981a676c`.
- Last spoken WordBoundary: 60.881s. CTA/profile begins 61.001s. Purposeful final profile dwell; no narration padding or speed change.
- Caption coverage: `output/benchmarks/day-1-v12-editorial/caption-coverage.json`; only opening, full hook and full reframe use exact hero-carried captions. Other spoken words remain bottom captions, active word gold.

## Scene / visual-model plan

| Time (s) | Sequence | Model / meaning |
| --- | --- | --- |
| 0.000–1.557 | opening | A complete source-exact reassurance is carried by one readable typography hero. |
| 1.377–6.095 | hook | Three habits is the dominant payload; all remaining exact words are subordinate, without decorative loop icons. |
| 5.915–20.878 | subscriptions | The original three priced app objects are retained and two anonymous app objects join, yielding five total, never eight. |
| 20.698–34.144 | convenience | A single order price becomes four marked positions in a seven-position week and the approved approximate monthly consequence. |
| 33.964–48.857 | rounding | One coffee price changes to its approximate mental label; the same object then joins three weekly events and the approved over-two-hundred monthly impact. |
| 48.677–51.026 | reframe | Source-exact reassurance is intentionally emphasized without a decorative card or duplicate caption. |
| 50.846–60.925 | awareness | Three established habit categories become dim background entities; a generic attention object moves into foreground without selecting a habit for the viewer. |
| 61.001–63.933 | Post-speech CTA | COMMENT 1, 2, OR 3; numbered app/order/coffee reminders; retained profile/follow card. No giant duplicate brand wordmark. |

## Text inventory

Time ranges describe the principal visible state; normal 180ms chapter fades and metric state-update tweens overlap at their edges. Source spans and exact motion events remain in resolved-finance-plan.json. The $18 state ends at the ~$20 update (40.317s), not at the end of the rounding sequence.

| Time (s) | Main text | Role | Spoken? | Subtitle duplicate? | Keep/remove reason |
| --- | --- | --- | --- | --- | --- |
| 0.000–1.557 | YOU'RE NOT BAD WITH MONEY. | HERO | YES | NO — full exact phrase carried by hero | HERO; source: You're not bad with money. |
| 1.377–6.095 | YOU JUST HAVE | HERO | YES | NO — full exact phrase carried by hero | HERO; source: You just have |
| 1.377–6.095 | 3 HABITS | HERO | YES | NO — full exact phrase carried by hero | HERO; source: three habits |
| 1.377–6.095 | WORKING AGAINST YOU WITHOUT YOU NOTICING | HERO | YES | NO — full exact phrase carried by hero | HERO; source: working against you without you noticing |
| 5.915–20.878 | NUMBER ONE | SECTION_MARKER | YES | Category/number repeated intentionally as persistent structure | SECTION_MARKER; source: Number one |
| 5.915–20.878 | SUBSCRIPTION CREEP | SECTION_MARKER | YES | Category/number repeated intentionally as persistent structure | SECTION_MARKER; source: subscription creep |
| 9.111–20.878 | STREAMING APP | DATA_LABEL | YES | Source label; sentence remains in subtitle | DATA_LABEL; source: streaming app |
| 9.111–20.878 | $14 | DATA_LABEL | YES | Numeric data label; subtitle carries full spoken clause | Quantitative information; source: fourteen dollars |
| 11.752–20.878 | FITNESS APP | DATA_LABEL | YES | Source label; sentence remains in subtitle | DATA_LABEL; source: fitness app |
| 11.752–20.878 | $9 | DATA_LABEL | YES | Numeric data label; subtitle carries full spoken clause | Quantitative information; source: nine |
| 13.756–20.878 | CLOUD STORAGE | DATA_LABEL | YES | Source label; sentence remains in subtitle | DATA_LABEL; source: cloud storage |
| 13.756–20.878 | $5 | DATA_LABEL | YES | Numeric data label; subtitle carries full spoken clause | Quantitative information; source: five for cloud storage |
| 18.803–20.878 | 5 APPS | DATA_LABEL | YES | Numeric data label; subtitle carries full spoken clause | Quantitative information; source: five apps |
| 20.698–34.144 | NUMBER TWO | SECTION_MARKER | YES | Category/number repeated intentionally as persistent structure | SECTION_MARKER; source: Number two |
| 20.698–34.144 | CONVENIENCE SPENDING | SECTION_MARKER | YES | Category/number repeated intentionally as persistent structure | SECTION_MARKER; source: convenience spending |
| 27.182–34.144 | $10 | DATA_LABEL | YES | Numeric data label; subtitle carries full spoken clause | Quantitative information; source: ten dollars |
| 29.910–34.144 | 4 NIGHTS A WEEK | DATA_LABEL | YES | Numeric data label; subtitle carries full spoken clause | Quantitative information; source: four nights a week |
| 31.863–34.144 | ABOUT $170 / MONTH | DATA_LABEL | YES | Numeric data label; subtitle carries full spoken clause | Quantitative information; source: about a hundred and seventy dollars a month |
| 33.964–48.857 | NUMBER THREE | SECTION_MARKER | YES | Category/number repeated intentionally as persistent structure | SECTION_MARKER; source: Number three |
| 33.964–48.857 | ROUNDING IT OFF IN YOUR HEAD | SECTION_MARKER | YES | Category/number repeated intentionally as persistent structure | SECTION_MARKER; source: rounding it off in your head |
| 38.051–48.857 | $18 | DATA_LABEL | YES | Numeric data label; subtitle carries full spoken clause | Quantitative information; source: eighteen-dollar |
| 42.421–48.857 | 3 TIMES A WEEK | DATA_LABEL | YES | Numeric data label; subtitle carries full spoken clause | Quantitative information; source: three times a week |
| 45.593–48.857 | OVER $200 / MONTH | DATA_LABEL | YES | Numeric data label; subtitle carries full spoken clause | Quantitative information; source: over two hundred dollars a month |
| 40.317–48.857 | ~$20 | DATA_LABEL | YES | Data state | Same-object mental price label; source: like twenty bucks |
| 48.677–51.026 | NONE OF THESE MAKE YOU CARELESS. | HERO | YES | NO — full exact phrase carried by hero | HERO; source: None of these make you careless. |
| 61.001–63.933 | COMMENT 1, 2, OR 3 | CTA | NO | NO | Approved engagement metadata: Comment 1, 2, or 3 — which habit is yours? |
| 61.001–63.933 | 1 / 2 / 3 | CTA | NO | NO | Approved numbered reminders; semantic subscription/order/coffee icons |
| 0–63.933 | Money Habits / DAILY HABITS / @moneyhabits | STRUCTURAL_LABEL | NO | NO | Existing approved brand/config; footer yields to profile |
| 61.001–63.933 | Money Habits / @moneyhabits / US TikTok / Follow → Following | CTA | NO | NO | Retained approved profile config and platform UI |

Removed main fragments: YOU FORGOT YOU EVEN SIGNED UP FOR; DO THAT; YOU'VE QUIETLY SPENT; BASICALLY NOTHING; quote-as-card; fake linked sentence boxes; giant duplicate brand wordmark / 3 SPENDING HABITS. Their valid spoken wording remains in captions where appropriate. Unsupported grocery claim, rounding-down contradiction and old almost-300 outcome do not appear in corrected VO/captions/composition. Historical source and protected historical regression artifacts remain explicitly historical, not silently rewritten.

## Numeric integrity

| Relationship | Inputs | Displayed result | Validation | Provenance |
| --- | --- | --- | --- | --- |
| order-monthly | $10 × 4 NIGHTS A WEEK × 52/12 | ABOUT $170 / MONTH | PASS; computed 173.333/month (validation only) | Explicit corrected Day 1 source literal; not reference PDF |
| coffee-monthly | $18 × 3 TIMES A WEEK × 52/12 | OVER $200 / MONTH | PASS; computed 234.000/month (validation only) | Explicit corrected Day 1 source literal; not reference PDF |
| Old monthly relation | $18 × 3/week | ALMOST $300 / MONTH | REMOVED / INVALID: 234 is not almost 300 | Negative regression test; never shown in corrected benchmark |

All eleven metric phrases resolve from transcript.json and number_highlights.json. ABOUT and OVER remain visible. ~$20 is the mental state, not the actual purchase cost used for monthly validation. The original app rows become three of five objects; only two anonymous objects join. The original order/coffee object moves into the first weekly slot; the marker track adds only the remaining events. No quantitative bars or arbitrary scale are used in this benchmark; shared-scale regression tests remain active.

## Validation and tests

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
| J_MOTION_SEMANTICS | WARNING |
| PRODUCTION_DURATION | PASS |

Editorial subchecks: TEXT_ROLE=PASS; VISIBLE_TEXT_REDUNDANCY=PASS; HERO_HIERARCHY=PASS; SECTION_HIERARCHY=PASS; CHAPTER_DEAD_AIR=PASS; ICON_SEMANTICS=PASS; VISUAL_MODEL_VALIDITY=PASS; QUANTITY_AMBIGUITY=PASS.

Tests: **248 Node/Vitest + 25 Python = 273 PASS; 0 FAIL**. Typecheck, frontend build/lint and skill validator PASS. New tests cover the exact three-source diff, Day 2–7 byte preservation, numeric qualifiers/math (including old-300 rejection), source mixing, scoped-caption completeness/resumption/safe bounds, chapter stalls, icon semantics, hook hierarchy and app/order quantity ambiguity.

J retains the reported LOW_MOTION_DENSITY warning for a 5.047s subscription hold during the forgetting clause. This is not hidden or converted to automated PASS: the priced stack intentionally remains available before the five-app expansion; no arbitrary motion was added to meet a quota. Chapter dead-air checks all PASS. HyperFrames also emits a nonblocking HTML-size advisory; no engine split/redesign was undertaken.

## Frame QA and muted comprehension

Final MP4-bound QA: `output/benchmarks/day-1-v12-editorial/qa-editorial-final/qa-manifest.json`; 49 groups, 627 sampled frames, 1918 frames scanned for coarse luma anomalies. Exact frames, chapter 30fps sequences, caption-span ends, data states and CTA handoff are in that directory.

- Final QA manifest SHA-256 matches the rendered MP4 SHA-256 exactly.
- All 1,918 rendered frames were scanned: no black frames, white flashes or abrupt mean-luma changes were detected.
- The chapter marker sheets confirm semantic objects enter only after NUMBER ONE/TWO/THREE has contracted into the persistent header; no title/icon collision remains.
- The subscription state reads as five total app objects, the order object does not cross the $10 label, and the $18 to ~$20 update has no superimposed glyph state.
- The weekly models visibly use seven positions with four order events and three coffee events; ABOUT and OVER qualifiers remain visible in the monthly payoffs.
- The reframe uses established habit entities and a generic naming spotlight; it does not preselect a viewer-specific habit.
- The CTA starts after the last spoken WordBoundary with a clean foreground handoff; no ghost narration text, blank frame or duplicate giant brand stack appears.
- The automated low-detail flags correspond to intentionally sparse reframe/awareness and end-of-narration frames, not blank or failed renders.

Muted comprehension: retained named subscriptions + two anonymous app objects indicate five total; a seven-position week with four order events connects $10 to ABOUT $170/MONTH; same coffee object changes $18 to ~$20 and becomes three weekly events before OVER $200/MONTH; dim habit entities plus generic naming spotlight communicate bringing an unnoticed habit into awareness without assigning a category to the viewer.

## Acceptance answers

1. Is 3 HABITS unmistakably the hook payload? **YES** — The frame-zero hook and 0–6s contact sheet show 3 HABITS as the largest central type, with supporting copy smaller and no decorative loop icons.
2. Are NUMBER ONE/TWO/THREE real chapter markers? **YES** — Each marker begins as dominant chapter typography, then contracts into the persistent header before its semantic object appears; frame-by-frame sheets show clean ordering.
3. Has transcript-like main text redundancy been removed? **YES** — Narrative fragments such as YOU FORGOT..., DO THAT, YOU'VE QUIETLY SPENT and BASICALLY NOTHING are absent from the main canvas; regular narration remains in subtitles.
4. Do all primary icons have semantic meaning? **YES** — Primary icons map to streaming, fitness, cloud/app, takeout order, coffee and naming/voice awareness; no generic circular-arrow habit icons remain.
5. Does the subscription visual clearly mean five TOTAL apps? **YES** — The final subscription state contains the three named app objects plus exactly two anonymous app objects beside 5 APPS, not three plus five.
6. Is the grocery-budget unsupported claim completely removed? **YES** — It is absent from the corrected voice source, transcript, subtitles, visual plan and rendered frames; the supported ABOUT $170 / MONTH relation replaces it.
7. Is the rounding down contradiction removed? **YES** — Chapter three consistently reads ROUNDING IT OFF IN YOUR HEAD while preserving the approved $18 to ~$20 mental-state example.
8. Is $300/month completely removed? **YES** — No corrected source, transcript, subtitle, scene-plan or rendered frame displays $300/month; the payoff is OVER $200 / MONTH.
9. Do all numeric relationships reconcile? **YES** — $10 × 4/week × 52/12 = about $173 supports ABOUT $170; $18 × 3/week × 52/12 = $234 supports OVER $200.
10. Are diagrams/models explaining relationships rather than decorating text? **YES** — The subscription stack, seven-slot weekly frequency models, same-object price mutation and background-to-foreground awareness state all encode entities or state change; fake sentence-box flow is gone.
11. Are chapter dead-air gaps eliminated? **YES** — First semantic objects enter 0.734s, 0.797s and 0.797s after the three marker starts; frame sequences show continuous marker contraction into content.
12. Does the video remain recognizably Money Habits and premium? **YES** — The final full-timeline sheet retains the deep-navy, off-white and restrained gold system, consistent lockup, precise finance typography and semantic motion.

## Protected production outputs

All 13 protected historical source/audio/transcript/subtitle/video hashes match before and after. Full values: `output/benchmarks/day-1-v12-editorial/baseline-preservation.json`.

| Production video | SHA256 |
| --- | --- |
| output/day-1/video.mp4 | 52afb46ae4d478a3f396514be9527fedcc830db4f754133dc0ed4a83ba90a8c8 |
| output/day-2/video.mp4 | c237b02e5869c11c0681fb093dd03d0e702fffaf3d937a8f6fe30fbac34850c5 |
| output/day-3/video.mp4 | ca272c19f0ea841b04dec0a539a5e979b198b542bbf132d664554c54228abf23 |

## Files changed

- `money-habits-script-v2.1-verified.md`
- `config.yaml`
- `src/contracts/content-contract.ts`
- `src/contracts/finance-motion.ts`
- `src/contracts/numeric-relationships.ts`
- `src/contracts/hero-captions.ts`
- `src/contracts/editorial-validation.ts`
- `src/contracts/source-revision.test.ts`
- `src/contracts/editorial-validation.test.ts`
- `src/contracts/finance-motion.test.ts`
- `src/render/finance-renderer.ts`
- `src/render/finance-renderer.test.ts`
- `src/render/html-composer.ts`
- `src/render/templates/finance.css`
- `src/render/templates/finance-animations.js`
- `src/render/templates/animations.js`
- `src/pipeline.ts`
- `src/pipeline-production.test.ts`
- `tests/test_core.py`
- `scripts/revise-day1-source.ts`
- `scripts/prepare-day1-editorial.ts`
- `scripts/plan-day1-editorial.ts`
- `scripts/render-day1-editorial.ts`
- `scripts/report-day1-editorial.ts`
- `scripts/qa-money-video.py`
- `scripts/plan-day1-finance-benchmark.ts`
- `scripts/render-finance-benchmark.ts`
- `.agents/skills/create-money-video/SKILL.md`
- `.agents/skills/create-money-video/references/finance-motion-v12.md`
- `.agents/skills/create-money-video/references/editorial-data-integrity.md`

Generated benchmark assets/reports are confined to `output/benchmarks/day-1-v12-editorial/`. Unrelated pre-existing dirty worktree changes were preserved. The Money Habits skill now selects the verified canonical revision, records editorial/numeric/caption/quantity gates and holds production batch pending review.

## Remaining issues and stop boundary

No blocking issue in this agent's frame review. The explicit J hold warning and HTML-size advisory remain disclosed above. Independent user visual approval is still pending. Architecture remains v1.2; no production approval is asserted. STOP: do not render Day 4–7 or modify approved Day 1–3 production files.
