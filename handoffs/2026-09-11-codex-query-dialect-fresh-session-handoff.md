# Codex Fresh-Session Handoff — Futures Portfolio Query Dialect

Date: 2026-09-11 UTC  
Repository: `E:\dev\projects\NFL_Dashboard`  
Role: Codex is the independent reviewer. Claude proposes/implements. Andy controls authorization.

## Resume objective

Continue reviewing Claude's incremental work toward a trustworthy, fully enhanced Futures Portfolio synthesis. Review live code, schema, tests, and Git state independently; do not accept handoff claims without verification. Flag findings and do not edit implementation unless Andy explicitly requests implementation.

## First reads, in order

1. `RULES.md`
2. This handoff.
3. `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v8_2026-09-10.md`
4. `handoffs/2026-09-10-2215-claude-dialect-phase3b-picksignals-userpicks-handoff.md`
5. `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE3C_v5_2026-09-11.md`
6. `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE4_SITE5_v2_2026-09-11.md`
7. Live files relevant to the next review:
   - `agents/lib/supabase-pagination.js`
   - `agents/lib/row-reduction.js`
   - `agents/lib/pick-signal-floor.js`
   - `agents/portfolio-dossier.js`
   - `agents/signal-normalize.js`
   - `agents/portfolio-synthesize.js`
   - tracked-HEAD version of `agents/bettorday-newsletter-ingest.js`
   - `supabase/migrations/053_bettorday_intel.sql`
   - query-dialect unit tests.

## Mandatory live reconciliation

Run read-only checks before reviewing new Claude prose:

```powershell
git status --short
git diff --cached --name-only
git log --oneline -10
git rev-parse HEAD
git show --stat --summary 2e47611
```

Use `git show HEAD:<path>` when a tracked file is deleted or modified in the working tree. The repository is heavily dirty and concurrent work must be preserved.

## Critical newly discovered blocker — do not call Phase 3c Git-complete

Current branch is `main`; HEAD is:

`2e476118f3e4f1981777f3b0fbdf8b3cc9b4cecf`

Commit `2e47611` contains exactly the four Phase 3c files previously approved:

- `agents/portfolio-dossier.js`
- `agents/signal-normalize.js`
- `tests/unit/portfolioDossierPhase3c.test.js`
- `tests/unit/gatherExpertPicks.test.js`

However, the commit is **not self-contained in a clean checkout**. Its committed `portfolio-dossier.js` imports:

- `./lib/row-reduction.js`
- `./lib/supabase-pagination.js` with `fetchAllRows`
- `./lib/pick-signal-floor.js`

At commit `2e47611`:

- `agents/lib/row-reduction.js` is absent from Git history and exists only as an untracked working-tree file.
- `agents/lib/pick-signal-floor.js` is absent from Git history and exists only as an untracked working-tree file.
- the committed `agents/lib/supabase-pagination.js` does not export `fetchAllRows()`; the required implementation exists only in the dirty working tree.

Therefore the previously reported 1,513/1,513 full-suite result proves the assembled dirty working tree, not the reproducibility of commit `2e47611`. A fresh checkout of HEAD will fail module resolution/imports. Treat this as a P1 Git/integration blocker that must be reconciled before calling the Round 9 work shippable. Do not stage or commit the prerequisites without Andy's explicit scoped authorization. Ask Claude to inventory the exact Phase 1–3b prerequisite files and propose a scoped commit/closeout sequence; review that proposal before any Git action.

## Current Git snapshot

At handoff creation:

- Branch: `main`
- HEAD: `2e47611`
- Status: 714 changed/untracked/deleted lines
- Staged files: 0
- Relevant dirty state:
  - deleted: `agents/bettorday-newsletter-ingest.js` (still tracked at HEAD; unrelated deletion)
  - modified: `agents/lib/supabase-pagination.js`
  - modified: `agents/portfolio-preflight.js`
  - modified: `tests/unit/supabasePagination.test.js`
  - untracked: `agents/lib/pick-signal-floor.js`
  - untracked: `agents/lib/row-reduction.js`
  - untracked: `tests/unit/pickSignalFloor.test.js`
  - untracked: `tests/unit/rowReduction.test.js`

Never broad-stage, clean, reset, restore, or delete unrelated files.

## Completed technical review history

