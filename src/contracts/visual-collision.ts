import type { FinanceElement, ResolvedEvent, ResolvedFinancePlan, ResolvedSequence } from "./finance-motion.js";

/**
 * Shared v1.2 geometry guardrails.  Planning boxes are intentionally kept
 * independent from any one Day: the validator checks the semantic role and
 * the transformed state, not a hard-coded storyboard coordinate.
 */
export const VISUAL_SAFE_FRAME = {
  left: 70,
  top: 240,
  right: 1010,
  bottom: 1340,
} as const;

export const VISUAL_GAPS = {
  heroForeground: 28,
  retainedMetric: 24,
  retainedNeighbour: 18,
  textContainer: 20,
} as const;

export type CollisionCode =
  | "HERO_FOREGROUND_OVERLAP"
  | "RETAINED_METRIC_OVERLAP"
  | "RETAINED_NEIGHBOUR_OVERLAP"
  | "TEXT_CONTAINMENT"
  | "SAFE_FRAME"
  | "TRANSFORM_CLIPPING"
  | "CAPTION_FOREGROUND_OVERLAP";

export interface GeometryBox { x: number; y: number; w: number; h: number; }
export interface GeometryState extends GeometryBox {
  opacity: number;
  scale: number;
  fontSize: number;
  datumId?: string;
}

export interface CollisionFailure {
  code: CollisionCode;
  sequenceId: string;
  timeSec: number;
  elements: string[];
  detail: string;
}

export interface TemporalSample {
  sequenceId: string;
  timeSec: number;
  phase: "entrance" | "early-hold" | "midpoint" | "late-hold" | "exit" | "event-boundary" | "interval";
  states: Record<string, GeometryState>;
}

export interface VisualCollisionReport {
  status: "PASS" | "FAIL";
  strategy: {
    sampleStepSec: number;
    samplePhases: string[];
    transformAware: true;
    fontAware: true;
    safeFrame: typeof VISUAL_SAFE_FRAME;
  };
  samples: TemporalSample[];
  failures: CollisionFailure[];
}

type Prop = "x" | "y" | "w" | "h" | "opacity" | "scale" | "fontSize";
type Tween = { start: number; duration: number; from: number; to: number };
type Track = Record<Prop, Tween[]>;

const finite = (n: number, fallback = 0) => Number.isFinite(n) ? n : fallback;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);
const overlap = (a: GeometryBox, b: GeometryBox) =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
  Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
const axisGap = (a0: number, a1: number, b0: number, b1: number) => Math.max(b0 - a1, a0 - b1, 0);

function baseFontSize(element: FinanceElement): number {
  return element.fontSize ?? (element.size === "heading" ? 78 : element.size === "small" ? 40 : 46);
}

function isTextLike(element: FinanceElement): boolean {
  return element.kind === "text" || Boolean(element.copy) || element.kind === "metric" || element.kind === "stack-item";
}

function isDominantText(element: FinanceElement): boolean {
  // HERO is the only text role that reserves the dominant safe lane.  A
  // SECTION_MARKER is allowed to sit in the foreground stack and must not be
  // treated as a global hero collision partner.
  return element.role === "HERO";
}

function isForegroundObject(element: FinanceElement): boolean {
  return element.kind !== "text" && (element.role === "HERO" || element.role === "SECTION_MARKER" || element.kind === "node" || element.kind === "stack-item" || element.kind === "metric" || element.kind === "bar" || element.kind === "markers");
}

function isMetric(element: FinanceElement): boolean {
  return element.kind === "metric" || element.role === "DATA_LABEL" || element.datumId !== undefined;
}

function allowsOverlap(a: FinanceElement, b: FinanceElement): boolean {
  return Boolean(a.overlapSafeWith?.includes(b.id) || b.overlapSafeWith?.includes(a.id));
}

function textContent(element: FinanceElement, datumDisplay?: string): string {
  return element.copy?.text ?? datumDisplay ?? "";
}

