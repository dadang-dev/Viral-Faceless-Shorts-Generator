import type {ResolvedFinancePlan} from '../src/contracts/finance-motion.js';
import {DAY7_RICH_LAYOUT} from './day7-rich-story-plan.js';

const group=(name:string,body:string,future=false)=>`<g class="${name}${future?' story-future':''}" data-story-part="${name}">${body}</g>`;
const icon=(kind:'subscription'|'lifestyle'|'math'|'emotion'|'saving')=>({
 subscription:'<rect class="object" x="21" y="5" width="116" height="135" rx="18"/><path class="muted" d="M51 27h56M48 78h62m-62 21h42"/><circle class="gold-fill" cx="79" cy="51" r="13"/><path class="gold" d="M53 117h54m-11-10 11 10-11 10"/>',
 lifestyle:'<path class="object" d="M18 85l15-34h92l15 34v40H18z"/><path class="muted" d="M39 51l13-26h57l13 26M32 86h94"/><circle class="gold-fill" cx="45" cy="126" r="13"/><circle class="gold-fill" cx="111" cy="126" r="13"/><path class="gold" d="M73 65h12"/>',
 math:'<path class="object" d="M15 45q0-15 16-15h122v104H31q-16 0-16-16z"/><path class="muted" d="M15 57h138m-118 30h41"/><circle class="gold-fill" cx="126" cy="96" r="12"/><path class="gold" d="M63 21l14-16 16 16m-16-16v47"/>',
 emotion:'<path class="object" d="M22 49h127l-12 91H33z"/><path class="muted" d="M53 54V35q0-29 32-29t32 29v19"/><path class="gold" d="M73 95q-22-17-22-4 0 16 33 35 32-19 32-35 0-13-21 4-10 8-11 8t-11-8z"/>',
 saving:'<path class="object" d="M34 34h102l-9 14 18 19v54q0 18-18 18H43q-18 0-18-18V67l18-19z"/><path class="muted" d="M35 33V13h100v20M47 95h75"/><circle class="gold-fill" cx="84" cy="109" r="15"/><path class="gold" d="M84 99v20m-9-10h18"/>',
}[kind]);
const questionMark='<path class="gold" d="M-25-22q0-26 26-26 27 0 27 24 0 15-15 25L1 9v14"/><circle class="gold-fill" cx="1" cy="43" r="5"/>';
const recapRows=(['subscription','lifestyle','math','emotion','saving'] as const).map((kind,index)=>group(`habit-${kind}`,`<g transform="translate(20 ${index*195+5})">${icon(kind)}</g>`,true)).join('');
const choiceCards=(['subscription','lifestyle','math','emotion','saving'] as const).map((kind,index)=>group(`choice-${kind}`,`<g transform="translate(${index*161+12} 22)"><rect class="card" width="150" height="140" rx="20"/><g transform="translate(34 24) scale(.54)">${icon(kind)}</g></g>`)).join('');

