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

const out=resolve(process.env.DAY3_OUTPUT_DIR ?? "output/benchmarks/day-3-v12-differentactually");assertBenchmarkDestination(out);
const json=async(p:string)=>JSON.parse(await readFile(p,"utf8"));
const hash=async(p:string)=>createHash("sha256").update(await readFile(p)).digest("hex");
const before=await json(join(out,"protected-before.json"));
const protectedFiles=Object.keys(before);
for(const p of protectedFiles)if(await hash(p)!==before[p])throw new Error("BASELINE_CHANGED: "+p);
function command(cmd:string,args:string[],shell=false):Promise<string>{return new Promise((done,fail)=>{let output="";const p=spawn(cmd,args,{shell,stdio:["ignore","pipe","pipe"]});for(const stream of [p.stdout,p.stderr])stream.on("data",d=>{output+=d;process.stdout.write(d);});p.on("error",fail);p.on("close",code=>code===0?done(output):fail(new Error(`${cmd}: exit ${code}`)));});}

const script=ScriptSchema.parse(await json(join(out,"script.json"))),transcript=await json(join(out,"transcript.json")),input=await json(join(out,"data_visualizations.json"));
const approved=extractApprovedVoiceOver(await readFile(APPROVED_SCRIPT_FILE,"utf8"),3);assertScriptIntegrity(script,approved);
if(input.source!==APPROVED_SCRIPT_FILE||!input.editorial)throw new Error("SOURCE_REVISION: Day 3 canonical editorial sidecar required");
const finance=compileFinancePlan(input,script,transcript,approved),i=assessFinanceDataViz(input,script,transcript,approved),j=assessMotionSemantics(finance);
const captions=resolveHeroCaptions(await json(join(out,"hero-captions.json")),finance,transcript);
const editorial=assessEditorial(finance,transcript,captions,script),numeric=validateNumericRelationships(input.data,input.relationships??[]);
const numbers=NumberHighlightFileSchema.parse(await json(join(out,"number_highlights.json"))),highlights=resolveNumberHighlights(numbers,transcript);assertFinanceHighlights(finance,highlights);
const baselineHtml=await readFile("output/day-3/index.html","utf8");
const tiktok={displayName:LOCKED_PAGE_BRAND.displayName,handle:LOCKED_PAGE_BRAND.handle,followers:baselineHtml.match(/class="tt-followers">([^<]*)/)?.[1]??"Daily money habits"};
const visible=auditVisibleText({script,approvedVoice:approved,auxiliaryMarkdown:await readFile(AUXILIARY_SCRIPT_FILE,"utf8"),numberHighlights:numbers,brandConfig:[script.metadata.channel,...Object.values(tiktok),LOCKED_PAGE_BRAND.tagline]});
const dwell=planOutroDwell(transcript,.2,3);
let html=composeHtml({script,financePlan:finance,sceneAudio:transcript.scenes.map((s:any)=>({id:s.id,durationSec:s.durationMs/1000,lastWordEndSec:s.words.at(-1).endMs/1000})),gapSec:.2,bgImageRelPath:null,audioRelPath:"voice.mp3",tiktok,tiktokAvatarRelPath:"tiktok-avatar.svg",outroHoldSec:dwell.outroHoldSec,numberHighlights:highlights});
// Day-specific phone-case silhouette. No shared icon vocabulary change.
const phone='<rect x="26" y="8" width="48" height="84" rx="11"/><rect x="33" y="16" width="18" height="22" rx="5"/><circle cx="39" cy="23" r="2"/><circle cx="45" cy="31" r="2"/><path d="M43 83h14"/>';
html=html.replace(/(<div[^>]+id="fm-(?:actual-purchases-phone|observation-ledger-case-record)"[^>]*>\s*<svg[^>]*>)[\s\S]*?(<\/svg>)/g,(_,a,b)=>a+phone+b);
html=html.replace("</head>",`<style id="day3-v12-scoped">
#finance-actual-purchases .fm-node{border:0;background:transparent}
#finance-actual-purchases .fm-node .fm-icon{width:180px;height:180px;flex-basis:180px}
#finance-observation-ledger .fm-node{border-radius:8px;border-width:0 0 2px;background:var(--navy-surface)}
#finance-observation-ledger .fm-node .fm-focus-ring{display:none}
</style></head>`);
const css=await readFile("src/render/templates/styles.css","utf8");assertMoneyHabitsTheme(css,html);
const h=await evaluateProductionVisualVariety({outputDir:out,historyPath:resolve("output/visual-history.json"),script,day:3,transcript});
const report:any={day:3,edition:"1.2 benchmark",generatedAt:new Date().toISOString(),status:"PREFLIGHT",approvedVoiceText:approved,source:APPROVED_SCRIPT_FILE,sourceSha256:await hash(APPROVED_SCRIPT_FILE),audioReuse:{source:"output/day-3/voice.mp3",sha256:await hash(join(out,"voice.mp3")),ttsRegenerated:false},outroDwell:dwell,
  gates:{A_SCRIPT_INTEGRITY:{status:"PASS"},B_NO_UNAPPROVED_COPY:{status:"PASS",legacyFallbackAudit:visible,visibleText:editorial.inventory},C_THEME:{status:"PASS"},D_TRANSCRIPT:{status:"PASS",provider:"edge-tts",boundarySource:"WordBoundary",whisper:false,sourceScript:transcript.sourceScript},E_NUMBER_HIGHLIGHTS:{status:"PASS",resolved:highlights},F_TEMPLATE_SCENE:assertTemplateScenePlan(script,transcript),G_TESTS:{status:"PENDING",node:0,python:0},H_VISUAL_VARIETY:h,I_FINANCE_DATA_VIZ:{...i,NUMERIC_RELATIONSHIP_INTEGRITY:numeric,TEMPORAL_SPECIFICITY_INTEGRITY:editorial.checks.TEMPORAL_SPECIFICITY_INTEGRITY,chartDecision:"No quantitative chart: independent exact $7 and $12 prices; under twenty dollars is a quoted threshold, one week is an observation interval; no derived total"},J_MOTION_SEMANTICS:{...j,status:editorial.status==="FAIL"?"FAIL":j.status,editorial},PRODUCTION_DURATION:assessProductionDuration(dwell.finalTargetSec,"planned")},sceneDynamics:assessSceneDynamics(transcript,financeVisualCues(finance,transcript)),baselineHashes:before};