/** Conservative loaded-font measurement used before browser sampling. */
export function estimateTextBounds(element: FinanceElement, state: GeometryState, datumDisplay?: string): GeometryBox | null {
  const text = textContent(element, datumDisplay).trim();
  if (!text || !isTextLike(element)) return null;
  const fontSize = Math.max(40, state.fontSize);
  const padding = element.kind === "node" ? 24 : element.kind === "stack-item" ? 26 : element.kind === "metric" ? 20 : 0;
  const iconReserve = element.icon ? (element.kind === "node" ? Math.min(100, state.w * .22) + 24 : element.kind === "stack-item" ? 100 + 32 : 0) : 0;
  const availableWidth = Math.max(1, state.w / state.scale - padding * 2 - iconReserve);
  // Anton headings are wide; Inter body/marker text is narrower.  These are
  // conservative fallback metrics, while browser QA below uses real loaded
  // font getBoundingClientRect values.
  const charWidth = fontSize * (element.numericTypography ? .42 : element.role === "HERO" || element.size === "heading" ? .52 : .44);
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length * charWidth > availableWidth) {
      lines.push(current); current = word;
    } else current = candidate;
  }
  if (current) lines.push(current);
  const width = Math.min(availableWidth, Math.max(...lines.map(line => line.length * charWidth), 0));
  const lineHeight = fontSize * (element.kind === "text" ? 1.13 : 1.22);
  return { x: state.x + padding + iconReserve, y: state.y + padding, w: width, h: lines.length * lineHeight };
}

function transformedBounds(state: GeometryState): GeometryBox {
  const w = state.w * state.scale, h = state.h * state.scale;
  return { x: state.x + (state.w - w) / 2, y: state.y + (state.h - h) / 2, w, h };
}

function addTween(tracks: Track, prop: Prop, start: number, duration: number, to: number, read: (prop: Prop, time: number) => number) {
  const from = read(prop, start - .0001);
  tracks[prop].push({ start, duration, from, to });
}

function readTrack(track: Tween[], base: number, time: number): number {
  let value = base;
  for (const tween of track) {
    if (tween.start > time) break;
    if (tween.duration <= 0 || time >= tween.start + tween.duration) value = tween.to;
    else value = lerp(tween.from, tween.to, (time - tween.start) / tween.duration);
  }
  return value;
}

function makeSamples(sequence: ResolvedSequence, stepSec: number): Array<{ timeSec: number; phase: TemporalSample["phase"] }> {
  const points = new Map<number, TemporalSample["phase"]>();
  const add = (time: number, phase: TemporalSample["phase"]) => {
    if (time < sequence.startSec - .0001 || time > sequence.endSec + .0001) return;
    const key = Number(Math.max(sequence.startSec, Math.min(sequence.endSec, time)).toFixed(4));
    if (!points.has(key) || phase === "event-boundary") points.set(key, phase);
  };
  add(sequence.startSec, "entrance");
  add(sequence.startSec + Math.min(.36, Math.max(.01, (sequence.endSec - sequence.startSec) * .12)), "early-hold");
  add((sequence.startSec + sequence.endSec) / 2, "midpoint");
  add(sequence.endSec - Math.min(.36, Math.max(.01, (sequence.endSec - sequence.startSec) * .12)), "late-hold");
  add(sequence.endSec - .001, "exit");
  for (let t = sequence.startSec; t <= sequence.endSec + .0001; t += stepSec) add(t, "interval");
  for (const event of sequence.motionEvents) {
    for (const delta of [-.001, 0, .001, .06, .10, .18, .36, .42]) add(event.atSec + delta, "event-boundary");
  }
  return [...points.entries()].sort(([a], [b]) => a - b).map(([timeSec, phase]) => ({timeSec, phase}));
}

