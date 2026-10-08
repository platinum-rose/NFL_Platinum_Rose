# Futures Odds Intake Manifest — 2026-10-07

All files that were in `docs/Futures_Odds/` at intake have been classified,
normalized into local evidence JSON, and moved into the matching
`docs/Futures_Odds/_processed/` dated folder. No Supabase write, wager,
portfolio, or official-pick mutation was performed.

## Validation

- Root intake files remaining: `0`
- Futures source files normalized: `42`
- Normalized local records: `1,871`
- Rows missing required provenance or market fields: `0`
- One source was classified as non-futures: the 2026-09-22 Circa Week 3 teaser
  bet slip. It is archived at `_processed/Circa_2026-09-22/non_futures/` and
  intentionally produced no futures row.

## Local Evidence Outputs

| Capture date | Book/source | Source files | Records | Local JSON |
|---|---:|---:|---:|---|
| 2026-09-22 | Fanatics probability market | 2 | 32 | `data/futures-imports/fanatics-2026-09-22.json` |
| 2026-09-22 | Circa | 5 | 42 | `data/futures-imports/circa-2026-09-22.json` |
| 2026-09-23 | Circa | 1 | 8 | `data/futures-imports/circa-2026-09-23.json` |
| 2026-09-23 | Unattributed screenshot evidence | 3 | 24 | `data/futures-imports/unattributed-2026-09-23.json` |
| 2026-09-29 | BetUS text export | 1 | 408 | `data/futures-imports/betus-2026-09-29.json` |
| 2026-09-29 | Boyd Sports | 2 | 17 | `data/futures-imports/boyd-2026-09-29.json` |
| 2026-09-29 | Unattributed screenshot evidence | 1 | 9 | `data/futures-imports/unattributed-2026-09-29.json` |
| 2026-10-02 | BetOnline | 4 | 96 | `data/futures-imports/betonline-2026-10-02.json` |
| 2026-10-02 | BetUS text export | 1 | 160 | `data/futures-imports/betus-2026-10-02.json` |
| 2026-10-02 | Bookmaker text export | 1 | 127 | `data/futures-imports/bookmaker-2026-10-02.json` |
| 2026-10-07 | BetOnline | 19 | 408 | `data/futures-imports/betonline-2026-10-07.json` |
| 2026-10-07 | BetUS text export | 1 | 382 | `data/futures-imports/betus-2026-10-07.json` |
| 2026-10-07 | Bookmaker text export | 1 | 158 | `data/futures-imports/bookmaker-2026-10-07.json` |

## Interpretation Boundaries

- A capture is dated from its filename when available; otherwise the original
  local file capture timestamp is recorded in the source manifest.
- Fanatics values are preserved as displayed probabilities, not converted into
  executable American odds.
- The older mobile screenshots without a visible book identity remain labeled
  `unattributed`; this avoids falsely assigning their prices to Circa or any
  other book.
- These are evidence snapshots only. They are not executable quotes and do not
  constitute a betting recommendation or a placed position.
