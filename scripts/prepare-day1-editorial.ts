import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { APPROVED_SCRIPT_FILE, HISTORICAL_SCRIPT_FILE, REQUIRED_EDGE_VOICE, assertScriptIntegrity, extractApprovedVoiceOver, buildWordBoundaryTranscript } from "../src/contracts/content-contract.js";
import { ScriptSchema } from "../src/render/script-schema.js";
import { EdgeTtsClient } from "../src/tts/edge-tts-client.js";
import { getDurationSec, trimTrailingSilence, concatWithSilence } from "../src/assets/audio-tools.js";
import { mergeSceneSrts, mergeSceneKaraokeAss } from "../src/assets/subtitle-tools.js";
import { assertBenchmarkDestination } from "../src/contracts/benchmark-isolation.js";

const out = "output/benchmarks/day-1-v12-editorial";
assertBenchmarkDestination(out);
await mkdir(join(out,"voice"),{recursive:true});
const hash = async (p:string) => createHash("sha256").update(await readFile(p)).digest("hex");
const protectedFiles=[HISTORICAL_SCRIPT_FILE,...[1,2,3].flatMap(n=>["video.mp4","voice.mp3","transcript.json","subtitles.ass"].map(f=>`output/day-${n}/${f}`))];
const before=Object.fromEntries(await Promise.all(protectedFiles.map(async p=>[p,await hash(p)])));
const original=ScriptSchema.parse(JSON.parse(await readFile("output/day-1/script.json","utf8")));
const script=structuredClone(original);
script.metadata.visualSystem="1.2";
script.metadata.title="Day 1 v1.2 — Editorial/data-integrity benchmark";
const corrected:Record<string,string>={
  "scene-8":"But ten dollars, four nights a week, is about a hundred and seventy dollars a month.",
  "scene-9":"Number three: rounding it off in your head.",
  "scene-11":"Do that three times a week, and you've quietly spent over two hundred dollars a month on 'basically nothing.'",
};
for(const s of script.scenes){
  if(corrected[s.id]) s.voiceText=corrected[s.id];
  delete s.visualCues;
  delete s.statArrangement;
  // Finance sequences supply the visible composition. Keep legacy fallback copy source-exact.
  if(s.type==="body") s.templateData={template:"callout",statement:s.id==="scene-8"?"four nights a week":s.id==="scene-11"?"over two hundred dollars a month":s.voiceText.length<=80?s.voiceText:"subscription creep"};
}
const approved=extractApprovedVoiceOver(await readFile(APPROVED_SCRIPT_FILE,"utf8"),1);
assertScriptIntegrity(script,approved);
await writeFile(join(out,"script.json"),JSON.stringify(ScriptSchema.parse(script),null,2));
await writeFile(join(out,"script.txt"),approved);
console.log("EXACT APPROVED VO:",approved);
if(!process.argv.includes("--tts")) process.exit(0);
if(script.voice.voiceId!==REQUIRED_EDGE_VOICE || script.voice.speed!==.8) throw new Error("LOCKED_VOICE");
const client=new EdgeTtsClient({voice:REQUIRED_EDGE_VOICE,rate:"-20%",pitch:"+0Hz",volume:"+0%"});
const audio=[];
for(const scene of script.scenes){
  const mp3=join(out,"voice",`scene-${scene.id}.mp3`),srt=join(out,"voice",`scene-${scene.id}.srt`),trimmed=join(out,"voice",`trimmed-${scene.id}.mp3`);
  if(!corrected[scene.id]) {
    for(const [dst,base] of [[mp3,`scene-${scene.id}.mp3`],[srt,`scene-${scene.id}.srt`],[trimmed,`trimmed-${scene.id}.mp3`]]) await copyFile(join("output/day-1/voice",base),dst);
    console.log("REUSE UNCHANGED",scene.id);
  } else {
    const key=createHash("sha256").update(JSON.stringify({text:scene.voiceText,voice:REQUIRED_EDGE_VOICE,rate:"-20%",pitch:"+0Hz",volume:"+0%"})).digest("hex");
    let reuse=false;
    try{reuse=(await readFile(`${mp3}.key`,"utf8"))===key;await readFile(srt);await readFile(mp3);}catch{reuse=false;}
    if(!reuse){console.log("EDGE TTS",scene.id);await client.generate(scene.voiceText,mp3,srt);await writeFile(`${mp3}.key`,key);}
    await trimTrailingSilence(mp3,trimmed);
  }
  audio.push({id:scene.id,srtPath:srt,path:trimmed,durationSec:await getDurationSec(trimmed)});
}
const transcript=await buildWordBoundaryTranscript({scenes:audio,gapSec:.2,outputPath:join(out,"transcript.json"),voiceId:REQUIRED_EDGE_VOICE});
await concatWithSilence(audio.map(s=>s.path),.2,join(out,"voice.mp3"));
const timed=audio.map((s,i)=>({...s,startSec:transcript.scenes[i].startMs/1000}));
await mergeSceneSrts(timed,join(out,"subtitles.srt"));
await mergeSceneKaraokeAss(timed,join(out,"subtitles.ass"));
const after=Object.fromEntries(await Promise.all(protectedFiles.map(async p=>[p,await hash(p)])));
if(JSON.stringify(before)!==JSON.stringify(after)) throw new Error("IMMUTABLE_BASELINE");
await writeFile(join(out,"baseline-preservation.json"),JSON.stringify({status:"PASS",before,after},null,2));
console.log("EDITORIAL AUDIO READY",out);
