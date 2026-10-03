import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {APPROVED_SCRIPT_FILE,extractApprovedVoiceOver,assertScriptIntegrity,resolveNumberHighlights} from "./content-contract.js";
import {compileFinancePlan,assertFinanceHighlights} from "./finance-motion.js";
import {resolveHeroCaptions,editorialCaptionWords} from "./hero-captions.js";
import {assessEditorial} from "./editorial-validation.js";

const root="output/benchmarks/day-3-v12-differentactually/";
const read=(p:string)=>JSON.parse(readFileSync(root+p,"utf8"));
const script=read("script.json"),transcript=read("transcript.json"),input=read("data_visualizations.json");
const approved=extractApprovedVoiceOver(readFileSync(APPROVED_SCRIPT_FILE,"utf8"),3);
const fresh=()=>compileFinancePlan(structuredClone(input),script,transcript,approved);

describe("Day 3 source and observation semantics",()=>{
 it("reuses exact narration and every legacy WordBoundary without retiming",()=>{
  expect(()=>assertScriptIntegrity(script,approved)).not.toThrow();
  const legacy=JSON.parse(readFileSync("output/day-3/transcript.json","utf8"));
  expect(transcript.scenes).toEqual(legacy.scenes);
  expect(transcript.sourceScript).toBe(APPROVED_SCRIPT_FILE);
 });
 it("shows independent real prices, not a derived total or an exact threshold price",()=>{
  expect(input.data.map((d:any)=>({value:d.value,unit:d.unit,sourceType:d.sourceType}))).toEqual([
   {value:7,unit:"USD",sourceType:"script-literal"},
   {value:12,unit:"USD",sourceType:"script-literal"},
  ]);
  expect(input.relationships??[]).toHaveLength(0);
  expect(()=>assertFinanceHighlights(fresh(),resolveNumberHighlights(read("number_highlights.json"),transcript))).not.toThrow();
 });
 it("retains both actual prices while attention to the purchases changes",()=>{
  const plan=fresh();
  const sequence=plan.sequences.find(s=>s.elements.filter(e=>e.datumId).length===2)!;
  const prices=sequence.elements.filter(e=>e.datumId);
  expect(prices.every(e=>!e.initial)).toBe(true);
  // The joke can de-emphasize objects, never erase or replace actual spending.
  expect(sequence.motionEvents.filter(e=>["hide","update"].includes(e.action)&&e.targets.some(id=>prices.some(p=>p.id===id)))).toHaveLength(0);
  expect(sequence.elements.some(e=>e.connectsTo)).toBe(false);
 });
 it("covers every caption word and gathers existing examples without inventing frequency",()=>{
  const plan=fresh(),captions=resolveHeroCaptions(read("hero-captions.json"),plan,transcript);
  const coverage=editorialCaptionWords(transcript,captions);
  expect(coverage.visible.length+coverage.suppressed.length).toBe(coverage.totalWords);
  expect(assessEditorial(plan,transcript,captions,script).status).toBe("PASS");
  const observation=plan.sequences.at(-1)!;
  expect(observation.elements.some(e=>e.datumId||e.weekSlots)).toBe(false);
  expect(observation.elements.filter(e=>["coffee","app"].includes(e.icon??""))).toHaveLength(2);
 });
 it("rejects the old overlapping record path, not merely unsafe final positions",()=>{
  const bad=structuredClone(input),ledger=bad.sequences.at(-1);
  const records=ledger.elements.filter((e:any)=>e.entityGroup==="observation-records");
  expect(records).toHaveLength(2);
  ledger.motionEvents=ledger.motionEvents.filter((e:any)=>e.id!=="case-lower-lane");
  // Both records starting in one row cannot widen/move through each other.
  expect(()=>compileFinancePlan(bad,script,transcript,approved)).toThrow(/VISUAL_COLLISION/);
 });
});
