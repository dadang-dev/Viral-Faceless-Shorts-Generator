import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { extractApprovedVoiceOver, NumberHighlightFileSchema, type WordBoundaryTranscript } from "../contracts/content-contract.js";
import { ScriptSchema } from "../render/script-schema.js";
import { LOCKED_PAGE_BRAND } from "../brand-config.js";
import {
  VISUAL_ARCHETYPES,
  VisualPlanSchema,
  buildVisualHistoryEntry,
  recommendVisualArchetypes,
  validateVisualVariety,
  validateVisualPlanning,
  VisualHistorySchema,
  loadVisualHistory,
  saveVisualHistory,
} from "./visual-variety.js";

const day1 = ScriptSchema.parse(JSON.parse(readFileSync("output/day-1/script.json", "utf8")));
const day2 = ScriptSchema.parse(JSON.parse(readFileSync("output/day-2/script.json", "utf8")));
const approvedMarkdown = readFileSync("money-habits-script-v2-optimized.md", "utf8");
const transcript: WordBoundaryTranscript = JSON.parse(readFileSync("output/day-2/transcript.json", "utf8"));
const contractArgs = {
  script: day1,
  approvedVoice: extractApprovedVoiceOver(approvedMarkdown, 1),
  auxiliaryMarkdown: readFileSync("money-habits-ALL.md", "utf8"),
  numberHighlights: NumberHighlightFileSchema.parse(JSON.parse(readFileSync("output/day-1/number_highlights.json", "utf8"))),
  brandConfig: [day1.metadata.channel, LOCKED_PAGE_BRAND.displayName, LOCKED_PAGE_BRAND.handle, "US TikTok", LOCKED_PAGE_BRAND.tagline, "#MoneyHabits"],
  history: { version: "1.1", entries: [] },
};

const plan = (day: number, primaryArchetype: typeof VISUAL_ARCHETYPES[number], secondaryArchetype?: typeof VISUAL_ARCHETYPES[number]) => ({
  version: "1.1" as const,
  day,
  primaryArchetype,
  secondaryArchetype,
  rationale: "Full-script semantic structure supports this deterministic classification.",
  layoutDirection: "stacked" as const,
});

describe("Visual Variety v1.1 schema", () => {
  it("accepts every recognized archetype and rejects random/unrecognized values", () => {
    for (const primaryArchetype of VISUAL_ARCHETYPES) {
      expect(VisualPlanSchema.parse(plan(1, primaryArchetype)).primaryArchetype).toBe(primaryArchetype);
    }
    expect(() => VisualPlanSchema.parse({ ...plan(1, "concept-story"), primaryArchetype: "random-neon" })).toThrow();
  });

  it("allows at most one distinct secondary archetype", () => {
    expect(() => VisualPlanSchema.parse(plan(1, "concept-story", "concept-story"))).toThrow(/must differ/);
    expect(() => VisualPlanSchema.parse({ ...plan(1, "concept-story"), secondaryArchetype: ["comparison", "stat-reveal"] })).toThrow();
    expect(VisualPlanSchema.parse(plan(1, "concept-story", "stat-reveal")).secondaryArchetype).toBe("stat-reveal");
  });
  it("rejects extra randomization controls instead of silently stripping them", () => {
    expect(() => VisualPlanSchema.parse({ ...plan(1, "concept-story"), seed: 42 })).toThrow();
  });
});

