import {DOMINANT_FOREGROUND_HANDOFF,type ResolvedFinancePlan} from '../src/contracts/finance-motion.js';
import {DAY6_RICH_LAYOUT} from './day6-rich-story-plan.js';

const group=(name:string,body:string,future=false,attributes='')=>'<g class="'+name+(future?' story-future':'')+'" data-story-part="'+name+'"'+(attributes?' '+attributes:'')+'>'+body+'</g>';

export const DAY6_CHARACTER_ARTICULATION={
 'scarcity-question':{x:55,y:40,scale:.94,expression:'concerned',wrist:[248,356],anchor:null,rightArm:'M190 235 C220 253 244 286 252 319 Q257 340 248 356'},
 'tight-wallet':{x:363,y:30,scale:.78,expression:'worried',wrist:[310,347],anchor:[605,301],rightArm:'M190 235 C223 257 255 286 279 319 L310 347'},
 'knowing-feeling':{x:86,y:28,scale:.9,expression:'guarded',wrist:[433,310],anchor:[476,307],rightArm:'M190 235 C250 252 325 277 382 296 L433 310'},
 'weekly-safekeeping':{x:10,y:45,scale:.58,expression:'relieved',wrist:[250,469],anchor:[155,317],rightArm:'M190 235 C220 260 250 300 270 350 Q280 416 250 469'},
} as const;
type CharacterSequence=keyof typeof DAY6_CHARACTER_ARTICULATION;
const expressionArtwork:Record<(typeof DAY6_CHARACTER_ARTICULATION)[CharacterSequence]['expression'],string>={
 concerned:'<path class="face-ink" d="M99 79q12-12 25-4m16 0q13-8 25 4"/><ellipse class="face-eye" cx="112" cy="96" rx="7" ry="9"/><ellipse class="face-eye" cx="153" cy="96" rx="7" ry="9"/><path class="face-ink" d="M111 132q21-17 42 0"/>',
 worried:'<path class="face-ink" d="M99 84q12-9 25-2m16-2q13-7 25 2"/><ellipse class="face-eye" cx="112" cy="99" rx="7" ry="9"/><ellipse class="face-eye" cx="153" cy="99" rx="7" ry="9"/><path class="face-ink" d="M111 133q21-14 42 0"/>',
 guarded:'<path class="face-ink" d="M100 80l24 7m17 0 24-7"/><ellipse class="face-eye" cx="115" cy="98" rx="7" ry="8"/><ellipse class="face-eye" cx="157" cy="98" rx="7" ry="8"/><path class="face-ink" d="M114 130q18-7 36 0"/>',
 relieved:'<path class="face-ink" d="M100 92q12 13 24 0m17 0q12 13 24 0"/><path class="face-ink" d="M111 119q21 21 42 0"/>',
};
const person=(sequence:CharacterSequence)=>{
 const character=DAY6_CHARACTER_ARTICULATION[sequence],{x,y,scale,expression,wrist,anchor,rightArm}=character;
 const leftArm='M75 235 C42 253 25 292 37 327 L61 357';
 const wristAttribute='data-wrist-anchor="'+wrist[0]+','+wrist[1]+'"';
 const restingHands=anchor?'':'<path class="skin" d="M48 356q12-14 24-5l14 10q9 7 2 17l-10 10-23-9-12-13z"/><path class="skin" d="M238 348q12-11 22-3l15 11q8 7 1 16l-11 9-21-8-8-14z"/>';
 return '<g class="person-character" data-character-expression="'+expression+'" '+wristAttribute+' transform="translate('+x+' '+y+') scale('+scale+')">'+
  '<path class="person-arm-outline" d="'+leftArm+'"/><path class="person-arm-skin" d="'+leftArm+'"/><path class="person-arm-outline" d="'+rightArm+'"/><path class="person-arm-skin" d="'+rightArm+'"/>'+
  '<path class="skin neck" d="M106 131q26 14 52 0l7 78q-29 18-66 0z"/>'+
  '<path class="person-fill" d="M52 430c3-91 7-154 34-187q17-22 43-25 27 3 45 25 28 34 31 187z"/>'+
  '<path class="skin head" d="M79 80q0-62 53-64 54 2 53 64 0 47-34 65-12 7-20 7t-19-7q-33-18-33-65z"/>'+
  '<path class="hair" d="M78 92q-18-112 58-112 82 6 74 108l-34-23-7-39q-36 37-85 29z"/>'+
  '<g class="face-expression face-'+expression+'">'+expressionArtwork[expression]+'</g>'+restingHands+'</g>';
};

