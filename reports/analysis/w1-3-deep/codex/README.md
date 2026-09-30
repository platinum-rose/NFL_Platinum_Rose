# Codex independent W1–3 re-grade

## Reproduce

From the repository root, run:

```powershell
node scripts/analysis/season-post-mortem/run.mjs --weeks 1-3
node scripts/analysis/season-post-mortem/simulate.mjs
npx.cmd vitest run tests/unit/seasonPostMortem.test.js
```

The grader reads only the placed-wagers ledger and local ESPN box-score captures. It does not modify a wager, ticket, payout, account, market source, or database.

## Outputs

- `legs_all.csv` — one independently re-graded row per ledger leg, including its evidence state and Team 1 comparison fields.
- `tickets_all.csv` — ticket-level rollup; round robins are evaluated at the individual-combination level.
- `regrade_legs.json` and `regrade_summary.json` — machine-readable inputs and audit totals.
- `alternative_baskets.json` — deterministic retrospective bootstrap of alternate basket shapes.

## Audit result — 2026-09-29

The local ledger has 101 tickets and 559 Week 1–3 legs. The independent grader settled 547 legs from the local NFL captures: 256 won, 291 lost, and one pushed. It intentionally left 11 unresolved: six CFB/open-slot entries without a supporting NFL box score and five players that could not be uniquely matched in the local capture.

There are zero terminal-result mismatches against the present ledger and zero against the Team 1 W1/W2/W3 published leg files. This validates the 14 corrections already recorded in the shared findings; it does not change the ledger. Two ledger legs are still marked `PENDING` despite independently resolving as losses. Team 1's baseline also retains seven `pending` W3 rows despite final results being present locally. These are stale-status issues, not newly applied settlement changes.

The bootstrap is descriptive only. It uses a fixed seed, de-duplicates repeated ticket legs to distinct positions, samples only resolved NFL legs, and rejects same-game pairs as an independence proxy. It excludes ROI because the ledger has incomplete/heterogeneous pricing and settlement details, and three weeks is insufficient for forward-looking probability claims.
