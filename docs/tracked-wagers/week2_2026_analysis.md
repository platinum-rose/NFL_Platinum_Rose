# Week 2 (2026) Post-Mortem — Platinum Rose

*Compiled 2026-09-21 after MNF went final. Source: `data/official-picks/user-placed-wagers-2026.json`, every Week 2 leg graded against ESPN final box scores. Week 1 figures are regraded the same way so the two weeks line up.*

**How to read the leg tables.** Each leg is graded **on its own**, as if it had been a straight bet, regardless of what happened to the ticket around it. Legs that appeared on several tickets count **once** (174 unique Week 2 legs from 211 placed). **Breakeven %** is the average implied probability of the prices actually paid. **Flat ROI** is the return from $1 on each priced leg as a single. 24 Week 2 legs have no per-leg price (mostly Bookmaker parlay/RR legs) and are left out of ROI only.

---

## Executive Summary

| Metric | Week 2 | Week 1 | Season |
|---|---|---|---|
| Tickets (excl. BUF Super Bowl future) | 34 | 27 | 61 |
| Tickets that paid | 3 | 2 | 5 |
| Cash risked | $428.79 | $370.77 | $799.56 |
| Cash returned | $131.24* | $80.56 | $211.80 |
| **Net P&L** | **−$297.55** | −$290.21 | **−$587.76** |
| Unique legs graded | 85-88-1 (49%) | 57-66 (46%) | 142-154-1 (48%) |
| Breakeven on prices paid | ~55% | ~55% | ~55% |

*Includes two round robins estimated from leg prices ($44.83 and $16.39). Bookmaker's settled payout governs.

The legs went 49%, but the prices paid needed about 55%. **Graded as straight bets at the prices actually taken, the Week 2 board loses about 8%.** The parlays then multiplied that edge: 3 of 34 tickets paid, and every straight parlay of 5+ legs lost (0 for 26).

**The three tickets that paid:** the TNF BUF −5 / Over 54 two-leg SGP ($20.12 → $70.02), the Sunday underdog-moneyline 2-team round robin (CLE, LV and CIN hit; ≈$44.83 on $19.95), and the SuperContest-fade 2-team round robin (NYJ, TEN and DAL hit; ≈$16.39 on $15).

---

## Scorecard by bet type (unique legs, graded standalone)

| Type | Week 2 | Season | Season hit / breakeven | Season flat ROI |
|---|---|---|---|---|
| **Tackles + assists** | 6-4 | **9-4** | 69% / 55% | **+22%** (12) |
| **Passing TDs** | 5-1 | **8-3** | 73% / 68% | **+14%** (9) |
| **Moneyline underdog** | 3-3 | 5-10 | 33% / 32% | **+21%** (15) |
| Moneyline favorite | 8-3 | 17-6 | 74% / 71% | +6% (23) |
| Anytime TD (1+) | 13-18 | 23-34 | 40% / 47% | −4% (31) |
| Total — under | 3-4 | 7-7 | 50% / 54% | −9% (12) |
| Rushing yards | 5-8 | 9-11 | 45% / 60% | −14% (13) |
| Receptions | 13-12 | 16-16 | 50% / 59% | −18% (24) |
| Spread favorite | 5-5-1 | 7-7-1 | 50% / 54% | −23% (12) |
| Sacks | 2-2 | 2-3 | 40% / 55% | −24% (5) |
| Receiving yards | 10-12 | 19-22 | 46% / 56% | −27% (30) |
| Interceptions | 0-2 | 1-3 | 25% / 56% | −42% (3) |
| Passing yards | 1-1 | 1-4 | 20% / 56% | −44% (3) |
| **Spread underdog** | 6-10 | **10-20** | 33% / 54% | **−44%** (29) |

By family (season): props 93-102 (−10%), sides 39-43-1 (−14%), totals 10-9 (≈0%). **Defensive props 11-7 (+8%) against offensive props 82-95 (−12%).**

## Scorecard by price paid (season, unique legs)

| Price band | Record | Hit / breakeven | Flat ROI |
|---|---|---|---|
| −200 or shorter | 24-11 | 69% / 73% | −6% (35) |
| −199 to −151 | 6-8 | 43% / 62% | **−32%** (14) |
| −150 to −121 | 25-20 | 56% / 57% | −2% (45) |
| **−120 to −100** | **31-45-1** | **41% / 53%** | **−23% (76)** |
| +100 to +149 | 16-17 | 48% / 54% | −11% (33) |
| +150 or longer | 9-16 | 36% / 30% | **+20%** (25) |

**The −120 to −100 band is the biggest leak for the second week running.** It has the most legs (76) and the worst gap between hit rate and breakeven. Week 1 flagged the same band at 45.9%; Week 2 came in at 43%.

## Other cuts (Week 2)