export const DAY6_STORY_ART:Record<string,string>={
 'scarcity-question':
  group('desk','<path class="desk" d="M35 525H785M115 525l-18 55m595-55 18 55"/>')+
  group('person',person('scarcity-question'))+
  group('wallet-object','<path class="wallet" d="M385 422q0-24 24-24h290q23 0 23 24v91H385z"/><path class="wallet-fold" d="M385 445h337v43H385z"/><circle class="wallet-snap" cx="675" cy="467" r="9"/>')+
  group('calculator','<g transform="translate(535 164)"><rect class="paper-shape" width="207" height="222" rx="24"/><rect class="screen" x="24" y="24" width="159" height="47" rx="8"/><path class="math-mark" d="M56 48h25m-12-12v24m52-12h28M42 111h26m-13-13v26m46 0h28m-14-14v28m42 0h26m-13-13v26"/><circle class="coin-token" cx="158" cy="164" r="15"/></g>',true)+
  group('math-marks','<path class="accent-line" d="M514 205l-16 22 16 18m249-40 16 22-16 18"/>',true)+
  group('coin-focus','<circle class="coin-token" cx="553" cy="447" r="26"/><path class="accent-line" d="M553 434v26m-13-13h26"/>',true)+
  group('scarcity-loop','<path class="accent-line" d="M402 413q-28 54 15 98 142 45 287-3 40-54 2-94"/>',true),

 'tight-wallet':
  group('background-table','<path class="desk" d="M35 438H845"/>')+
  group('calendar-stack','<g transform="translate(45 68) rotate(-7 75 84)"><rect class="paper-shape" x="0" y="0" width="148" height="174" rx="12"/><path d="M0 39h148M28 0v24m90-24v24M28 68h17m25 0h17m25 0h17M28 101h17m25 0h17m25 0h17M28 134h17m25 0h17"/></g>',true)+
  group('college-notes','<g transform="translate(225 39) rotate(5 82 95)"><path class="paper-shape" d="M0 16q80-30 164 0v184q-80-25-164 0z"/><path d="M82 6v185m-56-145h40m-40 31h40m-40 31h40m55-62h24m-24 31h24m-24 31h24"/><path class="accent-line" d="M38 143l13 13 25-29"/></g>',true)+
  group('person',person('tight-wallet'))+
  group('wallet-object','<path class="wallet" d="M525 282q0-26 27-26h285q25 0 25 26v133H525z"/><path class="wallet-fold" d="M525 309h337v63H525z"/><path class="wallet-seam" d="M548 399h273"/>')+
  group('lonely-coin','<circle class="coin-token" cx="701" cy="293" r="28"/><path class="accent-line" d="M701 279v28m-14-14h28"/>',true)+
  group('protecting-hand','<path class="skin hand" d="M605 301q22-47 61-17l44 35 48-14q22-5 25 17l-14 31-68 23-69-21-32-31z"/>',true,'data-wrist-anchor="605,301"')+
  group('unsafe-jar','<g transform="translate(688 42)"><path class="glass" d="M24 32h120l-7 12 19 25v120q0 18-18 18H31q-18 0-18-18V69l19-25z"/><path class="jar-rim" d="M21 32h126M34 14h100v18H34z"/><path class="accent-line" d="M46 127q38-19 76 0"/></g>',true),

 'knowing-feeling':
  group('person',person('knowing-feeling'))+
  group('advice-slip','<g transform="translate(492 58) rotate(-4 138 82)"><path class="paper-shape" d="M0 0h276v133l-22 23-22-23-22 23-22-23-22 23-22-23-22 23-22-23-22 23-22-23V0z"/><path d="M36 43h204m-204 36h162m-162 35h181"/><path class="accent-line" d="M211 161l-19 49"/></g>')+
  group('advice-arrow','<path class="muted-line" d="M703 215l-21 38m-15-28 15 28 29-5"/>')+
  group('jar','<g transform="translate(594 258)"><path class="glass" d="M26 30h155l-8 16 24 30v121q0 22-22 22H31q-22 0-22-22V76l25-30z"/><path class="jar-rim" d="M22 30h163M42 11h124v19H42z"/><path class="muted-line" d="M42 107h123"/></g>')+
  group('fear-hand','<path class="skin hand" d="M476 307q21-37 57-12l43 29 34-19q21-9 31 11l-4 23-57 40-79-16-31-31z"/>',true,'data-wrist-anchor="476,307"')+
  group('knowledge-book','<g transform="translate(487 44)"><path class="paper-shape" d="M0 19q67-26 135 0v142q-68-25-135 0zM135 19q68-26 135 0v142q-68-25-135 0z"/><path d="M135 18v144M24 57h85m-85 31h85m-85 31h65m74-62h82m-82 31h82m-82 31h61"/></g>',true)+
  group('knowledge-check','<path class="accent-line" d="M681 153l18 18 35-41"/>',true)+
  group('barrier','<path class="glass" d="M551 245q122-54 247 0v172q-125-54-247 0z"/><path class="accent-line" d="M550 241q122-54 248 0"/>',true),

 'weekly-safekeeping':
  group('desk','<path class="desk" d="M16 461H483"/>')+
  group('person',person('weekly-safekeeping'))+
  group('wallet-object','<path class="wallet" d="M37 330q0-14 15-14h119q15 0 15 14v86H37z"/><path class="wallet-fold" d="M37 352h149v39H37z"/><circle class="wallet-snap" cx="163" cy="372" r="6"/>')+
  group('reaching-hand','<path class="skin hand" d="M155 317q15-32 39-11l27 25 22-12q17-5 23 12l-7 21-39 26-47-17q-26-9-18-44z"/>',true,'data-wrist-anchor="155,317"')+
  group('week-loop','<path class="muted-line" d="M164 296a70 70 0 0 1 116 0m-2-25 4 27-27-4"/>',true)+
  group('clear-jar','<g transform="translate(300 243)"><path class="glass" d="M19 33h139l-7 15 21 27v151q0 21-21 21H24q-21 0-21-21V75l22-27z"/><path class="jar-rim" d="M15 33h147M31 13h116v20H31z"/><path class="muted-line" d="M27 172h123"/></g>',true)+
  group('coin-traveler','<g transform="translate(147 365)"><circle class="coin-token" cx="0" cy="0" r="24"/><path class="coin-mark" d="M0-12v24m-12-12h24"/></g>',true)+
  group('jar-clasp','<path class="accent-line" d="M322 438v18h114v-18m-57 0v18"/><circle class="accent-fill" cx="379" cy="432" r="11"/>',true)+
  group('jar-room','<path class="accent-line" d="M329 300h119m-102 25h85"/>',true)+
  group('hand-release','<path class="skin hand" d="M155 317q13-26 30-12l14 17 2-20q2-12 11-10l2 32 10-18q6-10 13-4l-14 31q-12 23-37 12l-22-12q-17-9-9-26z"/>',true,'data-wrist-anchor="155,317"'),
};

