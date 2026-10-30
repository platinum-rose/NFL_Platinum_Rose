# Defensive props research — 2026 through Week 7

Generated 2026-10-30T05:35:04.928Z. Source: ESPN game summaries (107 completed games). Tackles+assists = ESPN "TOT". Players listed need 3+ games.

## How to read this
- **Hit rate N+** = share of games the player reached N or more tackles+assists. Compare with the prop price's implied probability.
- **Opp group factor** = how many T+A this week's opponent offense gives to that position group vs. league average (1.20 = 20% more).
- **Crew factor** = home scorer's assist-crediting tendency, applied to the assist share of the player's average. Assists are the noisiest part of a T+A line.
- **Proj** = season average − 0.3 (defenders regress about that much week to week), plus a vacated-tackle bump when a 6+ T+A teammate in the unit is out (LB→LB +1.4, S→S +1.6, LB→S +0.4). Opponent and crew factors are shown for reference only: the backtests found they added error.
- **Compare book lines to the average, not the median.** Walk-forward over Weeks 3–7: a line 1 tackle under the average went over 63% of the time; 1 over, 31%. When the average sits 0.5+ above the median, a median-based line went over 69%.
- **↑role** = snap share jumped to 80%+ last game (25+ pts over his season share). Projection blends the season average with T+A per snap × new share × 63 plays, in place of the vacated bump.
- **Hit %** columns are calibrated (0.10 + 0.67 × raw season rate), because raw rates ran hot at the top and cold at the bottom in the backtest.
- **Line rule of thumb:** a book line half a tackle under the player's median went over 49% of the time — season form alone is not an edge. Edges come from opponent snap volume (more opponent plays = more tackles) and vacated tackles.

## Week 8 matchup sheet (top 60 by projection)

Gated on the ESPN roster (2026-10-29T15:40:31.105239+00:00) and player availability (2026-10-29T23:30:01.795Z): OUT/IR/PUP/Suspended/Doubtful and players no longer on the active roster are removed (29 removed). Questionable players are marked Q; players now on a new team are marked *. This is a research screen, not the strict pre-publication roster gate.

