# Week 7 synthesis digest (SAT) - rebuilt Sat 2026-10-24 ~8:00 PM PT from the 13 per-game syntheses (Fri 10/23 evening), the Saturday 10/24 market/news recheck and Andy's Saturday BKR board
Status: PROPOSALS ONLY. Nothing placed, promoted or written to Supabase. Tier key: 1 = matchup/role data, 2 = named expert (2+ independent = consensus), 3 = market price, 4 = price only. The letter grade in brackets is the per-game synthesis grade (B / C).
Lines = the Saturday BKR board Andy supplied in chat (capture time not stated; the structured DOM snapshot is ~1:25 PM PT). Confidence = simulator cover / total probability excluding pushes from `scripts/intel/margin-simulator.mjs` as recorded in `reports/intel/games/2026-w07-game-*-sides.md`. Where the Saturday number differs from the simulated number the note says so; no simulation was rerun after Saturday's news.

## A. Freshness (Sat 10/24 evening)
| Input | Status | Note |
|---|---|---|
| Per-game syntheses (sides + props) | Fri 10/23 ~6:30 PM PT | 13 games, Opus; roster_vet PASS at packet build |
| Saturday news/market recheck | Sat 10/24 | `reports/intel/master-intel-narratives-2026-w07.md` (Saturday table supersedes Friday prose) |
| BKR game lines | Saturday board from Andy | capture time not stated |
| BKR props | Sat ~6:46 PM PT | 13 games, ~6,381 rows; CIN@BAL board posted after Lamar OUT; Rams scoring markets pulled |
| BEO props | Sat ~6:45 PM PT | player props only PIT@NO, GB@DET, KC@SEA |
| DK Predictions | Sat | 955 rows, reference only (prices before fees) |
| Action Network splits | Fri 10/23 12:40 PM PT | directional only |
| Inactives | PENDING Sunday | 5:00 AM PT Paris; 8:30 AM; ~11:55 AM; 3:50 PM SNF; Mon 3:45 PM MNF |

## B. Slate (Saturday BKR board)
| Game | Spread | Total | ML | Kick (PT) |
|---|---|---|---|---|
| PIT@NO | PIT -3 -108 / NO +3 -108 | 44 (o-103 / u-113) | PIT -161 / NO +140 | Sun 6:30 (Paris) |
| SF@ATL | SF -2 -113 / ATL +2 -103 | 50.5 | SF -140 / ATL +123 | Sun 10:00 |
| CLE@TEN | CLE -2.5 -107 / TEN +2.5 -109 | 37 (o-103 / u-113) | CLE -131 / TEN +115 | Sun 10:00 |
| IND@MIN | IND +6.5 -108 / MIN -6.5 -108 | 41.5 | IND +227 / MIN -266 | Sun 10:00 |
| MIA@NYJ | MIA +4 -108 / NYJ -4 -108 | 39 | MIA +184 / NYJ -213 | Sun 10:00 |
| TB@CAR | TB +3 -119 / CAR -3 +103 | 44.5 | TB +131 / CAR -150 | Sun 10:00 |
| CIN@BAL | CIN -2.5 -118 / BAL +2.5 +101 | 47 (o+101 / u-118) | CIN -159 / BAL +139 | Sun 10:00 |
| NYG@HOU | NYG +10 -103 / HOU -10 -112 | 43 | NYG +367 / HOU -450 | Sun 10:00 |
| DEN@ARI | DEN -4.5 -108 / ARI +4.5 -108 | 43 | DEN -224 / ARI +193 | Sun 1:05 |
| GB@DET | GB +3.5 -103 / DET -3.5 -112 | 54.5 | GB +160 / DET -185 | Sun 1:25 |
| LAR@LV | LAR -3 -119 / LV +3 +102 | 48 | LAR -179 / LV +157 | Sun 1:25 |
| KC@SEA | KC +3 -115 / SEA -3 -101 | 42 | KC +129 / SEA -148 | Sun 5:20 SNF |
| DAL@PHI | DAL -4 -112 / PHI +4 -104 | 44 | DAL -211 / PHI +183 | Mon 5:15 MNF |
NE@CHI is FINAL (CHI 30, NE 24). Every NE/CHI signal is dropped.

