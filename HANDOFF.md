# NFL_Dashboard — Session Handoff

> 🏠 **Delegating work while at office?**
> See [.DELEGATION_BOARD.md](../../ATLAS/.DELEGATION_BOARD.md) in ATLAS to track delegations and [.project-delegation.md](.project-delegation.md) for what can be delegated.

> Fresh-session resume notes. Read this first, then TASK_BOARD.md.

**Date:** 2026-06-29
**Branch:** main (HEAD: `0c7ff39`)
**Tests:** 552 / 552 passing
**Status:** M6 `.venv-whisperx` unblocked. Local diarization pipeline ready for L1-L6 implementation.

## Persistent Backlogs

> Task lists that survive context compaction. Check at every session start; update at close.
> Add a row when a task list is created for multi-session work. Remove only when all items are `[x]`.

| Backlog | File | Open Items | Last Touched |
|---------|------|-----------|----------|
| NFL Security & Quality Audit (tri-audit) | `docs/NFL_AUDIT_BACKLOG.md` | **0 / 30 — COMPLETE** | S152 2026-05-23 |
| Obsidian Vault Bridge — Podcast Intel | `docs/LOCAL_PIPELINE_SPEC.md` | **3 items open** (B2-B4 pending impl) | S236 2026-06-29 |

> The tri-audit is fully closed (30/30, all tiers). Receipt: `docs/AUDIT_RECEIPT_2026-05-23.md`.
> No CRITICAL items open — feature work is unblocked.

### Obsidian Vault Bridge — Podcast Intel (S235, open)

Goal: after `podcast-ingest.js` finishes extracting picks + intel for an episode, write a
structured vault note to `NFL/Podcasts/<ShowName>/<YYYY-MM-DD>-E<ep>.md` so that ATLAS agents
can reference specific episode analysis without querying Supabase directly.

Open items:
- [x] **B1** — Vault note schema designed: see `docs/LOCAL_PIPELINE_SPEC.md §8` — frontmatter, picks table, intel bullets, transcript index
- [ ] **B2** — Implement `vault_note.py` + wire into `podcast-ingest.js` (spec §8 complete, code not yet written)
- [ ] **B3** — Backfill: run bridge against all existing `status: 'done'` episodes in `podcast_transcripts`
- [ ] **B4** — Wire vault notes into `BETTING` + `FUTURES` agent manifests so agents can cite episode-level sources

Constraints:
- Sensitivity tier: `green` (podcast intel is public content)
- Use `vault_notes` Supabase table (already used by futures report) — avoids direct NTFS write
- Note path convention: `NFL/Podcasts/{show}/{YYYY-MM-DD}-E{ep}.md`
- Must include per-pick timestamps if `verbose_json` transcription was used

---

## ✅ Regression Fixed (2026-06-03 — committed)

> **2 tests in `tests/unit/oddsIdempotent.test.js`** (`writeSnapshots` upsert on
> `futures_odds_snapshots`) were failing. **Root cause:** commit `f1e6f19` reverted
> `writeSnapshots` in `agents/futures-odds-ingest.js` from the S152 upsert path
> (`9ca2011`) back to delete-then-insert, but left the tests asserting `.upsert(...)`.
> **Fix:** restored the upsert path with `onConflict: 'market_type,team,book,snapshot_time'`.
> The matching unique constraint (`uq_futures_odds_snapshot`) already exists in
> migration `022_odds_upsert_keys.sql`, so the upsert is valid once 022 is applied
> (still pending production push — see Immediate Next Actions). Full suite back to
> **552/552**. Committed 2026-06-03.

---

## Pick Up Here

> **S236 complete (2026-06-29).** M6 `.venv-whisperx` blocker fully resolved. Python 3.12 installed via deadsnakes PPA. `.venv-whisperx` built with `torch==2.8.0 + torchaudio==2.8.0 + pyannote.audio==4.0.6 + faster-whisper==1.2.1 + rapidfuzz`. Key discoveries: (1) whisperX PyPI package unusable — use faster-whisper + pyannote directly; (2) `speaker-diarization-3.1` AND `3.0` both require `community-1` PLDA weights (allowlist-restricted) — patched installed `speaker_diarization.py` to wrap `get_plda()` in try/except; (3) use `pyannote/speaker-diarization-3.0` with `token=True` API; (4) torchcodec warning is harmless (soundfile fallback used). Spec updated: `docs/LOCAL_PIPELINE_SPEC.md §3` now reflects actual working install. `src/config.js` updated: added `pythonDiarizeExecutable` pointing to `.venv-whisperx/bin/python`. HF token `m6-whisperx` (fine-grained read) stored in `~/.cache/huggingface/token`. No new git commits this session (M6 + config-only work). **Next session first action:** implement L1 `diarize.py` — see `docs/LOCAL_PIPELINE_SPEC.md §4`. Use `pythonDiarizeExecutable` from config. Model: `pyannote/speaker-diarization-3.0`, device `cpu`, compute_type `int8`.
>
> **PLDA patch reminder:** must re-apply after any `.venv-whisperx` rebuild:
> ```bash
> PYANNOTE_SD=.venv-whisperx/lib/python3.12/site-packages/pyannote/audio/pipelines/speaker_diarization.py
> sed -i 's/        self._plda = get_plda(plda, token=token, cache_dir=cache_dir)/        try:\n            self._plda = get_plda(plda, token=token, cache_dir=cache_dir)\n        except Exception:\n            self._plda = None/' $PYANNOTE_SD
> ```

