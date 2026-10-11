# BAL@ATL packet — Baltimore Ravens @ Atlanta Falcons

Kickoff 2026-10-12T00:20:00.000Z UTC. Built 2026-10-11T06:35:51.302665+00:00. spread = HOME team line; favorite has the negative number; marginAdj in the simulator is home-positive points

## Market

**BKR** captured 2026-10-11T06:21:29.799Z; recommendation window ends 2026-10-11T12:21:29.799000+00:00; fresh at build: True
- spread: Baltimore Ravens 3 102; Atlanta Falcons -3 -117
- total: Over 43.5 -103; Under 43.5 -113
- moneyline: Baltimore Ravens  139; Atlanta Falcons  -160

**BEO** captured 2026-10-11T06:24:03.238Z; recommendation window ends 2026-10-11T12:24:03.238000+00:00; fresh at build: True
- spread: Baltimore Ravens 3.5 -120; Atlanta Falcons -3.5 100
- total: Over 43.5 -115; Under 43.5 -105
- moneyline: Baltimore Ravens  149; Atlanta Falcons  -170

Market-implied score: {"ATL": 23.25, "BAL": 20.25, "basis": "BKR home line -3 total 43.5"}

Action Network splits (captured 2026-10-09T19:41:08.878Z): {"game_id": 290915, "away_team": "BAL", "home_team": "ATL", "kickoff_at": "2026-10-12T00:20:00.000Z", "spread": [{"side": "home", "value": -3.5, "price_american": -101, "ticket_pct": 47, "money_pct": 59}, {"side": "away", "value": 3.5, "price_american": -119, "ticket_pct": 53, "money_pct": 41}], "total": [{"side": "over", "value": 44, "price_american": -110, "ticket_pct": 72, "money_pct": 73}, {"side": "under", "value": 44, "price_american": -109, "ticket_pct": 28, "money_pct": 27}], "moneyline": [{"side": "away", "value": 0, "price_american": 150, "ticket_pct": 49, "money_pct": 39}, {"side": "home", "value": 0, "price_american": -177, "ticket_pct": 51, "money_pct": 61}]}

SuperContest row (contest line, not a book price; labels may be reversed): {"away_team": "BAL", "home_team": "ATL", "favorite": "ATL", "underdog": "BAL", "favorite_spread": -3.5, "kickoff_display": "Sun 8:20 pm"}

## Warnings that touch this game

- AVAILABILITY BAL (ESPN 2026-10-11T06:35:38Z): Out: Cam Jurgens C, Trey Hendrickson LB, Lamar Jackson QB | Questionable/Doubtful: Marlon Humphrey CB, Zay Flowers WR | IR: Ja'Kobi Lane WR, Durham Smythe TE
- AVAILABILITY BAL ESPN roster IR/Out group (unconfirmed; NOT in the injury feed; ESPN status day-to-day; not confirmed Out): Adam Randall RB, Bilhal Kone CB, Danny Pinter C, Ethan Pocic C, Jahquez Robinson S, Jovaughn Gwyn G, Skylar Thompson QB, T.J. Tampa CB
- AVAILABILITY ATL (ESPN 2026-10-11T06:35:38Z): Out: Za'Darius Smith DE | Questionable/Doubtful: Jake Matthews OT, Divine Deablo LB, Samson Ebukam DE | IR: Yasir Abdullah LB
- AVAILABILITY ATL ESPN roster IR/Out group (unconfirmed; NOT in the injury feed; ESPN status day-to-day; not confirmed Out): A.J. Terrell Jr. CB, Anterio Thompson DT, Beaux Collins WR, Cameron Williams OL, Da'Shawn Hand DT, DeAngelo Malone LB, JD Bertrand LB, Storm Norton OT, Trey Sermon RB
- VENUE: ATL has a retractable roof; check game-day roof status before using weather

## Quarterbacks

- BAL: RESOLVED STARTER Tyler Huntley (from operator). ESPN depth ['Lamar Jackson', 'Tyler Huntley', 'Joe Fagnano', 'Skylar Thompson'], flag ok Lamar Jackson Out; [ESPN fetched 2026-10-11T06:35:38Z]. Operator-confirmed: Tyler Huntley (at 2026-10-11T01:54:00Z). Older projected-starter rows (may be weeks old, context only): [{"player": "Lamar Jackson", "role": "starter", "starter_confidence": 0.95, "latest_source": {"source": "week1-usage-locks.json", "published_at": null, "evidence": "Week 1 2026 usage leader at QB for BAL (usage score 25.0 vs runner-up 0) -- single-game sample, re-verify weekly for RB/WR/TE committee shifts."}}, {"player": "Tyler Huntley", "role": "likely_starter_or_primary", "starter_confidence": 0.7, "latest_source": {"source": "ESPN injuries API", "published_at": "2026-10-09T17:40:00.000Z", "evidence": "Huntley will start Sunday night's game against the Falcons after Lamar Jackson (ankle) was ruled out Friday, Jeff Zrebiec of The Athletic reports."}}]
- ATL: RESOLVED STARTER Michael Penix Jr. (from ESPN depth chart + injury report). ESPN depth ['Michael Penix Jr.', 'Tua Tagovailoa', 'Cooper Rush', 'Jack Strand'], flag ok  [ESPN fetched 2026-10-11T06:35:38Z]. Operator-confirmed: None (at None). Older projected-starter rows (may be weeks old, context only): []

