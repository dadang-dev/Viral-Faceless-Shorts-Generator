import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import type { Script } from "../render/script-schema.js";
import { assertScriptIntegrity, auditVisibleText, type NumberHighlightFile, type WordBoundaryTranscript } from "../contracts/content-contract.js";

export const VISUAL_ARCHETYPES = [
  "stat-reveal",
  "comparison",
  "accumulation",
  "checklist-habits",
  "timeline-frequency",
  "concept-story",
] as const;

export const VisualArchetypeSchema = z.enum(VISUAL_ARCHETYPES);
export type VisualArchetype = z.infer<typeof VisualArchetypeSchema>;

export const LayoutDirectionSchema = z.enum([
  "centered",
  "vertical",
  "left-right",
  "right-left",
  "stacked",
  "timeline",
  "mixed",
]);

export const VisualPlanSchema = z.object({
  version: z.literal("1.1"),
  day: z.number().int().min(1).max(999),
  primaryArchetype: VisualArchetypeSchema,
  secondaryArchetype: VisualArchetypeSchema.optional(),
  rationale: z.string().min(10),
  layoutDirection: LayoutDirectionSchema,
  repeatedIconComposition: z.string().min(1).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.secondaryArchetype === value.primaryArchetype) {
    ctx.addIssue({
      code: "custom",
      path: ["secondaryArchetype"],
      message: "secondaryArchetype must differ from primaryArchetype",
    });
  }
});

export type VisualPlan = z.infer<typeof VisualPlanSchema>;

const TemplateNameSchema = z.enum([
  "hook",
  "comparison",
  "stat-hero",
  "feature-list",
  "callout",
  "outro",
]);

export const VisualHistoryEntrySchema = z.object({
  day: z.number().int().min(1),
  primaryArchetype: VisualArchetypeSchema,
  secondaryArchetype: VisualArchetypeSchema.optional(),
  sceneCount: z.number().int().min(3),
  templateSequence: z.array(TemplateNameSchema).min(3),
  majorStatPlacements: z.array(z.number().int().min(1)),
  maxConsecutiveCardScenes: z.number().int().min(0),
  layoutDirection: LayoutDirectionSchema,
  repeatedIconComposition: z.string().min(1).optional(),
  sceneDurationMs: z.array(z.number().positive()).optional(),
});

export type VisualHistoryEntry = z.infer<typeof VisualHistoryEntrySchema>;

export const VisualHistorySchema = z.object({
  version: z.literal("1.1"),
  entries: z.array(VisualHistoryEntrySchema),
}).superRefine((history, ctx) => {
  const days = new Set<number>();
  for (const entry of history.entries) {
    if (days.has(entry.day)) ctx.addIssue({ code: "custom", message: "Duplicate history day" });
    days.add(entry.day);
    if (entry.sceneCount !== entry.templateSequence.length
      || entry.majorStatPlacements.some((position) => position > entry.sceneCount)
      || (entry.sceneDurationMs && entry.sceneDurationMs.length !== entry.sceneCount)) {
      ctx.addIssue({ code: "custom", message: "Inconsistent history scene metadata" });
    }
  }
});

export type VisualHistory = z.infer<typeof VisualHistorySchema>;

export interface ArchetypeRecommendation {
  primaryArchetype: VisualArchetype;
  secondaryArchetype?: VisualArchetype;
  scores: Record<VisualArchetype, number>;
  rationale: string;
}

const countMatches = (value: string, pattern: RegExp): number => value.match(pattern)?.length ?? 0;

/**
 * Deterministic, content-driven recommendation. It reads the entire narration
 * before scene planning; template choice never affects recommendation scores.
 * This lexical shortlist is advisory: the planner must justify its final choice.
 */
