import {readFile,writeFile} from "node:fs/promises";
import {buildVisualHistoryEntry,VisualHistorySchema,validateVisualVariety} from "../src/planning/visual-variety.js";
import {persistProductionValidation,assertProductionAllowed} from "../src/contracts/production-validation.js";
const json=async(p:string)=>JSON.parse(await readFile(p,"utf8"));
const original=VisualHistorySchema.parse(await json("output/visual-history.json"));
// A batch-local comparison history is evidence of layout, never approval.
const history={version:"1.1" as const,entries:original.entries.filter(e=>e.day<3)};
for(const day of [3,4,5,6,7]){
 const out=`output/benchmarks/day-${day}-v12-differentactually`;
 const script=await json(`${out}/script.json`),plan=await json(`${out}/visual-plan.json`),transcript=await json(`${out}/transcript.json`);
 if(day>=4){
  await writeFile(`${out}/batch-comparison-history.json`,JSON.stringify(history,null,2));
  const report=await json(`${out}/validation-report.json`);
  report.gates.H_VISUAL_VARIETY=validateVisualVariety({script,plan,history:VisualHistorySchema.parse(history),transcript});
  report.visualHistoryScope="Batch-local Day 3–7 render plans, plus historical Day 1–2 metadata; no approval state inferred or modified.";
  await persistProductionValidation(out,report);assertProductionAllowed(report.gates);
  console.log(day,JSON.stringify(report.gates.H_VISUAL_VARIETY));
 }
 history.entries.push(buildVisualHistoryEntry(script,plan,transcript));
}
