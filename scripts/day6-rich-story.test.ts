import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {day6RichStoryPlan,DAY6_RICH_LAYOUT,DAY6_RICH_STORY_OUT,DAY6_RICH_CHARACTER_OUT,DAY6_RICH_VISUAL_PLAN,extendDay6RichVisualThroughOutro} from './day6-rich-story-plan.js';
import {DAY6_CHARACTER_ARTICULATION,DAY6_STORY_ART,DAY6_STORY_STEPS,DAY6_RICH_STORY_CSS,decorateDay6RichStory} from './day6-rich-story-art.js';
import {assessMotionSemantics,DOMINANT_FOREGROUND_HANDOFF,compileFinancePlan,type FinancePlan} from '../src/contracts/finance-motion.js';
import {assertFinanceHighlights} from '../src/contracts/finance-motion.js';
import {extractApprovedVoiceOver,NumberHighlightFileSchema,resolveNumberHighlights} from '../src/contracts/content-contract.js';
import {VISUAL_SAFE_FRAME} from '../src/contracts/visual-collision.js';
import {VisualPlanSchema} from '../src/planning/visual-variety.js';
import {planOutroDwell} from '../src/contracts/production-duration.js';

const parent='output/benchmarks/day-6-v12-differentactually';
const json=(name:string)=>JSON.parse(readFileSync(parent+'/'+name,'utf8'));
const base=json('data_visualizations.json') as FinancePlan;
const script=json('script.json'),transcript=json('transcript.json');
const approved=extractApprovedVoiceOver(readFileSync('money-habits-script-v2.1-verified.md','utf8'),6);
const plan=day6RichStoryPlan(base);
const resolved=compileFinancePlan(plan,script,transcript,approved);

