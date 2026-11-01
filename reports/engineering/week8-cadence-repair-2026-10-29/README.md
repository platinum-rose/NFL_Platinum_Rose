# Thursday cadence repair — October 29, 2026

The reported Thursday run failed in availability and market-comparison file writes; the props step completed. The runner's exit code 1 was correct. The error alone does not identify the Windows lock holder or establish a permanent permissions problem. Both original targets could be opened read/write during inspection without modifying their contents.

The availability JSON had advanced to the 8:34 AM Pacific snapshot while the latest Markdown was still from the previous afternoon. The market comparison was still Week 7, and no Week 8 locked SuperContest sheet exists locally.

## Changes

- Both failed writers now use a unique temporary file in the destination directory and replace the destination by rename. Short, bounded Windows sharing-error retries cover `UNKNOWN`, `EBUSY`, `EPERM` and `EACCES`. Persistent errors still fail; the published destination is never truncated or deleted as a workaround.
- Availability renders all views before writing, and publishes the latest JSON after its dated/latest views complete. Individual files are atomic; the six-file set is not a filesystem transaction. On a view failure the latest JSON does not advance, though earlier view replacements can have completed.
- SuperContest comparison selects the exact current season/week before any market request. Missing/empty/wrong-season sheets produce `SUPERCONTEST_WEEK_MISSING`, leaving the existing comparison intact. Week 7 is no longer accepted as a Week 8 comparison.
- No cadence-runner behavior or task settings changed. The remaining independent step can still finish while the cadence correctly returns failure for a failed step.

## Recovery and checks

The saved 1,146-event availability snapshot was rendered locally. Its original generated time, `2026-10-29T15:34:34.134Z`, and JSON bytes are unchanged. All six output files match that exact snapshot's render. This repairs the views; it does not refresh evidence, fix known eligibility/timestamp issues or approve the evidence for synthesis. Prior files are preserved under `availability-before/`.

- **40/40 focused tests passed** across `cadenceFileWrites`, `playerAvailability` and `oddsSingleSource`. Fault cases exercise transient/persistent sharing failures, old-file preservation, incomplete view publication, wrong-week gating before market access, and offline current-week comparison.
- Changed JavaScript and the market-comparison module pass lint; syntax/diff checks pass.
- The first test attempt was blocked by a Vite temporary-cache rename under the Windows sandbox's default C: temp directory. Running the same focused suite with a task-specific temporary directory under this repository succeeded. This does not prove that the user's original cadence error had the same cause.
- The local-only Week 8 sheet check returns the expected missing-sheet error. Its receipt confirms the old comparison hash stayed unchanged and no market request was made.

Receipts: `test-results.json`, `availability-recovery.json`, `availability-before.json`, `locked-sheet-check.json`.

## Remaining state

The full live Thursday cadence was **not rerun or certified successful**. Week 8 locked SuperContest lines are still required. The prior Week 7 comparison remains on disk and must not be used for Week 8 decisions. A new live cadence/market retrieval remains subject to Andy's per-action approval for account/Supabase/paid operations.

No Supabase, account, ledger/portfolio, wager, paid call, official pick publication, commit or push occurred in this repair. The TNF card remains HOLD. Live branch is `claude/w5-prop-cards-2026-10-11`, HEAD `d6356c3c0a1d1a7468e67b82eca0449af085106d`. Preserve the unrelated private Yahoo access-file modification and extensive untracked work.
