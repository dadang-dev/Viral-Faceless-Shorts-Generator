import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Script, TemplateDataType } from "./script-schema.js";
import type { TiktokConfig } from "../config.js";
import type { ResolvedVisualCue } from "../planning/scene-dynamics.js";
import type { ResolvedFinancePlan } from "../contracts/finance-motion.js";
import { renderFinanceSequence } from "./finance-renderer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TPL_DIR = join(__dirname, "templates");
const SCENE_CROSSFADE_SEC = 0.18;

// Grain overlay HTML inline (from installed component)
const GRAIN_OVERLAY_HTML = `<div id="grain-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100;"><div class="grain-texture"></div></div>`;

// Vignette — darkens far edges so content doesn't feel like it's floating in a flat void.
const VIGNETTE_HTML = `<div class="vignette"></div>`;

// Default TikTok config (used if not passed)
const DEFAULT_TIKTOK: TiktokConfig = {
  displayName: "CườngIT",
  handle: "@cuongit96",
  followers: "2k followers",
};

export interface SceneAudio {
  id: string;
  durationSec: number;
  lastWordEndSec?: number;
}

export interface ResolvedNumberHighlight {
  sceneId: string;
  target: string;
  startSec: number;
  endSec: number;
}

export interface ComposeArgs {
  script: Script;
  sceneAudio: SceneAudio[];
  gapSec: number;
  bgImageRelPath: string | null;   // null => no image available
  audioRelPath: string;
  /** TikTok follow card config (injected into outro scene). Optional — defaults used if omitted. */
  tiktok?: TiktokConfig;
  /** Relative path to avatar image inside the output dir (e.g. "tiktok-avatar.jpg"). */
  tiktokAvatarRelPath?: string;
  /** Extra seconds added to outro scene visual duration after voice ends (TikTok card hold). Default 3. */
  outroHoldSec?: number;
  numberHighlights?: ResolvedNumberHighlight[];
  visualCues?: ResolvedVisualCue[];
  /** Validated opt-in v1.2 sequence overlay. Legacy output is unchanged when absent. */
  financePlan?: ResolvedFinancePlan;
}

export function composeHtml(args: ComposeArgs): string {
  const { script, sceneAudio, gapSec, bgImageRelPath, audioRelPath } = args;
  const tiktok = args.tiktok ?? DEFAULT_TIKTOK;
  const tiktokAvatar = args.tiktokAvatarRelPath ?? "tiktok-avatar.jpg";
  const outroHoldSec = args.outroHoldSec ?? 3;

  // Compute timing per scene. Outro scene gets extra HOLD seconds so the
  // TikTok follow card stays visible after the voice ends.
  let cursor = 0;
  const timing = script.scenes.map((scene, index) => {
    const audio = sceneAudio.find((a) => a.id === scene.id);
    if (!audio) throw new Error(`No audio entry for scene id=${scene.id}`);
    const isOutro = scene.type === "outro";
    const audioStart = cursor;
    const visualStart = index === 0 ? 0 : Math.max(0, audioStart - SCENE_CROSSFADE_SEC);
    const audioOffset = audioStart - visualStart;
    const visualEnd = audioStart + audio.durationSec + gapSec + (isOutro ? outroHoldSec : 0);
    const duration = visualEnd - visualStart;
    const spokenEnd = audioOffset + (audio.lastWordEndSec ?? audio.durationSec);
    cursor = visualEnd;
    return { scene, start: visualStart, duration, audioOffset, spokenEnd };
  });
  const totalDuration = cursor;

  // Render scenes
  const sceneHtml = timing.map(({ scene, start, duration, audioOffset, spokenEnd }) => {
    const finance = args.financePlan?.sequences.find(s => s.sceneIds.includes(scene.id));
    if (finance) {
      const main = finance.sceneIds[0] === scene.id ? renderFinanceSequence(finance, args.financePlan!) : "";
      if(args.financePlan?.editorial && scene.type === "outro" && scene.templateData.template === "outro") {
        const inner=renderEditorialOutro(scene.templateData,tiktok,tiktokAvatar);
        return main + buildScene(scene,start,duration,audioOffset,spokenEnd,"outro",inner,[]).replace('data-layout="outro"','data-layout="outro" data-editorial-outro="true"');
      }
      return main;
    }
    return renderScene(scene, start, duration, audioOffset, spokenEnd, args.numberHighlights ?? [], bgImageRelPath, tiktok, tiktokAvatar, args.visualCues ?? []);
  }).join("\n");

  // Persistent shell — uses tiktok handle in footer
  const shellHtml = renderShell(script.metadata, tiktok, Boolean(args.financePlan?.editorial));

  const animJs = readFileSync(join(TPL_DIR, "animations.js"), "utf8")
    + (args.financePlan ? "\n" + readFileSync(join(TPL_DIR, "finance-animations.js"), "utf8") : "");

  const tpl = readFileSync(join(TPL_DIR, "base.html.tmpl"), "utf8");
  return tpl
    .replace("{{TITLE}}", escapeHtml(script.metadata.title))
    .replace("</head>", args.financePlan ? `<style>${readFileSync(join(TPL_DIR, "finance.css"), "utf8")}</style></head>` : "</head>")
    .replace(/\{\{TOTAL_DURATION\}\}/g, totalDuration.toFixed(2))
    .replace("{{SHELL}}", shellHtml)
    .replace("{{SCENES}}", sceneHtml)
    .replace(/src="voice\.mp3"/g, `src="${audioRelPath}"`)
    .replace('<script src="animations.js"></script>', `<script>\n${animJs}\n</script>`);
}

