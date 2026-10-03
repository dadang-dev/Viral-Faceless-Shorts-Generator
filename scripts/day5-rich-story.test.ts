import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {day5RichStoryPlan,DAY5_RICH_LAYOUT,DAY5_RICH_STORY_OUT,extendDay5RichVisualThroughOutro} from './day5-rich-story-plan.js';
import {DAY5_STORY_ART,DAY5_STORY_STEPS,DAY5_RICH_STORY_CSS,decorateDay5RichStory} from './day5-rich-story-art.js';
import {day5Transitions} from './day5-transitions.js';
import {compileFinancePlan,type FinancePlan} from '../src/contracts/finance-motion.js';
import {extractApprovedVoiceOver,NumberHighlightFileSchema,resolveNumberHighlights} from '../src/contracts/content-contract.js';
import {assertFinanceHighlights} from '../src/contracts/finance-motion.js';
import {VISUAL_SAFE_FRAME} from '../src/contracts/visual-collision.js';
import {planOutroDwell} from '../src/contracts/production-duration.js';

const parent='output/benchmarks/day-5-v12-transitions';
const json=(name:string)=>JSON.parse(readFileSync(`${parent}/${name}`,'utf8'));
const base=json('data_visualizations.json') as FinancePlan;
const script=json('script.json'),transcript=json('transcript.json');
const plan=day5RichStoryPlan(base);
const resolved=compileFinancePlan(plan,script,transcript,extractApprovedVoiceOver(readFileSync('money-habits-script-v2.1-verified.md','utf8'),5));

describe('Day 5 story-led visual revision',()=>{
 it('keeps the five approved audio groups, numeric source data, highlights and transition boundaries',()=>{
  expect(resolved.sequences.map(s=>s.id)).toEqual(base.sequences.map(s=>s.id));
  expect(resolved.sequences.map(s=>s.sceneIds)).toEqual(base.sequences.map(s=>s.sceneIds));
  expect(plan.data).toEqual(base.data);
  const highlights=resolveNumberHighlights(NumberHighlightFileSchema.parse(json('number_highlights.json')),transcript);
  expect(()=>assertFinanceHighlights(resolved,highlights)).not.toThrow();
  expect(day5Transitions(resolved).map(c=>c.boundarySec)).toEqual([7.875,24.071,38.093,50.104]);
  expect(DAY5_RICH_STORY_OUT).toBe('output/benchmarks/day-5-v12-rich-story');
 });

 it('holds only the final illustration underneath the existing silent CTA dwell',()=>{
  const dwell=planOutroDwell(transcript,.2,3),held=extendDay5RichVisualThroughOutro(structuredClone(resolved),dwell.finalTargetSec);
  const ending=held.sequences.find(sequence=>sequence.id==='actually-look')!;
  expect(ending.endSec).toBe(dwell.finalTargetSec);
  expect(ending.motionEvents.map(event=>event.atSec)).toEqual(resolved.sequences.at(-1)!.motionEvents.map(event=>event.atSec));
  expect(dwell.narrationModified).toBe(false);
  expect(ending.motionEvents.at(-1)!.endSec).toBeLessThan(ending.endSec);
 });

 it('uses one large contained scene illustration per sequence, not repeated finance icon cards',()=>{
  for(const sequence of plan.sequences){
   const stage=sequence.elements.find(element=>element.id==='stage');
   expect(stage?.box).toEqual(DAY5_RICH_LAYOUT[sequence.id as keyof typeof DAY5_RICH_LAYOUT].stage);
   expect(DAY5_STORY_ART[sequence.id]).toContain('<path');
   expect(DAY5_STORY_ART[sequence.id]).not.toMatch(/<text|[$%]/);
   expect(stage!.box.x).toBeGreaterThanOrEqual(VISUAL_SAFE_FRAME.left);
   expect(stage!.box.x+stage!.box.w).toBeLessThanOrEqual(VISUAL_SAFE_FRAME.right);
   expect(stage!.box.y).toBeGreaterThanOrEqual(VISUAL_SAFE_FRAME.top);
   expect(stage!.box.y+stage!.box.h).toBeLessThanOrEqual(VISUAL_SAFE_FRAME.bottom);
  }
  expect(plan.sequences[1].elements.filter(element=>element.kind==='metric')).toHaveLength(4);
  expect(plan.sequences[1].elements.some(element=>element.id==='cloud')).toBe(false);
 });

 it('binds all semantic illustration changes to exact narration events and reveals future art on time',()=>{
  for(const sequence of resolved.sequences){
   const steps=DAY5_STORY_STEPS[sequence.id];
   expect(steps.length).toBeGreaterThanOrEqual(3);
   for(const step of steps)expect(sequence.motionEvents.some(event=>event.id===step.event)).toBe(true);
   const future=[...DAY5_STORY_ART[sequence.id].matchAll(/class="([^"]*story-future[^"]*)"/g)].map(match=>match[1].split(/\s+/)[0]);
   for(const className of future){
    const selectors=steps.filter(step=>step.selector.includes(`.${className}`));
    expect(selectors.length,`${sequence.id}.${className} reveal`).toBeGreaterThan(0);
   }
  }
  expect(plan.sequences.flatMap(sequence=>sequence.motionEvents).some(event=>event.trigger.sourceSpan==='converted to paid')).toBe(true);
  expect(plan.sequences.flatMap(sequence=>sequence.motionEvents).some(event=>event.trigger.sourceSpan==='used twice')).toBe(true);
  expect(JSON.stringify(DAY5_STORY_STEPS)).not.toMatch(/repeat|yoyo/);
 });

 it('adds only stationary background texture and retains source markup, voice/caption lanes and statement shutters',()=>{
  const sequences=resolved.sequences.map(sequence=>`<main class="fm-sequence" id="finance-${sequence.id}"><div class="fm-element fm-node" id="fm-${sequence.id}-stage"><div class="fm-focus-ring"></div></div></main>`).join('');
  const html=decorateDay5RichStory(`<head></head><body>${sequences}</body>`,resolved);
  expect(html).toContain('main class="fm-sequence"');
  expect(html).toContain('window.__day5StoryEvents');
  expect(html).toContain('aria-hidden="true"');
  expect(html).not.toMatch(/animation:|@keyframes/i);
  expect(DAY5_RICH_STORY_CSS).toContain('background-size:72px 72px');
  expect(DAY5_RICH_STORY_CSS).toContain('#finance-actually-look~.scene[data-layout="outro"] .out-cta-top{top:270px');
  expect(DAY5_RICH_STORY_CSS).toContain('#grain-overlay{display:none}');
  expect(DAY5_RICH_STORY_CSS).toContain('visibility:hidden!important');
 });
});
