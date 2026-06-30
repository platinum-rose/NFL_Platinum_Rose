# NFL_Dashboard — Session Handoff

> 🏠 **Delegating work while at office?**
> See [.DELEGATION_BOARD.md](../../ATLAS/.DELEGATION_BOARD.md) in ATLAS to track delegations and [.project-delegation.md](.project-delegation.md) for what can be delegated.

> Fresh-session resume notes. Read this first, then TASK_BOARD.md.

**Date:** 2026-06-30
**Branch:** main (HEAD: `5586a56`)
**Tests:** 117 pytest green (L1-L5); 552 JS (unchanged)
**Status:** L4+L5+B3 complete. vault_note.py live, 59 episodes backfilled. Next: B4 vault note citations in agent manifests.

## Persistent Backlogs

> Task lists that survive context compaction. Check at every session start; update at close.
> Add a row when a task list is created for multi-session work. Remove only when all items are `[x]`.

| Backlog | File | Open Items | Last Touched |
|---------|------|-----------|----------|
| NFL Security & Quality Audit (tri-audit) | `docs/NFL_AUDIT_BACKLOG.md` | **0 / 30 — COMPLETE** | S152 2026-05-23 |
| Obsidian Vault Bridge — Podcast Intel | `docs/LOCAL_PIPELINE_SPEC.md` | **1 item open** (B4 pending) | S238 2026-06-30 |

> The tri-audit is fully closed (30/30, all tiers). Receipt: `docs/AUDIT_RECEIPT_2026-05-23.md`.
> No CRITICAL items open — feature work is unblocked.

### Obsidian Vault Bridge — Podcast Intel (S235, open)

Goal: after `podcast-ingest.js` finishes extracting picks + intel for an episode, write a
structured vault note to `NFL/Podcasts/<ShowName>/<YYYY-MM-DD>-E<ep>.md` so that ATLAS agents
can reference specific episode analysis without querying Supabase directly.

Open items:
- [x] **B1** — Vault note schema designed: see `docs/LOCAL_PIPELINE_SPEC.md §8` — frontmatter, picks table, intel bullets, transcript index
- [x] **B2** — `vault_note.py` implemented (`build_vault_note` + `upsert_vault_note`, 32 tests) — S238 `5586a56`
- [x] **B3** — 59 episodes backfilled to `vault_notes` via `backfill_vault_notes.py` — S238 `5586a56`
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

> **S238 complete (2026-06-30).** L4+L5+B3 complete. **L4:** `extract.py` gains `labeled_transcript: str | None = None` — when provided, speaker-labeled text is chunked instead of plain transcript. `prompts.py`: `speaker` field added to per-pick schema + SYSTEM_PROMPT attribution line; first few-shot example uses `[MM:SS] Speaker:` prefix. New test: `test_extract_run_uses_labeled_transcript_for_chunking`. **L5:** `nfl_podcast/vault_note.py` — `build_vault_note()` (path, frontmatter, picks table, intel bullets, transcript index) + `upsert_vault_note()`. Schema fixes vs spec: `source='agent'` (CHECK constraint), `episode_id` in tags not payload (no column). 32 unit tests. **B3:** `packages/m6-podcast-service/scripts/backfill_vault_notes.py` — 59 done episodes written to `vault_notes` (idempotent, `?on_conflict=path`). Stale `E{year}` orphan cleanup built-in. 1 harmless orphan remains: `NFL/Podcasts/Even Money/2026-02-24-E2025.md` (delete manually in Supabase if desired). **Lesson:** Supabase upsert needs BOTH `Prefer: resolution=merge-duplicates` header AND `?on_conflict=<col>` query param — header alone gives 409. Commit: `5586a56`. Tests: 117 green. **Next session first action:** B4 — add `vault_notes` query tool to `agentTools.js` and reference it in `betting.manifest.json` + `futures.manifest.json` so agents can cite episode-level vault note paths as sources (`docs/LOCAL_PIPELINE_SPEC.md §8 B4`).

