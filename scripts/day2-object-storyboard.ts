import type {FinancePlan, ResolvedFinancePlan} from '../src/contracts/finance-motion.js';

// Approved Day 2 editorial staging, not a new renderer or shared template default.
export const OBJECT_OUTPUT = 'output/benchmarks/day-2-v12-object-led';
const box=(x:number,y:number,w:number,h:number)=>({x,y,w,h});
export function objectStoryboard(input:FinancePlan):FinancePlan {
  const p=structuredClone(input), hook=p.sequences[0], choices=p.sequences[1], rise=p.sequences[2];
  const element=(s:typeof hook,id:string)=>s.elements.find(e=>e.id===id)!;
  const event=(s:typeof hook,id:string)=>s.motionEvents.find(e=>e.id===id)!;
  element(hook,'wallet').box=box(310,770,460,290);
  event(hook,'raise-focus').pose={box:box(310,800,460,290)};
  element(hook,'months').box=box(210,730,660,300);
  element(hook,'creep').box=box(110,1130,860,160);
  const home=element(choices,'home'); home.box=box(130,300,820,350);
  event(choices,'home-choice').pose={box:home.box};
  const cost=element(choices,'apartment-cost'); cost.box=box(130,720,820,220);
  cost.copy={source:p.source,sceneId:'scene-4',sourceSpan:'more',text:'MORE'};
  event(choices,'metric-secondary').pose={box:box(570,340,420,210),fontSize:40,opacity:.8,route:'horizontal-first'};
  event(choices,'home-settle').pose={box:box(90,280,440,310),fontSize:40,opacity:.85,route:'horizontal-first'};
  for(const [id,x] of [['car-old',90],['car-new',570]] as const)element(choices,id).box=box(x,660,420,280);
  for(const [id,x] of [['appetizer',90],['dessert',570]] as const)element(choices,id).box=box(x,1010,420,300);
  choices.motionEvents=choices.motionEvents.filter(e=>!e.id.endsWith('-pressure'));
  const add=(id:string,scene:number,phrase:string,action:'hide'|'focus',targets:string[],pose?:any)=>choices.motionEvents.push({id,trigger:{source:p.source,sceneId:`scene-${scene}`,sourceSpan:phrase},action,targets,relation:'same-object',transition:'state-update',rationale:'Retain the approved objects while changing the accumulated choice state, with no invented financial magnitude.',...(pose?{pose}:{})});
  add('old-car-clear',6,'ordering','hide',['car-old']);
  add('cost-clear',7,'Each choice feels small and reasonable','hide',['apartment-cost']);
  // Vertical lanes remain disjoint during these moves; no diagonal connectors.
  add('home-small',7,'Each choice feels small and reasonable','focus',['home'],{box:box(90,280,440,310),opacity:.85,fontSize:40});
  add('car-small',7,'Each choice feels small and reasonable','focus',['car-new'],{box:box(570,650,420,280),opacity:.9});
  add('home-stack',8,'stack them up','focus',['home'],{box:box(90,280,440,310),opacity:1,fontSize:40});
  add('car-stack',8,'stack them up','focus',['car-new'],{box:box(570,310,420,280),opacity:1});
  add('appetizer-stack',8,'stack them up','focus',['appetizer'],{box:box(90,740,420,300),opacity:1});
  add('dessert-stack',8,'stack them up','focus',['dessert'],{box:box(570,740,420,300),opacity:1});
  add('choices-clear',8,'and your spending','hide',['home','car-new','appetizer','dessert']);
  // Keep scene 8 in the same sequence: accumulation must not disappear at its key phrase.
  choices.sceneIds.push('scene-8');
  choices.semanticRationale='Distinct apartment, car and meal objects remain through stack them up, then yield cleanly to qualitative spending/income tracks in the same sequence. No arithmetic, invented schedule or financial scale.';
  choices.elements.push(...rise.elements.filter(e=>e.id!=='stack'));
  for(const id of ['spending','income']) {
    const e=element(choices,id); delete e.icon; e.box=box(110,id==='spending'?600:960,520,220);
  }
  const r=rise.motionEvents.filter(e=>!['clear-stack','spending-rise','income-rise'].includes(e.id));
  // A comparison entrance must not temporarily shift the common left baseline.
  const incomeEntrance=r.find(e=>e.id==='income-enter')!;
  incomeEntrance.relation='progression';incomeEntrance.transition='directional-progression';
  // Both endpoints travel together after income is named; there is no implied early numerical value.
  for(const id of ['spending','income']) r.push({...event(rise,id+'-rise'),trigger:{source:p.source,sceneId:'scene-8',sourceSpan:'your income'},pose:{box:box(110,id==='spending'?600:960,720,220)}});
  event(rise,'spending-faster').pose={box:box(110,600,860,220)};
  choices.motionEvents.push(...r);
  p.sequences.splice(2,1);
  return p;
}

