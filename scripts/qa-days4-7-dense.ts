import {readFile,writeFile,mkdir} from "node:fs/promises";
import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {resolve,join} from "node:path";

const day=Number(process.argv[2]);if(![4,5,6,7].includes(day))throw new Error("Day 4–7 required");
const out=resolve(process.argv.find(a=>a.startsWith("--output="))?.slice(9)??`output/benchmarks/day-${day}-v12-differentactually`),dir=join(out,"dense");
const plan=JSON.parse(await readFile(join(out,"resolved-finance-plan.json"),"utf8"));
const transcript=JSON.parse(await readFile(join(out,"transcript.json"),"utf8"));
const video=join(out,"video.mp4"),ffmpeg=process.env.MONEYHABITS_FFMPEG;
if(!ffmpeg)throw new Error("Explicit MONEYHABITS_FFMPEG required");
await mkdir(dir,{recursive:true});
const groups:Array<{name:string;frames:number[]}>=[];
for(const s of plan.sequences.slice(1)){
  const n=Math.floor(s.startSec*30);
  groups.push({name:"handoff-"+s.id,frames:Array.from({length:process.argv.includes('--transitions')?24:18},(_,i)=>n-(process.argv.includes('--transitions')?9:5)+i)});
}
for(const s of plan.sequences)for(const e of s.motionEvents){
  if(e.pose || e.action==="hide" || e.relation==="major-metric" || process.argv.includes('--all-events')){
    const n=Math.floor(e.atSec*30);
    groups.push({name:process.argv.includes('--all-events')?`${s.id}-${e.id}`:e.id,frames:Array.from({length:24},(_,i)=>n-4+i)});
  }
}
const validation=JSON.parse(await readFile(join(out,"validation-report.json"),"utf8"));const duration=validation.outroDwell.finalTargetSec;
for(let start=0;start<duration;start+=20)groups.push({name:"timeline-"+start,frames:Array.from({length:Math.min(20,Math.ceil(duration-start))},(_,i)=>Math.min(Math.floor(duration*30)-1,(start+i)*30))});
const run=(args:string[])=>new Promise<void>((done,fail)=>{
 const p=spawn(ffmpeg,args,{stdio:["ignore","ignore","pipe"]});let err="";
 p.stderr.on("data",d=>err+=d);p.on("error",fail);p.on("close",c=>c===0?done():fail(new Error(err)));
});
for(const g of groups){
 const select=g.frames.map(n=>`eq(n\\,${n})`).join("+");
 await run(["-v","error","-i",video,"-vf",`select='${select}',scale=216:384,tile=6x4:padding=3:margin=3`,"-frames:v","1","-y",join(dir,g.name+".png")]);
 console.log(g.name,g.frames[0],g.frames.at(-1));
}
await writeFile(join(dir,"manifest.json"),JSON.stringify({videoSha256:createHash("sha256").update(await readFile(video)).digest("hex"),fps:30,groups,lastWordBoundarySec:Math.max(...transcript.scenes.flatMap((s:any)=>s.words.map((w:any)=>w.globalEndMs)))/1000},null,2));
