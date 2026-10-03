import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {compileFinancePlan,assessFinanceDataViz} from './finance-motion.js';
import {APPROVED_SCRIPT_FILE,extractApprovedVoiceOver,resolveNumberHighlights} from './content-contract.js';
import {resolveHeroCaptions} from './hero-captions.js';
import {assessEditorial} from './editorial-validation.js';

const root='output/benchmarks/day-2-v12-object-led/';
const read=(f:string)=>JSON.parse(readFileSync(root+f,'utf8'));
const approved=extractApprovedVoiceOver(readFileSync(APPROVED_SCRIPT_FILE,'utf8'),2);
const fresh=()=>compileFinancePlan(read('data_visualizations.json'),read('script.json'),read('transcript.json'),approved);
describe('approved Day 2 object-led storyboard',()=>{
  it('keeps only sourced time and incremental cost, no numerical comparison data',()=>{
    const input=read('data_visualizations.json');
    expect(input.data.map((d:any)=>d.value)).toEqual([6,200]);
    expect(assessFinanceDataViz(input,read('script.json'),read('transcript.json'),approved).status).toBe('PASS');
    const choices=fresh().sequences.find(s=>s.id==='choice-accumulation')!;
    expect(choices.elements.find(e=>e.id==='apartment-cost')?.copy?.text).toBe('MORE');
    for(const id of ['spending','income'])expect(choices.elements.find(e=>e.id===id)?.datumId).toBeUndefined();
  });
  it('retains the same choices across accumulation narration, hiding the replaced car',()=>{
    const choices=fresh().sequences.find(s=>s.id==='choice-accumulation')!;
    expect(choices.sceneIds).toContain('scene-8');
    const stack=choices.motionEvents.filter(e=>e.trigger.sourceSpan==='stack them up');
    expect(stack.flatMap(e=>e.targets).sort()).toEqual(['appetizer','car-new','dessert','home']);
    const oldHide=choices.motionEvents.find(e=>e.id==='old-car-clear')!;
    expect(oldHide.action).toBe('hide');expect(oldHide.atSec).toBeLessThan(stack[0].atSec);
    expect(choices.elements.some(e=>e.connectsTo)).toBe(false);
  });
  it('uses a collision-safe route for both sides of retained price handoff',()=>{
    const choices=fresh().sequences.find(s=>s.id==='choice-accumulation')!;
    for(const id of ['metric-secondary','home-settle'])expect(choices.motionEvents.find(e=>e.id===id)?.pose?.route).toBe('horizontal-first');
    const invalid=read('data_visualizations.json');
    for(const event of invalid.sequences.find((s:any)=>s.id==='choice-accumulation').motionEvents)if(['metric-secondary','home-settle'].includes(event.id))delete event.pose.route;
    expect(()=>compileFinancePlan(invalid,read('script.json'),read('transcript.json'),approved)).toThrow(/VISUAL_COLLISION/);
  });
  it('moves qualitative endpoints together then advances spending only at faster',()=>{
    const choices=fresh().sequences.find(s=>s.id==='choice-accumulation')!;
    const spend=choices.motionEvents.find(e=>e.id==='spending-rise')!,income=choices.motionEvents.find(e=>e.id==='income-rise')!,faster=choices.motionEvents.find(e=>e.id==='spending-faster')!;
    expect(spend.atSec).toBe(income.atSec);expect(spend.pose?.box?.w).toBe(income.pose?.box?.w);
    expect(choices.motionEvents.find(e=>e.id==='income-enter')?.transition).toBe('directional-progression');
    expect(faster.atSec).toBeGreaterThan(income.atSec);expect(faster.pose!.box!.w).toBeGreaterThan(income.pose!.box!.w);
  });
  it('preserves exact caption coverage and transcript-resolved emphasis',()=>{
    const p=fresh(),t=read('transcript.json'),s=read('script.json');
    const captions=resolveHeroCaptions(read('hero-captions.json'),p,t);
    expect(assessEditorial(p,t,captions,s).status).toBe('PASS');
    expect(resolveNumberHighlights(read('number_highlights.json'),t)).toHaveLength(2);
  });
});
