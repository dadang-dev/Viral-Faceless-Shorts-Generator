import {compileFinancePlan,FinancePlanSchema,transitionFor,type FinancePlan,type FinanceElement,type ResolvedFinancePlan} from '../src/contracts/finance-motion.js';
import {APPROVED_SCRIPT_FILE} from '../src/contracts/content-contract.js';

export const DAY5_RICH_STORY_OUT='output/benchmarks/day-5-v12-rich-story';
export const DAY5_RICH_LAYOUT={
 'guess-statement':{stage:{x:100,y:455,w:880,h:810},headline:{x:100,y:275,w:880,h:120}},
 'range-comparison':{stage:{x:100,y:625,w:880,h:675},guessLabel:{x:80,y:250,w:405,h:95},guessThree:{x:95,y:375,w:120,h:220},or:{x:245,y:407,w:90,h:110},guessFour:{x:365,y:375,w:120,h:220},actualLabel:{x:515,y:250,w:485,h:95},actualEight:{x:530,y:375,w:120,h:220},to:{x:680,y:407,w:90,h:110},actualTwelve:{x:800,y:375,w:180,h:220}},
 'charge-attention':{stage:{x:100,y:450,w:880,h:800},headline:{x:100,y:275,w:880,h:125}},
 'monthly-review':{stage:{x:100,y:440,w:880,h:655},headline:{x:100,y:260,w:880,h:110},seconds:{x:130,y:1135,w:820,h:105}},
 'actually-look':{stage:{x:100,y:440,w:880,h:800},headline:{x:100,y:260,w:880,h:110}},
} as const;

type EventAction='reveal'|'focus'|'hide';
function sourceRef(scene:number,sourceSpan:string){return {sceneId:`scene-${scene}`,sourceSpan,source:APPROVED_SCRIPT_FILE};}
function storyEvent(id:string,scene:number,phrase:string,target:string,action:EventAction='focus'){
 const relation=action==='reveal'?'progression':action==='hide'?'new-topic':'same-object';
 return {id,trigger:sourceRef(scene,phrase),action,targets:[target],relation,transition:transitionFor(relation),rationale:`Day 5 picture state follows the exact narrated subscription beat: ${id}.`};
}
function box(element:FinanceElement,b:{x:number;y:number;w:number;h:number},fontSize?:number){element.box={...b};if(fontSize!==undefined)element.fontSize=fontSize;}
function element<T extends {id:string}>(sequence:{elements:any[]},id:string):T{
 const found=sequence.elements.find((item:any)=>item.id===id);if(!found)throw new Error(`DAY5_STORY_ELEMENT_MISSING: ${id}`);return found as T;
}
function event(sequence:{motionEvents:any[]},id:string){
 const found=sequence.motionEvents.find(item=>item.id===id);if(!found)throw new Error(`DAY5_STORY_EVENT_MISSING: ${id}`);return found;
}
function retarget(sequence:{motionEvents:any[]},id:string,target:string,action:EventAction='focus'){
 const item=event(sequence,id),relation=action==='reveal'?'progression':action==='hide'?'new-topic':'same-object';
 item.targets=[target];item.action=action;item.relation=relation;item.transition=transitionFor(relation);
}
function add(sequence:{motionEvents:any[]},item:ReturnType<typeof storyEvent>){
 if(sequence.motionEvents.some(candidate=>candidate.id===item.id))throw new Error(`DAY5_STORY_DUPLICATE_EVENT: ${item.id}`);
 sequence.motionEvents.push(item);
}
function stage(box:{x:number;y:number;w:number;h:number}):FinanceElement{
 return {id:'stage',kind:'node',box:{...box},initial:true,role:'SECTION_MARKER',size:'body',orientation:'horizontal'};
}

/**
 * Keep the approved Day 5 scene grouping, WordBoundary events, source numbers and
 * finance elements; reflow only their layout and give the picture story a
 * validated stage. Existing one-off icon cards are replaced by event-linked SVG
 * scenes at render time, not by a new renderer or asset pipeline.
 */
