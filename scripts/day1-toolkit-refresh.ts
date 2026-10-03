import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { APPROVED_SCRIPT_FILE, extractApprovedVoiceOver, assertScriptIntegrity } from "../src/contracts/content-contract.js";
import { ScriptSchema } from "../src/render/script-schema.js";
import { burnSubtitles } from "../src/assets/subtitle-tools.js";
import { getVideoDurationSec } from "../src/assets/audio-tools.js";
import { assessProductionDuration } from "../src/contracts/production-duration.js";

const out = "output/benchmarks/day-1-v12-toolkit-refresh";
const source = "output/benchmarks/day-1-v12-editorial-r2";
const json = async (path: string) => JSON.parse(await readFile(path, "utf8"));
const sha = async (path: string) => createHash("sha256").update(await readFile(path)).digest("hex");
const snapshot = async () => {
  const files = [APPROVED_SCRIPT_FILE];
  for (const dir of [source, "output/day-1", "output/day-2", "output/day-3", "output/benchmarks/day-2-v12-object-led", "output/benchmarks/day-2-v12-7scene"]) {
    for (const entry of await readdir(dir, { withFileTypes: true })) if (entry.isFile()) files.push(join(dir, entry.name));
  }
  return Object.fromEntries(await Promise.all(files.sort().map(async file => [file, await sha(file)])));
};
if (process.argv.includes("--prepare")) {
  await mkdir(out, { recursive: false }); // Never overwrite an earlier review run.
  await writeFile(join(out, "protected-before.json"), JSON.stringify(await snapshot(), null, 2));
  for (const file of ["script.json", "transcript.json", "voice.mp3", "script.txt", "visual-plan.json"]) await copyFile(join(source, file), join(out, file));
  const script = ScriptSchema.parse(await json(join(out, "script.json")));
  assertScriptIntegrity(script, extractApprovedVoiceOver(await readFile(APPROVED_SCRIPT_FILE, "utf8"), 1));
  await writeFile(join(out, "refresh-plan.json"), JSON.stringify({ source, output: out, sourceScript: APPROVED_SCRIPT_FILE, audioReuseSha256: await sha(join(out, "voice.mp3")), narrationSlices: script.scenes.length, visualSequences: 7, rationale: "Preserve Day 1's connected seven visual sequences: reassurance, three-habit hook, retained subscriptions, order/frequency/consequence, actual/mental coffee and frequency, reframe, awareness. Apply current contracts and render code; do not copy Day 2's seven narration groups.", historicalHashDiscrepancy: "See docs/migration-status.md; fresh preservation does not resolve the historical resolved-finance-plan mismatch.", humanApproval: "PENDING" }, null, 2));
  console.log("PREPARED", out);
} else if (process.argv.includes("--burn")) {
  await burnSubtitles({ videoInput: join(out, "video-raw.mp4"), srtPath: join(out, "subtitles.ass"), videoOutput: join(out, "video.mp4"), fontSize: 46, marginV: 450 });
  const report = await json(join(out, "validation-report.json"));
  report.gates.PRODUCTION_DURATION = assessProductionDuration(await getVideoDurationSec(join(out, "video.mp4")), "measured");
  report.status = "RENDERED_PENDING_FRAME_QA";
  await writeFile(join(out, "validation-report.json"), JSON.stringify(report, null, 2));
  if (report.gates.PRODUCTION_DURATION.status !== "PASS") throw new Error("DURATION_FAILED");
} else if (process.argv.includes("--finalize")) {
  const before = await json(join(out, "protected-before.json"));
  const after = await snapshot();
  const changed = Object.keys(before).filter(file => before[file] !== after[file]);
  await writeFile(join(out, "protected-artifacts.json"), JSON.stringify({ status: changed.length ? "FAIL" : "PASS", before, after, changed }, null, 2));
  if (changed.length) throw new Error(`PROTECTED_ARTIFACT_CHANGED: ${changed.join(", ")}`);
  const report = await json(join(out, "validation-report.json"));
  const qa = await json(join(out, "refresh/qa-manifest.json"));
  const temporal = await json(join(out, "refresh-temporal-collision-report.json"));
  const videoSha256 = await sha(join(out, "video.mp4"));
  if (qa.videoSha256 !== videoSha256 || temporal.inputSha256 !== await sha(join(out, "index.html"))) throw new Error("STALE_QA");
  if (temporal.status !== "PASS") throw new Error("TEMPORAL_QA_FAILED");
  const failed = Object.entries(report.gates).filter(([, gate]: any) => !["PASS", "WARNING"].includes(gate.status));
  if (failed.length) throw new Error(`VALIDATION_FAILED: ${failed.map(([name]) => name)}`);
  const result = { status: "RENDERED_PENDING_HUMAN_REVIEW", videoSha256, duration: qa.duration, gates: Object.fromEntries(Object.entries(report.gates).map(([name, gate]: any) => [name, gate.status])), temporal: { snapshots: temporal.snapshotCount, status: temporal.status }, frameChecks: qa.automatedChecks, protected: { status: "PASS", files: Object.keys(before).length }, historicalHashDiscrepancy: "Unresolved historical mismatch documented in migration-status; protected files unchanged during this run." };
  await writeFile(join(out, "refresh-result.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} else throw new Error("Use --prepare, --burn or --finalize");
