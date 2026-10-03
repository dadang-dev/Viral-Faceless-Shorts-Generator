import type {ResolvedFinancePlan} from '../src/contracts/finance-motion.js';
import {DAY5_RICH_LAYOUT} from './day5-rich-story-plan.js';

const group=(name:string,body:string,future=false)=>`<g class="${name}${future?' story-future':''}" data-story-part="${name}">${body}</g>`;
const sheet=(x:number,y:number,w:number,h:number)=>`<g class="paper-shape"><path d="M${x} ${y}h${w}v${h-28}l-22 22-22-22-22 22-22-22-22 22-22-22-22 22-22-22-22 22-22-22V${y+h}Z"/><path d="M${x+34} ${y+76}h${w-68}M${x+34} ${y+128}h${w-88}M${x+34} ${y+180}h${w-68}M${x+34} ${y+232}h${w-110}M${x+34} ${y+284}h${w-70}"/></g>`;
const cloud=`<path class="paper-shape" d="M22 72h110a38 38 0 0 0 1-76 58 58 0 0 0-108-10A45 45 0 0 0 22 72Z"/><path d="M78 35v57m-23-23 23 23 23-23"/>`;
const phone=(x:number,y:number,w:number,h:number)=>`<g transform="translate(${x} ${y})"><rect class="device" width="${w}" height="${h}" rx="24"/><rect class="screen" x="12" y="16" width="${w-24}" height="${h-32}" rx="16"/><path d="M${w*.35} ${h-9}h${w*.3}"/></g>`;
const question=`<path d="M39 38a25 25 0 1 1 39 21c-11 7-16 12-16 28m0 25v3" stroke-width="11"/>`;
const glasses=`<circle cx="0" cy="0" r="55"/><path d="M41 41l87 87"/>`;

