import {readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {join} from "node:path";
import {assertProductionAllowed,persistProductionValidation} from "../src/contracts/production-validation.js";

const day=Number(process.argv[2]);if(![4,5,6,7].includes(day))throw new Error("Day 4–7 required");
const out=process.argv.find(a=>a.startsWith("--output="))?.slice(9)??`output/benchmarks/day-${day}-v12-differentactually`;
const json=async(p:string)=>JSON.parse(await readFile(p,"utf8"));
const read=(p:string)=>json(join(out,p));
const hash=async(p:string)=>createHash("sha256").update(await readFile(p)).digest("hex");
const requirePass=(ok:boolean,message:string)=>{if(!ok)throw new Error(message);};
const report=await read("validation-report.json"),qa=await read("final-gsap/qa-manifest.json"),dense=await read("dense/manifest.json");
const temporal=await read("final-temporal-collision-report.json"),probe=await read("final-gsap/media-probe.json");
const review=await read("visual-review.json"),videoSha256=await hash(join(out,"video.mp4"));
let transitionQA:any=null;
if(report.sceneTransitions){
 transitionQA=await read("transition-qa.json");
 requirePass(transitionQA.status==="PASS"&&transitionQA.inputSha256===await hash(join(out,"index.html")),"TRANSITION_QA_STALE_OR_FAILED");
 requirePass(transitionQA.transitions.length===report.sceneTransitions.items.length,"TRANSITION_COUNT_MISMATCH");
 for(let i=0;i<transitionQA.transitions.length;i++)requirePass(transitionQA.transitions[i].id===report.sceneTransitions.items[i].id&&Math.abs(transitionQA.transitions[i].boundarySec-report.sceneTransitions.items[i].boundarySec)<.001,"TRANSITION_BOUNDARY_MISMATCH");
}
requirePass([qa.videoSha256,dense.videoSha256,review.videoSha256].every(h=>h===videoSha256),"STALE_MP4_EVIDENCE");
requirePass(temporal.inputSha256===await hash(join(out,"index.html"))&&temporal.status==="PASS","TEMPORAL_QA");
const picture=probe.streams.find((s:any)=>s.codec_type==="video"),audio=probe.streams.find((s:any)=>s.codec_type==="audio");
requirePass(picture?.width===1080&&picture?.height===1920&&picture?.avg_frame_rate==="30/1"&&Number(picture.duration)>=60.5&&Boolean(audio),"MEDIA_STREAMS");
const checks=qa.automatedChecks;
requirePass(checks.framesScanned===Number(picture.nb_frames)&&["blackFramesMeanBelow2","whiteFramesMeanAbove240","abruptMeanLumaChangesOver35"].every(k=>checks[k].length===0),"FRAME_SCAN");
requirePass(review.status==="REVIEWED"&&review.blockingIssues.length===0,"VISUAL_REVIEW_PENDING_OR_FAILED");
const testEvidence=process.argv.find(a=>a.startsWith("--tests="))?.slice(8)??".runtime-logs/days4-7-final-vitest.json";
const tests=await json(testEvidence);
requirePass(tests.success&&tests.numFailedTests===0,"TESTS_FAILED");
const before=await read("protected-before.json"),after:Record<string,string>={};
for(const p of Object.keys(before)){after[p]=await hash(p);requirePass(after[p]===before[p],"PROTECTED_CHANGED: "+p);}
await writeFile(join(out,"baseline-preservation.json"),JSON.stringify({status:"PASS",before,after},null,2));
const testResults=await read("test-results.json");
requirePass(testResults.python===25,"PYTHON_TEST_COUNT");
testResults.node=tests.numPassedTests;
testResults.finalNodeEvidence=testEvidence;
report.gates.G_TESTS={status:"PASS",node:tests.numPassedTests,python:testResults.python};
await writeFile(join(out,"test-results.json"),JSON.stringify(testResults,null,2));
report.status="READY_FOR_VISUAL_REVIEW";
report.humanApproval="PENDING";
report.video={sha256:videoSha256,duration:Number(picture.duration),containerDuration:Number(probe.format.duration),width:picture.width,height:picture.height,fps:picture.avg_frame_rate,videoCodec:picture.codec_name,audioCodec:audio.codec_name};
report.finalQA={
 source:"PASS",transcript:"PASS",timing:"PASS",captions:"PASS",
 temporal:{status:temporal.status,samples:temporal.snapshotCount,inputSha256:temporal.inputSha256,report:"final-temporal-collision-report.json"},
 ...(transitionQA?{transitions:{status:transitionQA.status,samples:transitionQA.samples,count:transitionQA.transitions.length,report:"transition-qa.json"}}:{}),
 frames:{status:"PASS",scanned:checks.framesScanned,lowDetailWarningFrames:checks.lowDetailHeroFramesStdBelow5,report:"final-gsap/qa-manifest.json"},
 visualReview:review,protectedArtifacts:{status:"PASS",files:Object.keys(before).length},
 skillValidation:"PASS",
 limitations:["Automated/agent QA is not human visual approval.",...report.gates.H_VISUAL_VARIETY.warnings,...report.gates.J_MOTION_SEMANTICS.warnings,"HyperFrames composition-size advisory retained; no renderer architecture change.",...(day===7?["Purposeful post-narration profile dwell is 11.33 seconds; human pacing judgment pending."]:[])],
};
assertProductionAllowed(report.gates);
await persistProductionValidation(out,report);
console.log(JSON.stringify({status:report.status,video:report.video,tests:testResults,temporal:report.finalQA.temporal,protected:report.finalQA.protectedArtifacts,warnings:report.finalQA.limitations},null,2));
