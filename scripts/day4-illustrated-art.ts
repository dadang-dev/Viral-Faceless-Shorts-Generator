import type {ResolvedFinancePlan} from '../src/contracts/finance-motion.js';

// Episode-local vector art, using the same node-decoration hook as Day 2.
// No SVG text or financial quantities: semantic wording stays in validated copy/captions.
const g=(name:string,body:string,future=false)=>`<g class="${name}${future?' story-future':''}" data-story-part="${name}">${body}</g>`;
const brain=`<path class="paper" d="M125 35C95 0 40 15 34 53C3 60-7 108 16 136C0 167 18 208 49 212C59 248 112 257 135 226C165 255 212 240 220 211C252 194 254 153 236 133C260 100 240 60 212 55C209 15 153 3 125 35Z"/><path d="M130 40V221M51 64Q89 49 94 85T60 120M26 142Q69 127 85 161T58 206M207 67Q172 47 164 88T202 127M231 149Q188 128 173 167T202 208M97 100L130 122L163 106M96 181L130 158L164 184"/>`;
const bag=`<path class="paper" d="M12 44H122L112 148H23Z"/><path d="M41 45V29a26 26 0 0 1 52 0v16"/>`;
const cup=`<path class="paper" d="M17 45H131L119 194H31Z"/><path class="amber-fill" d="M8 30H140V49H8ZM26 16H121V30H26Z"/><path d="M39 103H110M45 153H106"/>`;
const face=`<ellipse class="skin" cx="231" cy="233" rx="76" ry="91"/><path class="hair" d="M157 239Q110 125 207 113Q300 93 308 188L278 216L270 162Q228 201 173 187Z"/><path class="eyes" d="M188 231l19 0M252 231l18 0"/><path class="mouth" d="M209 278Q232 263 252 278"/><path d="M229 236l-6 20h14"/>`;
const person=`<path class="muted-fill" d="M120 420Q135 335 199 327H269Q320 328 359 414L386 570H95Z"/><path class="paper" d="M159 353Q117 369 109 437L98 494Q94 523 127 527L229 495L216 460L151 473L170 409"/><path class="skin" d="M209 460l66-51q21-10 27 9l-9 42-67 38Z"/><path class="hair" d="M130 570L140 683H207L220 589L251 683H323L302 570Z"/><path d="M98 690H209M253 690H343"/>${g('face',face)}<path class="skin" d="M301 374L357 433L419 394l22 28-73 66q-23 14-42-5l-52-53"/>`;
const phone=`<rect class="device" x="456" y="133" width="292" height="492" rx="43"/><rect class="screen" x="472" y="163" width="260" height="411" rx="25"/><path d="M552 150H652M577 602H628"/><g transform="translate(533 248) scale(1.05)">${bag}</g><rect class="buy-button amber-fill" x="512" y="482" width="180" height="62" rx="20"/><path class="button-arrow dark-stroke" d="M569 513h64m-20-16 20 16-20 16"/>`;
const hand=`<path class="skin" d="M807 673L716 621L662 600L638 571Q630 550 612 555Q597 562 605 582L622 609L589 596Q561 591 562 614L592 659L686 702Z"/><path d="M631 611L655 637M611 624L635 651"/>`;
const stress=`<path d="M101 202L67 181L91 157L53 134M335 212L367 182L349 158L387 138M125 98L110 69M313 98L333 65"/>`;
const halo=`<ellipse cx="231" cy="233" rx="134" ry="146" fill="var(--accent-amber)" opacity=".12"/><path d="M85 264Q60 114 193 83M274 81Q414 130 373 279" stroke="var(--accent-amber)" stroke-width="10"/>`;
const receipt=`<path class="paper" d="M529 163H778V621L753 600L729 621L704 600L679 621L654 600L629 621L604 600L579 621L554 600L529 621Z"/><path d="M570 233H734M570 274H700M570 330H736M570 371H724M570 412H734M570 471H736M570 516H736"/><path class="amber-fill" d="M567 557H740V571H567Z"/>`;
const question=`<path d="M40 66C40 7 139 5 140 64C140 105 90 105 90 141M90 174V181" stroke-width="15"/>`;
const laptop=`<rect class="device" x="110" y="285" width="630" height="340" rx="24"/><rect class="screen" x="130" y="307" width="590" height="295" rx="12"/><path class="paper" d="M78 626H774L814 673H41Z"/><path d="M348 645H504"/><g transform="translate(185 350)">${bag}</g><path d="M408 365H654M408 412H612"/><rect class="amber-fill" x="407" y="474" width="249" height="73" rx="17"/><path class="dark-stroke" d="M492 510H569m-23-18 23 18-23 18"/>`;
const night=`<rect class="screen" x="494" y="20" width="265" height="214" rx="20"/><path d="M626 20V234M494 126H759"/><path class="amber-fill" d="M599 52A59 59 0 1 0 677 116A59 59 0 0 1 599 52Z"/>`;
const meeting=`<rect class="device" x="483" y="110" width="296" height="192" rx="17"/><path d="M628 303V344M550 344H711"/>${[532,628,724].map(x=>`<circle class="paper" cx="${x}" cy="177" r="22"/><path d="M${x-32} 249q0-44 32-44t32 44"/>`).join('')}`;

