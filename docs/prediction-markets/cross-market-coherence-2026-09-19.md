# Cross-Market Coherence - 2026-09-19

> Consensus context only. Actionable means eligible for deterministic coherence math, not approved or executable.
> Liquidity-warned/ineligible rows are excluded from the calculations. Settlement terms remain unverified.

Generated: 2026-09-19T18:34:32.024Z
Eligible-context contracts: 721 | Actionable coherence contracts: 294 | Context-only contracts: 427
Eligible-context teams: 32 | Actionable teams: 32 | Execution-eligible contracts: 0
Incoherent actionable teams: 6 | Ladder inversions: 0 | Nesting violations: 9
Source liquidity warnings: 4053 (76.41%)

## Required Caveats

- Gross yes-price probabilities drive coherence; fee-adjusted net odds remain preserved in the team-market map.
- Liquidity-warned rows can contribute to eligible-context counts but never to actionable coherence probabilities.
- Settlement terms are not locally verified, so this artifact is not an execution source.

## Actionable Coherence by Team (most incoherent first)

| Team | Eligible Context | Actionable | Max Div % | Softest | SB% | Conf% | Div% | Playoff% | Impl. Median Wins | Ladder Mono |
|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| CLE | 19 | 10 | 45 | super_bowl | 50 |  |  | 5 | 4.75 | yes |
| MIA | 26 | 10 | 45 | conference | 25.5 | 50 | 1 | 5 | 3.41 | yes |
| ATL | 20 | 10 | 31 | conference | 25.5 | 50 | 18 | 19 | 6.39 | yes |
| CAR | 19 | 10 | 24.5 | super_bowl | 25.5 | 1 |  | 24 | 7.15 | yes |
| NYJ | 22 | 11 | 24.5 | super_bowl | 25.5 | 1 | 6 | 21 | 7.33 | yes |
| ARI | 20 | 11 | 14.5 | super_bowl | 25.5 |  |  | 11 | 6.43 | yes |
| BAL | 30 | 7 | 0 |  | 8.5 | 14 |  | 81 | 12.59 | yes |
| BUF | 24 | 14 | 0 |  | 13 | 22.5 | 70.5 | 88 | 12.84 | yes |
| CHI | 22 | 15 | 0 |  | 5 | 10 | 36 | 61 | 10.86 | yes |
| CIN | 22 | 5 | 0 |  | 4 | 9 |  |  | 11.65 | yes |
| DAL | 23 | 7 | 0 |  | 3.5 | 5 |  | 40 | 9.21 | yes |
| DEN | 29 | 8 | 0 |  | 3 | 7 | 24 | 53 |  | yes |
| DET | 22 | 7 | 0 |  | 2.5 |  |  | 61 | 10.87 | yes |
| GB | 24 | 8 | 0 |  | 3 |  |  | 42 | 9.38 | yes |
| HOU | 24 | 11 | 0 |  | 4 | 9 | 42 | 61 | 10.19 | yes |
| IND | 18 | 5 | 0 |  | 1 |  | 12 | 29 |  | yes |
| JAX | 20 | 10 | 0 |  | 3.5 | 8 | 43 | 62 | 10.75 | yes |
| KC | 24 | 10 | 0 |  | 6.5 | 13 | 52 | 77 | 11.41 | yes |
| LAC | 27 | 14 | 0 |  | 3 | 6 | 15 | 44 | 8.55 | yes |
| LAR | 26 | 11 | 0 |  | 13 | 17 | 31 | 70 | 11.26 | yes |
| LV | 22 | 7 | 0 |  | 1 | 2 | 7 | 18 | 7.13 | yes |
| MIN | 22 | 11 | 0 |  | 2.5 |  | 20 | 48 | 9.63 | yes |
| NE | 24 | 9 | 0 |  | 3.5 | 8 | 23 | 58 | 9.83 | yes |
| NO | 21 | 6 | 0 |  | 1 |  |  | 36 | 7.88 | yes |
| NYG | 21 | 10 | 0 |  | 2 | 3 | 24 | 42 | 9.25 | yes |
| PHI | 24 | 7 | 0 |  | 4.5 |  | 49 |  | 10.8 | yes |
| PIT | 19 | 10 | 0 |  | 1 | 3 |  | 40 | 9.38 | yes |
| SEA | 25 | 9 | 0 |  | 7 | 14 | 35 | 69 |  | yes |
| SF | 24 | 9 | 0 |  | 7 | 13 | 34 | 70 |  | yes |
| TB | 20 | 6 | 0 |  | 1 |  | 37 | 46 |  | yes |
| TEN | 19 | 8 | 0 |  | 25.5 |  |  |  | 5.08 | yes |
| WAS | 19 | 8 | 0 |  | 1 |  | 8 | 21 | 7.38 | yes |

## Detected Actionable-Coherence Inconsistencies

### CLE - max divergence 45pp
- Nesting: super_bowl (50%) > make_playoffs (5%) by 45pp

### MIA - max divergence 45pp
- Nesting: conference (50%) > make_playoffs (5%) by 45pp
- Nesting: super_bowl (25.5%) > make_playoffs (5%) by 20.5pp

### ATL - max divergence 31pp
- Nesting: conference (50%) > make_playoffs (19%) by 31pp
- Nesting: super_bowl (25.5%) > make_playoffs (19%) by 6.5pp

### CAR - max divergence 24.5pp
- Nesting: super_bowl (25.5%) > conference (1%) by 24.5pp

### NYJ - max divergence 24.5pp
- Nesting: super_bowl (25.5%) > conference (1%) by 24.5pp
- Nesting: super_bowl (25.5%) > make_playoffs (21%) by 4.5pp

### ARI - max divergence 14.5pp
- Nesting: super_bowl (25.5%) > make_playoffs (11%) by 14.5pp

