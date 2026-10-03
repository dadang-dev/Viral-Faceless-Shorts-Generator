import {access,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {createServer} from 'node:http';
import {join,resolve} from 'node:path';
import puppeteer from 'puppeteer-core';
import {VISUAL_SAFE_FRAME} from '../src/contracts/visual-collision.js';
import {DAY6_RICH_CHARACTER_OUT,DAY6_RICH_LAYOUT,DAY6_RICH_STORY_OUT} from './day6-rich-story-plan.js';
import {DAY6_RICH_CHARACTER_SFX_OUT,DAY6_RICH_STORY_SFX_OUT} from './day6-sfx.js';
import {DAY6_CHARACTER_ARTICULATION,DAY6_STORY_ART,DAY6_STORY_STEPS} from './day6-rich-story-art.js';

const outputArg=process.argv.find(argument=>argument.startsWith('--output='));
const out=resolve(outputArg?.slice('--output='.length)??DAY6_RICH_STORY_OUT);
if(![resolve(DAY6_RICH_STORY_OUT),resolve(DAY6_RICH_STORY_SFX_OUT),resolve(DAY6_RICH_CHARACTER_OUT),resolve(DAY6_RICH_CHARACTER_SFX_OUT)].includes(out))throw new Error('DAY6_STORY_QA_SCOPE');
const preview=join(out,'story-preview');
const hash=async(path:string)=>createHash('sha256').update(await readFile(path)).digest('hex');
for(const file of ['index.html','resolved-finance-plan.json','validation-report.json','protected-before.json'])await access(join(out,file));
await mkdir(preview,{recursive:true});
const plan=JSON.parse(await readFile(join(out,'resolved-finance-plan.json'),'utf8'));
const validation=JSON.parse(await readFile(join(out,'validation-report.json'),'utf8'));
const duration=validation.outroDwell.finalTargetSec;
const voiceSha256=await hash(join(out,'voice.mp3'));
const transcriptSha256=await hash(join(out,'transcript.json'));
const parent='output/benchmarks/day-6-v12-differentactually';
const voiceUnchanged=voiceSha256===await hash(join(parent,'voice.mp3'));
const transcriptUnchanged=transcriptSha256===await hash(join(parent,'transcript.json'));
if(!voiceUnchanged||!transcriptUnchanged)throw new Error('DAY6_SOURCE_AUDIO_OR_TIMING_CHANGED');

const server=createServer((request,response)=>{
 const requested=request.url==='/'?'/index.html':request.url??'/index.html';
 const file=resolve(out,`.${requested.split('?')[0]}`);
 if(!file.startsWith(out)){response.statusCode=403;response.end();return;}
 createReadStream(file).on('error',()=>{response.statusCode=404;response.end();}).pipe(response);
});
await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));
const address=server.address();if(!address||typeof address==='string')throw new Error('DAY6_QA_SERVER_ADDRESS');
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
  if(!w.gsap||!w.__timelines?.['news-video']||!w.__day6StoryEvents)throw new Error('DAY6_STORY_RUNTIME_MISSING');
  if(!fonts.some((font:string)=>font.includes('Anton'))||!fonts.some((font:string)=>font.includes('Inter')))throw new Error('DAY6_STORY_REQUIRED_FONTS_MISSING');
  return {gsapVersion:w.gsap.version,fonts,events:w.__day6StoryEvents};
 });
 if(runtime.events.length<24||plan.sequences.length!==4)throw new Error('DAY6_STORY_REQUIRED_EVENT_COUNT');

 const articulationCases=[
  {sequence:'tight-wallet',part:'protecting-hand',event:'last-one',name:'wallet-hand'},
  {sequence:'knowing-feeling',part:'fear-hand',event:'fear',name:'fear-hand'},
  {sequence:'weekly-safekeeping',part:'reaching-hand',event:'start',name:'reaching-hand'},
  {sequence:'weekly-safekeeping',part:'hand-release',event:'retained',name:'release-hand'},
 ].map(item=>{
  const sequence=plan.sequences.find((candidate:any)=>candidate.id===item.sequence)!;
  const event=sequence.motionEvents.find((candidate:any)=>candidate.id===item.event);
  const step=DAY6_STORY_STEPS[item.sequence].find(candidate=>candidate.event===item.event&&candidate.selector===`.${item.part}`);
  if(!event||!step)throw new Error(`DAY6_CHARACTER_ARTICULATION_EVENT_MISSING:${item.sequence}.${item.event}`);
  return {...item,time:Number((event.atSec+(step.duration??.38)+.05).toFixed(4))};
 });
 const points=new Set<number>(),geometryPoints=new Set<number>();
 for(const sequence of plan.sequences){
  points.add(Number(sequence.startSec.toFixed(4)));points.add(Number(sequence.endSec.toFixed(4)));
  for(const step of DAY6_STORY_STEPS[sequence.id]){
   const event=sequence.motionEvents.find((candidate:any)=>candidate.id===step.event);
   if(!event)throw new Error(`DAY6_STORY_EVENT_MISSING:${sequence.id}.${step.event}`);
   const at=step.event==='outro-clear'?validation.outroDwell.profileEntranceSec:event.atSec;
   const span=step.duration??.38;
   for(const delta of [-.01,span+.05])if(at+delta>=0&&at+delta<=duration)points.add(Number((at+delta).toFixed(4)));
   if(at+span/2<=duration)geometryPoints.add(Number((at+span/2).toFixed(4)));
  }
 }
 for(const item of articulationCases)geometryPoints.add(item.time);
 for(const sequence of plan.sequences)geometryPoints.add(Number(((sequence.startSec+sequence.endSec)/2).toFixed(4)));
 const forward=[...points].sort((a,b)=>a-b),seekOrder=[...forward,...forward.slice().reverse()];
 const geometryForward=[...geometryPoints].sort((a,b)=>a-b),geometrySeek=[...geometryForward,...geometryForward.slice().reverse()];
 console.log('Day6 story QA sampling scene/reveal states',seekOrder.length,'and transformed geometry states',geometrySeek.length);
 const checked=await page.evaluate(({samples,geometrySamples,safe,joints})=>{
  const w=window as any,tl=w.__timelines['news-video'],failures:any[]=[];let artSamples=0,boundsChecks=0;
  const opacity=(el:Element)=>{let value=1;for(let parent:Element|null=el;parent;parent=parent.parentElement)value*=Number.parseFloat(getComputedStyle(parent).opacity||'0');return value;};
  for(const time of samples){
   tl.pause().time(time,true);
   for(const svg of document.querySelectorAll<SVGSVGElement>('.day6-story-art')){
    if(opacity(svg)<.03)continue;
    artSamples++;
    const outer=svg.getBoundingClientRect(),stage=svg.parentElement!.getBoundingClientRect();
    if(stage.left<safe.left-.1||stage.right>safe.right+.1||stage.top<safe.top-.1||stage.bottom>safe.bottom+.1)failures.push({kind:'STORY_STAGE_OUTSIDE_SAFE_FRAME',time,sequence:svg.closest('.fm-sequence')?.id,rect:{x:stage.x,y:stage.y,w:stage.width,h:stage.height}});
    }
   }
  for(const time of geometrySamples){
   tl.pause().time(time,true);
   for(const svg of document.querySelectorAll<SVGSVGElement>('.day6-story-art')){
    if(opacity(svg)<.03)continue;
    const outer=svg.getBoundingClientRect();
    for(const primitive of svg.querySelectorAll<SVGGraphicsElement>('path,rect,circle,ellipse,line,polyline,polygon')){
     if(opacity(primitive)<.03)continue;
     const rect=primitive.getBoundingClientRect();if(rect.width+rect.height<1)continue;boundsChecks++;
     if(rect.left<outer.left-2||rect.top<outer.top-2||rect.right>outer.right+2||rect.bottom>outer.bottom+2)failures.push({kind:'STORY_ART_CLIPPED',time,sequence:svg.closest('.fm-sequence')?.id,part:primitive.closest('[data-story-part]')?.getAttribute('data-story-part'),rect:{x:rect.x,y:rect.y,w:rect.width,h:rect.height},stage:{x:outer.x,y:outer.y,w:outer.width,h:outer.height}});
    }
   }
  }
  const articulationChecks:any[]=[];
  const project=(element:SVGGraphicsElement,coordinates:number[])=>{const matrix=element.getScreenCTM();if(!matrix)throw new Error('DAY6_CHARACTER_SCREEN_MATRIX_MISSING');const point=element.ownerSVGElement!.createSVGPoint();point.x=coordinates[0];point.y=coordinates[1];return point.matrixTransform(matrix);};
  for(const item of joints){
   tl.pause().time(item.time,true);
   const stage=document.querySelector(`#fm-${item.sequence}-stage`),character=stage?.querySelector<SVGGElement>('.person-character'),hand=stage?.querySelector<SVGGElement>(`.${item.part}`);
   const wrist=character?.getAttribute('data-wrist-anchor')?.split(',').map(Number),anchor=hand?.getAttribute('data-wrist-anchor')?.split(',').map(Number);
   if(!character||!hand||!wrist||wrist.length!==2||!anchor||anchor.length!==2){articulationChecks.push({...item,status:'FAIL',kind:'CHARACTER_JOINT_METADATA_MISSING'});continue;}
   const armPoint=project(character,wrist),handPoint=project(hand,anchor),separationPx=Math.hypot(armPoint.x-handPoint.x,armPoint.y-handPoint.y);
   articulationChecks.push({...item,status:separationPx<=4?'PASS':'FAIL',separationPx:Number(separationPx.toFixed(3)),armPoint:{x:Number(armPoint.x.toFixed(2)),y:Number(armPoint.y.toFixed(2))},handPoint:{x:Number(handPoint.x.toFixed(2)),y:Number(handPoint.y.toFixed(2))}});
   if(separationPx>4)failures.push({...item,kind:'CHARACTER_JOINT_DISCONNECTED',separationPx});
  }
  return {failures,artSamples,boundsChecks,articulationChecks};
 },{samples:seekOrder,geometrySamples:geometrySeek,safe:VISUAL_SAFE_FRAME,joints:articulationCases});
 console.log('Day6 story QA geometry complete; checking hidden/revealed future artwork');

 const revealFailures:any[]=[],revealCases:any[]=[];
 for(const sequence of plan.sequences){
  const layout=DAY6_RICH_LAYOUT[sequence.id as keyof typeof DAY6_RICH_LAYOUT];
  const stage=sequence.elements.find((element:any)=>element.id==='stage');
  if(!layout||JSON.stringify(stage?.box)!==JSON.stringify(layout.stage))revealFailures.push({sequence:sequence.id,kind:'STAGE_PLAN_MISMATCH'});
  const future=[...DAY6_STORY_ART[sequence.id].matchAll(/class="([^"]*story-future[^"]*)"/g)];
  for(const match of future){
   const classes=match[1].split(/\s+/),className=classes.find((name:string)=>name!=='story-future')!;
   const steps=DAY6_STORY_STEPS[sequence.id].filter(step=>step.selector.includes(`.${className}`));
   if(!steps.length){revealFailures.push({sequence:sequence.id,className,kind:'UNBOUND_FUTURE_GROUP'});continue;}
   const event=sequence.motionEvents.find((candidate:any)=>candidate.id===steps[0].event);
   if(!event){revealFailures.push({sequence:sequence.id,className,kind:'MISSING_REVEAL_EVENT'});continue;}
   revealCases.push({sequence:sequence.id,className,event:event.id,atSec:event.atSec,selector:`#fm-${sequence.id}-stage .${className}`,before:Math.max(0,event.atSec-.002),after:Math.min(sequence.endSec-.001,event.atSec+.65)});
  }
 }
 const revealStates=await page.evaluate((cases:any[])=>{
  const timeline=(window as any).__timelines['news-video'];
  return cases.map(item=>{const element=document.querySelector(item.selector);if(!element)return {...item,missing:true,before:null,after:null};timeline.pause().time(item.before,true);const before=Number.parseFloat(getComputedStyle(element).opacity||'0');timeline.pause().time(item.after,true);const after=Number.parseFloat(getComputedStyle(element).opacity||'0');return {...item,missing:false,before,after};});
 },revealCases);
 console.log('Day6 story QA reveal states complete; capturing review stills');
 for(const state of revealStates)if(state.missing||Number(state.before)>.01||Number(state.after)<.65)revealFailures.push({...state,kind:'FUTURE_REVEAL_STATE'});

 const screenshots:string[]=[];
 const fixedStills:Array<[number,string]>=[[.6,'scarcity-hook'],[11,'college-memory'],[29,'fear-versus-advice'],[52.3,'coin-to-savings'],[59.8,'retained-coin-before-outro']];
 const eventStills=articulationCases.map(item=>[item.time,`character-${item.name}`] as [number,string]);
 for(const [time,name] of [...fixedStills,...eventStills]){
  await page.evaluate((t:number)=>{(window as any).__timelines['news-video'].pause().time(t,true);},time);
  const path=join(preview,`${name}.png`);await page.screenshot({path,fullPage:false});screenshots.push(path);console.log('Captured',name);
 }
 const brand=await page.evaluate(()=>{const el=document.querySelector('.brand-shell-header');if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
 if(pageErrors.length)revealFailures.push({kind:'BROWSER_PAGE_ERRORS',errors:pageErrors});
 const htmlSha256=await hash(join(out,'index.html'));
 const report={status:checked.failures.length||revealFailures.length?'FAIL':'PASS',day:6,runtime:{gsapVersion:runtime.gsapVersion,fonts:runtime.fonts},sampleCount:seekOrder.length,primitiveGeometrySamples:geometrySeek.length,artSamples:checked.artSamples,boundsChecks:checked.boundsChecks,articulation:{status:checked.articulationChecks.every((item:any)=>item.status==='PASS')?'PASS':'FAIL',maxSeparationPx:Math.max(0,...checked.articulationChecks.map((item:any)=>Number(item.separationPx??Infinity))),checks:checked.articulationChecks},temporalOrder:'forward plus backward seek at scene and reveal boundaries',storyEvents:runtime.events.length,stages:plan.sequences.map((sequence:any)=>({id:sequence.id,...DAY6_RICH_LAYOUT[sequence.id as keyof typeof DAY6_RICH_LAYOUT].stage})),safeFrame:VISUAL_SAFE_FRAME,brandRect:brand,failures:[...checked.failures,...revealFailures],screenshots:screenshots.map(path=>path.replaceAll('\\','/')),htmlSha256,voiceSha256,voiceUnchangedFromParent:voiceUnchanged,wordBoundarySha256:transcriptSha256,wordBoundaryUnchangedFromParent:transcriptUnchanged,resourceErrors,notes:'Real-GSAP shared temporal QA separately samples the full timeline. This episode-local report checks stage safety, transformed SVG bounds and rendered person-to-hand joint separation at the actual phrase-linked poses in forward and reverse seek. Screenshot/editorial review and decoded final-MP4 checks remain separate; no human visual/listening approval implied.'};
 await writeFile(join(out,'illustration-qa.json'),JSON.stringify(report,null,2));
 await writeFile(join(out,'visual-review.json'),JSON.stringify({status:report.status==='PASS'?'AGENT_FRAME_REVIEW_PENDING':'FAIL',screenshots:report.screenshots,review:'Review these previews and the decoded final MP4 before marking READY_FOR_VISUAL_REVIEW; user approval remains separate.'},null,2));
 console.log(JSON.stringify({status:report.status,samples:report.sampleCount,artSamples:report.artSamples,boundsChecks:report.boundsChecks,failures:report.failures.slice(0,12),screenshots:screenshots.length,resourceErrors:resourceErrors.slice(0,12)},null,2));
 if(report.status==='FAIL')process.exitCode=1;
}finally{
 await browser.close();await new Promise<void>(done=>server.close(()=>done()));
}