export function day5RichStoryPlan(input:FinancePlan):FinancePlan{
 const plan=FinancePlanSchema.parse(structuredClone(input));
 if(plan.day!==5||plan.sequences.length!==5)throw new Error('DAY5_RICH_STORY_SCOPE');
 const byId=new Map(plan.sequences.map(sequence=>[sequence.id,sequence]));
 for(const id of Object.keys(DAY5_RICH_LAYOUT))if(!byId.has(id))throw new Error(`DAY5_STORY_SEQUENCE_MISSING: ${id}`);

 const guess=byId.get('guess-statement')!;
 const guessHeading=element<FinanceElement>(guess,'guess');
 box(guessHeading,DAY5_RICH_LAYOUT['guess-statement'].headline,72);
 guess.elements=guess.elements.filter(item=>item.id==='guess');
 guess.elements.unshift(stage(DAY5_RICH_LAYOUT['guess-statement'].stage));
 retarget(guess,'paying','stage');retarget(guess,'statement','stage');
 add(guess,storyEvent('guess-reveal',1,'guess how many','stage'));
 guess.semanticRationale='A person tries to guess without looking; the same bank statement physically opens when the narration tells them to check it.';

 const ranges=byId.get('range-comparison')!;
 const guessLabel=element<FinanceElement>(ranges,'guess');box(guessLabel,DAY5_RICH_LAYOUT['range-comparison'].guessLabel,40);
 box(element<FinanceElement>(ranges,'guess-three'),DAY5_RICH_LAYOUT['range-comparison'].guessThree);
 box(element<FinanceElement>(ranges,'or'),DAY5_RICH_LAYOUT['range-comparison'].or,40);
 box(element<FinanceElement>(ranges,'guess-four'),DAY5_RICH_LAYOUT['range-comparison'].guessFour);
 const actualLabel=element<FinanceElement>(ranges,'actually');box(actualLabel,DAY5_RICH_LAYOUT['range-comparison'].actualLabel,40);actualLabel.initial=false;
 box(element<FinanceElement>(ranges,'actual-eight'),DAY5_RICH_LAYOUT['range-comparison'].actualEight);
 box(element<FinanceElement>(ranges,'to'),DAY5_RICH_LAYOUT['range-comparison'].to,40);
 box(element<FinanceElement>(ranges,'actual-twelve'),DAY5_RICH_LAYOUT['range-comparison'].actualTwelve);
 ranges.elements=ranges.elements.filter(item=>['guess','guess-three','or','guess-four','actually','actual-eight','to','actual-twelve'].includes(item.id));
 ranges.elements.push(stage(DAY5_RICH_LAYOUT['range-comparison'].stage));
 retarget(ranges,'cloud','stage');retarget(ranges,'trial','stage');retarget(ranges,'fitness','stage');
 add(ranges,storyEvent('streaming',3,'streaming','stage'));
 add(ranges,storyEvent('one-app',3,'one app','stage'));
 add(ranges,storyEvent('paid',5,'converted to paid','stage'));
 add(ranges,storyEvent('twice',5,'used twice','stage'));
 ranges.semanticRationale='The canonical three-or-four estimate stays distinct from the eight-to-twelve range while the same statement unfolds and the spoken streaming, app, cloud, trial and fitness examples appear in turn.';

 const charge=byId.get('charge-attention')!;
 const forgettable=element<FinanceElement>(charge,'forgettable');box(forgettable,DAY5_RICH_LAYOUT['charge-attention'].headline,58);forgettable.initial=false;forgettable.role='SECTION_MARKER';
 charge.elements=charge.elements.filter(item=>item.id==='forgettable');
 charge.elements.push(stage(DAY5_RICH_LAYOUT['charge-attention'].stage));
 retarget(charge,'forgotten','stage');retarget(charge,'recipient','stage');
 add(charge,storyEvent('forgettable-reveal',6,'designed to be forgettable','forgettable','reveal'));
 add(charge,storyEvent('business-model',6,'business model','stage'));
 add(charge,storyEvent('stop-noticing',7,'stop noticing the charge','stage'));
 charge.visualModel='process-loop';
 charge.semanticRationale='One recurring statement line fades as it repeats through the described business model, then the same charge visibly reaches the narrated recipient.';

 const monthly=byId.get('monthly-review')!;
 const monthHeading=element<FinanceElement>(monthly,'monthly');box(monthHeading,DAY5_RICH_LAYOUT['monthly-review'].headline,66);monthHeading.initial=false;monthHeading.role='SECTION_MARKER';
 const seconds=element<FinanceElement>(monthly,'seconds');box(seconds,DAY5_RICH_LAYOUT['monthly-review'].seconds,48);
 monthly.elements=monthly.elements.filter(item=>item.id==='monthly'||item.id==='seconds');
 monthly.elements.push(stage(DAY5_RICH_LAYOUT['monthly-review'].stage));
 retarget(monthly,'statement','stage');retarget(monthly,'look','stage');
 add(monthly,storyEvent('monthly-reveal',8,'once a month','monthly','reveal'));
 add(monthly,storyEvent('not-cancel',9,'Not to cancel everything','stage'));
 monthly.visualModel='decision-flow';
 monthly.semanticRationale='An opened recurring-charge statement remains intact while a magnifier scans each line; the depicted action is looking, not cancelling.';

 const ending=byId.get('actually-look')!;
 const extreme=element<FinanceElement>(ending,'extreme');box(extreme,DAY5_RICH_LAYOUT['actually-look'].headline,54);extreme.initial=false;extreme.role='SECTION_MARKER';
 ending.elements=ending.elements.filter(item=>item.id==='extreme');
 ending.elements.push(stage(DAY5_RICH_LAYOUT['actually-look'].stage));
 event(ending,'extreme').trigger=sourceRef(10,"You don't have to be extreme");
 retarget(ending,'extreme','extreme','reveal');retarget(ending,'look-payoff','stage');
 const clear=event(ending,'outro-clear');clear.targets=['extreme'];
 ending.semanticRationale='The headline clears for the existing profile outro while the inspected statement and person remain as a quiet visual payoff beneath the CTA.';

 return FinancePlanSchema.parse(plan);
}

export function day5RichStoryResolvedPlan(input:FinancePlan,script:any,transcript:any,approved:string):ResolvedFinancePlan{
 return compileFinancePlan(day5RichStoryPlan(input),script,transcript,approved);
}

/** Keep the final source-linked illustration underneath the existing silent profile CTA hold. */
export function extendDay5RichVisualThroughOutro(plan:ResolvedFinancePlan,finalTargetSec:number):ResolvedFinancePlan{
 const ending=plan.sequences.find(sequence=>sequence.id==='actually-look');
 if(!ending)throw new Error('DAY5_RICH_OUTRO_SEQUENCE_MISSING');
 if(!Number.isFinite(finalTargetSec)||finalTargetSec<=ending.endSec)throw new Error('DAY5_RICH_OUTRO_HOLD_INVALID');
 ending.endSec=finalTargetSec;
 return plan;
}
