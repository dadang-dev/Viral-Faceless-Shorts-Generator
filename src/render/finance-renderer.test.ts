import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {it,expect,describe} from "vitest";
import {compileFinancePlan} from "../contracts/finance-motion.js";
import {extractApprovedVoiceOver,HISTORICAL_SCRIPT_FILE as APPROVED_SCRIPT_FILE} from "../contracts/content-contract.js";
import {ScriptSchema} from "./script-schema.js";
import {renderFinanceSequence} from "./finance-renderer.js";
import {composeHtml} from "./html-composer.js";
const read=(p:string)=>JSON.parse(readFileSync(p,"utf8"));
const script=ScriptSchema.parse(read("output/day-1/script.json"));
const transcript=read("output/day-1/transcript.json");
const finance=compileFinancePlan(read("tests/fixtures/day1-finance-plan.json"),script,transcript,extractApprovedVoiceOver(readFileSync(APPROVED_SCRIPT_FILE,"utf8"),1));
describe("v1.2 rendered primitives and actual GSAP scheduling",()=>{
  it("renders the comparison from a common zero-based scale",()=>{const html=renderFinanceSequence(finance.sequences[3],finance);expect(html).toContain('data-ratio="0.9"');expect(html).toContain('data-ratio="1"');expect(html).toContain('$18');expect(html).toContain('$20');expect(html).not.toContain('$15');});
  it("renders five markers for the five-app count",()=>{const html=renderFinanceSequence(finance.sequences[1],finance);expect(html.match(/class="fm-marker(?: |")/g)).toHaveLength(5);});
  it("does not interpolate invented financial labels",()=>{const html=renderFinanceSequence(finance.sequences[4],finance);expect(html).toContain("ALMOST $300 / MONTH");expect(html).not.toMatch(/\$170|\$299|\$216/);});
  it("keeps numerical nodes hidden in initial CSS snapshots",()=>{const html=renderFinanceSequence(finance.sequences[1],finance);expect(html).toMatch(/data-element-id="streaming"[^>]+opacity:0/);expect(html).toMatch(/data-element-id="apps"[^>]+opacity:0/);});
  it("renders a closed return path for a process loop",()=>expect(renderFinanceSequence(finance.sequences[5],finance)).toContain("fm-loop-return"));
  it("clears the full awareness foreground before the outro CTA handoff",()=>{
    const clear=finance.sequences[5].motionEvents.find(e=>e.id==="clean-outro-handoff");
    expect(clear?.trigger.sourceSpan).toBe("That's it");
    expect(clear?.targets).toEqual(["quiet","background","naming"]);
    expect(clear?.atSec).toBe(59.067);
    expect(clear?.atSec!+.18).toBeLessThan(finance.sequences[5].endSec-.18);
  });
  it("is opt-in, not a replacement of the legacy engine",()=>{
    const args={script,sceneAudio:transcript.scenes.map((s:any)=>({id:s.id,durationSec:s.durationMs/1000})),gapSec:.2,bgImageRelPath:null,audioRelPath:"voice.mp3"};
    const a=composeHtml(args),b=composeHtml({...args,financePlan:finance});
    expect(a).not.toContain("fm-sequence");expect(a).toContain('id="scene-scene-4"');
    expect(b).toContain('id="finance-subscriptions"');expect(b).not.toContain('id="scene-scene-4"');
    expect(b).toContain('id="scene-scene-1"');expect(b).toContain('id="scene-scene-15"');
  });
  it("executes every motion event at its transcript timestamp (not only JSON declarations)",()=>{
    const calls:any[]=[];
    const timeline=Object.fromEntries(["set","to","fromTo"].map(method=>[method,(node:any,...args:any[])=>calls.push({method,node:node.id,args})]));
    const scenes=finance.sequences.map(s=>{
      const nodes=s.elements.map(e=>({id:e.id,dataset:{elementId:e.id,ratio:"1"},classList:{contains:(v:string)=>v==="fm-vertical"&&e.orientation==="vertical"},
        querySelector:(q:string)=>q===".fm-bar-fill"&&e.kind==="bar"?{id:e.id+":fill"}:q===".fm-focus-ring"&&e.kind==="node"?{id:e.id+":ring"}:null,
        querySelectorAll:()=>[]}));
      return {dataset:{financeEvents:JSON.stringify(s.motionEvents)},querySelectorAll:(q:string)=>q===".fm-element"?nodes:[]};
    });
    runInNewContext(readFileSync("src/render/templates/finance-animations.js","utf8"),{document:{querySelectorAll:()=>scenes},window:{__timelines:{"news-video":timeline}}});
    for(const s of finance.sequences) for(const event of s.motionEvents) expect(calls.some(c=>Math.abs(c.args.at(-1)-event.atSec)<.001)).toBe(true);
    expect(calls.filter(c=>c.node.endsWith(":fill")).length).toBe(2);
    expect(calls.some(c=>c.node==="thought:ring"&&c.args[0].opacity===1)).toBe(true);
  });
});
