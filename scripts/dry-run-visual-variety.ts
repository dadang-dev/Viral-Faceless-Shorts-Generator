import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { APPROVED_SCRIPT_FILE, extractApprovedVoiceOver, NumberHighlightFileSchema } from "../src/contracts/content-contract.js";
import { recommendVisualArchetypes } from "../src/planning/visual-variety.js";

// Advisory shortlist only. No scene plan, TTS, media or production files are written.
const root = fileURLToPath(new URL("../", import.meta.url));
const markdown = await readFile(join(root, APPROVED_SCRIPT_FILE), "utf8");
for (const day of [3, 5, 6]) {
  const approvedVoice = extractApprovedVoiceOver(markdown, day);
  const highlights = NumberHighlightFileSchema.parse(JSON.parse(await readFile(join(root, `output/day-${day}/number_highlights.json`), "utf8")));
  if (highlights.day !== day) throw new Error(`Day ${day}: highlight source mismatch`);
  console.log(JSON.stringify({ day, approvedVoice, recommendation: recommendVisualArchetypes({ approvedVoice, approvedMetricCount: highlights.items.length }) }, null, 2));
}