export function recommendVisualArchetypes(args: {
  approvedVoice: string;
  approvedMetricCount: number;
}): ArchetypeRecommendation {
  if (!args.approvedVoice.trim()) throw new Error("VISUAL_PLANNING: full approved voice-over is required");
  const text = args.approvedVoice.toLowerCase();

  const scores: Record<VisualArchetype, number> = {
    "stat-reveal": args.approvedMetricCount * 2,
    comparison: countMatches(text, /\b(vs|versus|actual(?:ly)?|guess|more than|as fast as|not smart)\b|instead of/g) * 2,
    accumulation: countMatches(text, /\b(stack|add up|every|recurring|times? a week|per week|subscriptions?|creep|rises?)\b/g),
    "checklist-habits": countMatches(text, /\b(number one|number two|number three|habits|checklist|pick just one)\b/g) * 3,
    "timeline-frequency": countMatches(text, /\b(day|daily|week|weekly|month|monthly|once|years?|ago|while|january|sunday|recurring|grow|first)\b/g),
    "concept-story": countMatches(text, /\b(brain|brains|feel|feels|mindset|wiring|wired|fear|biology|emotional|noticing|relief|unsafe|safe|joke|willpower|weakness|discipline|system)\b/g),
  };

  const tieBreakOrder: VisualArchetype[] = [
    "concept-story",
    "comparison",
    "accumulation",
    "checklist-habits",
    "timeline-frequency",
    "stat-reveal",
  ];
  const ranked = [...VISUAL_ARCHETYPES].sort((a, b) => {
    const scoreDiff = scores[b] - scores[a];
    return scoreDiff || tieBreakOrder.indexOf(a) - tieBreakOrder.indexOf(b);
  });
  const primaryArchetype = ranked[0];
  const secondaryCandidate = ranked[1];
  const secondaryArchetype = scores[secondaryCandidate] >= Math.max(2, scores[primaryArchetype] * 0.4)
    ? secondaryCandidate
    : undefined;

  return {
    primaryArchetype,
    secondaryArchetype,
    scores,
    rationale: `Full-script signals selected ${primaryArchetype} (${scores[primaryArchetype]})`
      + (secondaryArchetype ? ` with ${secondaryArchetype} (${scores[secondaryArchetype]}) as support.` : "."),
  };
}

function longestCommonSubsequence<T>(left: T[], right: T[]): number {
  const rows = Array.from({ length: left.length + 1 }, () => Array<number>(right.length + 1).fill(0));
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      rows[i][j] = left[i - 1] === right[j - 1]
        ? rows[i - 1][j - 1] + 1
        : Math.max(rows[i - 1][j], rows[i][j - 1]);
    }
  }
  return rows[left.length][right.length];
}

function sequenceSimilarity(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) return 0;
  return longestCommonSubsequence(left, right) / Math.max(left.length, right.length);
}

function statPlacementSimilarity(left: VisualHistoryEntry, right: VisualHistoryEntry): number {
  if (left.majorStatPlacements.length === 0 || right.majorStatPlacements.length === 0) return 0;
  if (left.majorStatPlacements.length !== right.majorStatPlacements.length) return 0;
  const leftNormalized = left.majorStatPlacements.map((position) => position / left.sceneCount);
  const rightNormalized = right.majorStatPlacements.map((position) => position / right.sceneCount);
  const averageDelta = leftNormalized.reduce((sum, value, index) => sum + Math.abs(value - rightNormalized[index]), 0)
    / leftNormalized.length;
  return Math.max(0, 1 - averageDelta * 4);
}

