# Defensive props backtest — 2026, Weeks 1–7

Generated 2026-10-30T03:37:00.357Z. 107 games, 4537 defender-game rows. Walk-forward: each week W ≥ 3 is projected from weeks < W only. Scored players: prior average ≥ 3 T+A and 2+ prior games (1308 player-weeks). ESPN only lists defenders who recorded a stat, so a 0-tackle game is invisible (slight upward bias).

## 1. Which projection works best

| Method | N | MAE | Bias | Within 1 | Within 2 |
|---|---|---|---|---|---|
| season_avg | 1308 | 2.06 | 0.31 | 35% | 61% |
| median | 1308 | 2.09 | 0.19 | 41% | 65% |
| last3 | 1308 | 2.11 | 0.34 | 36% | 61% |
| avg_x_opp | 1308 | 2.14 | 0.3 | 30% | 57% |
| avg_x_crew | 1308 | 2.07 | 0.31 | 32% | 58% |
| avg_x_opp_x_crew | 1308 | 2.13 | 0.3 | 30% | 58% |

## 2. Do the adjustments point the right way?

**Opponent group factor** (residual = actual − prior season average)

| Factor bucket | N | Avg residual | Beat prior avg |
|---|---|---|---|
| < 0.90 | 377 | -0.62 | 33% |
| 0.90-0.97 | 195 | -0.44 | 34% |
| 0.97-1.03 | 184 | -0.11 | 39% |
| 1.03-1.10 | 189 | 0.28 | 48% |
| > 1.10 | 363 | -0.33 | 39% |

**Stat-crew factor** (residual = actual − prior season average)

| Factor bucket | N | Avg residual | Beat prior avg |
|---|---|---|---|
| < 0.90 | 23 | -0.27 | 35% |
| 0.90-0.97 | 130 | -0.47 | 40% |
| 0.97-1.03 | 972 | -0.33 | 37% |
| 1.03-1.10 | 163 | 0.01 | 40% |
| > 1.10 | 20 | -1.07 | 25% |

## 3. Are prior hit rates honest? (lines 4+ to 9+)

| Prior hit rate | N | Avg prior | Actual next-week hit rate |
|---|---|---|---|
| 0-20% | 2959 | 1% | 11% |
| 20-40% | 1451 | 28% | 26% |
| 40-60% | 1371 | 48% | 41% |
| 60-80% | 893 | 68% | 55% |
| 80-100% | 1174 | 96% | 75% |

Over rate against a line set off the player's prior median:

| Line | N | Over rate |
|---|---|---|
| median-1.5 | 1303 | 66% |
| median-0.5 | 1308 | 49% |
| median+0.5 | 1308 | 34% |
| median+1.5 | 1308 | 22% |

## 4. Game script (leave-one-out residual vs. the player's own average)

Team defensive T+A vs. opponent plays: r = 0.8; vs. opponent rush attempts: r = 0.62. League: 1.1 team T+A per opponent play.

| Split | N | Avg residual | Over own avg |
|---|---|---|---|
| team won | 929 | -0.15 | 42% |
| team lost | 958 | 0.11 | 47% |
| won by 14+ | 265 | -0.23 | 40% |
| lost by 14+ | 273 | 0.02 | 49% |
| one-score game (|margin| <= 8) | 1150 | 0.06 | 45% |
| opp plays >= 68 | 499 | 0.68 | 56% |
| opp plays <= 58 | 591 | -0.64 | 33% |
| home | 947 | 0 | 44% |
| away | 957 | 0 | 46% |

| Group | Split | N | Avg residual | Over own avg |
|---|---|---|---|---|
| LB | won | 308 | -0.13 | 42% |
| LB | lost | 326 | 0.08 | 46% |
| LB | opp plays >= 68 | 162 | 0.7 | 57% |
| LB | opp plays <= 58 | 205 | -0.66 | 30% |
| LB | opp rush att >= 30 | 234 | 0.68 | 57% |
| LB | opp pass att >= 38 | 148 | 0.07 | 45% |
| S | won | 241 | -0.29 | 42% |
| S | lost | 247 | 0.28 | 49% |
| S | opp plays >= 68 | 130 | 0.76 | 57% |
| S | opp plays <= 58 | 146 | -0.78 | 33% |
| S | opp rush att >= 30 | 176 | 0.43 | 53% |
| S | opp pass att >= 38 | 124 | 0.38 | 52% |
| CB | won | 261 | 0.02 | 44% |
| CB | lost | 253 | -0.07 | 47% |
| CB | opp plays >= 68 | 134 | 1.02 | 60% |
| CB | opp plays <= 58 | 163 | -0.65 | 34% |
| CB | opp rush att >= 30 | 180 | 0.13 | 49% |
| CB | opp pass att >= 38 | 136 | 0.81 | 55% |
| DL | won | 113 | -0.34 | 39% |
| DL | lost | 128 | 0.28 | 48% |
| DL | opp plays >= 68 | 72 | -0.11 | 40% |
| DL | opp plays <= 58 | 73 | -0.3 | 37% |
| DL | opp rush att >= 30 | 95 | 0.33 | 51% |
| DL | opp pass att >= 38 | 57 | -0.4 | 37% |

## 5. Stat crews: is assist crediting a venue effect?

30 venues with 3+ games. Home-defense vs. visiting-defense assist rate at the same venue: r = 0.06. Split-half (odd vs. even home games): r = 0.21.