function buildStates(sequence: ResolvedSequence, plan: ResolvedFinancePlan, timeSec: number): Record<string, GeometryState> {
  const base = new Map(sequence.elements.map(element => [element.id, {
    x: element.box.x, y: element.box.y, w: element.box.w, h: element.box.h,
    opacity: element.initial ? 1 : 0, scale: 1, fontSize: baseFontSize(element), datumId: element.datumId,
  } satisfies GeometryState]));
  const tracks = new Map<string, Track>(sequence.elements.map(element => [element.id, {
    x: [], y: [], w: [], h: [], opacity: [], scale: [], fontSize: [],
  }]));
  const read = (id: string, prop: Prop, time: number) => readTrack(tracks.get(id)![prop], base.get(id)![prop], time);
  const add = (id: string, prop: Prop, start: number, duration: number, to: number) => addTween(tracks.get(id)!, prop, start, duration, to, (p, t) => read(id, p, t));
  const sorted = [...sequence.motionEvents].sort((a, b) => a.atSec - b.atSec || a.id.localeCompare(b.id));
  for (const event of sorted) {
    for (const id of event.targets) {
      const element = sequence.elements.find(item => item.id === id);
      if (!element) continue;
      const requestedX = event.transition === "push-stack" ? 48 : event.transition === "split-expand" ? 40 : 0;
      const requestedY = event.transition === "directional-progression" ? -24 : 16;
      // Match the shared renderer's transform-aware safe-frame clamp.  A
      // right-edge card with a push-stack entrance gets at most the space
      // that remains inside the frame, instead of clipping for one frame.
      const offsetX = Math.max(VISUAL_SAFE_FRAME.left - element.box.x, Math.min(VISUAL_SAFE_FRAME.right - element.box.x - element.box.w, requestedX));
      const offsetY = Math.max(VISUAL_SAFE_FRAME.top - element.box.y, Math.min(VISUAL_SAFE_FRAME.bottom - element.box.y - element.box.h, requestedY));
      if (["reveal", "stack", "grow", "draw"].includes(event.action)) {
        // Entrance bounds include the translated/opacity-zero starting state.
        add(id, "x", event.atSec, .36, element.box.x);
        add(id, "y", event.atSec, .36, element.box.y);
        add(id, "opacity", event.atSec, .36, event.revealOpacity ?? 1);
        if (event.transition === "stat-punch") {
          add(id, "scale", event.atSec, .18, 1.06);
          add(id, "scale", event.atSec + .18, .24, 1);
        }
        // Seed translated values by replacing the first tween's from value.
        tracks.get(id)!.x.at(-1)!.from = element.box.x + offsetX;
        tracks.get(id)!.y.at(-1)!.from = element.box.y + offsetY;
      } else if (event.action === "hide") {
        add(id, "opacity", event.atSec, .18, 0);
      } else if (event.action === "punch") {
        add(id, "scale", event.atSec, .18, 1.1);
        add(id, "scale", event.atSec + .18, .24, 1);
      } else if (event.action === "focus" && event.pose) {
        const pose = event.pose;
        const target = pose.box;
        if (target && pose.route === "horizontal-first") {
          add(id, "x", event.atSec, .18, target.x);
          add(id, "w", event.atSec, .18, target.w);
          add(id, "h", event.atSec, .18, target.h);
          add(id, "y", event.atSec + .18, .24, target.y);
        } else if (target) {
          add(id, "x", event.atSec, .42, target.x);
          add(id, "y", event.atSec, .42, target.y);
          add(id, "w", event.atSec, .42, target.w);
          add(id, "h", event.atSec, .42, target.h);
        }
        if (pose.opacity !== undefined) {
          const opacityAt = pose.route === "horizontal-first" ? event.atSec + .18 : event.atSec;
          const opacityDuration = pose.route === "horizontal-first" ? .24 : .42;
          add(id, "opacity", opacityAt, opacityDuration, pose.opacity);
        }
        if (pose.fontSize !== undefined) add(id, "fontSize", event.atSec, pose.route === "horizontal-first" ? .18 : .42, pose.fontSize);
      }
    }
  }
  const states: Record<string, GeometryState> = {};
  for (const element of sequence.elements) {
    const b = base.get(element.id)!;
    states[element.id] = {
      x: finite(read(element.id, "x", timeSec), b.x), y: finite(read(element.id, "y", timeSec), b.y),
      w: finite(read(element.id, "w", timeSec), b.w), h: finite(read(element.id, "h", timeSec), b.h),
      opacity: clamp01(finite(read(element.id, "opacity", timeSec), b.opacity)),
      scale: Math.max(.01, finite(read(element.id, "scale", timeSec), 1)),
      fontSize: Math.max(40, finite(read(element.id, "fontSize", timeSec), b.fontSize)), datumId: b.datumId,
    };
  }
  return states;
}