Operator confirmation is stated, not verified; official inactives decide. Projected-starter rows can be weeks old: read their latest_source.

## ESPN injury report, non-Active entries (fetched 2026-10-11T06:35:38Z)

- BAL: Cam Jurgens C Out (2026-10-10); Marlon Humphrey CB Questionable (2026-10-10); Trey Hendrickson LB Out (2026-10-10); Zay Flowers WR Questionable (2026-10-09); Ja'Kobi Lane WR Injured Reserve (2026-10-09); Lamar Jackson QB Out (2026-10-09); Durham Smythe TE Injured Reserve (2026-10-07)
- ATL: Yasir Abdullah LB Injured Reserve (2026-10-11); Za'Darius Smith DE Out (2026-10-11); Jake Matthews OT Questionable (2026-10-10); Divine Deablo LB Questionable (2026-10-09); Samson Ebukam DE Questionable (2026-10-08)

This list is ESPN's injury feed only. Players absent from it may still be on a reserve list: see the next section. Only Questionable/Doubtful are genuinely ambiguous; official inactives decide.

## ESPN roster IR/Out group (unconfirmed; roster file 2026-10-11T06:35:36.033564+00:00)

In ESPN's roster `injuredReserveOrOut` group but NOT in the injury feed above; ESPN marks them day-to-day. Unresolved, likely on a reserve list. Do NOT treat as confirmed Out and do not use as a player leg without official inactives.

- BAL: Adam Randall RB; Bilhal Kone CB; Danny Pinter C; Ethan Pocic C; Jahquez Robinson S; Jovaughn Gwyn G; Skylar Thompson QB; T.J. Tampa CB
- ATL: A.J. Terrell Jr. CB; Anterio Thompson DT; Beaux Collins WR; Cameron Williams OL; Da'Shawn Hand DT; DeAngelo Malone LB; JD Bertrand LB; Storm Norton OT; Trey Sermon RB

## Team state: schedule, results and standings

### BAL (AFC North) 3-1
- PF 116 / PA 96 (diff +20); PPG 29.0 / PAPG 24.0; home 1-1, away 2-0, division 0-0
- Opponents faced to date have a combined record of 5-12; rest before this game: 7.3 days; byes used: none; byes remaining: [13]

| week | site | opp | opp_record | result | pf | pa |
|---|---|---|---|---|---|---|
| 1 | A | IND | 2-2 | W | 41 | 23 |
| 2 | H | NO | 1-3 | L | 17 | 24 |
| 3 | A | DAL | 2-3 | W | 34 | 31 |
| 4 | H | TEN | 0-4 | W | 24 | 18 |

Next games: wk5 A ATL; wk6 A CLE; wk7 H CIN; wk8 A BUF

### ATL (NFC South) 2-2
- PF 96 / PA 92 (diff +4); PPG 24.0 / PAPG 23.0; home 0-1, away 2-1, division 1-1
- Opponents faced to date have a combined record of 7-9; rest before this game: 6.0 days; byes used: none; byes remaining: [11]

| week | site | opp | opp_record | result | pf | pa |
|---|---|---|---|---|---|---|
| 1 | A | PIT | 2-2 | L | 13 | 20 |
| 2 | H | CAR | 2-2 | L | 3 | 34 |
| 3 | A | GB | 2-2 | W | 35 | 14 |
| 4 | A | NO | 1-3 | W | 45 | 24 |

Next games: wk5 H BAL; wk6 H CHI; wk7 H SF; wk8 A TB

## Standings context

**AFC North**
| rank | team | record | point_diff | div |
|---|---|---|---|---|
| 1 | BAL | 3-1 | 20 | 0-0 |
| 2 | CLE | 3-1 | -14 | 1-0 |
| 3 | CIN | 2-2 | 12 | 0-1 |
| 4 | PIT | 2-2 | -10 | 1-1 |

**NFC South**
| rank | team | record | point_diff | div |
|---|---|---|---|---|
| 1 | CAR | 2-2 | 12 | 1-0 |
| 2 | ATL | 2-2 | 4 | 1-1 |
| 3 | NO | 1-3 | -23 | 0-1 |
| 4 | TB | 1-4 | -12 | 0-0 |