// ── PERSISTENT SHELL ───────────────────────────────────────────────────────
function renderShell(metadata: Script["metadata"], tiktok: TiktokConfig, hidePersistentHandle = false): string {
  const channel = escapeHtml(metadata.channel);
  const handle = escapeHtml(tiktok.handle);
  return `
<!-- Shell: persistent brand elements (no data-start → always visible) -->
<div class="shell-bg"></div>

<div class="brand-shell-header">
  <div class="brand-icon">✦</div>
  <div class="brand-text">
    <div class="brand-name">${channel}</div>
    <div class="brand-tag">DAILY HABITS</div>
  </div>
</div>

${hidePersistentHandle ? "" : `<div class="brand-shell-handle">
  <span class="handle-music">&#9835;</span>
  <span class="handle-text">${handle}</span>
</div>`}

${VIGNETTE_HTML}
${GRAIN_OVERLAY_HTML}`.trim();
}

// ── SCENE DISPATCH ─────────────────────────────────────────────────────────
function renderScene(
  scene: Script["scenes"][number],
  start: number,
  duration: number,
  audioOffset: number,
  spokenEnd: number,
  numberHighlights: ResolvedNumberHighlight[],
  bgImageRelPath: string | null,
  tiktok: TiktokConfig,
  tiktokAvatarRelPath: string,
  visualCues: ResolvedVisualCue[],
): string {
  const td = scene.templateData;

  let inner: string;
  let layoutName: string;

  switch (td.template) {
    case "hook":
      inner = renderHookInner(td, bgImageRelPath);
      layoutName = "hook";
      break;
    case "comparison":
      inner = renderComparisonInner(scene.id, td, numberHighlights);
      layoutName = "comparison";
      break;
    case "stat-hero":
      inner = renderStatHeroInner(scene.id, td, numberHighlights, Boolean(scene.statArrangement));
      layoutName = "stat-hero";
      break;
    case "feature-list":
      inner = renderFeatureListInner(td);
      layoutName = "feature-list";
      break;
    case "callout":
      inner = renderCalloutInner(td);
      layoutName = "callout";
      break;
    case "outro":
      inner = renderOutroInner(td, tiktok, tiktokAvatarRelPath);
      layoutName = "outro";
      break;
    default: {
      const _never: never = td;
      throw new Error(`Unknown template: ${(_never as any).template}`);
    }
  }

  return buildScene(scene, start, duration, audioOffset, spokenEnd, layoutName, inner, visualCues);
}

