# Cross-Market Coherence - 2026-09-26

> Consensus context only. Actionable means eligible for deterministic coherence math, not approved or executable.
> Liquidity-warned/ineligible rows are excluded from the calculations. Settlement terms remain unverified.

Generated: 2026-09-26T20:37:25.368Z
Eligible-context contracts: 645 | Actionable coherence contracts: 349 | Context-only contracts: 296
Eligible-context teams: 32 | Actionable teams: 32 | Execution-eligible contracts: 0
Incoherent actionable teams: 1 | Ladder inversions: 1 | Nesting violations: 0
Source liquidity warnings: 3647 (76.51%)

## Required Caveats

- Gross yes-price probabilities drive coherence; fee-adjusted net odds remain preserved in the team-market map.
- Liquidity-warned rows can contribute to eligible-context counts but never to actionable coherence probabilities.
- Settlement terms are not locally verified, so this artifact is not an execution source.

## Actionable Coherence by Team (most incoherent first)

| Team | Eligible Context | Actionable | Max Div % | Softest | SB% | Conf% | Div% | Playoff% | Impl. Median Wins | Ladder Mono |
|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| GB | 19 | 14 | 2 | win_total_5 | 1.5 | 3 | 8 | 25 | 7.74 | no |
| ARI | 18 | 10 | 0 |  | 1 |  |  | 9 | 5.94 | yes |
| ATL | 19 | 12 | 0 |  | 1 | 2 | 16 | 25 | 7.05 | yes |
| BAL | 20 | 10 | 0 |  | 6.5 |  |  | 78 | 11.6 | yes |
| BUF | 19 | 11 | 0 |  | 13 |  |  | 90 | 13.24 | yes |
| CAR | 19 | 9 | 0 |  | 1 |  | 24 | 34 | 7.94 | yes |
| CHI | 20 | 11 | 0 |  | 2.5 | 7 | 26 | 40 | 9.63 | yes |
| CIN | 20 | 10 | 0 |  | 6 |  | 43 | 80 | 11.89 | yes |
| CLE | 17 | 13 | 0 |  | 1 |  | 2 | 11 | 6.44 | yes |
| DAL | 20 | 11 | 0 |  | 3.5 | 5 |  | 49 | 9.65 | yes |
| DEN | 25 | 8 | 0 |  | 3.5 |  | 27 | 59 | 10.37 | yes |
| DET | 20 | 10 | 0 |  | 3.5 | 7 | 35 | 65 | 11.06 | yes |
| HOU | 25 | 12 | 0 |  | 2.5 |  | 41 | 53 | 9.72 | yes |
| IND | 17 | 9 | 0 |  | 1 |  | 15 | 28 | 7.75 | yes |
| JAX | 17 | 10 | 0 |  | 3 |  | 43 | 60 | 10.18 | yes |
| KC | 24 | 11 | 0 |  | 8.5 |  | 59 | 83 | 11.87 | yes |
| LAC | 20 | 14 | 0 |  | 1.5 |  | 6 | 20 | 6.92 | yes |
| LAR | 29 | 11 | 0 |  | 12.5 | 19 | 28 | 73 | 11.67 | yes |
| LV | 20 | 10 | 0 |  | 1 |  | 10 | 32 | 8 | yes |
| MIA | 18 | 11 | 0 |  | 1 |  |  | 3 | 3.12 | yes |
| MIN | 20 | 14 | 0 |  | 3 | 7 | 36 | 63 | 10.67 | yes |
| NE | 20 | 12 | 0 |  | 4 |  |  | 63 | 9.93 | yes |
| NO | 20 | 12 | 0 |  | 1 |  | 42 | 53 | 9.56 | yes |
| NYG | 23 | 10 | 0 |  | 1 |  | 7 | 17 | 6.8 | yes |
| NYJ | 19 | 9 | 0 |  | 1 |  |  | 18 | 7.13 | yes |
| PHI | 25 | 12 | 0 |  | 5 | 11 |  | 78 | 11.47 | yes |
| PIT | 17 | 9 | 0 |  | 1 |  |  | 28 | 7.77 | yes |
| SEA | 20 | 17 | 0 |  | 9 | 14 | 36 | 77 | 12.25 | yes |
| SF | 20 | 13 | 0 |  | 8 | 16 |  | 77 | 12.07 | yes |
| TB | 19 | 8 | 0 |  | 1 |  | 22 | 27 | 7.5 | yes |
| TEN | 18 | 8 | 0 |  | 1 |  |  |  | 4.86 | yes |
| WAS | 18 | 8 | 0 |  | 1 | 1 |  |  | 6 | yes |

## Detected Actionable-Coherence Inconsistencies

### GB - max divergence 2pp
- Ladder inversion: P(>=5) exceeds P(>=4) by 2pp

