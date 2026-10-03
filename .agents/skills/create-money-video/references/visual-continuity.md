# Visual continuity and scene regrouping

Apply within MASTER TEMPLATE v1.2 using existing primitives. Read current migration status for authorization and artifact paths. A preview is not automatically human-approved production.

## Objects and meaning

Use one evolving model per semantic sequence. Retain the same subscription, order or purchase while revealing its price, repetition and consequence. Icons identify the object; they do not by themselves establish a relationship. Prefer state mutation, accumulation and progression to grids of unrelated symbols.

Keep the story layer distinct from the caption and effects layers. For each major sequence, identify a source-supported object/action, relationship, or state change that communicates the spoken beat. An icon can anchor that visual, but an unchanged generic icon while subtitles do all the narrative work is not a complete visual sequence. Texture, SFX, caption animation, and a scene transition are embellishments; none substitutes for content-bearing imagery.

Use a midpoint pattern interrupt only when a meaningful content relationship supports it. Comparison, progression, or process visuals must reflect the narration; any displayed numeric value must be explicitly supported. Never add a made-up bar, counter, or total for visual variety. On the rendered MP4, a muted review should let the viewer identify the main object/action/relationship in each major sequence without reading every caption.

Use connectors only for source-supported relationships. A list of purchases is accumulation, not proof that one causes another. Routes belong in clear gutters with meaningful endpoints and must avoid text throughout motion. Quantity is literal: five apps means five objects total, including retained ones. Unknown categories stay anonymous.

## Timing and styling

Resolve semantic entrances from transcript phrases. Future geometry starts hidden in initial HTML/CSS and the seekable GSAP timeline, including SVG strokes/nodes, rails, dividers and pseudo-elements. A faint pre-event line is still visible. Clear connectors when endpoints disappear or change model. Check before/at/after events and backward seeks.

Use navy surfaces, off-white copy, gold retained objects, amber active objects/metrics and muted beige secondary states. Changing number color never changes its value or qualifier. Modest metric emphasis follows number_highlights.json. Keep actual values distinct from mental approximations. Avoid idle pulses or extra transitions merely to add motion; a visibly stronger scene transition requires explicit user direction and remains episode-local.

Keep the global 180ms crossfade as default and preserve clean foreground handoffs over navy/brand. An explicitly requested visible transition must use real visual-sequence boundaries, preserve voice/caption timing, remain inside the safe viewport and outside brand/caption lanes, and be checked through entry, cover, exit and backward seek. Only the current spoken subtitle word highlights. Inspect icon/text separation, moving geometry and ghost text using rendered bounds and MP4 frames; SFX are optional, not automatic.

## Regroup without rewriting

1. Read the full canonical Day. Choose complete semantic beats and record source-slice grouping.
2. Preserve narration, word order, global WordBoundary times and audio bytes. Rebase local offsets and retain original internal gaps.
3. Remap all scene references in finance data/events, highlights, hero captions and visual plan. Resolve again; missing/ambiguous phrases fail.
4. Merge compatible visual sequences and retain objects deliberately. Updating IDs alone does not remove a slideshow. Preserve chapter/caption boundaries inside longer scenes.
5. Validate canonical narration, absolute timing equality, caption coverage and temporal states. Save current resolved plans beside the MP4 so QA samples the actual events.

Day 2's seven-scene preview is an episode choice, not a series quota. Its calendar, home/car/meal artwork and custom routes are local examples, not templates to copy into Day 1.

## Day 1 reruns

Use DAY1_OUTPUT_DIR with scripts/plan-day1-editorial-r2.ts and scripts/render-day1-editorial-r2.ts to target a new benchmark. Copy approved source inputs/audio into it, then regenerate plans and validation with current code. Snapshot protected artifacts before work and verify afterward. Historical hash discrepancies stay recorded separately; a fresh before/after match does not erase them.

Run tests, A–J, browser temporal QA and MP4 frame QA. Report measured metadata and limitations, then supply the video for human review. Do not reuse historical report scripts that stamp frame-specific answers without fresh evidence.
