import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { APPROVED_SCRIPT_FILE, extractApprovedVoiceOver } from "../src/contracts/content-contract.js";
import { FinancePlanSchema } from "../src/contracts/finance-motion.js";
import { ScriptSchema } from "../src/render/script-schema.js";
import { DAY_STORY_SPECS, day10to14RichStoryPlan, type StoryDay } from "../src/day10-14-rich-story.js";

describe.each([10, 11, 12, 13, 14] as StoryDay[])("Day %i source-linked story", day => {
  const out = `output/benchmarks/day-${day}-v12-differentactually`;
  const json = (name: string) => JSON.parse(readFileSync(`${out}/${name}`, "utf8"));
  const script = ScriptSchema.parse(json("script.json"));
  const plan = FinancePlanSchema.parse(json("data_visualizations.json"));
  const spec = DAY_STORY_SPECS[day];
  const approved = extractApprovedVoiceOver(readFileSync(APPROVED_SCRIPT_FILE, "utf8"), day);

  it("keeps every approved narration word and refuses fabricated financial data", () => {
    expect(script.scenes.map(scene => scene.voiceText).join(" ")).toBe(approved);
    expect(script.scenes).toHaveLength(spec.endings.length);
    expect(plan.data).toEqual([]);
    expect(json("number_highlights.json").items).toEqual([]);
    expect(plan.sequences.map(item => item.id)).toEqual(spec.sequences.map(item => item.id));
    expect(day10to14RichStoryPlan(plan)).toEqual(plan);
  });
  it("binds each planned illustration reveal to its exact source scene", () => {
    for (const [index, design] of spec.sequences.entries()) {
      const actual = plan.sequences[index];
      expect(actual.elements.filter(element => element.id === "stage")).toHaveLength(1);
      expect(actual.motionEvents.filter(event => event.id.startsWith("art-"))).toHaveLength(design.reveals.length);
      for (const part of design.reveals) {
        const scene = script.scenes[part.scene - 1];
        expect(scene.voiceText.toLowerCase()).toContain(part.phrase.toLowerCase());
        expect(actual.motionEvents).toContainEqual(expect.objectContaining({ id: `art-${part.id}`, trigger: expect.objectContaining({ source: APPROVED_SCRIPT_FILE, sceneId: `scene-${part.scene}`, sourceSpan: part.phrase }), targets: ["stage"] }));
        expect(part.svg).not.toMatch(/<text\b|\$\d|\b\d+%/i);
      }
    }
  });
  it("keeps chapter copy sparse and tied to narration spans", () => {
    const heroCaptions = json("hero-captions.json");
    expect(heroCaptions).toHaveLength(3);
    for (const item of heroCaptions) expect(approved.toLowerCase()).toContain(item.sourceSpan.toLowerCase());
    for (const design of spec.sequences) expect(design.labels?.length ?? 0).toBeLessThanOrEqual(3);
  });
  it("keeps the final illustration visible until the narration ends", () => {
    const last = plan.sequences.at(-1)!;
    const clear = last.motionEvents.find(event => event.id === "clear-for-follow");
    expect(clear).toMatchObject({
      action: "hide",
      anchor: "end",
      trigger: { sceneId: `scene-${script.scenes.length}`, sourceSpan: spec.endings.at(-1) },
    });
    expect(script.scenes.at(-1)!.voiceText.endsWith(spec.endings.at(-1)!)).toBe(true);
  });
});
