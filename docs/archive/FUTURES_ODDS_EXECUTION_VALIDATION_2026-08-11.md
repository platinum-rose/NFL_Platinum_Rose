# Futures Odds Execution Validation - 2026-08-11

> Local validation only. This does not create official picks, write Supabase, call a model, or mutate portfolio state.

## Summary

- Rows checked: 799
- Execution-reference eligible rows: 543
- Context-only rows: 0
- Monitor-only exacta rows: 256
- Exacta pairs: 256
- Exacta execution-claim pairs allowed: 0

## Source Snapshots

| Source | Rows | Latest Snapshot | Execution-Reference | Monitor-Only Exacta | Context-Only |
|---|---:|---|---:|---:|---:|
| data/futures-imports/bookmaker-2026-08-10.json | 256 | 2026-08-10 | 256 | 0 | 0 |
| data/futures-imports/betus-2026-08-10.json | 416 | 2026-08-10 | 160 | 256 | 0 |
| data/futures-imports/betonline-2026-08-10.json | 127 | 2026-08-10 | 127 | 0 | 0 |

## Bills/Packers Exacta Gate

- Status: monitor_only_exacta
- Books: betus
- Placeable book count: 1
- Best local price: 6500
- Execution claim allowed: false

| Book | Selection | Price | Snapshot | Reasons |
|---|---|---:|---|---|
| betus | Buffalo Bills vs Green Bay Packers | 6500 | 2026-08-10T00:00:00Z | exacta_requires_multiple_placeable_books |

## Guardrails

- BKR, BetUS, and BetOnline rows need current local snapshot timestamps and numeric prices to be execution-reference eligible.
- Non-placeable books remain context-only.
- Super Bowl exacta rows require exact two-team parsing and at least two placeable books before any execution claim is allowed.
- Simulation-only exacta prices are never execution claims.
