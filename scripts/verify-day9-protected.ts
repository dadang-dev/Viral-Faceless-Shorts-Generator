import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const root = resolve(".");
const own = resolve("output/benchmarks/day-9-v12-differentactually");
const short = resolve("output/benchmarks/day-9-v12-short-differentactually");
const manifestPath = join(own, "protected-before.json");
const mode = process.argv[2];
if (mode !== "--snapshot" && mode !== "--verify") throw new Error("Use --snapshot or --verify");

async function* files(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (resolve(path) === own || resolve(path) === short) continue;
    if (entry.isDirectory()) yield* files(path);
    else if (entry.isFile()) yield path;
  }
}
async function hash(path: string): Promise<string> {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest("hex");
}

const targets = [resolve("money-habits-script-v2.1-verified.md"), ...[1, 2, 3, 4, 5, 6, 7, 8].map(day => resolve(`output/day-${day}`))];
const current: Record<string, string> = {};
for (const target of targets) {
  try {
    if (target.endsWith(".md")) current[relative(root, target).replaceAll("\\", "/")] = await hash(target);
    else for await (const path of files(target)) current[relative(root, path).replaceAll("\\", "/")] = await hash(path);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
for await (const path of files(resolve("output/benchmarks"))) current[relative(root, path).replaceAll("\\", "/")] = await hash(path);
if (mode === "--snapshot") {
  await mkdir(own, { recursive: true });
  await writeFile(manifestPath, JSON.stringify(current, null, 2), "utf8");
  console.log(`Protected baseline: ${Object.keys(current).length} files`);
} else {
  const before = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, string>;
  const mismatches = Object.entries(before).filter(([path, digest]) => current[path] !== digest);
  const extras = Object.keys(current).filter(path => !(path in before));
  console.log(JSON.stringify({ status: mismatches.length || extras.length ? "FAIL" : "PASS", baseline: Object.keys(before).length, mismatches, extras }, null, 2));
  if (mismatches.length || extras.length) process.exitCode = 1;
}
