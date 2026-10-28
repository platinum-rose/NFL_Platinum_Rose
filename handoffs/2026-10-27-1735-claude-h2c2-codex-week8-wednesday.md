# H2C2 cross-team briefing: Week 8 prep done, schedule-ingest fixed — Tue 10/27 5:35 PM PT → Codex

Written Tue 2026-10-27 ~5:35 PM PT by Claude Team 2 (session `session_01Xzkg9b9j3ywHBiRooySaHG`) for the **Codex** team (engineer/verifier lane), picking up cold.

- **Window:** `929be02` (closeout start) → `fa350a7`, plus this handoff's own commit. Prior handoff: `handoffs/2026-10-27-1549-claude-h2c2-claude2-closeout-week8-futures.md` (still the detailed source for the BEO futures and Live Tracker O/U lanes).
- **Git at writing:** repo `E:\dev\projects\NFL_Dashboard`, branch **`claude/w5-prop-cards-2026-10-11`**, all commits pushed; HEAD = upstream. `origin/main` is not the working branch. The working tree is intentionally dirty (scratch, backups, `.nfl/`, dated prediction-market snapshots, private files — see §5). Live Git wins over this file.

---

## 0. TL;DR

1. **Week 8 roster prep is complete.** The Tuesday cadence (10/27 07:18 PT) left ARI and MIN with estimated-only starters. Claude added manual all-position Week 8 depth charts for both (`data/projected-starters/2026/manual/{ari,min}-depth-chart-2026-10-27.json`, same schema as the TB chart) and rebuilt projected starters: **teams needing a manual depth chart 2 → 0** (`12cd53a`).
2. **Roster gate PASSED** on Andy's machine at 2026-10-28T00:15Z: `npm run roster:vet -- --week 8 --date 2026-10-27 --fetch --strict` → 0 blocking, 32 teams / 2,556 players. Info-only: Nick McCloud, Israel Mukuamu (W7 records), Carsen Ryan (roster map). Refreshed rosters + 10/27 availability committed in `a0f0590`.
3. **schedule-ingest bug fixed** (`b93886f`, then corrected in `da20212`). The cache (`public/schedule.json`) used to be rebuilt from only the weeks fetched, so an ESPN timeout dropped Week 7, an offline run wrote 0 games, and a single-week run replaced 272 games with 14. Now it keeps cached rows for every week not fetched, and leaves the file alone when nothing was fetched. **Cache restored to 272 games** (Week 7 added from Andy's 23:38Z run; additions only vs the prior commit).
4. **Next cadence: Wednesday** (`node scripts/toolbox.mjs --cadence wednesday`, then `wednesday-pm` after first practice reports ~1–2 PM PT). Do **not** rerun Tuesday. TNF is **CAR @ GB, Thu 10/29 5:15 PM PT**.
5. **Codex's job:** verify and harden what changed (§3), then the open engineering items (§4). Andy-only decisions are in §6.

---

## 1. Read first

| # | File | Why |
|---|---|---|
| 1 | this briefing | State, rules, open items |
| 2 | `AGENTS.md`, then `CLAUDE.md` (incl. "NFL Roster Gate (mandatory)") | Repo rules |
| 3 | `agents/schedule-ingest.js` (`carriedForwardCacheRows`, end of `run()`) | The fix to verify |
| 4 | `data/projected-starters/2026/manual/ari-depth-chart-2026-10-27.json`, `min-…` | New manual charts (sources and caveats in `meta`) |
| 5 | `logs/cadence-reports/2026-w08-tuesday.md` | Tuesday state (note: its "Supabase read only" claim for schedule ingest is **wrong**, see §2) |
| 6 | `handoffs/2026-10-27-1549-claude-h2c2-claude2-closeout-week8-futures.md` | Week 7 closeout, BEO futures, Live Tracker O/U lanes |

## 2. What changed (commits, oldest first)

| Commit | What |
|---|---|
| `f9cb3bd` | Week 7 closeout + Week 8 handoff (prior team; pushed this session) |
| `12cd53a` | ARI + MIN manual depth charts; projected starters rebuilt (local only, no network, no Supabase) |
| `b93886f` | schedule-ingest: keep failed weeks / skip empty write (first pass, incomplete) |
| `da20212` | schedule-ingest: keep **all** unfetched weeks; `public/schedule.json` restored to 272 games |
| `a0f0590` | ESPN roster refresh (gate PASS) + 2026-10-27T23:30Z player availability |
| `fa350a7` | Scheduled-job outputs at 23:04Z: W7 boxscores, W8 Live Tracker HTML, SC market comparison (generated only) |

**Supabase:** `schedule-ingest.js` upserts the `games` table on any non-`--dry-run` run. Andy ran a live Week 7-only ingest at 23:38Z (14 rows upserted, all final). No other Supabase writes this session.

**Depth-chart notes (for review flags):** ARI — Love (RB1, ankle) OUT W6–7, LaFleur says he practices Wednesday; Bam Knight led W6–7; Jalen Brooks season-ending wrist surgery → Simi Fehoko LWR1 with 0 targets W5–6; Nolen, Melton, Wingard, Gaines OUT W7. MIN — Aaron Jones (knee, "not significant") Questionable; Jordan Mason 15 carries W7 and now in ESPN's injured/out group (day-to-day). A stale estimated MIN row for DeeJay Dallas (practice squad) remains in the snapshot from Tuesday's usage locks; harmless, clears on the next estimate refresh.

## 3. Verify (Codex)

1. **schedule-ingest merge.** Unit-test `carriedForwardCacheRows`: (a) single-week fetch keeps all other weeks; (b) zero rows fetched → cache unchanged, no write; (c) refreshed week replaces only its own rows; (d) failed week keeps cached rows; (e) a game that moved weeks (flex/reschedule) is not duplicated (dedupe is by `game_id` + week key — confirm). Claude ran a/b/c ad hoc against the real cache; there is no committed test.
2. **dist copy.** `writeScheduleCache` also writes `dist/schedule.json` (gitignored). Confirm both stay in sync after a run.
3. **Depth charts.** Spot-check against a second source (Ourlads only + ESPN roster + nflverse so far; snapshot says `independent second-source depth-chart reconciliation` missing). Do not name players in outputs except via the roster gate.
4. **Re-run the gate** after Wednesday PM availability: `npm run roster:vet -- --week 8 --date <capture-date> --fetch --strict`. The `--` is required (npm otherwise eats the flags).

## 4. Open engineering items

- **Secret-scan hook is malformed:** `.claude/hooks/check-secrets.js` (`const {{ execSync }}`, doubled braces → Node syntax error). This session used a grep content scan on each staged set instead. Fix it as its own commit.
- **Live Tracker O/U settlement (GB @ DET):** Andy reported Over legs shown Hit on Under finals. Still **unverified**; `fa350a7` commits regenerated output only and claims no fix. Lane details in the 10/27 1549 briefing.
- **Tuesday cadence report text** says schedule ingest is "ESPN plus a Supabase read only"; it upserts `games`. Correct the report generator wording.
- **Schedule odds lag:** `public/schedule.json` Week 8 lines are applied from the latest `game_odds_snapshots` at ingest time (Tuesday cache = 14:00Z; the 17:00Z odds run moved GB/CAR total 47.5→48.5, DAL −6→−6.5, SEA −3.5→−3). Use the odds snapshot, not the cache, as the market reference.

## 5. Excluded from Git (intentionally)

`docs/YAHOO_FANTASY_API_ACCESS_FOR_CODEX.md` (modified; credential-adjacent), `docs/DK_Transaction_History_20261027`, `docs/monthly-statement-*.pdf`, `scratch/`, `.nfl/`, `*.bak*`, `.git-msg-*.txt`, dated `data/prediction-markets/team-market-map-2026-*.json` snapshots, `CLAUDE.md.bak-20261012`. Do not add them.

## 6. Guardrails (unchanged) and Andy-only decisions

- No wagers, sportsbook/account actions, ledger or Futures Portfolio edits, Supabase writes, TheOddsAPI calls beyond the cadence, or paid synthesis without Andy's explicit per-action OK. A live `schedule-ingest.js` run counts as a Supabase write.
- Keep real, paper, proposal and futures records separate.
- Commit in scoped batches; never `git add -A`. Use `git -c core.fsmonitor=false`. No reset/clean/stash.
- Andy decides: any live Supabase run, publishing tracker artifacts, BEO futures actions.

## 7. Resume prompt

> Resume NFL_Dashboard (`E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`). Read `handoffs/2026-10-27-1735-claude-h2c2-codex-week8-wednesday.md`, then `AGENTS.md` and `CLAUDE.md`. Reconcile live Git (status, branch, HEAD vs upstream). Do §3 verification first (add a committed test for `carriedForwardCacheRows`), then §4 starting with the secret-scan hook. Week 8: next cadence is Wednesday; do not rerun Tuesday. Roster gate must pass before any player-named output. No Supabase/ledger/account/wager actions without Andy's per-action OK.
