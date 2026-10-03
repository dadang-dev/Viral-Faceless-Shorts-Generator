import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import type { Script } from "../render/script-schema.js";
import { parseSrt } from "../assets/subtitle-tools.js";
import { LOCKED_PAGE_BRAND } from "../brand-config.js";

export const APPROVED_SCRIPT_FILE = "money-habits-script-v2.1-verified.md";
export const HISTORICAL_SCRIPT_FILE = "money-habits-script-v2-optimized.md";
// Historical artifacts remain readable, but canonical production selects APPROVED_SCRIPT_FILE.
export const ScriptSourceSchema = z.enum([APPROVED_SCRIPT_FILE, HISTORICAL_SCRIPT_FILE]);
export const AUXILIARY_SCRIPT_FILE = "money-habits-ALL.md";
export const REQUIRED_EDGE_VOICE = "en-US-AndrewMultilingualNeural";

export function normalizeContractText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function extractApprovedVoiceOver(markdown: string, day: number): string {
  const dayBlock = markdown.match(new RegExp(`## Day ${day}\\b[\\s\\S]*?(?=\\n## Day ${day + 1}\\b|$)`, "i"))?.[0];
  if (!dayBlock) throw new Error(`SOURCE_CONTRACT: Day ${day} not found in ${APPROVED_SCRIPT_FILE}`);
  const block = dayBlock.match(/\*\*Voice-over:\*\*\s*\n([\s\S]*)/i)?.[1];
  if (!block) throw new Error(`SOURCE_CONTRACT: Voice-over block missing for Day ${day}`);
  const voice = block
    .split(/\r?\n/)
    .filter((line) => /^\s*>/.test(line))
    .map((line) => line.replace(/^\s*>\s?/, "").trim())
    .join(" ")
    .replace(/^"|"$/g, "")
    .trim();
  if (!voice) throw new Error(`SOURCE_CONTRACT: Empty Voice-over for Day ${day}`);
  return voice;
}

export const NumberHighlightFileSchema = z.object({
  version: z.literal("1.0"),
  day: z.number().int().min(1).max(14),
  source: ScriptSourceSchema,
  items: z.array(z.object({
    id: z.string().min(1),
    spokenPhrase: z.string().min(1),
    canonicalText: z.string().min(1),
    displayText: z.string().min(1),
    context: z.string().min(1).optional(),
    template: z.enum(["hook", "comparison", "stat-hero", "feature-list", "callout", "outro"]).optional(),
    sceneId: z.string().min(1),
    target: z.enum(["left.value", "right.value", "stat.value"]),
  })),
});

export type NumberHighlightFile = z.infer<typeof NumberHighlightFileSchema>;

export interface TranscriptWord {
  text: string;
  startMs: number;
  endMs: number;
  globalStartMs: number;
  globalEndMs: number;
}

export interface TranscriptScene {
  id: string;
  startMs: number;
  durationMs: number;
  words: TranscriptWord[];
}

export interface WordBoundaryTranscript {
  version: "1.0";
  provider: "edge-tts";
  boundarySource: "WordBoundary";
  voiceId: typeof REQUIRED_EDGE_VOICE;
  sourceScript: z.infer<typeof ScriptSourceSchema>;
  scenes: TranscriptScene[];
}

export async function buildWordBoundaryTranscript(args: {
  scenes: Array<{ id: string; srtPath: string; durationSec: number }>;
  gapSec: number;
  outputPath: string;
  voiceId: string;
}): Promise<WordBoundaryTranscript> {
  if (args.voiceId !== REQUIRED_EDGE_VOICE) {
    throw new Error(`TRANSCRIPT: required voice ${REQUIRED_EDGE_VOICE}, got ${args.voiceId}`);
  }
  let cursorMs = 0;
  const scenes: TranscriptScene[] = [];
  for (const scene of args.scenes) {
    const cues = parseSrt(await readFile(scene.srtPath, "utf8"));
    if (cues.length === 0) throw new Error(`TRANSCRIPT: no Edge TTS WordBoundary cues for ${scene.id}`);
    const durationMs = Math.round(scene.durationSec * 1000);
    const words = cues.map((cue) => ({
      text: cue.text,
      startMs: cue.startMs,
      endMs: cue.endMs,
      globalStartMs: cursorMs + cue.startMs,
      globalEndMs: cursorMs + cue.endMs,
    }));
    scenes.push({ id: scene.id, startMs: cursorMs, durationMs, words });
    cursorMs += durationMs + Math.round(args.gapSec * 1000);
  }
  const transcript: WordBoundaryTranscript = {
    version: "1.0",
    provider: "edge-tts",
    boundarySource: "WordBoundary",
    voiceId: REQUIRED_EDGE_VOICE,
    sourceScript: APPROVED_SCRIPT_FILE,
    scenes,
  };
  await writeFile(args.outputPath, JSON.stringify(transcript, null, 2), "utf8");
  return transcript;
}