| Game | Player | Pos | Avg | L3 | Med | Opp× | Crew× | Proj | Cal 4+ | Cal 5+ | Cal 6+ | Cal 7+ | Cal 8+ | Sack% | Vacated by |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KC @ DEN | Alex Singleton (DEN) | LB | 12.43 | 13.33 | 13 | 1.07 | 0.97 | **12.1** | 77% | 77% | 77% | 77% | 77% | 14% |  |
| ATL @ TB | Josiah Trotter (TB) | LB | 10.33 | 9.67 | 10.5 | 1.05 | 1 | **10** | 77% | 77% | 77% | 77% | 66% | 17% |  |
| NE @ MIA | Jacob Rodriguez (MIA) | LB | 10.17 | 11 | 9.5 | 1.07 | 1.14 | **9.9** | 77% | 66% | 66% | 55% | 55% | 0% |  |
| KC @ DEN | Nick Bolton (KC) | LB | 9.83 | 10.33 | 11 | 0.89 | 0.97 | **9.5** | 77% | 66% | 66% | 66% | 66% | 0% |  |
| TEN @ CIN | Anthony Hill Jr. (TEN) | LB | 9.71 | 8.67 | 9 | 1.06 | 0.84 | **9.4** | 77% | 77% | 68% | 68% | 68% | 0% |  |
| LV @ NYJ | Nakobe Dean (LV) | LB | 9.71 | 12 | 12 | 0.87 | 1.02 | **9.4** | 77% | 77% | 68% | 58% | 58% | 29% |  |
| CHI @ SEA | Ernest Jones IV (SEA) | LB | 9.71 | 9 | 9 | 1.11 | 0.95 | **9.4** | 77% | 77% | 77% | 77% | 77% | 43% |  |
| CAR @ GB | Evan Williams (GB) | S | 8.71 | 9 | 9 | 0.99 | 0.93 | **9** | 77% | 77% | 77% | 68% | 48% | 14% | Edgerrin Cooper (LB 7.5, played 57% of his games); Zaire Franklin (LB 6.83, played 86% of his games) |
| CLE @ PIT | Carson Schwesinger (CLE) Q | LB | 9.14 | 9.67 | 9 | 0.95 | 1.06 | **8.8** | 77% | 77% | 77% | 68% | 68% | 14% |  |
| MIN @ DET | Jack Campbell (DET) | LB | 9 | 11.67 | 9 | 0.87 | 0.97 | **8.7** | 77% | 77% | 77% | 55% | 44% | 0% |  |
| MIN @ DET | Blake Cashman (MIN) | LB | 9 | 9.67 | 8.5 | 1.05 | 0.97 | **8.7** | 77% | 77% | 77% | 77% | 66% | 67% |  |
| LV @ NYJ | Minkah Fitzpatrick (NYJ) | S | 9 | 6.67 | 7.5 | 1.08 | 1.02 | **8.7** | 77% | 77% | 44% | 44% | 44% | 0% |  |
| CLE @ PIT | Payton Wilson (PIT) | LB | 8.71 | 9 | 9 | 0.98 | 1.05 | **8.4** | 77% | 77% | 77% | 48% | 48% | 14% |  |
| NE @ MIA | Jordyn Brooks (MIA) | LB | 8.67 | 10 | 9 | 1.07 | 1.14 | **8.4** | 66% | 66% | 66% | 66% | 66% | 0% |  |
| TEN @ CIN | Kevin Winston Jr. (TEN) | S | 8.6 | 8.33 | 8 | 0.92 | 0.89 | **8.3** | 77% | 64% | 64% | 64% | 50% | 0% |  |
| IND @ JAX | Akeem Davis-Gaither (IND) | LB | 8.57 | 7.67 | 8 | 0.9 | 1.01 | **8.3** | 77% | 77% | 77% | 77% | 48% | 0% |  |
| LAC @ LAR | Nate Landman (LAR) Q | LB | 8.5 | 11 | 9 | 1.1 | 1.02 | **8.2** | 66% | 66% | 66% | 66% | 55% | 0% |  |
| PHI @ WAS | Zack Baun (PHI) | LB | 8.5 | 8.67 | 9 | 1 | 1 | **8.2** | 77% | 66% | 66% | 55% | 55% | 0% |  |
| TEN @ CIN | Barrett Carter (CIN) | LB | 8.33 | 10.33 | 8.5 | 0.95 | 0.85 | **8** | 77% | 77% | 66% | 55% | 55% | 33% |  |
| TEN @ CIN | Demetrius Knight Jr. (CIN) | LB | 8.33 | 7.33 | 8 | 0.95 | 0.85 | **8** | 77% | 77% | 77% | 66% | 55% | 0% |  |
| LV @ NYJ | Dane Belton (NYJ) | S | 8 | 8.67 | 8 | 1.08 | 1.02 | **7.7** | 68% | 68% | 68% | 58% | 48% | 14% |  |
| KC @ DEN | Drue Tranquill (KC) | LB | 8 | 8.67 | 7 | 0.89 | 0.97 | **7.7** | 77% | 77% | 77% | 77% | 32% | 0% |  |
| BAL @ BUF | Roquan Smith (BAL) Q | LB | 7.86 | 7 | 8 | 1.04 | 0.98 | **7.6** | 77% | 77% | 68% | 58% | 58% | 29% |  |
| CAR @ GB | Devin Lloyd (CAR) | LB | 7.8 | 5.67 | 9 | 0.72 | 0.93 | **7.5** | 77% | 50% | 50% | 50% | 50% | 40% |  |
| CAR @ GB | Isaiah McDuffie (GB) ↑role | LB | 4.71 | 7.33 | 4 | 0.89 | 0.91 | **7.4** | 58% | 39% | 29% | 19% | 19% | 0% | Edgerrin Cooper (LB 7.5, played 57% of his games); Zaire Franklin (LB 6.83, played 86% of his games) |
| BAL @ BUF | Dorian Williams (BUF) | LB | 7.67 | 7.33 | 8.5 | 0.95 | 0.98 | **7.4** | 77% | 77% | 66% | 55% | 55% | 0% |  |
| TEN @ CIN | Amani Hooker (TEN) | S | 7.67 | 8 | 6 | 0.92 | 0.9 | **7.4** | 77% | 77% | 66% | 32% | 32% | 0% |  |
| LV @ NYJ | Jamien Sherwood (NYJ) | LB | 7.71 | 7.67 | 8 | 1.02 | 1.03 | **7.4** | 77% | 58% | 58% | 48% | 48% | 0% |  |
| BAL @ BUF | Terrel Bernard (BUF) | LB | 7.5 | 7.67 | 7 | 0.95 | 0.98 | **7.2** | 77% | 77% | 55% | 55% | 32% | 0% |  |
| LV @ NYJ | Quay Walker (LV) | LB | 7.43 | 7.33 | 6 | 0.87 | 1.03 | **7.1** | 77% | 68% | 68% | 39% | 39% | 29% |  |
| KC @ DEN | Brandon Jones (DEN) Q | S | 7.43 | 7 | 8 | 0.9 | 0.98 | **7.1** | 77% | 68% | 48% | 48% | 48% | 0% |  |
| CAR @ GB | Bobby Okereke (CAR) | LB | 7.33 | 8.33 | 7.5 | 0.72 | 0.94 | **7** | 77% | 66% | 66% | 55% | 44% | 17% |  |
| NE @ MIA | Christian Elliss (NE) | LB | 7.29 | 8.67 | 6 | 0.9 | 1.11 | **7** | 68% | 58% | 58% | 39% | 29% | 14% |  |
| BAL @ BUF | Cole Bishop (BUF) | S | 7.17 | 8.33 | 7 | 1.06 | 0.98 | **6.9** | 77% | 77% | 66% | 55% | 21% | 0% |  |
| BAL @ BUF | Kyle Hamilton (BAL) Q | S | 7.14 | 5.67 | 7 | 1.14 | 0.99 | **6.8** | 77% | 68% | 58% | 48% | 29% | 0% |  |
| CLE @ PIT | Quincy Williams (CLE) | LB | 7.14 | 9 | 6 | 0.95 | 1.04 | **6.8** | 77% | 58% | 58% | 39% | 39% | 14% |  |
| ARI @ DAL | Jack Gibbens (ARI) | LB | 7 | 5.67 | 7 | 0.9 | 0.93 | **6.7** | 68% | 68% | 68% | 68% | 39% | 14% |  |
| ATL @ TB | Kendal Daniels (ATL) Q ↑role | LB | 5.71 | 8.67 | 4 | 1.16 | 1 | **6.7** | 58% | 39% | 39% | 39% | 29% | 14% |  |
| IND @ JAX | Foyesade Oluokun (JAX) | LB | 7 | 8.33 | 7 | 0.98 | 1.01 | **6.7** | 77% | 66% | 66% | 55% | 32% | 0% |  |
| LAC @ LAR | Quentin Lake (LAR) | S | 7 | 6.67 | 7 | 0.9 | 1.02 | **6.7** | 77% | 77% | 77% | 48% | 19% | 0% |  |
| LAC @ LAR | Derwin James Jr. (LAC) Q | S | 7 | 7 | 7 | 1.06 | 1.02 | **6.7** | 77% | 55% | 55% | 55% | 32% | 0% |  |
| PHI @ WAS | Jihaad Campbell (PHI) Q | LB | 7 | 4 | 9 | 1 | 1 | **6.7** | 68% | 68% | 48% | 48% | 48% | 14% |  |
| CHI @ SEA | Drake Thomas (SEA) Q | LB | 7 | 6.33 | 7 | 1.11 | 0.95 | **6.7** | 77% | 77% | 50% | 50% | 37% | 20% |  |
| ARI @ DAL | Caleb Downs (DAL) Q | S | 6.86 | 7 | 7 | 0.94 | 0.95 | **6.6** | 68% | 58% | 48% | 48% | 39% | 14% |  |
| CLE @ PIT | Patrick Queen (PIT) | LB | 6.86 | 6.67 | 7 | 0.98 | 1.06 | **6.6** | 58% | 58% | 48% | 48% | 39% | 14% |  |
| MIN @ DET | D.J. Reed (DET) | CB | 6.83 | 5.67 | 6.5 | 0.89 | 0.98 | **6.5** | 77% | 66% | 66% | 44% | 32% | 0% |  |
| MIN @ DET | Chuck Clark (DET) | S | 6.83 | 6.67 | 7 | 0.95 | 0.97 | **6.5** | 66% | 66% | 55% | 55% | 32% | 17% |  |
| BAL @ BUF | Trenton Simpson (BAL) | LB | 6.71 | 7 | 7 | 1.04 | 0.98 | **6.4** | 77% | 68% | 68% | 48% | 29% | 14% |  |
| ARI @ DAL | Mack Wilson Sr. (ARI) Q | LB | 6.71 | 6.33 | 7 | 0.9 | 0.93 | **6.4** | 68% | 68% | 68% | 48% | 29% | 0% |  |
| CHI @ SEA | Dillon Thieneman (CHI) | S | 6.71 | 5.67 | 7 | 1.04 | 0.95 | **6.4** | 68% | 68% | 68% | 58% | 29% | 29% |  |
| TEN @ CIN | Tony Adams (TEN) ↑role | S | 4.8 | 7 | 2 | 0.92 | 0.87 | **6.3** | 37% | 37% | 37% | 37% | 37% | 20% |  |
| LV @ NYJ | Demario Davis (NYJ) | LB | 6.57 | 4.67 | 7 | 1.02 | 1.02 | **6.3** | 68% | 48% | 48% | 48% | 39% | 29% |  |
| LV @ NYJ | Jeremy Chinn (LV) | S | 6.57 | 8 | 7 | 1.11 | 1.01 | **6.3** | 77% | 68% | 48% | 48% | 29% | 14% |  |
| MIN @ DET | Christian Izien (DET) | S | 6.5 | 7.67 | 7 | 0.95 | 0.98 | **6.2** | 44% | 44% | 44% | 44% | 44% | 25% |  |
| IND @ JAX | Ventrell Miller (JAX) | LB | 6.5 | 5 | 6.5 | 0.98 | 1.02 | **6.2** | 66% | 66% | 66% | 44% | 21% | 17% |  |
| PHI @ WAS | Cooper DeJean (PHI) | CB | 6.43 | 7.33 | 5 | 1 | 1 | **6.1** | 77% | 77% | 39% | 39% | 29% | 0% |  |
| ARI @ DAL | Budda Baker (ARI) | S | 6.29 | 6.33 | 5 | 1 | 0.94 | **6** | 68% | 58% | 39% | 29% | 29% | 57% |  |
| CLE @ PIT | Jaquan Brisker (PIT) | S | 6.29 | 5.67 | 7 | 1.07 | 1.05 | **6** | 68% | 68% | 68% | 48% | 19% | 0% |  |
| CLE @ PIT | Jalen Ramsey (PIT) | CB | 6.29 | 8.67 | 7 | 0.85 | 1.04 | **6** | 68% | 58% | 48% | 48% | 39% | 14% |  |
| ATL @ TB | Xavier Watts (ATL) | S | 6.29 | 6.67 | 7 | 0.94 | 1 | **6** | 68% | 58% | 48% | 48% | 29% | 14% |  |

