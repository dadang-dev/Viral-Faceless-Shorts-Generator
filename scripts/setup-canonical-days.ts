import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ScriptSchema } from "../src/render/script-schema.js";

throw new Error("Deprecated: this generator contains rewritten copy. Build one approved day from money-habits-script-v2-optimized.md and pass source-contract validation.");

// Canonical 19 scenes for Day 1
const day1Scenes = [
  {
    id: "scene-1",
    type: "hook" as const,
    voiceText: "You are not bad with money.",
    templateData: {
      template: "hook" as const,
      headline: "NOT BAD WITH MONEY",
      subhead: "It's three quiet habits.",
      kenBurns: "zoom-in" as const,
    },
  },
  {
    id: "scene-2",
    type: "body" as const,
    voiceText: "You just have three habits spending in the background before you make a real choice.",
    templateData: {
      template: "feature-list" as const,
      title: "3 QUIET HABITS",
      bullets: [
        "Running in background",
        "Draining your wallet",
        "Before you even notice",
      ],
    },
  },
  {
    id: "scene-3",
    type: "body" as const,
    voiceText: "Number one: subscription creep.",
    templateData: {
      template: "callout" as const,
      statement: "NUMBER ONE: SUBSCRIPTION CREEP",
      tag: "HABIT #1",
    },
  },
  {
    id: "scene-4",
    type: "body" as const,
    voiceText: "That is fourteen dollars for a streaming app you have not watched in three months.",
    templateData: {
      template: "stat-hero" as const,
      value: "$14 / MO",
      label: "Streaming App",
      context: "Unused for 3 months",
    },
  },
  {
    id: "scene-5",
    type: "body" as const,
    voiceText: "Nine dollars for a fitness app charging you on autopilot.",
    templateData: {
      template: "stat-hero" as const,
      value: "$9 / MO",
      label: "Fitness App",
      context: "Autopay charging since January",
    },
  },
  {
    id: "scene-6",
    type: "body" as const,
    voiceText: "Five dollars for cloud storage you forgot you even signed up for.",
    templateData: {
      template: "stat-hero" as const,
      value: "$5 / MO",
      label: "Cloud Storage",
      context: "Forgot you even signed up",
    },
  },
  {
    id: "scene-7",
    type: "body" as const,
    voiceText: "Until you are paying for five apps you forgot existed.",
    templateData: {
      template: "stat-hero" as const,
      value: "5 APPS",
      label: "Forgotten Subscriptions",
      context: "Quietly draining your account",
    },
  },
  {
    id: "scene-8",
    type: "body" as const,
    voiceText: "Number two: convenience spending.",
    templateData: {
      template: "callout" as const,
      statement: "NUMBER TWO: CONVENIENCE SPENDING",
      tag: "HABIT #2",
    },
  },
  {
    id: "scene-9",
    type: "body" as const,
    voiceText: "Every 'I will just order delivery, I am exhausted' feels small.",
    templateData: {
      template: "callout" as const,
      statement: "'I am exhausted, I will just order delivery.'",
      tag: "TIRED DECISION",
    },
  },
  {
    id: "scene-10",
    type: "body" as const,
    voiceText: "The food was fifteen dollars, but delivery fees and tip made it twenty-five.",
    templateData: {
      template: "comparison" as const,
      left: { label: "Meal Alone", value: "$15", color: "cyan" as const },
      right: { label: "With Fees & Tip", value: "$25", color: "purple" as const, winner: true },
    },
  },
  {
    id: "scene-11",
    type: "body" as const,
    voiceText: "Ten extra dollars, four nights a week, quietly becomes more than a hundred and seventy dollars a month.",
    templateData: {
      template: "stat-hero" as const,
      value: "$170+ / MO",
      label: "Convenience Tax",
      context: "Just 4 delivery nights a week",
    },
  },
  {
    id: "scene-12",
    type: "body" as const,
    voiceText: "Number three: rounding down in your head.",
    templateData: {
      template: "callout" as const,
      statement: "NUMBER THREE: ROUNDING DOWN",
      tag: "HABIT #3",
    },
  },
  {
    id: "scene-13",
    type: "body" as const,
    voiceText: "You buy an eighteen-dollar coffee run, and tell yourself it is basically fifteen.",
    templateData: {
      template: "comparison" as const,
      left: { label: "Actual Receipt", value: "$18", color: "purple" as const },
      right: { label: "Mental Rounding", value: "Basically $15", color: "cyan" as const },
    },
  },
  {
    id: "scene-14",
    type: "body" as const,
    voiceText: "You spend forty-six dollars, and convince yourself it was only forty.",
    templateData: {
      template: "comparison" as const,
      left: { label: "Actual Price", value: "$46", color: "purple" as const },
      right: { label: "Brain Says", value: "About $40", color: "cyan" as const },
    },
  },
  {
    id: "scene-15",
    type: "body" as const,
    voiceText: "Do that four times a week, and you have quietly spent three hundred dollars on basically nothing.",
    templateData: {
      template: "stat-hero" as const,
      value: "$300+ / MO",
      label: "Mental Discount Trap",
      context: "4 times a week on 'basically nothing'",
    },
  },
  {
    id: "scene-16",
    type: "body" as const,
    voiceText: "None of these make you careless.",
    templateData: {
      template: "callout" as const,
      statement: "None of these make you careless.",
      tag: "MINDSET",
    },
  },
  {
    id: "scene-17",
    type: "body" as const,
    voiceText: "They just run quietly in the background.",
    templateData: {
      template: "feature-list" as const,
      title: "THE 3 BACKGROUND HABITS",
      bullets: [
        "1. Subscription creep",
        "2. Convenience spending",
        "3. Rounding down",
      ],
    },
  },
  {
    id: "scene-18",
    type: "body" as const,
    voiceText: "This week, try naming just one of them out loud. That is it.",
    templateData: {
      template: "callout" as const,
      statement: "Naming the habit is the first step.",
      tag: "ACTION STEP",
    },
  },
  {
    id: "scene-19",
    type: "outro" as const,
    voiceText: "Drop a comment with your biggest habit. Tomorrow: why you feel broke even with a raise.",
    templateData: {
      template: "outro" as const,
      ctaTop: "Which habit is yours? 👇",
      channelName: "Money Habits",
      source: "Day 1 of 7 Series",
    },
  },
];

