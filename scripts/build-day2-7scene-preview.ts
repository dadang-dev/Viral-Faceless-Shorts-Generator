import { readFile, writeFile } from "node:fs/promises";
import { APPROVED_SCRIPT_FILE, assertScriptIntegrity, normalizeContractText } from "../src/contracts/content-contract.js";

/**
 * Benchmark-only editorial grouping. The Edge WordBoundary words and absolute
 * timings are preserved; only the visual/script scene wrappers are merged.
 * Canonical narration remains byte-for-byte equivalent after normalization.
 */
const out = process.env.DAY2_OUTPUT_DIR ?? "output/benchmarks/day-2-v12-7scene";
const read = async <T>(name: string): Promise<T> => JSON.parse(await readFile(`${out}/${name}`, "utf8"));
const groups = [[1], [2, 3], [4, 5], [6, 7], [8], [9, 10], [11]];
const oldToNew = new Map<number, number>();
groups.forEach((oldIds, index) => oldIds.forEach(id => oldToNew.set(id, index + 1)));
const mapSceneId = (id: string) => {
  const match = /^scene-(\d+)$/.exec(id);
  if (!match) throw new Error(`DAY2_7SCENE: invalid source scene id ${id}`);
  const mapped = oldToNew.get(Number(match[1]));
  if (!mapped) throw new Error(`DAY2_7SCENE: unmapped source scene ${id}`);
  return `scene-${mapped}`;
};

const script: any = await read("script.json");
const transcript: any = await read("transcript.json");
const sourcePlan: any = await read("data_visualizations.json");

const oldScenes = new Map<number, any>(script.scenes.map((scene: any) => [Number(scene.id.slice(6)), scene]));
const oldTranscript = new Map<number, any>(transcript.scenes.map((scene: any) => [Number(scene.id.slice(6)), scene]));

const mergedScenes = groups.map((oldIds, index) => {
  const first = oldScenes.get(oldIds[0]);
  const last = oldScenes.get(oldIds[oldIds.length - 1]);
  if (!first || !last) throw new Error(`DAY2_7SCENE: missing script group ${oldIds.join(",")}`);
  const type = oldIds.includes(11) ? "outro" : first.type === "hook" ? "hook" : "body";
  // Keep source-exact metadata from the first semantic beat. Visual finance
  // planning is carried by data_visualizations.json, not template copy.
  return { ...first, id: `scene-${index + 1}`, type, voiceText: oldIds.map(id => oldScenes.get(id)!.voiceText).join(" ") };
});

const mergedTranscriptScenes = groups.map((oldIds, index) => {
  const first = oldTranscript.get(oldIds[0]);
  const last = oldTranscript.get(oldIds[oldIds.length - 1]);
  if (!first || !last) throw new Error(`DAY2_7SCENE: missing transcript group ${oldIds.join(",")}`);
  const groupStart = first.startMs as number;
  const groupEnd = (last.startMs + last.durationMs) as number;
  const words = oldIds.flatMap(id => oldTranscript.get(id)!.words).map((word: any) => ({
    ...word,
    // WordBoundary absolute timing remains authoritative; local offsets are
    // simply rebased to the merged scene's start for scene-level validation.
    startMs: word.globalStartMs - groupStart,
    endMs: word.globalEndMs - groupStart,
  }));
  return { id: `scene-${index + 1}`, startMs: groupStart, durationMs: groupEnd - groupStart, words };
});

const remapRefs = (value: any): any => {
  if (Array.isArray(value)) return value.map(remapRefs);
  if (!value || typeof value !== "object") return value;
  const next: any = {};
  for (const [key, child] of Object.entries(value)) next[key] = key === "sceneId" ? mapSceneId(String(child)) : remapRefs(child);
  return next;
};

const mergedPlan: any = remapRefs(structuredClone(sourcePlan));
for (const sequence of mergedPlan.sequences) {
  sequence.sceneIds = [...new Set(sequence.sceneIds.map(mapSceneId))];
}

