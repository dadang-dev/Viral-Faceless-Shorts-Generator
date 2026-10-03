import {access,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {createServer} from 'node:http';
import {join,resolve} from 'node:path';
import puppeteer from 'puppeteer-core';
import {VISUAL_SAFE_FRAME} from '../src/contracts/visual-collision.js';
import {day5Transitions,DAY5_TRANSITION_STYLE} from './day5-transitions.js';
import {DAY5_RICH_LAYOUT,DAY5_RICH_STORY_OUT} from './day5-rich-story-plan.js';
import {DAY5_STORY_ART,DAY5_STORY_STEPS} from './day5-rich-story-art.js';

const out=resolve(DAY5_RICH_STORY_OUT),preview=join(out,'story-preview');
const hash=async(path:string)=>createHash('sha256').update(await readFile(path)).digest('hex');
for(const file of ['index.html','resolved-finance-plan.json','validation-report.json','protected-before.json'])await access(join(out,file));
await mkdir(preview,{recursive:true});
const plan=JSON.parse(await readFile(join(out,'resolved-finance-plan.json'),'utf8'));
const expectedCuts=day5Transitions(plan),duration=JSON.parse(await readFile(join(out,'validation-report.json'),'utf8')).outroDwell.finalTargetSec;
const sourceVoice=await hash(join(out,'voice.mp3')),parentVoice=await hash('output/benchmarks/day-5-v12-transitions/voice.mp3');
const sourceTranscript=await hash(join(out,'transcript.json')),parentTranscript=await hash('output/benchmarks/day-5-v12-transitions/transcript.json');
if(sourceVoice!==parentVoice||sourceTranscript!==parentTranscript)throw new Error('DAY5_SOURCE_AUDIO_OR_TIMING_CHANGED');

const server=createServer((request,response)=>{
 const requested=request.url==='/'?'/index.html':request.url??'/index.html';
 const file=resolve(out,`.${requested.split('?')[0]}`);
 if(!file.startsWith(out)){response.statusCode=403;response.end();return;}
 createReadStream(file).on('error',()=>{response.statusCode=404;response.end();}).pipe(response);
});
await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));
const address=server.address();if(!address||typeof address==='string')throw new Error('DAY5_QA_SERVER_ADDRESS');
const browser=await puppeteer.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,protocolTimeout:300000,args:['--no-sandbox','--disable-gpu']});
const pageErrors:string[]=[],resourceErrors:string[]=[];
try{
 const page=await browser.newPage();
 page.on('pageerror',error=>pageErrors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')resourceErrors.push(message.text());});
 page.on('response',response=>{if(response.status()>=400)resourceErrors.push(`${response.status()} ${response.url()}`);});
 await page.evaluateOnNewDocument('window.__name = (fn, name) => fn');
 await page.setViewport({width:1080,height:1920,deviceScaleFactor:1});
 await page.goto(`http://127.0.0.1:${address.port}/index.html`,{waitUntil:'domcontentloaded',timeout:30000});
 const runtime=await page.evaluate(async()=>{
  await document.fonts.ready;
  const w=window as any,fonts=[...document.fonts].filter((font:any)=>font.status==='loaded').map((font:any)=>font.family);
  if(!w.gsap||!w.__timelines?.['news-video']||!w.__day5StoryEvents||!w.__day5Transitions)throw new Error('DAY5_STORY_RUNTIME_MISSING');
  if(!fonts.some((font:string)=>font.includes('Anton'))||!fonts.some((font:string)=>font.includes('Inter')))throw new Error('DAY5_STORY_REQUIRED_FONTS_MISSING');
  return {gsapVersion:w.gsap.version,fonts,events:w.__day5StoryEvents,cuts:w.__day5Transitions};
 });
 if(runtime.cuts.length!==4||runtime.events.length<20)throw new Error('DAY5_STORY_REQUIRED_EVENT_COUNT');
 const times=new Set<number>();
 for(let t=0;t<=duration+.0001;t+=.2)times.add(Number(Math.min(duration,t).toFixed(4)));
 for(const sequence of plan.sequences)for(const step of DAY5_STORY_STEPS[sequence.id]){
  const event=sequence.motionEvents.find((candidate:any)=>candidate.id===step.event)!;
  for(const delta of [-.01,0,.08,.18,.36,.6,.9])if(event.atSec+delta>=0&&event.atSec+delta<=duration)times.add(Number((event.atSec+delta).toFixed(4)));
 }
 const transitionStates=expectedCuts.flatMap(cut=>{
  const values=[cut.startSec-.001,cut.startSec,cut.startSec+DAY5_TRANSITION_STYLE.leadSec/2,cut.boundarySec,cut.coverSec,cut.endSec-.001,cut.endSec];
  for(let t=cut.startSec;t<=cut.endSec+.0001;t+=1/30)values.push(t);
  return values.map(time=>Number(time.toFixed(4)));
 });
 transitionStates.forEach(time=>times.add(time));
 const forward=[...times].sort((a,b)=>a-b),seekOrder=[...forward,...forward.slice().reverse()];
 const checked=await page.evaluate(({samples,safe,cuts})=>{
  const w=window as any,tl=w.__timelines['news-video'],failures:any[]=[];let artSamples=0,boundsChecks=0;
  const opacity=(el:Element)=>{let value=1;for(let p:Element|null=el;p;p=p.parentElement)value*=Number.parseFloat(getComputedStyle(p).opacity||'0');return value;};
  for(const time of samples){
   tl.pause().time(time,true);
   for(const svg of document.querySelectorAll<SVGSVGElement>('.day5-story-art')){
    if(opacity(svg)<.03)continue;artSamples++;
    const outer=svg.getBoundingClientRect(),stage=svg.parentElement!.getBoundingClientRect();
    if(stage.left<safe.left-.1||stage.right>safe.right+.1||stage.top<safe.top-.1||stage.bottom>safe.bottom+.1)failures.push({kind:'STORY_STAGE_OUTSIDE_SAFE_FRAME',time,scene:svg.closest('.fm-sequence')?.id,rect:{x:stage.x,y:stage.y,w:stage.width,h:stage.height}});
    for(const primitive of svg.querySelectorAll<SVGGraphicsElement>('path,rect,circle,ellipse,line,polyline,polygon')){
     if(opacity(primitive)<.03)continue;const r=primitive.getBoundingClientRect();if(r.width+r.height<1)continue;boundsChecks++;
     if(r.left<outer.left-2||r.top<outer.top-2||r.right>outer.right+2||r.bottom>outer.bottom+2)failures.push({kind:'STORY_ART_CLIPPED',time,scene:svg.closest('.fm-sequence')?.id,part:primitive.closest('[data-story-part]')?.getAttribute('data-story-part'),rect:{x:r.x,y:r.y,w:r.width,h:r.height},stage:{x:outer.x,y:outer.y,w:outer.width,h:outer.height}});
    }
   }
   for(const cut of cuts){
    const el=document.getElementById(cut.id);if(!el)continue;const state=getComputedStyle(el),r=el.getBoundingClientRect(),visible=time>=cut.startSec-.0005&&time<cut.endSec-.0005;
    if((state.visibility==='visible')!==visible)failures.push({kind:'SHUTTER_VISIBILITY',time,id:cut.id,expected:visible,actual:state.visibility});
    if(Math.abs(r.left-safe.left)>1||Math.abs(r.top-safe.top)>1||Math.abs(r.width-(safe.right-safe.left))>1||Math.abs(r.height-(safe.bottom-safe.top))>1)failures.push({kind:'SHUTTER_SAFE_VIEWPORT',time,id:cut.id});
    if(state.overflow!=='hidden'||state.pointerEvents!=='none')failures.push({kind:'SHUTTER_LAYER_CONTRACT',time,id:cut.id});
    if(Math.abs(time-cut.coverSec)<.0002){const panel=el.querySelector('.day5-transition-panel')!.getBoundingClientRect();if(Math.abs(panel.top-safe.top)>2||Math.abs(panel.bottom-safe.bottom)>2)failures.push({kind:'SHUTTER_COVER_GAP',time,id:cut.id,rect:{y:panel.y,h:panel.height}});}
   }
  }
  return {failures,artSamples,boundsChecks};
 },{samples:seekOrder,safe:VISUAL_SAFE_FRAME,cuts:runtime.cuts});

 const revealFailures:any[]=[];
 for(const sequence of plan.sequences){
  const layout=DAY5_RICH_LAYOUT[sequence.id as keyof typeof DAY5_RICH_LAYOUT];
  const stage=sequence.elements.find((element:any)=>element.id==='stage');
  if(JSON.stringify(stage.box)!==JSON.stringify(layout.stage))revealFailures.push({sequence:sequence.id,kind:'STAGE_PLAN_MISMATCH'});
  for(const [index,match] of [...DAY5_STORY_ART[sequence.id].matchAll(/class="([^"]*story-future[^"]*)"/g)].entries()){
   const classes=match[1].split(/\s+/),className=classes.find((name:string)=>name!=='story-future')!;
   const steps=DAY5_STORY_STEPS[sequence.id].filter(step=>step.selector.includes(`.${className}`));
   if(!steps.length){revealFailures.push({sequence:sequence.id,className,kind:'UNBOUND_FUTURE_GROUP'});continue;}
   const event=sequence.motionEvents.find((candidate:any)=>candidate.id===steps[0].event)!;
   const selector=`#fm-${sequence.id}-stage .${className}`;
   const states=await page.evaluate(({selector,before,after})=>{
    const el=document.querySelector(selector);if(!el)return {missing:true,before:null,after:null};
    const tl=(window as any).__timelines['news-video'];tl.pause().time(before,true);const a=Number.parseFloat(getComputedStyle(el).opacity||'0');
    tl.pause().time(after,true);const b=Number.parseFloat(getComputedStyle(el).opacity||'0');return {missing:false,before:a,after:b};
   },{selector,before:Math.max(0,event.atSec-.002),after:Math.min(sequence.endSec-.001,event.atSec+.65)});
   if(states.missing||states.before>.01||states.after<.65)revealFailures.push({sequence:sequence.id,className,event:event.id,atSec:event.atSec,...states,kind:'FUTURE_REVEAL_STATE'});
  }
 }

 const screenshotEvents:[string,string,string,number][]=[
  ['guess-statement','statement','statement-open',.18],['range-comparison','cloud','cloud-storage',.75],
  ['range-comparison','paid','trial-converts',.75],['range-comparison','twice','fitness-used',.75],
  ['charge-attention','recipient','charge-to-recipient',.75],['monthly-review','look','monthly-scan',.18],
  ['actually-look','look-payoff','actually-look',.75],
 ];
 const screenshots:string[]=[];
 for(const [sequenceId,eventId,name,offset] of screenshotEvents){
  const sequence=plan.sequences.find((candidate:any)=>candidate.id===sequenceId)!,event=sequence.motionEvents.find((candidate:any)=>candidate.id===eventId)!;
  const time=Math.min(sequence.endSec-.15,event.atSec+offset);
  await page.evaluate((t:number)=>{(window as any).__timelines['news-video'].pause().time(t,true);},time);
  const path=join(preview,`${name}.png`);await page.screenshot({path,fullPage:true});screenshots.push(path);
 }
 for(const time of [0.5,5.5,10,15.5,19.5,23.5,30,36.5,41.5,46.5,49.5,52,54.4,56.5,58.5]){
  await page.evaluate((t:number)=>{(window as any).__timelines['news-video'].pause().time(t,true);},time);
  const path=join(preview,`timeline-${String(time).replace('.','-')}.png`);await page.screenshot({path,fullPage:true});screenshots.push(path);
 }
 const brand=await page.evaluate(()=>{const el=document.querySelector('.brand-shell-header');if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
 if(pageErrors.length)revealFailures.push({kind:'BROWSER_PAGE_ERRORS',errors:pageErrors});
 const htmlSha256=await hash(join(out,'index.html'));
 const illustration={status:checked.failures.length||revealFailures.length?'FAIL':'PASS',day:5,runtime:{gsapVersion:runtime.gsapVersion,fonts:runtime.fonts},sampleCount:seekOrder.length,artSamples:checked.artSamples,boundsChecks:checked.boundsChecks,temporalOrder:'forward plus backward seek',storyEvents:runtime.events.length,stages:plan.sequences.map((sequence:any)=>({id:sequence.id,...DAY5_RICH_LAYOUT[sequence.id as keyof typeof DAY5_RICH_LAYOUT].stage})),failures:[...checked.failures,...revealFailures],screenshots:screenshots.map(path=>path.replaceAll('\\','/')),htmlSha256,voiceSha256:sourceVoice,voiceUnchangedFromParent:sourceVoice===parentVoice,wordBoundarySha256:sourceTranscript,wordBoundaryUnchangedFromParent:sourceTranscript===parentTranscript,notes:'Real-GSAP stage/primitive bounds and event-linked reveal checks. Screenshot review and final decoded-MP4 checks are separate; no human visual/listening approval implied.'};
 const transitionFailures=checked.failures.filter((failure:any)=>String(failure.kind).startsWith('SHUTTER_'));
 const transition={status:transitionFailures.length?'FAIL':'PASS',day:5,samples:seekOrder.length,transitions:runtime.cuts,order:'forward and backward seeks; 30fps-sampled shutter windows',safeFrame:VISUAL_SAFE_FRAME,brandRect:brand,failures:transitionFailures,inputSha256:htmlSha256,note:'Four existing episode-local statement-scan shutters retained; final decoded caption/brand inspection remains required.'};
 await writeFile(join(out,'illustration-qa.json'),JSON.stringify(illustration,null,2));
 await writeFile(join(out,'transition-qa.json'),JSON.stringify(transition,null,2));
 await writeFile(join(out,'visual-review.json'),JSON.stringify({status:illustration.status==='PASS'&&transition.status==='PASS'?'AGENT_FRAME_REVIEW_PENDING':'FAIL',screenshots:illustration.screenshots,review:'Review these previews and decoded final MP4 before marking READY_FOR_VISUAL_REVIEW; user approval remains separate.'},null,2));
 console.log(JSON.stringify({illustration:illustration.status,transition:transition.status,samples:seekOrder.length,artSamples:checked.artSamples,boundsChecks:checked.boundsChecks,failures:illustration.failures.slice(0,8),screenshots:screenshots.length,resourceErrors:resourceErrors.slice(0,12)},null,2));
 if(illustration.status==='FAIL'||transition.status==='FAIL')process.exitCode=1;
}finally{
 await browser.close();await new Promise<void>(done=>server.close(()=>done()));
}
