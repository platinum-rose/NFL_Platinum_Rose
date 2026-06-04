# NFL_Dashboard — Session Handoff

> 🏠 **Delegating work while at office?**
> See [.DELEGATION_BOARD.md](../../ATLAS/.DELEGATION_BOARD.md) in ATLAS to track delegations and [.project-delegation.md](.project-delegation.md) for what can be delegated.

> Fresh-session resume notes. Read this first, then TASK_BOARD.md.

**Date:** 2026-06-03
**Branch:** main (up to date with `origin/main`)
**HEAD:** `df020a4` — `feat(agent-manifests): Phase 6e — podcast intel tools in BETTING manifest`
**Tests:** 552 / 552 passing (oddsIdempotent regression fixed + committed 2026-06-03)
**Status:** Podcast intel pipeline shipped through Phase 6e. **Phase 7 + 8 now fully specced (2026-06-03)** — start building at 7c. See `docs/SESSION_HANDOFF_2026-06-03_PODCAST_PHASE7.md`.

## Persistent Backlogs

> Task lists that survive context compaction. Check at every session start; update at close.
> Add a row when a task list is created for multi-session work. Remove only when all items are `[x]`.

| Backlog | File | Open Items | Last Touched |
|---------|------|-----------|----------|
| NFL Security & Quality Audit (tri-audit) | `docs/NFL_AUDIT_BACKLOG.md` | **0 / 30 — COMPLETE** | S152 2026-05-23 |

> The tri-audit is fully closed (30/30, all tiers). Receipt: `docs/AUDIT_RECEIPT_2026-05-23.md`.
> No CRITICAL items open — feature work is unblocked.

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