> **S235 complete (2026-06-29).** E1011 full pipeline test completed: AssemblyAI diarization fixed (`speech_models: ['universal-3-pro','universal-2']`), Anthropic/OpenAI API keys exhausted → extraction done manually by Claude in Cowork reading full transcript → 13 picks + 34 intel items extracted → HTML report generated at `.nfl/reports/bettingpros-e1011-intel.html` (timestamps fixed, real diarization labels, speaker names resolved). Local pipeline fully specced: `docs/LOCAL_PIPELINE_SPEC.md` covers WhisperX+pyannote diarization (L1 `diarize.py`), fuzzy alias speaker mapping from experts roster (L2 `speaker_map.py`), Ollama extraction with speaker-labeled transcript (L4), vault note writer (L5 `vault_note.py`, closes B1+B2), and pipelineWorker.js wiring (L6). M6 specs confirmed: AMD Ryzen 5 7640HS, 12 cores, 24GB RAM, CPU-only — saved to `.nfl/memory.json`. **BLOCKER:** whisperX install failed on M6 — `.venv` is Python 3.14, whisperX requires `<3.14`. **Next session first action:** resolve Python version blocker (see below), then implement L1-L6 in order.
>
> **M6 whisperX blocker — fix before L1:**
> The `.venv` is Python 3.14; whisperX max is `<3.14`. Two options:
> - **Option A (recommended):** Create a Python 3.12 venv for whisperX only: `python3.12 -m venv .venv-whisperx && source .venv-whisperx/bin/activate && pip install whisperx rapidfuzz`. Update `config.js` `pythonExecutable` to point to `.venv-whisperx` for the transcribe step only.
> - **Option B:** Pin `ctranslate2>=4.6.1` and install whisperX from source with patched requirements (riskier).
> Also: `huggingface-cli` is deprecated on M6 → use `hf auth login` instead. HF model terms must be accepted in browser at: `huggingface.co/pyannote/speaker-diarization-3.1` + `huggingface.co/pyannote/segmentation-3.0`.
>
> **Build sequence (L1→L6, all pending):**
> L1 `diarize.py` → L2 `speaker_map.py` + `show_hosts.json` → L3 live M6 test (2-min audio clip) → L4 `extract.py`/`prompts.py` → L5 `vault_note.py` → L6 `pipelineWorker.js`+`podcast-ingest.js`. Spec: `docs/LOCAL_PIPELINE_SPEC.md`.

> **S234 complete (2026-06-29).** Experts roster fully rebuilt (`src/lib/experts.js` → 36 entries, 12 shows + 24 individual hosts, all with `sourceType`/`ingestStatus`/`note`). Two new podcast feeds live in Supabase via migration `029_podcast_feeds_update.sql` (The Favorites + BettingPros Podcast). `EXPECTED_SOURCES` in `futures-intel-report-v2.js` updated (Sunday Sixpack → deferred, BettingPros + The Favorites → active). NFL_Dashboard commit `0c7ff39` pushed. Obsidian vault bridge added to Persistent Backlogs (B1-B4 items). Wrote `agents/podcast-e1011-test.js` — full-pipeline one-off test for E1011 (AssemblyAI diarization + Anthropic extraction + chunked full-transcript + HTML report). **E1011 test still failing:** AssemblyAI `speech_model: 'best'` deprecated → fixed to `speech_models: ['universal-3-pro']` in the script but NOT yet verified. **Next session: run `node agents/podcast-e1011-test.js` first thing — should work now.** If it passes, review HTML report, then commit the test script and spec the Obsidian bridge (B1). M6 needs `git pull` for `0c7ff39`.

> **Phase 6 — Podcast Intel surface (DONE through 6e)** — full detail in
> `docs/PODCAST_PIPELINE_PM_HANDOFF.md`.
> - 6a (`84ef3aa`) — 6 podcast intel query helpers in `src/lib/supabase.js` (12/12).
> - 6b (`7a0df43`) — `PODCAST_INTEL_TOOLS` (6 tools) wired into `agentTools.js` + executor.
> - 6c (`24e4174`) — `agents/manifests/futures.manifest.json` (season-arc prompt + tool subset).
> - 6d (`3ad5fc6`) — `FuturesAgentChat.jsx` + `?tab=futures-agent` route + Header nav tab.
>   **Spec divergence:** agent lives at `?tab=futures-agent`; `?tab=futures` kept for `FuturesPortfolio`.
> - 6e (`df020a4`) — 6 podcast intel tools added to `betting.manifest.json`.
>
> **Podcast pipeline v2 / M6 (DONE)** — commits `64b279d`→`df020a4`: Phase 1 schema
> migration (M6 paths/quality/share tokens), Phase 2 Fastify service skeleton (HMAC,
> runs, systemd), Phase 3 Python transcription, Phase 4 Python extractor + quality gate,
> Phase 5 vault-rebuilder agent (fence-guard auto-sections), Phase 6 above. Service lives
> in `packages/m6-podcast-service/`.
>
> **Tri-audit (DONE, S139→S152, 30/30)** — see `docs/NFL_AUDIT_BACKLOG.md`. API-KEYS,
> RLS-WRITES, VIG-REMOVAL, MONTE-CARLO, SYNC-DURABILITY, CI-GATE, AUDIT-TRAIL,
> AGENT-LOCK + all MEDIUM/LOW items closed.

