# Futures/Betting Agent — Data Inventory (2026-07-21)

Full survey of data currently available to the NFL Dashboard, done as the first step
of designing a smarter Futures/Betting agent. Two questions this answers:

1. What data exists (source, table, cadence)?
2. What's actually reachable by the live agent tools today vs. sitting unused?

Sourced by reading `supabase/migrations/001`–`038`, `agents/manifests/*.json`,
`src/lib/agentTools.js`, `skills/nfl-team-notes/`, and `docs/FUTURES_REPORT_SPEC.md`
directly — not from memory.

---

## 1. Schedule & game identity

| Data | Table / File | Notes |
|---|---|---|
| Canonical 2026 schedule | `games` | game_id, week, kickoff, home/away, status. Spine everything else joins to. |
| Game results | `game_results` | espn_id, scores, status. Feeds auto-grading. |

## 2. Live/current-week odds

| Data | Table / File | Notes |
|---|---|---|
| Game-level odds (spread/ML/total, 8 books) | `odds_snapshots`, `game_odds_snapshots` | `game_odds_snapshots` is the proper time-series (one row per game/book/market/snapshot); `odds_snapshots` is the older single-blob-per-poll version still read by `get_odds`. |
| Line movement (game lines) | `line_movements` | Detected between consecutive polls; open vs current, sharp_flag. |
| Betting splits (ticket% vs money%) | `game_splits` (current), `game_splits_history` (time series) | Action Network. History table exists specifically to detect sharp divergence / steam — built S-era but not yet queried by any agent tool. |

## 3. Futures & derivative markets

| Data | Table / File | Notes |
|---|---|---|
| Outright futures odds (SB, conf, division, wins, playoffs, awards) | `futures_odds_snapshots` | One row per team/market/book/snapshot — full time series, so line movement over the offseason is queryable but nothing currently queries it as a *movement* metric (see §7). |
| Win-total lines (number + O/U prices) | `futures_odds_snapshots.line/over_price/under_price` | Added migration 027. |
| Exact division finish (1st/2nd/3rd/4th) | `futures_odds_snapshots` (`market_type='division_exact_position'`) | Newest market, added S293 (2026-07-21 BetOnline drop). |
| Super Bowl exact matchup | `futures_odds_snapshots` (`superbowl_matchup`) | Per `FUTURES_REPORT_SPEC.md` category 6. |
| Award races (MVP/OPOY/DPOY/OROY/DROY/CPOY/COY) | `futures_odds_snapshots` (`award_*`) | Wired to `track_award_race` tool. |
| Player prop odds (real) | `player_prop_odds` | Integration seam — currently sparsely populated (paid props source not yet live); stub. |

## 4. Team/player performance (historical + season-to-date)

| Data | Table / File | Notes |
|---|---|---|
| Team season stats: record, off/def per-game, ATS, O/U, EPA/play | `nfl_team_season_stats` | Includes off_epa_per_play, def_epa_per_play, league ranks 1–32. |
| Formation tendencies: shotgun_rate, no_huddle_rate, pass_rate | `nfl_team_season_stats` (migration 015) | From nflverse PBP Parquet. |
| Player season stats (skill positions) | `nfl_player_season_stats`, `player_season_stats` | Two tables — 014 (historical rollup) and 032 (fantasy-oriented rollup); worth confirming they're not diverging sources of truth. |
| Player weekly actuals (props grading) | `player_stats` | Columns named to prop market keys; feeds auto-grading only. |
| Rosters (current team assignment, position, status) | `nfl_rosters` + `nfl_rosters_latest` view | **New (S293)**. Weekly nflverse snapshots, includes cross-ref IDs (espn/yahoo/sleeper). Not yet read by any agent tool. |
| Injuries | `player_injuries` (ESPN, Mon/Wed/Thu/Fri cron) | **Not** what `get_injury_report` actually reads — that tool hits ESPN live directly at call time, bypassing this table entirely. Two paths to the same data. |
| Fantasy ADP | `fantasy_adp` | Feeds `FANTASY_VALUE_VS_ADP_SPEC.md`, not futures/betting. |

## 5. Qualitative / curated reference (vault + skill files, not DB)

