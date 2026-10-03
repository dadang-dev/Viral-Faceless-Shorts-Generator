import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { APPROVED_SCRIPT_FILE, HISTORICAL_SCRIPT_FILE, extractApprovedVoiceOver } from "./content-contract.js";
import { literalNumbers, datumDisplay } from "./finance-motion.js";
import { validateNumericRelationships } from "./numeric-relationships.js";

describe("verified Day 1 source revision", () => {
  const old = readFileSync(HISTORICAL_SCRIPT_FILE), revised = readFileSync(APPROVED_SCRIPT_FILE);
  const day8Boundary = revised.indexOf("\n## Day 8");
  const approvedFirstSevenDays = revised.subarray(0, day8Boundary);
  it("appends new days after the protected Day 1–7 source", () => expect(day8Boundary).toBeGreaterThan(0));
  it("preserves Day 2–7 byte for byte", () => expect(approvedFirstSevenDays.subarray(approvedFirstSevenDays.indexOf("## Day 2"))).toEqual(old.subarray(old.indexOf("## Day 2"))));
  it("applies exactly three Day 1 corrections within the first seven days", () => {
    const expected = old.toString("utf8")
      .replace("is more than most people's entire grocery budget.", "is about a hundred and seventy dollars a month.")
      .replace("Number three: rounding down in your head.", "Number three: rounding it off in your head.")
      .replace("spent almost three hundred dollars a month", "spent over two hundred dollars a month");
    expect(approvedFirstSevenDays.toString("utf8")).toBe(expected);
    expect(extractApprovedVoiceOver(expected, 1)).not.toMatch(/grocery budget|rounding down|three hundred/);
  });
  it("parses approved a hundred and seventy as one value", () => expect(literalNumbers("about a hundred and seventy dollars a month")).toEqual([170]));
  it("preserves non-exact financial qualifiers", () => {
    expect(datumDisplay({value:170, unit:"USD/month", qualifier:"about"})).toBe("ABOUT $170 / MONTH");
    expect(datumDisplay({value:200, unit:"USD/month", qualifier:"over"})).toBe("OVER $200 / MONTH");
    expect(datumDisplay({value:20, unit:"USD", qualifier:"approx"})).toBe("~$20");
  });
});

describe("numeric relationship integrity independent of literal provenance", () => {
  const r = {id:"monthly",kind:"weekly-spend-to-month" as const,purchaseId:"purchase",frequencyId:"frequency",resultId:"result",convention:"52/12" as const};
  const data = (price:number, times:number, amount:number, qualifier:string) => [
    {id:"purchase",value:price,unit:"USD",qualifier:"exact",display:`$${price}`},
    {id:"frequency",value:times,unit:"times/week",qualifier:"exact",display:`${times} TIMES A WEEK`},
    {id:"result",value:amount,unit:"USD/month",qualifier,display:`${qualifier.toUpperCase()} $${amount} / MONTH`},
  ];
  it("validates 10 × 4/week → about 170/month", () => expect(validateNumericRelationships(data(10,4,170,"about"),[r])[0].status).toBe("PASS"));
  it("validates 18 × 3/week → over 200/month", () => expect(validateNumericRelationships(data(18,3,200,"over"),[r])[0].status).toBe("PASS"));
  it("rejects old almost 300 even if the number is a script literal", () => expect(() => validateNumericRelationships(data(18,3,300,"almost"),[r])).toThrow(/NUMERIC_RELATIONSHIP_INTEGRITY/));
  it("does not treat over 200 as exactly 200", () => expect(() => validateNumericRelationships(data(18,3,200,"exact"),[r])).toThrow());
  it("rejects missing or incompatible inputs", () => { const d=data(10,4,170,"about");d[0].unit="apps";expect(() => validateNumericRelationships(d,[r])).toThrow(/incompatible units/);expect(() => validateNumericRelationships([], [r])).toThrow(/missing datum/); });
});
