from copy import deepcopy


WORKFLOW_RULES = {
    "aspect_ratio": "9:16 vertical",
    "scene_alignment": "one complete spoken idea per scene; boundaries must fall between subtitle cues",
    "title_card": "keep the complete hook or topic phrase visible for its entire spoken scene",
    "prompt_numbers": "include every amount, count, percentage, and time period stated by the scene voice",
    "image_layout": "reserve upper headline space and the right-side TikTok UI safe zone",
    "reference": "use the same attached Character & Props reference for every day",
    "attach_all": "the first numeric sequence in each filename is the scene number",
    "generated_text": "only exact short labels explicitly required by the scene prompt",
}


DAY_TITLE_CARDS = {
    1: {
        "1": {"kicker": "MONEY HABITS", "lines": ["YOU’RE NOT BAD", "WITH MONEY"]},
        "2": {"kicker": "THE REAL PROBLEM", "lines": ["3 QUIET HABITS"]},
        "3": {"kicker": "NUMBER ONE", "lines": ["SUBSCRIPTION", "CREEP"]},
        "8": {"kicker": "NUMBER TWO", "lines": ["CONVENIENCE", "SPENDING"]},
        "12": {"kicker": "NUMBER THREE", "lines": ["ROUNDING DOWN"]},
    },
    2: {
        "1": {"kicker": "MONEY HABITS", "lines": ["A RAISE,", "STILL BROKE?"]},
        "2": {"kicker": "THE PATTERN", "lines": ["LIFESTYLE CREEP"]},
        "12": {"kicker": "ASK YOURSELF", "lines": ["DID I WANT IT?", "OR JUST HAVE CASH?"]},
    },
    3: {
        "1": {"kicker": "MONEY HABITS", "lines": ["GIRL MATH?"]},
        "2": {"kicker": "THE REAL COST", "lines": ["QUIETLY", "EXPENSIVE"]},
        "11": {"kicker": "TRY THIS", "lines": ["TRACK IT", "FOR 7 DAYS"]},
    },
    4: {
        "1": {"kicker": "EMOTIONAL SPENDING", "lines": ["NOT WILLPOWER", "IT’S WIRING"]},
        "4": {"kicker": "REMEMBER", "lines": ["NOT WEAKNESS", "IT’S BIOLOGY"]},
        "9": {"kicker": "BEFORE CHECKOUT", "lines": ["WHAT AM I", "FEELING?"]},
    },
    5: {
        "1": {"kicker": "QUICK CHALLENGE", "lines": ["HOW MANY", "SUBSCRIPTIONS?"]},
        "5": {"kicker": "THE BUSINESS MODEL", "lines": ["FORGETTABLE", "BY DESIGN"]},
        "10": {"kicker": "THE HABIT", "lines": ["ONCE A MONTH", "JUST LOOK"]},
    },
    6: {
        "1": {"kicker": "WHY SAVING FEELS HARD", "lines": ["SCARCITY", "MINDSET"]},
        "3": {"kicker": "THE FEELING", "lines": ["SAVING FEELS", "UNSAFE"]},
        "8": {"kicker": "START SMALL", "lines": ["$5 A WEEK"]},
    },
    7: {
        "1": {"kicker": "WEEK RECAP", "lines": ["5 MONEY HABITS"]},
        "2": {"kicker": "THE COMMON THREAD", "lines": ["NOT NOTICING"]},
        "7": {"kicker": "THE ULTIMATE BUDGET", "lines": ["AWARENESS"]},
        "10": {"kicker": "THE RECAP CHALLENGE", "lines": ["PICK JUST ONE"]},
    },
}


def title_cards_for_day(day: int) -> dict:
    return deepcopy(DAY_TITLE_CARDS.get(day, {}))
