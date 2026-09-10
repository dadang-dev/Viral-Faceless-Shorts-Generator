import { resolve, relative, isAbsolute } from "node:path";
export function assertBenchmarkDestination(outputDir:string) {
  const delta = relative(resolve("output/benchmarks"),resolve(outputDir));
  if (!delta || delta.startsWith("..") || isAbsolute(delta)) throw new Error("IMMUTABLE_BASELINE: benchmark destination must be a child of output/benchmarks");
}
