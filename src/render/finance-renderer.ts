import { DOMINANT_FOREGROUND_HANDOFF, sequenceHasDominantForeground, type FinanceElement, type ResolvedFinancePlan, type ResolvedSequence, type Datum } from "../contracts/finance-motion.js";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const paths = {
  stream: '<rect x="12" y="20" width="76" height="60" rx="10"/><path d="M43 36l24 14-24 14z"/>',
  fitness: '<path d="M12 43v14M22 32v36M78 32v36M88 43v14M22 50h56"/>',
  cloud: '<path d="M25 72h49a15 15 0 0 0 2-30 25 25 0 0 0-47-5A18 18 0 0 0 25 72z"/>',
  app: '<rect x="18" y="18" width="64" height="64" rx="14"/><path d="M35 38h30M35 51h30M35 64h18"/>',
  coffee: '<path d="M28 34h44l-6 50H34zM24 34h52M31 24h38M57 24l7-14"/>',
  order: '<path d="M23 40h54l-6 44H29zM36 40V28a14 14 0 0 1 28 0v12"/>',
  voice: '<rect x="40" y="12" width="20" height="48" rx="10"/><path d="M28 46v5a22 22 0 0 0 44 0v-5M50 74v14M37 88h26"/>',
  habit: '<path d="M23 36a30 30 0 0 1 54 0M77 36V19M77 36H60M77 64a30 30 0 0 1-54 0M23 64v17M23 64h17"/>',
};
function icon(key: FinanceElement["icon"] = "app") { return `<svg class="fm-icon" viewBox="0 0 100 100" aria-hidden="true">${paths[key]}</svg>`; }
function renderElement(e: FinanceElement, s: ResolvedSequence, plan: ResolvedFinancePlan): string {
  const d = plan.data.find(d => d.id === e.datumId);
  const label = e.copy ? `<div class="fm-copy"${e.fontSize ? ` style="font-size:${e.fontSize}px"` : ""}>${esc(e.numericTypography ? e.copy.text.replace(/three habits/i,"3 HABITS") : e.copy.text)}</div>` : "";
  const display = (datum: Datum) => `<div class="fm-number${datum.display.length > 12 ? " fm-number-long" : ""}" data-datum-id="${datum.id}">${esc(datum.display)}</div>`;
  let inner: string;
  let scale = 1;
  if (e.kind === "bar") {
    const ids = s.elements.filter(el => el.scaleGroup === e.scaleGroup).map(el => el.datumId);
    const updateIds = s.motionEvents.filter(ev => ev.action === "update" && ev.targets.some(id => s.elements.find(el => el.id === id)?.scaleGroup === e.scaleGroup)).map(ev => ev.toDatumId);
    const max = Math.max(...plan.data.filter(v => [...ids, ...updateIds].includes(v.id)).map(v => v.value));
    scale = max > 0 ? d!.value / max : 0;
    const variants = [d!, ...plan.data.filter(v => updateIds.includes(v.id))];
    inner = `${label}${variants.map((v,i) => `<div class="fm-bar-step" data-step="${v.id}" style="opacity:${i === 0 ? 1 : 0}">${display(v)}</div>`).join("")}<div class="fm-baseline"></div><div class="fm-bar-track"><div class="fm-bar-fill" data-ratios="${esc(JSON.stringify(Object.fromEntries(variants.map(v => [v.id, max > 0 ? v.value / max : 0]))))}" data-ratio="${scale}"></div></div>`;
  } else if (e.kind === "stack-item") {
    inner = `${icon(e.icon)}<div class="fm-item-copy">${label}${display(d!)}</div><div class="fm-item-rule"></div>`;
  } else if (e.kind === "markers") {
    const count = e.weekSlots ?? d!.value;
    const active = e.frequencyMode === "count-only" && e.weekSlots
      ? (d!.value === 4 ? [0, 2, 4, 6] : d!.value === 3 ? [0, 3, 6] : Array.from({length:d!.value},(_,i)=>i))
      : Array.from({length:d!.value},(_,i)=>i);
    inner = `<div class="fm-marker-track${e.weekSlots ? " fm-frequency-count" : ""}" data-frequency-mode="${e.frequencyMode ?? "ordinal"}">${Array.from({ length: count }, (_,i) => {
      const isActive=active.includes(i), retained=isActive && i===active[0] && Boolean(e.retainedMarkerId);
      return `<div class="fm-marker${isActive ? " fm-active-marker" : " fm-inactive-marker"}${retained ? " fm-retained-slot" : ""}">${isActive && !retained ? icon(e.icon) : ""}</div>`;
    }).join("")}</div>${display(d!)}${label}`;
  } else if (e.kind === "node") {
    inner = `${e.icon ? icon(e.icon) : ""}${label}<div class="fm-focus-ring"></div>`;
  } else if (e.kind === "metric") {
    const variants = [d!, ...s.motionEvents.filter(ev => ev.action === "update" && ev.targets.includes(e.id)).map(ev => plan.data.find(d => d.id === ev.toDatumId)!)];
    inner = `${e.icon ? icon(e.icon) : ""}${variants.map((v, i) => `<div class="fm-metric-step" data-step="${v.id}" style="opacity:${i === 0 ? 1 : 0}">${display(v)}</div>`).join("")}${label}`;
  } else inner = label;
  const b = e.box;
  return `<div class="fm-element fm-${e.kind} fm-${e.size} fm-${e.orientation}${e.semanticState ? ` fm-state-${e.semanticState}` : ""}" id="fm-${s.id}-${e.id}" data-role="${e.role ?? ""}" data-semantic-state="${e.semanticState ?? ""}" data-element-id="${e.id}" data-initial="${e.initial}" data-ratio="${scale}" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;opacity:${e.initial ? 1 : 0}">${inner}</div>`;
}

