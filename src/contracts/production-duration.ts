import type { WordBoundaryTranscript } from "./content-contract.js";

export const MIN_PRODUCTION_SEC = 60.5;
export const PREFERRED_PRODUCTION_SEC = 60.8;

/** Extend only the final, readable profile CTA. Never alter narration or middle scenes. */
export function planOutroDwell(transcript: WordBoundaryTranscript, gapSec: number, baselineHoldSec = 2) {
  const last = transcript.scenes.at(-1)!;
  const visualBaseEndSec = (last.startMs + last.durationMs) / 1000 + gapSec;
  const lastWordEndSec = Math.max(...transcript.scenes.flatMap(s => s.words.map(w => w.globalEndMs))) / 1000;
  const profileEntranceSec = lastWordEndSec + .12;
  const finalTargetSec = Math.max(visualBaseEndSec + baselineHoldSec, PREFERRED_PRODUCTION_SEC);
  return { outroHoldSec: finalTargetSec - visualBaseEndSec, finalTargetSec, lastWordEndSec,
    profileEntranceSec, profileFullStateSec: profileEntranceSec + .5,
    readableDwellSec: finalTargetSec - profileEntranceSec - .5,
    strategy: "purposeful-outro-dwell", narrationModified: false };
}

export function assessProductionDuration(seconds: number, phase: "planned" | "measured") {
  const pass = Number.isFinite(seconds) && seconds >= MIN_PRODUCTION_SEC;
  return { status: pass ? "PASS" : "FAIL", phase, seconds, minimumSec: MIN_PRODUCTION_SEC,
    preferredMinimumSec: 60.7, ...(pass ? {} : { reason: "NEED_DURATION_FIX" }) };
}
