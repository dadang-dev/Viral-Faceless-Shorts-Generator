import { z } from "zod";
import { ScriptSourceSchema, REQUIRED_EDGE_VOICE, normalizeContractText as norm, assertScriptIntegrity, type WordBoundaryTranscript } from "./content-contract.js";
import type { Script } from "../render/script-schema.js";
import { NumericRelationshipSchema, validateNumericRelationships } from "./numeric-relationships.js";

const Id = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/);
export const SourceSpanSchema = z.object({ sceneId: Id, sourceSpan: z.string().min(1), source: ScriptSourceSchema }).strict();
export type SourceSpan = z.infer<typeof SourceSpanSchema>;
const Copy = SourceSpanSchema.extend({ text: z.string().min(1).max(90) }).strict();
const Units = z.enum(["USD", "USD/month", "apps", "nights/week", "times/week", "count"]);
const commonDatum = { id: Id, display: z.string().min(1), value: z.number().finite().nonnegative(), unit: Units,
  qualifier: z.enum(["exact", "almost", "about", "over", "approx"]).default("exact"), unitSource: SourceSpanSchema.optional() };
export const DatumSchema = z.discriminatedUnion("sourceType", [
  SourceSpanSchema.extend({ ...commonDatum, sourceType: z.literal("script-literal") }).strict(),
  z.object({ ...commonDatum, sourceType: z.literal("approved-derived"), inputs: z.array(Id).min(2),
    formula: z.enum(["sum", "difference", "product"]), sourceSpans: z.array(SourceSpanSchema).min(1),
    approval: z.object({ id: Id, reason: z.string().min(1) }).strict() }).strict(),
]);
export type Datum = z.infer<typeof DatumSchema>;
export const ApprovalSchema = z.object({ id: Id, datumId: Id, inputs: z.array(Id).min(2), formula: z.enum(["sum", "difference", "product"]), output: z.number(), reason: z.string().min(1), approvedBy: z.literal("user") }).strict();
export type DataApproval = z.infer<typeof ApprovalSchema>;
export const ModelSchema = z.enum(["typography", "data-bar", "stacked-cost", "balance-drain", "accumulation-timeline", "comparison-gap", "decision-flow", "process-loop", "metric-reveal"]);
const Box = z.object({ x: z.number().min(70), y: z.number().min(240), w: z.number().min(60), h: z.number().min(30) }).strict();
export const ElementSchema = z.object({
  id: Id, kind: z.enum(["text", "bar", "stack-item", "markers", "node", "metric"]), box: Box,
  copy: Copy.optional(), datumId: Id.optional(), icon: z.enum(["stream", "fitness", "cloud", "app", "coffee", "order", "voice", "habit"]).optional(),
  size: z.enum(["heading", "body", "small"]).default("body"), initial: z.boolean().default(false),
  orientation: z.enum(["horizontal", "vertical"]).default("horizontal"), scaleGroup: Id.optional(),
  connectsTo: Id.optional(), loop: z.boolean().optional(),
  role: z.enum(["HERO", "SECTION_MARKER", "DATA_LABEL", "STRUCTURAL_LABEL", "CTA"]).optional(),
  fontSize: z.number().min(40).max(180).optional(),
  numericTypography: z.boolean().optional(),
  weekSlots: z.literal(7).optional(),
  frequencyMode: z.literal("count-only").optional(),
  retainedMarkerId: Id.optional(),
  entityGroup: Id.optional(),
  semanticState: z.enum(["actual", "mental"]).optional(),
}).strict();
export type FinanceElement = z.infer<typeof ElementSchema>;
export const transitionFor = (relation: string): string => ({
  "new-topic": "crossfade", "same-object": "state-update", accumulation: "push-stack", comparison: "split-expand",
  "major-metric": "stat-punch", progression: "directional-progression",
}[relation] ?? "INVALID_RELATION");
const Relation = z.enum(["new-topic", "same-object", "accumulation", "comparison", "major-metric", "progression"]);
export const MotionEventSchema = z.object({
  id: Id, trigger: SourceSpanSchema, action: z.enum(["reveal", "stack", "grow", "update", "focus", "hide", "draw", "punch", "interrupt"]),
  targets: z.array(Id).min(1), relation: Relation, transition: z.enum(["crossfade", "state-update", "push-stack", "split-expand", "stat-punch", "directional-progression"]),
  toDatumId: Id.optional(), rationale: z.string().min(8),
  revealOpacity: z.number().min(.15).max(1).optional(),
  anchor: z.enum(["start", "end"]).optional(),
  pose: z.object({ box: Box.optional(), opacity: z.number().min(.15).max(1).optional(), fontSize: z.number().min(40).max(180).optional(), route:z.literal("horizontal-first").optional() }).strict().optional(),
}).strict();
export const SequenceSchema = z.object({ id: Id, sceneIds: z.array(Id).min(1), visualModel: ModelSchema,
  semanticRationale: z.string().min(15), minimalismReason: z.string().min(15).optional(),
  entryRelation: z.literal("new-topic"), entryTransition: z.literal("crossfade"),
  elements: z.array(ElementSchema).min(1).max(12), motionEvents: z.array(MotionEventSchema).min(1),
}).strict();
export const FinancePlanSchema = z.object({ version: z.literal("1.2"), day: z.number().int().min(1).max(7),
  source: ScriptSourceSchema, referencePolicy: z.literal("VISUAL_REFERENCE_ONLY"),
  data: z.array(DatumSchema), sequences: z.array(SequenceSchema).min(1),
  relationships: z.array(NumericRelationshipSchema).optional(),
  editorial: z.literal(true).optional(),
}).strict();
export type FinancePlan = z.infer<typeof FinancePlanSchema>;
type Sequence = FinancePlan["sequences"][number];
export type ResolvedEvent = Sequence["motionEvents"][number] & { atSec: number; endSec: number; timingSource: "transcript.json" };
export type ResolvedSequence = Omit<Sequence, "motionEvents"> & { startSec: number; endSec: number; motionEvents: ResolvedEvent[] };
export interface ResolvedFinancePlan { version: "1.2"; day: number; data: Datum[]; sequences: ResolvedSequence[]; provenance: unknown[]; editorial?: true }
export interface Gate { status: "PASS" | "WARNING" | "FAIL"; errors: string[]; warnings: string[]; evidence?: unknown }

