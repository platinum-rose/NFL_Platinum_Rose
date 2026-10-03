# Codex Handoff — Fanatics Futures Reference Comparison

**Created:** 2026-09-22 14:05 PT  
**Branch:** `wip/yahoo-sync`  
**Workspace:** very dirty/shared; live Git state overrides this note.

## Completed (uncommitted, narrow scope)

- Captured Fanatics Markets futures in the local raw snapshot:
  `data/futures-imports/fanatics-markets-2026-09-22-availability-snapshot.json`.
  It contains all 32 Super Bowl, 32 Make Playoffs, 16 AFC champion, 16 NFC
  champion, and 24 quoted division-winner Yes/No rows. AFC East and AFC West
  division pages were present but price-less/disabled; they are explicitly
  recorded as unavailable. Regular-season wins were intentionally skipped.
- Added `scripts/build-fanatics-futures-comparison.mjs`: local-file-only
  normalization and reference comparison against same-day structured BetOnline
  sources. It parses Fanatics rendered Yes-contract cents, derives a *gross*
  return equivalent, and aligns market/team rows.
- Added `tests/unit/fanaticsFuturesComparison.test.js`.

## Safety / Meaning of the Output

The adapter is deliberately **reference only**. It does not call a best venue
or create a placement signal because the capture does not provide both a
current executable Fanatics ask and a current fee treatment. It always emits
`best_price_status: "not_computed"` and zero execution-eligible rows. Do not
relax that gate based on displayed percentages alone.

It reads only:

- `data/futures-imports/fanatics-markets-2026-09-22-availability-snapshot.json`
- `data/futures-imports/betonline-2026-09-22-live-futures-markets.json`
- `data/futures-imports/betonline-2026-09-22-super-bowl-live.json`

It writes, when run normally, `data/generated/fanatics-futures-comparison-latest.json`.
In this shared Codex session, the direct write received `EPERM`; its dry run
and unit test passed. Treat that as a local filesystem/process-lock issue to
recheck, not as evidence that the generator is broken.

## Verification

```text
node --check scripts/build-fanatics-futures-comparison.mjs     PASS
npx.cmd vitest run tests/unit/fanaticsFuturesComparison.test.js PASS (2 tests)
node ... run({dryRun:true})                                    PASS
```

Dry run result: 120 normalized Fanatics contracts, 119 rows aligned to the
same-day BetOnline board, 0 execution-eligible rows. The one unmatched row
should remain an explicit no-match unless verified against the current
BetOnline source; do not silently substitute another market.

## Next Safe Slice

1. Reconcile live Git status before any edit; preserve all unrelated dirty
   work and do not broad-stage, clean, reset, stash, or push.
2. Retry the generator output write only if the output path is no longer held
   by another process. Verify the resulting JSON's schema/counts.
3. If Andy wants actual venue shopping, capture Fanatics executable Yes asks,
   available size, and fee treatment first. Then extend the adapter with an
   explicit fee-aware net-payout conversion and tests. Do not infer fees.
4. BetUS currently has a same-day board manifest but not structured prices;
   Bookmaker's structured import is older. Add either only after a fresh,
   normalized source exists.

## Guardrails

- No betting/order/account interaction, sign-in, promotion use, portfolio or
  official-pick mutation, Supabase write, paid synthesis, broad staging, push,
  or destructive Git action without Andy's explicit current approval.
- `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` remains the active weekly
  workflow. Run `node scripts/weekly-synthesis-preflight.mjs` before any Week
  3 synthesis and stop on stale required sources unless Andy approves.

## Resume Prompt

```text
Resume the read-only Fanatics futures reference-comparison slice in
NFL_Dashboard on wip/yahoo-sync. Read HANDOFF.md, then
handoffs/2026-09-22-1405-codex-fanatics-futures-reference-comparison-handoff.md.
Run git status -sb, git branch --show-current, and git log -5 --oneline; live
Git beats handoff prose. The checkout is very dirty/shared: preserve unrelated
work; do not clean, reset, stash, broad-stage, or push.

Review the uncommitted narrow files only:
- data/futures-imports/fanatics-markets-2026-09-22-availability-snapshot.json
- scripts/build-fanatics-futures-comparison.mjs
- tests/unit/fanaticsFuturesComparison.test.js

The adapter is reference-only by design: percentage/cents are not executable
asks and no fee schedule is captured. Never output a best venue or placement
signal until an executable ask and fee-aware net payout are evidenced. First
retry its output write if safe, then validate schema/counts. No account, bet,
portfolio, official-pick, Supabase, paid synthesis, push, or destructive Git
action without Andy's explicit current approval.
```