- Query-dialect proposal v8: design approved.
- Phase 1 primitives: findings fixed and live dirty-tree implementation approved.
- Phase 2 reducer preconditions: findings fixed and live dirty-tree implementation approved.
- Phase 3a call-site migrations: approved in the live dirty tree.
- Phase 3b pick-signal/user-pick migration and season floor: approved in the live dirty tree.
- Phase 3c: implementation approved in the live dirty tree, then Andy separately authorized commit `2e47611` containing only four Phase 3c files.
- Important correction: Phase 3c is behaviorally approved but not Git-reproducible until its uncommitted Phase 1–3b dependencies are reconciled.

## Open Phase 4 / Site 5 proposal

Latest document:

`docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_PHASE4_SITE5_v2_2026-09-11.md`

Codex technical-design verdict: approved, design only.

The proposal now correctly:

- recognizes tracked `agents/bettorday-newsletter-ingest.js` as the writer;
- preserves the five-column composite primary key;
- proposes an additive `bigint generated always as identity` column plus separate unique constraint;
- extracts the dormant loader into import-safe `agents/lib/bettorday-trench.js`;
- does not reconnect BettorDay evidence to the synthesis prompt;
- treats the work as dormant-lane hardening, not a current synthesis blocker;
- separates schema authorization from code authorization.

Implementation clarifications already sent to Claude:

- tests must explicitly isolate Supabase credentials;
- cover Supabase success, thrown-query fallback, empty-query fallback, and no-creds/no-file empty result;
- the select has nine fields, not “six plus as_of_date.”

Live read-only table evidence from Codex:

- `nfl_trench_ratings`: 576 rows
- table reachable
- `id` column absent
- local fallback: 64 rows
- migration number `055` currently available

No schema migration or Phase 4 implementation has been authorized or executed as of this handoff.

## Current synthesis readiness

Latest read-only preflight:

`{ block: 6, warn: 6, error: 0, pass: 22 }`

`safe_to_run_paid_synthesis: false`

Current six blockers:

1. No 2026 `nfl_team_season_stats`; prior-season fallback can be mislabeled as current form.
2. No 2026 `team_analytic_snapshots`.
3. Some placeable sportsbook prices are stale and Circa has never been captured.
4. BetOnline 2026-09-09 import is absent from the manifest.
5. Expert dossier is stale.
6. Portfolio contract cutoff has passed.

Warnings also include incomplete podcast full-transcript coverage, stale watchlist, no sim patch, zero officiating/roster-churn coverage, and the oversized non-slim prompt. Do not authorize paid synthesis until preflight becomes safe or Andy explicitly accepts each remaining risk.

## Last verification evidence

Against the assembled dirty working tree before this handoff:

- blank-credential Phase 3c tests: 27/27 passed
- full suite: 1,513/1,513 passed across 104 files
- syntax/ESLint/scoped diff checks: clean
- read-only preflight: 6 block, 6 warn, 0 error, 22 pass
- row-cap scan: 15 read sites, 0 truncating, 0 unresolved

Again: these test results do not prove a clean checkout of `2e47611`, because required earlier-phase files are still uncommitted.

## Standing authorization boundaries

- No paid model normalization or committee synthesis without Andy's explicit authorization.
- No Supabase/Postgres writes or schema migrations without per-change authorization.
- No betting picks, official-pick promotions, portfolio, exposure, or bankroll mutations.
- No Yahoo Fantasy work.
- No commit or push without Andy's explicit scoped authorization.
- No broad staging; stage exact files/hunks only after authorization.
- No cleanup, reset, restore, stash application, or deletion of unrelated dirty work.
- No `RULES.md` or governance amendment without Andy's explicit authorization.
- No BettorDay reconnection to the prompt without Andy's explicit decision.
- Review findings first; do not fix unless asked.

## Next-session priority

1. Reconcile the Phase 1–3b prerequisite files required to make HEAD reproducible. Ask Claude for an exact scoped inventory/proposed commit sequence; independently verify it.
2. Continue Phase 4 only after explicit Andy authorization for its specific next action:
   - Part 1 schema migration, staged and verified first; or
   - proposal/implementation review only, with no database write.
3. Keep the six synthesis-readiness blockers separate from query-dialect completion. Phase 4 is dormant hardening and does not make paid synthesis safe.

