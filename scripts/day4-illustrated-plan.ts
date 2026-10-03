import {FinancePlanSchema, transitionFor} from '../src/contracts/finance-motion.js';
import {APPROVED_SCRIPT_FILE as source} from '../src/contracts/content-contract.js';

export const ILLUSTRATED_OUT='output/benchmarks/day-4-v12-illustrated';
// One large illustration lane, one small heading lane, one emotion-label lane.
export const STORY_LAYOUT={stage:{x:100,y:460,w:880,h:740},heading:{x:100,y:270,w:880,h:150},labelsY:1240};
const ref=(scene:number,sourceSpan:string)=>({source,sceneId:`scene-${scene}`,sourceSpan});
const event=(id:string,scene:number,phrase:string,action='focus',targets=['stage'])=>({id,trigger:ref(scene,phrase),action,targets,relation:action==='reveal'?'progression':'same-object',transition:transitionFor(action==='reveal'?'progression':'same-object'),rationale:`Illustrated state change: ${id}; exact spoken phrase drives the retained artwork, not decorative motion.`});
const text=(id:string,scene:number,phrase:string,initial=false,box=STORY_LAYOUT.heading,fontSize=60)=>({id,kind:'text',box,copy:{...ref(scene,phrase),text:phrase.toUpperCase().replace(/[?'']/g,'')},role:'SECTION_MARKER',fontSize,size:'heading',initial});
const stage=()=>({id:'stage',kind:'node',box:STORY_LAYOUT.stage,initial:true,role:'SECTION_MARKER'});
const sequence=(id:string,scenes:number[],why:string,elements:any[],events:any[])=>({id,sceneIds:scenes.map(n=>`scene-${n}`),visualModel:'decision-flow',semanticRationale:why,entryRelation:'new-topic',entryTransition:'crossfade',elements:[stage(),...elements],motionEvents:events});
export function illustratedPlan(){return FinancePlanSchema.parse({version:'1.2',day:4,source,referencePolicy:'VISUAL_REFERENCE_ONLY',editorial:true,data:[],sequences:[
 sequence('wiring-story',[1,2],'Large wallet opens; brain circuitry activates as wiring is named, replacing an abstract willpower card.',[text('title',1,'Emotional spending',true)], [event('wallet-opens',1,'spending'),event('wiring-connects',2,'wiring problem')]),
 sequence('relief-story',[3],'Anonymous adult uses phone; stress, boredom and exhaustion change posture before buying and brief relief.',[],[event('stress',3,'stressed'),event('bored',3,'bored'),event('tired',3,'exhausted'),event('buy',3,'buying something'),event('brain',3,'your brain'),event('relief',3,'hit of relief'),event('temporary',3,'about ten minutes')]),
 sequence('examples-story',[4],'Late-night laptop order settles beside a coffee-after-meeting vignette; objects depict the spoken situations.',[],[event('night',4,'late-night'),event('order',4,'online order'),event('coffee',4,'coffee run'),event('meeting',4,'hard meeting')]),
 sequence('bill-story',[5,6],'A person feels briefly relieved while the receipt remains; no price or invented financial quantity.',[],[event('not-weakness',5,'not weakness'),event('biology',5,'biology'),event('short',6,'relief is short'),event('bill',6,"bill isn't")]),
 sequence('checkout-story',[7,8,9],'Finger approaches checkout then pauses, a feeling question replaces purchase focus, named feelings allow the urge to recede.',[
  text('question',7,'what am I feeling right now',false,STORY_LAYOUT.heading,58),
  ...['tired','bored','anxious'].map((s,i)=>text(s,8,s,false,{x:130+i*290,y:STORY_LAYOUT.labelsY,w:240,h:80},48))
 ],[event('habit',7,'habit'),event('approach',7,'before you check out'),event('pause',7,'ask'),event('question',7,'what am I feeling right now','reveal',['question']),event('not-need',7,"not 'do I need this'"),event('name',8,'naming the feeling'),...['tired','bored','anxious'].map(s=>event(s,8,s,'reveal',[s])),event('pass',9,'urge pass'),event('own',9,'on its own'),event('screen',9,'checkout screen')]),
 sequence('question-story',[10,11],'Question interrupts the finger-to-checkout path; the phone stays unpressed, then clears for the profile.',[text('honest',11,'one honest question',false,STORY_LAYOUT.heading,64)], [event('discipline',10,'discipline'),event('honest',11,'one honest question','reveal',['honest']),event('button',11,'checkout button'),{...event('outro-clear',11,'button','hide',['stage','honest']),anchor:'end'}])
]});}
