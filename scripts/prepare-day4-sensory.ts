import {readFile,writeFile,copyFile,mkdir,readdir} from "node:fs/promises";
import {createHash} from "node:crypto";
import {FinancePlanSchema,compileFinancePlan,transitionFor} from "../src/contracts/finance-motion.js";
import {APPROVED_SCRIPT_FILE as source,extractApprovedVoiceOver,assertScriptIntegrity} from "../src/contracts/content-contract.js";
import {ScriptSchema} from "../src/render/script-schema.js";
import {resolveHeroCaptions,editorialCaptionWords} from "../src/contracts/hero-captions.js";

const old="output/benchmarks/day-4-v12-differentactually",out="output/benchmarks/day-4-v12-texture-sfx";
const json=async(p:string)=>JSON.parse(await readFile(p,"utf8"));
const hash=async(p:string)=>createHash("sha256").update(await readFile(p)).digest("hex");
// mkdir without recursive deliberately rejects an existing review destination.
await mkdir(out);
const before=await json(`${old}/protected-before.json`);
for(const dir of [4,5,6,7].map(d=>`output/benchmarks/day-${d}-v12-differentactually`))
 for(const e of await readdir(dir,{withFileTypes:true}))if(e.isFile())before[`${dir}/${e.name}`]=await hash(`${dir}/${e.name}`);
for(const p of Object.keys(before))if(await hash(p)!==before[p])throw new Error("PROTECTED_CHANGED: "+p);
await writeFile(`${out}/protected-before.json`,JSON.stringify(before,null,2));
for(const f of ["script.json","script.txt","transcript.json","voice.mp3","number_highlights.json","audio-reuse.json","batch-comparison-history.json"])await copyFile(`${old}/${f}`,`${out}/${f}`);
const script=ScriptSchema.parse(await json(`${out}/script.json`)),transcript=await json(`${out}/transcript.json`);
const approved=extractApprovedVoiceOver(await readFile(source,"utf8"),4);assertScriptIntegrity(script,approved);
const plan=await json(`${old}/data_visualizations.json`);
const s=plan.sequences.find((s:any)=>s.id==="checkout-feeling");
// Equal-size qualitative alternatives, not quantitative bars. Keep all content
// in the shared safe frame and a full semantic gutter between question panels.
const layout={checkout:{x:410,y:340,w:260,h:200},left:{x:130,y:650,w:370,h:330},right:{x:580,y:650,w:370,h:330}};
s.elements.find((e:any)=>e.id==="checkout").box=layout.checkout;
Object.assign(s.elements.find((e:any)=>e.id==="question"),{box:layout.left,fontSize:66});
s.elements.push({id:"not-need",kind:"text",box:layout.right,copy:{source,sceneId:"scene-7",sourceSpan:"not 'do I need this'",text:"NOT DO I NEED THIS"},role:"SECTION_MARKER",fontSize:66,size:"heading",initial:false});
s.motionEvents.splice(1,0,{id:"not-need",trigger:{source,sceneId:"scene-7",sourceSpan:"not 'do I need this'"},action:"reveal",targets:["not-need"],relation:"comparison",transition:transitionFor("comparison"),rationale:"Contrast the source's recommended feeling question with the explicitly negated purchase question; no numeric magnitude."});
s.semanticRationale="Two equal qualitative panels contrast the source-exact feeling question with NOT DO I NEED THIS; retained checkout and feeling labels connect the comparison to the action.";
const input=FinancePlanSchema.parse(plan),resolved=compileFinancePlan(input,script,transcript,approved);
const specs=await json(`${old}/hero-captions.json`);
specs.push({source,sceneId:"scene-7",sourceSpan:"not 'do I need this'",sequenceId:s.id,elementIds:["not-need"]});
const captions=resolveHeroCaptions(specs,resolved,transcript);
const visual=await json(`${old}/visual-plan.json`);
visual.repeatedIconComposition+=";two-source-question-panels";
visual.rationale+=" Midpoint switches to equal-size qualitative question panels; no numeric encoding.";
for(const [f,value] of Object.entries({"data_visualizations.json":input,"resolved-finance-plan.json":resolved,"hero-captions.json":specs,"resolved-hero-captions.json":captions,"caption-coverage.json":editorialCaptionWords(transcript,captions),"visual-plan.json":visual,"full-script-analysis.json":{approvedVoiceText:approved,plan:await readFile("docs/day-4-sensory-revision.md","utf8")}}))await writeFile(`${out}/${f}`,JSON.stringify(value,null,2));
await writeFile(`${out}/sensory.css`, sensoryCss());
console.log("Prepared isolated sensory revision; protected files",Object.keys(before).length);

function sensoryCss(){return `/* Day 4 opt-in: stationary background paper, never on foreground ink. */
#grain-overlay { display:none; }
.shell-bg::after { content:""; position:absolute; inset:0; pointer-events:none;
 background-image:linear-gradient(rgba(245,241,232,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(245,241,232,.045) 1px,transparent 1px);
 background-size:72px 72px; }
.shell-bg::before { content:""; position:absolute; inset:0; opacity:.09; pointer-events:none;
 background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='192'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' seed='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.65'/%3E%3C/svg%3E"); }
#fm-checkout-feeling-question,#fm-checkout-feeling-not-need { border:2px solid var(--accent-gold); border-radius:24px; background:var(--navy-surface); display:flex; align-items:center; }
#fm-checkout-feeling-question .fm-copy,#fm-checkout-feeling-not-need .fm-copy { text-align:center; width:100%; }
#fm-checkout-feeling-not-need { border-color:var(--text-muted); }
#fm-checkout-feeling-not-need .fm-copy { color:var(--text-muted); }
`;}
