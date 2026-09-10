import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { assessProductionDuration, planOutroDwell } from "./production-duration.js";
import { productionDecision } from "./production-validation.js";
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
});
