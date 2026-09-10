import { describe, expect, it } from "vitest";
import { assessNarrationDuration } from "./pipeline.js";

describe("approved narration duration policy", () => {
  it("reports approved narration below 60s without padding or failure", () => {
    expect(assessNarrationDuration(54.99)).toEqual({
      status: "SHORT_APPROVED_NARRATION",
      audioSec: 54.99,
      targetRangeSec: [60, 90],
      padded: false,
    });
  });

  it("still rejects narration longer than the maximum", () => {
    expect(() => assessNarrationDuration(90.01)).toThrow(/exceeds 90s/);
  });
});