function checkText(element: FinanceElement, state: GeometryState, plan: ResolvedFinancePlan): CollisionFailure | null {
  const datum = element.datumId ? plan.data.find(item => item.id === element.datumId) : undefined;
  const text = textContent(element, datum?.display);
  if (!text) return null;
  const padding = element.kind === "node" ? 24 : element.kind === "stack-item" ? 26 : element.kind === "metric" ? 20 : 0;
  const inner = estimateTextBounds(element, state, datum?.display);
  if (!inner) return null;
  const outer = transformedBounds(state);
  const right = inner.x + inner.w * state.scale, bottom = inner.y + inner.h * state.scale;
  if (right > outer.x + outer.w - padding + .5 || bottom > outer.y + outer.h - padding + .5 || inner.x < outer.x + padding - .5 || inner.y < outer.y + padding - .5)
    return { code: "TEXT_CONTAINMENT", sequenceId: "", timeSec: 0, elements: [element.id], detail: `text exceeds measured container for ${element.id}` };
  return null;
}

function pairGap(a: GeometryBox, b: GeometryBox): number {
  const gx = axisGap(a.x, a.x + a.w, b.x, b.x + b.w);
  const gy = axisGap(a.y, a.y + a.h, b.y, b.y + b.h);
  return gx === 0 || gy === 0 ? Math.max(gx, gy) : Math.hypot(gx, gy);
}

function pairFailure(sequence: ResolvedSequence, timeSec: number, a: FinanceElement, b: FinanceElement, sa: GeometryState, sb: GeometryState): CollisionFailure | null {
  // A hidden/pre-reveal object is not a readable collision partner.  Its
  // transformed bounds are still checked against the safe frame, so an
  // entrance cannot clip, but pairwise spacing begins once both states are
  // actually visible.
  if (sa.opacity < .25 || sb.opacity < .25) return null;
  if (allowsOverlap(a, b)) return null;
  const ba = transformedBounds(sa), bb = transformedBounds(sb);
  const hit = overlap(ba, bb) > 1;
  const heroPair = isDominantText(a) && isForegroundObject(b) || isDominantText(b) && isForegroundObject(a);
  const metricPair = isMetric(a) !== isMetric(b) && Boolean(a.entityGroup && a.entityGroup === b.entityGroup) && (a.kind === "node" || a.kind === "stack-item" || b.kind === "node" || b.kind === "stack-item");
  const neighborPair = Boolean(a.entityGroup && a.entityGroup === b.entityGroup);
  // Unrelated text/text crossfades are intentional editorial handoffs; only
  // semantic collision pairs have a spacing contract to enforce.
  if (!heroPair && !metricPair && !neighborPair) return null;
  const requiredGap = heroPair ? VISUAL_GAPS.heroForeground : metricPair ? VISUAL_GAPS.retainedMetric : neighborPair ? VISUAL_GAPS.retainedNeighbour : 0;
  if (!hit && requiredGap <= 0) return null;
  const gap = pairGap(ba, bb);
  if (hit || gap < requiredGap) {
    const code: CollisionCode = heroPair ? "HERO_FOREGROUND_OVERLAP" : metricPair ? "RETAINED_METRIC_OVERLAP" : "RETAINED_NEIGHBOUR_OVERLAP";
    return { code, sequenceId: sequence.id, timeSec, elements: [a.id, b.id], detail: hit ? `transformed bounds intersect (${Math.round(overlap(ba, bb))}px²)` : `visual gap ${gap.toFixed(1)}px < required ${requiredGap}px` };
  }
  return null;
}