## C. Sides and totals: Platinum Rose recommendations (Sat 10/24 evening; elevation bar applied at Andy's direction 8:16 PM PT)
Elevation bar: (1) model edge of 1.5+ points vs fair with the simulator on the same side, (2) at least one independent named expert or sharp/market signal on the same side, (3) no unresolved serious contrary evidence. Every elevated pick carries The Pitch and The Pushback in `reports/intel/master-pitches-2026-w07.json`. Andy ruled NYG +10 and KC +3 (spread) definite leans; at 9:17 PM he elevated NYJ -4, ARI +4.5 and KC ML +129 (TB@CAR stays a lean).
| Game | Market | Lean | Source | Tier | Note |
|---|---|---|---|---|---|
| TB@CAR | total | Over | conf 54.7%; sim at 45, fair 46.5; Young leads the league in passing yards vs a TB defense missing Winfield | 1+2 flag (B) | Over 44.5 (-108). Risk: Over only if Mayfield is active at 8:30 AM PT; TB props pulled |
| MIA@NYJ | total | Under | conf 52.4%; sim range 50.0-54.7% at 39 (midpoint); fair 37.5; line moved down despite Over tickets | 1+2 (B) | Under 39 (-108). Risk: A Willis turnover or return TD hands NYJ short fields |
| IND@MIN | total | Under | conf 56.0%; sim at 41.5, fair 39.5; MIN games average 34.6 points; IND without Warren, Gardner, Gould | 1+2 (B) | Under 41.5 (-109). Risk: A rested MIN offense; Mason inactive puts the load on Aaron Jones. Pass at 40.5 |
| CIN@BAL | total | Under | conf n/a after Lamar OUT (Friday blend fair 47.1; Huntley-scenario fair ~45); Huntley start leans run-first | 1+2 flag (B) | Under 47 (-118). Risk: Price -118 is steep; play to 47, pass at 46.5. Sportsbook spread and ML are passes; CIN +2.5 is contest-only |
| GB@DET | spread | GB | conf 51.3%; sim at +3.5, hook on 3; fair DET -3.0; sharp/expert support | 1+2 (B) | GB +3.5 (-103). Risk: Live GB/DET O51.5 exposure; DET off the bye at home; Jacobs debut and Branch snaps |
| MIA@NYJ | spread | NYJ | conf 52.0%; sim range 50.0-54.0% at -4.5 (midpoint); fair NYJ -6; now -4 | 2 (C, elevated by Andy 9:17 PM) | NYJ -4 (-108). Risk: NYJ have zero red-zone TDs in three games; Hall Q |
| DEN@ARI | spread | ARI | conf 52.7%; sim at +4.5, fair DEN -3.5; DEN 4-0 in one-score games; Hunter/AN on ARI | 2 (C, elevated by Andy 9:17 PM) | ARI +4.5 (-108). Risk: Coleman activated for DEN; Broncos money lean; no market gap, model edge only |
| KC@SEA | moneyline | KC | conf 47.8%; sim KC win 47.8% vs 43.7% implied at +129 (fair about +109); KC offense #5 by EPA vs SEA #25; Darnold 7 INT and an 8.3% sack rate vs the KC blitz | 2 flag (C, elevated by Andy 9:17 PM) | KC ML (+129). Risk: Line moved to SEA against 89% KC money; KC already on live +3.5 / +8 tickets and the KC +3 single |

## D. Teasers (6-pt) named by experts
| Game | Leg | Source | Tier | Note |
|---|---|---|---|---|
| IND@MIN / KC@SEA | MIN -0.5, KC +8 | Andy's live teaser 740506458 | held | Already live (SF -1 won); no new teaser proposed |

## F. Availability / QB flags (Saturday)
- OUT: Lamar Jackson (BAL, Huntley starts); DeVonta Smith, Dontayvion Wicks, Nolan Smith, Michael Carter (PHI); Theo Johnson, Jevon Holland (NYG); Jordan Mason (MIN); Rashee Rice (KC); Tyler Warren (IND); Jeremiyah Love (ARI); Emeka Egbuka (TB); David Montgomery (HOU).
- QUESTIONABLE / Sunday decisions: Baker Mayfield (TB, expected to start; BKR pulled TB passing props), Puka Nacua (LAR), Breece Hall (NYJ), Saquon Barkley (PHI, expected to play), Calvin Ridley and Tony Spears (TEN), Brock Bowers and Josh Jacobs status checks.
- Activated: Jonah Coleman (DEN), Christian Kirk and A.J. Terrell (ATL).
- Paris: gusts 53-57 km/h forecast at the open-air Stade de France.

## G. Player-prop leans
See `reports/bets/2026-w07-card.md` section 7 (props by window) and `reports/intel/games/2026-w07-game-*-props.md`. BKR player props are same-game only; BEO multi-game stacks allow at most two props per game.

## H. BUK BUK pool (straight-up winners)
See `reports/bets/2026-w07-pool-picks-fri.md` (CHI used Duma 7 / Kenny 5 on Thursday).

