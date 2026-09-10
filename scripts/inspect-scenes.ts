import { readFileSync } from "node:fs";

const content = readFileSync("money-habits-ALL-v4.md", "utf8");
const parts = content.split(/# PHẦN 2/i);
if (parts.length < 2) {
  console.log("No PHẦN 2 found");
  process.exit(1);
}

const p2 = parts[1];
const dayBlocks = p2.split(/\n## Day (\d+)/);

for (let i = 1; i < dayBlocks.length; i += 2) {
  const dayNum = dayBlocks[i];
  const body = dayBlocks[i + 1] || "";
  const scenes = [...body.matchAll(/\*\*Cảnh \d+/g)];
  console.log(`Day ${dayNum}: ${scenes.length} scenes`);
}
