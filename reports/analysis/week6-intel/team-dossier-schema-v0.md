# Team dossier schema v0 (draft for review, Mon 2026-10-12 night)

Baseline: the Week 5 Astra prompt (`prompts/2026-w05-astra-full-synthesis.md`), to be enhanced later. Market data is NOT in a team dossier. Dossiers carry no lines, prices, picks, tickets, bankroll, or ATS/over-under results (those are market-derived and stay in the matchup/market layer).

## 1. Purpose and consumers
One current, source-labelled evidence file per team that any agent (Astra, Opus, game-packet builder, fantasy/prop work) can read before analysing a matchup. It replaces ad hoc per-team pulls inside `scripts/intel/build-w05-game-packets.py`. The Astra provenance rule drives the design: every claim must be citable as `[Source: <path>, <metric>, generated <timestamp>]`, and stale or non-attributable inputs must be visibly labelled, never blended in.

## 2. Outputs
```
data/generated/team-dossiers/2026-w06/
  index.json            manifest: source registry, SHA-256 of every input, git HEAD + dirty flag, builder version, freshness table
  team-crosswalk.json   canonical code + every alias (WSH, LA, JAC, "49ers", "Washington Commanders", ESPN id, FTN name)
  <TEAM>.json           full machine-readable dossier (32 files)
  <TEAM>.md             rendered brief, target <= 2,500 tokens (32 files)
  matchups/<AWAY>@<HOME>.json   pairs two dossiers; unit-vs-unit comparison; no market fields
```
Builder: `scripts/build-team-dossiers.mjs` (JS, reuses `scripts/lib/profile-snapshot-utils.js` and `src/lib/teams.js`). Local files only, deterministic, no network, no Supabase, no model calls. Unknown values are `null`, never imputed. Canonical codes: WAS and LAR.

## 3. Dossier structure
`schema: team_dossier_v1`, `team`, `season`, `target_week` (6), `completed_weeks` (5), `built_at`, then:

0. `sources`: registry. Each: id, path, generated_at, through_week, status (`current` | `stale_1wk` | `preseason_prior` | `prior_season` | `retired` | `missing`), sha256, use_policy.
1. `identity`: nickname, conference, division, head coach (from `schedules.csv`), OC/DC (null until a source exists), stadium, roof and surface, rest days, bye week, 2026 schedule with the Week 6 opponent and home/away. Source: `schedules.csv` (schedule fields only; its odds columns are June placeholders and are ignored).
2. `standing`: record, win %, PF/PA/diff, home/away, division and conference record, streak, division and conference rank (win % then point differential; not official tiebreakers). Source: `team-standings-2026-w05.json`.
3. `game_log`: Weeks 1-5, one row per game: opponent, home/away, score, yards, YPP, pass/rush yards, 3rd-down %, red-zone TD %, sacks for/against, giveaways/takeaways, time of possession, drives, points per drive. Source: ESPN box scores via `week-NN-teams.json`.
4. `season_profile_espn`: per-game averages and rates derived from `game_log`, offense and defense, plus turnover margin and fumble-luck fields (fills the regression nulls: takeaway margin, red-zone TD % off/def, 3rd-down %).
5. `efficiency_nflverse`: EPA per play (off/def, ranks), dropback EPA, QB EPA, CPOE, neutral pass rate, pythag wins and delta, one-score record. Sources: analytics and regression snapshots (w5). Success, explosive, pressure, shotgun, motion and play-action rates are null in the sources; kept visible as `unavailable`, not dropped.
6. `ftn`: team-level tables kept verbatim with table and metric names (`team-offense/efficiency`, `tempo`, `tendencies`, `pass-protection`; `team-defense/efficiency`, `pass-rush`, `rush-analytics`, and so on) plus bounded player units: QB1, top 3 RB, top 5 receivers, top 5 pass rushers, top 5 coverage defenders, OL pass-block leaders. Each table carries its own `through_week` read from the `GP` column.
7. `power`: SRS, net points per game, Pythagorean win %, model rank. The market-implied rank and delta fields are excluded from dossiers (market data).
8. `scheme_context`: head coach, neutral pass rate and trend note from the w5 coaching snapshot (label `historical_context_only` per Astra), coverage scheme tags and pressure profile from the secondary-matchup file (label `manual_review_capped`).
9. `availability`: live injury/status events from `latest.json` for the team (status, trend, source, published_at), OL/DL cluster-risk flags, impact-digest entries, projected-starter rows and confidence, operator-confirmed QB for the target week. Each carries `as_of`; the section carries `roster_gate: not_run | passed | failed`. Agents must not name a player from here until the gate passes.
10. `priors`: 2025 final analytics/regression/DVOA/power (labelled `prior_season`), training-camp notes (`preseason_prior`, July 31), BettorDay trench ratings (`preseason_prior`, Sep 2).
11. `data_quality`: per-section `{status, through_week, as_of, null_fields[], caveats[]}`, plus a team-level summary used by the md header ("through W5; FTN stale_1wk").

## 4. Rules
- No section is synthesised across sources. Each section names its own source ids; conflicts between sources are listed, not resolved.
- Use policies are copied from the Astra prompt: FTN = statistical context only; power = separate signal, not a projection; coaching = stale historical context; secondary = capped manual context; availability = intel only, roster-gate first.
- Freshness is computed, not typed: `through_week` is read from the data (GP columns, snapshot meta), compared with `completed_weeks`.
- The md view repeats `through_week` and status beside every table so a prompt that sees only the md cannot mistake stale data for current.
- Identity joins always go through `team-crosswalk.json`. Never join on a display string or nickname alone.
- Reproducible: `index.json` lists SHA-256 for every input and the builder commit; the build refuses to run if a required source is missing and reports it.

## 5. Matchup packet (thin layer)
`matchups/<AWAY>@<HOME>.json`: game identity and kickoff, both dossier references, side-by-side offense-vs-defense metrics (named, with sources), rest days, shared opponents so far, and a union of both availability sections. Market, weather, expert and simulation evidence stay in the existing packet builder and are joined there, not here.

## 6. Build order
1. Crosswalk + source registry + freshness table (no data yet).
2. Sections 1-5 and 7 (all current, derived locally).
3. Sections 8-10 (availability reads existing files; roster gate wired in later).
4. Section 6 once FTN is recaptured through Week 5 (Tue 7:00 AM PT run).
5. md renderer, matchup packets, validator (schema, 32 teams, no market keys, every table has through_week).

## 7. Open decisions
1. Keep ATS/over-under records out of dossiers entirely (proposed), or add them as a labelled `market_history` section.
2. Player depth in `ftn`: top-N per unit (proposed) vs. every player row (about 4,600 rows total; heavy for prompts).
3. One md brief per team only, or also a one-page "league table" file listing all 32 teams' key numbers side by side for slate-level reads.
4. Where the dossiers live: `data/generated/team-dossiers/2026-w06/` (proposed) vs. a fixed `latest/` path the Astra prompt can pin.
