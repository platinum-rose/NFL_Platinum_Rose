# Cross-Market Coherence - 2026-09-23

> Consensus context only. Actionable means eligible for deterministic coherence math, not approved or executable.
> Liquidity-warned/ineligible rows are excluded from the calculations. Settlement terms remain unverified.

Generated: 2026-09-23T18:51:50.483Z
Eligible-context contracts: 679 | Actionable coherence contracts: 333 | Context-only contracts: 346
Eligible-context teams: 32 | Actionable teams: 32 | Execution-eligible contracts: 0
Incoherent actionable teams: 7 | Ladder inversions: 0 | Nesting violations: 11
Source liquidity warnings: 4064 (84.86%)

## Required Caveats

- Gross yes-price probabilities drive coherence; fee-adjusted net odds remain preserved in the team-market map.
- Liquidity-warned rows can contribute to eligible-context counts but never to actionable coherence probabilities.
- Settlement terms are not locally verified, so this artifact is not an execution source.

## Actionable Coherence by Team (most incoherent first)

| Team | Eligible Context | Actionable | Max Div % | Softest | SB% | Conf% | Div% | Playoff% | Impl. Median Wins | Ladder Mono |
|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| MIA | 23 | 12 | 48 | conference | 25.5 | 50 | 1 | 2 | 3.19 | yes |
| ATL | 21 | 13 | 24.5 | super_bowl | 25.5 | 1 | 5 | 12 | 5.82 | yes |
| NYJ | 20 | 8 | 24.5 | super_bowl | 25.5 | 1 |  | 18 | 7.07 | yes |
| WAS | 19 | 12 | 23.5 | super_bowl | 25.5 | 2 | 3.5 | 8 | 6.18 | yes |
| TEN | 19 | 7 | 22.5 | super_bowl | 25.5 |  | 2 | 3 |  | yes |
| ARI | 18 | 10 | 19.5 | super_bowl | 25.5 |  |  | 6 | 5.91 | yes |
| CLE | 18 | 8 | 17.5 | super_bowl | 25.5 |  | 2 | 8 | 6.22 | yes |
| BAL | 27 | 8 | 0 |  | 6 |  | 43 |  | 11.36 | yes |
| BUF | 20 | 11 | 0 |  | 11.5 | 22 | 68 | 91 | 12.69 | yes |
| CAR | 19 | 9 | 0 |  | 1 | 1 |  | 34 | 7.92 | yes |
| CHI | 21 | 12 | 0 |  | 2.5 | 7 | 19 | 42 | 9.31 | yes |
| CIN | 22 | 12 | 0 |  | 6.5 | 11 | 46 | 82 | 12.13 | yes |
| DAL | 22 | 9 | 0 |  | 3.5 |  | 30 | 50 | 9.63 | yes |
| DEN | 26 | 10 | 0 |  | 4 | 7 | 27 | 58 | 10.06 | yes |
| DET | 21 | 10 | 0 |  | 3.5 | 8 | 33 | 63 | 11.07 | yes |
| GB | 21 | 8 | 0 |  | 2.5 |  | 20 | 40 | 9.25 | yes |
| HOU | 22 | 11 | 0 |  | 2.5 | 6 | 38.5 | 52 | 9.86 | yes |
| IND | 18 | 12 | 0 |  | 1 | 1 | 16.5 | 28 | 8.13 | yes |
| JAX | 19 | 8 | 0 |  | 3 |  | 44 | 58 | 10.07 | yes |
| KC | 20 | 11 | 0 |  | 8 | 17 | 57 | 81 | 11.67 | yes |
| LAC | 26 | 13 | 0 |  | 1 |  | 6 | 21 | 7.13 | yes |
| LAR | 29 | 13 | 0 |  | 12.5 | 16.5 | 31 | 75 | 12.36 | yes |
| LV | 20 | 12 | 0 |  | 1 |  | 11 | 32 | 8 | yes |
| MIN | 20 | 12 | 0 |  | 3 | 6 | 31 | 59 | 10.75 | yes |
| NE | 21 | 8 | 0 |  | 4 | 9 | 28 | 61 | 10.33 | yes |
| NO | 20 | 12 | 0 |  | 1.5 | 2 | 40 | 53 | 9.75 | yes |
| NYG | 25 | 12 | 0 |  | 1 | 1 | 7 | 14 | 6.41 | yes |
| PHI | 22 | 9 | 0 |  | 5 |  | 60.5 | 77 | 11.41 | yes |
| PIT | 19 | 10 | 0 |  | 1 |  | 11 | 26 | 7.83 | yes |
| SEA | 21 | 15 | 0 |  | 8.5 | 14 | 34 | 76 | 12.21 | yes |
| SF | 20 | 9 | 0 |  | 8.5 | 16 | 34 | 78 | 11.94 | yes |
| TB | 20 | 7 | 0 |  | 1 | 3 | 27 | 28 |  | yes |

## Detected Actionable-Coherence Inconsistencies

### MIA - max divergence 48pp
- Nesting: conference (50%) > make_playoffs (2%) by 48pp
- Nesting: super_bowl (25.5%) > make_playoffs (2%) by 23.5pp

### ATL - max divergence 24.5pp
- Nesting: super_bowl (25.5%) > conference (1%) by 24.5pp
- Nesting: super_bowl (25.5%) > make_playoffs (12%) by 13.5pp

### NYJ - max divergence 24.5pp
- Nesting: super_bowl (25.5%) > conference (1%) by 24.5pp
- Nesting: super_bowl (25.5%) > make_playoffs (18%) by 7.5pp

### WAS - max divergence 23.5pp
- Nesting: super_bowl (25.5%) > conference (2%) by 23.5pp
- Nesting: super_bowl (25.5%) > make_playoffs (8%) by 17.5pp

### TEN - max divergence 22.5pp
- Nesting: super_bowl (25.5%) > make_playoffs (3%) by 22.5pp

### ARI - max divergence 19.5pp
- Nesting: super_bowl (25.5%) > make_playoffs (6%) by 19.5pp

### CLE - max divergence 17.5pp
- Nesting: super_bowl (25.5%) > make_playoffs (8%) by 17.5pp