| Data | Location | Notes |
|---|---|---|
| 32 team notes (identity, offense/defense identity, ATS tendencies, weather, coaching profile) | `skills/nfl-team-notes/references/teams/*.md` | Hand-authored prose seed stubs. **Confirmed stale in at least one case**: ARI.md still keys parts of its analysis to Kyler Murray, who was traded — flagged inline S293 but not rewritten (flag-not-rewrite policy pending real 2026 data). The other 31 got the same audit pass but weren't individually detailed in the handoff — worth a fresh per-file staleness pass now that rosters are live in `nfl_rosters`. |
| Coach tendencies | `data/vault-seed/manual/CoachTendencies.md`, derived by `scripts/derive_coach_tendencies.py` | Blends nflverse PBP (EPA, formation rates) with coach name/W-L from games.csv. Reachable by agent only via `read_vault_note` (prose), not as structured queryable fields. |
| ATS trends, key numbers | `data/vault-seed/manual/ATS_Trends.md`, `KeyNumbers.md` | Same vault-prose pattern. |
| Strength of Schedule (SoS) | Computed on the fly in `futures-intel-report-v2.js` (`buildWinsTotals()`), from 2026 schedule + opponent win-total lines | **Not stored anywhere** — exists only inside one report-generation function. Rank surfaces in the rendered report table but isn't queryable by the live chat agent at all. |

## 6. Expert / media intel

| Data | Table / File | Notes |
|---|---|---|
| Podcast episodes + transcripts | `podcast_feeds`, `podcast_episodes`, `podcast_transcripts` | 4 shows, `picks` (jsonb) + `intel` (jsonb free text) per episode. Primary feed for most BETTING/FUTURES tools. |
| Per-host structured future summaries | `podcast_host_summaries` | **New (S292)** — prediction/lean/confidence/stats_cited/quote per host per future, just backfilled across all 134 episodes. Richer structure than `podcast_transcripts.picks`, but not yet wired to any agent tool — only `search_podcast_picks`/`get_futures_movement`/etc. read the older `podcast_transcripts` shape. |
| Diarization/re-extraction audit trail | `podcast_reextractions`, `podcast_diarization_*` | Pipeline internals, not agent-facing. |
| Sharp X/Twitter accounts | `x_sharp_tweets` | Curated handles only (sharp/analyst/media/creator tiers), full-text search indexed. `search_sharp_tweets` tool exists but wasn't in the FUTURES manifest subset I checked — confirm it's actually wired to FUTURES, not just BETTING. |
| General research articles | `research_intel_notes`, `research_pick_signals` | RSS/article ingest with an LLM-extracted lean+confidence per note. |
| LLM-normalized directional signals | `normalized_signals` | Turns the above three raw sources into clean (team, market, direction, strength) rows. **Used only by the offline `portfolio-synthesize.js`/`portfolio-dossier.js` batch pipeline** — the interactive chat agent (`agentTools.js`) never queries this table. This is the single biggest "already exists, not exposed" gap. |

## 7. Reports & synthesis (batch-generated, agent-adjacent)

| Data | Table / File | Notes |
|---|---|---|
| Rendered Futures Intel Report (md/html/structured model) | `futures_reports` + `v_futures_report_latest` view | Generated by `futures-intel-report-v2.js`; this is where SoS, collapse categories, and the full CATEGORIES taxonomy actually get assembled — but as a rendered document, not queryable fields. |
| Futures Portfolio Strategy / dossier | `agents/portfolio-dossier.js`, `agents/portfolio-synthesize.js` | Consumes `normalized_signals` — the more sophisticated reasoning layer, separate from the live chat agent. |

## 8. User's own state (not market data, but agent-relevant)

| Data | Location | Notes |
|---|---|---|
| Open picks/bets | `user_picks`, `user_bankroll_bets` (+ localStorage mirrors) | Cloud sync layer; localStorage is primary. |
| Open futures portfolio positions | localStorage `nfl_futures_portfolio_v1` | Used for hedge calcs; not in Supabase at all — no durable history of past futures positions once closed. |

---

## What's actually wired to the live agent vs. what isn't

Checked `agents/manifests/{betting,futures,props}.manifest.json` against `src/lib/agentTools.js` implementations directly (not just tool names — read the function bodies for `project_division_paths` and `track_award_race`).

**Reachable today:** game odds, line movement (game-level only), podcast picks/consensus/expert history (via `podcast_transcripts`), ESPN injuries (live call), hedge/teaser math, vault note reads, award-race odds.

