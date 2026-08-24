# NFL Futures Reacquisition + Gates Review Feedback for Claude

**Date:** 2026-08-13 Pacific  
**Repository:** `E:\dev\projects\NFL_Dashboard`  
**Audience:** Claude futures/evidence team  
**Scope:** Review of the uncommitted Claude-built article reacquisition workflow and three synthesis gates: execution-venue registry, named-player sizing gate, dossier freshness stamping, and article source reacquisition.

## Authority Boundary

This document is a review and implementation request only.

It does **not** authorize betting, official picks, portfolio or parlay mutation, Supabase writes, recommendation persistence, paid model/API calls, fresh synthesis, commit, push, broad staging, destructive reset/checkout, or `git add -A`.

Preserve all dirty/untracked work. The repo has concurrent workstreams in the working tree. Any commit must be separately approved and narrowly staged.

## Bottom Line

The Claude strategy is directionally strong and materially improves the futures synthesis safety layer:

- The article ingest cap root cause was correctly identified and raised.
- The 212-record reacquisition workflow is local-artifact-first and avoids Supabase writes.
- The execution-venue registry is the right abstraction.
- The named-player sizing gate is the right structural response to McGovern/Parsons uncertainty.
- The dossier freshness gate closes the stale-dossier reuse failure mode in principle.

However, several implementation gaps remain. The most important one is a validator bug that can falsely approve an exacta execution claim when only one of the two books is placeable.

## Findings Requiring Implementation

### 1. Exacta execution validator can falsely approve a two-book exacta with only one placeable book

**Severity:** High  
**Files:** `scripts/lib/futures-odds-execution.js`, `tests/unit/futuresOddsExecution.test.js`

Current behavior:

- `classifyFuturesOddsRow()` correctly marks non-placeable books as `non_placeable_book`.
- But `buildFuturesOddsExecutionValidation()` builds the exacta pair `books` set from **all exacta rows**, including rows whose validation failed for `non_placeable_book`.
- `execution_claim_allowed` then checks:
  - at least one valid placeable exacta row exists,
  - `books.length >= 2`,
  - price gate passes.

This means a BetUS + DraftKings exacta can be marked `execution_claim_allowed: true`, even though DraftKings is explicitly market-context-only.

Observed reproduction:

```js
const input = {
  sources: {
    x: [
      {
        book: 'betus',
        season: 2026,
        market_type: 'superbowl_matchup',
        selection: 'Buffalo Bills vs Green Bay Packers',
        price: 6500,
        snapshot_time: '2026-08-10T00:00:00Z',
      },
      {
        book: 'draftkings',
        season: 2026,
        market_type: 'superbowl_matchup',
        selection: 'Buffalo Bills vs Green Bay Packers',
        price: 6600,
        snapshot_time: '2026-08-10T00:00:00Z',
      },
    ],
  },
};
```

Expected:

- `placeable_book_count: 1`
- `books: ['betus']`
- `execution_claim_allowed: false`
- DraftKings row remains visible as context-only with `non_placeable_book`.

Recommended fix:

- Build a `validExactaRows` subset first:
  - row is exacta,
  - exact two-team parse passes,
  - current snapshot date,
  - correct season,
  - has numeric price,
  - canonical sportsbook key is placeable,
  - exclusion reason is only `exacta_requires_multiple_placeable_books`.
- Count books from that subset only.
- Compute `best_price` for execution claim from that subset only.
- Keep all rows in the visible audit output, but separate `rows` from `eligible_rows` or clearly mark non-placeable rows as non-counting.

Required tests:

- BetUS + DraftKings exacta remains monitor-only.
- BetUS + FanDuel exacta remains monitor-only.
- BetUS + BetOnline exacta can pass if price gate passes.
- BetUS + `mgm` or `williamhill_us` should count only after alias canonicalization is fixed.

### 2. Venue registry does not fully eliminate alias drift in the odds-execution validator

**Severity:** High  
**Files:** `src/lib/executionVenues.js`, `scripts/lib/futures-odds-execution.js`, `tests/unit/executionVenues.test.js`, `tests/unit/futuresOddsExecution.test.js`

The registry correctly defines aliases:

- `mgm` -> `betmgm`
- `williamhill`, `williamhill_us`, `william_hill` -> `caesars`
- `bkr` -> `bookmaker`

But `scripts/lib/futures-odds-execution.js` imports `PLACEABLE_SPORTSBOOK_LABELS`, which is a canonical-key-only `Map`, then checks `PLACEABLE_BOOKS.has(book)`. As a result, aliases such as `mgm` are still rejected as `non_placeable_book`.

Recommended fix:

- Import and use `canonicalSportsbookKey()` or `isPlaceableSportsbook()` from `src/lib/executionVenues.js`.
- Store both raw and canonical book keys in validation output:
  - `book_raw`
  - `book`
  - `book_label`
  - `book_access`
- Use canonical keys for exacta book counting and execution eligibility.

Required tests:

- `classifyFuturesOddsRow({ book: 'mgm', ... })` is placeable and canonicalizes to `betmgm`.
- `classifyFuturesOddsRow({ book: 'williamhill_us', ... })` is placeable and canonicalizes to `caesars`.
- `book_label` resolves to the canonical venue label.
- DraftKings/FanDuel aliases remain non-placeable.