## Priced defensive offers (70 matched)

Model probability: calibrated prior hit rate at the threshold (T+A) or the backtested sack map (1+ sack). **Edge** = model − implied. Small samples: treat as a screen, and check role and injury news. Rungs priced under 25% implied went 3 for 81 in the first graded boards.

| Book | Game | Player | Market | Price | Implied | Model | Edge | EV/unit | Line − proj | Vacated by |
|---|---|---|---|---|---|---|---|---|---|---|
| BEO | CAR @ GB | Devin Lloyd (CAR) | T+A 9+ | +250 | 29% | 50% | +21 pts | 0.75 | 1 |  |
| BEO | CAR @ GB | Javon Bullard (GB) | T+A 7+ | +188 | 35% | 48% | +13 pts | 0.382 | 0.9 | Edgerrin Cooper (LB 7.5, played 57% of his games); Zaire Franklin (LB 6.83, played 86% of his games) |
| BEO | CAR @ GB | Javon Bullard (GB) | T+A 6+ | +118 | 46% | 58% | +12 pts | 0.264 | -0.1 | Edgerrin Cooper (LB 7.5, played 57% of his games); Zaire Franklin (LB 6.83, played 86% of his games) |
| BEO | CAR @ GB | Evan Williams (GB) | T+A 10+ | +270 | 27% | 39% | +12 pts | 0.443 | 0.5 | Edgerrin Cooper (LB 7.5, played 57% of his games); Zaire Franklin (LB 6.83, played 86% of his games) |
| BEO | CAR @ GB | Evan Williams (GB) | T+A 9+ | +170 | 37% | 48% | +11 pts | 0.296 | -0.5 | Edgerrin Cooper (LB 7.5, played 57% of his games); Zaire Franklin (LB 6.83, played 86% of his games) |
| BEO | CAR @ GB | Devin Lloyd (CAR) | T+A 8+ | +156 | 39% | 50% | +11 pts | 0.28 | 0 |  |
| BEO | CAR @ GB | Devin Lloyd (CAR) | T+A 11+ | +700 | 13% | 23% | +11 pts | 0.84 | 3 |  |
| BEO | CAR @ GB | Keisean Nixon (GB) | T+A 6+ | +110 | 48% | 58% | +10 pts | 0.218 | -0.3 |  |
| BEO | CAR @ GB | Bobby Okereke (CAR) | T+A 7+ | +114 | 47% | 55% | +8 pts | 0.177 | -0.5 |  |
| BEO | CAR @ GB | Lukas Van Ness (GB) | T+A 7+ | +625 | 14% | 20% | +6 pts | 0.45 | 2.9 |  |
| BEO | CAR @ GB | Evan Williams (GB) | T+A 7+ | -157 | 61% | 67% | +6 pts | 0.097 | -2.5 | Edgerrin Cooper (LB 7.5, played 57% of his games); Zaire Franklin (LB 6.83, played 86% of his games) |
| BEO | CAR @ GB | Keisean Nixon (GB) | T+A 5+ | -157 | 61% | 67% | +6 pts | 0.097 | -1.3 |  |
| BEO | CAR @ GB | Bobby Okereke (CAR) | T+A 8+ | +158 | 39% | 44% | +5 pts | 0.135 | 0.5 |  |
| BEO | CAR @ GB | Xavier McKinney (GB) | T+A 5+ | -124 | 55% | 39% | -16 pts | -0.295 | -0.2 | Edgerrin Cooper (LB 7.5, played 57% of his games); Zaire Franklin (LB 6.83, played 86% of his games) |
| BEO | CAR @ GB | Devin Lloyd (CAR) | T+A 6+ | -209 | 68% | 50% | -18 pts | -0.261 | -2 |  |
| BEO | CAR @ GB | Javon Bullard (GB) | T+A 4+ | -345 | 78% | 58% | -19 pts | -0.252 | -2.1 | Edgerrin Cooper (LB 7.5, played 57% of his games); Zaire Franklin (LB 6.83, played 86% of his games) |
| BEO | CAR @ GB | Isaiah McDuffie (GB) | T+A 10+ | +144 | 41% | 20% | -21 pts | -0.512 | 2.1 | Edgerrin Cooper (LB 7.5, played 57% of his games); Zaire Franklin (LB 6.83, played 86% of his games) |
| BEO | CAR @ GB | Lukas Van Ness (GB) | Sacks 1+ | +150 | 40% | 18% | -22 pts | -0.55 |  |  |
| BEO | CAR @ GB | Nick Scott (CAR) | T+A 8+ | +210 | 32% | 10% | -22 pts | -0.69 | 3 |  |
| BEO | CAR @ GB | Isaiah McDuffie (GB) | T+A 9+ | -106 | 52% | 29% | -22 pts | -0.436 | 1.1 | Edgerrin Cooper (LB 7.5, played 57% of his games); Zaire Franklin (LB 6.83, played 86% of his games) |
| BEO | CAR @ GB | Nick Scott (CAR) | T+A 5+ | -271 | 73% | 50% | -23 pts | -0.315 | 0 |  |
| BEO | CAR @ GB | Tre'von Moehrig (CAR) | T+A 4+ | -358 | 78% | 55% | -23 pts | -0.296 | -0.2 |  |
| BEO | CAR @ GB | Xavier McKinney (GB) | T+A 6+ | +129 | 44% | 20% | -24 pts | -0.542 | 0.8 | Edgerrin Cooper (LB 7.5, played 57% of his games); Zaire Franklin (LB 6.83, played 86% of his games) |
| BEO | CAR @ GB | Xavier McKinney (GB) | T+A 4+ | -271 | 73% | 48% | -25 pts | -0.343 | -1.2 | Edgerrin Cooper (LB 7.5, played 57% of his games); Zaire Franklin (LB 6.83, played 86% of his games) |
| BEO | CAR @ GB | Tre'von Moehrig (CAR) | T+A 7+ | +185 | 35% | 10% | -25 pts | -0.715 | 2.8 |  |
| BEO | CAR @ GB | Tre'von Moehrig (CAR) | T+A 5+ | -148 | 60% | 32% | -28 pts | -0.464 | 0.8 |  |
| BEO | CAR @ GB | Isaiah McDuffie (GB) | T+A 8+ | -213 | 68% | 39% | -29 pts | -0.427 | 0.1 | Edgerrin Cooper (LB 7.5, played 57% of his games); Zaire Franklin (LB 6.83, played 86% of his games) |
| BEO | CAR @ GB | Tre'von Moehrig (CAR) | T+A 6+ | +116 | 46% | 10% | -36 pts | -0.784 | 1.8 |  |

