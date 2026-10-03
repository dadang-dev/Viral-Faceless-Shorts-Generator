# Day 6 v1.2 — illustrated rich-story / seamless handoff

Updated 2026-10-01. Status: READY_FOR_VISUAL_REVIEW; independent human visual
and listening approval is still PENDING.

## Current candidate

- MP4: output/benchmarks/day-6-v12-rich-story-seamless-crossfade/video.mp4
- SHA256: 8f33207866be60b7e4eee07ea5e5c5cfa5985a6f00d7c9419bc582704876e0d8
- H.264 + AAC, 1080×1920, 30 fps; video stream 63.266667 s, container 63.300 s.
- Canonical source: money-habits-script-v2.1-verified.md, SHA256
  0d79277b3c72d59aa41bb0c5848e3ebd59303ab3971b61dd4353deef52639d4f.
- Voice was reused (ttsRegenerated: false); audio-reuse and transcript checks
  confirm the WordBoundary data is unchanged. Caption-boundary and
  section-caption-redundancy checks pass; 145 source words are covered.

The four source-linked story sequences retain the canonical voice and approved
numbers: scarcity/checkout, the tight-wallet college memory, knowing versus
feeling safe, and one exact $5-per-week coin moving from wallet to savings jar.
No derived totals, new financial claims, SFX or narration edits were introduced.
The final visual holds through the existing CTA entrance, then hands off using
the locked brand outro.

Day 6 keeps the shared 180 ms semantic transition. Its rendered handoffs use a
20 ms local overlap to avoid a frame-grid-aligned zero-opacity seam; this does
not change the shared default or retime narration. The weekly-savings sequence
is held only through the 180 ms profile-CTA crossfade, not the full silent CTA
dwell.

## QA results

| Gate | Result | Evidence |
| --- | --- | --- |
| A Script integrity | PASS | Exact approved Day 6 narration and canonical source hash |
| B Visible copy | PASS | Editorial copy/source validation |
| C Theme | PASS | Locked DifferentActually theme |
| D Transcript | PASS | Edge TTS WordBoundary reused unchanged |
| E Number highlights | PASS | Source-linked exact $5 / weekly qualifier |
| F Template scene plan | PASS | Canonical Day 6 scene plan |
| G Tests/build | PASS | 330 Node + 25 Python tests; typecheck, frontend build and lint |
| H Visual variety | WARNING | Layout direction repeats recent Day 4; similarity 0.779, history coverage 2 |
| I Finance/data-viz | PASS | Exact source literal only; no derived values |
| J Motion semantics | PASS | No remaining low-motion warning |
| Caption integrity | PASS | Boundary integrity and redundancy checks; 145 source words |
| Temporal collision | PASS | 799 actual-GSAP snapshots, 0 failures |
| Story/art geometry | PASS | 110 scene/reveal samples, 108 visible-art samples, 920 bounds checks, 0 failures |
| Decoded frame scan | PASS | 1,898 frames; black=0, white=0, abrupt-luma=0, low-detail=0 |
| Duration / streams | PASS | 1080×1920 / 30 fps / H.264 + AAC / 63.3 s container |
| Protected-artifact hashes | PASS | 281-entry baseline unchanged |

Dense phrase/event contact sheets were generated and the three scene handoffs,
weekly-savings outro, overall sequence, and saved story stills were visually
sampled. The former outro gap and handoff low-detail frames are absent in this
candidate. The subtitle/audio has not been subjectively listened to by a human;
automated media-stream checks are not human approval.

Non-blocking diagnostics: the QA browser reports an ancillary favicon.ico
404; HyperFrames reports its existing 519-line composition-size advisory.
Neither affected GSAP/font loading or the rendered output. Both MP4 streams and
the CTA are present. Human review is required before production approval.

## Preserved earlier candidates

No prior render was overwritten or deleted. Earlier isolated candidates remain
available as diagnostic history:

- day-6-v12-rich-story/video.mp4 — 391f041de877d86b004895ea35e9b5563d4b8f87ebe6559134934531ce466d75
- day-6-v12-rich-story-continuity/video.mp4 — 0fc6722ff788c8a06d2826ea2fdf23b4111fdc0f4f3c0d8dc1eba854ca5ff05a
- day-6-v12-rich-story-cta-hold/video.mp4 — d8343b91d7413056a60f1b15d94b987a516701bd7b24e7a8372d2419387ef505
- day-6-v12-rich-story-cta-handoff/video.mp4 — f07a505b969a2f829594fb4b19e1baa80a57d070cccabd987eac02d580320e3d
- day-6-v12-rich-story-clean-handoff/video.mp4 — c8910b88e096004b652f3ea999863ac01087dcc00cbba97f929f05946bcb47dd

The current seamless-crossfade folder is the sole latest Day 6 review
candidate. The earlier candidates are not production-approved.
