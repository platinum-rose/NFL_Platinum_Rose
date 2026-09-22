# Codex round-5 P2 response — scanner: return-value proof, method-scoped signals, AST discovery

**Date:** 2026-09-09 (~2200-2234 UTC)
**Scope:** `agents/portfolio-preflight.js`, `tests/unit/portfolioPreflightScanner.test.js`
**Disposition requested:** review for any remaining fail-open path in the rowcap scanner; re-confirm P1 evidence-tier / doc-path / scraper work still sound (unaffected this round).

## Context

Codex's round-5 review ("Round 3" in Codex's own numbering — this is the fifth review cycle overall in this thread) requested changes on three new P2 findings against the AST-based scanner shipped in the prior round. All three are fixed. No commits, no scraper invocations, no Supabase writes, no paid synthesis.

## Findings and fixes

### Finding 1 — "Wrapper callback identity still does not prove query identity" (lines 289-299)

Being lexically inside the *right* wrapper callback (right function, right argument position) never proved the `.from()` chain under test was the value that callback actually produces. Two concrete gaps followed from this:

- A decoy or dead-code `.from()` call sitting elsewhere in the same callback body (an unused local, an early-return branch, a logging call) inherited "wrapped" status just from sharing a function with the real query.
- `fetchAllPaged()` — unlike `fetchAllKeyset()`, which has owned its own pagination clauses since round 2 — still trusts `buildQuery(from, to)` to embed `.range(from, to)` itself (confirmed against the real implementation in `agents/portfolio-dossier.js:251`). A genuinely-wrapped callback that simply forgot `.range()` still read as paginated, since `wrappedInFetchAllPaged` alone satisfied the `paginated` check.

**Fix:** added `isChainReturnedByFunction(path, fnIdx, fromIdx, chainLength)`, which requires the chain's outermost link to be the actual value the enclosing function produces — either an arrow function's implicit-return expression body (`fn.body === outermostCall`), or the argument of an explicit `return` statement. Both `isWrappedInFetchAllKeyset()` and `isWrappedInFetchAllPaged()` now call this before returning true. `isWrappedInFetchAllPaged()` additionally now takes `hasRangeCall` and requires it — being a real, returned `buildQuery` callback proves nothing about whether it paginated; only a genuine `.range()` call in that same chain does.

Verified with an adversarial fixture: a `fetchAllPaged` callback containing a decoy `sb.from('vault_notes')` (not returned) alongside the real, returned `sb.from('other_table')...range(from,to)` correctly reports **two independent sites** — the decoy `unsafe/unpaginated`, the real one `safe`. This is arguably stronger than a single pass/fail verdict: a decoy call is a real, separate read, and it's now correctly flagged in its own right rather than being masked by the wrapper's trust.

### Finding 2 — "Chain options are interpreted without method context" (lines 359-370)

`chainHasHeadTrueOption()` read `head: true` off **any** call in the chain, not specifically `.select()` — the only Supabase client method where that option means anything (`.select(cols, { count, head })`). An unrelated call with a coincidentally `{ head: true }`-shaped argument (e.g. an `.eq()`/`.match()` value) could be misread as a count-only query.

**Fix:** scoped the check to `c.callee?.property?.name === 'select'` before inspecting its arguments. (`chainSmallLimitValue()` was already correctly scoped to calls named `limit`; no change needed there.)

### Finding 3 — "Database-read discovery is still regex-based" (line 382)