// Canonical 13 scenes for Day 2
const day2Scenes = [
  {
    id: "scene-1",
    type: "hook" as const,
    voiceText: "Here is something that messes with almost everyone: you get a raise, but still feel broke six months later.",
    templateData: {
      template: "hook" as const,
      headline: "A RAISE, STILL BROKE?",
      subhead: "The mystery of lifestyle creep.",
      kenBurns: "zoom-in" as const,
    },
  },
  {
    id: "scene-2",
    type: "body" as const,
    voiceText: "That is called lifestyle creep.",
    templateData: {
      template: "callout" as const,
      statement: "LIFESTYLE CREEP",
      tag: "DEFINITION",
    },
  },
  {
    id: "scene-3",
    type: "body" as const,
    voiceText: "It is not one big dramatic decision.",
    templateData: {
      template: "callout" as const,
      statement: "It is not one big dramatic decision.",
      tag: "THE TRUTH",
    },
  },
  {
    id: "scene-4",
    type: "body" as const,
    voiceText: "It is a slightly nicer apartment, two hundred dollars more a month because 'I can afford it now.'",
    templateData: {
      template: "stat-hero" as const,
      value: "+$200 / MO",
      label: "Apartment Upgrade",
      context: "'I can afford it now'",
    },
  },
  {
    id: "scene-5",
    type: "body" as const,
    voiceText: "It is upgrading from an ordinary used car to a brand-new monthly lease.",
    templateData: {
      template: "comparison" as const,
      left: { label: "Reliable Used Car", value: "Paid Off", color: "cyan" as const },
      right: { label: "New Lease", value: "+$450/mo", color: "purple" as const, winner: true },
    },
  },
  {
    id: "scene-6",
    type: "body" as const,
    voiceText: "It is ordering the appetizer AND dessert instead of just picking one, because why not.",
    templateData: {
      template: "callout" as const,
      statement: "Ordering appetizer AND dessert because 'why not.'",
      tag: "DAILY UPGRADE",
    },
  },
  {
    id: "scene-7",
    type: "body" as const,
    voiceText: "Each choice feels small and completely reasonable in the moment.",
    templateData: {
      template: "callout" as const,
      statement: "Each choice feels reasonable in the moment.",
      tag: "HOW IT HAPPENS",
    },
  },
  {
    id: "scene-8",
    type: "body" as const,
    voiceText: "But stack them up, and your spending rises exactly as fast as your income, or faster.",
    templateData: {
      template: "comparison" as const,
      left: { label: "Income", value: "+20%", color: "cyan" as const },
      right: { label: "Spending", value: "+25%", color: "purple" as const, winner: true },
    },
  },
  {
    id: "scene-9",
    type: "body" as const,
    voiceText: "That promotion was supposed to give you breathing room, but it just gave you a more expensive baseline.",
    templateData: {
      template: "callout" as const,
      statement: "A new, more expensive baseline to maintain.",
      tag: "THE BASELINE TRAP",
    },
  },
  {
    id: "scene-10",
    type: "body" as const,
    voiceText: "You are making twenty percent more, but saving exactly the same amount.",
    templateData: {
      template: "comparison" as const,
      left: { label: "Salary Growth", value: "+20%", color: "cyan" as const },
      right: { label: "Savings Growth", value: "0%", color: "purple" as const },
    },
  },
  {
    id: "scene-11",
    type: "body" as const,
    voiceText: "The fix is not depriving yourself or eating instant noodles.",
    templateData: {
      template: "callout" as const,
      statement: "The fix is not depriving yourself.",
      tag: "MINDSET",
    },
  },
  {
    id: "scene-12",
    type: "body" as const,
    voiceText: "It is just noticing: did my spending go up because I actually wanted this, or because I had cash sitting there?",
    templateData: {
      template: "feature-list" as const,
      title: "ASK THE HONEST QUESTION",
      bullets: [
        "Did I truly want this?",
        "Or was the money just sitting there?",
        "Pause before you upgrade",
      ],
    },
  },
  {
    id: "scene-13",
    type: "outro" as const,
    voiceText: "That one question catches more leaks than any budgeting app. Follow for Day 3.",
    templateData: {
      template: "outro" as const,
      ctaTop: "Has this happened to you? 👇",
      channelName: "Money Habits",
      source: "Day 2 of 7 Series",
    },
  },
];

