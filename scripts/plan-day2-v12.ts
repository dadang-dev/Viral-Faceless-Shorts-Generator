import {readFile,writeFile} from "node:fs/promises";
import {APPROVED_SCRIPT_FILE as source,extractApprovedVoiceOver,assertScriptIntegrity} from "../src/contracts/content-contract.js";
import {FinancePlanSchema,compileFinancePlan,transitionFor} from "../src/contracts/finance-motion.js";
import {resolveHeroCaptions,editorialKaraokeAss,editorialCaptionWords} from "../src/contracts/hero-captions.js";
import {ScriptSchema} from "../src/render/script-schema.js";
import {objectStoryboard,OBJECT_OUTPUT} from './day2-object-storyboard.js';

const out=process.env.DAY2_OUTPUT_DIR ?? "output/benchmarks/day-2-v12";
const read=async(file:string)=>JSON.parse(await readFile(`${out}/${file}`,"utf8"));
const repositoryRules=await readFile("AGENTS.md","utf8");
const workflow=await readFile("workflow.md","utf8");
if(!repositoryRules.includes("Visual hard gates")||!repositoryRules.includes("Canonical source"))throw new Error("INSTRUCTION_LOCK: AGENTS.md missing Money Habits invariants");
if(!workflow.includes("Day 2")||!workflow.includes("no-stray-connector"))throw new Error("WORKFLOW_LOCK: workflow.md missing Day 2 visual rules");
const script=ScriptSchema.parse(await read("script.json")),transcript=await read("transcript.json");
const approved=extractApprovedVoiceOver(await readFile(source,"utf8"),2);assertScriptIntegrity(script,approved);
const ref=(scene:number,sourceSpan:string)=>({source,sceneId:`scene-${scene}`,sourceSpan});
const box=(x:number,y:number,w:number,h:number)=>({x,y,w,h});
const copy=(scene:number,text:string)=>({...ref(scene,text),text:text.toUpperCase()});
const el=(id:string,kind:string,b:ReturnType<typeof box>,extra:object={})=>({id,kind,box:b,...extra});
const text=(id:string,scene:number,label:string,b:ReturnType<typeof box>,role:"HERO"|"SECTION_MARKER"|"STRUCTURAL_LABEL",fontSize:number,initial=true)=>el(id,"text",b,{copy:copy(scene,label),role,fontSize,size:"heading",initial});
const node=(id:string,scene:number,label:string,b:ReturnType<typeof box>,icon:"home"|"car"|"meal"|"wallet"|"question"|"desire"|"calendar"|undefined,initial=false,connectsTo?:string)=>el(id,"node",b,{...(label?{copy:copy(scene,label),role:"STRUCTURAL_LABEL"}:{}),...(icon?{icon}:{}),initial,...(connectsTo?{connectsTo}:{})});
const ev=(id:string,scene:number,phrase:string,action:string,targets:string[],relation:string,rationale:string,extra:object={})=>({id,trigger:ref(scene,phrase),action,targets,relation,transition:transitionFor(relation),rationale,...extra});
const seq=(id:string,scenes:number[],model:string,rationale:string,elements:unknown[],events:unknown[],minimalismReason?:string)=>({id,sceneIds:scenes.map(n=>`scene-${n}`),visualModel:model,semanticRationale:rationale,elements,motionEvents:events,entryRelation:"new-topic",entryTransition:"crossfade",...(minimalismReason?{minimalismReason}:{})});
const datum={...ref(4,"two hundred dollars"),sourceType:"script-literal",id:"apartment-increase",display:"$200 / MONTH",value:200,unit:"USD/month",qualifier:"exact",unitSource:ref(4,"more a month")};
const monthsDatum={...ref(2,"six months later"),sourceType:"script-literal",id:"six-months",display:"6 MONTHS",value:6,unit:"months",qualifier:"exact"};

