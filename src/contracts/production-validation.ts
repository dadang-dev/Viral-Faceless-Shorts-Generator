import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Script } from "../render/script-schema.js";
import type { WordBoundaryTranscript } from "./content-contract.js";
import { VisualPlanSchema, VisualHistorySchema, validateVisualVariety } from "../planning/visual-variety.js";

/** Called by the canonical Money Habits pipeline, never by the shared renderer. */
export async function evaluateProductionVisualVariety(args: {
  outputDir: string; historyPath: string; script: Script; day: number;
  transcript: WordBoundaryTranscript;
}) {
  try {
    const plan = VisualPlanSchema.parse(JSON.parse(await readFile(join(args.outputDir, "visual-plan.json"), "utf8")));
    if (plan.day !== args.day) throw new Error("visual-plan Day does not match approved source Day");
    // A missing or broken production history is not silently treated as no history.
    const history = VisualHistorySchema.parse(JSON.parse(await readFile(args.historyPath, "utf8")));
    return validateVisualVariety({ script: args.script, plan, history, transcript: args.transcript });
  } catch (error) {
    return { status: "FAIL" as const, warnings: [], error: `H_VISUAL_VARIETY: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export const MANDATORY_GATES = [
  "A_SCRIPT_INTEGRITY", "B_NO_UNAPPROVED_COPY", "C_THEME", "D_TRANSCRIPT",
  "E_NUMBER_HIGHLIGHTS", "F_TEMPLATE_SCENE", "G_TESTS",
] as const;

export function productionDecision(gates: Record<string, unknown>) {
  const status = (key: string) => (gates[key] as { status?: string } | undefined)?.status;
  const blockedBy: string[] = MANDATORY_GATES.filter(key => status(key) !== "PASS"
    && !(key === "E_NUMBER_HIGHLIGHTS" && status(key) === "N/A"));
  const hStatus = status("H_VISUAL_VARIETY");
  if (hStatus !== "PASS" && hStatus !== "WARNING") blockedBy.push("H_VISUAL_VARIETY");
  // Legacy reports predate this gate; canonical pipeline always supplies it.
  if (gates.I_PRODUCTION_DURATION && status("I_PRODUCTION_DURATION") !== "PASS") blockedBy.push("I_PRODUCTION_DURATION");
  if (gates.PRODUCTION_DURATION && status("PRODUCTION_DURATION") !== "PASS") blockedBy.push("PRODUCTION_DURATION");
  // Presence of either v1.2 gate opts into both mandatory finance gates.
  if (gates.I_FINANCE_DATA_VIZ || gates.J_MOTION_SEMANTICS) {
    for (const key of ["I_FINANCE_DATA_VIZ", "J_MOTION_SEMANTICS"]) {
      if (!["PASS", "WARNING"].includes(status(key) ?? "")) blockedBy.push(key);
    }
  }
  return { allowed: blockedBy.length === 0, blockedBy };
}

/** Persist before checking the decision, including H FAIL/WARNING evidence. */
export async function persistProductionValidation<T extends { gates: Record<string, unknown> }>(outputDir: string, report: T) {
  const result = { ...report, productionDecision: productionDecision(report.gates) };
  await writeFile(join(outputDir, "validation-report.json"), JSON.stringify(result, null, 2), "utf8");
  return result;
}

export function assertProductionAllowed(gates: Record<string, unknown>): void {
  const decision = productionDecision(gates);
  if (!decision.allowed) throw new Error(`PRODUCTION_BLOCKED: ${decision.blockedBy.join(", ")}`);
}
