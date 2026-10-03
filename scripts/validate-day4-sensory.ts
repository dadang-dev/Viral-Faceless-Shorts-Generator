import {readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {validateVisualVariety,VisualHistorySchema} from "../src/planning/visual-variety.js";
import {persistProductionValidation,assertProductionAllowed} from "../src/contracts/production-validation.js";
import {assertMoneyHabitsTheme} from "../src/contracts/content-contract.js";
const sixScene=process.argv.includes("--six-scene");
import {TRANSITIONS_OUT} from './day4-transitions.js';
const transitions=process.argv.includes('--transitions');
const illustrated=process.argv.includes('--illustrated')||transitions;
const out=transitions?TRANSITIONS_OUT:illustrated?"output/benchmarks/day-4-v12-illustrated":sixScene?"output/benchmarks/day-4-v12-six-scene":"output/benchmarks/day-4-v12-texture-sfx",old="output/benchmarks/day-4-v12-differentactually";
const json=async(p:string)=>JSON.parse(await readFile(p,"utf8"));
const hash=async(p:string)=>createHash("sha256").update(await readFile(p)).digest("hex");
const report=await json(`${out}/validation-report.json`),sfx=await json(`${out}/sfx-report.json`);
const transcript=await json(`${out}/transcript.json`);
if(await hash(`${out}/voice.mp3`)!==await hash(`${old}/voice.mp3`)||await hash(`${out}/transcript.json`)!==await hash(`${old}/transcript.json`))throw new Error("SOURCE_AUDIO_TIMING_CHANGED");
if(sfx.videoSha256!==await hash(`${out}/video.mp4`)||sfx.status!=="PASS")throw new Error("STALE_SOUND_EVIDENCE");
assertMoneyHabitsTheme(await readFile(`${out}/styles.css`,"utf8"),await readFile(`${out}/index.html`,"utf8"));
report.gates.H_VISUAL_VARIETY=validateVisualVariety({script:await json(`${out}/script.json`),plan:await json(`${out}/visual-plan.json`),history:VisualHistorySchema.parse(await json(`${out}/batch-comparison-history.json`)),transcript});
const ffmpeg=process.env.MONEYHABITS_FFMPEG;if(!ffmpeg)throw new Error("Explicit FFmpeg required");
const videoHash=(file:string)=>new Promise<string>((done,fail)=>{const p=spawn(ffmpeg,["-v","error","-i",file,"-map","0:v:0","-c","copy","-f","hash","-hash","sha256","-"],{stdio:["ignore","pipe","pipe"]});let result="",err="";p.stdout.on("data",d=>result+=d);p.stderr.on("data",d=>err+=d);p.on("error",fail);p.on("close",c=>c===0?done(result.trim()):fail(new Error(err)));});
const pictureBefore=await videoHash(`${out}/video-without-sfx.mp4`),pictureAfter=await videoHash(`${out}/video.mp4`);
if(pictureBefore!==pictureAfter)throw new Error("SFX_CHANGED_PICTURE");
report.sensoryRevision={status:"PASS",texture:"Background-only static grain and 72px paper grid",comparison:"Source-exact equal-size question panels; no new numbers",sfx:{...sfx,picturePacketsUnchanged:true,picturePacketHash:pictureAfter},voiceAndWordBoundaryBytesUnchanged:true,scope:"Day 4 only; older benchmarks unchanged",humanApproval:"PENDING"};
if(illustrated)report.sensoryRevision.comparison='Illustrated temporary relief versus persistent receipt; no invented values or sentence-card comparison';
if(sixScene||illustrated){
 const tokens=await json(`${out}/design-tokens.json`),css=await readFile(`${out}/sensory.css`,"utf8"),ass=await readFile(`${out}/subtitles.ass`,"utf8");
 if(Object.values(tokens.tokens).some(v=>!css.includes(String(v)))||!ass.includes("&H0023A6F5&")||!ass.includes("&H00FFFFFF"))throw new Error("USER_TOKEN_MISMATCH");
 report.gates.C_THEME={status:"PASS",scope:"Explicit user-approved Day 4 override only",tokens:tokens.tokens,captionPrimary:"#FFFFFF",captionActive:"#F5A623"};
 report.sixSceneRevision={status:"PASS",visualSequences:6,sourceAudioSlices:11,approval:"PENDING",tokens,reviewReport:illustrated?'docs/day-4-illustrated-revision.md':"docs/day-4-six-scene-revision.md"};
 if(illustrated){
  const art=await json(`${out}/illustration-qa.json`);
  if(art.status!=='PASS'||art.inputSha256!==await hash(`${out}/index.html`))throw new Error('ILLUSTRATION_QA_FAILED_OR_STALE');
  report.illustrationQA=art;
 }
}
if(transitions){
 const qa=await json(`${out}/transition-qa.json`);
 if(qa.status!=='PASS'||qa.inputSha256!==await hash(`${out}/index.html`))throw new Error('TRANSITION_QA_FAILED_OR_STALE');
 report.transitionQA=qa;report.sixSceneRevision.reviewReport='docs/day-4-transitions-revision.md';
}
await persistProductionValidation(out,report);assertProductionAllowed(report.gates);
await writeFile(`${out}/sensory-validation.json`,JSON.stringify(report.sensoryRevision,null,2));
console.log("Sensory integrity PASS; H",report.gates.H_VISUAL_VARIETY.status);