export const DAY5_STORY_ART:Record<string,string>={
 'guess-statement':
  group('person',`<ellipse class="skin" cx="224" cy="265" rx="98" ry="112"/><path class="hair" d="M129 273q-37-165 106-160 126 7 92 162l-48-57-12-62q-77 61-132 35z"/><path class="body" d="M113 716q-2-226 111-250 121 24 137 250z"/><path class="arm" d="M132 415q-49 30-62 125l73 44 54-81M307 409q58 26 77 119l-80 54-47-76"/><path d="M170 270h39m52 0h31M215 326q15 12 30 0"/>`)+
  group('covered-eyes','<path class="hand" d="M142 262q34-37 76 0l-13 28q-38-26-67 3zm93 0q35-37 78 0l-12 28q-40-27-68 3z"/>')+
  group('thought',`<path class="surface" d="M342 80h120q24 0 24 24v89q0 24-24 24h-41l-33 28 5-28h-51q-24 0-24-24v-89q0-24 24-24z"/><g transform="translate(360 94) scale(.72)">${question}</g>`,true)+
  group('desk','<path class="desk" d="M42 706H812M121 706l-20 80m631-80 20 80"/>')+
  group('statement-sheet',`${sheet(518,112,280,492)}<path class="amber-line" d="M552 368h212"/>${phone(614,414,94,162)}`,true)+
  group('reveal-hand','<path class="hand" d="M480 685l48-26 80-1 32 18-17 23H529z"/>',true),

 'range-comparison':
  group('ledger',`${sheet(281,18,318,400)}<path class="amber-line focus-row" d="M315 198h249"/><path class="muted-line" d="M315 250h190M315 302h226M315 354h166"/>`)+
  group('ledger-extension','<path class="paper-shape" d="M321 416h237l-18 36H339z"/><path class="amber-line" d="M350 438h177"/>',true)+
  group('estimate-stack','<path class="surface" d="M95 274h114v112H95zM75 252h114v112H75z"/><path d="M109 290h50m-50 22h50m-50 22h36"/>',true)+
  group('streaming-device','<rect class="device" x="18" y="430" width="158" height="112" rx="18"/><rect class="screen" x="29" y="441" width="136" height="88" rx="10"/><path class="amber-fill" d="M79 461l40 24-40 24z"/><path d="M97 543v25m-32 0h64"/>',true)+
  group('one-app-device',`${phone(192,408,120,172)}<rect class="amber-fill" x="219" y="441" width="66" height="66" rx="14"/><path class="dark-stroke" d="M236 474h32m-16-16v32"/>`,true)+
  group('cloud-object',`<g transform="translate(345 452) scale(.92)">${cloud}</g><path class="surface" d="M369 525h132v61H369z"/><path d="M391 545h88m-88 18h61"/>`,true)+
  group('trial-object','<path class="surface" d="M543 432h132l18 25v98H525v-98z"/><path d="M543 432v34h132v-34m-66 34v82m-20-53h40m-40 24h40"/><circle class="amber-fill" cx="589" cy="551" r="7"/>',true)+
  group('trial-paid','<path class="amber-line trial-currency-line" d="M543 567h132"/><path class="amber-fill" d="M631 539l28 28-28 28"/>',true)+
  group('fitness-object',`${phone(704,410,138,180)}<path class="amber-line" d="M730 480h87M744 462v36m59-36v36m-44 0v-36"/>`,true)+
  group('fitness-use','<path class="amber-line" d="M733 610l13 13 24-28m40 15 13 13 24-28"/>',true)+
  group('source-connectors','<path d="M210 310h55v-66h16m318 5h40v-82h41m-158 250v25m160-28v28m-185-33v34m188-19v19"/>'),

 'charge-attention':
  group('statement',`${sheet(47,118,298,478)}<path class="amber-line charge-row" d="M82 371h226"/><path class="muted-line" d="M82 423h174M82 475h205"/>`)+
  group('loop-track','<path class="loop" d="M345 368h97q76 0 76-76v-91q0-71 69-71h49m-39-24 39 24-39 24"/>')+
  group('mechanism','<circle class="surface" cx="498" cy="368" r="91"/><circle cx="498" cy="368" r="49"/><path d="M498 243v33m0 184v33m-125-125h33m184 0h33m-214-89 24 24m130 130 24 24m0-178-24 24m-130 130-24 24"/>',true)+
  group('gear-small','<circle class="amber-fill" cx="656" cy="230" r="50"/><circle class="navy-hole" cx="656" cy="230" r="17"/><path d="M656 162v22m0 92v22m-68-68h22m92 0h22m-116-48 16 16m64 64 16 16m0-96-16 16m-64 64-16 16"/>',true)+
  group('recipient','<path class="body" d="M630 703q-2-183 120-207 115 29 120 207z"/><ellipse class="skin" cx="752" cy="331" rx="67" ry="76"/><path class="hair" d="M681 334q-17-116 80-116 78 6 59 117l-37-34-4-36q-43 43-98 32z"/><path class="hand" d="M639 481q28-48 73-25l38 24 48 5q20 4 15 24l-18 17-73-1-52-5z"/><path class="receiver-pocket" d="M710 561h82v61h-82z"/>',true)+
  group('charge-transfer','<rect class="amber-fill transfer-card" x="365" y="341" width="92" height="55" rx="10"/><path class="amber-line" d="M399 369h26"/>',true),

 'monthly-review':
  group('calendar-page','<rect class="surface" x="78" y="62" width="214" height="210" rx="20"/><path d="M78 116h214M126 43v42m116-42v42M119 152h24m33 0h24m33 0h24m-138 43h24m33 0h24"/>',true)+
  group('closed-statement','<path class="paper-shape" d="M365 96h347v462H365z"/><path d="M418 172h239m-239 58h206m-206 58h239m-239 58h180"/>')+
  group('open-statement',`${sheet(365,96,347,462)}<path class="amber-line review-row" d="M399 324h279"/>`,true)+
  group('magnifier',`<g transform="translate(428 362)">${glasses}</g><circle class="glass-highlight" cx="428" cy="362" r="43"/>`,true)+
  group('review-sweep','<path class="amber-line" d="M422 324h276"/>',true)+
  group('all-rows-stay','<path class="retained-row" d="M399 376h279M399 428h235M399 480h279"/>',true),

 'actually-look':
  group('person','<ellipse class="skin" cx="190" cy="272" rx="75" ry="92"/><path class="hair" d="M119 273q-29-124 78-130 92 8 68 131l-37-42-6-44q-35 40-86 31z"/><path d="M154 277h21m35 0h21m-47 47q15 13 30 0"/><path class="body" d="M93 722q-4-215 97-238 105 22 112 238z"/><path class="arm" d="M132 432l93 94m72-96-72 90"/>')+
  group('statement',`${sheet(376,100,354,485)}<path class="amber-line focus-row" d="M414 356h278"/><path class="muted-line" d="M414 408h222m-222 52h278m-278 52h191"/>`)+
  group('magnifier','<circle cx="551" cy="353" r="60"/><path d="M595 397l76 77"/><circle class="glass-highlight" cx="551" cy="353" r="44"/>',true)+
  group('clear-view','<path class="amber-line" d="M407 356h291"/><path d="M497 625q54-50 108 0-54 49-108 0zm54-18a18 18 0 1 0 0 36 18 18 0 0 0 0-36z"/>',true)+
  group('soft-shoulders','<path class="soft-arc" d="M95 553q94 45 190 0"/>',true),
};

