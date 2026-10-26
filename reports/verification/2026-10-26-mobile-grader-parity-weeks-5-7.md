# Mobile grader parity: Weeks 5–7

**Status: blocked before re-grading.** This report records the attempted parity check and the coverage that is still needed. No wager ledger was edited.

## Scope and available evidence

- The real wager ledger contains 103 settled tickets in Weeks 5–7: Week 5 = 35, Week 6 = 37, Week 7 = 31.
- The saved `public/live-tracker-mobile-state.json` is Week 7 state with zero real tickets; after settlement, it contains no real-ticket per-leg grades to compare.
- Running `node scripts/generate-live-tracker-mobile.mjs --week 7` failed to fetch both ESPN scoreboards (Weeks 6 and 7). Because the current generator suppresses those fetch errors, it incorrectly exited zero and produced CHECK-only paper grades. Those generated artifacts were restored from the H2C2 snapshot and are not valid parity evidence.
- No historical Week 5 or Week 6 mobile state was found in the saved state file. The desktop tracker is present as a dirty shared-checkout artifact, but a reliable independent grading export has not yet been extracted from it.

## Findings

- **Confirmed mismatches:** none established; no independent re-grades completed.
- **Mismatches not ruled out:** all 103 settled real tickets across Weeks 5–7.
- **Ledger changes:** none.

## To complete

Retry when ESPN is reachable. Re-grade settled tickets without writing the ledger, compare each leg's computed result with its recorded `status` (and ticket outcome with `result`), then separately extract desktop tracker grades where present. Report exact ticket/leg mismatches and keep any CHECK or missing-source rows explicit.
