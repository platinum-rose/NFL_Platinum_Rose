# Handoff — quantitative synthesis calibrated and week-driven; total-damping backtest null (Tue 2026-10-13 01:50 PT)

Branch `claude/w5-prop-cards-2026-10-11`. Code commit `a34c54f` (engine + backtest) is the parent of the handoff commit on top; check `git log -1 --format=%s`. Prior pickup HEAD was `b0726bd`.

## Monte Carlo review (read-only, done)
Four separate engines, none cross-validated:
1. `scripts/intel/margin-simulator.mjs` — exact calibrated pmf (pinned 2018-2025 calibration, sha256 `0ea3559…`). Model supplies only `marginAdj`/`totalAdj`; zero edge is exactly 50/50. Used by the packet builder and `validate-game-output.py`. Self-test 20/20.
2. `scripts/build-w05-quantitative-synthesis.mjs` — the 60/25/15 blend (market / FTN z-scores x1.55 / SRS+1.5 HFA, plus a capped secondary term).
3. `src/lib/devLabSim.js` (+ `src/workers/simulationWorker.js`) — DevLab UI only; hand-set constants (x35 EPA, SD 13.5/team, margin SD 19.1); unseeded.
4. `src/lib/simulation.js` — legacy; no importers found in `src/` or `scripts/` (tracked files only); unseeded; `trueLine` is visitor-minus-home.

## Changed this session (all in `a34c54f` + handoff commit)
- `build-w05-quantitative-synthesis.mjs`: replaced the 100k-trial normal sampler (margin SD 16.7, total SD 17.7 vs calibrated 12.77/13.13) with `analyzeGame`; hash-pinned calibration check ("calibration hash drift" stops the run); pushes tracked; ranking excludes pushes; removed the slate mean of the one-sided secondary bump (mean total adj +0.85 -> -0.03; Overs 14/14 -> 6/14); `--dry-run`; **`--week N`** (default 5; week 5 output verified identical to the pre-refactor dry run). Weeks >= 6: slate from `data/generated/team-dossiers/wNN-slate.json`, market from the newest `data/odds/BKR_current_lines_MMDD_HHMM_buildfmt` (or `--bkr a,b`, later overrides earlier; capture time is the filename PT time, approximate). Optional inputs (secondary-matchup, SuperContest, master-intel pull) degrade to zero/null with an entry in `warnings`; no fallback to an older week. Team codes canonicalized WSH->WAS, LA->LAR, JAC->JAX.
- `margin-simulator.mjs`: additive `distribution` (mean/median margin and total) in `analyzeGame`.
- New `scripts/analysis/total-damping-backtest.mjs` + `reports/analysis/total-damping-backtest-2026-10-13.md`.

## Findings
- Totals: no trailing defensive/pressure/turnover/pace feature predicts the total residual (895 games, 2022-2025; none passes |t|>=2.7 with a stable sign; no model beats the intercept out of sample). Keep totals at market plus the capped pace term. Historical Over drift +0.57 (2018-2025 calibration) to +1.05 (this sample, SE 0.43) is NOT applied.
- The FTN-based version of these signals cannot be tested (no FTN history).
- ThePropDealer review: only the idea worth copying is a game-state simulator that yields correlated player lines. Parked: separate build, own 2022-2025 backtest (`ftn_charting.csv` 2022+, `team_stats.csv` 2022+, `player_stats_weekly.csv`; `pbp_team_join.csv` is ids only).

## Week 6 dry run (NOT written to disk; not recommendations)
`node scripts/build-w05-quantitative-synthesis.mjs --week 6 --dry-run`: 12 of 14 games priced (ARI@LAR and BUF@LV have no BKR line yet). Warnings: no W6 secondary file, no W6 SuperContest file, no W6 master-intel pull, and **FTN context is stale** (captured 2026-10-09; power ratings are through W5). Do not write W6 outputs until the FTN refresh lands.

## Open / next
1. Tue 7:00 AM PT FTN capture (trigger `trig_01MQvRWvZ4ofhArZjBkVTThw`), then `node scripts/build-team-dossiers.mjs --week=6` and `node scripts/validate-team-dossiers.mjs --tag=2026-w06`, then re-run the W6 synthesis dry-run; write it (drop `--dry-run`) only with fresh FTN. Capture BKR ARI@LAR and BUF@LV when posted and pass both boards via `--bkr`.
2. Dossier availability/priors layer (roster gate); dossiers still say `NOT BUILT`.
3. DONE 2026-10-13: W6 slate verified against nfl.com/raiders.com/therams.com. Byes CIN/DET/MIA/MIN correct; two games were home/away reversed and are now ARI@LAR and BUF@LV (matches schedules.csv). Rebuild dossiers after the FTN run.
4. Andy, native Windows: `weekly-archive.mjs --week 5`; Action Network openers (403 from device shell); SuperContest `week-06-lines.json`; Kalshi/Polymarket refresh; DKP gate fix (needs OK); `npx vitest run` (unverified; nothing covers `margin-simulator` or the synthesis script beyond its self-test).
5. Optional cleanup: rename the synthesis script (still `build-w05-...`); retire or document `src/lib/simulation.js`.

## Gotchas
- Git on this mount cannot delete lock/temp files. This session committed with plumbing on a temporary index (`GIT_INDEX_FILE`, `read-tree HEAD`, `update-index --cacheinfo`, `write-tree`, `commit-tree`, `update-ref` with the old value), which leaves a zero-byte `.git/HEAD.lock`; it was moved to `.git/stale-HEAD-lock-<epoch>` after confirming no git process was running. Harmless `tmp_obj` unlink warnings are expected.
- `scripts/margin-simulator.mjs` in older notes is actually `scripts/intel/margin-simulator.mjs`.
- Existing W5 outputs (`2026-w05-quantitative-synthesis.json/.md`) were not regenerated and still reflect the old sampler.
