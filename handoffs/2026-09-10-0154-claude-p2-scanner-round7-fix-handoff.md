# Codex round-7 P2 response — scanner: referencedTable scoping, select() argument position, parse-failure sentinel, gate-aggregation test coverage

**Date:** 2026-09-10 (~0130-0154 UTC)
**Scope:** `agents/portfolio-preflight.js`, `tests/unit/portfolioPreflightScanner.test.js`
**Disposition requested:** review for any remaining fail-open path; re-confirm P1 evidence-tier / doc-path / scraper work still sound (unaffected this round).

## Context

Codex's round-7 review requested changes on four new P2 findings, all against `agents/portfolio-preflight.js`. All four are fixed. No commits, no scraper invocations, no Supabase writes, no paid synthesis.

## Findings and fixes

### Finding 1 — "Relation-scoped bounds still pass through the preferred Supabase option" (line 424)

`isForeignTableScoped()` checked only the deprecated `foreignTable` property. The installed Supabase client also accepts — and prefers — `referencedTable` as the modern name for the same embedded-relation-scoping option. Codex independently reproduced `.limit(5, { referencedTable: 'comments' })` and `.range(0, 9, { referencedTable: 'comments' })` both incorrectly reporting `safe: true` — same failure mode round-6 closed for one name but not the other.

**Fix:** `isForeignTableScoped()` now checks a `RELATION_SCOPE_KEYS` set (`foreignTable` and `referencedTable`) against the options argument at the method's actual fixed position (`index 1` for `.limit()`, `index 2` for `.range()` — the only two methods that call this function). Also closes the broader gap Codex named ("fail closed when a dynamic/spread options argument cannot prove the bound is top-level"): if that argument is not a literal `ObjectExpression` at all (a variable, a spread call result, a ternary), or if a literal object contains a `SpreadElement` property, the call is now treated as relation-scoped by default — static analysis cannot prove either name is absent, so it no longer trusts the call as a safe top-level bound.

### Finding 2 — "`head: true` is not restricted to `.select()`'s actual options slot" (line 411)

`chainHasHeadTrueOption()` examined every object argument on a `.select()` call. Supabase only reads options off `select(columns, options)` — the second argument — so `sb.from('vault_notes').select('p', {}, { head: true })` performs a normal row-returning GET (the third argument is simply ignored by the client) while the scanner reported it as count-only.

**Fix:** require `c.arguments[1]` specifically, exactly as Codex asked.

### Finding 3 — "Parse-error fallback remains fail-open for dynamic and computed `.from()` calls" (line 531)

The parse-failure fallback only matched a literal `.from('table')` via regex. On `sb.from(tableVar)` or `sb['from']('vault_notes')`, the regex finds zero matches, so a file that fails to parse *and* uses either form contributed no site and no BLOCK at all — worse than the "treated conservatively" comment on that branch implied.

**Fix:** the parse-failure branch now unconditionally pushes one file-level `(dynamic table)` sentinel site (`line: 1`, `safe: false`) in addition to whatever the regex finds, so a file that fails to parse always surfaces at least one BLOCK regardless of which `.from()` call form it uses. The regex-matched literal sites are kept too, for extra line-level detail where they exist.

### Finding 4 — "The new gate-aggregation failure branches remain untested" (line 839)

The `A:rowcap` classification logic (bucket every scanned site into `truncating`/`unresolved`/`fine` given a table→rowCount map) lived inline inside the async `check('A:rowcap', 'scan', ...)` block, reachable only via a full live run against real Supabase tables — so nothing exercised either failure branch (an unresolved dynamic-table site, or a resolvable table whose `rowCount()` lookup itself returned `null`). Codex's live runs only ever walked the all-resolved, all-succeeded path.

**Fix:** extracted the pure classification logic into an exported `classifyRowcapSites(sites, sizes)`, called from the same spot inside the check with no behavior change to the live run. Now directly unit-testable with fixture data and no Supabase connection.

## New tests

Added 9 tests to `tests/unit/portfolioPreflightScanner.test.js` (32 → 41 total, all passing):

- **#7a/#7b** — `.limit(5, { referencedTable })` / `.range(0, 9, { referencedTable })` are not treated as top-level bounds.
- Sanity regression — an ordinary bounded `.limit(500)` with no relation-scoping option at all is unaffected.
- **fail-closed, dynamic options** — `.limit(5, opts)` (a variable) is treated as unsafe.
- **fail-closed, spread property** — `.range(0, 9, { ...extra })` is treated as unsafe.
- **#7c/#7d** — a file that fails to parse and uses `sb.from(tableVar)` or `sb['from']('vault_notes')` still surfaces the `(dynamic table)` sentinel, not zero sites.
- Regression check — a file that fails to parse but *does* contain a literal `.from('table')` still reports that table too, alongside the unconditional sentinel.
- **#7e/#7f** — `classifyRowcapSites()` BLOCKs an unresolved-table site with no size lookup attempted, and BLOCKs a resolvable table whose `rowCount()` returned `null`, each in isolation.
- Regression check — `classifyRowcapSites()` still correctly separates a small (`fine`) table from a large (`truncating`) one and a safe site.

## Verification

- `node --check` on the changed file: clean.
- `node node_modules/eslint/bin/eslint.js agents/portfolio-preflight.js tests/unit/portfolioPreflightScanner.test.js`: clean.
- Focused suite: `portfolioPreflightScanner.test.js` — **41/41** (32 pre-existing + 9 new), single run, ~33s.
- Confirmed via targeted search that `scanCallSites`/`classifyRowcapSites`/`isForeignTableScoped`/`chainHasHeadTrueOption` have no other importers in `tests/`, `scripts/`, or `agents/` beyond `agents/portfolio-preflight.js` itself and its own test file — this round's changes have no other blast radius to check.
- Full 95-file/1,386-test suite and the live preflight run were **not** re-executed this round: the device-bridge shell used for this fix has no outbound network access (a previously-documented constraint), so a live Supabase-backed run isn't possible from here. Per the established review protocol, the full suite and live preflight numbers should be re-confirmed on Codex's round-8 pass, same as every prior round's live-run step.

## Repository state

Worktree remains dirty (deliberately, since 2026-08-21; also carries this session's unrelated bet-ledger updates in `data/futures-imports/andy-portfolio-ledger-2026.json`, untouched by this fix). Only `agents/portfolio-preflight.js` and `tests/unit/portfolioPreflightScanner.test.js` were touched for this round. No commits, no Supabase writes, no paid synthesis, no scraper invocations.

## Not touched / still standing

- Full 95-file suite and live preflight re-run — deferred to Codex's round-8 verification per this session's no-network constraint (see Verification above).
- VegasInsider ToS disposition — still awaiting Andy's decision.
- The `futures_import_manifest` BLOCK (untracked `betonline-2026-09-09.json`) flagged in round 3 — still not investigated.
- The stale `bills_packers_exacta` id hardcoded in a handful of scripts — flagged to Andy, out of scope.