export const STORY_ART:Record<string,string>={
 'wiring-story':g('wallet',`<g transform="translate(33 237)"><path class="wallet-flap paper" d="M22 108V49L328 3V108"/><rect class="muted-fill" x="6" y="105" width="356" height="250" rx="35"/><path class="paper" d="M250 190H372V276H250Z"/><circle cx="285" cy="233" r="8"/><path d="M37 324H184"/></g>`)+g('brain',`<g transform="translate(550 140) scale(1.08)">${brain}</g>`)+g('circuit','<path d="M406 455H474V263H534" pathLength="380"/><circle cx="405" cy="455" r="10"/><circle cx="534" cy="263" r="10"/>',true)+g('signal','<circle class="amber-fill" cx="475" cy="350" r="16"/>',true),
 'relief-story':g('relief-halo',halo,true)+g('person',person)+g('phone',phone)+g('stress',stress,true)+g('purchase-hand',hand,true)+g('confirmation','<circle class="amber-fill" cx="607" cy="363" r="84"/><path class="dark-stroke" d="M563 363l30 30 58-62" stroke-width="13"/>',true)+g('brain-inset',`<g transform="translate(45 5) scale(.38)">${brain}</g>`,true),
 'examples-story':g('night-window',night,true)+g('night-order',laptop)+g('order-click','<circle cx="534" cy="510" r="61" stroke-width="9"/><path d="M569 541l46 62"/>',true)+g('coffee-vignette',`${meeting}<g transform="translate(527 384) scale(1.6)">${cup}</g><path d="M464 704H830"/>`,true)+g('steam','<path d="M596 354q-22-24 0-49M637 354q-22-24 0-49M677 354q-22-24 0-49"/>',true),
 'bill-story':g('relief-halo',halo)+g('person',person)+g('receipt',receipt,true)+g('receipt-emphasis','<path d="M505 182V591M803 182V591" stroke-width="9"/>',true),
 'checkout-story':g('thought','<path class="paper" d="M52 80H335Q366 80 366 113V245Q366 277 335 277H243L183 324L191 277H52Q23 277 23 245V113Q23 80 52 80Z"/><g transform="translate(126 105) scale(.72)">'+question+'</g>',true)+g('phone',phone)+g('purchase-hand',hand)+g('urge','<path d="M412 435L387 408M788 435L813 407M601 88V58" stroke-width="9"/>')+g('feeling-face',`<g transform="translate(-13 330) scale(.75)">${g('face',face)}</g>`,true)+g('anxiety-marks','<path d="M76 475l-29-22 20-23M242 484l31-22-21-23"/>',true)+g('pause-mark','<path d="M772 430V492M800 430V492" stroke-width="13"/>',true),
 'question-story':g('phone',phone)+g('purchase-hand',hand)+g('intervening-question','<g transform="translate(189 265) scale(1.1)">'+question+'</g>',true)+g('pause-mark','<path d="M776 422V484M804 422V484" stroke-width="13"/>',true)
};

