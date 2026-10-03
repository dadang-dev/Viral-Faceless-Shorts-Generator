import { describe, expect, it } from "vitest";
import { validateBrowserSnapshots, validateFinanceGeometry, type BrowserGeometrySnapshot } from "./visual-collision.js";

const ref = (sceneId = "scene-1", sourceSpan = "source") => ({ sceneId, sourceSpan, source: "money-habits-script-v2.1-verified.md" as const });
const sequence = (elements: any[], motionEvents: any[] = []) => ({ id: "synthetic", sceneIds: ["scene-1"], visualModel: "decision-flow", semanticRationale: "synthetic regression fixture for shared guardrails", entryRelation: "new-topic", entryTransition: "crossfade", startSec: 0, endSec: 1, elements, motionEvents });
const plan = (elements: any[], motionEvents: any[] = [], data: any[] = []) => ({ version: "1.2" as const, day: 2, data, sequences: [sequence(elements, motionEvents)], provenance: [] }) as any;
const text = (id: string, box: any, role: "HERO" | "SECTION_MARKER" = "HERO", copy = "GET A RAISE") => ({ id, kind: "text", box, copy: { ...ref(), text: copy }, role, size: "heading", fontSize: 80, initial: true });
const node = (id: string, box: any, copy?: string) => ({ id, kind: "node", box, ...(copy ? { copy: { ...ref(), text: copy }, role: "STRUCTURAL_LABEL" } : {}), icon: "wallet", initial: true });
const event = (id: string, target: string, action: "reveal" | "focus", transition: any, pose?: any) => ({ id, trigger: ref(), action, targets: [target], relation: "progression", transition, rationale: "synthetic regression event", atSec: 0, endSec: .42, timingSource: "transcript.json", ...(pose ? { pose } : {}) });

describe("v1.2 shared visual collision guardrails", () => {
  it("keeps loaded-font ink overflow a failure even when the nominal line box fits", () => {
    const metric = { id: "months", role: "DATA_LABEL", kind: "metric", opacity: 1,
      rect: { x: 130, y: 740, w: 820, h: 260 },
      textRect: { x: 130, y: 870, w: 820, h: 118 }, textOverflow: true };
    // Real Anton at 112px has 143px scroll ink here: 130 + 143 > 260.
    expect(validateBrowserSnapshots([{ sequenceId: "time-jump", timeSec: 7, elements: [metric] }]).status).toBe("FAIL");
    // The same glyph ink is contained by the corrected 280px semantic parent.
    expect(validateBrowserSnapshots([{ sequenceId: "time-jump", timeSec: 7, elements: [{ ...metric, rect: { ...metric.rect, h: 280 }, textOverflow: false }] }]).status).toBe("PASS");
  });
  it("fails a hero/foreground overlap and passes after moving the object below the hero lane", () => {
    expect(validateFinanceGeometry(plan([text("hero", { x: 110, y: 500, w: 860, h: 300 }), node("wallet", { x: 390, y: 650, w: 300, h: 230 })])).failures.some(f => f.code === "HERO_FOREGROUND_OVERLAP")).toBe(true);
    expect(validateFinanceGeometry(plan([text("hero", { x: 110, y: 500, w: 860, h: 300 }), node("wallet", { x: 390, y: 850, w: 300, h: 230 })])).status).toBe("PASS");
  });

  it("fails retained card/tag compression and passes with separated retained lanes", () => {
    const datum = { id: "metric", display: "$200 / MONTH", value: 200, unit: "USD/month", qualifier: "exact", sourceType: "script-literal", ...ref("scene-1", "two hundred dollars"), unitSource: ref("scene-1", "more a month") };
    const metric = { id: "tag", kind: "metric", box: { x: 110, y: 520, w: 860, h: 170 }, datumId: "metric", initial: true };
    expect(validateFinanceGeometry(plan([{ ...node("home", { x: 110, y: 450, w: 860, h: 220 }), entityGroup: "apartment" }, { ...metric, entityGroup: "apartment" }], [], [datum])).failures.some(f => f.code === "RETAINED_METRIC_OVERLAP")).toBe(true);
    expect(validateFinanceGeometry(plan([{ ...node("home", { x: 110, y: 300, w: 410, h: 220 }), entityGroup: "apartment" }, { ...metric, entityGroup: "apartment", box: { x: 660, y: 300, w: 330, h: 170 } }], [], [datum])).status).toBe("PASS");
  });

  it("fails text overflow and passes when the container is wide enough", () => {
    expect(validateFinanceGeometry(plan([text("headline", { x: 110, y: 500, w: 100, h: 80 }, "HERO", "A SLIGHTLY NICER APARTMENT")])).failures.some(f => f.code === "TEXT_CONTAINMENT")).toBe(true);
    expect(validateFinanceGeometry(plan([text("headline", { x: 110, y: 500, w: 820, h: 240 }, "HERO", "A SLIGHTLY NICER APARTMENT")])).status).toBe("PASS");
  });

  it("fails transformed right-edge clipping before the shared safe-frame clamp", () => {
    expect(validateFinanceGeometry(plan([{ ...node("card", { x: 700, y: 700, w: 400, h: 180 }), initial: true }])).failures.some(f => f.code === "SAFE_FRAME")).toBe(true);
    expect(validateFinanceGeometry(plan([{ ...node("card", { x: 600, y: 700, w: 400, h: 180 }), initial: true }], [event("enter", "card", "reveal", "push-stack")])).status).toBe("PASS");
  });

  it("reports caption/foreground intersection and transformed out-of-bounds in browser snapshots", () => {
    const snapshots: BrowserGeometrySnapshot[] = [{ sequenceId: "synthetic", timeSec: .5, elements: [
      { id: "caption", role: "CTA", opacity: 1, rect: { x: 100, y: 500, w: 400, h: 120 }, textRect: { x: 100, y: 500, w: 400, h: 120 } },
      { id: "foreground", role: "STRUCTURAL_LABEL", kind: "node", opacity: 1, rect: { x: 300, y: 540, w: 400, h: 180 } },
      { id: "clipped", role: "STRUCTURAL_LABEL", opacity: 1, rect: { x: 60, y: 400, w: 200, h: 100 } },
    ] }];
    const report = validateBrowserSnapshots(snapshots);
    expect(report.failures.some(f => f.code === "CAPTION_FOREGROUND_OVERLAP")).toBe(true);
    expect(report.failures.some(f => f.code === "TRANSFORM_CLIPPING")).toBe(true);
    expect(validateBrowserSnapshots([{ sequenceId: "synthetic", timeSec: .5, elements: [
      { id: "metric", role: "DATA_LABEL", kind: "metric", opacity: 1, rect: { x: 720, y: 300, w: 290, h: 170 }, textRect: { x: 720, y: 300, w: 290, h: 52 }, textOverflow: true },
    ] }]).failures.some(f => f.code === "TEXT_CONTAINMENT")).toBe(true);
  });
});
