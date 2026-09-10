import { readFile, writeFile, mkdir, copyFile, rm } from "node:fs/promises";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import pLimit from "p-limit";
import { ScriptSchema, type Script } from "./render/script-schema.js";
import { loadConfig } from "./config.js";
import { createTtsClient } from "./tts/tts-client.js";
import { fetchImage } from "./assets/image-fetcher.js";
import { getDurationSec, getVideoDurationSec, trimTrailingSilence, concatWithSilence, mixSfxOntoVoice, type SfxMixSpec } from "./assets/audio-tools.js";
import { planOutroDwell, assessProductionDuration } from "./contracts/production-duration.js";
import { assessEditorial } from "./contracts/editorial-validation.js";
import { resolveHeroCaptions, editorialKaraokeAss } from "./contracts/hero-captions.js";
import { resolveVisualCues, assessSceneDynamics } from "./planning/scene-dynamics.js";
import { compileFinancePlan, assessFinanceDataViz, assessMotionSemantics, financeVisualCues, assertFinanceHighlights, type ResolvedFinancePlan } from "./contracts/finance-motion.js";
import { indexSfxLibrary, pickSfxForScene, defaultPlayback } from "./assets/sfx-selector.js";
import { parseSrt, mergeSceneSrts, mergeSceneKaraokeAss, burnSubtitles } from "./assets/subtitle-tools.js";
import { existsSync } from "node:fs";
import { composeHtml } from "./render/html-composer.js";
import { renderWithHyperframes } from "./render/hyperframes-runner.js";
import { log } from "./utils/logger.js";
import { evaluateProductionVisualVariety, persistProductionValidation, assertProductionAllowed } from "./contracts/production-validation.js";
import {
  APPROVED_SCRIPT_FILE,
  AUXILIARY_SCRIPT_FILE,
  REQUIRED_EDGE_VOICE,
  NumberHighlightFileSchema,
  assertMoneyHabitsTheme,
  assertScriptIntegrity,
  assertTemplateScenePlan,
  auditVisibleText,
  buildWordBoundaryTranscript,
  extractApprovedVoiceOver,
  resolveNumberHighlights,
} from "./contracts/content-contract.js";

const TOTAL_STEPS = 8;
const DURATION_MIN_SEC = 60;
const DURATION_MAX_SEC = 90;
const SCENE_GAP_SEC = 0.20;
/**
 * Extra seconds added to the outro scene visual duration AFTER the voice ends.
 * Gives the TikTok follow card time to be read by the viewer (otherwise the
 * video ends a few hundred ms after the card slides up + click animation).
 * Audio stays silent during this hold; visual stays on screen.
 */
const OUTRO_HOLD_SEC = 2.0;
const SUBTITLE_MARGIN_V = 450;