// ── HOOK SCENE ─────────────────────────────────────────────────────────────
function renderHookInner(td: Extract<TemplateDataType, { template: "hook" }>, bgImageRelPath: string | null): string {
  // Background
  const hasImage = Boolean(td.bgSrc && bgImageRelPath);
  let bgHtml: string;
  if (hasImage) {
    // Ken Burns image
    const kbClass = td.kenBurns ?? "zoom-in";
    bgHtml = `<div class="bg kb-${kbClass}" style="background-image: url('${bgImageRelPath}')"></div>`;
  } else {
    bgHtml = `<div class="bg gradient-news-dark"></div>`;
  }
  // Only darken when there's a real photo to tame for text legibility —
  // our own gradient backgrounds are already tuned for contrast, and a flat
  // black scrim on top of them just muddies the theme's colors (esp. light-pro).
  const overlayHtml = hasImage ? `<div class="overlay" style="opacity: 0.55"></div>` : "";

  const headline = escapeHtml(td.headline);
  const subhead = td.subhead ? escapeHtml(td.subhead) : "";

  return `${bgHtml}
  ${overlayHtml}
  <div class="layout-hook">
    <div class="hook-wallet" aria-hidden="true">
      <span class="hook-bill bill-one">$</span>
      <span class="hook-bill bill-two">$</span>
      <span class="hook-bill bill-three">$</span>
      <span class="wallet-body"><i></i></span>
    </div>
    <div class="hook-headline shimmer-sweep-target">${headline}</div>
    ${subhead ? `<div class="hook-subhead">${subhead}</div>` : ""}
  </div>`;
}

// ── COMPARISON SCENE ───────────────────────────────────────────────────────
function renderComparisonInner(sceneId: string, td: Extract<TemplateDataType, { template: "comparison" }>, highlights: ResolvedNumberHighlight[]): string {
  const winnerClass = td.right.winner ? " card-winner" : "";
  const connector = td.connector ?? "";
  const connectorClass = connector.length > 3 ? " cmp-connector-long" : "";
  const leftEmphasis = renderHighlightAttr(sceneId, "left.value", highlights);
  const rightEmphasis = renderHighlightAttr(sceneId, "right.value", highlights);

  return `
<div class="layout-comparison">
  <div class="cmp-card cmp-left">
    <div class="cmp-copy">
      <div class="cmp-label">${escapeHtml(td.left.label)}</div>
      <div class="cmp-value metric-emphasis"${leftEmphasis}>${escapeHtml(td.left.value)}</div>
    </div>
    ${renderComparisonIcon(td.left.label)}
  </div>
  ${connector ? `<div class="cmp-connector${connectorClass}">${escapeHtml(connector)}</div>` : ""}
  <div class="cmp-card cmp-right${winnerClass}">
    <div class="cmp-copy">
      <div class="cmp-label">${escapeHtml(td.right.label)}</div>
      <div class="cmp-value metric-emphasis"${rightEmphasis}>${escapeHtml(td.right.value)}</div>
      ${td.right.winner ? '<div class="cmp-winner-badge">WINNER</div>' : ""}
    </div>
    ${renderComparisonIcon(td.right.label)}
  </div>
</div>`.trim();
}

function renderComparisonIcon(label: string): string {
  const key = label.toLowerCase();
  let body: string;

  if (key.includes("stream")) {
    body = '<rect x="13" y="20" width="74" height="60" rx="12"/><path d="M44 38l22 12-22 12z"/>';
  } else if (key.includes("fitness")) {
    body = '<path d="M12 43v14M21 35v30M79 35v30M88 43v14M21 50h58"/>';
  } else if (key.includes("cloud")) {
    body = '<path d="M25 72h49a15 15 0 0 0 2-30 25 25 0 0 0-47-5A18 18 0 0 0 25 72z"/><path d="M50 47v18M41 56l9 9 9-9"/>';
  } else if (key.includes("subscription")) {
    body = '<g stroke-width="4"><rect x="6" y="18" width="24" height="24" rx="6"/><path d="M15 25l8 5-8 5z"/><rect x="38" y="18" width="24" height="24" rx="6"/><circle cx="50" cy="30" r="5"/><rect x="70" y="18" width="24" height="24" rx="6"/><path d="M77 27h10M77 34h7"/><rect x="22" y="56" width="24" height="24" rx="6"/><path d="M29 68l4 4 7-9"/><rect x="54" y="56" width="24" height="24" rx="6"/><path d="M68 62v11M68 62l6-2v10M64 73a3 3 0 1 0 4 0M71 70a3 3 0 1 0 3 0"/></g>';
  } else if (key.includes("receipt")) {
    body = '<path d="M25 14h50v72l-8-6-8 6-9-6-9 6-8-6-8 6z"/><path d="M38 34h24M38 48h24M38 62h14"/>';
  } else if (key.includes("mental") || key.includes("round")) {
    body = '<path d="M52 18a25 25 0 0 0-24 31c2 8 8 12 12 17v13h28V66c5-5 9-12 9-21A25 25 0 0 0 52 18z"/><path d="M42 42a12 12 0 0 1 20-7M62 35v9h-9M62 55a12 12 0 0 1-20 7M42 62v-9h9"/>';
  } else {
    body = '<rect x="16" y="25" width="68" height="50" rx="10"/><path d="M16 42h68M29 60h18"/>';
  }

  return `<div class="cmp-icon" aria-hidden="true"><svg viewBox="0 0 100 100">${body}</svg></div>`;
}