**AFC order (top 8)**: 1 KC 4-0, 2 JAX 3-1, 3 LV 3-1, 4 BUF 3-1, 5 BAL 3-1, 6 CLE 3-1, 7 CIN 2-2, 8 IND 2-2

**NFC order (top 8)**: 1 SF 4-0, 2 MIN 4-0, 3 CHI 3-1, 4 SEA 3-1, 5 NYG 3-1, 6 CAR 2-2, 7 ATL 2-2, 8 LAR 2-2

Order is win% then point differential only; official NFL tiebreakers are not applied. Includes any Week 5 game ESPN lists as final at the ESPN fetch time (schedule.json status can lag; see espn-status-w05.json finals).

## Existing quantitative pass (provisional, unbacktested; 60% market / 25% FTN / 15% SRS)

Means: {"home": 23.586449508298802, "away": 21.158845479998476, "total": 44.745294988297275, "home_margin": 2.427604028300326}
Simulation: {"iterations": 100000, "mean_home": 23.694639041061617, "mean_away": 21.325021273347964, "home_win_pct": 0.55677, "home_cover_pct": 0.4843, "away_cover_pct": 0.5157, "over_pct": 0.51667, "under_pct": 0.48333000000000004}
Features: {"offense_z": {"ATL": 0.8195619275102368, "BAL": 1.4855307870529544}, "defense_weakness_z": {"ATL": -1.0494921578316299, "BAL": 0.15610000055064338}, "tempo_z": {"ATL": -0.7516270770057281, "BAL": 0.21045558156160418}, "srs": {"ATL": 0.381, "BAL": -0.709}, "secondary_adjustment_points": {"ATL": 0.435, "BAL": 0.405}}

## Calibrated simulator edge sweep (home-margin edge in points vs BKR line)

| home_margin_edge_pts | home_cover | away_cover | side_push | over | under | total_push |
|---|---|---|---|---|---|---|
| -3 | 0.3813 | 0.5372 | 0.0814 | 0.5 | 0.5 | 0 |
| -2 | 0.4067 | 0.5111 | 0.0822 | 0.5 | 0.5 | 0 |
| -1 | 0.4325 | 0.4849 | 0.0827 | 0.5 | 0.5 | 0 |
| 0 | 0.4587 | 0.4587 | 0.0827 | 0.5 | 0.5 | 0 |
| 1 | 0.4851 | 0.4325 | 0.0824 | 0.5 | 0.5 | 0 |
| 2 | 0.5118 | 0.4066 | 0.0816 | 0.5 | 0.5 | 0 |
| 3 | 0.5385 | 0.381 | 0.0805 | 0.5 | 0.5 | 0 |

Zero edge is exactly 50/50. These rows convert a hypothesised home-margin edge (points vs the BKR line) into cover/over probability using the calibrated 2018-2025 key-number-aware model. Use scripts/intel/margin-simulator.mjs for other values; never do this arithmetic by hand.

**Total-edge sweep (margin edge 0):**

| total_edge_pts | over | under | total_push |
|---|---|---|---|
| -3 | 0.4098 | 0.5902 | 0 |
| -2 | 0.4396 | 0.5604 | 0 |
| -1 | 0.4697 | 0.5303 | 0 |
| 0 | 0.5 | 0.5 | 0 |
| 1 | 0.5303 | 0.4697 | 0 |
| 2 | 0.5605 | 0.4395 | 0 |
| 3 | 0.5903 | 0.4097 | 0 |

## Power ratings

{"BAL": {"season": 2026, "team": "Ravens", "team_abbr": "BAL", "games_played": 4, "record": "3-1", "power_rating": {"srs": -0.709, "net_points_per_game": 5, "pythag_win_pct": 0.6103, "model_composite_z": 0.4196, "model_rank": 11, "srs_rank": 17, "net_ppg_rank": 9, "pythag_rank": 8, "market_implied_win_total": 11.71, "market_implied_rank": 5, "delta": 0.7284, "delta_basis": "z_score_market_minus_model"}, "attribution_note": "model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending."}, "ATL": {"season": 2026, "team": "Falcons", "team_abbr": "ATL", "games_played": 4, "record": "2-2", "power_rating": {"srs": 0.381, "net_points_per_game": 1, "pythag_win_pct": 0.5252, "model_composite_z": 0.12, "model_rank": 13, "srs_rank": 15, "net_ppg_rank": 12, "pythag_rank": 12, "market_implied_win_total": 8.69, "market_implied_rank": 17, "delta": -0.2606, "delta_basis": "z_score_market_minus_model"}, "attribution_note": "model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending."}}

Label check (the attribution text says prior-season, but these rows are tested against the 2026 point differential): {"BAL": {"net_ppg": 5, "recomputed_2026_point_diff_per_game": 5.0, "matches_2026": true}, "ATL": {"net_ppg": 1, "recomputed_2026_point_diff_per_game": 1.0, "matches_2026": true}} -- if matches_2026 is true, the ratings are 2026 four-game values and the attribution wording is stale.