describe("content-driven archetype planning", () => {
  it("returns reproducible schema-valid output from the full approved narration", () => {
    const first = recommendVisualArchetypes({ approvedVoice: contractArgs.approvedVoice, approvedMetricCount: 3 });
    const second = recommendVisualArchetypes({ approvedVoice: contractArgs.approvedVoice, approvedMetricCount: 3 });
    expect(first).toEqual(second);
    expect(() => VisualPlanSchema.parse({
      version: "1.1", day: 1,
      primaryArchetype: first.primaryArchetype,
      secondaryArchetype: first.secondaryArchetype,
      rationale: first.rationale,
      layoutDirection: "vertical",
    })).not.toThrow();
  });

  it("does not weaken the existing NO_UNAPPROVED_COPY scene content", () => {
    const recommendation = recommendVisualArchetypes({ approvedVoice: extractApprovedVoiceOver(approvedMarkdown, 2), approvedMetricCount: 1 });
    expect(day2.scenes.map((scene) => scene.voiceText).join(" ")).toContain("lifestyle creep");
    expect(recommendation).not.toHaveProperty("visibleCopy");
  });
  it("requires narration and considers signals after the opening sentence", () => {
    expect(() => recommendVisualArchetypes({ approvedVoice: "", approvedMetricCount: 0 })).toThrow(/required/);
    expect(recommendVisualArchetypes({ approvedVoice: "An introduction. Number one. Number two. Number three. Pick just one.", approvedMetricCount: 0 }).primaryArchetype).toBe("checklist-habits");
  });
  it("runs source integrity and visible-copy audit at the planning entrypoint", () => {
    const result = validateVisualPlanning({ ...contractArgs, plan: plan(1, "checklist-habits") });
    expect(result.sourceIntegrity).toBe("PASS");
    expect(result.visibleText.length).toBeGreaterThan(20);
  });
  it("rejects a paraphrased voice even when variety would pass", () => {
    const script = structuredClone(day1);
    script.scenes[0].voiceText = "You are pretty good with money.";
    expect(() => validateVisualPlanning({ ...contractArgs, script, plan: plan(1, "concept-story") })).toThrow(/SCRIPT_INTEGRITY/);
  });
  it("rejects invented visible copy even when narration is unchanged", () => {
    const script = structuredClone(day1);
    script.scenes[6].templateData = { template: "stat-hero", value: "$10", label: "CONVENIENCE TAX" };
    expect(() => validateVisualPlanning({ ...contractArgs, script, plan: plan(1, "concept-story") })).toThrow(/NO_UNAPPROVED_COPY/);
  });
  it("rejects mismatched source Day", () => {
    expect(() => validateVisualPlanning({ ...contractArgs, plan: plan(2, "concept-story") })).toThrow(/Day mismatch/);
  });
});

