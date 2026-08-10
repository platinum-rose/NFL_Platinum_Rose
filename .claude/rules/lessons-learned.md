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

---

## S325 (2026-08-10 continuation) — FantasyPros §2 UI / §3 projections / §4 injuries

### This Cowork sandbox cannot make ANY outbound network call — confirmed independently of F-31
`node -e "fetch('https://api.fantasypros.com/...')"` returned a bare `fetch failed` with no
further detail, for a plain `fetch()` call made directly (not through any agent/CLI wrapper).
This matches TASK_BOARD F-31's finding ("Node's fetch/dns don't route through the sandbox's
mandatory proxy that curl uses automatically") but was reconfirmed fresh, from a different
angle, rather than assumed from that entry's text. **Rule: before claiming a script is
"live-verified" in a Cowork session, actually run a live call and look at the result — don't
infer "should work" from the code looking correct.** Everything built this session (§3
projections, §4 injuries, plus the §2 React UI's fallback-to-empty-state paths) was verified
via `node --check`/`esbuild` syntax checks and plain-node harness logic tests only; real
live/Supabase verification is explicitly flagged as outstanding, not silently assumed done.

### A script that "never needed env vars before" can silently break when a new code path does
`scripts/build-player-availability.js` had no `import 'dotenv/config'` — harmless for years
because its only live source (ESPN's injuries feed) takes no API key. Adding a second source
(FantasyPros, which does need `FANTASYPROS_API_KEY`) silently failed with "Missing
FANTASYPROS_API_KEY" even though the real key was sitting in `.env`, because nothing had ever
loaded `.env` into `process.env` in that file. Caught by actually running the new flag
(`--live-fantasypros-injuries --dry-run`) rather than trusting that "the ingest scripts already
load dotenv, so it must be fine here too" — this file wasn't one of the ingest scripts.
**Rule: when adding a new external-API code path to a script that previously had none, verify
the script itself loads its env vars — don't assume a sibling script's `dotenv` import means
env vars are available repo-wide.**

### When a scope doc gives mapping arrows but not raw field names, don't guess one shape and hardcode it
The FantasyPros API integration doc specifies §4's mapping *intent* (`injury_status ← status`,
`short_comment ← comment`, `reported_at ← injury_update_date`) but not the endpoint's exact raw
player/team/position field names — and this repo's own §1-§2 build already proved every
FantasyPros endpoint uses *different* field names for the same concept (`/nfl/players`:
`player_name`/`position_id`/`team_id`; `/consensus-rankings`: `player_name`/
`player_position_id`/`player_team_id`). With no way to make a live call from this sandbox to
check, `agents/lib/fantasypros-injuries.js` was written with a `firstDefined()` fallback-chain
helper checking several plausible field names per value, instead of picking one guess and
hardcoding it -- plus a prominent file-header comment flagging exactly what's unconfirmed and
what command to run natively to confirm/correct it. **Rule: when a spec describes a mapping's
*intent* but the exact source field names are unconfirmed and can't be verified live, write the
mapper defensively (multiple plausible field names per value) and document the uncertainty
loudly in the file itself -- don't silently pick one guess as if it were confirmed, and don't
block the whole build waiting for a live check that isn't available in the current environment.**

### S325 addendum, same day: a live "0 rows, no error" result is itself a diagnostic signal, not a dead end
`§3`'s first live dry-run (`ingest-fantasypros-projections:dry`) mapped 0/84 rows across
every position with zero errors thrown — easy to misread as "the API returned nothing" or
"bad key/plan" (the script's own error message even suggested checking plan/tier). The
real cause was structural, not data-availability: `/nfl/{season}/projections` nests every
stat/points field under a `stats` sub-object (`player.stats.points`), while the mapper
assumed the same flat shape already confirmed live for 3 *other* FantasyPros endpoints
(`/nfl/players`, `/consensus-rankings`, and even `/nfl/injuries` earlier this same
session). The exact same raw-vs-mapped diagnostic dump technique used to confirm §4 (fetch
the real endpoint, `console.log` both the raw response and the mapper's output side by
side) found this in one shot. **Rule: when a live run of a newly-built ingest returns zero
rows with no thrown error, don't trust the error message's own guess at the cause (plan
tier, missing data, etc.) — get a raw-vs-mapped diagnostic dump before assuming anything,
the same way you would for a crash.** A silent empty result is exactly as diagnosable as a
loud failure if you go look at the actual payload; the previously-confirmed shape of
*sibling* endpoints on the same API is not evidence for this endpoint's shape, even from
the same vendor, even same day.