## Weather / venue

{"game": "BAL@ATL", "weather_status": "venue_condition_verification_required", "materiality": "do_not_apply_outdoor_weather_without_current venue/roof confirmation"}

Venue (static stadium table, not a live capture; the schedule data has no venue field, so neutral-site or relocated games are NOT detected here (check the source quotes)): {"home_team_stadium_roof": "retractable roof (status must be checked)", "indoor_for_weather": false, "venue_field_in_schedule_data": false}

## Availability digest (top events per team)

{"BAL": {"event_count": 21, "qb_events": 4, "offensive_line_worsening": 1, "defensive_front_worsening": 1, "top_score": 127, "top_events": [{"player_name": "Lamar Jackson", "position": "QB", "unit": "quarterback", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "qb_major", "score": 127, "signal": "negative_availability"}, {"player_name": "Lamar Jackson", "position": "QB", "unit": "quarterback", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "qb_major", "score": 127, "signal": "negative_availability"}, {"player_name": "Tyler Huntley", "position": "QB", "unit": "quarterback", "event_type": "setback", "availability_trend": "worsening", "impact_bucket": "qb_major", "score": 119, "signal": "negative_availability"}, {"player_name": "Skylar Thompson", "position": "QB", "unit": "quarterback", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "qb_major", "score": 108, "signal": "negative_availability"}, {"player_name": "Cam Jurgens", "position": "C", "unit": "offensive_line", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "offensive_line_major", "score": 100, "signal": "negative_availability"}, {"player_name": "Ja'Kobi Lane", "position": "WR", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Trey Hendrickson", "position": "DE", "unit": "defensive_front", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 77, "signal": "negative_availability"}, {"player_name": "Ja'Kobi Lane", "position": "WR", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 72, "signal": "negative_availability"}]}, "ATL": {"event_count": 20, "qb_events": 0, "offensive_line_worsening": 0, "defensive_front_worsening": 4, "top_score": 86, "top_events": [{"player_name": "Da'Shawn Hand", "position": "DT", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Anterio Thompson", "position": "DT", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "DeAngelo Malone", "position": "DE", "unit": "defensive_front", "event_type": "pup", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 82, "signal": "negative_availability"}, {"player_name": "A.J. Terrell Jr.", "position": "CB", "unit": "secondary", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 72, "signal": "negative_availability"}, {"player_name": "Trey Sermon", "position": "RB", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 72, "signal": "negative_availability"}, {"player_name": "JD Bertrand", "position": "LB", "unit": "linebacker", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 72, "signal": "negative_availability"}, {"player_name": "Jalon Walker", "position": "LB", "unit": "linebacker", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 72, "signal": "negative_availability"}, {"player_name": "James Pearce Jr.", "position": "DE", "unit": "defensive_front", "event_type": "suspension", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 71, "signal": "negative_availability"}]}}

## Secondary matchup context (manual; capped, never a dominant driver)

- {"offense_team": "BAL", "defense_team": "ATL", "severity_score": 4.05}
- {"offense_team": "ATL", "defense_team": "BAL", "severity_score": 4.35}

## FTN team-level tables (names preserved)

