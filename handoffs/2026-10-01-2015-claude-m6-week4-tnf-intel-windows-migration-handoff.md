# M6 -> Windows migration: Week 4 intel state (2026-10-01, ~8:15pm ET)

## CRITICAL
- Branch with everything from this M6 session: `claude/week4-intel-data-2026-10-01` (based on origin/main f9607db). **Nothing here was merged to main.** Fetch it and merge/cherry-pick on Windows after reconciling live Git.
- No wager, account action, ledger write, Supabase write, or TheOddsAPI call was made. `data/official-picks/user-placed-wagers-2026.json` and the placed-wager lane were not touched.
- Six AI **proposal drafts** are in `data/official-picks/proposals/active/` (`tnf-pit-cle-*`, `wk4-favorites-ml-*`). They are `proposal_ready` and not `lock_ready`; none are in the ledger. TNF prices go stale at kickoff (2026-10-02T00:15Z).

## What is on the branch
- Refreshed 2026-10-01 inputs: ESPN full rosters (2538 players), player availability (ESPN injuries), projected starters, secondary matchups (W4), prediction markets/map/coherence, player-props intel, alpha packet.
- Captures: `data/odds/BKR_current_lines_1001_1242` (Week 4 BKR game lines) and `docs/Player_Prop_Odds_Weekly/Week4/` (BKR PIT@CLE raw + SGP dump, BEO PIT@CLE compact, README with caveats).
- Notes: `reports/intel/week4-articles/action-network-pit-at-cle-2026-10-01.md` (A1-A11, including the all-16-game betting primer table) and `reports/analysis/week4-intel/tnf-pit-cle-source-check-and-scenario-drafts-2026-10-01.md` (source reconciliation vs Codex, ESPN provisional inactives, checklist-compliant scenario drafts).
- Script fix: `scripts/nfl-rosters/fetch_espn_rosters.py` uses a curl User-Agent (ESPN returned 403 for `Mozilla/5.0` from M6). Drop or keep on Windows as needed.

## NOT on the branch (live elsewhere)
- Codex's untracked work in `NFL_Dashboard_clean_2026-09-30/reports/analysis/w1-3-deep/codex/` (Action/BettingPros top-stories digest, confidence-pool provisional, parlay-planner HTML). Whoever owns those commits them.
- The wagers ledger (gitignored) and 31 ESPN box scores that exist only in the M6 main checkout's working tree. The W1-3 builders (`season-post-mortem/run.mjs`, `build-week4-matchup-intel.mjs`) produce wrong baselines from a clean git checkout; run them where those files exist (Windows).
- `.env` (secrets) is never committed. A copy exists only in the M6 `NFL_Dashboard_w4` worktree for the read-only props-intel pull.

## IMPORTANT / open items (Tier tags)
| Item | Tier |
|---|---|
| Final NFL inactives for PIT@CLE; ESPN list was provisional (5 per team) | code |
| BKR/BEO prop boards for the other 15 Week 4 games (only PIT@CLE captured) | code (browser capture, runbook section 2) |
| BEO game lines were "Parlays only" and equal the 9/28 opening snapshot, so treat as unverified | code |
| DK Predictions pages for Week 4 | code |
| `node scripts/master-intel/pull.mjs --week 4`, then roster gate `--strict`, then narratives, build, QA (runbook) | standard / frontier |
| Paywalled Action PRO pieces (system pick, Luck Rankings) need a logged-in browser | standard |
| Checklist reminder: `reports/analysis/w1-3-deep/claude/week4-build-checklist.md` governs any ticket; every ticket needs Andy's go | frontier |

## Windows resume steps
1. `git fetch origin` and `git checkout claude/week4-intel-data-2026-10-01` (or merge into your working branch). Reconcile any local edits to the `latest.json` data files first.
2. `npm run roster:vet -- --week 4 --date 2026-10-01 --fetch --strict` and `node scripts/weekly-synthesis-preflight.mjs`; fix STALE rows.
3. Re-run the section 5 refresh commands in `docs/MASTER_INTEL_REPORT_RUNBOOK.md` with the Windows `.env`; capture remaining BKR/BEO Week 4 boards; follow the runbook for the Saturday build.
