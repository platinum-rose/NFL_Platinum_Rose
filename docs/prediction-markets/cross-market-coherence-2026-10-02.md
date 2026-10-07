# Cross-Market Coherence - 2026-10-02

> Consensus context only. Actionable means eligible for deterministic coherence math, not approved or executable.
> Liquidity-warned/ineligible rows are excluded from the calculations. Settlement terms remain unverified.

Generated: 2026-10-02T18:15:10.747Z
Eligible-context contracts: 645 | Actionable coherence contracts: 387 | Context-only contracts: 258
Eligible-context teams: 32 | Actionable teams: 32 | Execution-eligible contracts: 0
Incoherent actionable teams: 1 | Ladder inversions: 1 | Nesting violations: 0
Source liquidity warnings: 4001 (78.61%)

## Required Caveats

- Gross yes-price probabilities drive coherence; fee-adjusted net odds remain preserved in the team-market map.
- Liquidity-warned rows can contribute to eligible-context counts but never to actionable coherence probabilities.
- Settlement terms are not locally verified, so this artifact is not an execution source.

## Actionable Coherence by Team (most incoherent first)

| Team | Eligible Context | Actionable | Max Div % | Softest | SB% | Conf% | Div% | Playoff% | Impl. Median Wins | Ladder Mono |
|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| PIT | 25 | 18 | 2 | win_total_12 |  | 2 | 7.5 | 26 | 7.8 | no |
| ARI | 18 | 9 | 0 |  | 1 |  |  | 5 | 6 | yes |
| ATL | 19 | 7 | 0 |  | 1 | 3 | 21 | 26 | 7.2 | yes |
| BAL | 21 | 14 | 0 |  | 8 | 14.5 | 55 | 81 | 12 | yes |
| BUF | 20 | 12 | 0 |  | 14 | 22.5 |  | 93 | 13 | yes |
| CAR | 18 | 9 | 0 |  | 1 |  |  | 26 | 7.07 | yes |
| CHI | 19 | 11 | 0 |  | 4 |  | 23 | 53 | 9.8 | yes |
| CIN | 21 | 13 | 0 |  | 4 | 9 | 34 | 74 | 11.27 | yes |
| CLE | 24 | 21 | 0 |  | 1 | 2 | 6 | 28 | 7.83 | yes |
| DAL | 20 | 12 | 0 |  | 4 |  | 28 | 45 | 9.33 | yes |
| DEN | 21 | 15 | 0 |  | 4 | 9 | 29 | 66 | 10.75 | yes |
| DET | 19 | 9 | 0 |  | 4 | 7 | 35 | 69 | 11.44 | yes |
| GB | 19 | 13 | 0 |  | 1 |  | 7 | 29 | 8.47 | yes |
| HOU | 21 | 14 | 0 |  | 2 | 3 | 22 | 38 | 8.93 | yes |
| IND | 25 | 13 | 0 |  | 1 | 1 | 21 | 37 | 8.75 | yes |
| JAX | 20 | 14 | 0 |  | 4 | 10 | 54.5 | 71 | 10.77 | yes |
| KC | 20 | 13 | 0 |  | 9 | 14 | 55.5 | 84 | 11.88 | yes |
| LAC | 21 | 14 | 0 |  | 1 | 2 | 3 | 16 | 6.77 | yes |
| LAR | 19 | 9 | 0 |  | 12 | 18 | 26 | 70 | 11.13 | yes |
| LV | 21 | 14 | 0 |  | 1 | 2.5 | 13.5 | 37 | 8.63 | yes |
| MIA | 18 | 10 | 0 |  | 1 |  |  | 3 | 3.22 | yes |
| MIN | 18 | 11 | 0 |  | 3 |  | 40 | 72 | 11.19 | yes |
| NE | 20 | 12 | 0 |  | 2 | 4 | 16 | 42 | 9.25 | yes |
| NO | 18 | 7 | 0 |  | 1 |  |  | 48 | 8.83 | yes |
| NYG | 20 | 14 | 0 |  | 1 |  | 10 | 19 | 7.14 | yes |
| NYJ | 20 | 10 | 0 |  | 1 | 1 |  | 16 | 6.94 | yes |
| PHI | 20 | 14 | 0 |  | 3 | 9 | 52 | 62 | 10.71 | yes |
| SEA | 24 | 14 | 0 |  | 8 | 13 | 32 | 75 | 11.25 | yes |
| SF | 18 | 9 | 0 |  | 9 |  | 44 | 79 | 11.93 | yes |
| TB | 19 | 10 | 0 |  | 1 |  |  | 15 | 6.23 | yes |
| TEN | 20 | 11 | 0 |  | 1 | 1 | 1 | 3 | 4.36 | yes |
| WAS | 19 | 11 | 0 |  | 1 |  | 9.5 | 19 | 7.7 | yes |

## Detected Actionable-Coherence Inconsistencies

### PIT - max divergence 2pp
- Ladder inversion: P(>=12) exceeds P(>=11) by 2pp