{"BAL": {"record_count": 146, "team_level_tables": [{"category": "team-defense", "subpage": "efficiency", "team_abbr": "BAL", "metrics": {"Team": "Baltimore Ravens", "GP": "4", "EPA/PLY": "-0.015", "DVOA": "-3.0%", "SUCC%": "43.0%", "EXP%": "9.2%", "CONV%": "40.0%", "TO": "2", "TO%": "0.8%", "3&O": "18.6%", "MTKL%": "10.3%", "PEN%": "5.2%", "PENY": "39.5"}}, {"category": "team-defense", "subpage": "overview", "team_abbr": "BAL", "metrics": {"Team": "Baltimore Ravens", "GP": "4", "YD/PLY": "5.3", "PT/GM": "24.0", "FD%": "30.1%", "TO": "2", "DPBK%": "62.7%", "YD": "916", "TD": "4", "INT": "2", "RUSH%": "37.3%", "YD__2": "402", "TD__2": "6"}}, {"category": "team-defense", "subpage": "pass-rush", "team_abbr": "BAL", "metrics": {"Team": "Baltimore Ravens", "GP": "4", "DPBK": "156", "SK": "7", "SK%": "4.5%", "QBH%": "16.7%", "PRESS": "48", "PRESS%": "30.8%", "QPRESS%": "43.8%", "TTPR": "2.47", "DISR%": "1.3%", "BLZ%": "30.8%"}}, {"category": "team-defense", "subpage": "passing-analytics", "team_abbr": "BAL", "metrics": {"Team": "Baltimore Ravens", "GP": "4", "EPA/DB": "-0.009", "SUCC%": "44.9%", "DVOA": "0.4%", "CPOE": "-1.95%", "CBALL%": "76.1%", "EXP%": "13.2%", "INTW%": "1.4%", "TGHT%": "19.6%", "OPEN%": "54.3%", "TA%": "7.2%", "DROP%": "5.8%"}}, {"category": "team-defense", "subpage": "rush-analytics", "team_abbr": "BAL", "metrics": {"Team": "Baltimore Ravens", "GP": "4", "EPA/ATT": "-0.027", "SUCC%": "39.8%", "DVOA": "-7.6%", "aRYOE": "", "EXP%": "9.7%", "STF%": "21.5%", "YBCO": "1.13", "YACO": "1.63"}}, {"category": "team-offense", "subpage": "efficiency", "team_abbr": "BAL", "metrics": {"Team": "Baltimore Ravens", "GP": "4", "EPA/PLY": "0.165", "DVOA": "23.5%", "SUCC%": "50.6%", "EXP%": "13.8%", "CONV%": "31.7%", "TO": "2", "TO%": "0.84%", "PENY": "42.8", "PEN%": "10.88%"}}, {"category": "team-offense", "subpage": "overview", "team_abbr": "BAL", "metrics": {"Team": "Baltimore Ravens", "GP": "4", "YD/PLY": "6.9", "PT/GM": "29.0", "FD%": "33.9%", "TO": "2", "DPBK%": "51.5%", "YD": "1,030", "TD": "6", "INT": "1", "RUSH%": "48.5%", "YD__2": "614", "TD__2": "8"}}, {"category": "team-offense", "subpage": "pass-protection", "team_abbr": "BAL", "metrics": {"Team": "Baltimore Ravens", "GP": "4", "SK": "7", "SK%": "5.7%", "QBSK%": "0.0%", "QBH%": "10.6%", "PRESS%": "28.5%", "UPRES%": "40.5%", "BLITZ%": "31.7%", "TTPR": "2.59", "TTT": "2.79", "EPA/DB": "-0.237", "DVOA": "-64.2%", "SUCC%": "40.0%", "EPA/DB__2": "0.583", "DVOA__2": "67.1%", "SUCC%__2": "64.8%"}}, {"category": "team-offense", "subpage": "passing-analytics", "team_abbr": "BAL", "metrics": {"Team": "Baltimore Ravens", "GP": "4", "EPA/DB": "0.349", "SUCC%": "57.7%", "DVOA": "69.4%", "CPOE": "1.7%", "CBALL%": "78.1%", "EXP%": "18.4%", "INTW%": "2.9%", "HLT%": "1.9%", "TA%": "3.8%", "DROP%": "4.8%", "aDOT": "9.3", "aYAC": "6.4"}}, {"category": "team-offense", "subpage": "rushing-analytics", "team_abbr": "BAL", "metrics": {"Team": "Baltimore Ravens", "GP": "4", "EPA/ATT": "-0.031", "SUCC%": "43.1%", "DVOA": "5.5%", "aRYOE": "", "EXP%": "11.2%", "STF%": "22.4%", "aYBCO": "1.31", "aYACO": "2.02", "CRT%": "47.0%"}}, {"category": "team-offense", "subpage": "tempo", "team_abbr": "BAL", "metrics": {"Team": "Baltimore Ravens", "GP": "4", "PLY/GM": "59.8", "TOP": "29.76", "DRV/GM": "11.3", "SEC/PLY": "29.9", "PLY/DRV": "5.3", "YD/DRV": "36.5", "SEC/DRV": "159", "3&O": "22.2%", "SCD%": "44.4%"}}, {"category": "team-offense", "subpage": "tendencies", "team_abbr": "BAL", "metrics": {"Team": "Baltimore Ravens", "GP": "4", "DPBK%": "51.5%", "RUSH%": "48.5%", "SHG%": "49.4%", "NH%": "4.2%", "MOT%": "61.9%", "PA%": "29.3%", "IZ%": "23.3%", "OZ%": "40.5%", "MD%": "16.4%", "PWR%": "9.5%", "CTR%": "1.7%"}}]}, "ATL": {"record_count": 121, "team_level_tables": [{"category": "team-defense", "subpage": "efficiency", "team_abbr": "ATL", "metrics": {"Team": "Atlanta Falcons", "GP": "4", "EPA/PLY": "-0.069", "DVOA": "-7.0%", "SUCC%": "37.6%", "EXP%": "6.7%", "CONV%": "39.7%", "TO": "2", "TO%": "0.8%", "3&O": "28.3%", "MTKL%": "8.1%", "PEN%": "5.5%", "PENY": "42.0"}}, {"category": "team-defense", "subpage": "overview", "team_abbr": "ATL", "metrics": {"Team": "Atlanta Falcons", "GP": "4", "YD/PLY": "5.1", "PT/GM": "20.0", "FD%": "25.9%", "TO": "2", "DPBK%": "72.9%", "YD": "1,106", "TD": "7", "INT": "1", "RUSH%": "27.1%", "YD__2": "193", "TD__2": "2"}}, {"category": "team-defense", "subpage": "pass-rush", "team_abbr": "ATL", "metrics": {"Team": "Atlanta Falcons", "GP": "4", "DPBK": "186", "SK": "7", "SK%": "3.8%", "QBH%": "18.8%", "PRESS": "64", "PRESS%": "34.4%", "QPRESS%": "48.4%", "TTPR": "2.65", "DISR%": "1.1%", "BLZ%": "22.6%"}}, {"category": "team-defense", "subpage": "passing-analytics", "team_abbr": "ATL", "metrics": {"Team": "Atlanta Falcons", "GP": "4", "EPA/DB": "0.013", "SUCC%": "40.3%", "DVOA": "1.6%", "CPOE": "-1.21%", "CBALL%": "62.4%", "EXP%": "14.3%", "INTW%": "1.7%", "TGHT%": "27.0%", "OPEN%": "58.4%", "TA%": "5.6%", "DROP%": "3.4%"}}, {"category": "team-defense", "subpage": "rush-analytics", "team_abbr": "ATL", "metrics": {"Team": "Atlanta Falcons", "GP": "4", "EPA/ATT": "-0.291", "SUCC%": "30.4%", "DVOA": "-28.2%", "aRYOE": "", "EXP%": "2.9%", "STF%": "26.1%", "YBCO": "0.51", "YACO": "1.57"}}, {"category": "team-offense", "subpage": "efficiency", "team_abbr": "ATL", "metrics": {"Team": "Atlanta Falcons", "GP": "4", "EPA/PLY": "0.025", "DVOA": "-4.0%", "SUCC%": "52.6%", "EXP%": "11.4%", "CONV%": "37.8%", "TO": "7", "TO%": "3.07%", "PENY": "30.0", "PEN%": "6.58%"}}, {"category": "team-offense", "subpage": "overview", "team_abbr": "ATL", "metrics": {"Team": "Atlanta Falcons", "GP": "4", "YD/PLY": "6.2", "PT/GM": "21.0", "FD%": "33.8%", "TO": "7", "DPBK%": "40.8%", "YD": "708", "TD": "3", "INT": "5", "RUSH%": "59.2%", "YD__2": "708", "TD__2": "8"}}, {"category": "team-offense", "subpage": "pass-protection", "team_abbr": "ATL", "metrics": {"Team": "Atlanta Falcons", "GP": "4", "SK": "6", "SK%": "6.5%", "QBSK%": "16.7%", "QBH%": "9.7%", "PRESS%": "20.4%", "UPRES%": "25.0%", "BLITZ%": "35.5%", "TTPR": "2.57", "TTT": "2.29", "EPA/DB": "-0.723", "DVOA": "-112.2%", "SUCC%": "26.3%", "EPA/DB__2": "0.040", "DVOA__2": "-3.1%", "SUCC%__2": "54.1%"}}, {"category": "team-offense", "subpage": "passing-analytics", "team_abbr": "ATL", "metrics": {"Team": "Atlanta Falcons", "GP": "4", "EPA/DB": "-0.116", "SUCC%": "48.4%", "DVOA": "-12.0%", "CPOE": "-7.2%", "CBALL%": "67.1%", "EXP%": "20.0%", "INTW%": "7.1%", "HLT%": "0.0%", "TA%": "2.4%", "DROP%": "0.0%", "aDOT": "5.4", "aYAC": "8.4"}}, {"category": "team-offense", "subpage": "rushing-analytics", "team_abbr": "ATL", "metrics": {"Team": "Atlanta Falcons", "GP": "4", "EPA/ATT": "0.122", "SUCC%": "51.1%", "DVOA": "13.0%", "aRYOE": "", "EXP%": "10.4%", "STF%": "15.6%", "aYBCO": "1.19", "aYACO": "2.53", "CRT%": "49.6%"}}, {"category": "team-offense", "subpage": "tempo", "team_abbr": "ATL", "metrics": {"Team": "Atlanta Falcons", "GP": "4", "PLY/GM": "57.0", "TOP": "31.32", "DRV/GM": "11.8", "SEC/PLY": "30.4", "PLY/DRV": "5.3", "YD/DRV": "30.1", "SEC/DRV": "160", "3&O": "8.5%", "SCD%": "36.2%"}}, {"category": "team-offense", "subpage": "tendencies", "team_abbr": "ATL", "metrics": {"Team": "Atlanta Falcons", "GP": "4", "DPBK%": "40.8%", "RUSH%": "59.2%", "SHG%": "44.7%", "NH%": "3.5%", "MOT%": "67.1%", "PA%": "22.6%", "IZ%": "17.8%", "OZ%": "45.9%", "MD%": "17.0%", "PWR%": "9.6%", "CTR%": "1.5%"}}]}}

