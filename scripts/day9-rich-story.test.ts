import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { APPROVED_SCRIPT_FILE, extractApprovedVoiceOver } from "../src/contracts/content-contract.js";
import { compileFinancePlan, FinancePlanSchema } from "../src/contracts/finance-motion.js";
import { resolveHeroCaptions, editorialCaptionWords } from "../src/contracts/hero-captions.js";
import { ScriptSchema } from "../src/render/script-schema.js";
import { day9RichStoryPlan, decorateDay9RichStory } from "../src/day9-rich-story.js";

const out = "output/benchmarks/day-9-v12-differentactually";
const json = (name: string) => JSON.parse(readFileSync(`${out}/${name}`, "utf8"));

describe("Day 9 source-linked bank balance story", () => {
  const plan = FinancePlanSchema.parse(json("data_visualizations.json"));
  const script = ScriptSchema.parse(json("script.json"));
  const transcript = json("transcript.json");
  const approved = extractApprovedVoiceOver(readFileSync(APPROVED_SCRIPT_FILE, "utf8"), 9);
  const resolved = compileFinancePlan(plan, script, transcript, approved);

  it("keeps approved narration exact and refuses invented financial amounts", () => {
    expect(script.scenes.map(scene => scene.voiceText).join(" ")).toBe(approved);
    expect(plan.data).toEqual([]);
    expect(plan.sequences.map(sequence => sequence.id)).toEqual(["visible-balance", "one-calendar", "date-and-options"]);
    for (const sequence of plan.sequences) expect(sequence.elements.filter(item => item.id === "stage")).toHaveLength(1);
    expect(day9RichStoryPlan(plan)).toEqual(plan);
  });
  it("ties each pictorial change to one approved WordBoundary phrase", () => {
    const events = resolved.sequences.flatMap(sequence => sequence.motionEvents.filter(event => event.id.startsWith("art-")));
    expect(events).toHaveLength(18);
    for (const event of events) {
      expect(event.trigger.source).toBe(APPROVED_SCRIPT_FILE);
      expect(event.targets).toEqual(["stage"]);
      expect(event.atSec).toBeGreaterThanOrEqual(0);
    }
  });
  it("keeps upcoming obligations hidden before their transcript-linked reveal", () => {
    const shells = resolved.sequences.map(sequence => `<div id="fm-${sequence.id}-stage"><div class="fm-focus-ring"></div></div>`).join("");
    const decorated = decorateDay9RichStory(`<html><head></head><body>${shells}</body></html>`, resolved);
    expect(decorated.match(/class="day9-story-art"/g)).toHaveLength(3);
    expect(decorated).toContain("story-future{opacity:0}");
    expect(decorated).toContain("window.__day9StoryEvents");
    expect(decorated).not.toMatch(/<text\b/);
  });
  it("carries only exact readable heading phrases while keeping every other word captioned", () => {
    const captions = resolveHeroCaptions(json("hero-captions.json"), resolved, transcript);
    const coverage = editorialCaptionWords(transcript, captions);
    expect(captions).toHaveLength(3);
    expect(coverage.totalWords).toBe(110);
    expect(coverage.suppressed.length + coverage.visible.length).toBe(110);
  });
});
