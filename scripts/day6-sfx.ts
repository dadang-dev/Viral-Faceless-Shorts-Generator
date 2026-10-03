import type {ResolvedFinancePlan} from '../src/contracts/finance-motion.js';

export const DAY6_RICH_STORY_SFX_OUT='output/benchmarks/day-6-v12-rich-story-sound-design';
export const DAY6_RICH_CHARACTER_SFX_OUT='output/benchmarks/day-6-v12-rich-story-character-revision-sound-design';
export type Day6SfxKind='rapid-tick'|'hollow-metal-drop'|'kaching';
export type Day6SfxCue={
 atSec:number;
 kind:Day6SfxKind;
 sequence:string;
 eventId:string;
 target:string;
 sourceSpan:string;
 timingSource:string;
};

const REQUIRED_CUES=[
 {sequence:'tight-wallet',eventId:'semester',sourceSpan:'a stressful semester in college',kind:'rapid-tick',target:'college-memory'},
 {sequence:'weekly-safekeeping',eventId:'savings',sourceSpan:'into savings',kind:'hollow-metal-drop',target:'coin-enters-savings'},
 {sequence:'weekly-safekeeping',eventId:'retained',sourceSpan:"doesn't mean losing it",kind:'kaching',target:'coin-settles-in-jar'},
] as const;

export function day6SfxCuePlan(plan:ResolvedFinancePlan):Day6SfxCue[]{
 if(plan.day!==6||plan.sequences.length!==4)throw new Error('DAY6_SFX_SCOPE');
 return REQUIRED_CUES.map(required=>{
  const sequence=plan.sequences.find(item=>item.id===required.sequence);
  if(!sequence)throw new Error('DAY6_SFX_SEQUENCE_MISSING: '+required.sequence);
  const matches=sequence.motionEvents.filter(item=>item.id===required.eventId);
  if(matches.length!==1)throw new Error('DAY6_SFX_EVENT_CARDINALITY: '+required.sequence+'.'+required.eventId);
  const event=matches[0];
  if(event.trigger.sourceSpan!==required.sourceSpan||event.timingSource!=='transcript.json'||!Number.isFinite(event.atSec)){
   throw new Error('DAY6_SFX_SOURCE_ANCHOR_INVALID: '+required.sequence+'.'+required.eventId);
  }
  return {
   atSec:event.atSec,
   kind:required.kind,
   sequence:sequence.id,
   eventId:event.id,
   target:required.target,
   sourceSpan:event.trigger.sourceSpan,
   timingSource:'resolved-finance-plan.json → transcript.json WordBoundary',
  };
 }).sort((left,right)=>left.atSec-right.atSec);
}

const SAMPLE_PEAK=.085;
const cueLength=(kind:Day6SfxKind)=>{
 switch(kind){case'rapid-tick':return 1.02;case'hollow-metal-drop':return .72;case'kaching':return .62;}
};

function renderCue(kind:Day6SfxKind,sampleRate:number):Float32Array{
 const length=Math.ceil(cueLength(kind)*sampleRate),raw=new Float32Array(length);
 let seed=kind==='rapid-tick'?0x6d2b79f5:kind==='hollow-metal-drop'?0x1b873593:0x45d9f3b;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1;};
 for(let i=0;i<length;i++){
  const t=i/sampleRate;
  if(kind==='rapid-tick'){
   const period=.17,within=t%period;
   if(t>=period*6||within>.042)continue;
   const attack=Math.min(1,within/.0012),decay=Math.exp(-within*88);
   raw[i]=(Math.sin(2*Math.PI*1920*within)*.52+Math.sin(2*Math.PI*2810*within)*.23+random()*.25)*attack*decay;
  }else if(kind==='hollow-metal-drop'){
   const attack=Math.min(1,t/.003),body=Math.exp(-t*6.4),mid=Math.exp(-t*10),high=Math.exp(-t*16);
   const transient=t<.035?random()*.16*Math.exp(-t*95):0;
   raw[i]=(Math.sin(2*Math.PI*246*t)*.48*body+Math.sin(2*Math.PI*397*t+.2)*.31*mid+Math.sin(2*Math.PI*683*t)*.17*high+transient)*attack;
  }else{
   const first=t<.34?Math.sin(2*Math.PI*987.77*t)*Math.exp(-t*8):0;
   const second=t>=.055?Math.sin(2*Math.PI*1318.51*(t-.055))*Math.exp(-(t-.055)*6.2):0;
   const shimmer=t>=.055?Math.sin(2*Math.PI*1975.53*(t-.055))*Math.exp(-(t-.055)*10):0;
   const transient=t<.018?random()*.12*Math.exp(-t*160):0;
   raw[i]=first*.46+second*.34+shimmer*.13+transient;
  }
 }
 let peak=0;
 for(const value of raw)peak=Math.max(peak,Math.abs(value));
 if(!peak)throw new Error('DAY6_SFX_EMPTY_CUE: '+kind);
 const gain=SAMPLE_PEAK/peak;
 for(let i=0;i<raw.length;i++)raw[i]*=gain;
 return raw;
}

export function synthesizeDay6Sfx(cues:Day6SfxCue[],durationSec:number,sampleRate=48000):Float32Array{
 if(!Number.isFinite(durationSec)||durationSec<=0||!Number.isInteger(sampleRate)||sampleRate<8000)throw new Error('DAY6_SFX_AUDIO_FORMAT');
 const samples=new Float32Array(Math.ceil(durationSec*sampleRate));
 for(const cue of cues){
  if(!Number.isFinite(cue.atSec)||cue.atSec<0||cue.atSec+cueLength(cue.kind)>durationSec)throw new Error('DAY6_SFX_CUE_OUTSIDE_AUDIO: '+cue.eventId);
  const rendered=renderCue(cue.kind,sampleRate),start=Math.round(cue.atSec*sampleRate);
  for(let i=0;i<rendered.length;i++)samples[start+i]+=rendered[i];
 }
 let peak=0;
 for(const value of samples)peak=Math.max(peak,Math.abs(value));
 if(peak>.086)throw new Error('DAY6_SFX_OVERLAPPING_PEAK: '+peak);
 return samples;
}