## Digest rows for this game (research digest; tier labels are strict)

    BAL@ATL | BAL +3 / ATL -3 | split | V: VSiN; RO: Action Network, Daniel Jeremiah & Bucky Brooks, Steve Fezzik, Ross Tucker; vs ATL: VSiN, Daniel Jeremiah & Bucky Brooks (RO), Sharp or Square (RO), Robert Mays / The Athletic (RO), Brandon Kravitz (RO), Pro Football Talk … (src +3.5 vs now +3) | skip
    BAL@ATL | total 44 (O +103 / U -120) | split | RO: BettingPros, Even Money, Steve Fezzik; vs Under: BettingPros (RO), Andrew Erickson (RO), Ryan Wormeli (RO); YT: BAL@ATL Over 43.5 Tera Roberts (src 43.5 vs now 44) | skip
    BAL@ATL | Derrick Henry o5.5 rec yds -107 | Over | YT/PI: Scott Bogman (YT); RO: BettingPros; src px not BKR | 2- research-only
    BAL@ATL | Tyler Huntley u23.5 rush yds -107 | Under | YT/PI: Scott Bogman (YT); RO: BettingPros; src px not BKR | 2- research-only
    BAL@ATL | Zay Flowers o68.5 rec yds -115 | Over | YT/PI: Tera Roberts (YT); RO: BettingPros; src px not BKR; QUESTIONABLE per availability feed 2026-10-10T18:40Z | 2- research-only
    BAL@ATL | Austin Hooper ATD +900 | Yes | RO: Action Network, Grant Neiffer; src px not BKR | 2- research-only
    BAL@ATL | Brian Robinson Jr. ATD +240 | Yes | RO: Action Network, Sean Koerner; src px not BKR | 2- research-only
    BAL@ATL | Derrick Henry ATD | Yes | RO: @thepropdealer (X), @thejoeholkashow (X); src px not BKR | 2- research-only

