# NFL Dashboard — Codex Futures-Odds Reconciliation Review Handoff

**Created:** 2026-09-09 15:00 UTC  
**Workspace:** `E:\dev\projects\NFL_Dashboard`  
**Purpose:** Resume in a fresh Codex session to independently review the next batch of Claude-team work. This is a review handoff, not authorization to continue implementation.

## Authoritative live state

- Branch: `main`
- HEAD: `0fc6112fb43596cd5dea6939bf735c5d0fa98793` (`chore(futures): add betonline exacta matchup snapshot`)
- Tracking: `main...origin/main [ahead 1]`; `origin/main` is `d3d4b9e`.
- Worktree: very dirty with concurrent Claude, Antigravity, fantasy, evidence-gate, ingestion, generated-data, scratch, and probe work. Preserve all of it.
- Staging area: empty at handoff creation (`git diff --cached --name-only` returned no paths).
- Nothing from this reconciliation was staged, committed, or pushed.
- Existing `HANDOFF.md`, `HANDOFF_PROMPT.md`, and `handoffs/2026-09-09-0830-fresh-session-handoff.md` predate this futures-history reconciliation. Their historical context may help, but their Git/preflight/database counts are not current.

## What this Codex session completed

The immediate problem was conflicting Bills/Packers futures quotes between local imports, generated dossier data, and Supabase. The investigation established that there were multiple ingestion paths with inconsistent retention, normalization, query limits, and "current price" selection rules.

The current reconciled state is:

- Supabase `futures_odds_snapshots` contains **26,666 season-2026 rows**.
- The import manifest accounts for **24 dated imports**: **23 valid/persisted**, **1 invalid semantic duplicate**, and **5,484 valid manual-import rows**.
- `betonline-2026-09-03.json` is recorded as invalid because its content duplicates the August 29 snapshot despite the later filename date.
- Historical manual rows were restored twice. The first restoration was subsequently pruned by the scheduled GitHub workflow running the old committed 30-day-retention code. A second authorized restoration returned the database to the current 26,666-row state.
- Reversed matchup labels now canonicalize to one exacta identity: `Buffalo Bills vs Green Bay Packers`.
- Bills/Packers exacta history now resolves as:
  - BetUS `+6500`: June 26, July 14, July 21, July 29, and August 10.
  - BetOnline/BEO `+8300`: September 7.
  - BetUS `+7000`: September 8.
- The regenerated dossier selects BEO `+8300` as the current best Bills/Packers exacta quote. Exacta simulation probability and value gap remain deliberately null under the sim-price-only policy.
- A source anomaly was identified in `bookmaker-2026-07-29.json`: New Orleans appeared under `division_nfc_west`. The raw evidence remains preserved, while downstream market-membership validation now quarantines the malformed row. The current NFC West dossier contains only Rams, Seahawks, 49ers, and Cardinals.

Current generated artifacts:

- `.nfl/portfolio/dossier-2026-09-09.json`
- `.nfl/portfolio/dossier-2026-09-09.md`
- `.nfl/portfolio/sim-2026-09-09.json`
- Simulation: 20,000 iterations, `sim_version: coherence-v1`; conservation checks were approximately playoffs `14.0008`, Super Bowl `1.0003`, matchup `1.0`.

Stored best-price examples in the current dossier (these are reconciled stored snapshots, not a new sportsbook-UI scrape):

| Market | Current stored best |
|---|---:|
| Bills Super Bowl | Caesars `+1000` |
| Bills AFC | BetUS `+500` |
| Bills AFC East | BetUS `-150` |
| Bills playoffs | BetUS `-325` |
| Bills wins | BetUS Over 10.5 `-135`; Bookmaker Under 10.5 `+132` |
| Packers Super Bowl | BEO `+2500` |
| Packers NFC | Bookmaker `+1100` |
| Packers NFC North | Bookmaker `+260` |
| Packers playoffs | BetUS `-130` |
| Packers wins | BetUS Over 9.5 `-140`; Bookmaker Under 9.5 `+130` |
| Bills vs Packers exacta | BEO `+8300` |

