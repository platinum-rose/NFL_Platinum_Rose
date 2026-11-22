# NFL_Dashboard handoff — 2026-10-20 ~12:50 PT — W6 sources built, W7 slate needed, post-mortem validator fixed

Statistical context only. Nothing here is a bet recommendation. Last pushed commit still 020362a on `claude/w5-prop-cards-2026-10-11`. Nothing committed this session.

## 1. Dossier build (W7) — BLOCKED on one file
`node scripts/build-team-dossiers.mjs --week=7` now fails with exactly one missing source:
```
REQUIRED SOURCES MISSING:
data/generated/team-dossiers/w07-slate.json
```
`node scripts/validate-team-dossiers.mjs --tag=2026-w07` then fails with `ENOENT ... data/generated/team-dossiers/2026-w07/index.json` (uncaught, no friendly message), because the build never ran.

**w07-slate.json has no generator.** Only `build-team-dossiers.mjs` and `build-w05-quantitative-synthesis.mjs` reference slate files. `w06-slate.json` is hand-authored (schema `w06_operator_slate_v1`, "operator-confirmed slate"; built from BKR board pairings corrected against the official NFL schedule). I did not write a W7 slate. Two candidate inputs exist if Andy wants one drafted:
- `data/vault-seed/nflverse/schedules.csv` W7 (14 games): NE@CHI Thu 10/22; CIN@BAL, CLE@TEN, IND@MIN, MIA@NYJ, NYG@HOU, SF@ATL, TB@CAR, PIT@NO (schedules.csv gametime 09:30, timezone not checked), DEN@ARI, GB@DET, LA@LV, KC@SEA (SNF), DAL@PHI (MNF 10/26). Byes implied: BUF, JAX, LAC, WAS (verify).
- `public/schedule.json` (refreshed today by the Tuesday cadence): 14 W7 games, home teams match the list above.
Decision for Andy: confirm the W7 slate (or approve a draft derived from schedules.csv, labelled as not BKR-board-confirmed).

### What was run to unblock the other five sources (dependency order)
1. nflverse refresh through W6 (public GitHub, no paid API): `games.csv` 79 -> 93 rows; `team_stats.csv` 2,436 -> 2,464 rows (2026: 158 -> 186). Backups: `data/vault-seed/nflverse/games.csv.bak-20261020`, `team_stats.csv.bak-20261020`. `games-full-1999-2026.csv` untouched (SHA still 51f76296...c0fc51, Astra-pinned). Method as in REFRESH-2026-10-12-w5.md: `fetch_nflverse_data.py --datasets games` to a temp dir; `_fetch_team_stats([2026])` merged over the 2026 rows (pre-2026 unchanged). Needed `pip install --user pyarrow` on the bridge VM.
   - New SHA-256: games.csv f0a61afd...a9475; team_stats.csv 1898552d...5075.
   - 10 cells in W5 rows changed vs the old CSV (CLE: sack_yards_lost, fumble_recovery_own, fumbles_forced_by_opp, fumbles_total; NYJ: def_tackles_solo, def_tackles_for_loss(+yards), def_fumbles_forced, def_sack_yards, def_qb_hits) — nflverse stat corrections. The w5 snapshots predate them.
2. `node scripts/build-team-analytics-snapshots.js --season 2026 --week 6` -> `team-analytic-snapshots-2026-w6.json` (32 teams; FTN charting 0 plays matched, same as W5: pbp_team_join has no 2026 rows).
3. `node scripts/build-regression-signals.js --season 2026 --week 6` -> `team-regression-snapshots-2026-w6.json`.
4. `node scripts/build-coaching-tendency-snapshots.js --season 2026 --week 6` -> `team-coaching-tendency-snapshots-2026-w6.json`.
5. `python3 scripts/build-team-standings.py --week 6 --season 2026` -> `team-standings-2026-w06.json` (SF 6-0 etc.).
All new files are uncommitted under data/generated/team-profiles/ and data/vault-seed/nflverse/.

