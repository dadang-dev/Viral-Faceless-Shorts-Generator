# v1.2 editorial/data-integrity patch

Architecture remains approved; corrected Day 1 benchmark must stop at READY FOR VISUAL REVIEW. No Day 4–7 render, no v1.3, no engine redesign, no changes to protected production Day 1–3 MP4s. Use `output/benchmarks/day-1-v12-editorial/`, distinct from the historical benchmark.

## Source and financial logic

Canonical source is `money-habits-script-v2.1-verified.md`; old v2 remains historical. Only the explicitly approved three Day 1 corrections are authorized: grocery-budget comparison becomes about $170/month; rounding down becomes rounding it off; almost $300 becomes over $200/month. Preserve Day 2–7 bytes. Regenerate changed voice slices with AndrewMultilingualNeural at -20%; rebuild WordBoundary transcript and subtitles. No source/TTS fallback.

Literal provenance is necessary but insufficient. I_FINANCE_DATA_VIZ must also check NUMERIC_RELATIONSHIP_INTEGRITY: $10 × 4/week × 52/12 ≈ $173 supports ABOUT $170; $18 × 3/week × 52/12 = $234 supports OVER $200, not ALMOST $300. Calculations used for validation do not authorize extra visible totals. Preserve qualifiers. Consistent numeric scale is mandatory for any quantitative bar, length or area.

## Editorial semantics

Every semantic main-canvas string needs HERO, SECTION_MARKER, DATA_LABEL, STRUCTURAL_LABEL or CTA role and exact source/config provenance. Regular narration belongs in subtitles, not extra sentence cards. Remove transcript fragments such as DO THAT and YOU'VE QUIETLY SPENT. Do not replace them with invented headlines.

3 HABITS dominates the hook; supporting words are subordinate. Primary icons identify real categories/objects; circular refresh arrows cannot stand for unrelated habits. Chapter NUMBER ONE/TWO/THREE is large, then settles into a persistent header as its first meaningful object begins within roughly 0.8–1.2 seconds. CHAPTER_DEAD_AIR_WARNING blocks editorial acceptance when a chapter stalls.

Subscription: retain three named app objects ($14/$9/$5), add two anonymous objects, exactly five total. Never retain three expense rows plus five additional app icons. Convenience: order object → $10 → seven-position week with four highlighted nights → ABOUT $170/MONTH. Rounding: actual $18 → mental ~$20 on the same price/object → three weekly events → OVER $200/MONTH; no misleading $2-loss emphasis or DO THAT reset.

When the original purchase becomes the first weekly event, do not also draw an extra copy in that slot. Check the object's travel path as well as its final bounds: it must not cross/obscure a readable price. Exact metric-label updates should hand off old → new without superimposed numerical glyphs. Opening HERO must be readable from frame zero even before the first GSAP seek; preserve this as an opt-in initial state, not a change to legacy transitions.

Diagrams must represent entities, states, relationships, decisions or progression—not linked sentence fragments. Reframe NONE OF THESE MAKE YOU CARELESS is an intentional typography hero. Established habit objects recede into a dim background, then one generic attention/selection object comes forward without assigning a habit to the viewer.

CTA follows final spoken WordBoundary: COMMENT 1, 2, OR 3 with small numbered subscription/order/coffee reminders and retained profile/follow card. Do not duplicate giant brand wordmarks. Global 180ms crossfade remains; within chapters use semantic state mutation, not arbitrary transitions for variety.

## Final deep visual/editorial production rules

Keep the 180ms ambient/background crossfade, but apply the reusable dominant foreground handoff whenever adjacent HERO, SECTION_MARKER, major DATA_VIZ or major CTA systems would otherwise be readable together. Fade the outgoing semantic foreground below the readable threshold, allow at most a very short clean interval over the persistent navy/brand layer, then reveal the incoming semantic foreground. Do not hard-code reviewed timestamps. `DOMINANT_LAYER_COLLISION` must report the transition profile and zero readable semantic overlap.

Caption grouping is scene-, sentence- and chapter-aware. Never flatten words across scene boundaries. Full exact SECTION_MARKER spans may carry their own captions just like HERO spans; suppress only the transcript-linked marker words and resume normal karaoke on the following narration. A SECTION_MARKER foreground must enter from its own WordBoundary and only after the preceding chapter's final caption word has cleared; a clean subtitle chunk alone is insufficient if the rendered frame still visually reads like `MONTH NUMBER THREE`. Verify this with exact frame indexes, not timestamp-seek contact sheets alone. Explicitly reject combinations such as `EXISTED NUMBER TWO` and `MONTH NUMBER THREE` with `CAPTION_BOUNDARY_INTEGRITY` and `SECTION_CAPTION_REDUNDANCY` tests.

Use narration meaning to prevent static holds: subscription rows progressively recede during the forgetting clause, then restore/consolidate before exactly two additional app objects complete the five-app total. Convenience should show a real order action/state progression before `$10` is spoken. Calm naming/microphone motion remains `LONG_HOLD_OK` when background habits recede and the naming state activates.

Weekly frequency is count-only unless the approved source names particular days. Use seven neutral unlabeled positions with the approved count active and record `frequencyMode: count-only`; never imply Monday–Thursday or another invented schedule. Enforce `TEMPORAL_SPECIFICITY_INTEGRITY` under I.

When an actual and mental value differ, preserve them as separate simultaneous semantic states. For Day 1, `$18` stays anchored as the exact transaction and `~$20` appears as a secondary mental overlay; repeated purchase objects and the monthly result derive from the actual purchase state. A mental value must not replace the actual value. Enforce `ACTUAL_VS_MENTAL_INTEGRITY`.

For future editorial v1.2 renders, omit the persistent bottom handle when the top-left lockup and final profile/follow card are present. This is opt-in cleanup and must not alter legacy or protected MP4s.

## Scoped captions and acceptance

Default subtitles remain enabled, uppercase and active-word gold. Hero-carries-caption may suppress only an exact full spoken phrase represented by readable HERO/SECTION_MARKER elements throughout its transcript-linked span. Reject missing words, partial-word suppression, unapproved copy, unsafe bounds or early disappearance. Test normal scenes, exact coverage, span end and subtitle resumption. If safety cannot be established, keep subtitles and remove unnecessary main copy.

Integrate TEXT_ROLE, VISIBLE_TEXT_REDUNDANCY, HERO_HIERARCHY, SECTION_HIERARCHY, CHAPTER_DEAD_AIR, ICON_SEMANTICS, VISUAL_MODEL_VALIDITY and QUANTITY_AMBIGUITY under existing A–J. Run full current suite, typecheck, skill validator, numeric and caption tests, and protected hashes. Automated declarations are not visual proof: inspect actual MP4 across full timeline plus all boundaries, and perform muted comprehension checks. Report text inventory, numeric relationship evidence, exact source diff/VO, duration, QA paths and remaining issues. Only after all requested acceptance questions are supported may status be READY FOR VISUAL REVIEW—not production approved.
