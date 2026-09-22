# Codex round-8 P2 response — scanner: computed relation-scope keys, last-write-wins head semantics, silent scan-error swallowing, diff-check whitespace

**Date:** 2026-09-10 (~0230-0257 UTC)
**Scope:** `agents/portfolio-preflight.js`, `tests/unit/portfolioPreflightScanner.test.js`
**Disposition requested:** review for any remaining fail-open path; re-confirm P1 evidence-tier / doc-path / scraper work still sound (unaffected this round).

## Context

Codex's round-8 review confirmed all four round-7 findings fixed as described, then requested changes on three new adjacent P2 findings plus one P3 diff-check issue, all still against the same handful of scanner functions. All four are fixed. No commits, no scraper invocations, no Supabase writes, no paid synthesis.

Andy asked directly whether this is legitimate hardening or chasing our tail before authorizing this round. Answer given and standing: legitimate — each round has found a genuinely different, real fail-open in the same small set of functions, not a repeat or a style nit (finding 4 aside). The honest caveat, also given to Andy: this scanner sits at the boundary of "what can a static AST check prove about an arbitrary JS object's runtime shape," and that surface (computed keys, duplicate keys, spreads, nested spreads, getters, proxies...) is open-ended — there is no round at which every possible adversarial JS construct is provably exhausted. Andy chose to continue into round 9 with this understood, not as an oversight.

## Findings and fixes

### Finding 1 — "Computed relation-option keys still bypass the fail-closed check" (line 454)

`isForeignTableScoped()`'s round-7 fix correctly failed closed on a `SpreadElement`, but a computed property (`{ [key]: 'comments' }`) is still an ordinary `Property` node — the underlying bug was in the shared `propertyKeyName()` helper, which never checked `property.computed` at all. For a computed key, it read the *variable name itself* (e.g. `"key"`) as if it were the literal property name, so it could never match `foreignTable`/`referencedTable` and silently passed as absent.

**Fix:** `propertyKeyName()` now checks `property.computed` first. A computed key resolves only when it is itself a literal (`{ ['referencedTable']: 'comments' }` → `'referencedTable'`); any other computed key (a variable, a member expression, anything non-literal) returns `null`, the same "unresolvable" signal the round-7 spread-handling already used. `isForeignTableScoped()`'s `.some()` was updated to explicitly fail closed (`return true`) when `propertyKeyName()` returns `null`, so an unresolvable key is now treated the same as a spread — cannot prove absence, so treat as scoped.

This fix is shared infrastructure: `propertyKeyName()` is also used by the pre-existing `applyFilters`-wrapper check (line ~330), where the same correction is strictly conservative in that check's own direction too (a computed key there now correctly fails to match `'applyFilters'` instead of possibly matching a coincidental variable name, which only makes that check *harder* to satisfy falsely, never easier).

### Finding 2 — "Duplicate or spread-overridden `head` options can still spoof count-only status" (line 417)

`chainHasHeadTrueOption()`'s round-7 fix correctly pinned the check to `arguments[1]`, but then asked "does ANY property in that object look like `{ head: true }`" — which ignores real JS semantics *within* the object literal. `{ head: true, head: false }` is valid modern JS (duplicate keys are allowed; the LAST one wins at runtime) and performs an ordinary GET. `{ head: true, ...runtimeOptions }` may do the same, since the spread comes after and could itself carry a `head` key.

**Fix:** replaced the `.some()` shape-check with `resolvesToHeadTrue()`, which walks the object's properties in source order and tracks the current known value of `head`. Encountering a spread, or a computed key that can't be resolved to a literal, resets the tracked value to "unknown" (not simply "false" — it genuinely could be either, so it must not be trusted as `true`) rather than leaving whatever was believed before it standing. Only the FINAL state after every property is walked can report count-only. This also means `{ ...runtimeOptions, head: true }` (spread FIRST, literal head SECOND) is correctly still recognized as count-only — the literal genuinely overrides the spread in that order, which is the case the fail-closed direction must not falsely reject.

### Finding 3 — "Source read or scanner exceptions still remove an entire file from the gate" (lines 918-919)

