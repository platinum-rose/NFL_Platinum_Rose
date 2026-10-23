# Cross-Market Coherence - 2026-10-21

> Consensus context only. Actionable means eligible for deterministic coherence math, not approved or executable.
> Liquidity-warned/ineligible rows are excluded from the calculations. Settlement terms remain unverified.

Generated: 2026-10-21T22:00:56.259Z
Eligible-context contracts: 622 | Actionable coherence contracts: 341 | Context-only contracts: 281
Eligible-context teams: 32 | Actionable teams: 32 | Execution-eligible contracts: 0
Incoherent actionable teams: 3 | Ladder inversions: 2 | Nesting violations: 1
Source liquidity warnings: 3617 (83.48%)

## Required Caveats

- Gross yes-price probabilities drive coherence; fee-adjusted net odds remain preserved in the team-market map.
- Liquidity-warned rows can contribute to eligible-context counts but never to actionable coherence probabilities.
- Settlement terms are not locally verified, so this artifact is not an execution source.

## Actionable Coherence by Team (most incoherent first)

| Team | Eligible Context | Actionable | Max Div % | Softest | SB% | Conf% | Div% | Playoff% | Impl. Median Wins | Ladder Mono |
|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| SF | 18 | 14 | 9 | win_total_16 | 17 | 29 | 30 | 98 | 13.79 | no |
| MIN | 19 | 14 | 7 | win_total_9 | 4.5 | 11.5 | 45 | 83 | 11.83 | no |
| LAC | 18 | 12 | 4 | division | 1 |  | 5 | 1 | 4.63 | yes |
| ARI | 17 | 10 | 0 |  | 1 | 1 |  | 4 | 6.05 | yes |
| ATL | 19 | 13 | 0 |  | 1 |  | 22 | 23 | 7.42 | yes |
| BAL | 24 | 15 | 0 |  | 7 |  | 46 | 75 | 11.41 | yes |
| BUF | 19 | 11 | 0 |  | 10.5 | 22 | 68 | 96 | 12.88 | yes |
| CAR | 20 | 12 | 0 |  | 1.5 | 4 | 50 | 56 | 9.35 | yes |
| CHI | 19 | 10 | 0 |  | 5 | 12 |  | 69 | 11 | yes |
| CIN | 20 | 11 | 0 |  | 3.5 |  | 32 | 64 | 10.72 | yes |
| CLE | 18 | 12 | 0 |  | 1 |  | 9 | 32 | 8.7 | yes |
| DAL | 19 | 10 | 0 |  | 2.5 | 5 | 45 | 51 | 8.68 | yes |
| DEN | 17 | 9 | 0 |  | 4.5 |  | 27 | 70 | 11.22 | yes |
| DET | 19 | 6 | 0 |  | 4 | 7.5 |  | 62 |  | yes |
| GB | 24 | 15 | 0 |  | 3 | 6 | 13 | 57 | 10.18 | yes |
| HOU | 18 | 10 | 0 |  | 3 | 5 |  | 48 | 9.79 | yes |
| IND | 16 | 7 | 0 |  | 1 |  |  | 9 | 7.54 | yes |
| JAX | 18 | 8 | 0 |  | 6 |  | 67 | 81 | 11.63 | yes |
| KC | 19 | 13 | 0 |  | 11 | 19 | 68 | 91 | 12.85 | yes |
| LAR | 28 | 12 | 0 |  | 7 | 12 |  | 49 | 9.53 | yes |
| LV | 18 | 9 | 0 |  | 1 |  | 4 | 22 | 7.75 | yes |
| MIA | 18 | 8 | 0 |  |  |  | 1 |  | 2.89 | yes |
| NE | 19 | 10 | 0 |  | 4 | 9 | 31 | 75 | 11.32 | yes |
| NO | 19 | 9 | 0 |  | 1 |  | 20 | 22 | 7.45 | yes |
| NYG | 23 | 12 | 0 |  | 1 | 3 | 28 | 32 | 7.48 | yes |
| NYJ | 18 | 6 | 0 |  | 1 |  |  | 5 | 6.58 | yes |
| PHI | 19 | 14 | 0 |  | 1 | 1 | 10.5 | 17 | 6.58 | yes |
| PIT | 23 | 14 | 0 |  | 1 | 2 | 16 | 43 | 9.73 | yes |
| SEA | 23 | 13 | 0 |  | 6 | 11.5 |  | 61 | 10.47 | yes |
| TB | 20 | 9 | 0 |  | 1 |  | 11 | 14 | 6.3 | yes |
| TEN | 16 | 6 | 0 |  | 1 |  |  |  | 4.41 | yes |
| WAS | 17 | 7 | 0 |  | 1 |  | 15 | 15 | 6.42 | yes |

## Detected Actionable-Coherence Inconsistencies

### SF - max divergence 9pp
- Ladder inversion: P(>=16) exceeds P(>=15) by 9pp

### MIN - max divergence 7pp
- Ladder inversion: P(>=9) exceeds P(>=7) by 7pp

### LAC - max divergence 4pp
- Nesting: division (5%) > make_playoffs (1%) by 4pp

