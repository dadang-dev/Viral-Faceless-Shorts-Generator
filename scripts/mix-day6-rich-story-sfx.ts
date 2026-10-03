import {access,copyFile,mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {assertScriptIntegrity,extractApprovedVoiceOver} from '../src/contracts/content-contract.js';
import {assertBenchmarkDestination} from '../src/contracts/benchmark-isolation.js';
import {APPROVED_SCRIPT_FILE} from '../src/contracts/content-contract.js';
import {waveBuffer} from './day4-sfx.js';
import {DAY6_RICH_CHARACTER_SFX_OUT,DAY6_RICH_STORY_SFX_OUT,day6SfxCuePlan,synthesizeDay6Sfx} from './day6-sfx.js';
import {DAY6_RICH_CHARACTER_OUT,DAY6_RICH_STORY_OUT} from './day6-rich-story-plan.js';

const characterRevision=process.argv.includes('--character-revision');
const source=characterRevision?DAY6_RICH_CHARACTER_OUT:DAY6_RICH_STORY_OUT;
const parent='output/benchmarks/day-6-v12-differentactually';
const out=characterRevision?DAY6_RICH_CHARACTER_SFX_OUT:DAY6_RICH_STORY_SFX_OUT;
const staging=out+'.staging';
const expectedSourceSha256='8f33207866be60b7e4eee07ea5e5c5cfa5985a6f00d7c9419bc582704876e0d8';
const ffmpeg=process.env.MONEYHABITS_FFMPEG,ffprobe=process.env.MONEYHABITS_FFPROBE;
assertBenchmarkDestination(out);assertBenchmarkDestination(staging);
if(!ffmpeg||!ffprobe)throw new Error('Explicit MONEYHABITS_FFMPEG and MONEYHABITS_FFPROBE are required');
const exists=async(path:string)=>{try{await access(path);return true;}catch(error:any){if(error.code==='ENOENT')return false;throw error;}};
if(await exists(out)||await exists(staging))throw new Error('DAY6_SFX_DESTINATION_EXISTS: preserve prior artifacts and use a new isolated destination');
const hash=async(path:string)=>createHash('sha256').update(await readFile(path)).digest('hex');
type CommandResult={stdout:string;stderr:string};
const run=(command:string,args:string[]):Promise<CommandResult>=>new Promise((resolve,reject)=>{
 const child=spawn(command,args,{stdio:['ignore','pipe','pipe']});let stdout='',stderr='';
 child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);
 child.on('error',reject);child.on('close',code=>code===0?resolve({stdout,stderr}):reject(new Error(command+' failed: '+stderr)));
});
const sourceVideo=join(source,'video.mp4');
const sourceVideoSha256=await hash(sourceVideo);
if(!characterRevision&&sourceVideoSha256!==expectedSourceSha256)throw new Error('DAY6_SFX_SOURCE_VIDEO_CHANGED: '+sourceVideoSha256);
const sourceReport=JSON.parse(await readFile(join(source,'validation-report.json'),'utf8'));
const sourceIllustration=JSON.parse(await readFile(join(source,'illustration-qa.json'),'utf8'));
const sourceTemporal=JSON.parse(await readFile(join(source,'final-gsap-temporal-collision-report.json'),'utf8'));
const sourceFrameManifest=JSON.parse(await readFile(join(source,'final-gsap','qa-manifest.json'),'utf8'));
if(!['READY_FOR_VISUAL_REVIEW','RENDERED_PENDING_FRAME_QA'].includes(sourceReport.status)
 ||sourceReport.gates?.A_SCRIPT_INTEGRITY?.status!=='PASS'
 ||sourceIllustration.status!=='PASS'
 ||(characterRevision&&(sourceReport.storyRevision?.style!=='source-linked illustration with connected, expressive character correction'||sourceIllustration.articulation?.status!=='PASS'))
 ||sourceTemporal.status!=='PASS'
 ||!Array.isArray(sourceTemporal.failures)||sourceTemporal.failures.length
 ||sourceFrameManifest.videoSha256!==sourceVideoSha256)throw new Error('DAY6_SFX_SOURCE_REVIEW_NOT_READY');
