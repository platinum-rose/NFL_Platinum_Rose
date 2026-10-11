# BAL@ATL Week 5 single-game synthesis (opus)

Generated 2026-10-11T05:49:19Z (Sat 10-10 22:49 PT), HEAD 7ebef66. "packet" = data/research-intel/game-packets/2026-w05/BAL_at_ATL.md. Disposition **price moved**, tier **research_only**; no side or total lean; edge hypothesis 0.0 margin / 0.0 total.

## Game script

Sunday night in Atlanta under a retractable roof whose status is unconfirmed, so no weather is applied; the Open-Meteo file has no BAL@ATL outdoor entry [Source: packet, VENUE line; 2026-10-10-week5-weather-openmeteo.json, outdoor_games, 17:56Z]. The central fact is Baltimore's quarterback: Lamar Jackson is Out and Tyler Huntley is the operator-confirmed starter (stated, not verified) [Source: packet, Quarterbacks, ESPN 04:21Z / operator 01:54Z]. The likely script is Baltimore leaning on Derrick Henry into Atlanta's best unit, its run defense, while Michael Penix Jr. faces a Ravens front missing Trey Hendrickson.

## Away state: Baltimore (3-1)

Results: W 41-23 at IND (+18), L 17-24 vs NO (-7), W 34-31 at DAL (+3), W 24-18 vs TEN (+6); +20 differential, 2-0 away, 0-0 division. Opponents combine for 5-12, so the record came against weak opposition. Rest 7.3 days; bye Week 13. BAL leads the AFC North on differential over 3-1 Cleveland, whom it visits next, then CIN and at BUF [Source: packet, Team state/standings, built 04:23Z]. Four games is a small sample, and all four were Jackson's; Huntley has 8-of-9 for 63 yards in Week 4 relief [Source: player_stats_weekly.csv, 2026 QB rows wk1-4].

## Home state: Atlanta (2-2)

Results: L 13-20 at PIT, L 3-34 vs CAR, W 35-14 at GB, W 45-24 at NO; +4 differential, 0-1 home, 2-1 away, 1-1 division; opponents 7-9. Rest 6.0 days; bye Week 11. ATL is second in the NFC South behind 2-2 Carolina and seventh in the NFC order; next come CHI and SF at home, then at TB [Source: packet, standings]. The split matters more than the record: Cooper Rush and Jack Strand started weeks 1-2 (five interceptions, 16 points), Penix weeks 3-4 (two wins by 42 combined, one interception) [Source: player_stats_weekly.csv, wk1-4]. No look-ahead adjustment.

## Matchup mechanics

Season-level FTN tables mislead in both directions. Baltimore's passing DVOA 69.4% and EPA/DB 0.349 are Jackson numbers; Atlanta's INTW% 7.1% and CPOE -7.2% are mostly Rush/Strand [Source: packet, FTN team-offense passing-analytics]. Both corrections point toward Atlanta, but the line moved after Jackson was ruled out Friday, so I treat them as priced, not as edge.

Baltimore runs on 48.5% of plays (FTN tendencies RUSH%) into an Atlanta rush defense at -28.2% DVOA, 30.4% success and 0.51 yards before contact (FTN team-defense rush-analytics): Atlanta's strongest number against a Henry-centric plan. Without Jackson's 20-50 rushing yards a week, loaded boxes get easier, and center Cam Jurgens is Out.

Atlanta runs 59.2% (rushing DVOA 13.0%, EPA/att 0.122) into a Baltimore run defense at -7.6% DVOA. Baltimore's pressure rate is 30.8% against an Atlanta line allowing pressure on 20.4% of dropbacks; Hendrickson's absence trims that edge. ATL is without DE Za'Darius Smith; Questionable are ATL LT Jake Matthews, LB Divine Deablo, DE Samson Ebukam, BAL CB Marlon Humphrey and WR Zay Flowers [Source: packet, AVAILABILITY, ESPN 04:21Z]. Pace is similar (59.8 vs 57.0 plays/game). Power ratings (BAL +5.0 net/game, ATL +1.0; matches_2026 true) are Jackson-era and get no adjustment. Secondary context is even (severity 4.05 vs 4.35).

## Market

BKR (Sat 18:15 PT, 4h35m old, not stale): ATL -3 -117 / BAL +3 +102; total 44 (O +103 / U -120); ML ATL -160 / BAL +139. BEO (Sat 20:15 PT): ATL -3.5 +100 / BAL +3.5 -120; total 43.5; ML -170 / +149 [Source: packet, Market]. Implied score ATL 23.5, BAL 20.5. Both books sit on 3, BKR shading toward -3.5 through price. Action Network (Fri 12:41 PT) showed -3.5 with 59% of money on ATL and 72% of tickets on the Over: context only; no opener captured. SuperContest lists ATL -3.5. The existing quantitative pass (home margin +2.43, total 44.75) is within a point of market, unbacktested, and unused.

## Evidence

Four tier-eligible rows, all VSiN, which counts as one outlet. Three back Baltimore +3.5 (w05-expert-verified.json#rows[448], rows[451], rows[568]); rows[525] reads "Falcons +3 (-118) vs.", matching no captured ATL price and contradicting the other three, so the outlet is internally contested. The +3.5 they quoted is +3 at BKR; crossing 3 makes it a different bet, since an exact 3-point Atlanta win (15.6% per the simulator) becomes a push. +3.5 survives only at BEO -120. All other rows are corroboration-only and split.

## Thesis and counter-thesis

Edge hypothesis 0.0 margin, 0.0 total. Simulator at -3/44: home cover 45.87%, away 45.87%, push 8.27%; over and under 48.48% each, push 3.04%. That is the zero-edge baseline, 50/50 excluding pushes, conditional on the hypothesis rather than calibrated edge. One contested outlet at a moved price does not support a tier.

Strongest case for Baltimore: Henry and a better roster keep it within a field goal while Penix has only two starts. Strongest case for Atlanta: Huntley without his center against ATL's run defense. Neither has two independent numeric inputs.

Flip conditions: Flowers or Humphrey inactive (toward ATL); Matthews out (toward BAL); BKR at +3.5 -110 or better restores the VSiN number; roof open with material weather; a second independent tier-eligible outlet.

## Gaps

- No opener or line history beyond one Action Network snapshot.
- Roof status unknown; weather not applied.
- Huntley start operator-stated; inactives decide.
- Questionable: Humphrey, Flowers, Matthews, Deablo, Ebukam.
- Quant pass +2.43 vs market +3.0.
- Global: 432 corroboration-only rows; six SuperContest label reversals elsewhere; BKR expiry 00:15 PT.
- Roster-vet: BEO "Tyler Huntely" spelling UNVERIFIED.

## Pre-kickoff delta checklist

- Official inactives and starters
- Fresh BKR/BEO capture
- Roof and weather recheck
- Game status
- Reprice VSiN +3.5 picks at the live number
