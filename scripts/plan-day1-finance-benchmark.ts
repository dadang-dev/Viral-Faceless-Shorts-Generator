// Editorial Day 1 plan, separate from reusable primitives. Never reads reference media.
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { FinancePlanSchema, transitionFor, type FinancePlan, type FinanceElement } from "../src/contracts/finance-motion.js";
import { HISTORICAL_SCRIPT_FILE as APPROVED_SCRIPT_FILE } from "../src/contracts/content-contract.js";

const out = resolve("output/benchmarks/day-1-v12");
await mkdir(out, { recursive:true });
const ref = (scene: number, sourceSpan: string) => ({ source: APPROVED_SCRIPT_FILE, sceneId:`scene-${scene}`, sourceSpan });
const copy = (scene: number, text: string) => ({ ...ref(scene,text), text:text.toUpperCase() });
const literal = (id:string, scene:number, span:string, value:number, unit:string, display:string, unitSource?:ReturnType<typeof ref>, qualifier="exact") => ({ id, ...ref(scene,span), sourceType:"script-literal", value, unit, display, qualifier, ...(unitSource ? {unitSource} : {}) });
const box = (x:number,y:number,w:number,h:number) => ({x,y,w,h});
const element = (id:string,kind:string,b:ReturnType<typeof box>, extra:Record<string,unknown>={}) => ({id,kind,box:b,...extra});
const text = (id:string,scene:number,label:string,b:ReturnType<typeof box>,size="body", initial=false) => element(id,"text",b,{copy:copy(scene,label),size,initial});
const event = (id:string,scene:number,phrase:string,action:string,targets:string[],relation:string,rationale:string) => ({id,trigger:ref(scene,phrase),action,targets,relation,transition:transitionFor(relation),rationale});
const sequence = (id:string,sceneIds:number[],visualModel:string,semanticRationale:string,elements:unknown[],motionEvents:unknown[],minimalismReason?:string) => ({id,sceneIds:sceneIds.map(n=>`scene-${n}`),visualModel,semanticRationale,elements,motionEvents,entryRelation:"new-topic",entryTransition:"crossfade",...(minimalismReason?{minimalismReason}:{})});

