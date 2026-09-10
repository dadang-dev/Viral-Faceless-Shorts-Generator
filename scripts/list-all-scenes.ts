import { readFileSync } from "node:fs";

const text = readFileSync("money-habits-ALL-v4.md", "utf8");
const p2 = text.split(/# PHẦN 2/i)[1];
const dayBlocks = p2.split(/\n## Day (\d+)/);

for (let i = 1; i < dayBlocks.length; i += 2) {
  const dayNum = dayBlocks[i];
  const body = dayBlocks[i + 1] || "";
  const scenes = [...body.matchAll(/\*\*Cảnh (\d+)\s*—\s*([^*]+)\*\*/g)];
  console.log(`=== DAY ${dayNum} (${scenes.length} scenes) ===`);
  for (const s of scenes) {
    console.log(`  Scene ${s[1]}: ${s[2].trim()}`);
  }
}
