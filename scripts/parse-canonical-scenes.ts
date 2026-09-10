import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const content = readFileSync("money-habits-ALL-v4.md", "utf8");

// Parse Day 1 to Day 7 from PHẦN 2
const [part1, part2] = content.split(/# PHẦN 2/i);

interface DayData {
  dayNum: number;
  title: string;
  scenes: Array<{
    sceneNum: number;
    title: string;
    imagePrompt: string;
    videoPrompt: string;
    durationSec: number;
  }>;
}

const days: DayData[] = [];
const dayBlocks = part2.split(/\n## Day (\d+)/);

for (let i = 1; i < dayBlocks.length; i += 2) {
  const dayNum = Number(dayBlocks[i]);
  const block = dayBlocks[i + 1] || "";
  const titleMatch = block.match(/^[^\n—-]+[—-]\s*["“]?([^"”\n]+)/);
  const title = titleMatch ? titleMatch[1].trim() : `Day ${dayNum}`;

  const sceneSplits = block.split(/\n\*\*Cảnh (\d+)\s*[—\-]\s*([^*]+)\*\*/);
  const scenes: DayData["scenes"] = [];

  for (let j = 1; j < sceneSplits.length; j += 3) {
    const sceneNum = Number(sceneSplits[j]);
    const sceneTitle = sceneSplits[j + 1].replace(/\[.*?\]/g, "").trim();
    const sceneBody = sceneSplits[j + 2] || "";

    const imgMatch = sceneBody.match(/\*Prompt ảnh:\*\s*`([^`]+)`/);
    const vidMatch = sceneBody.match(/\*Prompt video:\*\s*`([^`]+)`/);
    const durMatch = sceneBody.match(/Duration:\s*(\d+(?:\.\d+)?)\s*seconds/i);

    scenes.push({
      sceneNum,
      title: sceneTitle,
      imagePrompt: imgMatch ? imgMatch[1].trim() : "",
      videoPrompt: vidMatch ? vidMatch[1].trim() : "",
      durationSec: durMatch ? Number(durMatch[1]) : 4.0,
    });
  }

  days.push({ dayNum, title, scenes });
}

console.log(`Parsed ${days.length} days:`);
for (const d of days) {
  console.log(`Day ${d.dayNum}: "${d.title}" -> ${d.scenes.length} scenes`);
}