// Canonical 13 scenes for Day 3
const day3Scenes = [
  {
    id: "scene-1",
    type: "hook" as const,
    voiceText: "You have probably heard 'girl math' — if I paid in cash it is free, if it is under twenty dollars it does not count.",
    templateData: {
      template: "hook" as const,
      headline: "THE 'GIRL MATH' TRAP",
      subhead: "Funny joke, quietly expensive.",
      kenBurns: "zoom-in" as const,
    },
  },
  {
    id: "scene-2",
    type: "body" as const,
    voiceText: "It is funny. It is also quietly expensive.",
    templateData: {
      template: "callout" as const,
      statement: "Funny online, quietly expensive in real life.",
      tag: "REALITY CHECK",
    },
  },
  {
    id: "scene-3",
    type: "body" as const,
    voiceText: "The joke works because it is true for almost everyone, not just one group.",
    templateData: {
      template: "callout" as const,
      statement: "Our brains love cognitive shortcuts.",
      tag: "PSYCHOLOGY",
    },
  },
  {
    id: "scene-4",
    type: "body" as const,
    voiceText: "Our brains are wired to round small numbers down to basically nothing.",
    templateData: {
      template: "callout" as const,
      statement: "Rounding small numbers down to zero.",
      tag: "COGNITIVE BIAS",
    },
  },
  {
    id: "scene-5",
    type: "body" as const,
    voiceText: "A seven-dollar iced coffee does not feel like real spending.",
    templateData: {
      template: "stat-hero" as const,
      value: "$7 COFFEE",
      label: "Daily Coffee",
      context: "Feels like pocket change",
    },
  },
  {
    id: "scene-6",
    type: "body" as const,
    voiceText: "A twelve-dollar phone case 'does not count' because it was on impulse.",
    templateData: {
      template: "stat-hero" as const,
      value: "$12 CASE",
      label: "Impulse Purchase",
      context: "'Doesn't count' in your mind",
    },
  },
  {
    id: "scene-7",
    type: "body" as const,
    voiceText: "We mentally write off these small amounts because facing them feels like too much work.",
    templateData: {
      template: "callout" as const,
      statement: "Mentally writing off small purchases.",
      tag: "DENIAL LOOP",
    },
  },
  {
    id: "scene-8",
    type: "body" as const,
    voiceText: "Those invisible twenty-dollar swipes can easily drain three or four hundred dollars a month untracked.",
    templateData: {
      template: "stat-hero" as const,
      value: "$400 / MO",
      label: "Invisible Swipes",
      context: "Completely untracked every month",
    },
  },
  {
    id: "scene-9",
    type: "body" as const,
    voiceText: "The problem is not the joke.",
    templateData: {
      template: "callout" as const,
      statement: "The problem isn't having fun.",
      tag: "THE TRAP",
    },
  },
  {
    id: "scene-10",
    type: "body" as const,
    voiceText: "It is when the joke becomes the actual system you use to decide what to buy.",
    templateData: {
      template: "callout" as const,
      statement: "When the joke becomes your buying system.",
      tag: "SYSTEM FAILURE",
    },
  },
  {
    id: "scene-11",
    type: "body" as const,
    voiceText: "Try this instead: for one week, write down every 'it does not count' purchase in one place.",
    templateData: {
      template: "feature-list" as const,
      title: "THE 7-DAY CHALLENGE",
      bullets: [
        "Track every 'it doesn't count' purchase",
        "Write down the exact dollar amount",
        "No guilt — just observing facts",
      ],
    },
  },
  {
    id: "scene-12",
    type: "body" as const,
    voiceText: "Not to guilt yourself, just to see the real number.",
    templateData: {
      template: "callout" as const,
      statement: "Awareness is the cure, not guilt.",
      tag: "AWARENESS",
    },
  },
  {
    id: "scene-13",
    type: "outro" as const,
    voiceText: "Most people are shocked by what all the 'free' ones add up to by Sunday. Follow for Day 4.",
    templateData: {
      template: "outro" as const,
      ctaTop: "What's your purchase? 👇",
      channelName: "Money Habits",
      source: "Day 3 of 7 Series",
    },
  },
];

