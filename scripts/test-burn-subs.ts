import { mergeSceneSrts, burnSubtitles } from "../src/assets/subtitle-tools.js";
import { getDurationSec } from "../src/assets/audio-tools.js";
import { join } from "node:path";
import { readdir, rename, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";

async function main() {
  const dir = join(process.cwd(), "output", "day-1");
  const voiceDir = join(dir, "voice");

  // Read scenes from script.json
  const scriptJson = JSON.parse(await (await import("node:fs/promises")).readFile(join(dir, "script.json"), "utf8"));
  
  let cursor = 0;
  const GAP_SEC = 0.3;
  const sceneItems: Array<{ id: string; srtPath: string; startSec: number }> = [];

  for (const scene of scriptJson.scenes) {
    const mp3 = join(voiceDir, `scene-${scene.id}.mp3`);
    const srt = join(voiceDir, `scene-${scene.id}.srt`);
    const dur = await getDurationSec(mp3);
    sceneItems.push({
      id: scene.id,
      srtPath: srt,
      startSec: cursor,
    });
    cursor += dur + GAP_SEC;
  }

  const srtPath = join(dir, "subtitles.srt");
  await mergeSceneSrts(sceneItems, srtPath);
  console.log(`Merged subtitles saved to ${srtPath}`);

  // Backup original raw video if not already backed up
  const rawVideo = join(dir, "video-raw.mp4");
  const finalVideo = join(dir, "video.mp4");
  const outputVideo = join(dir, "video-subtitled.mp4");

  if (!existsSync(rawVideo)) {
    await copyFile(finalVideo, rawVideo);
    console.log(`Backed up raw video to ${rawVideo}`);
  }

  const bgMusic = join(process.cwd(), "assets", "music_library", "default.mp3");

  await burnSubtitles({
    videoInput: rawVideo,
    srtPath: srtPath,
    videoOutput: outputVideo,
    bgMusicPath: existsSync(bgMusic) ? bgMusic : undefined,
    bgMusicVolume: 0.12,
    fontSize: 24,
    marginV: 180,
    subtitleColor: "white",
  });

  // Replace final video
  await rename(outputVideo, finalVideo);
  console.log(`Successfully replaced ${finalVideo} with subtitled video!`);
}

main().catch(console.error);
