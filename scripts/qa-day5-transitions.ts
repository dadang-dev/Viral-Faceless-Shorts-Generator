import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {access,readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {join,resolve} from 'node:path';
import puppeteer from 'puppeteer-core';
import {VISUAL_SAFE_FRAME} from '../src/contracts/visual-collision.js';
import {day5Transitions,DAY5_TRANSITIONS_OUT,DAY5_TRANSITION_STYLE} from './day5-transitions.js';

const out=resolve(DAY5_TRANSITIONS_OUT),htmlPath=join(out,'index.html');
await access(htmlPath);
const plan=JSON.parse(await readFile(join(out,'resolved-finance-plan.json'),'utf8'));
const expected=day5Transitions(plan);
const browser=await puppeteer.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true,protocolTimeout:300000,args:['--no-sandbox','--disable-gpu']});
const server=createServer((request,response)=>{
 const path=resolve(out,`.${request.url==='/'?'/index.html':(request.url??'/index.html').split('?')[0]}`);
 if(!path.startsWith(out)){response.statusCode=403;response.end();return;}
 createReadStream(path).on('error',()=>{response.statusCode=404;response.end();}).pipe(response);
});
await new Promise<void>(done=>server.listen(0,'127.0.0.1',done));
const address=server.address();if(!address||typeof address==='string')throw new Error('QA_SERVER_ADDRESS');
const pageErrors:string[]=[];
try{
 const page=await browser.newPage();
 page.on('pageerror',error=>pageErrors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')pageErrors.push(message.text());});
 await page.setViewport({width:1080,height:1920,deviceScaleFactor:1});
 // Media elements can keep the network active for the whole composition; only
 // wait for the document itself, then validate GSAP/fonts explicitly below.
 await page.goto(`http://127.0.0.1:${address.port}/index.html`,{waitUntil:'domcontentloaded',timeout:30000});
 console.log('TRANSITION_QA_DOCUMENT_READY');
 const runtime=await page.evaluate(async()=>{
  await document.fonts.ready;
  const w=window as any,fonts=[...document.fonts].filter((font:any)=>font.status==='loaded').map((font:any)=>font.family);
  if(!w.gsap||!w.__timelines?.['news-video']||!w.__day5Transitions)throw new Error('DAY5_TRANSITION_RUNTIME_MISSING');
  if(!fonts.some((font:string)=>font.includes('Anton'))||!fonts.some((font:string)=>font.includes('Inter')))throw new Error('DAY5_TRANSITION_FONTS_MISSING');
  return {gsapVersion:w.gsap.version,fonts,cuts:w.__day5Transitions};
 });
 console.log('TRANSITION_QA_RUNTIME_READY');
 const failures:any[]=[];let samples=0;
 if(runtime.cuts.length!==expected.length)failures.push({kind:'TRANSITION_COUNT',expected:expected.length,actual:runtime.cuts.length});
 for(let i=0;i<Math.min(expected.length,runtime.cuts.length);i++){
  const a=runtime.cuts[i],b=expected[i];
  if(a.id!==b.id||Math.abs(a.boundarySec-b.boundarySec)>.001||Math.abs(a.startSec-b.startSec)>.001||Math.abs(a.endSec-b.endSec)>.001)failures.push({kind:'TRANSITION_PLAN_MISMATCH',index:i,actual:a,expected:b});
 }
 const {leadSec,coverSec,exitSec}=DAY5_TRANSITION_STYLE;
 const phases=expected.flatMap(cut=>[
  {id:cut.id,time:cut.startSec-.001,label:'before-entry'},
  {id:cut.id,time:cut.startSec+leadSec/2,label:'entry-midpoint'},
  {id:cut.id,time:cut.boundarySec,label:'scene-boundary'},
  {id:cut.id,time:cut.startSec+coverSec,label:'full-cover'},
  {id:cut.id,time:cut.startSec+coverSec+exitSec/2,label:'exit-midpoint'},
  {id:cut.id,time:cut.endSec,label:'after-exit'},
 ]).sort((a,b)=>a.time-b.time);
 const checks=[...phases,...phases.slice().reverse()];
 const checked=await page.evaluate((sampleStates:{id:string;time:number;label:string}[])=>{
  const w=window as any,tl=w.__timelines['news-video'];
  return sampleStates.map(sample=>{
   tl.pause().time(sample.time,true);
   const el=document.getElementById(sample.id)!,panel=el.querySelector('.day5-transition-panel')!,style=getComputedStyle(el),r=el.getBoundingClientRect(),p=panel.getBoundingClientRect();
   return {id:sample.id,visible:style.visibility==='visible',pointerEvents:style.pointerEvents,overflow:style.overflow,rect:{x:r.x,y:r.y,w:r.width,h:r.height},panel:{x:p.x,y:p.y,w:p.width,h:p.height}};
  });
 },checks);
 for(let sampleIndex=0;sampleIndex<checks.length;sampleIndex++){
  const sample=checks[sampleIndex],time=sample.time,item=checked[sampleIndex];
  samples++;
  const cut=expected.find(candidate=>candidate.id===sample.id)!,visible=time>=cut.startSec&&time<cut.endSec;
  if(item.visible!==visible)failures.push({kind:'VISIBILITY_STATE',time,phase:sample.label,id:item.id,expected:visible,actual:item.visible});
  if(Math.abs(item.rect.x-VISUAL_SAFE_FRAME.left)>1||Math.abs(item.rect.y-VISUAL_SAFE_FRAME.top)>1||Math.abs(item.rect.w-(VISUAL_SAFE_FRAME.right-VISUAL_SAFE_FRAME.left))>1||Math.abs(item.rect.h-(VISUAL_SAFE_FRAME.bottom-VISUAL_SAFE_FRAME.top))>1)failures.push({kind:'SAFE_VIEWPORT',time,id:item.id,rect:item.rect});
  if(item.pointerEvents!=='none'||item.overflow!=='hidden')failures.push({kind:'LAYER_CONTRACT',time,id:item.id,pointerEvents:item.pointerEvents,overflow:item.overflow});
  const top=VISUAL_SAFE_FRAME.top,height=VISUAL_SAFE_FRAME.bottom-VISUAL_SAFE_FRAME.top;
  if(item.panel.x<VISUAL_SAFE_FRAME.left-1||item.panel.x+item.panel.w>VISUAL_SAFE_FRAME.right+1||item.panel.y<top-height-2||item.panel.y+item.panel.h>VISUAL_SAFE_FRAME.bottom+height+2)failures.push({kind:'PANEL_TRAVEL_BOUNDS',time,id:item.id,panel:item.panel});
 }
 if(pageErrors.length)failures.push({kind:'BROWSER_ERRORS',errors:pageErrors});
 const report={status:failures.length?'FAIL':'PASS',day:5,samples,order:'forward-and-reverse',samplePhases:[...new Set(phases.map(phase=>phase.label))],runtime:{gsapVersion:runtime.gsapVersion,fonts:runtime.fonts},transitions:runtime.cuts,inputSha256:createHash('sha256').update(await readFile(htmlPath)).digest('hex'),viewport:{...VISUAL_SAFE_FRAME},captionsAndBrand:'outside the clipped transition viewport; inspected again in final MP4 strips',failures,note:'Intentional shutter occlusion is limited to the shared safe viewport. This visual-only branch does not modify voice, WordBoundary, subtitles, or SFX.'};
 await writeFile(join(out,'transition-qa.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({status:report.status,samples,transitions:report.transitions.length,failures:failures.slice(0,5)},null,2));
 if(report.status==='FAIL')process.exitCode=1;
}finally{await browser.close();await new Promise<void>(done=>server.close(()=>done()));}
