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

**Decision resolved 2026-07-22:** `normalized_signals` had RLS locked to service-role-only by deliberate design (migration 031's own comment: "internal betting data, no client access"). Andy chose option (a) — public-read policy, mirroring every other table in this repo. Added via migration `041_normalized_signals_public_read.sql` (`create policy ... for select using (true)`, same pattern as migration 018's `player_injuries` policy). Writes are unaffected — still service-role-only, since `signal-normalize.js` connects with the service-role key regardless of RLS. Updated the stale RLS-caveat comments/messages in `supabase.js` and `agentTools.js`'s `toolGetNormalizedSignals`, and the corresponding test in `tests/unit/agentTools.test.js`. **Migration 041 applied live 2026-07-22 (Andy, confirmed successful).** `get_normalized_signals` is now fully live end-to-end — all 6 Track 1 tools + all 4 Track 2 domains are wired and live. Only remaining open item from this whole inventory is GAMEID-FORMAT (see NFL_AUDIT_BACKLOG.md), plus the native-commit debt covering everything in this doc's Track 1/Track 2/041 sections.

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

---

## Reasoning-layer follow-up — 2026-07-22 (dossier/synthesize enrichment)

With all Track 1/Track 2 data wired and `normalized_signals` opened to public read (migration 041), Andy pivoted to the next real gap: none of this new data was actually being *reasoned over* anywhere. Two separate reasoning surfaces exist in this repo — the live interactive FUTURES chat agent (an LLM + tool-calling loop in `FuturesAgentChat.jsx`, whose system prompt still only documented the original 3 futures tools) and the offline batch pipeline (`agents/portfolio-dossier.js` + `agents/portfolio-synthesize.js`, which already enforces a much stricter reasoning contract — every recommendation must carry a fair price, edge %, confidence, thesis, a mandatory disconfirming factor, named sourcing, and bet-now/wait/pair timing — but had never been touched to use any of today's new domains). Andy chose to upgrade the dossier/synthesize pipeline first, then port the same discipline into the live chat agent's prompt in a follow-up pass.

**Built into `portfolio-dossier.js`:**
- `fetchTeamStats()` extended to pull the EPA/formation columns (`off_epa_per_play`, `def_epa_per_play`, `off_epa_rank`, `def_epa_rank`, `shotgun_rate`, `no_huddle_rate`, `pass_rate`) that were always in `nfl_team_season_stats` (migration 014/015) but never left the table — only ATS/win-loss made it into the dossier before. `currentAnalytics()` picks the most-recent season with real EPA data, returns `null` (not zeros) when a season hasn't been populated yet.
- `fetchSchedule()` extended to also pull migration 039's rest/travel/div-game/referee/closing-line columns in the same query SoS already needed — no extra round-trip.
- New fetchers: `fetchGameOddsOpen()` (earliest tracked spread per game, for CLV), `fetchGameSplitsLatest()` (latest betting-splits snapshot per game, for sharp divergence), `fetchRefereeTendencies()` (migration 040 table), `fetchRosterChurn()` (latest two league-wide weekly roster snapshots, diffed the same way `agentTools.js`'s `get_roster_churn` tool does).
- New `buildTeamSignals()` rolls all of the above up from per-game into one **season-aggregate signal per team** (the dossier reasons about season-long futures markets, not single games): `schedule_context` (own rest/travel — distinct from `sos`, which is about opponent quality), `officiating_context` (avg total-friendliness across the team's known assigned referees, expected to be sparse pre-season since refs aren't assigned until close to kickoff), `clv_signal` (closing-line movement + sharp-split divergence, per-team, since S296's own `get_clv_analysis` tool built this for exactly one game at a time and this needed a season-wide version). `roster_churn` stays a flat top-level map (personnel movement isn't tied to any one market).
- Every new field is attached per-team-per-market-row in `buildSynthesisInput()` alongside the pre-existing `prior`/`sos`/`lean`, and surfaced in the markdown summary (`analyticsMd`/`scheduleMd`/`officiatingMd`/`clvMd` helpers) and a new `meta.signal_coverage` block (counts of teams with each signal populated, since early-season/off-cycle coverage will legitimately be low).

**Built into `portfolio-synthesize.js`:** extended `SYSTEM_PROMPT` with a field guide for the four new per-team signals (what each means, when to trust it, explicit small-sample caveats for `officiating_context`/`clv_signal` so the model doesn't build a thesis on 1-2 games), a new "WHAT TO HUNT" bullet instructing the model to name the specific EPA rank/rest number/CLV move when it diverges from a team's raw record or price (not just gesture at "underlying metrics"), and a discipline rule that small-sample signals must corroborate, never originate, a thesis. `buildUserPrompt()` now actually passes `signal_coverage`, and the full `roster_churn` map, into the model's context — previously the richer offline pipeline's user content didn't include either.

**Verified 2026-07-22 (sandbox can't reach live Supabase — network proxy blocks it, same limitation as M6):** wrote a synthetic harness exercising `buildTeamSignals()`, `currentAnalytics()`, `buildSynthesisInput()`, and `toMarkdown()` against fabricated multi-game fixtures (short-rest games, known/unknown referees, sharp-split divergence in both directions, a team with and without populated EPA). All four functions produced correct, well-shaped output with no exceptions; `currentAnalytics()` correctly returns `null` rather than zeros for an unpopulated season. `node --check` clean on both files. Harness was scratch-only, not committed.

**Still needed:** Andy needs to run `node agents/portfolio-dossier.js` + `node agents/portfolio-synthesize.js --dossier <path>` live (has the service-role key this sandbox doesn't) to confirm the new fields populate correctly against real data and that the model actually uses them well in a real run. The live interactive chat agent's system prompt (`FuturesAgentChat.jsx`) is the deliberately-deferred second half of this work — still only documents the original 3 futures tools, not today's enrichment or the 10 S296 tools.

---

## Analyst committee rewrite — 2026-07-22, same day (per Andy + Codex second-opinion review)

Andy asked a second model (Codex) for an independent take on how to build "actual reasoning logic" here. Its 7-point framework (canonical data layer, deterministic feature layer, evidence packets, a role-differentiated LLM committee, a stricter structured-output contract, multi-axis ranking, and backtesting/calibration) matched much of what already existed in this repo, but confirmed two things were genuinely missing: a real committee architecture (today was one model, or two in an A/B, doing pricing+thesis+skepticism+sizing in a single pass) and any backtesting/calibration loop at all — confirmed by finding a stale `agents/dev/ANALYST_PROMPT.md` persona doc that listed CLV tracking and confidence calibration as open research questions, apparently never built, and confirming that today's futures-portfolio-synthesis output was never even being saved anywhere gradable (futures positions Andy actually takes only ever lived in `localStorage`, per §8 above). Andy approved building all four gaps identified from that comparison. All of it landed in `portfolio-synthesize.js` (dossier.js untouched this pass) plus one new migration and one new script:

**1. Extended output contract:** added `edge_type` (math|thesis|stale_price|hedge|longshot — the model's own honest tag, used for ranking below), `bet_threshold` (the worst price still worth taking), `needs_human_review` (bool), `evidence_ids` (short pointers back to which dossier fields backed the thesis, e.g. `'analytics.off_epa_rank'`), and a `market_view`/`football_view` split (forces the price read and the football-context read to be visibly separate sentences, since a real edge should ideally have both agreeing).

**2. Three-stage Analyst Committee**, replacing the single-pass design:
   - **Stage 1 (Market+Football Analyst)** — unchanged mechanically (still one call per `--models` entry, A/B by default), now producing the extended schema above. `mergeStage1()` flattens the A/B results into one candidate list per unique market/selection, keeping per-model agreement visible (`agreement: {count, of, models}`) instead of collapsing straight to a binary consensus/divergent split.
   - **Stage 2 (Skeptic)** — a NEW, separate model call (`SKEPTIC_SYSTEM_PROMPT`) that did not generate the candidates and whose only job is to attack each one independently: apply a `confidence_delta` (usually negative), optionally supply a stronger `disconfirming_factor`, and return a `hold|downgrade|kill` verdict. `applySkepticVerdicts()` merges this in; killed candidates go to a visible `killed[]` list with the Skeptic's reason, never silently disappear.
   - **Stage 3 (Risk/Portfolio + Editor)** — a NEW, separate model call (`RISK_EDITOR_SYSTEM_PROMPT`) that sees ALL surviving candidates TOGETHER (the one place correlation/exposure judgment is even possible), finalizes `bet_threshold`/`needs_human_review`/`stake_tier`, and can `passes` on a candidate for portfolio reasons distinct from the Skeptic's own reasoning (e.g. too correlated with a bigger position already in the book). `applyRiskEditor()` merges this in.
   - New flags: `--skeptic-model`/`--risk-model` (default to the first `--models` entry), `--skip-committee` (falls back to the original single-pass S274 behavior for a quick/cheap look), `--no-persist` (see below).

**3. Multi-axis ranking (code-owned, not model-freeform):** `rankByAxis()` replaces `diffModels()`'s consensus/divergent split with Codex's six views — strongest math edge, strongest thesis edge, strongest stale-price edge, best low-correlation portfolio adds, longshots, and passes/kills (shown for transparency, not hidden) — grouped deterministically off the `edge_type`/`stake_tier`/`correlated_week1` fields the committee already produced. This follows Codex's own stated principle: the model proposes and categorizes honestly (`edge_type`), code does the actual ranking/audit.

**4. Backtesting foundation (logging half only — grading is manual for now):** new migration `042_futures_recommendations.sql` — a durable Supabase table, one row per final (post-committee) recommendation per run, carrying the full reasoning trail (thesis, disconfirming factor, market/football view, Skeptic note+verdict, bet_threshold, evidence_ids, sources, timing) plus a `status` column (`pending` by default). `persistRecommendations()` in `portfolio-synthesize.js` writes here automatically after each run — non-fatal and skipped cleanly if `SUPABASE_SERVICE_ROLE_KEY` isn't set or `--no-persist` is passed, so local `.html`/`.md`/`.raw.json` output is never blocked by it. New `scripts/grade-futures-recommendation.js` (`--list` to find rows, then `--run-date --key --result won|lost|push|void|superseded [--note]`) lets Andy record results by hand as markets actually resolve. **Full automated grading is explicitly NOT built** — there's no queryable end-of-season/market-resolution data source anywhere in this repo yet (who actually won each division/conference/award/win-total), so calibration analysis (hit rate by confidence bucket, which `edge_type` performs best, which data sources actually helped) has to wait until enough rows get graded by hand across a season. That's honestly a multi-month wait for real signal, not a same-session gap to close.

**Verified 2026-07-22 (sandbox can't call live Anthropic/OpenAI/Supabase):** wrote a synthetic harness feeding fabricated stage-1 A/B output through `mergeStage1()` → `applySkepticVerdicts()` (with a fabricated kill) → `applyRiskEditor()` (with a fabricated portfolio-reason pass) → `rankByAxis()` → `renderHTML()`/`renderMD()`, asserting agreement counts, confidence-delta math, kill/pass routing, and correct bucket placement at each step — all passed. Also verified `parseJSON()`'s extended object/array-extraction logic. `node --check` clean on `portfolio-synthesize.js` and the new grading script. Migration 042 SQL mirrors the proven structure of migrations 040/041 (not independently run against a live Postgres instance from this sandbox).

**Still needed:** Andy runs `supabase/migrations/042_futures_recommendations.sql` live, then a real `portfolio-synthesize.js` run to confirm the 3-stage committee behaves well with real model output, not just the synthetic merge/ranking logic verified above. Correction (2026-07-22, caught by Andy): an earlier draft of this note claimed `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` were blank in `.env` — that was wrong, an artifact of a flawed `grep -o` verification command that only printed the matched key name, not its value. Both keys are populated; `OPENAI_API_KEY` is funded (~$7 per Andy). Given that, a real run should default to `--models gpt-4o` (or pass `--only gpt` if mixing in Anthropic models whose funding status is unconfirmed) until Anthropic credit status is separately verified. The live interactive chat agent's system prompt is still the deferred third leg of this whole thread.

---

## Codex review round 2 — implemented, 2026-07-22 night pass

Andy sent `docs/FUTURES_ANALYST_WORKFLOW_SUMMARY_2026-07-22.md` (the doc above, written for external review) to Codex, which came back with a 10-point critique plus specific "gotchas" (`docs/FUTURES_ANALYST_CODEX_REVIEW_2026-07-22.md`). Codex's #1 priority was explicit: *"Code owns math. Code owns validation. Code owns correlation. Code owns persistence. LLMs own synthesis, skepticism, explanation, and creative hypothesis generation."* — the committee rewrite above built the LLM roles well but had no code-side check that any of what the models claimed was actually true. Andy selected all four of tonight's buildable clusters (explicitly deferring the bigger multi-day items — Monte Carlo season simulator, real futures-position sync to Supabase, a deterministic portfolio-correlation graph, and the rest of the "expand missing intel classes" list — as separate future work, not oversights).

**1. Season-filter bugs + odds-movement logic (`src/lib/supabase.js`, `src/lib/agentTools.js`):**
- `getStrengthOfSchedule()`'s `futures_odds_snapshots` wins query was missing `.eq('season', season)` — only the `games` query in the same function had it, meaning SoS could silently blend win-total lines across seasons. Fixed.
- `getFuturesOddsHistory()` had no season parameter or filter at all. Added `season` (defaults to current year) end-to-end.
- `toolGetFuturesOddsMovement()` (the `get_futures_odds_movement` tool) previously used a naive first-row/last-row comparison that could pick different books at different snapshot times, or a non-placeable book's better number. Rewrote to find the best PLACEABLE price at the earliest and latest snapshot times specifically (`bestAt()` helper), with `per_book_movement` and a `consensus_movement_pts` (median across all books) added alongside the headline `best_price_movement_pts`. Falls back to all books (flagged via `placeable_books_only: false`) only when no placeable book has data at all.
- New shared `PLACEABLE_BOOKS` export in `supabase.js`, imported by `agentTools.js` instead of re-deriving the set. `agentTools.test.js` extended accordingly; full suite 89/89 passing.

**2. `award_*` MULTIWAY devig gap + win-total edge math (`agents/portfolio-dossier.js`):**
- Award markets (MVP/OPOY/DPOY/etc., keyed `award_*`) were never being devigged as multiway markets — the `isMultiway()` check only matched the hardcoded `MULTIWAY` set, missing the `award_` prefix family entirely, so award-market fair probabilities were silently wrong (treated as two-way markets). Fixed: `isMultiway = (mk) => MULTIWAY.has(mk) || mk.startsWith('award_')`.
- Win-total ("wins") rows previously had **no code-owned fair probability or edge at all** — the model was eyeballing raw prices. Added same-book devig (`fair_over`/`fair_under` from each book's own over/under implied probs) and, critically, **line-grouped** aggregation (`byLine`/`fairAtLine()`) so probabilities are never blended across different point-total lines (an Over 8.5 -105 and an Over 9.5 +120 are not the same bet). Produces `over_fair_prob`/`under_fair_prob`, `best_over_edge_pct`/`best_under_edge_pct` (via new shared `decimalPayout`/`edgePctFromFair` helpers), `line_consensus_confidence` (how many books actually agree at that specific line), and `line_value_signal` (flags when books disagree on the line itself by >0.5, since edge figures are much less trustworthy when that fires).
- `buildSynthesisInput()`'s row sort previously gave every wins row a meaningless 0-0 tie (it sorted on `value_gap`/`book_divergence`, which are outright-only fields). Now sorts wins rows by `max(|best_over_edge_pct|, |best_under_edge_pct|)` instead.

**3. Injury signal + evidence resolver (`agents/portfolio-dossier.js`, `agents/portfolio-synthesize.js`):**
- New `fetchInjuryContext()` reads `player_injuries` (migration 016), de-dupes to the latest report per player, filters to genuinely decision-relevant statuses (out/doubtful/ir/pup/questionable — drops noise-tier "Active" entries), and rolls up to team + **position-group** granularity (QB/OL/EDGE/CB/skill — this table has no depth-chart rank, so true "WR1 vs WR3" precision isn't available without a join to `nfl_rosters.depth_chart_position`; noted as a known limitation, not faked). Wired into `buildSynthesisInput()` (6th parameter), the markdown summary (`injuriesMd()`), `signal_coverage.teams_with_injuries`, and a top-level `dossier.injuries` map. `SYSTEM_PROMPT` in `portfolio-synthesize.js` now requires any health-based thesis to either cite this field or set `needs_human_review=true`.
- New `resolveEvidenceIds()`/`findDossierRow()`/`resolvePath()` in `portfolio-synthesize.js`: resolves a candidate's `evidence_ids` (dot-path pointers like `'analytics.off_epa_rank'`, `'lean.samples[0].who'`, supporting one level of array indexing) back to the actual dossier value they claim to cite, by fuzzy-matching the candidate's market+selection against `dossier.synthesis_input` rows. Attached to every final candidate as `evidence_resolved` and rendered in both HTML/MD output (`id=value` if resolved, flagged `(unresolved)` if not) — lets a human check a citation traces to something real instead of a plausible-sounding fabrication.

**4. Code-owned validation (`agents/portfolio-synthesize.js`) — Codex's #1 priority:**
- New `validateRecommendation(candidate, dossier)`, run on every final candidate after the Risk/Editor stage and before ranking:
  - Confirms the market/selection actually exists in the dossier at all (via `findDossierRow`) — no match is a **hard invalidation**.
  - Confirms the cited `book` matches the dossier's placeable best-price book for that exact selection/side (over vs. under, resolved via `sideOfSelection()`) — mismatch is a **hard invalidation** (fabricated or non-placeable book).
  - Confirms the cited `price` is within 5% (decimal-payout terms) of the dossier's price at that book — a bigger gap is a **hard invalidation** (stale or fabricated price).
  - **Recomputes `edge_pct` from the model's own `model_fair_prob` + `price`** using the same `edgePctFromFair` helper as the dossier — the model's self-reported figure is never trusted, only used as a sanity-check note when it disagrees by >2 points.
  - Confirms at least one `evidence_ids` entry actually resolves; if none do, forces `needs_human_review=true`.
  - Downgrades an `edge_type="math"` claim to `"thesis"` (+ forces `needs_human_review`) when the dossier's own edge fields (`value_gap`/`book_divergence` for outrights, the **side-specific** `best_over_edge_pct`/`best_under_edge_pct` for wins — not just whichever side is bigger) don't support a real math edge (<1%).
  - Hard-invalid candidates are pulled into a new `invalidated[]` list (merged into the existing passed/killed display, tagged `stage: 'validator'`) rather than silently riding into the final book.
- Verified with a synthetic harness covering all six paths (valid+well-supported, fabricated book, fabricated price, math-edge-type correctly downgraded on the actual selected side even though the *other* side of the same wins market had a real edge — a genuine bug the harness caught and fixed, no dossier-row match, unresolved evidence) — all assertions passing. Also re-verified the evidence resolver and the injury rollup/dedup logic (dedup-to-latest-report, "Active" filtered out, unknown team abbreviations dropped, QB status always reflects the newest report) with separate synthetic harnesses.

**5. Backtesting log completeness (`supabase/migrations/043_futures_recommendation_runs.sql`, `agents/portfolio-synthesize.js`):**
- Migration 042's `unique(run_date, key)` constraint meant a second same-day run silently overwrote the first. Migration 043 adds `run_id` (one UUID per `portfolio-synthesize.js` invocation) to `futures_recommendations` and repoints uniqueness to `(run_id, key)`.
- New table `futures_recommendation_runs`: one row per candidate per stage (`stage1_candidate | skeptic_killed | risk_passed | validator_invalidated | final`), each with its reason (where applicable), model agreement, and a full JSON `payload` of the candidate at that stage. Populated by new `persistRecommendationRuns()`, called alongside the existing `persistRecommendations()` — same non-fatal pattern (skips cleanly without Supabase credentials or with `--no-persist`). This means the whole reasoning trail — not just what survived to the final book — is now queryable, including *why* something was killed or passed on.
- Required widening the `killed[]`/`passed[]` entries (previously `{key, market, selection, reason, stage}` only) to carry the full candidate object, so the audit log has real substance (price, book, model agreement) at every stage, not just an identifier.

**Explicitly deferred (by design — these were excluded from tonight's buildable-cluster options, not overlooked):** a Monte Carlo season simulator for probabilistic multi-market correlation; syncing Andy's actual held futures positions from `localStorage` into Supabase (so the committee could reason about real portfolio exposure, not just what a given run proposes); a deterministic portfolio-correlation graph (today's `low_correlation_adds` bucket only checks for an empty `correlated_week1` field, which relies on the model having populated it honestly — Codex's open question #4 in the workflow summary, still open); and the rest of the "missing intel classes" list (suspensions, OL continuity beyond roster churn, coordinator changes, source-quality/CLV-based expert scoring). Also still open: automated grading (unchanged from the note above — no queryable end-of-season resolution data source exists yet).

**Verified 2026-07-22 (sandbox still can't reach live Supabase/Anthropic/OpenAI):** `node --check` clean on `portfolio-dossier.js`, `portfolio-synthesize.js`, `src/lib/agentTools.js`, `src/lib/supabase.js`, `scripts/grade-futures-recommendation.js`; `npx esbuild` clean on `FuturesAgentChat.jsx`; full `agentTools.test.js` suite 89/89 passing; separate synthetic harnesses for the evidence resolver, the validator (6 cases), and the injury rollup, all passing. Migrations 041/042 confirmed run live by Andy; migration 043 not yet run — needed before the new `run_id`/`futures_recommendation_runs` persistence path will actually work end-to-end.

**Still needed:** Andy runs `supabase/migrations/043_futures_recommendation_runs.sql` live, then a real committee run (`portfolio-dossier.js` → `portfolio-synthesize.js`) to confirm the validator behaves sensibly against real model output — the synthetic harness proves the logic is correct, not that real LLM output will trip it in the expected ways. Native commit of everything touched across this whole thread is still outstanding (nothing in this doc's history has been committed yet, per the repeated note above).