export function buildVisualHistoryEntry(script: Script, rawPlan: unknown, transcript?: WordBoundaryTranscript): VisualHistoryEntry {
  const plan = VisualPlanSchema.parse(rawPlan);
  const templateSequence = script.scenes.map((scene) => TemplateNameSchema.parse(scene.templateData.template));
  // stat-hero is spotlight typography, not a card container.
  const cardTemplates = new Set(["comparison", "feature-list", "callout"]);
  if (transcript && (transcript.scenes.length !== script.scenes.length
    || transcript.scenes.some((scene, index) => scene.id !== script.scenes[index].id))) {
    throw new Error("VISUAL_HISTORY: transcript scene IDs do not match script");
  }
  let run = 0;
  let maxConsecutiveCardScenes = 0;
  for (const template of templateSequence) {
    run = cardTemplates.has(template) ? run + 1 : 0;
    maxConsecutiveCardScenes = Math.max(maxConsecutiveCardScenes, run);
  }
  return VisualHistoryEntrySchema.parse({
    day: plan.day,
    primaryArchetype: plan.primaryArchetype,
    secondaryArchetype: plan.secondaryArchetype,
    sceneCount: script.scenes.length,
    templateSequence,
    majorStatPlacements: templateSequence
      .map((template, index) => template === "stat-hero" ? index + 1 : 0)
      .filter(Boolean),
    maxConsecutiveCardScenes,
    layoutDirection: plan.layoutDirection,
    repeatedIconComposition: plan.repeatedIconComposition,
    sceneDurationMs: transcript?.scenes.map((scene) => scene.durationMs),
  });
}

export interface VisualSimilarityResult {
  day: number;
  score: number;
  sceneCountSimilarity: number;
  primaryArchetypeSimilarity: number;
  layoutSimilarity: number;
  statPlacementSimilarity: number;
  iconCompositionSimilarity: number;
  templateSequenceSimilarity: number;
  repeatedLayout: boolean;
  repeatedStatPlacement: boolean;
  repeatedIconComposition: boolean;
  repeatedCardRun: boolean;
  timingSimilarity: number | null;
}

export interface VisualVarietyReport {
  status: "PASS" | "WARNING" | "FAIL";
  primaryArchetype: VisualArchetype;
  secondaryArchetype?: VisualArchetype;
  comparedWithDays: number[];
  similarity: VisualSimilarityResult[];
  repeatedTemplateSequenceWarning: boolean;
  repeatedLayoutWarning: boolean;
  repeatedStatPlacementWarning: boolean;
  warnings: string[];
  historyCoverage: "none" | "one" | "two";
}

