# Cross-Market Coherence - 2026-10-30

> Consensus context only. Actionable means eligible for deterministic coherence math, not approved or executable.
> Liquidity-warned/ineligible rows are excluded from the calculations. Settlement terms remain unverified.

Generated: 2026-10-30T22:00:55.178Z
Eligible-context contracts: 549 | Actionable coherence contracts: 267 | Context-only contracts: 282
Eligible-context teams: 32 | Actionable teams: 32 | Execution-eligible contracts: 0
Incoherent actionable teams: 1 | Ladder inversions: 0 | Nesting violations: 1
Source liquidity warnings: 3479 (84.01%)

## Required Caveats

- Gross yes-price probabilities drive coherence; fee-adjusted net odds remain preserved in the team-market map.
- Liquidity-warned rows can contribute to eligible-context counts but never to actionable coherence probabilities.
- Settlement terms are not locally verified, so this artifact is not an execution source.

## Actionable Coherence by Team (most incoherent first)

| Team | Eligible Context | Actionable | Max Div % | Softest | SB% | Conf% | Div% | Playoff% | Impl. Median Wins | Ladder Mono |
|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| PHI | 17 | 13 | 3 | division | 1 |  | 8 | 5 | 6 | yes |
| ARI | 14 | 5 | 0 |  | 1 | 1 |  |  | 5.83 | yes |
| ATL | 15 | 8 | 0 |  | 1 |  | 39 | 40 | 8.3 | yes |
| BAL | 16 | 8 | 0 |  | 5 |  |  | 63 | 10.58 | yes |
| BUF | 17 | 4 | 0 |  | 12 |  |  | 93 | 12.85 | yes |
| CAR | 17 | 9 | 0 |  | 1 | 2 | 31.5 | 31 | 7.6 | yes |
| CHI | 21 | 15 | 0 |  | 7 | 14 | 28 | 50.5 | 11.4 | yes |
| CIN | 16 | 7 | 0 |  | 5 |  | 44 | 80 | 11.8 | yes |
| CLE | 16 | 8 | 0 |  | 1 |  | 6 | 40 | 9.56 | yes |
| DAL | 17 | 7 | 0 |  | 2 | 4 | 45 | 48 | 9.26 | yes |
| DEN | 15 | 9 | 0 |  | 4 | 9 | 36 | 77 | 11.59 | yes |
| DET | 16 | 6 | 0 |  | 4 | 8 | 24 | 68 | 11.19 | yes |
| GB | 15 | 10 | 0 |  | 3 |  | 10 | 52 | 10.05 | yes |
| HOU | 22 | 9 | 0 |  | 2 |  | 16 | 29 |  | yes |
| IND | 16 | 7 | 0 |  |  |  | 4 | 4 | 6.32 | yes |
| JAX | 18 | 8 | 0 |  | 6 |  | 80 | 85 | 11.63 | yes |
| KC | 17 | 5 | 0 |  | 10 |  | 62 | 91 | 12.79 | yes |
| LAC | 16 | 11 | 0 |  | 1 |  | 1 | 3 | 4.85 | yes |
| LAR | 29 | 10 | 0 |  | 7 |  | 9 | 50 | 10.05 | yes |
| LV | 16 | 7 | 0 |  | 1 |  |  | 14 | 7.42 | yes |
| MIA | 17 | 8 | 0 |  | 1 |  |  | 1 | 3.86 | yes |
| MIN | 17 | 13 | 0 |  | 5 | 10 | 40 | 79 | 11.75 | yes |
| NE | 16 | 7 | 0 |  | 3 |  | 26 | 70 | 10.74 | yes |
| NO | 16 | 8 | 0 |  | 1 | 1 | 13 | 16 | 6.63 | yes |
| NYG | 23 | 11 | 0 |  | 1 | 3 | 39 | 50 | 8.67 | yes |
| NYJ | 15 | 6 | 0 |  | 1 |  |  | 6 | 5.9 | yes |
| PIT | 14 | 5 | 0 |  |  |  |  | 51 | 10.25 | yes |
| SEA | 15 | 7 | 0 |  | 8 | 13 |  | 73 | 11.4 | yes |
| SF | 21 | 14 | 0 |  | 14 | 26 |  | 94 | 13 | yes |
| TB | 17 | 8 | 0 |  | 1 |  | 21 | 24 | 7.18 | yes |
| TEN | 15 | 5 | 0 |  | 1 |  | 1 | 1 |  | yes |
| WAS | 17 | 9 | 0 |  | 1 | 1 | 9 | 14 | 6.5 | yes |

## Detected Actionable-Coherence Inconsistencies

### PHI - max divergence 3pp
- Nesting: division (8%) > make_playoffs (5%) by 3pp

