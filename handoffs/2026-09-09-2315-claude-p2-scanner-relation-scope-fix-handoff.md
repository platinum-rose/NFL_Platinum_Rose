# Codex round-6 P2 response — scanner: foreignTable scoping, last-write-wins limits, computed access, gate aggregation

**Date:** 2026-09-09 (~2245-2315 UTC)
**Scope:** `agents/portfolio-preflight.js`, `tests/unit/portfolioPreflightScanner.test.js`
**Disposition requested:** review for any remaining fail-open path; re-confirm P1 evidence-tier / doc-path / scraper work still sound (unaffected this round).

## Context

Codex's round-6 review requested changes on three new P2 findings. All three are fixed. No commits, no scraper invocations, no Supabase writes, no paid synthesis.

## Findings and fixes

### Finding 1 — "Relation-scoped and overridden bounds still pass" (lines 411-424)

Two independent bugs in the same area:

- **Relation scoping.** The Supabase client accepts a `{ foreignTable }` option on `.range()` and `.limit()` that scopes the call to an *embedded* relation — `.select('*, comments(*)').limit(5, { foreignTable: 'comments' })` bounds only the nested `comments` rows, doing nothing to bound the top-level query this call site actually reads. `chainHasRangeCall()`/`chainSmallLimitValue()` (renamed from the old `methodNames.includes('range')` check) previously read any `.range()`/`.limit()` in the chain as a real bound regardless of this option.
- **Last-write-wins.** Supabase mutates the *same* query-builder object on every chained call. When `.limit()` appears more than once in a chain (`.limit(500)...limit(2000)`), the **last** call actually invoked is what reaches PostgREST, overwriting whatever an earlier call set. `chainSmallLimitValue()` used `calls.find(...)`, which returns the *first* occurrence in chain order (closest to `.from()`) — so an early, safe-looking `.limit(500)` could report "bounded" while a later `.limit(2000)` silently overrode it at runtime.

**Fix:** added `isForeignTableScoped(call)`, checked by both a new `chainHasRangeCall()` and the rewritten `chainSmallLimitValue()`. `chainSmallLimitValue()` now walks the chain forward and keeps reassigning its result on every applicable (non-foreignTable-scoped) `.limit()` call, so the value it returns is whichever call was invoked *last* — the one that actually governs the request.

### Finding 2 — "Discovery and parse fallback are still incomplete" (lines 435-444)

`sb['from'](...)` (computed member access) — a real, if unusual, way to reach the same method — was invisible to `findAllFromCallSites()` entirely, since it required `!node.callee.computed`. A silent audit gap, not a false report.

**Fix:** accept either a plain `.from(...)` (non-computed `Identifier` property) or a computed access whose property is the string literal `'from'`. The `Buffer.from`/`Array.from` exclusion still applies regardless of call syntax (verified: `Buffer['from'](...)` is still excluded).

### Finding 3 — "Dynamic-table failures disappear from the gate result" (lines 795-798)

In `stageA()`'s `A:rowcap` check, a table whose size could not be determined — either a dynamically-named call site (`table === '(dynamic table)'`) or a *named* table whose `rowCount()` lookup itself failed (network hiccup, permissions) — got `sizes[t] = null`. A `null` size satisfied **neither** the old `truncating` filter (`>= 1000`, since `null ?? 0` is `0`) **nor** the `fine` filter (`sizes[x.table] !== null`): the site silently vanished from every reported bucket while still being subtracted out of `safeCount`. An unresolved size is exactly the case this gate exists for — we can't prove the read is safe.

**Fix:** split `risky` into `resolvable` (real table name) and `unresolved` (`(dynamic table)`). `resolvable` sites whose `rowCount()` lookup returns `null` now fall into `truncating` (treated as unsafe by default, not assumed small) with a distinct message; `unresolved` sites get their own `BLOCK` entries advising a literal table name or an explicit bound. The summary line now reports all four buckets (`safely bounded` / `truncating` / `with an unresolved table name` / `unbounded but on small tables`) instead of three, so nothing can vanish silently again.

## New tests

Added 6 tests to `tests/unit/portfolioPreflightScanner.test.js` (24 → 30 total, all passing):

- **#6a/#6b** — `.limit(n, { foreignTable })` / `.range(from, to, { foreignTable })` are not treated as top-level bounds.
- **#6c** — a `.limit()` overridden by a later, larger `.limit()` is correctly unsafe; overridden by a later, *smaller* `.limit()` is correctly safe (both directions of the last-write-wins fix).
- **#6d** — a foreignTable-scoped `.limit()` earlier in the chain does not mask a real, later top-level `.limit()`.
- **#6e** — `sb['from'](...)` is discovered like `sb.from(...)`.
- Regression check — `Buffer['from'](...)` (computed form) is still excluded.

No test file exercises `stageA()`/the gate aggregation itself (confirmed via search — `stageA` and the overall `main()`/BLOCK-WARN-PASS aggregation have zero prior coverage), so Finding 3's fix was verified live against the real preflight run instead (below); adding harness-level test coverage for `stageA()` is a reasonable follow-up but out of scope for this fix.

## Verification

- `node --check` on both changed files: clean.
- Ad hoc adversarial Node scripts (run before touching the test file) confirmed every fixture, including both directions of the last-write-wins case and the foreignTable exclusions for both `.range()` and `.limit()`.
- `node node_modules/eslint/bin/eslint.js agents/portfolio-preflight.js tests/unit/portfolioPreflightScanner.test.js`: clean.
- Focused suite: `portfolioPreflightScanner.test.js` — 30/30.
- Full suite (4 batches): **94 files, all passing** (one test in `dailyBriefPodcastPicks.test.js` flaked once on the first batch run and passed clean on an immediate re-run with no code changes in between — confirmed unrelated to anything touched this round).
- Live preflight `A:rowcap` unchanged in substance from every prior round: **25 Supabase read sites across 3 agents, 11 safely bounded, 0 truncating, 0 with an unresolved table name, 14 unbounded but on small tables** (the new "unresolved table name" bucket reports 0, as expected — this repo's real call sites don't use dynamic table names).
- Overall preflight: **3 BLOCK / 5 WARN / 0 ERROR / 26 pass** — unchanged, all three BLOCKs the same pre-existing/unrelated ones from every prior round (`futures_odds_snapshots` Circa gap, `futures_import_manifest` untracked file, `contract.cutoff` time-based).

## Repository state

Worktree remains dirty (deliberately, since 2026-08-21). Only `agents/portfolio-preflight.js` and `tests/unit/portfolioPreflightScanner.test.js` were touched this round. No commits, no Supabase writes, no paid synthesis, no scraper invocations.

## Not touched / still standing

- VegasInsider ToS disposition — still awaiting Andy's decision. Standing restriction holds: no scraper invocations, dry-run included.
- The `futures_import_manifest` BLOCK (untracked `betonline-2026-09-09.json`) flagged in round 3 — still not investigated.
- The stale `bills_packers_exacta` id hardcoded in a handful of scripts — flagged to Andy, out of scope.
- Andy's Week 1 SuperContest CLV results and "5 picks of the week" — from the parallel Cowork session, not yet finalized.
- `stageA()`/the overall gate aggregation has zero test coverage — a reasonable future improvement, not attempted this round since it wasn't what Finding 3 required.
