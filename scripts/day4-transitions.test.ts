import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {day4Transitions,decorateDay4Transitions,TRANSITIONS_OUT,TRANSITION_STYLE} from './day4-transitions.js';
import {ILLUSTRATED_OUT} from './day4-illustrated-plan.js';
import {VISUAL_SAFE_FRAME} from '../src/contracts/visual-collision.js';
const plan=JSON.parse(readFileSync(`${ILLUSTRATED_OUT}/resolved-finance-plan.json`,'utf8'));
describe('Day 4 requested transition layer',()=>{
 it('binds exactly five transitions to existing visual boundaries, without retiming the story',()=>{
  const before=JSON.stringify(plan),cuts=day4Transitions(plan);
  expect(cuts).toHaveLength(plan.sequences.length-1);
  cuts.forEach((c,i)=>{expect(c.boundarySec).toBe(plan.sequences[i+1].startSec);expect(c.startSec).toBeCloseTo(c.boundarySec-TRANSITION_STYLE.leadSec);expect(c.endSec-c.startSec).toBeCloseTo(.64);});
  expect(JSON.stringify(plan)).toBe(before);
 });
 it('isolates presentation above the caption lane and keeps semantic HTML intact',()=>{
  const html=decorateDay4Transitions('<head></head><body><div id="semantic-original">UNCHANGED</div></body>',plan);
  expect(html).toContain('<div id="semantic-original">UNCHANGED</div>');
  expect(html).toContain(`height:${VISUAL_SAFE_FRAME.bottom-VISUAL_SAFE_FRAME.top}px`);
  expect(html).toContain('overflow:hidden');expect(html).toContain('aria-hidden="true"');
  expect(html).not.toMatch(/repeat:|yoyo:|filter:blur/);
  expect(TRANSITIONS_OUT).not.toBe(ILLUSTRATED_OUT);
 });
 it('refuses other days or unreviewed scene counts',()=>{
  expect(()=>day4Transitions({...plan,day:5})).toThrow('DAY4_TRANSITION_SCOPE');
  expect(()=>day4Transitions({...plan,sequences:plan.sequences.slice(1)})).toThrow('DAY4_TRANSITION_SCOPE');
 });
});
