# Platinum Rose AI: Week 8 proposal accuracy (2026-11-04)

Graded from the saved ESPN Week 8 finals (`data/fantasy/boxscores/`). This covers all 24 paper tickets in `data/official-picks/paper-wagers-2026.json`
tagged season 2026 / week 8: 98 listed legs. These are proposals, not placed wagers; no bankroll or cash P&L is calculated.
Leg export: `platinum-rose-w8-paper-leg-grades-2026-11-04.csv` (stored status next to an independent re-grade).

## Summary

- **Paper tickets:** 4 winning, 20 losing.
- **Legs:** 38 won, 60 lost. Raw repeated-leg accuracy **38/98 (38.8%)**. Week 7 was 94/176 (53.4%).
  The same proposition appears on several tickets, so this isn't an independent-sample rate.
- **Re-grade check:** an independent re-grade agrees with the stored status on 87 of 98 legs. Of the other 11, 7 were legs the
  re-grader can't parse (`pass_td`, 2+ TD), checked by hand against the box score, and all stored grades are correct (ESPN lists Cam Ward as "Cam Ward";
  he threw 2 TDs). One was a re-grader bug (Goff Under 0.5 INT: Goff threw 1 INT, stored LOST is correct; the re-grader read his *defensive* INTs).
  The last 2 were **PENDING legs that resolve to LOST**: Lamar Jackson Over 1.5 pass TD (0/1 passing before injury), on the core 8-leg and perfect-lottery 13-leg templates.
  Both tickets were already losses. The paper file still shows PENDING for these two legs (it's a ledger edit, so it waits for Andy's OK).
- **Theme:** the Lamar return was the week's biggest miss. BAL legs built on Lamar (pass TDs, Flowers yardage) failed when he left early and BUF won 36-10.

## Patterns (unique propositions, not repeated legs)

Repeated legs inflate both sides, so count each proposition once:

| Market | Unique W-L | Repeated-leg W-L | Biggest repeat |
|---|---|---|---|
| Rushing yards | **6-1** | 15-1 | Bo Nix u15.5 (x4, won) |
| Receptions | **0-4** | 0-10 | Chig Okonkwo o3.5 (x5, lost); St. Brown o7.5 (x3) |
| Receiving yards | **0-2** | 0-5 | Jaylen Warren o24.5 (x4, lost) |
| Game totals | **1-4** | 3-12 | Over 55 BAL@BUF (x4) and Under 54.5 ARI@DAL (x4) both lost |

- **Rushing props were the sharpest lane.** Both QB rushing unders (Nix, Caleb Williams) and the RB unders (Bijan, Taylor) hit.
  That fits Andy's standing preference for QB rushing props when they fit the matchup.
- **One bad read gets amplified when it's reused on 4-5 templates** (Okonkwo, Warren, the two totals). For Week 9: cap any single
  proposition at 2-3 templates unless it's a top-conviction leg.
- These are small samples with no significance claim. Look at whether the rushing-lane edge holds over Weeks 4-9 before weighting it.

## By market

| Market | Won | Lost | Hit rate |
|---|---:|---:|---:|
| rushing_yards | 15 | 1 | 94% |
| total | 3 | 12 | 20% |
| receptions | 0 | 10 | 0% |
| anytime_touchdown | 5 | 5 | 50% |
| moneyline | 5 | 4 | 56% |
| passing_yards | 2 | 5 | 29% |
| pass_td | 2 | 3 | 40% |
| spread | 2 | 3 | 40% |
| receiving_yards | 0 | 5 | 0% |
| pass_completions | 0 | 4 | 0% |
| passing_touchdowns | 2 | 2 | 50% |
| first_touchdown | 1 | 2 | 33% |
| two_plus_touchdowns | 0 | 3 | 0% |
| interceptions | 0 | 1 | 0% |
| kicking_points | 1 | 0 | 100% |

## Ticket-by-ticket results

| Section | Paper proposal | Odds | Ticket result | Legs |
|---|---|---|---|---|
| 3 | Platinum Rose AI paper: Single ARI@DAL Under 54.5 | -108 | Loss | 0 hit / 1 missed |
| 3 | Platinum Rose AI paper: Single BAL@BUF Over 55 | -101 | Loss | 0 hit / 1 missed |
| 3 | Platinum Rose AI paper: Single IND@JAX Under 46 | -103 | Loss | 0 hit / 1 missed |
| 3 | Platinum Rose AI paper: Single NE@MIA Under 43.5 | -111 | Win | 1 hit / 0 missed |
| 4 | Platinum Rose AI paper: Afternoon Parlay (optional SNF-cap template) | +1820 | Loss | 2 hit / 3 missed |
| 4 | Platinum Rose AI paper: Morning Parlay (optional SNF-cap template) | +1346 | Loss | 2 hit / 3 missed |
| 4b | Platinum Rose AI paper: Dog ML Round Robin (by 2s) |  | Win | 2 hit / 3 missed |
| 4b | Platinum Rose AI paper: Master Round Robin (8 legs by 4s) |  | Loss | 2 hit / 6 missed |
| 5 | Platinum Rose AI paper: 7a Morning Props (BEO template) | +1445 | Loss | 1 hit / 3 missed |
| 5 | Platinum Rose AI paper: 7b Afternoon Props (BEO template) | +1457 | Loss | 2 hit / 2 missed |
| 5 | Platinum Rose AI paper: 7d Hybrid 8-leg (BEO template) | +24934 | Loss | 3 hit / 5 missed |
| 5 | Platinum Rose AI paper: 7e Anytime TD 7-leg (BEO template) | +32931 | Loss | 3 hit / 4 missed |
| 5 | Platinum Rose AI paper: 8a First TD 3-leg (BEO template) | +14468 | Loss | 1 hit / 2 missed |
| 5 | Platinum Rose AI paper: 8b 2+ TD 3-leg (BEO template) | +13987 | Loss | 0 hit / 3 missed |
| 5 | Platinum Rose AI paper: Core 8-Leg (BEO template) | +25093 | Loss | 2 hit / 6 missed |
| 5 | Platinum Rose AI paper: Perfect Lottery 13-leg (BEO template) | +723633 | Loss | 5 hit / 8 missed |
|  | Platinum Rose AI paper: MNF Bears passing game held down (3-leg SGP) | +498 | Loss | 2 hit / 1 missed |
|  | Platinum Rose AI paper: MNF Seattle volume (3-leg SGP) | +632 | Loss | 1 hit / 2 missed |
|  | Platinum Rose AI paper: MNF Bears cover, low score (3-leg SGP) | +646 | Loss | 2 hit / 1 missed |
|  | Platinum Rose AI paper: MNF MNF touchdown builder, 7e style (3-leg SGP) | +647 | Loss | 2 hit / 1 missed |
|  | Platinum Rose AI paper: MNF Safer 2-leg (SGP) | +210 | Win | 2 hit / 0 missed |
| pick6-bonus-v1 | Platinum Rose AI paper: Pick 6 v1 Entry A (2-pick) |  | Loss | 0 hit / 2 missed |
| pick6-bonus-v1 | Platinum Rose AI paper: Pick 6 v1 Entry B (2-pick) |  | Win | 2 hit / 0 missed |
| pick6-bonus-v2-stack1 | Platinum Rose AI paper: Pick 6 Stack 1 (3-pick, rejected) |  | Loss | 1 hit / 2 missed |
