import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { APPROVED_SCRIPT_FILE, extractApprovedVoiceOver } from "../src/contracts/content-contract.js";
import { compileFinancePlan, FinancePlanSchema } from "../src/contracts/finance-motion.js";
import { ScriptSchema } from "../src/render/script-schema.js";
import { decorateDay8RichStory } from "../src/day8-rich-story.js";

const out = "output/benchmarks/day-8-v12-differentactually";
const json = (name: string) => JSON.parse(readFileSync(`${out}/${name}`, "utf8"));

describe("Day 8 source-linked illustrated payment story", () => {
  const plan = FinancePlanSchema.parse(json("data_visualizations.json"));
  const script = ScriptSchema.parse(json("script.json"));
  const transcript = json("transcript.json");
  const approved = extractApprovedVoiceOver(readFileSync(APPROVED_SCRIPT_FILE, "utf8"), 8);
  const resolved = compileFinancePlan(plan, script, transcript, approved);

  it("uses one safe stage per sequence while retaining the exact four-payment datum", () => {
    expect(plan.sequences).toHaveLength(3);
    for (const sequence of plan.sequences) expect(sequence.elements.filter(item => item.id === "stage")).toHaveLength(1);
    expect(plan.data).toMatchObject([{ id: "four-payments", value: 4, qualifier: "exact" }]);
    expect(plan.sequences[0].elements.some(item => item.id === "payment-track" && item.kind === "markers")).toBe(true);
  });
  it("anchors every new illustrated action to approved WordBoundary text", () => {
    const storyEvents = resolved.sequences.flatMap(sequence => sequence.motionEvents.filter(event => event.id.startsWith("art-")));
    expect(storyEvents).toHaveLength(17);
    for (const event of storyEvents) {
      expect(event.trigger.source).toBe(APPROVED_SCRIPT_FILE);
      expect(event.targets).toEqual(["stage"]);
      expect(event.atSec).toBeGreaterThanOrEqual(0);
    }
  });
  it("injects pictorial states hidden until their source-linked reveal", () => {
    const shells = resolved.sequences.map(sequence => `<div id="fm-${sequence.id}-stage"><div class="fm-focus-ring"></div></div>`).join("");
    const decorated = decorateDay8RichStory(`<html><head></head><body>${shells}</body></html>`, resolved);
    expect(decorated.match(/class="day8-story-art"/g)).toHaveLength(3);
    expect(decorated).toContain("story-future{opacity:0}");
    expect(decorated).toContain("window.__day8StoryEvents");
    expect(decorated).not.toMatch(/<text\b/);
  });
});
