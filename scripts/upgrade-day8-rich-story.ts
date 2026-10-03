import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { assertBenchmarkDestination } from "../src/contracts/benchmark-isolation.js";
import { FinancePlanSchema } from "../src/contracts/finance-motion.js";
import { day8RichStoryPlan } from "../src/day8-rich-story.js";

const out = resolve("output/benchmarks/day-8-v12-differentactually");
assertBenchmarkDestination(out);
const path = join(out, "data_visualizations.json");
const source = FinancePlanSchema.parse(JSON.parse(await readFile(path, "utf8")));
const stageCount = source.sequences.filter(sequence => sequence.elements.some(element => element.id === "stage")).length;
if (source.day !== 8 || (stageCount !== 0 && stageCount !== source.sequences.length)) {
  throw new Error("DAY8_STORY_UPGRADE_REQUIRES_CONSISTENT_DAY8_PLAN");
}
const plan = day8RichStoryPlan(source);
await writeFile(path, JSON.stringify(plan, null, 2), "utf8");
const visualPath = join(out, "visual-plan.json");
const visual = JSON.parse(await readFile(visualPath, "utf8"));
if (visual.day !== 8) throw new Error("DAY8_STORY_VISUAL_PLAN_SCOPE");
visual.rationale = "An illustrated checkout becomes four source-supported payment markers, a calendar obligation before payday and a paused purchase with all payments visible. No invented price or date.";
visual.repeatedIconComposition = "one checkout becomes four payment markers; the same calendar exposes the whole obligation before a paused decision";
await writeFile(visualPath, JSON.stringify(visual, null, 2), "utf8");
console.log("Day 8 rich-story plan upgraded in its isolated benchmark directory.");
