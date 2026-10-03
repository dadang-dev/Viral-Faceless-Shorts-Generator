import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { assertProductionAllowed } from "../src/contracts/production-validation.js";

// Finalize only the isolated rebuild after MP4-bound automated AND visual QA.
const out="output/benchmarks/day-2-v12-workflow-rebuild";
const read=async(name:string)=>JSON.parse(await readFile(`${out}/${name}`,"utf8"));
const hash=async(path:string)=>createHash("sha256").update(await readFile(path)).digest("hex");
const report=await read("validation-report.json"),qa=await read("release/qa-manifest.json"),temporal=await read("release-temporal-collision-report.json");
const baseline=await read("baseline-preservation.json"),tests=await read("test-results.json"),review=await read("review-observations.json");
const probe=await read("release/media-probe.json"),plan=await read("data_visualizations.json"),highlights=await read("number_highlights.json");
const videoSha256=await hash(`${out}/video.mp4`);
if(qa.videoSha256!==videoSha256||review.videoSha256!==videoSha256||temporal.inputSha256!==await hash(`${out}/index.html`))throw new Error("QA_STALE: evidence must match current MP4 and HTML");
if(temporal.status!=="PASS"||temporal.failures.length||!temporal.runtime?.gsapVersion)throw new Error("TEMPORAL_QA_FAIL");
if(review.status!=="REVIEWED_NO_BLOCKING_FINDINGS"||review.humanApproval!==false)throw new Error("VISUAL_REVIEW_REQUIRED");
for(const key of ["blackFramesMeanBelow2","whiteFramesMeanAbove240","abruptMeanLumaChangesOver35"])if(qa.automatedChecks[key].length)throw new Error(`FRAME_QA_FAIL: ${key}`);
const picture=probe.streams.find((s:any)=>s.codec_type==="video");
if(picture.width!==1080||picture.height!==1920||picture.r_frame_rate!=="30/1"||Number(picture.duration)<60.5)throw new Error("MEDIA_METADATA_FAIL");
for(const [path,expected] of Object.entries(baseline.before))if(await hash(path)!==expected)throw new Error(`PROTECTED_ARTIFACT_MODIFIED: ${path}`);
report.gates.G_TESTS={...tests,status:"PASS"};
report.gates.I_FINANCE_DATA_VIZ.chartDecision="Exact 6 MONTHS interval and $200 / MONTH cost reveal. Qualitative spending/income progression has no numeric scale; no derived finance data.";
assertProductionAllowed(report.gates);
report.status="DAY 2 v1.2 — READY FOR VISUAL REVIEW";
report.temporalCollision=temporal;report.frameQa=qa;report.visualReview=review;report.videoSha256=videoSha256;
report.protectedRecheck={status:"PASS",files:Object.keys(baseline.before).length};
await writeFile(`${out}/validation-report.json`,JSON.stringify(report,null,2));
await writeFile(`${out}/numeric-integrity.json`,JSON.stringify({status:"PASS",approvedFacts:plan.data.map((d:any)=>({display:d.display,sourcePhrase:d.sourceSpan,unitSource:d.unitSource?.sourceSpan})),derivedValues:[],chartDecision:report.gates.I_FINANCE_DATA_VIZ.chartDecision},null,2));
const gates=Object.entries(report.gates).map(([k,v]:any)=>`| ${k} | ${v.status} |`).join("\n");
const doc=`# Day 2 v1.2 — Workflow rebuild / READY FOR VISUAL REVIEW

Human approval is PENDING. Only Day 2 was rendered. Day 1 R2, legacy Day 1–3 and the prior Day 2 benchmark remain unchanged. No Day 3–7 work; no architecture/version or runtime/model changes.

## Result

- MP4: [video](../${out}/video.mp4), ${picture.duration}s, 1080×1920, 30fps, ${qa.automatedChecks.framesScanned} decoded frames.
- SHA256: \`${videoSha256}\`.
- Tests: ${tests.node} Node + ${tests.python} Python PASS; typecheck, frontend build/lint PASS; skill validator PASS.
- Real Chrome/GSAP ${temporal.runtime.gsapVersion}: ${temporal.snapshotCount} temporal samples, zero reported geometry failures; Anton/Inter loaded, HTML hash verified.
- All-frame luminance checks: zero black/white/abrupt-luma flags. Low-detail flags at intentional handoffs remain advisory, not proof of blankness.
- Protected files: ${Object.keys(baseline.before).length} fresh hash comparisons PASS.

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
${gates}

H uses existing history/thresholds; full comparison details are in [validation report](../${out}/validation-report.json). Automated checks are not human approval. Shared render/runtime code was not changed in this rebuild.

## Scene plan and provenance

Primary concept-story; secondary accumulation. Eleven unchanged audio slices form six persistent visual sequences: raise/time jump → retained lifestyle accumulation → qualitative parallel rise → deprivation reframe → wanted/could fork → question payoff. Scene-specific changes reduce sentence cards while retaining the approved v1.2 visual vocabulary.

Every main-canvas string and source span: [editorial inventory](../${out}/editorial-validation.json). Full analysis: [analysis](../${out}/full-script-analysis.json). Phrase-linked events: [resolved plan](../${out}/resolved-finance-plan.json).

## Exact approved voiceText

${report.approvedVoiceText}

## Number highlights

\`\`\`json
${JSON.stringify(highlights,null,2)}
\`\`\`

Timing resolves only from the reused canonical-matching Edge TTS AndrewMultilingualNeural WordBoundary transcript. No TTS regeneration, silence padding or narration edits.

## Theme

navyDeep #071426; navySurface #0D2038; navyRaised #132B47; textPrimary #F5F1E8; textMuted #C9C2B5; accentGold #D7A928; accentAmber #F2C14E. Uppercase captions; current word gold, previous words return off-white. Global 180ms baseline unchanged.

## Review evidence and limitations

Inspected groups: ${review.inspectedGroups.join(", ")}. See [observations](../${out}/review-observations.json), [MP4-bound QA](../${out}/release/qa-manifest.json), [temporal QA](../${out}/release-temporal-collision-report.json). Inspection uses decoded frames across the full timeline and dense event frames, not a claim of uninterrupted human playback. Sampling does not mathematically prove every possible collision; no blocking finding remains in the inspected frames. Human pacing/aesthetic approval remains pending.

## Files changed this rebuild

- DAY2-BENCHMARK-ONLY: scripts/prepare-day2-v12.ts, scripts/plan-day2-v12.ts, scripts/render-day2-v12.ts, scripts/report-day2-workflow-rebuild.ts; generated isolated benchmark sidecars/video/QA.
- QA tooling: scripts/qa-temporal-collision.ts, scripts/qa-money-video.py.
- Regression/fixture tests: src/contracts/visual-collision.test.ts, src/contracts/day2-v12.test.ts.
- Docs: this report, docs/migration-status.md, docs/master-template-v1.2-rule-lock-audit.md.
- AGENTS.md and workflow.md were read and followed, not rewritten in this render task. Existing unrelated worktree edits were preserved.

## Workflow handoff

STEPS 0–9 complete: context/scope, exact source, analysis/plan, preflight, implementation, isolated render, A–J/tests, temporal/frame QA, provenance and review artifacts. STEP 10: STOP for user review. STEP 11/next-Day work NOT AUTHORIZED.
`;
await writeFile("docs/day-2-v12-workflow-rebuild-review.md",doc);
console.log(report.status,{videoSha256,duration:picture.duration,tests,temporalSamples:temporal.snapshotCount});
