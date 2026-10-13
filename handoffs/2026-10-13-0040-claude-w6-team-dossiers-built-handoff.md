# Handoff — Week 6 team dossiers built; next: Monte Carlo review (Tue 2026-10-13 00:40 PT)

Branch `claude/w5-prop-cards-2026-10-11`. Prior HEAD `12108e5`. W5 is closed out (see `2026-10-12-2200-claude-w5-closeout-settlement-handoff.md`).

## Done this session
- BKR W6 openers saved (`data/odds/BKR_current_lines_1012_2150` + `_buildfmt`, provenance). 12 of 14 games. NOT posted yet: ARI@LAR (Sun 13:05) and BUF@LV (Sun 13:25). Capture when posted.
- Week 6 prep: `reports/analysis/week6-intel/w06-prep-2026-10-12.md`, `w06-team-input-inventory-2026-10-12.md`.
- nflverse sources refreshed through W5: `data/vault-seed/nflverse/team_stats.csv`, `games.csv` (2026 only); analytics/regression/coaching/power snapshots w5; `team-standings-2026-w05.json` (`scripts/build-team-standings.py --week N`); `week-05-teams.json`; digest, projected starters, full roster refreshed (backups `.bak-20261012`). Provenance: `data/generated/team-profiles/REFRESH-2026-10-12-w5.md`.
- Team dossiers v1: schema `reports/analysis/week6-intel/team-dossier-schema-v1.md` (decisions locked: no ATS/OU; FTN = team tables + QB1 only; league table yes; dated folder + `latest.json` pointer).
  - Builder `scripts/build-team-dossiers.mjs --week=6`; validator `scripts/validate-team-dossiers.mjs --tag=2026-w06` (0 errors).
  - Output `data/generated/team-dossiers/2026-w06/` (32 team .json/.md, 14 matchups, league-table, crosswalk, index). Slate input `data/generated/team-dossiers/w06-slate.json`.

## Open / next
1. **Tue 7:00 AM PT scheduled FTN capture** (trigger `trig_01MQvRWvZ4ofhArZjBkVTThw`): confirm BUF and LAR show GP 5, download the 36 FTN CSVs, back up the FTN context JSON as `.bak-20261013`, run `node scripts/build-ftn-stats-weekly-context.js --input-dir <folder>`, validate, then rerun the dossier builder and validator. Needs the device on with the Claude app open.
2. Dossier build step 3 not done: availability (injuries, projected starters, impact digest, roster gate) and priors (2025 final, camp, trench). Dossiers say `NOT BUILT` and `roster_gate: not_run`.
3. Confirm the W6 slate and byes (CIN, DET, MIA, MIN, derived) against the NFL schedule. `schedules.csv` W6 pairings (BUF@LV, ARI@LA) disagree with BKR and the slate file; slate file is used.
4. Secondary-matchup file is still W5; coaching snapshot stale after 2026-10-27; coordinators null.
5. Native Windows items for Andy: `weekly-archive.mjs --week 5`; `python3 scripts/master-intel/actionnetwork_openers.py --week 6` (403 from device shell); SuperContest `data/supercontest/week-06-lines.json`; Kalshi/Polymarket refresh; DKP gate fix (needs OK); `npx vitest run` unverified.
6. **Next session topic (Andy):** review how the Monte Carlo simulations are run. Starting points: `src/lib/simulation.js`, `scripts/margin-simulator.mjs`, `src/lib/devLabSim.js`; Astra prompt `prompts/2026-w05-astra-full-synthesis.md` (calibration JSON `data/research-intel/proposed/2026-w05-historical-market-calibration.json`, hash-pinned). Read-only review first; do not run paid synthesis.

## Gotchas
- Device shell: repo at `$HOME/mnt/dev/projects/NFL_Dashboard`; max timeout 180 s; avoid broad find/grep -r. Do not run `git status`.
- Team codes: canonical WAS/LAR/JAX; repo files mix WSH/WAS and LA/LAR; snapshots key on nicknames. Use `team-crosswalk.json`.
- Market data stays out of dossiers (standings file still carries ats/ou; builder drops them).
