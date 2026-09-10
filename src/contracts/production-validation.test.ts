import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ScriptSchema } from "../render/script-schema.js";
import type { WordBoundaryTranscript } from "./content-contract.js";
import { buildVisualHistoryEntry } from "../planning/visual-variety.js";
import { MANDATORY_GATES, evaluateProductionVisualVariety, productionDecision, persistProductionValidation, assertProductionAllowed } from "./production-validation.js";

const script = ScriptSchema.parse(JSON.parse(readFileSync("output/day-2/script.json", "utf8")));
const transcript: WordBoundaryTranscript = JSON.parse(readFileSync("output/day-2/transcript.json", "utf8"));
const plan = { version: "1.1", day: 2, primaryArchetype: "concept-story", rationale: "Behavioral examples accumulate into lifestyle creep.", layoutDirection: "vertical", repeatedIconComposition: "right-icon" };
const gates = (h: unknown) => ({ ...Object.fromEntries(MANDATORY_GATES.map(key => [key, { status: "PASS" }])), H_VISUAL_VARIETY: h });
let directory: string;
beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), "money-production-gate-")); });
afterEach(async () => { await rm(directory, { recursive: true, force: true }); });

async function evaluate(entries: unknown[]) {
  await writeFile(join(directory, "visual-plan.json"), JSON.stringify(plan));
  const historyPath = join(directory, "visual-history.json");
  await writeFile(historyPath, JSON.stringify({ version: "1.1", entries }));
  return evaluateProductionVisualVariety({ outputDir: directory, historyPath, script, day: 2, transcript });
}

describe("production H integration", () => {
  it("H PASS allows production and is persisted", async () => {
    const h = await evaluate([]);
    expect(h.status).toBe("PASS");
    const report = await persistProductionValidation(directory, { gates: gates(h) });
    expect(report.productionDecision.allowed).toBe(true);
    expect(() => assertProductionAllowed(report.gates)).not.toThrow();
    expect(JSON.parse(await readFile(join(directory, "validation-report.json"), "utf8")).gates.H_VISUAL_VARIETY).toEqual(h);
  });
  it("H WARNING permits production and persists actual repetition warnings", async () => {
    const entry = buildVisualHistoryEntry(script, { ...plan, day: 1 });
    const h = await evaluate([entry]);
    expect(h.status).toBe("WARNING");
    const report = await persistProductionValidation(directory, { gates: gates(h) });
    expect(() => assertProductionAllowed(report.gates)).not.toThrow();
    const saved = JSON.parse(await readFile(join(directory, "validation-report.json"), "utf8"));
    expect(saved.productionDecision.allowed).toBe(true);
    expect(saved.gates.H_VISUAL_VARIETY.warnings.length).toBeGreaterThan(0);
  });
  it("H FAIL persists evidence and blocks production", async () => {
    const h = await evaluate([buildVisualHistoryEntry(script, { ...plan, day: 1 }, transcript)]);
    expect(h.status).toBe("FAIL");
    const report = await persistProductionValidation(directory, { gates: gates(h) });
    expect(report.productionDecision.allowed).toBe(false);
    expect(() => assertProductionAllowed(report.gates)).toThrow(/H_VISUAL_VARIETY/);
    expect(JSON.parse(await readFile(join(directory, "validation-report.json"), "utf8")).gates.H_VISUAL_VARIETY.status).toBe("FAIL");
  });
  it("missing visual plan fails closed", async () => {
    const h = await evaluateProductionVisualVariety({ outputDir: directory, historyPath: join(directory, "missing.json"), script, day: 2, transcript });
    expect(h.status).toBe("FAIL");
    expect(productionDecision(gates(h)).allowed).toBe(false);
  });
  it("malformed history fails closed instead of resetting history", async () => {
    await evaluate([]);
    await writeFile(join(directory, "visual-history.json"), "{broken");
    const h = await evaluateProductionVisualVariety({ outputDir: directory, historyPath: join(directory, "visual-history.json"), script, day: 2, transcript });
    expect(h.status).toBe("FAIL");
  });
  it("wrong source Day fails closed", async () => {
    await evaluate([]);
    const h = await evaluateProductionVisualVariety({ outputDir: directory, historyPath: join(directory, "visual-history.json"), script, day: 3, transcript });
    expect(h).toMatchObject({ status: "FAIL", error: expect.stringContaining("Day") });
  });
  it.each(MANDATORY_GATES)("%s remains mandatory even with H PASS", key => {
    const input = { ...gates({ status: "PASS" }), [key]: { status: "FAIL" } };
    expect(productionDecision(input).blockedBy).toContain(key);
    expect(() => assertProductionAllowed(input)).toThrow(/PRODUCTION_BLOCKED/);
  });
  it("retains E N/A while G pending still blocks", () => {
    const input = { ...gates({ status: "WARNING" }), E_NUMBER_HIGHLIGHTS: { status: "N/A" } };
    expect(productionDecision(input).allowed).toBe(true);
    expect(productionDecision({ ...input, G_TESTS: { status: "PENDING" } }).blockedBy).toEqual(["G_TESTS"]);
  });
  it("missing H cannot silently allow production", () => {
    expect(productionDecision(gates(undefined)).blockedBy).toEqual(["H_VISUAL_VARIETY"]);
  });
});
