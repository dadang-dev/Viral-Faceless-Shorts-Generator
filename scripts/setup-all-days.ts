import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ScriptSchema, type Script } from "../src/render/script-schema.js";

throw new Error("Deprecated: this generator contains rewritten copy. Build one approved day from money-habits-script-v2-optimized.md and pass source-contract validation.");

const DAYS_DATA = [
  {
    day: 1,
    title: "3 spending habits quietly making you poorer",
    caption: "Not about being 'bad with money' — it's three quiet habits. Which one hit closest? 👇\n\n#MoneyHabits #PersonalFinance #FinTok #MoneyPsychology",
    scenes: [
      {
        id: "hook",
        type: "hook" as const,
        voiceText: "You are not bad with money. You just have three habits spending in the background before you make a real choice.",
        templateData: {
          template: "hook" as const,
          headline: "3 QUIET SPENDING HABITS",
          subhead: "Making You Poorer Quietly",
          kenBurns: "zoom-in" as const,
        },
      },
      {
        id: "habit-1",
        type: "body" as const,
        voiceText: "Number one: subscription creep. Fourteen dollars for streaming, nine for fitness, five for cloud storage you forgot existed.",
        templateData: {
          template: "feature-list" as const,
          title: "HABIT #1: SUBSCRIPTIONS",
          bullets: ["$14 streaming app", "$9 fitness app", "$5 cloud storage forgot"],
        },
      },
      {
        id: "habit-2",
        type: "body" as const,
        voiceText: "Number two: convenience spending. Ten extra dollars for delivery, four nights a week, quietly becomes one hundred seventy dollars a month.",
        templateData: {
          template: "stat-hero" as const,
          value: "$170+/mo",
          label: "Convenience Spending",
          context: "Ten extra dollars, four nights a week",
        },
      },
      {
        id: "habit-3",
        type: "body" as const,
        voiceText: "Number three: rounding down in your head. An eighteen-dollar coffee run feels like fifteen. Do that four times a week, that is three hundred dollars a month.",
        templateData: {
          template: "comparison" as const,
          left: { label: "In Your Head", value: "Basically $15", color: "purple" as const },
          right: { label: "Real Total", value: "$300+/month", color: "cyan" as const, winner: true },
        },
      },
      {
        id: "callout",
        type: "body" as const,
        voiceText: "None of these make you careless. They just run quietly. This week, name just one habit out loud. That is the first habit you break.",
        templateData: {
          template: "callout" as const,
          statement: "Naming the habit out loud is the first habit you break.",
          tag: "THE FIX",
        },
      },
      {
        id: "outro",
        type: "outro" as const,
        voiceText: "Follow Money Habits to catch spending leaks and master your money.",
        templateData: {
          template: "outro" as const,
          ctaTop: "Which habit is yours?",
          channelName: "Money Habits",
          source: "TikTok: @moneyhabits",
        },
      },
    ],
  },
  {
    day: 2,
    title: "Why you feel broke even when you are not",
    caption: "Getting a raise and still feeling broke isn't bad luck. It's lifestyle creep. Here's what that actually means.\n\n#MoneyHabits #LifestyleCreep #FinTok #PersonalFinance",
    scenes: [
      {
        id: "hook",
        type: "hook" as const,
        voiceText: "Here is something that messes with almost everyone: you can get a raise, and still feel broke six months later. That is called lifestyle creep.",
        templateData: {
          template: "hook" as const,
          headline: "WHY YOU FEEL BROKE",
          subhead: "Even After Getting A Raise",
          kenBurns: "zoom-in" as const,
        },
      },
      {
        id: "comparison",
        type: "body" as const,
        voiceText: "That promotion was supposed to give you breathing room. Instead, you are making twenty percent more, but saving exactly the same amount.",
        templateData: {
          template: "comparison" as const,
          left: { label: "Income", value: "+20% Raise", color: "cyan" as const },
          right: { label: "Savings", value: "+0% Change", color: "purple" as const },
        },
      },
      {
        id: "how-it-creeps",
        type: "body" as const,
        voiceText: "It is not one big decision. It is an apartment two hundred dollars more, a new lease, and ordering appetizers and dessert because why not.",
        templateData: {
          template: "feature-list" as const,
          title: "HOW LIFESTYLE CREEPS",
          bullets: ["+$200/mo nicer apartment", "Upgraded car lease", "Appetizer AND dessert"],
        },
      },
      {
        id: "stat-hero",
        type: "body" as const,
        voiceText: "Each choice feels reasonable in the moment. But stack them up, and your spending rises exactly as fast as your income.",
        templateData: {
          template: "stat-hero" as const,
          value: "100% MATCH",
          label: "Spending Matches Income",
          context: "A more expensive baseline",
        },
      },
      {
        id: "callout",
        type: "body" as const,
        voiceText: "The fix is not depriving yourself. Just ask: did my spending go up because I wanted this, or simply because the money was sitting there?",
        templateData: {
          template: "callout" as const,
          statement: "Did I want this, or was the money just sitting there?",
          tag: "ASK THIS",
        },
      },
      {
        id: "outro",
        type: "outro" as const,
        voiceText: "Follow Money Habits to catch spending leaks before they start.",
        templateData: {
          template: "outro" as const,
          ctaTop: "Did this happen to you?",
          channelName: "Money Habits",
          source: "TikTok: @moneyhabits",
        },
      },
    ],
  },
  {
    day: 3,
    title: "The girl math trap and what it costs you",
    caption: "'Girl math' is funny because it's true. Here's what it's actually costing most of us.\n\n#MoneyHabits #GirlMath #FinTok #MoneyPsychology",
    scenes: [
      {
        id: "hook",
        type: "hook" as const,
        voiceText: "You have probably heard girl math: if I paid in cash it is free, if it is under twenty dollars it does not count. It is quietly expensive.",
        templateData: {
          template: "hook" as const,
          headline: "THE 'GIRL MATH' TRAP",
          subhead: "What It's Actually Costing You",
          kenBurns: "zoom-in" as const,
        },
      },
      {
        id: "mental-accounting",
        type: "body" as const,
        voiceText: "Our brains are wired to round small numbers down. A seven-dollar iced coffee does not feel like spending. A twelve-dollar phone case does not count.",
        templateData: {
          template: "feature-list" as const,
          title: "THE 'DOESN'T COUNT' TRAP",
          bullets: ["$7 iced coffee feels free", "$12 phone case doesn't count", "Paid cash = $0 spent"],
        },
      },
      {
        id: "stat-hero",
        type: "body" as const,
        voiceText: "We write off small amounts because facing them feels like work. But those invisible swipes drain three to four hundred dollars a month, completely untracked.",
        templateData: {
          template: "stat-hero" as const,
          value: "$300-$400",
          label: "Monthly Untracked Drain",
          context: "From invisible $20 swipes",
        },
      },
      {
        id: "callout",
        type: "body" as const,
        voiceText: "The problem is not the joke. The problem is when the joke becomes the actual system you use to decide what to buy.",
        templateData: {
          template: "callout" as const,
          statement: "The problem is when the joke becomes your spending system.",
          tag: "REALITY CHECK",
        },
      },
      {
        id: "test",
        type: "body" as const,
        voiceText: "For one week, write down every purchase that didn't count. You will be shocked by what all the free purchases add up to by Sunday.",
        templateData: {
          template: "comparison" as const,
          left: { label: "Mental Guess", value: "~$40", color: "purple" as const },
          right: { label: "Real Total", value: "$380+", color: "cyan" as const, winner: true },
        },
      },
      {
        id: "outro",
        type: "outro" as const,
        voiceText: "Follow Money Habits to keep more of your hard-earned money.",
        templateData: {
          template: "outro" as const,
          ctaTop: "What's your go-to purchase?",
          channelName: "Money Habits",
          source: "TikTok: @moneyhabits",
        },
      },
    ],
  },
  {
    day: 4,
    title: "The real reason you buy things you do not need",
    caption: "Emotional spending isn't about willpower. It's about what happens in your brain before you even open the app.\n\n#MoneyHabits #EmotionalSpending #FinTok #MoneyPsychology",
    scenes: [
      {
        id: "hook",
        type: "hook" as const,
        voiceText: "Emotional spending is not a willpower problem. It is a wiring problem in your brain.",
        templateData: {
          template: "hook" as const,
          headline: "EMOTIONAL SPENDING",
          subhead: "It's Biology, Not Weakness",
          kenBurns: "zoom-in" as const,
        },
      },
      {
        id: "comparison",
        type: "body" as const,
        voiceText: "When you are stressed or bored, buying something gives your brain a hit of relief for ten minutes. But the relief is short, and the bill is not.",
        templateData: {
          template: "comparison" as const,
          left: { label: "Dopamine Relief", value: "10 Minutes", color: "purple" as const },
          right: { label: "Credit Card Bill", value: "30 Days", color: "cyan" as const },
        },
      },
      {
        id: "stat-hero",
        type: "body" as const,
        voiceText: "You are essentially paying a premium just to regulate your mood. Then the stress of paying for it outweighs the comfort it bought you.",
        templateData: {
          template: "stat-hero" as const,
          value: "MOOD TAX",
          label: "Paying To Regulate Emotions",
          context: "Short comfort, long stress",
        },
      },
      {
        id: "callout",
        type: "body" as const,
        voiceText: "Before you check out, ask: what am I feeling right now? Naming the feeling — tired, bored, anxious — is often enough to break the urge.",
        templateData: {
          template: "callout" as const,
          statement: "Ask: 'What am I feeling right now?' Name the urge first.",
          tag: "THE SHIELD",
        },
      },
      {
        id: "feature-list",
        type: "body" as const,
        voiceText: "You do not need more discipline. You just need one honest question right before you tap the checkout button.",
        templateData: {
          template: "feature-list" as const,
          title: "3 COMMON TRIGGERS",
          bullets: ["Boredom scrolling late at night", "Stress after a hard workday", "Reward after tough meetings"],
        },
      },
      {
        id: "outro",
        type: "outro" as const,
        voiceText: "Follow Money Habits for psychology-backed money tips.",
        templateData: {
          template: "outro" as const,
          ctaTop: "What do you buy when stressed?",
          channelName: "Money Habits",
          source: "TikTok: @moneyhabits",
        },
      },
    ],
  },
  {
    day: 5,
    title: "Subscription creep the habit nobody checks",
    caption: "Guess your subscription count, then go check your statement. Most people are off by double.\n\n#MoneyHabits #SubscriptionCreep #FinTok #PersonalFinance",
    scenes: [
      {
        id: "hook",
        type: "hook" as const,
        voiceText: "Quick challenge: without looking, guess how many subscriptions you pay for. Now go check your bank statement.",
        templateData: {
          template: "hook" as const,
          headline: "THE SUBSCRIPTION TRAP",
          subhead: "The Habit Nobody Checks",
          kenBurns: "zoom-in" as const,
        },
      },
      {
        id: "comparison",
        type: "body" as const,
        voiceText: "Most people guess three or four. Most people actually have eight to twelve once you count trials that converted and forgotten fitness apps.",
        templateData: {
          template: "comparison" as const,
          left: { label: "You Guess", value: "3 to 4", color: "purple" as const },
          right: { label: "Actual Active", value: "8 to 12", color: "cyan" as const, winner: true },
        },
      },
      {
        id: "callout",
        type: "body" as const,
        voiceText: "Subscriptions are designed to be forgettable. The moment you stop noticing the charge, it becomes permanent income for someone else.",
        templateData: {
          template: "callout" as const,
          statement: "Subscriptions are designed to be forgotten. That is their business model.",
          tag: "FRICTION TAX",
        },
      },
      {
        id: "stat-hero",
        type: "body" as const,
        voiceText: "Companies bank on friction. Ten unmonitored subscriptions easily add up to over one thousand two hundred dollars a year.",
        templateData: {
          template: "stat-hero" as const,
          value: "$1,200+/yr",
          label: "Unchecked Subscriptions",
          context: "Permanent income for them",
        },
      },
      {
        id: "feature-list",
        type: "body" as const,
        voiceText: "Here is the habit: once a month, open your statement and look at every recurring charge for ten seconds each. You just have to look.",
        templateData: {
          template: "feature-list" as const,
          title: "MONTHLY 10-SEC AUDIT",
          bullets: ["Open statement on the 1st", "Look at each recurring charge", "Cancel anything you didn't use"],
        },
      },
      {
        id: "outro",
        type: "outro" as const,
        voiceText: "Follow Money Habits to audit your spending habits every week.",
        templateData: {
          template: "outro" as const,
          ctaTop: "How many did you find?",
          channelName: "Money Habits",
          source: "TikTok: @moneyhabits",
        },
      },
    ],
  },
  {
    day: 6,
    title: "Why saving money feels impossible",
    caption: "If saving feels impossible, it's not about math. Here's what's actually going on.\n\n#MoneyHabits #ScarcityMindset #FinTok #MoneyPsychology",
    scenes: [
      {
        id: "hook",
        type: "hook" as const,
        voiceText: "If saving money feels impossible, it is probably not a math problem. It is a scarcity mindset problem.",
        templateData: {
          template: "hook" as const,
          headline: "WHY SAVING FEELS HARD",
          subhead: "It's Not A Math Problem",
          kenBurns: "zoom-in" as const,
        },
      },
      {
        id: "callout",
        type: "body" as const,
        voiceText: "When money felt tight in the past, your brain learned to treat every dollar like the last one. That makes saving feel unsafe, not smart.",
        templateData: {
          template: "callout" as const,
          statement: "Your brain learned that saving feels unsafe, not smart.",
          tag: "SCARCITY",
        },
      },
      {
        id: "comparison",
        type: "body" as const,
        voiceText: "Your brain sees holding cash in checking as survival. Moving it to savings feels like it is gone forever — a loss, not a gain.",
        templateData: {
          template: "comparison" as const,
          left: { label: "In Checking", value: "Feels Safe", color: "purple" as const },
          right: { label: "To Savings", value: "Feels Lost", color: "cyan" as const },
        },
      },
      {
        id: "feature-list",
        type: "body" as const,
        voiceText: "A small habit that helps: start with five dollars a week. The goal is not the amount. It is teaching your brain that saving does not mean losing.",
        templateData: {
          template: "feature-list" as const,
          title: "START EMBARRASSINGLY SMALL",
          bullets: ["$5 a week automated transfer", "Goal is safety, not wealth", "Re-train survival wiring"],
        },
      },
      {
        id: "stat-hero",
        type: "body" as const,
        voiceText: "Once that feels safe, the savings amount can grow naturally. But safety has to come first.",
        templateData: {
          template: "stat-hero" as const,
          value: "SAFETY 1ST",
          label: "Emotion Precedes Math",
          context: "Build comfort before targets",
        },
      },
      {
        id: "outro",
        type: "outro" as const,
        voiceText: "Follow Money Habits to overcome the money mindset blocks.",
        templateData: {
          template: "outro" as const,
          ctaTop: "Does saving feel unsafe?",
          channelName: "Money Habits",
          source: "TikTok: @moneyhabits",
        },
      },
    ],
  },
  {
    day: 7,
    title: "5 money habits 1 honest question each",
    caption: "5 money habits from this week, one honest question each. Which one are YOU starting with?\n\n#MoneyHabits #FinTok #PersonalFinance #MoneyPsychology",
    scenes: [
      {
        id: "hook",
        type: "hook" as const,
        voiceText: "This week we covered five money habits: subscriptions, lifestyle creep, girl math, emotional spending, and scarcity mindset.",
        templateData: {
          template: "hook" as const,
          headline: "5 MONEY HABITS RECAP",
          subhead: "1 Honest Question Each",
          kenBurns: "zoom-in" as const,
        },
      },
      {
        id: "feature-list",
        type: "body" as const,
        voiceText: "None of these are about being bad with money. They are all about attention. Awareness is the ultimate budget.",
        templateData: {
          template: "feature-list" as const,
          title: "THE 5 RECAP HABITS",
          bullets: ["1. Subscription creep", "2. Lifestyle creep", "3. Girl math untracked", "4. Emotional spending"],
        },
      },
      {
        id: "callout",
        type: "body" as const,
        voiceText: "Not one of these needed a complex spreadsheet. Mastering your money starts with mastering your attention.",
        templateData: {
          template: "callout" as const,
          statement: "Mastering your money starts with mastering your attention.",
          tag: "AWARENESS",
        },
      },
      {
        id: "comparison",
        type: "body" as const,
        voiceText: "You do not need a full budget overhaul. You just need one habit you finally see clearly.",
        templateData: {
          template: "comparison" as const,
          left: { label: "Budget Overhaul", value: "Overwhelming", color: "purple" as const },
          right: { label: "1 Habit Clear", value: "Actionable", color: "cyan" as const, winner: true },
        },
      },
      {
        id: "stat-hero",
        type: "body" as const,
        voiceText: "Pick just ONE habit today and ask yourself the one honest question that goes with it.",
        templateData: {
          template: "stat-hero" as const,
          value: "PICK JUST 1",
          label: "One Question Today",
          context: "Start with what hit closest",
        },
      },
      {
        id: "outro",
        type: "outro" as const,
        voiceText: "Which habit are you starting with? Comment below and follow Money Habits.",
        templateData: {
          template: "outro" as const,
          ctaTop: "Comment 1 to 5 to start",
          channelName: "Money Habits",
          source: "TikTok: @moneyhabits",
        },
      },
    ],
  },
];

async function main() {
  for (const item of DAYS_DATA) {
    const dir = join(process.cwd(), "output", `day-${item.day}`);
    await mkdir(dir, { recursive: true });

    const rawScript: Script = {
      version: "1.0",
      metadata: {
        title: item.title,
        source: {
          url: `local://money-habits-day-${item.day}`,
          domain: "moneyhabits.local",
          image: null,
        },
        channel: "Money Habits",
      },
      voice: {
        provider: "edge-tts",
        voiceId: "en-US-ChristopherNeural",
        speed: 1.0,
      },
      scenes: item.scenes,
    };

    // Validate with Zod
    const validated = ScriptSchema.parse(rawScript);
    await writeFile(join(dir, "script.json"), JSON.stringify(validated, null, 2), "utf8");
    await writeFile(join(dir, "caption.txt"), item.caption, "utf8");
    console.log(`Generated and validated: output/day-${item.day}/script.json`);
  }
}

main().catch((err) => {
  console.error("Error setting up scripts:", err);
  process.exit(1);
});
