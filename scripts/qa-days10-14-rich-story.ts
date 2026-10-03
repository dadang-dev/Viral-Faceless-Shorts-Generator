import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { join, resolve } from "node:path";
import puppeteer from "puppeteer-core";
import { VISUAL_SAFE_FRAME } from "../src/contracts/visual-collision.js";
import { DAY_STORY_SPECS, type StoryDay } from "../src/day10-14-rich-story.js";

const day = Number(process.argv[2]) as StoryDay;
const spec = DAY_STORY_SPECS[day];
if (!spec) throw new Error("Use Day 10–14");
const label = process.argv.find(arg => arg.startsWith("--label="))?.slice(8) ?? "story";
if (!/^[a-z0-9-]+$/.test(label)) throw new Error("DAY10_14_QA_INVALID_LABEL");
const out = resolve(`output/benchmarks/day-${day}-v12-differentactually`);
const html = join(out, "index.html");
const plan = JSON.parse(await readFile(join(out, "resolved-finance-plan.json"), "utf8"));
const server = createServer((request, response) => {
  const requested = request.url === "/" ? "/index.html" : request.url ?? "/index.html";
  const file = resolve(out, `.${requested.split("?")[0]}`);
  if (!file.startsWith(out)) { response.statusCode = 403; response.end(); return; }
  createReadStream(file).on("error", () => { response.statusCode = 404; response.end(); }).pipe(response);
});
await new Promise<void>(done => server.listen(0, "127.0.0.1", done));
const address = server.address();
if (!address || typeof address === "string") throw new Error("DAY10_14_QA_SERVER_ADDRESS");
const browser = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true, args: ["--no-sandbox", "--disable-gpu"] });
const pageErrors: string[] = [], resourceErrors: string[] = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") resourceErrors.push(message.text()); });
  page.on("response", response => { if (response.status() >= 400) resourceErrors.push(`${response.status()} ${response.url()}`); });
  await page.evaluateOnNewDocument("window.__name = (fn, name) => fn");
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${address.port}/index.html`, { waitUntil: "load" });
  const runtime = await page.evaluate(async () => {
    await document.fonts.ready;
    const win = window as any;
    if (!win.gsap || !win.__timelines?.["news-video"] || !Array.isArray(win.__batchStoryEvents)) throw new Error("DAY10_14_STORY_RUNTIME_MISSING");
    const fonts = [...document.fonts].filter(font => font.status === "loaded").map(font => font.family);
    if (!fonts.some(font => font.includes("Anton")) || !fonts.some(font => font.includes("Inter"))) throw new Error("DAY10_14_STORY_FONTS_MISSING");
    return { gsapVersion: win.gsap.version, fonts, events: win.__batchStoryEvents as Array<{ event: string; selector: string; at: number; duration: number; sequence: string }> };
  });
  const expectedEvents = spec.sequences.reduce((sum, sequence) => sum + sequence.reveals.length, 0);
  if (runtime.events.length !== expectedEvents) throw new Error(`DAY10_14_STORY_STEP_COUNT: ${runtime.events.length}/${expectedEvents}`);
  const times = new Set<number>();
  for (const sequence of plan.sequences) {
    times.add(sequence.startSec);
    times.add((sequence.startSec + sequence.endSec) / 2);
    times.add(sequence.endSec - .01);
  }
  for (const event of runtime.events) for (const delta of [-.01, .01, event.duration / 2, event.duration + .05]) times.add(Math.max(0, Number((event.at + delta).toFixed(4))));
  const forward = [...times].sort((a, b) => a - b);
  const samples = [...forward, ...forward.slice().reverse()];
  const checks = await page.evaluate(({ samples, events, safe }) => {
    const timeline = (window as any).__timelines["news-video"];
    const failures: Array<Record<string, unknown>> = [];
    let stages = 0, primitives = 0;
    const opacity = (element: Element) => { let value = 1; for (let node: Element | null = element; node; node = node.parentElement) value *= Number.parseFloat(getComputedStyle(node).opacity || "0"); return value; };
    for (const time of samples) {
      timeline.pause().time(time, true);
      for (const svg of document.querySelectorAll<SVGSVGElement>(".day10to14-story-art")) {
        if (opacity(svg) < .03) continue;
        stages++;
        const outer = svg.getBoundingClientRect();
        if (outer.left < safe.left - .1 || outer.right > safe.right + .1 || outer.top < safe.top - .1 || outer.bottom > safe.bottom + .1) failures.push({ kind: "STAGE_OUTSIDE_SAFE_FRAME", time, rect: { x: outer.x, y: outer.y, w: outer.width, h: outer.height } });
        for (const primitive of svg.querySelectorAll<SVGGraphicsElement>("path,rect,circle,ellipse,line,polyline,polygon")) {
          if (opacity(primitive) < .03) continue;
          const rect = primitive.getBoundingClientRect();
          if (rect.width + rect.height < 1) continue;
          primitives++;
          if (rect.left < outer.left - 6 || rect.right > outer.right + 6 || rect.top < outer.top - 6 || rect.bottom > outer.bottom + 6) failures.push({ kind: "STORY_ART_CLIPPED", time, part: primitive.closest("[data-story-part]")?.getAttribute("data-story-part") });
        }
      }
    }
    const reveals = events.map(event => {
      const element = document.querySelector(event.selector);
      if (!element) { failures.push({ kind: "MISSING_REVEAL", event: event.event }); return { event: event.event, before: 1, after: 0 }; }
      timeline.pause().time(Math.max(0, event.at - .002), true);
      const before = Number.parseFloat(getComputedStyle(element).opacity || "0");
      timeline.pause().time(event.at + event.duration + .05, true);
      const after = Number.parseFloat(getComputedStyle(element).opacity || "0");
      if (before > .03 || after < .6) failures.push({ kind: "REVEAL_TIMING", event: event.event, before, after });
      return { event: event.event, before, after };
    });
    return { failures, stages, primitives, reveals };
  }, { samples, events: runtime.events, safe: VISUAL_SAFE_FRAME });
  if (process.argv.includes("--preview")) {
    const dir = join(out, "browser-preview");
    await mkdir(dir, { recursive: true });
    for (const sequence of plan.sequences) {
      const time = Math.max(sequence.startSec + .4, sequence.endSec - 1.1);
      await page.evaluate((value: number) => { (window as any).__timelines["news-video"].pause().time(value, true); }, time);
      await page.screenshot({ path: join(dir, `${sequence.id}.png`) });
    }
  }
  const failures = [...checks.failures, ...pageErrors.map(error => ({ kind: "PAGE_ERROR", error }))];
  const report = { status: failures.length ? "FAIL" : "PASS", day, label, gsapVersion: runtime.gsapVersion, fonts: runtime.fonts, sampleCount: samples.length, stageChecks: checks.stages, primitiveChecks: checks.primitives, revealChecks: checks.reveals.length, reveals: checks.reveals, failures, resourceErrors, htmlSha256: createHash("sha256").update(await readFile(html)).digest("hex") };
  await writeFile(join(out, `${label}-illustration-qa.json`), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify({ status: report.status, day, samples: report.sampleCount, primitives: report.primitiveChecks, reveals: report.revealChecks, failures: report.failures.slice(0, 10), resourceErrors: report.resourceErrors.slice(0, 3) }, null, 2));
  if (failures.length) process.exitCode = 1;
} finally {
  await browser.close();
  await new Promise<void>(done => server.close(() => done()));
}