type Step={event:string;selector:string;to:Record<string,unknown>;duration?:number};
export const DAY6_STORY_STEPS:Record<string,Step[]>={
 'scarcity-question':[
  {event:'math',selector:'.calculator',to:{opacity:1,x:-8,rotation:-2},duration:.42},
  {event:'math',selector:'.math-marks',to:{opacity:1},duration:.3},
  {event:'scarcity',selector:'.calculator',to:{opacity:.12,y:-10},duration:.42},
  {event:'scarcity',selector:'.scarcity-loop',to:{opacity:1,rotation:3,transformOrigin:'560px 458px'},duration:.5},
  {event:'scarcity',selector:'.coin-focus',to:{opacity:1,scale:1.08},duration:.38},
 ],
 'tight-wallet':[
  {event:'past',selector:'.calendar-stack',to:{opacity:1,x:-8,y:4,rotation:-4},duration:.44},
  {event:'semester',selector:'.college-notes',to:{opacity:1,y:8,rotation:3},duration:.44},
  {event:'dollar',selector:'.lonely-coin',to:{opacity:1,y:-8,scale:1.08},duration:.38},
  {event:'last-one',selector:'.protecting-hand',to:{opacity:1},duration:.46},
  {event:'unsafe',selector:'.unsafe-jar',to:{opacity:1,y:-6},duration:.42},
 ],
 'knowing-feeling':[
  {event:'advice-fades',selector:'.advice-arrow',to:{opacity:.18,x:18},duration:.38},
  {event:'fear',selector:'.fear-hand',to:{opacity:1},duration:.46},
  {event:'clear-advice',selector:'.advice-slip',to:{opacity:0,x:20},duration:.36},
  {event:'knowledge',selector:'.knowledge-book',to:{opacity:1,y:-6,rotation:-2},duration:.4},
  {event:'knowledge',selector:'.knowledge-check',to:{opacity:1,scale:1.05},duration:.34},
  {event:'safe',selector:'.barrier',to:{opacity:1,y:-4},duration:.45},
  {event:'safe',selector:'.jar',to:{opacity:1},duration:.34},
 ],
 'weekly-safekeeping':[
  {event:'start',selector:'.reaching-hand',to:{opacity:1},duration:.4},
  {event:'five',selector:'.coin-traveler',to:{opacity:1,scale:1.06},duration:.38},
  {event:'week',selector:'.week-loop',to:{opacity:1,rotation:8,transformOrigin:'220px 300px'},duration:.42},
  {event:'savings',selector:'.clear-jar',to:{opacity:1,y:-6},duration:.42},
  {event:'savings',selector:'.coin-traveler',to:{x:88,y:-4},duration:.48},
  {event:'retained',selector:'.coin-traveler',to:{x:207,y:3},duration:.52},
  {event:'retained',selector:'.reaching-hand',to:{opacity:0},duration:.28},
  {event:'retained',selector:'.hand-release',to:{opacity:1},duration:.36},
  {event:'once-safe',selector:'.jar-clasp',to:{opacity:1,scale:1.04},duration:.4},
  {event:'amount-grow',selector:'.jar-room',to:{opacity:1,scale:1.03,transformOrigin:'390px 312px'},duration:.4},
  {event:'outro-clear',selector:'.day6-story-art',to:{opacity:0},duration:.12},
 ],
};

