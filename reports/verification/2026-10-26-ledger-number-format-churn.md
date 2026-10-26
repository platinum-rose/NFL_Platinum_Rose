# Wager ledger number-format churn

**Scope:** identify the writer and propose one serialization format. The ledger and reconciliation artifacts were not changed.

## Finding

`docs/tracked-wagers/reconciliation-latest.md` identifies the 2026-10-26 03:30 PT reconciliation run. Its writer is `scripts/reconcile-settlement.mjs`; the `--apply` path writes `data/official-picks/user-placed-wagers-2026.json` with `JSON.stringify(reconciled, null, 2)`. JavaScript serializes integral numeric values without a decimal suffix, so values such as `-15.0` and `83.0` become `-15` and `83` even though their numeric values are unchanged.

The mobile settler, `scripts/settle_from_mobile_state.py`, writes with Python `json.dumps(..., indent=2, ensure_ascii=False)`. Python retains integral floats as `-15.0` and `83.0`, causing a later settlement run to restore the suffixes.

## Proposed single format

Use canonical JSON number formatting with no unnecessary fractional suffix (for example, `-15` and `83`) in both writers. Before adopting this, update the Python writer to serialize integral floats as integers, and add a serialization check proving both writers produce the same bytes for representative ledger data. Do not run either writer against the ledger as a formatting cleanup; Andy's per-action approval is still required for any ledger write.