The `SCANNED_SOURCES` loop's `catch { /* file may not exist in a given checkout */ }` caught every failure identically — a genuinely absent file (the documented, legitimate case) and a permission error on a file that DOES exist, or an unexpected exception thrown by `scanCallSites()` itself (a scanner bug), which are not legitimate cases to skip silently. Either of the latter let `A:rowcap` report PASS/WARN without having actually scanned every declared source.

**Fix:** extracted the skip-vs-fail-closed decision into an exported, directly-testable `shouldSkipScanError(err)` (true only for a real `err.code === 'ENOENT'`). Any other error — including a falsy/undefined error value, defensively — now pushes one file-level `(dynamic table)` sentinel site with the actual error message, so the file surfaces a BLOCK instead of vanishing.

### Finding 4 — "The scoped test file fails `git diff --check`" (line 652, P3)

A trailing blank line at EOF from a prior append. Fixed; `git diff --check` on both changed files is now clean.

## New tests

Added 12 tests to `tests/unit/portfolioPreflightScanner.test.js` (41 → 53 total, all passing):

- **#8a (×2)** — a computed, non-literal relation-scope key (`{ [key]: 'comments' }`) fails closed on both `.limit()` and `.range()`.
- Regression check — a computed key that IS itself a literal string (`{ ['referencedTable']: 'comments' }`) is still correctly resolved and recognized as scoped.
- Regression check — an ordinary, fully-literal `.limit(500)` with no relation-scoping option is unaffected.
- **#8b (×2)** — `{ head: true, head: false }` and `{ head: true, ...runtimeOptions }` are NOT trusted as count-only.
- Regression check — `{ ...runtimeOptions, head: true }` (spread first, literal second) IS still correctly trusted as count-only.
- Regression check — an ordinary `{ count: 'exact', head: true }` (no duplicates, no spread) is still correctly recognized.
- **#8c** — a real `ENOENT` error is classified as skip-worthy by `shouldSkipScanError()`.
- Regression checks — an `EACCES` permission error, an exception with no `.code` at all (a bare `TypeError`, modeling a genuine scanner bug), and a falsy/undefined error value are all correctly NOT classified as skip-worthy.

## Verification

- `node --check` on the changed file: clean.
- `git diff --check` on both changed files: clean (Finding 4 resolved; confirms no new whitespace issues introduced this round).
- `node node_modules/eslint/bin/eslint.js agents/portfolio-preflight.js tests/unit/portfolioPreflightScanner.test.js`: clean.
- Focused suite: `portfolioPreflightScanner.test.js` — **53/53** (41 pre-existing + 12 new), single run, ~14s.
- Same no-network constraint as round 7: the full 95-file/1,397-test suite and the live Supabase-backed preflight run were **not** re-executed from this device-bridge shell. Per the established review protocol, both should be re-confirmed on Codex's round-9 pass.

## Repository state

Worktree remains dirty (deliberately, since 2026-08-21; also carries this session's unrelated bet-ledger updates in `data/futures-imports/andy-portfolio-ledger-2026.json`, untouched by this fix). Only `agents/portfolio-preflight.js` and `tests/unit/portfolioPreflightScanner.test.js` were touched for this round. No commits, no Supabase writes, no paid synthesis, no scraper invocations.

## Not touched / still standing

- Full 95-file suite and live preflight re-run — deferred to Codex's round-9 verification per this session's no-network constraint (see Verification above).
- VegasInsider ToS disposition — still awaiting Andy's decision.
- The `futures_import_manifest` BLOCK (untracked `betonline-2026-09-09.json`) flagged in round 3 — still not investigated.
- The stale `bills_packers_exacta` id hardcoded in a handful of scripts — flagged to Andy, out of scope.
- Open scope question (raised to Andy before this round, standing): this scanner's attack surface (arbitrary JS object construction) is open-ended for static analysis — no round closes the category, only the specific construct found. Andy chose to continue; worth revisiting an explicit stopping rule if round 9+ keeps surfacing new constructs rather than converging.
