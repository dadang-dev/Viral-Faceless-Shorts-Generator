import { APPROVED_SCRIPT_FILE } from "./contracts/content-contract.js";
import { FinancePlanSchema, type FinancePlan, type ResolvedFinancePlan } from "./contracts/finance-motion.js";

type Sequence = FinancePlan["sequences"][number];
type Step = { event: string; selector: string; to: Record<string, number>; duration?: number };
const expected = ["visible-balance", "one-calendar", "date-and-options"] as const;

function artEvent(sequence: Sequence, id: string, scene: number, phrase: string) {
  if (sequence.motionEvents.some(event => event.id === id)) throw new Error(`DAY9_DUPLICATE_EVENT: ${id}`);
  sequence.motionEvents.push({ id, trigger: { source: APPROVED_SCRIPT_FILE, sceneId: `scene-${scene}`, sourceSpan: phrase }, action: "focus", targets: ["stage"], relation: "same-object", transition: "state-update", rationale: `The illustration changes when the approved narration says ${phrase}.` });
}

/** Day 9 only: one bank balance evolves into scheduled obligations and a date-check decision. */
export function day9RichStoryPlan(input: FinancePlan): FinancePlan {
  const plan = FinancePlanSchema.parse(structuredClone(input));
  if (plan.day !== 9 || plan.sequences.length !== expected.length || plan.sequences.some((sequence, index) => sequence.id !== expected[index])) throw new Error("DAY9_STORY_SCOPE");
  for (const sequence of plan.sequences) {
    if (sequence.elements.filter(element => element.id === "stage").length !== 1) throw new Error(`DAY9_STAGE_SCOPE: ${sequence.id}`);
    sequence.motionEvents = sequence.motionEvents.filter(event => !event.id.startsWith("art-"));
  }
  const [bank, calendar, options] = plan.sequences;
  for (const [id, scene, phrase] of [
    ["art-bank-screen", 1, "banking app"],
    ["art-spend", 1, "yours to spend"],
    ["art-hidden-bills", 2, "tomorrow’s bills"],
    ["art-rent", 3, "Rent"],
    ["art-card", 3, "a card payment"],
    ["art-phone", 3, "your phone plan"],
    ["art-cluster", 3, "withdrawals can land close together"],
  ] as const) artEvent(bank, id, scene, phrase);
  for (const [id, scene, phrase] of [
    ["art-payday", 4, "next payday"],
    ["art-autopay", 4, "every automatic payment"],
    ["art-together", 4, "same calendar"],
    ["art-after-bills", 5, "after those bills"],
    ["art-now", 5, "number you see right now"],
  ] as const) artEvent(calendar, id, scene, phrase);
  for (const [id, scene, phrase] of [
    ["art-date", 6, "payment date"],
    ["art-problem", 6, "going to be a problem"],
    ["art-options", 6, "check your options"],
    ["art-provider", 6, "with the provider"],
    ["art-early", 6, "before it arrives"],
    ["art-unclaimed", 7, "money that’s unclaimed"],
  ] as const) artEvent(options, id, scene, phrase);
  return FinancePlanSchema.parse(plan);
}

