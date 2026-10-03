import { readFile, writeFile, copyFile, mkdir, readdir } from "node:fs/promises";
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
import {decorateObjectStoryboard,OBJECT_OUTPUT} from './day2-object-storyboard.js';

const out=resolve(process.env.DAY2_OUTPUT_DIR ?? "output/benchmarks/day-2-v12");assertBenchmarkDestination(out);
const json=async(p:string)=>JSON.parse(await readFile(p,"utf8"));
const hash=async(p:string)=>createHash("sha256").update(await readFile(p)).digest("hex");
const protectedFiles=[APPROVED_SCRIPT_FILE,HISTORICAL_SCRIPT_FILE,...[1,2,3].flatMap(n=>["video.mp4","voice.mp3","transcript.json","subtitles.ass"].map(f=>`output/day-${n}/${f}`)),...(await readdir("output/benchmarks/day-1-v12-editorial-r2",{withFileTypes:true})).filter(e=>e.isFile()).map(e=>`output/benchmarks/day-1-v12-editorial-r2/${e.name}`),...(out!==resolve("output/benchmarks/day-2-v12")?["output/benchmarks/day-2-v12/video.mp4"]:[])];
const before=Object.fromEntries(await Promise.all(protectedFiles.map(async p=>[p,await hash(p)])));
function command(cmd:string,args:string[],shell=false):Promise<string>{return new Promise((done,fail)=>{let output="";const p=spawn(cmd,args,{shell,stdio:["ignore","pipe","pipe"]});for(const stream of [p.stdout,p.stderr])stream.on("data",d=>{output+=d;process.stdout.write(d);});p.on("error",fail);p.on("close",code=>code===0?done(output):fail(new Error(`${cmd}: exit ${code}`)));});}

const script=ScriptSchema.parse(await json(join(out,"script.json"))),transcript=await json(join(out,"transcript.json")),input=await json(join(out,"data_visualizations.json"));
const approved=extractApprovedVoiceOver(await readFile(APPROVED_SCRIPT_FILE,"utf8"),2);assertScriptIntegrity(script,approved);
if(input.source!==APPROVED_SCRIPT_FILE||!input.editorial)throw new Error("SOURCE_REVISION: Day 2 canonical editorial sidecar required");
const finance=compileFinancePlan(input,script,transcript,approved),i=assessFinanceDataViz(input,script,transcript,approved),j=assessMotionSemantics(finance);
const captions=resolveHeroCaptions(await json(join(out,"hero-captions.json")),finance,transcript);
const editorial=assessEditorial(finance,transcript,captions,script),numeric=validateNumericRelationships(input.data,input.relationships??[]);
const numbers=NumberHighlightFileSchema.parse(await json(join(out,"number_highlights.json"))),highlights=resolveNumberHighlights(numbers,transcript);assertFinanceHighlights(finance,highlights);
const baselineHtml=await readFile("output/day-2/index.html","utf8");
const tiktok={displayName:LOCKED_PAGE_BRAND.displayName,handle:LOCKED_PAGE_BRAND.handle,followers:baselineHtml.match(/class="tt-followers">([^<]*)/)?.[1]??"Daily money habits"};
const visible=auditVisibleText({script,approvedVoice:approved,auxiliaryMarkdown:await readFile(AUXILIARY_SCRIPT_FILE,"utf8"),numberHighlights:numbers,brandConfig:[script.metadata.channel,...Object.values(tiktok),LOCKED_PAGE_BRAND.tagline]});
const dwell=planOutroDwell(transcript,.2,3);
// Day 2 benchmark-only presentation patch: the exact apartment metric remains
// visible after its reveal, but is deliberately reduced to a retained tag once
// transport and food choices become the dominant accumulated state. This CSS is
// scoped to the benchmark composition and does not alter the shared renderer.
const day2PatchCss=`
#fm-raise-hook-months .fm-number{font-size:112px;line-height:1.05}
#finance-parallel-rise .fm-node{border-width:0 0 10px;border-radius:0;background:transparent;justify-content:flex-start}
#finance-parallel-rise .fm-focus-ring{display:none}
#finance-choice-question .fm-text .fm-copy{text-align:center}
#fm-choice-accumulation-apartment-cost .fm-number{font-size:106px;line-height:1.05}
#fm-choice-accumulation-apartment-cost .fm-number-long{font-size:94px}
#fm-choice-accumulation-apartment-cost .fm-metric-step{top:0}
#fm-choice-accumulation-apartment-cost .fm-copy{font-size:40px}
`;
let html=composeHtml({script,financePlan:finance,sceneAudio:transcript.scenes.map((s:any)=>({id:s.id,durationSec:s.durationMs/1000,lastWordEndSec:s.words.at(-1).endMs/1000})),gapSec:.2,bgImageRelPath:null,audioRelPath:"voice.mp3",tiktok,tiktokAvatarRelPath:"tiktok-avatar.svg",outroHoldSec:dwell.outroHoldSec,numberHighlights:highlights}).replace("</head>",`<style id="day2-v12-visual-patch">${day2PatchCss}</style></head>`);
if(out===resolve(OBJECT_OUTPUT)||process.env.DAY2_OBJECT_STORYBOARD==='1')html=decorateObjectStoryboard(html,finance);
const css=await readFile("src/render/templates/styles.css","utf8");assertMoneyHabitsTheme(css,html);
const h=await evaluateProductionVisualVariety({outputDir:out,historyPath:resolve("output/visual-history.json"),script,day:2,transcript});
const report:any={day:2,edition:"1.2 benchmark",generatedAt:new Date().toISOString(),status:"PREFLIGHT",approvedVoiceText:approved,source:APPROVED_SCRIPT_FILE,sourceSha256:await hash(APPROVED_SCRIPT_FILE),audioReuse:{source:"output/day-2/voice.mp3",sha256:await hash(join(out,"voice.mp3")),ttsRegenerated:false},outroDwell:dwell,
  gates:{A_SCRIPT_INTEGRITY:{status:"PASS"},B_NO_UNAPPROVED_COPY:{status:"PASS",legacyFallbackAudit:visible,visibleText:editorial.inventory},C_THEME:{status:"PASS"},D_TRANSCRIPT:{status:"PASS",provider:"edge-tts",boundarySource:"WordBoundary",whisper:false,sourceScript:transcript.sourceScript},E_NUMBER_HIGHLIGHTS:{status:"PASS",resolved:highlights},F_TEMPLATE_SCENE:assertTemplateScenePlan(script,transcript),G_TESTS:{status:"PENDING",node:0,python:0},H_VISUAL_VARIETY:h,I_FINANCE_DATA_VIZ:{...i,NUMERIC_RELATIONSHIP_INTEGRITY:numeric,TEMPORAL_SPECIFICITY_INTEGRITY:editorial.checks.TEMPORAL_SPECIFICITY_INTEGRITY,chartDecision:"No quantitative chart: exact 6 MONTHS time interval and $200 / MONTH fact reveal; spending/income progression is qualitative and unscaled"},J_MOTION_SEMANTICS:{...j,status:editorial.status==="FAIL"?"FAIL":j.status,editorial},PRODUCTION_DURATION:assessProductionDuration(dwell.finalTargetSec,"planned")},sceneDynamics:assessSceneDynamics(transcript,financeVisualCues(finance,transcript)),baselineHashes:before};