const artwork:Record<string,string>={
  home:'<path d="M14 46L50 13l36 33M23 40v47h54V40"/><path class="object-build" d="M42 87V60h16v27M29 49h8v10h-8zM63 49h8v10h-8z"/>',
  'car-old':'<path d="M12 59l13-24h45l18 24v20H12zM25 59h50M33 40h29"/><circle cx="29" cy="78" r="9"/><circle cx="72" cy="78" r="9"/>',
  'car-new':'<path d="M9 61l15-13 12-18h32l14 24 9 7v17H9zM30 49h45M48 32v17"/><circle cx="28" cy="77" r="10"/><circle cx="74" cy="77" r="10"/>',
  appetizer:'<ellipse cx="50" cy="53" rx="40" ry="32"/><ellipse cx="50" cy="53" rx="30" ry="23"/><path d="M34 57q-9-18 5-20 13 3 10 14M49 59q4-23 17-16 9 13-7 20M32 62q14 11 24 1"/>',
  dessert:'<ellipse cx="50" cy="77" rx="39" ry="13"/><path d="M24 67V44l43-22 10 22v23zM24 44h53M24 56h53M50 31v-8"/><circle cx="50" cy="19" r="5"/>',
  wallet:'<path class="wallet-lid" d="M17 36V24l59-10v22"/><rect x="13" y="34" width="74" height="51" rx="10"/><path d="M64 48h23v22H64zM70 59h2"/>',
};