export const DAY7_STORY_ART:Record<string,string>={
 'five-category-recap':
  group('story-spine','<path class="spine" d="M14 55v780"/>')+recapRows+
  group('five-bracket','<path class="gold" d="M194 10h24v900h-24"/>',true)+
  group('common-focus','<path class="gold" d="M4 54q5-36 45-43m135 0q41 11 47 46m-227 790q5 41 47 50m135 0q38-8 46-50"/>',true)+
  group('notice-scan','<path class="gold" d="M0 76h194m-194 195h194m-194 195h194m-194 195h194m-194 195h194"/>',true),
 'honest-question-recap':
  group('sheet','<g transform="translate(22 10)"><rect class="paper" width="460" height="390" rx="24"/><path class="muted" d="M0 85h460M0 158h460M0 231h460M0 304h460M148 85v305m156-305v305"/><path class="gold" d="M36 45h194"/></g>')+
  group('sheet-cross','<path class="gold" d="M25 19l450 371m0-371L25 390"/>',true)+
  group('question-tile','<g transform="translate(535 108)"><rect class="card" width="230" height="230" rx="32"/><g transform="translate(115 108)">'+questionMark+'</g></g>',true)+
  group('moment-pulse','<circle class="gold" cx="650" cy="223" r="138"/>',true),
 'single-choice':
  group('choices-back','<path class="spine" d="M64 188h690"/>')+choiceCards+
  group('blank-slot','<g transform="translate(326 199)"><rect class="card" width="168" height="174" rx="26"/><g transform="translate(83 79)">'+questionMark+'</g></g>',true)+
  group('all-five-bracket','<path class="gold" d="M17 174v22h787v-22"/>',true)+
  group('budget-grid','<g transform="translate(555 225)"><rect class="paper" width="215" height="150" rx="15"/><path class="muted" d="M0 50h215M0 100h215M72 0v150m72-150v150"/></g>',true)+
  group('clarity-lens','<circle class="gold" cx="410" cy="286" r="102"/><path class="gold" d="M483 354l52 35"/>',true)+
  group('comment-bubble','<path class="gold" d="M76 241h165q29 0 29 29v54q0 29-29 29H152l-42 35v-35H76q-29 0-29-29v-54q0-29 29-29z"/><circle class="gold-fill" cx="116" cy="298" r="5"/><circle class="gold-fill" cx="158" cy="298" r="5"/><circle class="gold-fill" cx="200" cy="298" r="5"/>',true),
};

type Step={event:string;selector:string;to:Record<string,unknown>;duration?:number};
export const DAY7_STORY_STEPS:Record<string,Step[]>={
 'five-category-recap':[
  ...(['subscription','lifestyle','math','emotion','saving'] as const).map((kind,index)=>({event:['art-recurring','art-lifestyle','art-math','art-emotion','art-saving'][index],selector:`.habit-${kind}`,to:{opacity:1,x:0,scale:1},duration:.42})),
  {event:'five',selector:'.five-bracket',to:{opacity:1},duration:.35},
  {event:'common',selector:'.common-focus',to:{opacity:1},duration:.4},
  {event:'not-bad',selector:'.five-bracket',to:{opacity:.55},duration:.35},
  {event:'noticing',selector:'.notice-scan',to:{opacity:1},duration:.5},
 ],
 'honest-question-recap':[
  {event:'spreadsheet',selector:'.sheet',to:{opacity:.2,x:-10},duration:.52},
  {event:'spreadsheet',selector:'.sheet-cross',to:{opacity:1},duration:.42},
  {event:'honest-art',selector:'.question-tile',to:{opacity:1,scale:1.06},duration:.5},
  {event:'honest-art',selector:'.moment-pulse',to:{opacity:.55,scale:1.03},duration:.42},
 ],
 'single-choice':[
  {event:'recap-challenge',selector:'.all-five-bracket',to:{opacity:1},duration:.38},
  {event:'pick',selector:'.blank-slot',to:{opacity:1,scale:1.04},duration:.48},
  {event:'question-to-ask',selector:'.blank-slot',to:{scale:1.11},duration:.38},
  {event:'today',selector:'.blank-slot',to:{scale:1},duration:.36},
  {event:'not-all-five',selector:'.all-five-bracket',to:{opacity:.3},duration:.36},
  {event:'just-one',selector:'.blank-slot',to:{opacity:1,scale:1.07},duration:.38},
  {event:'no-overhaul',selector:'.budget-grid',to:{opacity:.75,x:-8},duration:.38},
  {event:'clearly-art',selector:'.budget-grid',to:{opacity:0,x:24},duration:.42},
  {event:'focus',selector:'.clarity-lens',to:{opacity:1,scale:1.02},duration:.4},
  {event:'which-one',selector:'.clarity-lens',to:{opacity:.3},duration:.35},
  {event:'which-one',selector:'.all-five-bracket',to:{opacity:1},duration:.35},
  {event:'tell-me',selector:'.comment-bubble',to:{opacity:1},duration:.48},
  {event:'outro-clear',selector:'.day7-story-art',to:{scale:.8,y:75,transformOrigin:'50% 0%'},duration:.42},
 ],
};

