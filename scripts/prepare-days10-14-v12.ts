import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { ScriptSchema } from "../src/render/script-schema.js";
import { FinancePlanSchema, transitionFor } from "../src/contracts/finance-motion.js";
import { assertBenchmarkDestination } from "../src/contracts/benchmark-isolation.js";
import { APPROVED_SCRIPT_FILE, REQUIRED_EDGE_VOICE, assertScriptIntegrity, extractApprovedVoiceOver } from "../src/contracts/content-contract.js";
import { LOCKED_PAGE_BRAND } from "../src/brand-config.js";
import { DAY_STORY_SPECS, day10to14RichStoryPlan, type StoryDay } from "../src/day10-14-rich-story.js";

const day = Number(process.argv[2]) as StoryDay;
const spec = DAY_STORY_SPECS[day];
if (!spec) throw new Error("Use a Day number from 10 to 14");
const out = resolve(`output/benchmarks/day-${day}-v12-differentactually`);
assertBenchmarkDestination(out);
const replan = process.argv.includes("--replan");
try {
  await access(join(out, "script.json"));
  if (!replan) throw new Error(`DESTINATION_EXISTS: preserve previous Day ${day} evidence`);
  try { await access(join(out, "video.mp4")); throw new Error(`REPLAN_BLOCKED: Day ${day} has a rendered MP4`); }
  catch (error: unknown) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
} catch (error: unknown) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }

const approved = extractApprovedVoiceOver(await readFile(APPROVED_SCRIPT_FILE, "utf8"), day);
let cursor = 0;
const slices = spec.endings.map(ending => {
  const index = approved.indexOf(ending, cursor);
  if (index < 0) throw new Error(`SOURCE_CONTRACT: missing Day ${day} boundary ${ending}`);
  const next = index + ending.length;
  const text = approved.slice(cursor, next).trim();
  cursor = next;
  return text;
});
if (approved.slice(cursor).trim()) throw new Error(`SOURCE_CONTRACT: ungrouped Day ${day} narration`);
if (slices.length !== spec.sceneCopy.length) throw new Error(`DAY${day}_SCENE_COPY_COUNT`);
for (const [index, phrase] of spec.sceneCopy.entries()) if (!slices[index].toLowerCase().includes(phrase.toLowerCase())) throw new Error(`DAY${day}_SCENE_COPY_SOURCE: ${index + 1}.${phrase}`);
if (!slices[0].toLowerCase().includes(spec.hookSubhead.toLowerCase())) throw new Error(`DAY${day}_HOOK_SUBHEAD_SOURCE`);

const script = ScriptSchema.parse({
  version: "1.0",
  metadata: { visualSystem: "1.2", title: spec.title, source: { url: APPROVED_SCRIPT_FILE, domain: APPROVED_SCRIPT_FILE, image: null }, channel: LOCKED_PAGE_BRAND.displayName },
  voice: { provider: "edge-tts", voiceId: REQUIRED_EDGE_VOICE, speed: 0.8 },
  scenes: slices.map((voiceText, index) => ({ id: `scene-${index + 1}`, type: index === 0 ? "hook" : index === slices.length - 1 ? "outro" : "body", voiceText,
    templateData: index === 0 ? { template: "hook", headline: spec.sceneCopy[0].toUpperCase(), subhead: spec.hookSubhead }
      : index === slices.length - 1 ? { template: "outro", ctaTop: spec.sceneCopy[index].toUpperCase(), channelName: LOCKED_PAGE_BRAND.displayName, source: spec.sceneCopy[index] }
      : { template: "callout", statement: spec.sceneCopy[index] }, sfx: { name: "none" } })),
});
assertScriptIntegrity(script, approved);

const ref = (scene: number, sourceSpan: string) => ({ source: APPROVED_SCRIPT_FILE, sceneId: `scene-${scene}`, sourceSpan });
const box = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });
const copy = (id: string, scene: number, phrase: string, bounds: ReturnType<typeof box>, initial: boolean, role: "HERO" | "SECTION_MARKER", fontSize: number) => ({ id, kind: "text", box: bounds, copy: { ...ref(scene, phrase), text: phrase }, role, fontSize, size: "heading", initial });
const event = (id: string, scene: number, phrase: string, action: "reveal" | "focus" | "hide", targets: string[], anchor?: "end") => { const relation = action === "reveal" ? "progression" as const : "same-object" as const; return { id, trigger: ref(scene, phrase), action, targets, relation, transition: transitionFor(relation), rationale: `The approved phrase ${phrase} changes the same visible visual model.`, ...(anchor ? { anchor } : {}) }; };
const stage = () => ({ id: "stage", kind: "node", box: box(140, 570, 800, 460), initial: true, entityGroup: `day-${day}-story` });
const sequences = spec.sequences.map((design, index) => {
  const heading = copy("heading", design.heading.scene, design.heading.phrase, box(130, 300, 820, 170), !!design.heading.initial, design.heading.initial ? "HERO" : "SECTION_MARKER", design.heading.fontSize ?? 78);
  const labels = (design.labels ?? []).map(item => copy(item.id, item.scene, item.phrase, box(item.x, 1090, item.w, 115), false, "SECTION_MARKER", item.fontSize ?? 48));
  const motionEvents = [
    event(`focus-stage-${index}`, design.heading.scene, design.heading.phrase, "focus", ["stage"]),
    ...(!design.heading.initial ? [event(`show-heading-${index}`, design.heading.scene, design.heading.phrase, "reveal", ["heading"])] : []),
    ...labels.map((item, labelIndex) => event(`show-label-${index}-${labelIndex}`, design.labels![labelIndex].scene, design.labels![labelIndex].phrase, "reveal", [item.id])),
    ...(index === spec.sequences.length - 1 ? [event("clear-for-follow", slices.length, spec.endings.at(-1)!, "hide", ["stage", "heading", ...labels.map(item => item.id)], "end")] : []),
  ];
  return { id: design.id, sceneIds: design.scenes.map(scene => `scene-${scene}`), visualModel: design.model, semanticRationale: design.rationale, entryRelation: "new-topic", entryTransition: "crossfade", elements: [stage(), heading, ...labels], motionEvents };
});
const basePlan = FinancePlanSchema.parse({ version: "1.2", day, source: APPROVED_SCRIPT_FILE, referencePolicy: "VISUAL_REFERENCE_ONLY", editorial: true, data: [], sequences });
const plan = day10to14RichStoryPlan(basePlan);
const visualPlan = { version: "1.1", day, primaryArchetype: spec.archetype, secondaryArchetype: spec.secondary, rationale: spec.rationale, layoutDirection: spec.layout, repeatedIconComposition: spec.iconComposition };
const highlights = { version: "1.0", day, source: APPROVED_SCRIPT_FILE, items: [] };
const heroCaptions = spec.sequences.map(design => ({ ...ref(design.heading.scene, design.heading.phrase), sequenceId: design.id, elementIds: ["heading"] }));
await mkdir(out, { recursive: true });
for (const [name, data] of Object.entries({ "script.json": script, "data_visualizations.json": plan, "visual-plan.json": visualPlan, "number_highlights.json": highlights, "hero-captions.json": heroCaptions })) await writeFile(join(out, name), JSON.stringify(data, null, 2), "utf8");
await writeFile(join(out, "script.txt"), approved, "utf8");
console.log(JSON.stringify({ day, out, sceneCount: slices.length, approvedVoiceText: approved }, null, 2));