const preservation=JSON.parse(await readFile(join(source,'baseline-preservation.json'),'utf8'));
if(preservation.status!=='PASS')throw new Error('DAY6_SFX_SOURCE_BASELINE_NOT_PASS');
const protectedFiles:Record<string,string>={...(preservation.after??preservation.before)};
for(const [path,expected] of Object.entries(protectedFiles))if(await hash(path)!==expected)throw new Error('PROTECTED_CHANGED_BEFORE_SFX: '+path);
protectedFiles[sourceVideo]=sourceVideoSha256;

const script=JSON.parse(await readFile(join(source,'script.json'),'utf8'));
const approved=extractApprovedVoiceOver(await readFile(APPROVED_SCRIPT_FILE,'utf8'),6);
assertScriptIntegrity(script,approved);
for(const file of ['voice.mp3','transcript.json','script.txt']){
 const current=await readFile(join(source,file)),canonical=await readFile(join(parent,file));
 if(!current.equals(canonical))throw new Error('DAY6_SFX_SOURCE_BYTES_CHANGED: '+file);
}
const plan=JSON.parse(await readFile(join(source,'resolved-finance-plan.json'),'utf8'));
const cues=day6SfxCuePlan(plan);
const media=JSON.parse((await run(ffprobe,['-v','error','-show_streams','-show_format','-of','json',sourceVideo])).stdout);
const videoStream=media.streams?.find((stream:any)=>stream.codec_type==='video');
const audioStream=media.streams?.find((stream:any)=>stream.codec_type==='audio');
if(!videoStream||!audioStream||videoStream.width!==1080||videoStream.height!==1920||videoStream.codec_name!=='h264')throw new Error('DAY6_SFX_SOURCE_STREAMS_INVALID');
const durationSec=Number(audioStream.duration??media.format?.duration);
if(!Number.isFinite(durationSec)||Math.max(...cues.map(cue=>cue.atSec+.72))>=durationSec)throw new Error('DAY6_SFX_CUE_DURATION_INVALID');