export const DAY7_STORY_CSS=[
 '.fm-sequence .fm-node:not([data-element-id="stage"]){visibility:hidden!important}',
 '.fm-sequence [data-element-id="stage"]{border:0;background:none;padding:0;display:block;border-radius:0}',
 '.fm-sequence [data-element-id="stage"] .fm-focus-ring{display:none}',
 '.day7-story-art{display:block;width:100%;height:100%;overflow:visible;fill:none;stroke:#D7A928;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}',
 '.day7-story-art .object,.day7-story-art .card,.day7-story-art .paper{fill:#0D2038;stroke:#D7A928;stroke-width:5}',
 '.day7-story-art .card{fill:#132B47}',
 '.day7-story-art .paper{stroke:#C9C2B5}',
 '.day7-story-art .muted,.day7-story-art .spine{stroke:#A0AEC0;stroke-width:4}',
 '.day7-story-art .spine{opacity:.5}',
 '.day7-story-art .gold{stroke:#F2C14E;stroke-width:6}',
 '.day7-story-art .gold-fill{fill:#F2C14E;stroke:#D7A928;stroke-width:4}',
 '.day7-story-art .story-future{opacity:0}',
].join('\n');

export function decorateDay7RichStory(html:string,plan:ResolvedFinancePlan){
 if(plan.day!==7||plan.sequences.length!==3)throw new Error('DAY7_STORY_SCOPE');
 const runtime:any[]=[];
 for(const sequence of plan.sequences){
  const layout=DAY7_RICH_LAYOUT[sequence.id as keyof typeof DAY7_RICH_LAYOUT],art=DAY7_STORY_ART[sequence.id],steps=DAY7_STORY_STEPS[sequence.id];
  if(!layout||!art||!steps)throw new Error('DAY7_STORY_ASSET_MISSING: '+sequence.id);
  const stageId='fm-'+sequence.id+'-stage';
  const re=new RegExp('(id="'+stageId+'"[^>]*>)([\\s\\S]*?)(<div class="fm-focus-ring")');
  if(!re.test(html))throw new Error('DAY7_STORY_STAGE_MISSING: '+stageId);
  html=html.replace(re,'$1<svg class="day7-story-art" viewBox="0 0 '+layout.stage.w+' '+layout.stage.h+'" aria-hidden="true">'+art+'</svg>$3');
  for(const step of steps){
   const sourceEvent=sequence.motionEvents.find(item=>item.id===step.event);
   if(!sourceEvent||!Number.isFinite(sourceEvent.atSec))throw new Error('DAY7_STORY_EVENT_MISSING: '+sequence.id+'.'+step.event);
   runtime.push({...step,selector:'#'+stageId+' '+step.selector,at:sourceEvent.atSec,sequence:sequence.id,sourcePhrase:sourceEvent.trigger.sourceSpan});
  }
 }
 const style='<style id="day7-rich-story-style">'+DAY7_STORY_CSS+'</style>';
 const script='<script>(function(){const t=window.__timelines[\'news-video\'];if(!t)throw new Error(\'DAY7_STORY_TIMELINE_MISSING\');const steps='+JSON.stringify(runtime)+';window.__day7StoryEvents=steps;for(const s of steps){if(!document.querySelector(s.selector))throw new Error(\'DAY7_STORY_SELECTOR_MISSING: \'+s.selector);t.to(s.selector,{...s.to,duration:s.duration??.38,ease:\'power2.inOut\'},s.at);}})();</script>';
 return html.replace('</head>',style+'</head>').replace('</body>',script+'</body>');
}
