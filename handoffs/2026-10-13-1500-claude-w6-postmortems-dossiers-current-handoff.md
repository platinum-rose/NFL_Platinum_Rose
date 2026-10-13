# Handoff — W5 closed, dossiers current, per-team postmortems + W6 quant synthesis built (Tue 2026-10-13 ~15:00 PT)

Branch `claude/w5-prop-cards-2026-10-11`. Prior pickup: `2026-10-13-0150-claude-quant-synthesis-calibrated-week-driven-handoff.md`. Andy was offsite and asked for the team postmortems and updated dossiers for the Week 6 synthesis. Nothing paid, no Supabase writes, no sportsbook actions.

## Done
- Slate fixed (ARI@LAR, BUF@LV; BEO board confirms), committed `e05d47c`.
- FTN Stats iQ recaptured after MNF (36 tables, 4,634 rows, through W5); `ftn-stats-iq-weekly-synthesis-context-latest.json` rebuilt (backup `.bak-20261013`).
- Dossiers rebuilt (`data/generated/team-dossiers/2026-w06/`, 32 teams, 14 matchups); `validate-team-dossiers.mjs` = 0 errors, 0 warnings. Sources current through W5 (ESPN game logs, standings, nflverse snapshots, FTN, power).
- NEW `scripts/build-team-postmortems.mjs` (`npm run dossiers:postmortem`): deterministic, reads the dossiers only. Writes `data/generated/team-dossiers/2026-w06/postmortem/<TEAM>.md|json` plus `league-postmortem.md|json`. Per team: game-by-game read (result vs yards-per-play battle, turnover swings, blowouts), 32-team ranks on ESPN and FTN metrics, last-2 vs earlier trend, explicit-threshold flags (Pythagorean gap, turnover luck, red-zone rates, efficiency vs results gap, pass pro / rush, one-score record), and a W6 opponent lens (offense vs opposing defense ranks). No market data, no player names. League file has regression watchlists.
- W6 quantitative synthesis WRITTEN (free, local): `reports/intel/2026-w06-quantitative-synthesis.md` and `data/research-intel/proposed/2026-w06-quantitative-synthesis.json`, boards `BKR_current_lines_1012_2150_buildfmt,DKSNAP_current_lines_1013_0700_buildfmt`, 14 games. Proposed analysis only.
- DK snapshot fallback for ARI@LAR and BUF@LV (`data/odds/DKSNAP_current_lines_1013_0700_buildfmt`, labeled not-BKR); Bookmaker futures `data/odds/BKR_futures_1013_1123.md`.
- BetOnline scripts: `scripts/props/cron-bol-futures-scrape.mjs` (`npm run futures:bol`, untested against BEO; supports --dry-run and --parse-only on a saved raw dump); `cron-bol-scrape.mjs` now saves a `.pregate.raw.txt` before the acceptance gate. BEO props run on Tue failed the gate (240 rows < 500; props mostly not posted yet); rerun Wed/Thu.

## Caveats for the synthesis
- Market anchor in the quant pass is stale vs the 17:00 UTC DraftKings capture in `logs/cadence-reports/2026-w06-tuesday.md` (NO flipped to -1.5, PIT -2.5, BUF -4.5, BAL/CLE total 41.5). BKR lines still missing for ARI@LAR and BUF@LV (DK fallback used). Rerun the quant pass after fresh BKR lines.
- Quant warnings: no W6 secondary-matchup file (term = 0), no SuperContest W6 lines, no master-intel pull.
- Dossier `availability` and `priors` layers still not built; roster gate not run. Postmortem files name no players for that reason.
- nflverse success/explosive/pressure-rate fields are null in dossiers (not imputed); FTN is the efficiency source of record.
- Postmortem thresholds are descriptive (no backtest); 5-game samples.

## Next
1. Wed/Thu: `npm run props:bol:launch` then `npm run bolp -- --week 6` (needs >=500 rows); `npm run futures:bol -- --dry-run` then live; send me the raw dump if market headers look wrong.
2. Fresh BKR W6 lines for all 14 games, then rerun `node scripts/build-w05-quantitative-synthesis.mjs --week 6 --bkr <boards>`.
3. Dossier availability/priors layer (roster gate); Week 6 secondary-matchup file; Tuesday-native `weekly-archive.mjs --week 5`.
4. Andy items: MNF slips, real ticket numbers (SNF island 6-leg, DK promo combos), SuperContest W6 lines, `npx vitest run` unverified.
