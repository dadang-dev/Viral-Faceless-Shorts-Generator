import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { resolve, join, relative, isAbsolute } from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { ScriptSchema } from "../src/render/script-schema.js";
import { compileFinancePlan, assessFinanceDataViz, assessMotionSemantics, financeVisualCues, assertFinanceHighlights } from "../src/contracts/finance-motion.js";
import { HISTORICAL_SCRIPT_FILE as APPROVED_SCRIPT_FILE, AUXILIARY_SCRIPT_FILE, NumberHighlightFileSchema, extractApprovedVoiceOver, assertScriptIntegrity, assertTemplateScenePlan, assertMoneyHabitsTheme, auditVisibleText, resolveNumberHighlights, type WordBoundaryTranscript } from "../src/contracts/content-contract.js";
import { assessProductionDuration } from "../src/contracts/production-duration.js";
import { evaluateProductionVisualVariety, persistProductionValidation, assertProductionAllowed } from "../src/contracts/production-validation.js";
import { resolveVisualCues, assessSceneDynamics } from "../src/planning/scene-dynamics.js";
import { composeHtml } from "../src/render/html-composer.js";
import { renderWithHyperframes } from "../src/render/hyperframes-runner.js";
import { burnSubtitles } from "../src/assets/subtitle-tools.js";
import { getVideoDurationSec } from "../src/assets/audio-tools.js";
import { assertBenchmarkDestination } from "../src/contracts/benchmark-isolation.js";

