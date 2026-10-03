import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {APPROVED_SCRIPT_FILE,extractApprovedVoiceOver,assertScriptIntegrity,resolveNumberHighlights} from "./content-contract.js";
import {compileFinancePlan,assessFinanceDataViz,assessMotionSemantics} from "./finance-motion.js";
import {resolveHeroCaptions,editorialCaptionWords} from "./hero-captions.js";
import {assessEditorial} from "./editorial-validation.js";
import {renderFinanceSequence} from "../render/finance-renderer.js";
import {composeHtml} from "../render/html-composer.js";

// Preserve the previous reviewed fixture; the object-led benchmark has its own suite.
const root="output/benchmarks/day-2-v12/";
const read=(file:string)=>JSON.parse(readFileSync(root+file,"utf8"));
const script=read("script.json"),transcript=read("transcript.json"),input=read("data_visualizations.json"),specs=read("hero-captions.json");
const approved=extractApprovedVoiceOver(readFileSync(APPROVED_SCRIPT_FILE,"utf8"),2);
const fresh=()=>compileFinancePlan(structuredClone(input),script,transcript,approved);

describe("Day 2 v1.2 production contract",()=>{
  it("uses exact approved Day 2 narration and Edge WordBoundary transcript",()=>{
    expect(()=>assertScriptIntegrity(script,approved)).not.toThrow();
    expect(transcript.provider).toBe("edge-tts");expect(transcript.boundarySource).toBe("WordBoundary");
    expect(transcript.scenes.map((scene:any)=>scene.words.map((word:any)=>word.text).join(" ")).join(" ").replace(/[^a-z0-9]+/gi," ").trim().toLowerCase()).toBe(approved.replace(/[^a-z0-9]+/gi," ").trim().toLowerCase());
  });
  it("contains only approved source-literal facts and no forced chart or derived value",()=>{
    expect(input.data).toHaveLength(2);expect(input.data).toEqual(expect.arrayContaining([
      expect.objectContaining({display:"6 MONTHS",value:6,unit:"months",sourceType:"script-literal"}),
      expect.objectContaining({display:"$200 / MONTH",value:200,unit:"USD/month",sourceType:"script-literal"}),
    ]));
    expect(input.relationships??[]).toHaveLength(0);expect(fresh().sequences.flatMap(sequence=>sequence.elements).some(element=>element.kind==="bar")).toBe(false);
    expect(assessFinanceDataViz(input,script,transcript,approved).status).toBe("PASS");
  });
  it("resolves the $200 highlight from transcript timing",()=>{
    const resolved=resolveNumberHighlights(read("number_highlights.json"),transcript);
    const word=transcript.scenes.find((scene:any)=>scene.id==="scene-4").words.find((word:any)=>word.text.toLowerCase().includes("two"));
    const months=transcript.scenes.find((scene:any)=>scene.id==="scene-2").words.find((word:any)=>word.text.toLowerCase()==="six");
    expect(resolved).toHaveLength(2);expect(resolved.find((item:any)=>item.id==="apartment-increase")!.startSec).toBe(word.startMs/1000);expect(resolved.find((item:any)=>item.id==="six-months")!.startSec).toBe(months.startMs/1000);
  });
  it("builds Day 2-specific stateful semantics",()=>{
    const plan=fresh(),ids=plan.sequences.map(sequence=>sequence.id);
    expect(ids).toEqual(["raise-hook","choice-accumulation","parallel-rise","deprivation-reframe","choice-question","question-payoff"]);
    expect(ids).not.toContain("subscriptions");expect(["PASS","WARNING"]).toContain(assessMotionSemantics(plan).status);
    const rise=plan.sequences.find(sequence=>sequence.id==="parallel-rise")!;
    expect(rise.motionEvents.find(event=>event.id==="income-enter")!.atSec).toBeLessThanOrEqual(rise.motionEvents.find(event=>event.id==="income-rise")!.atSec);
    expect(rise.motionEvents.find(event=>event.id==="spending-faster")!.pose?.box?.w).toBeGreaterThan(rise.motionEvents.find(event=>event.id==="spending-rise")!.pose?.box?.w ?? 0);
    const accumulation=plan.sequences.find(sequence=>sequence.id==="choice-accumulation")!;
    expect(accumulation.motionEvents.find(event=>event.id==="metric-secondary")!.pose?.opacity).toBeLessThan(1);
    expect(accumulation.motionEvents.filter(event=>event.id.endsWith("-pressure"))).toHaveLength(6);
  });
  it("passes editorial copy, icon, hierarchy and caption coverage checks",()=>{
    const plan=fresh(),captions=resolveHeroCaptions(specs,plan,transcript),coverage=editorialCaptionWords(transcript,captions),audit=assessEditorial(plan,transcript,captions,script);
    expect(audit.status).toBe("PASS");expect(coverage.totalWords).toBe(coverage.visible.length+coverage.suppressed.length);
    expect(plan.sequences.flatMap(sequence=>sequence.elements).filter(element=>element.icon).map(element=>element.icon)).toEqual(expect.arrayContaining(["home","car","meal","wallet","calendar","question","desire"]));
  });
  it("renders semantic icons and a clean generic editorial CTA",()=>{
    const plan=fresh(),choices=renderFinanceSequence(plan.sequences.find(sequence=>sequence.id==="choice-accumulation")!,plan);
    expect(choices).toContain('data-element-id="home"');expect(choices).toContain('data-element-id="car-old"');expect(choices).toContain('data-element-id="appetizer"');expect(choices).not.toContain('class="fm-link"');
    const html=composeHtml({script,financePlan:plan,sceneAudio:transcript.scenes.map((scene:any)=>({id:scene.id,durationSec:scene.durationMs/1000,lastWordEndSec:scene.words.at(-1).endMs/1000})),gapSec:.2,bgImageRelPath:null,audioRelPath:"voice.mp3",outroHoldSec:6});
    expect(html).toContain('data-editorial-outro="true"');expect(html).toContain("THAT ONE QUESTION");expect(html).toContain('id="tt-card"');expect(html).not.toContain('class="editorial-reminders"');
    expect(html).toContain("SPENDING GO UP");expect(html).toContain("BECAUSE I ACTUALLY WANTED THIS");expect(html).toContain("BECAUSE I COULD");
  });
  it("keeps wanted/could labels below their icon nodes with semantic branch gaps",()=>{
    const sequence=fresh().sequences.find(item=>item.id==="choice-question")!;
    const icon=sequence.elements.find(item=>item.id==="wanted-icon")!,label=sequence.elements.find(item=>item.id==="wanted-copy")!;
    expect(label.box.y).toBeGreaterThan(icon.box.y+icon.box.h+18);
  });
});
