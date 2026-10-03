import {readFile,writeFile,copyFile,mkdir,readdir,access} from "node:fs/promises";
import {createHash} from "node:crypto";
import {FinancePlanSchema,compileFinancePlan,transitionFor} from "../src/contracts/finance-motion.js";
import {APPROVED_SCRIPT_FILE as source,extractApprovedVoiceOver,assertScriptIntegrity} from "../src/contracts/content-contract.js";
import {ScriptSchema} from "../src/render/script-schema.js";
import {resolveHeroCaptions,editorialCaptionWords} from "../src/contracts/hero-captions.js";
const old="output/benchmarks/day-4-v12-texture-sfx",out="output/benchmarks/day-4-v12-six-scene";
const json=async(p:string)=>JSON.parse(await readFile(p,"utf8"));
const hash=async(p:string)=>createHash("sha256").update(await readFile(p)).digest("hex");
try{await mkdir(out);}catch(e:any){
 if(e.code!=="EEXIST"||!process.argv.includes("--resume-preparation"))throw e;
 // Resume only a failed preparation, never a composed/rendered review artifact.
 for(const f of ["index.html","video.mp4"]){try{await access(`${out}/${f}`);throw new Error("REVIEW_DESTINATION_EXISTS");}catch(err:any){if(err.code!=="ENOENT")throw err;}}
}
const before=await json(`${old}/protected-before.json`);
for(const e of await readdir(old,{withFileTypes:true}))if(e.isFile())before[`${old}/${e.name}`]=await hash(`${old}/${e.name}`);
for(const p of Object.keys(before))if(await hash(p)!==before[p])throw new Error("PROTECTED_CHANGED: "+p);
await writeFile(`${out}/protected-before.json`,JSON.stringify(before,null,2));
for(const f of ["script.json","script.txt","transcript.json","voice.mp3","number_highlights.json","audio-reuse.json","batch-comparison-history.json"])await copyFile(`${old}/${f}`,`${out}/${f}`);
const script=ScriptSchema.parse(await json(`${out}/script.json`)),transcript=await json(`${out}/transcript.json`);
const approved=extractApprovedVoiceOver(await readFile(source,"utf8"),4);assertScriptIntegrity(script,approved);
const plan=await json(`${old}/data_visualizations.json`),prior=plan.sequences;
const ref=(sceneId:string,sourceSpan:string)=>({source,sceneId,sourceSpan});
const ev=(id:string,sceneId:string,phrase:string,action:string,targets:string[],pose?:object)=>({id,trigger:ref(sceneId,phrase),action,targets,relation:"same-object",transition:transitionFor("same-object"),rationale:"Preserve the user's source-supported restrained state change without new semantic copy.",...(pose?{pose}:{})});
const feelings=structuredClone(prior[1].elements.find((e:any)=>e.id==="feelings"));
const biology={id:"biological-loop",sceneIds:["scene-3"],visualModel:"typography",semanticRationale:"User explicitly requests a stationary feeling headline while captions carry the biological relief explanation.",minimalismReason:"Explicit user-directed quiet typography; no decorative motion during the explanation.",entryRelation:"new-topic",entryTransition:"crossfade",elements:[feelings],motionEvents:[{...ev("explanation-complete","scene-3","minutes","hide",["feelings"]),anchor:"end"}]};
const minutes=structuredClone(prior[1].elements.find((e:any)=>e.id==="minutes"));
Object.assign(minutes,{box:{x:130,y:380,w:820,h:220},fontSize:92,initial:true,role:"STRUCTURAL_LABEL"});
const examples={id:"trigger-examples",sceneIds:["scene-4"],visualModel:"decision-flow",semanticRationale:"The already-spoken ten-minute qualifier is retained above the two distinct source examples; icons enter only at their phrases.",entryRelation:"new-topic",entryTransition:"crossfade",elements:[minutes,...prior[1].elements.filter((e:any)=>["order","coffee"].includes(e.id))],motionEvents:prior[1].motionEvents.filter((e:any)=>["order","coffee"].includes(e.id))};
const twist=structuredClone(prior[2]);
twist.elements=twist.elements.filter((e:any)=>["biology","purchase"].includes(e.id));
twist.elements.find((e:any)=>e.id==="purchase").box={x:410,y:800,w:260,h:220};
twist.motionEvents=[ev("short-relief","scene-6","the relief is short","focus",["purchase"],{opacity:.65}),ev("bill-persists","scene-6","the bill isn't","focus",["purchase"],{opacity:1})];
twist.semanticRationale="User-directed single shopping object; the short-relief versus bill contrast remains in captions without a second bill icon.";
const ending=structuredClone(prior[4]);
ending.elements.push({id:"honest",kind:"text",box:{x:130,y:380,w:820,h:260},copy:{...ref("scene-11","one honest question"),text:"ONE HONEST QUESTION"},role:"SECTION_MARKER",fontSize:100,size:"heading",initial:false});
ending.motionEvents=ending.motionEvents.filter((e:any)=>e.id!=="outro-clear"&&e.id!=="honest-question-payoff");
ending.motionEvents.push(ev("discipline-clears","scene-11","You need","hide",["discipline"]),{id:"honest-reveal",trigger:ref("scene-11","one honest question"),action:"reveal",targets:["honest"],relation:"progression",transition:transitionFor("progression"),rationale:"Replace the outgoing discipline headline with the exact spoken honest question payoff, after a clean handoff."},{...ev("outro-clear","scene-11",transcript.scenes.at(-1).words.at(-1).text,"hide",["question","honest"]),anchor:"end"});
// Clear outgoing ink before the next sequence enters the same occupied lanes.
// WordBoundary starts leave the shared 180ms hide time; word ends were too late.
delete (biology.motionEvents[0] as any).anchor;
examples.motionEvents.push(ev("examples-clear","scene-4","meeting","hide",["minutes","order","coffee"]));
plan.sequences=[prior[0],biology,examples,twist,prior[3],ending];
const input=FinancePlanSchema.parse(plan),resolved=compileFinancePlan(input,script,transcript,approved);
// Keep continuous captions through the actionable rule per the user's request.
// Only actual hero phrases elsewhere are carried by on-canvas type.
const specs=input.sequences.flatMap(s=>s.elements.filter(e=>e.copy&&(e.role==="HERO"||e.id==="honest")).map(e=>({...e.copy!,sequenceId:s.id,elementIds:[e.id]}))).map(({text,...s})=>s);
const captions=resolveHeroCaptions(specs,resolved,transcript);
const visual=await json(`${old}/visual-plan.json`);
visual.repeatedIconComposition="six-visual-sequences;stationary-feelings;top-time-bag-coffee;single-bag-twist;question-panels;honest-question";
visual.rationale="User-directed six-scene concept story with a qualitative question comparison; audio remains eleven immutable narration slices.";
const tokens={background:"#0B1526",grid:"#152238",primary:"#FFFFFF",muted:"#A0AEC0",accent:"#F5A623",border:"#D4AF37"};
for(const [f,value] of Object.entries({"data_visualizations.json":input,"resolved-finance-plan.json":resolved,"hero-captions.json":specs,"resolved-hero-captions.json":captions,"caption-coverage.json":editorialCaptionWords(transcript,captions),"visual-plan.json":visual,"design-tokens.json":{scope:"Day 4 six-scene user request only",tokens,fps:30},"full-script-analysis.json":{approvedVoiceText:approved,plan:await readFile("docs/day-4-six-scene-revision.md","utf8")}}))await writeFile(`${out}/${f}`,JSON.stringify(value,null,2));
let css=await readFile(`${old}/sensory.css`,"utf8");
css+=`
/* Explicit user-approved Day 4 token override; shared stylesheet unchanged. */
:root { --navy-deep:#0B1526; --navy-surface:#0B1526; --navy-raised:#152238; --text-primary:#FFFFFF; --text-muted:#A0AEC0; --accent-gold:#D4AF37; --accent-amber:#F5A623; }
html,body,.shell-bg { background:#0B1526; }
.shell-bg::after { background-image:linear-gradient(#152238 1px,transparent 1px),linear-gradient(90deg,#152238 1px,transparent 1px); }
.brand-shell-header { top:100px; left:60px; padding:16px 24px 16px 16px; gap:16px; border-radius:26px; background:#0B1526; border:1px solid #152238; }
.brand-icon { width:64px; height:64px; border-radius:14px; background:#F5A623; color:#FFFFFF; box-shadow:none; }
.brand-name { font-size:30px; text-transform:uppercase; color:#FFFFFF; }
.brand-tag { color:#A0AEC0; font-size:20px; letter-spacing:3px; }
.fm-element[data-role="HERO"] .fm-copy { color:#FFFFFF; }
#fm-trigger-examples-minutes .fm-copy { text-align:center; color:#A0AEC0; }
#fm-checkout-feeling-not-need { border-color:#A0AEC0; }
#fm-checkout-feeling-not-need .fm-copy { color:#FFFFFF; }
.tt-card { left:110px; width:800px; transform:translateY(300px); bottom:330px; padding:24px; gap:20px; background:#0B1526; border:1px solid #152238; box-shadow:none; }
.tt-avatar { width:100px; height:100px; border-color:#152238; }
.tt-profile-info { margin-right:0; flex:1; }
.tt-display-name { font-size:30px; color:#FFFFFF; }
.tt-handle { font-size:26px; color:#A0AEC0; }
.tt-followers { display:none; }
.tt-follow-btn { width:200px; background:#F5A623; }
.tt-btn-text { color:#0B1526; font-size:28px; }
`;
await writeFile(`${out}/sensory.css`,css);
console.log("Prepared",resolved.sequences.map(s=>({id:s.id,start:s.startSec,end:s.endSec})),"protected",Object.keys(before).length);
