import { readFile, writeFile, copyFile } from "node:fs/promises";
import { resolve, join, relative } from "node:path";
import { ScriptSchema } from "../src/render/script-schema.js";
import { APPROVED_SCRIPT_FILE, AUXILIARY_SCRIPT_FILE, NumberHighlightFileSchema, extractApprovedVoiceOver, assertScriptIntegrity, assertMoneyHabitsTheme, resolveNumberHighlights } from "../src/contracts/content-contract.js";
import { compileFinancePlan } from "../src/contracts/finance-motion.js";
import { resolveHeroCaptions, editorialKaraokeAss } from "../src/contracts/hero-captions.js";
import { composeHtml } from "../src/render/html-composer.js";
import { renderWithHyperframes } from "../src/render/hyperframes-runner.js";
import { burnSubtitles } from "../src/assets/subtitle-tools.js";
import { getVideoDurationSec } from "../src/assets/audio-tools.js";
import { planOutroDwell } from "../src/contracts/production-duration.js";
import { assertBenchmarkDestination } from "../src/contracts/benchmark-isolation.js";
import { LOCKED_PAGE_BRAND } from "../src/brand-config.js";

const out = resolve("output/benchmarks/day-2-v12");
assertBenchmarkDestination(out);
const json = async (p: string) => JSON.parse(await readFile(p, "utf8"));
const script = ScriptSchema.parse(await json(join(out, "script.json")));
const transcript = await json(join(out, "transcript.json"));
const input = await json(join(out, "data_visualizations.json"));
const approved = extractApprovedVoiceOver(await readFile(APPROVED_SCRIPT_FILE, "utf8"), 2);
assertScriptIntegrity(script, approved);
const finance = compileFinancePlan(input, script, transcript, approved);
const captions = resolveHeroCaptions(await json(join(out, "hero-captions.json")), finance, transcript);
const numbers = NumberHighlightFileSchema.parse(await json(join(out, "number_highlights.json")));
const highlights = resolveNumberHighlights(numbers, transcript);
const baselineHtml = await readFile("output/day-2/index.html", "utf8");
const tiktok = { displayName: LOCKED_PAGE_BRAND.displayName, handle: LOCKED_PAGE_BRAND.handle, followers: baselineHtml.match(/class="tt-followers">([^<]*)/)?.[1] ?? "Daily money habits" };
const dwell = planOutroDwell(transcript, .2, 3);
const day2PatchCss = `
#fm-raise-hook-months .fm-number{font-size:92px;line-height:1.05}
#fm-choice-accumulation-apartment-cost .fm-number{font-size:106px;line-height:1.05}
#fm-choice-accumulation-apartment-cost .fm-number-long{font-size:94px}
#fm-choice-accumulation-apartment-cost .fm-metric-step{top:0}
#fm-choice-accumulation-apartment-cost .fm-copy{font-size:40px}
`;
const html = composeHtml({
  script,
  financePlan: finance,
  sceneAudio: transcript.scenes.map((s: any) => ({ id: s.id, durationSec: s.durationMs / 1000, lastWordEndSec: s.words.at(-1).endMs / 1000 })),
  gapSec: .2,
  bgImageRelPath: null,
  audioRelPath: "voice.mp3",
  tiktok,
  tiktokAvatarRelPath: "tiktok-avatar.svg",
  outroHoldSec: dwell.outroHoldSec,
  numberHighlights: highlights,
}).replace("</head>", `<style id="day2-v12-visual-patch">${day2PatchCss}</style></head>`);
const css = await readFile("src/render/templates/styles.css", "utf8");
assertMoneyHabitsTheme(css, html);
await writeFile(join(out, "index.html"), html);
await copyFile("src/render/templates/styles.css", join(out, "styles.css"));
await copyFile(LOCKED_PAGE_BRAND.avatarAsset, join(out, "tiktok-avatar.svg"));
await writeFile(join(out, "subtitles.ass"), editorialKaraokeAss(transcript, captions, script));
await renderWithHyperframes({ compositionDir: relative(process.cwd(), out), outputPath: relative(process.cwd(), join(out, "video-raw.mp4")) });
await burnSubtitles({ videoInput: join(out, "video-raw.mp4"), srtPath: join(out, "subtitles.ass"), videoOutput: join(out, "video.mp4"), fontSize: 46, marginV: 450 });
console.log(JSON.stringify({ status: "RENDER_ONLY_PASS", durationSec: await getVideoDurationSec(join(out, "video.mp4")), output: join(out, "video.mp4") }, null, 2));