**Exists in the data layer but NOT reachable by the live FUTURES/BETTING chat agent:**
- `normalized_signals` — the cleaned, directional, cross-source signal table. Biggest gap.
- `nfl_team_season_stats` — EPA, ATS, formation tendencies, league ranks. Zero structured access; only reachable as prose via `read_vault_note`.
- `nfl_rosters` — brand new, zero wiring yet.
- SoS — not persisted anywhere outside one report function.
- `game_splits_history` — sharp-divergence/steam detection table exists, unused by any tool.
- Real futures **odds movement over time** — `futures_odds_snapshots` has the full time series, but no tool computes "this team's SB odds moved from +2500 to +1800 over the last 3 weeks." `get_futures_movement` is misleadingly named — it returns expert *pick* timeline from podcasts, not sportsbook *odds* movement.
- `podcast_host_summaries` — the newer, richer per-host structured extraction (confidence + stats_cited + quote) isn't queried by any tool; older `podcast_transcripts.picks` shape is used instead.
- Coach tendencies EPA/formation numbers — only as prose, not structured.

**Found doc/code mismatch worth fixing regardless of the agent redesign:** `project_division_paths`'s tool description promises "schedule strength, key injuries, coaching context" — the implementation only computes implied probability from `futures_odds_snapshots`. None of those three things are actually in the returned payload.

---

## Candidate gaps — data that doesn't exist anywhere yet

- **Rest/travel**: bye weeks, short weeks, timezone-change travel, back-to-back road trips. `games` has kickoff times but nothing computes rest differential.
- **Officiating crew tendencies** (penalty rates, total-friendliness) — not present in any form.
- **Roster churn as a signal**: `nfl_rosters` is now weekly-snapshotted, so week-over-week depth chart change could be derived (trade/injury/practice-squad churn as a leading indicator), but nothing computes it yet.
- **CLV (closing line value) backtesting**: `game_splits_history` + `game_odds_snapshots` together could answer "did sharp divergence early in the week predict the closing line," but no backtest table/script exists.
- **Weather**: team notes have a "Weather Notes" section but it's static prose (e.g., "Dome — no adjustment"), not a live forecast feed for outdoor stadiums closer to kickoff.
- **Public sentiment breadth**: `x_sharp_tweets` is curated-handle only; no broad social-volume/sentiment signal exists as a contrarian indicator.

---

## Suggested next step

Given this, the smarter-agent design work has two separable tracks:
1. **Wire what already exists** — give the live FUTURES/BETTING agent tools onto `normalized_signals`, `nfl_team_season_stats`, `nfl_rosters`, and real futures-odds movement. This is mostly plumbing, no new data collection.
2. **Decide which net-new domains are worth building** (rest/travel, roster churn signal, CLV backtest) vs. accepted gaps.

---

## Track 1 progress — 2026-07-21 (same session)

Wired 6 new tools onto `FUTURES_TOOLS` in `src/lib/agentTools.js` (available to the FUTURES agent, which already inherits `BETTING_TOOLS`):

- `get_team_analytics` — `nfl_team_season_stats` (record, ATS, O/U, EPA/play, formation tendencies, ranks)
- `get_team_roster` — `nfl_rosters_latest` (current personnel, replaces relying on stale team-note prose)
- `get_strength_of_schedule` — new `getStrengthOfSchedule()` helper in `supabase.js` that reimplements the report's SoS algorithm (opponent win-total sum) as a directly queryable function, composing `games` + `futures_odds_snapshots`, no new table
- `get_futures_odds_movement` — wraps the pre-existing (already built, just unused-by-agent) `getFuturesOddsHistory()` helper to surface real sportsbook line movement, distinct from `get_futures_movement` which is expert-pick sentiment
- `get_normalized_signals` — wired, but **see caveat below**
- `get_podcast_host_summaries` — the richer per-host structured future extraction from migration 035

Also fixed the doc/code mismatch: `project_division_paths` now actually attaches `schedule_strength` and `analytics` (EPA rank, ATS) per team when that data is seeded, and its tool description was corrected to stop claiming injury coverage it never had.