export const DOMINANT_FOREGROUND_HANDOFF = {
  crossfadeSec: .18,
  outgoingFadeSec: .06,
  cleanGapSec: .02,
  incomingFadeSec: .10,
  readableOpacityThreshold: .25,
} as const;

export function sequenceHasDominantForeground(sequence: Pick<ResolvedSequence, "elements">): boolean {
  return sequence.elements.some(element =>
    ["HERO", "SECTION_MARKER", "CTA"].includes(element.role ?? "") ||
    ["stack-item", "markers", "metric", "bar"].includes(element.kind)
  );
}

export function assessDominantForegroundHandoff(plan: ResolvedFinancePlan): Gate {
  const evidence = [];
  for (let index = 1; index < plan.sequences.length; index += 1) {
    const outgoing = plan.sequences[index - 1], incoming = plan.sequences[index];
    if (!sequenceHasDominantForeground(outgoing) || !sequenceHasDominantForeground(incoming)) continue;
    const profile = DOMINANT_FOREGROUND_HANDOFF;
    const outgoingReadableUntil = incoming.startSec + profile.outgoingFadeSec * (1 - profile.readableOpacityThreshold);
    const incomingReadableFrom = incoming.startSec + profile.outgoingFadeSec + profile.cleanGapSec + profile.incomingFadeSec * profile.readableOpacityThreshold;
    const overlapSec = Math.max(0, outgoingReadableUntil - incomingReadableFrom);
    evidence.push({
      timeSec: incoming.startSec,
      outgoing: outgoing.id,
      incoming: incoming.id,
      maxSemanticOverlapSec: overlapSec,
      profile,
      result: overlapSec === 0 ? "PASS" : "FAIL",
    });
  }
  const failures = evidence.filter(item => item.result === "FAIL");
  return {status: failures.length ? "FAIL" : "PASS", errors: failures.map(item => `DOMINANT_LAYER_COLLISION: ${item.outgoing} -> ${item.incoming}`), warnings: [], evidence};
}

