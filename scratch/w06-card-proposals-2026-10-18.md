# W6 betting card PROPOSALS: built 2026-10-17 23:55 PT (Sat night)

Nothing is placed, promoted or written to Supabase. Every price is the Bookmaker 12:40 PM PT Saturday board (about 11 h old at build time): recapture before use. Built from the 13 Astra outputs (CHI@ATL included, its output already existed) plus `data/supercontest/week-06-lines.json` and `live-market-comparison.json`.

## Read this first
- Astra found no tier-2-or-better market edge this week. Best case is two thin tier-2- sides: NYJ +7 and LV +4.5. Totals: none anywhere. Props: none recommended, no model probabilities.
- So the cards below are structure and price-driven, not edge. Each leg carries its Astra status. Consider the low end of every stake range.
- Real value this week is mostly in SuperContest line gaps (contest lines were locked 10/15, before Hurts OUT and the Lamar OUT move).
- SNF is DAL@GB (5:20 PM PT). WSH@SF is Monday night. HOU@JAX kicks 6:30 AM PT, so its inactives come first.

## Gates before anything is placed
1. Re-pull the board (all prices below are Saturday 12:40 PM PT).
2. Official inactives, about 90 min before each kickoff. Open items: Caleb Williams (official status Questionable; Garafolo/SI report he starts, no snap limit), Jalen Hurts OUT confirmation (drives CAR@PHI), Jayden Daniels (PIT@TB note), A.J. Brown, Likely price (+225 unverified; needs a human check, like Najee Harris), IND/ATL roof, WAS@SF wind/gust (data inconsistent).
3. Roster vet (`--strict`, run 2026-10-18 06:33Z against fresh ESPN rosters) says BLOCK on one item only: Xavier Woods (CHI) is in `secondary-roles-2026.json` but on no ESPN roster. He was signed in August; current status unconfirmed. Not used by any card below; the seed needs a fix or an override. All 33 player legs in cards/digest resolved. Info-only: Olave claimed NO/NYG vs roster NO.

## Singles (Astra leans, both tier 2-, both thin)
| Play | Price | Model vs break-even | Notes |
|---|---|---|---|
| NYJ +7 | -103 | 51.46% vs 50.74% | No A.J. Brown leg. Pass at +6.5 |
| LV +4.5 | -108 | 52.7% vs 51.9% | Floor +4. +3.5 or shorter = no edge |
| TB +3 or better | needs +3 (board is +2.5 -109) | +3.5 = 54.0% vs 52.4% | Gate fail at the current number, so no play yet |

## Slot 1: Master Round Robin (8 legs, 4-team, 70 combos, $70 floor)
Only two of the eight legs clear break-even. Treat this as structure, not edge; skipping is defensible.
1. NYJ +7 -103 (tier 2- thin)
2. LV +4.5 -108 (tier 2- thin)
3. JAX -2.5 -111 (model 56.2% via unbacktested blend; research_only)
4. CLE +3 -106 (informational; Lamar OUT, Huntley starts)
5. TEN +7 -115 (soft directional, no edge)
6. ATL +1 -103 (coin flip, 49.2%; or take ATL +3 only in the contest)
7. TB +2.5 -109 (gate fail; swap in only at +3)
8. SF -8 -108 (51.45% vs 51.92%, near break-even; Monday leg keeps the RR alive)

## Slot 2: Dog ML Round Robin (6 legs, 2-team, 15 combos, $20 = $1.33 each)
NYJ +284, TB +123, LV +194, ATL +105, TEN +251, CLE +154 (average decimal price 2.85, about +185).
Returns: 6 hit $160.94, 5 hit ~$107, 4 hit ~$64, 3 hit ~$32, 2 hit ~$11, 0-1 hit $0.
Caveat: Astra's leans are spread leans, not ML edges. TEN is soft. 3-of-6 is break-even territory.