// Scene 6 is one reframe/question visual sequence: the reframe is visible on
// entry, then hands off cleanly to the question when that phrase is spoken.
const deprivation = mergedPlan.sequences.find((sequence: any) => sequence.id === "deprivation-reframe");
const question = mergedPlan.sequences.find((sequence: any) => sequence.id === "choice-question");
if (!deprivation || !question) throw new Error("DAY2_7SCENE: expected deprivation/question sequences");
question.sceneIds = ["scene-6"];
question.elements = [...question.elements, ...deprivation.elements.map((element: any) => ({ ...element, initial: true }))];
question.motionEvents = [...question.motionEvents, ...deprivation.motionEvents];
const questionElement = question.elements.find((element: any) => element.id === "question");
if (!questionElement) throw new Error("DAY2_7SCENE: question element missing");
questionElement.initial = false;
const reframe = question.elements.find((element: any) => element.id === "reframe");
if (!reframe) throw new Error("DAY2_7SCENE: reframe element missing");
// The merged scene needs a separate upper lane before the noticing question;
// keep the exact copy readable without intersecting the question or branches.
reframe.box = { x: 110, y: 250, w: 860, h: 200 };
reframe.fontSize = 76;
questionElement.box = { x: 150, y: 520, w: 780, h: 190 };
const questionFocus = question.motionEvents.find((event: any) => event.id === "question-focus");
if (questionFocus) questionFocus.pose = { box: { x: 150, y: 520, w: 780, h: 190 } };
// Hide the reframe before the question enters to prevent retained-state overlap.
question.motionEvents.push({
  id: "reframe-clear",
  trigger: { source: APPROVED_SCRIPT_FILE, sceneId: "scene-6", sourceSpan: "It's just noticing" },
  action: "hide", targets: ["reframe"], relation: "new-topic", transition: "crossfade",
  rationale: "Complete the sourced reframe before the sourced noticing question enters.",
});
question.motionEvents.push({
  id: "question-reveal",
  trigger: { source: APPROVED_SCRIPT_FILE, sceneId: "scene-6", sourceSpan: "It's just noticing" },
  action: "reveal", targets: ["question"], relation: "progression", transition: "directional-progression",
  rationale: "Reveal the exact noticing question at its transcript phrase.",
});
mergedPlan.sequences = mergedPlan.sequences.filter((sequence: any) => sequence.id !== "deprivation-reframe");

// Re-map the two approved number highlights to their merged transcript scenes.
const highlights: any = await read("number_highlights.json");
highlights.items = highlights.items.map((item: any) => ({ ...item, sceneId: mapSceneId(item.sceneId) }));

const captionSpecs: any[] = [
  { source: APPROVED_SCRIPT_FILE, sceneId: "scene-1", sourceSpan: "you can get a raise", sequenceId: "raise-hook", elementIds: ["raise"] },
  { source: APPROVED_SCRIPT_FILE, sceneId: "scene-2", sourceSpan: "still feel broke", sequenceId: "raise-hook", elementIds: ["broke"] },
  { source: APPROVED_SCRIPT_FILE, sceneId: "scene-2", sourceSpan: "lifestyle creep", sequenceId: "raise-hook", elementIds: ["creep"] },
  { source: APPROVED_SCRIPT_FILE, sceneId: "scene-6", sourceSpan: "The fix isn't depriving yourself.", sequenceId: "choice-question", elementIds: ["reframe"] },
  { source: APPROVED_SCRIPT_FILE, sceneId: "scene-6", sourceSpan: "because I actually wanted this", sequenceId: "choice-question", elementIds: ["wanted-copy"] },
  { source: APPROVED_SCRIPT_FILE, sceneId: "scene-6", sourceSpan: "because I could", sequenceId: "choice-question", elementIds: ["could-copy"] },
  { source: APPROVED_SCRIPT_FILE, sceneId: "scene-7", sourceSpan: "That one question", sequenceId: "question-payoff", elementIds: ["one-question"] },
];

assertScriptIntegrity({ ...script, scenes: mergedScenes }, normalizeContractText(script.scenes.map((scene: any) => scene.voiceText).join(" ")));
const nextScript = { ...script, scenes: mergedScenes };
const nextTranscript = { ...transcript, scenes: mergedTranscriptScenes, sourceScript: APPROVED_SCRIPT_FILE };
const grouping = groups.map((oldIds, index) => ({ sceneId: `scene-${index + 1}`, sourceScenes: oldIds.map(id => `scene-${id}`) }));
const visualPlan = {
  version: "1.1",
  day: 2,
  primaryArchetype: "accumulation",
  secondaryArchetype: "comparison",
  rationale: "Seven semantic visual scene groups; Edge TTS WordBoundary slices are merged deterministically without rewriting narration or absolute timing.",
  layoutDirection: "mixed",
  repeatedIconComposition: "calendar-page;object-led-home-car-food;retained-choice-cluster;qualitative-dual-tracks;separated-choice",
};

await writeFile(`${out}/script.json`, JSON.stringify(nextScript, null, 2));
await writeFile(`${out}/transcript.json`, JSON.stringify(nextTranscript, null, 2));
await writeFile(`${out}/data_visualizations.json`, JSON.stringify(mergedPlan, null, 2));
await writeFile(`${out}/number_highlights.json`, JSON.stringify(highlights, null, 2));
await writeFile(`${out}/hero-captions.json`, JSON.stringify(captionSpecs, null, 2));
await writeFile(`${out}/visual-plan.json`, JSON.stringify(visualPlan, null, 2));
await writeFile(`${out}/scene-groups.json`, JSON.stringify({ version: "1.0", day: 2, sceneCount: 7, source: APPROVED_SCRIPT_FILE, grouping }, null, 2));
await writeFile(`${out}/script.txt`, script.scenes.map((scene: any) => scene.voiceText).join(" "));
console.log(JSON.stringify({ status: "PASS", output: out, sceneCount: mergedScenes.length, grouping }, null, 2));
