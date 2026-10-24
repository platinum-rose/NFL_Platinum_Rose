# GB @ DET — Week 7 game synthesis, pass `sides`

As-of: Fri 2026-10-23 18:30 PT · Kickoff: Sun 10/25 13:25 PT (Ford Field, fixed dome) · Packet built 2026-10-24T01:26:41Z · roster_vet: PASS (roster age 0.0h; 1 INFO, 1 UNVERIFIED)

## Recommendation box

- **SPREAD:** GB +3 +104 (BKR) | **C** | fair DET -3.0 | edge 0.0 pts, value is price (+104 on a dog sitting on the key number, about +1.8% EV at fair) | playable to GB +3 -110; pass at +2.5 or worse
- **TOTAL:** Over 53.5 -111 (BKR) | **C** | fair 54.5 | edge +1.0 | playable to 54 -110; pass at 54.5 or higher
- **MONEYLINE/SU:** PASS (GB +156 / DET -178) | fair DET about -146 (sim 59% excl tie) | GB +156 is roughly fair, so no edge either way
- **SuperContest:** GB +3.5 | **B** | 51.3% sim cover at a 0.5-pt view edge, with the hook on 3 in our favor | candidate = YES
- **Pool:** SU winner **DET** | confidence about **6/16** (sim 59-60% win). BUK BUK SU: DET

## Game script
Detroit comes off its W6 bye at home in the dome. Its offense is #3 in EPA/play (0.190) and averages 32.8 PPG with a 77% red-zone TD rate. Its defense is #31 in EPA/play (0.131) and allows 29.6 PPG [Source: data/generated/team-dossiers/2026-w07/DET.md, built 2026-10-22T22:58Z]. Green Bay has played slower and lower scoring: 21.2 PPG for, 20.8 against, 60.8 plays per game, and a run game sitting at -0.277 EPA/att. Its passing has been efficient, though: EPA/DB 0.116, explosive-pass rate 17.8% [Source: GB.md, FTN through W6]. The likely script is Detroit scoring on long drives against a thinned GB front while Love works vertically into a Lions secondary missing Kerby Joseph. That is a one-score game in the low-to-mid 50s, and a 3-point Lions win is the most common single result (sim exact-margin-3 = 15.6%).

## QB / availability (final Friday designations)
- **GB:** Jordan Love (back) was full Thursday and is off the report. Watson, Golden, Savion Williams, Cisse and Van Ness have no designation. **Zaire Franklin (LB) is OUT** (shin). Questionable: Bo Melton, Aaron Banks (G), Benjamin St-Juste (CB), Jordon Riley (DT, IR-return window). Micah Parsons is on **PUP-R**, so he is out and has been out all season, which means it is already in GB's 6-game numbers. Hargrave and J. Ford are on IR. LaFleur says Josh Jacobs is "on track" to make his season debut, role TBD [Source: packet availability.GB, ESPN injuries API 2026-10-23T16:05Z–2026-10-24T00:36Z; news_notes PFT 2026-10-23T21:08Z; SI 2026-10-20].
- **DET:** Jared Goff is fine. **Brian Branch (S) is questionable** in his Achilles comeback: full Wednesday, and Campbell expects him to debut on a limited snap count. Cade Mays (C) is expected back from a wrist injury. Kerby Joseph (S) is OUT. Rock Ya-Sin (CB) is questionable. Bartch (G), D. White (LB) and T. Kennedy (WR) are on IR [Source: availability.DET Branch 2026-10-24T00:08Z; footballnationusa 2026-10-19; packers.com report 10/21; DET.md].
- **If Branch is out:** the slot and TE-middle weaknesses tagged in secondary_matchups grow, which nudges toward GB +3 and the Over. **If both Branch and Mays are active and Mays starts:** it is a small DET boost and does not change the picks.
- **Flip news:** inactives come out **Sun 11:55 PT** (90 minutes before 13:25 PT). Branch and Mays must be formally activated to the 53, and that activation news is likely to land Saturday by 13:00 PT.

