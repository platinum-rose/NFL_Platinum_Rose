---
inclusion: always
description: NFL Dashboard — project patterns and lessons learned
---

# Lessons Learned — NFL Dashboard

Accumulated patterns from development sessions.
Review before starting any session. Add discoveries after each session.

---

## localStorage Patterns

### Canonical Key Registry
All localStorage keys MUST be registered in `hooks/scripts/localstorage-guard.js`.
Removing or renaming a key without a migration causes silent data loss for users
with existing data. Always add migration code alongside any key change.

### Key Naming Convention
`nfl_<domain>_<entity>` — e.g., `nfl_picks_current`, `nfl_bankroll_state`.
Never use generic keys that could collide with other apps.

---

## Agent Architecture

### Betting Agent Tool Schema
All betting agents use `betting.manifest.json` for tool schemas.
Model routing: Sonnet for analysis, Opus for strategy/planning.
Never import agent tools outside the manifest — runtime loads from manifest only.

### Context Behavioral Modes
Active context modes: `offseason`, `season-active`, `dev`, `research`, `review`.
Load the correct mode file from `contexts/` at session start.
`offseason` mode disables live odds refresh and API agents.

---

## API / Data Patterns

### Supabase Table Ownership
Tables: `odds_snapshots`, `line_movements`, `game_results`, `user_picks`,
`futures_odds`, `podcast_transcripts`, `user_bankroll_bets`.
Never query without `.select()` column projection — avoids over-fetching.

### Team Normalization
All team names must go through the team normalizer agent before storage.
Raw team names from different sources use different formats (e.g., "KC" vs
"Kansas City" vs "Chiefs"). The normalizer resolves to canonical form.

---

## Hot Files (Require PM Lock)

Files that must not be edited without explicit PM approval:
- `src/App.jsx` — root routing; any change breaks navigation
- `src/utils/storage.js` — localStorage key definitions; breaking changes
  silently corrupt user data
- `src/utils/picksDatabase.js` — picks schema; column changes require migration

---

## Testing

### Playwright Smoke Tests
12 tab smoke tests exist. Run before any PR merge.
Full suite takes ~3 minutes on local machine.
Flaky tests: none currently known — if a test flakes twice, investigate immediately.

---

*Add new patterns here after each session.*

---

## S235 — 2026-06-29

### AssemblyAI speech_models
`speech_model: 'best'` is fully deprecated. Replacement is `speech_models: ['universal-3-pro', 'universal-2']` — an array of two models. Single-element arrays are also rejected.

### whisperX + Python 3.14 incompatibility
whisperX requires Python `<3.14`. M6 `.venv` is Python 3.14. Fix: create `.venv-whisperx` with Python 3.12 for transcription/diarization only. `config.js pythonExecutable` is already overridable per-step.

### huggingface-cli deprecated on M6
Use `hf auth login` instead of `huggingface-cli login`. Upgrade with `hf update`.

### Local LLM vs cloud for one-off extraction
When API keys are exhausted, reading the full transcript into a long-context LLM in a single shot is viable and often better than chunked Ollama for debug/ad-hoc runs. Chunked Ollama is right for automated production.

### Speaker attribution: two distinct layers
(1) Diarization — who is SPEAKER_0 vs SPEAKER_1 (audio signal, pyannote/AssemblyAI). (2) Name resolution — speaker ID → real name (transcript text + experts roster). Fail independently; label separately in output (green = diarized, amber = context-inferred).

### Fuzzy alias matching for rotating hosts
For shows with rotating casts, use `rapidfuzz` against `experts.js` aliases over first 5 min of transcript. Threshold 0.82 handles transcription noise (e.g. "Woolcock"→"Wilcock"). Zero per-show host maintenance.

### M6 hardware confirmed 2026-06-29
AMD Ryzen 5 7640HS, 12 cores, 24 GB RAM, CPU-only. Peak podcast pipeline memory ~12-14 GB — fits in 22 GB available. Radeon 760M is integrated; do not attempt ROCm. Stored in `.nfl/memory.json` under `infrastructure.m6`.