export function validateFinanceGeometry(plan: ResolvedFinancePlan, options: { sampleStepSec?: number } = {}): VisualCollisionReport {
  const sampleStepSec = options.sampleStepSec ?? .1;
  const samples: TemporalSample[] = [];
  const failures: CollisionFailure[] = [];
  for (const sequence of plan.sequences) {
    for (const point of makeSamples(sequence, sampleStepSec)) {
      const states = buildStates(sequence, plan, point.timeSec);
      samples.push({ sequenceId: sequence.id, timeSec: point.timeSec, phase: point.phase, states });
      for (const element of sequence.elements) {
        const state = states[element.id], box = transformedBounds(state);
        if (box.x < VISUAL_SAFE_FRAME.left || box.y < VISUAL_SAFE_FRAME.top || box.x + box.w > VISUAL_SAFE_FRAME.right || box.y + box.h > VISUAL_SAFE_FRAME.bottom)
          failures.push({ code: "SAFE_FRAME", sequenceId: sequence.id, timeSec: point.timeSec, elements: [element.id], detail: `transformed bounds ${Math.round(box.x)},${Math.round(box.y)},${Math.round(box.w)},${Math.round(box.h)} leave safe frame` });
        if (state.opacity >= .25) {
          const textFailure = checkText(element, state, plan);
          if (textFailure) failures.push({ ...textFailure, sequenceId: sequence.id, timeSec: point.timeSec });
        }
      }
      for (let i = 0; i < sequence.elements.length; i += 1) for (let j = i + 1; j < sequence.elements.length; j += 1) {
        const a = sequence.elements[i], b = sequence.elements[j], failure = pairFailure(sequence, point.timeSec, a, b, states[a.id], states[b.id]);
        if (failure) failures.push(failure);
      }
    }
  }
  const dedup = new Map<string, CollisionFailure>();
  for (const failure of failures) {
    const key = `${failure.code}|${failure.sequenceId}|${failure.elements.join(",")}|${failure.detail}`;
    if (!dedup.has(key)) dedup.set(key, failure);
  }
  return {
    status: dedup.size ? "FAIL" : "PASS",
    strategy: { sampleStepSec, samplePhases: ["entrance", "early-hold", "midpoint", "late-hold", "exit", "event-boundary", "interval"], transformAware: true, fontAware: true, safeFrame: VISUAL_SAFE_FRAME },
    samples, failures: [...dedup.values()],
  };
}

/** Browser-side report adapter: validates actual getBoundingClientRect snapshots. */
export interface BrowserGeometrySnapshot { sequenceId: string; timeSec: number; elements: Array<{ id: string; role: string; kind?: string; entityGroup?: string; opacity: number; rect: GeometryBox; textRect?: GeometryBox; textOverflow?: boolean }>; }
export function validateBrowserSnapshots(snapshots: BrowserGeometrySnapshot[], options: { safeFrame?: typeof VISUAL_SAFE_FRAME } = {}) {
  const safe = options.safeFrame ?? VISUAL_SAFE_FRAME;
  const failures: CollisionFailure[] = [];
  for (const snapshot of snapshots) {
    for (const element of snapshot.elements) {
      const r = element.rect;
      if (r.x < safe.left || r.y < safe.top || r.x + r.w > safe.right || r.y + r.h > safe.bottom) failures.push({ code: "TRANSFORM_CLIPPING", sequenceId: snapshot.sequenceId, timeSec: snapshot.timeSec, elements: [element.id], detail: "browser getBoundingClientRect leaves safe frame" });
      if (element.opacity >= .25 && element.textRect) {
        const t = element.textRect;
        if (t.x < r.x - .5 || t.y < r.y - .5 || t.x + t.w > r.x + r.w + .5 || t.y + t.h > r.y + r.h + .5) failures.push({ code: "TEXT_CONTAINMENT", sequenceId: snapshot.sequenceId, timeSec: snapshot.timeSec, elements: [element.id], detail: "measured text rect exceeds rendered container" });
        if (element.textOverflow) failures.push({ code: "TEXT_CONTAINMENT", sequenceId: snapshot.sequenceId, timeSec: snapshot.timeSec, elements: [element.id], detail: "rendered text scroll area exceeds its container" });
      }
    }
    const visible = snapshot.elements.filter(e => e.opacity >= .25);
    for (let i = 0; i < visible.length; i += 1) for (let j = i + 1; j < visible.length; j += 1) {
      const a = visible[i], b = visible[j];
      const heroPair = a.role === "HERO" && b.kind !== "text" || b.role === "HERO" && a.kind !== "text";
      const metricPair = (a.kind === "metric") !== (b.kind === "metric") && Boolean(a.entityGroup && a.entityGroup === b.entityGroup);
      const neighbourPair = Boolean(a.entityGroup && a.entityGroup === b.entityGroup);
      const captionPair = a.role === "CTA" || b.role === "CTA";
      if (!heroPair && !metricPair && !neighbourPair && !captionPair) continue;
      if (overlap(a.rect, b.rect) > 1) failures.push({ code: heroPair ? "HERO_FOREGROUND_OVERLAP" : metricPair ? "RETAINED_METRIC_OVERLAP" : "CAPTION_FOREGROUND_OVERLAP", sequenceId: snapshot.sequenceId, timeSec: snapshot.timeSec, elements: [a.id, b.id], detail: "visible rendered bounds intersect" });
    }
  }
  return { status: failures.length ? "FAIL" : "PASS", failures };
}