export function resolvePhrase(ref: SourceSpan, transcript: WordBoundaryTranscript) {
  const scene = transcript.scenes.find(s => s.id === ref.sceneId);
  if (!scene) throw new Error(`MOTION_TIMING: missing scene ${ref.sceneId}`);
  const tokens = scene.words.flatMap(word => norm(word.text).split(" ").filter(Boolean).map(token => ({ token, word })));
  const phrase = norm(ref.sourceSpan).split(" ").filter(Boolean);
  const hits = tokens.map((_, i) => i).filter(i => phrase.length && phrase.every((t, j) => tokens[i + j]?.token === t));
  if (hits.length !== 1) throw new Error(`MOTION_TIMING: ${ref.sceneId} "${ref.sourceSpan}" resolved ${hits.length} times`);
  const first = tokens[hits[0]].word, last = tokens[hits[0] + phrase.length - 1].word;
  return { atSec: first.globalStartMs / 1000, endSec: last.globalEndMs / 1000, timingSource: "transcript.json" as const };
}

const small: Record<string, number> = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
/** Deliberately limited literal parser. Unsupported notation FAILS, never guesses. */
export function literalNumbers(text: string): number[] {
  const results: number[] = []; let n: number | undefined;
  const tokens = [...norm(text).split(" "), "END"];
  for (const [i, t] of tokens.entries()) {
    if (Object.hasOwn(small, t)) n = (n ?? 0) + small[t];
    else if (t === "a" && tokens[i + 1] === "hundred") n = 1;
    else if (t === "and" && n !== undefined && n >= 100 && Object.hasOwn(small, tokens[i + 1])) continue;
    else if (t === "hundred" && n !== undefined) n *= 100;
    else { if (n !== undefined) { results.push(n); n = undefined; } if (/^\d+$/.test(t)) results.push(Number(t)); }
  }
  return results;
}
export function datumDisplay(d: Pick<Datum, "value" | "unit" | "qualifier">): string {
  const prefix = ({exact:"", almost:"ALMOST ", about:"ABOUT ", over:"OVER ", approx:"~"})[d.qualifier];
  const value = String(d.value);
  return prefix + ({ USD: `$${value}`, "USD/month": `$${value} / MONTH`, apps: `${value} APPS`, "nights/week": `${value} NIGHTS A WEEK`, "times/week": `${value} TIMES A WEEK`, count: value }[d.unit]);
}