**Needs an actual decision from Andy, not something I resolved unilaterally:** `normalized_signals` has RLS locked to service-role-only by deliberate design (migration 031's own comment: "internal betting data, no client access"). The new `get_normalized_signals` tool is fully wired but will return `no_data` from the browser-based agent until either (a) a public-read policy is added mirroring every other table in this repo, or (b) the call is moved to a server-side function that can use the service-role key. Given it was locked down on purpose, I didn't add a policy without asking — flagging it here for a call.

Test coverage: added 22 new tests across the 6 tools in `tests/unit/agentTools.test.js` (invalid input, no_data, and shaped-output cases for each), updated the `FUTURES_TOOLS` count test (3→9), and fixed 3 pre-existing failing tests unrelated to this change (`BETTING_TOOLS`/`PODCAST_INTEL_TOOLS` count/name-list tests were stale from whenever `search_episode_vault_notes` was added — not caused by this session). Full `agentTools.test.js` suite: 76/76 passing.

Native commit still owed (sandbox can't commit, per household protocol) — files touched: `src/lib/supabase.js`, `src/lib/agentTools.js`, `tests/unit/agentTools.test.js`, `agents/manifests/futures.manifest.json`, this doc.

---

## Track 2 — net-new domains (2026-07-21, same session)

Andy picked all four candidates. Before building, re-checked the actual nflverse `schedules.csv` this pipeline already downloads (`data/vault-seed/nflverse/schedules.csv`, fetched by `scripts/fetch_nflverse_data.py`'s `schedules` dataset) — it already contains `away_rest`/`home_rest` (rest days), `div_game`, `roof`/`surface`, `referee`, `temp`/`wind`, and closing `spread_line`/`total_line`/moneylines. Only `spread_line` and the final scores were ever consumed downstream (one ATS calc in `seed-historical-stats.py`); everything else was fetched and discarded. Same pattern as Track 1 — "rest/travel" and "CLV" turned out to be a plumbing problem, not a missing-data problem.

**Real finding worth flagging on its own:** this repo uses **three different `game_id` formats** across tables that all describe the same games:
- `public.games.game_id` = `nfl_{season}_{seasonType}_w{WW}_{AWAY}_at_{HOME}` (schedule-ingest.js)
- `public.game_odds_snapshots.game_id` / `game_splits_history.game_id` = `{season}_{WW}_{HOME}_{AWAY}` (shared `buildGameId()` in `packages/shared/src/week-utils.js`)
- nflverse's own `schedules.csv`/`team_stats.csv` `game_id` = `{season}_{WW}_{AWAY}_{HOME}` (no prefix, opposite team order from the app's own odds tables)

None of these are interchangeable strings, and nflverse also uses some alternate team codes (`LA` not `LAR` for the Rams, `JAC` not `JAX`, etc.) on top of that. Every new join built this session resolves by **(season, week, home/away abbreviation)** after normalizing abbreviations, never by matching `game_id` strings across tables. This wasn't touched/fixed at the schema level (out of scope, and a bigger job than today's task) — just flagging it as latent risk for whoever next builds a cross-table join here.

### What got built

**Migration 039 (`game_context.sql`)** — adds `away_rest`, `home_rest`, `div_game`, `roof`, `surface`, `referee`, `temp`, `wind`, and `closing_spread_line`/`closing_total_line`/`closing_home_moneyline`/`closing_away_moneyline` to `public.games`. `scripts/seed-game-context.py` resolves each `schedules.csv` row to an existing `games.game_id` by the (season, week, home_abbrev, away_abbrev) tuple (with nflverse abbreviation normalization) and upserts the context columns — never creates new game rows. **Verified the transform logic against real local data** (5 real 2022 games, synthetic game_id lookup): abbreviation normalization and column mapping both correct. The live Supabase resolve-and-write step needs a real `SUPABASE_SERVICE_ROLE_KEY` this sandbox doesn't have — Andy needs to run it natively.

**Migration 040 (`referee_tendencies.sql`)** — new table, one row per referee: `games_officiated`, `seasons[]`, `avg_total_points` ("total-friendliness"), `avg_total_penalties`, `avg_penalty_yards`, `home_win_pct`. `scripts/derive_referee_tendencies.py` computes this **entirely offline** from `schedules.csv` (referee name + actual game total) joined to `team_stats.csv` (penalties/penalty_yards per team, summed per game) — both files already downloaded, joined on nflverse's own consistent `game_id` between those two specific files. **Ran this one for real** against the local 2022-2024 data (`--dry-run`, no Supabase write): 18 referees, ~51-52 games each, avg totals 44.1-46.8, avg penalties 9.6-12.0, home win rate 46-63%. Numbers are sane. Only the final Supabase upsert needs Andy to run it live.

**Roster churn** — no new table. `getRosterHistory()` reads raw `nfl_rosters` rows (not the `_latest` view) across a team's last N snapshots; `get_roster_churn` diffs the two most recent into adds/drops/status-changes, keyed by `gsis_id` (falls back to `full_name`).

**CLV analysis** — no new table. `get_clv_analysis` compares this app's earliest-tracked `game_odds_snapshots` line (labeled `tracked_open`, honestly noted as NOT necessarily the true market open) against the real closing line now in `games` (migration 039), and layers in `game_splits_history` sharp-divergence (money% vs. ticket%) if available — first tool ever to query that table, which existed since migration 024 for exactly this purpose.

4 new tools added to `FUTURES_TOOLS`: `get_game_context`, `get_referee_tendencies`, `get_roster_churn`, `get_clv_analysis`. `FUTURES_TOOLS` now exports 13 (was 3 before this session). 34 new tests added (12 for these 4 tools + the earlier 22); full `agentTools.test.js` suite: 88/88 passing.

**Still needed before any of this is live:**
1. Andy runs `fetch_nflverse_data.py --datasets schedules team_stats --years <range> --force` then `seed-game-context.py` and `derive_referee_tendencies.py` natively (has the service-role key this sandbox doesn't).
2. Same native-commit debt as track 1 — nothing here is committed yet.

### Live run, 2026-07-22 — migrations 039/040 applied, one real bug caught and fixed

Andy ran both migrations and both seed scripts natively. `derive_referee_tendencies.py` worked cleanly first try (19 referees seeded from 2018-2025, `HTTP 201 Created`). `seed-game-context.py --seasons 2026` crashed on the real (non-dry-run) write:

```
postgrest.exceptions.APIError: null value in column "season" of relation "games" violates not-null constraint
```

Root cause: the script used `.upsert(batch, on_conflict='game_id')`. Every `game_id` it operates on comes from a live SELECT against an existing `games` row — this should only ever be an UPDATE, never capable of inserting a new row. But for at least one row (`nfl_2026_2_w01_NE_at_SEA`), the `ON CONFLICT` path didn't fire as an update, and Postgres fell through to a plain INSERT attempt — which failed because the payload only carries the new context columns, not `season`/`week`/`home_team`/etc. Also found, while fixing: `context_updated_at` was set to the *string* `'now()'`, which is SQL function-call syntax, not a valid literal a JSON/REST payload can pass through as a timestamp — would have failed on the next successful run regardless.

Also noticed `games` had 285 rows for season 2026 against `schedules.csv`'s 272 — 13 extra, which lines up suspiciously well with 13 postseason bracket slots (6 wildcard + 4 divisional + 2 conf champ + 1 SB). The lookup key `(season, week, home_abbrev, away_abbrev)` doesn't include `season_type`/`game_type`, so a postseason placeholder row sharing a week number with a real regular-season game is a plausible collision source for whichever row triggered the crash.

Fixed both bugs in `scripts/seed-game-context.py`:
- `update_batch()` now does a real per-row `UPDATE ... WHERE game_id = ...` instead of a batched upsert — this can only ever affect 0 or 1 existing rows, never insert.
- `load_existing_games()` now detects and logs (rather than silently overwrites) any case where two different `games` rows share the same lookup key, so if the postseason-collision theory is right, the next run will name the exact colliding `game_id`s instead of crashing blind.
- `context_updated_at` now uses a real Python ISO timestamp instead of the literal string `'now()'`.

Verified the fix offline against the real (now 2026-only, since Andy's `--force` fetch overwrote the local historical cache) `schedules.csv`: dry-run correctly resolves `nfl_2026_2_w01_NE_at_SEA` — the exact game_id from Andy's crash — and the synthetic collision test confirms the new warning fires and keeps the first match rather than overwriting silently.

**Re-run live 2026-07-22: `Game context update: 272 OK, 0 failed`, no ambiguous-key warnings.** All 272 season-2026 games now carry rest/travel, division-game flag, venue, referee, and closing-line context. Track 2 is fully live:

| Domain | Status |
|---|---|
| Rest/travel + closing lines (migration 039) | Live — 272/272 games |
| Referee tendencies (migration 040) | Live — 19 referees, 2018-2025 |
| Roster churn | Live — reads existing `nfl_rosters`, no seeding needed |
| CLV analysis | Live — reads `games` context + `game_odds_snapshots` + `game_splits_history`, no seeding needed |

Both tracks of the Futures/Betting agent data-wiring work (this doc, in full) are now built and live. Remaining open item: native commit of everything touched this session (`src/lib/supabase.js`, `src/lib/agentTools.js`, `tests/unit/agentTools.test.js`, `agents/manifests/futures.manifest.json`, `supabase/migrations/039_game_context.sql`, `supabase/migrations/040_referee_tendencies.sql`, `scripts/seed-game-context.py`, `scripts/derive_referee_tendencies.py`, this doc).
