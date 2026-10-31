# 2026 W08 — LAC @ LAR — game synthesis, pass `sides` (Saturday re-run)

As-of: Sat 2026-10-31 ~3:30 PM PT · Kickoff: Sun 11/1 1:05 PM PT (SoFi; inactives ~11:35 AM PT) · Packet built 2026-10-31T21:55:40Z (`scratch/w08-game-synthesis-queue-sides.json`) · roster_vet: PASS (0.3 h, 14 UNVERIFIED league-wide) · missing_inputs: none · Friday version: `reports/intel/games/_friday-w08/2026-w08-game-LAC_at_LAR-sides.md`

## Recommendation box

| Market | Pick @ BKR | Tier | Fair | Edge | Playable to |
|---|---|---|---|---|---|
| SPREAD | **PASS at BKR** (lean LAC +6.5 -113) | PASS (was C) | LAR -5.5 | 1.0 pt, but at -113 the sim's 52.7% is below the 53.1% break-even | LAC +6.5 at -110 or better = C; +7 at any price to -115 = B |
| TOTAL | **Under 45 +101** | C | 44.5 | 0.5 pt (+~3.5% EV on the +101 price) | 45 to -105; pass at 45 -110 or at 44.5; 45.5 at -110 or better firms it |
| MONEYLINE / SU | **PASS** (LAC +233; Rams SU) | PASS | LAR ~-205 / LAC ~+205 | LAC ~32.8% (excl tie) vs 30.0% implied, which I discount (see below) | LAC ML only at +250 or better |
| SuperContest | **LAC +6.5** (contest line LAR -6.5, no juice): sim 52.7% → candidate **Y**, but it's the thinnest kind of Y | C | | | |
| Pool | SU **Rams**; confidence **7 of 16** (sim LAR win 68%) | | | | |

Card fit: `parlay_leg_ok` = n for every market (thin edges plus vig). `standalone_preferred` = n. Prices come from BKR game-lines paste Sat 2:26 PM PT [`data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt`] and match the per-game board [`data/generated/props/bookmaker-live-2026-10-31-chargers-at-rams.json`, capturedAt 2026-10-31T21:28:02Z]: LAC +6.5 -113 / LAR -6.5 -103 / o45 -118 / u45 +101 / ML +233/-272.

## Changes vs Friday

1. **BKR spread price moved against LAC:** LAC +6.5 -109 → **-113** (LAR -107 → -103). That passes Friday's playable-to line (-112), so the BKR spread drops **C → PASS**. The SuperContest call doesn't change because the contest line has no juice.
2. **Total:** Under 45 -109 → **+101**, Over 45 → -118. BetOnline now shows **45.5** -110/-110 [`betonline-live-2026-10-31-chargers-at-rams.json`, 21:32Z]. AN splits: over money 73% → **80%** against 69% of bets, an 11-pt gap and a **new sharp flag on the OVER**. I cut total_adj from -1.0 to **-0.5**. The under stays C only because of the plus price.
3. **Spread splits:** LAR money 56% → 59% (bets still 69%). The LAC money-vs-bets gap narrowed from 13 to **10**. That's still a sharp flag on LAC, but weaker.
4. **Injuries (official Fri report):** C Coleman Shelton went from listed **OUT** on Friday to **Questionable** (DNP/DNP/Limited). CB Trent McDuffie is **Questionable** (limited all week), which settles Friday's OUT-vs-Q conflict in favour of Q. Both lean slightly toward the Rams if they play.
5. **New signals:** VSiN's Matt Youmans and Wes Reynolds both have LAC +6.5 (captured Sat 14:54Z). Lock & Cash lists Chargers +240 as an upset pick and "avoid Rams" in teasers (X, 10/30, pulled Sat). No new Saturday YouTube or BettingPros rows exist for this game, and the article file still has only Koerner.
6. ML +232 → +233, still a pass. BKR team totals are unchanged (LAR 26.5 / LAC 19.5 o-116). New 1H line: LAR -3.5 / 22.

