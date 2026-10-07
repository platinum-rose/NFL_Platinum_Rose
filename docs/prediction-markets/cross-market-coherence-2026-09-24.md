# Cross-Market Coherence - 2026-09-24

> Consensus context only. Actionable means eligible for deterministic coherence math, not approved or executable.
> Liquidity-warned/ineligible rows are excluded from the calculations. Settlement terms remain unverified.

Generated: 2026-09-24T01:38:38.603Z
Eligible-context contracts: 637 | Actionable coherence contracts: 292 | Context-only contracts: 345
Eligible-context teams: 32 | Actionable teams: 32 | Execution-eligible contracts: 0
Incoherent actionable teams: 5 | Ladder inversions: 1 | Nesting violations: 7
Source liquidity warnings: 3639 (78.44%)

## Required Caveats

- Gross yes-price probabilities drive coherence; fee-adjusted net odds remain preserved in the team-market map.
- Liquidity-warned rows can contribute to eligible-context counts but never to actionable coherence probabilities.
- Settlement terms are not locally verified, so this artifact is not an execution source.

## Actionable Coherence by Team (most incoherent first)

| Team | Eligible Context | Actionable | Max Div % | Softest | SB% | Conf% | Div% | Playoff% | Impl. Median Wins | Ladder Mono |
|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| ARI | 18 | 10 | 49 | super_bowl | 50 | 1 |  | 6 | 5.83 | yes |
| ATL | 20 | 13 | 49 | super_bowl | 50 | 1 | 6 | 12 | 5.86 | yes |
| MIA | 17 | 11 | 49 | conference | 50 | 50 | 1 | 1 | 3.25 | yes |
| NYJ | 18 | 6 | 33 | super_bowl | 50 |  |  | 17 | 7.13 | yes |
| NO | 20 | 13 | 9 | win_total_11 | 1 | 4 | 41 | 54 | 9.78 | no |
| BAL | 24 | 4 | 0 |  | 6 |  |  |  | 11.44 | yes |
| BUF | 18 | 8 | 0 |  | 12 | 21 | 69 | 91 | 12.71 | yes |
| CAR | 19 | 9 | 0 |  | 1 | 2 |  | 35 | 7.93 | yes |
| CHI | 21 | 10 | 0 |  | 2 | 5.5 | 21 | 39 | 9.44 | yes |
| CIN | 19 | 9 | 0 |  | 6 | 11 |  | 82 | 12.15 | yes |
| CLE | 16 | 7 | 0 |  |  |  |  | 10 | 6.07 | yes |
| DAL | 20 | 10 | 0 |  | 3 | 7 |  | 48 | 9.71 | yes |
| DEN | 24 | 9 | 0 |  | 4 | 7 |  | 58 | 10.06 | yes |
| DET | 21 | 8 | 0 |  | 3 | 5 | 32 | 61 | 11.05 | yes |
| GB | 21 | 9 | 0 |  | 3 | 5 | 19 | 40 | 9.2 | yes |
| HOU | 20 | 10 | 0 |  | 2 | 6 | 40 | 53 | 9.85 | yes |
| IND | 17 | 8 | 0 |  | 1 | 2 | 17 | 29 | 7.87 | yes |
| JAX | 17 | 6 | 0 |  | 3 |  | 45 | 60 | 10.08 | yes |
| KC | 23 | 9 | 0 |  | 8 | 17 | 57 | 81 | 11.92 | yes |
| LAC | 24 | 13 | 0 |  | 1 |  | 6 | 22 | 7.17 | yes |
| LAR | 28 | 10 | 0 |  | 13 | 20 |  | 75 | 12.48 | yes |
| LV | 18 | 10 | 0 |  | 1 |  | 12 | 31 | 8.29 | yes |
| MIN | 21 | 12 | 0 |  | 3 | 6.5 | 35 | 60 | 10.85 | yes |
| NE | 19 | 7 | 0 |  | 4 | 9 | 27 | 62 | 10.13 | yes |
| NYG | 23 | 10 | 0 |  | 1 | 1 | 8 | 17 |  | yes |
| PHI | 20 | 7 | 0 |  | 5 | 12 | 60 | 77 | 11.39 | yes |
| PIT | 16 | 9 | 0 |  |  |  |  | 26 | 7.85 | yes |
| SEA | 20 | 13 | 0 |  | 9 | 14 | 34 | 75 | 12.21 | yes |
| SF | 20 | 9 | 0 |  | 8 | 16 | 35 | 78 | 12.12 | yes |
| TB | 19 | 8 | 0 |  | 1 | 2 | 27 | 27 | 7.5 | yes |
| TEN | 18 | 6 | 0 |  |  |  | 2 | 3 |  | yes |
| WAS | 18 | 9 | 0 |  |  | 1.5 | 5 | 10 | 6.29 | yes |

## Detected Actionable-Coherence Inconsistencies

### ARI - max divergence 49pp
- Nesting: super_bowl (50%) > conference (1%) by 49pp
- Nesting: super_bowl (50%) > make_playoffs (6%) by 44pp

### ATL - max divergence 49pp
- Nesting: super_bowl (50%) > conference (1%) by 49pp
- Nesting: super_bowl (50%) > make_playoffs (12%) by 38pp

### MIA - max divergence 49pp
- Nesting: conference (50%) > make_playoffs (1%) by 49pp
- Nesting: super_bowl (50%) > make_playoffs (1%) by 49pp

### NYJ - max divergence 33pp
- Nesting: super_bowl (50%) > make_playoffs (17%) by 33pp

### NO - max divergence 9pp
- Ladder inversion: P(>=11) exceeds P(>=10) by 9pp