function checkSpan(ref: SourceSpan, script: Script): void {
  const text = script.scenes.find(s => s.id === ref.sceneId)?.voiceText;
  if (!ScriptSourceSchema.safeParse(ref.source).success || !text || !(` ${norm(text)} `).includes(` ${norm(ref.sourceSpan)} `))
    throw new Error(`REFERENCE_FIREWALL: span is not from approved scene ${ref.sceneId}: ${ref.sourceSpan}`);
}
function checkDatum(d: Datum, all: Datum[], script: Script, approvals: DataApproval[]) {
  if (d.display !== datumDisplay(d)) throw new Error(`DATA_PROVENANCE: display/value/unit mismatch ${d.id}`);
  if (d.sourceType === "script-literal") {
    checkSpan(d, script);
    const numbers = literalNumbers(d.sourceSpan);
    if (numbers.length !== 1 || numbers[0] !== d.value) throw new Error(`DATA_PROVENANCE: invented or ambiguous value ${d.id}`);
    const qualifier = /\balmost\b/i.test(d.sourceSpan) ? "almost" : /\babout\b/i.test(d.sourceSpan) ? "about" : /\bover\b/i.test(d.sourceSpan) ? "over" : /\blike\b/i.test(d.sourceSpan) ? "approx" : "exact";
    if (qualifier !== d.qualifier) throw new Error(`DATA_PROVENANCE: qualifier changed ${d.id}`);
    if (d.unitSource) checkSpan(d.unitSource, script);
    const context = norm(`${d.sourceSpan} ${d.unitSource?.sourceSpan ?? ""}`);
    const unitOk = { USD: /dollar|bucks/.test(context), "USD/month": /dollar/.test(context) && /month/.test(context),
      apps: /apps/.test(context), "nights/week": /nights a week/.test(context), "times/week": /times a week/.test(context), count: true }[d.unit];
    if (!unitOk) throw new Error(`DATA_PROVENANCE: unsupported unit ${d.id}`);
  } else {
    const a = approvals.find(a => a.id === d.approval.id && a.datumId === d.id);
    if (!a || a.reason !== d.approval.reason || a.output !== d.value || a.formula !== d.formula || JSON.stringify(a.inputs) !== JSON.stringify(d.inputs))
      throw new Error(`DERIVED_DATA_APPROVAL_REQUIRED: ${d.id}`);
    d.sourceSpans.forEach(ref => checkSpan(ref, script));
    const inputs = d.inputs.map(id => all.find(v => v.id === id));
    if (inputs.some(v => !v || v.sourceType !== "script-literal" || v.qualifier !== "exact")) throw new Error(`DATA_PROVENANCE: derivation inputs must be exact script literals ${d.id}`);
    const values = inputs.map(v => v!.value);
    const computed = d.formula === "sum" ? values.reduce((a, b) => a + b) : d.formula === "product" ? values.reduce((a, b) => a * b) : values.slice(1).reduce((a, b) => a - b, values[0]);
    if (computed !== d.value) throw new Error(`DATA_PROVENANCE: approved formula/output mismatch ${d.id}`);
  }
}

