import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { ScriptSchema } from "../src/render/script-schema.js";
import { FinancePlanSchema, transitionFor } from "../src/contracts/finance-motion.js";
import { assertBenchmarkDestination } from "../src/contracts/benchmark-isolation.js";
import { APPROVED_SCRIPT_FILE, REQUIRED_EDGE_VOICE, assertScriptIntegrity, extractApprovedVoiceOver } from "../src/contracts/content-contract.js";
import { LOCKED_PAGE_BRAND } from "../src/brand-config.js";
import { day8RichStoryPlan } from "../src/day8-rich-story.js";

const day = 8;
const out = resolve("output/benchmarks/day-8-v12-differentactually");
assertBenchmarkDestination(out);
try {
  await access(out);
  throw new Error("DESTINATION_EXISTS: preserve previous Day 8 evidence");
} catch (error: unknown) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

const approved = extractApprovedVoiceOver(await readFile(APPROVED_SCRIPT_FILE, "utf8"), day);
const endings = ["Your calendar sees the next three.", "your phone bill hits.", "before you agree to it.", "before your next paycheck.", "would I still press buy?", "not the full price."];
let cursor = 0;
const slices = endings.map((ending) => {
  const index = approved.indexOf(ending, cursor);
  if (index < 0) throw new Error(`SOURCE_CONTRACT: missing Day 8 boundary ${ending}`);
  const next = index + ending.length;
  const slice = approved.slice(cursor, next).trim();
  cursor = next;
  return slice;
});
if (approved.slice(cursor).trim()) throw new Error("SOURCE_CONTRACT: ungrouped narration");

const templates = [
  { template: "hook", headline: "PAY IN FOUR", subhead: "without making it cheaper" },
  { template: "callout", statement: "due dates can pile up" },
  { template: "callout", statement: "whole obligation" },
  { template: "callout", statement: "payment schedule" },
  { template: "callout", statement: "would I still press buy?" },
  { template: "outro", ctaTop: "NOT THE FULL PRICE", channelName: LOCKED_PAGE_BRAND.displayName, source: "not the full price" },
];
const script = ScriptSchema.parse({
  version: "1.0",
  metadata: { visualSystem: "1.2", title: "Pay in four is still a bill", source: { url: APPROVED_SCRIPT_FILE, domain: APPROVED_SCRIPT_FILE, image: null }, channel: LOCKED_PAGE_BRAND.displayName },
  voice: { provider: "edge-tts", voiceId: REQUIRED_EDGE_VOICE, speed: 0.8 },
  scenes: slices.map((voiceText, i) => ({ id: `scene-${i + 1}`, type: i === 0 ? "hook" : i === 5 ? "outro" : "body", voiceText, templateData: templates[i], sfx: { name: "none" } })),
});
assertScriptIntegrity(script, approved);