## Market
- **Opener → current:** AN open DET -3 -115 / 52.5 / ML DET -180 (Sun 10/18 ~20:47 PT). BKR now: DET -3 **-122**, GB +3 +104, o53.5 -111, ML DET -178/-179. The paste was ~11:40 PT and the BKR live board is 2026-10-23T20:12Z; the main lines match except ML (-179 → -178) [Source: bookmaker-gamelines-2026-10-23-week7.raw.txt; bookmaker-live-2026-10-23-packers-at-lions.json]. The side has drifted 7 cents of juice toward DET while staying on 3. The total is up a full point.
- **SuperContest line DET -3.5** (locked 2026-10-22T15:03Z) is half a point worse for DET than BKR, so the contest gives us +3.5 on GB.
- **Splits (AN 2026-10-23T19:40Z):** spread 67% of bets / 73% of money on **GB**, a 6-pt gap with no sharp flag. Total: 79% of bets on the Under but 71% of money on the Under, so Over money (29%) is 8 pts above Over tickets (21%), just under the 10-pt flag. **The line rose 52.5 → 53.5 against 79% Under tickets, which is reverse line movement toward the Over.** ML: 69% of bets / 72% of money on DET.
- **Sharp report:** Caesars sharp action on "Packers +3.5" [Source: news_notes X @PatrickE_Vegas 2026-10-22T13:28Z]. Books holding -3 and juicing DET instead of moving to -3.5 suggests buyback on GB at +3.5.

## Quantitative
- **Power:** the packet SRS has GB 2.56 and DET 2.20. Composite z is GB 0.19 vs DET 0.45. Prediction-market win totals: GB median 10.16, DET about 10.5+ (P(10+) = 63%). Treating the teams as close to equal plus about 1.5-2 for home field gives DET -2 to -2.5. The bye and GB's DL attrition (Franklin newly out) add roughly a point, so **fair DET -3.0** [Source: packet power_ratings, prediction_markets]. *Discrepancy:* the dossier SRS (GB 1.07 #15, DET 1.27 #14) disagrees with the packet's power block. Both are directionally even.
- **FTN:** DET pass offense DVOA 29.6% and EPA/DB 0.283 vs a GB pass defense at DVOA -18.3% (good). GB pass offense DVOA 14.2% vs a DET pass defense at DVOA 18.7% (poor) with a 62% open-target rate allowed [Source: FTN via dossiers; DET FTN stale_1wk, through W5].
- **Secondary matchups:** DET's secondary vulnerability tier is **high** (severity 10.65, 3 elite absences in the flagged list). Christian Watson (deep, boundary) is the top GB target. GB's secondary has milder exposure; St. Brown has opportunity score 7.5 [Source: secondary_matchups; coach names in coverage notes ignored per rule 7].
- **Simulator** (`scripts/intel/margin-simulator.mjs`, calib 2018-2025, sha 0ea35592…; selftest PASS):

| Run | Line / Total | Adj (margin / total) | Home cover | Away cover | Push | Over | Home win |
|---|---|---|---|---|---|---|---|
| BKR baseline | DET -3 / 53.5 | 0 / 0 | 45.9% | 45.9% | 8.3% | 50.0% | 60.1% |
| BKR adjusted | DET -3 / 53.5 | 0 / +1.0 | 45.9% | 45.9% | 8.3% | 53.0% | 60.1% |
| Contest baseline | DET -3.5 | 0 | 50.0% | 50.0% | 0 | — | 64.1% |
| Contest adjusted | DET -3.5 / 53.5 | -0.5 / +1.0 | 48.7% | **51.3%** | 0 | 53.0% | 62.8% |

Adjustments: margin 0 at -3 (my view matches the market number, and the edge is the +104 price on the dog). The same view is -0.5 home vs the -3.5 contest line. Total +1.0: dome, DET's offensive EPA, DET's #31 defense, the bye, GB's depleted front, and RLM on the total.

