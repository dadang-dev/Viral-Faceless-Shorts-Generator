import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, it, expect } from "vitest";

// Record actual GSAP operations against the archived Day 1/2 DOM and compare
// with their immutable renderer JS. No browser, network, or media writes.
function operations(code: string, html: string) {
  const calls: unknown[] = [];
  const makeNode = (tag: string, id: string): any => ({
    id, dataset: Object.fromEntries([...tag.matchAll(/data-([a-z-]+)="([^"]*)"/g)].map(m => [m[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase()), m[2]])),
    children: [] as any[],
    querySelector(selector: string) { return this.querySelectorAll(selector)[0] ?? null; },
    querySelectorAll(selector: string) { return this.children.filter((child: any) => selector.startsWith(".") ? child.classes?.includes(selector.slice(1)) : selector.startsWith("#") ? child.domId === selector.slice(1) : selector === "[data-emphasis-at]" && child.dataset.emphasisAt !== undefined); },
    appendChild(child: any) { child.classes = [child.className]; child.id = this.id + ":mask"; this.children.push(child); },
  });
  const scenes = [...html.matchAll(/<div class="scene clip"([\s\S]*?)(?=<div class="scene clip"|<audio)/g)].map((match, i) => {
    const scene = makeNode(match[1].split(">")[0], `scene${i}`);
    scene.children = [...match[1].matchAll(/<[^/>]+(?:class|id)="[^>]+>/g)].map((m, j) => {
      const node = makeNode(m[0], `${i}:${j}`);
      node.classes = m[0].match(/class="([^"]*)"/)?.[1].split(" ") ?? [];
      node.domId = m[0].match(/\bid="([^"]*)"/)?.[1];
      return node;
    });
    return scene;
  });
  const flat = scenes.flatMap(s => s.children);
  const shell = makeNode("", "shell-handle");
  const document = {
    getElementById: () => ({ querySelectorAll: () => scenes }),
    querySelectorAll: (selector: string) => flat.filter(n => n.classes.includes(selector.slice(1))),
    querySelector: () => shell,
    createElement: () => makeNode("", "mask"),
  };
  const timeline = Object.fromEntries(["set", "to", "fromTo"].map(method => [method, (node: any, ...args: unknown[]) => calls.push([method, node.id, ...args])]));
  runInNewContext(code, { document, window: {}, gsap: { timeline: () => timeline } });
  return JSON.parse(JSON.stringify(calls));
}
describe("locked Day 1/2 animation behavior", () => {
  it.each([1, 2])("Day %s schedules exactly the same existing GSAP operations", day => {
    const html = readFileSync(`output/day-${day}/index.html`, "utf8");
    const before = operations(readFileSync(`output/day-${day}/animations.js`, "utf8"), html);
    const after = operations(readFileSync("src/render/templates/animations.js", "utf8"), html);
    expect(before.length).toBeGreaterThan(40);
    expect(after).toEqual(before);
  });
});
