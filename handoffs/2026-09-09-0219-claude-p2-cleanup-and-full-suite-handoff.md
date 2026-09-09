# Codex review request — evidence-tier cap, scraper fixes, and P2 cleanup (2026-09-09, 0219 PDT)

## Context

Continuation of the same session covered in `handoffs/2026-09-09-0142-claude-evidence-tier-cap-and-scraper-fixes-handoff.md`. That handoff covered the evidence-tier-cap implementation and the VegasInsider scraper defect fixes. This document covers everything since: the remaining P2s (stale test fixture, vault_notes pagination hardening, preflight scanner window), which surfaced two real follow-on findings while being fixed, plus a full (not just focused) test-suite run. Nothing staged, committed, or pushed — worktree is still the same intentionally-dirty state since 2026-08-21.

## 0. Evidence-tier cap and scraper fixes (recap, no changes since last handoff)

See the 0142 handoff for full detail. Summary: `effectiveEvidenceTier()` added to `agents/lib/board-validate.js`, demotes Tier 1 to Tier 2 when `is_current_season: false`; `resolveEvidenceIds()` in `portfolio-synthesize.js` stamps that flag from each citation's parent container. `scripts/scrape-vegasinsider-futures.js` hour-truncation + team-name-normalization fixes applied. **Disclosure carried forward:** verifying the scraper fix required a `--dry-run` invocation that (unexpectedly) still issued a live fetch against vegasinsider.com — no DB write, but one more unauthorized hit on the disputed site while that question is on hold. No further scraper runs (dry-run included) until Andy resolves the source question.

## 1. Stale test fixture (`tests/unit/predictionMarketEvidenceCleanup.test.js` line 197) — fixed, and it was two bugs, not one

The flagged line asserted `map.meta.source_generated_at` against a hardcoded `'2026-08-22T20:44:38.351Z'` literal, built from reading the LIVE `data/prediction-markets/latest.json` — which gets overwritten by the real ingestion pipeline. That literal broke the moment the live file's timestamp advanced (it's now `2026-09-09T06:51:24.907Z`).

Fixing just the date surfaced a second, independent staleness bug in the same test: `map.meta.liquidity_warning_rate_pct` was asserted `>= 77%`, and that broke too — not from a regression, but because Andy has been staging fresher book captures this week (per `nfl_dashboard_pipeline_intel_map.md`), which legitimately drove live liquidity-warning coverage down to ~71.79%. A live, improving data file was never the right thing for a regression test asserting "this specific historical snapshot still shows >=77% warnings."

Real fix: pointed the test at the actual frozen, checked-in `data/prediction-markets/prediction-markets-2026-08-22.json` snapshot (confirmed identical `generated_at` to the original hardcoded literal) instead of the live, mutating `latest.json` — same pattern the `legacyCoherence` assertions in the same test already use for the 07-31 snapshot. Permanent fix, not deferring the same staleness bug forward again. All 3 tests in the file pass; eslint clean.

## 2. `vault_notes` pagination — offset → keyset, both call sites

Your review flagged the team-notes fetch in `loadVaultReferenceEvidence()` (added last session) as unsafe under concurrent writes: offset-based `.range(from, from+PAGE)` can repeat or skip rows if a row sorting earlier than the current page is inserted mid-pagination. Fixed by switching to keyset/cursor pagination on `path` (already the sort column, and a unique vault key) — each page asks for `path > <last row's path>` instead of a fixed numeric offset, immune to insertion-order drift.

Found the identical offset-`.range()` pattern in the sibling function `loadMasterReportEvidence()` (same table, same `.order('path')` convention) and converted it the same way for consistency, rather than leaving one fixed and one not.

**Implementation note, in case it matters for review:** both queries are written as a single chained expression — `.order('path', {ascending:true}).gt('path', cursor || '').limit(PAGE_SIZE)` — rather than conditionally appending `.gt()` in a separate statement (`if (cursor) query = query.gt(...)`). This is deliberate: `.gt('path', cursor || '')` is unconditionally safe (every real vault path is a non-empty string sorting after `''`), and it's also what let `agents/portfolio-preflight.js`'s rowcap scanner see the full pagination shape in one place (see §3 — a split-statement version defeated the scanner's per-statement scope and would have misreported both sites as unpaginated).

No dedicated unit test added — `portfolio-synthesize.js` runs a top-level IIFE on import and can't be safely imported by a test file (same limitation noted elsewhere in this codebase), and both functions require a live Supabase client. Verified via `node --check` + eslint only; not runtime-exercised against live Supabase this session.

## 3. Preflight rowcap scanner — window-sizing fix, and it surfaced two real findings

The flagged issue: the scanner's per-call-site scope was a flat 900 characters after each `.from(` match. A live scan of `SCANNED_SOURCES` found several real call sites whose actual pagination/limit clause sits well past that boundary — long multi-column `.select(...)` strings alone routinely run 200-600+ chars in this codebase (e.g. `fetchTeamStats()`'s 3 progressively-shorter column-list attempts). That risks a real, safely-bounded site misreporting as "unpaginated."

