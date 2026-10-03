import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {illustratedPlan,ILLUSTRATED_OUT,STORY_LAYOUT} from './day4-illustrated-plan.js';
import {STORY_ART,STORY_STEPS} from './day4-illustrated-art.js';
import {compileFinancePlan} from '../src/contracts/finance-motion.js';
import {extractApprovedVoiceOver} from '../src/contracts/content-contract.js';
import {resolveHeroCaptions,editorialCaptionWords} from '../src/contracts/hero-captions.js';
const read=(f:string)=>JSON.parse(readFileSync(`${ILLUSTRATED_OUT}/${f}`,'utf8'));
describe('Day 4 image-led storytelling',()=>{
 const p=illustratedPlan(),t=read('transcript.json');
 const r=compileFinancePlan(p,read('script.json'),t,extractApprovedVoiceOver(readFileSync('money-habits-script-v2.1-verified.md','utf8'),4));
 it('retains six visual scenes and immutable narration/timestamps',()=>{
  expect(r.sequences).toHaveLength(6);expect(p.data).toEqual([]);
  for(const f of ['voice.mp3','transcript.json'])expect(readFileSync(`${ILLUSTRATED_OUT}/${f}`).equals(readFileSync(`output/benchmarks/day-4-v12-six-scene/${f}`))).toBe(true);
 });
 it('uses large illustrated stages rather than sentence cards',()=>{
  for(const s of p.sequences){expect(s.elements.find(e=>e.id==='stage')!.box).toEqual(STORY_LAYOUT.stage);expect(STORY_ART[s.id]).toContain('<path');expect(STORY_ART[s.id]).not.toMatch(/<text|\$|%/);}
  expect(p.sequences[1].elements.filter(e=>e.copy)).toHaveLength(0);
  expect(p.sequences[3].elements.filter(e=>e.copy)).toHaveLength(0);
 });
 it('binds all illustrated changes to source events and no idle loops',()=>{
  for(const s of r.sequences)for(const step of STORY_STEPS[s.id])expect(s.motionEvents.some(e=>e.id===step.event)).toBe(true);
  expect(JSON.stringify(STORY_STEPS)).not.toMatch(/repeat|yoyo/);
  expect(STORY_STEPS['bill-story'].some(s=>s.event==='short'&&s.selector==='.relief-halo'&&s.to.opacity===0)).toBe(true);
  expect(STORY_STEPS['checkout-story'].some(s=>s.event==='pass'&&s.selector==='.purchase-hand'&&s.to.opacity===.25)).toBe(true);
 });
 it('keeps every word in accessible captions and preserves qualifiers',()=>{
  const c=editorialCaptionWords(t,resolveHeroCaptions([],r,t));
  expect(c.visible.length).toBe(t.scenes.flatMap((s:any)=>s.words).length);
  expect(p.sequences.flatMap(s=>s.elements).filter(e=>e.copy).map(e=>e.copy!.sourceSpan)).toContain('what am I feeling right now');
 });
});
