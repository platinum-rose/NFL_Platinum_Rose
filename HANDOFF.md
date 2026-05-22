# NFL_Dashboard — Session Handoff

> 🏠 **Delegating work while at office?**
> See [.DELEGATION_BOARD.md](../../ATLAS/.DELEGATION_BOARD.md) in ATLAS to track delegations and [.project-delegation.md](.project-delegation.md) for what can be delegated.

> Fresh-session resume notes. Read this first, then TASK_BOARD.md.

**Date:** 2026-05-20
**Branch:** main
**HEAD:** `b1182f1` (last commit) — **UNCOMMITTED CHANGES present (see below)**
**Tests:** 84/84 passing
**Status:** F-15/F-16 work in progress — all changes unstaged.

## Persistent Backlogs

> Task lists that survive context compaction. Check at every session start; update at close.
> Add a row when a task list is created for multi-session work. Remove only when all items are `[x]`.

| Backlog | File | Open Items | Last Touched |
|---------|------|-----------|----------|
| NFL Security & Quality Audit (tri-audit) | `docs/NFL_AUDIT_BACKLOG.md` | 24 / 29 open | S141 2026-05-22 |

---

## Pick Up Here

> **S139 (DONE)** — commit `6dce19f` — API-KEYS CRITICAL fix (proxy Edge Functions).
> **ACTION REQUIRED (manual):** rotate Anthropic / OpenAI / Odds API keys then re-deploy Edge Functions (see S139 block in archive).

> **S140 (DONE)** — commits `ca2ba0a` + `947df03` — VIG-REMOVAL (devig/calcEV) + RLS-WRITES (019 migration, AuthGate).
> **ACTION REQUIRED (one-time):** Apply `supabase db push` to push 019 migration; create owner auth user in Supabase dashboard.
>
> **S141 (DONE)** — commits `7e620e7` + `1af208e` + `e48bd05` — MONTE-CARLO (Box-Muller, Web Worker, 10k iters) + SYNC-DURABILITY (dirty-flag retry queue, timestamp-aware hydration). 116/116 tests; clean build.
> Next backlog item: **CI-GATE** (HIGH) — no CI workflow runs ESLint or unit tests.

### What Shipped Last Session (F-15 / F-16 — UNCOMMITTED)

**F-15 — Historical team stats seed (EPA + formation tendencies)**
- `scripts/seed-historical-stats.py` — replaced broken `nfl.import_pbp_data()` with
  direct nflverse Parquet CDN download via `httpx`; added `shotgun_rate`,
  `no_huddle_rate`, `pass_rate` columns; new CLI flags `--no-pbp`, `--cache-dir`,
  `--dry-run`; fixed `datetime.utcnow()` deprecation
- `supabase/migrations/015_pbp_tendencies.sql` — adds 3 formation cols to
  `nfl_team_season_stats` — **APPLIED to Supabase production via Dashboard ✅**
- **Live seed run completed**: 192 rows (32 teams × 6 seasons 2020–2025) upserted,
  0 failures. PBP play counts: 2020=47705, 2021=49922, 2022=49434, 2023=49665,
  2024=49492 (cached), 2025=48771. Parquet cached at `data/cache/pbp/`.

**F-16 — Stats-to-vault bridge (new agent)**
- `agents/stats-to-vault-sync.js` — reads `nfl_team_season_stats`, writes:
  - `NFL/Teams/<ABBR>.md` — per-team `## Season Stats` section (3 rolling seasons)
  - `NFL/Reference/TeamStats-<SEASON>.md` — league-wide EPA + ATS + formation tables
- Dry-run validated: 35 vault notes (32 teams + 3 seasons), 0 failures
- **NOT YET RUN live** — run once to seed vault_notes before 2026 season

> **F-13 (DONE)** — commit `b1182f1` — X/Twitter sharp ingestion via RSSHub
> **F-12 (DONE)** — commit `24cacb7` — vault dual-backend + read/write tools

---

## Immediate Next Actions

1. **Commit F-15 + F-16 changes** (all unstaged):
   ```
   git add scripts/seed-historical-stats.py agents/stats-to-vault-sync.js supabase/migrations/015_pbp_tendencies.sql
   git commit -m "feat(F-15/F-16): nflverse PBP seed + formation cols + stats-to-vault bridge"
   ```

2. **Run stats-to-vault-sync live** (after commit):
   ```
   node agents/stats-to-vault-sync.js --seasons 2023,2024,2025
   ```
   This writes EPA/ATS/formation data to vault_notes for BETTING agent access.

3. **F-17 — RSS ingestion pipeline for analytical articles** — not started.
   Goal: ingest articles from Football Outsiders, The Ringer, etc. into
   `research_intel_notes` so `intel-to-vault-sync.js` picks them up.

4. **Known quirk**: nflverse uses `LA` (not `LAR`) for the Rams. Stats will
   appear at `NFL/Teams/LA.md`, not `NFL/Teams/LAR.md`. Intel sync uses `LAR`.
   These are separate notes — not a breaking issue, but worth aligning eventually.

---

## Known Local-Only Noise (Do Not Commit)

- `.nfl/receipts/` (run artifacts)
- `data/cache/pbp/*.parquet` (large Parquet cache — gitignored)
- `supabase/.temp/` (local tooling cache)

---

Resume order: HANDOFF.md → TASK_BOARD.md
