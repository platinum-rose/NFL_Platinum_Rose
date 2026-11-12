# Cross-Market Coherence - 2026-11-11

> Consensus context only. Actionable means eligible for deterministic coherence math, not approved or executable.
> Liquidity-warned/ineligible rows are excluded from the calculations. Settlement terms remain unverified.

Generated: 2026-11-11T23:00:53.071Z
Eligible-context contracts: 565 | Actionable coherence contracts: 305 | Context-only contracts: 260
Eligible-context teams: 32 | Actionable teams: 32 | Execution-eligible contracts: 0
Incoherent actionable teams: 1 | Ladder inversions: 1 | Nesting violations: 0
Source liquidity warnings: 3517 (79.39%)

## Required Caveats

- Gross yes-price probabilities drive coherence; fee-adjusted net odds remain preserved in the team-market map.
- Liquidity-warned rows can contribute to eligible-context counts but never to actionable coherence probabilities.
- Settlement terms are not locally verified, so this artifact is not an execution source.

## Actionable Coherence by Team (most incoherent first)

| Team | Eligible Context | Actionable | Max Div % | Softest | SB% | Conf% | Div% | Playoff% | Impl. Median Wins | Ladder Mono |
|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| PIT | 22 | 17 | 3 | win_total_9 | 2.5 | 11 | 30 | 72 | 11.1 | no |
| ARI | 20 | 9 | 0 |  | 1 | 1 |  |  | 6 | yes |
| ATL | 15 | 10 | 0 |  | 1 |  | 17 | 17 | 7.05 | yes |
| BAL | 17 | 9 | 0 |  | 1 |  |  | 16 | 8.14 | yes |
| BUF | 18 | 13 | 0 |  | 14.5 | 37.5 | 47 | 98 | 13.91 | yes |
| CAR | 18 | 9 | 0 |  | 1 |  | 26 | 26 | 7.41 | yes |
| CHI | 18 | 17 | 0 |  | 11 | 29 | 38 | 64.5 | 12.57 | yes |
| CIN | 17 | 10 | 0 |  | 6 | 31 | 59 |  | 12.64 | yes |
| CLE | 17 | 7 | 0 |  | 1 |  |  | 23 | 8.67 | yes |
| DAL | 17 | 9 | 0 |  | 1 |  |  | 30 | 8.58 | yes |
| DEN | 17 | 13 | 0 |  | 5 | 17 | 54 | 91 | 12.81 | yes |
| DET | 18 | 9 | 0 |  | 4.5 | 22 | 29 | 76 | 11.67 | yes |
| GB | 23 | 16 | 0 |  | 4 | 14 | 13 | 64 | 11.19 | yes |
| HOU | 18 | 10 | 0 |  | 2 | 7 |  | 41 | 9.29 | yes |
| IND | 16 | 6 | 0 |  |  |  |  | 1 | 5.28 | yes |
| JAX | 18 | 10 | 0 |  | 11.5 | 41 |  | 97 | 13.12 | yes |
| KC | 18 | 6 | 0 |  | 8.5 | 23 |  | 93 | 11.86 | yes |
| LAC | 16 | 11 | 0 |  |  |  | 1 | 1 | 3.33 | yes |
| LAR | 17 | 12 | 0 |  | 5 | 14 | 8 | 46 | 10.13 | yes |
| LV | 17 | 8 | 0 |  | 1 |  |  | 11 | 7.72 | yes |
| MIA | 17 | 7 | 0 |  | 1 |  |  | 2 | 3.36 | yes |
| MIN | 19 | 13 | 0 |  | 5 | 8 | 24.5 | 70 | 11.4 | yes |
| NE | 17 | 7 | 0 |  | 2 |  | 11 | 58 | 10.04 | yes |
| NO | 17 | 6 | 0 |  | 1 | 7 |  | 22 | 7.2 | yes |
| NYG | 18 | 9 | 0 |  | 1.5 |  | 19 | 65 | 9.45 | yes |
| NYJ | 14 | 4 | 0 |  |  |  |  | 1 |  | yes |
| PHI | 17 | 8 | 0 |  |  | 1 |  | 2 | 4.93 | yes |
| SEA | 22 | 13 | 0 |  | 3.5 | 17 | 9 | 50 | 10.46 | yes |
| SF | 19 | 12 | 0 |  | 14 | 39 | 80 | 97 | 13.64 | yes |
| TB | 17 | 7 | 0 |  | 1 |  |  | 38 | 7.78 | yes |
| TEN | 14 | 3 | 0 |  |  |  |  |  | 3.87 | yes |
| WAS | 17 | 5 | 0 |  | 1 |  |  | 11 | 6.5 | yes |

## Detected Actionable-Coherence Inconsistencies

### PIT - max divergence 3pp
- Ladder inversion: P(>=9) exceeds P(>=8) by 3pp