### 3. Dossier freshness gate reports missing lanes but does not fail synthesis on them

**Severity:** Medium-High  
**Files:** `scripts/lib/dossier-freshness-gate.js`, `scripts/check-dossier-freshness.js`, `agents/portfolio-synthesize.js`, `tests/unit/dossierFreshnessGate.test.js`

Current behavior:

- `checkDossierFreshness()` records `missing_lanes`.
- But `status` is still `pass` when there are missing lanes and no stale lanes.
- `portfolio-synthesize.js` only blocks `status === 'stale'`.

For a standalone freshness report, reporting missing lanes separately is fine. For a synthesis preflight, this is too permissive. Missing evidence lanes can mean the dossier is not comparable to the current evidence contract.

Recommended fix:

- Distinguish report status from synthesis preflight status, or make missing lanes blocking by default.
- Suggested statuses:
  - `pass`
  - `stale`
  - `missing`
  - `unknown`
  - `blocked`
- In `portfolio-synthesize.js`, block on anything except `pass` unless an explicit override is provided.

Suggested override design:

- `--allow-stale-dossier` for stale lanes.
- `--allow-missing-evidence-lanes` for missing lanes.
- `--allow-unknown-dossier-freshness` for old/malformed dossiers.

Do not let one broad override silently cover all three failure classes.

Required tests:

- Hash-mode dossier with matching hashes but one missing current lane blocks synthesis preflight.
- Legacy mtime-mode dossier with missing current lane blocks synthesis preflight.
- Unknown dossier freshness blocks synthesis unless explicit override is set.

### 4. Named-player sizing gate fails open if its source file is missing or malformed

**Severity:** Medium-High  
**Files:** `agents/portfolio-dossier.js`, `agents/lib/named-status-review.js`, `tests/unit/namedStatusReviewSizingGates.test.js`

Current behavior:

- `fetchNamedPlayerSizingGates()` catches any read/parse error and returns `{ meta: null, byTeam: {} }`.
- That means if `data/projected-starters/2026/named-status-review.json` is missing or malformed, the dossier silently has no sizing gate.

That is dangerous for this specific lane because McGovern/Parsons are named, known, load-bearing unresolved cases. This should not behave like optional color/context.

Recommended fix:

- Run `validateNamedStatusReview()` inside `fetchNamedPlayerSizingGates()`.
- If required cases are missing or invalid, either:
  - fail the dossier build, or
  - stamp a blocking gate error into `meta.named_player_sizing_gates` and team profiles.

Preferred behavior:

- Dossier build should fail hard if required named-status cases are missing or invalid.
- If the team mapping itself fails for a case, preserve the case in `meta.named_player_sizing_gates.errors` and mark the dossier as not synthesis-ready.

Required tests:

- Missing named-status-review file blocks or stamps an explicit blocking error.
- Invalid required case blocks or stamps an explicit blocking error.
- Valid current McGovern/Parsons file gates Bills, Packers, and Cowboys as expected.

### 5. Named-player sizing enforcement depends on exact team-profile keys

**Severity:** Medium  
**Files:** `agents/lib/board-validate.js`, `agents/portfolio-dossier.js`, `src/lib/teams.js`

Current behavior:

- `portfolio-dossier.js` converts named-status team abbreviations to nicknames using `normalizeTeam()`, so gates are keyed by values like `Bills`, `Packers`, `Cowboys`.
- `board-validate.js` checks `profiles[team]?.named_player_sizing_gate` using raw row fields (`team`, `team_nick`, `team_a`, `team_b`) without normalizing.

This works for rows whose fields already use nickname keys. It can miss rows using full team names or abbreviations.

Recommended fix:

- Import `normalizeTeam()` into `board-validate.js`, or pass a lookup helper into the validator.
- For each row team field, try:
  - raw key,
  - normalized nickname,
  - maybe full-name alias if needed.

Required tests:

- Row with `team: 'Buffalo Bills'` and no `team_nick` still triggers Bills gate.
- Row with `team_a: 'BUF'` and `team_b: 'GB'` still triggers both gates.
- Exacta with one gated and one non-gated side reports only the gated side.

### 6. Article reacquisition artifact is recovery-grade but not promotion-grade

**Severity:** Medium  
**Files:** `scripts/lib/article-reacquisition.js`, `scripts/reacquire-article-sources.js`, future promotion script

Current behavior is good for initial recovery:

- Does not overwrite existing review artifacts.
- Marks inaccessible URLs as unavailable.
- Preserves URL/title/source/author/published timestamp.
- Records retrieval timestamp.
- Stores recovered body and SHA-256 hash.

But it is not yet enough for a safe Supabase promotion path:

- It does not include the old stored body or old body hash.
- It does not include an old-vs-new diff summary.
- It does not include the previous database row ID or Supabase table metadata beyond `id`.
- It does not distinguish "body recovered but not meaningfully improved" from "body recovered but equal/shorter".
- It does not include review disposition fields for promotion approval.

Recommended promotion artifact additions:

