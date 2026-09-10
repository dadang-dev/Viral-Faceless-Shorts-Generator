import {readFile,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {assessSceneDynamics} from "../src/planning/scene-dynamics.js";
const out="output/benchmarks/day-1-v12";
const read=async(p:string)=>JSON.parse(await readFile(p,"utf8"));
const baseline=await read("output/day-1/script.json"), transcript=await read(join(out,"transcript.json"));
const plan=await read(join(out,"resolved-finance-plan.json")), report=await read(join(out,"validation-report.json"));
const baselineNumbers=await read("output/day-1/number_highlights.json");
function cardRuns(templates:string[]) {let run=0;const runs:number[]=[];for(const t of [...templates,"END"]) {if(["comparison","feature-list","callout"].includes(t))run++;else{if(run)runs.push(run);run=0;}}return {runs:runs.filter(n=>n>=2),max:Math.max(0,...runs)};}
const consumed=new Set(plan.sequences.flatMap((s:any)=>s.sceneIds));
const bSequence=baseline.scenes.flatMap((s:any)=>{const seq=plan.sequences.find((p:any)=>p.sceneIds.includes(s.id));return seq ? (seq.sceneIds[0]===s.id?[`finance:${seq.visualModel}`]:[]) : [s.templateData.template];});
const diagnostics={definitions:{
  majorModels:"Distinct dominant visual models, including typography fallback; v1.1 inferred from rendered template semantics, v1.2 from explicit plan. Embedded metric inside frequency is not counted twice.",
  dataViz:"A sequence encodes a count, shared-scale magnitude or retained cost collection beyond text-only price cards. Financial comparison cards without encoded magnitude are not charts.",
  stateful:"An object persists while later spoken semantic beats add/modify the explanation; generic entrance staggers and scalar punches alone do not qualify.",
  motionEvents:"Internal transcript-linked events, excluding generic scene entrances, hide cleanup, subtitles, shimmer and idle motion. Approved number emphasis counts on both sides; full event ledger is included for inspection.",
  longHolds:"Existing >5s composition-hold warning heuristic, evaluated with original visualCues for baseline and merged financeVisualCues for v1.2. Not an exact pixel-freeze count.",
  transitions:"Distinct semantic transition families, including number punch, not every minor entrance tween.",
  repeatedCards:"Consecutive comparison/feature-list/callout scene runs of length >=2; a purposeful retained stack within one finance sequence is not a repeated reset.",
},metrics:[
  {metric:"Major visual models",v11:4,v12:new Set(["typography",...plan.sequences.map((s:any)=>s.visualModel)]).size},
  {metric:"Data-viz sequences",v11:0,v12:plan.sequences.filter((s:any)=>s.elements.some((e:any)=>["bar","markers","stack-item"].includes(e.kind))).length},
  {metric:"Stateful sequences",v11:0,v12:plan.sequences.filter((s:any)=>s.motionEvents.filter((e:any)=>e.action!=="hide").length>=2).length},
  {metric:"Meaningful motion events (internal/narration-linked)",v11:baselineNumbers.items.length,v12:plan.sequences.reduce((n:number,s:any)=>n+s.motionEvents.filter((e:any)=>e.action!=="hide").length,0)},
  {metric:"Static long-hold flags",v11:assessSceneDynamics(transcript,[]).filter(s=>s.status==="STATIC_LONG_HOLD_WARNING").length,v12:report.sceneDynamics.filter((s:any)=>s.status==="STATIC_LONG_HOLD_WARNING").length},
  {metric:"Transition types used",v11:2,v12:new Set(["crossfade",...plan.sequences.flatMap((s:any)=>s.motionEvents.map((e:any)=>e.transition))]).size},
  {metric:"Repeated card runs",v11:cardRuns(baseline.scenes.map((s:any)=>s.templateData.template)).runs.length,v12:cardRuns(bSequence).runs.length},
  {metric:"Maximum consecutive card scenes",v11:cardRuns(baseline.scenes.map((s:any)=>s.templateData.template)).max,v12:cardRuns(bSequence).max},
  {metric:"Visual scene/sequence entrances (excluded from internal-event counts)",v11:baseline.scenes.length,v12:bSequence.length},
],baselineModels:["typography","checklist","paired-values","metric-reveal"],benchmarkModels:["typography",...new Set(plan.sequences.map((s:any)=>s.visualModel))],baselineCardRuns:cardRuns(baseline.scenes.map((s:any)=>s.templateData.template)),benchmarkCardRuns:cardRuns(bSequence),
  internalEvents:plan.sequences.flatMap((s:any)=>s.motionEvents.map((e:any)=>({sequence:s.id,time:e.atSec,phrase:e.trigger.sourceSpan,action:e.action,transition:e.transition,counted:e.action!=="hide"}))),
  unchangedFallbackScenes:baseline.scenes.filter((s:any)=>!consumed.has(s.id)).map((s:any)=>({id:s.id,role:s.type,template:s.templateData.template,reason:s.type==="hook"?"Immediate approved hook":s.type==="outro"?"Locked profile CTA timing":"Brief reassurance, intentional typographic pause"})),
};
await writeFile(join(out,"ab-diagnostics.json"),JSON.stringify(diagnostics,null,2));
function audioHash(path:string):Promise<string>{return new Promise((done,fail)=>{let text="";const p=spawn("ffmpeg",["-v","error","-i",path,"-map","0:a:0","-c","copy","-f","hash","-hash","sha256","-"],{stdio:["ignore","pipe","pipe"]});p.stdout.on("data",d=>text+=String(d));p.on("error",fail);p.on("close",c=>c===0?done(text.trim()):fail(new Error("Audio hash failed")));});}
const a=await audioHash("output/day-1/video.mp4"),b=await audioHash(join(out,"video.mp4"));
if(a!==b)throw new Error("BENCHMARK_ISOLATION: final AAC payload differs");
await writeFile(join(out,"audio-isolation.json"),JSON.stringify({status:"PASS",baseline:a,benchmark:b,method:"FFmpeg stream-copy SHA256 over AAC payload, not container metadata",videoSha256:createHash("sha256").update(await readFile(join(out,"video.mp4"))).digest("hex")},null,2));
console.log(JSON.stringify(diagnostics.metrics,null,2));
console.log("AAC payload byte identity: PASS");