## Game script
The Rams should control early downs. LAR's offense is #10 in EPA/play at +0.058. LAC's is #32 at -0.202, scoring 15.0 PPG with a 9.5% sack rate and 12 giveaways [team dossiers 2026-w08 via Friday report]. LAC's defense is good (#7 EPA/play), but it's without S Derwin James (OUT). The likely shape is the Rams up 7–10 at halftime, then running the ball without Davante Adams (IR) in a slow second half. Over 16 closes as a west-coast underdog, Herbert's teams lost 13 times, and only one of those losses was by 10+ points [an_primer, Abrams 10/30]. That "close-loss" profile is the main case for LAC.

## QB / availability
- Herbert and Stafford start; no QB designations [packet an_primer; projected_starters].
- **LAC Out:** S James, DB Leonard, G Awosika, WR B. Thompson. **Questionable:** CB Donte Jackson and CB Rodney Shelley (hamstrings, limited all week). McConkey, Tre' Harris and Mack are off the report [chargers.com Week 8 injury report, 10/30]. The availability feed lists TE Njoku on IR. That dates to September (fibula; DraftSharks 9/21), so it isn't new, and the projected-starters "known" list is stale.
- **LAR:** LS Cardona Doubtful. CB McDuffie, TE Parkinson (rib, DNP all week), WR Whittington (back) and C Shelton (hip) are Questionable. Garrett, Turner, Ford, Keir Thomas, Adams and Ferguson are on IR, and the packet flags `defensive_front cluster_risk=true` [packet availability; chargers.com report; sportbusy/ESPN 10/31]. The feed also shows K Blake Grupe on IR, which I couldn't verify; I'm treating it as unverified.
- **If** Shelton plays → small LAR offensive bump (about 0.3 pt toward LAR). **If** McDuffie sits → small LAC slot bump. **If** Donte Jackson and Shelley both sit → LAC CB depth is very thin, which favours the over and LAR. Inactives come out ~11:35 AM PT.

## Market
- AN open (Sun 10/25): LAR -7.5 / 45.5 / ML -372/+283. BKR now: -6.5 / 45 / -272/+233. The spread moved 1 pt through the 7 toward LAC, and the juice is still pushing that way (LAC -113). That suggests a +6 is closer than a +7. The total has gone 45.5 → 45 at BKR, but the 45.5 at BetOnline and the -118 over juice show upward pressure.
- AN splits (Sat 2:23 PM PT): spread LAR 69% bets / 59% money → **LAC +10 gap (sharp flag)**. Total: over 69% bets / 80% money → **OVER +11 gap (sharp flag)**. ML 96/96 Rams (no signal).
- BKR and contest line are both -6.5, so there's no gap. Kalshi/Polymarket context: LAC median 4.85 wins, LAR 10.05.

