# PauseFlow — Money Habits

Production pipeline for seven US TikTok personal-finance psychology videos. Scripts and scene plans are parsed from Markdown; no LLM/API is used for writing or scene splitting. Voice uses Edge TTS and media generation is a deliberate manual handoff to CapCut Pro / Seedance.

## Locked production input

- Input: `money-habits-ALL-v4.md`
- Voice: `en-US-ChristopherNeural`, normal rate (`+0%`)
- Scene counts: `6 / 7 / 7 / 7 / 7 / 7 / 6` (47 total)
- Voice-over text is unchanged from the validated v3 input.
- Style Bible: `assets/style_bible.txt`

## Workflow

Use the project virtual environment from the repository root.

### 1. Prepare production packages

```bash
venv/bin/python main.py prepare --days all
```

This creates one directory per day under `output/production/`, containing:

- `pending_prompts/scene_N.txt`
- locked `voice.mp3` and timing-validated `subtitles.srt`
- `manifest.json` with expected filenames, caption, hashtags and engagement prompt
- `metadata.json` with the required pre-publish AI-content review reminder
- an empty `manual_clips/` directory

To prepare selected days, use `--days 1,3,7`. Do not use `--regenerate-audio` unless intentionally starting a new TTS validation cycle.

### 2. Generate CapCut/Seedance clips

For each day:

1. Open each prompt from `pending_prompts/` in numeric order.
2. Generate the clip manually in CapCut Pro / Seedance.
3. Export it as `scene_1.mp4`, `scene_2.mp4`, and so on.
4. Place it in that day's `manual_clips/` directory.

The pipeline intentionally has no CapCut/Seedance/Kling API integration and never spends credits automatically.

### 3. Check readiness

```bash
venv/bin/python main.py status --days all
```

### 4. Render

```bash
venv/bin/python main.py render --days 1
```

Render refuses to start if any expected clip is missing. The result is saved as `final.mp4` in the corresponding production directory.

Before publishing, replace `assets/music_library/default.mp3` with properly licensed/trending music, review subtitle recognition, and follow the AI-content disclosure reminder in `metadata.json`.

## Optional local GUI

The GUI is only an interface over the same core pipeline.

```bash
venv/bin/python pauseflow_server.py
cd frontend && npm run dev
```

Open `http://localhost:5173`. The GUI does not call an LLM, rewrite source files or generate dummy production clips.

## Verification

```bash
PYTHONPYCACHEPREFIX=/tmp/pauseflow-pycache venv/bin/python -m compileall -q main.py pauseflow pauseflow_server.py scripts
venv/bin/python -m examples.test_phase3
cd frontend && npm run build
```

The project cannot claim a real-media end-to-end PASS until at least one complete set of CapCut/Seedance clips has been placed in `manual_clips/` and rendered. That manual boundary is intentional.
