import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ScriptSchema } from "../render/script-schema.js";
import {
  NumberHighlightFileSchema,
  REQUIRED_EDGE_VOICE,
  assertMoneyHabitsTheme,
  assertScriptIntegrity,
  assertTemplateScenePlan,
  auditVisibleText,
  extractApprovedVoiceOver,
  resolveNumberHighlights,
  type WordBoundaryTranscript,
} from "./content-contract.js";

const approvedMarkdown = readFileSync("money-habits-script-v2-optimized.md", "utf8");
const auxiliaryMarkdown = readFileSync("money-habits-ALL.md", "utf8");
const script = ScriptSchema.parse(JSON.parse(readFileSync("output/day-1/script.json", "utf8")));
const highlights = NumberHighlightFileSchema.parse(JSON.parse(readFileSync("output/day-1/number_highlights.json", "utf8")));

describe("Money Habits source contract", () => {
  it("keeps final Day 1 voiceText equal to approved v2", () => {
    expect(() => assertScriptIntegrity(script, extractApprovedVoiceOver(approvedMarkdown, 1))).not.toThrow();
  });

  it("fails when narration is paraphrased", () => {
    const changed = structuredClone(script);
    changed.scenes[0].voiceText = "You are pretty good with money.";
    expect(() => assertScriptIntegrity(changed, extractApprovedVoiceOver(approvedMarkdown, 1))).toThrow(/SCRIPT_INTEGRITY/);
  });

  it("traces every planned visible string to approved sources", () => {
    const audit = auditVisibleText({
      script,
      approvedVoice: extractApprovedVoiceOver(approvedMarkdown, 1),
      auxiliaryMarkdown,
      numberHighlights: highlights,
      brandConfig: ["Money Habits", "@moneyhabits", "US TikTok", "DAILY HABITS", "#MoneyHabits"],
    });
    expect(audit.length).toBeGreaterThan(20);
  });

  it("rejects invented visible copy", () => {
    const changed = structuredClone(script);
    changed.scenes[6].templateData = { template: "stat-hero", value: "$10", label: "CONVENIENCE TAX" };
    expect(() => auditVisibleText({
      script: changed,
      approvedVoice: extractApprovedVoiceOver(approvedMarkdown, 1),
      auxiliaryMarkdown,
      numberHighlights: highlights,
      brandConfig: ["Money Habits", "@moneyhabits", "US TikTok", "DAILY HABITS", "#MoneyHabits"],
    })).toThrow(/NO_UNAPPROVED_COPY/);
  });

  it("accepts only the navy/off-white/gold template palette", () => {
    const css = readFileSync("src/render/templates/styles.css", "utf8");
    expect(() => assertMoneyHabitsTheme(css, JSON.stringify(script))).not.toThrow();
    expect(() => assertMoneyHabitsTheme(`${css}\n.bad{color:#22d3ee}`, JSON.stringify(script))).toThrow(/THEME/);
  });
});

describe("number highlight contract", () => {
  it("accepts an empty approved list for a Day with no numeric highlight", () => {
    expect(NumberHighlightFileSchema.parse({
      version: "1.0", day: 4, source: "money-habits-script-v2-optimized.md", items: [],
    }).items).toEqual([]);
  });

  it("resolves timing from WordBoundary transcript and fails on a missing phrase", () => {
    const transcript: WordBoundaryTranscript = {
      version: "1.0",
      provider: "edge-tts",
      boundarySource: "WordBoundary",
      voiceId: REQUIRED_EDGE_VOICE,
      sourceScript: "money-habits-script-v2-optimized.md",
      scenes: [{
        id: "scene-4",
        startMs: 1000,
        durationMs: 2000,
        words: [
          { text: "fourteen", startMs: 100, endMs: 400, globalStartMs: 1100, globalEndMs: 1400 },
          { text: "dollars", startMs: 420, endMs: 700, globalStartMs: 1420, globalEndMs: 1700 },
          { text: "streaming", startMs: 720, endMs: 900, globalStartMs: 1720, globalEndMs: 1900 },
          { text: "app", startMs: 920, endMs: 1100, globalStartMs: 1920, globalEndMs: 2100 },
        ],
      }],
    };
    const one = NumberHighlightFileSchema.parse({
      version: "1.0", day: 1, source: "money-habits-script-v2-optimized.md",
      items: [{ id: "x", spokenPhrase: "fourteen dollars", canonicalText: "fourteen dollars", displayText: "$14", context: "streaming app", sceneId: "scene-4", target: "left.value", template: "comparison" }],
    });
    expect(resolveNumberHighlights(one, transcript)[0]).toMatchObject({ startSec: 0.1, endSec: 0.7, source: "transcript.json" });
    one.items[0].spokenPhrase = "fifteen dollars";
    expect(() => resolveNumberHighlights(one, transcript)).toThrow(/resolved 0 times/);
  });
});

describe("template and scene timing contract", () => {
  it("accepts ordered positive transcript timing and rejects overlap", () => {
    const sample = ScriptSchema.parse({
      version: "1.0",
      metadata: { title: "x", source: { url: "x", domain: "x", image: null }, channel: "Money Habits" },
      voice: { provider: "edge-tts", voiceId: REQUIRED_EDGE_VOICE, speed: 0.8 },
      scenes: [
        { id: "scene-1", type: "hook", voiceText: "One", templateData: { template: "hook", headline: "ONE", kenBurns: "zoom-in" } },
        { id: "scene-2", type: "body", voiceText: "Two", templateData: { template: "callout", statement: "TWO" } },
        { id: "scene-3", type: "outro", voiceText: "Three", templateData: { template: "outro", ctaTop: "THREE", channelName: "Money Habits", source: "THREE" } },
      ],
    });
    const transcript: WordBoundaryTranscript = {
      version: "1.0", provider: "edge-tts", boundarySource: "WordBoundary",
      voiceId: REQUIRED_EDGE_VOICE, sourceScript: "money-habits-script-v2-optimized.md",
      scenes: sample.scenes.map((scene, index) => ({
        id: scene.id, startMs: index * 1200, durationMs: 1000,
        words: [{ text: scene.voiceText, startMs: 0, endMs: 700, globalStartMs: index * 1200, globalEndMs: index * 1200 + 700 }],
      })),
    };
    expect(assertTemplateScenePlan(sample, transcript)).toMatchObject({ status: "PASS", sceneCount: 3 });
    transcript.scenes[1].startMs = 900;
    expect(() => assertTemplateScenePlan(sample, transcript)).toThrow(/overlap/);
  });
});
