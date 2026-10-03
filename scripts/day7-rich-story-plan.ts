import {APPROVED_SCRIPT_FILE} from '../src/contracts/content-contract.js';
import {compileFinancePlan,FinancePlanSchema,transitionFor,type FinanceElement,type FinancePlan,type ResolvedFinancePlan} from '../src/contracts/finance-motion.js';

export const DAY7_RICH_STORY_OUT='output/benchmarks/day-7-v12-rich-story-cta-clear';
export const DAY7_RICH_LAYOUT={
 'five-category-recap':{stage:{x:120,y:400,w:840,h:930}},
 'honest-question-recap':{stage:{x:130,y:670,w:820,h:410}},
 'single-choice':{stage:{x:130,y:670,w:820,h:410}},
} as const;
export const DAY7_RICH_VISUAL_PLAN={version:'1.1',day:7,primaryArchetype:'concept-story',secondaryArchetype:'checklist-habits',layoutDirection:'mixed',repeatedIconComposition:'five source-named habit objects persist as five neutral choices; no habit is preselected',rationale:'Day 7 source-led visual recap. Five distinct objects, a retreating spreadsheet, and an unfilled question slot turn the challenge into a visible choice without assigning the viewer a habit or adding a financial claim.'} as const;

type Sequence=FinancePlan['sequences'][number];
function sourceEvent(id:string,scene:number,phrase:string,action:'focus'|'reveal'|'hide'='focus'){
 const relation=action==='reveal'?'progression':action==='hide'?'new-topic':'same-object';
 return {id,trigger:{sceneId:`scene-${scene}`,sourceSpan:phrase,source:APPROVED_SCRIPT_FILE},action,targets:['stage'],relation,transition:transitionFor(relation),rationale:`Day 7 visual state changes at the exact spoken phrase: ${phrase}.`};
}
function event(sequence:Sequence,id:string){const found=sequence.motionEvents.find(item=>item.id===id);if(!found)throw new Error('DAY7_EVENT_MISSING: '+id);return found;}
function retarget(sequence:Sequence,id:string,action:'focus'|'reveal'|'hide'='focus'){
 const item=event(sequence,id),relation=action==='reveal'?'progression':action==='hide'?'new-topic':'same-object';
 item.targets=['stage'];item.action=action;item.relation=relation;item.transition=transitionFor(relation);
}
function add(sequence:Sequence,item:ReturnType<typeof sourceEvent>){if(sequence.motionEvents.some(other=>other.id===item.id))throw new Error('DAY7_DUPLICATE_EVENT');sequence.motionEvents.push(item);}
function stage(box:{x:number;y:number;w:number;h:number}):FinanceElement{return {id:'stage',kind:'node',box:{...box},initial:true,role:'SECTION_MARKER',size:'body',orientation:'horizontal'};}

/** Episode-local story treatment; approved transcript, sequence groups and copy stay intact. */
export function day7RichStoryPlan(input:FinancePlan):FinancePlan{
 const plan=FinancePlanSchema.parse(structuredClone(input));
 if(plan.day!==7||plan.sequences.length!==3)throw new Error('DAY7_RICH_STORY_SCOPE');
 const byId=new Map(plan.sequences.map(sequence=>[sequence.id,sequence]));
 for(const id of Object.keys(DAY7_RICH_LAYOUT))if(!byId.has(id))throw new Error('DAY7_SEQUENCE_MISSING: '+id);
 const recap=byId.get('five-category-recap')!;
 recap.elements=recap.elements.filter(item=>item.kind==='text');recap.elements.unshift(stage(DAY7_RICH_LAYOUT['five-category-recap'].stage));
 for(const id of ['five','common','noticing'])retarget(recap,id);
 // Keep the source-label reveal contract; add a same-phrase stage focus for each drawing.
 for(const [id,label,phrase] of [['recurring','subscription','subscription creep'],['lifestyle','lifestyle-label','lifestyle creep'],['math','math-label','girl math'],['emotion','emotion-label','emotional spending'],['saving','saving-label','saving feels impossible']] as const){
  event(recap,id).targets=[label];
  add(recap,sourceEvent('art-'+id,1,phrase));
 }
 add(recap,sourceEvent('not-bad',3,'none of them are about being bad with money'));
 recap.semanticRationale='Each category is a distinct illustrated object next to its exact source label; a focus scan connects the five as a recap, without asserting causation between them.';

 const question=byId.get('honest-question-recap')!;
 question.elements=question.elements.filter(item=>item.kind==='text');question.elements.unshift(stage(DAY7_RICH_LAYOUT['honest-question-recap'].stage));
 retarget(question,'spreadsheet');add(question,sourceEvent('honest-art',6,'one honest question'));
 question.semanticRationale='A spreadsheet visibly recedes as the unfilled question tile comes forward at the spoken honest-question phrase.';

 const choice=byId.get('single-choice')!;
 choice.elements=choice.elements.filter(item=>item.kind==='text');choice.elements.unshift(stage(DAY7_RICH_LAYOUT['single-choice'].stage));
 for(const id of ['today','just-one','no-overhaul','focus'])retarget(choice,id);
 add(choice,sourceEvent('clearly-art',10,'one habit you finally see clearly'));
 add(choice,sourceEvent('recap-challenge',7,'recap challenge'));
 add(choice,sourceEvent('pick',7,'pick just ONE'));
 add(choice,sourceEvent('question-to-ask',7,'one honest question'));
 add(choice,sourceEvent('not-all-five',8,'Not all five'));
 add(choice,sourceEvent('which-one',11,'Which one'));
 add(choice,sourceEvent('tell-me',11,'Tell me below'));
 event(choice,'outro-clear').targets=choice.elements.filter(item=>item.id!=='stage').map(item=>item.id);
 choice.semanticRationale='Five known choices remain neutral around one unfilled question slot; the viewer, not the animation, decides which habit. The source-linked board remains under the profile CTA during the closing dwell.';
 return FinancePlanSchema.parse(plan);
}

export function day7RichStoryResolvedPlan(input:FinancePlan,script:any,transcript:any,approved:string):ResolvedFinancePlan{return compileFinancePlan(day7RichStoryPlan(input),script,transcript,approved);}
export function extendDay7RichVisualThroughOutro(plan:ResolvedFinancePlan,finalTargetSec:number):ResolvedFinancePlan{
 const ending=plan.sequences.find(sequence=>sequence.id==='single-choice');
 if(!ending||!Number.isFinite(finalTargetSec)||finalTargetSec<=ending.endSec)throw new Error('DAY7_OUTRO_HOLD_INVALID');
 ending.endSec=finalTargetSec;return plan;
}
