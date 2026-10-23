# Cross-Market Coherence - 2026-10-16

> Consensus context only. Actionable means eligible for deterministic coherence math, not approved or executable.
> Liquidity-warned/ineligible rows are excluded from the calculations. Settlement terms remain unverified.

Generated: 2026-10-16T22:00:59.992Z
Eligible-context contracts: 618 | Actionable coherence contracts: 296 | Context-only contracts: 322
Eligible-context teams: 32 | Actionable teams: 32 | Execution-eligible contracts: 0
Incoherent actionable teams: 1 | Ladder inversions: 1 | Nesting violations: 0
Source liquidity warnings: 3440 (77.63%)

## Required Caveats

- Gross yes-price probabilities drive coherence; fee-adjusted net odds remain preserved in the team-market map.
- Liquidity-warned rows can contribute to eligible-context counts but never to actionable coherence probabilities.
- Settlement terms are not locally verified, so this artifact is not an execution source.

## Actionable Coherence by Team (most incoherent first)

| Team | Eligible Context | Actionable | Max Div % | Softest | SB% | Conf% | Div% | Playoff% | Impl. Median Wins | Ladder Mono |
|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| HOU | 20 | 7 | 3 | win_total_12 |  |  | 16 | 34 | 8.71 | no |
| ARI | 18 | 8 | 0 |  | 1 | 1 |  | 1 | 4.74 | yes |
| ATL | 24 | 11 | 0 |  | 1 |  | 29 | 34 | 8.6 | yes |
| BAL | 19 | 6 | 0 |  | 8 |  |  | 85 | 12.18 | yes |
| BUF | 20 | 10 | 0 |  | 12 | 20 | 66 |  | 13 | yes |
| CAR | 20 | 8 | 0 |  | 1 |  | 38 | 48 | 8.58 | yes |
| CHI | 19 | 8 | 0 |  | 3 | 15 | 19 | 54 | 10.19 | yes |
| CIN | 19 | 4 | 0 |  | 4 |  |  | 66 | 10.71 | yes |
| CLE | 19 | 8 | 0 |  | 1 |  |  | 20 | 8 | yes |
| DAL | 19 | 9 | 0 |  | 3 | 5 | 43 | 50 | 9.25 | yes |
| DEN | 17 | 13 | 0 |  | 4 | 12 | 31 | 71 | 11.19 | yes |
| DET | 18 | 5 | 0 |  | 3 |  |  | 62 | 10 | yes |
| GB | 24 | 13 | 0 |  | 2 |  | 5 | 38 | 9.3 | yes |
| IND | 19 | 5 | 0 |  | 1 |  | 11 | 26 |  | yes |
| JAX | 20 | 6 | 0 |  | 7 |  | 74 | 85 | 12.15 | yes |
| KC | 20 | 11 | 0 |  | 10 | 40 | 63 | 91 | 12.38 | yes |
| LAC | 18 | 10 | 0 |  | 1 |  | 1 | 4 | 5.38 | yes |
| LAR | 18 | 8 | 0 |  | 11 | 31 |  | 72 | 11.32 | yes |
| LV | 19 | 12 | 0 |  | 1 | 6.5 | 6 | 30 | 8.52 | yes |
| MIA | 17 | 10 | 0 |  | 1 | 1 | 1 | 3 | 2.89 | yes |
| MIN | 19 | 14 | 0 |  | 4 | 7 | 29 | 79 | 11.73 | yes |
| NE | 20 | 10 | 0 |  | 3 | 12 | 29.5 | 72 | 10.89 | yes |
| NO | 20 | 9 | 0 |  | 1 | 1 | 16 | 21 | 7.19 | yes |
| NYG | 19 | 7 | 0 |  | 1 |  | 25 | 30 | 7.67 | yes |
| NYJ | 17 | 7 | 0 |  | 1 |  | 2 | 16 | 6.61 | yes |
| PHI | 19 | 14 | 0 |  | 1 | 3 | 26 | 27 | 8.06 | yes |
| PIT | 22 | 12 | 0 |  |  |  | 10 | 34 | 9 | yes |
| SEA | 17 | 10 | 0 |  | 6 | 19.5 | 13 | 57 | 10.31 | yes |
| SF | 24 | 17 | 0 |  | 13 | 33 | 71 | 94 | 12.96 | yes |
| TB | 20 | 8 | 0 |  | 1 |  | 15 | 17 | 6.44 | yes |
| TEN | 17 | 9 | 0 |  | 1 |  |  | 1 | 3.68 | yes |
| WAS | 17 | 7 | 0 |  | 1 | 1 | 10 | 14 | 6.63 | yes |

## Detected Actionable-Coherence Inconsistencies

### HOU - max divergence 3pp
- Ladder inversion: P(>=12) exceeds P(>=11) by 3pp