// Canonical 13 scenes for Day 4
const day4Scenes = [
  {
    id: "scene-1",
    type: "hook" as const,
    voiceText: "Emotional spending is not a willpower problem. It is a wiring problem.",
    templateData: {
      template: "hook" as const,
      headline: "EMOTIONAL SPENDING",
      subhead: "Wiring, not willpower.",
      kenBurns: "zoom-in" as const,
    },
  },
  {
    id: "scene-2",
    type: "body" as const,
    voiceText: "When you are stressed or exhausted, buying something gives your brain a real hit of relief for ten minutes.",
    templateData: {
      template: "stat-hero" as const,
      value: "10 MINUTES",
      label: "Dopamine Hit",
      context: "Quick relief, long regret",
    },
  },
  {
    id: "scene-3",
    type: "body" as const,
    voiceText: "Maybe it is a late-night online order, maybe it is a 'treat yourself' run after a hard meeting.",
    templateData: {
      template: "callout" as const,
      statement: "Late-night online cart or 'treat yourself' run.",
      tag: "THE TRIGGER",
    },
  },
  {
    id: "scene-4",
    type: "body" as const,
    voiceText: "That is not weakness. That is biology.",
    templateData: {
      template: "callout" as const,
      statement: "It's not weakness — it's human biology.",
      tag: "BIOLOGY",
    },
  },
  {
    id: "scene-5",
    type: "body" as const,
    voiceText: "The issue is that the relief is short, and the credit card bill is not.",
    templateData: {
      template: "comparison" as const,
      left: { label: "Relief Duration", value: "10 Mins", color: "cyan" as const },
      right: { label: "Credit Card Debt", value: "Months", color: "purple" as const, winner: true },
    },
  },
  {
    id: "scene-6",
    type: "body" as const,
    voiceText: "You are essentially paying a premium just to regulate your mood.",
    templateData: {
      template: "callout" as const,
      statement: "Paying a financial premium to regulate your mood.",
      tag: "MOOD TAX",
    },
  },
  {
    id: "scene-7",
    type: "body" as const,
    voiceText: "Once the package arrives, the stress of paying for it often outweighs the comfort it originally bought you.",
    templateData: {
      template: "callout" as const,
      statement: "The guilt of paying outweighs the relief.",
      tag: "THE CYCLE",
    },
  },
  {
    id: "scene-8",
    type: "body" as const,
    voiceText: "It becomes a cycle of seeking relief and then feeling guilty about the cost.",
    templateData: {
      template: "feature-list" as const,
      title: "THE GUILT LOOP",
      bullets: [
        "1. Stress or exhaustion",
        "2. Quick purchase relief",
        "3. Delivery arrives",
        "4. Guilt & bill stress",
      ],
    },
  },
  {
    id: "scene-9",
    type: "body" as const,
    voiceText: "Here is a habit that works: before you checkout, ask 'what am I feeling right now?'",
    templateData: {
      template: "callout" as const,
      statement: "'What am I feeling right now?'",
      tag: "THE PAUSE",
    },
  },
  {
    id: "scene-10",
    type: "body" as const,
    voiceText: "Do not ask 'do I need this?' — ask what emotion is driving the urge.",
    templateData: {
      template: "comparison" as const,
      left: { label: "Wrong Question", value: "Do I need this?", color: "purple" as const },
      right: { label: "Right Question", value: "What am I feeling?", color: "cyan" as const, winner: true },
    },
  },
  {
    id: "scene-11",
    type: "body" as const,
    voiceText: "Half the time, naming the feeling — tired, bored, anxious — is enough to make the urge pass.",
    templateData: {
      template: "feature-list" as const,
      title: "NAME THE EMOTION",
      bullets: [
        "Tired from work",
        "Bored on phone",
        "Anxious about tomorrow",
      ],
    },
  },
  {
    id: "scene-12",
    type: "body" as const,
    voiceText: "You do not need more discipline.",
    templateData: {
      template: "callout" as const,
      statement: "You do not need more discipline.",
      tag: "TRUTH",
    },
  },
  {
    id: "scene-13",
    type: "outro" as const,
    voiceText: "You need one honest question before the checkout button. Follow for Day 5.",
    templateData: {
      template: "outro" as const,
      ctaTop: "What do you buy? 👇",
      channelName: "Money Habits",
      source: "Day 4 of 7 Series",
    },
  },
];

