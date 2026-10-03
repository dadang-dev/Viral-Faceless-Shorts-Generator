import { readFile, writeFile } from "node:fs/promises";
import { APPROVED_SCRIPT_FILE as source, extractApprovedVoiceOver, assertScriptIntegrity } from "../src/contracts/content-contract.js";
import { FinancePlanSchema, compileFinancePlan, transitionFor } from "../src/contracts/finance-motion.js";
import { resolveHeroCaptions, editorialKaraokeAss, editorialCaptionWords } from "../src/contracts/hero-captions.js";
import { ScriptSchema } from "../src/render/script-schema.js";
import { assertBenchmarkDestination } from "../src/contracts/benchmark-isolation.js";
import { resolve } from "node:path";

const out=process.env.DAY1_OUTPUT_DIR ?? "output/benchmarks/day-1-v12-toolkit-refresh";
assertBenchmarkDestination(out);
if(resolve(out)===resolve("output/benchmarks/day-1-v12-editorial-r2"))throw new Error("IMMUTABLE_BASELINE: use a new Day 1 benchmark");
const read=async(f:string)=>JSON.parse(await readFile(`${out}/${f}`,"utf8"));
const script=ScriptSchema.parse(await read("script.json")), transcript=await read("transcript.json");
const approved=extractApprovedVoiceOver(await readFile(source,"utf8"),1);
assertScriptIntegrity(script,approved);
const ref=(n:number,sourceSpan:string)=>({source,sceneId:`scene-${n}`,sourceSpan});
const box=(x:number,y:number,w:number,h:number)=>({x,y,w,h});
// Day 1 refresh reserves Anton's actual ink height (not just line-height):
// 164px hook needs 216px; 160px metrics need 208px; count tracks need 250px.
// Frequency/result lanes retain scale headroom below the shared 1340px limit.
const copy=(n:number,text:string)=>({...ref(n,text),text:text.toUpperCase()});
const el=(id:string,kind:string,b:ReturnType<typeof box>,extra:object={})=>({id,kind,box:b,...extra});
const text=(id:string,n:number,label:string,b:ReturnType<typeof box>,role:string,fontSize:number,initial=true)=>el(id,"text",b,{copy:copy(n,label),role,fontSize,size:"heading",initial});
const ev=(id:string,n:number,phrase:string,action:string,targets:string[],relation:string,rationale:string,extra:object={})=>({id,trigger:ref(n,phrase),action,targets,relation,transition:transitionFor(relation),rationale,...extra});
const seq=(id:string,scenes:number[],model:string,rationale:string,elements:unknown[],events:unknown[],minimalismReason?:string)=>({id,sceneIds:scenes.map(n=>`scene-${n}`),visualModel:model,semanticRationale:rationale,elements,motionEvents:events,entryRelation:"new-topic",entryTransition:"crossfade",...(minimalismReason?{minimalismReason}:{})});
const literal=(id:string,n:number,phrase:string,value:number,unit:string,display:string,qualifier="exact",unitSource?:ReturnType<typeof ref>)=>({...ref(n,phrase),sourceType:"script-literal",id,value,unit,display,qualifier,...(unitSource?{unitSource}:{})});
const chapter=(n:number,number:string,title:string)=>[
  text("chapter",n,number,box(110,470,860,170),"SECTION_MARKER",115,false),
  text("heading",n,title,box(110,690,860,230),"SECTION_MARKER",68,false),
];
const settle=(n:number,_title:string,objectId="object")=>[
  ev("section-marker-enter",n,`Number ${n===3?"one":n===6?"two":"three"}` ,"reveal",["chapter","heading"],"new-topic","The section marker enters at its transcript-linked spoken start, after the previous caption has ended."),
  ev("settle-number",n,n===3?"one":n===6?"two":"three","focus",["chapter"],"same-object","Chapter marker becomes persistent structural header.",{pose:{box:box(110,270,860,70),fontSize:46}}),
  ev("settle-title",n,n===3?"one":n===6?"two":"three","focus",["heading"],"same-object","Same title shrinks as the financial entity begins.",{pose:{box:box(110,365,860,125),fontSize:52}}),
  ev("chapter-object",n,n===3?"one":n===6?"two":"three","reveal",[objectId],"progression","At the number word's end, introduce the entity after the header has moved clear; timing remains WordBoundary-derived.",{anchor:"end"}),
];
const plan=FinancePlanSchema.parse({version:"1.2",day:1,source,referencePolicy:"VISUAL_REFERENCE_ONLY",editorial:true,
  data:[
    literal("streaming",4,"fourteen dollars",14,"USD","$14"),literal("fitness",4,"nine",9,"USD","$9","exact",ref(4,"fourteen dollars")),
    literal("cloud",5,"five for cloud storage",5,"USD","$5","exact",ref(4,"fourteen dollars")),literal("apps",5,"five apps",5,"apps","5 APPS"),
    literal("order",7,"ten dollars",10,"USD","$10"),literal("nights",8,"four nights a week",4,"nights/week","4 NIGHTS A WEEK"),
    literal("order-month",8,"about a hundred and seventy dollars a month",170,"USD/month","ABOUT $170 / MONTH","about"),
    literal("coffee",10,"eighteen-dollar",18,"USD","$18"),literal("mental",10,"like twenty bucks",20,"USD","~$20","approx"),
    literal("frequency",11,"three times a week",3,"times/week","3 TIMES A WEEK"),literal("coffee-month",11,"over two hundred dollars a month",200,"USD/month","OVER $200 / MONTH","over"),
  ],
  relationships:[{id:"order-monthly",kind:"weekly-spend-to-month",purchaseId:"order",frequencyId:"nights",resultId:"order-month",convention:"52/12"},{id:"coffee-monthly",kind:"weekly-spend-to-month",purchaseId:"coffee",frequencyId:"frequency",resultId:"coffee-month",convention:"52/12"}],
  sequences:[
    seq("opening",[1],"typography","A complete source-exact reassurance is carried by one readable typography hero.",[
      text("hero",1,"You're not bad with money.",box(110,600,860,360),"HERO",105),
    ],[ev("emphasize",1,"not bad","focus",["hero"],"same-object","Keep complete hero readable, no competing bottom caption.")],"Intentional short reassurance hero, not a chart or process."),
    seq("hook",[2],"typography","Three habits is the dominant payload; all remaining exact words are subordinate, without decorative loop icons.",[
      text("lead",2,"You just have",box(110,470,860,90),"HERO",48),
      {...text("payload",2,"three habits",box(110,650,860,230),"HERO",164),numericTypography:true},
      text("support",2,"working against you without you noticing",box(130,960,820,210),"HERO",52),
    ],[ev("payload-focus",2,"three habits","focus",["payload"],"same-object","Focus is on the actual hook, not decorative icons.")],"Complete source phrase stays readable and carries its own caption; hierarchy supplies emphasis."),
    seq("subscriptions",[3,4,5],"stacked-cost","The original three priced app objects are retained and two anonymous app objects join, yielding five total, never eight.",[
      ...chapter(3,"Number one","subscription creep"),
      el("object","node",box(420,625,240,220),{icon:"app"}),
      el("streaming","stack-item",box(110,530,860,130),{datumId:"streaming",copy:copy(4,"streaming app"),icon:"stream",role:"DATA_LABEL",entityGroup:"apps"}),
      el("fitness","stack-item",box(110,690,860,130),{datumId:"fitness",copy:copy(4,"fitness app"),icon:"fitness",role:"DATA_LABEL",entityGroup:"apps"}),
      el("cloud","stack-item",box(110,850,860,130),{datumId:"cloud",copy:copy(5,"cloud storage"),icon:"cloud",role:"DATA_LABEL",entityGroup:"apps"}),
      el("app-four","node",box(110,1010,180,145),{icon:"app",entityGroup:"apps"}),el("app-five","node",box(320,1010,180,145),{icon:"app",entityGroup:"apps"}),
      el("total","metric",box(540,1030,430,220),{datumId:"apps",role:"DATA_LABEL"}),
    ],[
      ...settle(3,"subscription creep"),ev("clear-object",4,"fourteen dollars","hide",["object"],"same-object","The generic opening object yields to the first named app; it is not a sixth subscription."),
      ev("streaming",4,"fourteen dollars","stack",["streaming"],"accumulation","First subscription becomes slot one of the retained total."),
      ev("fitness",4,"nine","stack",["fitness"],"accumulation","Second subscription joins the first."),
      ev("cloud",5,"five for cloud storage","stack",["cloud"],"accumulation","Third subscription joins the same retained stack."),
      ev("forget-streaming",5,"you forgot you even signed up for","focus",["streaming"],"same-object","The first known subscription recedes as awareness fades.",{pose:{opacity:.35}}),
      ev("forget-fitness",5,"even signed up for","focus",["fitness"],"same-object","The second known subscription recedes progressively during the forgetting clause.",{pose:{opacity:.35}}),
      ev("forget-cloud",5,"signed up for","focus",["cloud"],"same-object","The third known subscription recedes before the total reorganizes.",{pose:{opacity:.35}}),
      ev("restore-known",5,"until you're paying for five apps","focus",["streaming","fitness","cloud"],"same-object","Known subscriptions return as slots one through three of the five-app total.",{pose:{opacity:1}}),
      ev("five-total",5,"five apps","reveal",["app-four","app-five","total"],"accumulation","Exactly two anonymous objects join the existing three; the label is the five-object total."),
    ]),
    seq("convenience",[6,7,8],"accumulation-timeline","A single order price becomes four marked positions in a seven-position week and the approved approximate monthly consequence.",[
      ...chapter(6,"Number two","convenience spending"),
      el("order-action","node",box(230,530,210,160),{icon:"app",connectsTo:"object"}),
      el("object","node",box(640,530,210,160),{icon:"order"}),
      el("price","metric",box(310,715,460,210),{datumId:"order",role:"DATA_LABEL"}),
      el("week","markers",box(110,950,860,250),{datumId:"nights",icon:"order",weekSlots:7,frequencyMode:"count-only",retainedMarkerId:"object",role:"DATA_LABEL"}),
      el("monthly","metric",box(110,1200,860,130),{datumId:"order-month",role:"DATA_LABEL"}),
    ],[
      ...settle(6,"convenience spending","order-action"),
      ev("ordering",7,"I'll just order it","reveal",["object"],"progression","The phone/order action resolves into a takeout bag before the price is spoken; the linking path encodes checkout progression."),
      ev("order-confirm",7,"I'm tired","focus",["object"],"same-object","The order state activates while the quote stays in subtitles; no invented text or early price."),
      ev("price",7,"ten dollars","reveal",["price"],"major-metric","The first literal order cost appears at its WordBoundary."),
      ev("repeat",8,"ten dollars","punch",["price"],"major-metric","The repeated literal price is emphasized without moving into the order object."),
      ev("checkout-complete",8,"ten dollars","hide",["order-action"],"same-object","Clear the completed checkout object and its attached connector before the retained order moves into the weekly track."),
      ev("order-place",8,"four nights a week","focus",["object"],"same-object","The same order moves horizontally clear of the price before descending to its first weekly slot.",{pose:{box:box(122,960,113,100),route:"horizontal-first"}}),
      ev("frequency",8,"four nights a week","reveal",["week"],"accumulation","Seven fixed day positions, precisely four highlighted order events."),
      ev("monthly",8,"about a hundred and seventy dollars a month","reveal",["monthly"],"major-metric","Show approved approximate monthly result; no intermediate totals."),
    ]),
    seq("rounding",[9,10,11],"accumulation-timeline","The actual coffee price remains anchored while a separate approximate mental overlay appears; the purchase object then joins three count-only weekly events and the approved monthly impact.",[
      ...chapter(9,"Number three","rounding it off in your head"),
      el("object","node",box(420,530,240,160),{icon:"coffee"}),
      el("price","metric",box(330,715,300,210),{datumId:"coffee",role:"DATA_LABEL",semanticState:"actual"}),
      el("mental","metric",box(660,715,260,200),{datumId:"mental",role:"DATA_LABEL",semanticState:"mental"}),
      el("week","markers",box(110,950,860,250),{datumId:"frequency",icon:"coffee",weekSlots:7,frequencyMode:"count-only",retainedMarkerId:"object",role:"DATA_LABEL"}),
      el("monthly","metric",box(110,1200,860,130),{datumId:"coffee-month",role:"DATA_LABEL"}),
    ],[
      ...settle(9,"rounding it off"),
      ev("actual-anchor",10,"You think of an","focus",["object"],"same-object","The purchase object establishes the actual transaction state before either number is shown."),
      ev("price",10,"eighteen-dollar","reveal",["price"],"major-metric","Exact actual coffee purchase price remains anchored; no comparison bars."),
      ev("mental",10,"like twenty bucks","reveal",["mental"],"progression","A separate offset dashed overlay encodes the approximate mental representation without replacing the actual price."),
      ev("retain-price",11,"three times a week","focus",["price"],"same-object","Keep the actual eighteen-dollar price visible as the same purchase starts repeating."),
      ev("mental-recede",11,"three times a week","focus",["mental"],"same-object","The mental approximation recedes while remaining contextual; frequency derives from the actual purchase object.",{pose:{opacity:.25}}),
      ev("merge-object",11,"three times a week","focus",["object"],"same-object","The original coffee moves clear of the price then down into the first of three weekly events; only two further cups enter.",{pose:{box:box(122,960,113,100),route:"horizontal-first"}}),
      ev("weekly",11,"three times a week","reveal",["week"],"accumulation","Three coffee events occupy the same weekly structure."),
      ev("monthly",11,"over two hundred dollars a month","reveal",["monthly"],"major-metric","Preserve OVER; actual eighteen-dollar input validates this consequence."),
    ]),
    seq("reframe",[12],"typography","Source-exact reassurance is intentionally emphasized without a decorative card or duplicate caption.",[
      text("hero",12,"None of these make you careless.",box(110,560,860,440),"HERO",105),
    ],[ev("careless",12,"careless","focus",["hero"],"same-object","The complete reframe remains clearly readable as its own caption.")],"Intentional emotional reframe; typography is semantically sufficient."),
    seq("awareness",[13,14,15],"metric-reveal","Three established habit categories become dim background entities; a generic attention object moves into foreground without selecting a habit for the viewer.",[
      // Keep the retained habit row above the outgoing reframe hero during
      // the locked 180ms crossfade.  The previous y=560 lane overlapped the
      // reframe hero (y=560..1000), producing a readable ghost headline
      // behind the incoming icons at the scene-12 -> awareness handoff.
      el("subscription","node",box(160,300,200,190),{icon:"app",initial:true}),el("order","node",box(440,300,200,190),{icon:"order",initial:true}),el("coffee","node",box(720,300,200,190),{icon:"coffee",initial:true}),
      el("notice","node",box(440,795,200,190),{icon:"voice"}),
    ],[
      ev("background",13,"quietly in the background","focus",["subscription","order","coffee"],"same-object","Established habits recede; they are real entities, not sentence boxes.",{pose:{opacity:.25}}),
      ev("notice",14,"This week","reveal",["notice"],"progression","Introduce a dim generic naming object alongside the background habit categories, not a viewer-specific selection.",{revealOpacity:.25}),
      ev("foreground",14,"try naming just one","focus",["notice"],"same-object","The same generic naming object moves from dim background into the foreground spotlight.",{pose:{box:box(380,820,320,300),opacity:1}}),
      ev("handoff",15,"break","hide",["notice"],"same-object","Hold the noticed state through final narration, then clear foreground before the post-speech CTA."),
    ],"A state model of background awareness, without invented process states or financial metric."),
  ]});