const ref = (scene: number, sourceSpan: string) => ({ source: APPROVED_SCRIPT_FILE, sceneId: `scene-${scene}`, sourceSpan });
const box = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });
const copy = (id: string, scene: number, phrase: string, bounds: ReturnType<typeof box>, initial = false, role: "HERO" | "SECTION_MARKER" = "SECTION_MARKER", fontSize = 68) => ({ id, kind: "text", box: bounds, copy: { ...ref(scene, phrase), text: phrase }, role, fontSize, size: "heading", initial });
const node = (id: string, icon: string, bounds: ReturnType<typeof box>, initial = false) => ({ id, kind: "node", icon, box: bounds, initial, entityGroup: "scheduled-purchase" });
const event = (id: string, scene: number, phrase: string, action: "reveal" | "focus" | "hide", targets: string[], relation: "progression" | "same-object" | "major-metric" = "progression", anchor?: "end") => ({ id, trigger: ref(scene, phrase), action, targets, relation, transition: transitionFor(relation), rationale: `The approved phrase ${phrase} advances the same scheduled purchase.`, ...(anchor ? { anchor } : {}) });
const basePlan = FinancePlanSchema.parse({
  version: "1.2", day, source: APPROVED_SCRIPT_FILE, referencePolicy: "VISUAL_REFERENCE_ONLY", editorial: true,
  data: [{ id: "four-payments", ...ref(1, "pay in four"), sourceType: "script-literal", value: 4, unit: "count", display: "4", qualifier: "exact" }],
  sequences: [
    { id: "purchase-to-schedule", sceneIds: ["scene-1", "scene-2"], visualModel: "accumulation-timeline", semanticRationale: "One purchase expands into four future payment markers, with rent and phone bills entering the same schedule.", entryRelation: "new-topic", entryTransition: "crossfade",
      elements: [copy("pay-title", 1, "pay in four", box(130, 300, 820, 170), true, "HERO", 102), node("purchase", "order", box(400, 540, 280, 200), true), { id: "payment-track", kind: "markers", icon: "calendar", datumId: "four-payments", box: box(180, 790, 720, 250), entityGroup: "scheduled-purchase", role: "DATA_LABEL" }, copy("rent", 2, "rent", box(150, 1090, 280, 140)), copy("phone-bill", 2, "phone bill", box(550, 1090, 390, 140), false, "SECTION_MARKER", 54)],
      motionEvents: [event("show-track", 1, "pay in four", "reveal", ["payment-track"], "major-metric"), event("focus-future", 1, "next three", "focus", ["payment-track"], "same-object"), event("show-rent", 2, "rent", "reveal", ["rent"]), event("show-phone", 2, "phone bill", "reveal", ["phone-bill"])],
    },
    { id: "read-the-obligation", sceneIds: ["scene-3", "scene-4"], visualModel: "decision-flow", semanticRationale: "A calendar makes the whole obligation visible before the next paycheck, not just the first charge.", entryRelation: "new-topic", entryTransition: "crossfade",
      elements: [copy("obligation", 3, "whole obligation", box(130, 300, 820, 200), true, "HERO", 90), node("schedule", "calendar", box(170, 690, 260, 240), true), node("purchase-review", "order", box(650, 690, 260, 240)), copy("paycheck", 4, "before your next paycheck", box(130, 1090, 820, 170), false, "SECTION_MARKER", 54)],
      motionEvents: [event("review-purchase", 3, "before you agree to it", "reveal", ["purchase-review"]), event("open-schedule", 4, "payment schedule", "focus", ["schedule"], "same-object"), event("paycheck-boundary", 4, "before your next paycheck", "reveal", ["paycheck"])],
    },
    { id: "final-checkout-decision", sceneIds: ["scene-5", "scene-6"], visualModel: "decision-flow", semanticRationale: "A purchase pauses at the approved question, then separates its first payment from the full price before follow appears.", entryRelation: "new-topic", entryTransition: "crossfade",
      elements: [copy("buy-question", 5, "would I still press buy?", box(130, 310, 820, 240), true, "HERO", 77), node("paused-purchase", "order", box(400, 730, 280, 250), true), copy("full-price", 6, "not the full price", box(160, 1090, 760, 150))],
      motionEvents: [event("hold-checkout", 5, "press buy", "focus", ["paused-purchase"], "same-object"), event("full-price-reveal", 6, "not the full price", "reveal", ["full-price"]), event("clear-for-follow", 6, "not the full price", "hide", ["buy-question", "paused-purchase", "full-price"], "same-object", "end")],
    },
  ],
});
const plan = day8RichStoryPlan(basePlan);
const visualPlan = { version: "1.1", day, primaryArchetype: "timeline-frequency", secondaryArchetype: "comparison", rationale: "An illustrated checkout becomes four source-supported payment markers, a calendar obligation before payday and a paused purchase with all payments visible. No invented price or date.", layoutDirection: "mixed", repeatedIconComposition: "one checkout becomes four payment markers; the same calendar exposes the whole obligation before a paused decision" };
const highlights = { version: "1.0", day, source: APPROVED_SCRIPT_FILE, items: [{ id: "four-payments", sceneId: "scene-1", spokenPhrase: "pay in four", canonicalText: "pay in four", displayText: "4", target: "stat.value" }] };
const heroCaptions = [
  { ...ref(1, "pay in four"), sequenceId: "purchase-to-schedule", elementIds: ["pay-title"] },
  { ...ref(3, "whole obligation"), sequenceId: "read-the-obligation", elementIds: ["obligation"] },
  { ...ref(5, "would I still press buy?"), sequenceId: "final-checkout-decision", elementIds: ["buy-question"] },
];
await mkdir(out, { recursive: true });
for (const [name, data] of Object.entries({ "script.json": script, "data_visualizations.json": plan, "visual-plan.json": visualPlan, "number_highlights.json": highlights, "hero-captions.json": heroCaptions })) await writeFile(join(out, name), JSON.stringify(data, null, 2), "utf8");
await writeFile(join(out, "script.txt"), approved, "utf8");
console.log(JSON.stringify({ day, out, sceneCount: script.scenes.length, approvedVoiceText: approved }, null, 2));