// Canonical 13 scenes for Day 5
const day5Scenes = [
  {
    id: "scene-1",
    type: "hook" as const,
    voiceText: "Quick challenge: without looking, guess how many subscriptions you are currently paying for.",
    templateData: {
      template: "hook" as const,
      headline: "THE SUBSCRIPTION TEST",
      subhead: "Guess before you check.",
      kenBurns: "zoom-in" as const,
    },
  },
  {
    id: "scene-2",
    type: "body" as const,
    voiceText: "Now go check your bank statement.",
    templateData: {
      template: "callout" as const,
      statement: "Check your bank statement right now.",
      tag: "CHALLENGE",
    },
  },
  {
    id: "scene-3",
    type: "body" as const,
    voiceText: "Most people guess three or four — maybe streaming and one music app.",
    templateData: {
      template: "stat-hero" as const,
      value: "3 - 4 APPS",
      label: "Guessed Subscriptions",
      context: "What people think they pay",
    },
  },
  {
    id: "scene-4",
    type: "body" as const,
    voiceText: "Most people actually have eight to twelve subscriptions draining their card.",
    templateData: {
      template: "stat-hero" as const,
      value: "8 - 12 APPS",
      label: "Actual Subscriptions",
      context: "Cloud, fitness, trials, tools",
    },
  },
  {
    id: "scene-5",
    type: "body" as const,
    voiceText: "Subscriptions are designed to be forgettable — that is not an accident, that is the business model.",
    templateData: {
      template: "callout" as const,
      statement: "Forgettable by design — that is the business model.",
      tag: "HOW IT WORKS",
    },
  },
  {
    id: "scene-6",
    type: "body" as const,
    voiceText: "The moment you stop noticing the charge, it becomes permanent income for someone else.",
    templateData: {
      template: "comparison" as const,
      left: { label: "To You", value: "Unnoticed", color: "purple" as const },
      right: { label: "To Company", value: "Permanent Cash", color: "cyan" as const, winner: true },
    },
  },
  {
    id: "scene-7",
    type: "body" as const,
    voiceText: "Companies literally bank on your friction.",
    templateData: {
      template: "callout" as const,
      statement: "Companies bank on your friction.",
      tag: "FRICTION TAX",
    },
  },
  {
    id: "scene-8",
    type: "body" as const,
    voiceText: "The five minutes it takes to find the cancel button often feels like too much effort on a busy Tuesday.",
    templateData: {
      template: "stat-hero" as const,
      value: "5 MINUTES",
      label: "Cancel Maze",
      context: "Hidden behind multiple menus",
    },
  },
  {
    id: "scene-9",
    type: "body" as const,
    voiceText: "So you put it off, and they get paid for another month.",
    templateData: {
      template: "callout" as const,
      statement: "Put it off, and they get paid again.",
      tag: "THE DELAY TRAP",
    },
  },
  {
    id: "scene-10",
    type: "body" as const,
    voiceText: "Here is the habit: once a month, open your statement and look at every recurring charge for ten seconds.",
    templateData: {
      template: "feature-list" as const,
      title: "THE 10-SECOND AUDIT",
      bullets: [
        "Open bank statement once a month",
        "Scan recurring charges for 10s",
        "Identify unused subscriptions",
      ],
    },
  },
  {
    id: "scene-11",
    type: "body" as const,
    voiceText: "Not to cancel everything — just to actually see it.",
    templateData: {
      template: "callout" as const,
      statement: "Just look with your own eyes.",
      tag: "AWARENESS",
    },
  },
  {
    id: "scene-12",
    type: "body" as const,
    voiceText: "You do not have to be extreme about this. You just have to look.",
    templateData: {
      template: "callout" as const,
      statement: "No extremes. Just awareness.",
      tag: "SIMPLE RULE",
    },
  },
  {
    id: "scene-13",
    type: "outro" as const,
    voiceText: "Comment your real number after checking. Follow for Day 6.",
    templateData: {
      template: "outro" as const,
      ctaTop: "How many did you find? 👇",
      channelName: "Money Habits",
      source: "Day 5 of 7 Series",
    },
  },
];

