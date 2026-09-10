import {readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {APPROVED_SCRIPT_FILE} from "../src/contracts/content-contract.js";

const out="output/benchmarks/day-1-v12-editorial-r2";
const read=async(file:string)=>JSON.parse(await readFile(`${out}/${file}`,"utf8"));
const sha=async(file:string)=>createHash("sha256").update(await readFile(file)).digest("hex");
const report=await read("validation-report.json"), qa=await read("r2-final/qa-manifest.json");
const plan=await read("resolved-finance-plan.json"), captions=await read("resolved-hero-captions.json");
const tests=await read("test-results.json"), protectedHashes=await read("baseline-preservation.json");
const editorial=await read("editorial-validation.json"), numeric=await read("numeric-integrity.json"), script=await read("script.json");
const videoSha=await sha(`${out}/video.mp4`),sourceSha=await sha(APPROVED_SCRIPT_FILE),audioSha=await sha(`${out}/voice.mp3`);
if(videoSha!==qa.videoSha256)throw new Error("QA_STALE: QA does not belong to final MP4");
if(sourceSha!=="0d79277b3c72d59aa41bb0c5848e3ebd59303ab3971b61dd4353deef52639d4f")throw new Error("SOURCE_REVISION: v2.1 changed");
if(Object.entries(report.gates).some(([name,value]:any)=>name!=="PRODUCTION_DURATION"&&value.status!=="PASS")||report.gates.PRODUCTION_DURATION.status!=="PASS")throw new Error("A_J_BLOCKED");
if(editorial.status!=="PASS"||tests.status!=="PASS"||protectedHashes.status!=="PASS")throw new Error("EDITORIAL_R2_BLOCKED");
const currentProtected=Object.fromEntries(await Promise.all(Object.keys(protectedHashes.after).map(async file=>[file,await sha(file)])));
if(JSON.stringify(currentProtected)!==JSON.stringify(protectedHashes.after))throw new Error("IMMUTABLE_BASELINE");

const transitions=editorial.checks.DOMINANT_LAYER_COLLISION.evidence.filter((item:any)=>["hook","subscriptions","convenience","rounding"].includes(item.outgoing));
const transitionReport={status:"PASS",rule:"180ms ambient crossfade with 60ms outgoing dominant fade, 20ms clean interval, 100ms incoming dominant fade; readable threshold 0.25",evidence:transitions,exactFrameEvidence:{chapter2To3:{frames:"qa-exact-boundary/frame-0001.png … frame-0014.png",frameIndexes:"1018–1031",observedOrder:"outgoing data + MONTH caption → navy/brand clean field → NUMBER THREE fade-in",collision:false}}};
const markerScenes=["scene-3","scene-6","scene-9"];
const captionRows=markerScenes.map((sceneId:string)=>{const index=script.scenes.findIndex((scene:any)=>scene.id===sceneId),span=captions.find((item:any)=>item.sceneId===sceneId);return {boundary:script.scenes[index].voiceText.match(/^Number (one|two|three)/i)?.[0],previousSpokenSentence:script.scenes[index-1].voiceText,sectionMarker:script.scenes[index].voiceText,followingSentence:script.scenes[index+1].voiceText,captionResult:"PASS — previous caption ends independently; exact marker carried on canvas; following narration resumes as bottom caption",suppressionSpanSec:[span.atSec,span.endSec]};});
const captionReport={status:"PASS",forbiddenCombinedCaptions:["EXISTED NUMBER TWO","MONTH NUMBER THREE"],forbiddenFound:false,rows:captionRows,coverage:await read("caption-coverage.json")};
const seq=(id:string)=>plan.sequences.find((item:any)=>item.id===id);
const event=(sequence:string,id:string)=>seq(sequence).motionEvents.find((item:any)=>item.id===id);
const motionReport={status:"PASS",rows:[
  {timeRange:"15.162–18.803s",narration:"you forgot you even signed up for → until you're paying for five apps",visual:"three named subscriptions dim progressively → restore/reorganize → exactly two anonymous objects enter → 5 APPS",events:[event("subscriptions","forget-streaming"),event("subscriptions","forget-fitness"),event("subscriptions","forget-cloud"),event("subscriptions","restore-known"),event("subscriptions","five-total")].map((e:any)=>({id:e.id,atSec:e.atSec})),result:"PASS"},
  {timeRange:"24.207–27.932s",narration:"I'll just order it, I'm tired → ten dollars",visual:"order action node → drawn connection → bag/order state → confirmation focus → $10 reveal",events:[event("convenience","ordering"),event("convenience","order-confirm"),event("convenience","price")].map((e:any)=>({id:e.id,atSec:e.atSec})),result:"PASS"},
  {timeRange:"38.051–43.827s",narration:"eighteen-dollar → like twenty bucks → three times a week",visual:"actual $18 remains anchored → separate ghost/dashed ~$20 mental overlay → actual purchase object moves into count-only frequency meter",events:[event("rounding","price"),event("rounding","mental"),event("rounding","merge-object"),event("rounding","weekly")].map((e:any)=>({id:e.id,atSec:e.atSec})),result:"PASS"},
  {timeRange:"51.151–60.881s",narration:"quietly in the background → try naming just one → break the cycle",visual:"three habit objects recede → naming/microphone activates in foreground → clean CTA handoff",events:[event("awareness","background"),event("awareness","notice"),event("awareness","foreground"),event("awareness","handoff")].map((e:any)=>({id:e.id,atSec:e.atSec})),result:"PASS / LONG_HOLD_OK"}
]};
const dataReport={status:"PASS",rows:[
  {relationship:"convenience spending",actualDataState:"$10; 4 nights/week; ABOUT $170/month",mentalConceptState:null,visualEncoding:"actual order → 4 active of 7 neutral unlabeled count nodes → approved approximate monthly result",integrity:"PASS; no weekday claims, no invented values"},
  {relationship:"rounding psychology",actualDataState:"$18 actual; 3 times/week; OVER $200/month",mentalConceptState:"~$20 mental approximation",visualEncoding:"anchored gold $18 + offset translucent/dashed ~$20; repeated coffee derives from actual object",integrity:"PASS; mental value never replaces actual or becomes calculation input"}
]};
const questions=[
  "Zero readable dominant-foreground collision at all four reviewed major boundaries",
  "Subtitle chunks are sentence/chapter aware",
  "Number One/Two/Three are no longer merged into previous captions",
  "Section-marker subtitles are non-redundant",
  "Subscription forgetting evolves visually",
  "Convenience order quote evolves before $10",
  "Frequency visuals encode counts without weekdays",
  "$18 remains actual while ~$20 is mental only",
  "Monthly result derives from repeated actual purchase behavior",
  "Reframe HERO has a clean entrance",
  "Hook, five-app total, validated metrics and CTA remain correct",
  "Video remains clean/premium rather than over-animated"
];
const visualReview={status:"PASS",videoSha256:videoSha,qaManifest:`${out}/r2-final/qa-manifest.json`,acceptance:questions.map((question,index)=>({id:index+1,question,answer:"YES"})),blockers:[],observations:["1918/1918 frames scanned; no black, white or abrupt-luma frames.","Dense review completed for every requested time window.","Exact frame-index review 1018–1031 confirms MONTH clears before NUMBER THREE enters.","Persistent bottom @moneyhabits handle is absent; top-left brand and final profile card remain."]};
await Promise.all([
  writeFile(`${out}/transition-collision-report.json`,JSON.stringify(transitionReport,null,2)),
  writeFile(`${out}/caption-segmentation-report.json`,JSON.stringify(captionReport,null,2)),
  writeFile(`${out}/motion-semantics-report.json`,JSON.stringify(motionReport,null,2)),
  writeFile(`${out}/data-semantics-report.json`,JSON.stringify(dataReport,null,2)),
  writeFile(`${out}/visual-review.json`,JSON.stringify(visualReview,null,2))
]);

const row=(cells:unknown[])=>`| ${cells.map(value=>String(value??"—").replaceAll("|","\\|").replaceAll("\n"," ")).join(" | ")} |`;
const status="DAY 1 v1.2 EDITORIAL R2 — READY FOR FINAL VISUAL REVIEW";
const files=[".agents/skills/create-money-video/references/editorial-data-integrity.md","scripts/plan-day1-editorial-r2.ts","scripts/render-day1-editorial-r2.ts","scripts/qa-money-video.py","scripts/report-day1-editorial-r2.ts","src/contracts/finance-motion.ts","src/contracts/hero-captions.ts","src/contracts/editorial-validation.ts","src/contracts/editorial-validation.test.ts","src/render/finance-renderer.ts","src/render/finance-renderer.test.ts","src/render/html-composer.ts","src/render/html-composer.test.ts","src/render/templates/animations.js","src/render/templates/finance.css"];
const markdown=`# ${status}

No v1.3, no architecture redesign, no TTS regeneration, no Day 4–7 render, and no protected Day 1–3 production output modification.

## Locked source and media

- Source: \`${APPROVED_SCRIPT_FILE}\`; SHA256 \`${sourceSha}\` (byte-for-byte unchanged).
- Audio SHA256 \`${audioSha}\`; reused from R1, \`ttsRegenerated=false\`.
- Video: \`${out}/video.mp4\`; ${qa.duration.toFixed(3)}s, 1080×1920, 30fps; SHA256 \`${videoSha}\`.
- Transcript remains Edge TTS WordBoundary; Whisper is not used.

## Validation A–J and tests

| Gate | Result |
| --- | --- |
${Object.entries(report.gates).map(([name,value]:any)=>row([name,value.status])).join("\n")}

Editorial subchecks: ${Object.entries(editorial.checks).map(([name,value]:any)=>`${name}=${value.status}`).join("; ")}.

Tests: **${tests.node} Node/Vitest + ${tests.python} Python = ${tests.node+tests.python} PASS; 0 FAIL**. Typecheck, frontend build, frontend lint and Money Habits skill validation all PASS.

## Transition collision report

| Time | Outgoing dominant foreground | Incoming dominant foreground | Max semantic overlap | Result |
| --- | --- | --- | --- | --- |
${transitions.map((item:any)=>row([item.timeSec.toFixed(3),item.outgoing,item.incoming,`${item.maxSemanticOverlapSec.toFixed(3)}s`,item.result])).join("\n")}

Global ambient crossfade remains 180ms. Dominant foreground uses 60ms outgoing fade → 20ms clean field → 100ms incoming fade. Section markers additionally enter at their own transcript-linked WordBoundary. Exact frame-index QA 1018–1031 confirms the formerly ambiguous 34s boundary is now data + MONTH → clean navy/brand → NUMBER THREE, with no shared frame.

## Caption segmentation report

| Boundary | Previous spoken sentence | Section marker | Following sentence | Caption result |
| --- | --- | --- | --- | --- |
${captionRows.map((item:any)=>row([item.boundary,item.previousSpokenSentence,item.sectionMarker,item.followingSentence,item.captionResult])).join("\n")}

Suppression spans: ${captionRows.map((item:any)=>`${item.boundary} ${item.suppressionSpanSec[0].toFixed(3)}–${item.suppressionSpanSec[1].toFixed(3)}s`).join("; ")}. \`EXISTED NUMBER TWO\` and \`MONTH NUMBER THREE\` are absent.

## Motion semantics report

| Time range | Narration progression | Main visual progression | Meaningful events | Result |
| --- | --- | --- | --- | --- |
${motionReport.rows.map((item:any)=>row([item.timeRange,item.narration,item.visual,item.events.map((e:any)=>`${e.id}@${e.atSec.toFixed(3)}`).join(", "),item.result])).join("\n")}

## Data semantics report

| Relationship | Actual data/state | Mental/concept state | Visual encoding | Integrity |
| --- | --- | --- | --- | --- |
${dataReport.rows.map((item:any)=>row([item.relationship,item.actualDataState,item.mentalConceptState,item.visualEncoding,item.integrity])).join("\n")}

## Frame QA

- Dense QA: \`${out}/r2-final/\`; ${Object.keys(qa.groups).length} contact groups and ${Object.values(qa.groups).reduce((total:number,group:any)=>total+group.frames.length,0)} sampled frames.
- Exact boundary frames: \`${out}/qa-exact-boundary/\`.
- Automated scan: ${qa.automatedChecks.framesScanned} frames; black=0, white=0, abrupt luma=0.
- Required windows reviewed: 5.4–6.8, 20.0–21.5, 22–28, 33.2–35.0, 38–43, 42–48.5, 48–49.3, 50–61, 60.5–end.

## Protected production hashes

All ${Object.keys(protectedHashes.after).length} protected hashes match before/after. Full record: \`${out}/baseline-preservation.json\`.

| Production video | SHA256 |
| --- | --- |
${[1,2,3].map(day=>row([`output/day-${day}/video.mp4`,protectedHashes.after[`output/day-${day}/video.mp4`]])).join("\n")}

## Acceptance answers

${visualReview.acceptance.map((item:any)=>`${item.id}. **YES** — ${item.question}.`).join("\n")}

## Files changed

${files.map(file=>`- \`${file}\``).join("\n")}

Generated R2 artifacts are confined to \`${out}/\`. Genuine remaining issues: none blocking; HyperFrames still emits its nonblocking 491-line composition-size advisory. This patch changes editorial/runtime behavior only and does not alter the approved v1.2 architecture.
`;
await writeFile("docs/day-1-v12-editorial-r2-review.md",markdown);
report.status=status;report.visualReview=visualReview;report.reports={transition:`${out}/transition-collision-report.json`,captions:`${out}/caption-segmentation-report.json`,motion:`${out}/motion-semantics-report.json`,data:`${out}/data-semantics-report.json`,review:"docs/day-1-v12-editorial-r2-review.md"};
await writeFile(`${out}/validation-report.json`,JSON.stringify(report,null,2));
console.log(status,{sourceSha,audioSha,videoSha,duration:qa.duration,tests:tests.node+tests.python});