export function compileFinancePlan(input: unknown, script: Script, transcript: WordBoundaryTranscript, approvedVoice: string, approvals: DataApproval[] = []): ResolvedFinancePlan {
  const plan = FinancePlanSchema.parse(input);
  assertScriptIntegrity(script, approvedVoice);
  if (transcript.provider !== "edge-tts" || transcript.boundarySource !== "WordBoundary" || transcript.voiceId !== REQUIRED_EDGE_VOICE || transcript.sourceScript !== plan.source)
    throw new Error("TRANSCRIPT: finance motion requires approved Edge WordBoundary");
  const spans = [...plan.data.flatMap(d => d.sourceType === "script-literal" ? [d, ...(d.unitSource ? [d.unitSource] : [])] : d.sourceSpans), ...plan.sequences.flatMap(s => [...s.elements.flatMap(e => e.copy ? [e.copy] : []), ...s.motionEvents.map(e => e.trigger)])];
  if (spans.some(ref => ref.source !== plan.source)) throw new Error("SOURCE_REVISION: mixed historical/canonical provenance");
  for (const s of script.scenes) {
    const t = transcript.scenes.find(t => t.id === s.id);
    if (!t || norm(t.words.map(w => w.text).join(" ")) !== norm(s.voiceText)) throw new Error(`TRANSCRIPT_INTEGRITY: ${s.id}`);
  }
  const unique = (ids: string[], type: string) => { if (new Set(ids).size !== ids.length) throw new Error(`FINANCE_SCHEMA: duplicate ${type}`); };
  unique(plan.data.map(d => d.id), "datum"); unique(plan.sequences.map(s => s.id), "sequence");
  plan.data.forEach(d => checkDatum(d, plan.data, script, approvals.map(a => ApprovalSchema.parse(a))));
  validateNumericRelationships(plan.data, plan.relationships ?? []);
  if (plan.source === "money-habits-script-v2.1-verified.md" && plan.day === 1) {
    const monthly = plan.data.filter(d => d.unit === "USD/month");
    if (monthly.length !== 2 || monthly.some(d => !plan.relationships?.some(r => r.resultId === d.id))) throw new Error("NUMERIC_RELATIONSHIP_INTEGRITY: corrected Day 1 requires both monthly relationships");
  }
  const used = new Set<string>();
  const sequences = plan.sequences.map(s => {
    unique(s.elements.map(e => e.id), "element"); unique(s.motionEvents.map(e => e.id), "event");
    const transcriptLinkedSectionEntry = Boolean(plan.editorial && s.elements.some(e => e.role === "SECTION_MARKER") && s.motionEvents.some(event =>
      event.action === "reveal" && event.targets.some(id => s.elements.some(e => e.id === id && e.role === "SECTION_MARKER"))
    ));
    if (!s.elements.some(e => e.initial && !e.datumId) && !transcriptLinkedSectionEntry) throw new Error(`MODEL_ENTRY_EMPTY: ${s.id} needs a readable non-numeric entry state`);
    if (!plan.editorial && s.sceneIds.some(id => script.scenes.find(scene => scene.id === id)?.type === "outro")) throw new Error("LOCKED_OUTRO: finance sequences must preserve the shared profile outro");
    const indexes = s.sceneIds.map(id => script.scenes.findIndex(s => s.id === id));
    if (indexes.some((n, i) => n < 0 || (i > 0 && n !== indexes[i - 1] + 1))) throw new Error(`FINANCE_SCHEMA: non-contiguous sequence ${s.id}`);
    s.sceneIds.forEach(id => { if (used.has(id)) throw new Error(`FINANCE_SCHEMA: overlapping sequence ${id}`); used.add(id); });
    const timed = s.sceneIds.map(id => transcript.scenes.find(s => s.id === id)!);
    const startSec = Math.max(0, timed[0].startMs / 1000 - .18);
    const endSec = (timed.at(-1)!.startMs + timed.at(-1)!.durationMs) / 1000 + .2;
    for (const e of s.elements) {
      if (e.box.x + e.box.w > 1010 || e.box.y + e.box.h > 1340) throw new Error(`MOBILE_SAFE_AREA: ${s.id}.${e.id}`);
      if (e.weekSlots && (e.kind !== "markers" || !["nights/week","times/week"].includes(plan.data.find(d=>d.id===e.datumId)?.unit ?? ""))) throw new Error(`VISUAL_MODEL_VALIDITY: week requires frequency ${e.id}`);
      if (e.weekSlots && e.frequencyMode !== "count-only") throw new Error(`TEMPORAL_SPECIFICITY_INTEGRITY: ${s.id}.${e.id} must be count-only`);
      if (e.frequencyMode && !e.weekSlots) throw new Error(`TEMPORAL_SPECIFICITY_INTEGRITY: count-only mode requires seven neutral positions ${s.id}.${e.id}`);
      if(e.retainedMarkerId && (!e.weekSlots || !s.elements.some(n=>n.id===e.retainedMarkerId && n.kind==="node" && n.icon===e.icon))) throw new Error(`QUANTITY_AMBIGUITY: retained marker must be the same existing object ${e.id}`);
      if (e.numericTypography && (!e.copy || !/\bthree habits\b/i.test(e.copy.text))) throw new Error(`NO_UNAPPROVED_COPY: numeric typography only supports source-exact three habits ${e.id}`);
      if (e.copy) { checkSpan(e.copy, script); if (norm(e.copy.text) !== norm(e.copy.sourceSpan)) throw new Error(`NO_UNAPPROVED_COPY: ${e.id}`); }
      const needsDatum = ["bar", "stack-item", "markers", "metric"].includes(e.kind);
      const d = plan.data.find(d => d.id === e.datumId);
      if (needsDatum && !d) throw new Error(`MISSING_PROVENANCE: ${s.id}.${e.id}`);
      if (d && e.initial) throw new Error(`EARLY_NUMERIC_STATE: ${e.id}`);
      if (e.kind === "bar" && (!e.scaleGroup || d?.qualifier !== "exact")) throw new Error(`MISLEADING_SCALE: bars require an exact datum and common scale group ${e.id}`);
      if (e.kind === "markers" && (!d || d.value > 5 || !Number.isInteger(d.value) || !["apps", "count", "nights/week", "times/week"].includes(d.unit))) throw new Error(`MOBILE_LEGIBILITY: marker count/unit ${e.id}`);
      if (e.connectsTo && !s.elements.some(p => p.id === e.connectsTo && p.kind === "node")) throw new Error(`MODEL_NOT_COMMUNICATED: missing node ${e.id}`);
      if (!e.copy && !d && e.kind !== "node") throw new Error(`NO_UNAPPROVED_COPY: empty element ${e.id}`);
    }
    for (const group of new Set(s.elements.filter(e => e.kind === "bar").map(e => e.scaleGroup))) {
      const bars = s.elements.filter(e => e.kind === "bar" && e.scaleGroup === group);
      const units = new Set(bars.map(e => plan.data.find(d => d.id === e.datumId)!.unit));
      const orientations = new Set(bars.map(e => e.orientation));
      const lengths = new Set(bars.map(e => e.orientation === "horizontal" ? e.box.w : e.box.h));
      if (units.size !== 1 || orientations.size !== 1 || lengths.size !== 1) throw new Error(`MISLEADING_SCALE: inconsistent group ${group}`);
    }
    const mental = s.elements.filter(e => e.semanticState === "mental");
    for (const perceived of mental) {
      const datum = plan.data.find(d => d.id === perceived.datumId);
      const actual = s.elements.find(e => e.semanticState === "actual" && plan.data.find(d => d.id === e.datumId)?.unit === datum?.unit);
      if (!datum || datum.qualifier !== "approx" || !actual || actual.id === perceived.id)
        throw new Error(`ACTUAL_VS_MENTAL_INTEGRITY: ${s.id}.${perceived.id} needs a separate actual state`);
      if (s.motionEvents.some(event => event.action === "update" && event.targets.includes(actual.id) && event.toDatumId === perceived.datumId))
        throw new Error(`ACTUAL_VS_MENTAL_INTEGRITY: mental value cannot replace actual value ${s.id}.${actual.id}`);
    }
    const motionEvents = s.motionEvents.map(e => {
      checkSpan(e.trigger, script);
      if (!s.sceneIds.includes(e.trigger.sceneId)) throw new Error(`MOTION_TIMING: trigger outside sequence ${e.id}`);
      if (transitionFor(e.relation) !== e.transition) throw new Error(`MOTION_SEMANTICS: transition/relation mismatch ${e.id}`);
      const phraseTiming = resolvePhrase(e.trigger, transcript);
      const at = {...phraseTiming,atSec:e.anchor==="end"?phraseTiming.endSec:phraseTiming.atSec};
      if (e.pose && e.action !== "focus") throw new Error(`MOTION_SEMANTICS: pose must focus an existing object ${e.id}`);
      if(e.revealOpacity !== undefined && e.action!=="reveal") throw new Error(`MOTION_SEMANTICS: reveal opacity only applies to reveal ${e.id}`);
      if(e.pose?.box && (e.pose.box.x+e.pose.box.w>1010 || e.pose.box.y+e.pose.box.h>1340)) throw new Error(`MOBILE_SAFE_AREA: pose ${e.id}`);
      for (const id of e.targets) if (!s.elements.some(el => el.id === id)) throw new Error(`MODEL_NOT_COMMUNICATED: missing event target ${id}`);
      if (e.action === "update" && (!e.toDatumId || !plan.data.some(d => d.id === e.toDatumId))) throw new Error(`MISSING_PROVENANCE: update ${e.id}`);
      const allowedActions: Record<string, string[]> = { "new-topic": ["reveal", "hide"], "same-object": ["update", "focus", "hide", "interrupt"], accumulation: ["stack", "reveal", "hide"], comparison: ["grow", "reveal", "hide"], "major-metric": ["reveal", "punch", "hide"], progression: ["reveal", "draw", "focus", "hide", "interrupt"] };
      if (!allowedActions[e.relation].includes(e.action)) throw new Error(`MOTION_SEMANTICS: action/relation mismatch ${e.id}`);
      if (e.action === "update") for (const id of e.targets) {
        const el = s.elements.find(el => el.id === id)!;
        const from = plan.data.find(d => d.id === el.datumId), to = plan.data.find(d => d.id === e.toDatumId)!;
        if (!["bar", "metric"].includes(el.kind) || !from || from.unit !== to.unit || (el.kind === "bar" && (from.qualifier !== "exact" || to.qualifier !== "exact"))) throw new Error(`MISLEADING_STATE_UPDATE: ${id}`);
      }
      return { ...e, ...at };
    }).sort((a, b) => a.atSec - b.atSec);
    // Validate discrete state, not just the presence of an animation declaration.
    const active = new Set(s.elements.filter(e => e.initial).map(e => e.id));
    const currentDatum = new Map(s.elements.map(e => [e.id, e.datumId]));
    for (const e of motionEvents) {
      for (const id of e.targets) {
        const el = s.elements.find(el => el.id === id)!;
        if (["focus", "punch", "update", "interrupt", "hide"].includes(e.action) && !active.has(id)) throw new Error(`STATE_SEQUENCE: ${e.action} before reveal ${id}`);
        if (e.action === "update") {
          const from = plan.data.find(d => d.id === currentDatum.get(id))!;
          const to = plan.data.find(d => d.id === e.toDatumId)!;
          if (s.visualModel === "balance-drain" && to.value >= from.value) throw new Error(`MISLEADING_BALANCE_DRAIN: ${id}`);
          currentDatum.set(id, e.toDatumId);
        }
        if (["reveal", "grow", "stack", "draw"].includes(e.action)) { if (active.has(id)) throw new Error(`STATE_SEQUENCE: duplicate reveal ${id}`); active.add(id); }
        if (e.action === "hide") active.delete(id);
        if (e.action === "grow" && el.kind !== "bar") throw new Error(`MODEL_NOT_COMMUNICATED: grow target is not a bar ${id}`);
        if (e.action === "stack" && el.kind !== "stack-item") throw new Error(`MODEL_NOT_COMMUNICATED: stack target is not an item ${id}`);
        const d = plan.data.find(d => d.id === (e.toDatumId ?? el.datumId));
        if (d?.sourceType === "script-literal" && !["focus", "hide", "interrupt"].includes(e.action) && e.atSec + .001 < resolvePhrase(d, transcript).atSec)
          throw new Error(`EARLY_NUMERIC_STATE: ${id}`);
      }
    }
    for (const e of s.elements) if (!e.initial && !motionEvents.some(m => m.targets.includes(e.id) && ["reveal", "grow", "stack", "draw"].includes(m.action))) throw new Error(`MODEL_NOT_COMMUNICATED: never revealed ${e.id}`);
    return { ...s, startSec, endSec, motionEvents };
  });
  return { version: "1.2", day: plan.day, data: plan.data, sequences, ...(plan.editorial ? {editorial:true as const} : {}),
    provenance: plan.data.map(d => ({ ...d, transcriptTiming: d.sourceType === "script-literal" ? resolvePhrase(d, transcript) : "approved-derived: reveal event timing" })) };
}

