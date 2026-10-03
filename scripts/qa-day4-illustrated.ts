import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createServer} from 'node:http';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import puppeteer from 'puppeteer-core';
import {ILLUSTRATED_OUT} from './day4-illustrated-plan.js';
import {TRANSITIONS_OUT} from './day4-transitions.js';
import {VISUAL_SAFE_FRAME} from '../src/contracts/visual-collision.js';
const out=resolve(process.argv.includes('--transitions')?TRANSITIONS_OUT:ILLUSTRATED_OUT),dir=join(out,'story-preview');await mkdir(dir,{recursive:true});
const server=createServer((req,res)=>{const p=resolve(out,'.'+(req.url==='/'?'/index.html':req.url??'').split('?')[0]);if(!p.startsWith(out)){res.statusCode=403;res.end();return;}createReadStream(p).on('error',()=>{res.statusCode=404;res.end();}).pipe(res);});
await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address() as any;
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--disable-gpu']});
try{
 const page=await browser.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 // tsx keepNames emits __name around locally declared callbacks serialized by Puppeteer.
 await page.evaluateOnNewDocument('window.__name = (fn, name) => fn');
 await page.setViewport({width:1080,height:1920,deviceScaleFactor:1});await page.goto(`http://127.0.0.1:${address.port}`,{waitUntil:'networkidle0'});
 const state=await page.evaluate(async()=>{await document.fonts.ready;const w=window as any;if(!w.gsap||!w.__day4StoryEvents)throw new Error('STORY_RUNTIME_MISSING');return {version:w.gsap.version,events:w.__day4StoryEvents,cuts:w.__day4Transitions??[],fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family)};});
 if(!state.fonts.some(f=>f.includes('Anton'))||!state.fonts.some(f=>f.includes('Inter')))throw new Error('STORY_FONT_MISSING');
 const times=new Set<number>();for(let t=0;t<56.21;t+=.1)times.add(Number(t.toFixed(3)));
 for(const e of state.events)for(const d of [-.001,0,.12,.38,.65,.9])times.add(Math.max(0,e.at+d));
 for(const c of state.cuts){for(let t=c.startSec-.1;t<c.endSec+.1;t+=1/30)times.add(t);times.add(c.coverSec);}
 const failures:any[]=[];
 for(const t of [...times].sort((a,b)=>a-b)){
  const bad=await page.evaluate(t=>{
   const w=window as any;w.__timelines['news-video'].pause().time(t,true);
   const visible=(el:Element)=>{let o=1;for(let p:Element|null=el;p;p=p.parentElement)o*=Number(getComputedStyle(p).opacity);return o>.03;};
   const problems:any[]=[];
   for(const svg of document.querySelectorAll<SVGSVGElement>('.story-art')){
    if(!visible(svg))continue;const outer=svg.getBoundingClientRect();
    for(const el of svg.querySelectorAll<SVGGraphicsElement>('path,rect,circle,ellipse')){if(!visible(el))continue;const r=el.getBoundingClientRect();if(r.width+r.height<1)continue;
     if(r.left<outer.left-2||r.top<outer.top-2||r.right>outer.right+2||r.bottom>outer.bottom+2)problems.push({kind:'ARTWORK_CLIPPING',scene:svg.closest('.fm-sequence')?.id,part:el.closest('[data-story-part]')?.getAttribute('data-story-part'),rect:{x:r.x,y:r.y,w:r.width,h:r.height}});
    }
    for(const el of svg.querySelectorAll('.story-future')){
     const first=w.__day4StoryEvents.filter((e:any)=>document.querySelector(e.selector)===el&&e.to.opacity>0).sort((a:any,b:any)=>a.at-b.at)[0];
     if(!first)problems.push({kind:'UNBOUND_FUTURE',part:el.getAttribute('class')});
     else if(t<first.at-.001&&visible(el))problems.push({kind:'EARLY_ARTWORK',part:el.getAttribute('class')});
    }
   }
   return problems;
  },t);failures.push(...bad.map(b=>({time:t,...b})));
 }
 const plan=JSON.parse(await readFile(join(out,'resolved-finance-plan.json'),'utf8'));
 const previewEvents=['wiring-connects','relief','coffee','bill','anxious','honest'];
 for(let i=0;i<plan.sequences.length;i++){const s=plan.sequences[i],e=s.motionEvents.find((e:any)=>e.id===previewEvents[i]);const time=Math.min(s.endSec-.2,e.atSec+.95);await page.evaluate(t=>{(window as any).__timelines['news-video'].pause().time(t,true);},time);await page.screenshot({path:join(dir,`${s.id}.png`)});}
 const report={status:failures.length||errors.length?'FAIL':'PASS',samples:times.size,runtime:state.version,loadedFonts:state.fonts,failures,pageErrors:errors,inputSha256:createHash('sha256').update(await readFile(join(out,'index.html'))).digest('hex'),notes:'Checks actual SVG primitive bounds and future-group visibility. Deliberate person/device/hand nesting is illustration; this check does not certify anatomical quality or all internal occlusions. Review sampled artwork and final MP4.'};
 await writeFile(join(out,'illustration-qa.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,failures:failures.slice(0,8)},null,2));if(report.status==='FAIL')process.exitCode=1;
 if(process.argv.includes('--transitions')){
  const transitionFailures:any[]=[];let samples=0;
  if(state.cuts.length!==5)transitionFailures.push({kind:'MISSING_TRANSITIONS'});
  // Forward and reverse seeks catch retained visibility and reset-state errors.
  const cutTimes=state.cuts.flatMap((c:any)=>[c.startSec-.01,...Array.from({length:21},(_,i)=>c.startSec+i/30),c.coverSec,c.endSec+.01]);
  for(const time of [...cutTimes,...cutTimes.slice().reverse()]){
   const bad=await page.evaluate(({time,safe})=>{
    const w=window as any;w.__timelines['news-video'].pause().time(time,true);const bad:any[]=[];
    for(const c of w.__day4Transitions){
     const el=document.getElementById(c.id)!;const style=getComputedStyle(el),r=el.getBoundingClientRect();
     const expected=time>=c.startSec&&time<c.endSec,visible=style.visibility==='visible';
     if(expected!==visible)bad.push({kind:'TRANSITION_VISIBILITY',id:c.id,time});
     if(r.left<safe.left-.1||r.right>safe.right+.1||r.top<safe.top-.1||r.bottom>safe.bottom+.1||style.overflow!=='hidden')bad.push({kind:'TRANSITION_VIEWPORT',id:c.id});
     if(el.textContent?.trim())bad.push({kind:'TRANSITION_SEMANTIC_COPY',id:c.id});
     if(Math.abs(time-c.coverSec)<.0001){const p=el.firstElementChild!.getBoundingClientRect();if(Math.abs(p.left-r.left)>1||Math.abs(p.right-r.right)>1)bad.push({kind:'TRANSITION_COVERAGE',id:c.id,actual:p.x});}
    }return bad;
   },{time,safe:VISUAL_SAFE_FRAME});transitionFailures.push(...bad);samples++;
  }
  for(const c of state.cuts)for(const [label,time] of [['enter',c.startSec+.16],['cover',c.coverSec],['exit',c.coverSec+.16]] as const){await page.evaluate(t=>{(window as any).__timelines['news-video'].pause().time(t,true);},time);await page.screenshot({path:join(dir,`${c.id}-${label}.png`)});}
  const result={status:transitionFailures.length||errors.length?'FAIL':'PASS',samples,transitions:state.cuts,inputSha256:report.inputSha256,runtime:state.version,failures:transitionFailures,pageErrors:errors,note:'Intentional shutter occlusion is clipped inside the semantic safe-area viewport. Captions and brand stay outside. Forward/reverse visibility checks plus decoded frame review are required.'};
  await writeFile(join(out,'transition-qa.json'),JSON.stringify(result,null,2));console.log('Transitions',result.status,samples,transitionFailures.slice(0,4));if(result.status==='FAIL')process.exitCode=1;
 }
}finally{await browser.close();await new Promise<void>(r=>server.close(()=>r()));}