| Cut | Record | Hit / breakeven | Flat ROI |
|---|---|---|---|
| Prop on the team that **won** | 38-30 | 56% / 55% | +3% (62) |
| Prop on the team that **lost** | 20-31 | 39% / 53% | **−22%** (46) |
| TNF (DET@BUF) | 18-5 | 78% | +31% |
| SNF (IND@KC) | 16-10 | 62% | +19% |
| Sunday early window | 21-20-1 | 51% | −1% |
| Sunday late window | 18-33 | 35% | −30% |
| MNF (NYG@LAR) | 12-20 | 38% | −32% |
| Bookmaker legs | 29-26-1 | 53% | −1% |
| BetOnline legs | 56-62 | 47% | −11% |

The game-script split is the strongest Week 2 signal. The same prop types went 56% on the team that won and 39% on the team that lost. The Dart injury on MNF was the extreme case (Giants props 4-10), but it wasn't the only one: Dolphins props went 0-5, Commanders 2-3 and Colts 4-5. The one exception was Detroit at 5-2, in a 41-31 shootout where the losing offense still threw all night. The time-slot rows mostly repeat individual games (MIA@SF 3-12, LV@LAC 2-7 drove the late window), so don't read them as a time-of-day effect.

---

## Game-by-game (unique legs)

| Game | Final | Legs | Note |
|---|---|---|---|
| DET @ BUF (TNF) | BUF 41-31 | **18-5** | Best game of the week. The 2-leg side+total SGP cashed. The 8-leg shootout parlay died on one leg (Shakir 38 vs 44.5 yds). |
| GB @ NYJ | GB 20-17 | 5-1-1 | GB −3 pushed; both Unders and Love 2+ pass TD cashed. |
| CAR @ ATL | CAR 34-3 | 3-1 | Coker 66 yds, Lloyd 9 T+A. Bijan was scoreless. |
| IND @ KC (SNF, OT) | KC 33-30 | 16-10 | Best prop read of the week. The 8-leg SGP went **7/8** (Pierce 1 rec) and the 6-leg went **5/6** (Pierce 11 yds): $1,310 of payout lost on one player. The Under 46.5 side+total leg lost when the game hit 63. |
| WAS @ DAL | DAL 37-20 | 8-7 | Every WAS +4/+4.5/+5 spread lost; the DAL −4 fade side won. |
| CIN @ HOU | CIN 20-6 | 3-2 | Chase 2 TD, CIN ML and +3.5. Montgomery ATD at −167 missed. |
| SEA @ ARI | SEA 31-7 | 3-4 | JSN 3 TD, McBride TD (×2). Price ATD (×2) and Allgeier missed. |
| CLE @ TB | CLE 23-19 | 2-3 | TB ML at −410 lost outright. Trotter 13 T+A hit. |
| JAX @ DEN | DEN 20-13 | 2-3 | DEN −2.5 ×4 won; JAX +3/+4 lost. Singleton 9 on 9.5, Washington 7 rec. |
| MIN @ CHI | MIN 9-3 | 2-5 | CHI −4/−5 and Caleb ATD lost; Jefferson 3 rec. Under 47.5 won. |
| PHI @ TEN | PHI 24-20 | 3-6 | Both Unders (40/40.5) lost at 44; PHI −6.5 lost by 2.5. |
| LV @ LAC | LV 26-14 | 2-7 | LAC ML at −292 lost outright (11-team and 8-team parlays), and LAC −6.5 sank the official SuperContest card. Mayer, Jeanty and Nailor all missed. |
| MIA @ SF | SF 35-13 | **3-12** | Worst game. MIA +13.5/+14 ×4, Willis INT, Bosa sack, Brooks/Rodriguez tackles, Black rush all lost. Kittle and CMC hit. |
| NYG @ LAR (MNF) | LAR 28-6 | 12-20 | Dart hurt in Q1. See the QB-concentration lesson in `BETTING_LESSONS_LEARNED.md`. |
| NO @ BAL, PIT @ NE | — | 1-1, 2-1 | BAL ML at −379 lost outright. Watt sack and NE ML hit. |

---

## Near misses

**Five tickets died on exactly one leg:**

| Ticket | Price | Would have paid | Killer leg |
|---|---|---|---|
| IND@KC 8-leg SGP (BEO) | +15700 | $940 | Alec Pierce 3+ rec (−159): **1** |
| IND@KC 6-leg SGP (BKR) | +3600 | $370 | Alec Pierce 46+ rec yds: **11** |
| TNF 8-leg shootout | +5500 | $280 | Khalil Shakir 44.5+ rec yds: **38** |
| IND@KC side + total | +253 | $105 | Under 46.5: **63** (OT) |
| TNF 6-leg prop/spread | +1400 | $75 | Goff 1+ INT: **0** |

**Receptions miss by one catch.** 9 of the 12 Week 2 receptions losses finished within 1.5 catches of the line. Winners cleared by +1.8 on average and losers missed by −1.5. Yardage stayed bimodal: receiving yards winners cleared by +34 and losers missed by −19; rushing +40 against −17.

---

## Graveyard — proposed, not placed

Graded from `claude/recommendation-ledger-2026.md`. **Every stack left on the table would have lost, and none came close.**

