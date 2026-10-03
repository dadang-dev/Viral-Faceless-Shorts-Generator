import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import puppeteer from "puppeteer-core";
import { validateBrowserSnapshots, type BrowserGeometrySnapshot, type GeometryBox } from "../src/contracts/visual-collision.js";

const outDir = resolve(process.argv[2] ?? "output/benchmarks/day-2-v12");
const labelArg = process.argv.find(arg => arg.startsWith("--label="));
const label = labelArg?.slice("--label=".length) || "rule-lock";
const htmlPath = join(outDir, "index.html");
const reportPath = join(outDir, `${label}-temporal-collision-report.json`);

type SequenceInfo = { id: string; start: number; end: number; events: number[] };
type RawSnapshot = BrowserGeometrySnapshot;
const box = (r: { x: number; y: number; width: number; height: number }): GeometryBox => ({ x: r.x, y: r.y, w: r.width, h: r.height });

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});
const server = createServer((request, response) => {
  const requested = request.url === "/" ? "/index.html" : request.url ?? "/index.html";
  const file = resolve(outDir, `.${requested.split("?")[0]}`);
  if (!file.startsWith(outDir)) { response.statusCode = 403; response.end(); return; }
  createReadStream(file).on("error", () => { response.statusCode = 404; response.end(); }).pipe(response);
});
await new Promise<void>(done => server.listen(0, "127.0.0.1", () => done()));
const address = server.address();
const port = typeof address === "object" && address ? address.port : 0;
try {
  const page = await browser.newPage();
  page.on("pageerror", error => console.error("TEMPORAL_PAGE_ERROR", error.message));
  page.on("console", message => { if (message.type() === "error") console.error("TEMPORAL_CONSOLE_ERROR", message.text()); });
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "load" });
  await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0, 0); });
  const runtime = await page.evaluate(() => {
    const version = (window as any).gsap?.version;
    const loaded = [...document.fonts].filter(f => f.status === "loaded").map(f => f.family);
    if (!version || !loaded.some(f => f.includes("Anton")) || !loaded.some(f => f.includes("Inter"))) throw new Error("TEMPORAL_RUNTIME: real GSAP and loaded Anton/Inter required; no substitute animation or fallback font QA");
    return { gsapVersion: version, loadedFonts: loaded };
  });
  const sequences = await page.evaluate((): SequenceInfo[] => [...document.querySelectorAll<HTMLElement>(".fm-sequence")].map(scene => {
    const start = Number(scene.dataset.start ?? 0);
    const end = start + Number(scene.dataset.duration ?? 0);
    let events: number[] = [];
    try { events = JSON.parse(scene.dataset.financeEvents ?? "[]").map((event: { atSec: number }) => event.atSec); } catch { /* malformed event data is covered by compile gate */ }
    return { id: scene.id.replace(/^finance-/, ""), start, end, events };
  }));
  const times = new Map<string, number[]>();
  for (const sequence of sequences) {
    const values = new Set<number>();
    const add = (t: number) => { if (t >= sequence.start - .001 && t <= sequence.end + .001) values.add(Number(Math.max(sequence.start, Math.min(sequence.end, t)).toFixed(4))); };
    add(sequence.start); add(sequence.start + Math.min(.36, Math.max(.01, (sequence.end - sequence.start) * .12)));
    add((sequence.start + sequence.end) / 2); add(sequence.end - Math.min(.36, Math.max(.01, (sequence.end - sequence.start) * .12))); add(sequence.end - .001);
    for (let t = sequence.start; t <= sequence.end + .0001; t += .1) add(t);
    for (const event of sequence.events) for (const delta of [-.001, 0, .001, .06, .10, .18, .36, .42]) add(event + delta);
    times.set(sequence.id, [...values].sort((a, b) => a - b));
  }
  const snapshots: RawSnapshot[] = [];
  for (const sequence of sequences) for (const timeSec of times.get(sequence.id) ?? []) {
    const snapshot = await page.evaluate(({ t, sequenceId }): RawSnapshot => {
      const tl = (window as unknown as { __timelines?: Record<string, { time: (time: number, suppressEvents?: boolean) => unknown; pause: () => unknown }> }).__timelines?.["news-video"];
      if (!tl) throw new Error("TEMPORAL_SAMPLER: missing news-video timeline");
      tl.pause(); tl.time(t, true);
      const scene = [...document.querySelectorAll<HTMLElement>(".fm-sequence")].find(item => item.id.replace(/^finance-/, "") === sequenceId);
      const target = scene ?? document.querySelector<HTMLElement>(".fm-sequence");
      if (!target) throw new Error("TEMPORAL_SAMPLER: missing finance sequence");
      return {
        sequenceId: target.id.replace(/^finance-/, ""), timeSec: t,
        elements: [...target.querySelectorAll<HTMLElement>(".fm-element")].map(element => {
          const text = element.querySelector<HTMLElement>(".fm-copy, .fm-number");
          const style = getComputedStyle(element);
          const r = element.getBoundingClientRect(), tr = text?.getBoundingClientRect();
          // Anton glyph ink can exceed its line box while remaining inside the
          // semantic parent. Compare its scroll extent against that parent, not
          // against the line-height box; include the actual animation scale.
          const sx = element.getBoundingClientRect().width / element.offsetWidth;
          const sy = element.getBoundingClientRect().height / element.offsetHeight;
          const er = element.getBoundingClientRect(), ink = text?.getBoundingClientRect();
          const textOverflow = Boolean(text && ink && (
            ink.left + Math.max(text.scrollWidth, text.clientWidth) * sx > er.right - parseFloat(style.paddingRight) * sx + 4 ||
            ink.top + Math.max(text.scrollHeight, text.clientHeight) * sy > er.bottom - parseFloat(style.paddingBottom) * sy + 4 ||
            ink.left < er.left + parseFloat(style.paddingLeft) * sx - 4 ||
            ink.top < er.top + parseFloat(style.paddingTop) * sy - 4
          ));
          return { id: element.dataset.elementId ?? element.id, role: element.dataset.role ?? "", kind: element.dataset.kind ?? "", entityGroup: element.dataset.entityGroup ?? "", opacity: Number.parseFloat(style.opacity || "0"), rect: { x: r.x, y: r.y, w: r.width, h: r.height }, textRect: tr ? { x: tr.x, y: tr.y, w: tr.width, h: tr.height } : undefined, textOverflow, ...(text ? { textMetrics: { clientWidth: text.clientWidth, scrollWidth: text.scrollWidth, clientHeight: text.clientHeight, scrollHeight: text.scrollHeight, fontSize: getComputedStyle(text).fontSize } } : {}) };
        }),
      };
    }, { t: timeSec, sequenceId: sequence.id });
    snapshots.push(snapshot);
  }
  const checked = validateBrowserSnapshots(snapshots);
  const debugTargets = new Set(checked.failures.flatMap(f => f.elements));
  const debugSnapshots = [...debugTargets].flatMap(target => {
    const failure = checked.failures.find(f => f.elements.includes(target));
    const candidates = snapshots.filter(s => s.elements.some(e => e.id === target));
    return candidates.sort((a, b) => Math.abs(a.timeSec - (failure?.timeSec ?? 0)) - Math.abs(b.timeSec - (failure?.timeSec ?? 0))).slice(0, 1);
  });
  const report = { label, status: checked.status, strategy: { sampler: "Chrome + actual getBoundingClientRect", fontLoad: "document.fonts.ready", timeline: "GSAP news-video seek", sampleStepSec: .1, phases: ["entrance", "early-hold", "midpoint", "late-hold", "exit", "event-boundary", "interval"] }, sequenceCount: sequences.length, snapshotCount: snapshots.length, failures: checked.failures, debugSnapshots };
  const inputSha256 = createHash("sha256").update(await readFile(htmlPath)).digest("hex");
  if(process.argv.includes('--preview')){
    const preview=join(outDir,'browser-preview');await mkdir(preview,{recursive:true});
    const plan=JSON.parse(await readFile(join(outDir,'resolved-finance-plan.json'),'utf8'));
    const ids=['months-reveal','home-choice','apartment-cost','metric-secondary','new-lease','dessert','home-stack','spending-rise','spending-faster','wanted','could'];
    for(const sequence of plan.sequences)for(const event of sequence.motionEvents)if(ids.includes(event.id)){
      await page.evaluate((time:number)=>{(window as any).__timelines['news-video'].pause().time(time,true);},event.atSec+.5);
      await page.screenshot({path:join(preview,`${event.id}.png`)});
    }
  }
  await writeFile(reportPath, JSON.stringify({ ...report, runtime, inputSha256 }, null, 2));
  console.log(JSON.stringify({ status: report.status, sequenceCount: report.sequenceCount, snapshotCount: report.snapshotCount, failures: report.failures.length, reportPath }, null, 2));
  if (report.status === "FAIL") process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
