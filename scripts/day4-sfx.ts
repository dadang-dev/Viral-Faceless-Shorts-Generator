import type {ResolvedFinancePlan} from "../src/contracts/finance-motion.js";

export type Cue={atSec:number;kind:"click"|"pop"|"whoosh"|"cash";sequence:string;target:string;timingSource:string};
export function cuePlan(plan:ResolvedFinancePlan):Cue[]{
 const cues:Cue[]=[];
 const kind=(icon?:string):Cue["kind"]=>icon==="wallet"?"cash":icon==="order"?"whoosh":icon==="question"?"pop":"click";
 for(const s of plan.sequences){
  for(const e of s.elements.filter(e=>e.initial&&e.kind==="node"))cues.push({atSec:s.startSec,kind:kind(e.icon),sequence:s.id,target:e.id,timingSource:"resolved sequence entrance"});
  for(const ev of s.motionEvents.filter(e=>["reveal","grow","stack"].includes(e.action))){
   const e=s.elements.find(e=>ev.targets.includes(e.id)&&(e.kind==="node"||e.kind==="metric"||["question","not-need","minutes"].includes(e.id)));
   if(e)cues.push({atSec:ev.atSec,kind:e.kind==="text"?"click":kind(e.icon),sequence:s.id,target:e.id,timingSource:"transcript.json:"+ev.trigger.sourceSpan});
  }
 }
 // Simultaneous semantic entrances share one subtle cue, never a loud pile-up.
 return cues.sort((a,b)=>a.atSec-b.atSec).filter((c,i,all)=>i===0||c.atSec-all[i-1].atSec>.08);
}
export function synthesizeCues(cues:Cue[],duration:number,sampleRate=48000){
 const samples=new Float32Array(Math.ceil(duration*sampleRate));let seed=4;
 for(const cue of cues){
  const length=cue.kind==="whoosh"?.22:cue.kind==="cash"?.2:.11;
  for(let i=0;i<length*sampleRate;i++){
   const t=i/sampleRate,u=t/length;
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const noise=seed/4294967296*2-1;
   const env=Math.sin(Math.PI*u)**2*Math.exp(-u*3);
   const wave=cue.kind==="whoosh"?noise*.55:cue.kind==="cash"?(Math.sin(2*Math.PI*1700*t)+.3*Math.sin(2*Math.PI*2350*t))*.45:cue.kind==="pop"?Math.sin(2*Math.PI*(650*t-1400*t*t))*.7:noise*.25+Math.sin(2*Math.PI*1200*t)*.35;
   const n=Math.round(cue.atSec*sampleRate)+i;if(n<samples.length)samples[n]+=wave*env*.085;
  }
 }
 return samples;
}
export function waveBuffer(samples:Float32Array,sampleRate=48000){
 const wav=Buffer.alloc(44+samples.length*2);wav.write("RIFF");wav.writeUInt32LE(wav.length-8,4);wav.write("WAVEfmt ",8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sampleRate,24);wav.writeUInt32LE(sampleRate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write("data",36);wav.writeUInt32LE(samples.length*2,40);
 samples.forEach((s,i)=>wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,s))*32767),44+i*2));return wav;
}
