# Cross-Market Coherence - 2026-10-28

> Consensus context only. Actionable means eligible for deterministic coherence math, not approved or executable.
> Liquidity-warned/ineligible rows are excluded from the calculations. Settlement terms remain unverified.

Generated: 2026-10-28T22:00:49.968Z
Eligible-context contracts: 629 | Actionable coherence contracts: 331 | Context-only contracts: 298
Eligible-context teams: 32 | Actionable teams: 32 | Execution-eligible contracts: 0
Incoherent actionable teams: 1 | Ladder inversions: 0 | Nesting violations: 1
Source liquidity warnings: 3340 (82.37%)

## Required Caveats

- Gross yes-price probabilities drive coherence; fee-adjusted net odds remain preserved in the team-market map.
- Liquidity-warned rows can contribute to eligible-context counts but never to actionable coherence probabilities.
- Settlement terms are not locally verified, so this artifact is not an execution source.

## Actionable Coherence by Team (most incoherent first)

| Team | Eligible Context | Actionable | Max Div % | Softest | SB% | Conf% | Div% | Playoff% | Impl. Median Wins | Ladder Mono |
|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| MIA | 25 | 13 | 3 | division | 1 | 1 | 5 | 2 | 3.71 | yes |
| ARI | 17 | 8 | 0 |  | 1 |  | 1 | 1 | 5.86 | yes |
| ATL | 18 | 8 | 0 |  | 1 |  |  | 39 | 8.3 | yes |
| BAL | 20 | 10 | 0 |  | 5 | 9.5 | 25 | 62 | 10.55 | yes |
| BUF | 22 | 15 | 0 |  | 12 | 22.5 | 74 | 93 | 12.89 | yes |
| CAR | 19 | 9 | 0 |  | 1 |  | 23.5 | 36 | 8.29 | yes |
| CHI | 24 | 14 | 0 |  | 6.5 | 12 | 49 | 73 | 11.13 | yes |
| CIN | 21 | 12 | 0 |  | 5 | 10 | 43 | 81 | 11.57 | yes |
| CLE | 19 | 12 | 0 |  | 1 | 3 | 7 | 39 | 9.53 | yes |
| DAL | 19 | 12 | 0 |  | 3 | 5 | 45 | 51 | 9.17 | yes |
| DEN | 19 | 12 | 0 |  | 4.5 | 9 | 47 | 78 | 11.64 | yes |
| DET | 19 | 6 | 0 |  | 4 |  |  | 70 | 11.12 | yes |
| GB | 19 | 8 | 0 |  | 2 |  | 9 | 44 | 10.04 | yes |
| HOU | 20 | 10 | 0 |  | 2 | 3 | 15 | 32 | 8.71 | yes |
| IND | 18 | 9 | 0 |  | 1 |  | 5 | 4 | 6.17 | yes |
| JAX | 21 | 8 | 0 |  | 6.5 | 13 | 67.5 | 85 |  | yes |
| KC | 21 | 12 | 0 |  | 10 | 30 | 64 | 89 | 12.12 | yes |
| LAC | 20 | 14 | 0 |  | 1 | 1 |  | 3 | 4.85 | yes |
| LAR | 22 | 10 | 0 |  | 7 |  |  | 51 | 9.84 | yes |
| LV | 20 | 11 | 0 |  | 1 | 1 |  | 13 | 7.45 | yes |
| MIN | 19 | 14 | 0 |  | 4.5 | 11 | 25 | 83 | 11.89 | yes |
| NE | 26 | 12 | 0 |  | 3.5 | 8 | 25 | 69 | 10.69 | yes |
| NO | 18 | 6 | 0 |  | 1 |  |  | 16 | 6.65 | yes |
| NYG | 19 | 9 | 0 |  | 2 |  | 31 | 44 | 8.52 | yes |
| NYJ | 18 | 9 | 0 |  | 1 | 1 | 1 | 4 | 6.05 | yes |
| PHI | 19 | 12 | 0 |  | 1 | 2 | 9 | 7 | 5.94 | yes |
| PIT | 19 | 11 | 0 |  | 2 | 3 |  | 48 | 10.22 | yes |
| SEA | 18 | 11 | 0 |  | 8 | 14 | 48 | 72 | 11.39 | yes |
| SF | 18 | 13 | 0 |  | 15.5 | 25 | 72 | 92 | 13.04 | yes |
| TB | 19 | 9 | 0 |  | 1 |  | 15 | 23 | 7.24 | yes |
| TEN | 16 | 3 | 0 |  | 1 |  |  | 2 |  | yes |
| WAS | 17 | 9 | 0 |  | 1 |  | 10 | 13 | 6.5 | yes |

## Detected Actionable-Coherence Inconsistencies

### MIA - max divergence 3pp
- Nesting: division (5%) > make_playoffs (2%) by 3pp