let plan=FinancePlanSchema.parse({version:"1.2",day:2,source,referencePolicy:"VISUAL_REFERENCE_ONLY",editorial:true,data:[monthsDatum,datum],sequences:[
  seq("raise-hook",[1,2,3],"typography","The raise-to-broke paradox is a single expectation-reversal composition: the raise clears, the exact six-month interval gets a calendar/number reveal, lifestyle creep is named, and the thesis hands off cleanly to accumulated choices.",[
    text("raise",1,"you can get a raise",box(130,400,820,320),"HERO",110,true),
    node("wallet",1,"",box(420,800,240,190),"wallet",true),
    text("broke",2,"still feel broke",box(130,420,820,280),"SECTION_MARKER",104,false),
    el("months","metric",box(130,740,820,280),{datumId:"six-months",icon:"calendar",role:"DATA_LABEL",entityGroup:"time-jump"}),
    text("creep",2,"lifestyle creep",box(110,1050,860,170),"SECTION_MARKER",82,false),
  ],[
    ev("raise-focus",1,"get a raise","focus",["wallet"],"same-object","The same wallet settles below the protected HERO zone while the raise is spoken.",{pose:{box:box(420,800,240,190)}}),
    ev("raise-punch",1,"raise","punch",["raise"],"major-metric","A restrained scale emphasis follows the exact hook word without inventing a number."),
    ev("broke-reveal",2,"still feel broke","reveal",["broke"],"progression","The expected relief reverses into the exact broke outcome inside the same retained argument."),
    ev("clear-raise-on-broke",1,"raise","hide",["raise"],"new-topic","The opening headline clears at the last WordBoundary of raise, fully before the broke headline enters; the wallet and brand remain visible through the handoff.",{anchor:"end"}),
    ev("broke-focus",2,"still feel broke","hide",["wallet"],"same-object","The wallet fully clears before the sourced calendar interval enters; ordinary wording stays in captions rather than duplicating the numeric visual."),
    ev("months-reveal",2,"six months later","reveal",["months"],"major-metric","The approved six-month phrase is shown as an exact 6 MONTHS metric with a calendar icon and transcript-timed stat punch."),
    ev("name-concept",2,"lifestyle creep","reveal",["creep"],"new-topic","The exact approved concept name appears at its WordBoundary."),
  ],"The opening is one expectation-reversal scene with an explicit time-passage treatment; subtitles carry regular narration while only exact sourced beats enter the canvas."),
  seq("choice-accumulation",[4,5,6,7],"decision-flow","A single centered lifestyle stack mutates in place: apartment and its approved monthly tag occupy a clean top lane, the car changes from used to new lease without a connector arrow, then appetizer and dessert join as separate lower-lane objects before a compressed state settles.",[
    el("home","node",box(110,430,860,220),{copy:copy(4,"a slightly nicer apartment"),role:"STRUCTURAL_LABEL",icon:"home",initial:true,entityGroup:"apartment"}),
    el("apartment-cost","metric",box(110,700,860,180),{datumId:"apartment-increase",role:"DATA_LABEL",entityGroup:"apartment"}),
    node("car-old",5,"a used car",box(110,900,410,170),"car",false),
    node("car-new",5,"a new lease",box(600,900,410,170),"car",false),
    node("appetizer",6,"the appetizer",box(110,1130,410,170),"meal",false),
    node("dessert",6,"dessert",box(600,1130,410,170),"meal",false),
  ],[
    ev("home-choice",4,"slightly nicer apartment","focus",["home"],"progression","The apartment is the first concrete choice and receives the largest initial footprint.",{pose:{box:box(110,430,860,220)}}),
    ev("apartment-cost",4,"two hundred dollars","reveal",["apartment-cost"],"major-metric","The only approved financial value appears exactly when spoken; it is a brief fact reveal, not a chart."),
    ev("metric-secondary",5,"upgrading","focus",["apartment-cost"],"same-object","Once transport arrives, the exact apartment increment moves horizontally into a compact retained metric lane without crossing any object text.",{pose:{box:box(650,700,360,180),opacity:.62,fontSize:42}}),
    ev("home-settle",5,"upgrading","focus",["home"],"progression","The apartment compresses into a retained category in the opposite lane while the car state takes the visual center.",{pose:{box:box(110,300,520,220),opacity:.78,fontSize:40}}),
    ev("old-car",5,"used car","reveal",["car-old"],"progression","The existing car state enters first as the before state, with no diagonal connector."),
    ev("new-lease",5,"new lease","reveal",["car-new"],"progression","The new lease appears as a meaningful state mutation, not a second unrelated card."),
    ev("old-car-recede",5,"new lease","focus",["car-old"],"same-object","The used-car state recedes while remaining legible as the before state.",{pose:{opacity:.3}}),
    ev("appetizer",6,"appetizer","reveal",["appetizer"],"accumulation","The appetizer joins the accumulated choice system."),
    ev("dessert",6,"dessert","reveal",["dessert"],"accumulation","Dessert joins rather than replacing the appetizer, matching AND."),
    ev("home-pressure",7,"Each choice feels small and reasonable","focus",["home"],"same-object","The apartment remains a readable retained state while the choice lanes compress around it.",{pose:{box:box(110,300,500,190),opacity:.72,fontSize:40}}),
    ev("metric-pressure",7,"Each choice feels small and reasonable","focus",["apartment-cost"],"same-object","The exact monthly tag stays visible but subordinate after its one strong reveal.",{pose:{box:box(650,300,360,180),opacity:.5,fontSize:42}}),
    ev("car-old-pressure",7,"Each choice feels small and reasonable","focus",["car-old"],"same-object","The old-car state remains as a dim before-state inside the compressed accumulation.",{pose:{box:box(110,590,410,170),opacity:.28}}),
    ev("car-new-pressure",7,"Each choice feels small and reasonable","focus",["car-new"],"same-object","The new lease retains its meaning while sharing the compressed state.",{pose:{box:box(600,590,410,170),opacity:.82}}),
    ev("appetizer-pressure",7,"Each choice feels small and reasonable","focus",["appetizer"],"same-object","The appetizer remains in the stack rather than being discarded.",{pose:{box:box(110,810,410,170),opacity:.78}}),
    ev("dessert-pressure",7,"Each choice feels small and reasonable","focus",["dessert"],"same-object","Dessert completes the stack and carries the final reasonable-choice emphasis.",{pose:{box:box(600,810,410,170),opacity:.95}}),
  ]),
  seq("parallel-rise",[8],"decision-flow","The narration supports a qualitative finance relationship, so two labeled state tracks expand from a compact left anchor to matched lengths, then the spending track advances slightly ahead at the exact sometimes-faster phrase; no amounts or scale are invented.",[
    text("stack",8,"stack them up",box(110,390,860,270),"HERO",110),
    node("spending",8,"your spending",box(110,730,430,170),undefined,false),
    node("income",8,"your income",box(110,990,430,170),"wallet",false),
  ],[
    ev("spending-enter",8,"your spending","reveal",["spending"],"progression","Spending enters as a labeled state track without an invented amount."),
    ev("income-enter",8,"your income","reveal",["income"],"comparison","Income enters as the paired conceptual state track."),
    ev("clear-stack",8,"your spending","hide",["stack"],"new-topic","The accumulation command yields to the related moving states."),
    ev("spending-rise",8,"rises exactly as fast","focus",["spending"],"same-object","Spending expands along its track during the sourced rise relationship.",{pose:{box:box(110,730,700,170)}}),
    ev("income-rise",8,"your income","focus",["income"],"same-object","Income expands by the same distance once its exact source phrase is spoken, making rate parity visible without a quantitative scale.",{pose:{box:box(110,990,700,170)}}),
    ev("spending-faster",8,"sometimes faster","focus",["spending"],"same-object","Spending moves one restrained step ahead only when sometimes faster is spoken.",{pose:{box:box(110,730,860,170)}}),
  ]),
  seq("deprivation-reframe",[9],"typography","The exact reframe clears the prior state and is sufficiently strong as premium editorial typography.",[
    text("reframe",9,"The fix isn't depriving yourself.",box(110,570,860,360),"HERO",105),
  ],[
    ev("reframe-focus",9,"isn't depriving yourself","focus",["reframe"],"same-object","The full sourced correction remains the sole dominant idea."),
  ],"A short emotional reframe; additional diagrams would add no meaning."),
  seq("choice-question",[10],"decision-flow","The exact noticing question is a compact central state that opens into a two-branch wanted-versus-could fork; the branch labels are the approved source phrases, not a rewritten summary.",[
    node("question",10,"spending go up",box(150,470,780,190),"question",true),
    {...node("wanted-icon",10,"",box(170,900,260,200),"desire",false),entityGroup:"wanted-branch"},
    {...text("wanted-copy",10,"because I actually wanted this",box(90,1150,420,190),"SECTION_MARKER",48,false),entityGroup:"wanted-branch"},
    {...node("could-icon",10,"",box(650,900,260,200),"wallet",false),entityGroup:"could-branch"},
    {...text("could-copy",10,"because I could",box(570,1150,420,190),"SECTION_MARKER",48,false),entityGroup:"could-branch"},
  ],[
    ev("question-focus",10,"did my spending go up","focus",["question"],"same-object","The central question state opens the fork at the exact noticing phrase.",{pose:{box:box(150,430,780,190)}}),
    ev("wanted",10,"because I actually wanted this","reveal",["wanted-icon","wanted-copy"],"progression","The desire branch enters only with its exact spoken wording."),
    ev("could",10,"because I could","reveal",["could-icon","could-copy"],"comparison","The affordability branch enters as the contrasted alternative."),
  ]),
  seq("question-payoff",[11],"typography","The source-exact question phrase remains the payoff object while the rest of the claim stays in captions; it clears before the profile CTA.",[
    text("one-question",11,"That one question",box(110,570,860,330),"HERO",125),
    node("honesty",11,"",box(420,950,240,210),"question",true),
  ],[
    ev("honest-focus",11,"asked honestly","focus",["honesty"],"same-object","The sustained question state activates as honesty is spoken."),
    ev("payoff-clear-copy",11,"app","hide",["one-question"],"same-object","The dominant spoken payoff clears at the final WordBoundary before CTA." ,{anchor:"end"}),
    ev("payoff-clear-icon",11,"app","hide",["honesty"],"same-object","The question object clears with the spoken payoff before CTA.",{anchor:"end"}),
  ],"A calm payoff state is intentional; the profile CTA supplies the post-speech action."),
]});

