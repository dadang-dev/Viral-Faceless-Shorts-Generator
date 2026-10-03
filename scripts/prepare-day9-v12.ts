import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { ScriptSchema } from "../src/render/script-schema.js";
import { FinancePlanSchema, transitionFor } from "../src/contracts/finance-motion.js";
import { assertBenchmarkDestination } from "../src/contracts/benchmark-isolation.js";
import { APPROVED_SCRIPT_FILE, REQUIRED_EDGE_VOICE, assertScriptIntegrity, extractApprovedVoiceOver } from "../src/contracts/content-contract.js";
import { LOCKED_PAGE_BRAND } from "../src/brand-config.js";
import { day9RichStoryPlan } from "../src/day9-rich-story.js";

const day = 9;
const short = process.argv.includes("--short");
const out = resolve(`output/benchmarks/day-9-v12-${short ? "short-" : ""}differentactually`);
assertBenchmarkDestination(out);
try {
  await access(join(out, "script.json"));
  throw new Error("DESTINATION_EXISTS: preserve previous Day 9 evidence");
} catch (error: unknown) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

const approved = extractApprovedVoiceOver(await readFile(APPROVED_SCRIPT_FILE, "utf8"), day);
const endings = ["yours to spend.", "today’s screen.", "close together.", "same calendar.", "right now.", "before it arrives.", "unclaimed."];
let cursor = 0;
const slices = endings.map(ending => {
  const index = approved.indexOf(ending, cursor);
  if (index < 0) throw new Error(`SOURCE_CONTRACT: missing Day 9 boundary ${ending}`);
  const next = index + ending.length;
  const slice = approved.slice(cursor, next).trim();
  cursor = next;
  return slice;
});
if (approved.slice(cursor).trim()) throw new Error("SOURCE_CONTRACT: ungrouped narration");

const templates = [
  { template: "hook", headline: "BALANCE IN YOUR BANKING APP", subhead: "yours to spend" },
  { template: "callout", statement: "tomorrow’s bills" },
  { template: "callout", statement: "withdrawals can land close together" },
  { template: "callout", statement: "same calendar" },
  { template: "callout", statement: "after those bills" },
  { template: "callout", statement: "before it arrives" },
  { template: "outro", ctaTop: "MONEY YOU CAN SEE", channelName: LOCKED_PAGE_BRAND.displayName, source: "money that’s unclaimed" },
];
const script = ScriptSchema.parse({
  version: "1.0",
  metadata: { visualSystem: "1.2", title: "Your balance isn’t your spending money", source: { url: APPROVED_SCRIPT_FILE, domain: APPROVED_SCRIPT_FILE, image: null }, channel: LOCKED_PAGE_BRAND.displayName },
  voice: { provider: "edge-tts", voiceId: REQUIRED_EDGE_VOICE, speed: 0.8 },
  scenes: slices.map((voiceText, index) => ({ id: `scene-${index + 1}`, type: index === 0 ? "hook" : index === 6 ? "outro" : "body", voiceText, templateData: templates[index], sfx: { name: "none" } })),
});
assertScriptIntegrity(script, approved);