const sidecars=[
 'index.html','styles.css','tiktok-avatar.svg','script.json','script.txt','transcript.json','voice.mp3',
 'number_highlights.json','audio-reuse.json','batch-comparison-history.json','full-script-analysis.json',
 'visual-plan.json','data_visualizations.json','hero-captions.json','resolved-hero-captions.json',
 'caption-coverage.json','resolved-finance-plan.json','validation-report.json','test-results.json',
 'editorial-validation.json','numeric-integrity.json','design-tokens.json','meta.json','storyboard.json',
 'subtitles.ass','pre-render-temporal-collision-report.json','final-gsap-temporal-collision-report.json',
 'illustration-qa.json','visual-review.json',
];
await mkdir(staging,{recursive:false});
try{
 for(const file of sidecars)await copyFile(join(source,file),join(staging,file));
 const validation=JSON.parse(await readFile(join(staging,'validation-report.json'),'utf8'));
 validation.status='RENDERED_PENDING_POST_MIX_QA';
 validation.storyRevision={...validation.storyRevision,sfx:'three source phrase-linked deterministic cues',mixedAudioChanged:true,canonicalNarrationChanged:false,wordBoundaryChanged:false,voiceStemBytesUnchanged:true,parentCandidate:source,parentVideoSha256:sourceVideoSha256};
 await writeFile(join(staging,'validation-report.json'),JSON.stringify(validation,null,2));
 const design=JSON.parse(await readFile(join(staging,'design-tokens.json'),'utf8'));
 design.sfx='three quiet transcript-linked cues; no music';
 await writeFile(join(staging,'design-tokens.json'),JSON.stringify(design,null,2));
 const story=JSON.parse(await readFile(join(staging,'storyboard.json'),'utf8'));
 story.soundDesign={source:'locally synthesized deterministic effects; no external audio or music',cues};
 story.constraints=story.constraints.filter((item:string)=>!item.includes('SFX'));
 story.constraints.push('Only the three transcript-resolved sound cues in sound-design.json are added; narration, visuals, and WordBoundary timing remain unchanged.');
 await writeFile(join(staging,'storyboard.json'),JSON.stringify(story,null,2));
 const fullScript=JSON.parse(await readFile(join(staging,'full-script-analysis.json'),'utf8'));
 fullScript.changes='Day-specific SFX derivative. Source-linked visuals, exact narration, voice stem and WordBoundary bytes remain unchanged; three quiet cues are mixed into the final audio track.';
 await writeFile(join(staging,'full-script-analysis.json'),JSON.stringify(fullScript,null,2));
 const audioReuse=JSON.parse(await readFile(join(staging,'audio-reuse.json'),'utf8'));
 audioReuse.sfxAdded=true;
 audioReuse.sfxReport='sfx-report.json';
 await writeFile(join(staging,'audio-reuse.json'),JSON.stringify(audioReuse,null,2));

 const protectedBefore={...protectedFiles};
 await writeFile(join(staging,'protected-before.json'),JSON.stringify(protectedBefore,null,2));
 await writeFile(join(staging,'baseline-preservation.json'),JSON.stringify({status:'PASS',before:protectedBefore,after:protectedBefore,protectedEntries:Object.keys(protectedBefore).length,sourceCandidate:{path:sourceVideo,sha256:sourceVideoSha256}},null,2));
 const sourceInfo={status:'PASS',parentCandidate:source,parentVideoSha256:sourceVideoSha256,visualHtmlSha256:await hash(join(source,'index.html')),sourceIllustrationQa:sourceIllustration.status,sourceTemporalQa:{status:sourceTemporal.status,snapshots:sourceTemporal.snapshotCount,failures:sourceTemporal.failures.length},sourceFrameManifestSha256:sourceFrameManifest.videoSha256,voiceStemSha256:await hash(join(source,'voice.mp3')),wordBoundarySha256:await hash(join(source,'transcript.json')),voiceStemMatchesPreviousDay6Candidate:true,wordBoundaryMatchesPreviousDay6Candidate:true,canonicalVoiceTextMatches:true};
 await writeFile(join(staging,'sfx-source-integrity.json'),JSON.stringify(sourceInfo,null,2));
 await writeFile(join(staging,'sound-design.json'),JSON.stringify({status:'PLANNED',day:6,cues,voiceOffsetSec:0,voiceGain:0.89,sfxPeak:0.085,source:'deterministic local synthesis',musicAdded:false,visualTrackModified:false},null,2));
 await writeFile(join(staging,'sfx.wav'),waveBuffer(synthesizeDay6Sfx(cues,durationSec)));
 const stagingVideo=join(staging,'video.mp4');
 const mix=await run(ffmpeg,['-hide_banner','-y','-i',sourceVideo,'-i',join(staging,'sfx.wav'),'-filter_complex','[0:a]volume=0.89[voice];[voice][1:a]amix=inputs=2:duration=first:normalize=0:dropout_transition=0[a]','-map','0:v:0','-map','[a]','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',stagingVideo]);
 const stats=await run(ffmpeg,['-hide_banner','-i',stagingVideo,'-vn','-af','volumedetect','-f','null','NUL']);
 const peak=Number((stats.stderr+stats.stdout).match(/max_volume:\s*([\d.-]+) dB/i)?.[1]);
 const mean=Number((stats.stderr+stats.stdout).match(/mean_volume:\s*([\d.-]+) dB/i)?.[1]);
 if(!Number.isFinite(peak)||peak>-.5||!Number.isFinite(mean))throw new Error('DAY6_SFX_AUDIO_HEADROOM: '+peak);
 const pictureHash=async(path:string)=>{
  const result=await run(ffmpeg,['-v','error','-i',path,'-map','0:v:0','-c','copy','-f','hash','-hash','sha256','-']);
  const match=result.stdout.match(/SHA256=([0-9a-f]+)/i);if(!match)throw new Error('DAY6_SFX_PICTURE_HASH_MISSING');return match[1].toLowerCase();
 };
 const sourcePictureSha256=await pictureHash(sourceVideo),mixedPictureSha256=await pictureHash(stagingVideo);
 if(sourcePictureSha256!==mixedPictureSha256)throw new Error('DAY6_SFX_CHANGED_VIDEO_STREAM');
 const finalMedia=JSON.parse((await run(ffprobe,['-v','error','-show_streams','-show_format','-of','json',stagingVideo])).stdout);
 const finalVideo=finalMedia.streams?.find((stream:any)=>stream.codec_type==='video'),finalAudio=finalMedia.streams?.find((stream:any)=>stream.codec_type==='audio');
 if(!finalVideo||!finalAudio||finalVideo.width!==videoStream.width||finalVideo.height!==videoStream.height||finalVideo.r_frame_rate!==videoStream.r_frame_rate)throw new Error('DAY6_SFX_FINAL_STREAMS_INVALID');
 const finalVideoSha256=await hash(stagingVideo);
 const planReport={status:'PASS',day:6,sourceCandidate:source,sourceVideoSha256,finalVideoSha256,sourcePictureStreamSha256:sourcePictureSha256,finalPictureStreamSha256:mixedPictureSha256,pictureStreamUnchanged:true,voiceStemSha256:sourceInfo.voiceStemSha256,voiceStemBytesUnchanged:true,voiceGain:.89,voiceOffsetSec:0,wordBoundarySha256:sourceInfo.wordBoundarySha256,wordBoundariesUnchanged:true,cueCount:cues.length,cues,source:'Locally synthesized deterministic effects; no external audio asset or music',sfxSamplePeak:.085,finalMeanVolumeDb:mean,finalPeakVolumeDb:peak,streams:{videoCodec:finalVideo.codec_name,audioCodec:finalAudio.codec_name,width:finalVideo.width,height:finalVideo.height,frameRate:finalVideo.r_frame_rate,videoDurationSec:Number(finalVideo.duration),audioDurationSec:Number(finalAudio.duration),containerDurationSec:Number(finalMedia.format?.duration)},mixCommand:mix.stderr.split(/\r?\n/).filter(Boolean).slice(-4),humanListeningReview:'PENDING; objective timing, peak and stream checks do not replace human listening.'};
 await writeFile(join(staging,'sfx-report.json'),JSON.stringify(planReport,null,2));
 const soundDesign=JSON.parse(await readFile(join(staging,'sound-design.json'),'utf8'));
 Object.assign(soundDesign,{status:'PASS',videoSha256:finalVideoSha256,pictureStreamUnchanged:true,wordBoundariesUnchanged:true,humanListeningReview:'PENDING'});
 await writeFile(join(staging,'sound-design.json'),JSON.stringify(soundDesign,null,2));
 const review={status:'PENDING_POST_MIX_VISUAL_QA',candidate:out+'/video.mp4',sourceVisualReview:source+'/visual-review.json',pictureStreamUnchanged:true,humanVisualApproval:'PENDING',humanListeningApproval:'PENDING',requiredReview:'Listen to the three effect moments against the narration; check voice clarity and cue tone.'};
 await writeFile(join(staging,'visual-review.json'),JSON.stringify(review,null,2));
 for(const [path,expected] of Object.entries(protectedBefore))if(await hash(path)!==expected)throw new Error('PROTECTED_CHANGED_AFTER_SFX: '+path);
 await rename(staging,out);
 console.log(JSON.stringify({status:'MIXED_PENDING_POST_MIX_QA',candidate:out+'/video.mp4',cueCount:cues.length,finalPeakVolumeDb:peak,pictureStreamUnchanged:true,voiceOffsetSec:0,voiceGain:.89},null,2));
}catch(error){
 throw error;
}
