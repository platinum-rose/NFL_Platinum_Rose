# Gate-aggregation fix — safe_to_run_paid_synthesis now checks ERROR, not just BLOCK

**Date:** 2026-09-10
**Scope:** `agents/portfolio-preflight.js`, `tests/unit/portfolioPreflightScanner.test.js`
**Trigger:** Found while responding to Codex's v3 review of the query-dialect migration proposal (Finding 1) — independent of that migration, but surfaced by it.

## The bug

`check()` (line 71) wraps every preflight check in a try/catch and records a thrown error as `ERROR`, distinct from `BLOCK`. The JSON output's `safe_to_run_paid_synthesis` field was computed as `blocks.length === 0` alone — it never consulted the `errs` array, even though `errs` was already being computed one line above it. A check that threw (a schema surprise, a transient Supabase error, any bug in the check itself) would report `ERROR` and get silently excluded from the safety verdict, potentially leaving `safe_to_run_paid_synthesis: true` even though one or more lanes were never actually verified.

This was found, not invented for the occasion: Codex's v3 review of the query-dialect proposal pointed out that migrating `portfolio-preflight.js:906` (podcast_episodes) to the proposed `fetchByUniqueValues()` helper would give this bug a live, natural trigger path, since that helper is designed to throw once its input set exceeds 999 values. Checking the gate's actual aggregation logic confirmed the bug was already there, independent of that migration.

## The fix

```js
export function isSafeToRunPaidSynthesis(blockCount, errorCount) {
  return blockCount === 0 && errorCount === 0;
}
```

Extracted as its own exported, directly-testable function (matching the existing pattern for `classifyRowcapSites()`/`shouldSkipScanError()`) rather than left as an inline boolean expression inside `main()`, and called from the JSON-output branch in place of the old `blocks.length === 0`.

## Verification

- `node --check agents/portfolio-preflight.js`: clean.
- `node node_modules/eslint/bin/eslint.js agents/portfolio-preflight.js tests/unit/portfolioPreflightScanner.test.js`: clean.
- `git diff --check` on both files: clean.
- 4 new tests added (`portfolioPreflightScanner.test.js` 53 → 57, all passing): safe only when both counts are zero; not safe with a BLOCK and zero errors; **not safe with zero BLOCKs but a nonzero ERROR count — the actual bug**; not safe with both nonzero.
- Live preflight re-run at current HEAD: `{ block: 6, warn: 5, error: 0, pass: 23 }`, `safe_to_run_paid_synthesis: false` — unchanged from before the fix, since today's live run has zero ERRORs. The fix is dormant-but-correct today; it protects against a currently-live gap that any future thrown check (including, but not limited to, the query-dialect migration's `fetchByUniqueValues()`) would otherwise fall into silently.

## Repository state

Only `agents/portfolio-preflight.js` and `tests/unit/portfolioPreflightScanner.test.js` touched. No commits, no Supabase writes, no paid synthesis, no scraper invocations. Worktree remains deliberately dirty per standing protocol.

## Addendum (2026-09-10, later same day) — Codex v4 review, Finding 1 continued

Codex's v4 review of the query-dialect proposal found this fix was incomplete: the JSON output path was fixed to call `isSafeToRunPaidSynthesis()`, but the human-readable CLI text report and the process exit code each still computed their own copy of the same condition directly off `blocks.length`, ignoring `errs`. A run with zero BLOCKs and one or more ERRORs would have printed "SAFE TO RUN PAID SYNTHESIS" to a human even though the JSON field for that same run correctly said `false`.

Fixed (Andy authorized): extracted `buildDisposition(blocks, errs)`, which computes the verdict once and returns `{ safe, headline }` (the exact human-facing headline text, not just the boolean). `main()` now uses this single value for all three surfaces: the JSON `safe_to_run_paid_synthesis` field, the printed headline in the text report, and the `process.exit(1)` condition. The text report's error branch also now explicitly lists ERROR-status checks alongside BLOCKs, so a human can see why a run is unsafe even with zero blocks.

4 new tests added against `buildDisposition()` directly (asserting on the actual headline text, not just the boolean), addressing Codex's specific note that the prior 4 tests only exercised the pure boolean and wouldn't have caught the CLI/JSON contradiction. Scoped suite: 57 -> 61, all passing.

Verified: `node --check` clean, `eslint` clean, `git diff --check` clean. Live run at current HEAD, human mode (`node agents/portfolio-preflight.js`, real exit code captured directly rather than through a pipe): prints `DO NOT RUN PAID SYNTHESIS.` and lists the 6 current blocking issues, real exit code `1`. Live run, JSON mode: `{block:6, warn:5, error:0, pass:23}`, `safe_to_run_paid_synthesis: false`. All three surfaces agree, unchanged from before this fix (today's run has zero live errors, so this closes a forward-looking gap, same as the original fix).

See `docs/CODEX_ROUND9_QUERY_DIALECT_MIGRATION_PROPOSAL_v5_2026-09-10.md`, Finding 1, for the full write-up in proposal-review context.
