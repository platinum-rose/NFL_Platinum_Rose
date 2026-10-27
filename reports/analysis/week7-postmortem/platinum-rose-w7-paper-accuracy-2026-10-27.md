# Platinum Rose AI — Week 7 proposal accuracy

Graded 2026-10-27T20:31:21Z from the saved ESPN Week 7 final-game results, player-stat export, and scoring-play export. This covers all 43 paper tickets in `data/official-picks/paper-wagers-2026.json` tagged season 2026/week 7: 177 listed selection legs. These are proposal-only records, not placed wagers; no bankroll or cash P&L is calculated. The card's §7f/§7g player-prop reference menus are not added as official picks; the selected 7h–7l stacks and the 7e/8a slips are included.

## Summary

- **Paper tickets:** 5 fully winning parlays/singles; 38 losing tickets. Both round robins had zero winning combinations, so they are losses at the combination level.
- **Selection legs:** 94 won, 82 lost, 1 void (conditional leg not activated), and 0 unresolved. Excluding the void, raw repeated-leg accuracy is **94/176 (53.4%)**. The same proposition appears in multiple tickets, so this is not a unique-pick or independent-sample rate.
- **Separate Dashboard AI / contest five:** 3/5 ATS—CIN +2.5, GB +3.5, and ATL +3.5 covered; LV +4 and ARI +4.5 did not. This five-pick pool is separate from the 43 ticket records below and is counted independently.
- The round robin accuracy is **0/6 valid winning pairs** for Dog ML (ATL was the only active correct pick; the LV condition was void, reducing the active field to four) and **0/70 winning four-leg combinations** for the Master RR (3 of 8 selections hit).
- Kicker fantasy-points props are graded directionally from final kicking points because the captured sources did not preserve their fantasy scoring rules. Aubrey had 12 kicking points (Over 8.5); Elliott had 3 (Under 6.5 / Over 6.5). Their results clear those thresholds even before any distance bonus; this proxy is recorded in each leg note.
- **Burnt:** Emmett Johnson rushing Over 18.5 (KC @ SEA). No Emmett Johnson entry or rushing stats appear in the saved KC Week 7 final data; under the no-entry rule this grades as 0 rushing yards and a missed Over. The parent four-leg ticket remains a loss.
- **Void:** Las Vegas ML was conditional on Puka Nacua being inactive. ESPN's Week 7 player stats show Nacua played, so that conditional selection was never activated and is excluded from the accuracy denominator.

## Separate five-pick Dashboard AI / SuperContest pool

The locked-card source notes Andy and Amanda confirmed the same five sides as the Dashboard AI proposal. Scoring uses the contest spread and ESPN final scores; this record is separate from the paper-ticket hit counts above.

| Pick | Final score | Result |
|---|---|---|
| CIN +2.5 | CIN 35, BAL 13 | Win |
| GB +3.5 | GB 17, DET 20 | Win |
| ATL +3.5 | SF 20, ATL 29 | Win |
| LV +4 | LAR 35, LV 21 | Loss |
| ARI +4.5 | DEN 30, ARI 16 | Loss |

## Ticket-by-ticket results

