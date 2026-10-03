# Money Habits v1.2 — Day 1-aligned Workflow

Canonical execution workflow for creating, migrating, patching, validating and handing off a Money Habits episode. Day 1-aligned means carrying forward the reviewed execution discipline, not copying its storyboard.

## Responsibilities and applicability

| Layer | Responsibility |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Stable repository invariants and conflict resolution |
| [workflow.md](workflow.md) | Ordered execution stages, learning loop and handoff gates |
| [create-money-video/SKILL.md](.agents/skills/create-money-video/SKILL.md) | Implementation techniques, supported contracts and commands |
| [Rule-lock audit](docs/master-template-v1.2-rule-lock-audit.md) | Detailed visual rules, enforcement map and historical evidence |
| [Migration status](docs/migration-status.md) | Current Day states, protected artifacts and approval evidence |
| [Contracts](src/contracts/) and [tests](tests/) | Machine enforcement; related TypeScript regression tests live alongside source |

Load context and establish scope for every task. For documentation-only or read-only review work, mark render/implementation gates not applicable with a reason; do not execute them merely to fill this checklist. For episode changes, run every applicable gate. A skipped required gate is never PASS.

## STEP 0 — Load required context

Before editing, read in order:

1. Root `AGENTS.md`.
2. This `workflow.md`.
3. `.agents/skills/create-money-video/SKILL.md` and its applicable references.
4. `docs/master-template-v1.2-rule-lock-audit.md`.
5. `docs/migration-status.md`.
6. [Canonical narration](money-habits-script-v2.1-verified.md), including the complete requested Day.
7. Relevant approved benchmark/report and current review feedback.

Identify historical instructions and newer approvals explicitly. Do not begin coding before required context is loaded.

## STEP 1 — Confirm scope and protected artifacts

Record the Day, task type (creation, migration, patch, QA or review support), authorized actions, exact isolated benchmark directory, protected outputs and next-Day gate. Consult migration status and existing manifests; capture hashes before any permitted implementation/render.

Preserve prior review evidence for comparison. Never overwrite a protected production or approved benchmark artifact without explicit authorization. Work only on the requested Day.

## STEP 2 — Full-script analysis

Analyze the full narration before a scene plan. Determine primary archetype, optional secondary archetype, semantic visual models, scene boundaries, retained states, the dominant visual per sequence, meaningful motion events, finance/data-viz opportunities and numeric constraints.

Keep narration and qualifiers exact. Scene boundaries follow complete semantic beats; a visual sequence may retain state across contiguous audio slices. Reusing components does not justify copying another Day's storyboard.

## STEP 3 — Semantic visual plan

Write the plan before implementation. For each sequence explain what it communicates, how the state evolves, which objects persist, why each motion exists and how text remains economical. Bind semantic copy and data to approved source spans; bind events to transcript phrases.

Choose visualization by relationship: single fact → metric reveal; comparison/gap → comparison; accumulation → retained stack/progression; frequency → timeline/repetition; state change → stateful object; process → decision flow. A number alone does not require a chart. Do not invent financial values, schedules or derived totals.

Prefer evolving scenes over disconnected sentence cards. Keep ordinary narration in captions, but do not let captions become the entire visual story: each major sequence should have a source-supported object/action, relationship, or meaningful state change. Generic icons, texture, decorative motion, SFX, caption animation, and scene transitions do not substitute for content-bearing visuals. A midpoint pattern interrupt is optional and content-led; use a comparison/progression/process view only when supported, and never invent a numeric value. The no-stray-connector rule requires a supported semantic relationship, clear endpoints and a path clear of text through all animation states. The shared semantic 180 ms crossfade remains the default; avoid decorative wipes/spins/morphs unless the user explicitly asks for a more visible scene-to-scene transition. For that scoped exception, bind the transition to real visual-sequence boundaries resolved from the plan/transcript, preserve narration and WordBoundary timing, and keep any occlusion clear of brand/caption lanes and inside the safe viewport. SFX remain separately optional.

Day 2's reviewed correction targets are examples, not a universal storyboard: exact six-month time passage, meaningful accumulation, qualitative spending/income progression and separated wanted/could labels. Read the current Day report via migration status for its actual evidence and remaining review gate.

## STEP 4 — Preflight

When regrouping scenes, record source-slice groups and retained objects. Preserve every WordBoundary global timestamp and word; rebase local timing and remap events, data, highlights and hero captions. Re-run phrase resolution and caption coverage. Fewer scene IDs alone do not demonstrate better visual continuity.

For reveal QA, inspect before/at/after each event, including SVG paths and CSS pseudo-elements outside the regular element inventory. Resolve low-detail warnings through frame inspection; being near a transition does not itself make a warning harmless.

Before implementation/full render, validate the applicable source/narration, numeric provenance, transcript/timing, caption plan, H similarity/visual variety, semantic scene validity, output isolation and protected hashes. Use the current skill and schema; do not invent unsupported fields.

If a needed transcript does not yet exist, establish it through the authorized exact-source Edge TTS WordBoundary path before dependent timing checks. Reuse approved audio only after source/transcript integrity checks. Missing or ambiguous phrases fail; never guess timing or rewrite the script.

Record PASS/FAIL/WARNING and evidence. If a required gate cannot run, report it as unavailable and block dependent render. Recheck affected preflight gates after implementation; this early check does not certify later edits.

## STEP 5 — Implement surgically

Read relevant shared runtime, exports, immediate callers, contracts and tests first. Make the minimum scoped change.

