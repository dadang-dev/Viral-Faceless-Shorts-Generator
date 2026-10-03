import { APPROVED_SCRIPT_FILE } from "./contracts/content-contract.js";
import { FinancePlanSchema, type FinancePlan, type ResolvedFinancePlan } from "./contracts/finance-motion.js";

export type StoryDay = 10 | 11 | 12 | 13 | 14;
type Reveal = { id: string; scene: number; phrase: string; svg: string };
type Label = { id: string; scene: number; phrase: string; x: number; w: number; fontSize?: number };
type StorySequence = { id: string; scenes: number[]; model: "decision-flow"; rationale: string; heading: { scene: number; phrase: string; fontSize?: number; initial?: boolean }; labels?: Label[]; base: string; reveals: Reveal[] };
type StorySpec = { title: string; endings: string[]; sceneCopy: string[]; hookSubhead: string; archetype: string; secondary: string; rationale: string; layout: string; iconComposition: string; sequences: StorySequence[] };
const reveal = (id: string, scene: number, phrase: string, svg: string): Reveal => ({ id, scene, phrase, svg });
const label = (id: string, scene: number, phrase: string, x: number, w: number, fontSize = 48): Label => ({ id, scene, phrase, x, w, fontSize });
const sequence = (id: string, scenes: number[], model: StorySequence["model"], rationale: string, heading: StorySequence["heading"], base: string, reveals: Reveal[], labels: Label[] = []): StorySequence => ({ id, scenes, model, rationale, heading, base, reveals, labels });