const plan = FinancePlanSchema.parse({ version:"1.2",day:1,source:APPROVED_SCRIPT_FILE,referencePolicy:"VISUAL_REFERENCE_ONLY",
  data:[
    literal("three-habits",2,"three habits",3,"count","3"),
    literal("streaming",4,"fourteen dollars",14,"USD","$14"),
    literal("fitness",4,"nine",9,"USD","$9",ref(4,"fourteen dollars")),
    literal("cloud",5,"five for cloud storage",5,"USD","$5",ref(4,"fourteen dollars")),
    literal("apps",5,"five apps",5,"apps","5 APPS"),
    literal("order",7,"ten dollars",10,"USD","$10"),
    literal("nights",8,"four nights a week",4,"nights/week","4 NIGHTS A WEEK"),
    literal("coffee",10,"eighteen-dollar",18,"USD","$18"),
    literal("perceived",10,"twenty bucks",20,"USD","$20"),
    literal("frequency",11,"three times a week",3,"times/week","3 TIMES A WEEK"),
    literal("month",11,"almost three hundred dollars a month",300,"USD/month","ALMOST $300 / MONTH",undefined,"almost"),
  ],
  sequences:[
    sequence("habits",[2],"accumulation-timeline","Three anonymous habit symbols represent the explicitly spoken count without pre-revealing the names of later habits.",[
      text("heading",2,"You just have",box(110,380,860,110),"heading",true),
      element("habits","markers",box(180,610,720,290),{datumId:"three-habits",icon:"habit",copy:copy(2,"habits")}),
      text("against",2,"working against you",box(130,1000,820,130),"heading"),
      text("noticing",2,"without you noticing",box(140,1210,800,80),"small"),
    ],[
      event("count",2,"three habits","reveal",["habits"],"accumulation","Introduce exactly the three spoken habits, no invented categories."),
      event("against",2,"working against you","reveal",["against"],"progression","The relationship follows the count rather than showing all copy at once."),
      event("unnoticed",2,"without you noticing","reveal",["noticing"],"progression","Reveal the qualifier on its actual narration."),
    ]),
    sequence("subscriptions",[3,4,5],"stacked-cost","Separate subscription prices enter one retained ledger; the app count is a distinct count, not an invented sum of the three named prices.",[
      text("heading",3,"subscription creep",box(110,330,860,120),"heading",true),
      element("streaming","stack-item",box(110,500,860,140),{datumId:"streaming",copy:copy(4,"streaming app"),icon:"stream"}),
      element("fitness","stack-item",box(110,675,860,140),{datumId:"fitness",copy:copy(4,"fitness app"),icon:"fitness"}),
      element("cloud","stack-item",box(110,850,860,140),{datumId:"cloud",copy:copy(5,"cloud storage"),icon:"cloud"}),
      text("forgot",5,"you forgot you even signed up for",box(130,1100,820,160)),
      element("apps","markers",box(180,1050,720,280),{datumId:"apps",icon:"app"}),
    ],[
      event("streaming",4,"fourteen dollars","stack",["streaming"],"accumulation","First approved cost enters a persistent ledger."),
      event("fitness",4,"nine","stack",["fitness"],"accumulation","Second independent cost joins; first cost stays visible."),
      event("cloud",5,"five for cloud storage","stack",["cloud"],"accumulation","Third cost joins without destroying the ledger at the audio boundary."),
      event("forgot",5,"you forgot you even signed up for","reveal",["forgot"],"progression","Surface why these charges go unnoticed at the spoken clause."),
      event("clear-note",5,"five apps","hide",["forgot"],"same-object","Clear the qualifier area before introducing the actual app count."),
      event("five-apps",5,"five apps","reveal",["apps"],"accumulation","Exactly five app icons appear; no assumption about prices of the other apps."),
    ]),
    sequence("convenience",[6,7,8],"decision-flow","The approved ordering thought leads to a momentary price and then a counted frequency. Unknown grocery-budget magnitude is expressed as source copy, never a fabricated comparison bar.",[
      text("heading",6,"convenience spending",box(110,320,860,200),"heading",true),
      element("thought","node",box(130,640,820,190),{copy:copy(7,"I'll just order it, I'm tired"),icon:"order"}),
      element("price","metric",box(200,560,680,250),{datumId:"order",copy:copy(7,"in the moment")}),
      element("frequency","markers",box(180,860,720,250),{datumId:"nights",icon:"order"}),
      text("budget",8,"more than most people's entire grocery budget",box(130,1150,820,170)),
    ],[
      event("thought",7,"I'll just order it","draw",["thought"],"progression","The approved inner thought becomes a decision node."),
      event("tired",7,"I'm tired","focus",["thought"],"same-object","Focus the same thought at the fatigue phrase."),
      event("thought-price",7,"ten dollars","hide",["thought"],"same-object","The thought yields to its spoken price without an invented alternative branch."),
      event("price",7,"ten dollars","reveal",["price"],"major-metric","Exact price appears, no intermediate count-up values."),
      event("repeat-price",8,"ten dollars","punch",["price"],"major-metric","The same price persists into the repeated-spending clause."),
      event("frequency",8,"four nights a week","reveal",["frequency"],"accumulation","Four markers represent the exact frequency, without calendar dates or a calculated total."),
      event("consequence",8,"more than most people's","reveal",["budget"],"progression","Quote the approved qualitative consequence; do not encode an unknown grocery budget as a scale."),
    ]),
    sequence("comparison",[9,10],"comparison-gap","The approved narration actually compares an eighteen-dollar purchase to 'like twenty bucks'. Show 18 and 20 on one zero-based scale, not the different numbers in the references.",[
      text("heading",9,"rounding down in your head",box(110,320,860,250),"heading",true),
      element("actual","bar",box(150,700,780,190),{datumId:"coffee",copy:copy(10,"coffee run"),scaleGroup:"coffee"}),
      element("perceived","bar",box(150,1030,780,190),{datumId:"perceived",copy:copy(10,"like twenty bucks"),scaleGroup:"coffee"}),
    ],[
      event("actual",10,"eighteen-dollar","grow",["actual"],"comparison","Grow the exact actual value from the common baseline."),
      event("perceived",10,"twenty bucks","grow",["perceived"],"comparison","Expand the second field to 20/20 alongside the retained 18/20 field. No invented delta label."),
    ],"The short named-habit introduction is intentionally typographic until the numerical example is spoken."),
    sequence("monthly",[11],"accumulation-timeline","Keep the frequency visible while revealing the script's qualified monthly claim. This is not a computed extrapolation from the coffee price.",[
      text("bridge",11,"Do that",box(150,280,780,90),"heading",true),
      element("frequency","markers",box(180,400,720,280),{datumId:"frequency",icon:"coffee"}),
      text("spent",11,"you've quietly spent",box(150,750,780,90)),
      element("monthly","metric",box(130,870,820,310),{datumId:"month"}),
      text("nothing",11,"basically nothing",box(150,1230,780,80),"small"),
    ],[
      event("frequency",11,"three times a week","reveal",["frequency"],"accumulation","Exactly three purchase markers; no weekday labels or multiplication result."),
      event("spent",11,"you've quietly spent","reveal",["spent"],"progression","Shift from frequency to the literal consequence as narration develops."),
      event("monthly",11,"almost three hundred dollars a month","reveal",["monthly"],"major-metric","Reveal the approved almost qualifier together with the amount; no computed total or intermediate figures."),
      event("nothing",11,"basically nothing","reveal",["nothing"],"progression","The narrator's description appears only on its spoken phrase."),
    ]),
    sequence("awareness",[13,14],"process-loop","A quiet background path remains present, then naming it changes the active state and interrupts the path. No invented psychology labels or restored balance.",[
      element("quiet","node",box(180,390,720,150),{copy:copy(13,"They just run quietly"),icon:"habit",connectsTo:"background",initial:true}),
      element("background","node",box(180,700,720,150),{copy:copy(13,"in the background"),connectsTo:"naming",loop:true}),
      element("naming","node",box(180,1020,720,250),{copy:copy(14,"try naming just one of them out loud"),icon:"voice"}),
    ],[
      event("quiet",13,"They just run quietly","focus",["quiet"],"progression","Focus the initially readable background node at its spoken phrase, without a blank boundary."),
      event("background",13,"in the background","draw",["background"],"progression","Connect the same process to its background state."),
      event("week",14,"This week","focus",["background"],"same-object","Move attention to the existing background state, without rebuilding it."),
      event("naming",14,"try naming just one","draw",["naming"],"progression","Introduce the approved action as a connected state."),
      event("interrupt",14,"out loud","interrupt",["naming"],"same-object","Naming brings the action into focus and interrupts the previous path."),
      event("clean-outro-handoff",14,"That's it","hide",["quiet","background","naming"],"same-object","Fade the completed action with the process foreground before the outgoing sequence overlaps the incoming COMMENT CTA; persistent background and brand remain."),
    ]),
  ],
});
const script = JSON.parse(await readFile("output/day-1/script.json","utf8"));
script.metadata.title = "Day 1 — Finance Motion/Data Viz Edition";
script.metadata.visualSystem = "1.2";
script.scenes[0].hookFrameZeroReadable = true;
const numbers = JSON.parse(await readFile("output/day-1/number_highlights.json","utf8"));
for (const h of numbers.items) {
  if (["streaming-14","fitness-9","cloud-5"].includes(h.id)) h.displayText = h.displayText.replace(" / MONTH","");
  const scene = script.scenes.find((s: {id:string})=>s.id===h.sceneId);
  if (h.target === "left.value") scene.templateData.left.value = h.displayText;
  if (h.target === "right.value") scene.templateData.right.value = h.displayText;
}
await writeFile(join(out,"script.json"),JSON.stringify(script,null,2));
await writeFile(join(out,"number_highlights.json"),JSON.stringify(numbers,null,2));
await writeFile(join(out,"data_visualizations.json"),JSON.stringify(plan,null,2));
await writeFile(join(out,"visual-plan.json"),JSON.stringify({version:"1.1",day:1,primaryArchetype:"checklist-habits",secondaryArchetype:"accumulation",rationale:"Three named habits organize the exact approved narration; persistent costs and frequency explain repeated spending. Finance models are independently planned above unchanged audio slices.",layoutDirection:"mixed",repeatedIconComposition:"persistent-ledger;shared-baseline-bars;counted-markers;node-interruption"},null,2));
for (const f of ["voice.mp3","transcript.json","subtitles.ass","subtitles.srt","hyperframes.json"]) await copyFile(join("output/day-1",f),join(out,f));
console.log(`Wrote opt-in Day 1 plan to ${out}; audio, transcript and ASS copied byte-for-byte. No render/TTS.`);
