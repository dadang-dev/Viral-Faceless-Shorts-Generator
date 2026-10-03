import {compileFinancePlan,FinancePlanSchema,transitionFor,type FinancePlan,type FinanceElement,type ResolvedFinancePlan} from '../src/contracts/finance-motion.js';
import {APPROVED_SCRIPT_FILE} from '../src/contracts/content-contract.js';

export const DAY6_RICH_STORY_OUT='output/benchmarks/day-6-v12-rich-story-seamless-crossfade';
export const DAY6_RICH_CHARACTER_OUT='output/benchmarks/day-6-v12-rich-story-character-revision';
const DAY6_SHARED_CROSSFADE_SEC=0.18;
export const DAY6_RICH_LAYOUT={
 'scarcity-question':{stage:{x:130,y:650,w:820,h:610},headline:{x:130,y:350,w:820,h:270}},
 'tight-wallet':{stage:{x:100,y:660,w:880,h:480},headline:{x:130,y:360,w:820,h:260},unsafe:{x:130,y:1170,w:820,h:120}},
 'knowing-feeling':{stage:{x:100,y:660,w:880,h:475},headline:{x:130,y:350,w:820,h:270},fear:{x:130,y:1170,w:820,h:120}},
 'weekly-safekeeping':{stage:{x:80,y:660,w:500,h:510},headline:{x:130,y:360,w:820,h:260},metric:{x:620,y:715,w:360,h:240},week:{x:620,y:980,w:360,h:100},savings:{x:620,y:1100,w:360,h:100}},
} as const;
export const DAY6_RICH_VISUAL_PLAN={version:'1.1',day:6,primaryArchetype:'concept-story',secondaryArchetype:'timeline-frequency',layoutDirection:'mixed',repeatedIconComposition:'same-person-and-wallet;past-calendar-and-college-notes;knowledge-versus-guarded-jar;single-coin-retained-in-clear-savings-jar',rationale:'Day 6 source-led illustrated revision. The same anonymous person, wallet and single visible coin connect scarcity, safety and the exact $5/week action; no totals or projected amounts are added.'} as const;

type EventAction='reveal'|'focus'|'hide';
function sourceRef(scene:number,sourceSpan:string){return {sceneId:'scene-'+scene,sourceSpan,source:APPROVED_SCRIPT_FILE};}
function storyEvent(id:string,scene:number,phrase:string,target:string,action:EventAction='focus'){
 const relation=action==='reveal'?'progression':action==='hide'?'new-topic':'same-object';
 return {id,trigger:sourceRef(scene,phrase),action,targets:[target],relation,transition:transitionFor(relation),rationale:'The Day 6 illustration changes only when its exact spoken source phrase arrives: '+id+'.'};
}
function box(element:FinanceElement,b:{x:number;y:number;w:number;h:number},fontSize?:number){element.box={...b};if(fontSize!==undefined)element.fontSize=fontSize;}
function element<T extends {id:string}>(sequence:{elements:any[]},id:string):T{
 const found=sequence.elements.find((item:any)=>item.id===id);if(!found)throw new Error('DAY6_STORY_ELEMENT_MISSING: '+id);return found as T;
}
function event(sequence:{motionEvents:any[]},id:string){
 const found=sequence.motionEvents.find(item=>item.id===id);if(!found)throw new Error('DAY6_STORY_EVENT_MISSING: '+id);return found;
}
function retarget(sequence:{motionEvents:any[]},id:string,target:string,action:EventAction='focus'){
 const item=event(sequence,id),relation=action==='reveal'?'progression':action==='hide'?'new-topic':'same-object';
 item.targets=[target];item.action=action;item.relation=relation;item.transition=transitionFor(relation);
}
function add(sequence:{motionEvents:any[]},item:ReturnType<typeof storyEvent>){
 if(sequence.motionEvents.some(candidate=>candidate.id===item.id))throw new Error('DAY6_STORY_DUPLICATE_EVENT: '+item.id);
 sequence.motionEvents.push(item);
}
function stage(b:{x:number;y:number;w:number;h:number}):FinanceElement{
 return {id:'stage',kind:'node',box:{...b},initial:true,role:'SECTION_MARKER',size:'body',orientation:'horizontal'};
}

/** Keep the approved four-sequence plan and $5/week provenance; replace only
 * isolated icon nodes with transcript-driven illustration stages. */