export function renderFinanceSequence(s: ResolvedSequence, plan: ResolvedFinancePlan): string {
  const links = s.elements.filter(e => e.connectsTo).map(e => {
    const next = s.elements.find(n => n.id === e.connectsTo)!;
    const x = e.box.x + e.box.w / 2, y = e.box.y + e.box.h;
    const nx = next.box.x + next.box.w / 2, ny = next.box.y;
    const h = Math.hypot(nx - x, ny - y), rotation = -Math.atan2(nx - x, ny - y) * 180 / Math.PI;
    return `<div class="fm-link" data-from="${e.id}" data-to="${next.id}" style="left:${x}px;top:${y}px;height:${h}px;transform:rotate(${rotation}deg);opacity:0"><div class="fm-link-draw"></div></div>`;
  }).join("") + s.elements.filter(e => e.loop).map(e => {
    const first = s.elements.find(n => n.kind === "node")!;
    const top = first.box.y + first.box.h / 2;
    const height = e.box.y + e.box.h / 2 - top;
    if (height <= 0) throw new Error("MODEL_NOT_COMMUNICATED: loop needs an earlier node");
    return `<div class="fm-link fm-loop-return" data-from="${e.id}" data-to="${e.id}" style="left:${e.box.x - 65}px;top:${top}px;width:65px;height:${height}px;opacity:0"><svg class="fm-link-draw" viewBox="0 0 65 ${height}" preserveAspectRatio="none"><path d="M65 ${height} H20 Q0 ${height} 0 ${height-20} V20 Q0 0 20 0 H65" fill="none" stroke="var(--accent-gold)" stroke-width="3"/></svg></div>`;
  }).join("");
  const dominant=Boolean(plan.editorial && sequenceHasDominantForeground(s));
  const handoff=dominant ? ` data-dominant-foreground="true" data-handoff-out-sec="${DOMINANT_FOREGROUND_HANDOFF.outgoingFadeSec}" data-handoff-gap-sec="${DOMINANT_FOREGROUND_HANDOFF.cleanGapSec}" data-handoff-in-sec="${DOMINANT_FOREGROUND_HANDOFF.incomingFadeSec}"` : "";
  return `<div class="scene clip fm-sequence" id="finance-${s.id}"${plan.editorial && s.startSec===0 ? ' style="opacity:1"' : ""} data-editorial="${Boolean(plan.editorial)}"${handoff} data-layout="finance" data-start="${s.startSec.toFixed(3)}" data-duration="${(s.endSec - s.startSec).toFixed(3)}" data-model="${s.visualModel}" data-finance-events="${esc(JSON.stringify(s.motionEvents))}">${links}${s.elements.map(e => renderElement(e, s, plan)).join("")}</div>`;
}
