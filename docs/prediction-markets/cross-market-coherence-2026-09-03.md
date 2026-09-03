# Cross-Market Coherence - 2026-09-03

> Consensus context only. Actionable means eligible for deterministic coherence math, not approved or executable.
> Liquidity-warned/ineligible rows are excluded from the calculations. Settlement terms remain unverified.

Generated: 2026-09-03T06:32:02.838Z
Eligible-context contracts: 654 | Actionable coherence contracts: 260 | Context-only contracts: 394
Eligible-context teams: 32 | Actionable teams: 32 | Execution-eligible contracts: 0
Incoherent actionable teams: 1 | Ladder inversions: 0 | Nesting violations: 2
Source liquidity warnings: 2195 (78.59%)

## Required Caveats

- Gross yes-price probabilities drive coherence; fee-adjusted net odds remain preserved in the team-market map.
- Liquidity-warned rows can contribute to eligible-context counts but never to actionable coherence probabilities.
- Settlement terms are not locally verified, so this artifact is not an execution source.

## Actionable Coherence by Team (most incoherent first)

| Team | Eligible Context | Actionable | Max Div % | Softest | SB% | Conf% | Div% | Playoff% | Impl. Median Wins | Ladder Mono |
|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| LV | 20 | 8 | 48 | super_bowl | 50 | 2 | 4 | 18 | 6.57 | yes |
| ARI | 17 | 8 | 0 |  | 1 |  |  | 4 | 4.45 | yes |
| ATL | 22 | 8 | 0 |  | 1 |  | 19 | 29 | 7.29 | yes |
| BAL | 22 | 8 | 0 |  | 8 | 13.5 |  | 78 | 10.95 | yes |
| BUF | 21 | 7 | 0 |  | 9 | 16 |  | 77 | 11.1 | yes |
| CAR | 19 | 5 | 0 |  | 1 |  | 23 | 34 | 7.55 | yes |
| CHI | 23 | 9 | 0 |  | 4 | 8 | 25 | 51 | 10 | yes |
| CIN | 22 | 10 | 0 |  | 4 | 8 |  |  | 10.8 | yes |
| CLE | 18 | 5 | 0 |  | 1 | 1 | 4 |  | 6.12 | yes |
| DAL | 22 | 12 | 0 |  | 5 | 9 |  | 54 | 10.47 | yes |
| DEN | 23 | 11 | 0 |  | 5 | 9 | 33 | 59 | 10.36 | yes |
| DET | 23 | 9 | 0 |  | 4 | 9 | 35 | 66 | 11.5 | yes |
| GB | 22 | 11 | 0 |  | 3 | 7.5 | 28 | 56 | 10.47 | yes |
| HOU | 22 | 8 | 0 |  | 4 | 10 | 47 | 67 | 10.89 | yes |
| IND | 18 | 7 | 0 |  | 1 | 3 | 19 |  | 8.59 | yes |
| JAX | 17 | 7 | 0 |  | 3 | 6 | 29.5 | 52 | 10.05 | yes |
| KC | 21 | 10 | 0 |  | 6 | 10.5 | 35 | 65 | 10.5 | yes |
| LAC | 18 | 8 | 0 |  | 4 | 11 | 31 | 53 | 10.67 | yes |
| LAR | 22 | 7 | 0 |  | 14 | 23 |  | 80 | 12.08 | yes |
| MIA | 19 | 8 | 0 |  | 1 |  | 1 | 6 | 4.25 | yes |
| MIN | 22 | 9 | 0 |  | 1 | 4 | 18 | 42 | 9.57 | yes |
| NE | 21 | 8 | 0 |  | 4 | 10 |  | 65 | 10.58 | yes |
| NO | 22 | 10 | 0 |  | 1 | 2 | 27.5 | 35 | 8.36 | yes |
| NYG | 19 | 8 | 0 |  | 1 | 3 |  | 31 | 8.08 | yes |
| NYJ | 20 | 8 | 0 |  | 1 | 1 |  | 11 | 6.29 | yes |
| PHI | 22 | 7 | 0 |  | 4 | 9 |  | 61 | 10.87 | yes |
| PIT | 17 | 10 | 0 |  | 1 | 2.5 | 14 | 38 | 8.83 | yes |
| SEA | 22 | 9 | 0 |  | 9 | 13 | 32 | 67 | 11.2 | yes |
| SF | 22 | 9 | 0 |  | 4 | 9 |  | 56 | 10.47 | yes |
| TB | 20 | 6 | 0 |  | 1 |  | 32 | 43 | 9 | yes |
| TEN | 19 | 3 | 0 |  | 1 |  | 9 |  |  | yes |
| WAS | 17 | 7 | 0 |  | 1 | 2 |  | 31 | 7.63 | yes |

## Detected Actionable-Coherence Inconsistencies

### LV - max divergence 48pp
- Nesting: super_bowl (50%) > conference (2%) by 48pp
- Nesting: super_bowl (50%) > make_playoffs (18%) by 32pp