const json = async(path:string) => JSON.parse(await readFile(path,"utf8"));
const hash = async(path:string) => createHash("sha256").update(await readFile(path)).digest("hex");
function command(cmd:string,args:string[],shell=false):Promise<string> {
  return new Promise((done,fail)=>{let output="";const p=spawn(cmd,args,{stdio:["ignore","pipe","inherit"],shell});p.stdout.on("data",d=>{output+=String(d);process.stdout.write(d);});p.on("error",fail);p.on("close",c=>c===0?done(output):fail(new Error(`${cmd} failed: ${c}`)));});
}
export async function runBenchmark(render:boolean) {
  const out=resolve("output/benchmarks/day-1-v12"), baseline=resolve("output/day-1");
  assertBenchmarkDestination(out);
  const protectedFiles=[APPROVED_SCRIPT_FILE,...[1,2,3].flatMap(n=>[`output/day-${n}/video.mp4`,`output/day-${n}/voice.mp3`,`output/day-${n}/transcript.json`,`output/day-${n}/subtitles.ass`])];
  const before=Object.fromEntries(await Promise.all(protectedFiles.map(async p=>[p,await hash(p)])));
  const script=ScriptSchema.parse(await json(join(out,"script.json")));
  const transcript=await json(join(out,"transcript.json")) as WordBoundaryTranscript;
  const approved=extractApprovedVoiceOver(await readFile(APPROVED_SCRIPT_FILE,"utf8"),1);
  assertScriptIntegrity(script,approved);
  const sourceScript=ScriptSchema.parse(await json(join(baseline,"script.json")));
  if (JSON.stringify(script.scenes.map(s=>[s.id,s.voiceText])) !== JSON.stringify(sourceScript.scenes.map(s=>[s.id,s.voiceText]))) throw new Error("BENCHMARK_ISOLATION: narration slices changed");
  const reuse=[];
  for(const f of ["voice.mp3","transcript.json","subtitles.ass","subtitles.srt"]){
    const source=await hash(join(baseline,f)),target=await hash(join(out,f));
    if(source!==target) throw new Error(`BENCHMARK_ISOLATION: ${f} must remain byte-identical`);
    reuse.push({file:f,sha256:source,identical:true});
  }
  const numbers=NumberHighlightFileSchema.parse(await json(join(out,"number_highlights.json")));
  const resolvedNumbers=resolveNumberHighlights(numbers,transcript);
  const data=await json(join(out,"data_visualizations.json"));
  if(data.day !== 1 || numbers.day !== 1) throw new Error("SOURCE_CONTRACT: benchmark must be Day 1");
  const i=assessFinanceDataViz(data,script,transcript,approved);
  if(i.status==="FAIL") {await writeFile(join(out,"finance-preflight-failure.json"),JSON.stringify(i,null,2));throw new Error(i.errors.join("\n"));}
  const finance=compileFinancePlan(data,script,transcript,approved);
  const j=assessMotionSemantics(finance);
  // Keep existing number_highlights as the emphasis authority; the data contract
  // supplies value provenance, not a replacement manually-timed highlight list.
  assertFinanceHighlights(finance,resolvedNumbers);
  const baselineHtml=await readFile(join(baseline,"index.html"),"utf8");
  const tiktok={displayName:"Money Habits",handle:"@moneyhabits",followers:baselineHtml.match(/class="tt-followers">([^<]*)/)![1]};
  const visible=auditVisibleText({script,approvedVoice:approved,auxiliaryMarkdown:await readFile(AUXILIARY_SCRIPT_FILE,"utf8"),numberHighlights:numbers,brandConfig:[...Object.values(tiktok),"Money Habits","DAILY HABITS"]});
  const legacyVisible=visible.filter(v=>!finance.sequences.some(s=>s.sceneIds.some(id=>v.path.startsWith(`${id}.`))));
  const financeVisible=finance.sequences.flatMap(s=>s.elements.flatMap(e=>e.copy?[{path:`${s.id}.${e.id}`,text:e.copy.text,source:"approved_voice",sourceSpan:e.copy.sourceSpan,sceneId:e.copy.sceneId}]:[]));
  const duration=await getVideoDurationSec(join(baseline,"video.mp4"));
  const audioEnd=(transcript.scenes.at(-1)!.startMs+transcript.scenes.at(-1)!.durationMs)/1000+.2;
  const cues=resolveVisualCues(script,transcript);
  const html=composeHtml({script,sceneAudio:transcript.scenes.map(s=>({id:s.id,durationSec:s.durationMs/1000,lastWordEndSec:Math.max(...s.words.map(w=>w.endMs))/1000})),gapSec:.2,bgImageRelPath:null,audioRelPath:"voice.mp3",tiktok,tiktokAvatarRelPath:"tiktok-avatar.svg",outroHoldSec:duration-audioEnd,numberHighlights:resolvedNumbers,visualCues:cues,financePlan:finance});
  const css=await readFile("src/render/templates/styles.css","utf8");
  assertMoneyHabitsTheme(css,html);
  const h=await evaluateProductionVisualVariety({outputDir:out,historyPath:resolve("output/visual-history.json"),script,day:1,transcript});
  const report={generatedAt:new Date().toISOString(),day:1,edition:"1.2 benchmark",status:"IMPLEMENTED_NOT_RENDERED",approvedVoiceText:approved,
    gates:{A_SCRIPT_INTEGRITY:{status:"PASS"},B_NO_UNAPPROVED_COPY:{status:"PASS",visibleText:[...legacyVisible,...financeVisible],data:finance.provenance},C_THEME:{status:"PASS",tokens:{navyDeep:"#071426",navySurface:"#0D2038",navyRaised:"#132B47",textPrimary:"#F5F1E8",textMuted:"#C9C2B5",accentGold:"#D7A928",accentAmber:"#F2C14E"}},D_TRANSCRIPT:{status:"PASS",provider:"edge-tts",boundarySource:"WordBoundary",whisper:false,reuse},E_NUMBER_HIGHLIGHTS:{status:"PASS",resolved:resolvedNumbers},F_TEMPLATE_SCENE:assertTemplateScenePlan(script,transcript),G_TESTS:{status:"PENDING",node:0,python:0},H_VISUAL_VARIETY:h,I_FINANCE_DATA_VIZ:i,J_MOTION_SEMANTICS:j,PRODUCTION_DURATION:assessProductionDuration(duration,"planned")},sceneDynamics:assessSceneDynamics(transcript,[...cues,...financeVisualCues(finance,transcript)]),baselineHashes:before};
  await persistProductionValidation(out,report);
  await writeFile(join(out,"resolved-finance-plan.json"),JSON.stringify(finance,null,2));
  await mkdir(".runtime-logs",{recursive:true});
  await command("npm.cmd",["run","typecheck"],true);
  await command("npx.cmd",["vitest","run","--reporter=json","--outputFile=.runtime-logs/v12-vitest.json"],true);
  const pythonOutput=await command("C:/Users/PC/AppData/Local/Python/bin/python.exe",["-c","import unittest,sys; s=unittest.defaultTestLoader.discover('tests'); print('TEST_COUNT='+str(s.countTestCases())); r=unittest.TextTestRunner(verbosity=2).run(s); sys.exit(0 if r.wasSuccessful() else 1)"]);
  await command("npm.cmd",["--prefix","frontend","run","build"],true);
  await command("npm.cmd",["--prefix","frontend","run","lint"],true);
  const results=await json(".runtime-logs/v12-vitest.json");
  if(!results.success || results.numFailedTests) throw new Error("G_TESTS: failed Vitest report");
  // Python command exits nonzero for any failure; count comes from discovered suite.
  const pythonCount=Number(pythonOutput.match(/TEST_COUNT=(\d+)/)?.[1]);
  if(!pythonCount) throw new Error("G_TESTS: missing Python result count");
  report.gates.G_TESTS={status:"PASS",node:results.numPassedTests,python:pythonCount};
  await writeFile(join(out,"test-results.json"),JSON.stringify({...report.gates.G_TESTS,failed:0,executedAt:new Date().toISOString(),typecheck:"PASS",frontendBuild:"PASS",frontendLint:"PASS"},null,2));
  await persistProductionValidation(out,report);
  assertProductionAllowed(report.gates);
  await writeFile(join(out,"index.html"),html);
  await writeFile(join(out,"meta.json"),JSON.stringify({id:"day-1-v12",name:script.metadata.title},null,2));
  await copyFile("src/render/templates/styles.css",join(out,"styles.css"));
  await copyFile("assets/money-habits-avatar.svg",join(out,"tiktok-avatar.svg"));
  if(render){
    // The locked runner invokes npx through a shell; keep its existing behavior
    // and pass workspace-relative paths so Windows spaces cannot split arguments.
    await renderWithHyperframes({compositionDir:relative(process.cwd(),out),outputPath:relative(process.cwd(),join(out,"video-raw.mp4"))});
    await burnSubtitles({videoInput:join(out,"video-raw.mp4"),srtPath:join(out,"subtitles.ass"),videoOutput:join(out,"video-subtitled.mp4"),fontSize:46,marginV:450});
    // Preserve the approved MP4's AAC packets as well as the original TTS input.
    await command("ffmpeg",["-hide_banner","-loglevel","error","-y","-i",join(out,"video-subtitled.mp4"),"-i",join(baseline,"video.mp4"),"-map","0:v:0","-map","1:a:0","-c","copy","-movflags","+faststart",join(out,"video.mp4")]);
    const measured=await getVideoDurationSec(join(out,"video.mp4"));
    report.gates.PRODUCTION_DURATION=assessProductionDuration(measured,"measured");
    if(Math.abs(measured-duration)>1/30+.001) throw new Error("BENCHMARK_ISOLATION: video duration changed");
    report.status="RENDERED_PENDING_FRAME_QA";
  }
  const after=Object.fromEntries(await Promise.all(protectedFiles.map(async p=>[p,await hash(p)])));
  if(JSON.stringify(before)!==JSON.stringify(after)) throw new Error("IMMUTABLE_BASELINE: protected artifact hash changed");
  await writeFile(join(out,"baseline-preservation.json"),JSON.stringify({status:"PASS",before,after,reuse},null,2));
  await persistProductionValidation(out,report);
  console.log(`${report.status}: ${out}; protected baselines unchanged.`);
}
if(process.argv[1]?.replace(/\\/g,"/").endsWith("/render-finance-benchmark.ts")) await runBenchmark(process.argv.includes("--render"));