export function assessFinanceDataViz(input: unknown, script: Script, transcript: WordBoundaryTranscript, approved: string, approvals: DataApproval[] = []): Gate {
  try { const p = compileFinancePlan(input, script, transcript, approved, approvals); return { status: "PASS", errors: [], warnings: [], evidence: { provenance: p.provenance, referenceFirewall: "approved source allowlist, no reference reader", mobileBounds: "x 70–1010; y 240–1340; max 5 markers; minimum copy 40px", scale: "zero baseline; exact same-unit values only; shared extent" } }; }
  catch (error) { return { status: "FAIL", errors: [String(error)], warnings: [] }; }
}
export function assessMotionSemantics(plan: ResolvedFinancePlan): Gate {
  const errors: string[] = [], warnings: string[] = [];
  const evidence = plan.sequences.map(s => {
    const events = s.motionEvents.filter(e => e.action !== "hide");
    const times = [s.startSec, ...new Set(events.map(e => e.atSec)), s.endSec];
    const maxHoldSec = Math.max(...times.slice(1).map((t, i) => t - times[i]));
    const multipleBeats = s.sceneIds.length > 1 || s.endSec - s.startSec > 5;
    if (multipleBeats && events.length < 2 && !s.minimalismReason) errors.push(`FUNCTIONALLY_STATIC: ${s.id}`);
    if (maxHoldSec > 5 && !s.minimalismReason) warnings.push(`LOW_MOTION_DENSITY: ${s.id} ${maxHoldSec.toFixed(2)}s`);
    if (s.visualModel === "typography" && multipleBeats && !s.minimalismReason) warnings.push(`TYPOGRAPHY_JUSTIFICATION: ${s.id}`);
    const required: Partial<Record<Sequence["visualModel"], string>> = { "data-bar": "bar", "balance-drain": "bar", "comparison-gap": "bar", "stacked-cost": "stack-item", "accumulation-timeline": "markers", "decision-flow": "node", "process-loop": "node", "metric-reveal": "metric" };
    if (required[s.visualModel] && !s.elements.some(e => e.kind === required[s.visualModel])) errors.push(`MODEL_NOT_COMMUNICATED: ${s.id}`);
    return { id: s.id, model: s.visualModel, eventCount: events.length, maxHoldSec, intentionalMinimalism: s.minimalismReason ?? null };
  });
  const eventTransitions = plan.sequences.flatMap(s => s.motionEvents.filter(e => e.action !== "hide").map(e => e.transition));
  if (eventTransitions.length > 5 && new Set(eventTransitions).size === 1) warnings.push("TRANSITION_OVERUSE: review semantic justification");
  return { status: errors.length ? "FAIL" : warnings.length ? "WARNING" : "PASS", errors, warnings, evidence };
}

