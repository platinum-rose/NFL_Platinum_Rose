# Hedge Watch model calibration

## Source and sample

Source: `data/vault-seed/nflverse/games.csv`. It contains 93 completed regular-season games, all from 2026 Weeks 1–7; it is not a multi-season history. Residuals were calculated as home margin minus `spread_line` and game total minus `total_line`.

| Measure | Empirical value |
|---|---:|
| Margin residual mean | −1.5323 points |
| Margin residual SD | 11.8038 points |
| Total residual mean | +1.1344 points |
| Total residual SD | 13.0374 points |
| Margin/total residual correlation | −0.0337 |
| Observed absolute margin 3 | 16/93 (17.20%); 5.80 expected under the fitted smooth margin distribution; weight 2.761 |
| Observed absolute margin 7 | 11/93 (11.83%); 5.14 expected under the fitted smooth margin distribution; weight 2.140 |

## Change

`scripts/lib/hedge-alerts.mjs` now uses those residual means and standard deviations, the measured margin/total correlation in a bivariate-normal copula, and observed-versus-expected key-number weights at 3 and 7. `scenarioGrid()` retains its existing API and still normalizes the legal-score grid.

## Verification and limits

- `node node_modules/vitest/dist/cli.js run tests/unit/hedgeAlerts.test.js`: 7 passed.
- `node scripts/hedge-alerts-replay.mjs`: PASS; the flex still recommends SEA −3, the SEA 8+/Under dead cell remains, and the cover wins at 20–3.
- This is a small, season-in-progress sample. Treat the fitted parameters as provisional engineering calibration; refresh from a multi-season closing-line sample before treating the probabilities as stable.