type Step={event:string;selector:string;to:Record<string,unknown>;duration?:number};
export const DAY5_STORY_STEPS:Record<string,Step[]>={
 'guess-statement':[
  {event:'guess-reveal',selector:'.thought',to:{opacity:1,y:-14},duration:.34},
  {event:'paying',selector:'.reveal-hand',to:{opacity:1,x:18,y:-5},duration:.42},
  {event:'statement',selector:'.statement-sheet',to:{opacity:1,x:-10,y:0},duration:.48},
 ],
 'range-comparison':[
  {event:'three',selector:'.estimate-stack',to:{opacity:1,y:-12},duration:.34},
  {event:'actually',selector:'.ledger-extension',to:{opacity:1,y:10},duration:.42},
  {event:'streaming',selector:'.streaming-device',to:{opacity:1,scale:1.04},duration:.34},
  {event:'one-app',selector:'.one-app-device',to:{opacity:1,y:-8},duration:.34},
  {event:'cloud',selector:'.cloud-object',to:{opacity:1,y:-8},duration:.4},
  {event:'trial',selector:'.trial-object',to:{opacity:1,rotation:-3},duration:.36},
  {event:'paid',selector:'.trial-paid',to:{opacity:1,x:8},duration:.3},
  {event:'paid',selector:'.trial-paid .trial-currency-line',to:{stroke:'var(--accent-amber)'},duration:.3},
  {event:'fitness',selector:'.fitness-object',to:{opacity:1,x:-8},duration:.38},
  {event:'twice',selector:'.fitness-use',to:{opacity:1,scale:1.06},duration:.28},
 ],
 'charge-attention':[
  {event:'forgotten',selector:'.mechanism',to:{opacity:1,rotation:28,transformOrigin:'498px 368px'},duration:.55},
  {event:'business-model',selector:'.gear-small',to:{opacity:1,rotation:-22,transformOrigin:'656px 230px'},duration:.48},
  {event:'stop-noticing',selector:'.charge-row',to:{opacity:.18,stroke:'var(--text-muted)'},duration:.55},
  {event:'recipient',selector:'.recipient',to:{opacity:1,y:-8},duration:.42},
  {event:'recipient',selector:'.charge-transfer',to:{opacity:1,x:228,y:192},duration:.55},
 ],
 'monthly-review':[
  {event:'monthly-reveal',selector:'.calendar-page',to:{opacity:1,rotation:-3},duration:.4},
  {event:'statement',selector:'.closed-statement',to:{opacity:0,x:-14},duration:.32},
  {event:'statement',selector:'.open-statement',to:{opacity:1,scale:1.015},duration:.4},
  {event:'seconds',selector:'.magnifier',to:{opacity:1,x:98,y:8},duration:.5},
  {event:'seconds',selector:'.review-sweep',to:{opacity:1},duration:.4},
  {event:'not-cancel',selector:'.all-rows-stay',to:{opacity:1},duration:.32},
  {event:'look',selector:'.magnifier',to:{x:125,y:62,scale:1.05},duration:.52},
 ],
 'actually-look':[
  {event:'extreme',selector:'.soft-shoulders',to:{opacity:1},duration:.38},
  {event:'look-payoff',selector:'.magnifier',to:{opacity:1,x:15,y:2,scale:1.03},duration:.48},
  {event:'look-payoff',selector:'.clear-view',to:{opacity:1},duration:.42},
 ],
};

