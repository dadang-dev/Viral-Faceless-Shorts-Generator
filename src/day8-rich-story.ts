import { APPROVED_SCRIPT_FILE } from "./contracts/content-contract.js";
import { FinancePlanSchema, type FinanceElement, type FinancePlan, type ResolvedFinancePlan } from "./contracts/finance-motion.js";

const layout = {
  "purchase-to-schedule": { x: 290, y: 510, w: 500, h: 250 },
  "read-the-obligation": { x: 140, y: 570, w: 800, h: 470 },
  "final-checkout-decision": { x: 140, y: 590, w: 800, h: 470 },
} as const;
type Sequence = FinancePlan["sequences"][number];

function stage(bounds: { x: number; y: number; w: number; h: number }): FinanceElement {
  return { id: "stage", kind: "node", box: bounds, initial: true, size: "body", orientation: "horizontal" };
}
function addStoryEvent(sequence: Sequence, id: string, scene: number, phrase: string) {
  if (sequence.motionEvents.some(event => event.id === id)) throw new Error(`DAY8_DUPLICATE_EVENT: ${id}`);
  sequence.motionEvents.push({ id, trigger: { source: APPROVED_SCRIPT_FILE, sceneId: `scene-${scene}`, sourceSpan: phrase }, action: "focus", targets: ["stage"], relation: "same-object", transition: "state-update", rationale: `The Day 8 illustration advances at the approved spoken phrase ${phrase}.` });
}
function retarget(sequence: Sequence, id: string) {
  const event = sequence.motionEvents.find(item => item.id === id);
  if (!event) throw new Error(`DAY8_EVENT_MISSING: ${id}`);
  event.targets = ["stage"];
  event.action = "focus";
  event.relation = "same-object";
  event.transition = "state-update";
}

/** Episode-local pictorial progression; narration, numerical values and shared runtime stay unchanged. */
export function day8RichStoryPlan(input: FinancePlan): FinancePlan {
  const plan = FinancePlanSchema.parse(structuredClone(input));
  if (plan.day !== 8 || plan.sequences.length !== 3) throw new Error("DAY8_STORY_SCOPE");
  const [schedule, obligation, checkout] = plan.sequences;
  if (schedule.id !== "purchase-to-schedule" || obligation.id !== "read-the-obligation" || checkout.id !== "final-checkout-decision") throw new Error("DAY8_STORY_SEQUENCE_MISMATCH");
  for (const sequence of plan.sequences) sequence.motionEvents = sequence.motionEvents.filter(event => !event.id.startsWith("art-"));

  schedule.elements = [stage(layout[schedule.id]), ...schedule.elements.filter(item => item.kind === "text" || item.kind === "markers")];
  for (const [id, scene, phrase] of [
    ["art-button", 1, "button"], ["art-purchase", 1, "a purchase"],
    ["art-smaller", 1, "feel smaller"], ["art-not-cheaper", 1, "without making it cheaper"],
    ["art-today", 1, "today’s payment"], ["art-next-three", 1, "next three"],
    ["art-another-purchase", 2, "another purchase"], ["art-pile-up", 2, "due dates can pile up"],
  ] as const) addStoryEvent(schedule, id, scene, phrase);
  schedule.semanticRationale = "A checkout phone visibly creates today's payment, the next three and then a second purchase; four source-supported payment markers stay on the same schedule as rent and phone bills.";

  obligation.elements = [stage(layout[obligation.id]), ...obligation.elements.filter(item => item.kind === "text")];
  retarget(obligation, "review-purchase");
  retarget(obligation, "open-schedule");
  for (const [id, scene, phrase] of [
    ["art-bnpl", 3, "buy now, pay later"],
    ["art-whole", 3, "whole obligation"], ["art-before-agree", 3, "before you agree to it"],
    ["art-open-schedule", 4, "payment schedule"], ["art-paycheck", 4, "before your next paycheck"],
  ] as const) addStoryEvent(obligation, id, scene, phrase);
  obligation.semanticRationale = "One calendar reveals the full four-part obligation before the checkout decision; a separate undated paycheck boundary makes the action of checking timing visible without inventing dates or amounts.";

  checkout.elements = [stage(layout[checkout.id]), ...checkout.elements.filter(item => item.kind === "text")];
  checkout.elements.find(item => item.id === "buy-question")!.box.h = 200;
  retarget(checkout, "hold-checkout");
  const clear = checkout.motionEvents.find(item => item.id === "clear-for-follow");
  if (!clear) throw new Error("DAY8_EVENT_MISSING: clear-for-follow");
  clear.targets = ["buy-question", "stage", "full-price"];
  for (const [id, scene, phrase] of [
    ["art-all-payments", 5, "every payment at once"], ["art-pause-buy", 5, "press buy"],
    ["art-first-payment", 6, "A small first payment"], ["art-full-price", 6, "not the full price"],
  ] as const) addStoryEvent(checkout, id, scene, phrase);
  checkout.semanticRationale = "The checkout button pauses as all four payment pieces become visible together; the first piece stays distinct from the full four-piece obligation before the profile CTA.";
  return FinancePlanSchema.parse(plan);
}

