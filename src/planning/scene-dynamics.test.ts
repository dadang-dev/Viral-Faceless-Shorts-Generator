import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { ScriptSchema } from "../render/script-schema.js";
import { resolveVisualCues, assessSceneDynamics } from "./scene-dynamics.js";
const read = (name: string) => JSON.parse(readFileSync(`output/day-3/${name}.json`, "utf8"));
describe("phrase-linked existing primitives", () => {
  it("resolves every Day 3 cue without manual timestamps", () => {
    const script = ScriptSchema.parse(read("script"));
    const transcript = read("transcript");
    const cues = resolveVisualCues(script, transcript);
    expect(cues).toHaveLength(script.scenes.reduce((n, s) => n + (s.visualCues?.length ?? 0), 0));
    for (const cue of cues) expect(transcript.scenes.find((s: any) => s.id === cue.sceneId).words.some((w: any) => w.globalStartMs === cue.globalStartSec * 1000)).toBe(true);
    const holds = assessSceneDynamics(transcript, cues);
    for (const id of ["scene-3", "scene-7", "scene-8", "scene-10"]) expect(holds.find(s => s.sceneId === id)?.status).toBe("LONG_HOLD_OK");
  });
  it("fails a missing phrase instead of guessing or skipping", () => {
    const script = ScriptSchema.parse(read("script"));
    script.scenes[2].visualCues![0].spokenPhrase = "made up text";
    expect(() => resolveVisualCues(script, read("transcript"))).toThrow(/resolves 0 times/);
  });
  it("fails duplicate cue targets", () => {
    const script = ScriptSchema.parse(read("script"));
    script.scenes[2].visualCues!.push(script.scenes[2].visualCues![0]);
    expect(() => resolveVisualCues(script, read("transcript"))).toThrow(/duplicate target/);
  });
  it("fails a target absent from that template", () => {
    const script = ScriptSchema.parse(read("script"));
    script.scenes[2].visualCues![0].target = "stat-context";
    expect(() => resolveVisualCues(script, read("transcript"))).toThrow(/invalid/);
  });
  it("reports static holds as warnings, not automatic scene-duration FAIL", () => {
    const holds = assessSceneDynamics(read("transcript"), []);
    expect(holds.every(h => h.status === "STATIC_LONG_HOLD_WARNING")).toBe(true);
  });
  it("keeps unconfigured Day 1/2 choreography opt-in", () => {
    for (const day of [1, 2]) {
      const script = ScriptSchema.parse(JSON.parse(readFileSync(`output/day-${day}/script.json`, "utf8")));
      const transcript = JSON.parse(readFileSync(`output/day-${day}/transcript.json`, "utf8"));
      expect(resolveVisualCues(script, transcript)).toEqual([]);
      expect(script.scenes.every(s => !s.statArrangement)).toBe(true);
    }
  });
});