const group = (name: string, body: string, future = false) => `<g class="${name}${future ? " story-future" : ""}" data-story-part="${name}">${body}</g>`;
const bill = (y: number) => `<rect class="bill" x="390" y="${y}" width="245" height="60" rx="14"/><path class="muted" d="M417 ${y + 30}h145"/>`;
const art: Record<string, string> = {
  "visible-balance":
    group("bank-app", '<rect class="card" x="40" y="24" width="304" height="408" rx="30"/><path class="muted" d="M73 72h238M73 392h238"/><rect class="balance" x="79" y="138" width="227" height="125" rx="18"/>') +
    group("bank-screen", '<path class="gold" d="M107 185h168M107 219h116"/>', true) +
    group("spend-control", '<rect class="button" x="116" y="308" width="150" height="56" rx="28"/><path class="gold" d="M172 336h38m-12-11 12 11-12 11"/>', true) +
    group("unseen-bills", '<path class="muted" stroke-dasharray="11 10" d="M365 55v330"/><path class="gold" d="M378 85h72m-10-10 10 10-10 10"/>', true) +
    group("rent-slip", bill(94) + '<path class="gold" d="M682 145v-30l39-26 39 26v30h-78z"/>', true) +
    group("card-slip", bill(201) + '<rect class="card" x="686" y="202" width="69" height="49" rx="7"/><path class="gold" d="M686 219h69"/>', true) +
    group("phone-slip", bill(308) + '<rect class="card" x="698" y="301" width="47" height="72" rx="8"/><path class="muted" d="M709 357h24"/>', true) +
    group("nearby-claims", '<path class="gold" d="M654 91h17v283h-17"/><path class="gold" d="M620 396h80"/>', true),
  "one-calendar":
    group("calendar", '<rect class="card" x="33" y="24" width="485" height="410" rx="28"/><path class="gold" d="M33 106h485M142 10v43m265-43v43"/><path class="muted" d="M76 165h395M76 245h395M76 325h395"/>') +
    group("payday-pin", '<circle class="gold-fill" cx="151" cy="167" r="20"/><path class="navy" d="M141 167h20"/>', true) +
    group("autopay-pins", '<circle class="gold-fill" cx="336" cy="165" r="13"/><circle class="gold-fill" cx="257" cy="246" r="13"/><circle class="gold-fill" cx="398" cy="325" r="13"/>', true) +
    group("same-calendar", '<rect class="focus" x="22" y="13" width="507" height="432" rx="36"/>', true) +
    group("today-screen", '<rect class="card" x="564" y="82" width="196" height="225" rx="22"/><path class="muted" d="M588 128h148M588 158h112"/>', true) +
    group("after-bills", '<path class="gold" d="M536 233h38m-10-10 10 10-10 10"/><rect class="balance" x="583" y="330" width="159" height="68" rx="15"/><path class="gold" d="M608 364h108"/>', true),
  "date-and-options":
    group("calendar-card", '<rect class="card" x="26" y="38" width="279" height="355" rx="24"/><path class="gold" d="M26 115h279M95 21v39m150-39v39"/><path class="muted" d="M70 178h190M70 246h190M70 314h190"/>') +
    group("date-focus", '<circle class="focus" cx="158" cy="246" r="35"/>', true) +
    group("problem-ring", '<circle class="gold" cx="158" cy="246" r="49"/>', true) +
    group("option-path", '<path class="gold" d="M325 246h117m-15-15 15 15-15 15"/>', true) +
    group("provider-card", '<rect class="card" x="460" y="88" width="301" height="286" rx="26"/><path class="muted" d="M495 142h232M495 185h168M495 288h232"/><circle class="gold" cx="609" cy="239" r="24"/>', true) +
    group("early-arrow", '<path class="gold" d="M359 350h84m-13-13 13 13-13 13"/>', true) +
    group("unclaimed-claim", '<path class="focus" d="M36 409h718"/>', true),
};

const steps: Record<string, Step[]> = {
  "visible-balance": [
    { event: "art-bank-screen", selector: ".bank-screen", to: { opacity: 1 }, duration: .28 },
    { event: "art-spend", selector: ".spend-control", to: { opacity: 1 }, duration: .3 },
    { event: "art-hidden-bills", selector: ".unseen-bills", to: { opacity: 1 }, duration: .32 },
    { event: "art-rent", selector: ".rent-slip", to: { opacity: 1 }, duration: .3 },
    { event: "art-card", selector: ".card-slip", to: { opacity: 1 }, duration: .3 },
    { event: "art-phone", selector: ".phone-slip", to: { opacity: 1 }, duration: .3 },
    { event: "art-cluster", selector: ".nearby-claims", to: { opacity: 1 }, duration: .35 },
  ],
  "one-calendar": [
    { event: "art-payday", selector: ".payday-pin", to: { opacity: 1 }, duration: .3 },
    { event: "art-autopay", selector: ".autopay-pins", to: { opacity: 1 }, duration: .38 },
    { event: "art-together", selector: ".same-calendar", to: { opacity: 1 }, duration: .3 },
    { event: "art-now", selector: ".today-screen", to: { opacity: 1 }, duration: .32 },
    { event: "art-after-bills", selector: ".after-bills", to: { opacity: 1 }, duration: .35 },
  ],
  "date-and-options": [
    { event: "art-date", selector: ".date-focus", to: { opacity: 1 }, duration: .3 },
    { event: "art-problem", selector: ".problem-ring", to: { opacity: 1 }, duration: .32 },
    { event: "art-options", selector: ".option-path", to: { opacity: 1 }, duration: .34 },
    { event: "art-provider", selector: ".provider-card", to: { opacity: 1 }, duration: .38 },
    { event: "art-early", selector: ".early-arrow", to: { opacity: 1 }, duration: .3 },
    { event: "art-unclaimed", selector: ".unclaimed-claim", to: { opacity: 1 }, duration: .3 },
  ],
};

