# Handoff: Codex Review Fixes for Reacquisition + Gates Build (Claude, Cowork)

**Written:** 2026-08-13 (Pacific)
**Session:** Cowork/Claude, continuing directly from `2026-08-13-0244-claude-reacquisition-gates-build-handoff.md`
**Trigger:** Andy shared `docs/NFL_FUTURES_CLAUDE_REACQUISITION_GATES_REVIEW_FEEDBACK_2026-08-13.md` (Codex's review of the prior build) with the instruction "Refer to this document for Codex team's review of your changes."

## What this session did

Read Codex's review of the prior reacquisition/gates build, independently reproduced all 8 findings requiring implementation against the actual code (not just implemented from Codex's description), fixed all 8, added regression tests for each, and re-ran the full verification suite. Full detail and per-finding verification is in `docs/NFL_FUTURES_CLAUDE_REACQUISITION_GATES_REVIEW_RESPONSE_2026-08-13.md` (dropped alongside Codex's review doc, same as the prior incident-review response pattern).

## Current Git status and HEAD

`HEAD` = `82385b3` (unchanged from the 0244 handoff — nothing committed this session either). `git status` hung/timed out repeatedly in this sandbox (likely contention with the concurrent frontend-refactor session's own git/file activity) — did not force it. `git log --oneline -3` and `git diff --stat` against specific known-tracked files both worked and confirmed HEAD is unchanged and the diff scope matches what's listed below.

## Exact files changed this session

**Fixed (Codex review findings #1-#5, all with new regression tests):**
- `scripts/lib/futures-odds-execution.js` — findings #1 (exacta validator counted non-placeable rows toward `execution_claim_allowed`) and #2 (raw alias lookup like `mgm`/`williamhill_us` failed canonical-key `.has()` check). Now imports `canonicalSportsbookKey`/`isPlaceableSportsbook`/`sportsbookAccessType` from the registry; `exactaPairs.books`/`best_price` computed only from `validRows`; validation output carries `book`/`book_raw`/`book_label`/`book_access`.
- `tests/unit/futuresOddsExecution.test.js` — +8 tests (BetUS+DraftKings/FanDuel/BetOnline/mgm/williamhill_us exacta pairs, `mgm`/`williamhill_us`/`dk`/`fd` classification).
- `scripts/lib/dossier-freshness-gate.js` — finding #3 (missing lanes rolled up to `status: 'pass'`, `portfolio-synthesize.js` only blocked on `'stale'`). Added `'missing'` status (priority unknown > stale > missing > pass) and a new pure `synthesisPreflightDecision()` function with three independent override flags.
- `tests/unit/dossierFreshnessGate.test.js` — +10 tests.
- `scripts/check-dossier-freshness.js` — added a `status === 'missing'` message branch (exit-code logic already correctly blocked on non-pass).
- `agents/portfolio-synthesize.js` — replaced the single `status === 'stale'` preflight check with `synthesisPreflightDecision()` and three flags: `--allow-stale-dossier` (pre-existing), `--allow-missing-evidence-lanes` (new), `--allow-unknown-dossier-freshness` (new).
- `agents/lib/named-status-review.js` — no functional change (its `validateNamedStatusReview()` already existed and was correct — finding #4's gap was that nothing called it).
- `agents/portfolio-dossier.js` — finding #4 (`fetchNamedPlayerSizingGates()` caught any error and failed open to "no gate"). Now calls `validateNamedStatusReview()` and fails hard (throws) by default on a missing/unreadable/invalid `named-status-review.json`, unless a new `--allow-missing-named-status-review` flag is passed (in which case it stamps a `blocked_missing_source`/`blocked_invalid_source` marker instead).
- `tests/unit/namedStatusReviewSizingGates.test.js` — +7 tests for `validateNamedStatusReview()` (had zero direct coverage before).
- `agents/lib/board-validate.js` — finding #5 (`teamsForRow()` used raw team fields against nickname-keyed `team_profiles`, no normalization fallback). Added `resolveTeamProfile()` trying raw-then-`normalizeTeam()`-normalized keys, with de-dup.
- `tests/unit/boardValidateNamedPlayerGate.test.js` — +4 tests (full-name team field, abbreviation exacta, gated-vs-non-gated exacta, no double-reporting).

**Extended (Codex review findings #6-#7, lower severity, implemented anyway):**
- `scripts/lib/article-reacquisition.js` — finding #6 (reacquisition artifact not promotion-grade). Added `new_body_excerpt`, `diff_summary`, `promotion_status`/`promotion_reason`/`reviewer`/`reviewed_at` scaffolding, `supabase_table`/`supabase_primary_key_column`/`supabase_primary_key`. `previous_body_sha256`/`previous_body_excerpt` are honestly `null` with an explicit `previous_body_unavailable_reason` — the local review artifact never retained the old body text, only `body_chars`; getting the real previous body would need a live Supabase read, out of scope for this pure module.
- `tests/unit/articleReacquisition.test.js` — +6 tests.
- `scripts/reacquire-article-sources.js` — finding #7 (needs resume/batching before a full native run). Added `--resume` (JSONL progress file), `--out`, `--concurrency` (default 1), `--domain-throttle-ms`, `--domain-limit domain=N`, `--timeout-ms`, `--retry`, `--summary-only`. Not unit-tested (I/O CLI wrapper, matches repo convention) — live-verified instead (see below).

**New docs:**
- `docs/NFL_FUTURES_CLAUDE_REACQUISITION_GATES_REVIEW_RESPONSE_2026-08-13.md` — full per-finding verification/fix writeup, dropped alongside Codex's review doc.
- This handoff.

**ATLAS coordination file** (`E:\dev\ATLAS\.atlas-bridge\session-spool\broadcasts\latest.md`) was NOT updated again this session — the prior item-5 entry (from the 0244 handoff) already covers "reacquisition/gates build, uncommitted" and remains accurate; this session's changes are fixes to that same uncommitted work, not a new surface area other sessions need a fresh warning about.

## Verification performed

- `node --check` on all 10 touched/new `.js` files: clean.
- `npx eslint` on all 10 touched/new files + 6 test files: zero errors, zero warnings.
- Targeted new/changed test files: 80/80 passing (`executionVenues` 7, `futuresOddsExecution` 19, `boardValidateNamedPlayerGate` 11, `namedStatusReviewSizingGates` 12, `dossierFreshnessGate` 16, `articleReacquisition` 22 — some counts include pre-existing tests in the same file).
- Full repo suite, all 68 test files, 6 batches: **1,058/1,058 passing, zero regressions.**
- `node scripts/check-dossier-freshness.js --dossier .nfl/portfolio/dossier-2026-08-11.json`: still correctly STALE, all 9 lanes, exit 1 — unchanged, matches Codex's expected output.
- `node scripts/reacquire-article-sources.js --dry-run`: still exactly 212 targets (31 metadata-only + 181 suspected-cap), no network/file writes — unchanged, matches Codex's expected output.
- Live-verified the new CLI flags with real (network-less, so correctly `unavailable`) runs: `--limit 2` then `--resume --limit 4` correctly skipped the 2 done IDs and fetched 2 more (4 total); `--domain-limit www.actionnetwork.com=1` correctly fetched 1 and skipped 4 with explicit reasons logged.
- Live-verified the real `data/projected-starters/2026/named-status-review.json` passes `validateNamedStatusReview()` cleanly — the new fail-hard default does NOT break today's live dossier build.
- `npx vite build --outDir dist-verify-2026-08-13b`: succeeded (2,741+ modules, same pre-existing chunk-size warnings as before, unrelated to this session's changes).

## Unresolved blockers / cleanup items

1. **Nothing committed or pushed.** `HEAD` unchanged at `82385b3`.
2. **Test artifacts from finding #7's live verification** couldn't be deleted (FUSE permission quirk, same as every prior session): `data/research-intel/reacquisition/_TEST_verify.json`, `_TEST_verify.json.progress.jsonl`, `_TEST_domainlimit.json`, `_TEST_domainlimit.json.progress.jsonl` — overwritten with explicit "not a real run, safe to delete" placeholder text.
3. **`dist-verify-2026-08-13/`** (from the prior session) and now also **`dist-verify-2026-08-13b/`** (from this session) both remain on disk, undeletable in this sandbox. Both are build-verification-only, never referenced by the app.
4. **The concurrent frontend-refactor session** (App.jsx, Header.jsx, new Hub components, player-availability/training-camp data) — flagged in the prior handoff, not touched by this session either. `git status` hanging this session may be related to its ongoing activity; not confirmed.
5. Everything listed as "still open" in the 0244 handoff remains open: real 212-article native reacquisition run, Supabase promotion-path build-out, Kalshi/Polymarket normalization, McGovern/Parsons factual resolution (now enforced by two independent gates — sizing gate AND fail-hard source validation — but still not factually resolved).
6. **New behavior to be aware of before the next dossier/synthesis run**: `agents/portfolio-dossier.js` now fails hard if `named-status-review.json` is missing/invalid (opt out with `--allow-missing-named-status-review`), and `agents/portfolio-synthesize.js` now blocks on missing evidence lanes and unknown freshness by default, not just staleness (opt out with `--allow-missing-evidence-lanes` / `--allow-unknown-dossier-freshness`, each independent).

## Next steps

- Andy: review `docs/NFL_FUTURES_CLAUDE_REACQUISITION_GATES_REVIEW_RESPONSE_2026-08-13.md`, decide whether to commit (narrowly staged, per Codex's own commit guidance — this fix pass's files only, excluding UI modernization, dist-verify dirs, gmail/twitter intake, player-availability/training-camp, official-pick files).
- Codex (if reviewing again): the response doc's "What Andy/Codex should know before the next step" section lists the 6 things most likely to affect a next build/review pass, especially the two new fail-hard defaults.
- Whoever runs the next dossier build: the named-status-review fail-hard change and the freshness-gate stricter defaults are both new since the last dossier was built — first real run against them should be watched, not assumed silent-safe.

## Resume Prompt

```
Resume in E:\dev\projects\NFL_Dashboard. Read, in order:
1. docs/NFL_FUTURES_CLAUDE_REACQUISITION_GATES_REVIEW_FEEDBACK_2026-08-13.md (Codex's review)
2. docs/NFL_FUTURES_CLAUDE_REACQUISITION_GATES_REVIEW_RESPONSE_2026-08-13.md (this session's fixes + verification)
3. handoffs/2026-08-13-0409-claude-codex-review-fixes-handoff.md (this file)
4. handoffs/2026-08-13-0244-claude-reacquisition-gates-build-handoff.md (prior build handoff, for full context)
5. HANDOFF.md / HANDOFF_PROMPT.md (rolling state — re-read fresh, do not assume still accurate)

All 8 of Codex's review findings are fixed, tested, and verified (see the response doc for
per-finding detail). Nothing is committed. Before any further action:
- Re-run `git log --oneline -5` (git status may hang in this sandbox — do not force-retry it
  more than once or two more times before giving up and using git log/diff instead).
- Confirm HEAD is still 82385b3 (or note if it has moved and investigate why).
- Do not commit/push/stage without Andy's separate explicit approval.
- Do not touch the concurrent frontend-refactor session's files (App.jsx, Header.jsx, new Hub
  components, player-availability/training-camp data) without confirming with Andy first.
- Do not run a live synthesis, place bets, mark official picks, or write to Supabase.
```