const group = (name: string, body: string, future = false) => `<g class="${name}${future ? " story-future" : ""}" data-story-part="${name}">${body}</g>`;
const phone = (x: number, y: number, w: number, h: number) => `<g transform="translate(${x} ${y})"><rect class="card" width="${w}" height="${h}" rx="20"/><path class="muted" d="M25 31h${w - 50}M25 ${h - 43}h${w - 50}"/><path class="gold" d="M${w / 2 - 25} ${h / 2 + 7}h50l-6 30h-38zM${w / 2 - 14} ${h / 2 + 7}q0-23 14-23t14 23"/></g>`;
const payment = (x: number, y: number, w = 108) => `<rect class="payment" x="${x}" y="${y}" width="${w}" height="55" rx="12"/><path class="muted" d="M${x + 16} ${y + 27}h${w - 32}"/>`;
const art: Record<string, string> = {
  "purchase-to-schedule":
    group("first-phone", phone(24, 14, 202, 218)) +
    group("checkout-button", '<rect class="button" x="70" y="166" width="110" height="44" rx="20"/>', true) +
    group("receipt-strip", payment(245, 174, 128), true) +
    group("real-size-outline", '<rect class="focus" x="235" y="164" width="148" height="75" rx="18"/>', true) +
    group("today-coin", '<circle class="gold-fill" cx="128" cy="188" r="22"/><path class="navy" d="M116 188h24"/>', true) +
    group("future-flow", '<path class="gold" d="M244 93h163m-13-12 13 12-13 12"/><circle class="gold-fill" cx="275" cy="93" r="8"/><circle class="gold-fill" cx="327" cy="93" r="8"/><circle class="gold-fill" cx="379" cy="93" r="8"/>', true) +
    group("second-phone", phone(402, 35, 74, 158), true) +
    group("due-stack", '<path class="gold" d="M390 198h90m-82 13h82m-74 13h74"/>', true),
  "read-the-obligation":
    group("calendar", '<rect class="card" x="28" y="12" width="454" height="430" rx="28"/><path class="gold" d="M28 95h454M130 0v38m245-38v38"/><circle class="gold-fill" cx="130" cy="96" r="9"/><circle class="gold-fill" cx="375" cy="96" r="9"/>') +
    group("bnpl-token", '<path class="gold" d="M215 55h80l-8 28h-64zM235 55q0-17 20-17t20 17"/>', true) +
    group("all-obligations", payment(70, 134, 364) + payment(70, 208, 364) + payment(70, 282, 364) + payment(70, 356, 364), true) +
    group("decision-arrow", '<path class="gold" d="M506 232h77m-13-13 13 13-13 13"/><rect class="card" x="600" y="169" width="160" height="126" rx="24"/><path class="gold" d="M643 224h74m-37-35v70"/>', true) +
    group("calendar-focus", '<rect class="focus" x="18" y="2" width="474" height="450" rx="36"/>', true) +
    group("paycheck-boundary", '<path class="muted" stroke-dasharray="14 12" d="M546 335v115"/><path class="gold" d="M575 404h160m-20-18 20 18-20 18"/><circle class="gold-fill" cx="572" cy="404" r="14"/>', true),
  "final-checkout-decision":
    group("checkout-phone", phone(30, 38, 245, 365) + '<rect class="button" x="77" y="323" width="152" height="51" rx="24"/>') +
    group("all-payments", payment(346, 48, 345) + payment(346, 132, 345) + payment(346, 216, 345) + payment(346, 300, 345), true) +
    group("pause-buy", '<path class="gold" d="M129 332v32m35-32v32"/>', true) +
    group("first-highlight", '<rect class="focus" x="336" y="38" width="365" height="75" rx="18"/>', true) +
    group("full-bracket", '<path class="gold" d="M724 38h24v327h-24"/>', true),
};

