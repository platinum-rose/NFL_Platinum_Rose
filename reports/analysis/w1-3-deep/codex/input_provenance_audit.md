# C1 input-provenance audit

Generated from the committed local files by `node scripts/analysis/season-post-mortem/audit-input-provenance.mjs`. This audit is read-only: it does not alter the wagers ledger, C1 results, prices, or any account state.

## Decision

`legs_all.csv` remains the declared canonical **leg catalog**, but the current checkout cannot reproduce its 548 local-ESPN terminal grades or support a valid W1–3 pre-game proxy test. No forward-useable rule is promoted. Any partial result would be a **hypothesis** (and below the required 2 SE threshold).

The live checkout has 48 scheduled W1–3 games but 0 usable saved spread/total rows. It has 18 saved box captures: 16 in W1, 0 in W2, and 2 in W3. The C1 artifact, by contrast, claims 548 local-ESPN terminal grades.

## Coverage

### Scheduled games

| Week | 1 | 2 | 3 | Total |
| --- | ---: | ---: | ---: | ---: |
| Rows | 16 | 16 | 16 | 48 |
### Schedule rows with usable saved market fields

| Week | 1 | 2 | 3 | Total |
| --- | ---: | ---: | ---: | ---: |
| Rows | 0 | 0 | 0 | 0 |
### Saved ESPN box captures

| Week | 1 | 2 | 3 | Total |
| --- | ---: | ---: | ---: | ---: |
| Rows | 16 | 0 | 2 | 18 |
### C1 rows reproducibly supported by current week-matched boxes

| Week | 1 | 2 | 3 | Total |
| --- | ---: | ---: | ---: | ---: |
| Rows | 133 | 0 | 63 | 196 |
### C1 terminal rows lacking current week-matched support

| Week | 1 | 2 | 3 | Total |
| --- | ---: | ---: | ---: | ---: |
| Rows | 0 | 210 | 143 | 353 |
## Why pre-game H1/H2/H6 cannot be tested now

- H1 needs pre-kickoff spread/total plus a same-week team box score to test whether a proxy predicts 35+ pass attempts. The schedule contains zero usable saved markets, and W2 has no box capture.
- H2 needs the same pre-game implied team total for the ATD split. No W1–3 schedule row supplies it.
- H6 needs the saved favourite/dog designation for each player-prop team. A pickcenter market exists only for the 18 retained box files, not the full W1–3 population.

## Required recovery inputs

1. Restore the 30 missing Week 2–3 ESPN box-score captures (or a committed equivalent with game id, final, passing attempts, and player stats).
2. Restore a timestamped W1–3 ESPN spread/total capture for all 48 schedule games; do not substitute a fresh line for historical analysis.
3. Preserve a game identifier for C1 player rows that currently omit `game`, so the outcome and its pre-game market can be joined without name-only inference.

## Audit details

- C1 rows: 559; terminal results: 548; rows labelled `local_espn_boxscore`: 548.
- The C1 result counts are 256 WON + 291 LOST + 1 PUSH = 548 terminal rows; earlier 547-count prose is an arithmetic typo, not an additional unresolved leg.
- Supported rows use an exact same-week game match, or a player who occurs in exactly one retained same-week box. Unsupported rows are not regraded; they are merely reported.
- The test intentionally rejects a zero total as a market value; a pickcenter line with total 0/spread 0 is not a saved pre-game price.