describe('Day 6 rich-story visual update',()=>{
 it('preserves the four source groups, all finance data, audio narration and exact weekly metric',()=>{
  expect(resolved.sequences.map(sequence=>sequence.id)).toEqual(base.sequences.map(sequence=>sequence.id));
  expect(resolved.sequences.map(sequence=>sequence.sceneIds)).toEqual(base.sequences.map(sequence=>sequence.sceneIds));
  expect(plan.data).toEqual(base.data);
  expect(plan.data).toHaveLength(1);
  expect(plan.data[0]).toMatchObject({id:'weekly-five',value:5,unit:'USD',display:'$5',qualifier:'exact'});
  expect(script.scenes.map((scene:any)=>scene.voiceText).join(' ')).toBe(approved);
  expect(DAY6_RICH_CHARACTER_OUT).toBe('output/benchmarks/day-6-v12-rich-story-character-revision');
  const highlights=resolveNumberHighlights(NumberHighlightFileSchema.parse(json('number_highlights.json')),transcript);
  expect(()=>assertFinanceHighlights(resolved,highlights)).not.toThrow();
  expect(DAY6_RICH_STORY_OUT).toBe('output/benchmarks/day-6-v12-rich-story-seamless-crossfade');
 });

 it('holds only the final source-linked illustration under the existing silent CTA dwell',()=>{
  const dwell=planOutroDwell(transcript,.2,3),held=extendDay6RichVisualThroughOutro(structuredClone(resolved),dwell.profileEntranceSec);
  const ending=held.sequences.find(sequence=>sequence.id==='weekly-safekeeping')!;
  expect(ending.endSec).toBe(dwell.profileEntranceSec+.18);
  expect(ending.motionEvents.map(event=>event.atSec)).toEqual(resolved.sequences.at(-1)!.motionEvents.map(event=>event.atSec));
  expect(dwell.narrationModified).toBe(false);
  expect(ending.motionEvents.at(-1)!.endSec).toBeLessThan(ending.endSec);
  expect(assessMotionSemantics(held).status).toBe('PASS');
 });

 it('keeps every stage inside the shared safe frame and preserves the separate $5/week data lane',()=>{
  expect(VisualPlanSchema.parse(DAY6_RICH_VISUAL_PLAN).layoutDirection).toBe('mixed');
  for(const sequence of plan.sequences){
   const stage=sequence.elements.find(element=>element.id==='stage');
   const bounds=DAY6_RICH_LAYOUT[sequence.id as keyof typeof DAY6_RICH_LAYOUT].stage;
   expect(stage?.box).toEqual(bounds);
   expect(bounds.x).toBeGreaterThanOrEqual(VISUAL_SAFE_FRAME.left);
   expect(bounds.x+bounds.w).toBeLessThanOrEqual(VISUAL_SAFE_FRAME.right);
   expect(bounds.y).toBeGreaterThanOrEqual(VISUAL_SAFE_FRAME.top);
   expect(bounds.y+bounds.h).toBeLessThanOrEqual(VISUAL_SAFE_FRAME.bottom);
  }
  const weekly=plan.sequences.find(sequence=>sequence.id==='weekly-safekeeping')!;
  expect(weekly.elements.filter(element=>element.kind==='metric').map(element=>element.id)).toEqual(['weekly-five']);
  expect(weekly.elements.some(element=>element.id==='wallet')).toBe(false);
  expect(weekly.motionEvents.find(event=>event.id==='outro-clear')!.targets).not.toContain('stage');
 });

 it('resolves added illustration state changes only from exact narrated phrases',()=>{
  for(const sequence of resolved.sequences){
   const steps=DAY6_STORY_STEPS[sequence.id];
   expect(steps.length).toBeGreaterThanOrEqual(4);
   for(const step of steps)expect(sequence.motionEvents.some(event=>event.id===step.event)).toBe(true);
   for(const event of sequence.motionEvents){
    const scene=script.scenes.find((candidate:any)=>candidate.id===event.trigger.sceneId);
    expect(scene,sequence.id+'.'+event.id).toBeTruthy();
    expect(scene.voiceText.toLowerCase(),sequence.id+'.'+event.id).toContain(event.trigger.sourceSpan.toLowerCase());
    expect(Number.isFinite(event.atSec),sequence.id+'.'+event.id).toBe(true);
   }
   const future=[...DAY6_STORY_ART[sequence.id].matchAll(/class="([^"]*story-future[^"]*)"/g)].map(match=>match[1].split(/\s+/).find(name=>name!=='story-future')!);
   for(const name of future)expect(steps.some(step=>step.selector.includes('.'+name)),sequence.id+'.'+name).toBe(true);
  }
  expect(plan.sequences.flatMap(sequence=>sequence.motionEvents).map(event=>event.trigger.sourceSpan)).toEqual(expect.arrayContaining([
   'a stressful semester in college','the last one','saving is good','start with an amount',"The goal isn't the amount",'Once that feels safe','the amount can grow',
  ]));
 });

 it('uses one coin that stays visible in the transparent jar; the illustration adds no text, amount or audio cue',()=>{
  const weekly=DAY6_STORY_ART['weekly-safekeeping'];
  expect(weekly.match(/class="coin-traveler/g)).toHaveLength(1);
  for(const art of Object.values(DAY6_STORY_ART)){
   expect(art).toContain('<path');
   expect(art).not.toMatch(/<text|[$%]/i);
  }
  expect(JSON.stringify(DAY6_STORY_STEPS)).not.toMatch(/repeat|yoyo/i);
  expect(DAY6_RICH_STORY_CSS).toContain('var(--navy-deep)');
  expect(DAY6_RICH_STORY_CSS).toContain('var(--accent-gold)');
  expect(DAY6_RICH_STORY_CSS).not.toMatch(/@keyframes|url\(/i);
 });

 it('connects the recurring character anatomy and transcript-stage hands, with four readable expressions',()=>{
  const expressions=new Set<string>();
  for(const [sequence,character] of Object.entries(DAY6_CHARACTER_ARTICULATION)){
   const art=DAY6_STORY_ART[sequence];
   expressions.add(character.expression);
   expect(art).toContain(`data-character-expression="${character.expression}"`);
   expect(art).toContain(`data-wrist-anchor="${character.wrist.join(',')}"`);
   expect(art).toContain(`d="${character.rightArm}"`);
   expect(art.match(/class="person-arm-outline"/g)).toHaveLength(2);
   expect(art.match(/class="person-arm-skin"/g)).toHaveLength(2);
   expect(art).toContain('class="skin neck"');
   expect(art).toContain(`face-${character.expression}`);
   expect(art).toContain('class="face-ink"');
   if(character.anchor){
    const wristX=character.x+character.scale*character.wrist[0],wristY=character.y+character.scale*character.wrist[1];
    expect(Math.abs(wristX-character.anchor[0])).toBeLessThanOrEqual(1);
    expect(Math.abs(wristY-character.anchor[1])).toBeLessThanOrEqual(1);
    expect(art).toContain(`data-wrist-anchor="${character.anchor.join(',')}"`);
   }
  }
  expect(expressions).toEqual(new Set(['concerned','worried','guarded','relieved']));
 });

 it('keeps the reaching arm attached while the hand changes from holding to releasing',()=>{
  const steps=DAY6_STORY_STEPS['weekly-safekeeping'];
  const allSteps=Object.values(DAY6_STORY_STEPS).flat();
  expect(steps).toContainEqual(expect.objectContaining({event:'retained',selector:'.reaching-hand',to:{opacity:0}}));
  expect(steps).toContainEqual(expect.objectContaining({event:'retained',selector:'.hand-release',to:{opacity:1}}));
  for(const selector of ['.reaching-hand','.hand-release','.fear-hand','.protecting-hand']){
   const step=allSteps.find(candidate=>candidate.selector===selector);
   expect(step?.to).not.toHaveProperty('x');
   expect(step?.to).not.toHaveProperty('y');
   expect(step?.to).not.toHaveProperty('rotation');
  }
 });

 it('injects one SVG story stage per sequence and only phrase-timed GSAP events',()=>{
  const stages=resolved.sequences.map(sequence=>'<div class="scene clip fm-sequence" data-handoff-out-sec="0.06" data-handoff-gap-sec="0.02" data-handoff-in-sec="0.1"><div class="fm-node" id="fm-'+sequence.id+'-stage" data-element-id="stage"><div class="fm-focus-ring"></div></div></div>').join('');
  const html=decorateDay6RichStory('<head></head><body>'+stages+'</body>',resolved,planOutroDwell(transcript,.2,3).profileEntranceSec);
  expect((html.match(/class="day6-story-art"/g)||[])).toHaveLength(4);
  expect(html).toContain('window.__day6StoryEvents');
  expect(html).toContain('aria-hidden="true"');
  const handoffs=[...html.matchAll(/data-handoff-out-sec="([\d.]+)" data-handoff-gap-sec="(-?[\d.]+)" data-handoff-in-sec="([\d.]+)"/g)];
  expect(handoffs).toHaveLength(resolved.sequences.length);
  for(const match of handoffs){
   expect(Number(match[2])).toBe(-.02);
   expect(Number(match[1])+Number(match[2])+Number(match[3])).toBeCloseTo(DOMINANT_FOREGROUND_HANDOFF.crossfadeSec,8);
  }
  const timelineEvents=JSON.parse(html.match(/const steps=(\[[\s\S]*?\]);window.__day6StoryEvents/)![1]);
  expect(timelineEvents.find((step:any)=>step.event==='outro-clear')!.at).toBe(planOutroDwell(transcript,.2,3).profileEntranceSec);
  expect(html).not.toMatch(/@keyframes|animation:/i);
 });
});