export const DAY6_RICH_STORY_CSS=[
 '.fm-sequence .fm-node:not([data-element-id="stage"]){visibility:hidden!important}',
 '.fm-sequence [data-element-id="stage"]{border:0;background:none;padding:0;display:block;border-radius:0}',
 '.fm-sequence [data-element-id="stage"] .fm-focus-ring{display:none}',
 '.day6-story-art{display:block;width:100%;height:100%;overflow:visible;fill:none;stroke:var(--accent-gold);stroke-width:5;stroke-linecap:round;stroke-linejoin:round}',
 '.day6-story-art .paper-shape{fill:var(--navy-surface);stroke:var(--accent-gold);stroke-width:5}',
 '.day6-story-art .screen{fill:var(--navy-deep);stroke:var(--text-muted);stroke-width:4}',
 '.day6-story-art .surface,.day6-story-art .wallet{fill:var(--navy-raised);stroke:var(--accent-gold);stroke-width:6}',
 '.day6-story-art .wallet-fold{fill:var(--navy-surface);stroke:var(--accent-gold);stroke-width:5}',
 '.day6-story-art .wallet-snap,.day6-story-art .accent-fill{fill:var(--accent-amber);stroke:var(--accent-gold);stroke-width:4}',
 '.day6-story-art .person-fill{fill:var(--navy-raised);stroke:var(--text-primary);stroke-width:6}',
 '.day6-story-art .skin{fill:var(--text-muted);stroke:var(--accent-gold);stroke-width:5}',
 '.day6-story-art .hair{fill:var(--navy-surface);stroke:var(--accent-gold);stroke-width:5}',
 '.day6-story-art .person-arm-outline{fill:none;stroke:var(--accent-gold);stroke-width:38;stroke-linecap:round;stroke-linejoin:round}',
 '.day6-story-art .person-arm-skin{fill:none;stroke:var(--text-muted);stroke-width:27;stroke-linecap:round;stroke-linejoin:round}',
 '.day6-story-art .hand{fill:var(--text-muted);stroke:var(--accent-gold);stroke-width:5}',
 '.day6-story-art .neck{stroke-width:4}',
 '.day6-story-art .face-ink{fill:none;stroke:var(--navy-deep);stroke-width:8;stroke-linecap:round;stroke-linejoin:round}',
 '.day6-story-art .face-eye{fill:var(--navy-deep);stroke:none}',
 '.day6-story-art .desk{stroke:var(--text-muted);stroke-width:7}',
 '.day6-story-art .coin-token{fill:var(--accent-amber);stroke:var(--accent-gold);stroke-width:5}',
 '.day6-story-art .coin-mark,.day6-story-art .math-mark{stroke:var(--navy-deep);stroke-width:5}',
 '.day6-story-art .accent-line{stroke:var(--accent-amber);stroke-width:9}',
 '.day6-story-art .muted-line,.day6-story-art .jar-rim,.day6-story-art .wallet-seam{stroke:var(--text-muted);stroke-width:6}',
 '.day6-story-art .glass{fill:var(--navy-surface);fill-opacity:.3;stroke:var(--text-muted);stroke-width:6}',
 '.day6-story-art .story-future{opacity:0}',
].join('\n');

