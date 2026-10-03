import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {cuePlan,synthesizeCues} from "./day4-sfx.js";
import {compileFinancePlan} from "../src/contracts/finance-motion.js";
import {extractApprovedVoiceOver} from "../src/contracts/content-contract.js";
const out="output/benchmarks/day-4-v12-texture-sfx";
const read=(f:string)=>JSON.parse(readFileSync(`${out}/${f}`,"utf8"));
describe("Day 4 sensory revision",()=>{
 const input=read("data_visualizations.json"),script=read("script.json"),transcript=read("transcript.json");
 const plan=compileFinancePlan(input,script,transcript,extractApprovedVoiceOver(readFileSync("money-habits-script-v2.1-verified.md","utf8"),4));
 it("uses a negated qualitative alternative, not invented numerical chart data",()=>{
  expect(input.data).toEqual([]);const s=plan.sequences.find(s=>s.id==="checkout-feeling")!;
  expect(s.elements.find(e=>e.id==="not-need")!.copy!.text).toBe("NOT DO I NEED THIS");
  const event=s.motionEvents.find(e=>e.id==="not-need")!;expect(event.atSec).toBeGreaterThan(30);expect(event.atSec).toBeLessThan(40);
 });
 it("does not change narration audio or transcript",()=>{
  const old="output/benchmarks/day-4-v12-differentactually";
  expect(readFileSync(`${out}/voice.mp3`).equals(readFileSync(`${old}/voice.mp3`))).toBe(true);
  expect(transcript).toEqual(JSON.parse(readFileSync(`${old}/transcript.json`,"utf8")));
 });
 it("binds every cue to the actual sequence or reveal and stays quiet",()=>{
  const cues=cuePlan(plan);expect(cues.length).toBeGreaterThan(5);
  for(const c of cues){const s=plan.sequences.find(s=>s.id===c.sequence)!;expect([s.startSec,...s.motionEvents.filter(e=>e.targets.includes(c.target)).map(e=>e.atSec)]).toContain(c.atSec);}
  const samples=synthesizeCues(cues,60.8);expect(samples.reduce((a,b)=>Math.max(a,Math.abs(b)),0)).toBeLessThan(.05);
  expect(Buffer.from(synthesizeCues(cues,60.8).buffer).equals(Buffer.from(samples.buffer))).toBe(true);
 });
 it("keeps grain/grid on the background and hidden panel styling inside its element",()=>{
  const css=readFileSync(`${out}/sensory.css`,"utf8");expect(css).toContain(".shell-bg::before");expect(css).toContain(".shell-bg::after");expect(css).toContain("#grain-overlay { display:none; }");expect(css).not.toContain("animation:");
 });
});