## Reconciliation implementation surface

The following paths contain this task's changes, but several—especially `agents/portfolio-dossier.js`, `agents/portfolio-preflight.js`, and `package.json`—also contain pre-existing concurrent work. Review individual hunks; do not attribute an entire file diff to this task.

Modified:

- `agents/futures-odds-ingest.js` — removed destructive 30-day pruning.
- `agents/metabet-futures-ingest.js` — removed the same pruning behavior.
- `agents/lib/portfolio-local-inputs.js` — canonical exacta identity.
- `agents/portfolio-dossier.js` — exacta canonicalization, current-tier quote selection, and invalid market-membership quarantine, alongside other sessions' edits.
- `agents/portfolio-preflight.js` — import-manifest/hash/live-row-count verification, alongside other sessions' edits.
- `package.json` — adds `futures:reconcile-imports`; also includes unrelated/pre-existing script changes.
- `scripts/backfill-futures-imports.js` — audited reconciliation/backfill utility with manifest validation, semantic-duplicate exclusion, and live-count checks.
- `scripts/ingest-beo-screenshots.js` — records persistence status/receipt in review output.
- `src/components/futures/FuturesMarketBrowser.jsx` — displays all ingested market families/books and uses bettor-favorable price comparison.
- `src/lib/agentTools.js` — 365-day movement window, exacta support, and current best quote across each book's latest snapshot.
- `src/lib/supabase.js` — exhaustive season paging, per-market/selection/book latest selection, exacta history normalization, and 365-day movement default.
- `tests/unit/agentTools.test.js`
- `tests/unit/portfolioLocalInputs.test.js`

New/untracked:

- `data/futures-imports/import-manifest-2026.json`
- `src/lib/futuresMarketIdentity.js`
- `src/lib/futuresQuoteSelection.js`

## Verification evidence

Completed before close:

- Full Vitest suite: **91 files, 1,326/1,326 tests passing**.
- Focused ESLint across the reconciliation scope: **0 errors**.
- Production Vite build: **exit 0**; only the stale Browserslist-data warning remained.
- Full-repo lint is not clean because unrelated untracked `agents/yahoo-season-ingest.js:20` has an unused `collectionItems` error; it also reports 29 existing warnings. Do not misattribute that failure to this work.
- Final preflight rerun at `2026-09-09T14:59:52.313Z`: **2 BLOCK / 7 WARN / 0 ERROR / 26 PASS**, `safe_to_run_paid_synthesis: false`.
- Preflight confirms `futures_import_manifest` PASS and `market-row-retention`, dossier freshness, signal synchronization, and simulation patch PASS.

Current preflight blockers:

1. Circa has never been captured in `futures_odds_snapshots`.
2. `vault_notes` at `agents/portfolio-synthesize.js:1301` has 1,009 rows but is read without pagination, so PostgREST can return only 1,000.

No database migration was created or applied by this reconciliation. The untracked `supabase/migrations/054_yahoo_fantasy_season.sql` belongs to unrelated Yahoo work and was not touched.

## Critical unresolved deployment risk

The local pruning removals are **not deployed**. `.github/workflows/futures-odds-ingest.yml` runs `node agents/futures-odds-ingest.js` daily at 10:00 UTC from the committed remote branch. `origin/main` still contains `SNAPSHOT_TTL_DAYS = 30` and `pruneOldSnapshots()`, which deletes historical rows before ingesting.

Therefore, unless the relevant fix is reviewed, approved, committed, and pushed before the next scheduled run, GitHub Actions can delete the restored rows older than 30 days again. This is the top operational risk for the fresh session to verify and raise; it is **not** authorization to commit or push.

## Writes and guardrail accounting