Rows at the bottom (edge ≤ −15 pts) are overs the model says are badly overpriced.

## Offenses: tackle environment they create

League avg offensive plays 62.3. Group factors vs. league.

| Offense | G | Plays | Plays× | Rush share | LB× | S× | CB× | EDGE× | DL× |
|---|---|---|---|---|---|---|---|---|---|
| CHI | 7 | 72.1 | 1.16 | 51% | 1.11 | 1.32 | 1.12 | null | 1.25 |
| LAR | 7 | 68.3 | 1.1 | 40% | 1.13 | 1.06 | 1.21 | null | 0.78 |
| ARI | 7 | 68.4 | 1.1 | 39% | 1.19 | 0.94 | 1.24 | null | 0.96 |
| CAR | 6 | 66 | 1.06 | 39% | 0.89 | 0.99 | 1.07 | null | 1.16 |
| DET | 6 | 66.3 | 1.06 | 42% | 1.05 | 1.18 | 1.11 | null | 1.01 |
| NYG | 7 | 66.1 | 1.06 | 45% | 1.04 | 0.97 | 1.08 | null | 1.25 |
| IND | 7 | 65.6 | 1.05 | 45% | 0.98 | 1.21 | 1.02 | null | 1.13 |
| NO | 7 | 65.6 | 1.05 | 39% | 1.01 | 0.89 | 1.27 | null | 0.84 |
| SEA | 7 | 64 | 1.03 | 48% | 1.17 | 1.04 | 0.93 | null | 0.93 |
| LV | 7 | 64.3 | 1.03 | 40% | 1.02 | 1.08 | 1.02 | null | 0.97 |
| PIT | 7 | 63.9 | 1.02 | 38% | 0.95 | 1.09 | 1.09 | null | 0.98 |
| WSH | 6 | 63.5 | 1.02 | 45% | 1.17 | 0.72 | 0.85 | null | 1.16 |
| DAL | 7 | 62.9 | 1.01 | 37% | 0.9 | 1 | 1.03 | null | 0.92 |
| NE | 7 | 62.4 | 1 | 48% | 1.07 | 0.92 | 0.97 | null | 1.14 |
| TB | 7 | 62.4 | 1 | 51% | 1.16 | 0.94 | 1.16 | null | 0.91 |
| BAL | 7 | 61.7 | 0.99 | 51% | 0.95 | 1.06 | 0.75 | null | 1.45 |
| HOU | 7 | 61.4 | 0.99 | 40% | 0.96 | 1.07 | 0.92 | null | 1.1 |
| LAC | 6 | 61.8 | 0.99 | 48% | 1.1 | 0.9 | 1.05 | null | 0.9 |
| GB | 7 | 61.3 | 0.98 | 35% | 0.72 | 0.83 | 1 | null | 0.79 |
| ATL | 7 | 60.4 | 0.97 | 51% | 1.05 | 1.06 | 0.75 | null | 1.04 |
| JAX | 6 | 60.2 | 0.97 | 48% | 0.9 | 0.75 | 1.33 | null | 0.9 |
| CIN | 6 | 60.5 | 0.97 | 38% | 1.06 | 0.92 | 1.1 | null | 0.86 |
| MIN | 6 | 60.5 | 0.97 | 52% | 0.87 | 0.95 | 0.89 | null | 1.4 |
| BUF | 6 | 59.8 | 0.96 | 51% | 1.04 | 1.14 | 0.8 | null | 0.8 |
| CLE | 7 | 60 | 0.96 | 47% | 0.98 | 1.07 | 0.85 | null | 1.06 |
| KC | 6 | 59.8 | 0.96 | 46% | 1.07 | 0.9 | 1.13 | null | 0.88 |
| SF | 7 | 58.4 | 0.94 | 48% | 1.07 | 1.15 | 0.83 | null | 0.79 |
| PHI | 7 | 58.9 | 0.94 | 40% | 0.79 | 1.06 | 0.8 | null | 0.74 |
| NYJ | 7 | 58.1 | 0.93 | 46% | 0.87 | 1.11 | 1.04 | null | 1.1 |
| DEN | 7 | 57.1 | 0.92 | 44% | 0.89 | 0.7 | 1 | null | 0.84 |
| MIA | 6 | 56.3 | 0.9 | 53% | 0.9 | 1.07 | 0.71 | null | 1.24 |
| TEN | 7 | 54.3 | 0.87 | 44% | 0.95 | 0.82 | 0.86 | null | 0.78 |