/** Episode-local, source-linked imagery. Geometric marks never encode invented amounts or dates. */
export const DAY_STORY_SPECS: Record<StoryDay, StorySpec> = {
  10: {
    title: "Rent is not a personality test",
    endings: ["housing market cheaper.", "real cost of each one.", "the trip to work.", "what you actually take home.", "on your character.", "the cheapest month.", "after you moved in?"],
    sceneCopy: ["housing is your biggest bill", "real cost", "lower rent", "actually take home", "not a verdict", "cheapest month", "surprised you"],
    hookSubhead: "housing market cheaper",
    archetype: "comparison", secondary: "concept-story", layout: "mixed",
    rationale: "A renter compares the full monthly obligation with a listing and take-home pay; no price is fabricated.",
    iconComposition: "listing stays visible while utilities/parking/commute join; advertised rent versus monthly obligation",
    sequences: [
      sequence("housing-focus", [1,2], "decision-flow", "The renter's housing bill, not a coffee treat, is the scale of the decision.", { scene: 1, phrase: "housing is your biggest bill", fontSize: 68, initial: true },
        '<rect class="card" x="138" y="40" width="520" height="374" rx="28"/><path class="muted" d="M180 344h435"/>', [
          reveal("home", 1, "housing is your biggest bill", '<path class="gold" d="M230 185l170-116 170 116v174H230z"/><path class="muted" d="M369 359V253h62v106"/>'),
          reveal("coffee", 1, "one small treat", '<path class="gold" d="M44 299h69l-9 91H54zM112 317h34v33h-34"/><path class="muted" d="M70 282v-30m19 30v-30"/>'),
          reveal("housing-weight", 2, "real cost of each one", '<path class="focus" d="M180 375h435"/>'),
        ]),
      sequence("whole-listing-cost", [3,4], "decision-flow", "The same listing gains the named cost categories before comparison with take-home pay.", { scene: 3, phrase: "lower rent", fontSize: 96 },
        '<rect class="card" x="28" y="41" width="322" height="374" rx="25"/><path class="muted" d="M62 97h251M62 142h190"/><rect class="card" x="499" y="111" width="268" height="240" rx="25"/>', [
          reveal("listing", 3, "A listing", '<path class="gold" d="M91 262l98-70 98 70v108H91z"/>'),
          reveal("utilities", 3, "utilities", '<path class="gold" d="M390 105l-25 60h27l-17 64 51-80h-27l16-44"/>'),
          reveal("parking", 3, "parking", '<rect class="gold" x="367" y="265" width="75" height="75" rx="12"/><path class="gold" d="M385 320v-38h20q18 0 18 16t-18 16h-20"/>'),
          reveal("commute", 3, "trip to work", '<path class="gold" d="M461 390h60m-14-13 14 13-14 13"/>'),
          reveal("take-home", 4, "actually take home", '<path class="gold" d="M540 215h186M540 254h148"/><path class="focus" d="M493 368h278"/>'),
        ], [label("utilities-copy",3,"utilities",130,190),label("parking-copy",3,"parking",380,180),label("trip-copy",3,"trip to work",600,345,46)]),
      sequence("listing-versus-month", [5,6,7], "decision-flow", "Advertised cheap rent is distinguished from an actually affordable month without inventing values.", { scene: 6, phrase: "cheapest listing", fontSize: 80 },
        '<rect class="card" x="36" y="93" width="304" height="270" rx="26"/><rect class="card" x="459" y="93" width="304" height="270" rx="26"/>', [
          reveal("listing-side", 6, "cheapest listing", '<path class="gold" d="M96 250l92-70 92 70v77H96z"/>'),
          reveal("month-side", 6, "cheapest month", '<rect class="gold" x="518" y="168" width="192" height="149" rx="16"/><path class="gold" d="M518 210h192m-144-61v35m98-35v35"/>'),
          reveal("comparison-path", 6, "isn’t always", '<path class="focus" d="M356 228h82m-18-18 18 18-18 18"/>'),
          reveal("question", 7, "surprised you", '<circle class="focus" cx="610" cy="241" r="25"/>'),
        ], [label("listing-label",6,"cheapest listing",130,350,45),label("month-label",6,"cheapest month",570,360,45)]),
    ],
  },
  11: {
    title: "Minimum due is not paid off",
    endings: ["more than one number.", "the balance is gone.", "your card’s terms.", "close the app.", "the interest charged.", "grace period works.", "not just the minimum.", "not a finish line."],
    sceneCopy: ["credit card statement", "Minimum due", "interest", "smallest number", "three things", "statement balance", "real balance", "not a finish line"],
    hookSubhead: "more than one number",
    archetype: "comparison", secondary: "checklist-habits", layout: "vertical",
    rationale: "One statement separates minimum, balance and interest, then branches to qualified payment checks.",
    iconComposition: "persistent statement fields; minimum deadline contrasted with actual balance and qualified payment choices",
    sequences: [
      sequence("statement-meaning", [1,2,3], "decision-flow", "Minimum due remains one field and cannot erase the full statement balance or interest.", { scene: 1, phrase: "credit card statement", fontSize: 64, initial: true },
        '<rect class="card" x="146" y="24" width="510" height="414" rx="28"/><path class="muted" d="M189 102h419M189 180h419M189 258h419M189 336h419"/>', [
          reveal("minimum-field", 2, "Minimum due", '<rect class="gold" x="182" y="128" width="190" height="40" rx="8"/>'),
          reveal("balance-field", 2, "balance is gone", '<rect class="focus" x="407" y="206" width="190" height="40" rx="8"/>'),
          reveal("interest-field", 3, "interest may keep adding up", '<path class="gold" d="M204 291h301m-18-15 18 15-18 15"/>'),
        ], [label("minimum-copy",2,"Minimum due",145,305,52),label("balance-copy",2,"balance",585,275,52)]),
      sequence("three-statement-fields", [4,5], "decision-flow", "The viewer inspects all three source-named statement fields instead of closing on the smallest one.", { scene: 5, phrase: "three things", fontSize: 95 },
        '<rect class="card" x="88" y="27" width="624" height="408" rx="27"/><path class="muted" d="M122 116h556M122 224h556M122 332h556"/>', [
          reveal("minimum", 5, "minimum due", '<rect class="gold" x="149" y="66" width="188" height="44" rx="10"/>'),
          reveal("balance", 5, "full statement balance", '<rect class="gold" x="377" y="172" width="236" height="44" rx="10"/>'),
          reveal("interest", 5, "interest charged", '<rect class="gold" x="148" y="280" width="208" height="44" rx="10"/>'),
          reveal("all-three", 5, "interest charged", '<path class="focus" d="M123 393h555"/>'),
        ], [label("min-label",5,"minimum due",125,260,45),label("balance-label",5,"full statement balance",405,480,43)]),
      sequence("deadline-not-finish", [6,7,8], "decision-flow", "A full-balance check and a real-balance plan are separate conditional routes; minimum due is only a deadline.", { scene: 8, phrase: "minimum is a deadline", fontSize: 69 },
        '<rect class="card" x="25" y="50" width="255" height="350" rx="23"/><rect class="card" x="492" y="50" width="280" height="350" rx="23"/>', [
          reveal("full-route", 6, "pay the statement balance in full", '<path class="gold" d="M293 134h179m-17-17 17 17-17 17"/>'),
          reveal("grace-check", 6, "check how your card’s grace period works", '<circle class="focus" cx="630" cy="165" r="58"/>'),
          reveal("real-plan", 7, "real balance", '<path class="gold" d="M293 305h179m-17-17 17 17-17 17"/><path class="muted" d="M538 314h181"/>'),
          reveal("deadline", 8, "deadline", '<path class="focus" d="M62 366h181"/>'),
        ], [label("full-label",6,"statement balance",130,340,45),label("real-label",7,"real balance",585,300,46)]),
    ],
  },
  12: {
    title: "An ad isn’t a background check",
    endings: ["It isn’t.", "a brand you trust.", "about to disappear.", "somewhere else.", "“scam” or “complaint.”", "the payment options.", "walk away.", "the ad hopes you’ll skip."],
    sceneCopy: ["slick ad", "look-alike website", "about to disappear", "check the seller", "scam", "return policy", "walk away", "extra minute"],
    hookSubhead: "proof that a store is real",
    archetype: "concept-story", secondary: "checklist-habits", layout: "mixed",
    rationale: "An ad-to-lookalike path is interrupted by independent seller checks and a payment-method stop.",
    iconComposition: "phone ad morphs into look-alike store; independent search and policy card; blocked payment route",
    sequences: [
      sequence("ad-to-imitation", [1,2,3], "decision-flow", "The polished ad is visually separate from proof; copied store cues and false urgency appear when named.", { scene: 1, phrase: "slick ad", fontSize: 100, initial: true },
        '<rect class="card" x="46" y="19" width="300" height="423" rx="28"/><path class="muted" d="M89 88h210M89 383h210"/>', [
          reveal("ad-photo", 1, "ad in your feed", '<rect class="gold" x="83" y="128" width="230" height="190" rx="15"/><path class="gold" d="M100 289l60-68 42 38 48-53 48 83"/>'),
          reveal("copy-site", 2, "look-alike website", '<path class="gold" d="M362 220h76m-16-16 16 16-16 16"/><rect class="card" x="459" y="40" width="296" height="374" rx="25"/>'),
          reveal("copied-cues", 2, "photos, logo", '<path class="muted" d="M490 99h224M490 132h160"/><rect class="gold" x="490" y="170" width="223" height="116" rx="11"/>'),
          reveal("timer", 2, "countdown timer", '<circle class="focus" cx="602" cy="336" r="34"/><path class="gold" d="M602 317v21l16 11"/>'),
          reveal("urgency", 3, "about to disappear", '<path class="focus" d="M482 393h252"/>'),
        ]),
      sequence("independent-seller-check", [4,5,6], "decision-flow", "The viewer leaves the ad, searches the company independently, then inspects policy and payment options.", { scene: 4, phrase: "check the seller", fontSize: 81 },
        '<rect class="card" x="35" y="77" width="245" height="304" rx="22"/><rect class="card" x="441" y="43" width="325" height="374" rx="25"/>', [
          reveal("leave-ad", 4, "leave the ad", '<path class="gold" d="M296 218h121m-22-22 22 22-22 22"/>'),
          reveal("independent-search", 5, "Search the company’s name", '<circle class="focus" cx="515" cy="139" r="39"/><path class="gold" d="M543 167l35 35"/>'),
          reveal("complaint", 5, "complaint", '<path class="muted" d="M467 248h250M467 280h189"/>'),
          reveal("return-policy", 6, "return policy", '<rect class="gold" x="476" y="317" width="100" height="53" rx="9"/>'),
          reveal("payment-options", 6, "payment options", '<rect class="gold" x="607" y="317" width="100" height="53" rx="9"/>'),
        ], [label("search-label",5,"company’s name",150,355,46),label("policy-label",6,"return policy",600,355,46)]),
      sequence("unsafe-payment-exit", [7,8], "decision-flow", "The source-named payment methods trigger walking away, not a further purchase.", { scene: 7, phrase: "walk away", fontSize: 91 },
        '<rect class="card" x="53" y="90" width="630" height="260" rx="29"/><path class="muted" d="M92 290h540"/>', [
          reveal("gift-card", 7, "gift cards", '<rect class="gold" x="95" y="151" width="135" height="95" rx="14"/>'),
          reveal("crypto", 7, "crypto", '<circle class="gold" cx="365" cy="197" r="47"/>'),
          reveal("wire", 7, "wire transfer", '<path class="gold" d="M492 175h120m-17-17 17 17-17 17M492 219h120"/>'),
          reveal("stop-path", 7, "walk away", '<path class="focus" d="M55 389h626M675 376l-17 26"/>'),
          reveal("extra-check", 8, "extra minute", '<circle class="focus" cx="713" cy="112" r="31"/>'),
        ], [label("gift-label",7,"gift cards",100,215,43),label("crypto-label",7,"crypto",385,165,43),label("wire-label",7,"wire transfer",590,365,43)]),
    ],
  },
  13: {
    title: "The bill you forgot to expect",
    endings: ["cost money again isn’t.", "doesn’t show up every month.", "no place for them.", "likely to come.", "on your calendar.", "in your plan.", "the exact amount.", "off guard.", "out of nowhere”?"],
    sceneCopy: ["car repair", "insurance renewal", "monthly plan", "irregular expense", "calendar", "own line", "exact amount", "off guard", "out of nowhere"],
    hookSubhead: "unexpected",
    archetype: "timeline-frequency", secondary: "concept-story", layout: "vertical",
    rationale: "A known irregular category moves from an unplanned expense into an undated calendar and plan line.",
    iconComposition: "car/insurance/phone examples converge on a reminder; one category becomes a plan line",
    sequences: [
      sequence("irregular-bills", [1,2,3], "decision-flow", "An unexpected repair and other not-monthly bills share the same category without invented frequency.", { scene: 1, phrase: "car repair", fontSize: 96, initial: true },
        '<rect class="card" x="41" y="110" width="240" height="230" rx="24"/><path class="muted" d="M78 314h170"/>', [
          reveal("car", 1, "car repair", '<path class="gold" d="M73 250h174l-28-68H104z"/><circle class="gold" cx="111" cy="256" r="16"/><circle class="gold" cx="207" cy="256" r="16"/>'),
          reveal("insurance", 2, "insurance renewal", '<rect class="gold" x="334" y="142" width="170" height="167" rx="16"/><path class="muted" d="M363 188h112M363 231h112"/>'),
          reveal("phone", 2, "phone replacement", '<rect class="gold" x="566" y="132" width="150" height="205" rx="18"/><path class="muted" d="M596 294h91"/>'),
          reveal("unplanned", 3, "no place for them", '<path class="focus" d="M64 385h640"/>'),
        ], [label("car-label",1,"car repair",90,260),label("insurance-label",2,"insurance renewal",380,330,44),label("phone-label",2,"phone replacement",720,290,43)]),
      sequence("calendar-reminder", [4,5], "decision-flow", "One coming expense gains a calendar date-or-check reminder, without a fabricated day or recurrence.", { scene: 4, phrase: "irregular expense", fontSize: 79 },
        '<rect class="card" x="110" y="27" width="580" height="410" rx="27"/><path class="gold" d="M110 120h580M253 10v45m297-45v45"/><path class="muted" d="M166 190h470M166 267h470M166 344h470"/>', [
          reveal("chosen-category", 4, "one irregular expense", '<rect class="gold" x="185" y="146" width="192" height="52" rx="13"/>'),
          reveal("reminder", 5, "reminder to check it", '<circle class="focus" cx="511" cy="267" r="37"/><path class="gold" d="M495 267l12 13 25-29"/>'),
          reveal("calendar", 5, "on your calendar", '<path class="focus" d="M149 386h505"/>'),
        ], [label("reminder-label",5,"reminder to check it",240,610,48)]),
      sequence("plan-category", [6,7,8,9], "decision-flow", "The selected expense obtains its own planning line; no amount is predicted.", { scene: 6, phrase: "own line in your plan", fontSize: 72 },
        '<rect class="card" x="59" y="35" width="674" height="386" rx="28"/><path class="muted" d="M105 113h579M105 197h579M105 281h579M105 365h579"/>', [
          reveal("category-line", 6, "own line", '<rect class="gold" x="105" y="222" width="410" height="44" rx="12"/>'),
          reveal("no-amount", 7, "don’t have to predict the exact amount", '<path class="focus" d="M568 244h101"/>'),
          reveal("ahead", 8, "before it catches you off guard", '<path class="gold" d="M89 397h595"/>'),
          reveal("question", 9, "out of nowhere", '<circle class="focus" cx="661" cy="76" r="27"/>'),
        ], [label("plan-label",6,"own line in your plan",165,575,48)]),
    ],
  },
  14: {
    title: "A job shouldn’t make you pay to get paid",
    endings: ["“boosting” products.", "at first.", "your own money.", "a task scam works.", "you can spend.", "to recover the first one.", "report the offer to the FTC.", "your wages."],
    sceneCopy: ["earn money", "earnings climbing", "deposit your own money", "task scam", "not a paycheck", "pay to get paid", "report the offer", "your wages"],
    hookSubhead: "liking videos",
    archetype: "concept-story", secondary: "comparison", layout: "mixed",
    rationale: "Fake in-app earnings remain distinct from spendable pay; a deposit demand is followed by stopping, independent checking and FTC reporting.",
    iconComposition: "task-message to fake earnings, locked withdrawal and personal-money deposit, then stop/check/report",
    sequences: [
      sequence("fake-earnings", [1,2], "decision-flow", "A task message and claimed in-app earnings evolve, but no spendable money amount is shown.", { scene: 1, phrase: "earn money", fontSize: 94, initial: true },
        '<rect class="card" x="190" y="24" width="421" height="415" rx="30"/><path class="muted" d="M229 86h344M229 351h344"/>', [
          reveal("tasks", 1, "liking videos", '<rect class="gold" x="235" y="121" width="330" height="72" rx="15"/><path class="muted" d="M263 158h244"/>'),
          reveal("earnings", 2, "earnings climbing", '<path class="gold" d="M265 301l83-39 83 15 91-73m-20 2h20v20"/>'),
          reveal("first-payout", 2, "pay you a little at first", '<circle class="gold-fill" cx="589" cy="295" r="30"/>'),
        ]),
      sequence("deposit-trap", [3,4,5], "decision-flow", "The same app blocks supposed earnings behind a deposit of the viewer's own money.", { scene: 3, phrase: "deposit your own money", fontSize: 71 },
        '<rect class="card" x="314" y="24" width="354" height="412" rx="28"/><path class="muted" d="M354 111h271M354 344h271"/>', [
          reveal("locked-earnings", 3, "unlock the rest", '<rect class="gold" x="373" y="150" width="230" height="108" rx="15"/><path class="gold" d="M453 184v-19a35 35 0 0 1 70 0v19"/>'),
          reveal("own-wallet", 3, "your own money", '<rect class="gold" x="38" y="242" width="220" height="119" rx="20"/><path class="muted" d="M72 295h143"/>'),
          reveal("deposit-arrow", 3, "deposit your own money", '<path class="focus" d="M270 300h67m-15-15 15 15-15 15"/>'),
          reveal("scam-block", 4, "task scam", '<path class="focus" d="M351 391h284"/>'),
          reveal("not-paycheck", 5, "not a paycheck you can spend", '<path class="gold" d="M380 297h216m-20-19 20 19-20 19"/>'),
        ], [label("wallet-label",3,"your own money",100,315,49),label("app-label",5,"not a paycheck",555,340,43)]),
      sequence("stop-check-report", [6,7,8], "decision-flow", "The deposit loop stops; an independently found company source and FTC report are separate follow-up actions.", { scene: 6, phrase: "pay to get paid", fontSize: 78 },
        '<rect class="card" x="28" y="128" width="231" height="203" rx="25"/><rect class="card" x="526" y="128" width="240" height="203" rx="25"/>', [
          reveal("stop", 6, "stop", '<path class="focus" d="M95 171l95 112m0-112L95 283"/>'),
          reveal("no-more", 6, "Don’t send another deposit", '<path class="gold" d="M273 228h223m-22-22 22 22-22 22"/>'),
          reveal("check", 7, "Check the company", '<circle class="gold" cx="594" cy="208" r="38"/><path class="gold" d="M625 239l38 38"/>'),
          reveal("ftc", 7, "report the offer to the FTC", '<rect class="focus" x="541" y="281" width="207" height="41" rx="9"/>'),
          reveal("wages", 8, "your wages", '<path class="focus" d="M62 389h682"/>'),
        ], [label("stop-label",6,"stop",120,170,54),label("report-label",7,"report the offer",570,360,42)]),
    ],
  },
};