const ref = (scene: number, sourceSpan: string) => ({ source: APPROVED_SCRIPT_FILE, sceneId: `scene-${scene}`, sourceSpan });
const box = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });
const copy = (id: string, scene: number, phrase: string, bounds: ReturnType<typeof box>, initial: boolean, role: "HERO" | "SECTION_MARKER" = "SECTION_MARKER", fontSize = 64) => ({ id, kind: "text", box: bounds, copy: { ...ref(scene, phrase), text: phrase }, role, fontSize, size: "heading", initial });
const event = (id: string, scene: number, phrase: string, action: "reveal" | "focus" | "hide", targets: string[], relation: "progression" | "same-object" = "progression", anchor?: "end") => ({ id, trigger: ref(scene, phrase), action, targets, relation, transition: transitionFor(relation), rationale: `The approved phrase ${phrase} advances the visible balance and scheduled-bill story.`, ...(anchor ? { anchor } : {}) });
const stage = () => ({ id: "stage", kind: "node", box: box(140, 570, 800, 460), initial: true, entityGroup: "balance-calendar" });
const basePlan = FinancePlanSchema.parse({
  version: "1.2", day, source: APPROVED_SCRIPT_FILE, referencePolicy: "VISUAL_REFERENCE_ONLY", editorial: true, data: [],
  sequences: [
    { id: "visible-balance", sceneIds: ["scene-1", "scene-2", "scene-3"], visualModel: "decision-flow", semanticRationale: "One banking-app balance remains in view while previously unseen upcoming rent, card and phone obligations become visible and draw close together, without inventing balances or dates.", entryRelation: "new-topic", entryTransition: "crossfade",
      elements: [stage(), copy("balance", 1, "balance in your banking app", box(130, 300, 820, 170), true, "HERO", 69), copy("rent", 3, "Rent", box(150, 1090, 230, 110), false, "SECTION_MARKER", 58), copy("card", 3, "card payment", box(395, 1090, 290, 110), false, "SECTION_MARKER", 46), copy("phone", 3, "your phone plan", box(700, 1090, 255, 110), false, "SECTION_MARKER", 45)],
      motionEvents: [event("show-bills", 2, "tomorrow’s bills", "focus", ["stage"], "same-object"), event("show-rent", 3, "Rent", "reveal", ["rent"]), event("show-card", 3, "a card payment", "reveal", ["card"]), event("show-phone", 3, "your phone plan", "reveal", ["phone"]), event("cluster-bills", 3, "withdrawals can land close together", "focus", ["stage"], "same-object")],
    },
    { id: "one-calendar", sceneIds: ["scene-4", "scene-5"], visualModel: "decision-flow", semanticRationale: "The next payday and automatic payments enter the same undated calendar; the viewer then checks what remains after bills rather than trusting the bank-screen balance alone.", entryRelation: "new-topic", entryTransition: "crossfade",
      elements: [stage(), copy("payday", 4, "next payday", box(130, 300, 820, 170), false, "SECTION_MARKER", 100), copy("autopay", 4, "automatic payment", box(150, 1090, 470, 110), false, "SECTION_MARKER", 46), copy("after-bills", 5, "after those bills", box(650, 1090, 300, 110), false, "SECTION_MARKER", 42)],
      motionEvents: [event("show-payday", 4, "next payday", "reveal", ["payday"]), event("show-autopay", 4, "every automatic payment", "reveal", ["autopay"]), event("focus-remaining", 5, "what will be left after those bills", "focus", ["stage"], "same-object"), event("label-remaining", 5, "after those bills", "reveal", ["after-bills"])],
    },
    { id: "date-and-options", sceneIds: ["scene-6", "scene-7"], visualModel: "decision-flow", semanticRationale: "A problematic due date is spotted before arrival, prompting a provider-options check; the visible bank balance remains distinct from the already-claimed obligation.", entryRelation: "new-topic", entryTransition: "crossfade",
      elements: [stage(), copy("date", 6, "payment date", box(130, 300, 820, 170), false, "SECTION_MARKER", 98), copy("before", 6, "before it arrives", box(190, 1090, 700, 110), false, "SECTION_MARKER", 60)],
      motionEvents: [event("show-date", 6, "payment date", "reveal", ["date"]), event("problem-date", 6, "going to be a problem", "focus", ["stage"], "same-object"), event("provider-check", 6, "check your options", "focus", ["stage"], "same-object"), event("show-before", 6, "before it arrives", "reveal", ["before"]), event("clear-for-follow", 7, "money that’s unclaimed", "hide", ["date", "before", "stage"], "same-object", "end")],
    },
  ],
});
const plan = day9RichStoryPlan(basePlan);
const visualPlan = { version: "1.1", day, primaryArchetype: "concept-story", secondaryArchetype: "timeline-frequency", rationale: "An illustrated bank balance exposes hidden upcoming bill claims, then an undated shared calendar and a provider-contact decision. No balances, amounts or dates are fabricated.", layoutDirection: "mixed", repeatedIconComposition: "persistent bank balance with emerging bill claims; shared payday/autopay calendar; date-to-provider decision" };
const highlights = { version: "1.0", day, source: APPROVED_SCRIPT_FILE, items: [] };
const heroCaptions = [
  { ...ref(1, "balance in your banking app"), sequenceId: "visible-balance", elementIds: ["balance"] },
  { ...ref(4, "next payday"), sequenceId: "one-calendar", elementIds: ["payday"] },
  { ...ref(6, "payment date"), sequenceId: "date-and-options", elementIds: ["date"] },
];
await mkdir(out, { recursive: true });
for (const [name, data] of Object.entries({ "script.json": script, "data_visualizations.json": plan, "visual-plan.json": visualPlan, "number_highlights.json": highlights, "hero-captions.json": heroCaptions })) await writeFile(join(out, name), JSON.stringify(data, null, 2), "utf8");
await writeFile(join(out, "script.txt"), approved, "utf8");
console.log(JSON.stringify({ day, out, sceneCount: script.scenes.length, approvedVoiceText: approved }, null, 2));
