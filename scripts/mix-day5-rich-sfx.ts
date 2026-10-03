import {access,readFile,rename,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {synthesizeCues,waveBuffer,type Cue} from './day4-sfx.js';
import {day5Transitions} from './day5-transitions.js';
import {DAY5_RICH_STORY_OUT} from './day5-rich-story-plan.js';

const out=DAY5_RICH_STORY_OUT,ffmpeg=process.env.MONEYHABITS_FFMPEG;
if(!ffmpeg)throw new Error('Explicit MONEYHABITS_FFMPEG required');
const exists=async(path:string)=>{try{await access(path);return true;}catch(error:any){if(error.code==='ENOENT')return false;throw error;}};
if(await exists(join(out,'sfx-report.json'))||await exists(join(out,'video-without-sfx.mp4')))throw new Error('DAY5_SFX_ALREADY_MIXED');
if(!await exists(join(out,'video.mp4')))throw new Error('DAY5_VIDEO_MISSING');
const hash=async(path:string)=>createHash('sha256').update(await readFile(path)).digest('hex');
const baseline=JSON.parse(await readFile(join(out,'protected-before.json'),'utf8'));
for(const [path,expected] of Object.entries(baseline))if(await hash(path)!==expected)throw new Error(`PROTECTED_CHANGED: ${path}`);
const plan=JSON.parse(await readFile(join(out,'resolved-finance-plan.json'),'utf8'));
const voiceSha256=await hash(join(out,'voice.mp3'));
const parentVoiceSha256=await hash('output/benchmarks/day-5-v12-transitions/voice.mp3');
if(voiceSha256!==parentVoiceSha256)throw new Error('VOICE_BYTES_CHANGED');

const selected=new Map<string,Cue['kind']>([
 ['guess-reveal','pop'],['statement','click'],['actually','whoosh'],['paid','cash'],
 ['fitness','click'],['business-model','click'],['recipient','cash'],['monthly-reveal','whoosh'],
 ['seconds','pop'],['look-payoff','pop'],
]);
const cues:Cue[]=[];
for(const sequence of plan.sequences)for(const event of sequence.motionEvents){
 const kind=selected.get(event.id);if(!kind)continue;
 cues.push({atSec:event.atSec,kind,sequence:sequence.id,target:event.targets.join('+'),timingSource:`transcript.json: ${event.trigger.sourceSpan}`});
}
for(const cut of day5Transitions(plan))cues.push({atSec:cut.startSec,kind:'whoosh',sequence:cut.sequence,target:'scene-transition',timingSource:'resolved visual-sequence boundary'});
cues.sort((a,b)=>a.atSec-b.atSec);
const sparse=cues.filter((cue,index)=>index===0||cue.atSec-cues[index-1].atSec>.08);
const duration=JSON.parse(await readFile(join(out,'validation-report.json'),'utf8')).outroDwell.finalTargetSec;
const samples=synthesizeCues(sparse,duration);
await writeFile(join(out,'sfx.wav'),waveBuffer(samples));
const run=(args:string[])=>new Promise<string>((resolve,reject)=>{
 const child=spawn(ffmpeg,args,{stdio:['ignore','pipe','pipe']});let log='';
 child.stdout.on('data',chunk=>log+=chunk);child.stderr.on('data',chunk=>log+=chunk);
 child.on('error',reject);child.on('close',code=>code===0?resolve(log):reject(new Error(log)));
});
const sourceVideo=join(out,'video.mp4'),withoutSfx=join(out,'video-without-sfx.mp4'),staging=join(out,'video-sfx-staging.mp4');
if(await exists(staging)||await exists(withoutSfx))throw new Error('DAY5_SFX_STAGING_EXISTS');
await run(['-y','-i',sourceVideo,'-i',join(out,'sfx.wav'),'-filter_complex','[0:a]volume=0.89[voice];[voice][1:a]amix=inputs=2:duration=first:normalize=0[a]','-map','0:v:0','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart',staging]);
const stats=await run(['-i',staging,'-vn','-af','volumedetect','-f','null','-']);
const peak=Number(stats.match(/max_volume: ([\d.-]+) dB/)?.[1]);
if(!Number.isFinite(peak)||peak>-.5)throw new Error(`AUDIO_HEADROOM: ${peak}`);
const pictureHash=async(path:string)=>{
 const result=await run(['-v','error','-i',path,'-map','0:v:0','-c','copy','-f','hash','-hash','sha256','-']);
 const found=result.match(/SHA256=[0-9a-f]+/i)?.[0];if(!found)throw new Error('PICTURE_HASH_MISSING');return found;
};
const pictureBefore=await pictureHash(sourceVideo),pictureAfter=await pictureHash(staging);
if(pictureBefore!==pictureAfter)throw new Error('SFX_CHANGED_PICTURE');
await rename(sourceVideo,withoutSfx);
await rename(staging,sourceVideo);
const report={status:'PASS',source:'Locally synthesized deterministic effects; no external audio asset or music',cues:sparse,voiceOffsetSec:0,voiceGain:.89,sfxPeak:samples.reduce((maximum,value)=>Math.max(maximum,Math.abs(value)),0),finalPeakDb:peak,picturePacketsUnchanged:true,picturePacketSha256:pictureAfter,voiceSha256,voiceBytesUnchangedFromParent:voiceSha256===parentVoiceSha256,videoSha256:await hash(sourceVideo),listeningReview:'Not performed; objective timing and headroom checks do not replace human listening.'};
await writeFile(join(out,'sfx-report.json'),JSON.stringify(report,null,2));
for(const [path,expected] of Object.entries(baseline))if(await hash(path)!==expected)throw new Error(`PROTECTED_CHANGED_AFTER_MIX: ${path}`);
console.log(JSON.stringify({status:report.status,cues:sparse.length,finalPeakDb:peak,picturePacketsUnchanged:true,voiceOffsetSec:0},null,2));