For a reusable failure, diagnose the shared cause, fix the appropriate invariant and add reusable regression coverage; do not hide a systemic problem behind Day-specific coordinates. For a genuinely scene-specific issue, keep the fix local. Preserve geometry/text safety throughout motion and revalidate affected benchmark cases without rewriting protected artifacts.

Use the skill's implementation playbook and rule-lock values. Do not refactor unrelated architecture or change model/runtime settings as a side effect.

For page-brand changes, update `src/brand-config.ts` first and route renderers/UI through that lock. Keep canonical narration, source filenames, historical captions/reports and protected artifacts immutable; a page rename is not permission to rewrite voice-over or rerender an approved MP4.

## STEP 6 — Render isolated benchmark

After applicable preflight and tests pass, render only the requested Day into the directory established in STEP 1. Use the existing Money Habits pipeline, exact narration, WordBoundary timing, theme and transition contracts.

Check the runner's destinations and side effects before invoking it. A render-only helper does not waive preflight. Preserve approved outputs and prior review evidence.

## STEP 7 — Automated QA

Run and record all applicable gates:

- Source/narration, transcript, timing and caption integrity.
- Numeric provenance/relationships and semantic validity.
- Visual collision, transformed geometry and temporal collision validation.
- H similarity and all A–J checks, with current relevant tests.
- Measured video duration, resolution/fps, black/white/flash and abrupt luminance checks.
- Protected artifact hashes compared with STEP 1.

Use [production gates](src/contracts/production-validation.ts), [finance contracts](src/contracts/finance-motion.ts), [collision contracts](src/contracts/visual-collision.ts), [temporal QA](scripts/qa-temporal-collision.ts) and [frame QA](scripts/qa-money-video.py) through the appropriate existing runner. These references identify enforcement; this workflow does not change it.

A skipped required check is not PASS. Keep warnings and limitations visible. Reports and QA evidence must correspond to the current artifact/hash, not a previous render.

## STEP 8 — Temporal visual QA

After automated checks, inspect the actual MP4 across the full timeline and inspect rendered/browser states for motion-heavy sequences at entrance, early hold, midpoint, late hold, exit and semantic event boundaries. Increase sampling density for complex transforms and risky handoffs; inspect exact frame indexes when needed.

Check overlap, clipping, containment, safe margins, captions, transformed bounds, retained-state compression, foreground handoffs and final animation state. For an added scene transition, sample before entry, during travel, at maximum cover, on exit and after the handoff; use backward seeks for stateful animation, then inspect the actual MP4 transition strips. Review the actual MP4 muted: verify that imagery/state progression communicates the main object, action, or relationship in each major sequence, rather than relying on subtitles or transitions alone. A representative contact sheet or automated PASS alone is insufficient.

When QA identifies a problem, classify it using the learning loop below, return to the affected planning/implementation stage and repeat dependent checks on the revised artifact.

## STEP 9 — Human-review artifacts

Prepare the final benchmark video, representative contact sheet, dense temporal sheets for risky sequences and QA/report paths. Report exact source/voiceText, highlights, changes, measured metadata, applicable gate/test outcomes, protected hashes and remaining issues as required by the skill.

Only claim visual checks actually performed. Automated PASS means ready for human review, not human approval.

## STEP 10 — Human gate

Stop after producing the review artifacts and wait for explicit user review. Never self-issue HUMAN VISUAL APPROVED. Automated success does not authorize the next Day.

For non-render tasks, hand off the requested documents or findings and preserve the existing episode gate.

## STEP 11 — After explicit human approval

Record the user's approval and the exact approved artifact/version in `docs/migration-status.md`; protect it as appropriate. Distinguish approval of a Day from authorization to work on the next Day. Open the next gate only to the extent explicitly authorized. Do not silently change approval state or rewrite historical reports.

## Persistent learning

When human review identifies a problem, classify it and persist the lesson in the correct layer:

| Classification | Action |
| --- | --- |
| Scene-specific | Patch the affected scene/Day |
| Recurring workflow lesson | Update `workflow.md` |
| Repository-wide invariant | Update root `AGENTS.md` |
| Reusable implementation technique | Update `.agents/skills/create-money-video/SKILL.md` |
| Machine-detectable invariant | Add/update validator and regression coverage |
| Detailed specification or historical explanation | Update the appropriate spec/audit/report |

Record the cause, scope and evidence; a correction may need more than one layer. Revalidate affected benchmark(s) within the authorized scope. If implementation is outside the current task, record the follow-up explicitly rather than claiming enforcement exists.

The loop is human correction → persistent rule → machine enforcement where possible → regression checks for later Days. Use judgment: do not promote every aesthetic preference into a hard repository rule.

## Handoff checklist

Mark each item complete or explicitly not applicable with a reason. Required but unavailable items remain blocked.

- [ ] Required context read.
- [ ] Scope/Day and authorization confirmed.
- [ ] Canonical script unchanged (or exact authorized change documented).
- [ ] Full-script analysis completed.
- [ ] Semantic visual plan completed.
- [ ] Numeric integrity checked.
- [ ] Output isolation confirmed.
- [ ] Protected hashes checked.
- [ ] Render completed.
- [ ] A–J and relevant tests run.
- [ ] Temporal collision QA run.
- [ ] Caption QA run.
- [ ] Dense review frames inspected for risky motion.
- [ ] Contact sheet/video and QA reports prepared.
- [ ] Automated QA accurately reported, including warnings/unavailable checks.
- [ ] Human approval state not self-issued.
- [ ] Migration status updated only when authorized.
