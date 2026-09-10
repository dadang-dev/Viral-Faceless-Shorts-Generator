import { z } from "zod";

export const NumericRelationshipSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("weekly-spend-to-month"),
  purchaseId: z.string().min(1), frequencyId: z.string().min(1), resultId: z.string().min(1),
  convention: z.literal("52/12"),
}).strict();
type NumericDatum = { id: string; value: number; unit: string; qualifier: string; display: string };

/** Reconciles relationships independently of provenance. Calculations are validation evidence, not new visible data. */
export function validateNumericRelationships(data: NumericDatum[], relationships: z.infer<typeof NumericRelationshipSchema>[]) {
  const ids = new Set<string>();
  return relationships.map(input => {
    const r = NumericRelationshipSchema.parse(input);
    const fail = (reason: string): never => { throw new Error(`NUMERIC_RELATIONSHIP_INTEGRITY: ${r.id}: ${reason}`); };
    if (ids.has(r.id)) fail("duplicate relationship");
    ids.add(r.id);
    const purchase = data.find(d => d.id === r.purchaseId), frequency = data.find(d => d.id === r.frequencyId), result = data.find(d => d.id === r.resultId);
    if (!purchase || !frequency || !result) return fail("missing datum");
    if (purchase.unit !== "USD" || !["times/week", "nights/week"].includes(frequency.unit) || result.unit !== "USD/month") fail("incompatible units");
    if (purchase.qualifier !== "exact" || frequency.qualifier !== "exact" || frequency.value <= 0 || !Number.isInteger(frequency.value)) fail("inputs must be exact positive frequency");
    const computed = purchase.value * frequency.value * 52 / 12;
    // ABOUT is rounded to the nearest ten dollars; ALMOST must be below and within 10%.
    const reconciles = result.qualifier === "about" ? Math.round(computed / 10) * 10 === result.value
      : result.qualifier === "over" ? computed > result.value
      : result.qualifier === "almost" ? computed < result.value && computed >= .9 * result.value
      : result.qualifier === "exact" ? Math.abs(computed - result.value) < .000001 : false;
    if (!reconciles) fail(`${purchase.value} × ${frequency.value} × 52/12 = ${computed}, not ${result.display}`);
    return { relationship: r, inputs: [purchase, frequency], displayedResult: result.display, computedForValidationOnly: computed, status: "PASS" as const };
  });
}