- `previous_body_sha256`
- `previous_body_excerpt` or `previous_body_sample`
- `new_body_excerpt`
- `diff_summary`
- `promotion_status: pending_review|approved|rejected`
- `promotion_reason`
- `reviewer`
- `reviewed_at`
- `supabase_table`
- `supabase_primary_key`

Keep Supabase write promotion as a separate, explicitly approved step.

### 7. Reacquisition CLI needs resume and batching before a full native 212-record run

**Severity:** Medium  
**Files:** `scripts/reacquire-article-sources.js`

The script is adequate for dry-run and small native probes. For a full 212-record native run, add efficiency and safety controls:

- `--resume` to skip already recovered IDs in the output file.
- `--out <path>` to avoid overwriting same-day runs.
- `--concurrency N`, default low.
- Per-domain throttle, especially for ESPN/PFF/NBC/Rotowire/VSiN.
- `--timeout-ms`.
- `--retry N`.
- `--domain-limit domain=N` for source-specific probes.
- `--summary-only` for quick audit.
- JSONL progress file so partial runs are salvageable if interrupted.

Recommended first native sequence:

```powershell
node scripts/reacquire-article-sources.js --dry-run
node scripts/reacquire-article-sources.js --limit 10 --out data/research-intel/reacquisition/article-reacquisition-2026-08-13-probe10.json
node scripts/reacquire-article-sources.js --resume --out data/research-intel/reacquisition/article-reacquisition-2026-08-13-full.json
```

Only run native live fetch with Andy approval.

## Strategy Gaps Not Yet Applied

These were identified in the incident review / Claude response / comparison chain and remain outside or incomplete after the current build:

1. **Kalshi/Polymarket normalization**
   - Still not built.
   - Needs bid, ask, fillable size, volume, fees, settlement terms, expiration, contract ID, timestamp, and equivalent sportsbook mapping.

2. **Strict model-output JSON Schema**
   - Current system still relies on prompt-level structure and downstream validation.
   - Need schema enforcement for required fields, enums, probability ranges, evidence IDs, price IDs, missing-data declarations, and unsupported claims.

3. **Forced-bet prompt pressure**
   - The old prompt pressure for broad recommendation counts remains a broader architecture risk.
   - Zero-play / reserve-only must be explicitly valid and non-penalized.

4. **Committee independence**
   - Skeptic/risk stages still default to the Stage 1 model unless configured separately.
   - This should be made visible in output and ideally blocked for any "independent committee" claim.

5. **Independent football probability layer**
   - Current simulation remains market-anchored.
   - Need market prior, independent football projection, and posterior scenario distribution as separate layers.

6. **Depth-chart truth gate**
   - Projected starters remain estimates.
   - Candidate-first depth-chart verification is still needed before anchor-sized football reasoning.

## Verification Requested After Fixes

Run focused tests:

```powershell
npx.cmd vitest run tests/unit/executionVenues.test.js tests/unit/futuresOddsExecution.test.js tests/unit/boardValidateNamedPlayerGate.test.js tests/unit/namedStatusReviewSizingGates.test.js tests/unit/dossierFreshnessGate.test.js tests/unit/articleReacquisition.test.js
```

Run syntax checks on touched/new files:

```powershell
node --check src/lib/executionVenues.js
node --check scripts/lib/futures-odds-execution.js
node --check scripts/lib/dossier-freshness-gate.js
node --check scripts/lib/article-reacquisition.js
node --check scripts/reacquire-article-sources.js
node --check scripts/check-dossier-freshness.js
node --check agents/lib/board-validate.js
node --check agents/lib/named-status-review.js
node --check agents/portfolio-dossier.js
node --check agents/portfolio-synthesize.js
```

Run the known freshness check:

```powershell
node scripts/check-dossier-freshness.js --dossier .nfl/portfolio/dossier-2026-08-11.json
```

Expected:

- It should fail.
- It should clearly report stale evidence lanes.
- Missing/unknown states should be blocking for synthesis preflight unless explicitly overridden.

Run reacquisition dry-run:

```powershell
node scripts/reacquire-article-sources.js --dry-run
```

Expected:

- `212` targets.
- `31 metadata-only + 181 suspected-cap`.
- No network calls.
- No file writes.

## Recommended Implementation Order

1. Fix exacta validator counting and alias canonicalization.
2. Add regression tests for non-placeable exacta rows not counting.
3. Tighten dossier freshness missing/unknown preflight behavior.
4. Make named-status review mandatory or explicitly blocking.
5. Normalize team keys in board validator before checking sizing gates.
6. Add reacquisition resume/output controls before the native full run.
7. Design the Supabase promotion path as a separate approved step.
8. Pick up Kalshi/Polymarket normalization separately.

## Commit Guidance

No commit is authorized by this document.

If Andy later approves a commit, stage narrowly. Do not include:

- UI modernization files.
- `dist-verify-2026-08-13/`.
- Gmail/Twitter intake artifacts unless explicitly approved.
- player-availability/training-camp refresh artifacts unless explicitly approved.
- official-pick proposal files unless explicitly approved.

The futures reacquisition/gates changes should be reviewable as their own isolated commit.
