import { describe, expect, it } from "vitest";
import { groupWordCues, serializeKaraokeAss, type SrtCue } from "./subtitle-tools.js";

describe("karaoke subtitles", () => {
  it("keeps word timing while grouping readable phrases", () => {
    const cues: SrtCue[] = [
      { startMs: 100, endMs: 300, text: "hello" },
      { startMs: 320, endMs: 600, text: "world" },
    ];

    expect(groupWordCues(cues)).toEqual([cues]);
  });

  it("highlights only the active uppercase word for its spoken interval", () => {
    const ass = serializeKaraokeAss([{
      startMs: 100,
      endMs: 600,
      words: [
        { startMs: 100, endMs: 300, text: "hello" },
        { startMs: 320, endMs: 600, text: "world" },
      ],
    }]);

    expect(ass).not.toContain("{\\k");
    expect(ass).toContain("Dialogue: 0,0:00:00.10,0:00:00.60");
    expect(ass).toContain("Dialogue: 1,0:00:00.10,0:00:00.30");
    expect(ass).toContain(",60,60,450,1");
    expect(ass).toContain("{\\alpha&H00&\\c&H0028A9D7&}HELLO{\\alpha&HFF&} WORLD");
    expect(ass).toContain("HELLO {\\alpha&H00&\\c&H0028A9D7&}WORLD{\\alpha&HFF&}");
  });
});