// Canonical 12 scenes for Day 6
const day6Scenes = [
  {
    id: "scene-1",
    type: "hook" as const,
    voiceText: "If saving money feels impossible, it is probably not a math problem. It is a scarcity mindset problem.",
    templateData: {
      template: "hook" as const,
      headline: "WHY SAVING FEELS HARD",
      subhead: "Scarcity mindset, not math.",
      kenBurns: "zoom-in" as const,
    },
  },
  {
    id: "scene-2",
    type: "body" as const,
    voiceText: "When money has felt tight before, your brain can get stuck treating every dollar like the last one.",
    templateData: {
      template: "callout" as const,
      statement: "Brain treats every dollar like the last one.",
      tag: "PAST TRAUMA",
    },
  },
  {
    id: "scene-3",
    type: "body" as const,
    voiceText: "That makes saving feel unsafe, not smart.",
    templateData: {
      template: "comparison" as const,
      left: { label: "Saving Feels", value: "Unsafe", color: "purple" as const },
      right: { label: "Logic Says", value: "Smart", color: "cyan" as const },
    },
  },
  {
    id: "scene-4",
    type: "body" as const,
    voiceText: "That is why 'just spend less' advice does not work for so many people.",
    templateData: {
      template: "callout" as const,
      statement: "'Just spend less' misses the real fear.",
      tag: "BAD ADVICE",
    },
  },
  {
    id: "scene-5",
    type: "body" as const,
    voiceText: "It is not that you do not know saving is good — it is that saving does not FEEL safe.",
    templateData: {
      template: "callout" as const,
      statement: "Saving doesn't FEEL safe to the brain.",
      tag: "NERVOUS SYSTEM",
    },
  },
  {
    id: "scene-6",
    type: "body" as const,
    voiceText: "Your brain sees holding cash in checking as survival, while moving to savings feels gone forever.",
    templateData: {
      template: "comparison" as const,
      left: { label: "Checking Cash", value: "Survival", color: "cyan" as const },
      right: { label: "Savings Transfer", value: "Gone Forever", color: "purple" as const },
    },
  },
  {
    id: "scene-7",
    type: "body" as const,
    voiceText: "It feels like a loss, not a gain.",
    templateData: {
      template: "callout" as const,
      statement: "It feels like a loss, not a gain.",
      tag: "LOSS AVERSION",
    },
  },
  {
    id: "scene-8",
    type: "body" as const,
    voiceText: "A small habit that helps: start with an amount so small it feels pointless — even five dollars a week.",
    templateData: {
      template: "stat-hero" as const,
      value: "$5 / WEEK",
      label: "Micro-Saving",
      context: "So small it feels pointless",
    },
  },
  {
    id: "scene-9",
    type: "body" as const,
    voiceText: "The goal is not the dollar amount. It is teaching your brain that saved money is still yours.",
    templateData: {
      template: "feature-list" as const,
      title: "TRAIN YOUR BRAIN",
      bullets: [
        "Amount doesn't matter yet",
        "Money isn't gone",
        "Build the safety muscle",
      ],
    },
  },
  {
    id: "scene-10",
    type: "body" as const,
    voiceText: "Teach your nervous system that money in savings is safety, not loss.",
    templateData: {
      template: "callout" as const,
      statement: "Savings equals safety, not loss.",
      tag: "REWIRE",
    },
  },
  {
    id: "scene-11",
    type: "body" as const,
    voiceText: "Once that feels completely safe, the amount can grow easily.",
    templateData: {
      template: "callout" as const,
      statement: "Once safe, the savings will grow.",
      tag: "EXPANSION",
    },
  },
  {
    id: "scene-12",
    type: "outro" as const,
    voiceText: "Safety has to come first. Tell me below: does saving feel unsafe or just boring? Tomorrow: week recap.",
    templateData: {
      template: "outro" as const,
      ctaTop: "Does saving feel unsafe? 👇",
      channelName: "Money Habits",
      source: "Day 6 of 7 Series",
    },
  },
];

