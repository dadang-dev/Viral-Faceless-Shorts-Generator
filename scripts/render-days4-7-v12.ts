import { readFile, writeFile, copyFile, mkdir, readdir, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { resolve, join, relative } from "node:path";
import { ScriptSchema } from "../src/render/script-schema.js";
import { APPROVED_SCRIPT_FILE, HISTORICAL_SCRIPT_FILE, AUXILIARY_SCRIPT_FILE, NumberHighlightFileSchema, extractApprovedVoiceOver, assertScriptIntegrity, assertTemplateScenePlan, assertMoneyHabitsTheme, auditVisibleText, resolveNumberHighlights } from "../src/contracts/content-contract.js";
import { compileFinancePlan, assessFinanceDataViz, assessMotionSemantics, assertFinanceHighlights, financeVisualCues } from "../src/contracts/finance-motion.js";
import { assessEditorial } from "../src/contracts/editorial-validation.js";
import { resolveHeroCaptions, editorialKaraokeAss } from "../src/contracts/hero-captions.js";
import { validateNumericRelationships } from "../src/contracts/numeric-relationships.js";
import { evaluateProductionVisualVariety, persistProductionValidation, assertProductionAllowed } from "../src/contracts/production-validation.js";
import { planOutroDwell, assessProductionDuration } from "../src/contracts/production-duration.js";
import { assessSceneDynamics } from "../src/planning/scene-dynamics.js";
import { composeHtml } from "../src/render/html-composer.js";
import { renderWithHyperframes } from "../src/render/hyperframes-runner.js";
import { burnSubtitles } from "../src/assets/subtitle-tools.js";
import { getVideoDurationSec } from "../src/assets/audio-tools.js";
import { assertBenchmarkDestination } from "../src/contracts/benchmark-isolation.js";
import { LOCKED_PAGE_BRAND } from "../src/brand-config.js";
import {decorateIllustratedDay4} from './day4-illustrated-art.js';
import {ILLUSTRATED_OUT} from './day4-illustrated-plan.js';
import {TRANSITIONS_OUT,decorateDay4Transitions} from './day4-transitions.js';
import {DAY5_TRANSITIONS_OUT,day5Transitions,decorateDay5Transitions} from './day5-transitions.js';
import {DAY5_RICH_STORY_OUT,extendDay5RichVisualThroughOutro} from './day5-rich-story-plan.js';
import {decorateDay5RichStory} from './day5-rich-story-art.js';
import {DAY6_RICH_CHARACTER_OUT,DAY6_RICH_STORY_OUT,extendDay6RichVisualThroughOutro} from './day6-rich-story-plan.js';
import {decorateDay6RichStory} from './day6-rich-story-art.js';
import {DAY7_RICH_STORY_OUT,extendDay7RichVisualThroughOutro} from './day7-rich-story-plan.js';
import {decorateDay7RichStory} from './day7-rich-story-art.js';

const day=Number(process.argv[2]);if(![4,5,6,7].includes(day))throw new Error("Day 4–7 required");
const out=resolve(process.argv.find(a=>a.startsWith("--output="))?.slice(9)??`output/benchmarks/day-${day}-v12-differentactually`);assertBenchmarkDestination(out);
const sensory=process.argv.includes("--day4-sensory");
const sixScene=process.argv.includes("--day4-six-scene");
const transitions=process.argv.includes('--day4-transitions');
const day5TransitionsEnabled=process.argv.includes('--day5-transitions');
const day5RichStoryEnabled=process.argv.includes('--day5-rich-story');
const day5RichStoryResume=process.argv.includes('--resume-day5-rich-story');
const day6CharacterRevisionEnabled=process.argv.includes('--day6-character-revision');
const day6RichStoryEnabled=process.argv.includes('--day6-rich-story')||day6CharacterRevisionEnabled;
const day6RichStoryResume=process.argv.includes('--resume-day6-rich-story');
const day7RichStoryEnabled=process.argv.includes('--day7-rich-story');
const day7RichStoryResume=process.argv.includes('--resume-day7-rich-story');
const illustrated=process.argv.includes('--day4-illustrated')||transitions;
if(illustrated&&(day!==4||sensory||sixScene||out!==resolve(transitions?TRANSITIONS_OUT:ILLUSTRATED_OUT)))throw new Error('ILLUSTRATED_SCOPE');
if(sixScene&&(day!==4||sensory||out!==resolve("output/benchmarks/day-4-v12-six-scene")))throw new Error("SIX_SCENE_SCOPE");
if(sensory&&(day!==4||out!==resolve("output/benchmarks/day-4-v12-texture-sfx")))throw new Error("SENSORY_SCOPE");
if(day5TransitionsEnabled&&(day!==5||sensory||sixScene||illustrated||transitions||out!==resolve(DAY5_TRANSITIONS_OUT)))throw new Error("DAY5_TRANSITION_SCOPE");
if(day5RichStoryEnabled&&(day!==5||sensory||sixScene||illustrated||transitions||day5TransitionsEnabled||out!==resolve(DAY5_RICH_STORY_OUT)))throw new Error('DAY5_RICH_STORY_SCOPE');
if(day6CharacterRevisionEnabled&&process.argv.includes('--day6-rich-story'))throw new Error('DAY6_CHARACTER_REVISION_FLAGS_CONFLICT');
if(day6RichStoryEnabled&&(day!==6||sensory||sixScene||illustrated||transitions||day5TransitionsEnabled||day5RichStoryEnabled||out!==resolve(day6CharacterRevisionEnabled?DAY6_RICH_CHARACTER_OUT:DAY6_RICH_STORY_OUT)))throw new Error('DAY6_RICH_STORY_SCOPE');
if(day7RichStoryEnabled&&(day!==7||sensory||sixScene||illustrated||transitions||day5TransitionsEnabled||day5RichStoryEnabled||day6RichStoryEnabled||out!==resolve(DAY7_RICH_STORY_OUT)))throw new Error('DAY7_RICH_STORY_SCOPE');
if(out===resolve(DAY5_TRANSITIONS_OUT)&&!day5TransitionsEnabled)throw new Error("DAY5_TRANSITION_FLAG_REQUIRED");
if(out===resolve(DAY5_RICH_STORY_OUT)&&!day5RichStoryEnabled)throw new Error('DAY5_RICH_STORY_FLAG_REQUIRED');
if(out===resolve(DAY6_RICH_STORY_OUT)&&!day6RichStoryEnabled)throw new Error('DAY6_RICH_STORY_FLAG_REQUIRED');
if(out===resolve(DAY6_RICH_CHARACTER_OUT)&&!day6CharacterRevisionEnabled)throw new Error('DAY6_CHARACTER_REVISION_FLAG_REQUIRED');
if(out===resolve(DAY7_RICH_STORY_OUT)&&!day7RichStoryEnabled)throw new Error('DAY7_RICH_STORY_FLAG_REQUIRED');
if(day5TransitionsEnabled)for(const file of ["index.html","video.mp4"]){try{await access(join(out,file));throw new Error("DAY5_TRANSITION_ARTIFACT_EXISTS: preserve prior review output");}catch(error:any){if(error.code!=="ENOENT")throw error;}}
if(day5RichStoryEnabled){
 for(const file of ['video.mp4','video-raw.mp4','video-without-sfx.mp4','video-sfx-staging.mp4'])try{await access(join(out,file));throw new Error('DAY5_RICH_STORY_MEDIA_EXISTS: preserve prior review output');}catch(error:any){if(error.code!=='ENOENT')throw error;}
 let htmlExists=false;try{await access(join(out,'index.html'));htmlExists=true;}catch(error:any){if(error.code!=='ENOENT')throw error;}
 if(htmlExists&&!day5RichStoryResume)throw new Error('DAY5_RICH_STORY_HTML_EXISTS: use --resume-day5-rich-story only before the first encode');
 if(day5RichStoryResume&&!htmlExists)throw new Error('DAY5_RICH_STORY_RESUME_REQUIRES_PREFLIGHT_HTML');
}
if(day6RichStoryEnabled){
 for(const file of ['video.mp4','video-raw.mp4','video-with-sfx.mp4'])try{await access(join(out,file));throw new Error('DAY6_RICH_STORY_MEDIA_EXISTS: preserve prior review output');}catch(error:any){if(error.code!=='ENOENT')throw error;}
 let htmlExists=false;try{await access(join(out,'index.html'));htmlExists=true;}catch(error:any){if(error.code!=='ENOENT')throw error;}
 if(htmlExists&&!day6RichStoryResume)throw new Error('DAY6_RICH_STORY_HTML_EXISTS: use --resume-day6-rich-story only before the first encode');
 if(day6RichStoryResume&&!htmlExists)throw new Error('DAY6_RICH_STORY_RESUME_REQUIRES_PREFLIGHT_HTML');
}
if(day7RichStoryEnabled){
 for(const file of ['video.mp4','video-raw.mp4'])try{await access(join(out,file));throw new Error('DAY7_RICH_STORY_MEDIA_EXISTS: preserve prior review output');}catch(error:any){if(error.code!=='ENOENT')throw error;}
 let htmlExists=false;try{await access(join(out,'index.html'));htmlExists=true;}catch(error:any){if(error.code!=='ENOENT')throw error;}
 if(htmlExists&&!day7RichStoryResume)throw new Error('DAY7_RICH_STORY_HTML_EXISTS: use --resume-day7-rich-story only before first encode');
 if(day7RichStoryResume&&!htmlExists)throw new Error('DAY7_RICH_STORY_RESUME_REQUIRES_PREFLIGHT_HTML');
}
const json=async(p:string)=>JSON.parse(await readFile(p,"utf8"));
const hash=async(p:string)=>createHash("sha256").update(await readFile(p)).digest("hex");
const before=await json(join(out,"protected-before.json"));
const protectedFiles=Object.keys(before);
for(const p of protectedFiles)if(await hash(p)!==before[p])throw new Error("BASELINE_CHANGED: "+p);
function command(cmd:string,args:string[],shell=false):Promise<string>{return new Promise((done,fail)=>{let output="";const p=spawn(cmd,args,{shell,stdio:["ignore","pipe","pipe"]});for(const stream of [p.stdout,p.stderr])stream.on("data",d=>{output+=d;process.stdout.write(d);});p.on("error",fail);p.on("close",code=>code===0?done(output):fail(new Error(`${cmd}: exit ${code}`)));});}

const script=ScriptSchema.parse(await json(join(out,"script.json"))),transcript=await json(join(out,"transcript.json")),input=await json(join(out,"data_visualizations.json"));
const approved=extractApprovedVoiceOver(await readFile(APPROVED_SCRIPT_FILE,"utf8"),day);assertScriptIntegrity(script,approved);
if(input.source!==APPROVED_SCRIPT_FILE||!input.editorial)throw new Error("SOURCE_REVISION: Day 4–7 canonical editorial sidecar required");
if(day6RichStoryEnabled&&!input.sequences?.every((sequence:any)=>sequence.elements.some((element:any)=>element.id==='stage')))throw new Error('DAY6_RICH_STORY_PLAN_NOT_PREPARED');
if(day7RichStoryEnabled&&!input.sequences?.every((sequence:any)=>sequence.elements.some((element:any)=>element.id==='stage')))throw new Error('DAY7_RICH_STORY_PLAN_NOT_PREPARED');
const dwell=planOutroDwell(transcript,.2,3);
const compiledFinance=compileFinancePlan(input,script,transcript,approved);
const finance=day5RichStoryEnabled?extendDay5RichVisualThroughOutro(compiledFinance,dwell.finalTargetSec):day6RichStoryEnabled?extendDay6RichVisualThroughOutro(compiledFinance,dwell.profileEntranceSec):day7RichStoryEnabled?extendDay7RichVisualThroughOutro(compiledFinance,dwell.finalTargetSec):compiledFinance;
const i=assessFinanceDataViz(input,script,transcript,approved),j=assessMotionSemantics(finance);
const captions=resolveHeroCaptions(await json(join(out,"hero-captions.json")),finance,transcript);
const editorial=assessEditorial(finance,transcript,captions,script),numeric=validateNumericRelationships(input.data,input.relationships??[]);
const numbers=NumberHighlightFileSchema.parse(await json(join(out,"number_highlights.json"))),highlights=resolveNumberHighlights(numbers,transcript);assertFinanceHighlights(finance,highlights);
const baselineHtml=await readFile(`output/day-${day}/index.html`,"utf8");
const tiktok={displayName:LOCKED_PAGE_BRAND.displayName,handle:LOCKED_PAGE_BRAND.handle,followers:baselineHtml.match(/class="tt-followers">([^<]*)/)?.[1]??"Daily money habits"};
const visible=auditVisibleText({script,approvedVoice:approved,auxiliaryMarkdown:await readFile(AUXILIARY_SCRIPT_FILE,"utf8"),numberHighlights:numbers,brandConfig:[script.metadata.channel,...Object.values(tiktok),LOCKED_PAGE_BRAND.tagline]});
let html=composeHtml({script,financePlan:finance,sceneAudio:transcript.scenes.map((s:any)=>({id:s.id,durationSec:s.durationMs/1000,lastWordEndSec:s.words.at(-1).endMs/1000})),gapSec:.2,bgImageRelPath:null,audioRelPath:"voice.mp3",tiktok,tiktokAvatarRelPath:"tiktok-avatar.svg",outroHoldSec:dwell.outroHoldSec,numberHighlights:highlights});
const css=await readFile("src/render/templates/styles.css","utf8");assertMoneyHabitsTheme(css,html);
if(sensory||sixScene||illustrated||day5RichStoryEnabled)html=html.replace("</head>",`<style>${await readFile(join(out,"sensory.css"),"utf8")}</style></head>`);
if(illustrated)html=decorateIllustratedDay4(html,finance);
if(transitions)html=decorateDay4Transitions(html,finance);
if(day5RichStoryEnabled)html=decorateDay5RichStory(html,finance);
if(day6RichStoryEnabled)html=decorateDay6RichStory(html,finance,dwell.profileEntranceSec);
if(day7RichStoryEnabled)html=decorateDay7RichStory(html,finance);
if(day5TransitionsEnabled||day5RichStoryEnabled)html=decorateDay5Transitions(html,finance);
assertMoneyHabitsTheme(css,html);
const h=await evaluateProductionVisualVariety({outputDir:out,historyPath:resolve(sixScene||illustrated||day5RichStoryEnabled||day6RichStoryEnabled||day7RichStoryEnabled?join(out,"batch-comparison-history.json"):"output/visual-history.json"),script,day,transcript});
const report:any={day,edition:"1.2 benchmark",generatedAt:new Date().toISOString(),status:"PREFLIGHT",approvedVoiceText:approved,source:APPROVED_SCRIPT_FILE,sourceSha256:await hash(APPROVED_SCRIPT_FILE),audioReuse:{source:`output/day-${day}/voice.mp3`,sha256:await hash(join(out,"voice.mp3")),ttsRegenerated:false},...(day5TransitionsEnabled||day5RichStoryEnabled?{sceneTransitions:{style:"vertical statement scan",items:day5Transitions(finance),audioAdded:day5RichStoryEnabled}}:{}),...(day5RichStoryEnabled?{storyRevision:{style:"source-linked illustrated subscription story",texture:"stationary background-only grain and grid",sfx:"pending isolated mix",parent:"day-5-transitions"}}:{}),...(day6RichStoryEnabled?{storyRevision:{style:day6CharacterRevisionEnabled?"source-linked illustration with connected, expressive character correction":"source-linked illustrated scarcity-to-safety story",texture:"none",sfx:day6CharacterRevisionEnabled?"three original transcript-linked cues to be remixed after visual render":"none",sceneTransition:"shared 180ms crossfade",parent:day6CharacterRevisionEnabled?"day-6-v12-rich-story-sound-design":"day-6-v12-differentactually",sourceNarrationAndWordBoundaryChanged:false}}:{}),outroDwell:dwell,
  gates:{A_SCRIPT_INTEGRITY:{status:"PASS"},B_NO_UNAPPROVED_COPY:{status:"PASS",legacyFallbackAudit:visible,visibleText:editorial.inventory},C_THEME:{status:"PASS"},D_TRANSCRIPT:{status:"PASS",provider:"edge-tts",boundarySource:"WordBoundary",whisper:false,sourceScript:transcript.sourceScript},E_NUMBER_HIGHLIGHTS:{status:"PASS",resolved:highlights},F_TEMPLATE_SCENE:assertTemplateScenePlan(script,transcript),G_TESTS:{status:"PENDING",node:0,python:0},H_VISUAL_VARIETY:h,I_FINANCE_DATA_VIZ:{...i,NUMERIC_RELATIONSHIP_INTEGRITY:numeric,TEMPORAL_SPECIFICITY_INTEGRITY:editorial.checks.TEMPORAL_SPECIFICITY_INTEGRITY,chartDecision:"No derived chart or total. Range endpoints keep OR/TO qualifiers; weekly five dollars keeps its spoken weekly context; other quantities remain exact source text."},J_MOTION_SEMANTICS:{...j,status:editorial.status==="FAIL"?"FAIL":j.status,editorial},PRODUCTION_DURATION:assessProductionDuration(dwell.finalTargetSec,"planned")},sceneDynamics:assessSceneDynamics(transcript,financeVisualCues(finance,transcript)),baselineHashes:before};
await persistProductionValidation(out,report);
await writeFile(join(out,"editorial-validation.json"),JSON.stringify(editorial,null,2));
await writeFile(join(out,"numeric-integrity.json"),JSON.stringify({status:"PASS",relationships:numeric,approvedFacts:input.data.map((d:any)=>({display:d.display,sourcePhrase:d.sourceSpan,unitSource:d.unitSource?.sourceSpan})),charts:"N/A",derivedValues:[]},null,2));
await mkdir(".runtime-logs",{recursive:true});
await command("npm.cmd",["run","typecheck"],true);
const vitestLog=day7RichStoryEnabled?'.runtime-logs/day7-v12-rich-story-vitest.json':day6CharacterRevisionEnabled?".runtime-logs/day6-v12-rich-story-character-revision-vitest.json":day6RichStoryEnabled?".runtime-logs/day6-v12-rich-story-seamless-crossfade-vitest.json":`.runtime-logs/day${day}-v12-vitest.json`;
await command("npx.cmd",["vitest","run",...(day6RichStoryEnabled||day7RichStoryEnabled?["--no-cache"]:[]),"--reporter=json",`--outputFile=${vitestLog}`],true);
const py=await command("C:/Users/PC/AppData/Local/Python/bin/python.exe",["-c","import unittest,sys;s=unittest.defaultTestLoader.discover('tests');print('TEST_COUNT='+str(s.countTestCases()));r=unittest.TextTestRunner(verbosity=2).run(s);sys.exit(0 if r.wasSuccessful() else 1)"]);
await command("npm.cmd",["--prefix","frontend","run","build"],true);await command("npm.cmd",["--prefix","frontend","run","lint"],true);
const tests=await json(vitestLog);if(!tests.success||tests.numFailedTests)throw new Error("G_TESTS: Vitest failure");
report.gates.G_TESTS={status:"PASS",node:tests.numPassedTests,python:Number(py.match(/TEST_COUNT=(\d+)/)?.[1])};
await writeFile(join(out,"test-results.json"),JSON.stringify({...report.gates.G_TESTS,typecheck:"PASS",frontendBuild:"PASS",frontendLint:"PASS",failed:0},null,2));
await persistProductionValidation(out,report);assertProductionAllowed(report.gates);
await writeFile(join(out,"index.html"),html);await copyFile("src/render/templates/styles.css",join(out,"styles.css"));await copyFile(LOCKED_PAGE_BRAND.avatarAsset,join(out,"tiktok-avatar.svg"));
await writeFile(join(out,"meta.json"),JSON.stringify({id:`day-${day}-v12-differentactually`,name:`Day ${day} v1.2 — Benchmark`},null,2));
let ass=editorialKaraokeAss(transcript,captions,script);
if(sixScene||illustrated||day5RichStoryEnabled)ass=ass.replaceAll("&H00B5C2C9","&H00FFFFFF").replaceAll("&H0028A9D7&","&H0023A6F5&").replaceAll("&H00261407","&H0026150B");
await writeFile(join(out,"subtitles.ass"),ass);
if(process.argv.includes("--render")){
  await command("npx.cmd",["tsx","scripts/qa-temporal-collision.ts",relative(process.cwd(),out),"--label=pre-render"],true);
  await renderWithHyperframes({compositionDir:relative(process.cwd(),out),outputPath:relative(process.cwd(),join(out,"video-raw.mp4"))});
  await burnSubtitles({videoInput:join(out,"video-raw.mp4"),srtPath:join(out,"subtitles.ass"),videoOutput:join(out,"video.mp4"),fontSize:46,marginV:450});
  report.gates.PRODUCTION_DURATION=assessProductionDuration(await getVideoDurationSec(join(out,"video.mp4")),"measured");report.status="RENDERED_PENDING_FRAME_QA";
}
const after=Object.fromEntries(await Promise.all(protectedFiles.map(async p=>[p,await hash(p)])));
if(JSON.stringify(before)!==JSON.stringify(after))throw new Error("IMMUTABLE_BASELINE");
await writeFile(join(out,"baseline-preservation.json"),JSON.stringify({status:"PASS",before,after},null,2));
await persistProductionValidation(out,report);assertProductionAllowed(report.gates);
console.log(report.status,report.gates.G_TESTS,dwell);
