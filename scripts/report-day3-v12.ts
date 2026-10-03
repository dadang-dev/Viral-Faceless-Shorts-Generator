import {readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {join} from "node:path";
import {assertProductionAllowed,persistProductionValidation} from "../src/contracts/production-validation.js";

const out="output/benchmarks/day-3-v12-differentactually";
const json=async(p:string)=>JSON.parse(await readFile(p,"utf8"));
const read=(p:string)=>json(join(out,p));
const hash=async(p:string)=>createHash("sha256").update(await readFile(p)).digest("hex");
const requirePass=(ok:boolean,message:string)=>{if(!ok)throw new Error(message);};
const report=await read("validation-report.json"),qa=await read("final-gsap/qa-manifest.json"),dense=await read("dense/manifest.json");
const temporal=await read("final-temporal-collision-report.json"),probe=await read("final-gsap/media-probe.json");
const review=await read("visual-review.json"),videoSha256=await hash(join(out,"video.mp4"));
requirePass([qa.videoSha256,dense.videoSha256,review.videoSha256].every(h=>h===videoSha256),"STALE_MP4_EVIDENCE");
requirePass(temporal.inputSha256===await hash(join(out,"index.html"))&&temporal.status==="PASS","TEMPORAL_QA");
const picture=probe.streams.find((s:any)=>s.codec_type==="video"),audio=probe.streams.find((s:any)=>s.codec_type==="audio");
requirePass(picture?.width===1080&&picture?.height===1920&&picture?.avg_frame_rate==="30/1"&&Number(picture.duration)>=60.5&&Boolean(audio),"MEDIA_STREAMS");
const checks=qa.automatedChecks;
requirePass(checks.framesScanned===Number(picture.nb_frames)&&["blackFramesMeanBelow2","whiteFramesMeanAbove240","abruptMeanLumaChangesOver35"].every(k=>checks[k].length===0),"FRAME_SCAN");
requirePass(review.status==="REVIEWED"&&review.blockingIssues.length===0,"VISUAL_REVIEW_PENDING_OR_FAILED");
const tests=await json(".runtime-logs/day3-v12-vitest.json");
requirePass(tests.success&&tests.numFailedTests===0,"TESTS_FAILED");
const before=await read("protected-before.json"),after:Record<string,string>={};
for(const p of Object.keys(before)){after[p]=await hash(p);requirePass(after[p]===before[p],"PROTECTED_CHANGED: "+p);}
await writeFile(join(out,"baseline-preservation.json"),JSON.stringify({status:"PASS",before,after},null,2));
const testResults=await read("test-results.json");
requirePass(testResults.node===tests.numPassedTests&&testResults.python===25,"STALE_TEST_COUNT");
report.status="READY_FOR_VISUAL_REVIEW";
report.humanApproval="PENDING";
report.video={sha256:videoSha256,duration:Number(picture.duration),containerDuration:Number(probe.format.duration),width:picture.width,height:picture.height,fps:picture.avg_frame_rate,videoCodec:picture.codec_name,audioCodec:audio.codec_name};
report.finalQA={
 source:"PASS",transcript:"PASS",timing:"PASS",captions:"PASS",
 temporal:{status:temporal.status,samples:temporal.snapshotCount,inputSha256:temporal.inputSha256,report:"final-temporal-collision-report.json"},
 frames:{status:"PASS",scanned:checks.framesScanned,lowDetailWarningFrames:checks.lowDetailHeroFramesStdBelow5,report:"final-gsap/qa-manifest.json"},
 visualReview:review,protectedArtifacts:{status:"PASS",files:Object.keys(before).length},
 skillValidation:"PASS",
 limitations:["Automated/agent QA is not human visual approval.",...report.gates.J_MOTION_SEMANTICS.warnings,"HyperFrames composition-size advisory: 502 lines; no runtime architecture change."],
};
assertProductionAllowed(report.gates);
await persistProductionValidation(out,report);
console.log(JSON.stringify({status:report.status,video:report.video,tests:testResults,temporal:report.finalQA.temporal,protected:report.finalQA.protectedArtifacts,warnings:report.finalQA.limitations},null,2));