// ── STAT HERO SCENE ────────────────────────────────────────────────────────
function renderStatHeroInner(sceneId: string, td: Extract<TemplateDataType, { template: "stat-hero" }>, highlights: ResolvedNumberHighlight[], contentMotif = false): string {
  const context = td.context ? `<div class="stat-context">${escapeHtml(td.context)}</div>` : "";
  const motif = renderStatMotif(td.label, contentMotif);
  const emphasis = renderHighlightAttr(sceneId, "stat.value", highlights);
  const longClass = td.value.length > 12 ? " stat-value-long" : "";
  return `
<div class="layout-stat-hero">
  ${motif}
  <div class="stat-value${longClass} shimmer-sweep-target metric-emphasis"${emphasis}>${escapeHtml(td.value)}</div>
  <div class="stat-label">${escapeHtml(td.label)}</div>
  ${context}
</div>`.trim();
}

function renderHighlightAttr(
  sceneId: string,
  target: string,
  highlights: ResolvedNumberHighlight[],
): string {
  const match = highlights.find((item) => item.sceneId === sceneId && item.target === target);
  if (!match) return "";
  return ` data-emphasis-at="${match.startSec.toFixed(3)}" data-emphasis-end="${match.endSec.toFixed(3)}"`;
}

function renderStatMotif(label: string, contentMotif: boolean): string {
  const key = label.toLowerCase();
  let body: string;
  if (contentMotif && key.includes("coffee")) {
    body = '<path d="M28 36h44l-6 50H34zM24 36h52M30 27h40M57 27l7-17"/><path d="M38 48h23M39 61h20"/>';
  } else if (contentMotif && key.includes("phone case")) {
    body = '<rect x="27" y="10" width="46" height="80" rx="10"/><rect x="34" y="18" width="17" height="24" rx="5"/><circle cx="42" cy="25" r="2"/><circle cx="42" cy="34" r="2"/><path d="M42 80h16"/>';
  } else if (key.includes("tired") || key.includes("convenience")) {
    body = '<path d="M25 50h50l-5 32H32z"/><path d="M38 50c0-13 7-22 17-22s17 9 17 22"/><circle cx="38" cy="86" r="5"/><circle cx="66" cy="86" r="5"/>';
  } else if (key.includes("discount")) {
    body = '<path d="M28 15h44v70l-8-5-8 5-8-5-8 5-12-7z"/><path d="M40 36h20M40 50h20M40 64h12"/>';
  } else {
    body = '<rect x="18" y="28" width="64" height="48" rx="8"/><path d="M28 47h44M28 59h28"/><circle cx="68" cy="59" r="4"/>';
  }
  return `<div class="stat-motif" aria-hidden="true"><svg viewBox="0 0 100 100">${body}</svg></div>`;
}

// ── FEATURE LIST SCENE ─────────────────────────────────────────────────────
function renderFeatureListInner(td: Extract<TemplateDataType, { template: "feature-list" }>): string {
  const bullets = td.bullets.map((b, i) =>
    `<div class="feat-bullet feat-bullet-${i}" data-idx="${i}">
      <div class="feat-dot"></div>
      <div class="feat-text">${escapeHtml(b)}</div>
    </div>`
  ).join("\n    ");

  return `
<div class="layout-feature-list">
  <div class="feat-card">
    <div class="feat-title">${escapeHtml(td.title)}</div>
    <div class="feat-rule"></div>
    <div class="feat-bullets">
      ${bullets}
    </div>
  </div>
</div>`.trim();
}

