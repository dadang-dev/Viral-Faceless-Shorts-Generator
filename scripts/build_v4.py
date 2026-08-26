"""Build the approved 47-scene derived input without changing locked v3 copy."""

from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "money-habits-ALL-v3.md"
TARGET = ROOT / "money-habits-ALL-v4.md"

STYLE = "[+ Style Bible]"

# title, duration, video prompt. Durations cover the locked VO semantic ranges;
# they are production targets, not instructions to time-stretch generated clips.
SCENES = {
    1: [
        ("Hook: Ví tiền rò rỉ", 6, "one adult editorial stick-figure character centered on a deep navy background, warm off-white body with thick clean navy outlines and one small muted-gold cuff accent, during the six-second shot the character performs one clear continuous action: raises one simple cream wallet to chest height, notices it becoming lighter, gently tilts the wallet, then lowers their head and shoulders to follow exactly three muted-gold coins falling through one small hole in the wallet and disappearing below the frame, the hands arms head and shoulders visibly move with natural restrained timing, finish with a short concerned pause while looking at the empty wallet, one character one financial object and one action arc only, sophisticated minimal editorial illustration rather than a children's cartoon, subtle paper grain, strong central composition, large empty caption-safe space above the character, no frozen pose, no text, no letters, no numbers, no logos, no arrows, no charts, no extra coins, no extra objects, no detailed face, no photorealism"),
        ("Subscription creep", 13, "the same adult editorial stick-figure character with warm off-white body thick clean navy outlines and one small muted-gold cuff accent stands centered on a deep navy background holding one smartphone, during the shot the character taps the phone once and exactly four blank cream subscription tiles appear one at a time in a neat vertical stack beside the phone, after each tile appears one muted-gold coin leaves the character's small wallet, the character's free hand gradually lowers and their shoulders subtly sink as the repeated charges become noticeable, hands arms head and shoulders visibly move with natural restrained timing, finish with the character looking from the phone to the lighter wallet, one character and one clear repeated-payment action arc, sophisticated minimal editorial illustration, subtle paper grain, large empty caption-safe space above, no frozen pose, no text, no letters, no numbers, no prices, no logos, no app symbols, no extra tiles, no extra objects, no detailed face, no photorealism"),
        ("Convenience spending", 14, "the same adult editorial stick-figure character with warm off-white body thick clean navy outlines and one small muted-gold cuff accent sits centered on a simple cream chair against a deep navy background, looking tired while holding one smartphone, during the shot the character taps the phone once and one simple cream takeout delivery bag slides in, then repeats the same tap two more times as a second and third bag arrive, exactly one muted-gold coin leaves the wallet after each order, the character reaches for each bag then notices the growing stack and lighter wallet, hands arms head and shoulders visibly move with natural restrained timing, one character one phone and one repeated ordering action arc, sophisticated minimal editorial illustration, subtle paper grain, large empty caption-safe space above, no frozen pose, no grocery basket, no chart, no text, no letters, no numbers, no logos, no extra bags, no extra objects, no detailed face, no photorealism"),
        ("Rounding down", 14, "the same adult editorial stick-figure character with warm off-white body thick clean navy outlines and one small muted-gold cuff accent stands centered at one small cream counter on a deep navy background holding one takeaway coffee cup, during the shot the character casually pays one muted-gold coin for the cup, takes a small sip and shrugs as if the purchase feels insignificant, the same simple purchase gesture repeats two more times while a small pile of muted-gold coins quietly grows beside the cup, the character finally notices the larger pile and straightens with surprised concerned body language, hands arms head and shoulders visibly move with natural restrained timing, one character one coffee cup and one repeated-purchase action arc, sophisticated minimal editorial illustration, subtle paper grain, large empty caption-safe space for numeric overlays, no frozen pose, no generated text, no letters, no generated numbers, no charts, no logos, no extra cups, no extra objects, no detailed face, no photorealism"),
        ("Reframe: thói quen chạy nền", 6, "the same adult editorial stick-figure character with warm off-white body thick clean navy outlines and one small muted-gold cuff accent walks calmly in place at the center of a deep navy background, behind the character exactly three small cream icons, one smartphone one delivery bag and one coffee cup, move slowly and quietly along a single circular path, the character initially does not notice them, then turns their head slightly over one shoulder near the end as the icons continue moving in the background, arms head shoulders and walking posture visibly move with natural restrained timing, one character and one awareness action arc, sophisticated minimal editorial illustration, subtle paper grain, large empty caption-safe space above, no frozen pose, no warning signs, no text, no letters, no numbers, no logos, no extra icons, no extra objects, no detailed face, no photorealism"),
        ("Action: gọi tên một thói quen", 9, "the same adult editorial stick-figure character with warm off-white body thick clean navy outlines and one small muted-gold cuff accent stands centered behind exactly three simple cream icons arranged in one clean horizontal row, one smartphone one delivery bag and one coffee cup, during the shot the character looks across the three icons, pauses, then deliberately reaches forward and points to the coffee cup, only the selected coffee cup receives a warm muted-gold spotlight while the other two icons fade slightly, the character finishes with a small confident nod, head arm hand and shoulders visibly move with natural restrained timing, one character and one clear choose-one action arc, sophisticated minimal editorial illustration, subtle paper grain, generous empty caption-safe space above, no frozen pose, no labels, no text, no letters, no numbers, no logos, no extra icons, no extra objects, no detailed face, no photorealism"),
    ],
    2: [
        ("Hook: Raise nhưng vẫn broke", 9, "two paycheck cards labeled five years ago and today count upward together while available breathing room stays narrow"),
        ("Lifestyle creep examples", 17, "apartment icon grows slightly nicer, used car morphs into a new lease, appetizer and dessert appear in a clean sequential animation"),
        ("Small choices stack", 10, "small expense blocks stack upward until a spending bar catches an income bar, clear minimal comparison"),
        ("Promotion becomes baseline", 9, "pay raise lifts an expensive baseline floor instead of opening empty breathing room above it"),
        ("Income up, savings flat", 5, "side by side bars, income rises twenty percent while savings remains perfectly flat, no extra text beyond simple labels"),
        ("Wanted vs money available", 10, "speech bubble question branches into two clean choices, genuinely wanted versus money was available"),
        ("Honest question catches leaks", 6, "magnifying glass scans a spending chart and reveals several small gold leaks, calm closing motion"),
    ],
    3: [
        ("Hook: Girl math", 11, "playful speech bubble saying basically free appears while a small gold cost counter keeps ticking upward"),
        ("Brain rounds small numbers down", 9, "small price tags visually shrink and round toward zero inside a simple brain outline"),
        ("Coffee and phone-case examples", 14, "seven dollar coffee and twelve dollar phone case tags slide into a growing purchase pile"),
        ("Invisible swipes drain account", 8, "repeated twenty dollar card swipes drain a bank balance meter toward a three-to-four-hundred monthly total"),
        ("Joke becomes buying system", 7, "playful joke bubble morphs into a repeating checkout decision flow, tone shifts from playful to clear"),
        ("One-week tracking exercise", 10, "notebook and pen record small purchases one by one across a seven-day row, gold checkmarks"),
        ("Sunday total reveal", 6, "all small purchase tags combine into one large gold total that settles with a subtle glow"),
    ],
    4: [
        ("Hook: Wiring, not willpower", 5, "brain icon with a stress cloud sends a gold arrow toward a shopping bag"),
        ("Triggers and short relief", 15, "stress boredom and exhaustion icons lead to an online order and coffee, then a ten-minute clock ring drains quickly"),
        ("Mood premium", 12, "relief meter falls quickly while a bill remains on screen, gold coins move from mood gauge to checkout"),
        ("Package, bill, guilt cycle", 13, "package arrives, bill appears, stress cloud returns, forming one clear finite circular sequence"),
        ("Question before checkout", 8, "shopping cart pauses before checkout and a speech bubble asks what am I feeling right now"),
        ("Name the feeling", 9, "labels tired bored anxious appear one by one while an urge meter gently falls"),
        ("Honest-question close", 6, "checkout button stops glowing as a single gold question mark remains, calm closing motion"),
    ],
    5: [
        ("Hook: Guess then check", 8, "grid of subscription app icons highlights one by one while a counter rises, then a bank statement slides in"),
        ("Guess versus actual", 13, "guess four versus actual eleven comparison, cloud trial and fitness icons reveal behind the larger number"),
        ("Forgettable by design", 6, "subscription tiles fade from attention while recurring charge indicators remain bright and active"),
        ("Permanent income from friction", 8, "recurring arrows move gold coins from a bank account to a company every month"),
        ("Cancel friction", 13, "cursor travels through a short cancellation maze, pauses, then calendar flips and another charge appears"),
        ("Monthly review habit", 10, "calendar marks one monthly review day while a magnifier scans each recurring line on a statement"),
        ("Just look", 5, "bank statement rests clearly under a magnifying glass, no delete or panic symbols, calm close"),
    ],
    6: [
        ("Hook: Scarcity mindset", 7, "piggy bank icon with gold coins bouncing off instead of going in, restrained frustrated motion"),
        ("Past scarcity feels unsafe", 14, "timeline from past money stress to a present brain shield that blocks a savings coin"),
        ("Spend-less advice misses fear", 12, "simple just spend less advice card slides past while a deeper fear layer remains visible underneath"),
        ("Checking versus savings", 11, "split checking and savings accounts, coin transfer looks like disappearance until both balances are shown together"),
        ("Start with five dollars", 7, "small five-dollar coin drops gently into a piggy bank with a warm successful response"),
        ("Retrain safety", 7, "protective shield changes from blocking the coin to safely surrounding the savings account"),
        ("Grow after safety", 6, "piggy bank fills gradually beside a gentle upward progress bar and increasing gold glow"),
    ],
    7: [
        ("Recap five habits", 8, "wallet paycheck speech bubble brain subscription grid and piggy bank icons highlight rapidly in sequence"),
        ("Common thread: noticing", 9, "five habit icons move together into one warm attention spotlight, no blame symbols"),
        ("One honest question", 13, "complex spreadsheet shrinks into the background while one simple question card moves to the center"),
        ("Awareness is the budget", 14, "attention spotlight guides energy toward intentional choices, clean balanced paths without restriction imagery"),
        ("Choose one habit", 17, "numbers one to five appear in a row, one is selected and circled while the other four remain calmly available"),
        ("Comment and follow-up", 7, "speech bubble with reply arrow pulses gently, small next-week calendar marker appears"),
    ],
}


