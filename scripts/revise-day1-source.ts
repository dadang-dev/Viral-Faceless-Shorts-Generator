import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

// Explicit user-approved editorial correction; preserve the original bytes outside these spans.
export const corrections = [
  ["But ten dollars, four nights a week, is more than most people's entire grocery budget.", "But ten dollars, four nights a week, is about a hundred and seventy dollars a month."],
  ["Number three: rounding down in your head.", "Number three: rounding it off in your head."],
  ["Do that three times a week, and you've quietly spent almost three hundred dollars a month on 'basically nothing.'", "Do that three times a week, and you've quietly spent over two hundred dollars a month on 'basically nothing.'"],
] as const;

const original = await readFile("money-habits-script-v2-optimized.md");
const boundary = original.indexOf(Buffer.from("## Day 2"));
if (boundary < 0) throw new Error("SOURCE_REVISION: missing Day 2 boundary");
let day1 = original.subarray(0, boundary).toString("utf8");
for (const [before, after] of corrections) {
  if (day1.split(before).length !== 2) throw new Error(`SOURCE_REVISION: nonunique correction: ${before}`);
  day1 = day1.replace(before, after);
}
const revised = Buffer.concat([Buffer.from(day1), original.subarray(boundary)]);
const destination = "money-habits-script-v2.1-verified.md";
try {
  const existing = await readFile(destination);
  if (!existing.equals(revised)) throw new Error("SOURCE_REVISION: destination has unrelated changes; refusing overwrite");
} catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
await writeFile(destination, revised);
const verified = await readFile(destination);
if (!verified.subarray(verified.indexOf(Buffer.from("## Day 2"))).equals(original.subarray(boundary))) throw new Error("SOURCE_REVISION: Day 2–7 changed");
console.log(JSON.stringify({ destination, corrections: corrections.length, day2to7: "BYTE_IDENTICAL", historicalSha256: createHash("sha256").update(original).digest("hex"), revisedSha256: createHash("sha256").update(verified).digest("hex") }, null, 2));