## Source rows (verified only): counts {"corroboration_only": 43, "tier_eligible": 4}

Only rows with tier_eligible=true may support a tier. near_miss and corroboration_only rows are context.

| row | kind | outlet | market | side | line | tier_eligible | near_miss |
|---|---|---|---|---|---|---|---|
| w05-expert-verified.json#rows[0] | expert_feed | Action Network | prop | None | 900 | False | False |
| w05-expert-verified.json#rows[1] | expert_feed | Action Network | prop | None | 240 | False | False |
| w05-expert-verified.json#rows[2] | expert_feed | Action Network | prop | None | 10000 | False | False |
| w05-expert-verified.json#rows[26] | expert_feed | Action Network | prop | None | 260 | False | False |
| w05-expert-verified.json#rows[39] | expert_feed | Action Network | spread | BAL | 3.5 | False | False |
| w05-expert-verified.json#rows[75] | expert_feed | BettingPros | total | Over | 43.5 | False | False |
| w05-expert-verified.json#rows[76] | expert_feed | BettingPros | prop | None | 221.5 | False | False |
| w05-expert-verified.json#rows[77] | expert_feed | BettingPros | prop | None | 68.5 | False | False |
| w05-expert-verified.json#rows[78] | expert_feed | BettingPros | prop | None | 23.5 | False | False |
| w05-expert-verified.json#rows[79] | expert_feed | BettingPros | prop | None | 174.5 | False | False |
| w05-expert-verified.json#rows[80] | expert_feed | BettingPros | prop | None | 5.5 | False | False |
| w05-expert-verified.json#rows[87] | expert_feed | Daniel Jeremiah & Bucky Brooks | moneyline | ATL | None | False | False |
| w05-expert-verified.json#rows[88] | expert_feed | Daniel Jeremiah & Bucky Brooks | moneyline | BAL | None | False | False |
| w05-expert-verified.json#rows[107] | expert_feed | Action Network | spread | BAL | 3.5 | False | False |
| w05-expert-verified.json#rows[124] | expert_feed | The Favorites | teaser | ATL | 2.5 | False | False |
| w05-expert-verified.json#rows[130] | expert_feed | Sharp or Square | spread | ATL | -3 | False | False |
| w05-expert-verified.json#rows[154] | expert_feed | Robert Mays / The Athletic | moneyline | ATL | None | False | False |
| w05-expert-verified.json#rows[169] | expert_feed | Even Money | total | Over | 43.5 | False | False |
| w05-expert-verified.json#rows[183] | expert_feed | Sharp or Square | spread | ATL | 3.5 | False | False |
| w05-expert-verified.json#rows[191] | expert_feed | BettingPros | total | Under | 46.5 | False | False |
| w05-expert-verified.json#rows[229] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[230] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[231] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[311] | podcast | 2026 NFL Week 5 Bets | total | Over | 43.5 | False | False |
| w05-expert-verified.json#rows[312] | podcast | 2026 NFL Week 5 Bets | spread | BAL | 3 | False | False |
| w05-expert-verified.json#rows[313] | podcast | 2026 NFL Week 5 Bets | spread | BAL | 3 | False | False |
| w05-expert-verified.json#rows[341] | podcast | NFL Week 5 Early Lines: Best Bets, Early Odds &amp; Betting Picks for Every Game (Ep. 1087) | totals | None | 45 | False | False |
| w05-expert-verified.json#rows[342] | podcast | NFL Week 5 Early Lines: Best Bets, Early Odds &amp; Betting Picks for Every Game (Ep. 1087) | totals | None | 45 | False | False |
| w05-expert-verified.json#rows[349] | podcast | Construction &amp; Big Dog Picks | NFL Week 5 Preview | spread | ATL | 2.5 | False | False |
| w05-expert-verified.json#rows[396] | article | ESPN NFL | prop | OVER 5.5 (-109) | None | False | False |
| w05-expert-verified.json#rows[448] | article | VSiN | spread | BAL | 3.5 | True | False |
| w05-expert-verified.json#rows[451] | article | VSiN | spread | BAL | 3.5 | True | False |
| w05-expert-verified.json#rows[475] | article | Twitter/X Bookmarks (Personal) | prop | OVER 0.5 | None | False | False |
| w05-expert-verified.json#rows[481] | article | Twitter/X Bookmarks (Personal) | prop | OVER 0.5 | None | False | False |
| w05-expert-verified.json#rows[525] | article | VSiN | spread | ATL | 3.0 | True | False |
| w05-expert-verified.json#rows[544] | article | Pro Football Talk | moneyline | ATL | None | False | False |
| w05-expert-verified.json#rows[568] | article | VSiN | spread | BAL | 3.5 | True | False |
| w05-expert-verified.json#rows[593] | article | Twitter/X Bookmarks (Personal) | prop | OVER 224.5 | None | False | False |
| w05-expert-verified.json#rows[594] | article | Twitter/X Bookmarks (Personal) | prop | OVER 87.5 | None | False | False |
| w05-expert-verified.json#rows[595] | article | Twitter/X Bookmarks (Personal) | prop | UNDER 37.5 | None | False | False |
| w05-expert-verified.json#rows[596] | article | Twitter/X Bookmarks (Personal) | prop | UNDER 4.5 | None | False | False |
| w05-expert-verified.json#rows[597] | article | Twitter/X Bookmarks (Personal) | prop | OVER 79.5 | None | False | False |
| w05-expert-verified.json#rows[598] | article | Twitter/X Bookmarks (Personal) | prop | OVER 39.5 | None | False | False |
| w05-expert-verified.json#rows[599] | article | Twitter/X Bookmarks (Personal) | prop | OVER 29.5 | None | False | False |
| w05-expert-verified.json#rows[600] | article | Twitter/X Bookmarks (Personal) | prop | UNDER 19.5 | None | False | False |
| w05-expert-verified.json#rows[601] | article | Twitter/X Bookmarks (Personal) | prop | UNDER 10.5 | None | False | False |
| w05-expert-verified.json#rows[602] | article | Twitter/X Bookmarks (Personal) | prop | OVER 6.5 | None | False | False |