## I. Open Week 7 exposure
| Ticket | Stake | Legs / status |
|---|---|---|
| 740512242 BKR Flex SGP | $15 to win $353.39 | 4 of 6 won; needs KC +3.5, MIN ML |
| 740506458 BKR 3-team teaser | $30 to win $45 | SF -1 won; needs MIN -0.5, KC +8 |
| 740636102 BKR 10-team lottery | $5 to win $535.76 | MIN -6, GB/DET O51.5, DEN/SF/CAR/DAL/HOU/NYJ ML, KC/SEA O40.5, PIT/NO U46.5 |
| 740636092 BKR 9-team lottery | $20.74 to win $1,287.73 | Same legs except PIT/NO U46.5 |

## J. Dropped / guarded
| Item | Why |
|---|---|
| PIT@NO, CLE@TEN, SF@ATL, IND@MIN, LAR@LV spreads | Synthesis PASS at the current numbers (NO +3.5 and ATL +3.5 / LV +4 are contest-only) |
| CIN spread and CIN ML | Lamar OUT moved CIN from +1 to -2.5; both are passes. CIN +2.5 lives only in the SuperContest |
| PHI +4 | Dropped Saturday (pass at +4 or worse); PHI removed from the SuperContest five |
| GB/DET Over | Re-priced to 54.5 = fair; synthesis passes at 54.5. Live O51.5 already held |
| CLE -1.5 (contest) | Andy removed CLE from the SuperContest; CLE ML near fair (-129) is only a possible parlay leg |
| All NE/CHI signals | TNF final |

## L. Leans (not elevated; shown on game cards and write-ups only, marked Lean)
| Game | Market | Lean | Source | Tier | Note |
|---|---|---|---|---|---|
| PIT@NO | total | Under | conf 54.5%; sim at 44.5, fair 43.0; Paris open-air, gusts forecast 53-57 km/h; re-priced from 44.5 to 44 | 2 (C) | Under 44 (-113). Risk: Gusts below ~30 km/h remove the reason; pass at 43. Live U46.5 already on the lottery ticket |
| TB@CAR | spread | CAR | conf 51.4%; sim at -3, fair CAR -3.5; plus money on the key number; sharp spread money on TB (35% bets / 60% money) | 2- flag (C) | CAR -3 (+103). Risk: Mayfield Q; if Daniels starts CAR gets stronger, but sharp money is on TB |
| CLE@TEN | total | Under | conf 54.5%; sim at 37.5, fair 36.0; two bottom-10 offenses; re-priced to 37 | 2 (C) | Under 37 (-113). Risk: Pass at 36.5; Ridley and Spears Q; Denzel Ward Q |
| NYG@HOU | spread | NYG | conf 51.4%; sim at the +9.5 contest line (+10 adds the 10); fair HOU -9; HOU missing both starting safeties | 1+2 (B) | NYG +10 (-103). Risk: Sharp spread money on HOU; McCarthy first start; Theo Johnson and Jevon Holland OUT |
| SF@ATL | total | Under | conf 54.5%; sim at 49.5, fair 48.0; total now 50.5 (1 point better than the synthesis number) | 2 (C) | Under 50.5 (-108). Risk: Big money on the Over (54% bets / 69% money); Kirk and Terrell activated |
| DEN@ARI | total | Under | conf 54.7%; sim at 43, fair 41.5; DEN offense 27th by EPA | 2 (C) | Under 43 (-107). Risk: ARI has gone over 50 three times |
| LAR@LV | total | Over | conf 52.3%; blended sim at 48.5 (Nacua in 53.8%); LV allow 3.27 points per drive; re-priced to 48 | 2- flag (C) | Over 48 (-110). Risk: Pass if Nacua is out (fair drops to 48.5); Rams scoring markets pulled |
| KC@SEA | spread | KC | conf 52.6%; sim at +2.5 (+3 adds the push on 3); fair SEA -1.5; KC offense #5 by EPA | 1+2 flag (B) | KC +3 (-115). Risk: Line moved to SEA against 89% KC money; KC already on live +3.5 and +8 tickets |
| KC@SEA | total | Under | conf 51.5%; sim at 42.5; two top-4 defenses by EPA; Rice out; public Over without a move | 2- (C) | Under 42 (-108). Risk: Live KC/SEA O40.5 on both lottery tickets; lean only |
| DAL@PHI | total | Under | conf 54.7%; sim at 44, fair 42.5; McKee starting; Smith, Wicks, Nolan Smith, Carter OUT | 1+2 (B) | Under 44 (-108). Risk: DAL defense is the league's worst; Barkley Q; Monday news |

## K. Futures
No Week 7 futures changes proposed.
