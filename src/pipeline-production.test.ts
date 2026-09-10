import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Keep source-copy/theme/scene/number validation real. Replace only media I/O
// and H output to exercise the actual runPipeline render decision boundary.
vi.mock("./contracts/production-validation.js", async importOriginal => ({
  ...await importOriginal<typeof import("./contracts/production-validation.js")>(),
  evaluateProductionVisualVariety: vi.fn(),
}));
vi.mock("./assets/image-fetcher.js", () => ({ fetchImage: vi.fn(async () => ({ success: false, reason: "test" })) }));
vi.mock("./tts/tts-client.js", () => ({ createTtsClient: () => ({ generate: vi.fn(async () => {}) }) }));
vi.mock("./assets/audio-tools.js", () => ({ getDurationSec: vi.fn(async () => 65), getVideoDurationSec: vi.fn(async () => 65), trimTrailingSilence: vi.fn(), concatWithSilence: vi.fn(), mixSfxOntoVoice: vi.fn() }));
vi.mock("./assets/subtitle-tools.js", async importOriginal => ({
  ...await importOriginal<typeof import("./assets/subtitle-tools.js")>(),
  mergeSceneSrts: vi.fn(), mergeSceneKaraokeAss: vi.fn(),
  burnSubtitles: vi.fn(async (args: { videoOutput: string }) => { await writeFile(args.videoOutput, "test video"); }),
}));
vi.mock("./assets/sfx-selector.js", () => ({ indexSfxLibrary: () => ({}), pickSfxForScene: () => undefined, defaultPlayback: vi.fn() }));
vi.mock("./contracts/content-contract.js", async importOriginal => ({
  ...await importOriginal<typeof import("./contracts/content-contract.js")>(),
  buildWordBoundaryTranscript: vi.fn(async () => JSON.parse(await readFile("output/day-2/transcript.json", "utf8"))),
}));
vi.mock("./render/html-composer.js", () => ({ composeHtml: vi.fn(() => "<html>validated test fixture</html>") }));
vi.mock("./render/hyperframes-runner.js", () => ({ renderWithHyperframes: vi.fn(async () => { throw new Error("TEST_RENDER_REACHED"); }) }));

import { runPipeline } from "./pipeline.js";
import { evaluateProductionVisualVariety } from "./contracts/production-validation.js";
import { renderWithHyperframes } from "./render/hyperframes-runner.js";
import { getVideoDurationSec } from "./assets/audio-tools.js";
import type { VisualVarietyReport } from "./planning/visual-variety.js";
import { APPROVED_SCRIPT_FILE } from "./contracts/content-contract.js";

const hFixture = (status: "PASS" | "WARNING"): VisualVarietyReport => ({
  status, primaryArchetype: "concept-story", comparedWithDays: [], similarity: [],
  repeatedTemplateSequenceWarning: false, repeatedLayoutWarning: false,
  repeatedStatPlacementWarning: false, historyCoverage: "none",
  warnings: status === "WARNING" ? ["VISUAL_REPETITION_WARNING: test pattern"] : [],
});

let directory: string;
beforeEach(async () => {
  vi.clearAllMocks();
  vi.mocked(renderWithHyperframes).mockImplementation(async () => { throw new Error("TEST_RENDER_REACHED"); });
  vi.stubEnv("TTS_PROVIDER", "edge-tts");
  vi.stubEnv("EDGE_TTS_VOICE", "en-US-AndrewMultilingualNeural");
  vi.stubEnv("VIDEO_THEME", "money-habits");
  vi.stubEnv("TIKTOK_AVATAR_URL", "");
  vi.stubEnv("VALIDATE_ONLY", "0");
  directory = await mkdtemp(join(tmpdir(), "money-pipeline-test-"));
  for (const file of ["script.json", "number_highlights.json"]) await writeFile(join(directory, file), await readFile(join("output/day-2", file)));
  const numbers = JSON.parse(await readFile(join(directory, "number_highlights.json"), "utf8"));
  numbers.source = APPROVED_SCRIPT_FILE; // Day 2 wording is byte-identical in the current revision.
  await writeFile(join(directory, "number_highlights.json"), JSON.stringify(numbers));
  await writeFile(join(directory, "test-results.json"), JSON.stringify({ status: "PASS" }));
});
afterEach(async () => { vi.unstubAllEnvs(); await rm(directory, { recursive: true, force: true }); });