// Awareness is a stateful collection of entity nodes, not a numeric metric reveal.
plan.sequences.at(-1)!.visualModel="typography";
const resolved=compileFinancePlan(plan,script,transcript,approved);
const captions=[
  {...ref(1,script.scenes[0].voiceText),sequenceId:"opening",elementIds:["hero"]},
  {...ref(2,script.scenes[1].voiceText),sequenceId:"hook",elementIds:["lead","payload","support"]},
  {...ref(3,script.scenes[2].voiceText),sequenceId:"subscriptions",elementIds:["chapter","heading"]},
  {...ref(6,script.scenes[5].voiceText),sequenceId:"convenience",elementIds:["chapter","heading"]},
  {...ref(9,script.scenes[8].voiceText),sequenceId:"rounding",elementIds:["chapter","heading"]},
  {...ref(12,script.scenes[11].voiceText),sequenceId:"reframe",elementIds:["hero"]},
];
const resolvedCaptions=resolveHeroCaptions(captions,resolved,transcript);
const highlights={version:"1.0",day:1,source,items:plan.data.filter(d=>d.sourceType==="script-literal").map(d=>({...d,id:d.id,spokenPhrase:d.sourceSpan,canonicalText:d.sourceSpan,displayText:d.display,target:"stat.value",template:"stat-hero"})).map(({id,sceneId,spokenPhrase,canonicalText,displayText,target,template})=>({id,sceneId,spokenPhrase,canonicalText,displayText,target,template}))};
const output={"data_visualizations.json":plan,"resolved-finance-plan.json":resolved,"number_highlights.json":highlights,"hero-captions.json":captions,"resolved-hero-captions.json":resolvedCaptions,"caption-coverage.json":editorialCaptionWords(transcript,resolvedCaptions),"visual-plan.json":{...(JSON.parse(await readFile("output/benchmarks/day-1-v12/visual-plan.json","utf8"))),rationale:"Verified Day 1 R2: clean dominant foreground handoffs, progressive subscription forgetting, order-action progression, count-only frequency meters, separate actual and mental price states, and awareness-state reframe."}};
for(const [name,value] of Object.entries(output)) await writeFile(`${out}/${name}`,JSON.stringify(value,null,2));
await writeFile(`${out}/subtitles.ass`,editorialKaraokeAss(transcript,resolvedCaptions,script));
console.log("EDITORIAL PLAN COMPILED",resolved.sequences.map(s=>({id:s.id,start:s.startSec,end:s.endSec})));