// Canonical 15 scenes for Day 7
const day7Scenes = [
  {
    id: "scene-1",
    type: "hook" as const,
    voiceText: "This week: subscription creep, lifestyle creep, girl math, emotional spending, and why saving feels impossible.",
    templateData: {
      template: "hook" as const,
      headline: "5 HABITS RECAP",
      subhead: "One honest question each.",
      kenBurns: "zoom-in" as const,
    },
  },
  {
    id: "scene-2",
    type: "body" as const,
    voiceText: "Five different habits with one big thing in common: none of them are about being bad with money.",
    templateData: {
      template: "callout" as const,
      statement: "None of them are about being bad with money.",
      tag: "THE TRUTH",
    },
  },
  {
    id: "scene-3",
    type: "body" as const,
    voiceText: "They are all about not noticing.",
    templateData: {
      template: "callout" as const,
      statement: "They are all about not noticing.",
      tag: "CORE PROBLEM",
    },
  },
  {
    id: "scene-4",
    type: "body" as const,
    voiceText: "Not one of these needed an overwhelming spreadsheet to fix.",
    templateData: {
      template: "callout" as const,
      statement: "No complicated spreadsheets needed.",
      tag: "SIMPLICITY",
    },
  },
  {
    id: "scene-5",
    type: "body" as const,
    voiceText: "Just one honest question, asked at the right moment.",
    templateData: {
      template: "stat-hero" as const,
      value: "1 QUESTION",
      label: "The Right Moment",
      context: "Stops financial leaks",
    },
  },
  {
    id: "scene-6",
    type: "body" as const,
    voiceText: "We overcomplicate finances because we think the solution has to be as painful as the problem.",
    templateData: {
      template: "callout" as const,
      statement: "Solutions don't have to be painful.",
      tag: "MINDSET",
    },
  },
  {
    id: "scene-7",
    type: "body" as const,
    voiceText: "Mastering your money starts with mastering your attention.",
    templateData: {
      template: "callout" as const,
      statement: "Master your money by mastering your attention.",
      tag: "ATTENTION",
    },
  },
  {
    id: "scene-8",
    type: "body" as const,
    voiceText: "Awareness is the ultimate budget.",
    templateData: {
      template: "stat-hero" as const,
      value: "AWARENESS",
      label: "The Ultimate Budget",
      context: "More powerful than restrictions",
    },
  },
  {
    id: "scene-9",
    type: "body" as const,
    voiceText: "It does not restrict you — it just forces you to be intentional about where your energy goes.",
    templateData: {
      template: "callout" as const,
      statement: "Intentional with your money and energy.",
      tag: "INTENTION",
    },
  },
  {
    id: "scene-10",
    type: "body" as const,
    voiceText: "So here is the recap challenge: pick just ONE of these five habits today.",
    templateData: {
      template: "feature-list" as const,
      title: "PICK JUST ONE HABIT",
      bullets: [
        "1. Subscription creep audit",
        "2. Lifestyle baseline check",
        "3. Track 'free' purchases",
        "4. Name the feeling first",
      ],
    },
  },
  {
    id: "scene-11",
    type: "body" as const,
    voiceText: "Not all five. Just pick one.",
    templateData: {
      template: "stat-hero" as const,
      value: "JUST ONE",
      label: "One Habit At A Time",
      context: "Start where it feels easiest",
    },
  },
  {
    id: "scene-12",
    type: "body" as const,
    voiceText: "You do not need a full budget overhaul.",
    templateData: {
      template: "callout" as const,
      statement: "No full overhaul required.",
      tag: "RELIEF",
    },
  },
  {
    id: "scene-13",
    type: "body" as const,
    voiceText: "You just need one habit you finally see clearly.",
    templateData: {
      template: "callout" as const,
      statement: "One habit you finally see clearly.",
      tag: "CLARITY",
    },
  },
  {
    id: "scene-14",
    type: "body" as const,
    voiceText: "Which one are you starting with? Tell me in the comments below.",
    templateData: {
      template: "callout" as const,
      statement: "Which one are you starting with? 👇",
      tag: "COMMENT",
    },
  },
  {
    id: "scene-15",
    type: "outro" as const,
    voiceText: "Drop the number 1 to 5. I will check back in with you next week. Follow for the next series!",
    templateData: {
      template: "outro" as const,
      ctaTop: "Reply 1 to 5 below! 👇",
      channelName: "Money Habits",
      source: "Complete 7-Day Series",
    },
  },
];

