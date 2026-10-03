import {readFile,writeFile,copyFile,mkdir,readdir,access} from "node:fs/promises";
import {createHash} from "node:crypto";
import {ScriptSchema} from "../src/render/script-schema.js";
import {APPROVED_SCRIPT_FILE as source,extractApprovedVoiceOver,assertScriptIntegrity,normalizeContractText as norm} from "../src/contracts/content-contract.js";
import {assertBenchmarkDestination} from "../src/contracts/benchmark-isolation.js";

const out="output/benchmarks/day-3-v12-differentactually",legacy="output/day-3";
assertBenchmarkDestination(out);
try {await access(out);throw new Error("DESTINATION_EXISTS: preserve earlier evidence");} catch(e:any){if(e.code!=="ENOENT")throw e;}
const hash=async(p:string)=>createHash("sha256").update(await readFile(p)).digest("hex");
const files=[source,"money-habits-script-v2-optimized.md"];
for(const dir of ["output/day-1","output/day-2","output/day-3","output/benchmarks/day-1-v12-editorial-r2"]){
  for(const e of await readdir(dir,{withFileTypes:true}))if(e.isFile())files.push(`${dir}/${e.name}`);
}
for(const dir of await readdir("output/benchmarks",{withFileTypes:true}))if(dir.isDirectory()){
  for(const e of await readdir(`output/benchmarks/${dir.name}`,{withFileTypes:true}))if(e.isFile()&&/\.mp4$/i.test(e.name)){
    const p=`output/benchmarks/${dir.name}/${e.name}`;if(!files.includes(p))files.push(p);
  }
}
const before=Object.fromEntries(await Promise.all(files.map(async p=>[p,await hash(p)])));
await mkdir(out,{recursive:true});
await writeFile(`${out}/protected-before.json`,JSON.stringify(before,null,2));
const approved=extractApprovedVoiceOver(await readFile(source,"utf8"),3);
const old=ScriptSchema.parse(JSON.parse(await readFile(`${legacy}/script.json`,"utf8")));
const script=ScriptSchema.parse({...old,metadata:{...old.metadata,visualSystem:"1.2",source:{url:source,domain:source,image:null}}});
assertScriptIntegrity(script,approved);
const transcript=JSON.parse(await readFile(`${legacy}/transcript.json`,"utf8"));
if(transcript.provider!=="edge-tts"||transcript.boundarySource!=="WordBoundary"||transcript.voiceId!=="en-US-AndrewMultilingualNeural")throw new Error("TRANSCRIPT_PROVIDER");
if(norm(transcript.scenes.flatMap((s:any)=>s.words.map((w:any)=>w.text)).join(" "))!==norm(approved))throw new Error("TRANSCRIPT_INTEGRITY");
transcript.sourceScript=source;
await copyFile(`${legacy}/voice.mp3`,`${out}/voice.mp3`);
const artifacts={
  "script.json":script,"transcript.json":transcript,
  "full-script-analysis.json":{day:3,source,approvedVoiceText:approved,primaryArchetype:"concept-story",secondaryArchetype:"accumulation",analysis:await readFile("docs/day-3-v12-storyboard.md","utf8")},
  "visual-plan.json":{version:"1.1",day:3,primaryArchetype:"concept-story",secondaryArchetype:"accumulation",rationale:"Source-supported mental excuse turns into actual coffee and phone-case purchases, then an unnumbered observation ledger. Four evolving compositions retain the objects and exact price tags; no derived total, spending scale, or invented daily schedule.",layoutDirection:"mixed",repeatedIconComposition:"cash-excuse;qualitative-deemphasis;coffee-phonecase-retained-prices;one-place-ledger"},
  "audio-reuse.json":{status:"PASS",ttsRegenerated:false,canonicalSource:source,source:`${legacy}/voice.mp3`,sourceSha256:await hash(`${legacy}/voice.mp3`),benchmarkSha256:await hash(`${out}/voice.mp3`),wordBoundariesUnchanged:true}
};
for(const [name,data] of Object.entries(artifacts))await writeFile(`${out}/${name}`,JSON.stringify(data,null,2));
await writeFile(`${out}/script.txt`,approved);
console.log("Day 3 prepared; protected files:",files.length);
