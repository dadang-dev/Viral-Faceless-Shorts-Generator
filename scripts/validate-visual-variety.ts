import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ScriptSchema } from "../src/render/script-schema.js";
import { APPROVED_SCRIPT_FILE, AUXILIARY_SCRIPT_FILE, extractApprovedVoiceOver, NumberHighlightFileSchema, type WordBoundaryTranscript } from "../src/contracts/content-contract.js";
import { VisualPlanSchema, loadVisualHistory, validateVisualPlanning } from "../src/planning/visual-variety.js";
import { LOCKED_PAGE_BRAND } from "../src/brand-config.js";

const scriptPath = process.argv[2];
if (!scriptPath) throw new Error("Usage: tsx scripts/validate-visual-variety.ts output/day-N/script.json");
const outputDir = dirname(scriptPath);
const script = ScriptSchema.parse(JSON.parse(await readFile(scriptPath, "utf8")));
const plan = VisualPlanSchema.parse(JSON.parse(await readFile(join(outputDir, "visual-plan.json"), "utf8")));
const history = await loadVisualHistory(join(dirname(outputDir), "visual-history.json"));
const root = fileURLToPath(new URL("../", import.meta.url));
let transcript: WordBoundaryTranscript | undefined;
try { transcript = JSON.parse(await readFile(join(outputDir, "transcript.json"), "utf8")); }
catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
const report = validateVisualPlanning({
  script, plan, history, transcript,
  approvedVoice: extractApprovedVoiceOver(await readFile(join(root, APPROVED_SCRIPT_FILE), "utf8"), plan.day),
  auxiliaryMarkdown: await readFile(join(root, AUXILIARY_SCRIPT_FILE), "utf8"),
  numberHighlights: NumberHighlightFileSchema.parse(JSON.parse(await readFile(join(outputDir, "number_highlights.json"), "utf8"))),
  brandConfig: [script.metadata.channel, LOCKED_PAGE_BRAND.displayName, LOCKED_PAGE_BRAND.handle, "US TikTok", LOCKED_PAGE_BRAND.tagline, "#MoneyHabits"],
});
await writeFile(join(outputDir, "visual-variety-report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(`H VISUAL_VARIETY: ${report.status}`);
if (report.status === "FAIL") process.exitCode = 1;
