import {readFile,writeFile,copyFile,mkdir,readdir,access} from "node:fs/promises";
import {createHash} from "node:crypto";
import {ScriptSchema} from "../src/render/script-schema.js";
import {APPROVED_SCRIPT_FILE as source,extractApprovedVoiceOver,assertScriptIntegrity,normalizeContractText as norm} from "../src/contracts/content-contract.js";
import {assertBenchmarkDestination} from "../src/contracts/benchmark-isolation.js";

const day=Number(process.argv[2]);
if(![4,5,6,7].includes(day))throw new Error("Day 4–7 only");
const out=`output/benchmarks/day-${day}-v12-differentactually`,legacy=`output/day-${day}`;
assertBenchmarkDestination(out);
try {await access(out);throw new Error("DESTINATION_EXISTS: preserve earlier evidence");} catch(e:any){if(e.code!=="ENOENT")throw e;}
const hash=async(p:string)=>createHash("sha256").update(await readFile(p)).digest("hex");
const files=[source,"money-habits-script-v2-optimized.md"];
for(const dir of [...[1,2,3,4,5,6,7].map(n=>`output/day-${n}`),"output/benchmarks/day-1-v12-editorial-r2","output/benchmarks/day-3-v12-differentactually"]){
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
const approved=extractApprovedVoiceOver(await readFile(source,"utf8"),day);
const old=ScriptSchema.parse(JSON.parse(await readFile(`${legacy}/script.json`,"utf8")));
const script=ScriptSchema.parse({...old,metadata:{...old.metadata,visualSystem:"1.2",source:{url:source,domain:source,image:null}}});
assertScriptIntegrity(script,approved);
// Old typography abbreviations are not the new numeric plan. Keep fallback
// copy source-exact too; never change a voiceText or a legacy artifact.
for(const scene of script.scenes)if(scene.templateData.template==="stat-hero"){
  if(day===5&&scene.id==="scene-3")scene.templateData.value="THREE OR FOUR";
  if(day===5&&scene.id==="scene-4")scene.templateData.value="EIGHT TO TWELVE";
  if(day===6&&scene.id==="scene-10")scene.templateData.value="FIVE DOLLARS A WEEK";
}
const transcript=JSON.parse(await readFile(`${legacy}/transcript.json`,"utf8"));
const outro=script.scenes.at(-1)!.templateData;
if(outro.template==="outro"&&day===5)outro.ctaTop="ACTUALLY LOOK";
if(outro.template==="outro"&&day===7)outro.ctaTop="TELL ME BELOW";
if(transcript.provider!=="edge-tts"||transcript.boundarySource!=="WordBoundary"||transcript.voiceId!=="en-US-AndrewMultilingualNeural")throw new Error("TRANSCRIPT_PROVIDER");
if(norm(transcript.scenes.flatMap((s:any)=>s.words.map((w:any)=>w.text)).join(" "))!==norm(approved))throw new Error("TRANSCRIPT_INTEGRITY");
transcript.sourceScript=source;
await copyFile(`${legacy}/voice.mp3`,`${out}/voice.mp3`);
const artifacts={
  "script.json":script,"transcript.json":transcript,
  "full-script-analysis.json":{day,source,approvedVoiceText:approved,analysis:await readFile("docs/day-4-7-v12-storyboards.md","utf8")},
  "visual-plan.json":{version:"1.1",day,primaryArchetype:day===5?"comparison":day===7?"checklist-habits":"concept-story",secondaryArchetype:day===4?"comparison":day===5?"accumulation":day===6?"timeline-frequency":"concept-story",rationale:({4:"Emotion triggers purchase and brief relief; a retained checkout becomes the place for the source-exact feeling question.",5:"The guessed three-or-four range contrasts with eight-to-twelve, followed by named forgotten categories and monthly observation without mandatory cancellation.",6:"Scarcity and fear yield to a tiny sourced weekly saving action; the same money stays visible in safekeeping rather than disappearing.",7:"Five source-named habits form a recap list, then a generic honest-question selection narrows attention to one without choosing for the viewer."} as Record<number,string>)[day],layoutDirection:day===5?"left-right":day===7?"vertical":"mixed",repeatedIconComposition:({4:"emotion-lanes;order-coffee;relief-bill;checkout-question",5:"guess-statement;two-endpoint-ranges;category-charge;monthly-review",6:"scarcity-wallet;knowing-feeling;weekly-five-safekeeping",7:"five-category-list;spreadsheet-question;generic-single-selection"} as Record<number,string>)[day]},
  "audio-reuse.json":{status:"PASS",ttsRegenerated:false,canonicalSource:source,source:`${legacy}/voice.mp3`,sourceSha256:await hash(`${legacy}/voice.mp3`),benchmarkSha256:await hash(`${out}/voice.mp3`),wordBoundariesUnchanged:true}
};
for(const [name,data] of Object.entries(artifacts))await writeFile(`${out}/${name}`,JSON.stringify(data,null,2));
await writeFile(`${out}/script.txt`,approved);
console.log("Prepared Day "+day+"; protected files:",files.length);
