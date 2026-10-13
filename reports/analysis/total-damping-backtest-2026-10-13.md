# Total-damping backtest (read-only) — 2026-10-13

Sample: 895 regular-season games, 2022-2025, with >=3 prior same-season games per team (trailing mean of last <=5). Target y = actual total - closing total_line.
Baseline residual: mean 1.05, SD 12.97; standard error of the mean 0.43. Features: sum over both teams of standardized trailing values; positive = more scoring expected. Per +1 SD of the game-level sum the units are points of total.

## Univariate (y ~ 1 + feature)

| Feature | coef (pts/unit) | SE | t | 2022 | 2023 | 2024 | 2025 | sign stable? |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| def_epa_allowed | -0.552 | 0.303 | -1.82 | -0.796 | -1.185 | -0.883 | 0.327 | no |
| off_epa | 0.051 | 0.306 | 0.17 | 0.137 | -0.064 | -0.170 | 0.147 | no |
| pace | 0.248 | 0.304 | 0.82 | -0.055 | 0.938 | 0.069 | 0.398 | no |
| sack_rate | -0.064 | 0.305 | -0.21 | 0.552 | -1.003 | -0.542 | 0.662 | no |
| qb_hit_rate | 0.037 | 0.300 | 0.12 | 0.613 | -0.601 | -0.659 | 0.698 | no |
| takeaways | -0.343 | 0.296 | -1.16 | -1.505 | -0.040 | -0.115 | -0.082 | yes |
| points_for | 0.230 | 0.307 | 0.75 | 0.401 | 0.121 | 0.045 | 0.204 | yes |
| points_against | -0.516 | 0.299 | -1.73 | -0.247 | -1.035 | -0.573 | -0.440 | yes |
| dome | 1.346 | 0.925 | 1.45 | 2.785 | 1.353 | 0.660 | 0.500 | yes |
| wind15 | -2.553 | 1.775 | -1.44 | 0.606 | -6.103 | -2.357 | -2.717 | no |

Bonferroni-style bar for 10 tests: |t| >= 2.7 AND same sign in every season. Passing: none.

## Leave-one-season-out (train 3 seasons, score the 4th; MSE of the total residual, lower is better)

| Model | MSE market-only (predict 0) | MSE intercept-only | MSE model | vs market-only |
|---|---:|---:|---:|---:|
| defense (def_epa_allowed + sack_rate + takeaways) | 169.30 | 168.61 | 169.64 | 0.20% |
| defense + pace | 169.30 | 168.61 | 169.75 | 0.27% |
| efficiency + pace (def_epa_allowed, off_epa, pace) | 169.30 | 168.61 | 168.65 | -0.38% |
| pace only | 169.30 | 168.61 | 168.76 | -0.32% |

## Reading this

- A feature is only worth adding to the total if it passes the univariate bar AND improves out-of-sample MSE over BOTH the market-only and intercept-only baselines. Anything less is noise at this sample size.
- Features are built from nflverse box-score aggregates (EPA per play, sack rate, takeaways, plays per game). The live model uses FTN metrics for which no history exists here; this test says whether the *kind* of signal is real, not whether the FTN versions are.
- Closing lines already price defense and pace; a null result means the market total is efficient with respect to these features, not that defense is irrelevant.
