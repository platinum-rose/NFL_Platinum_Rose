# M6 resume — Tuesday pipeline, W1–3 re-grade, and Week 4 intel staging

## Read first, in order

1. This handoff.
2. `AGENTS.md`, then the relevant sections of `CLAUDE.md` and `docs/ANTI_PATTERNS.md`.
3. `git status -sb`, `git log -5 --oneline`, and the scoped diffs before changing anything. The Windows checkout was heavily dirty/shared; live Git on M6 is authoritative.
4. For Master Intel work, `docs/MASTER_INTEL_REPORT_FORMAT.md` and `docs/MASTER_INTEL_REPORT_RUNBOOK.md`.

## What this commit delivers

### Tuesday pipeline repair

- `agents/schedule-ingest.js` now reads the active `game_odds_snapshots` table first, chooses a preferred book per game, and retains `odds_snapshots` only as a legacy fallback.
- The agent no longer auto-runs when imported by tests. `scripts/toolbox.mjs` no longer spawns commands through a shell.
- The forced odds refresh successfully wrote 143 valid rows for 16 events; the following schedule refresh wrote 272 Week 1–18 rows and applied the fresh odds snapshot to 16 games. Do not infer the former price snapshot is current; re-run only with current authorization and API-credit awareness.

### Independent Weeks 1–3 re-grade

- `scripts/analysis/season-post-mortem/` provides a local-ESPN-only, reproducible re-grader and deterministic descriptive basket simulation.
- `reports/analysis/w1-3-deep/codex/` contains the output. It accounts for 559 W1–3 legs: 547 independently resolved (256 WON, 291 LOST, 1 PUSH) and 11 explicitly unresolved (six CFB/open-slot and five unmatched-player cases). There are zero remaining terminal-result mismatches versus the present ledger or Team 1's published W1/W2/W3 files.
- The report does not alter a wager, ticket, payout, account, or database.

### Week 4 matchup-intel staging

- `reports/analysis/week4-intel/WEEK4_MATCHUP_INTEL.md` contains full first-three-games profiles and matchup breakdowns for all 16 Week 4 games. `week4-team-baselines.json` is the structured companion.
- `scripts/analysis/build-week4-matchup-intel.mjs` rebuilds both from settled local ESPN captures, `public/schedule.json`, and the saved 2026-09-28 BEO opening snapshot.
- The opening lines are historical/non-executable. The report deliberately has no player claims, projections, card leans, or recommendations. It is a source input, not the Master Intel output.
- Two thread heartbeats are active: `thursday-matchup-intel-staging` and `saturday-master-intel-update`, both scheduled for 2 PM Pacific. The Saturday task builds Master Intel only after required inputs are fresh and the strict roster gate passes.

## Verification already run

```powershell
npx.cmd vitest run tests/unit/scheduleIngest.test.js tests/unit/seasonPostMortem.test.js
npx.cmd eslint agents/schedule-ingest.js scripts/toolbox.mjs scripts/analysis/season-post-mortem/grade.mjs scripts/analysis/season-post-mortem/run.mjs scripts/analysis/season-post-mortem/simulate.mjs scripts/analysis/build-week4-matchup-intel.mjs tests/unit/scheduleIngest.test.js tests/unit/seasonPostMortem.test.js
node scripts/analysis/season-post-mortem/run.mjs --weeks 1-3
node scripts/analysis/season-post-mortem/simulate.mjs
node scripts/analysis/build-week4-matchup-intel.mjs
```

The focused tests and scoped lint passed. Re-run them after any edits. The all-repository test suite was not used as a release signal because the checkout contains concurrent work.

## Exact next task: Thursday preliminary Week 4 update

1. Reconcile live Git and preserve unrelated work.
2. Read the Week 4 staging report and its historical BEO snapshot.
3. Run freshness/readiness checks before using a market or availability input. Do not call TheOddsAPI, write Supabase, place a wager, mutate the placed-wager ledger, or sync a bankroll without an explicit new authorization.
4. Add only dated, source-qualified facts. Before naming any player, run the required Week 4 strict roster gate and stop if it blocks.
5. Keep current market observations separate from the saved opening reference. Do not call an advertised market a captured row.
6. On Saturday, follow the locked Master Intel runbook: write `reports/intel/master-intel-narratives-2026-w04.md` only after ingestion, build the packet only if all gates pass, and perform HTML/export QA.

## Literal M6 resume prompt

```text
Resume NFL Dashboard Week 4 intel work in the current checkout. Read handoffs/2026-09-29-1235-codex-tuesday-pipeline-w1-3-week4-m6-handoff.md first, then AGENTS.md, the relevant CLAUDE.md/ANTI_PATTERNS.md rules, and the Master Intel format/runbook. Reconcile live Git before trusting this handoff; preserve all unrelated dirty work.

The committed scope repaired schedule odds enrichment, added a tested local ESPN W1–3 independent re-grade/simulation pipeline, and created reports/analysis/week4-intel/WEEK4_MATCHUP_INTEL.md for all 16 Week 4 games. Treat its opening-market data as historical and non-executable. Do not alter wagers, ledgers, accounts, Supabase, or call TheOddsAPI without new explicit authorization.

For the Thursday preliminary pass, add only current, dated, source-qualified intelligence to the staging workflow. Run the Week 4 strict roster gate before naming a player. On Saturday, after full intel ingestion and only when the roster gate and freshness checks pass, turn the staging facts into the canonical reports/intel/master-intel-narratives-2026-w04.md and follow the locked Master Intel runbook/build/QA process. Report any stale or missing required input instead of filling gaps with assumptions.
```