type Step = { event: string; selector: string; to: Record<string, number>; duration?: number };
const steps: Record<string, Step[]> = {
  "purchase-to-schedule": [
    { event: "art-button", selector: ".checkout-button", to: { opacity: 1 }, duration: .25 },
    { event: "art-purchase", selector: ".receipt-strip", to: { opacity: 1, x: 0 }, duration: .32 },
    { event: "art-smaller", selector: ".receipt-strip", to: { scale: .78 }, duration: .36 },
    { event: "art-not-cheaper", selector: ".receipt-strip", to: { scale: 1 }, duration: .36 },
    { event: "art-not-cheaper", selector: ".real-size-outline", to: { opacity: 1 }, duration: .36 },
    { event: "art-today", selector: ".today-coin", to: { opacity: 1, scale: 1 }, duration: .35 },
    { event: "art-next-three", selector: ".future-flow", to: { opacity: 1 }, duration: .45 },
    { event: "art-another-purchase", selector: ".second-phone", to: { opacity: 1, x: 0 }, duration: .4 },
    { event: "art-pile-up", selector: ".due-stack", to: { opacity: 1 }, duration: .35 },
  ],
  "read-the-obligation": [
    { event: "art-bnpl", selector: ".bnpl-token", to: { opacity: 1 }, duration: .32 },
    { event: "art-whole", selector: ".all-obligations", to: { opacity: 1 }, duration: .48 },
    { event: "art-before-agree", selector: ".decision-arrow", to: { opacity: 1 }, duration: .4 },
    { event: "art-open-schedule", selector: ".calendar-focus", to: { opacity: 1 }, duration: .35 },
    { event: "art-paycheck", selector: ".paycheck-boundary", to: { opacity: 1 }, duration: .4 },
  ],
  "final-checkout-decision": [
    { event: "art-all-payments", selector: ".all-payments", to: { opacity: 1 }, duration: .46 },
    { event: "art-pause-buy", selector: ".pause-buy", to: { opacity: 1 }, duration: .28 },
    { event: "art-first-payment", selector: ".first-highlight", to: { opacity: 1 }, duration: .36 },
    { event: "art-full-price", selector: ".full-bracket", to: { opacity: 1 }, duration: .35 },
  ],
};

const css = [
  '.fm-sequence [data-element-id="stage"]{border:0;background:none;padding:0;display:block;border-radius:0}',
  '.fm-sequence [data-element-id="stage"] .fm-focus-ring{display:none}',
  '.day8-story-art{display:block;width:100%;height:100%;overflow:visible;fill:none;stroke:#D7A928;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}',
  '.day8-story-art .card,.day8-story-art .payment,.day8-story-art .button{fill:#0D2038;stroke:#D7A928;stroke-width:5}',
  '.day8-story-art .payment{fill:#132B47}',
  '.day8-story-art .muted{stroke:#A0AEC0;stroke-width:4}',
  '.day8-story-art .gold{stroke:#F2C14E;stroke-width:6}',
  '.day8-story-art .gold-fill{fill:#F2C14E;stroke:#D7A928;stroke-width:4}',
  '.day8-story-art .navy{stroke:#071426;stroke-width:5}',
  '.day8-story-art .focus{stroke:#F2C14E;stroke-width:6}',
  '.day8-story-art .story-future{opacity:0}',
].join("\n");

/** Decorate only the approved Day 8 composition, after the shared semantic compiler. */
export function decorateDay8RichStory(html: string, plan: ResolvedFinancePlan): string {
  if (plan.day !== 8 || plan.sequences.length !== 3) throw new Error("DAY8_STORY_SCOPE");
  const runtime: Array<Step & { at: number; sequence: string; sourcePhrase: string }> = [];
  for (const sequence of plan.sequences) {
    const bounds = layout[sequence.id as keyof typeof layout];
    const picture = art[sequence.id];
    const sequenceSteps = steps[sequence.id];
    if (!bounds || !picture || !sequenceSteps) throw new Error(`DAY8_STORY_ASSET_MISSING: ${sequence.id}`);
    const stageId = `fm-${sequence.id}-stage`;
    const marker = new RegExp(`(id="${stageId}"[^>]*>)([\\s\\S]*?)(<div class="fm-focus-ring")`);
    if (!marker.test(html)) throw new Error(`DAY8_STORY_STAGE_MISSING: ${stageId}`);
    html = html.replace(marker, `$1<svg class="day8-story-art" viewBox="0 0 ${bounds.w} ${bounds.h}" aria-hidden="true">${picture}</svg>$3`);
    for (const step of sequenceSteps) {
      const source = sequence.motionEvents.find(event => event.id === step.event);
      if (!source || !Number.isFinite(source.atSec)) throw new Error(`DAY8_STORY_EVENT_MISSING: ${sequence.id}.${step.event}`);
      runtime.push({ ...step, selector: `#${stageId} ${step.selector}`, at: source.atSec, sequence: sequence.id, sourcePhrase: source.trigger.sourceSpan });
    }
  }
  const script = `<script>(function(){const t=window.__timelines?.['news-video'];if(!t)throw new Error('DAY8_STORY_TIMELINE_MISSING');const steps=${JSON.stringify(runtime)};window.__day8StoryEvents=steps;for(const s of steps){if(!document.querySelector(s.selector))throw new Error('DAY8_STORY_SELECTOR_MISSING: '+s.selector);t.to(s.selector,{...s.to,duration:s.duration??.38,ease:'power2.inOut'},s.at);}})();</script>`;
  return html.replace("</head>", `<style id="day8-story-style">${css}</style></head>`).replace("</body>", `${script}</body>`);
}