export function decorateObjectStoryboard(html:string,plan:ResolvedFinancePlan):string {
  for(const s of plan.sequences)for(const e of s.elements){
    const key=e.id==='wallet'?'wallet':e.id;
    if(!artwork[key])continue;
    const id=`fm-${s.id}-${e.id}`;
    const re=new RegExp(`(id="${id}"[^>]*>)(<svg class="fm-icon"[\\s\\S]*?</svg>)`);
    if(!re.test(html))throw new Error(`OBJECT_ARTWORK_TARGET_MISSING: ${id}`);
    html=html.replace(re,`$1<svg class="fm-icon object-art" viewBox="0 0 100 100" aria-hidden="true">${artwork[key]}</svg>`);
  }
  const css=`
  #finance-choice-accumulation .fm-node:not([data-element-id="spending"]):not([data-element-id="income"]){background:transparent;border:0;flex-direction:column;gap:12px;padding:24px}
  #finance-choice-accumulation .object-art{width:100%;height:calc(100% - 114px);min-height:90px;flex:1 1 auto;stroke-width:2.2}
  #finance-choice-accumulation .fm-copy{text-align:center;flex:0 0 auto;line-height:1.18;font-size:40px}
  /* Color variety stays inside the locked Money Habits palette: gold = retained,
     amber = active/new, muted beige = receding/secondary. */
  #fm-choice-accumulation-home .object-art{stroke:var(--accent-amber);filter:drop-shadow(0 0 8px rgba(242,193,78,.16))}
  #fm-choice-accumulation-car-old .object-art{stroke:var(--text-muted);opacity:.58}
  #fm-choice-accumulation-car-old .fm-copy{color:var(--text-muted)}
  #fm-choice-accumulation-car-new .object-art{stroke:var(--accent-amber);filter:drop-shadow(0 0 8px rgba(242,193,78,.14))}
  #fm-choice-accumulation-appetizer .object-art{stroke:var(--accent-gold)}
  #fm-choice-accumulation-dessert .object-art{stroke:var(--accent-amber)}
  #fm-choice-accumulation-apartment-cost .fm-number{color:var(--accent-amber)}
  #finance-choice-accumulation .fm-focus-ring,#finance-raise-hook .fm-focus-ring{display:none}
  #fm-raise-hook-wallet{border:0;background:transparent;padding:24px}
  #fm-raise-hook-wallet .object-art{width:100%;height:100%;flex:1;stroke-width:2.2}
  #fm-raise-hook-months{border:2px solid var(--accent-gold);border-radius:28px;background:var(--navy-surface)}
  #fm-raise-hook-months>.fm-icon{display:none}
  #fm-raise-hook-months .fm-metric-step{top:90px}
  #fm-raise-hook-months::before{content:"";position:absolute;top:38px;left:0;width:100%;border-top:2px solid var(--accent-gold)}
  #fm-raise-hook-months::after{content:"";position:absolute;top:10px;left:100px;width:12px;height:40px;border-radius:6px;background:var(--accent-gold);box-shadow:440px 0 0 var(--accent-gold)}
  #fm-raise-hook-months .calendar-leaf{position:absolute;z-index:2;left:20px;right:20px;top:56px;bottom:18px;background:var(--navy-raised);border-bottom:2px solid var(--accent-gold);border-radius:0 0 20px 20px;transform-origin:center top}
  #fm-raise-hook-months .fm-number{font-size:112px}
  #fm-raise-hook-months .fm-number,#fm-choice-accumulation-apartment-cost .fm-number{color:var(--accent-amber);text-shadow:0 0 16px rgba(242,193,78,.24),0 2px 0 rgba(215,169,40,.28)}
  #fm-choice-accumulation-apartment-cost .fm-number{font-size:106px}
  #fm-choice-accumulation-apartment-cost>.fm-copy{bottom:10px;font-size:40px}
  #fm-choice-accumulation-spending,#fm-choice-accumulation-income{border:0;border-radius:12px;background:var(--navy-raised);justify-content:flex-start;padding:24px 32px;overflow:hidden}
  #fm-choice-accumulation-spending{border-bottom:60px solid var(--accent-gold);background:linear-gradient(180deg,var(--navy-raised),var(--navy-surface))}
  #fm-choice-accumulation-income{border-bottom:60px solid var(--text-muted)}
  #fm-choice-accumulation-spending::after,#fm-choice-accumulation-income::after{content:"";position:absolute;right:18px;bottom:-39px;width:18px;height:18px;border-radius:50%;background:var(--accent-amber);box-shadow:0 0 0 5px rgba(242,193,78,.12)}
  #fm-choice-accumulation-income::after{background:var(--text-primary);box-shadow:0 0 0 5px rgba(245,241,232,.1)}
  #finance-choice-accumulation::after{content:"";position:absolute;left:76px;right:76px;top:1260px;height:2px;background:linear-gradient(90deg,transparent,var(--accent-gold),transparent);opacity:.18}
  /* A single causal trace replaces the old icon-grid feeling. It lives in the
     gutters between objects, so it never crosses the approved source labels. */
  #finance-choice-accumulation .lifestyle-chain{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;overflow:visible}
  #finance-choice-accumulation .chain-trace,#finance-choice-accumulation .chain-stack-rail{fill:none;stroke:var(--accent-gold);stroke-width:7;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 7px rgba(215,169,40,.22))}
  #finance-choice-accumulation .chain-node{fill:var(--navy-deep);stroke:var(--accent-amber);stroke-width:5;opacity:0;transform-box:fill-box;transform-origin:center}
  #finance-choice-accumulation .chain-stack-rail{opacity:0;stroke:var(--accent-amber);stroke-width:6}
  #finance-choice-question::before{content:"";position:absolute;left:539px;top:790px;height:330px;width:2px;background:linear-gradient(var(--accent-gold),transparent);opacity:.42}
  #fm-choice-question-wanted-icon .fm-icon{stroke:var(--accent-gold)}
  #fm-choice-question-could-icon .fm-icon{stroke:var(--accent-amber)}
  #finance-choice-question [data-element-id="wanted-copy"] .fm-copy,#finance-choice-question [data-element-id="could-copy"] .fm-copy{transition:color .12s ease}
  #finance-choice-question .fm-text .fm-copy{text-align:center}
  #finance-choice-question .fm-node:has(>.fm-icon):not(:has(>.fm-copy)){border:0;background:transparent}
  #finance-choice-question .fm-node:has(>.fm-icon):not(:has(>.fm-copy)) .fm-icon{width:170px;height:170px;flex-basis:170px;stroke-width:2.5}
  `;
  const get=(sid:string,eid:string)=>plan.sequences.find(s=>s.id===sid)!.motionEvents.find(e=>e.id===eid)!.atSec;
  const anchors={
    raise:get('raise-hook','raise-focus'),
    months:get('raise-hook','months-reveal'),
    home:get('choice-accumulation','home-choice'),
    cost:get('choice-accumulation','apartment-cost'),
    costSettle:get('choice-accumulation','metric-secondary'),
    newLease:get('choice-accumulation','new-lease'),
    dessert:get('choice-accumulation','dessert'),
    stack:get('choice-accumulation','home-stack'),
    spending:get('choice-accumulation','spending-enter'),
    faster:get('choice-accumulation','spending-faster'),
    wanted:get('choice-question','wanted'),
    could:get('choice-question','could')
  };
  // The choices are one causal accumulation, not four disconnected icons.
  // This trace uses only source-supported relationships: apartment -> more -> lease -> AND meal fork.
  const chainSvg=`<svg class="lifestyle-chain" viewBox="0 0 1080 1920" preserveAspectRatio="none" aria-hidden="true">
    <g class="chain-pre-stack">
      <path id="day2-chain-home-cost" class="chain-trace" d="M530 435 H570" pathLength="50"/>
      <path id="day2-chain-cost-car" class="chain-trace" d="M780 550 V650" pathLength="100"/>
      <path id="day2-chain-car-appetizer" class="chain-trace" d="M780 930 V970 H300 V1010" pathLength="680"/>
      <path id="day2-chain-car-dessert" class="chain-trace" d="M780 970 V1010" pathLength="40"/>
      <circle id="day2-chain-node-home-edge" class="chain-node" cx="530" cy="435" r="10"/>
      <circle id="day2-chain-node-cost-edge" class="chain-node" cx="570" cy="435" r="10"/>
      <circle id="day2-chain-node-cost" class="chain-node" cx="780" cy="550" r="10"/>
      <circle id="day2-chain-node-car-entry" class="chain-node" cx="780" cy="650" r="10"/>
      <circle id="day2-chain-node-car" class="chain-node" cx="780" cy="930" r="10"/>
      <circle id="day2-chain-node-fork" class="chain-node" cx="780" cy="970" r="10"/>
      <circle id="day2-chain-node-appetizer" class="chain-node" cx="300" cy="1010" r="10"/>
      <circle id="day2-chain-node-dessert" class="chain-node" cx="780" cy="1010" r="10"/>
    </g>
    <path id="day2-chain-stack-rail" class="chain-stack-rail" d="M530 435 H570 M550 435 V880 M530 880 H570" pathLength="490"/>
  </svg>`;
  // Internal artwork movements stay inside validated outer boxes and use the same seekable timeline.
  const js=`<script>(function(){const t=window.__timelines["news-video"];const a=${JSON.stringify(anchors)};
  t.fromTo('#fm-raise-hook-wallet .wallet-lid',{rotation:0},{rotation:-10,transformOrigin:'17px 36px',duration:.36},a.raise);
  t.fromTo('#fm-raise-hook-months .fm-metric-step',{rotationX:-65,opacity:0},{rotationX:0,opacity:1,transformOrigin:'center top',duration:.36},a.months);
  t.fromTo('#fm-raise-hook-months .calendar-leaf',{rotationX:0,opacity:1},{rotationX:-85,opacity:0,duration:.36},a.months);
  t.to('#fm-raise-hook-months',{scale:1.025,duration:.16,yoyo:true,repeat:1,transformOrigin:'center center'},a.months+.34);
  t.fromTo('#fm-choice-accumulation-home .object-build',{opacity:0},{opacity:1,duration:.36},a.home);
  t.to('#fm-choice-accumulation-apartment-cost .fm-number',{fontSize:50,duration:.18},a.costSettle);
  // A restrained stagger makes the existing retained objects read as one accumulated state.
  ['home','car-new','appetizer','dessert'].forEach((id,i)=>t.to('#fm-choice-accumulation-'+id,{scale:.965,duration:.14,yoyo:true,repeat:1,transformOrigin:'center center'},a.stack+i*.12));
  // The endpoint dots make the qualitative tracks feel like stateful lanes, not static cards.
  t.to('#fm-choice-accumulation-spending',{scale:1.012,duration:.12,yoyo:true,repeat:1,transformOrigin:'left center'},a.spending+.45);
  t.to('#fm-choice-accumulation-spending',{scale:1.018,duration:.12,yoyo:true,repeat:1,transformOrigin:'left center'},a.faster+.2);
  // Draw the causal chain as each spoken choice arrives; the trace clears before the compact stack state.
  const chainPaths=[['#day2-chain-home-cost',50,a.cost],['#day2-chain-cost-car',100,a.newLease],['#day2-chain-car-appetizer',680,a.dessert],['#day2-chain-car-dessert',40,a.dessert+.08]];
  chainPaths.forEach(([sel,len,at])=>{t.set(sel,{strokeDasharray:len,strokeDashoffset:len,opacity:0},0);t.to(sel,{strokeDashoffset:0,opacity:1,duration:.38,ease:'power1.out'},at);});
  ['home-edge','cost-edge','cost','car-entry','car'].forEach((name,i)=>t.to('#day2-chain-node-'+name,{opacity:1,scale:1,duration:.16,transformOrigin:'center center'},[a.cost,a.cost,a.cost,a.newLease,a.newLease][i]));
  t.to('#day2-chain-node-fork',{opacity:1,scale:1,duration:.16,transformOrigin:'center center'},a.dessert);
  t.to('#day2-chain-node-appetizer',{opacity:1,scale:1,duration:.16,transformOrigin:'center center'},a.dessert);
  t.to('#day2-chain-node-dessert',{opacity:1,scale:1,duration:.16,transformOrigin:'center center'},a.dessert+.08);
  t.to('.chain-pre-stack',{opacity:0,duration:.16},a.stack-.12);
  t.fromTo('#day2-chain-stack-rail',{opacity:0,strokeDashoffset:490},{opacity:.74,strokeDashoffset:0,duration:.42,ease:'power1.out'},a.stack);
  t.to('#day2-chain-stack-rail',{opacity:0,duration:.14},a.spending-.08);
  // Keep branch emphasis synchronized to the exact spoken alternatives.
  t.to('#fm-choice-question-wanted-icon',{filter:'drop-shadow(0 0 16px rgba(242,193,78,.35))',duration:.14,yoyo:true,repeat:1},a.wanted);
  t.to('#fm-choice-question-wanted-copy .fm-copy',{color:'var(--accent-amber)',duration:.12},a.wanted);
  t.to('#fm-choice-question-could-icon',{filter:'drop-shadow(0 0 16px rgba(242,193,78,.35))',duration:.14,yoyo:true,repeat:1},a.could);
  t.to('#fm-choice-question-could-copy .fm-copy',{color:'var(--accent-amber)',duration:.12},a.could);
  })();</script>`;
  html=html.replace(/(<div[^>]*id="finance-choice-accumulation"[^>]*>)/,`$1${chainSvg}`);
  html=html.replace(/(id="fm-raise-hook-months"[^>]*>)/,'$1<div class="calendar-leaf" aria-hidden="true"></div>');
  return html.replace('</head>',`<style id="day2-object-storyboard">${css}</style></head>`).replace('</body>',`${js}</body>`);
}
