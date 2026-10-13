# Team-level inputs for Week 6 dossiers: inventory (Mon 2026-10-12 ~23:45 PT)

Baseline: `prompts/2026-w05-astra-full-synthesis.md` (read only, not run). Market data is out of scope for dossiers.

| Input | Path | As of | Through | Teams / key | Status for W6 |
|---|---|---|---|---|---|
| FTN Stats IQ context (source of record for numeric team + player efficiency) | data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json | captured Fri 10-09 21:41-21:53Z | **Week 4** (player rows show GP 4) | 32 (WAS) | **STALE one week.** 36 CSV exports from FTN Stats IQ, saved by Andy to C:\Users\andre\Downloads, then `npm run ftn:weekly-context`. Needs a fresh export after Week 5 posts. |
| Power ratings | data/generated/team-profiles/team-power-ratings-2026.json | rebuilt 10-13 06:07Z | Week 5 | 32 (WAS) | Current. Market-delta field still uses the 10-09 Kalshi file. |
| Regression snapshot | .../team-regression-snapshots-2026-w5.json | 10-13 06:07Z | Week 5 | 32 (nickname) | Current (pythag, one-score record). Takeaway/RZ/3rd-down fields null. |
| Analytics snapshot | .../team-analytic-snapshots-2026-w5.json | 10-13 06:07Z | Week 5 | 32 (nickname) | Current for EPA and pass rate. Success/explosive/pressure/shotgun/motion/PA null. |
| Coaching tendencies | .../team-coaching-tendency-snapshots-2026-w5.json | 10-13 06:07Z | Week 5 | 32 (nickname) | Current but mostly null by design; Astra rule: historical scheme context only. |
| Standings + game log | .../team-standings-2026-w05.json | 10-13 05:56Z | Week 5 | 32 (WSH) | Current; ESPN-checked. |
| Team week post-mortems | reports/analysis/season/claude/out/week-05-teams.json | 10-13 05:54Z | Week 5 | 30 rows (KC, CAR bye) | Current (ESPN box scores). |
| Player availability | data/player-availability/latest.json | **10-12 23:30Z** | live pull | 32 (WAS), 1,252 events | Current today. Includes ESPN + FantasyPros + camp. |
| Availability impact digest | data/player-availability/impact-digest-latest.json | 10-10 16:45Z | pre-Sunday | 32 (WAS) | **STALE.** `npm run availability:impact-digest` regenerates from latest.json (offline). |
| Projected starters | data/projected-starters/2026/latest.json | 10-10 16:45Z | pre-Sunday | 32 (WAS), 79 players | **STALE**; mostly "estimated from local starter language". `npm run projected-starters`. |
| Roster map | data/nfl-rosters/roster-map-latest.json | 10-10 19:52Z | pre-Sunday | 827 players | Stale; `npm run roster:fetch` then `roster:vet --strict` (gate). |
| Operator-confirmed starters | data/research-intel/operator-confirmed-starters-2026-w05.json | 10-11 | W5 only (BAL, CHI, WAS, NYG QBs) | 4 | Week-specific; needs a W6 version from Andy. |
| Secondary-matchup vulnerability | data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json | 10-10 17:31Z | Week 5 games | 30 matchups | **Game-specific to W5.** `npm run secondary-matchups` for W6 once W6 schedule/availability exist. Manual-review, capped use. |
| Weather / venue | data/research-intel/review/2026-w05-weather-venue.json | 10-10 17:58Z | W5 games | 14 games | Game-level, W5 only. Not a team-dossier item. |
| Trench ratings (BettorDay) | data/intel/bettorday_trench_ratings_2026.json | 09-02 | preseason (week 0) | 32 (WAS) | Preseason prior; label as such. Not in the Astra prompt. |
| Training-camp notes | data/training-camp/2026/all-32-camp-notes-2026-07-31.json | 07-31 | camp | 32 (WAS) | Frozen camp context; label as such. |
| 2025 baselines | team-*-2025-w18.json, team-dvoa-snapshots-2025.json | Jul-Sep | 2025 final | 32 | Priors only. 2026 DVOA file is retired (Astra rule). |

## Team-code crosswalk (needed before any join)
- Washington: WAS in FTN, availability, digest, starters, camp, power ratings, trench, secondary. WSH in the ESPN-derived files (team-weeks, week-NN-teams, my standings file) and in the repo schedule.
- Los Angeles Rams: LA in nflverse team_stats.csv; LAR everywhere else.
- Snapshots (regression, analytics, coaching) key on nickname ("49ers"); abbreviation only in raw.team_abbr or via power ratings.
- Canonical proposal: WAS and LAR; map WSH->WAS and LA->LAR on ingest.

## What Andy has to do (cannot be done from the device shell)
1. After Week 5 stats post on FTN Stats IQ: re-export the 36 tables to C:\Users\andre\Downloads, then run `npm run ftn:weekly-context` (native).
2. Provide the W6 operator-confirmed QB list when known.
3. Native Windows: `weekly-archive.mjs --week 5`; Action Network openers pull.
