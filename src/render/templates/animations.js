// v2 Animation Engine — template-specific entrance animations
// HyperFrames runtime drives playback by seeking the timeline.
//
// IMPORTANT: Only use supported GSAP props: opacity, x, y, scale, scaleX, scaleY, rotation, width, height, visibility.
// Do NOT use `delay:` in vars — use position parameter (3rd arg) instead.
// Do NOT use `attr:` settings. No complex easings.

window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
window.__timelines["news-video"] = tl;

(function () {
  // ── Inject shimmer masks into all .shimmer-sweep-target elements ──────────
  document.querySelectorAll(".shimmer-sweep-target").forEach((el) => {
    if (!el.querySelector(".shimmer-mask")) {
      const mask = document.createElement("div");
      mask.className = "shimmer-mask";
      el.appendChild(mask);
    }
  });

  const stage = document.getElementById("stage");
  const scenes = Array.from(stage.querySelectorAll(".scene"));

  // ── Scene dispatch ──────────────────────────────────────────────────────
  scenes.forEach((scene, index) => {
    const start = parseFloat(scene.dataset.start);
    const dur   = parseFloat(scene.dataset.duration);
    const audioOffset = parseFloat(scene.dataset.audioOffset || "0");
    const layout = scene.dataset.layout;

    // Adjacent visuals overlap by 180ms. Audio and metric timing remain locked
    // to transcript time through data-audio-offset.
    const previous = scenes[index - 1];
    const next = scenes[index + 1];
    const cleanIncoming = scene.dataset.dominantForeground === "true" && previous?.dataset.dominantForeground === "true";
    const cleanOutgoing = scene.dataset.dominantForeground === "true" && next?.dataset.dominantForeground === "true";
    const outSec = parseFloat(scene.dataset.handoffOutSec || "0.06");
    const gapSec = parseFloat(scene.dataset.handoffGapSec || "0.02");
    const inSec = parseFloat(scene.dataset.handoffInSec || "0.10");
    tl.set(scene, { opacity: cleanIncoming ? 0 : 1 }, start);
    if (cleanIncoming) tl.to(scene, { opacity: 1, duration: inSec }, start + outSec + gapSec);
    if (layout === "outro") {
      tl.set(scene, { opacity: 0 }, start + dur);
    } else {
      tl.to(scene, { opacity: 0, duration: cleanOutgoing ? outSec : 0.18 }, start + dur - 0.18);
    }

    if (layout === "hook") {
      animateHook(scene, tl, start);
    } else if (layout === "comparison") {
      animateComparison(scene, tl, start, audioOffset);
    } else if (layout === "stat-hero") {
      animateStatHero(scene, tl, start, audioOffset);
    } else if (layout === "feature-list") {
      animateFeatureList(scene, tl, start);
    } else if (layout === "callout") {
      animateCallout(scene, tl, start);
    } else if (layout === "outro") {
      animateOutro(scene, tl, start, dur);
    }
  });

  // ── HOOK ──────────────────────────────────────────────────────────────
  // Opt-in phrase-linked scheduling of existing entrances. Legacy timings remain defaults.
  function entranceAt(scene, target, fallback) {
    const cues = JSON.parse(scene.dataset.visualCues || "{}");
    return Object.prototype.hasOwnProperty.call(cues, target)
      ? parseFloat(scene.dataset.start) + parseFloat(scene.dataset.audioOffset || "0") + cues[target]
      : fallback;
  }

  function animateHook(scene, tl, start) {
    const wallet = scene.querySelector(".hook-wallet");
    if (wallet) {
      tl.fromTo(wallet, { y: 60, rotation: -6, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.4 }, start);
    }
    const headline = scene.querySelector(".hook-headline");
    if (headline) {
      // Scale pop in
      if (scene.dataset.hookFrameZero === "true") {
        tl.fromTo(headline, { scale: 0.96, opacity: 1 }, { scale: 1, opacity: 1, duration: 0.35 }, start);
      } else {
        tl.fromTo(headline, { scale: 0.72, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35 }, start);
      }
      // Shimmer sweep after entrance
      const mask = headline.querySelector(".shimmer-mask");
      if (mask) {
        tl.fromTo(mask, { x: "-120%" }, { x: "120%", duration: 0.85 }, start + 0.38);
      }
    }

    const subhead = scene.querySelector(".hook-subhead");
    if (subhead) {
      tl.fromTo(subhead, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 }, entranceAt(scene, "hook-subhead", start + 0.12));
    }
    const cues = JSON.parse(scene.dataset.visualCues || "{}");
    ["bill-one", "bill-two", "bill-three"].forEach(target => {
      const bill = scene.querySelector("." + target);
      if (bill && Object.prototype.hasOwnProperty.call(cues, target)) {
        tl.fromTo(bill, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }, entranceAt(scene, target, start));
      }
    });
  }

  // ── COMPARISON ────────────────────────────────────────────────────────
  function animateComparison(scene, tl, start, audioOffset) {
    const leftCard = scene.querySelector(".cmp-left");
    if (leftCard) {
      tl.fromTo(leftCard, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.42 }, start + 0.02);
      const leftIcon = leftCard.querySelector(".cmp-icon");
      if (leftIcon) {
        tl.fromTo(leftIcon, { scale: 0.72, rotation: -6 }, { scale: 1, rotation: 0, duration: 0.35 }, start + 0.12);
      }
    }

    const connector = scene.querySelector(".cmp-connector");
    if (connector) {
      tl.fromTo(connector, { scale: 0.65, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 }, start + 0.22);
    }

    const rightCard = scene.querySelector(".cmp-right");
    if (rightCard) {
      tl.fromTo(rightCard, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.42 }, start + 0.32);
      const rightIcon = rightCard.querySelector(".cmp-icon");
      if (rightIcon) {
        tl.fromTo(rightIcon, { scale: 0.72, rotation: 6 }, { scale: 1, rotation: 0, duration: 0.35 }, start + 0.42);
      }
    }

    animateMetricEmphasis(scene, tl, start, audioOffset);
  }

  // ── STAT HERO ─────────────────────────────────────────────────────────
  function animateStatHero(scene, tl, start, audioOffset) {
    const motif = scene.querySelector(".stat-motif");
    if (motif) {
      tl.fromTo(motif, { scale: 0.65, rotation: -8, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.4 }, start + 0.02);
    }
    const value = scene.querySelector(".stat-value");
    if (value) {
      tl.fromTo(value, { scale: 0.65, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45 }, start + 0.04);
      // Shimmer sweep on the stat value
      const mask = value.querySelector(".shimmer-mask");
      if (mask) {
        tl.fromTo(mask, { x: "-120%" }, { x: "120%", duration: 0.9 }, start + 0.48);
      }
    }

    const label = scene.querySelector(".stat-label");
    if (label) {
      tl.fromTo(label, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38 }, entranceAt(scene, "stat-label", start + 0.26));
    }

    const context = scene.querySelector(".stat-context");
    if (context) {
      tl.fromTo(context, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.36 }, entranceAt(scene, "stat-context", start + 0.42));
    }

    animateMetricEmphasis(scene, tl, start, audioOffset);
  }

  function animateMetricEmphasis(scene, tl, start, audioOffset) {
    scene.querySelectorAll("[data-emphasis-at]").forEach((value) => {
      const at = parseFloat(value.dataset.emphasisAt);
      if (!Number.isFinite(at)) return;
      tl.to(value, { scale: 1.1, duration: 0.18 }, start + audioOffset + at);
      tl.to(value, { scale: 1, duration: 0.24 }, start + audioOffset + at + 0.18);
    });
  }

  // ── FEATURE LIST ──────────────────────────────────────────────────────
  function animateFeatureList(scene, tl, start) {
    const card = scene.querySelector(".feat-card");
    if (card) {
      tl.fromTo(card, { y: 45, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.42 }, start + 0.02);
    }

    const rule = scene.querySelector(".feat-rule");
    if (rule) {
      tl.fromTo(rule, { scaleX: 0, opacity: 1 }, { scaleX: 1, opacity: 1, duration: 0.4 }, start + 0.45);
    }

    const bullets = scene.querySelectorAll(".feat-bullet");
    bullets.forEach((b, i) => {
      tl.fromTo(b, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4 }, entranceAt(scene, "feat-bullet-" + i, start + 0.6 + i * 0.15));
    });
  }

  // ── CALLOUT ───────────────────────────────────────────────────────────
  function animateCallout(scene, tl, start) {
    const card = scene.querySelector(".callout-card");
    if (card) {
      tl.fromTo(card, { y: 40, scale: 0.94, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.42 }, start + 0.02);
    }
    const statement = scene.querySelector(".callout-statement");
    if (statement && scene.dataset.visualCues) {
      tl.fromTo(statement, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.36 }, entranceAt(scene, "callout-statement", start + 0.02));
    }
  }

  // ── OUTRO ─────────────────────────────────────────────────────────────
  function animateOutro(scene, tl, start, dur) {
    const editorial = scene.dataset.editorialOutro === "true";
    const ctaStart = editorial ? start + Number(scene.dataset.spokenEnd) + .12 : start + .02;
    const cta = scene.querySelector(".out-cta-top");
    if (cta) {
      if(editorial) tl.fromTo(cta, { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.38 }, ctaStart);
      else tl.fromTo(cta, { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: 0.38 }, start + 0.02);
    }
    const reminders=scene.querySelector(".editorial-reminders");
    if(reminders) tl.fromTo(reminders,{opacity:0},{opacity:1,duration:.38},ctaStart);

    const channel = scene.querySelector(".out-channel");
    if (channel) {
      tl.fromTo(channel, { scale: 0.72, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45 }, start + 0.12);
    }

    const underline = scene.querySelector(".out-underline");
    if (underline) {
      tl.fromTo(underline, { width: 0 }, { width: "600px", duration: 0.42 }, entranceAt(scene, "out-underline", start + 0.32));
    }

    const source = scene.querySelector(".out-source");
    if (source) {
      tl.fromTo(source, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.36 }, entranceAt(scene, "out-source", start + 0.48));
    }

    // ── TikTok follow card animation (last ~3.5s of outro) ──────────────
    // Adapted from HyperFrames `tiktok-follow` block.
    // Card lives inside the outro scene (id="tt-card"); slide up + button click sequence.
    const ttCard = scene.querySelector("#tt-card");
    if (ttCard) {
      const ttBtn      = scene.querySelector("#tt-follow-btn");
      const ttFollow   = scene.querySelector("#tt-btn-follow");
      const ttFollwing = scene.querySelector("#tt-btn-following");
      const spokenEnd  = parseFloat(scene.dataset.spokenEnd || String(dur));
      const ttBase     = start + spokenEnd + 0.12;

      // The persistent handle yields to the richer profile card at the same
      // transcript-driven moment, after the final subtitle has fully ended.
      const shellHandle = document.querySelector(".brand-shell-handle");
      if (shellHandle) {
        tl.to(shellHandle, { opacity: 0, duration: 0.12 }, ttBase);
      }

      // Slide in from bottom + fade in
      tl.fromTo(ttCard,
        { opacity: 0, y: 300 },
        { opacity: 1, y: 0, duration: 0.5 },
        ttBase
      );

      // Button press (scale down)
      if (ttBtn) {
        tl.to(ttBtn, { scale: 0.92, duration: 0.15 }, ttBase + 0.9);
        // Release with slight bounce (use scale up)
        tl.to(ttBtn, { scale: 1, duration: 0.4 }, ttBase + 1.05);
      }

      // Swap "Follow" → "Following" (opacity)
      if (ttFollow) {
        tl.to(ttFollow, { opacity: 0, duration: 0.08 }, ttBase + 1.05);
      }
      if (ttFollwing) {
        tl.to(ttFollwing, { opacity: 1, duration: 0.08 }, ttBase + 1.08);
      }

      // Hold + subtle zoom-in to focus viewer attention on the card.
      // Slow zoom from scale 1 → 1.08 over the remaining outro duration.
      const holdStart = ttBase + 1.3;             // after click animation
      const holdEnd   = start + dur - 0.1;        // ends just before scene ends
      const holdLen   = Math.max(0.5, holdEnd - holdStart);
      tl.to(ttCard, { scale: 1.08, duration: holdLen }, holdStart);
    }
  }
})();
