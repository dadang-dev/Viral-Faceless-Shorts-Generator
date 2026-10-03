import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {compileFinancePlan,type FinancePlan} from '../src/contracts/finance-motion.js';
import {DAY6_RICH_CHARACTER_SFX_OUT,DAY6_RICH_STORY_SFX_OUT,day6SfxCuePlan,synthesizeDay6Sfx,type Day6SfxCue} from './day6-sfx.js';

const root='output/benchmarks/day-6-v12-rich-story-seamless-crossfade';
const json=(name:string)=>JSON.parse(readFileSync(root+'/'+name,'utf8'));
const plan=compileFinancePlan(json('data_visualizations.json') as FinancePlan,json('script.json'),json('transcript.json'),json('validation-report.json').approvedVoiceText);

describe('Day 6 transcript-linked sound design',()=>{
 it('keeps the character-correction sound-design candidate isolated from the previous review video',()=>{
  expect(DAY6_RICH_CHARACTER_SFX_OUT).toBe('output/benchmarks/day-6-v12-rich-story-character-revision-sound-design');
  expect(DAY6_RICH_CHARACTER_SFX_OUT).not.toBe(DAY6_RICH_STORY_SFX_OUT);
 });

 it('binds only the three requested cues to exact resolved semantic events',()=>{
  const cues=day6SfxCuePlan(plan);
  expect(cues.map(cue=>cue.kind)).toEqual(['rapid-tick','hollow-metal-drop','kaching']);
  expect(cues.map(cue=>cue.sourceSpan)).toEqual(['a stressful semester in college','into savings',"doesn't mean losing it"]);
  expect(cues.map(cue=>cue.sequence)).toEqual(['tight-wallet','weekly-safekeeping','weekly-safekeeping']);
  for(const cue of cues){
   const event=plan.sequences.find(sequence=>sequence.id===cue.sequence)!.motionEvents.find(item=>item.id===cue.eventId)!;
   expect(cue.atSec).toBe(event.atSec);
   expect(cue.timingSource).toContain('transcript.json WordBoundary');
  }
 });

 it('fails loudly if a phrase anchor no longer matches the canonical semantic event',()=>{
  const altered=structuredClone(plan);
  const event=altered.sequences.find(sequence=>sequence.id==='weekly-safekeeping')!.motionEvents.find(item=>item.id==='retained')!;
  event.trigger.sourceSpan='the amount can grow';
  expect(()=>day6SfxCuePlan(altered)).toThrow('DAY6_SFX_SOURCE_ANCHOR_INVALID');
 });

 it('synthesizes deterministic, restrained, non-clipping cues and leaves timing gaps silent',()=>{
  const cues:Day6SfxCue[]=[
   {atSec:.2,kind:'rapid-tick',sequence:'tight-wallet',eventId:'semester',target:'college-memory',sourceSpan:'a stressful semester in college',timingSource:'test'},
   {atSec:1.4,kind:'hollow-metal-drop',sequence:'weekly-safekeeping',eventId:'savings',target:'coin-enters-savings',sourceSpan:'into savings',timingSource:'test'},
  ];
  const first=synthesizeDay6Sfx(cues,2.3,12000),second=synthesizeDay6Sfx(cues,2.3,12000);
  expect(first.length).toBe(Math.ceil(2.3*12000));
  expect(first).toEqual(second);
  expect(Math.max(...first.slice(0,1800).map(Math.abs))).toBe(0);
  expect(Math.max(...first.map(Math.abs))).toBeLessThanOrEqual(.086);
  expect(Math.max(...first.slice(2400,12000).map(Math.abs))).toBeGreaterThan(.02);
  expect(Math.max(...first.slice(16800).map(Math.abs))).toBeGreaterThan(.02);
 });

 it('rejects an effect whose decay would be truncated by the audio end',()=>{
  const cue:Day6SfxCue={atSec:.8,kind:'kaching',sequence:'weekly-safekeeping',eventId:'retained',target:'coin-settles-in-jar',sourceSpan:"doesn't mean losing it",timingSource:'test'};
  expect(()=>synthesizeDay6Sfx([cue],1,12000)).toThrow('DAY6_SFX_CUE_OUTSIDE_AUDIO');
 });
});
