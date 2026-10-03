import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {APPROVED_SCRIPT_FILE,extractApprovedVoiceOver} from '../src/contracts/content-contract.js';
import {compileFinancePlan} from '../src/contracts/finance-motion.js';
import {DAY7_RICH_LAYOUT,day7RichStoryPlan,extendDay7RichVisualThroughOutro} from './day7-rich-story-plan.js';
import {DAY7_STORY_ART,DAY7_STORY_STEPS} from './day7-rich-story-art.js';

const parent='output/benchmarks/day-7-v12-differentactually';
const json=(name:string)=>JSON.parse(readFileSync(`${parent}/${name}`,'utf8'));
const plan=day7RichStoryPlan(json('data_visualizations.json'));
const resolved=compileFinancePlan(plan,json('script.json'),json('transcript.json'),extractApprovedVoiceOver(readFileSync(APPROVED_SCRIPT_FILE,'utf8'),7));

describe('Day 7 rich story preserves the source-led choice',()=>{
 it('keeps three existing semantic sequences and every approved caption label',()=>{
  expect(plan.sequences.map(sequence=>sequence.id)).toEqual(['five-category-recap','honest-question-recap','single-choice']);
  expect(plan.sequences[0].elements.filter(element=>element.kind==='text').map(element=>element.id)).toEqual(['week','subscription','lifestyle-label','math-label','emotion-label','saving-label']);
  expect(plan.sequences[2].elements.filter(element=>element.kind==='text').map(element=>element.id)).toEqual(['one','clearly']);
 });
 it('places all illustration stages within the shared safe frame',()=>{
  for(const sequence of plan.sequences){
   const stage=sequence.elements.find(element=>element.id==='stage')!;
   expect(stage.box).toEqual(DAY7_RICH_LAYOUT[sequence.id as keyof typeof DAY7_RICH_LAYOUT].stage);
   expect(stage.box.x).toBeGreaterThanOrEqual(70);
   expect(stage.box.y).toBeGreaterThanOrEqual(240);
   expect(stage.box.x+stage.box.w).toBeLessThanOrEqual(1010);
   expect(stage.box.y+stage.box.h).toBeLessThanOrEqual(1340);
  }
 });
 it('anchors every visual action to a resolved WordBoundary event',()=>{
  for(const sequence of resolved.sequences)for(const step of DAY7_STORY_STEPS[sequence.id]){
   const event=sequence.motionEvents.find(item=>item.id===step.event);
   expect(event?.atSec).toEqual(expect.any(Number));
   expect(event?.trigger.source).toBe(APPROVED_SCRIPT_FILE);
  }
 });
 it('shows all five choices without highlighting a specific habit for the viewer',()=>{
  const art=DAY7_STORY_ART['single-choice'];
  expect((art.match(/data-story-part="choice-/g)??[])).toHaveLength(5);
  expect(art).toContain('data-story-part="blank-slot"');
  expect(DAY7_STORY_STEPS['single-choice'].filter(step=>step.event==='pick').map(step=>step.selector)).toEqual(['.blank-slot']);
  expect(DAY7_STORY_STEPS['single-choice'].some(step=>step.selector.startsWith('.choice-'))).toBe(false);
 });
 it('keeps new illustration copy-free and the neutral board through the final CTA hold',()=>{
  for(const art of Object.values(DAY7_STORY_ART))expect(art).not.toMatch(/<text\b|\$\d|\b\d+%/i);
  expect(plan.sequences[2].motionEvents.find(item=>item.id==='outro-clear')?.targets).not.toContain('stage');
  expect(DAY7_STORY_STEPS['single-choice'].find(step=>step.event==='outro-clear')?.to).toMatchObject({scale:.8,y:75});
  const ending=extendDay7RichVisualThroughOutro(structuredClone(resolved),60.8).sequences.at(-1)!;
  expect(ending.endSec).toBe(60.8);
 });
});
