import {access,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {createServer} from 'node:http';
import {join,resolve} from 'node:path';
import puppeteer from 'puppeteer-core';
import {VISUAL_SAFE_FRAME} from '../src/contracts/visual-collision.js';
import {DAY7_RICH_STORY_OUT} from './day7-rich-story-plan.js';
import {DAY7_STORY_ART,DAY7_STORY_STEPS} from './day7-rich-story-art.js';

const out=resolve(DAY7_RICH_STORY_OUT),preview=join(out,'story-preview');
const hash=async(path:string)=>createHash('sha256').update(await readFile(path)).digest('hex');
for(const file of ['index.html','resolved-finance-plan.json','validation-report.json','protected-before.json'])await access(join(out,file));
await mkdir(preview,{recursive:true});
const plan=JSON.parse(await readFile(join(out,'resolved-finance-plan.json'),'utf8'));
const validation=JSON.parse(await readFile(join(out,'validation-report.json'),'utf8'));
const parent=resolve('output/benchmarks/day-7-v12-differentactually');
const voiceUnchanged=await hash(join(out,'voice.mp3'))===await hash(join(parent,'voice.mp3'));
const timingUnchanged=await hash(join(out,'transcript.json'))===await hash(join(parent,'transcript.json'));
if(!voiceUnchanged||!timingUnchanged)throw new Error('DAY7_SOURCE_AUDIO_OR_TIMING_CHANGED');
const server=createServer((request,response)=>{
 const requested=request.url==='/'?'/index.html':request.url??'/index.html';
 const file=resolve(out,`.${requested.split('?')[0]}`);
 if(!file.startsWith(out)){response.statusCode=403;response.end();return;}
 createReadStream(file).on('error',()=>{response.statusCode=404;response.end();}).pipe(response);
});
await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));
const address=server.address();if(!address||typeof address==='string')throw new Error('DAY7_QA_SERVER_ADDRESS');
const browser=await puppeteer.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,protocolTimeout:300000,args:['--no-sandbox','--disable-gpu']});
console.log('DAY7_QA_BROWSER_LAUNCHED');
const pageErrors:string[]=[],resourceErrors:string[]=[];
try{
 const page=await browser.newPage();
 page.on('pageerror',error=>pageErrors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')resourceErrors.push(message.text());});
 page.on('response',response=>{if(response.status()>=400)resourceErrors.push(`${response.status()} ${response.url()}`);});
 await page.evaluateOnNewDocument('window.__name = (fn, name) => fn');
 await page.setViewport({width:1080,height:1920,deviceScaleFactor:1});
 await page.goto(`http://127.0.0.1:${address.port}/index.html`,{waitUntil:'domcontentloaded',timeout:30000});
 console.log('DAY7_QA_DOM_LOADED');
 const runtime=await page.evaluate(async()=>{
  await document.fonts.ready;const w=window as any;
  if(!w.gsap||!w.__timelines?.['news-video']||!w.__day7StoryEvents)throw new Error('DAY7_STORY_RUNTIME_MISSING');
  const fonts=[...document.fonts].filter((font:any)=>font.status==='loaded').map((font:any)=>font.family);
  if(!fonts.some((font:string)=>font.includes('Anton'))||!fonts.some((font:string)=>font.includes('Inter')))throw new Error('DAY7_STORY_REQUIRED_FONTS_MISSING');
  return {gsapVersion:w.gsap.version,fonts,events:w.__day7StoryEvents};
 });
 console.log('DAY7_QA_RUNTIME_READY',runtime.gsapVersion,runtime.events.length);
 const points=new Set<number>(),geometryPoints=new Set<number>();
 for(const sequence of plan.sequences){
  points.add(sequence.startSec);points.add(sequence.endSec);
  for(const step of DAY7_STORY_STEPS[sequence.id]){
   const source=sequence.motionEvents.find((item:any)=>item.id===step.event);
   if(!source)throw new Error(`DAY7_QA_EVENT_MISSING: ${sequence.id}.${step.event}`);
   const at=source.atSec,span=step.duration??.38;
   for(const delta of [-.01,.01,span/2,span+.05])if(at+delta>=0&&at+delta<=validation.outroDwell.finalTargetSec)points.add(Number((at+delta).toFixed(4)));
   geometryPoints.add(Number((at+span/2).toFixed(4)));
  }
  geometryPoints.add(Number(((sequence.startSec+sequence.endSec)/2).toFixed(4)));
 }
 const forward=[...points].sort((a,b)=>a-b),samples=[...forward,...forward.slice().reverse()];
 const geometry=[...geometryPoints].sort((a,b)=>a-b),geometrySamples=[...geometry,...geometry.slice().reverse()];
 const checks=await page.evaluate(({samples,geometrySamples,safe})=>{
  const tl=(window as any).__timelines['news-video'],failures:any[]=[];let stageChecks=0,primitiveChecks=0;
  const opacity=(el:Element)=>{let value=1;for(let parent:Element|null=el;parent;parent=parent.parentElement)value*=Number.parseFloat(getComputedStyle(parent).opacity||'0');return value;};
  for(const time of samples){
   tl.pause().time(time,true);
   for(const svg of document.querySelectorAll<SVGSVGElement>('.day7-story-art')){
    if(opacity(svg)<.03)continue;stageChecks++;
    const r=svg.parentElement!.getBoundingClientRect();
    if(r.left<safe.left-.1||r.right>safe.right+.1||r.top<safe.top-.1||r.bottom>safe.bottom+.1)failures.push({kind:'STAGE_OUTSIDE_SAFE_FRAME',time,rect:{x:r.x,y:r.y,w:r.width,h:r.height}});
   }
  }
  for(const time of geometrySamples){
   tl.pause().time(time,true);
   for(const svg of document.querySelectorAll<SVGSVGElement>('.day7-story-art')){
    if(opacity(svg)<.03)continue;
    const outer=svg.getBoundingClientRect();
    for(const primitive of svg.querySelectorAll<SVGGraphicsElement>('path,rect,circle,ellipse,line,polyline,polygon')){
     if(opacity(primitive)<.03)continue;
     const r=primitive.getBoundingClientRect();if(r.width+r.height<1)continue;primitiveChecks++;
     if(r.left<outer.left-3||r.top<outer.top-3||r.right>outer.right+3||r.bottom>outer.bottom+3)failures.push({kind:'STORY_ART_CLIPPED',time,part:primitive.closest('[data-story-part]')?.getAttribute('data-story-part'),rect:{x:r.x,y:r.y,w:r.width,h:r.height},stage:{x:outer.x,y:outer.y,w:outer.width,h:outer.height}});
    }
   }
  }
  return {failures,stageChecks,primitiveChecks};
 },{samples,geometrySamples,safe:VISUAL_SAFE_FRAME});
 console.log('DAY7_QA_GEOMETRY_CHECKED',checks.stageChecks,checks.primitiveChecks);
 const revealCandidates=plan.sequences.flatMap((sequence:any)=>{
  const art=runtime.events.filter((item:any)=>item.sequence===sequence.id);
  return art.filter((item:any)=>Number(item.to.opacity)>=.65&&/story-future/.test(documentReadyArt(item.selector,sequence.id))).map((item:any)=>({selector:item.selector,at:item.at,after:item.at+(item.duration??.38)+.03}));
 });
 const firstReveal=new Map<string,any>();for(const item of revealCandidates)if(!firstReveal.has(item.selector))firstReveal.set(item.selector,item);
 const revealCases=[...firstReveal.values()];
 console.log('DAY7_QA_REVEAL_CASES',revealCases.length);
 // All initial-hidden groups must remain hidden before their first source-linked reveal.
 const futureChecks=await page.evaluate((events:any[])=>{
  const tl=(window as any).__timelines['news-video'];return events.map(item=>{
   const el=document.querySelector(item.selector);if(!el)return {...item,missing:true};
   tl.pause().time(Math.max(0,item.at-.002),true);const before=Number.parseFloat(getComputedStyle(el).opacity||'0');
   tl.pause().time(item.after,true);const after=Number.parseFloat(getComputedStyle(el).opacity||'0');
   return {...item,before,after,missing:false};
  });
 },revealCases);
 console.log('DAY7_QA_REVEALS_CHECKED',futureChecks.length);
 const revealFailures=futureChecks.filter(item=>item.missing||item.before>.02||item.after<.6);
 const outroSpacing=await page.evaluate(()=>{
  const tl=(window as any).__timelines['news-video'];
  const opacity=(el:Element)=>{let value=1;for(let parent:Element|null=el;parent;parent=parent.parentElement)value*=Number.parseFloat(getComputedStyle(parent).opacity||'0');return value;};
  return [49.05,49.15,49.25,49.35,49.5,50,55,60.2].map(time=>{
   tl.pause().time(time,true);
   const cta=document.querySelector<HTMLElement>('.out-cta-top')!,profile=document.querySelector<HTMLElement>('.tt-card')!;
   const board=[...document.querySelectorAll<SVGGElement>('#fm-single-choice-stage [data-story-part^="choice-"]')];
   const boardTop=Math.min(...board.map(item=>item.getBoundingClientRect().top));
   const boardBottom=Math.max(...board.map(item=>item.getBoundingClientRect().bottom));
   const ctaBottom=cta.getBoundingClientRect().bottom,profileTop=profile.getBoundingClientRect().top;
   return {time,ctaOpacity:opacity(cta),profileOpacity:opacity(profile),boardOpacity:opacity(board[0]),ctaToBoardGap:boardTop-ctaBottom,boardToProfileGap:profileTop-boardBottom};
  });
 });
 const outroFailures=outroSpacing.filter(item=>(item.ctaOpacity>.25&&item.boardOpacity>.25&&item.ctaToBoardGap<24)||(item.profileOpacity>.25&&item.boardOpacity>.25&&item.boardToProfileGap<24)).map(item=>({kind:'OUTRO_CTA_OR_PROFILE_COLLISION',...item}));
 const screenshots:string[]=[];
 const failures=[...checks.failures,...revealFailures,...outroFailures,...pageErrors.map(error=>({kind:'PAGE_ERROR',error}))];
 const report={status:failures.length?'FAIL':'PASS',day:7,gsapVersion:runtime.gsapVersion,fonts:runtime.fonts,sampleCount:samples.length,geometrySampleCount:geometrySamples.length,stageChecks:checks.stageChecks,primitiveChecks:checks.primitiveChecks,revealChecks:futureChecks.length,outroSpacing,storyEvents:runtime.events.length,failures,resourceErrors,screenshots,htmlSha256:await hash(join(out,'index.html')),voiceUnchangedFromParent:voiceUnchanged,wordBoundaryUnchangedFromParent:timingUnchanged,notes:'Real GSAP forward/reverse scene and event sampling, stage safe bounds, transformed SVG primitive bounds and CTA/profile spacing. Decoded MP4 QA and human review are separate.'};
 await writeFile(join(out,'illustration-qa.json'),JSON.stringify(report,null,2));
 await writeFile(join(out,'visual-review.json'),JSON.stringify({status:report.status==='PASS'?'AGENT_FRAME_REVIEW_PENDING':'FAIL',screenshots,review:'Decoded MP4 frame review pending. Chrome screenshot capture is unavailable on this host; human approval remains separate.'},null,2));
 console.log(JSON.stringify({status:report.status,samples:report.sampleCount,primitiveChecks:report.primitiveChecks,revealChecks:report.revealChecks,failures:failures.slice(0,12),screenshots:screenshots.length,resourceErrors:resourceErrors.slice(0,8)},null,2));
 if(report.status==='FAIL')process.exitCode=1;
}finally{await browser.close();await new Promise<void>(done=>server.close(()=>done()));}

function documentReadyArt(selector:string,sequenceId:string){
 // This is a source-level guard for groups marked initially hidden, not a DOM query.
 const part=selector.split(' ').at(-1)?.slice(1)??'';
 const source=readFileSyncArt(sequenceId);
 return source.includes(`class="${part} story-future"`)?'story-future':'';
}
function readFileSyncArt(sequenceId:string){
 const art=DAY7_STORY_ART[sequenceId];if(!art)throw new Error('DAY7_ART_MISSING');return art;
}