def build_part2() -> str:
    lines = [
        "# PHẦN 2 — Prompt ảnh/video AI cho từng cảnh",
        "",
        "# Prompt AI (Text-to-Video) — 7 ngày Money Habits — Scene Structure v2",
        "",
        "> Derived from the approved Step 4 timing audit. Voice-over v3 and Style Bible are unchanged.",
        "> Durations are target coverage for editing; do not fill gaps with fake slow motion, long freeze frames, or infinite loops.",
        "",
    ]
    day_titles = {
        1: '"3 spending habits quietly making you poorer"',
        2: '"Why you feel broke even when you\'re not"',
        3: '"The girl math trap"',
        4: '"The real reason you buy things you don\'t need"',
        5: '"Subscription creep"',
        6: '"Why saving money feels impossible"',
        7: 'Week Recap: "5 money habits, 1 honest question each"',
    }
    for day, scenes in SCENES.items():
        lines.extend([f"## Day {day} — {day_titles[day]}", ""])
        for index, (title, duration, concept) in enumerate(scenes, 1):
            style_clause = "" if day == 1 else f", {STYLE}"
            prompt = (
                f"{concept}{style_clause}, smooth purposeful motion, camera stable, "
                f"no watermark, 9:16 vertical, {duration} seconds"
            )
            lines.extend([
                f"**Cảnh {index} — {title}** [1-step]",
                f"- *Prompt video:* `{prompt}`",
                "",
            ])
        lines.append("---")
        lines.append("")
    return "\n".join(lines).rstrip()


def main() -> None:
    content = SOURCE.read_text(encoding="utf-8")
    match = re.search(
        r"# PHẦN 2 — Prompt ảnh/video AI cho từng cảnh.*?(?=\n# PHẦN 3 —)",
        content,
        flags=re.DOTALL,
    )
    if not match:
        raise RuntimeError("PHẦN 2 boundary not found in v3")
    output = content[: match.start()] + build_part2() + "\n\n" + content[match.end() :]
    TARGET.write_text(output, encoding="utf-8")
    print(f"Created {TARGET} with {sum(map(len, SCENES.values()))} scenes")


if __name__ == "__main__":
    main()