type Step={event:string;selector:string;to:Record<string,unknown>;duration?:number;delay?:number};
// All offsets are internal, bounded illustration gestures; event origins are WordBoundary.
export const STORY_STEPS:Record<string,Step[]>={
 'wiring-story':[{event:'wallet-opens',selector:'.wallet-flap',to:{rotation:-8,transformOrigin:'left bottom'},duration:.5},{event:'wiring-connects',selector:'.circuit',to:{opacity:1}},{event:'wiring-connects',selector:'.signal',to:{opacity:1,y:-80},duration:.65}],
 'relief-story':[{event:'stress',selector:'.stress',to:{opacity:1}},{event:'bored',selector:'.stress',to:{opacity:.25}},{event:'bored',selector:'.face',to:{rotation:8,svgOrigin:'231 300'}},{event:'tired',selector:'.eyes',to:{scaleY:.25,svgOrigin:'231 231'}},{event:'tired',selector:'.face',to:{y:12}},{event:'buy',selector:'.purchase-hand',to:{opacity:1,x:-16,y:-14},duration:.65},{event:'buy',selector:'.buy-button',to:{fill:'#D4AF37'},delay:.5},{event:'brain',selector:'.brain-inset',to:{opacity:1}},{event:'relief',selector:'.confirmation',to:{opacity:1}},{event:'relief',selector:'.relief-halo',to:{opacity:1}},{event:'relief',selector:'.stress',to:{opacity:0}},{event:'relief',selector:'.face',to:{y:0,rotation:0}},{event:'relief',selector:'.mouth',to:{attr:{d:'M209 271Q232 289 252 271'}}},{event:'temporary',selector:'.relief-halo',to:{opacity:.12},duration:1},{event:'temporary',selector:'.confirmation',to:{opacity:0},duration:.6}],
 'examples-story':[{event:'night',selector:'.night-window',to:{opacity:1}},{event:'order',selector:'.order-click',to:{opacity:1}},{event:'coffee',selector:'.night-order',to:{scale:.49,x:3,y:220,svgOrigin:'0 0'},duration:.65},{event:'coffee',selector:'.night-window',to:{scale:.49,x:3,y:220,svgOrigin:'0 0'},duration:.65},{event:'coffee',selector:'.order-click',to:{opacity:0},duration:.18},{event:'coffee',selector:'.coffee-vignette',to:{opacity:1},delay:.25},{event:'coffee',selector:'.steam',to:{opacity:1,y:-8},delay:.4},{event:'meeting',selector:'.coffee-vignette',to:{y:-12},duration:.4}],
 'bill-story':[{event:'not-weakness',selector:'.face',to:{rotation:-5,svgOrigin:'231 300'}},{event:'biology',selector:'.mouth',to:{attr:{d:'M209 271Q232 289 252 271'}}},{event:'biology',selector:'.receipt',to:{opacity:1}},{event:'short',selector:'.relief-halo',to:{opacity:0},duration:.8},{event:'short',selector:'.mouth',to:{attr:{d:'M209 274H252'}}},{event:'bill',selector:'.receipt',to:{y:35},duration:.6},{event:'bill',selector:'.receipt-emphasis',to:{opacity:1},delay:.3}],
 'checkout-story':[{event:'habit',selector:'.purchase-hand',to:{x:26,y:26}},{event:'approach',selector:'.purchase-hand',to:{x:-3,y:-8},duration:.8},{event:'pause',selector:'.pause-mark',to:{opacity:1}},{event:'question',selector:'.thought',to:{opacity:1}},{event:'not-need',selector:'.phone .buy-button',to:{fill:'#A0AEC0'}},{event:'name',selector:'.feeling-face',to:{opacity:1}},{event:'tired',selector:'.feeling-face .face',to:{y:0}},{event:'tired',selector:'.feeling-face .eyes',to:{scaleY:.2,svgOrigin:'231 231'}},{event:'bored',selector:'.feeling-face',to:{rotation:7,svgOrigin:'160 570'}},{event:'anxious',selector:'.anxiety-marks',to:{opacity:1}},{event:'pass',selector:'.purchase-hand',to:{x:35,y:24,opacity:.25},duration:.75},{event:'pass',selector:'.urge',to:{opacity:0}},{event:'own',selector:'.anxiety-marks',to:{opacity:0}},{event:'own',selector:'.feeling-face',to:{rotation:0}},{event:'own',selector:'.feeling-face .mouth',to:{attr:{d:'M209 271Q232 289 252 271'}}},{event:'screen',selector:'.pause-mark',to:{opacity:0}}],
 'question-story':[{event:'discipline',selector:'.purchase-hand',to:{x:35,y:24,opacity:.4}},{event:'honest',selector:'.intervening-question',to:{opacity:1}},{event:'button',selector:'.pause-mark',to:{opacity:1}}]
};