const allDays = [
  { day: 1, title: "3 spending habits quietly making you poorer", scenes: day1Scenes, caption: "Not about being 'bad with money' — it's three quiet habits. Which one hit closest? 👇\n\n#MoneyHabits #PersonalFinance #FinTok #MoneyPsychology" },
  { day: 2, title: "Why you feel broke even when you're not", scenes: day2Scenes, caption: "Getting a raise and still feeling broke isn't bad luck. It's lifestyle creep. Here's what that actually means.\n\n#MoneyHabits #LifestyleCreep #FinTok #PersonalFinance" },
  { day: 3, title: "The 'girl math' trap and what it costs you", scenes: day3Scenes, caption: "'Girl math' is funny because it's true. Here's what it's actually costing most of us.\n\n#MoneyHabits #GirlMath #FinTok #MoneyPsychology" },
  { day: 4, title: "The real reason you buy things you don't need", scenes: day4Scenes, caption: "Emotional spending isn't about willpower. It's about what happens in your brain before you even open the app.\n\n#MoneyHabits #EmotionalSpending #FinTok #MoneyPsychology" },
  { day: 5, title: "Subscription creep — the habit nobody checks", scenes: day5Scenes, caption: "Guess your subscription count, then go check your statement. Most people are off by double.\n\n#MoneyHabits #SubscriptionCreep #FinTok #PersonalFinance" },
  { day: 6, title: "Why saving money feels impossible", scenes: day6Scenes, caption: "If saving feels impossible, it's not about math. Here's what's actually going on.\n\n#MoneyHabits #ScarcityMindset #FinTok #MoneyPsychology" },
  { day: 7, title: "5 money habits, 1 honest question each", scenes: day7Scenes, caption: "5 money habits from this week, one honest question each. Which one are YOU starting with?\n\n#MoneyHabits #FinTok #PersonalFinance #MoneyPsychology" },
];

for (const d of allDays) {
  const dir = join(process.cwd(), "output", `day-${d.day}`);
  mkdirSync(dir, { recursive: true });

  const scriptObj = {
    version: "1.0" as const,
    metadata: {
      title: `Day ${d.day}: ${d.title}`,
      source: {
        url: "https://moneyhabits.local",
        domain: "moneyhabits.local",
        image: null,
      },
      channel: "Money Habits",
    },
    voice: {
      provider: "edge-tts",
      voiceId: "en-US-ChristopherNeural",
      speed: 1.1,
    },
    scenes: d.scenes,
  };

  // Validate with zod
  const validated = ScriptSchema.parse(scriptObj);
  writeFileSync(join(dir, "script.json"), JSON.stringify(validated, null, 2), "utf8");
  writeFileSync(join(dir, "caption.txt"), d.caption, "utf8");

  console.log(`[OK] Day ${d.day} generated with ${d.scenes.length} scenes! (Validated by ScriptSchema)`);
}

console.log("\nAll 7 days setup complete with canonical 12-19 scene breakdowns!");