await persistProductionValidation(out,report);
await writeFile(join(out,"editorial-validation.json"),JSON.stringify(editorial,null,2));
await writeFile(join(out,"numeric-integrity.json"),JSON.stringify({status:"PASS",relationships:numeric,approvedFacts:input.data.map((d:any)=>({display:d.display,sourcePhrase:d.sourceSpan,unitSource:d.unitSource?.sourceSpan})),charts:"N/A",derivedValues:[]},null,2));
await mkdir(".runtime-logs",{recursive:true});
await command("npm.cmd",["run","typecheck"],true);
await command("npx.cmd",["vitest","run","--reporter=json","--outputFile=.runtime-logs/day2-v12-vitest.json"],true);
const py=await command("C:/Users/PC/AppData/Local/Python/bin/python.exe",["-c","import unittest,sys;s=unittest.defaultTestLoader.discover('tests');print('TEST_COUNT='+str(s.countTestCases()));r=unittest.TextTestRunner(verbosity=2).run(s);sys.exit(0 if r.wasSuccessful() else 1)"]);
await command("npm.cmd",["--prefix","frontend","run","build"],true);await command("npm.cmd",["--prefix","frontend","run","lint"],true);
const tests=await json(".runtime-logs/day2-v12-vitest.json");if(!tests.success||tests.numFailedTests)throw new Error("G_TESTS: Vitest failure");
report.gates.G_TESTS={status:"PASS",node:tests.numPassedTests,python:Number(py.match(/TEST_COUNT=(\d+)/)?.[1])};
await writeFile(join(out,"test-results.json"),JSON.stringify({...report.gates.G_TESTS,typecheck:"PASS",frontendBuild:"PASS",frontendLint:"PASS",failed:0},null,2));
await persistProductionValidation(out,report);assertProductionAllowed(report.gates);
await writeFile(join(out,"index.html"),html);await copyFile("src/render/templates/styles.css",join(out,"styles.css"));await copyFile(LOCKED_PAGE_BRAND.avatarAsset,join(out,"tiktok-avatar.svg"));
await writeFile(join(out,"meta.json"),JSON.stringify({id:"day-2-v12",name:"Day 2 v1.2 — Benchmark"},null,2));
await writeFile(join(out,"subtitles.ass"),editorialKaraokeAss(transcript,captions,script));
if(process.argv.includes("--render")){
  await renderWithHyperframes({compositionDir:relative(process.cwd(),out),outputPath:relative(process.cwd(),join(out,"video-raw.mp4"))});
  await burnSubtitles({videoInput:join(out,"video-raw.mp4"),srtPath:join(out,"subtitles.ass"),videoOutput:join(out,"video.mp4"),fontSize:46,marginV:450});
  report.gates.PRODUCTION_DURATION=assessProductionDuration(await getVideoDurationSec(join(out,"video.mp4")),"measured");report.status="RENDERED_PENDING_FRAME_QA";
}
const after=Object.fromEntries(await Promise.all(protectedFiles.map(async p=>[p,await hash(p)])));
if(JSON.stringify(before)!==JSON.stringify(after))throw new Error("IMMUTABLE_BASELINE");
await writeFile(join(out,"baseline-preservation.json"),JSON.stringify({status:"PASS",before,after},null,2));
await persistProductionValidation(out,report);assertProductionAllowed(report.gates);
console.log(report.status,report.gates.G_TESTS,dwell);
