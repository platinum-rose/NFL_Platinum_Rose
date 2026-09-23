# Cross-Market Coherence - 2026-09-22

> Consensus context only. Actionable means eligible for deterministic coherence math, not approved or executable.
> Liquidity-warned/ineligible rows are excluded from the calculations. Settlement terms remain unverified.

Generated: 2026-09-22T23:59:52.135Z
Eligible-context contracts: 645 | Actionable coherence contracts: 382 | Context-only contracts: 263
Eligible-context teams: 32 | Actionable teams: 32 | Execution-eligible contracts: 0
Incoherent actionable teams: 8 | Ladder inversions: 2 | Nesting violations: 12
Source liquidity warnings: 3606 (79.57%)

## Required Caveats

- Gross yes-price probabilities drive coherence; fee-adjusted net odds remain preserved in the team-market map.
- Liquidity-warned rows can contribute to eligible-context counts but never to actionable coherence probabilities.
- Settlement terms are not locally verified, so this artifact is not an execution source.

## Actionable Coherence by Team (most incoherent first)

| Team | Eligible Context | Actionable | Max Div % | Softest | SB% | Conf% | Div% | Playoff% | Impl. Median Wins | Ladder Mono |
|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| MIA | 19 | 11 | 47 | conference | 25.5 | 50 | 50 | 3 | 3.11 | yes |
| TEN | 18 | 10 | 44 | conference | 50 | 50 |  | 6 | 4.59 | yes |
| CLE | 18 | 12 | 40 | conference | 25.5 | 50 | 2 | 10 | 6.14 | yes |
| NYJ | 20 | 11 | 24.5 | super_bowl | 25.5 | 1 | 5 | 17 | 7 | yes |
| ARI | 18 | 10 | 20.5 | super_bowl | 25.5 |  | 1 | 5 | 6.06 | yes |
| WAS | 24 | 11 | 19.5 | super_bowl | 25.5 |  | 3 | 6 | 6.07 | no |
| ATL | 20 | 13 | 14.5 | super_bowl | 25.5 |  |  | 11 | 5.93 | yes |
| MIN | 20 | 14 | 2 | win_total_7 | 3 |  | 31 | 58 | 10.75 | no |
| BAL | 21 | 11 | 0 |  | 6 | 14 | 43 | 75 | 11.5 | yes |
| BUF | 20 | 14 | 0 |  | 12 | 21 | 68 | 90 | 12.78 | yes |
| CAR | 19 | 8 | 0 |  | 1 |  |  | 36 | 7.86 | yes |
| CHI | 20 | 13 | 0 |  | 3.5 | 7 | 19 | 43 | 9.44 | yes |
| CIN | 21 | 14 | 0 |  | 6 | 11 | 44 | 81 | 11.87 | yes |
| DAL | 21 | 9 | 0 |  | 4 |  | 28 | 48 | 9.67 | yes |
| DEN | 25 | 11 | 0 |  | 4 | 7 | 27 | 58 | 9.92 | yes |
| DET | 20 | 10 | 0 |  | 3 | 8 | 33 | 61 | 11.07 | yes |
| GB | 20 | 8 | 0 |  | 2.5 |  | 20 | 41 | 9.27 | yes |
| HOU | 20 | 12 | 0 |  | 2.5 | 6 |  | 51 | 9.67 | yes |
| IND | 17 | 12 | 0 |  | 1 | 1 | 16 | 24 | 8 | yes |
| JAX | 17 | 10 | 0 |  | 3 | 8 | 44 | 58 | 10.14 | yes |
| KC | 24 | 14 | 0 |  | 8 | 17 | 59 | 80 | 11.71 | yes |
| LAC | 19 | 14 | 0 |  | 1.5 | 3 | 5 | 21 | 6.92 | yes |
| LAR | 20 | 12 | 0 |  | 13.5 | 19 | 31 | 74 | 11.75 | yes |
| LV | 19 | 16 | 0 |  | 1 | 2 | 11 | 30 | 7.93 | yes |
| NE | 21 | 13 | 0 |  | 4 | 9 | 26 | 62 | 10.35 | yes |
| NO | 20 | 14 | 0 |  | 1.5 | 2 | 41 | 50 | 9.6 | yes |
| NYG | 26 | 14 | 0 |  | 1 | 2 | 6 | 15 | 6.33 | yes |
| PHI | 21 | 12 | 0 |  | 5 |  | 60.5 | 79 | 11.39 | yes |
| PIT | 18 | 13 | 0 |  | 1 | 2 | 10 | 26 | 7.75 | yes |
| SEA | 20 | 14 | 0 |  | 8.5 | 13 | 34 | 78 | 12 | yes |
| SF | 20 | 12 | 0 |  | 8 | 15 | 36 | 78 | 12.06 | yes |
| TB | 19 | 10 | 0 |  | 1 | 3 | 27 | 26 |  | yes |

## Detected Actionable-Coherence Inconsistencies

### MIA - max divergence 47pp
- Nesting: conference (50%) > make_playoffs (3%) by 47pp
- Nesting: super_bowl (25.5%) > make_playoffs (3%) by 22.5pp
- Nesting: division (50%) > make_playoffs (3%) by 47pp

### TEN - max divergence 44pp
- Nesting: conference (50%) > make_playoffs (6%) by 44pp
- Nesting: super_bowl (50%) > make_playoffs (6%) by 44pp

### CLE - max divergence 40pp
- Nesting: conference (50%) > make_playoffs (10%) by 40pp
- Nesting: super_bowl (25.5%) > make_playoffs (10%) by 15.5pp

### NYJ - max divergence 24.5pp
- Nesting: super_bowl (25.5%) > conference (1%) by 24.5pp
- Nesting: super_bowl (25.5%) > make_playoffs (17%) by 8.5pp

### ARI - max divergence 20.5pp
- Nesting: super_bowl (25.5%) > make_playoffs (5%) by 20.5pp

### WAS - max divergence 19.5pp
- Nesting: super_bowl (25.5%) > make_playoffs (6%) by 19.5pp
- Ladder inversion: P(>=8) exceeds P(>=7) by 16pp

### ATL - max divergence 14.5pp
- Nesting: super_bowl (25.5%) > make_playoffs (11%) by 14.5pp

### MIN - max divergence 2pp
- Ladder inversion: P(>=7) exceeds P(>=6) by 2pp

