# 2026-07-25 YouTube Gemini Shadow Harness & Local Intel Handoff (S300 + S301)

## Objective

Combine and record the completed milestones from **Session 300** (YouTube OAuth, candidate discovery, human review gate, local intel export, agent-intel summary) and **Session 301** (Gemini 3.5 Flash multimodal audio pipeline validation, decoupling `--simulate` vs `--live-shadow` in the shadow harness, raw Gemini response persistence, real non-circular 7-dimension match scoring, architecture specs, and cost benchmarking).

This workstream remains local-only reviewed intel and shadow evaluation. It does not authorize official picks, production recommendations, Supabase writes, live analyst/model recommendation runs, or open-parlay changes without explicit user approval.

---

## Verified State & Key Milestones

### Session 300 Milestones (Local Intel Pipeline & Review Gate)
- **YouTube OAuth & Discovery**: Configured OAuth and candidate discovery (`scripts/youtube-podcast-sweep.js`).
- **Pilot Dataset**: Processed 11 futures-eligible YouTube candidates.
- **Human Review Gate**: Promoted 39 items to local intel, rejected 1 invalid item (`DET division_winner +1500` from `youtube-4OxpAX6UJlM` due to `price_not_in_quote`).
- **Agent Intel Summary**: Exported 39 promoted items (`29 futures_pick`, `4 injury_intel`, `6 non_futures_betting`). Leak check confirmed `det_division_winner_plus_1500: 0`.

### Session 301 Milestones (Gemini 3.5 Flash Shadow Harness & Specs)
- **Multimodal Audio Pass**: Validated direct YouTube `.m4a` audio stream download via `yt-dlp` (25.5 MB in 1s) and direct upload to Gemini 3.5 Flash File API.
- **Gold-Standard Vault Note**: Reconciled and saved full-scope 13-team gold-standard note for `2026-03-03-sharp-or-square-early-2026-nfl-season-win-totals-part-1.md` in `data/vault-seed/manual/`.
- **Harness Mode Decoupling**: Refactored `scripts/gemini-podcast-shadow-harness.js` into two explicit modes:
  - `--simulate`: Local dry-run testing.
  - `--live-shadow`: Real Gemini 3.5 Flash API calls via `scripts/run_gemini_live_shadow.py`.
- **Raw Response Persistence**: Saves raw Gemini output to `data/shadow-harness/observations/<episode>-raw-gemini.json`.
- **Authentic Non-Circular Scoring**: Scores Gemini's actual extracted output against independent ground truth across 7 dimensions (`team`, `market`, `side`, `line`, `price`, `speaker`, `source_timestamp`).
- **Telemetry Verified**: Measured real end-to-end API latency (~20.9s to 32.8s) and real API cost (~$0.002 to $0.004 per run).
- **Architecture & Financial Specs Created**:
  - `docs/antigravity/GEMINI_AUDIO_MIGRATION_SPEC.md`
  - `docs/antigravity/FULL_TEST_TRANSCRIPTION_COMPARISON.md`
  - `docs/antigravity/architecture_map.md`
  - `docs/antigravity/google_vault_intake_architecture.md`
  - `docs/antigravity/README.md`
- **npm Script**: Added `"podcast:shadow": "node scripts/gemini-podcast-shadow-harness.js"` to `package.json`.

---

## Key Files

- **Harness & Execution**: `scripts/gemini-podcast-shadow-harness.js`, `scripts/run_gemini_live_shadow.py`, `scripts/test_youtube_multimodal_audio.py`
- **Review & Export Engine**: `scripts/build-youtube-futures-intel-review.js`, `scripts/youtube-futures-review-ui.js`, `scripts/export-youtube-futures-local-intel.js`, `scripts/build-youtube-futures-agent-intel-summary.js`
- **Observations & Reports**: `data/shadow-harness/observations/`, `data/shadow-harness/reports/queue-benchmark-report.json`, `data/shadow-harness/review/`
- **Architecture Specs**: `docs/antigravity/GEMINI_AUDIO_MIGRATION_SPEC.md`, `docs/antigravity/FULL_TEST_TRANSCRIPTION_COMPARISON.md`, `docs/antigravity/architecture_map.md`, `docs/antigravity/google_vault_intake_architecture.md`

---

## Command Suite

### Live vs Simulate Shadow Harness
```powershell
# Live Gemini 3.5 Flash API pass on YouTube Queue
node scripts/gemini-podcast-shadow-harness.js --queue --live-shadow

# Live pass on specific phase (smoke | betting | intel | diarization)
node scripts/gemini-podcast-shadow-harness.js --phase smoke --live-shadow

# Simulated local dry-run pass
npm run podcast:shadow -- --simulate
```

### Local Intel Review & Export
```powershell
npm.cmd run youtube:review-futures
npm.cmd run youtube:review-ui
npm.cmd run youtube:export-local-intel
npm.cmd run youtube:agent-intel-summary
```

### Validation Suite
```powershell
npm.cmd run test:youtube-futures-review
npm.cmd run test:youtube-review-ui
npm.cmd run test:youtube-local-intel-export
npm.cmd run test:youtube-agent-intel-summary
```

---

## Guardrails

1. Only run `--live-shadow` when the user explicitly requests live API evaluation.
2. Do not promote any item from the local queue or shadow harness to official picks without explicit user approval.
3. Do not write to Supabase.
4. Do not generate official real AI proposals or modify open parlay slots.
5. Treat local Gemini extractions as source-backed research context requiring human review and market validation.

---

## Recommended Next Steps

1. **Wire Futures & Betting Agents**: Connect the `FUTURES` and `BETTING` agent manifests to read `data/shadow-harness/review/youtube-futures-agent-intel-summary.json` as read-only local context (preserving source timestamps, quotes, review flags, and pick lanes).
2. **Batch Live Queue Benchmark**: Execute `--live-shadow` across remaining phase queues as additional YouTube episodes are published.

---

## Resume Prompt

```text
Resume Platinum Rose NFL in E:\dev\projects\NFL_Dashboard. Read HANDOFF_PROMPT.md, WORKING-CONTEXT.md, handoffs\2026-07-25-youtube-gemini-shadow-harness-handoff.md, docs\antigravity\GEMINI_AUDIO_MIGRATION_SPEC.md, and docs\antigravity\FULL_TEST_TRANSCRIPTION_COMPARISON.md first. Current task: continue from S300/S301 completed YouTube/Gemini pipeline & shadow harness work. Verified state: (1) 11 futures-eligible YouTube episodes processed, 39 human-promoted intel items exported, 1 bad DET item rejected; (2) Gemini 3.5 Flash shadow harness refactored into --simulate and --live-shadow modes; (3) raw Gemini outputs saved to data/shadow-harness/observations/*-raw-gemini.json; (4) real Gemini 3.5 Flash API execution verified with non-circular 7-dimension match scoring, ~20.9s-32.8s latency, and ~$0.002-$0.004 run cost. Guardrails: do not make live API calls, write to Supabase, persist production recommendations, or modify open parlay slots without explicit approval. Recommended next: wire Futures/Betting agents to consume the local agent-intel summary (data/shadow-harness/review/youtube-futures-agent-intel-summary.json) as read-only research context.
```