- w05-expert-verified.json#rows[448] (VSiN) https://vsin.com/nfl/matt-youmans-nfl-week-5-best-bets-and-predictions/: "Ravens +3.5 at Falcons"

- w05-expert-verified.json#rows[451] (VSiN) https://vsin.com/nfl/wes-reynolds-nfl-week-5-best-bets-and-predictions/: "Baltimore Ravens +3.5 at Atlanta Falcons"

- w05-expert-verified.json#rows[525] (VSiN) https://vsin.com/nfl/expert-nfl-picks-week-5-best-bets-predictions-and-player-props-from-zachary-cohen/: "Falcons +3 (-118) vs."

- w05-expert-verified.json#rows[568] (VSiN) https://vsin.com/nfl/tuleys-takes-for-nfl-week-5/: "Best Bet: Ravens +3.5 (Pool Play Percentages: Ravens 67/33 in ATS contests, but Falcons still 67/33 in SU pools)."

## Read directly if needed

- weather_detail: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json (filter to BAL@ATL)
- prop_markets: BKR/BEO rows for event "Baltimore Ravens @ Atlanta Falcons" with market != game_lines
- player_stats: data/vault-seed/nflverse/player_stats_weekly.csv (season 2026) for BAL and ATL
- projected_starters: data/projected-starters/2026/latest.json (teams.BAL, teams.ATL)