/** Compare against the two most recent prior entries when available. */
export function validateVisualVariety(args: {
  script: Script;
  plan: unknown;
  history: unknown;
  transcript?: WordBoundaryTranscript;
}): VisualVarietyReport {
  const plan = VisualPlanSchema.parse(args.plan);
  const history = VisualHistorySchema.parse(args.history);
  const current = buildVisualHistoryEntry(args.script, plan, args.transcript);
  const recent = history.entries
    .filter((entry) => entry.day < plan.day)
    .sort((a, b) => b.day - a.day)
    .slice(0, 2);

  const similarity = recent.map((entry): VisualSimilarityResult => {
    const templateScore = sequenceSimilarity(current.templateSequence, entry.templateSequence);
    const sceneCountScore = Math.min(current.sceneCount, entry.sceneCount) / Math.max(current.sceneCount, entry.sceneCount);
    const archetypeScore = current.primaryArchetype === entry.primaryArchetype ? 1 : 0;
    const repeatedLayout = current.layoutDirection === entry.layoutDirection;
    const statScore = statPlacementSimilarity(current, entry);
    const repeatedStatPlacement = statScore >= 0.85;
    const repeatedIconComposition = Boolean(
      current.repeatedIconComposition
      && current.repeatedIconComposition === entry.repeatedIconComposition,
    );
    const repeatedCardRun = current.maxConsecutiveCardScenes >= 4
      && current.maxConsecutiveCardScenes === entry.maxConsecutiveCardScenes;
    const timingSimilarity = current.sceneDurationMs && entry.sceneDurationMs
      && current.sceneDurationMs.length === entry.sceneDurationMs.length
      ? current.sceneDurationMs.reduce((sum, duration, index) => sum
        + Math.min(duration, entry.sceneDurationMs![index]) / Math.max(duration, entry.sceneDurationMs![index]), 0)
        / current.sceneDurationMs.length
      : null;
    const score = templateScore * 0.45
      + sceneCountScore * 0.10
      + archetypeScore * 0.20
      + (repeatedLayout ? 0.15 : 0)
      + statScore * 0.10;
    return {
      day: entry.day,
      score: Number(score.toFixed(3)),
      sceneCountSimilarity: sceneCountScore,
      primaryArchetypeSimilarity: archetypeScore,
      layoutSimilarity: repeatedLayout ? 1 : 0,
      statPlacementSimilarity: statScore,
      iconCompositionSimilarity: repeatedIconComposition ? 1 : 0,
      templateSequenceSimilarity: Number(templateScore.toFixed(3)),
      repeatedLayout,
      repeatedStatPlacement,
      repeatedIconComposition,
      repeatedCardRun,
      timingSimilarity,
    };
  });

  const repeatedTemplateSequenceWarning = similarity.some((item) => item.templateSequenceSimilarity >= 0.85);
  const repeatedLayoutWarning = similarity.some((item) => item.repeatedLayout && item.score >= 0.65);
  const repeatedStatPlacementWarning = similarity.some((item) => item.repeatedStatPlacement && item.score >= 0.65);
  const mechanicalCopy = similarity.some((item) => (
    item.score >= 0.90
    && item.templateSequenceSimilarity >= 0.90
    && item.repeatedLayout
    && item.repeatedIconComposition
    && item.timingSimilarity !== null && item.timingSimilarity >= 0.95
  ));

  const warnings: string[] = [];
  if (repeatedTemplateSequenceWarning) warnings.push("VISUAL_REPETITION_WARNING: template sequence is too similar to a recent Day");
  if (repeatedLayoutWarning) warnings.push("VISUAL_REPETITION_WARNING: layout direction repeats a recent high-similarity Day");
  if (repeatedStatPlacementWarning) warnings.push("VISUAL_REPETITION_WARNING: major stat placement repeats a recent high-similarity Day");
  if (similarity.some((item) => item.repeatedIconComposition)) warnings.push("VISUAL_REPETITION_WARNING: icon composition repeats a recent Day");
  if (similarity.some((item) => item.repeatedCardRun && item.templateSequenceSimilarity >= 0.85)) warnings.push("VISUAL_REPETITION_WARNING: consecutive card run repeats a recent sequence");

  return {
    status: mechanicalCopy ? "FAIL" : warnings.length > 0 ? "WARNING" : "PASS",
    primaryArchetype: plan.primaryArchetype,
    secondaryArchetype: plan.secondaryArchetype,
    comparedWithDays: recent.map((entry) => entry.day),
    similarity,
    repeatedTemplateSequenceWarning,
    repeatedLayoutWarning,
    repeatedStatPlacementWarning,
    warnings,
    historyCoverage: recent.length === 0 ? "none" : recent.length === 1 ? "one" : "two",
  };
}

/** Planning entrypoint: variety never bypasses exact narration or visible-copy gates. */
export function validateVisualPlanning(args: {
  script: Script; plan: unknown; history: unknown; approvedVoice: string;
  auxiliaryMarkdown: string; numberHighlights: NumberHighlightFile;
  brandConfig: string[]; transcript?: WordBoundaryTranscript;
}) {
  const plan = VisualPlanSchema.parse(args.plan);
  if (plan.day !== args.numberHighlights.day) throw new Error("VISUAL_PLANNING: Day mismatch");
  assertScriptIntegrity(args.script, args.approvedVoice);
  const visibleText = auditVisibleText(args);
  return { ...validateVisualVariety(args), sourceIntegrity: "PASS", visibleText };
}

export async function loadVisualHistory(path: string): Promise<VisualHistory> {
  try {
    return VisualHistorySchema.parse(JSON.parse(await readFile(path, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { version: "1.1", entries: [] };
    throw error;
  }
}

export async function saveVisualHistory(path: string, entries: VisualHistoryEntry[]): Promise<void> {
  const history = VisualHistorySchema.parse({
    version: "1.1",
    entries: [...entries].sort((a, b) => a.day - b.day),
  });
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(history, null, 2) + "\n", "utf8");
}