| Venue | Games | Home D assist rate | Visiting D assist rate |
|---|---|---|---|
| KC | 3 | 51% | 53% |
| LV | 4 | 52% | 50% |
| SF | 4 | 48% | 52% |
| PIT | 3 | 52% | 47% |
| CHI | 4 | 49% | 47% |
| LAR | 4 | 49% | 46% |
| NYJ | 3 | 47% | 48% |
| IND | 3 | 46% | 48% |
| ARI | 3 | 51% | 44% |
| HOU | 4 | 47% | 48% |
| TEN | 4 | 52% | 42% |
| NE | 3 | 45% | 48% |
| JAX | 4 | 46% | 47% |
| CAR | 3 | 43% | 49% |
| TB | 4 | 43% | 47% |
| WSH | 3 | 43% | 47% |
| CLE | 3 | 48% | 41% |
| LAC | 3 | 50% | 39% |
| ATL | 4 | 47% | 41% |
| BAL | 3 | 39% | 49% |
| PHI | 4 | 45% | 41% |
| BUF | 3 | 46% | 40% |
| DEN | 3 | 40% | 46% |
| NO | 4 | 50% | 36% |
| DET | 3 | 35% | 48% |
| SEA | 4 | 40% | 41% |
| NYG | 4 | 33% | 48% |
| MIN | 3 | 38% | 42% |
| DAL | 3 | 40% | 38% |
| GB | 3 | 40% | 34% |

## 6. Persistence (weeks 1–3 vs. 4–7)

Opponent offense factors, correlation early vs. late:

| LB | S | CB | DL | Plays | Rush share |
|---|---|---|---|---|---|
| 0.1 | 0.08 | 0.17 | 0.27 | 0.18 | 0.34 |

Player stability by group:

| Group | Players | T+A avg r (early vs. late) | Solo share r | Median game-to-game CV |
|---|---|---|---|---|
| LB | 96 | 0.59 | 0.15 | 0.37 |
| S | 74 | 0.3 | -0.05 | 0.44 |
| CB | 81 | 0.08 | 0.19 | 0.46 |
| DL | 35 | -0.12 | 0.22 | 0.44 |

## 7. Vacated tackles (a 6+ T+A teammate in the same unit missing)

| Absent → beneficiary | Cases | Avg change | Share that went up |
|---|---|---|---|
| LB->LB | 31 | 2.19 | 61% |
| LB->S | 39 | 0.39 | 51% |
| S->S | 16 | 1.55 | 56% |
| S->LB | 33 | -0.3 | 45% |
| CB->CB | 2 | -1 | 0% |

Biggest individual bumps (small samples — role notes, not rules):

| Team | Absent | Beneficiary | G without | Avg without | Avg with | Δ |
|---|---|---|---|---|---|---|
| PHI | Zack Baun (LB, 8.5) | Jeremiah Trotter Jr. (LB) | 1 | 15 | 3.8 | 11.3 |
| TEN | Kevin Winston Jr. (S, 8.6) | Tony Adams (S) | 2 | 10.5 | 1 | 9.5 |
| NYG | Tremaine Edmunds (LB, 8.3) | Micah McFadden (LB) | 1 | 10 | 1.3 | 8.7 |
| HOU | Azeez Al-Shaair (LB, 9.7) | Jake Hansen (LB) | 1 | 12 | 4 | 8 |
| GB | Zaire Franklin (LB, 6.8) | Isaiah McDuffie (LB) | 1 | 11 | 3.7 | 7.3 |
| WSH | Leo Chenal (LB, 6) | Sonny Styles (LB) | 3 | 11.3 | 4 | 7.3 |
| SF | Dre Greenlaw (LB, 8.2) | Jaden Dugger (LB) | 1 | 11 | 3.8 | 7.2 |
| GB | Zaire Franklin (LB, 6.8) | Xavier McKinney (S) | 1 | 10 | 3.5 | 6.5 |
| TEN | Kevin Winston Jr. (S, 8.6) | Amani Hooker (S) | 1 | 13 | 6.6 | 6.4 |
| TEN | Amani Hooker (S, 7.7) | Terrell Burgess (S) | 1 | 8 | 1.8 | 6.3 |
| HOU | Reed Blankenship (S, 7.5) | Henry To'oTo'o (LB) | 1 | 10 | 4 | 6 |
| HOU | Henry To'oTo'o (LB, 6) | Jake Hansen (LB) | 4 | 7.5 | 2 | 5.5 |
| HOU | Azeez Al-Shaair (LB, 9.7) | Jalen Pitre (S) | 1 | 9 | 3.8 | 5.3 |
| TEN | Amani Hooker (S, 7.7) | Tony Adams (S) | 1 | 9 | 3.8 | 5.3 |
| CAR | Devin Lloyd (LB, 7.8) | Lathan Ransom (S) | 1 | 8 | 2.8 | 5.2 |
| NYG | Tremaine Edmunds (LB, 8.3) | Ar'Darius Washington (S) | 1 | 7 | 2.2 | 4.8 |
| SF | Marques Sigle (S, 6.5) | Jaden Dugger (LB) | 3 | 7.3 | 2.7 | 4.7 |
| GB | Zaire Franklin (LB, 6.8) | Ty'Ron Hopper (LB) | 1 | 7 | 2.4 | 4.6 |
| GB | Edgerrin Cooper (LB, 7.5) | Isaiah McDuffie (LB) | 3 | 7.3 | 2.8 | 4.6 |
| CAR | Devin Lloyd (LB, 7.8) | Tyrel Dodson (LB) | 1 | 6 | 1.5 | 4.5 |

## 8. Sacks

| Prior sack-game rate | N | Next-week sack rate |
|---|---|---|
| 0% | 876 | 8% |
| 1-25% | 176 | 10% |
| 26-50% | 187 | 18% |
| > 50% | 69 | 38% |