describe("validation H repetition control", () => {
  it("compares the two most recent Days and warns on a repeated layout/sequence", () => {
    const history = {
      version: "1.1" as const,
      entries: [
        buildVisualHistoryEntry(day1, plan(1, "checklist-habits", "stat-reveal")),
        buildVisualHistoryEntry(day2, plan(2, "concept-story", "accumulation")),
      ],
    };
    const copied = validateVisualVariety({ script: day2, plan: plan(3, "concept-story", "accumulation"), history });
    expect(copied.comparedWithDays).toEqual([2, 1]);
    expect(copied.status).toBe("WARNING");
    expect(copied.historyCoverage).toBe("two");
    expect(copied.similarity[0].timingSimilarity).toBeNull();
    expect(copied.repeatedTemplateSequenceWarning).toBe(true);
  });

  it("passes a composition that materially differs from recent signatures", () => {
    const history = {
      version: "1.1" as const,
      entries: [buildVisualHistoryEntry(day1, plan(1, "checklist-habits", "stat-reveal"))],
    };
    const result = validateVisualVariety({
      script: day2,
      plan: { ...plan(2, "concept-story", "accumulation"), layoutDirection: "left-right" },
      history,
    });
    expect(result.status).not.toBe("FAIL");
  });
  it("fails mechanical duplication only with matching layout, icons and timing", () => {
    const previous = { ...plan(2, "concept-story"), repeatedIconComposition: "same-layout-and-icon-slots" };
    const history = { version: "1.1", entries: [buildVisualHistoryEntry(day2, previous, transcript)] };
    const result = validateVisualVariety({ script: day2, plan: { ...previous, day: 3 }, history, transcript });
    expect(result.status).toBe("FAIL");
    expect(result.similarity[0].timingSimilarity).toBe(1);
    const changedTiming = structuredClone(transcript);
    changedTiming.scenes.forEach(scene => { scene.durationMs *= 2; });
    expect(validateVisualVariety({ script: day2, plan: { ...previous, day: 3 }, history, transcript: changedTiming }).status).toBe("WARNING");
  });
  it("reports no history and excludes current/future Days from comparisons", () => {
    const entry = buildVisualHistoryEntry(day2, plan(2, "concept-story"));
    const result = validateVisualVariety({ script: day2, plan: plan(2, "concept-story"), history: { version: "1.1", entries: [entry, { ...entry, day: 4 }] } });
    expect(result.comparedWithDays).toEqual([]);
    expect(result.historyCoverage).toBe("none");
    expect(result.status).toBe("PASS");
  });
  it("uses the two numerically latest prior Days regardless of history order", () => {
    const entry = buildVisualHistoryEntry(day2, plan(1, "concept-story"));
    const result = validateVisualVariety({ script: day2, plan: plan(5, "concept-story"), history: { version: "1.1", entries: [entry, { ...entry, day: 4 }, { ...entry, day: 2 }] } });
    expect(result.comparedWithDays).toEqual([4, 2]);
  });
  it("derives consecutive cards and stat placements from templates", () => {
    const script = structuredClone(day2);
    script.scenes.slice(0, 4).forEach(scene => { scene.templateData = { template: "callout", statement: "Example" }; });
    script.scenes[4].templateData = { template: "stat-hero", value: "1", label: "Example" };
    const entry = buildVisualHistoryEntry(script, plan(1, "concept-story"));
    expect(entry.maxConsecutiveCardScenes).toBeGreaterThanOrEqual(4);
    expect(entry.majorStatPlacements).toContain(5);
    const result = validateVisualVariety({ script, plan: plan(2, "concept-story"), history: { version: "1.1", entries: [entry] } });
    expect(result.warnings.some(w => w.includes("consecutive card"))).toBe(true);
    expect(result.repeatedStatPlacementWarning).toBe(true);
  });
});

describe("lightweight visual history", () => {
  it("rejects duplicate Days and inconsistent derived metadata", () => {
    const entry = buildVisualHistoryEntry(day2, plan(2, "concept-story"));
    expect(() => VisualHistorySchema.parse({ version: "1.1", entries: [entry, entry] })).toThrow(/Duplicate/);
    expect(() => VisualHistorySchema.parse({ version: "1.1", entries: [{ ...entry, sceneCount: 99 }] })).toThrow(/Inconsistent/);
    expect(() => VisualHistorySchema.parse({ version: "1.1", entries: [{ ...entry, sceneDurationMs: [1] }] })).toThrow(/Inconsistent/);
  });
  it("rejects transcript scene mismatch", () => {
    const changed = structuredClone(transcript);
    changed.scenes[0].id = "unrelated";
    expect(() => buildVisualHistoryEntry(day2, plan(2, "concept-story"), changed)).toThrow(/scene IDs/);
  });
  it("round-trips sorted history, treats missing as empty, and fails malformed files", async () => {
    const directory = await mkdtemp(join(tmpdir(), "money-visual-test-"));
    const path = join(directory, "history.json");
    try {
      expect((await loadVisualHistory(path)).entries).toEqual([]);
      const entries = [buildVisualHistoryEntry(day2, plan(2, "concept-story")), buildVisualHistoryEntry(day1, plan(1, "checklist-habits"))];
      await saveVisualHistory(path, entries);
      expect((await loadVisualHistory(path)).entries.map(entry => entry.day)).toEqual([1, 2]);
      await writeFile(path, "{malformed");
      await expect(loadVisualHistory(path)).rejects.toThrow();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