export function day6RichStoryPlan(input:FinancePlan):FinancePlan{
 const plan=FinancePlanSchema.parse(structuredClone(input));
 if(plan.day!==6||plan.sequences.length!==4)throw new Error('DAY6_RICH_STORY_SCOPE');
 const byId=new Map(plan.sequences.map(sequence=>[sequence.id,sequence]));
 for(const id of Object.keys(DAY6_RICH_LAYOUT))if(!byId.has(id))throw new Error('DAY6_STORY_SEQUENCE_MISSING: '+id);

 const scarcity=byId.get('scarcity-question')!;
 box(element<FinanceElement>(scarcity,'saving'),DAY6_RICH_LAYOUT['scarcity-question'].headline,84);
 scarcity.elements=scarcity.elements.filter(item=>item.id==='saving');
 scarcity.elements.unshift(stage(DAY6_RICH_LAYOUT['scarcity-question'].stage));
 retarget(scarcity,'math','stage');retarget(scarcity,'scarcity','stage');
 scarcity.semanticRationale='A person turns away from a math sheet as the same wallet tightens at the exact scarcity phrase; the illustration reframes the source without adding a psychological label.';

 const tight=byId.get('tight-wallet')!;
 box(element<FinanceElement>(tight,'tight'),DAY6_RICH_LAYOUT['tight-wallet'].headline,94);
 box(element<FinanceElement>(tight,'unsafe'),DAY6_RICH_LAYOUT['tight-wallet'].unsafe,76);
 tight.elements=tight.elements.filter(item=>item.id==='tight'||item.id==='unsafe');
 tight.elements.unshift(stage(DAY6_RICH_LAYOUT['tight-wallet'].stage));
 retarget(tight,'past','stage');retarget(tight,'dollar','stage');
 add(tight,storyEvent('semester',3,'a stressful semester in college','stage','focus'));
 add(tight,storyEvent('last-one',4,'the last one','stage','focus'));
 tight.semanticRationale='One wallet remains the same object as a past calendar and college papers appear, then a single unmarked coin is guarded; no dated schedule or extra dollar amount is shown.';

 const knowing=byId.get('knowing-feeling')!;
 box(element<FinanceElement>(knowing,'advice'),DAY6_RICH_LAYOUT['knowing-feeling'].headline,96);
 box(element<FinanceElement>(knowing,'fear'),DAY6_RICH_LAYOUT['knowing-feeling'].fear,78);
 box(element<FinanceElement>(knowing,'safe'),DAY6_RICH_LAYOUT['knowing-feeling'].headline,82);
 knowing.elements=knowing.elements.filter(item=>['advice','fear','safe'].includes(item.id));
 knowing.elements.unshift(stage(DAY6_RICH_LAYOUT['knowing-feeling'].stage));
 retarget(knowing,'advice-fades','stage');
 add(knowing,storyEvent('knowledge',8,'saving is good','stage','focus'));
 knowing.semanticRationale='An open page/check communicates knowing saving is good; the same person still shields the savings jar until the spoken feeling-safe phrase, keeping knowledge and safety distinct.';

 const weekly=byId.get('weekly-safekeeping')!;
 box(element<FinanceElement>(weekly,'small'),DAY6_RICH_LAYOUT['weekly-safekeeping'].headline,118);
 box(element<FinanceElement>(weekly,'weekly-five'),DAY6_RICH_LAYOUT['weekly-safekeeping'].metric);
 box(element<FinanceElement>(weekly,'week'),DAY6_RICH_LAYOUT['weekly-safekeeping'].week,68);
 box(element<FinanceElement>(weekly,'savings'),DAY6_RICH_LAYOUT['weekly-safekeeping'].savings,66);
 weekly.elements=weekly.elements.filter(item=>['small','weekly-five','week','savings'].includes(item.id));
 weekly.elements.unshift(stage(DAY6_RICH_LAYOUT['weekly-safekeeping'].stage));
 retarget(weekly,'small','stage');retarget(weekly,'retained','stage');
 add(weekly,storyEvent('start',9,'start with an amount','stage','focus'));
 add(weekly,storyEvent('goal',11,"The goal isn't the amount",'stage','focus'));
 add(weekly,storyEvent('once-safe',12,'Once that feels safe','stage','focus'));
 add(weekly,storyEvent('amount-grow',12,'the amount can grow','stage','focus'));
 event(weekly,'outro-clear').targets=weekly.elements.filter(item=>item.id!=='stage').map(item=>item.id);
 weekly.semanticRationale='The exact $5/week metric remains separate while one visible coin moves from the same wallet into a clear jar and stays visible; no running balance or projected total is implied.';

 return FinancePlanSchema.parse(plan);
}

export function day6RichStoryResolvedPlan(input:FinancePlan,script:any,transcript:any,approved:string):ResolvedFinancePlan{
 return compileFinancePlan(day6RichStoryPlan(input),script,transcript,approved);
}

/** Hold the last story visual through the default 180 ms crossfade into the existing profile CTA. */
export function extendDay6RichVisualThroughOutro(plan:ResolvedFinancePlan,profileEntranceSec:number):ResolvedFinancePlan{
 const ending=plan.sequences.find(sequence=>sequence.id==='weekly-safekeeping');
 if(!ending)throw new Error('DAY6_RICH_OUTRO_SEQUENCE_MISSING');
 const handoffEndSec=profileEntranceSec+DAY6_SHARED_CROSSFADE_SEC;
 if(!Number.isFinite(profileEntranceSec)||handoffEndSec<=ending.endSec)throw new Error('DAY6_RICH_OUTRO_HOLD_INVALID');
 ending.endSec=handoffEndSec;
 return plan;
}
