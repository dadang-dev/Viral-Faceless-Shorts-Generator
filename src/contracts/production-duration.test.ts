import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { approvedDurationException, assessProductionDuration, DAY8_SHORT_DURATION, DAY9_SHORT_DURATION, DAY10_14_SHORT_DURATION, planOutroDwell } from "./production-duration.js";
import { productionDecision } from "./production-validation.js";
import type { WordBoundaryTranscript } from "./content-contract.js";
const transcript = (day: number) => JSON.parse(readFileSync(`output/day-${day}/transcript.json`, "utf8"));
describe("purposeful outro duration", () => {
  it.each([59.367, 60.499, NaN])("rejects unsafe measured duration %s", seconds => {
    expect(assessProductionDuration(seconds, "measured")).toMatchObject({ status: "FAIL", reason: "NEED_DURATION_FIX" });
  });
  it.each([60.5, 60.7, 60.8, 61])("accepts measured duration %s", seconds => {
    expect(assessProductionDuration(seconds, "measured").status).toBe("PASS");
  });
  it("Day 3 extends only outro, with CTA after last WordBoundary +120ms", () => {
    const value = transcript(3), before = JSON.stringify(value);
    const dwell = planOutroDwell(value, .2);
    expect(dwell.finalTargetSec).toBe(60.8);
    expect(dwell.profileEntranceSec).toBeCloseTo(57.326, 3);
    expect(dwell.readableDwellSec).toBeGreaterThan(2.9);
    expect(JSON.stringify(value)).toBe(before);
  });
  it("preserves existing outro hold when already safe; never shortens it", () => {
    expect(planOutroDwell(transcript(1), .2).outroHoldSec).toBeCloseTo(2);
    // A future authorized Day 2 rerender would adopt the new duration minimum.
    // This does not modify its immutable short MP4.
    expect(planOutroDwell(transcript(2), .2).finalTargetSec).toBe(60.8);
  });
  it("a failed duration gate blocks a production decision", () => {
    expect(productionDecision({ I_PRODUCTION_DURATION: { status: "FAIL" } }).blockedBy).toContain("I_PRODUCTION_DURATION");
  });
  it("confines the approved short-video exception to the isolated Day 8 benchmark", () => {
    const root = process.cwd();
    const output = join(root, "output", "benchmarks", "day-8-v12-differentactually");
    expect(approvedDurationException(8, output, root)).toEqual(DAY8_SHORT_DURATION);
    expect(approvedDurationException(7, output, root)).toBeUndefined();
    expect(approvedDurationException(9, output, root)).toBeUndefined();
    expect(approvedDurationException(8, join(root, "output", "day-8"), root)).toBeUndefined();
    expect(approvedDurationException(8, join(root, "output", "benchmarks", "day-8-other"), root)).toBeUndefined();
  });
  it("uses a short, readable CTA only for the authorized Day 8 policy", () => {
    const short = { scenes: [{ startMs: 0, durationMs: 44208, words: [{ globalEndMs: 44247 }] }] } as unknown as WordBoundaryTranscript;
    const dwell = planOutroDwell(short, .2, 2, DAY8_SHORT_DURATION);
    expect(dwell.finalTargetSec).toBe(48);
    expect(dwell.readableDwellSec).toBeGreaterThan(3);
    expect(planOutroDwell(short, .2).finalTargetSec).toBe(60.8);
    expect(assessProductionDuration(48, "measured").status).toBe("FAIL");
    expect(assessProductionDuration(47.8, "measured", DAY8_SHORT_DURATION).status).toBe("FAIL");
    expect(assessProductionDuration(48, "measured", DAY8_SHORT_DURATION)).toMatchObject({ status: "PASS", minimumSec: 47.9, episodeException: DAY8_SHORT_DURATION.approval });
  });
  it("confines the newly approved Day 9 short pacing to its separate derivative", () => {
    const root = process.cwd();
    const output = join(root, "output", "benchmarks", "day-9-v12-short-differentactually");
    expect(approvedDurationException(9, output, root)).toEqual(DAY9_SHORT_DURATION);
    expect(approvedDurationException(9, join(root, "output", "benchmarks", "day-9-v12-differentactually"), root)).toBeUndefined();
    expect(approvedDurationException(10, output, root)).toBeUndefined();
    const voice = { scenes: [{ startMs: 0, durationMs: 43320, words: [{ globalEndMs: 43452 }] }] } as unknown as WordBoundaryTranscript;
    expect(planOutroDwell(voice, .2, 2, DAY9_SHORT_DURATION).finalTargetSec).toBe(48);
    expect(planOutroDwell(voice, .2, 2, DAY9_SHORT_DURATION).readableDwellSec).toBeGreaterThan(3);
    expect(assessProductionDuration(48, "measured", DAY9_SHORT_DURATION).status).toBe("PASS");
    expect(assessProductionDuration(48, "measured").status).toBe("FAIL");
  });
  it("confines the authorized Day 10–14 short pacing to five isolated benchmark paths", () => {
    const root = process.cwd();
    for (const day of [10, 11, 12, 13, 14]) {
      const output = join(root, "output", "benchmarks", `day-${day}-v12-differentactually`);
      expect(approvedDurationException(day, output, root)).toEqual(DAY10_14_SHORT_DURATION);
      expect(approvedDurationException(day, join(root, "output", `day-${day}`), root)).toBeUndefined();
      expect(approvedDurationException(day, join(root, "output", "benchmarks", `day-${day}-other`), root)).toBeUndefined();
    }
    expect(approvedDurationException(15, join(root, "output", "benchmarks", "day-15-v12-differentactually"), root)).toBeUndefined();
    expect(assessProductionDuration(48, "measured", DAY10_14_SHORT_DURATION).status).toBe("PASS");
  });
});