### Feature work that shipped since last HANDOFF (now committed)

- **F-15/F-16** (`5025af4`) — nflverse PBP seed + formation cols (migration 015) +
  stats-to-vault bridge (`agents/stats-to-vault-sync.js`).
- **F-17** (`8d7c34e`) — analytical RSS feeds + Atom parser + `source_type` split in vault.
- **F-19** (`44419cf`/`982d712`/`fa5058b`) — player injury ingest + RLS + vault sync.
- **F-20** (`01618bc`) — futures intel report + vault export + cron fixes.
- **F-21/F-22/F-23** (`36e3c3d`) — Action Network splits + injuries + current lines in BETTING agent.
- **Daily brief email agent** (`d595a9e`/`8a51e5f`/`37d36c6`) — GHA workflow, gmail+hotmail recipients.
- **UI/infra fixes** — `b64b0a7` compact 12-tab nav, `8d9f1d3` live-odds reads `game_odds_snapshots`,
  `68d5873` deeplinks + URL tab routing, `6ecb316` game-odds-ingest ESM/season fixes,
  `c1898b2` removed legacy VSiN scrape pipeline.

---

## Immediate Next Actions

1. **(DONE + COMMITTED 2026-06-03)** Fixed the 2 failing `oddsIdempotent` tests — restored the
   `.upsert()` path in `agents/futures-odds-ingest.js` (reverted by `f1e6f19`). 552/552.

2. **Phase 7 + 8 — Podcast digest surface (NOW FULLY SPECCED 2026-06-03).**
   Session handoff: `docs/SESSION_HANDOFF_2026-06-03_PODCAST_PHASE7.md`.
   **Start building at 7c** — concrete patch sequence in `docs/PODCAST_PHASE7C_BUILD_KIT.md`
   (one file, additive, ~1h, ships today). Specs:
   - 7c — "Top Podcast Picks (24h)" in `agents/nfl-daily-brief.js` — `docs/PODCAST_PHASE7C_BRIEF_SPEC.md`.
   - 7a — static digest renderer (`packages/m6-podcast-service/render/`) — `docs/PODCAST_PHASE7A_RENDER_SPEC.md` (critical-path blocker).
   - 7-serving — `src/digest.js` Fastify routes — `docs/PODCAST_PHASE7_SERVING_SPEC.md`.
   - 7b — SPA `PodcastDigestTab.jsx` + `?tab=podcasts` — `docs/PODCAST_PHASE7B_SPA_SPEC.md`.
   - Phase 8 — signed `/share/*` partner surface — `docs/PODCAST_PHASE8_SHARE_SPEC.md`.
   > Two plan corrections this session: (a) the brief already fetches `picks` and discards them
   > (7c surfaces existing data); (b) the old "ping M6, degrade if down" guardrail was impossible
   > (the brief runs in GHA off-tailnet) — replaced with Supabase-content + env-string-link.

3. **Pending manual production actions** (code complete, not yet applied):
   - Rotate Anthropic / OpenAI / Odds API keys + redeploy Edge Functions (API-KEYS, `6dce19f`).
   - `supabase db push` migrations `018`, `019`, `021`, `022`; create owner auth user (S140/S146/S148/S152).
   - Run `node agents/stats-to-vault-sync.js --seasons 2023,2024,2025` once to seed vault (F-16).

4. **Futures manifest gap:** `futures.manifest.json` lists 3 spec tools under
   `deferredTools` (`analyze_futures_hedge`, `project_division_paths`, `track_award_race`)
   that do not yet exist in `agentTools.js`. FUTURES chat reuses `BETTING_TOOLS` for now.

5. **Known quirk:** nflverse uses `LA` (not `LAR`) for the Rams — stats land at
   `NFL/Teams/LA.md`; intel sync uses `LAR`. Separate notes; align eventually.

---

## Known Local-Only Noise (Do Not Commit)

- `.nfl/receipts/` (run artifacts)
- `data/cache/pbp/*.parquet` (large Parquet cache — gitignored)
- `supabase/.temp/` (local tooling cache)
- `docs/Futures_Odds/`, `docs/Screenshots/` (local-only per PODCAST PM handoff)
- `docs/NFL-Dashboard-Audit-Report-2026-05-21.md` (untracked source doc for the closed audit)

---

Resume order: HANDOFF.md → TASK_BOARD.md
