import type { Script } from "../render/script-schema.js";
import { normalizeContractText, type WordBoundaryTranscript } from "../contracts/content-contract.js";

export interface ResolvedVisualCue { sceneId: string; target: string; spokenPhrase: string; startSec: number; globalStartSec: number }
const targets: Record<string, string[]> = {
  hook: ["hook-subhead", "bill-one", "bill-two", "bill-three"],
  "stat-hero": ["stat-label", "stat-context"],
  "feature-list": ["feat-bullet-0", "feat-bullet-1", "feat-bullet-2", "feat-bullet-3"],
  callout: ["callout-statement"], outro: ["out-source", "out-underline"], comparison: [],
};

/** Only reschedules existing entrances. No new copy, arbitrary animation, or manual times. */
export function resolveVisualCues(script: Script, transcript: WordBoundaryTranscript): ResolvedVisualCue[] {
  return script.scenes.flatMap(scene => {
    if (scene.hookFrameZeroReadable && (scene !== script.scenes[0] || scene.templateData.template !== "hook")) throw new Error("VISUAL_CUES: frame-zero option belongs only to the opening hook");
    if (scene.statArrangement && scene.templateData.template !== "stat-hero") throw new Error("VISUAL_CUES: stat arrangement on non-stat scene");
    const seen = new Set<string>();
    return (scene.visualCues ?? []).map(cue => {
      const td = scene.templateData;
      const missing = (cue.target === "hook-subhead" && !("subhead" in td && td.subhead))
        || (cue.target === "stat-context" && !("context" in td && td.context))
        || (cue.target.startsWith("feat-bullet-") && !("bullets" in td && td.bullets[Number(cue.target.at(-1))]));
      if (!targets[td.template].includes(cue.target) || missing || seen.has(cue.target)) throw new Error(`VISUAL_CUES: invalid/duplicate target ${scene.id}.${cue.target}`);
      seen.add(cue.target);
      const timed = transcript.scenes.find(s => s.id === scene.id);
      if (!timed) throw new Error(`VISUAL_CUES: missing transcript ${scene.id}`);
      // Flatten normalized tokens while retaining the owning WordBoundary cue.
      const tokens = timed.words.flatMap(word => normalizeContractText(word.text).split(" ").filter(Boolean).map(text => ({ text, word })));
      const phrase = normalizeContractText(cue.spokenPhrase).split(" ").filter(Boolean);
      const hits = tokens.filter((_, i) => phrase.length && phrase.every((token, j) => tokens[i + j]?.text === token));
      if (hits.length !== 1) throw new Error(`VISUAL_CUES: "${cue.spokenPhrase}" resolves ${hits.length} times in ${scene.id}`);
      const word = hits[0].word;
      if (word.startMs >= timed.durationMs) throw new Error(`VISUAL_CUES: cue outside scene ${scene.id}`);
      return { sceneId: scene.id, ...cue, startSec: word.startMs / 1000, globalStartSec: word.globalStartMs / 1000 };
    });
  });
}

/** A planning heuristic, not pixel QA or an automatic rejection of long scenes. */
export function assessSceneDynamics(transcript: WordBoundaryTranscript, cues: ResolvedVisualCue[]) {
  return transcript.scenes.filter(s => s.durationMs > 5000).map(scene => {
    const changes = cues.filter(c => c.sceneId === scene.id && c.startSec > 1);
    const times = [0, ...changes.map(c => c.startSec).sort((a, b) => a - b), scene.durationMs / 1000];
    const longestHoldSec = Math.max(...times.slice(1).map((time, i) => time - times[i]));
    return { sceneId: scene.id, durationSec: scene.durationMs / 1000,
      status: changes.length && longestHoldSec <= 5 ? "LONG_HOLD_OK" : "STATIC_LONG_HOLD_WARNING",
      longestHoldSec, changes, evidence: "transcript-linked existing element entrances; requires frame-level visual confirmation" };
  });
}
