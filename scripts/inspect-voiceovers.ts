import { readFileSync } from "node:fs";

const text = readFileSync("money-habits-script-v2-optimized.md", "utf8");
const p1 = text.split(/# PHẦN 2/i)[0];
const days = p1.split(/\n## Day (\d+)/);

for (let i = 1; i < days.length; i += 2) {
  const d = days[i];
  const body = days[i + 1] || "";
  const voMatch = body.match(/\*\*Voice-over:\*\*([\s\S]*?)(?=\n\*\*Caption|\n---|\Z)/);
  if (!voMatch) continue;
  const rawVo = voMatch[1].trim();
  const rawLines = rawVo.split("\n").map(l => l.replace(/^>\s*"?|"?\s*$/g, "").trim()).filter(Boolean);
  
  // Split each block by sentence if needed
  const fullText = rawLines.join(" ");
  // Match sentences
  const sentences = fullText.match(/[^.!?]+[.!?]+(?:\s|$)/g)?.map(s => s.trim()) || [];
  
  console.log(`Day ${d}: ${rawLines.length} raw lines, ${sentences.length} sentences`);
}