## Expert / podcast / article agreement
- **DET side:** Brandon Anderson (Action Network write-up and YouTube; same analyst, so **one** opinion; "DET -5 power rating, favorite side of the week"), Brandon Kravitz (DET -2.5, bye spot, now 0.5 worse at -3), Chad Millman (explicitly his "Square" pick), SI betting (DET -3 -108 BetMGM, 10/20).
- **GB side:** Dave Tuley/VSiN (Best Bet GB +3.5; ATS contests 67/33 on GB), Warren Sharp (GB, fast dome plus Alex Moore crew penalty profile), Simon Hunter (GB +3.5), John Ewing/Bet Labs (division dogs 20-8 ATS this season; trend only), plus the Caesars sharp report. PFT projects DET 28-27, which is SU DET but a GB cover.
- **Over:** Andrew Erickson (o52.5; "Ford Field = Coors," 52+ totals 6-1 to the over), Matt Perrault (o52.5), BettingPros (o52.5). All three were priced at 52.5 and are now 1 pt worse at 53.5. PFT's implied total is 55.
- **Under:** Steve Makinen/VSiN (Under 53.5, Best Bet), priced at the current number.

## Counter-case
- **GB +3 / +3.5:** Detroit off a bye at home is the classic Campbell/Goff spot. GB's front is missing Parsons, Hargrave, Ford and now Franklin, and the packet flags defensive_front cluster_risk plus opponent-offense boost. If Gibbs/St. Brown run Detroit's 77% red-zone TD rate, DET wins by 7+ and the -122 juice was books leaning correctly. GB's offense has topped 23 points once in six games.
- **Over 53.5:** GB games average 42 total points and GB plays slowly (60.8 plays, 26.6 min TOP). Love's CPOE is -6.1%. A GB ball-control plan with Jacobs back could shorten the game. Makinen is under at the current number, and every over tout was priced a point cheaper.

## Ambiguity / missing data
- `missing_inputs[]` is empty. The packet has no `qb_operator_notes` (QBs are confirmed by news: Love full Thursday, Goff healthy).
- The DET Friday report was only partly captured (Branch Q on ESPN). I could not fetch the official 10/23 Lions/Packers report pages because they are off the allowlist, so whether Mays or Ya-Sin carry a designation is unconfirmed.
- The packet and dossier power-rating blocks disagree (noted above). DET FTN is through W5 (bye).
- BetOnline board is null. DK Predictions is reference only.
- Splits are single-source (AN).

## Pre-kickoff delta checklist
1. Branch/Mays activation (Sat) and Branch inactive (Sun 11:55 PT): if Branch is OUT, upgrade GB +3 to B and the Over to B-.
2. DET moves to -3.5 at BKR: GB +3.5 becomes tier B on BKR as well. If DET -3 goes to -125 or worse, GB +3 at +105 or better stays a C play.
3. GB +3 flips to -110 or worse: PASS on BKR (contest pick unaffected).
4. Total goes to 54.5+: PASS on the Over. Back to 53: Over upgrades toward B.
5. Any Love setback (back) on Saturday: flip the side to PASS and lean Under.
6. Jacobs active with a clear lead role: small Under nudge (pace), side unchanged.

## Gate notes
- Missing inputs: none.
- Roster vet PASS (age 0.0h). 1 UNVERIFIED entry exists in the gate totals but no player is named in this packet. Micah Parsons is "withheld pending confirmation" in projected_starters. The web check confirms he is on PUP-R, so he is treated as OUT.
- Kickoff is still ahead, so this is a forward pick.
- `availability.GB` mixes in ESPN items that need human review (needs_human_review=true). Statuses were checked against PFT/SI/packers.com where reachable.
- The official 10/23 report pages were not fetchable (allowlist). Final designations come from packet ESPN-API rows published Friday evening.
- Coverage-note coach names in secondary_matchups (e.g., "Aaron Glenn") are stale and were ignored. Dossiers list HC Campbell / HC LaFleur.
- The two Anderson items (Action Network article plus YouTube) are counted as one opinion. The Watson/Golden 80+ BOGO and the Redman ATD are props/specials, not comparable to the side.
