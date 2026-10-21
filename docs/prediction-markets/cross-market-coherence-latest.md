# Cross-Market Coherence - 2026-10-21

> Consensus context only. Actionable means eligible for deterministic coherence math, not approved or executable.
> Liquidity-warned/ineligible rows are excluded from the calculations. Settlement terms remain unverified.

Generated: 2026-10-21T00:06:29.143Z
Eligible-context contracts: 566 | Actionable coherence contracts: 339 | Context-only contracts: 227
Eligible-context teams: 32 | Actionable teams: 32 | Execution-eligible contracts: 0
Incoherent actionable teams: 4 | Ladder inversions: 4 | Nesting violations: 0
Source liquidity warnings: 3700 (80.3%)

## Required Caveats

- Gross yes-price probabilities drive coherence; fee-adjusted net odds remain preserved in the team-market map.
- Liquidity-warned rows can contribute to eligible-context counts but never to actionable coherence probabilities.
- Settlement terms are not locally verified, so this artifact is not an execution source.

## Actionable Coherence by Team (most incoherent first)

| Team | Eligible Context | Actionable | Max Div % | Softest | SB% | Conf% | Div% | Playoff% | Impl. Median Wins | Ladder Mono |
|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| SF | 17 | 16 | 7 | win_total_9 | 16.5 | 29 | 77 | 99 | 13.67 | no |
| GB | 18 | 13 | 5 | win_total_15 | 2.5 | 5.5 | 14 | 56 | 10.18 | no |
| KC | 17 | 8 | 3 | win_total_10 | 11 |  |  | 93 | 12.88 | no |
| LAC | 16 | 13 | 3 | win_total_2 | 1 | 1 |  | 3 | 4.38 | no |
| ARI | 17 | 10 | 0 |  | 1 |  |  | 7 | 6.05 | yes |
| ATL | 18 | 11 | 0 |  | 1 | 1 | 23 | 24 | 7.52 | yes |
| BAL | 21 | 13 | 0 |  | 6.5 |  | 49 | 77 | 11.36 | yes |
| BUF | 16 | 11 | 0 |  | 11.5 | 21 | 68 | 95 | 13.11 | yes |
| CAR | 19 | 12 | 0 |  | 1 | 3 | 49.5 | 55 | 9.42 | yes |
| CHI | 18 | 9 | 0 |  | 5.5 | 12 | 23 | 66 | 11.16 | yes |
| CIN | 22 | 10 | 0 |  | 4 |  |  | 63 | 10.72 | yes |
| CLE | 16 | 10 | 0 |  | 1 |  |  | 31 | 8.57 | yes |
| DAL | 17 | 12 | 0 |  | 2.5 | 5 | 45 | 48 | 8.57 | yes |
| DEN | 16 | 8 | 0 |  | 4 |  | 27 | 70 | 11.27 | yes |
| DET | 19 | 8 | 0 |  | 4 | 7.5 | 25 | 62 | 10.67 | yes |
| HOU | 22 | 13 | 0 |  | 3 |  | 26 | 47 | 9.78 | yes |
| IND | 17 | 9 | 0 |  | 1 | 1 | 5 | 11 | 7.25 | yes |
| JAX | 17 | 8 | 0 |  | 6.5 |  | 66 | 81 | 11.48 | yes |
| LAR | 17 | 12 | 0 |  | 6.5 | 12 | 8 | 51 | 9.8 | yes |
| LV | 16 | 10 | 0 |  | 1 |  |  | 23 | 8.32 | yes |
| MIA | 17 | 9 | 0 |  | 1 |  |  | 2 | 2.74 | yes |
| MIN | 19 | 14 | 0 |  | 4 | 11 | 42 | 80 | 12.25 | yes |
| NE | 16 | 10 | 0 |  | 4 | 9 |  | 75 | 11.16 | yes |
| NO | 18 | 10 | 0 |  | 1 | 1 | 19 | 25 | 7.5 | yes |
| NYG | 17 | 8 | 0 |  | 1 | 1 | 28 | 29 | 7.45 | yes |
| NYJ | 16 | 4 | 0 |  |  | 1 |  | 6 | 6.66 | yes |
| PHI | 17 | 14 | 0 |  | 1 | 2 | 17 | 18 | 6.58 | yes |
| PIT | 21 | 11 | 0 |  | 1 |  |  | 42 | 9.56 | yes |
| SEA | 17 | 11 | 0 |  | 6 | 11.5 | 11 | 61 | 10.55 | yes |
| TB | 18 | 13 | 0 |  | 1 | 1 | 11 | 14 | 6.3 | yes |
| TEN | 17 | 9 | 0 |  | 1 |  |  | 1 | 4.41 | yes |
| WAS | 17 | 10 | 0 |  | 1 | 1 | 14 | 16 | 6.47 | yes |

## Detected Actionable-Coherence Inconsistencies

### SF - max divergence 7pp
- Ladder inversion: P(>=9) exceeds P(>=7) by 7pp

### GB - max divergence 5pp
- Ladder inversion: P(>=15) exceeds P(>=14) by 5pp

### KC - max divergence 3pp
- Ladder inversion: P(>=10) exceeds P(>=9) by 3pp

### LAC - max divergence 3pp
- Ladder inversion: P(>=2) exceeds P(>=1) by 3pp