export const DAY5_RICH_STORY_CSS=`
#grain-overlay{display:none}
:root{--navy-deep:#0B1526;--navy-surface:#0B1526;--navy-raised:#152238;--text-primary:#FFFFFF;--text-muted:#A0AEC0;--accent-gold:#D4AF37;--accent-amber:#F5A623}
html,body,.shell-bg{background:#0B1526}
.shell-bg::before{content:"";position:absolute;inset:0;opacity:.065;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='192'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' seed='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.65'/%3E%3C/svg%3E")}
.shell-bg::after{content:"";position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(#152238 1px,transparent 1px),linear-gradient(90deg,#152238 1px,transparent 1px);background-size:72px 72px}
.brand-shell-header{top:100px;left:60px;padding:16px 24px 16px 16px;gap:16px;border-radius:26px;background:#0B1526;border:1px solid #152238}
.brand-icon{width:64px;height:64px;border-radius:14px;background:#F5A623;color:#FFFFFF;box-shadow:none}
.brand-name{font-size:30px;text-transform:uppercase;color:#FFFFFF}
.brand-tag{color:#A0AEC0;font-size:20px;letter-spacing:3px}
#finance-actually-look~.scene[data-layout="outro"] .out-cta-top{top:270px;font-size:56px;line-height:1.2}
.fm-element[data-role="HERO"] .fm-copy{color:#FFFFFF}
.fm-element[data-role="SECTION_MARKER"] .fm-copy{color:#F5A623}
.fm-sequence .fm-node:not([data-element-id="stage"]){visibility:hidden!important}
.fm-sequence [data-element-id="stage"]{border:0;background:none;padding:0;display:block;border-radius:0}
.fm-sequence [data-element-id="stage"] .fm-focus-ring{display:none}
.day5-story-art{display:block;width:100%;height:100%;overflow:hidden;fill:none;stroke:#D4AF37;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
.day5-story-art .paper-shape{fill:#FFFFFF;stroke:#D4AF37;stroke-width:5}
.day5-story-art .surface{fill:#152238;stroke:#D4AF37}
.day5-story-art .device{fill:#152238;stroke:#A0AEC0;stroke-width:7}
.day5-story-art .screen{fill:#0B1526;stroke:#A0AEC0;stroke-width:4}
.day5-story-art .body{fill:#152238;stroke:#D4AF37}
.day5-story-art .skin,.day5-story-art .hand{fill:#D4AF37;stroke:#0B1526;stroke-width:4}
.day5-story-art .hair{fill:#152238;stroke:#D4AF37}
.day5-story-art .desk{stroke:#A0AEC0;stroke-width:7}
.day5-story-art .amber-fill{fill:#F5A623;stroke:#D4AF37}
.day5-story-art .amber-line{stroke:#F5A623;stroke-width:10}
.day5-story-art .muted-line{stroke:#A0AEC0;opacity:.56;stroke-width:7}
.day5-story-art .dark-stroke{stroke:#0B1526}
.day5-story-art .navy-hole{fill:#0B1526;stroke:#0B1526}
.day5-story-art .loop{stroke:#A0AEC0;stroke-width:8}
.day5-story-art .receiver-pocket{fill:#0B1526;stroke:#F5A623;stroke-width:8}
.day5-story-art .glass-highlight{fill:#F5A623;fill-opacity:.12;stroke:#F5A623;stroke-width:4}
.day5-story-art .soft-arc{stroke:#A0AEC0;stroke-width:8}
.day5-story-art .story-future{opacity:0}
.tt-card{left:110px;width:800px;transform:translateY(300px);bottom:330px;padding:24px;gap:20px;background:#0B1526;border:1px solid #152238;box-shadow:none}
.tt-avatar{width:100px;height:100px;border-color:#152238}
.tt-profile-info{margin-right:0;flex:1}
.tt-display-name{font-size:30px;color:#FFFFFF}
.tt-handle{font-size:26px;color:#A0AEC0}
.tt-followers{display:none}
.tt-follow-btn{width:200px;background:#F5A623}
.tt-btn-text{color:#0B1526;font-size:28px}
`;

export function decorateDay5RichStory(html:string,plan:ResolvedFinancePlan){
 if(plan.day!==5||plan.sequences.length!==5)throw new Error('DAY5_RICH_STORY_SCOPE');
 const runtime:any[]=[];
 for(const sequence of plan.sequences){
  const layout=DAY5_RICH_LAYOUT[sequence.id as keyof typeof DAY5_RICH_LAYOUT];
  const art=DAY5_STORY_ART[sequence.id],steps=DAY5_STORY_STEPS[sequence.id];
  if(!layout||!art||!steps)throw new Error(`DAY5_STORY_ASSET_MISSING: ${sequence.id}`);
  const stageId=`fm-${sequence.id}-stage`;
  const re=new RegExp(`(id="${stageId}"[^>]*>)([\\s\\S]*?)(<div class="fm-focus-ring")`);
  if(!re.test(html))throw new Error(`DAY5_STORY_STAGE_MISSING: ${stageId}`);
  html=html.replace(re,`$1<svg class="day5-story-art" viewBox="0 0 ${layout.stage.w} ${layout.stage.h}" aria-hidden="true">${art}</svg>$3`);
  for(const step of steps){
   const event=sequence.motionEvents.find(item=>item.id===step.event);
   if(!event)throw new Error(`DAY5_STORY_EVENT_MISSING: ${sequence.id}.${step.event}`);
   runtime.push({...step,selector:`#${stageId} ${step.selector}`,at:event.atSec,sequence:sequence.id,sourcePhrase:event.trigger.sourceSpan});
  }
 }
 const css=`<style id="day5-rich-story-style">${DAY5_RICH_STORY_CSS}</style>`;
 const script=`<script>(function(){const t=window.__timelines['news-video'];if(!t)throw new Error('DAY5_STORY_TIMELINE_MISSING');const steps=${JSON.stringify(runtime)};window.__day5StoryEvents=steps;for(const s of steps){if(!document.querySelector(s.selector))throw new Error('DAY5_STORY_SELECTOR_MISSING: '+s.selector);t.to(s.selector,{...s.to,duration:s.duration??.38,ease:'power2.inOut'},s.at);}})();</script>`;
 return html.replace('</head>',css+'</head>').replace('</body>',script+'</body>');
}
