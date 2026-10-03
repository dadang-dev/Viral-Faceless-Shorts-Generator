import {describe,it,expect} from 'vitest';
import type {ResolvedFinancePlan} from '../src/contracts/finance-motion.js';
import {VISUAL_SAFE_FRAME} from '../src/contracts/visual-collision.js';
import {DAY5_TRANSITIONS_OUT,DAY5_TRANSITION_STYLE,day5Transitions,decorateDay5Transitions} from './day5-transitions.js';

const plan={day:5,sequences:[
 {id:'guess-statement',startSec:0},
 {id:'range-comparison',startSec:7.875},
 {id:'charge-attention',startSec:24.071},
 {id:'monthly-review',startSec:38.093},
 {id:'actually-look',startSec:50.104},
]} as unknown as ResolvedFinancePlan;

describe('Day 5 requested statement-scan transitions',()=>{
 it('binds one transition to each existing visual boundary without mutating the plan',()=>{
  const before=JSON.stringify(plan),cuts=day5Transitions(plan);
  expect(cuts).toHaveLength(4);
  cuts.forEach((cut,index)=>{
   expect(cut.boundarySec).toBe(plan.sequences[index+1].startSec);
   expect(cut.startSec).toBeCloseTo(cut.boundarySec-DAY5_TRANSITION_STYLE.leadSec);
   expect(cut.endSec-cut.startSec).toBeCloseTo(.64);
  });
  expect(JSON.stringify(plan)).toBe(before);
 });

 it('adds only a clipped, aria-hidden presentation layer and preserves source markup',()=>{
  const html=decorateDay5Transitions('<head></head><body><main id="existing">UNCHANGED</main></body>',plan);
  expect(html).toContain('<main id="existing">UNCHANGED</main>');
  expect(html).toContain(`left:${VISUAL_SAFE_FRAME.left}px`);
  expect(html).toContain(`top:${VISUAL_SAFE_FRAME.top}px`);
  expect(html).toContain(`width:${VISUAL_SAFE_FRAME.right-VISUAL_SAFE_FRAME.left}px`);
  expect(html).toContain(`height:${VISUAL_SAFE_FRAME.bottom-VISUAL_SAFE_FRAME.top}px`);
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain('window.__day5Transitions');
  expect(html).not.toMatch(/audio|voice|subtitle|caption/i);
  expect(DAY5_TRANSITIONS_OUT).toBe('output/benchmarks/day-5-v12-transitions');
 });

 it('rejects another Day, an unexpected sequence count, or unordered boundaries',()=>{
  expect(()=>day5Transitions({...plan,day:4})).toThrow('DAY5_TRANSITION_SCOPE');
  expect(()=>day5Transitions({...plan,sequences:plan.sequences.slice(1)})).toThrow('DAY5_TRANSITION_SCOPE');
  const unordered={...plan,sequences:[...plan.sequences.slice(0,2),{...plan.sequences[2],startSec:1},...plan.sequences.slice(3)]} as unknown as ResolvedFinancePlan;
  expect(()=>day5Transitions(unordered)).toThrow('DAY5_TRANSITION_BOUNDARY');
 });
});
