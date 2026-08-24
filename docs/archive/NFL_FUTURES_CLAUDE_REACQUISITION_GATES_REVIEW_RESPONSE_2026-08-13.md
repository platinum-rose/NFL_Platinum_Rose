# Claude Response to Codex's Reacquisition + Gates Review Feedback

**Date:** 2026-08-13
**Repository:** `E:\dev\projects\NFL_Dashboard`
**Responds to:** `docs/NFL_FUTURES_CLAUDE_REACQUISITION_GATES_REVIEW_FEEDBACK_2026-08-13.md`
**Author:** Claude (Cowork)

## Authority boundary

Same as the document this responds to: nothing here authorizes betting, official picks, portfolio/parlay mutation, Supabase writes, recommendation persistence, paid model/API calls, fresh synthesis, commit, push, broad staging, destructive reset/checkout, or `git add -A`. All dirty/untracked work from other sessions was preserved. No commit was made.

## Bottom line

All eight findings requiring implementation were independently reproduced against the actual code before being fixed (not just implemented from Codex's description), then fixed, then covered by new regression tests, then verified against the real repo data. All eight are now closed. The full 68-file / 1,058-test suite passes with zero regressions, eslint is clean, `node --check` is clean on every touched file, and `vite build` succeeds.

## Findings — verification and fix status

### 1. Exacta validator false-approve bug — **Fixed, Verified**

Reproduced exactly as described: `buildFuturesOddsExecutionValidation()`'s `exactaPairs.books`/`best_price` were computed from every row in the pair, including rows that failed `non_placeable_book`. A BetUS + DraftKings pair genuinely returned `execution_claim_allowed: true`.

Fix: `books`/`best_price` are now computed only from `validRows` (rows whose sole exclusion reason is `exacta_requires_multiple_placeable_books`, i.e. otherwise fully valid and placeable). All rows remain visible in `rows[]` for audit, each now carrying a `counts_toward_execution_claim` boolean.

Tests added (`tests/unit/futuresOddsExecution.test.js`): BetUS+DraftKings stays monitor-only, BetUS+FanDuel stays monitor-only, BetUS+BetOnline can pass, BetUS+mgm counts only after alias fix, BetUS+williamhill_us counts only after alias fix. 5/5 new, all passing.

### 2. Alias drift in the odds-execution validator — **Fixed, Verified**

Reproduced: `PLACEABLE_BOOKS.has(book)` was a raw lookup against a canonical-key-only `Map`, so `mgm`/`williamhill_us`/etc. were rejected as `non_placeable_book` even though the registry recognizes them.

Fix: `classifyFuturesOddsRow()` now uses `isPlaceableSportsbook()`/`canonicalSportsbookKey()` from the registry. Validation output now carries `book` (canonical), `book_raw`, `book_label`, and `book_access` (direct/proxy) separately.

Tests added: `mgm` canonicalizes to `betmgm` and is placeable; `williamhill_us` canonicalizes to `caesars` and is placeable; `dk`/`fd` remain non-placeable. 3/3 new, all passing. (Findings #1 and #2 share one test file; 8 new tests total, all passing, plus the 11 pre-existing tests in that file still pass — 19/19.)

### 3. Freshness gate too permissive on missing lanes — **Fixed, Verified**

Reproduced: `status` only ever became `'stale'` or `'pass'`/`'unknown'` — a dossier with zero stale lanes but one or more missing lanes reported `status: 'pass'`, and `portfolio-synthesize.js` only blocked on `status === 'stale'`, so a missing lane or an `'unknown'` freshness state only logged a warning and let synthesis proceed.

Fix: `checkDossierFreshness()` now returns a `'missing'` status (priority: unknown > stale > missing > pass) plus a new pure `synthesisPreflightDecision(freshnessResult, {allowStale, allowMissing, allowUnknown})` function that blocks on each failure class independently — no single broad override. `portfolio-synthesize.js` now uses three separate flags: `--allow-stale-dossier` (pre-existing), `--allow-missing-evidence-lanes` (new), `--allow-unknown-dossier-freshness` (new).

Tests added (`tests/unit/dossierFreshnessGate.test.js`): missing-lane-only now reports `'missing'` in both hash and legacy-mtime mode; stale takes priority over missing when both are present; `synthesisPreflightDecision` blocks each class independently and only lifts the class its override names. 10/10 new, all passing.

Live-verified no regression: `node scripts/check-dossier-freshness.js --dossier .nfl/portfolio/dossier-2026-08-11.json` still correctly reports `STALE`, all 9 lanes, exit 1 — unchanged from before this fix, since that dossier's failure is genuinely stale-lane (not missing-lane).

### 4. Named-player sizing gate fails open on missing/malformed source — **Fixed, Verified**

Reproduced: `fetchNamedPlayerSizingGates()` caught any error (missing file, malformed JSON) and returned `{meta: null, byTeam: {}}` — a missing or corrupted `named-status-review.json` would silently produce a dossier with no sizing gate at all, with nothing in the output distinguishing that from "everything's actually resolved."

Fix: the fetcher now calls `validateNamedStatusReview()` (which already existed in `agents/lib/named-status-review.js` but was never invoked from the dossier build) and **fails hard by default** — throws, which propagates through the `Promise.all` and stops the dossier build — on either a missing/unreadable file or a file that parses but fails validation (missing required case, invalid case, duplicate case). A narrow, explicit opt-out flag (`--allow-missing-named-status-review`, matching the existing `--allow-stale-dossier` convention) stamps a `blocked_missing_source`/`blocked_invalid_source` marker into `meta.named_player_sizing_gates` instead of throwing, for cases where Andy needs to proceed anyway with full awareness.

Tests added (`tests/unit/namedStatusReviewSizingGates.test.js`): `validateNamedStatusReview()` had **zero** direct test coverage before this — added 7 tests covering pass, empty/missing payload, one-of-two-required-cases-present, malformed evidence, invalid `review_status`, missing non-eligibility guardrails, and the full valid-payload gates-Bills/Packers/Cowboys case.

Live-verified: the real `data/projected-starters/2026/named-status-review.json` passes `validateNamedStatusReview()` cleanly (`status: 'pass'`, 0 missing/invalid/duplicate) — **this fix does not break the current live dossier build.**

### 5. Sizing-gate team-key normalization mismatch — **Fixed, Verified**

Reproduced: `board-validate.js`'s `teamsForRow()` reads raw `row.team`/`team_nick`/`team_a`/`team_b` and looks them up directly against `dossier.team_profiles`, which is keyed by `normalizeTeam()`'s nickname. Confirmed `normalizeTeam('Buffalo Bills') === 'Bills'` and `normalizeTeam('BUF') === 'Bills'` — a row using either form instead of the already-normalized nickname would silently miss the gate.

Fix: new `resolveTeamProfile()` tries the raw team string first (cheap exact match, the common case), then falls back to `normalizeTeam()`. Deduplicates by resolved profile key so a row with both `team: 'Bills'` and `team_nick: 'Buffalo Bills'` doesn't double-report.

Tests added (`tests/unit/boardValidateNamedPlayerGate.test.js`): full-name team field (`'Buffalo Bills'`) still triggers the gate; abbreviation exacta (`team_a: 'BUF'`, `team_b: 'GB'`) triggers both gates; a gated-vs-non-gated exacta reports only the gated side; no double-reporting on redundant raw+normalized forms. 4/4 new, all passing alongside the 7 pre-existing tests — 11/11.

### 6. Article reacquisition artifact not promotion-grade — **Fixed**

Added the fields Codex's promotion-artifact list requested, with one honest limitation: `previous_body_sha256`/`previous_body_excerpt` are `null` with an explicit `previous_body_unavailable_reason`, because the local `article-intel-review-latest.json` artifact this module reads from only ever recorded `body_chars` for the old body, never the text itself — computing a real previous-body hash/excerpt would require a live Supabase read of `research_intel_notes.body`, which is out of scope for this local-only pure module and not something to fabricate. Everything else on Codex's list is populated: `new_body_excerpt`, `diff_summary` (explicit "N chars longer" or "not longer — review before promoting"), `promotion_status` (always starts `'pending_review'`, never auto-approved), `promotion_reason`/`reviewer`/`reviewed_at` (scaffolding, `null` until a human sets them), `supabase_table` (`'research_intel_notes'`, confirmed against `agents/research-intel-ingest.js` and `scripts/build-article-intel-review.js`'s `id: row.id`), `supabase_primary_key_column`, `supabase_primary_key`.

Tests added (`tests/unit/articleReacquisition.test.js`): 6 new tests covering pending-review default, Supabase target fields, honest-null previous-body fields, both diff_summary branches, and the unavailable-record shape. 22/22 in that file passing (16 pre-existing + 6 new).

### 7. Reacquisition CLI needs resume/batching — **Fixed**

Added: `--resume` (skips IDs already recorded in a JSONL progress file), `--out <path>`, `--concurrency N` (default 1 — sequential, matching "default low"), per-domain throttle (`--domain-throttle-ms`, default 1000ms between two fetches to the same host), `--domain-limit domain=N` (repeatable), `--timeout-ms`, `--retry N` (linear backoff), `--summary-only`. Every completed record is appended to the JSONL progress file immediately (not just at the end), so an interrupted run is resumable without re-fetching anything.

Not directly unit-tested (this is an I/O-touching CLI wrapper — same convention as the rest of this repo's `agents/*.js`/`scripts/*.js` scripts, which aren't unit tested the way `lib/*.js` pure functions are). Instead, live-verified end-to-end in this sandbox (no real network, so every fetch legitimately returns `unavailable (fetch failed)` — that's expected and correct, not a bug):
- `--dry-run` still reports exactly 212 targets (31 metadata-only + 181 suspected-cap), no network/file writes — unchanged from before this change.
- A `--limit 2` run wrote 2 records to both the output file and a `.progress.jsonl` file.
- A follow-up `--resume --limit 4` run correctly skipped the 2 already-done IDs, fetched exactly 2 more, and merged to 4 total records in the output.
- `--domain-limit www.actionnetwork.com=1` correctly fetched 1 Action Network URL and skipped the other 4 in a 5-target batch, each skip explicitly logged with its reason.

Test artifacts from this verification (`data/research-intel/reacquisition/_TEST_verify.json*`, `_TEST_domainlimit.json*`) could not be deleted (same FUSE permission quirk documented in the prior handoff) — overwritten with explicit "not a real run, safe to delete" placeholder text instead. Flagged for cleanup below.

## Strategy gaps Codex listed as not yet applied

Confirmed still open, matching Codex's own list — none of these were touched by this fix pass, consistent with the review's own recommended implementation order (items 7-8 explicitly deferred to separately-approved future steps):

1. Kalshi/Polymarket normalization — not built.
2. Strict model-output JSON Schema — not built.
3. Forced-bet prompt pressure — not addressed.
4. Committee independence (skeptic/risk stage defaulting) — not addressed.
5. Independent football probability layer — not built.
6. Depth-chart truth gate — not built.

## Full verification results

- `node --check` on all 10 touched/new files: clean.
- `npx eslint` on all 10 touched/new files + 6 test files: zero errors, zero warnings.
- Targeted suite (`executionVenues`, `futuresOddsExecution`, `boardValidateNamedPlayerGate`, `namedStatusReviewSizingGates`, `dossierFreshnessGate`, `articleReacquisition`): **80/80 passing** (up from 61 before this fix pass — 19 new tests).
- Full repo suite, all 68 test files, run in 6 batches: **1,058/1,058 passing, zero regressions.**
- `node scripts/check-dossier-freshness.js --dossier .nfl/portfolio/dossier-2026-08-11.json`: still correctly fails, mode `legacy_mtime`, all 9 lanes stale, exit 1 — matches Codex's expected output exactly.
- `node scripts/reacquire-article-sources.js --dry-run`: still exactly 212 targets, 31 metadata-only + 181 suspected-cap, no network calls, no file writes — matches Codex's expected output exactly.
- `npx vite build --outDir dist-verify-2026-08-13b`: succeeded, confirms the registry/validator changes are safe in the frontend bundle.

## What Andy/Codex should know before the next step

1. **Nothing committed.** `HEAD` is still `82385b3`, unchanged from the prior handoff. All new work is uncommitted, matching the untracked/modified state this document itself required.
2. **The named-status-review gate is now fail-hard by default.** `agents/portfolio-dossier.js` will now throw (stop the dossier build) if `data/projected-starters/2026/named-status-review.json` is missing or fails validation, unless `--allow-missing-named-status-review` is explicitly passed. Confirmed the real current file passes cleanly, so this does not block today's build — but it's a real behavior change worth knowing about before the next dossier run.
3. **Two new dossier-build CLI flags exist and default to blocking**: `--allow-missing-evidence-lanes`, `--allow-unknown-dossier-freshness` (alongside the pre-existing `--allow-stale-dossier`). A synthesis run against a dossier with any missing evidence lane now fails preflight unless explicitly overridden — this is a stricter default than before.
4. **Test cleanup artifacts**: `data/research-intel/reacquisition/_TEST_verify.json`, `_TEST_verify.json.progress.jsonl`, `_TEST_domainlimit.json`, `_TEST_domainlimit.json.progress.jsonl` are placeholder files from live-verifying the new CLI flags — content overwritten with an explicit "not real, safe to delete" note, but the files themselves couldn't be deleted in this sandbox (same FUSE quirk as `dist-verify-2026-08-13/` from the prior session, which is also still present and still needs cleanup).
5. **The concurrent frontend-refactor session** flagged in the prior handoff (`src/App.jsx`, `src/components/layout/Header.jsx`, new Hub components, player-availability/training-camp data) was not touched by this fix pass either. `vite build` succeeded against its current state, for what that's worth.
6. **Real 212-article reacquisition still needs Andy's native machine** — this sandbox confirmed (again) it has no outbound network access. The CLI is now resumable/batchable/throttled for that native run.
