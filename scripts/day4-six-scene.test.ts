import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {compileFinancePlan} from "../src/contracts/finance-motion.js";
import {extractApprovedVoiceOver} from "../src/contracts/content-contract.js";
import {resolveHeroCaptions,editorialCaptionWords} from "../src/contracts/hero-captions.js";
import {assessEditorial} from "../src/contracts/editorial-validation.js";
const out="output/benchmarks/day-4-v12-six-scene",old="output/benchmarks/day-4-v12-texture-sfx";
const read=(f:string)=>JSON.parse(readFileSync(`${out}/${f}`,"utf8"));
describe("Day 4 user six-scene storyboard",()=>{
 const input=read("data_visualizations.json"),script=read("script.json"),transcript=read("transcript.json");
 const plan=compileFinancePlan(input,script,transcript,extractApprovedVoiceOver(readFileSync("money-habits-script-v2.1-verified.md","utf8"),4));
 const captions=resolveHeroCaptions(read("hero-captions.json"),plan,transcript);
 it("keeps six visual sequences with unchanged canonical audio/timing",()=>{
  expect(plan.sequences).toHaveLength(6);expect(input.data).toEqual([]);
  expect(readFileSync(`${out}/voice.mp3`).equals(readFileSync(`${old}/voice.mp3`))).toBe(true);
  expect(transcript).toEqual(JSON.parse(readFileSync(`${old}/transcript.json`,"utf8")));
 });
 it("separates the stationary explanation, retained time label and two examples",()=>{
  expect(plan.sequences[1].elements.every(e=>e.kind==="text")).toBe(true);
  const examples=plan.sequences[2];expect(examples.elements.filter(e=>e.icon).map(e=>e.icon)).toEqual(["order","coffee"]);
  expect(examples.elements[0].copy!.sourceSpan).toBe("about ten minutes");
  expect(examples.elements[0].box.y+examples.elements[0].box.h).toBeLessThan(Math.min(...examples.elements.filter(e=>e.icon).map(e=>e.box.y)));
  expect(plan.sequences[3].elements.filter(e=>e.icon).map(e=>e.icon)).toEqual(["order"]);
 });
 it("keeps every actionable-rule word in captions and a clean conclusion handoff",()=>{
  const coverage=editorialCaptionWords(transcript,captions),rule=transcript.scenes.filter((s:any)=>["scene-7","scene-8","scene-9"].includes(s.id)).flatMap((s:any)=>s.words);
  for(const w of rule)expect(coverage.visible.some(c=>c.startMs===w.globalStartMs&&c.text===w.text)).toBe(true);
  const end=plan.sequences.at(-1)!,hide=end.motionEvents.find(e=>e.id==="discipline-clears")!,reveal=end.motionEvents.find(e=>e.id==="honest-reveal")!;
  expect(reveal.atSec-hide.atSec).toBeGreaterThanOrEqual(.18);
  expect(end.motionEvents.find(e=>e.id==="outro-clear")!.targets).not.toContain("discipline");
  expect(assessEditorial(plan,transcript,captions,script).status).toBe("PASS");
 });
 it("clears reused text and object lanes before adjacent scenes enter",()=>{
  for(const id of ["biological-loop","trigger-examples"]){
   const n=plan.sequences.findIndex(s=>s.id===id),seq=plan.sequences[n];
   for(const element of seq.elements){
    const hide=seq.motionEvents.find(e=>e.action==="hide"&&e.targets.includes(element.id));
    expect(hide,`${id}:${element.id} must not ghost into the next occupied lane`).toBeDefined();
    expect(hide!.atSec+.18).toBeLessThanOrEqual(plan.sequences[n+1].startSec);
   }
  }
 });
 it("isolates the explicitly requested tokens and badge styling",()=>{
  const css=readFileSync(`${out}/sensory.css`,"utf8");
  for(const value of Object.values(read("design-tokens.json").tokens))expect(css).toContain(value);
  expect(css).toContain("text-transform:uppercase");expect(css).toContain(".tt-card { left:110px");
 });
});