## Slots 3-5: parlays (price-driven, flagged)
| Slot | Legs | Stake | If it hits |
|---|---|---|---|
| 3 Morning-weighted | NYJ +7 -103, JAX -2.5 -111, KC ML -393, GB ML -113 (SNF cap) | $25 | about +$196 (+786) |
| 4 Afternoon-weighted | IND ML -296, CAR ML -173 (only after Hurts OUT confirmed), KC ML -393, LAR ML -746, GB ML -113 (SNF cap) | $25 | about +$117 (+466) |
| 5 Hybrid | NYJ +7 -103, LV +4.5 -108, JAX -2.5 -111, GB ML -113 (cap) | $20 | about +$252 (+1260) |

Notes: I avoided NE and BUF ML in the parlays because the singles lean the other side (NYJ, LV). LAR -746 adds almost no payout; drop it if you prefer. GB ML cap is the hedge placeholder, per the template; Astra has no lean on DAL@GB. KC ML -393 has no Astra backing (LAC@KC was a skip; Under only works at 42.5+).

## Slot 6: SuperContest five (needs Andy and Amanda's decision)
Proposed five, ranked by line value (contest line locked 10/15):
| Pick | Contest line | Market now | Gap | Astra view |
|---|---|---|---|---|
| CAR +1.5 | PHI -1.5 | CAR -3 (DK/FD PHI +3/+3.5) | +4.5 pts | research_only; value rests on Hurts OUT being official |
| CLE +5.5 | BAL -5.5 | BAL -3 | +2.5 pts | skip at market; CLE +3 informational |
| ATL +3 | CHI -3 | CHI -1/-1.5 | +1.5 pts | tier 2- contest lean; 54.8% cover if Williams plays, 62.6% if out |
| LV +4.5 | BUF -4.5 | BKR BUF -4.5, DK/FD -5.5 | 0 (BKR) / +1 (DK) | tier 2- thin, 52.7% |
| NYJ +7 | NE -7 | BKR NE -7, DK/FD -7.5 | 0 / +0.5 | tier 2- thin, 51.46% |
Alternates: TEN +7 (soft), JAX -2.5 (model blend). Five dogs, so the ticket is correlated.

Book-ticket warning: the slot-6 tickets (~$15 5-team parlay + $10 2-team RR, 10 x $1) are priced at the book number, not the contest number. For CAR that is -3 at the book instead of +1.5 in the contest (4.5 pts worse), and for CLE +3 instead of +5.5. Mirror those two legs at the book and the ticket no longer matches your contest card. Decide whether to build the tickets from different legs, or accept the gap.

Middles worth flagging (gap of 1.5 or more per the process doc): CAR (contest CAR +1.5 plus book PHI +3 -102; both win if CAR margin is -1 to +2) and CLE (contest CLE +5.5 plus book BAL -3; both win if BAL wins by 4 or 5). ATL's window is only CHI by 2. These are optional, small-stake ideas, not part of the five.

## Slots 7-8: props (not built)
Astra recommended zero prop legs. The BetOnline 10/18 capture has no defensive markets (no tackles+assists, sacks, def-INT) and only HOU@JAX, BUF@LV and DAL@GB have full player-prop pulls; CHI@ATL has 4 rows. Verified price-only rows you can build from (no model, no recommendation): Bijan Robinson rush 93.5 O -108 (Sharp 89.5; stale 4 yds) and carries 18.5 O +107; Likely rec yds 51.5 O -113 / rec 5.5 O +104 (price unverified, human check first); Nabers rec yds 71.5 O -110; Cousins pass yds 251.5 O -114; Tucker rec yds 38.5 O -114; Bowers rec 6.5 O -135; first TD Hunter Henry +919, DeMario Douglas +1063 (NE); Rodgers 2+ pass TD +137. Slots 7a-7e and 8a/8b cannot be filled to template from verified rows; use the Props builder or Alejandro for stacks, and keep the lessons-learned rule (best reads also as singles).

## Open items carried
- Andy and Amanda's official five -> `data/supercontest/locked-card-week-6.json`.
- Refreshes still needed before kickoff: inactives (all games), A.J. Brown, Barkley hedge, Likely price, WAS@SF wind/gust, IND/ATL roof.
- Not rerun: CHI@ATL Astra. The existing output already covers both Williams scenarios (lean ATL +3 in either); Williams is now reported to start, so the "Williams plays" branch applies.