The very first step of the scanner — finding candidate `.from(...)` call sites at all — was still `src.matchAll(/\.from\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/g)`, a plain regex over raw source text. This carried the identical comment/string-literal spoofability every safety-signal regex had already been rewritten away from, one level further out: a `.from(...)` mentioned only in a comment or string literal was findable at all (and, since it's not a real query, always misclassified as an unsafe site), and — the more serious direction — a dynamically-named table (`sb.from(tableVar)`) or an unusually-formatted real call could fail to match the regex's shape and be **invisible to the scanner entirely**: a silent audit gap, not merely a false report.

**Fix:** replaced discovery with `findAllFromCallSites(ast)`, a single AST walk that finds every real `.from(...)` `CallExpression` structurally (`callee.type === 'MemberExpression'`, non-computed, `property.name === 'from'`) and returns each site's own root-to-node ancestor path directly — no offset-based re-discovery needed afterward. Excludes `Buffer.from`/`Array.from` explicitly (real methods sharing the name that a bare property-name match would otherwise misidentify as a database read). A dynamically-named table (`sb.from(tableVar)`) is still discovered and reported as `(dynamic table)` rather than silently dropped — fail closed, never fail open. **If a file fails to parse at all, `scanCallSites()` falls back to the old regex scan, marking every match unsafe** — so a parse failure degrades to noisier reporting, never to silently finding nothing.

As a consequence, `findAstNodePath()` and `findFromCallNode()` (both from round 3/4) are now dead code and were removed.

## New tests

Added 8 tests to `tests/unit/portfolioPreflightScanner.test.js` (16 → 24 total, all passing):

- **#5a** — a genuine, *returned* `fetchAllPaged()` callback missing `.range()` is correctly unsafe.
- **#5b** — a decoy `.from()` in the right callback but not its return value is correctly unsafe, while the actually-returned chain (different table, with `.range()`) is separately and correctly safe.
- **#5c** — the `fetchAllKeyset()` analog of #5b (decoy inside `applyFilters`, not returned).
- Regression check — a genuine `fetchAllKeyset()` applyFilters with an implicit-return `.from()` chain (the ordinary real-world shape) is still recognized safe; the return-value check doesn't regress the common case.
- **#5d** — `head: true` on an unrelated method (`.eq()`) is not treated as the count-only signal.
- **#5e** — `.from(...)` mentioned only in a comment or a string literal is not discovered as a site at all; a real call elsewhere in the same file is still found correctly.
- **#5f** — `Buffer.from()`/`Array.from()` are never mistaken for a database read.
- A dynamically-named table (`sb.from(tableVar)`) is discovered and reported as `(dynamic table)`, unsafe by default, rather than silently invisible.

## Verification

- `node --check` on both changed files: clean.
- Ad hoc adversarial Node scripts (run before touching the test file) confirmed every fixture behaves as intended, including the two-site decoy/real split described above.
- `node node_modules/eslint/bin/eslint.js agents/portfolio-preflight.js tests/unit/portfolioPreflightScanner.test.js`: clean.
- Focused suite: `portfolioPreflightScanner.test.js` (24/24) + `supabasePagination.test.js` (7/7) = 31/31.
- Full suite (4 batches): **94 files, 1,375/1,375 passing** (up from 1,367 — net +8, matching the new tests added).
- Live preflight `A:rowcap` unchanged from every prior round: **25 Supabase read sites across 3 agents, 11 safely bounded, 0 truncating, 14 unbounded but on small tables.**
- Overall preflight: **3 BLOCK / 5 WARN / 0 ERROR / 26 pass**, `safe_to_run_paid_synthesis: false`. All three BLOCKs are the same pre-existing/unrelated ones from every prior round this session (`futures_odds_snapshots` Circa gap, `futures_import_manifest` untracked file, `contract.cutoff` time-based) — not investigated this round.

## Repository state

Worktree remains dirty (deliberately, since 2026-08-21). Only `agents/portfolio-preflight.js` and `tests/unit/portfolioPreflightScanner.test.js` were touched this round. No commits, no Supabase writes, no paid synthesis, no scraper invocations.

## Not touched / still standing

- VegasInsider ToS disposition — still awaiting Andy's decision. Standing restriction holds: no scraper invocations, dry-run included.
- The `futures_import_manifest` BLOCK (untracked `betonline-2026-09-09.json`) flagged in round 3 — still not investigated.
- The stale `bills_packers_exacta` id hardcoded in a handful of scripts — flagged to Andy, out of scope.
- Andy's Week 1 SuperContest CLV results and "5 picks of the week" — from the parallel Cowork session, not yet finalized.
