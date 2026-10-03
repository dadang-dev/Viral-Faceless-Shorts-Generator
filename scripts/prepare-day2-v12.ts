import {mkdir,readFile,writeFile,copyFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {ScriptSchema} from "../src/render/script-schema.js";
import {APPROVED_SCRIPT_FILE,extractApprovedVoiceOver,assertScriptIntegrity,normalizeContractText} from "../src/contracts/content-contract.js";
import {recommendVisualArchetypes} from "../src/planning/visual-variety.js";
import {assertBenchmarkDestination} from "../src/contracts/benchmark-isolation.js";
import {OBJECT_OUTPUT} from './day2-object-storyboard.js';

const out=process.env.DAY2_OUTPUT_DIR ?? "output/benchmarks/day-2-v12",legacy="output/day-2";
const repositoryRules=await readFile("AGENTS.md","utf8"),workflow=await readFile("workflow.md","utf8");
if(!repositoryRules.includes("Canonical source")||!workflow.includes("Day 1-aligned Workflow"))throw new Error("INSTRUCTION_LOCK: required Money Habits rule files are missing");
assertBenchmarkDestination(out);await mkdir(out,{recursive:true});
const sourceText=await readFile(APPROVED_SCRIPT_FILE,"utf8"),approved=extractApprovedVoiceOver(sourceText,2);
const old=ScriptSchema.parse(JSON.parse(await readFile(`${legacy}/script.json`,"utf8")));
const script=ScriptSchema.parse({...old,metadata:{...old.metadata,visualSystem:"1.2",source:{url:APPROVED_SCRIPT_FILE,domain:APPROVED_SCRIPT_FILE,image:null}}});
assertScriptIntegrity(script,approved);
const transcript=JSON.parse(await readFile(`${legacy}/transcript.json`,"utf8"));
if(transcript.provider!=="edge-tts"||transcript.boundarySource!=="WordBoundary"||transcript.voiceId!=="en-US-AndrewMultilingualNeural")throw new Error("TRANSCRIPT: approved Edge WordBoundary required");
if(normalizeContractText(transcript.scenes.flatMap((scene:any)=>scene.words.map((word:any)=>word.text)).join(" "))!==normalizeContractText(approved))throw new Error("TRANSCRIPT_INTEGRITY: reused Day 2 boundaries do not match canonical v2.1");
transcript.sourceScript=APPROVED_SCRIPT_FILE;
const recommendation=recommendVisualArchetypes({approvedVoice:approved,approvedMetricCount:2});
const analysis={version:"1.2",day:2,source:APPROVED_SCRIPT_FILE,approvedVoiceText:approved,centralThesis:"A raise does not prevent feeling broke when small reasonable choices continuously reset lifestyle spending upward.",primaryArchetype:"concept-story",secondaryArchetype:"accumulation",historicalClassificationReviewed:true,historicalClassificationRetainedBecause:"The full narration is behavioral and explicitly progresses through several small choices before saying to stack them up; the classification is content-supported, not inherited.",actualNumericRelationships:[{phrase:"two hundred dollars more a month",display:"$200 / MONTH",relationship:"single approved incremental apartment cost",chartDecision:"single fact → restrained metric reveal; no chart"},{phrase:"six months later",display:"6 MONTHS",relationship:"exact time interval",chartDecision:"time-passage metric with calendar animation; no chart"}],conceptualRelationships:["raise → still feel broke six months later → lifestyle creep","apartment + car upgrade + appetizer and dessert → accumulated lifestyle baseline","stacked choices → spending rises as fast as income, sometimes faster","not deprivation → wanted this vs because I could → honest noticing"],visualModels:["retained expectation-reversal hook with time-passage metric","stateful lifestyle accumulation without connector arrows","qualitative parallel state tracks (no quantitative scale)","spatially separated decision fork"],motionOpportunities:["raise state clears into broke while an exact 6 MONTHS calendar metric punches in","lifestyle choices mutate in one clean top/middle/lower lane system","$200 / MONTH gets one strong reveal, then becomes a secondary retained tag","car mutates used → new lease without a stray connector or text collision","appetizer and dessert join as separate lower-lane objects","spending and income tracks expand together, then spending moves slightly ahead","question branches into wanted vs could with icon/text gaps enforced by entity groups"],transitionSemantics:"180ms ambient crossfade; clean dominant foreground handoff; within related ideas use state mutation/progression",recentVisualHistory:{day1R2:"checklist/stat and finance-frequency system",day2Direction:"continuous spatial state system with explicit time passage, clean accumulation lanes and a separated decision fork; no Day 1 sequence copy"},workflowSource:"workflow.md"};
const visualPlan={version:"1.1",day:2,primaryArchetype:"concept-story",secondaryArchetype:"accumulation",rationale:"The full narration is rendered as a continuous state story: a raise reverses into a broke six-month time jump, lifestyle choices mutate through clean lanes, qualitative spending/income tracks grow semantically, and wanted-versus-could branches stay separated. The only financial value is the sourced $200/month; 6 MONTHS is an exact time interval with a calendar metric. No connector arrows or invented data are used. Workflow lock: workflow.md.",layoutDirection:"mixed",repeatedIconComposition:"time-jump:calendar-wallet;accumulation:home-car-meal;comparison:expanding-state-tracks;decision:separated-wanted-vs-could"};
await Promise.all([copyFile(`${legacy}/voice.mp3`,`${out}/voice.mp3`),writeFile(`${out}/script.json`,JSON.stringify(script,null,2)),writeFile(`${out}/script.txt`,approved),writeFile(`${out}/transcript.json`,JSON.stringify(transcript,null,2)),writeFile(`${out}/full-script-analysis.json`,JSON.stringify(analysis,null,2)),writeFile(`${out}/visual-plan.json`,JSON.stringify(visualPlan,null,2))]);
if(out.replaceAll('\\','/')===OBJECT_OUTPUT||process.env.DAY2_OBJECT_STORYBOARD==='1'){
  analysis.primaryArchetype='accumulation';analysis.secondaryArchetype='comparison';
  analysis.historicalClassificationRetainedBecause='Superseded by the explicitly approved object-led storyboard: accumulation is the main visual argument, comparison supplies its consequence.';
  visualPlan.primaryArchetype='accumulation';visualPlan.secondaryArchetype='comparison';
  visualPlan.rationale='Approved object-led storyboard: calendar time passage, distinct apartment/car/meal silhouettes, retained objects through stack them up, qualitative synchronized spending/income progression, and separated wanted/could branches. Exact canonical narration; no numerical comparison scale.';
  visualPlan.repeatedIconComposition='calendar-page;object-led-home-car-food;retained-choice-cluster;qualitative-dual-tracks;separated-choice';
  await writeFile(`${out}/full-script-analysis.json`,JSON.stringify(analysis,null,2));
  await writeFile(`${out}/visual-plan.json`,JSON.stringify(visualPlan,null,2));
}
const hash=async(file:string)=>createHash("sha256").update(await readFile(file)).digest("hex");
await writeFile(`${out}/audio-reuse.json`,JSON.stringify({status:"PASS",ttsRegenerated:false,source:`${legacy}/voice.mp3`,sourceSha256:await hash(`${legacy}/voice.mp3`),benchmarkSha256:await hash(`${out}/voice.mp3`),transcriptProvider:"edge-tts",boundarySource:"WordBoundary",canonicalSource:APPROVED_SCRIPT_FILE},null,2));
console.log("DAY 2 v1.2 ANALYSIS READY",analysis);