> **S237 complete (2026-06-30).** L1-L3 local diarization pipeline implemented, synced, and live on M6. New files committed (`21ee9b5`→`68da421`): `nfl_podcast/diarize.py`, `speaker_map.py`, `show_hosts.json`, `experts_roster.json`; `transcribe.py` patched with `--diarize`/`--show-name`; 54 tests green. Six pyannote 4.x compat fixes required: (1) `token=` not `use_auth_token=`; (2) `Pipeline.__call__` is a generator — Annotation in `StopIteration.value`; (3) result is `DiarizeOutput`, unwrap via `.speaker_diarization`; (4) audio must be pre-loaded as `{waveform, sample_rate}` dict (torchcodec broken without CUDA); (5) `speaker-diarization-community-1` gated — must accept + `hf auth login`; (6) HF token had double `hf_` prefix in `.env` (stripped). Live test: 120s clip, 47 segments, `diarized=true`, `labeled.txt` written. "Guest" labels expected — mid-episode clip, no host intros. HF token `m6-whisperx` now persisted in `~/.cache/huggingface/token` on M6. **Next session first action:** L4 — update `extract.py` to accept `labeled_transcript` param and update `prompts.py` with speaker attribution instruction (`docs/LOCAL_PIPELINE_SPEC.md §6`). HEAD: `68da421`.

> **S236 complete (2026-06-29).** M6 `.venv-whisperx` blocker fully resolved. Python 3.12 installed via deadsnakes PPA. `.venv-whisperx` built with `torch==2.8.0 + torchaudio==2.8.0 + pyannote.audio==4.0.6 + faster-whisper==1.2.1 + rapidfuzz`. Key discoveries: (1) whisperX PyPI package unusable — use faster-whisper + pyannote directly; (2) `speaker-diarization-3.1` AND `3.0` both require `community-1` PLDA weights (allowlist-restricted) — patched installed `speaker_diarization.py` to wrap `get_plda()` in try/except; (3) use `pyannote/speaker-diarization-3.0` with `token=True` API; (4) torchcodec warning is harmless (soundfile fallback used). Spec updated: `docs/LOCAL_PIPELINE_SPEC.md §3` now reflects actual working install. `src/config.js` updated: added `pythonDiarizeExecutable` pointing to `.venv-whisperx/bin/python`. HF token `m6-whisperx` (fine-grained read) stored in `~/.cache/huggingface/token`. No new git commits this session (M6 + config-only work). **Next session first action:** implement L1 `diarize.py` — see `docs/LOCAL_PIPELINE_SPEC.md §4`. Use `pythonDiarizeExecutable` from config. Model: `pyannote/speaker-diarization-3.0`, device `cpu`, compute_type `int8`.
>
> **PLDA patch reminder:** must re-apply after any `.venv-whisperx` rebuild:
> ```bash
> PYANNOTE_SD=.venv-whisperx/lib/python3.12/site-packages/pyannote/audio/pipelines/speaker_diarization.py
> sed -i 's/        self._plda = get_plda(plda, token=token, cache_dir=cache_dir)/        try:\n            self._plda = get_plda(plda, token=token, cache_dir=cache_dir)\n        except Exception:\n            self._plda = None/' $PYANNOTE_SD
> ```

> - **S235** — E1011 full pipeline test; local pipeline fully specced in `docs/LOCAL_PIPELINE_SPEC.md` (L1-L6 + B1-B4); M6 specs confirmed; whisperX Python version blocker identified. No commits.

> - **S234** — Experts roster rebuilt to 36 entries; 2 new podcast feeds in Supabase (029 migration); E1011 test script written. Commits: `0c7ff39`.

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

3. ~~**Pending manual production actions**~~ — **ALL DONE (S239 2026-06-30)**
   - ~~Rotate Anthropic / OpenAI / Odds API keys + redeploy Edge Functions (API-KEYS, `6dce19f`).~~ — Secrets confirmed set (`supabase secrets list`); `ai-proxy` v3 deployed 2026-06-04; `odds-proxy` deployed S239; phantom `clever-endpoint` duplicate deleted.
   - ~~`supabase db push` migrations `018`, `019`, `021`, `022`~~ — CONFIRMED APPLIED (S239: all return "already exists" errors). `stats-to-vault-sync.js` seed confirmed done (receipts 2026-05-21 + 2026-06-04).

4. **Futures manifest gap:** ~~`futures.manifest.json` lists 3 spec tools under
   `deferredTools` (`analyze_futures_hedge`, `project_division_paths`, `track_award_race`)
   that do not yet exist in `agentTools.js`. FUTURES chat reuses `BETTING_TOOLS` for now.~~ — **RESOLVED** (S239): FUT-TOOLS shipped, all 3 tools live in `agentTools.js`.

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
