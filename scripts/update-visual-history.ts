import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { ScriptSchema } from "../src/render/script-schema.js";
import type { WordBoundaryTranscript } from "../src/contracts/content-contract.js";
import { VisualPlanSchema, buildVisualHistoryEntry, saveVisualHistory } from "../src/planning/visual-variety.js";

const outputRoot = process.argv[2] ?? "output";
const directories = (await readdir(outputRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && /^day-\d+$/.test(entry.name))
  .sort((a, b) => Number(a.name.slice(4)) - Number(b.name.slice(4)));

const entries = [];
for (const directory of directories) {
  const base = join(outputRoot, directory.name);
  let rawPlan: unknown;
  try {
    rawPlan = JSON.parse(await readFile(join(base, "visual-plan.json"), "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    console.log(`Unclassified, omitted from history: ${directory.name}`);
    continue;
  }
  const plan = VisualPlanSchema.parse(rawPlan);
  if (plan.day !== Number(directory.name.slice(4))) throw new Error(`History Day mismatch: ${base}`);
  const script = ScriptSchema.parse(JSON.parse(await readFile(join(base, "script.json"), "utf8")));
  let transcript: WordBoundaryTranscript | undefined;
  try { transcript = JSON.parse(await readFile(join(base, "transcript.json"), "utf8")); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  entries.push(buildVisualHistoryEntry(script, plan, transcript));
}

await saveVisualHistory(join(outputRoot, "visual-history.json"), entries);
console.log(`Wrote ${entries.length} visual history entries to ${join(outputRoot, "visual-history.json")}`);