const svgGroup = (name: string, svg: string, future: boolean) => `<g class="${name}${future ? " story-future" : ""}" data-story-part="${name}">${svg}</g>`;

/** Add source-timed art events to the existing semantic finance plan. */
export function day10to14RichStoryPlan(input: FinancePlan): FinancePlan {
  const plan = FinancePlanSchema.parse(structuredClone(input));
  const spec = DAY_STORY_SPECS[plan.day as StoryDay];
  if (!spec || plan.sequences.length !== spec.sequences.length || plan.sequences.some((item, index) => item.id !== spec.sequences[index].id)) throw new Error("DAY10_14_STORY_SCOPE");
  for (const [index, item] of plan.sequences.entries()) {
    if (item.elements.filter(element => element.id === "stage").length !== 1) throw new Error(`DAY10_14_STAGE_SCOPE: ${item.id}`);
    item.motionEvents = item.motionEvents.filter(event => !event.id.startsWith("art-"));
    for (const part of spec.sequences[index].reveals) {
      item.motionEvents.push({ id: `art-${part.id}`, trigger: { source: APPROVED_SCRIPT_FILE, sceneId: `scene-${part.scene}`, sourceSpan: part.phrase }, action: "focus", targets: ["stage"], relation: "same-object", transition: "state-update", rationale: `The source phrase ${part.phrase} changes the same visible object.` });
    }
  }
  return FinancePlanSchema.parse(plan);
}