// ── CALLOUT SCENE ──────────────────────────────────────────────────────────
function renderCalloutInner(td: Extract<TemplateDataType, { template: "callout" }>): string {
  const tag = td.tag ? `<div class="callout-tag">${escapeHtml(td.tag)}</div>` : "";
  return `
<div class="layout-callout">
  <div class="callout-card">
    ${tag}
    <div class="callout-statement">${escapeHtml(td.statement)}</div>
  </div>
</div>`.trim();
}

// ── OUTRO SCENE ────────────────────────────────────────────────────────────
function renderOutroInner(
  td: Extract<TemplateDataType, { template: "outro" }>,
  tiktok: TiktokConfig,
  avatarRelPath: string,
): string {
  const ttCard = renderTiktokCard(tiktok, avatarRelPath);
  return `
<div class="layout-outro">
  <div class="out-cta-top">${escapeHtml(td.ctaTop)}</div>
  <div class="out-channel">${escapeHtml(td.channelName)}</div>
  <div class="out-underline"></div>
  <div class="out-source">${escapeHtml(td.source)}</div>
</div>
${ttCard}`.trim();
}

function renderEditorialOutro(td: Extract<TemplateDataType,{template:"outro"}>, tiktok:TiktokConfig, avatar:string):string {
  const icons=[
    '<rect x="18" y="18" width="64" height="64" rx="12"/><path d="M40 35l25 15-25 15z"/>',
    '<path d="M23 40h54l-6 44H29zM36 40V28a14 14 0 0 1 28 0v12"/>',
    '<path d="M28 34h44l-6 50H34zM24 34h52M31 24h38"/>',
  ];
  return `<div class="layout-outro editorial-outro"><div class="out-cta-top" data-role="CTA">${escapeHtml(td.ctaTop)}</div><div class="editorial-reminders" data-role="CTA">${icons.map((p,i)=>`<div><span>${i+1}</span><svg class="fm-icon" viewBox="0 0 100 100">${p}</svg></div>`).join("")}</div></div>${renderTiktokCard(tiktok,avatar)}`;
}

/**
 * TikTok follow card — adapted from HyperFrames `tiktok-follow` block.
 * Slides up from bottom mid-outro. Animations are added by animations.js
 * targeting elements with id="tt-card", id="tt-follow-btn", etc.
 */
function renderTiktokCard(tiktok: TiktokConfig, avatarRelPath: string): string {
  return `
<div id="tt-card" class="tt-card">
  <img class="tt-avatar" src="${escapeHtml(avatarRelPath)}" alt="${escapeHtml(tiktok.displayName)}" crossorigin="anonymous" />
  <div class="tt-profile-info">
    <div class="tt-display-name">${escapeHtml(tiktok.displayName)}</div>
    <div class="tt-handle">${escapeHtml(tiktok.handle)}</div>
    <div class="tt-followers">${escapeHtml(tiktok.followers)}</div>
  </div>
  <div id="tt-follow-btn" class="tt-follow-btn">
    <span id="tt-btn-follow" class="tt-btn-text">Follow</span>
    <span id="tt-btn-following" class="tt-btn-text tt-btn-text-following">
      <span>Following</span>
      <span class="tt-check-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#F5F1E8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>
    </span>
  </div>
</div>`.trim();
}

// ── HELPERS ────────────────────────────────────────────────────────────────
function buildScene(
  scene: Script["scenes"][number],
  start: number,
  duration: number,
  audioOffset: number,
  spokenEnd: number,
  layoutName: string,
  innerHtml: string,
  visualCues: ResolvedVisualCue[],
): string {
  const cues = visualCues.filter(c => c.sceneId === scene.id);
  const cueAttr = cues.length ? ` data-visual-cues="${escapeHtml(JSON.stringify(Object.fromEntries(cues.map(c => [c.target, c.startSec]))))}"` : "";
  const arrangement = scene.statArrangement ? ` data-stat-arrangement="${scene.statArrangement}"` : "";
  const hookFrameZero = scene.hookFrameZeroReadable ? ' data-hook-frame-zero="true"' : "";
  return `
<div class="scene clip" id="scene-${scene.id}"
     data-start="${start.toFixed(2)}" data-duration="${duration.toFixed(2)}" data-active="0"
     data-audio-offset="${audioOffset.toFixed(3)}" data-spoken-end="${spokenEnd.toFixed(3)}"
     data-layout="${layoutName}"${cueAttr}${arrangement}${hookFrameZero}>
  ${innerHtml}
</div>`.trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
