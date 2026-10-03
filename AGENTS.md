# Money Habits — Repository Instructions

## Mandatory context

Before planning, editing, rendering, or validating a Money Habits video, read:

1. root `workflow.md` for the ordered execution gates
2. the applicable skill; for Money Habits, `.agents/skills/create-money-video/SKILL.md`
3. `docs/master-template-v1.2-rule-lock-audit.md` for the visual rule specification
4. `docs/migration-status.md` for current authorization and protected artifacts
5. `money-habits-script-v2.1-verified.md`, including the complete requested Day section

These are required context, not optional references.

## Canonical narration

Canonical source: `money-habits-script-v2.1-verified.md`.

Never rewrite, paraphrase, improve, shorten, or invent narration unless the user explicitly requests it. Never invent financial data or silently fall back to an older script.

## Project architecture

The current Money Habits architecture is the Phase 2 HyperFrames/HTML/CSS/GSAP pipeline. Do not resurrect abandoned Phase 1 systems, stock/AIGC asset pipelines, mascots, old watch-folder workflows, CapCut/Seedance, Google Flow/Veo3, or unrelated legacy architecture unless explicitly requested. Do not modify model/runtime configuration unless explicitly requested.

## Locked page identity

The tool UI and all new production renders use the locked public page identity `DifferentActually` with handle `@differentactually` and tagline `DAILY HABITS`, sourced from `src/brand-config.ts`. Do not reintroduce `Money Habits`/`@moneyhabits` as a new-render brand or accept legacy `TIKTOK_DISPLAY_NAME`/`TIKTOK_HANDLE` overrides. Canonical script filenames, narration text, historical reports, hashtags and protected MP4 contents are source/history data and remain unchanged unless explicitly authorized.

## Protected artifacts

Approved production and benchmark artifacts are protected. Do not overwrite, modify, or delete them unless explicitly instructed. Temporary/regenerable QA frame dumps may only be deleted when outside the protected artifact manifest; report such cleanup separately and never describe it as protected-artifact preservation.

## Visual hard gates

The following are FAIL conditions: accidental text/object overlap, text/container overflow, clipping, unsafe frame margins, unintended retained-state collisions, caption/foreground collisions, transition collisions, ghost foregrounds, invalid transformed geometry, and invalid intermediate-animation geometry. A clean start/end frame or representative contact sheet is insufficient; animated layouts require temporal validation.

## Shared-rule principle

For a reusable layout-system failure: diagnose the shared cause, fix the shared runtime/contract when appropriate, add a reusable regression test, and revalidate protected benchmark cases. Preserve creative layout freedom inside safety invariants.

## Temporal validation

Sample entrance, early hold, midpoint, late hold, exit, and semantic event boundaries; use denser sampling for complex sequences. Transform-aware checks must account for actual rendered bounds, scaling, translation, font metrics, and animation state.

## Layout safety

Use shared layout tokens and semantic constraints. Enforce hero safe zones, semantic object gaps, text containment, safe-frame insets, retained-state spacing, and transform-aware bounds. Do not scatter unexplained magic geometry constants across day-specific files.

## Visual continuity and reveal timing

Plan connected semantic states rather than a succession of icon slides. Preserve an object's identity while its cost, frequency or emphasis changes. Connectors must express a source-supported relationship; accumulation is not automatically causation. Hide future objects and connector geometry until their transcript-linked event, including SVG paths and CSS pseudo-elements. Recheck visibility after scene regrouping.

## Explicit visible scene transitions

The shared semantic 180 ms crossfade remains the default. A more visible wipe/shutter or other scene-to-scene treatment is an episode-local exception only when the user explicitly asks for it. Anchor it to actual visual-sequence boundaries resolved from the plan/transcript; do not retime narration or confuse audio-slice boundaries with scene boundaries. Keep intentional occlusion inside the safe viewport and away from brand/caption lanes; no black/white flash, blank state or unintended ghosting. SFX are optional and are not implied by a transition request. Validate entrance, midpoint/cover, exit and reverse-seek states densely, then inspect the actual rendered frames.

Color emphasis changes presentation, never numeric values. Use consistent active, retained and secondary roles inside the locked palette. A requested scene count is episode-specific unless explicitly made a series rule.

