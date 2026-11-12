# Week 10 futures portfolio review (Tue 11/10, ~8:45 PM PT)

Research only; nothing placed. Ledger: `data/futures-imports/andy-portfolio-ledger-2026.json` (last updated 11/07). Prices: BetOnline futures board 11/10 10:00 AM PT (`data/futures-imports/betonline-2026-11-10.json`), vig removed. Matrix script: `reports/bets/futures_matrix_w10.py` (output `futures-matrix-w10-2026-11-10.json`). Matchup tickets pay if both teams reach the Super Bowl, whoever wins.

## Where the portfolio stands
- **Super Bowl book:** $439.84 staked across 2 SB-winner positions (BUF $59.09 at a blended +992; GB $69.12 at a blended +3867) and 26 matchup tickets. Side bets: BUF Over 10.5 wins ($20 at -135) and GB to make the playoffs ($20 at -120).
- **Expected value at today's BEO prices: +$186.** The tickets were bought at better prices than today's (BUF +992 vs +590 now; GB +3867 vs +2000 now).
- **But it pays only in about 29% of Super Bowls.** In ~71% (probability-weighted) the whole $440 is lost. That's by design (big positions, gaps left for later hedges), and the $1,070 of open-parlay equity is the hedge resource for those gaps.
- **Side bets:** BUF is 7-1, so Over 10.5 needs 4 wins in 9 games: close to safe. GB is 6-3: playoffs Yes is on track.
- **Free money available:** $26.40 BEO VIP Reloads + $17.39 BUF-only credit (Bills free-bet win) = **$43.79**.

## Branch view (given the team reaches the Super Bowl)
| Team | Record | Reach SB (BEO, no vig) | SB price | Expected net if it gets there | Chance that SB loses money |
|---|---|---:|---:|---:|---:|
| **Green Bay** | 6-3 | 7.2% | +2000 | **+$4,377** | 4% |
| **Buffalo** | 7-1 | 22.7% | +590 | **+$1,138** | 16% |
| Kansas City | 6-2 | 14.3% | +1100 | +$289 | 65% |
| Seattle | 5-4 | 8.9% | +2000 | +$234 | 49% |
| Chicago | 7-2 | 18.6% | +900 | +$58 | 63% |
| Cincinnati | 6-2 | 13.8% | +1400 | -$80 | 84% |
| San Francisco | 7-1 | **24.8%** | +585 | **-$158** | 77% |
| Denver | 7-2 | 11.0% | +1800 | -$156 | 93% |
| Rams | 5-4 | 10.9% | +1400 | -$221 | 88% |
| **Jacksonville** | 6-2 | **20.7%** | +750 | **-$240** | **93%** |
| Detroit | 6-2 | 9.8% | +1800 | -$265 | 87% |
| Minnesota | 6-2 | 6.2% | +2800 | -$356 | 87% |

**The two biggest holes are the two likeliest finalists outside BUF:** San Francisco (NFC favorite, only the SF/BUF matchup) and Jacksonville (AFC #2, only GB/JAX). Both are also teams our numbers like: JAX is #1 by SRS through Week 9 with the 3rd-easiest remaining schedule; SF is #3 with the 5th-easiest. Cincinnati (SRS #2, 2nd-easiest schedule, AFC +575) is a smaller version of the same gap.
**Mostly dead tickets:** GB/BAL ($20; BAL 4-5 with Lamar out, AFC +10000), BUF/PHI ($5; PHI 2-7).

## Options (no action without Andy's OK)
Buying at market prices costs roughly the vig in EV whatever you buy (each $20 add moves portfolio EV by about -$2). Small adds don't change the shape much: a $20 JAX SB bet moves the JAX branch from -$240 to -$173. So adds are worth it where **our numbers disagree with the market**, or with **free money**.
1. **$26.40 VIP Reloads -> an SF/JAX Super Bowl matchup**, if BEO (intermittent), Kalshi or Circa posts it. Fair price **+1,847**; worth it at or above that. One ticket hits the two biggest holes at once. Fallback: JAX SB +750.
2. **$17.39 BUF credit -> Buffalo SB +590** (the credit can only go to BUF). It adds to the anchor at a worse price than the existing tickets, but it's free money and the cap has $141 of room. Or hold it for a better BUF number (e.g. after a loss).
3. **Cash, only if you want more JAX:** JAX SB +750 or AFC +350 is the value-plus-coverage play (model #1, soft schedule). CIN AFC +575 is the second choice.
4. **Don't add GB.** The GB branch already nets about +$4,400, and GB is #8 by SRS.
5. **Keep the $1,070 open-parlay equity for the playoffs**, as planned. It is far bigger than any of these adds and is the real tool for the SF/JAX/DEN/DET holes.

Reminder: BetUS is not a venue (site down again 11/10). Exacta venues: Kalshi, Circa (in person), BEO when posted. Bookmaker is reference only.

## JAX-vs build plan (Andy, 11/10 8:42 PM PT): JAX vs SF, CHI, SEA
Super Bowl matchup tickets (pay if both teams make it, either winner). Plan: start small, add over the season, hedge heavier once seeding is clear.

| Matchup | Chance (BEO no-vig) | Fair price | Minimum to take (85% of fair) | Phase 1 stake (reloads) |
|---|---:|---:|---:|---:|
| JAX vs SF | 5.1% | +1,847 | +1,570 | $12.50 |
| JAX vs CHI | 3.9% | +2,496 | +2,121 | $9.40 |
| JAX vs SEA | 1.8% | +5,351 | +4,548 | $4.50 |

- Phase 1 uses the $26.40 BEO VIP Reloads, sized so each ticket returns about the same (~$210-245). Each of those three Super Bowls goes from -$440 to about -$220/-$260; the average JAX-in-Super-Bowl result goes from -$240 to about -$140/-$160.
- Break-even target: about **$55-65 total** across the three (at fair to 85%-of-fair prices) makes all three Super Bowls at least break-even before any hedge.
- Add triggers: a JAX loss that lengthens the price; SF/CHI/SEA seeding firming up; BEO posting the matchups. Re-run `reports/bets/futures_matrix_w10.py` after each add.
- Venues: BEO (intermittent), Kalshi, Circa. Log each ticket in the futures ledger after Andy pastes the slip.

### Kalshi check (11/10 ~10:20 PM PT, public API, series KXNFLSBOUTCOME-27)
Kalshi lists ordered exactas ("X beats Y"), not unordered matchups; a matchup = buy both directions. Kalshi needs cash (the BEO reloads can't be used there). Fee ~0.07 x P x (1-P) per contract.
| Matchup | Fair | Kalshi asks (JAX wins / other wins) | Matchup at asks + fees | Minimum to take | Verdict |
|---|---:|---|---:|---:|---|
| JAX vs SF | +1,847 | 3.0c / 4.6c | +1,133 | +1,570 | too expensive |
| JAX vs CHI | +2,496 | 3.6c / 4.0c | +1,133 | +2,121 | too expensive |
| JAX vs SEA | +5,351 | 1.8c / 1.3c | +2,918 | +4,548 | too expensive |
Fair limit prices (resting buys): JAX>SF 2.5c, SF>JAX 2.7c; JAX>CHI 2.0c, CHI>JAX 1.8c; JAX>SEA 1.0c, SEA>JAX 0.9c. Spreads are wide (bids 0.1-2.2c), so fills would be slow.
