import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {OBJECT_OUTPUT as out} from './day2-object-storyboard.js';
import {assertProductionAllowed} from '../src/contracts/production-validation.js';

const read=async(f:string)=>JSON.parse(await readFile(`${out}/${f}`,'utf8'));
const hash=async(f:string)=>createHash('sha256').update(await readFile(f)).digest('hex');
const report=await read('validation-report.json'), qa=await read('final/qa-manifest.json');
const temporal=await read('final-temporal-collision-report.json'), review=await read('review-observations.json');
const tests=await read('test-results.json'),probe=await read('final/media-probe.json'),before=await read('protected-before.json');
const sha=await hash(`${out}/video.mp4`), htmlSha=await hash(`${out}/index.html`);
if(qa.videoSha256!==sha||review.videoSha256!==sha||temporal.inputSha256!==htmlSha)throw new Error('STALE_QA');
if(temporal.status!=='PASS'||temporal.failures.length||!temporal.runtime.gsapVersion)throw new Error('TEMPORAL_QA_FAIL');
if(review.status!=='REVIEWED_NO_BLOCKING_FINDINGS'||review.humanApproval!==false)throw new Error('FRAME_REVIEW_REQUIRED');
for(const key of ['blackFramesMeanBelow2','whiteFramesMeanAbove240','abruptMeanLumaChangesOver35'])if(qa.automatedChecks[key].length)throw new Error(`FRAME_QA_FAIL: ${key}`);
const video=probe.streams.find((s:any)=>s.codec_type==='video');
if(video.width!==1080||video.height!==1920||video.r_frame_rate!=='30/1'||Number(video.duration)<60.5)throw new Error('MEDIA_GATE_FAIL');
const after:Record<string,string>={};for(const [path,expected] of Object.entries(before)){after[path]=await hash(path);if(after[path]!==expected)throw new Error(`PROTECTED_MODIFIED: ${path}`);}
await writeFile(`${out}/protected-after.json`,JSON.stringify({status:'PASS',fileCount:Object.keys(before).length,before,after},null,2));
assertProductionAllowed(report.gates);
report.status='DAY 2 v1.2 OBJECT-LED — READY FOR VISUAL REVIEW';
report.videoSha256=sha;report.temporalCollision=temporal;report.frameQa=qa;report.visualReview=review;
report.protectedRecheck={status:'PASS',files:Object.keys(before).length};report.humanApproval=false;
await writeFile(`${out}/validation-report.json`,JSON.stringify(report,null,2));
const files=['scripts/day2-object-storyboard.ts','scripts/plan-day2-v12.ts','scripts/prepare-day2-v12.ts','scripts/render-day2-v12.ts','scripts/snapshot-day2-object-baseline.ts','scripts/report-day2-object-storyboard.ts','scripts/qa-temporal-collision.ts','scripts/qa-money-video.py','src/contracts/day2-object-storyboard.test.ts','src/contracts/day2-v12.test.ts','docs/day-2-v12-object-storyboard.md','docs/migration-status.md'];
const sourceHashes=Object.fromEntries(await Promise.all(files.map(async f=>[f,await hash(f)])));
await writeFile(`${out}/render-provenance.json`,JSON.stringify({videoSha256:sha,htmlSha256:htmlSha,sourceHashes},null,2));
const numbers=await read('number_highlights.json');
const gates=Object.entries(report.gates).map(([k,v]:any)=>`| ${k} | ${v.status} |`).join('\n');
const doc=`# Day 2 v1.2 — Object-led storyboard implementation

READY FOR VISUAL REVIEW; human approval remains PENDING. Storyboard approval is not MP4 approval. No Day 3–7 work is authorized.

## Deliverable

- [Final video](../${out}/video.mp4): ${video.duration}s, 1080×1920, 30fps.
- SHA256: \`${sha}\`.
- [Full-timeline and dense frame QA](../${out}/final/qa-manifest.json), [temporal QA](../${out}/final-temporal-collision-report.json), [observations](../${out}/review-observations.json).
- ${tests.node} Node tests + ${tests.python} Python tests PASS; typecheck, frontend build/lint PASS. Skill validation PASS with UTF-8 enabled. Initial sandbox-only FFmpeg test failures were rerun successfully with native execution; no tests were waived.
- ${temporal.snapshotCount} actual Chrome/GSAP ${temporal.runtime.gsapVersion} temporal samples, zero reported geometry failures. Loaded Anton/Inter; report bound to final HTML hash.
- ${qa.automatedChecks.framesScanned} decoded frames scanned: zero black/white/abrupt-luma flags. Low-detail flags are reviewed handoffs, not independently proof of blankness.
- ${Object.keys(before).length} protected top-level source/output artifacts byte-identical to the pre-change manifest. This scope includes canonical script, legacy Day 1–3, Day 1 R2 and both earlier Day 2 benchmark top-level files; nested QA dumps are not covered by that manifest and were not edited.

## What changed and why

1. The prior time treatment was an icon/stat. The approved replacement uses a recognizable bound calendar, a blank turning leaf and the exact 6 MONTHS reveal, without intermediate numbers or invented dates.
2. Apartment, before/after car, appetizer and dessert now have separate SVG silhouettes without repeated card borders. The two food objects coexist, matching AND. Artwork is code-native and isolated to this benchmark.
3. Scene 8 now belongs to the same retained sequence as its examples. At “stack them up”, the same objects consolidate; the replaced car clears and the apartment price does not become a fabricated total.
4. The approved incremental meaning is explicit: $200 / MONTH plus source-exact MORE. Price and apartment compress horizontally before moving vertically; a regression rejects the prior intersecting route.
5. Spending/income are qualitative broad tracks without values, ticks or quantitative scales. Their widths advance together at the resolved income phrase; spending advances further only at “sometimes faster”. Frame review caught the generic split-entrance offset; the final income entrance preserves the common left baseline.
6. Wanted/could artwork is separated from the labels. Voice, upper-case active-word-gold captions, navy/off-white/gold palette, global 180ms crossfade and final profile behavior remain unchanged.

## Scope and implementation

No shared render architecture/template code changed in this iteration. The Day 2 runner opts into a scoped plan transform and SVG/CSS/GSAP decoration only for \`${out}\`. Existing node/metric contracts remain authoritative. All additional motion anchors resolve from transcript events. No TTS regeneration or audio rewrite. The prior benchmark and the first attempt in this directory remain available.

Primary archetype: accumulation; secondary: comparison. Eleven unchanged audio slices form five persistent visual sequences. H similarity to available Day 1 history: ${report.gates.H_VISUAL_VARIETY.similarity[0]?.score}; coverage is one prior Day, not two. H metadata is not a pixel-level creativity score.

## Validation

| Gate | Result |
| --- | --- |
${gates}

Detailed copy spans: [editorial inventory](../${out}/editorial-validation.json). Semantic anchors: [resolved plan](../${out}/resolved-finance-plan.json). Numeric provenance: [plan](../${out}/data_visualizations.json).

## Exact approved voiceText

${report.approvedVoiceText}

## Number highlights

\`\`\`json
${JSON.stringify(numbers,null,2)}
\`\`\`

Timing comes only from the canonical-matching Edge TTS AndrewMultilingualNeural WordBoundary transcript. The voice file remains byte-identical to the approved Day 2 voice source.

## Theme

navyDeep #071426; navySurface #0D2038; navyRaised #132B47; textPrimary #F5F1E8; textMuted #C9C2B5; accentGold #D7A928; accentAmber #F2C14E. No imported reference colors or financial content.

## Files changed in this work

${files.map(f=>'- '+f).join('\n')}
- This review report and generated artifacts under the isolated object-led directory.
- Generated test log/cache and frontend build output from verification.

Other pre-existing working-tree changes were preserved and are not attributed to this iteration. No source-version change, v1.3, model/config/plugin change or production overwrite.

## Review limitations / next gate

Review covers decoded MP4 timeline samples, dense frame-level risky transitions and loaded-font browser geometry. It is not a claim of uninterrupted human playback or an independent aesthetic approval. Automated checks do not universally prove all possible text/text ghosts or narrative engagement. See the recorded observations for exact inspected groups. Please review the final MP4; STOP here pending that decision. Do not start another Day.
`;
await writeFile('docs/day-2-v12-object-led-review.md',doc);
console.log(report.status,sha,report.protectedRecheck);