**First attempt was wrong, self-corrected:** initially widened the window to "next `.from()` call or 3000 chars, whichever first." Live-tested this and found it bleeds a LATER, unrelated statement's `.order()`/`.limit()` into the CURRENT site's classification — confirmed on `portfolio-synthesize.js`'s reference-docs query, which sits right before the (now keyset-paginated) team-notes query a few dozen lines later; the wider window made the docs query look "paginated" by picking up the sibling query's clauses, which is a false safe. Replaced with `findStatementEnd()`: tracks parenthesis depth from the `.from(` match forward and stops at the first `;` seen once depth returns to ≤0 — i.e. the actual semicolon closing that one statement, not a flat count or a bleed-prone landmark. Verified against every current call site in the three scanned files; none needed more than ~640 chars to reach their own real statement end.

Also added keyset-pagination recognition (`.order(col)` + `.limit(` + `.gt(`/`.gte(` on that same column, all within one statement) alongside the existing `.range()`/`fetchAllPaged` checks, since §2's fix would otherwise have introduced 2 new false BLOCKs of its own.

**Two real findings surfaced by the corrected scanner, not created by it:**
1. `agents/portfolio-synthesize.js:1301` (the reference-docs query, `.limit(docPaths.length)`) genuinely cannot be proven safe by this scanner — `boundedSmall` only recognizes a literal digit in `.limit(n)`, not an expression like `docPaths.length`, however provably small in practice (it's always 6, from the fixed `REFERENCE_DOC_FILES` map). This was already true before today's window fix; the window fix didn't create it, just correctly stopped incidentally hiding it via the earlier over-wide window. **Not fixed this session** — recognizing arbitrary bounded expressions safely would need either weakening the scanner's literal-only guarantee or real static analysis of the referenced identifier, both bigger changes than this pass. Flagging for a decision: accept as a documented, code-reviewed-safe false positive, or invest in extending the scanner.
2. `vault_notes` now shows **1,008+ rows** live — it's grown past the 1000-row PostgREST cap during this session's own timeframe (Andy's an active vault user). Combined with finding #1, this table now surfaces as a genuine (if low-severity, code-reviewed-safe) preflight BLOCK. Preflight's bottom-line summary is now **2 BLOCK** (was 1): the pre-existing `futures_odds_snapshots` gap, plus this newly-surfaced one.

## 4. Full test suite (not just the focused Stage-5 subset)

Ran all 91 files (`tests/unit/*.test.js`) in 4 batches (device-bridge time-limit constraint, not a test-runner limitation) rather than one invocation:

- Batch 1: 24 files, 403 tests — all pass
- Batch 2: 23 files, 318 tests — all pass
- Batch 3: 21 files, 293 tests — all pass
- Batch 4: 23 files, 308 tests — all pass

**91/91 files, 1,322/1,322 tests passing.** No regressions from any of this session's changes (evidence-tier cap, scraper fixes, fixture fix, pagination hardening, or scanner fix).

## 5. Current preflight status

**2 BLOCK · 8 WARN · 0 ERROR · 24 pass.**
1. `[A:database] futures_odds_snapshots` — pre-existing, unrelated to this session.
2. `[A:rowcap] vault_notes @ agents/portfolio-synthesize.js:1301` — newly surfaced this session, see §3 finding #1. Code-reviewed safe in practice (bounded to exactly 6 rows by `REFERENCE_DOC_FILES`), not provably safe to the scanner.

## 6. Files changed this session (cumulative, both handoffs)

- `agents/lib/board-validate.js` — `effectiveEvidenceTier()`
- `agents/portfolio-synthesize.js` — evidence staleness stamping, vault_notes keyset pagination (2 sites)
- `agents/portfolio-preflight.js` — rowcap scanner statement-boundary + keyset detection
- `scripts/scrape-vegasinsider-futures.js` — hour-truncation, team-name normalization
- `tests/unit/evidenceTierGate.test.js` — 7 new tests
- `tests/unit/predictionMarketEvidenceCleanup.test.js` — frozen-fixture fix

## 7. Recommended next steps

1. Your review of everything above, especially §3's scanner logic (statement-boundary parsing is exactly the kind of thing prior rounds have found edge cases in) and §2's pagination correctness.
2. Andy's call on §3 finding #1 (accept vs. extend the scanner) and the still-open VegasInsider source-disposition question from the prior handoff.
3. Once both are settled: this is otherwise clean for a full test/preflight-verified state.