export function decorateDay6RichStory(html:string,plan:ResolvedFinancePlan,outroEntranceSec:number){
 if(plan.day!==6||plan.sequences.length!==4)throw new Error('DAY6_RICH_STORY_SCOPE');
 const handoff=/data-handoff-out-sec="([\d.]+)" data-handoff-gap-sec="([\d.]+)" data-handoff-in-sec="([\d.]+)"/g;
 const handoffs=[...html.matchAll(handoff)];
 if(handoffs.length!==plan.sequences.length)throw new Error('DAY6_RICH_HANDOFF_METADATA_MISSING');
 // Keep the shared 180 ms transition but overlap 20 ms so no encoded frame lands on a zero-opacity seam.
 html=html.replace(handoff,(_match,outgoing)=>`data-handoff-out-sec="${outgoing}" data-handoff-gap-sec="-0.02" data-handoff-in-sec="${(DOMINANT_FOREGROUND_HANDOFF.crossfadeSec-Number(outgoing)+0.02).toFixed(2)}"`);
 const runtime:any[]=[];
 for(const sequence of plan.sequences){
  const layout=DAY6_RICH_LAYOUT[sequence.id as keyof typeof DAY6_RICH_LAYOUT];
  const art=DAY6_STORY_ART[sequence.id],steps=DAY6_STORY_STEPS[sequence.id];
  if(!layout||!art||!steps)throw new Error('DAY6_STORY_ASSET_MISSING: '+sequence.id);
  const stageId='fm-'+sequence.id+'-stage';
  const re=new RegExp('(id="'+stageId+'"[^>]*>)([\\s\\S]*?)(<div class="fm-focus-ring")');
  if(!re.test(html))throw new Error('DAY6_STORY_STAGE_MISSING: '+stageId);
  html=html.replace(re,'$1<svg class="day6-story-art" viewBox="0 0 '+layout.stage.w+' '+layout.stage.h+'" aria-hidden="true">'+art+'</svg>$3');
  for(const step of steps){
   const sourceEvent=sequence.motionEvents.find(item=>item.id===step.event);
   if(!sourceEvent||!Number.isFinite(sourceEvent.atSec))throw new Error('DAY6_STORY_EVENT_MISSING: '+sequence.id+'.'+step.event);
   runtime.push({...step,selector:'#'+stageId+' '+step.selector,at:step.event==='outro-clear'?outroEntranceSec:sourceEvent.atSec,sequence:sequence.id,sourcePhrase:sourceEvent.trigger.sourceSpan});
  }
 }
 const style='<style id="day6-rich-story-style">'+DAY6_RICH_STORY_CSS+'</style>';
 const script='<script>(function(){const t=window.__timelines[\'news-video\'];if(!t)throw new Error(\'DAY6_STORY_TIMELINE_MISSING\');const steps='+JSON.stringify(runtime)+';window.__day6StoryEvents=steps;for(const s of steps){if(!document.querySelector(s.selector))throw new Error(\'DAY6_STORY_SELECTOR_MISSING: \'+s.selector);t.to(s.selector,{...s.to,duration:s.duration??.38,ease:\'power2.inOut\'},s.at);}})();</script>';
 return html.replace('</head>',style+'</head>').replace('</body>',script+'</body>');
}