| Section | Paper proposal | Ticket result | Selection accuracy |
|---|---|---|---|
| 3 | Platinum Rose AI paper: Single · IND@MIN Under 41.5 | Win | 1 hit / 0 missed |
| 3 | Platinum Rose AI paper: Single · MIA@NYJ Under 39 | Loss | 0 hit / 1 missed |
| 3 | Platinum Rose AI paper: Single · CIN@BAL Under 47 | Loss | 0 hit / 1 missed |
| 3 | Platinum Rose AI paper: Single · GB@DET Green Bay +3.5 | Win | 1 hit / 0 missed |
| 3 | Platinum Rose AI paper: Single · TB@CAR Over 44.5 | Win | 1 hit / 0 missed |
| 3 | Platinum Rose AI paper: Single · KC@SEA Kansas City +3 | Loss | 0 hit / 1 missed |
| 3 | Platinum Rose AI paper: Single · MIA@NYJ New York Jets -4 | Loss | 0 hit / 1 missed |
| 3 | Platinum Rose AI paper: Single · DEN@ARI Arizona +4.5 | Loss | 0 hit / 1 missed |
| 3 | Platinum Rose AI paper: Single · KC@SEA KC ML (Kansas City) | Loss | 0 hit / 1 missed |
| 3 | Platinum Rose AI paper: Single · MIA@NYJ Malik Willis pass TD Under 0.5 | Loss | 0 hit / 1 missed |
| 3 | Platinum Rose AI paper: Single · PIT@NO Aaron Rodgers pass TD Over 1.5 | Loss | 0 hit / 1 missed |
| 4 | Platinum Rose AI paper: Dog ML Round Robin (by 2s) | Loss | 1 hit / 3 missed / 1 void; 0/6 2-leg combos hit |
| 4 | Platinum Rose AI paper: Master Round Robin (8 legs by 4s) | Loss | 3 hit / 5 missed; 0/70 4-leg combos hit |
| 5 | Platinum Rose AI paper: Morning Parlay (SNF cap) | Loss | 2 hit / 2 missed |
| 5 | Platinum Rose AI paper: Afternoon Parlay (SNF cap) | Win | 4 hit / 0 missed |
| 5 | Platinum Rose AI paper: Hybrid A (BEO, no Paris game) | Loss | 3 hit / 1 missed |
| 5 | Platinum Rose AI paper: Hybrid B (BEO, no Paris game) | Loss | 3 hit / 1 missed |
| 7h | Platinum Rose AI paper: Perfect Lottery 13-Leg (best leg from every game) | Loss | 9 hit / 4 missed |
| 7h | Platinum Rose AI paper: Core 7-Leg (highest hit rates, no leg shorter than -200) | Loss | 3 hit / 4 missed |
| 7h | Platinum Rose AI paper: Field-Goal Ticket 7-Leg (red-zone stalls vs wind and TD-heavy scripts) | Loss | 5 hit / 2 missed |
| 7h | Platinum Rose AI paper: QB Pressure Ticket 8-Leg (INTs and sacks taken) | Loss | 5 hit / 3 missed |
| 7h | Platinum Rose AI paper: IDP Tackles Ticket 7-Leg (tackles + assists) | Loss | 5 hit / 2 missed |
| 7h | Platinum Rose AI paper: 7a Morning 6-Leg (early window) | Loss | 2 hit / 4 missed |
| 7h | Platinum Rose AI paper: 7b Afternoon 4-Leg (night leg last) | Win | 4 hit / 0 missed |
| 7i | Platinum Rose AI paper: A Receiving-Yards Core 4-Leg (SNF cap) | Loss | 3 hit / 1 missed |
| 7i | Platinum Rose AI paper: B Plus-Money Ladder 4-Leg (SNF cap) | Loss | 2 hit / 2 missed |
| 7i | Platinum Rose AI paper: C TD Stack 4-Leg (SNF cap) | Loss | 1 hit / 3 missed |
| 7i | Platinum Rose AI paper: D Kicker / Field-Goal Stack 4-Leg (SNF cap) | Loss | 1 hit / 3 missed |
| 7i | Platinum Rose AI paper: E No-DEN/ARI 5-Leg (two per game + SNF cap; Sun 1:10 PM PT, at the direction of Andy) | Loss | 3 hit / 2 missed |
| 7i | Platinum Rose AI paper: F Diversified No-DEN/ARI 5-Leg (five prop types + SNF cap; Sun 1:12 PM PT, at the direction of Andy) | Loss | 3 hit / 2 missed |
| 7j | Platinum Rose AI paper: SNF Island Tier 1 (fresh) | Loss | 2 hit / 2 missed |
| 7j | Platinum Rose AI paper: SNF Island Tier 2 (fresh, diversified) | Loss | 1 hit / 3 missed |
| 7j | Platinum Rose AI paper: SNF Island Tier 3 moonshot (fresh) | Loss | 0 hit / 4 missed |
| 7k | Platinum Rose AI paper: MNF Island Tier 1 (fresh) | Loss | 3 hit / 1 missed |
| 7k | Platinum Rose AI paper: MNF Island Tier 2 (fresh, diversified) | Loss | 3 hit / 2 missed |
| 7k | Platinum Rose AI paper: MNF Island Tier 3 moonshot (fresh) | Loss | 4 hit / 1 missed |
| 7l | Platinum Rose AI paper: MNF Island Tier 1 (BKR-available rebuild) | Loss | 3 hit / 1 missed |
| 7l | Platinum Rose AI paper: MNF Tier 3 shootout alternative | Loss | 2 hit / 3 missed |
| 7l | Platinum Rose AI paper: S1 Kickers' Game 5-Leg | Loss | 3 hit / 2 missed |
| 7l | Platinum Rose AI paper: S2 Dallas Supporting Cast 4-Leg | Loss | 2 hit / 2 missed |
| 7l | Platinum Rose AI paper: S3 Defense 5-Leg (DK tackles board) | Loss | 4 hit / 1 missed |
| 7e | Platinum Rose AI paper: 7e Anytime TD 7-Leg | Loss | 2 hit / 5 missed |
| 7e | Platinum Rose AI paper: 8a First TD 3-Leg | Loss | 0 hit / 3 missed |

The paper ledger now carries the settled ticket result and each leg's actual/stat basis. All 177 selection legs are graded; one conditional leg is void and none remain unresolved. Emmett Johnson's absent final-game row is recorded as 0 rushing yards under the no-entry rule. The leg export has one row per original recommendation: `platinum-rose-w7-paper-leg-grades-2026-10-27.csv`.