await persistProductionValidation(out,report);
await writeFile(join(out,"editorial-validation.json"),JSON.stringify(editorial,null,2));
await writeFile(join(out,"numeric-integrity.json"),JSON.stringify({status:"PASS",relationships:numeric,approvedFacts:input.data.map((d:any)=>({display:d.display,sourcePhrase:d.sourceSpan,unitSource:d.unitSource?.sourceSpan})),charts:"N/A",derivedValues:[]},null,2));
await mkdir(".runtime-logs",{recursive:true});
await command("npm.cmd",["run","typecheck"],true);
await command("npx.cmd",["vitest","run","--reporter=json","--outputFile=.runtime-logs/day3-v12-vitest.json"],true);
const py=await command("C:/Users/PC/AppData/Local/Python/bin/python.exe",["-c","import unittest,sys;s=unittest.defaultTestLoader.discover('tests');print('TEST_COUNT='+str(s.countTestCases()));r=unittest.TextTestRunner(verbosity=2).run(s);sys.exit(0 if r.wasSuccessful() else 1)"]);
await command("npm.cmd",["--prefix","frontend","run","build"],true);await command("npm.cmd",["--prefix","frontend","run","lint"],true);
const tests=await json(".runtime-logs/day3-v12-vitest.json");if(!tests.success||tests.numFailedTests)throw new Error("G_TESTS: Vitest failure");
report.gates.G_TESTS={status:"PASS",node:tests.numPassedTests,python:Number(py.match(/TEST_COUNT=(\d+)/)?.[1])};
await writeFile(join(out,"test-results.json"),JSON.stringify({...report.gates.G_TESTS,typecheck:"PASS",frontendBuild:"PASS",frontendLint:"PASS",failed:0},null,2));
await persistProductionValidation(out,report);assertProductionAllowed(report.gates);
await writeFile(join(out,"index.html"),html);await copyFile("src/render/templates/styles.css",join(out,"styles.css"));await copyFile(LOCKED_PAGE_BRAND.avatarAsset,join(out,"tiktok-avatar.svg"));
await writeFile(join(out,"meta.json"),JSON.stringify({id:"day-3-v12-differentactually",name:"Day 3 v1.2 — Benchmark"},null,2));
await writeFile(join(out,"subtitles.ass"),editorialKaraokeAss(transcript,captions,script));
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
