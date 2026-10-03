import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const root = resolve(".");
const output = resolve("output/benchmarks");
const own = new Set([10, 11, 12, 13, 14].map(day => resolve(`output/benchmarks/day-${day}-v12-differentactually`)));
const manifestPath = resolve("output/benchmarks/day-10-v12-differentactually/protected-before.json");
const mode = process.argv[2];
if (mode !== "--snapshot" && mode !== "--verify") throw new Error("Use --snapshot or --verify");

async function* files(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (own.has(resolve(path))) continue;
    if (entry.isDirectory()) yield* files(path);
    else if (entry.isFile()) yield path;
  }
}
async function hash(path: string): Promise<string> {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest("hex");
}

const current: Record<string, string> = {};
const source = resolve("money-habits-script-v2.1-verified.md");
current[relative(root, source).replaceAll("\\", "/")] = await hash(source);
for (const day of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
  const dir = resolve(`output/day-${day}`);
  try { for await (const path of files(dir)) current[relative(root, path).replaceAll("\\", "/")] = await hash(path); }
  catch (error: unknown) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
}
for await (const path of files(output)) current[relative(root, path).replaceAll("\\", "/")] = await hash(path);
if (mode === "--snapshot") {
  await mkdir(resolve("output/benchmarks/day-10-v12-differentactually"), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(current, null, 2), "utf8");
  console.log(JSON.stringify({ status: "PASS", baseline: Object.keys(current).length, path: manifestPath }));
} else {
  const before = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, string>;
  const mismatches = Object.entries(before).filter(([path, digest]) => current[path] !== digest);
  const extras = Object.keys(current).filter(path => !(path in before));
  console.log(JSON.stringify({ status: mismatches.length || extras.length ? "FAIL" : "PASS", baseline: Object.keys(before).length, mismatches, extras }, null, 2));
  if (mismatches.length || extras.length) process.exitCode = 1;
}
