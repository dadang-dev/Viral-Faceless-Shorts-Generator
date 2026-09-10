import { runPipeline } from "../src/pipeline.js";
import { join } from "node:path";

async function run() {
  const args = process.argv.slice(2);
  const targetDays = args.length > 0 ? args.map(Number) : [2, 3, 4, 5, 6, 7];

  for (const d of targetDays) {
    console.log(`\n========================================`);
    console.log(`Starting Render for Day ${d}...`);
    console.log(`========================================\n`);
    const scriptPath = join(process.cwd(), "output", `day-${d}`, "script.json");
    await runPipeline(scriptPath);
    console.log(`\n[SUCCESS] Day ${d} video generated!`);
  }
}

run().catch((err) => {
  console.error("Batch render failed:", err);
  process.exit(1);
});