| Proposal | Price | Result | What killed it |
|---|---|---|---|
| A / A′ core stack (+Pickens) | +2209 / +3973 | ✗ | Mayer 23 yds, K. Allen 1 rec, Singleton 9 T+A |
| B — ATD moonshot | +8962 | ✗ **0 of 5 scored** | Johnston, Evans, Pickens, Rice, Sutton |
| C — stretch + sacks | +16624 | ✗ | Singleton 9, Diggs 5 rec, Crosby 0 sk, Karlaftis 0 sk (Kittle 61+ hit at 80) |
| D — Claude's version (Njoku) | +4554 | ✗ | Rodriguez 8, Crosby 0 sk, Croskey-Merritt 43, **Njoku 1 rec** |
| E — ATD 6 | +14194 | ✗ **0 of 6 scored** | Dobbins, Croskey-Merritt, Achane, Johnston, Evans, Sutton |
| F — tackles/sacks 5 | +4427 | ✗ | Rodriguez 8, Brooks 3, Tuipulotu/Hines-Allen/Q. Williams 0 sacks |
| Clean 6-leg alt to ticket 4 | ≈+7000 | ✗ | Evans 54, Black 25, Allgeier 10, Brooks 3 |
| 🤖 AI paper Master RR ($105) | 4-team RR | ≈$10.41 back | 3 wins + NYJ +3 push → one 4-team combo, reduced to 3 |

**All 12 ledger divergences (D1–D12) grade IRRELEVANT:** a leg shared by both versions missed on every ticket, so neither Claude's nor Andy's version would have paid. **Claude's own afternoon picks were the weak link, not Andy's changes.** The divergent legs Andy added or kept went 5-6 (CMC, Pickens, Taylor, McBride and A. Williams hit). The Claude picks everyone agreed on mostly missed: Rodriguez 8, Black 25, Allgeier 10, Bosa 0 sacks, Mayer 23, and Keenan Allen 1 catch after Claude picked him over Tyler Warren, who scored.

**The ATD moonshots were 0 for 11 on scorers** across B and E. The anytime-TD market overall is close to fair (−4% flat), and +150-or-longer prices are the one band showing a profit. So a single long-priced TD is fine, but stacking five or six of them is a lottery ticket.

---

## Patterns to use for Week 3

Ranked by how much evidence is behind each one. Two weeks is still a small sample, so the season sample size is shown for each.

1. **Stop using the −120 to −100 band as filler** (season 31-45, 41% vs 53% needed, −23%, n=76). Second straight week. Most parlay "connector" legs sit here. If a leg can't be taken at −121 or longer, or at plus money, it shouldn't be on the ticket.
2. **Stop buying points on underdogs** (10-20, −44%, n=29, bad both weeks). If you like a dog, take the moneyline instead. Dog moneylines are 5-10 but **+21%**, and the dog-ML 2-team round robin was one of the week's three winners.
3. **Lean into tackles + assists** (9-4, +22%) and **passing TDs** (8-3, +14%). Keep T+A on BEO and keep sacks separate: sacks are 2-3, and Stack F's three pass rushers all got zero.
4. **Keep props on the side you expect to win** (56% vs 39% this week). You can't know the winner in advance, but your own side read tells you which offense you expect to be ahead. Don't stack an offense you're fading elsewhere, and count each starting QB as one shared risk (the Dart lesson).
5. **Cap heavy moneyline chalk as parlay anchors.** Moneyline favorites at −290 or shorter are 6-4 this season against ~78% implied. TB −410, BAL −379 and LAC −292 all lost outright on Sunday and between them sank the 11-team ML parlay and the 8-team parlay. Each adds a real chance of losing for very little price.
6. **Leg barrier is −350 (Andy's call, 2026-09-21).** The old −150 cap came from a Claude session, not from Andy. Keep the numbers in view: legs at −200 or shorter hit 69% vs 73% implied (−6% flat), and −151 to −199 went 6-8 (−32%). Heavy legs are useful stack material, but each one is a real bust risk for a small price bump, so flag any stack carrying more than two legs shorter than −200.
7. **Build more 2-leg tickets and 2-team round robins.** All three winners this week were 2-leg or 2-team structures, and 0 of 26 straight parlays with 5+ legs cashed. The best reads (SNF legs went 16-10) are being lost to one bad leg in 7- and 8-leg tickets. Format (5-selection prop RR and 6-selection dog-ML RR, 2u each) is in `NFL_WEEKLY_CARD_PROCESS.md` → "2-team round robin format".
8. **Price receptions honestly.** They're a coin flip at 50%, but the prices paid imply 59%, and misses usually come down to one catch. Take fewer of them, and only for players with a proven target share on the side you expect to win.

**Watch list (interesting but thin):** defensive props overall (+8%, n=17), Bookmaker legs ahead of BetOnline (53% vs 47%), both weeks' Unders around breakeven.

---

## Data notes

- Tyler Higbee ATD and Mike Gesicki receiving yards were both graded LOST: neither appears in the final box score. Standing grading rule (Andy): a player missing from the final box score means the leg lost.
- Round-robin returns are estimated from logged leg prices and stake per combination. Confirm against Bookmaker's settlement.
- Week 1 figures here are unique-leg regrades and won't exactly match `week1_2026_analysis.md`, which counted every placed leg.
- The game-script cut uses Week 2 finals only (Week 1 legs weren't tagged the same way).