## Quantitative
- Power: LAR SRS -0.37 (#17), LAC -10.1 (#32). On SRS alone LAR would be about -10. The market-implied ranks are closer (#14 vs #29) [power_ratings].
- FTN: the Rams' rush-D and pressure numbers were built with Garrett, Turner and Ford. LAC's pass protection allows 38.9% pressure, so the Rams' depleted front is the main reason LAC can hang around [FTN context via Friday read; weekly file, no refresh].
- Secondary: LAR offense vs LAC rates **high** (James out, severity 5.63, boosts to TE-middle, slot and deep routes). LAC offense vs LAR rates low.
- Simulator (`margin-simulator.mjs`, selftest PASS, calibration 2018-2025, BKR = contest line -6.5, total 45):

| Run | margin / total adj | LAC cover | Over (excl push) | Under (excl push) | LAR win |
|---|---|---|---|---|---|
| Baseline | 0 / 0 | 50.0% | 50.0% | 50.0% | 70.6% |
| **Chosen** | **-1.0 / -0.5** | **52.7%** | 48.4% | **51.6%** | 68.3% |
| Friday view | -1.0 / -1.0 | 52.7% | 46.9% | 53.1% | 68.3% |
| Softer | -0.5 / -0.5 | 51.4% | 48.4% | 51.6% | 69.4% |

**Why margin -1.0:** LAC comes off a bye against a team on normal rest. Rest-advantage teams are 22-8-1 ATS this season, and winless teams off a bye are 30-11 ATS. The Rams are without three DL starters. LAC still has the money-vs-bets gap, and 6+ point favourites are 8-21-3 ATS. Offsetting that: the -10 SRS gap, James out, and Shelton possibly back. **Why total -0.5 (was -1.0):** McVay is 30-12 to the Under as a home favourite and the PF/PA blend is ~43.6. Against that, the new 11-pt sharp over flag, the over juice and BetOnline at 45.5 each take back half of Friday's adjustment.

## Expert / podcast / article split
- **LAC:** Steve Makinen, Matt Youmans and Wes Reynolds (all VSiN, LAC +6.5). Stuckey (AN YouTube, LAC ML parlay leg). Lock & Cash (LAC +240 upset). Koerner (AN PRO, +6.4 projection vs +6.5, about no edge). Bet Labs systems: winless road teams wk5+ (64-40), and Business Trip.
- **LAR:** Jason Radowitz (-6.5 -112), BettingPros early bets (-6.5 -112), PFT (30-13), Steve Krebs (ML -290). Dropped: BettingPros "Rams -5.5" (it's a Week 9 lookahead URL) and Radowitz "Lions -3" (wrong game).
- **Total:** Under from Fezzik (parlay leg, u45.5) and Even Money (u45.5/u44.5, at better numbers than now). Over from Caesars sharp action at 43.5 (10/29) and Saturday's AN over-money gap. The three VSiN pieces are one outlet but three separate handicappers. They are still public-facing and likely part of why the LAC side got bet down.

## Counter-cases
- **LAC side:** LAC is 0-5-1 ATS with sub-24 points every game, and McDaniel is on the hot seat. James out opens the middle for Stafford, and Stafford is 14-7 ATS as a favourite. SRS says -10. A 7- or 10-point Rams win is the single most likely outcome bucket.
- **Under 45:** Sharp money is now on the over. LAC's DB room is depleted, LAC turns it over and hands the Rams short fields, and one defensive or return TD clears 45.
- **ML pass:** The sim's LAC ~33% (excl tie) relies on a margin view of mine that the -113 juice market only partly confirms. For a 0-6 team I'm not betting +233 on a model gap below 3%.

## Ambiguity / missing data
- Shelton, McDuffie, Parkinson and Whittington are all game-time Qs.
- Grupe (K) IR in the feed is unverified.
- Total openers differ by source (45.5 AN vs 48 primer).
- The LAR dossier venue says "Melbourne", which is a known schedule bug.
- The YouTube file status is `pending_andy_review`, but the packet lists these rows as approved.
- BKR prop-board times match the paste, so nothing newer exists.

## Pre-kickoff delta checklist
1. BKR LAC +6.5 at -110 or better → spread becomes C. +7 → B. +6 → pass everywhere except as a SuperContest hold.
2. Total 45.5 at ≤-110 → under firms to C+. Under 45 at -105 or worse → pass. 44.5 → pass.
3. Inactives (~11:35 AM PT): Shelton active → no change to the pass. D. Jackson and Shelley both out → drop the under. McDuffie out → LAC lean strengthens slightly.
4. LAR money on the spread ≥ 70%, or over money ≥ 85% → drop the lean or the under.
5. Any LAC play-caller or McConkey news → re-evaluate.

## Gate notes
- missing_inputs: none. roster_vet PASS (0.3 h). This is a forward pick; kickoff hasn't passed.
- My one web search for the injury report found the official chargers.com Week 8 report (Fri 10/30, both teams) and an ESPN-fed Rams page (10/31). Neither has inactives yet.
- Availability feed issues: Aaron Donald / Byron Young / Puka Nacua "UNKNOWN" are rest (NIR) entries, not injuries. The Njoku IR entry is old news (September). The projected-starters LAC list is stale.
- The secondary-matchup coach names were ignored per rule 7. Weather is null and moot (SoFi has a fixed canopy roof).
