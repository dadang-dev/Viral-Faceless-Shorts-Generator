import type {ResolvedFinancePlan} from '../src/contracts/finance-motion.js';
import {VISUAL_SAFE_FRAME} from '../src/contracts/visual-collision.js';

export const TRANSITIONS_OUT='output/benchmarks/day-4-v12-transitions';
export const TRANSITION_STYLE={leadSec:.27,coverSec:.32,exitSec:.32,edgePx:10};
export function day4Transitions(plan:ResolvedFinancePlan){
 if(plan.day!==4||plan.sequences.length!==6)throw new Error('DAY4_TRANSITION_SCOPE');
 return plan.sequences.slice(1).map(s=>({id:`day4-transition-${s.id}`,sequence:s.id,boundarySec:s.startSec,startSec:s.startSec-TRANSITION_STYLE.leadSec,coverSec:s.startSec-TRANSITION_STYLE.leadSec+TRANSITION_STYLE.coverSec,endSec:s.startSec-TRANSITION_STYLE.leadSec+TRANSITION_STYLE.coverSec+TRANSITION_STYLE.exitSec}));
}
// Presentation-only shutter masks the existing handoff without moving semantic objects.
export function decorateDay4Transitions(html:string,plan:ResolvedFinancePlan){
 const cuts=day4Transitions(plan),b=VISUAL_SAFE_FRAME;
 const css=`<style id="day4-transitions-style">
 .day4-transition{position:absolute;left:${b.left}px;top:${b.top}px;width:${b.right-b.left}px;height:${b.bottom-b.top}px;overflow:hidden;pointer-events:none;z-index:80;visibility:hidden;contain:paint}
 .day4-transition-panel{position:absolute;inset:0;background:linear-gradient(110deg,var(--navy-deep),var(--navy-surface));border-left:${TRANSITION_STYLE.edgePx}px solid var(--accent-gold);border-right:${TRANSITION_STYLE.edgePx}px solid var(--accent-amber)}
 .day4-transition-panel::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(135deg,transparent 0 50px,rgba(245,166,35,.055) 51px 52px)}
 </style>`;
 const layers=cuts.map(c=>`<div class="day4-transition" id="${c.id}" aria-hidden="true"><div class="day4-transition-panel"></div></div>`).join('');
 const js=`<script>(function(){const t=window.__timelines['news-video'];const cuts=${JSON.stringify(cuts)};window.__day4Transitions=cuts;for(const c of cuts){const panel='#'+c.id+' .day4-transition-panel';t.set(panel,{x:${b.left-b.right}},0);t.set('#'+c.id,{visibility:'visible'},c.startSec);t.fromTo(panel,{x:${b.left-b.right}},{x:0,duration:${TRANSITION_STYLE.coverSec},ease:'power2.inOut',immediateRender:false},c.startSec);t.fromTo(panel,{x:0},{x:${b.right-b.left},duration:${TRANSITION_STYLE.exitSec},ease:'power2.inOut',immediateRender:false},c.coverSec);t.set('#'+c.id,{visibility:'hidden'},c.endSec);}})();</script>`;
 return html.replace('</head>',css+'</head>').replace('</body>',layers+js+'</body>');
}