function phraseTokens(value: string): string[] {
  return value.trim().split(/\s+/).map(normalizeContractText).filter(Boolean);
}

export function resolveNumberHighlights(file: NumberHighlightFile, transcript: WordBoundaryTranscript) {
  return file.items.map((item) => {
    const scene = transcript.scenes.find((candidate) => candidate.id === item.sceneId);
    if (!scene) throw new Error(`NUMBER_HIGHLIGHTS: scene ${item.sceneId} not found for ${item.id}`);
    const expected = phraseTokens(item.spokenPhrase);
    const actual = scene.words.map((word) => normalizeContractText(word.text));
    const starts: number[] = [];
    for (let i = 0; i <= actual.length - expected.length; i += 1) {
      if (expected.every((token, offset) => actual[i + offset] === token)) starts.push(i);
    }
    if (starts.length !== 1) {
      throw new Error(`NUMBER_HIGHLIGHTS: phrase "${item.spokenPhrase}" resolved ${starts.length} times in ${item.sceneId}`);
    }
    if (item.context) {
      const sceneText = normalizeContractText(scene.words.map((word) => word.text).join(" "));
      if (!sceneText.includes(normalizeContractText(item.context))) {
        throw new Error(`NUMBER_HIGHLIGHTS: context "${item.context}" not found in ${item.sceneId}`);
      }
    }
    const first = scene.words[starts[0]];
    const last = scene.words[starts[0] + expected.length - 1];
    return {
      id: item.id,
      sceneId: item.sceneId,
      target: item.target,
      displayText: item.displayText,
      startSec: first.startMs / 1000,
      endSec: last.endMs / 1000,
      globalStartSec: first.globalStartMs / 1000,
      globalEndSec: last.globalEndMs / 1000,
      source: "transcript.json" as const,
    };
  });
}

export function assertScriptIntegrity(script: Script, approvedVoice: string): void {
  const voiceText = script.scenes.map((scene) => scene.voiceText).join(" ");
  if (normalizeContractText(voiceText) !== normalizeContractText(approvedVoice)) {
    throw new Error("SCRIPT_INTEGRITY: final voiceText differs from approved Day voice-over");
  }
}

export function assertTemplateScenePlan(script: Script, transcript: WordBoundaryTranscript) {
  if (script.scenes.length !== transcript.scenes.length) {
    throw new Error("TEMPLATE_SCENE: script/transcript scene count mismatch");
  }

  const ids = new Set<string>();
  let previousEndMs = 0;
  let minDurationMs = Number.POSITIVE_INFINITY;
  let maxDurationMs = 0;

  script.scenes.forEach((scene, index) => {
    if (ids.has(scene.id)) throw new Error(`TEMPLATE_SCENE: duplicate scene id ${scene.id}`);
    ids.add(scene.id);

    const timed = transcript.scenes[index];
    if (!timed || timed.id !== scene.id) {
      throw new Error(`TEMPLATE_SCENE: scene order/id mismatch at index ${index}`);
    }
    if (!Number.isFinite(timed.startMs) || timed.startMs < 0) {
      throw new Error(`TEMPLATE_SCENE: invalid start time for ${scene.id}`);
    }
    if (!Number.isFinite(timed.durationMs) || timed.durationMs <= 0) {
      throw new Error(`TEMPLATE_SCENE: zero or invalid duration for ${scene.id}`);
    }
    if (index > 0 && timed.startMs < previousEndMs) {
      throw new Error(`TEMPLATE_SCENE: invalid timing overlap at ${scene.id}`);
    }
    if (timed.words.length === 0) {
      throw new Error(`TEMPLATE_SCENE: no WordBoundary cues for ${scene.id}`);
    }
    const lastWordEndMs = Math.max(...timed.words.map((word) => word.endMs));
    if (lastWordEndMs > timed.durationMs + 500) {
      throw new Error(`TEMPLATE_SCENE: WordBoundary exceeds scene duration for ${scene.id}`);
    }

    minDurationMs = Math.min(minDurationMs, timed.durationMs);
    maxDurationMs = Math.max(maxDurationMs, timed.durationMs);
    previousEndMs = timed.startMs + timed.durationMs;
  });

  return {
    status: "PASS" as const,
    sceneCount: script.scenes.length,
    minDurationMs,
    maxDurationMs,
    timingSource: "transcript.json" as const,
    schema: "ScriptSchema" as const,
  };
}