export function decorateIllustratedDay4(html:string,plan:ResolvedFinancePlan){
 const runtime:any[]=[];
 for(const s of plan.sequences){
  if(!STORY_ART[s.id])throw new Error('STORY_ART_MISSING: '+s.id);
  const re=new RegExp(`(id="fm-${s.id}-stage"[^>]*>)([\\s\\S]*?)(<div class="fm-focus-ring")`);
  if(!re.test(html))throw new Error('STORY_STAGE_MISSING: '+s.id);
  html=html.replace(re,`$1<svg class="story-art" viewBox="0 0 880 740" role="img" aria-label="${s.semanticRationale}">${STORY_ART[s.id]}</svg>$3`);
  for(const step of STORY_STEPS[s.id]){
   const event=s.motionEvents.find(e=>e.id===step.event);if(!event)throw new Error('STORY_EVENT_MISSING: '+step.event);
   runtime.push({...step,selector:`#fm-${s.id}-stage ${step.selector}`,at:event.atSec+(step.delay??0),sequence:s.id,sourcePhrase:event.trigger.sourceSpan});
  }
 }
 const css=`<style>
 .fm-sequence [data-element-id="stage"]{background:none;border:0;padding:0;display:block;border-radius:0}
 .fm-sequence [data-element-id="stage"] .fm-focus-ring{display:none}
 .story-art{display:block;width:100%;height:100%;fill:none;stroke:var(--accent-gold);stroke-width:5;stroke-linecap:round;stroke-linejoin:round;overflow:hidden}
 .story-art .paper{fill:var(--text-primary);stroke:var(--accent-gold)}
 .story-art .skin{fill:var(--accent-gold);stroke:var(--navy-deep)}
 .story-art .hair{fill:var(--navy-raised);stroke:var(--accent-gold)}
 .story-art .muted-fill{fill:var(--text-muted);stroke:var(--navy-deep)}
 .story-art .device{fill:var(--navy-raised);stroke:var(--text-muted);stroke-width:7}
 .story-art .screen{fill:var(--navy-deep);stroke:var(--navy-raised)}
 .story-art .amber-fill{fill:var(--accent-amber);stroke:var(--accent-gold)}
 .story-art .dark-stroke{stroke:var(--navy-deep)}
 .story-art .story-future{opacity:0}
 .story-art .eyes,.story-art .mouth{stroke:var(--navy-deep);stroke-width:6}
 .fm-sequence .fm-text .fm-copy{text-align:center}
 </style>`;
 const js=`<script>(function(){const t=window.__timelines['news-video'];const steps=${JSON.stringify(runtime)};window.__day4StoryEvents=steps;for(const s of steps){if(!document.querySelector(s.selector))throw new Error('STORY_SELECTOR_MISSING: '+s.selector);t.to(s.selector,{...s.to,duration:s.duration??.38,ease:'power2.inOut'},s.at);}})();</script>`;
 return html.replace('</head>',css+'</head>').replace('</body>',js+'</body>');
}
