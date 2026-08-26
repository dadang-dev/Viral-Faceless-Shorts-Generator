# PROJECT COMPLETION STATUS

Updated: 2026-08-11

## Completed in code

- Approved 47-scene structure implemented in `money-habits-ALL-v4.md`.
- Voice-over, captions and engagement copy verified identical to locked v3.
- Parser and prompt generation pass all seven days at scene counts 6/7/7/7/7/7/6.
- Prompt totals cover approximately 62–68 seconds per day.
- Non-blocking production preparation exports all 47 prompts, locked voice, SRT, manifest and disclosure metadata.
- Render phase fails fast when a manual clip is missing and writes `final.mp4` only from a complete ordered set.
- Post-render QC checks duration over 60 seconds, portrait orientation, video and audio streams.
- GUI now orchestrates the core v4 pipeline; OpenRouter generation, canonical overwrite and dummy-production path were removed.
- Configuration and documentation now match Edge TTS + manual CapCut/Seedance architecture.
- Unit tests, API tests, frontend production build and FFmpeg renderer test pass.

## Prepared production assets

`output/production/day1_3_spending_habits` through `day7_week_recap` contain 47 prompt files and all non-video assets required for the manual handoff.

## External production gate

The software is complete, but publishable videos cannot be produced without human-created CapCut/Seedance clips. Each expected file must be exported to the corresponding `manual_clips/` directory. The repository intentionally contains no automated Seedance API and does not spend credits.

After clips arrive:

1. Run `venv/bin/python main.py status --days all`.
2. Run `venv/bin/python main.py render --days all`.
3. Confirm each `qc_report.json` passes.
4. Replace the test background audio with licensed/trending music before the final publish render.
5. Review subtitle wording and apply the platform AI-content disclosure as indicated by `metadata.json`.