interface VisibleTextAudit {
  path: string;
  text: string;
  source: "approved_voice" | "auxiliary_metadata" | "number_highlights" | "brand_config" | "platform_ui" | "structural";
  sourceSpan: string;
}

export function auditVisibleText(args: {
  script: Script;
  approvedVoice: string;
  auxiliaryMarkdown: string;
  numberHighlights: NumberHighlightFile;
  brandConfig: string[];
}): VisibleTextAudit[] {
  const candidates: Array<{ path: string; text: string }> = [];
  for (const scene of args.script.scenes) {
    const td = scene.templateData as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(td)) {
      if (["template", "kenBurns", "bgSrc", "icon"].includes(key)) continue;
      if (typeof value === "string") candidates.push({ path: `${scene.id}.templateData.${key}`, text: value });
      if (Array.isArray(value)) value.forEach((text, index) => candidates.push({ path: `${scene.id}.templateData.${key}[${index}]`, text: String(text) }));
      if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const [sideKey, sideValue] of Object.entries(value as Record<string, unknown>)) {
          if (typeof sideValue === "string") candidates.push({ path: `${scene.id}.templateData.${key}.${sideKey}`, text: sideValue });
        }
      }
    }
  }
  candidates.push(
    { path: "shell.brandTag", text: LOCKED_PAGE_BRAND.tagline },
    { path: "platform.follow", text: "Follow" },
    { path: "platform.following", text: "Following" },
  );

  const approved = normalizeContractText(args.approvedVoice);
  const auxiliary = normalizeContractText(args.auxiliaryMarkdown);
  const highlightDisplays = new Map(args.numberHighlights.items.map((item) => [normalizeContractText(item.displayText), item.canonicalText]));
  const brand = args.brandConfig.map(normalizeContractText);
  const structural = new Set(["+", "$", "until"]);
  const platform = new Set(["follow", "following"]);

  return candidates.map((candidate) => {
    const normalized = normalizeContractText(candidate.text);
    if (normalized && approved.includes(normalized)) return { ...candidate, source: "approved_voice", sourceSpan: candidate.text };
    if (normalized && auxiliary.includes(normalized)) return { ...candidate, source: "auxiliary_metadata", sourceSpan: candidate.text };
    if (highlightDisplays.has(normalized)) return { ...candidate, source: "number_highlights", sourceSpan: highlightDisplays.get(normalized)! };
    if (brand.includes(normalized)) return { ...candidate, source: "brand_config", sourceSpan: candidate.text };
    if (platform.has(normalized)) return { ...candidate, source: "platform_ui", sourceSpan: candidate.text };
    if (structural.has(normalized) || structural.has(candidate.text)) return { ...candidate, source: "structural", sourceSpan: candidate.text };
    throw new Error(`NO_UNAPPROVED_COPY: ${candidate.path} = "${candidate.text}" has no approved source span`);
  });
}

export function assertMoneyHabitsTheme(css: string, serializedScript: string): void {
  const forbidden = [
    /dark-neon/i, /cyan/i, /purple/i, /violet/i,
    /#22d3ee/i, /#38bdf8/i, /#a855f7/i, /#7c3aed/i, /#2a1454/i, /#3b1d6e/i,
    /rgba\(34\s*,\s*211\s*,\s*238/i, /rgba\(168\s*,\s*85\s*,\s*247/i, /rgba\(124\s*,\s*58\s*,\s*237/i,
  ];
  const combined = `${css}\n${serializedScript}`;
  const hit = forbidden.find((pattern) => pattern.test(combined));
  if (hit) throw new Error(`THEME: forbidden dark-neon token matched ${hit}`);
  for (const required of ["--navy-deep", "--text-primary", "--accent-gold"]) {
    if (!css.includes(required)) throw new Error(`THEME: missing required token ${required}`);
  }
}