const css = [
  '.fm-sequence [data-element-id="stage"]{border:0;background:none;padding:0;display:block;border-radius:0}',
  '.fm-sequence [data-element-id="stage"] .fm-focus-ring{display:none}',
  '.day10to14-story-art{display:block;width:100%;height:100%;overflow:visible;fill:none;stroke:#D7A928;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}',
  '.day10to14-story-art .card{fill:#0D2038;stroke:#D7A928;stroke-width:5}',
  '.day10to14-story-art .muted{stroke:#A0AEC0;stroke-width:4}',
  '.day10to14-story-art .gold{stroke:#F2C14E;stroke-width:6}',
  '.day10to14-story-art .gold-fill{fill:#F2C14E;stroke:#D7A928;stroke-width:4}',
  '.day10to14-story-art .focus{stroke:#F2C14E;stroke-width:6}',
  '.day10to14-story-art .story-future{opacity:0}',
].join("\n");

export function decorateDay10to14RichStory(html: string, plan: ResolvedFinancePlan): string {
  const spec = DAY_STORY_SPECS[plan.day as StoryDay];
  if (!spec || plan.sequences.length !== spec.sequences.length || plan.sequences.some((item, index) => item.id !== spec.sequences[index].id)) throw new Error("DAY10_14_STORY_SCOPE");
  const runtime: Array<{ event: string; selector: string; at: number; duration: number; sequence: string; sourcePhrase: string }> = [];
  for (const [index, item] of plan.sequences.entries()) {
    const design = spec.sequences[index];
    const stageId = `fm-${item.id}-stage`;
    const marker = new RegExp(`(id="${stageId}"[^>]*>)([\\s\\S]*?)(<div class="fm-focus-ring")`);
    if (!marker.test(html)) throw new Error(`DAY10_14_STORY_STAGE_MISSING: ${stageId}`);
    const picture = svgGroup("story-base", design.base, false) + design.reveals.map(part => svgGroup(`story-${part.id}`, part.svg, true)).join("");
    html = html.replace(marker, `$1<svg class="day10to14-story-art" viewBox="0 0 800 460" aria-hidden="true">${picture}</svg>$3`);
    for (const part of design.reveals) {
      const source = item.motionEvents.find(event => event.id === `art-${part.id}`);
      if (!source || !Number.isFinite(source.atSec)) throw new Error(`DAY10_14_STORY_EVENT_MISSING: ${item.id}.${part.id}`);
      runtime.push({ event: `art-${part.id}`, selector: `#${stageId} .story-${part.id}`, at: source.atSec, duration: .34, sequence: item.id, sourcePhrase: source.trigger.sourceSpan });
    }
  }
  const script = `<script>(function(){const t=window.__timelines?.['news-video'];if(!t)throw new Error('DAY10_14_STORY_TIMELINE_MISSING');const steps=${JSON.stringify(runtime)};window.__batchStoryEvents=steps;for(const s of steps){if(!document.querySelector(s.selector))throw new Error('DAY10_14_STORY_SELECTOR_MISSING: '+s.selector);t.to(s.selector,{opacity:1,duration:s.duration,ease:'power2.inOut'},s.at);}})();</script>`;
  return html.replace("</head>", `<style id="day10to14-story-style">${css}</style></head>`).replace("</body>", `${script}</body>`);
}