const css = [
  '.fm-sequence [data-element-id="stage"]{border:0;background:none;padding:0;display:block;border-radius:0}',
  '.fm-sequence [data-element-id="stage"] .fm-focus-ring{display:none}',
  '.day9-story-art{display:block;width:100%;height:100%;overflow:visible;fill:none;stroke:#D7A928;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}',
  '.day9-story-art .card,.day9-story-art .bill,.day9-story-art .button{fill:#0D2038;stroke:#D7A928;stroke-width:5}',
  '.day9-story-art .balance{fill:#132B47;stroke:#F2C14E;stroke-width:5}',
  '.day9-story-art .muted{stroke:#A0AEC0;stroke-width:4}',
  '.day9-story-art .gold{stroke:#F2C14E;stroke-width:6}',
  '.day9-story-art .gold-fill{fill:#F2C14E;stroke:#D7A928;stroke-width:4}',
  '.day9-story-art .navy{stroke:#071426;stroke-width:5}',
  '.day9-story-art .focus{stroke:#F2C14E;stroke-width:6}',
  '.day9-story-art .story-future{opacity:0}',
].join("\n");

/** Insert only Day 9 illustration after the shared semantic compiler. */
export function decorateDay9RichStory(html: string, plan: ResolvedFinancePlan): string {
  if (plan.day !== 9 || plan.sequences.length !== expected.length || plan.sequences.some((sequence, index) => sequence.id !== expected[index])) throw new Error("DAY9_STORY_SCOPE");
  const runtime: Array<Step & { at: number; sequence: string; sourcePhrase: string }> = [];
  for (const sequence of plan.sequences) {
    const picture = art[sequence.id];
    const sequenceSteps = steps[sequence.id];
    if (!picture || !sequenceSteps) throw new Error(`DAY9_STORY_ASSET_MISSING: ${sequence.id}`);
    const stageId = `fm-${sequence.id}-stage`;
    const marker = new RegExp(`(id="${stageId}"[^>]*>)([\\s\\S]*?)(<div class="fm-focus-ring")`);
    if (!marker.test(html)) throw new Error(`DAY9_STORY_STAGE_MISSING: ${stageId}`);
    html = html.replace(marker, `$1<svg class="day9-story-art" viewBox="0 0 800 460" aria-hidden="true">${picture}</svg>$3`);
    for (const step of sequenceSteps) {
      const source = sequence.motionEvents.find(event => event.id === step.event);
      if (!source || !Number.isFinite(source.atSec)) throw new Error(`DAY9_STORY_EVENT_MISSING: ${sequence.id}.${step.event}`);
      runtime.push({ ...step, selector: `#${stageId} ${step.selector}`, at: source.atSec, sequence: sequence.id, sourcePhrase: source.trigger.sourceSpan });
    }
  }
  const script = `<script>(function(){const t=window.__timelines?.['news-video'];if(!t)throw new Error('DAY9_STORY_TIMELINE_MISSING');const steps=${JSON.stringify(runtime)};window.__day9StoryEvents=steps;for(const s of steps){if(!document.querySelector(s.selector))throw new Error('DAY9_STORY_SELECTOR_MISSING: '+s.selector);t.to(s.selector,{...s.to,duration:s.duration??.38,ease:'power2.inOut'},s.at);}})();</script>`;
  return html.replace("</head>", `<style id="day9-story-style">${css}</style></head>`).replace("</body>", `${script}</body>`);
}