- Supabase writes did occur during this completed reconciliation: an idempotent 5,484-row historical backfill was run twice, each within the user's explicit authorization to reconcile all sources. The second run restored rows removed by the old scheduled workflow.
- No paid model/committee synthesis was run.
- No betting pick was promoted and no portfolio/bankroll state was mutated.
- No Git staging, commit, or push occurred.
- Temporary edit helpers created for this task were removed; unrelated existing scratch/probe files remain untouched.

## Fresh-session review procedure

The user's next message will provide a new Claude-team batch. Treat that batch as the primary review target. Read every supplied report/handoff in the order requested, then independently verify its claims against live code, data, tests, and Git state. Do not assume this handoff or Claude's prose is current when a cheap live check can settle it.

Start with:

```powershell
Set-Location E:\dev\projects\NFL_Dashboard
git status --short --branch
git log -n 5 --oneline --decorate
git diff --cached --name-only
git diff --check
```

Then read:

1. The new Claude-team report(s) supplied by the user in the fresh session.
2. This handoff: `handoffs/2026-09-09-1500-codex-futures-odds-reconciliation-review-handoff.md`.
3. `data/futures-imports/import-manifest-2026.json`.
4. `.github/workflows/futures-odds-ingest.yml` and the committed-vs-working diffs for the two ingestion agents.
5. The exact files and tests named by Claude's new report.
6. Only as historical context, `handoffs/2026-09-09-0830-fresh-session-handoff.md` and the rolling `HANDOFF.md` / `HANDOFF_PROMPT.md`.

For a fresh current preflight, use this read-only command:

```powershell
node agents/portfolio-preflight.js --json --warn-only
```

Do not regenerate, ingest, backfill, persist, or run paid synthesis merely as part of review. Ask before any operation that writes Supabase or changes portfolio state.

## Standing guardrails

- Review and report; flag findings, do not fix unless the user separately asks for implementation.
- Preserve the entire dirty worktree. No reset, clean, checkout/revert, stash, or broad mechanical rewrite.
- No `git add -A`; no staging, commit, or push without explicit approval. Commit and push are separate approvals.
- No Supabase/Postgres writes without explicit per-write authorization.
- No paid committee/model synthesis without explicit authorization.
- No betting-pick promotions or portfolio/bankroll mutations.
- No Yahoo Fantasy work.
- Do not treat the local ahead-by-one commit as approval to push it.

## Resume Prompt

```text
Codex, resume review duties in E:\dev\projects\NFL_Dashboard.

First read every new Claude-team report or handoff I provide in this session, in the order I specify. Then read handoffs/2026-09-09-1500-codex-futures-odds-reconciliation-review-handoff.md. Treat live Git, code, database reads, generated artifacts, and independently rerun tests as authoritative over all handoff prose.

Objective: independently review the new Claude batch and report findings. Start by running git status --short --branch, git log -n 5 --oneline --decorate, git diff --cached --name-only, and git diff --check. Inspect only the files and claims in scope, while preserving the very dirty concurrent worktree. Do not continue implementation automatically; flag issues rather than fixing them unless I explicitly ask for changes.

Known verified boundary from the prior Codex session: HEAD 0fc6112 is one commit ahead of origin/main; nothing from the futures reconciliation is staged, committed, or pushed; the restored futures table held 26,666 season-2026 rows; the import manifest accounted for 24 dated imports, 23 valid/persisted, 1 invalid duplicate, and 5,484 valid manual rows; the final preflight was 2 BLOCK / 7 WARN / 0 ERROR / 26 PASS with safe_to_run_paid_synthesis=false; full Vitest was 91 files and 1,326/1,326 passing. Refresh any drift-prone fact before relying on it.

Top operational risk to keep visible: the local removal of 30-day futures pruning is not deployed, while the daily 10:00 UTC GitHub workflow still runs origin/main's old pruning code and can delete restored line history again. This is not permission to stage, commit, or push.

Guardrails: no reset/clean/stash/revert; no git add -A, staging, commit, or push without explicit approval; no Supabase/Postgres writes; no paid synthesis; no betting-pick promotion or portfolio mutation; no Yahoo Fantasy work. Treat commit and push as separate approvals.
```