if(out.replaceAll('\\','/')===OBJECT_OUTPUT||process.env.DAY2_OBJECT_STORYBOARD==='1')plan=FinancePlanSchema.parse(objectStoryboard(plan));
const resolved=compileFinancePlan(plan,script,transcript,approved);
// Same-lane headlines need a complete content handoff, not merely disjoint
// static boxes. Shared hide duration is 180ms; resolve both anchors from speech.
const hookEvents=resolved.sequences.find(s=>s.id==="raise-hook")!.motionEvents;
if(hookEvents.find(e=>e.id==="clear-raise-on-broke")!.atSec+.18>hookEvents.find(e=>e.id==="broke-reveal")!.atSec)throw new Error("DAY2_HEADLINE_HANDOFF: raise must be fully hidden before broke enters");
const captionSpecs=[
  {...ref(1,"you can get a raise"),sequenceId:"raise-hook",elementIds:["raise"]},
  {...ref(2,"still feel broke"),sequenceId:"raise-hook",elementIds:["broke"]},
  {...ref(2,"lifestyle creep"),sequenceId:"raise-hook",elementIds:["creep"]},
  {...ref(8,"stack them up"),sequenceId:"parallel-rise",elementIds:["stack"]},
  {...ref(9,"The fix isn't depriving yourself."),sequenceId:"deprivation-reframe",elementIds:["reframe"]},
  {...ref(10,"because I actually wanted this"),sequenceId:"choice-question",elementIds:["wanted-copy"]},
  {...ref(10,"because I could"),sequenceId:"choice-question",elementIds:["could-copy"]},
  {...ref(11,"That one question"),sequenceId:"question-payoff",elementIds:["one-question"]},
];
if(out.replaceAll('\\','/')===OBJECT_OUTPUT||process.env.DAY2_OBJECT_STORYBOARD==='1')captionSpecs.splice(captionSpecs.findIndex(s=>s.sequenceId==='parallel-rise'),1);
const captions=resolveHeroCaptions(captionSpecs,resolved,transcript);
const highlights={version:"1.0",day:2,source,items:[
  {id:"six-months",sceneId:"scene-2",spokenPhrase:"six months later",canonicalText:"six months later",displayText:"6 MONTHS",context:"six months later",target:"stat.value",template:"stat-hero"},
  {id:"apartment-increase",sceneId:"scene-4",spokenPhrase:"two hundred dollars",canonicalText:"two hundred dollars",displayText:"$200 / MONTH",context:"more a month",target:"stat.value",template:"stat-hero"}
]};
const artifacts={"data_visualizations.json":plan,"resolved-finance-plan.json":resolved,"number_highlights.json":highlights,"hero-captions.json":captionSpecs,"resolved-hero-captions.json":captions,"caption-coverage.json":editorialCaptionWords(transcript,captions)};
for(const [file,value] of Object.entries(artifacts))await writeFile(`${out}/${file}`,JSON.stringify(value,null,2));
await writeFile(`${out}/subtitles.ass`,editorialKaraokeAss(transcript,captions,script));
console.log("DAY 2 v1.2 PLAN COMPILED",resolved.sequences.map(sequence=>({id:sequence.id,start:sequence.startSec,end:sequence.endSec,model:sequence.visualModel})));
