import {readFile,writeFile} from "node:fs/promises";
import {APPROVED_SCRIPT_FILE as source,extractApprovedVoiceOver} from "../src/contracts/content-contract.js";
import {FinancePlanSchema,compileFinancePlan,transitionFor} from "../src/contracts/finance-motion.js";
import {resolveHeroCaptions,editorialKaraokeAss,editorialCaptionWords} from "../src/contracts/hero-captions.js";
import {ScriptSchema} from "../src/render/script-schema.js";

const out="output/benchmarks/day-3-v12-differentactually";
const read=async(p:string)=>JSON.parse(await readFile(`${out}/${p}`,"utf8"));
const script=ScriptSchema.parse(await read("script.json")),transcript=await read("transcript.json");
const approved=extractApprovedVoiceOver(await readFile(source,"utf8"),3);
const ref=(scene:number,sourceSpan:string)=>({source,sceneId:`scene-${scene}`,sourceSpan});
const box=(x:number,y:number,w:number,h:number)=>({x,y,w,h});
const txt=(id:string,scene:number,label:string,b:ReturnType<typeof box>,fontSize:number,initial=false,role="SECTION_MARKER")=>({id,kind:"text",box:b,copy:{...ref(scene,label),text:label.toUpperCase()},role,fontSize,size:"heading",initial});
const node=(id:string,icon:string,b:ReturnType<typeof box>,initial=false)=>({id,kind:"node",icon,box:b,initial});
const metric=(id:string,datumId:string,b:ReturnType<typeof box>)=>({id,kind:"metric",datumId,box:b,role:"DATA_LABEL",entityGroup:id});
const ev=(id:string,scene:number,phrase:string,action:string,targets:string[],relation:string,rationale:string,extra:object={})=>({id,trigger:ref(scene,phrase),action,targets,relation,transition:transitionFor(relation),rationale,...extra});
const seq=(id:string,scenes:number[],model:string,reason:string,elements:unknown[],motionEvents:unknown[])=>({id,sceneIds:scenes.map(n=>`scene-${n}`),visualModel:model,semanticRationale:reason,entryRelation:"new-topic",entryTransition:"crossfade",elements,motionEvents});
const plan=FinancePlanSchema.parse({version:"1.2",day:3,source,referencePolicy:"VISUAL_REFERENCE_ONLY",editorial:true,
data:[
 {...ref(5,"seven-dollar"),id:"coffee-price",sourceType:"script-literal",value:7,unit:"USD",display:"$7",qualifier:"exact"},
 {...ref(6,"twelve-dollar"),id:"case-price",sourceType:"script-literal",value:12,unit:"USD",display:"$12",qualifier:"exact"},
],sequences:[
 seq("quoted-excuses",[1,2],"decision-flow","Two source-exact excuses appear around a retained cash object; quoted free is never represented as an actual zero-dollar purchase.",[
  txt("girl-math",1,"girl math",box(130,400,820,200),124,true,"HERO"),
  node("cash","wallet",box(150,720,240,200),true),
  txt("free",2,"it's free",box(460,730,480,180),92),
  txt("threshold",2,"under twenty dollars",box(130,1000,820,140),64),
  txt("not-count",2,"it doesn't count",box(130,1200,820,110),60),
 ],[
  ev("cash-focus",2,"paid in cash","focus",["cash"],"same-object","The cash object stays while the excuse is spoken."),
  ev("free-quote",2,"it's free","reveal",["free"],"progression","The exact quoted excuse is distinct from any actual price."),
  ev("threshold",2,"under twenty dollars","reveal",["threshold"],"progression","Preserve UNDER rather than turn the threshold into an exact price."),
  ev("count-quote",2,"it doesn't count","reveal",["not-count"],"progression","The second excuse completes the source-supported thought pattern."),
 ]),
 seq("quiet-cost",[3,4],"decision-flow","A spending object retains its identity while attention recedes: a qualitative thought/action contrast, not a numerical claim.",[
  txt("funny",3,"It's funny.",box(130,400,820,150),100,true,"HERO"),
  txt("expensive",3,"quietly expensive",box(130,600,820,170),86),
  node("spend","wallet",box(180,920,280,230),true),
  node("purchase","order",box(620,920,280,230)),
 ],[
  ev("cost",3,"quietly expensive","reveal",["expensive"],"progression","The exact cost contrast arrives with speech."),
  ev("everyone",3,"almost everyone","reveal",["purchase"],"progression","An ordinary purchase makes the universal behavior concrete without gender stereotyping."),
  ev("wallet-recedes",4,"round small numbers down","focus",["spend"],"same-object","Reduced prominence expresses downplaying while preserving the spending object.",{pose:{opacity:.4}}),
  ev("purchase-recedes",4,"basically nothing","focus",["purchase"],"same-object","The purchase also recedes in attention; no zero or guessed amount is shown.",{pose:{opacity:.25}}),
 ]),
 seq("actual-purchases",[5,6,7],"metric-reveal","Two independent actual prices stay readable while the excuse becomes a decision system; no addition or false causal link.",[
  node("coffee","coffee",box(160,700,290,230),true),
  metric("coffee-value","coffee-price",box(160,1030,290,220)),
  node("phone","app",box(630,700,290,230)),
  metric("phone-value","case-price",box(630,1030,290,220)),
  txt("system",7,"the actual system",box(130,400,820,240),82),
 ],[
  ev("coffee-price",5,"seven-dollar","reveal",["coffee-value"],"major-metric","The exact coffee price enters once at its spoken numeric phrase."),
  ev("phone-object",6,"A twelve-dollar","reveal",["phone"],"progression","The phone case joins the retained coffee example as a separate purchase."),
  ev("phone-price",6,"twelve-dollar","reveal",["phone-value"],"major-metric","The exact phone-case price enters without replacing the coffee price."),
  ev("coffee-secondary",6,"phone case","focus",["coffee"],"same-object","The earlier coffee becomes secondary but remains part of the same pattern.",{pose:{opacity:.65}}),
  ev("case-excuse",6,"doesn't count","focus",["phone"],"same-object","The case recedes in attention while its actual price remains fully visible.",{pose:{opacity:.5}}),
  ev("system-name",7,"the actual system","reveal",["system"],"progression","The source names the decision pattern above both actual purchases."),
  ev("decide",7,"decide what to buy","focus",["coffee","phone"],"same-object","Both actual purchase objects regain attention as the buying decision is described.",{pose:{opacity:1}}),
 ]),
 seq("observation-ledger",[8,9,10],"decision-flow","An exact one-week observation window gathers the two earlier example objects into one place, without inventing totals or purchase frequency.",[
  txt("week",8,"for one week",box(130,390,820,160),96,true,"HERO"),
  node("calendar","calendar",box(420,640,240,190),true),
  {...node("coffee-record","coffee",box(160,920,290,150)),entityGroup:"observation-records"},
  {...node("case-record","app",box(630,920,290,150)),entityGroup:"observation-records"},
  txt("real-number",9,"the real number",box(130,650,820,170),90),
 ],[
  ev("week-focus",8,"one week","focus",["calendar"],"same-object","The calendar identifies the approved observation window without named dates."),
  ev("write-coffee",8,"write down","reveal",["coffee-record"],"progression","The coffee object becomes an unnumbered ledger entry, not a new purchase."),
  ev("one-place",8,"in one place","reveal",["case-record"],"accumulation","The case entry joins the same observation area; no extra counts or values."),
  ev("clear-calendar",9,"Not to guilt yourself","hide",["calendar"],"same-object","The calendar clears before the observation payoff occupies its lane."),
  ev("real-number",9,"the real number","reveal",["real-number"],"progression","The exact observation goal is text only, never an invented total."),
  ev("case-lower-lane",10,"but by what","focus",["case-record"],"same-object","The contrast moves the existing case into a separate lower lane before both records widen.",{pose:{box:box(630,1150,290,150)}}),
  ev("coffee-align",10,"all","focus",["coffee-record"],"same-object","The existing coffee entry aligns into a retained list only after the case has cleared its lane.",{pose:{box:box(160,920,760,150)}}),
  ev("case-align",10,"all","focus",["case-record"],"same-object","The case expands in its already separated lower lane without crossing the coffee entry.",{pose:{box:box(160,1150,760,150)}}),
  ev("outro-clear",10,"Sunday","hide",["week","coffee-record","case-record","real-number"],"same-object","The spoken observation ends before the locked profile CTA.",{anchor:"end"}),
 ]),
]});
const resolved=compileFinancePlan(plan,script,transcript,approved);
const specs=[
 {...ref(1,"girl math"),sequenceId:"quoted-excuses",elementIds:["girl-math"]},
 {...ref(3,"It's funny."),sequenceId:"quiet-cost",elementIds:["funny"]},
 {...ref(3,"quietly expensive"),sequenceId:"quiet-cost",elementIds:["expensive"]},
 {...ref(7,"the actual system"),sequenceId:"actual-purchases",elementIds:["system"]},
 {...ref(8,"for one week"),sequenceId:"observation-ledger",elementIds:["week"]},
 {...ref(9,"the real number"),sequenceId:"observation-ledger",elementIds:["real-number"]},
];
const captions=resolveHeroCaptions(specs,resolved,transcript);
const highlights={version:"1.0",day:3,source,items:[
 {id:"coffee-price",sceneId:"scene-5",spokenPhrase:"seven-dollar",canonicalText:"seven-dollar iced coffee",displayText:"$7",context:"iced coffee",target:"stat.value",template:"stat-hero"},
 {id:"case-price",sceneId:"scene-6",spokenPhrase:"twelve-dollar",canonicalText:"twelve-dollar phone case",displayText:"$12",context:"phone case",target:"stat.value",template:"stat-hero"}
]};
for(const [f,data] of Object.entries({"data_visualizations.json":plan,"resolved-finance-plan.json":resolved,"hero-captions.json":specs,"resolved-hero-captions.json":captions,"number_highlights.json":highlights,"caption-coverage.json":editorialCaptionWords(transcript,captions)}))await writeFile(`${out}/${f}`,JSON.stringify(data,null,2));
await writeFile(`${out}/subtitles.ass`,editorialKaraokeAss(transcript,captions,script));
console.log("Day 3 compiled",resolved.sequences.map(s=>({id:s.id,start:s.startSec,end:s.endSec})));