/** Feed v1.2 changes back into the retained v1.1 audio-slice hold heuristic. */
export function financeVisualCues(plan: ResolvedFinancePlan, transcript: WordBoundaryTranscript) {
  return plan.sequences.flatMap(s => s.motionEvents.filter(e => e.action !== "hide").map(e => ({
    sceneId:e.trigger.sceneId, target:`${s.id}.${e.targets.join("+")}`, spokenPhrase:e.trigger.sourceSpan,
    globalStartSec:e.atSec, startSec:e.atSec - transcript.scenes.find(s => s.id === e.trigger.sceneId)!.startMs / 1000,
  })));
}

/** number_highlights remains the primary emphasis contract on every v1.2 path. */
export function assertFinanceHighlights(plan: ResolvedFinancePlan, highlights: Array<{id:string;displayText:string;sceneId:string;globalStartSec:number}>) {
  for (const h of highlights) {
    const d = plan.data.find(d => d.display === h.displayText && d.sourceType === "script-literal" && d.sceneId === h.sceneId);
    if (!d) throw new Error(`NUMBER_HIGHLIGHTS: no plotted datum for ${h.id}`);
    if (!plan.sequences.some(s => s.motionEvents.some(e => ["reveal","grow","stack","update"].includes(e.action)
      && Math.abs(e.atSec - h.globalStartSec) < .001
      && e.targets.some(id => (e.toDatumId ?? s.elements.find(el => el.id === id)?.datumId) === d.id))))
      throw new Error(`NUMBER_HIGHLIGHTS: missing synchronized event ${h.id}`);
  }
}