## Home stat crews: assist crediting

League assist rate 45% of all T+A.

| Home team | Home G | Assist rate | vs league | T+A per game (both teams) |
|---|---|---|---|---|
| MIA | 2 | 56% | 1.25 | 146 |
| KC | 3 | 52% | 1.15 | 146.3 |
| LV | 4 | 51% | 1.13 | 141.8 |
| PIT | 3 | 50% | 1.1 | 132.7 |
| SF | 4 | 50% | 1.1 | 136.5 |
| CHI | 4 | 48% | 1.06 | 137.3 |
| LAR | 4 | 48% | 1.05 | 141.8 |
| IND | 3 | 47% | 1.05 | 135 |
| TEN | 4 | 47% | 1.05 | 136 |
| NYJ | 3 | 47% | 1.05 | 138.7 |
| ARI | 3 | 47% | 1.05 | 140 |
| HOU | 4 | 47% | 1.04 | 143.5 |
| JAX | 4 | 47% | 1.03 | 130.8 |
| NE | 3 | 47% | 1.03 | 139.7 |
| CAR | 3 | 46% | 1.01 | 138.7 |
| TB | 4 | 45% | 1 | 140.5 |
| LAC | 3 | 45% | 0.99 | 135 |
| CLE | 3 | 45% | 0.99 | 137 |
| WSH | 3 | 45% | 0.99 | 143.7 |
| ATL | 4 | 45% | 0.98 | 142.3 |
| BAL | 3 | 44% | 0.97 | 133.3 |
| PHI | 4 | 44% | 0.96 | 132.8 |
| BUF | 3 | 43% | 0.96 | 134.3 |
| NO | 4 | 43% | 0.95 | 135.3 |
| DEN | 3 | 43% | 0.94 | 133.3 |
| DET | 3 | 42% | 0.93 | 146.3 |
| NYG | 4 | 41% | 0.9 | 136.3 |
| SEA | 4 | 41% | 0.89 | 132.8 |
| MIN | 3 | 40% | 0.89 | 126.7 |
| DAL | 3 | 39% | 0.87 | 132.7 |
| GB | 3 | 38% | 0.83 | 132.3 |
| CIN | 2 | 33% | 0.74 | 130.5 |

