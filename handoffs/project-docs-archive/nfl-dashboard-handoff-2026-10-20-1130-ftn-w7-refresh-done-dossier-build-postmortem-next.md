# NFL_Dashboard handoff — 2026-10-20 ~11:30 PT — FTN W6 refresh done, dossier build + post-mortem next

Statistical context only. Nothing here is a bet recommendation.

## State of the repo
- Repo: E:\dev\projects\NFL_Dashboard, branch `claude/w5-prop-cards-2026-10-11`.
- Pushed commit **020362a** (9 files only, via path-limited add/commit; checkout is otherwise still intentionally dirty — never `git add -A`, never full `git status`):
  - data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json (W7 prep context)
  - public/schedule.json
  - data/projected-starters/2026/latest.json, manual/week-usage-locks.json, projected-starters-2026-10-20.json
  - docs/projected-starters/projected-starters-latest.md, projected-starters-2026-10-20.md
  - data/generated/player-usage-trends-2026.json, player-usage-history/2026/week-06.json
- NOT committed (left alone on purpose): data/official-picks/* (wager ledger + .bak files), player-props-intel-latest.json, 2026-w06-weather-venue*, article-intel *.bak.json, the two ftn ...latest.json.bak-20261013/20261020 backups, projected-starters older snapshots/docs, week-05 usage history, and some pre-existing staged deletions from other sessions (untouched).

## What was done today
1. FTN Stats iQ re-capture (Chrome, 36 tables) after Andy confirmed bye-week GP oddities are expected. 10/13 CSVs (74 files) moved to C:\Users\andre\Downloads\ftn-archive-2026-10-13. New: 36 distinct stats-iq-*.csv, no "(1)" dupes, none empty, all dated 10/20 8:07-8:14 AM PT.
2. `node scripts/build-ftn-stats-weekly-context.js --week 7` -> 36 tables, 4,673 rows, 32 teams mapped, 0 unmapped, no warnings. (10/13 JSON counted 74 tables / 9,309 records because it read the dupes; the real 10/13 figure was 36 / 4,634.)
3. Andy ran `toolbox --cadence tuesday` (schedule, nflverse player stats, Supabase ingest, usage locks from W6, projected starters, TheOddsAPI game odds ~3 credits, roster audit). All succeeded; odds quota ~398 left.

## Open issues
- **Dossier build blocked.** `node scripts/build-team-dossiers.mjs --week=7` -> "REQUIRED SOURCES MISSING": data/generated/team-profiles/team-analytic-snapshots-2026-w6.json, team-regression-snapshots-2026-w6.json, team-coaching-tendency-snapshots-2026-w6.json, team-standings-2026-w06.json, and data/generated/team-dossiers/w07-slate.json. `validate-team-dossiers.mjs --tag=2026-w07` then fails on missing data/generated/team-dossiers/2026-w07/index.json. Next session: find which scripts generate these (do not work around), run them in order, then rebuild + validate.
- **FTN GP check inconclusive.** Player GP in passing/rushing/receiving overview CSVs did not visibly advance vs the 10/13 archive (0 matched players +1; e.g. Dak Prescott shows GP 6 while DAL team page GP 5). Old passing-efficiency was mostly GP 3-4, new 3-6. Team-offense/overview on FTN still showed SF 5 and KC 4 (should be 6 after MNF; KC 5-6?). Cross-check against nflverse weekly (already refreshed through W6) before trusting FTN GP-dependent per-game rates. Consider re-pulling SF/KC-affected tables later today.
- Roster audit could not find Wilson, Fields, Henry, Cousins in primary datasets (only matters if expected).
- Post-mortem: see claude/w06-postmortem-narrative-2026-10-20.md (already in project) — continue from there.

## Guardrails (carry forward)
No spend on Gemini, AssemblyAI, OpenAI, TheOddsAPI. Do not touch data/official-picks/ or any wager/ledger file. Commit only with explicit user instruction and only path-limited. Nothing is a bet recommendation.

## RESUME PROMPT (paste into the fresh session)

> Resume NFL_Dashboard (repo E:\dev\projects\NFL_Dashboard, linked computer via device_bash mount $HOME/mnt/dev/projects/NFL_Dashboard; native Windows via desktop-commander PowerShell). First read project doc `claude/nfl-dashboard-handoff-2026-10-20-1130-ftn-w7-refresh-done-dossier-build-postmortem-next.md` and `claude/w06-postmortem-narrative-2026-10-20.md`. Two tasks, in order: (1) Dossier build: `node scripts/build-team-dossiers.mjs --week=7` fails on missing W6 sources (team-analytic / regression / coaching-tendency snapshots 2026-w6, team-standings-2026-w06.json, team-dossiers/w07-slate.json). Find which scripts generate them, run them in dependency order, rebuild the dossiers, then run `node scripts/validate-team-dossiers.mjs --tag=2026-w07`; report exact errors, don't work around failures. Also reconcile the FTN player-GP anomaly against nflverse weekly. (2) Continue the Week 6 post-mortem from the narrative doc. Guardrails: no Gemini/AssemblyAI/OpenAI/TheOddsAPI spend; never touch data/official-picks/ or wager/ledger files; never `git add -A` or full `git status` (checkout is intentionally dirty); commit/push only when I say so and only path-limited. Statistical context only, nothing is a bet recommendation. Last pushed commit: 020362a on branch claude/w5-prop-cards-2026-10-11.