## 2. FTN player-GP anomaly — RESOLVED (not an FTN error)
Compared 10/20 FTN passing/rushing/receiving overview CSVs (C:\Users\andre\Downloads) to nflverse `player_stats_weekly` 2026 W1-6:
- 210 of 210 players matched (after Jr./Sr./apostrophe normalisation). 203 have identical GP (distinct weeks with any nflverse row). The other 7 are FTN GP exactly 1 higher (Bernard, Bourne, Higbee, Jeudy, Dulcich, Gesicki, Rice): consistent with active-but-no-stat-line games, which nflverse weekly omits. No case where FTN is lower.
- Dak Prescott GP 6 is correct (nflverse weeks 1-6). The handoff's "DAL team page GP 5" is not in the 10/20 files: all 12 team-* tables show DAL 6, SF 6, KC 5; 26 teams at 6 and 6 at 5, identical to nflverse team games (team_stats.csv). KC 5 is correct (bye before W6), so no SF/KC re-pull is needed.
- The 10/13 archive vs 10/20: matched players' GP rose by +1 (7/11/30) or +2 (20/27/88 by file), 0 for 2/3/5 players. The earlier "0 matched +1" reading does not reproduce; the likely cause was comparing against a different file set (the archive contains "(1)/(2)/(3)" duplicates).

## 3. Week 6 post-mortem — what moved
Narrative stays in `claude/w06-postmortem-narrative-2026-10-20.md` (unchanged). Update to its section 6 gaps:
- **validate_postmortem_data.py --weeks 6 no longer crashes.** Root cause: `reports/bets/season-recap/scripts/parse_placed.py` mapped only long market names (`MK` dict). W6 ledger legs use canonical keys (`pass_yds`, `rec_yds`, `atd`, `first_td`...) and `rushing_attempts`, so `key=None` -> `KeyError: None` on 29 legs. Also `sgp_spread/sgp_total/sgp_moneyline` fell through to the prop branch and graded as false losses ("no box line"), and lowercase "under" was parsed as Over. Fixed additively (fallback to the canonical key, SGP aliasing, case-insensitive Over/Under); backup `parse_placed.py.bak-20261020`. Not committed.
- Result after fix: ERROR 5, WARN 37, INFO 9; 186 legs; grader disagreements 0.
  - **1 real ledger discrepancy:** ticket `bet_20261015_betonline_1005682691_sea_den_sgp8`, leg "Bo Nix under 199.5 Passing yds" stored LOST; box score and nflverse both show Nix 107 pass yds (17/27), so it should be WON. The ticket lost anyway (JSN ATD, Wilson ATD and Nix over-0.5 INT all lost), so there is no money impact. I did NOT edit the ledger (data/official-picks is off limits). `scratch/grade_w6_legs.py --apply` is the script that writes leg statuses; I did not run it.
  - 4 "ungradable" errors are W7 legs on `bet_20261019_bkr_740512242_6team_flex_sgp_xweek` (CHI ML + O50.5, KC +3.5, MIN ML): pending, expected. Its W6 legs (WSH +7.5 and Under 52; WSH lost 17-23, total 40) both won.
  - WARNs: 32 legs graded by one grader only (the second grader's `lib` does not know the canonical market names); 3 Chig Okonkwo name matches; 1 unsettled ticket; `w6legs.json` missing.
- Hit-rate note: the narrative's 71-67 / "passing/INT 3-6" could not be reproduced from ledger statuses (ledger gives 79 W / 74 L on 153 positions with a different grouping), so I could not confirm whether the Nix leg changes them. If the narrative used ledger statuses, passing/INT becomes 4-5 and overall 72-66.
- Still open from the narrative: W5 divergences not reviewed; W1-2 money does not reproduce from today's wagers file; MNF island proposals not saved to the repo; no CLV.

## Guardrails (carry forward)
No spend on Gemini, AssemblyAI, OpenAI or TheOddsAPI (none used). Do not touch data/official-picks/ or ledger files (read-only access only this session). Never `git add -A` or full `git status`; commit only on Andy's instruction and path-limited.