## Season leaders (avg T+A, 3+ games)

| Player | Team | Pos | G | Avg | Med | L3 | Solo | Ast | Share | T+A/60 opp plays | Log |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Alex Singleton | DEN | LB | 7 | 12.43 | 13 | 13.33 | 6.14 | 6.29 | 17% | 10.75 | 16, 9, 8, 14, 8, 13, 19 |
| Josiah Trotter | TB | LB | 6 | 10.33 | 10.5 | 9.67 | 5 | 5.33 | 16% | 10.45 | 11, 13, 9, 7, 12, 10 |
| Jacob Rodriguez | MIA | LB | 6 | 10.17 | 9.5 | 11 | 4.33 | 5.83 | 14% | 9.95 | 14, 8, 6, 18, 11, 4 |
| Fred Warner | SF | LB | 7 | 10.14 | 10 | 10.33 | 4.86 | 5.29 | 14% | 9.48 | 11, 5, 17, 7, 10, 8, 13 |
| Nick Bolton | KC | LB | 6 | 9.83 | 11 | 10.33 | 4.83 | 5 | 13% | 9.05 | 4, 13, 11, 9, 11, 11 |
| Ernest Jones IV | SEA | LB | 7 | 9.71 | 9 | 9 | 5.14 | 4.57 | 15% | 9.96 | 13, 8, 8, 12, 9, 9, 9 |
| Anthony Hill Jr. | TEN | LB | 7 | 9.71 | 9 | 8.67 | 3.57 | 6.14 | 13% | 8.9 | 16, 10, 8, 8, 5, 9, 12 |
| Nakobe Dean | LV | LB | 7 | 9.71 | 12 | 12 | 5.14 | 4.57 | 14% | 9.12 | 6, 9, 12, 5, 12, 12, 12 |
| Azeez Al-Shaair | HOU | LB | 6 | 9.67 | 10 | 9 | 3.67 | 6 | 14% | 9.43 | 8, 12, 11, 11, 7, 9 |
| Carson Schwesinger | CLE | LB | 7 | 9.14 | 9 | 9.67 | 3.71 | 5.43 | 14% | 8.91 | 10, 10, 6, 9, 8, 13, 8 |
| Jack Campbell | DET | LB | 6 | 9 | 9 | 11.67 | 4.83 | 4.17 | 13% | 7.71 | 7, 6, 6, 13, 11, 11 |
| Blake Cashman | MIN | LB | 6 | 9 | 8.5 | 9.67 | 5 | 4 | 15% | 10.01 | 7, 10, 8, 8, 9, 12 |
| Minkah Fitzpatrick | NYJ | S | 4 | 9 | 7.5 | 6.67 | 4.75 | 4.25 | 11% | 7.3 | 16, 5, 5, 10 |
| Payton Wilson | PIT | LB | 7 | 8.71 | 9 | 9 | 4.71 | 4 | 12% | 8.52 | 13, 6, 6, 9, 10, 11, 6 |
| Evan Williams | GB | S | 7 | 8.71 | 9 | 9 | 5.29 | 3.43 | 12% | 7.87 | 7, 10, 10, 7, 12, 6, 9 |
| Jordyn Brooks | MIA | LB | 6 | 8.67 | 9 | 10 | 3.67 | 5 | 12% | 8.77 | 9, 3, 10, 13, 8, 9 |
| Kevin Winston Jr. | TEN | S | 5 | 8.6 | 8 | 8.33 | 4.8 | 3.8 | 11% | 7.99 | 10, 8, 4, 7, 14 |
| Akeem Davis-Gaither | IND | LB | 7 | 8.57 | 8 | 7.67 | 4.43 | 4.14 | 13% | 8.81 | 8, 14, 7, 8, 7, 9, 7 |
| Nate Landman | LAR | LB | 6 | 8.5 | 9 | 11 | 4.5 | 4 | 13% | 8.46 | 8, 7, 3, 10, 13, 10 |
| Zack Baun | PHI | LB | 6 | 8.5 | 9 | 8.67 | 4 | 4.5 | 12% | 7.69 | 12, 4, 9, 11, 6, 9 |
| Barrett Carter | CIN | LB | 6 | 8.33 | 8.5 | 10.33 | 3.67 | 4.67 | 12% | 8.34 | 8, 5, 6, 11, 11, 9 |
| Demetrius Knight Jr. | CIN | LB | 6 | 8.33 | 8 | 7.33 | 3.5 | 4.83 | 12% | 8 | 7, 12, 9, 6, 8, 8 |
| Tremaine Edmunds | NYG | LB | 6 | 8.33 | 9 | 9 | 5.33 | 3 | 13% | 8.38 | 8, 5, 10, 9, 9, 9 |
| Dre Greenlaw | SF | LB | 6 | 8.17 | 8 | 9 | 3.67 | 4.5 | 11% | 7.75 | 6, 8, 8, 12, 3, 12 |
| Dane Belton | NYJ | S | 7 | 8 | 8 | 8.67 | 4.14 | 3.86 | 11% | 7.23 | 3, 6, 7, 14, 8, 9, 9 |
| Arvell Reese | NYG | LB | 7 | 8 | 7 | 7.33 | 5.57 | 2.43 | 13% | 8.16 | 5, 7, 13, 9, 9, 6, 7 |
| Drue Tranquill | KC | LB | 6 | 8 | 7 | 8.67 | 3.67 | 4.33 | 11% | 7.55 | 7, 8, 7, 7, 7, 12 |
| Roquan Smith | BAL | LB | 7 | 7.86 | 8 | 7 | 3.43 | 4.43 | 12% | 7.95 | 11, 8, 9, 6, 8, 5, 8 |
| Devin Lloyd | CAR | LB | 5 | 7.8 | 9 | 5.67 | 4.8 | 3 | 12% | 7.02 | 13, 9, 9, 4, 4 |
| Pete Werner | NO | LB | 7 | 7.71 | 8 | 9.67 | 3.71 | 4 | 11% | 7.18 | 7, 11, 3, 4, 10, 11, 8 |
| Jamien Sherwood | NYJ | LB | 7 | 7.71 | 8 | 7.67 | 3.86 | 3.86 | 11% | 7.04 | 4, 6, 8, 13, 4, 11, 8 |
| Dorian Williams | BUF | LB | 6 | 7.67 | 8.5 | 7.33 | 3.5 | 4.17 | 10% | 6.68 | 9, 6, 9, 8, 9, 5 |
| Amani Hooker | TEN | S | 6 | 7.67 | 6 | 8 | 4.83 | 2.83 | 10% | 6.86 | 10, 6, 6, 6, 13, 5 |
| Sonny Styles | WSH | LB | 6 | 7.67 | 6.5 | 11.33 | 3.67 | 4 | 11% | 7.02 | 4, 3, 5, 8, 13, 13 |
| Terrel Bernard | BUF | LB | 6 | 7.5 | 7 | 7.67 | 4.17 | 3.33 | 10% | 6.56 | 12, 5, 5, 7, 7, 9 |
| Reed Blankenship | HOU | S | 6 | 7.5 | 7.5 | 8 | 4.17 | 3.33 | 11% | 7.08 | 7, 5, 9, 11, 8, 5 |
| Kaden Elliss | NO | LB | 4 | 7.5 | 7.5 | 7 | 3.75 | 3.75 | 11% | 7.03 | 9, 6, 9, 6 |
| Edgerrin Cooper | GB | LB | 4 | 7.5 | 7.5 | 7.67 | 4.5 | 3 | 10% | 6.96 | 7, 8, 6, 9 |
| Quay Walker | LV | LB | 7 | 7.43 | 6 | 7.33 | 3.29 | 4.14 | 11% | 7.09 | 6, 10, 8, 6, 4, 6, 12 |
| Brandon Jones | DEN | S | 7 | 7.43 | 8 | 7 | 4.43 | 3 | 10% | 6.27 | 5, 5, 12, 9, 4, 8, 9 |
| Bobby Okereke | CAR | LB | 6 | 7.33 | 7.5 | 8.33 | 4.67 | 2.67 | 11% | 6.84 | 6, 9, 4, 7, 8, 10 |
| Christian Elliss | NE | LB | 7 | 7.29 | 6 | 8.67 | 4.14 | 3.14 | 11% | 7.23 | 4, 12, 3, 6, 7, 6, 13 |
| Cole Bishop | BUF | S | 6 | 7.17 | 7 | 8.33 | 4 | 3.17 | 10% | 6.22 | 7, 6, 5, 7, 11, 7 |
| Kyle Hamilton | BAL | S | 7 | 7.14 | 7 | 5.67 | 5 | 2.14 | 11% | 7.03 | 5, 13, 8, 7, 6, 7, 4 |
| Quincy Williams | CLE | LB | 7 | 7.14 | 6 | 9 | 4.29 | 2.86 | 10% | 6.73 | 4, 6, 9, 4, 11, 6, 10 |
| Drake Thomas | SEA | LB | 5 | 7 | 7 | 6.33 | 4 | 3 | 11% | 7.01 | 9, 7, 9, 5, 5 |
| Quentin Lake | LAR | S | 7 | 7 | 7 | 6.67 | 4.57 | 2.43 | 10% | 6.87 | 10, 7, 6, 6, 6, 7, 7 |
| Foyesade Oluokun | JAX | LB | 6 | 7 | 7 | 8.33 | 4.33 | 2.67 | 11% | 7.04 | 4, 7, 6, 7, 10, 8 |
| Jack Gibbens | ARI | LB | 7 | 7 | 7 | 5.67 | 3 | 4 | 11% | 7.36 | 7, 9, 8, 8, 3, 7, 7 |
| Derwin James Jr. | LAC | S | 3 | 7 | 7 | 7 | 4 | 3 | 10% | 6.38 | 10, 7, 4 |