describe("canonical runPipeline cannot bypass H", () => {
  it.each([59.4, 60.8])("persists measured video duration %s and blocks unsafe final output", async seconds => {
    vi.mocked(evaluateProductionVisualVariety).mockResolvedValue(hFixture("WARNING"));
    vi.mocked(getVideoDurationSec).mockResolvedValue(seconds);
    vi.mocked(renderWithHyperframes).mockImplementation(async args => { await writeFile(args.outputPath, "test render"); });
    const run = runPipeline(join(directory, "script.json"));
    if (seconds < 60.5) await expect(run).rejects.toThrow(/I_PRODUCTION_DURATION/);
    else await expect(run).resolves.toBeUndefined();
    const report = JSON.parse(await readFile(join(directory, "validation-report.json"), "utf8"));
    expect(report.gates.I_PRODUCTION_DURATION).toMatchObject({ phase: "measured", seconds, status: seconds < 60.5 ? "FAIL" : "PASS" });
    expect(report.productionDecision.allowed).toBe(seconds >= 60.5);
  });
  it.each(["PASS", "WARNING"] as const)("H %s reaches renderer and persists its result", async status => {
    vi.mocked(evaluateProductionVisualVariety).mockResolvedValue(hFixture(status));
    await expect(runPipeline(join(directory, "script.json"))).rejects.toThrow("TEST_RENDER_REACHED");
    expect(renderWithHyperframes).toHaveBeenCalledOnce();
    const report = JSON.parse(await readFile(join(directory, "validation-report.json"), "utf8"));
    expect(report.gates.H_VISUAL_VARIETY.status).toBe(status);
    expect(report.productionDecision.allowed).toBe(true);
    if (status === "WARNING") expect(report.gates.H_VISUAL_VARIETY.warnings).toHaveLength(1);
  });
  it("H FAIL stops before renderer and persists the blocker", async () => {
    vi.mocked(evaluateProductionVisualVariety).mockResolvedValue({ status: "FAIL", warnings: [], error: "mechanical copy" });
    await expect(runPipeline(join(directory, "script.json"))).rejects.toThrow(/PRODUCTION_BLOCKED: H_VISUAL_VARIETY/);
    expect(renderWithHyperframes).not.toHaveBeenCalled();
    expect(JSON.parse(await readFile(join(directory, "validation-report.json"), "utf8")).productionDecision.blockedBy).toContain("H_VISUAL_VARIETY");
  });
  it("G pending still blocks even if H passes", async () => {
    vi.mocked(evaluateProductionVisualVariety).mockResolvedValue(hFixture("PASS"));
    await writeFile(join(directory, "test-results.json"), JSON.stringify({ status: "PENDING" }));
    await expect(runPipeline(join(directory, "script.json"))).rejects.toThrow(/G_TESTS/);
    expect(renderWithHyperframes).not.toHaveBeenCalled();
  });
  it("A integrity still rejects narration before media generation", async () => {
    const script = JSON.parse(await readFile(join(directory, "script.json"), "utf8"));
    script.scenes[0].voiceText = "Unapproved narration";
    await writeFile(join(directory, "script.json"), JSON.stringify(script));
    await expect(runPipeline(join(directory, "script.json"))).rejects.toThrow(/SCRIPT_INTEGRITY/);
    expect(evaluateProductionVisualVariety).not.toHaveBeenCalled();
    expect(renderWithHyperframes).not.toHaveBeenCalled();
  });
});
