import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { APPROVED_SCRIPT_FILE, HISTORICAL_SCRIPT_FILE } from "../src/contracts/content-contract.js";

const out="output/benchmarks/day-1-v12-editorial";
const j=async(f:string)=>JSON.parse(await readFile(`${out}/${f}`,"utf8"));
const r=await j("validation-report.json"), qa=await j("qa-editorial-final/qa-manifest.json"), visual=await j("visual-review.json"), plan=await j("resolved-finance-plan.json"), numeric=await j("numeric-integrity.json"), tests=await j("test-results.json"), protectedHashes=await j("baseline-preservation.json");
const sha=createHash("sha256").update(await readFile(`${out}/video.mp4`)).digest("hex");
if(sha!==qa.videoSha256 || sha!==visual.videoSha256)throw new Error("QA_STALE: review and frames must belong to final MP4");
if(visual.acceptance.length!==12 || visual.acceptance.some((a:any)=>a.answer!=="YES") || visual.blockers.length)throw new Error("EDITORIAL_REVIEW_INCOMPLETE");
if(tests.status!=="PASS" || protectedHashes.status!=="PASS" || !r.productionDecision.allowed)throw new Error("ACCEPTANCE_BLOCKED");
const old=await readFile(HISTORICAL_SCRIPT_FILE),source=await readFile(APPROVED_SCRIPT_FILE);
if(!old.subarray(old.indexOf("## Day 2")).equals(source.subarray(source.indexOf("## Day 2"))))throw new Error("SOURCE_REVISION: Day 2–7 changed");
const currentProtected=Object.fromEntries(await Promise.all(Object.keys(protectedHashes.before).map(async p=>[p,createHash("sha256").update(await readFile(p)).digest("hex")])));
if(JSON.stringify(currentProtected)!==JSON.stringify(protectedHashes.before))throw new Error("IMMUTABLE_BASELINE");
const status="DAY 1 v1.2 EDITORIAL/DATA-INTEGRITY PATCH — READY FOR VISUAL REVIEW";
const cell=(s:unknown)=>String(s??"").replaceAll("|","\\|").replaceAll("\n"," ");
const row=(cells:unknown[])=>`| ${cells.map(cell).join(" | ")} |`;
const fmt=(x:number)=>x.toFixed(3);
const inventory=r.gates.J_MOTION_SEMANTICS.editorial.inventory;
const last=r.outroDwell.lastWordEndSec;
const files=["money-habits-script-v2.1-verified.md","config.yaml","src/contracts/content-contract.ts","src/contracts/finance-motion.ts","src/contracts/numeric-relationships.ts","src/contracts/hero-captions.ts","src/contracts/editorial-validation.ts","src/contracts/source-revision.test.ts","src/contracts/editorial-validation.test.ts","src/contracts/finance-motion.test.ts","src/render/finance-renderer.ts","src/render/finance-renderer.test.ts","src/render/html-composer.ts","src/render/templates/finance.css","src/render/templates/finance-animations.js","src/render/templates/animations.js","src/pipeline.ts","src/pipeline-production.test.ts","tests/test_core.py","scripts/revise-day1-source.ts","scripts/prepare-day1-editorial.ts","scripts/plan-day1-editorial.ts","scripts/render-day1-editorial.ts","scripts/report-day1-editorial.ts","scripts/qa-money-video.py","scripts/plan-day1-finance-benchmark.ts","scripts/render-finance-benchmark.ts",".agents/skills/create-money-video/SKILL.md",".agents/skills/create-money-video/references/finance-motion-v12.md",".agents/skills/create-money-video/references/editorial-data-integrity.md"];
const md=`# ${status}

Architecture remains v1.2. No v1.3, no engine redesign, no production Day 1–3 rerender and no Day 4–7 render. This benchmark awaits the user's independent visual review, not production approval.

## Source revision and exact diff

Canonical: \`${APPROVED_SCRIPT_FILE}\`. Historical v2 remains untouched. Exactly three Day 1 substitutions; Day 2–7 are byte-identical. The original document heading remains historical wording to avoid a fourth unrequested source edit.

\`\`\`diff
- But ten dollars, four nights a week, is more than most people's entire grocery budget.
+ But ten dollars, four nights a week, is about a hundred and seventy dollars a month.
- Number three: rounding down in your head.
+ Number three: rounding it off in your head.
- Do that three times a week, and you've quietly spent almost three hundred dollars a month on 'basically nothing.'
+ Do that three times a week, and you've quietly spent over two hundred dollars a month on 'basically nothing.'
\`\`\`

Source SHA256: \`${createHash("sha256").update(source).digest("hex")}\`.

## Root causes

Root causes addressed: historical Day 1 itself contained an unsupported budget comparison and inconsistent monthly arithmetic/rounding terminology; literal provenance alone did not reconcile relationships. The previous visual plan promoted narration into main-canvas fragments, represented app total as an additive group, delayed meaningful chapter objects, and used a comparison gap/linked sentence boxes for the wrong semantics. Caption rendering lacked scoped full-hero coverage. Frame QA additionally exposed an object path over a price, superimposed metric-update glyphs, and a frame-zero CSS state awaiting GSAP. Fixes stay within the existing v1.2 primitives and opt-in editorial mode.

## Exact final voice-over

${r.approvedVoiceText}

Edge TTS en-US-AndrewMultilingualNeural, speed 0.8 / rate -20%. Only scenes 8, 9 and 11 were resynthesized; unchanged original scene audio/WordBoundary cues reused. New transcript offsets, full voice track and captions rebuilt. No Whisper and no reference-derived voice or data.

## Output and duration

- Video: \`${out}/video.mp4\`.
- Measured video duration: **${qa.duration.toFixed(3)}s**, 1080×1920, 30fps.
- MP4 SHA256: \`${sha}\`.
- Last spoken WordBoundary: ${fmt(last)}s. CTA/profile begins ${fmt(r.outroDwell.profileEntranceSec)}s. Purposeful final profile dwell; no narration padding or speed change.
- Caption coverage: \`${out}/caption-coverage.json\`; only opening, full hook and full reframe use exact hero-carried captions. Other spoken words remain bottom captions, active word gold.

## Scene / visual-model plan

| Time (s) | Sequence | Model / meaning |
| --- | --- | --- |
${plan.sequences.map((s:any)=>row([`${fmt(s.startSec)}–${fmt(s.endSec)}`,s.id,s.semanticRationale])).join("\n")}
${row([`${fmt(r.outroDwell.profileEntranceSec)}–${fmt(qa.duration)}`,"Post-speech CTA","COMMENT 1, 2, OR 3; numbered app/order/coffee reminders; retained profile/follow card. No giant duplicate brand wordmark."])}

## Text inventory

Time ranges describe the principal visible state; normal 180ms chapter fades and metric state-update tweens overlap at their edges. Source spans and exact motion events remain in resolved-finance-plan.json. The $18 state ends at the ~$20 update (${fmt(plan.sequences.find((s:any)=>s.id==="rounding").motionEvents.find((e:any)=>e.action==="update").atSec)}s), not at the end of the rounding sequence.

| Time (s) | Main text | Role | Spoken? | Subtitle duplicate? | Keep/remove reason |
| --- | --- | --- | --- | --- | --- |
${inventory.map((v:any)=>row([v.time.map((t:number)=>fmt(t)).join("–"),v.mainText,v.role,"YES",v.subtitleDuplicate,`${v.reason}; source: ${v.sourceSpan??v.source?.sourceSpan}`])).join("\n")}
${row([`${fmt(r.outroDwell.profileEntranceSec)}–${fmt(qa.duration)}`,"COMMENT 1, 2, OR 3","CTA","NO","NO","Approved engagement metadata: Comment 1, 2, or 3 — which habit is yours?"])}
${row([`${fmt(r.outroDwell.profileEntranceSec)}–${fmt(qa.duration)}`,"1 / 2 / 3","CTA","NO","NO","Approved numbered reminders; semantic subscription/order/coffee icons"])}
${row([`0–${fmt(qa.duration)}`,"Money Habits / DAILY HABITS / @moneyhabits","STRUCTURAL_LABEL","NO","NO","Existing approved brand/config; footer yields to profile"])}
${row([`${fmt(r.outroDwell.profileEntranceSec)}–${fmt(qa.duration)}`,"Money Habits / @moneyhabits / US TikTok / Follow → Following","CTA","NO","NO","Retained approved profile config and platform UI"])}

Removed main fragments: YOU FORGOT YOU EVEN SIGNED UP FOR; DO THAT; YOU'VE QUIETLY SPENT; BASICALLY NOTHING; quote-as-card; fake linked sentence boxes; giant duplicate brand wordmark / 3 SPENDING HABITS. Their valid spoken wording remains in captions where appropriate. Unsupported grocery claim, rounding-down contradiction and old almost-300 outcome do not appear in corrected VO/captions/composition. Historical source and protected historical regression artifacts remain explicitly historical, not silently rewritten.

## Numeric integrity

| Relationship | Inputs | Displayed result | Validation | Provenance |
| --- | --- | --- | --- | --- |
${numeric.relationships.map((n:any)=>row([n.relationship.id,n.inputs.map((d:any)=>d.display).join(" × ")+" × 52/12",n.displayedResult,`${n.status}; computed ${n.computedForValidationOnly.toFixed(3)}/month (validation only)`,"Explicit corrected Day 1 source literal; not reference PDF"])).join("\n")}
${row(["Old monthly relation","$18 × 3/week","ALMOST $300 / MONTH","REMOVED / INVALID: 234 is not almost 300","Negative regression test; never shown in corrected benchmark"])}

All eleven metric phrases resolve from transcript.json and number_highlights.json. ABOUT and OVER remain visible. ~$20 is the mental state, not the actual purchase cost used for monthly validation. The original app rows become three of five objects; only two anonymous objects join. The original order/coffee object moves into the first weekly slot; the marker track adds only the remaining events. No quantitative bars or arbitrary scale are used in this benchmark; shared-scale regression tests remain active.

## Validation and tests

| Gate | Result |
| --- | --- |
${Object.entries(r.gates).map(([key,value]:[string,any])=>row([key,value.status])).join("\n")}

Editorial subchecks: ${Object.entries(r.gates.J_MOTION_SEMANTICS.editorial.checks).map(([k,v]:[string,any])=>`${k}=${v.status}`).join("; ")}.

Tests: **${tests.node} Node/Vitest + ${tests.python} Python = ${tests.node+tests.python} PASS; ${tests.failed} FAIL**. Typecheck, frontend build/lint and skill validator PASS. New tests cover the exact three-source diff, Day 2–7 byte preservation, numeric qualifiers/math (including old-300 rejection), source mixing, scoped-caption completeness/resumption/safe bounds, chapter stalls, icon semantics, hook hierarchy and app/order quantity ambiguity.

J retains the reported LOW_MOTION_DENSITY warning for a 5.047s subscription hold during the forgetting clause. This is not hidden or converted to automated PASS: the priced stack intentionally remains available before the five-app expansion; no arbitrary motion was added to meet a quota. Chapter dead-air checks all PASS. HyperFrames also emits a nonblocking HTML-size advisory; no engine split/redesign was undertaken.

## Frame QA and muted comprehension

Final MP4-bound QA: \`${out}/qa-editorial-final/qa-manifest.json\`; ${Object.keys(qa.groups).length} groups, ${Object.values(qa.groups).reduce((n:number,g:any)=>n+g.frames.length,0)} sampled frames, ${qa.automatedChecks.framesScanned} frames scanned for coarse luma anomalies. Exact frames, chapter 30fps sequences, caption-span ends, data states and CTA handoff are in that directory.

${visual.observations.map((s:string)=>`- ${s}`).join("\n")}

Muted comprehension: retained named subscriptions + two anonymous app objects indicate five total; a seven-position week with four order events connects $10 to ABOUT $170/MONTH; same coffee object changes $18 to ~$20 and becomes three weekly events before OVER $200/MONTH; dim habit entities plus generic naming spotlight communicate bringing an unnoticed habit into awareness without assigning a category to the viewer.

## Acceptance answers

${visual.acceptance.map((a:any,i:number)=>`${i+1}. ${a.question} **${a.answer}** — ${a.evidence}`).join("\n")}

## Protected production outputs

All 13 protected historical source/audio/transcript/subtitle/video hashes match before and after. Full values: \`${out}/baseline-preservation.json\`.

| Production video | SHA256 |
| --- | --- |
${[1,2,3].map(n=>row([`output/day-${n}/video.mp4`,protectedHashes.after[`output/day-${n}/video.mp4`]])).join("\n")}

## Files changed

${files.map(p=>`- \`${p}\``).join("\n")}

Generated benchmark assets/reports are confined to \`${out}/\`. Unrelated pre-existing dirty worktree changes were preserved. The Money Habits skill now selects the verified canonical revision, records editorial/numeric/caption/quantity gates and holds production batch pending review.

## Remaining issues and stop boundary

No blocking issue in this agent's frame review. The explicit J hold warning and HTML-size advisory remain disclosed above. Independent user visual approval is still pending. Architecture remains v1.2; no production approval is asserted. STOP: do not render Day 4–7 or modify approved Day 1–3 production files.
`;
await writeFile("docs/day-1-v12-editorial-review.md",md);
r.status=status;r.visualReview={...visual,qaManifest:`${out}/qa-editorial-final/qa-manifest.json`};
await writeFile(`${out}/validation-report.json`,JSON.stringify(r,null,2));
console.log(status,"docs/day-1-v12-editorial-review.md");
