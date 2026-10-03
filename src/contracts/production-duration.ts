import type { WordBoundaryTranscript } from "./content-contract.js";
import { resolve } from "node:path";

export const MIN_PRODUCTION_SEC = 60.5;
export const PREFERRED_PRODUCTION_SEC = 60.8;

/** User-approved, episode-local exception. The default series floor stays locked. */
export const DAY8_SHORT_DURATION = {
  minimumSec: 47.9,
  preferredSec: 48,
  approval: "Day 8 only: user explicitly allowed a shorter video on 2026-10-02",
} as const;

/** Day 9 short pacing was explicitly approved after its 60.8s draft render. */
export const DAY9_SHORT_DURATION = {
  minimumSec: 47.9,
  preferredSec: 48,
  approval: "Day 9 only: user explicitly allowed Day 8-style short pacing on 2026-10-03",
} as const;

/** Explicitly approved as a five-episode batch; only these isolated outputs qualify. */
export const DAY10_14_SHORT_DURATION = {
  minimumSec: 47.9,
  preferredSec: 48,
  approval: "Days 10–14 only: user explicitly allowed Day 8-style short pacing on 2026-10-03",
} as const;

type DurationException = { minimumSec: number; preferredSec: number; approval: string };

export function approvedDurationException(day: number, outputDir: string, projectRoot: string): DurationException | undefined {
  const destination = resolve(outputDir);
  if (day === 8 && destination === resolve(projectRoot, "output", "benchmarks", "day-8-v12-differentactually")) return DAY8_SHORT_DURATION;
  if (day === 9 && destination === resolve(projectRoot, "output", "benchmarks", "day-9-v12-short-differentactually")) return DAY9_SHORT_DURATION;
  if (day >= 10 && day <= 14 && destination === resolve(projectRoot, "output", "benchmarks", `day-${day}-v12-differentactually`)) return DAY10_14_SHORT_DURATION;
  return undefined;
}

/** Extend only the final, readable profile CTA. Never alter narration or middle scenes. */
export function planOutroDwell(transcript: WordBoundaryTranscript, gapSec: number, baselineHoldSec = 2, exception?: DurationException) {
  const last = transcript.scenes.at(-1)!;
  const visualBaseEndSec = (last.startMs + last.durationMs) / 1000 + gapSec;
  const lastWordEndSec = Math.max(...transcript.scenes.flatMap(s => s.words.map(w => w.globalEndMs))) / 1000;
  const profileEntranceSec = lastWordEndSec + .12;
  const finalTargetSec = Math.max(visualBaseEndSec + baselineHoldSec, exception?.preferredSec ?? PREFERRED_PRODUCTION_SEC);
  return { outroHoldSec: finalTargetSec - visualBaseEndSec, finalTargetSec, lastWordEndSec,
    profileEntranceSec, profileFullStateSec: profileEntranceSec + .5,
    readableDwellSec: finalTargetSec - profileEntranceSec - .5,
    strategy: "purposeful-outro-dwell", narrationModified: false };
}

export function assessProductionDuration(seconds: number, phase: "planned" | "measured", exception?: DurationException) {
  const minimumSec = exception?.minimumSec ?? MIN_PRODUCTION_SEC;
  const pass = Number.isFinite(seconds) && seconds >= minimumSec;
  return { status: pass ? "PASS" : "FAIL", phase, seconds, minimumSec,
    preferredMinimumSec: exception?.preferredSec ?? 60.7,
    ...(exception ? { episodeException: exception.approval } : {}),
    ...(pass ? {} : { reason: "NEED_DURATION_FIX" }) };
}
