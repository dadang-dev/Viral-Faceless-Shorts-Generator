import type {ResolvedFinancePlan} from '../src/contracts/finance-motion.js';
import {VISUAL_SAFE_FRAME} from '../src/contracts/visual-collision.js';

export const DAY5_TRANSITIONS_OUT='output/benchmarks/day-5-v12-transitions';
export const DAY5_TRANSITION_STYLE={leadSec:.27,coverSec:.32,exitSec:.32,edgePx:8};

export function day5Transitions(plan:ResolvedFinancePlan){
 if(plan.day!==5||plan.sequences.length!==5)throw new Error('DAY5_TRANSITION_SCOPE');
 for(let i=1;i<plan.sequences.length;i++){
  const previous=plan.sequences[i-1].startSec,current=plan.sequences[i].startSec;
  if(!Number.isFinite(current)||current<=previous)throw new Error('DAY5_TRANSITION_BOUNDARY');
 }
 return plan.sequences.slice(1).map(sequence=>{
  const boundarySec=sequence.startSec,startSec=boundarySec-DAY5_TRANSITION_STYLE.leadSec;
  const coverSec=startSec+DAY5_TRANSITION_STYLE.coverSec;
  const endSec=coverSec+DAY5_TRANSITION_STYLE.exitSec;
  if(startSec<0)throw new Error('DAY5_TRANSITION_BOUNDARY');
  return {id:`day5-transition-${sequence.id}`,sequence:sequence.id,boundarySec,startSec,coverSec,endSec};
 });
}

// A statement-scan shutter marks the existing semantic handoff; it does not
// change the finance plan, narration, captions, or underlying scene objects.
export function decorateDay5Transitions(html:string,plan:ResolvedFinancePlan){
 const cuts=day5Transitions(plan),frame=VISUAL_SAFE_FRAME,height=frame.bottom-frame.top,width=frame.right-frame.left;
 const css=`<style id="day5-transitions-style">
 .day5-transition-layer{position:absolute;left:${frame.left}px;top:${frame.top}px;width:${width}px;height:${height}px;overflow:hidden;pointer-events:none;z-index:80;visibility:hidden;contain:paint}
 .day5-transition-panel{position:absolute;inset:0;box-sizing:border-box;background:linear-gradient(180deg,var(--navy-surface),var(--navy-deep) 72%,var(--navy-surface));border-top:${DAY5_TRANSITION_STYLE.edgePx}px solid var(--accent-gold);border-bottom:3px solid var(--accent-amber)}
 .day5-transition-panel::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 54px,rgba(245,166,35,.045) 55px 56px)}
 </style>`;
 const layers=cuts.map(cut=>`<div class="day5-transition-layer" id="${cut.id}" aria-hidden="true"><div class="day5-transition-panel"></div></div>`).join('');
 const script=`<script>(function(){const t=window.__timelines['news-video'];if(!t)throw new Error('DAY5_TRANSITION_TIMELINE_MISSING');const cuts=${JSON.stringify(cuts)};window.__day5Transitions=cuts;for(const c of cuts){const panel='#'+c.id+' .day5-transition-panel';t.set(panel,{y:${-height}},0);t.set('#'+c.id,{visibility:'visible'},c.startSec);t.fromTo(panel,{y:${-height}},{y:0,duration:${DAY5_TRANSITION_STYLE.coverSec},ease:'power2.inOut',immediateRender:false},c.startSec);t.fromTo(panel,{y:0},{y:${height},duration:${DAY5_TRANSITION_STYLE.exitSec},ease:'power2.inOut',immediateRender:false},c.coverSec);t.set('#'+c.id,{visibility:'hidden'},c.endSec);}})();</script>`;
 return html.replace('</head>',css+'</head>').replace('</body>',layers+script+'</body>');
}
