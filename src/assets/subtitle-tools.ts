import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { log } from "../utils/logger.js";

export interface SrtCue {
  startMs: number;
  endMs: number;
  text: string;
}

function parseTimecode(tc: string): number {
  const [hms, msStr] = tc.trim().split(/[,.]/);
  const [h, m, s] = hms.split(":").map(Number);
  const ms = Number(msStr.padEnd(3, "0").slice(0, 3));
  return (h * 3600 + m * 60 + s) * 1000 + ms;
}

function formatTimecode(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const msec = Math.floor(ms % 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number, z = 2) => String(n).padStart(z, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(msec, 3)}`;
}

function formatAssTimecode(ms: number): string {
  const totalCentiseconds = Math.max(0, Math.round(ms / 10));
  const cs = totalCentiseconds % 100;
  const totalSec = Math.floor(totalCentiseconds / 100);
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export function parseSrt(content: string): SrtCue[] {
  const normalized = content.replace(/\r\n/g, "\n");
  const blocks = normalized.trim().split(/\n\n+/);
  const cues: SrtCue[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length < 2) continue;
    const timeLine = lines[0].includes("-->") ? lines[0] : lines[1];
    const textLines = lines[0].includes("-->") ? lines.slice(1) : lines.slice(2);
    if (!timeLine || !timeLine.includes("-->")) continue;

    const [startStr, endStr] = timeLine.split("-->");
    const text = textLines.join(" ").trim();
    if (!text) continue;

    cues.push({
      startMs: parseTimecode(startStr),
      endMs: parseTimecode(endStr),
      text,
    });
  }

  return cues;
}

export function serializeSrt(cues: SrtCue[]): string {
  return cues
    .map((cue, idx) => {
      return `${idx + 1}\n${formatTimecode(cue.startMs)} --> ${formatTimecode(cue.endMs)}\n${cue.text}\n`;
    })
    .join("\n");
}

export function groupWordCues(cues: SrtCue[], maxWords = 4, maxDurationMs = 2400): SrtCue[][] {
  if (cues.length === 0) return [];
  const grouped: SrtCue[][] = [];
  let currentGroup: SrtCue[] = [];

  for (const cue of cues) {
    if (currentGroup.length === 0) {
      currentGroup.push(cue);
      continue;
    }
    const groupDuration = cue.endMs - currentGroup[0].startMs;
    const gapFromPrev = cue.startMs - currentGroup[currentGroup.length - 1].endMs;
    const prevText = currentGroup[currentGroup.length - 1].text;
    const endsWithPunctuation = /[.?!,]$/.test(prevText);

    if (
      currentGroup.length >= maxWords ||
      groupDuration > maxDurationMs ||
      gapFromPrev > 350 ||
      endsWithPunctuation
    ) {
      grouped.push(currentGroup);
      currentGroup = [cue];
    } else {
      currentGroup.push(cue);
    }
  }

  if (currentGroup.length > 0) {
    grouped.push(currentGroup);
  }

  return grouped;
}

export function groupWordCuesIntoPhrases(cues: SrtCue[], maxWords = 4, maxDurationMs = 2400): SrtCue[] {
  return groupWordCues(cues, maxWords, maxDurationMs).map((group) => ({
    startMs: group[0].startMs,
    endMs: group[group.length - 1].endMs,
    text: group.map((cue) => cue.text).join(" "),
  }));
}

export async function mergeSceneSrts(
  scenes: Array<{ id: string; srtPath: string; startSec: number }>,
  outputPath: string
): Promise<void> {
  const allCues: SrtCue[] = [];

  for (const scene of scenes) {
    if (!existsSync(scene.srtPath)) continue;
    const content = await readFile(scene.srtPath, "utf8");
    const rawCues = parseSrt(content);
    // Group single words into smooth, readable 3-4 word phrases
    const phrasedCues = groupWordCuesIntoPhrases(rawCues);
    const offsetMs = Math.round(scene.startSec * 1000);

    for (const cue of phrasedCues) {
      allCues.push({
        startMs: cue.startMs + offsetMs,
        endMs: cue.endMs + offsetMs,
        text: cue.text.toUpperCase(),
      });
    }
  }

  // Sort by start time
  allCues.sort((a, b) => a.startMs - b.startMs);
  const srtContent = serializeSrt(allCues);
  await writeFile(outputPath, srtContent, "utf8");
  log.info(`Merged ${allCues.length} subtitle cues (phrased) -> ${outputPath}`);
}

interface KaraokePhrase {
  startMs: number;
  endMs: number;
  words: SrtCue[];
}

function escapeAssText(text: string): string {
  return text.replace(/[{}]/g, "").replace(/\\/g, "");
}

export function serializeKaraokeAss(phrases: KaraokePhrase[], fontSize = 46, marginV = 450): string {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: WordFocus,Arial,${fontSize},&H00B5C2C9,&H00B5C2C9,&H00261407,&H00261407,-1,0,0,0,100,100,0,0,1,4,2,2,60,60,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const dialogue = phrases.flatMap((phrase) => {
    const plainText = phrase.words
      .map((word) => escapeAssText(word.text.toUpperCase()))
      .join(" ");
    const lines = [
      `Dialogue: 0,${formatAssTimecode(phrase.startMs)},${formatAssTimecode(phrase.endMs)},WordFocus,,0,0,0,,{\\fad(80,100)}${plainText}`,
    ];

    for (let activeIndex = 0; activeIndex < phrase.words.length; activeIndex += 1) {
      const activeWord = phrase.words[activeIndex];
      const focusedText = phrase.words.map((word, index) => {
        const text = escapeAssText(word.text.toUpperCase());
        if (index === activeIndex) {
          return `{\\alpha&H00&\\c&H0028A9D7&}${text}{\\alpha&HFF&}`;
        }
        return text;
      }).join(" ");
      lines.push(
        `Dialogue: 1,${formatAssTimecode(activeWord.startMs)},${formatAssTimecode(activeWord.endMs)},WordFocus,,0,0,0,,{\\alpha&HFF&}${focusedText}`,
      );
    }

    return lines;
  });

  return `${header}\n${dialogue.join("\n")}\n`;
}

export async function mergeSceneKaraokeAss(
  scenes: Array<{ id: string; srtPath: string; startSec: number }>,
  outputPath: string,
  fontSize = 46,
  marginV = 450,
): Promise<void> {
  const phrases: KaraokePhrase[] = [];

  for (const scene of scenes) {
    if (!existsSync(scene.srtPath)) continue;
    const content = await readFile(scene.srtPath, "utf8");
    const offsetMs = Math.round(scene.startSec * 1000);

    for (const group of groupWordCues(parseSrt(content))) {
      const words = group.map((cue) => ({
        ...cue,
        startMs: cue.startMs + offsetMs,
        endMs: cue.endMs + offsetMs,
      }));
      phrases.push({
        startMs: words[0].startMs,
        endMs: words[words.length - 1].endMs,
        words,
      });
    }
  }

  phrases.sort((a, b) => a.startMs - b.startMs);
  await writeFile(outputPath, serializeKaraokeAss(phrases, fontSize, marginV), "utf8");
  log.info(`Merged ${phrases.length} word-focus subtitle cues -> ${outputPath}`);
}

export interface BurnSubtitlesOpts {
  videoInput: string;
  srtPath: string;
  videoOutput: string;
  bgMusicPath?: string;
  bgMusicVolume?: number; // default 0.12
  fontSize?: number;      // default 44 (scaled for 1080x1920)
  marginV?: number;       // default 450 (raised safe zone: below cards, above TikTok UI)
  subtitleColor?: "white" | "yellow";
}

export async function burnSubtitles(opts: BurnSubtitlesOpts): Promise<void> {
  const {
    videoInput,
    srtPath,
    videoOutput,
    bgMusicPath,
    bgMusicVolume = 0.12,
    fontSize = 44,
    marginV = 450,
    subtitleColor = "white",
  } = opts;

  // Escape colon and backslashes for FFmpeg filter on Windows
  const cleanSrt = srtPath.replace(/\\/g, "/").replace(/:/g, "\\:");
  const primaryColor = subtitleColor === "yellow" ? "&H006DE6FF" : "&H00FFFFFF";
  // Explicitly set PlayResX=1080 and PlayResY=1920 so MarginV and FontSize are pixel-accurate
  const forceStyle = `PlayResX=1080,PlayResY=1920,FontName=Arial,FontSize=${fontSize},Bold=1,PrimaryColour=${primaryColor},OutlineColour=&HCC000000,BorderStyle=1,Outline=4,Shadow=2,Alignment=2,MarginV=${marginV}`;
  const subtitleFilter = srtPath.toLowerCase().endsWith(".ass")
    ? `subtitles='${cleanSrt}'`
    : `subtitles='${cleanSrt}':force_style='${forceStyle}'`;

  const hasMusic = bgMusicPath && existsSync(bgMusicPath);
  const args: string[] = ["-y", "-i", videoInput];

  if (hasMusic) {
    args.push("-stream_loop", "-1", "-i", bgMusicPath);
    args.push(
      "-filter_complex",
      `[0:v]${subtitleFilter}[v_out];` +
      `[0:a]volume=1.0[voice];` +
      `[1:a]volume=${bgMusicVolume}[bg];` +
      `[voice][bg]amix=inputs=2:duration=first:dropout_transition=2,` +
      `loudnorm=I=-14:TP=-1:LRA=11[a_out]`,
      "-map", "[v_out]",
      "-map", "[a_out]",
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "22",
      "-maxrate", "12M",
      "-bufsize", "24M",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-c:a", "aac",
      "-b:a", "192k",
      "-shortest",
      videoOutput
    );
  } else {
    args.push(
      "-vf",
      subtitleFilter,
      "-af", "loudnorm=I=-14:TP=-1:LRA=11",
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "22",
      "-maxrate", "12M",
      "-bufsize", "24M",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-c:a", "aac",
      "-b:a", "192k",
      videoOutput
    );
  }

  log.info(`Burning subtitles onto video with FFmpeg...`);
  await new Promise<void>((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr?.on("data", (d) => { stderr += d.toString(); });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg subtitle burn failed (exit ${code}): ${stderr.slice(-500)}`));
      }
    });
    proc.on("error", reject);
  });

  log.info(`Burned subtitles complete -> ${videoOutput}`);
}