## Numeric integrity

Only visualize numbers explicitly supported by the canonical source or explicitly approved config. Never invent percentages, totals, salary values, derived monthly/yearly amounts, savings amounts, or statistical claims. Qualitative relationships must remain directly supported by narration.

## Text economy and captions

Visuals carry meaning; chapter/headline text carries hierarchy; subtitles provide accessibility. Do not duplicate narration as unnecessary large on-canvas text or create fake explanatory cards. Use the approved v1.2 uppercase caption system; timing comes from `transcript.json` generated by Edge TTS WordBoundary, with active-word highlighting and collision validation.

## Required QA

Before reporting a Money Habits render complete, run all applicable gates and report every result: source integrity, transcript integrity, timing integrity, caption integrity, numeric integrity, semantic validation, visual collision validation, temporal collision validation, visual variety / H, A–J checks, frame QA, duration/resolution/fps, and protected-artifact hash checks. Never report PASS for a skipped required gate.

## Human visual approval

Automated QA PASS is not human visual approval. Render/QA and provide review artifacts, then stop for human review; never self-issue a human-approval status.

## Scope discipline and migration gate

Consult `docs/migration-status.md` before beginning Day-N work. Do not advance a gate without explicit authorization. Keep mutable episode progress and approval evidence in that file, not in repository invariants. Do not modify unrelated architecture while working on one day.

## Document responsibilities and conflicts

Repository guidance flows through `AGENTS.md` (stable invariants) → `workflow.md` (ordered process) → applicable `SKILL.md` (implementation playbook) → detailed specs/docs → validators/tests (machine enforcement). `docs/migration-status.md` supplies mutable state alongside that hierarchy.

Explicit current user instructions govern task scope. Surface conflicting instructions; use the authoritative, newer rule for its stated scope and record the superseded guidance. Historical review reports do not override a later explicit approval. If authority cannot be resolved, report the conflict before dependent work. Never blend conflicting rules or weaken a validator to make a report pass.

## Agent execution discipline

- Read before writing: inspect shared exports, immediate callers, related contracts and existing tests before changing shared code.
- Make surgical changes: touch only what the task requires, preserve unrelated work and follow existing conventions.
- Tests protect intent: encode the semantic or business invariant and why it matters, rather than incidental coordinates or current output.
- Checkpoint significant stages: state what changed, what was verified and what remains.
- Fail loud: distinguish PASS, FAIL, unavailable and not applicable. Completion cannot hide an unresolved or skipped required check.
- Route human corrections through the persistent-learning loop in `workflow.md`; do not automatically turn individual aesthetic preferences into repository-wide hard rules.

## Handoff and documentation discipline

- `PROJECT_CONTEXT.md` is the compact handoff snapshot for a new Codex conversation. Keep it factual and current; record verified source/artifact state, not chat history or inferred approvals.
- Before continuing from a handoff, read `AGENTS.md`, `workflow.md`, the applicable skill, the v1.2 rule-lock audit, `docs/migration-status.md`, the canonical script and `PROJECT_CONTEXT.md`.
- A documentation-only handoff must not modify source code, renderer architecture, protected artifacts, model/runtime configuration, or approval state. Do not commit or push unless explicitly requested.
- Mark facts as pending, blocked, unavailable or warning when that is their actual state. Automated PASS is not human visual approval, and a stale report is not evidence for a newer artifact.
- Treat `CURRENT_STATE_REPORT.md`, legacy README instructions and historical reports as context only when they conflict with the current `AGENTS.md` → `workflow.md` → skill → migration-status hierarchy.

## Media-runtime portability

- Keep FFmpeg paths explicit through `MONEYHABITS_FFMPEG` and `MONEYHABITS_FFPROBE` when the host has multiple installations or restricted Windows discovery. Do not commit or leave temporary `where`/FFmpeg shims in `node_modules`.
- The final Money Habits MP4 must be checked for both video and audio streams. A raw HyperFrames render without audio or a caption burn using an FFmpeg build without `subtitles`/libass is incomplete.
- HyperFrames compositions that depend on GSAP must be rendered only after confirming GSAP loaded in the browser. `gsap is not defined`, CDN/network failures or a missing outro CTA are render failures even if the process exits successfully.
