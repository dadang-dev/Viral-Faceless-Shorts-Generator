import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {APPROVED_SCRIPT_FILE,extractApprovedVoiceOver,assertScriptIntegrity,resolveNumberHighlights} from "./content-contract.js";
import {compileFinancePlan,assertFinanceHighlights} from "./finance-motion.js";
import {resolveHeroCaptions,editorialCaptionWords} from "./hero-captions.js";
import {assessEditorial} from "./editorial-validation.js";
import {composeHtml} from "../render/html-composer.js";
import {LOCKED_PAGE_BRAND} from "../brand-config.js";

const read=(day:number,name:string)=>JSON.parse(readFileSync(`output/benchmarks/day-${day}-v12-differentactually/${name}`,"utf8"));
for(const day of [4,5,6,7])describe(`Day ${day} canonical benchmark`,()=>{
 const input=read(day,"data_visualizations.json"),script=read(day,"script.json"),transcript=read(day,"transcript.json");
 const approved=extractApprovedVoiceOver(readFileSync(APPROVED_SCRIPT_FILE,"utf8"),day);
 const fresh=()=>compileFinancePlan(structuredClone(input),script,transcript,approved);
 it("preserves canonical narration and every reused WordBoundary",()=>{
  expect(()=>assertScriptIntegrity(script,approved)).not.toThrow();
  expect(transcript.scenes).toEqual(JSON.parse(readFileSync(`output/day-${day}/transcript.json`,"utf8")).scenes);
  expect(transcript.sourceScript).toBe(APPROVED_SCRIPT_FILE);
 });
 it("keeps exact financial literals without invented totals or causal connectors",()=>{
  expect(input.data.map((d:any)=>d.value)).toEqual(day===5?[3,4,8,12]:day===6?[5]:[]);
  expect(input.relationships??[]).toHaveLength(0);
  expect(input.sequences.flatMap((s:any)=>s.elements).some((e:any)=>e.connectsTo)).toBe(false);
  expect(()=>assertFinanceHighlights(fresh(),resolveNumberHighlights(read(day,"number_highlights.json"),transcript))).not.toThrow();
 });
 it("accounts for every caption word and passes retained-state geometry and editorial checks",()=>{
  const plan=fresh(),captions=resolveHeroCaptions(read(day,"hero-captions.json"),plan,transcript);
  const coverage=editorialCaptionWords(transcript,captions);
  expect(coverage.visible.length+coverage.suppressed.length).toBe(coverage.totalWords);
  expect(assessEditorial(plan,transcript,captions,script).status).toBe("PASS");
  // A narrated outro remains in the finance state until narration ends;
  // otherwise the composer selects the old, non-editorial outro layout.
  expect(plan.sequences.at(-1)!.sceneIds).toContain(script.scenes.at(-1).id);
  const clear=plan.sequences.at(-1)!.motionEvents.find(e=>e.id==="outro-clear")!;
  expect(clear.atSec).toBeCloseTo(transcript.scenes.at(-1).words.at(-1).globalEndMs/1000,3);
  const html=composeHtml({script,financePlan:plan,sceneAudio:transcript.scenes.map((s:any)=>({id:s.id,durationSec:s.durationMs/1000,lastWordEndSec:s.words.at(-1).endMs/1000})),gapSec:.2,bgImageRelPath:null,audioRelPath:"voice.mp3",tiktok:{displayName:LOCKED_PAGE_BRAND.displayName,handle:LOCKED_PAGE_BRAND.handle,followers:"Daily money habits"}});
  expect(html).toContain('data-editorial-outro="true"');
  expect(html).not.toContain('<div class="out-channel">');
 });
});
it("keeps Day 5 OR and TO distinct, with endpoints revealed only when spoken",()=>{
 const sequence=read(5,"data_visualizations.json").sequences.find((s:any)=>s.id==="range-comparison");
 expect(sequence.elements.filter((e:any)=>["or","to"].includes(e.id)).map((e:any)=>e.copy.sourceSpan)).toEqual(["or","to"]);
 expect(sequence.elements.filter((e:any)=>e.datumId).every((e:any)=>!e.initial)).toBe(true);
 const suppressed=read(5,"hero-captions.json").flatMap((c:any)=>c.elementIds);
 expect(suppressed).not.toContain("or");expect(suppressed).not.toContain("to");
 expect(read(5,"script.json").scenes.at(-1).templateData.ctaTop).toBe("ACTUALLY LOOK");
});
it("keeps Day 6 five dollars associated with its weekly context and never removes it",()=>{
 const sequence=read(6,"data_visualizations.json").sequences.find((s:any)=>s.id==="weekly-safekeeping");
 expect(sequence.elements.find((e:any)=>e.id==="week").copy.sourceSpan).toBe("a week");
 expect(sequence.motionEvents.some((e:any)=>e.id!=="outro-clear"&&["hide","update"].includes(e.action)&&e.targets.includes("weekly-five"))).toBe(false);
});
it("keeps the Day 7 selection generic rather than choosing a habit for the viewer",()=>{
 const sequences=read(7,"data_visualizations.json").sequences;
 expect(sequences[0].elements.filter((e:any)=>e.kind==="node")).toHaveLength(5);
 expect(sequences.at(-1).elements.filter((e:any)=>e.kind==="node").map((e:any)=>e.icon)).toEqual(["question"]);
});