export function assessNarrationDuration(totalAudioSec: number) {
  if (!Number.isFinite(totalAudioSec) || totalAudioSec <= 0) {
    throw new Error(`DURATION_GATE: invalid audio duration ${totalAudioSec}`);
  }
  if (totalAudioSec > DURATION_MAX_SEC) {
    throw new Error(`DURATION_GATE: ${totalAudioSec.toFixed(1)}s exceeds ${DURATION_MAX_SEC}s maximum`);
  }
  return {
    status: totalAudioSec < DURATION_MIN_SEC ? "SHORT_APPROVED_NARRATION" as const : "PASS" as const,
    audioSec: totalAudioSec,
    targetRangeSec: [DURATION_MIN_SEC, DURATION_MAX_SEC] as const,
    padded: false,
  };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const TPL_DIR = join(__dirname, "render", "templates");
/** Path to the SFX library (relative to project root) */
const SFX_DIR = join(__dirname, "..", "assets", "sfx");
const PROJECT_ROOT = join(__dirname, "..");

const HYPERFRAMES_CONFIG = {
  $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
  registry: "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
  paths: {
    blocks: "compositions",
    components: "compositions/components",
    assets: "assets",
  },
};

export async function runPipeline(scriptPath: string): Promise<void> {
  const cfg = loadConfig();
  const outputDir = dirname(scriptPath);
  log.info(`Output directory: ${outputDir}`);

  // STEP 1
  log.step(1, TOTAL_STEPS, `Load env + validate script.json (TTS provider: ${cfg.ttsProvider})`);
  const raw = JSON.parse(await readFile(scriptPath, "utf8"));
  // Substitute env placeholder before validation (works for all providers)
  if (raw.voice?.voiceId === "${VIETNAMESE_VOICEID}" || raw.voice?.voiceId === "${VOICE_ID}") {
    raw.voice.voiceId =
      cfg.ttsProvider === "edge-tts" ? cfg.edgeTtsVoice
      : cfg.ttsProvider === "lucylab" ? cfg.lucylabVoiceId!
      : cfg.ttsProvider === "elevenlabs" ? cfg.elevenlabsVoiceId!
      : cfg.vbeeVoiceCode;
  }
  const script: Script = ScriptSchema.parse(raw);
  const financePath = join(outputDir, "data_visualizations.json");
  if (script.metadata.visualSystem === "1.2" && !existsSync(financePath)) throw new Error("MISSING_PROVENANCE: v1.2 requires data_visualizations.json");
  const financeInput = existsSync(financePath) ? JSON.parse(await readFile(financePath, "utf8")) : undefined;
  if (cfg.ttsProvider !== "edge-tts" || script.voice.provider !== "edge-tts") {
    throw new Error("TRANSCRIPT: Money Habits requires Edge TTS WordBoundary; no fallback provider is allowed");
  }
  if (cfg.edgeTtsVoice !== REQUIRED_EDGE_VOICE || script.voice.voiceId !== REQUIRED_EDGE_VOICE) {
    throw new Error(`TRANSCRIPT: Money Habits voice must be ${REQUIRED_EDGE_VOICE}`);
  }

  const approvedMarkdown = await readFile(join(PROJECT_ROOT, APPROVED_SCRIPT_FILE), "utf8");
  const auxiliaryMarkdown = await readFile(join(PROJECT_ROOT, AUXILIARY_SCRIPT_FILE), "utf8");
  const numberHighlightPath = join(outputDir, "number_highlights.json");
  const numberHighlightFile = NumberHighlightFileSchema.parse(JSON.parse(await readFile(numberHighlightPath, "utf8")));
  if (numberHighlightFile.source !== APPROVED_SCRIPT_FILE) throw new Error("SOURCE_REVISION: canonical render requires current approved number highlights");
  const approvedVoice = extractApprovedVoiceOver(approvedMarkdown, numberHighlightFile.day);
  assertScriptIntegrity(script, approvedVoice);
  const visibleTextAudit = auditVisibleText({
    script,
    approvedVoice,
    auxiliaryMarkdown,
    numberHighlights: numberHighlightFile,
    brandConfig: [script.metadata.channel, cfg.tiktok.displayName, cfg.tiktok.handle, cfg.tiktok.followers, "DAILY HABITS", "#MoneyHabits"],
  });
  const themeCss = await readFile(join(TPL_DIR, "styles.css"), "utf8");
  assertMoneyHabitsTheme(themeCss, JSON.stringify(script));
  log.info("  A SCRIPT_INTEGRITY: PASS");
  log.info(`  B NO_UNAPPROVED_COPY: PASS (${visibleTextAudit.length} visible strings traced)`);
  log.info("  C THEME: PASS (Money Habits navy/off-white/gold contract)");

  // STEP 2
  log.step(2, TOTAL_STEPS, "Write script.txt for CapCut");
  const fullText = script.scenes.map((s) => s.voiceText).join(" ");
  await writeFile(join(outputDir, "script.txt"), fullText);

  // STEP 3 + 4 in parallel
  log.step(3, TOTAL_STEPS, "Fetch og:image (parallel) + Step 4 TTS");
  const imgPath = join(outputDir, "images", "bg.jpg");
  const imgPromise = fetchImage(script.metadata.source.image, imgPath);

  // STEP 4
  if (script.voice?.speed) {
    const pct = Math.round((script.voice.speed - 1) * 100);
    cfg.edgeTtsRate = `${pct >= 0 ? "+" : ""}${pct}%`;
  }
  const ttsClient = createTtsClient(cfg);
  // Concurrency: LucyLab requires 1 (only 1 concurrent export per key);
  // ElevenLabs supports parallel calls but we keep 1 by default to be polite.
  const limit = pLimit(cfg.ttsConcurrency);
  const voiceDir = join(outputDir, "voice");
  await mkdir(voiceDir, { recursive: true });

  const sceneAudioPromises = script.scenes.map((scene) =>
    limit(async () => {
      const out = join(voiceDir, `scene-${scene.id}.mp3`);
      const srtOut = join(voiceDir, `scene-${scene.id}.srt`);
      const cacheOut = join(voiceDir, `scene-${scene.id}.cache.json`);
      const trimmedOut = join(voiceDir, `trimmed-${scene.id}.mp3`);
      const cacheKey = createHash("sha256").update(JSON.stringify({
        text: scene.voiceText,
        provider: script.voice.provider,
        voiceId: script.voice.voiceId,
        speed: script.voice.speed,
        rate: cfg.edgeTtsRate,
        pitch: cfg.edgeTtsPitch,
        volume: cfg.edgeTtsVolume,
      })).digest("hex");
      let cacheMatches = false;
      if (existsSync(out) && existsSync(srtOut) && existsSync(cacheOut)) {
        try {
          const cached = JSON.parse(await readFile(cacheOut, "utf8"));
          cacheMatches = cached.cacheKey === cacheKey;
        } catch {
          cacheMatches = false;
        }
      }

      // IDEMPOTENT: skip TTS if voice file already exists.
      // To force re-TTS for a scene, delete its mp3 file before running.
      // This saves API quota when only some scenes' voiceText changed.
      if (cacheMatches) {
        await trimTrailingSilence(out, trimmedOut);
        const dur = await getDurationSec(trimmedOut);
        log.info(`  scene ${scene.id}: REUSE existing mp3 (${dur.toFixed(2)}s) — delete to force re-TTS`);
        return { id: scene.id, path: trimmedOut, durationSec: dur };
      }

      log.info(`  TTS scene ${scene.id} (${scene.voiceText.length} chars)...`);
      await ttsClient.generate(scene.voiceText, out, srtOut);
      await writeFile(cacheOut, JSON.stringify({ cacheKey }, null, 2));
      await trimTrailingSilence(out, trimmedOut);
      const rawDur = await getDurationSec(out);
      const dur = await getDurationSec(trimmedOut);
      log.info(`  scene ${scene.id}: ${rawDur.toFixed(2)}s raw -> ${dur.toFixed(2)}s trimmed`);
      return { id: scene.id, path: trimmedOut, durationSec: dur };
    }),
  );

  const [imgResult, sceneAudio] = await Promise.all([
    imgPromise,
    Promise.all(sceneAudioPromises),
  ]);

  const transcript = await buildWordBoundaryTranscript({
    scenes: sceneAudio.map((audio) => ({
      id: audio.id,
      durationSec: audio.durationSec,
      srtPath: join(outputDir, "voice", `scene-${audio.id}.srt`),
    })),
    gapSec: SCENE_GAP_SEC,
    outputPath: join(outputDir, "transcript.json"),
    voiceId: script.voice.voiceId,
  });
  const sceneValidation = assertTemplateScenePlan(script, transcript);
  const visualCues = resolveVisualCues(script, transcript);
  let sceneDynamics = assessSceneDynamics(transcript, visualCues);
  const outroDwell = planOutroDwell(transcript, SCENE_GAP_SEC, OUTRO_HOLD_SEC);
  const resolvedNumberHighlights = resolveNumberHighlights(numberHighlightFile, transcript);
  const numberHighlightGate = numberHighlightFile.items.length === 0
    ? { status: "N/A" as const, reason: "no approved number highlight", resolved: [] }
    : { status: "PASS" as const, resolved: resolvedNumberHighlights };
  log.info(`  D TRANSCRIPT: PASS (${transcript.scenes.reduce((sum, scene) => sum + scene.words.length, 0)} WordBoundary cues; Whisper=false)`);
  if (numberHighlightGate.status === "N/A") {
    log.info("  E NUMBER_HIGHLIGHTS: N/A — no approved number highlight");
  } else {
    log.info(`  E NUMBER_HIGHLIGHTS: PASS (${resolvedNumberHighlights.length}/${numberHighlightFile.items.length} resolved from transcript.json)`);
  }
  log.info(`  F TEMPLATE_SCENE: PASS (${sceneValidation.sceneCount} valid scenes)`);

  let testGate: unknown = { status: "PENDING" };
  try {
    testGate = JSON.parse(await readFile(join(outputDir, "test-results.json"), "utf8"));
  } catch {
    // Validation-only may be used to generate TTS/transcript before the full suite.
  }
  const visualVarietyGate = await evaluateProductionVisualVariety({
    outputDir, script, day: numberHighlightFile.day, transcript,
    historyPath: join(PROJECT_ROOT, "output", "visual-history.json"),
  });
  log.info(`  H VISUAL_VARIETY: ${visualVarietyGate.status}`);
  for (const warning of visualVarietyGate.warnings) log.warn(`  ${warning}`);
  let financePlan: ResolvedFinancePlan | undefined;
  let heroCaptions: ReturnType<typeof resolveHeroCaptions> = [];
  const financeGates: Record<string, unknown> = {};
  if (financeInput !== undefined) {
    if (financeInput.day !== numberHighlightFile.day) throw new Error("SOURCE_CONTRACT: finance plan Day differs from approved Day");
    const i = assessFinanceDataViz(financeInput, script, transcript, approvedVoice);
    financeGates.I_FINANCE_DATA_VIZ = i;
    if (i.status === "PASS") {
      financePlan = compileFinancePlan(financeInput, script, transcript, approvedVoice);
      assertFinanceHighlights(financePlan,resolvedNumberHighlights);
      sceneDynamics = assessSceneDynamics(transcript,[...visualCues,...financeVisualCues(financePlan,transcript)]);
      financeGates.J_MOTION_SEMANTICS = assessMotionSemantics(financePlan);
      if(financePlan.editorial) {
        heroCaptions=resolveHeroCaptions(JSON.parse(await readFile(join(outputDir,"hero-captions.json"),"utf8")),financePlan,transcript);
        const editorial=assessEditorial(financePlan,transcript,heroCaptions,script);
        const j=assessMotionSemantics(financePlan);
        financeGates.J_MOTION_SEMANTICS={...j,status:editorial.status==="FAIL"?"FAIL":j.status,editorial};
        await writeFile(join(outputDir,"editorial-validation.json"),JSON.stringify(editorial,null,2));
      }
      await writeFile(join(outputDir,"resolved-finance-plan.json"), JSON.stringify(financePlan,null,2));
    } else financeGates.J_MOTION_SEMANTICS = {status:"FAIL",errors:["Finance plan cannot be compiled"],warnings:[]};
  }
  const validationReport = {
    generatedAt: new Date().toISOString(),
    day: numberHighlightFile.day,
    gates: {
      A_SCRIPT_INTEGRITY: { status: "PASS", source: APPROVED_SCRIPT_FILE },
      B_NO_UNAPPROVED_COPY: { status: "PASS", visibleText: visibleTextAudit },
      C_THEME: { status: "PASS", theme: "money-habits", tokens: {
        navyDeep: "#071426", navySurface: "#0D2038", navyRaised: "#132B47",
        textPrimary: "#F5F1E8", textMuted: "#C9C2B5", accentGold: "#D7A928", accentAmber: "#F2C14E",
      } },
      D_TRANSCRIPT: { status: "PASS", provider: "edge-tts", boundarySource: "WordBoundary", whisper: false, voiceId: script.voice.voiceId },
      E_NUMBER_HIGHLIGHTS: numberHighlightGate,
      F_TEMPLATE_SCENE: sceneValidation,
      G_TESTS: testGate,
      H_VISUAL_VARIETY: visualVarietyGate,
      I_PRODUCTION_DURATION: assessProductionDuration(outroDwell.finalTargetSec, "planned"),
      ...financeGates,
    },
    approvedVoiceText: approvedVoice,
    outroDwell,
    sceneDynamics,
  };
  await persistProductionValidation(outputDir, validationReport);
  if (visualVarietyGate.status === "FAIL") assertProductionAllowed(validationReport.gates);

  let bgImageRelPath: string | null = null;
  if (imgResult.success) {
    bgImageRelPath = "images/bg.jpg";
  } else {
    log.warn(`Background image fetch failed: ${imgResult.reason} → using gradient fallback`);
  }

  // STEP 5
  log.step(5, TOTAL_STEPS, "Concat voice scenes + mix SFX layer");
  const voiceRawMp3 = join(outputDir, "voice-raw.mp3");
  const voiceMp3 = join(outputDir, "voice.mp3");
  await concatWithSilence(sceneAudio.map((a) => a.path), SCENE_GAP_SEC, voiceRawMp3);

  // Scene timing is sourced from transcript.json, never hard-coded.
  const sceneStarts: Record<string, number> = Object.fromEntries(
    transcript.scenes.map((scene) => [scene.id, scene.startMs / 1000]),
  );

  // Build SFX mix list using smart 3-tier selector
  const sfxIndex = indexSfxLibrary(SFX_DIR);
  const indexCats = Object.keys(sfxIndex).length;
  const indexFiles = Object.values(sfxIndex).reduce((s, a) => s + a.length, 0);
  log.info(`  SFX library: ${indexFiles} files in ${indexCats} categories`);

  const sfxList: SfxMixSpec[] = [];
  for (const scene of script.scenes) {
    const startSec = sceneStarts[scene.id];

    // Tier 1: explicit override in script.json
    if (scene.sfx) {
      if (scene.sfx.name === "none") {
        log.info(`  scene ${scene.id}: SFX disabled (explicit "none")`);
        continue;
      }
      const sfxPath = join(SFX_DIR, `${scene.sfx.name}.mp3`);
      if (existsSync(sfxPath)) {
        sfxList.push({ path: sfxPath, startSec: startSec + scene.sfx.startOffsetSec, volume: scene.sfx.volume });
        log.info(`  scene ${scene.id}: SFX override -> ${scene.sfx.name}.mp3`);
      } else {
        log.warn(`  scene ${scene.id}: explicit SFX not found, skipping: ${scene.sfx.name}.mp3`);
      }
      continue;
    }

    // Tier 2/3: smart selection by content + template
    const picked = pickSfxForScene({
      voiceText: scene.voiceText,
      templateName: scene.templateData.template,
      sceneId: scene.id,
      index: sfxIndex,
    });
    if (!picked) {
      log.warn(`  scene ${scene.id}: no SFX available (empty library?)`);
      continue;
    }

    const sfxPath = join(SFX_DIR, picked.relPath);
    const playback = defaultPlayback(picked);
    sfxList.push({ path: sfxPath, startSec: startSec + playback.offsetSec, volume: playback.volume });

    const why = picked.source === "semantic"
      ? `semantic match "${picked.matchedKeyword}"`
      : picked.source;
    log.info(`  scene ${scene.id}: SFX -> ${picked.relPath} (${why})`);
  }
  log.info(`  mixing ${sfxList.length} SFX into voice.mp3`);
  await mixSfxOntoVoice(voiceRawMp3, sfxList, voiceMp3);

  const totalAudioSec = await getDurationSec(voiceMp3);
  log.info(`  voice.mp3 total: ${totalAudioSec.toFixed(2)}s`);
  const durationAssessment = assessNarrationDuration(totalAudioSec);
  if (durationAssessment.status === "SHORT_APPROVED_NARRATION") {
    log.warn(`  DURATION_NOTICE: approved narration is ${totalAudioSec.toFixed(2)}s (<${DURATION_MIN_SEC}s); rendering without padding or artificial slowdown`);
  }
  Object.assign(validationReport, { duration: durationAssessment });
  await persistProductionValidation(outputDir, validationReport);

  if (process.env.VALIDATE_ONLY === "1") {
    log.info("VALIDATE_ONLY=1: stopping after A-H validation; no render performed");
    return;
  }
  assertProductionAllowed(validationReport.gates);

  // STEP 6 — Compose HTML + write hyperframes project files
  log.step(6, TOTAL_STEPS, "Compose HTML + project files");

  // Canonical Money Habits identity; legacy avatar.png belongs to another palette.
  // Keep old media immutable. Future renders use the palette-safe shared mark.
  const bundledAvatar = join(PROJECT_ROOT, "assets", "money-habits-avatar.svg");
  const ttAvatarFile = "tiktok-avatar.svg";
  const ttAvatarOut = join(outputDir, ttAvatarFile);
  if (cfg.tiktok.avatarUrl) throw new Error("THEME: Money Habits uses the approved shared avatar; external avatar requires brand review");
  await copyFile(bundledAvatar, ttAvatarOut);

  const sceneAudioFromTranscript = transcript.scenes.map((scene) => ({
    id: scene.id,
    durationSec: scene.durationMs / 1000,
    lastWordEndSec: Math.max(...scene.words.map((word) => word.endMs)) / 1000,
  }));

  const html = composeHtml({
    script,
    sceneAudio: sceneAudioFromTranscript,
    gapSec: SCENE_GAP_SEC,
    bgImageRelPath,
    audioRelPath: "voice.mp3",
    tiktok: cfg.tiktok,
    tiktokAvatarRelPath: ttAvatarFile,
    outroHoldSec: outroDwell.outroHoldSec,
    numberHighlights: resolvedNumberHighlights,
    visualCues,
    financePlan,
  });
  assertMoneyHabitsTheme(themeCss, `${JSON.stringify(script)}\n${html}`);

  // hyperframes expects: index.html (NOT composition.html), hyperframes.json, meta.json in DIR
  await writeFile(join(outputDir, "index.html"), html);

  await writeFile(join(outputDir, "hyperframes.json"), JSON.stringify(HYPERFRAMES_CONFIG, null, 2));

  const slug = basename(outputDir);
  await writeFile(join(outputDir, "meta.json"), JSON.stringify({
    id: slug,
    name: script.metadata.title,
    createdAt: new Date().toISOString(),
  }, null, 2));

  // Copy templates next to the index.html so relative paths resolve.
  // base.html.tmpl + animations.js are shared across themes (structure/behavior);
  // only styles.<theme>.css differs (visual look), and always lands as "styles.css".
  await copyFile(join(TPL_DIR, "styles.css"), join(outputDir, "styles.css"));
  await copyFile(join(TPL_DIR, "animations.js"), join(outputDir, "animations.js"));

  // STEP 7
  log.step(7, TOTAL_STEPS, "Render with hyperframes");
  const videoPath = join(outputDir, "video.mp4");
  await renderWithHyperframes({ compositionDir: outputDir, outputPath: videoPath });

  // Merge SRT subtitles & burn onto video
  log.info("Merging scene subtitles into master subtitles.srt...");
  const srtPath = join(outputDir, "subtitles.srt");
  const subtitleScenes = script.scenes.map((s) => ({
      id: s.id,
      srtPath: join(outputDir, "voice", `scene-${s.id}.srt`),
      startSec: sceneStarts[s.id] ?? 0,
    }));
  await mergeSceneSrts(subtitleScenes, srtPath);
  const assPath = join(outputDir, "subtitles.ass");
  await mergeSceneKaraokeAss(subtitleScenes, assPath, 46, SUBTITLE_MARGIN_V);
  if(financePlan?.editorial) await writeFile(assPath,editorialKaraokeAss(transcript,heroCaptions,script));

  const bgMusic = join(__dirname, "..", "assets", "music_library", "default.mp3");
  const rawVideo = join(outputDir, "video-raw.mp4");
  await copyFile(videoPath, rawVideo);
  const subtitledVideo = join(outputDir, "video-subtitled.mp4");

  await burnSubtitles({
    videoInput: rawVideo,
    srtPath: assPath,
    videoOutput: subtitledVideo,
    bgMusicPath: existsSync(bgMusic) ? bgMusic : undefined,
    bgMusicVolume: 0.12,
    fontSize: 46,
    marginV: SUBTITLE_MARGIN_V,
    subtitleColor: "white",
  });

  // Windows/OneDrive can reject rename-over-existing with EPERM. Copying over
  // the destination is reliable and the raw render is already preserved.
  await copyFile(subtitledVideo, videoPath);
  await rm(subtitledVideo, { force: true });
  const finalVideoSec = await getVideoDurationSec(videoPath);
  validationReport.gates.I_PRODUCTION_DURATION = assessProductionDuration(finalVideoSec, "measured");
  await persistProductionValidation(outputDir, validationReport);
  assertProductionAllowed(validationReport.gates);

  // STEP 8
  log.step(8, TOTAL_STEPS, "Done");
  console.log("\n=== Result ===");
  console.log(`Video:  ${videoPath}`);
  console.log(`Audio:  ${voiceMp3}  (cho CapCut)`);
  console.log(`Script: ${join(outputDir, "script.txt")}  (cho CapCut auto-caption)`);
  console.log(`Subtitles: ${srtPath}`);
  console.log(`Karaoke: ${assPath}`);
  console.log(`Tong thoi luong: ${totalAudioSec.toFixed(2)}s`);
}
