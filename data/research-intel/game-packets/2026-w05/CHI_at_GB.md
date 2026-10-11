# CHI@GB packet — Chicago Bears @ Green Bay Packers

Kickoff 2026-10-11T17:00:00.000Z UTC. Built 2026-10-11T03:13:48.008992+00:00. spread = HOME team line; favorite has the negative number; marginAdj in the simulator is home-positive points

**Division game** (NFC North).

## Market

**BKR** captured 2026-10-11T01:15:40.538Z; recommendation window ends 2026-10-11T07:15:40.538000+00:00; fresh at build: True
- spread: Chicago Bears -1.5 -101; Green Bay Packers 1.5 -115
- total: Over 46 -118; Under 46 101
- moneyline: Chicago Bears  -116; Green Bay Packers  103

**BEO** captured 2026-10-11T01:19:56.400Z; recommendation window ends 2026-10-11T07:19:56.400000+00:00; fresh at build: True
- spread: Chicago Bears -1 -113; Green Bay Packers 1 -107
- total: Over 46.5 -116; Under 46.5 -104
- moneyline: Chicago Bears  -119; Green Bay Packers  -101

Market-implied score: {"GB": 22.25, "CHI": 23.75, "basis": "BKR home line 1.5 total 46"}

Action Network splits (captured 2026-10-09T19:41:08.878Z): {"game_id": 290914, "away_team": "CHI", "home_team": "GB", "kickoff_at": "2026-10-11T17:00:00.000Z", "spread": [{"side": "home", "value": 1.5, "price_american": -110, "ticket_pct": 43, "money_pct": 54}, {"side": "away", "value": -1.5, "price_american": -110, "ticket_pct": 57, "money_pct": 46}], "total": [{"side": "under", "value": 45.5, "price_american": -109, "ticket_pct": 26, "money_pct": 32}, {"side": "over", "value": 45.5, "price_american": -111, "ticket_pct": 74, "money_pct": 68}], "moneyline": [{"side": "away", "value": 0, "price_american": -120, "ticket_pct": 72, "money_pct": 66}, {"side": "home", "value": 0, "price_american": -100, "ticket_pct": 28, "money_pct": 34}]}

SuperContest row (contest line, not a book price; labels may be reversed): {"away_team": "GB", "home_team": "CHI", "favorite": "CHI", "underdog": "GB", "favorite_spread": -3, "kickoff_display": "Sun 1:00 pm"}

## Warnings that touch this game

- QB CHI: ESPN lists Caleb Williams Questionable; (Questionable/Doubtful); starter is ambiguous -- operator says Tyson Bagent
- AVAILABILITY CHI (ESPN 2026-10-11T02:16:11Z): Out: Anthony Johnson Jr. S, Shemar Turner DT, Kyler Gordon CB, Keyshaun Elliott LB, Kyle Monangai RB | Questionable/Doubtful: Noah Sewell LB, Caleb Williams QB | IR: none
- AVAILABILITY GB (ESPN 2026-10-11T02:16:11Z): Out: Micah Parsons DE | Questionable/Doubtful: Jacob Monk C, Jager Burton C, Aaron Banks G, Javon Hargrave DT, Anthony Campbell DT | IR: Chris Brooks RB, Savion Williams WR, Edgerrin Cooper LB
- WEATHER: review_required: wind 22.3 km/h, gusts 42.1 km/h
- SUPERCONTEST LABELS REVERSED for this game: use its favorite/spread fields, not its away/home labels
- 1 near-miss source row(s) (verbatim but not self-identifying): context only

## Quarterbacks

- CHI: RESOLVED STARTER Tyson Bagent (from operator). ESPN depth ['Caleb Williams', 'Tyson Bagent', 'Case Keenum'], flag AMBIGUOUS Caleb Williams Questionable; [ESPN fetched 2026-10-11T02:16:11Z]. Operator-confirmed: Tyson Bagent (at 2026-10-11T01:54:00Z). Older projected-starter rows (may be weeks old, context only): [{"player": "Tyson Bagent", "role": "starter", "starter_confidence": 0.95, "latest_source": {"source": "ESPN injuries API", "published_at": "2026-10-05T16:24:00.000Z", "evidence": "Bears head coach Ben Johnson said that Bagent will start Sunday's game against the Packers in Green Bay, Sean Hammond of the Chicago Tribune reports."}}, {"player": "Caleb Williams", "role": "starter", "starter_confidence": 0.95, "latest_source": {"source": "week1-usage-locks.json", "published_at": null, "evidence": "Week 1 2026 usage leader at QB for CHI (usage score 29.0 vs runner-up 0) -- single-game sample, re-verify weekly for RB/WR/TE committee shifts."}}, {"player": "Case Keenum", "role": "likely_starter_or_primary", "starter_confidence": 0.94, "latest_source": {"source": "ESPN injuries API", "published_at": "2026-10-05T16:38:00.000Z", "evidence": "Keenum is expected to remain in a backup role for Sunday's game against the Packers after head coach Ben Johnson said that Tyson Bagent will start at quarterback in Week 5, Sean Hammond of the Chicago Tribune reports."}}]
- GB: RESOLVED STARTER Jordan Love (from ESPN depth chart + injury report). ESPN depth ['Jordan Love', 'Tyrod Taylor'], flag ok  [ESPN fetched 2026-10-11T02:16:11Z]. Operator-confirmed: None (at None). Older projected-starter rows (may be weeks old, context only): [{"player": "Jordan Love", "role": "starter", "starter_confidence": 0.95, "latest_source": {"source": "week1-usage-locks.json", "published_at": null, "evidence": "Week 1 2026 usage leader at QB for GB (usage score 42.0 vs runner-up 0) -- single-game sample, re-verify weekly for RB/WR/TE committee shifts."}}]

Operator confirmation is stated, not verified; official inactives decide. Projected-starter rows can be weeks old: read their latest_source.

## ESPN injury report, non-Active entries (fetched 2026-10-11T02:16:11Z)

- CHI: Anthony Johnson Jr. S Out (2026-10-11); Shemar Turner DT Out (2026-10-10); Kyler Gordon CB Out (2026-10-10); Noah Sewell LB Questionable (2026-10-10); Keyshaun Elliott LB Out (2026-10-10); Caleb Williams QB Questionable (2026-10-09); Kyle Monangai RB Out (2026-10-09)
- GB: Chris Brooks RB Injured Reserve (2026-10-10); Jacob Monk C Doubtful (2026-10-10); Jager Burton C Questionable (2026-10-10); Aaron Banks G Doubtful (2026-10-10); Javon Hargrave DT Questionable (2026-10-10); Savion Williams WR Injured Reserve (2026-10-09); Edgerrin Cooper LB Injured Reserve (2026-10-06); Anthony Campbell DT Questionable (2026-10-06); Micah Parsons DE Out (2026-10-05)

Players not on this list are not reported injured by ESPN. Only Questionable/Doubtful are genuinely ambiguous; official inactives decide.

## Team state: schedule, results and standings

### CHI (NFC North) 3-1
- PF 112 / PA 65 (diff +47); PPG 28.0 / PAPG 16.2; home 2-1, away 1-0, division 0-1
- Opponents faced to date have a combined record of 9-7; rest before this game: 7.0 days; byes used: none; byes remaining: [10]

| week | site | opp | opp_record | result | pf | pa |
|---|---|---|---|---|---|---|
| 1 | A | CAR | 2-2 | W | 59 | 37 |
| 2 | H | MIN | 4-0 | L | 3 | 9 |
| 3 | H | PHI | 2-2 | W | 27 | 7 |
| 4 | H | NYJ | 1-3 | W | 23 | 12 |

Next games: wk5 A GB; wk6 A ATL; wk7 H NE; wk8 A SEA

### GB (NFC North) 2-2
- PF 73 / PA 105 (diff -32); PPG 18.2 / PAPG 26.2; home 0-1, away 2-1, division 0-1
- Opponents faced to date have a combined record of 7-9; rest before this game: 7.0 days; byes used: none; byes remaining: [11]

| week | site | opp | opp_record | result | pf | pa |
|---|---|---|---|---|---|---|
| 1 | A | MIN | 4-0 | L | 22 | 39 |
| 2 | A | NYJ | 1-3 | W | 20 | 17 |
| 3 | H | ATL | 2-2 | L | 14 | 35 |
| 4 | A | TB | 0-4 | W | 17 | 14 |

Next games: wk5 H CHI; wk6 H DAL; wk7 A DET; wk8 H CAR

## Standings context

**NFC North**
| rank | team | record | point_diff | div |
|---|---|---|---|---|
| 1 | MIN | 4-0 | 35 | 2-0 |
| 2 | CHI | 3-1 | 47 | 0-1 |
| 3 | DET | 2-2 | -8 | 0-0 |
| 4 | GB | 2-2 | -32 | 0-1 |

**NFC order (top 8)**: 1 SF 4-0, 2 MIN 4-0, 3 CHI 3-1, 4 SEA 3-1, 5 NYG 3-1, 6 CAR 2-2, 7 DAL 2-2, 8 ATL 2-2

Order is win% then point differential only; official NFL tiebreakers are not applied. Includes the Week 5 TB@DAL final.

## Existing quantitative pass (provisional, unbacktested; 60% market / 25% FTN / 15% SRS)

Means: {"home": 21.102615968672293, "away": 25.715225717498914, "total": 46.81784168617121, "home_margin": -4.612609748826621}
Simulation: {"iterations": 100000, "mean_home": 21.32982820395581, "mean_away": 25.79336819086749, "home_win_pct": 0.39173, "home_cover_pct": 0.42768, "away_cover_pct": 0.5723199999999999, "over_pct": 0.52117, "under_pct": 0.47883}
Features: {"offense_z": {"GB": -0.8981051201727079, "CHI": 0.9842994197343811}, "defense_weakness_z": {"GB": 0.6734751006979868, "CHI": -1.0509842273345769}, "tempo_z": {"GB": -0.9790284326670985, "CHI": 1.8809809250739749}, "srs": {"GB": -7.417, "CHI": 12.116}, "secondary_adjustment_points": {"GB": 0.525, "CHI": 0.135}}

## Calibrated simulator edge sweep (home-margin edge in points vs BKR line)

| home_margin_edge_pts | home_cover | away_cover | side_push | over | under | total_push |
|---|---|---|---|---|---|---|
| -3 | 0.4216 | 0.5784 | 0 | 0.4848 | 0.4848 | 0.0304 |
| -2 | 0.4476 | 0.5524 | 0 | 0.4848 | 0.4848 | 0.0304 |
| -1 | 0.4738 | 0.5262 | 0 | 0.4848 | 0.4848 | 0.0304 |
| 0 | 0.5 | 0.5 | 0 | 0.4848 | 0.4848 | 0.0304 |
| 1 | 0.5262 | 0.4738 | 0 | 0.4848 | 0.4848 | 0.0304 |
| 2 | 0.5523 | 0.4477 | 0 | 0.4848 | 0.4848 | 0.0304 |
| 3 | 0.5782 | 0.4218 | 0 | 0.4848 | 0.4848 | 0.0304 |

Zero edge is exactly 50/50. These rows convert a hypothesised home-margin edge (points vs the BKR line) into cover/over probability using the calibrated 2018-2025 key-number-aware model. Use scripts/intel/margin-simulator.mjs for other values; never do this arithmetic by hand.

**Total-edge sweep (margin edge 0):**

| total_edge_pts | over | under | total_push |
|---|---|---|---|
| -3 | 0.395 | 0.5754 | 0.0296 |
| -2 | 0.4245 | 0.5454 | 0.03 |
| -1 | 0.4545 | 0.5152 | 0.0303 |
| 0 | 0.4848 | 0.4848 | 0.0304 |
| 1 | 0.5152 | 0.4545 | 0.0303 |
| 2 | 0.5454 | 0.4245 | 0.03 |
| 3 | 0.5755 | 0.3949 | 0.0296 |

## Power ratings

{"CHI": {"season": 2026, "team": "Bears", "team_abbr": "CHI", "games_played": 4, "record": "3-1", "power_rating": {"srs": 12.116, "net_points_per_game": 11.75, "pythag_win_pct": 0.7841, "model_composite_z": 1.6883, "model_rank": 3, "srs_rank": 3, "net_ppg_rank": 3, "pythag_rank": 3, "market_implied_win_total": 11, "market_implied_rank": 8, "delta": -0.8929, "delta_basis": "z_score_market_minus_model"}, "attribution_note": "model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending."}, "GB": {"season": 2026, "team": "Packers", "team_abbr": "GB", "games_played": 4, "record": "2-2", "power_rating": {"srs": -7.417, "net_points_per_game": -8, "pythag_win_pct": 0.297, "model_composite_z": -1.1172, "model_rank": 28, "srs_rank": 29, "net_ppg_rank": 29, "pythag_rank": 29, "market_implied_win_total": 8.31, "market_implied_rank": 22, "delta": 0.859, "delta_basis": "z_score_market_minus_model"}, "attribution_note": "model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending."}}

Label check (the attribution text says prior-season, but these rows are tested against the 2026 point differential): {"CHI": {"net_ppg": 11.75, "recomputed_2026_point_diff_per_game": 11.75, "matches_2026": true}, "GB": {"net_ppg": -8, "recomputed_2026_point_diff_per_game": -8.0, "matches_2026": true}} -- if matches_2026 is true, the ratings are 2026 four-game values and the attribution wording is stale.

## Weather / venue

{"game": "CHI@GB", "weather_status": "forecast_captured", "source_game": "CHI@GB", "materiality": "review_required: wind 22.3 km/h, gusts 42.1 km/h"}

Venue (static stadium table, not a live capture; the schedule data has no venue field, so neutral-site or relocated games are NOT detected here (check the source quotes)): {"home_team_stadium_roof": "outdoor", "indoor_for_weather": false, "venue_field_in_schedule_data": false}

## Availability digest (top events per team)

{"CHI": {"event_count": 24, "qb_events": 4, "offensive_line_worsening": 1, "defensive_front_worsening": 0, "top_score": 100, "top_events": [{"player_name": "Caleb Williams", "position": "QB", "unit": "quarterback", "event_type": "limited", "availability_trend": "stable", "impact_bucket": "qb_major", "score": 100, "signal": "review_context"}, {"player_name": "Caleb Williams", "position": "QB", "unit": "quarterback", "event_type": "status_update", "availability_trend": "unknown", "impact_bucket": "qb_major", "score": 94, "signal": "review_context"}, {"player_name": "Case Keenum", "position": "QB", "unit": "quarterback", "event_type": "active_news", "availability_trend": "unknown", "impact_bucket": "qb_major", "score": 93, "signal": "review_context"}, {"player_name": "Tyson Bagent", "position": "QB", "unit": "quarterback", "event_type": "active_news", "availability_trend": "unknown", "impact_bucket": "qb_major", "score": 93, "signal": "review_context"}, {"player_name": "Braxton Jones", "position": "OT", "unit": "offensive_line", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "offensive_line_major", "score": 90, "signal": "negative_availability"}, {"player_name": "Kyler Gordon", "position": "CB", "unit": "secondary", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 82, "signal": "negative_availability"}, {"player_name": "Kyle Monangai", "position": "RB", "unit": "offensive_skill", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 82, "signal": "negative_availability"}, {"player_name": "Tony Fields II", "position": "LB", "unit": "linebacker", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 72, "signal": "negative_availability"}]}, "GB": {"event_count": 29, "qb_events": 1, "offensive_line_worsening": 2, "defensive_front_worsening": 2, "top_score": 93, "top_events": [{"player_name": "Jordan Love", "position": "QB", "unit": "quarterback", "event_type": "active_news", "availability_trend": "unknown", "impact_bucket": "qb_major", "score": 93, "signal": "review_context"}, {"player_name": "Warren Brinson", "position": "DT", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Savion Williams", "position": "WR", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Jordon Riley", "position": "DT", "unit": "defensive_front", "event_type": "pup", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 82, "signal": "negative_availability"}, {"player_name": "Chris Brooks", "position": "RB", "unit": "offensive_skill", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 82, "signal": "negative_availability"}, {"player_name": "Jacob Monk", "position": "C", "unit": "offensive_line", "event_type": "doubtful", "availability_trend": "worsening", "impact_bucket": "offensive_line_major", "score": 77, "signal": "negative_availability"}, {"player_name": "Aaron Banks", "position": "G", "unit": "offensive_line", "event_type": "doubtful", "availability_trend": "worsening", "impact_bucket": "offensive_line_major", "score": 77, "signal": "negative_availability"}, {"player_name": "Edgerrin Cooper", "position": "LB", "unit": "linebacker", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 72, "signal": "negative_availability"}]}}

## Secondary matchup context (manual; capped, never a dominant driver)

- {"offense_team": "CHI", "defense_team": "GB", "severity_score": 1.35}
- {"offense_team": "GB", "defense_team": "CHI", "severity_score": 5.25}

## FTN team-level tables (names preserved)

{"CHI": {"record_count": 138, "team_level_tables": [{"category": "team-defense", "subpage": "efficiency", "team_abbr": "CHI", "metrics": {"Team": "Chicago Bears", "GP": "4", "EPA/PLY": "-0.059", "DVOA": "-7.1%", "SUCC%": "41.1%", "EXP%": "9.9%", "CONV%": "23.8%", "TO": "3", "TO%": "1.6%", "3&O": "30.8%", "MTKL%": "9.2%", "PEN%": "4.7%", "PENY": "8.3"}}, {"category": "team-defense", "subpage": "overview", "team_abbr": "CHI", "metrics": {"Team": "Chicago Bears", "GP": "4", "YD/PLY": "6.2", "PT/GM": "16.3", "FD%": "27.1%", "TO": "3", "DPBK%": "60.4%", "YD": "776", "TD": "4", "INT": "3", "RUSH%": "39.6%", "YD__2": "410", "TD__2": "3"}}, {"category": "team-defense", "subpage": "pass-rush", "team_abbr": "CHI", "metrics": {"Team": "Chicago Bears", "GP": "4", "DPBK": "116", "SK": "10", "SK%": "8.6%", "QBH%": "17.2%", "PRESS": "41", "PRESS%": "35.3%", "QPRESS%": "43.9%", "TTPR": "2.66", "DISR%": "0.9%", "BLZ%": "39.7%"}}, {"category": "team-defense", "subpage": "passing-analytics", "team_abbr": "CHI", "metrics": {"Team": "Chicago Bears", "GP": "4", "EPA/DB": "-0.095", "SUCC%": "38.8%", "DVOA": "-13.3%", "CPOE": "-0.73%", "CBALL%": "61.6%", "EXP%": "15.5%", "INTW%": "6.1%", "TGHT%": "33.3%", "OPEN%": "54.5%", "TA%": "7.1%", "DROP%": "2.0%"}}, {"category": "team-defense", "subpage": "rush-analytics", "team_abbr": "CHI", "metrics": {"Team": "Chicago Bears", "GP": "4", "EPA/ATT": "-0.005", "SUCC%": "44.7%", "DVOA": "1.1%", "aRYOE": "", "EXP%": "10.5%", "STF%": "14.5%", "YBCO": "1.82", "YACO": "2.00"}}, {"category": "team-offense", "subpage": "efficiency", "team_abbr": "CHI", "metrics": {"Team": "Chicago Bears", "GP": "4", "EPA/PLY": "0.077", "DVOA": "12.3%", "SUCC%": "47.0%", "EXP%": "10.7%", "CONV%": "49.3%", "TO": "4", "TO%": "1.34%", "PENY": "38.8", "PEN%": "6.71%"}}, {"category": "team-offense", "subpage": "overview", "team_abbr": "CHI", "metrics": {"Team": "Chicago Bears", "GP": "4", "YD/PLY": "5.9", "PT/GM": "28.0", "FD%": "29.9%", "TO": "4", "DPBK%": "50.7%", "YD": "976", "TD": "4", "INT": "2", "RUSH%": "49.3%", "YD__2": "785", "TD__2": "9"}}, {"category": "team-offense", "subpage": "pass-protection", "team_abbr": "CHI", "metrics": {"Team": "Chicago Bears", "GP": "4", "SK": "7", "SK%": "4.6%", "QBSK%": "0.0%", "QBH%": "11.9%", "PRESS%": "33.8%", "UPRES%": "22.8%", "BLITZ%": "47.7%", "TTPR": "2.85", "TTT": "2.84", "EPA/DB": "0.129", "DVOA": "-21.2%", "SUCC%": "43.1%", "EPA/DB__2": "0.268", "DVOA__2": "33.4%", "SUCC%__2": "55.0%"}}, {"category": "team-offense", "subpage": "passing-analytics", "team_abbr": "CHI", "metrics": {"Team": "Chicago Bears", "GP": "4", "EPA/DB": "0.221", "SUCC%": "51.0%", "DVOA": "39.8%", "CPOE": "6.0%", "CBALL%": "72.0%", "EXP%": "15.6%", "INTW%": "2.3%", "HLT%": "1.5%", "TA%": "6.8%", "DROP%": "3.0%", "aDOT": "7.0", "aYAC": "5.2"}}, {"category": "team-offense", "subpage": "rushing-analytics", "team_abbr": "CHI", "metrics": {"Team": "Chicago Bears", "GP": "4", "EPA/ATT": "-0.071", "SUCC%": "42.9%", "DVOA": "-2.5%", "aRYOE": "", "EXP%": "10.2%", "STF%": "17.7%", "aYBCO": "1.49", "aYACO": "2.85", "CRT%": "60.9%"}}, {"category": "team-offense", "subpage": "tempo", "team_abbr": "CHI", "metrics": {"Team": "Chicago Bears", "GP": "4", "PLY/GM": "74.5", "TOP": "35.11", "DRV/GM": "10.3", "SEC/PLY": "28.3", "PLY/DRV": "7.3", "YD/DRV": "43.0", "SEC/DRV": "206", "3&O": "7.3%", "SCD%": "48.8%"}}, {"category": "team-offense", "subpage": "tendencies", "team_abbr": "CHI", "metrics": {"Team": "Chicago Bears", "GP": "4", "DPBK%": "50.7%", "RUSH%": "49.3%", "SHG%": "46.3%", "NH%": "6.0%", "MOT%": "45.6%", "PA%": "32.5%", "IZ%": "28.6%", "OZ%": "44.2%", "MD%": "12.2%", "PWR%": "4.1%", "CTR%": "2.0%"}}]}, "GB": {"record_count": 138, "team_level_tables": [{"category": "team-defense", "subpage": "efficiency", "team_abbr": "GB", "metrics": {"Team": "Green Bay Packers", "GP": "4", "EPA/PLY": "0.040", "DVOA": "7.0%", "SUCC%": "44.7%", "EXP%": "6.5%", "CONV%": "51.7%", "TO": "4", "TO%": "1.5%", "3&O": "15.6%", "MTKL%": "9.5%", "PEN%": "6.9%", "PENY": "44.0"}}, {"category": "team-defense", "subpage": "overview", "team_abbr": "GB", "metrics": {"Team": "Green Bay Packers", "GP": "4", "YD/PLY": "5.2", "PT/GM": "26.3", "FD%": "28.6%", "TO": "4", "DPBK%": "54.2%", "YD": "802", "TD": "6", "INT": "4", "RUSH%": "45.8%", "YD__2": "557", "TD__2": "7"}}, {"category": "team-defense", "subpage": "pass-rush", "team_abbr": "GB", "metrics": {"Team": "Green Bay Packers", "GP": "4", "DPBK": "142", "SK": "10", "SK%": "7.0%", "QBH%": "14.8%", "PRESS": "38", "PRESS%": "26.8%", "QPRESS%": "55.3%", "TTPR": "2.39", "DISR%": "1.4%", "BLZ%": "39.4%"}}, {"category": "team-defense", "subpage": "passing-analytics", "team_abbr": "GB", "metrics": {"Team": "Green Bay Packers", "GP": "4", "EPA/DB": "0.092", "SUCC%": "47.2%", "DVOA": "9.7%", "CPOE": "2.23%", "CBALL%": "73.1%", "EXP%": "7.6%", "INTW%": "5.0%", "TGHT%": "21.0%", "OPEN%": "66.4%", "TA%": "5.0%", "DROP%": "2.5%"}}, {"category": "team-defense", "subpage": "rush-analytics", "team_abbr": "GB", "metrics": {"Team": "Green Bay Packers", "GP": "4", "EPA/ATT": "-0.022", "SUCC%": "41.7%", "DVOA": "4.2%", "aRYOE": "", "EXP%": "7.5%", "STF%": "24.2%", "YBCO": "0.95", "YACO": "2.28"}}, {"category": "team-offense", "subpage": "efficiency", "team_abbr": "GB", "metrics": {"Team": "Green Bay Packers", "GP": "4", "EPA/PLY": "-0.089", "DVOA": "-19.0%", "SUCC%": "39.1%", "EXP%": "8.1%", "CONV%": "30.9%", "TO": "6", "TO%": "2.55%", "PENY": "42.0", "PEN%": "10.21%"}}, {"category": "team-offense", "subpage": "overview", "team_abbr": "GB", "metrics": {"Team": "Green Bay Packers", "GP": "4", "YD/PLY": "5.4", "PT/GM": "18.3", "FD%": "26.0%", "TO": "6", "DPBK%": "68.9%", "YD": "1,041", "TD": "8", "INT": "3", "RUSH%": "31.1%", "YD__2": "232", "TD__2": "0"}}, {"category": "team-offense", "subpage": "pass-protection", "team_abbr": "GB", "metrics": {"Team": "Green Bay Packers", "GP": "4", "SK": "8", "SK%": "4.9%", "QBSK%": "37.5%", "QBH%": "19.8%", "PRESS%": "27.8%", "UPRES%": "35.0%", "BLITZ%": "40.7%", "TTPR": "2.33", "TTT": "2.17", "EPA/DB": "-0.481", "DVOA": "-83.5%", "SUCC%": "28.9%", "EPA/DB__2": "0.224", "DVOA__2": "19.8%", "SUCC%__2": "45.3%"}}, {"category": "team-offense", "subpage": "passing-analytics", "team_abbr": "GB", "metrics": {"Team": "Green Bay Packers", "GP": "4", "EPA/DB": "0.028", "SUCC%": "40.7%", "DVOA": "6.6%", "CPOE": "-8.8%", "CBALL%": "68.2%", "EXP%": "14.9%", "INTW%": "3.9%", "HLT%": "1.3%", "TA%": "1.9%", "DROP%": "7.1%", "aDOT": "8.4", "aYAC": "6.1"}}, {"category": "team-offense", "subpage": "rushing-analytics", "team_abbr": "GB", "metrics": {"Team": "Green Bay Packers", "GP": "4", "EPA/ATT": "-0.349", "SUCC%": "35.6%", "DVOA": "-38.2%", "aRYOE": "", "EXP%": "8.2%", "STF%": "26.0%", "aYBCO": "1.15", "aYACO": "2.00", "CRT%": "62.9%"}}, {"category": "team-offense", "subpage": "tempo", "team_abbr": "GB", "metrics": {"Team": "Green Bay Packers", "GP": "4", "PLY/GM": "58.8", "TOP": "25.11", "DRV/GM": "11.0", "SEC/PLY": "25.6", "PLY/DRV": "5.3", "YD/DRV": "28.9", "SEC/DRV": "137", "3&O": "27.3%", "SCD%": "31.8%"}}, {"category": "team-offense", "subpage": "tendencies", "team_abbr": "GB", "metrics": {"Team": "Green Bay Packers", "GP": "4", "DPBK%": "68.9%", "RUSH%": "31.1%", "SHG%": "64.7%", "NH%": "9.8%", "MOT%": "57.4%", "PA%": "16.0%", "IZ%": "24.7%", "OZ%": "21.9%", "MD%": "21.9%", "PWR%": "12.3%", "CTR%": "5.5%"}}]}}

## Digest rows for this game (research digest; tier labels are strict)

    CHI@GB | GB +1.5 -115 / ML +103 | GB | V: VSiN; RO: Action Network, The Favorites, BettingPros, Even Money, Andrew Erickson, Steve Fezzik, Ross Tucker, Ryan Wormeli, Brandon Kravitz, VSiN; vs CHI: Daniel Jeremiah & Bucky Brooks (RO), BettingPros (RO), Sharp or Square (RO),… | 2-
    CHI@GB | O46 -118 | Over | RO: BettingPros (src 44.5 vs now 46) | 2- research-only
    CHI@GB | Luther Burden ATD +240 | Yes | RO: Action Network, Gilles Gallant; src px not BKR | 2- research-only
    CHI@GB | Tucker Kraft ATD +250 | Yes | RO: Action Network, Gilles Gallant; src px not BKR | 2- research-only

## Source rows (verified only): counts {"corroboration_only": 32, "tier_eligible": 2, "near_miss": 1}

Only rows with tier_eligible=true may support a tier. near_miss and corroboration_only rows are context.

| row | kind | outlet | market | side | line | tier_eligible | near_miss |
|---|---|---|---|---|---|---|---|
| w05-expert-verified.json#rows[18] | expert_feed | Action Network | prop | None | 240 | False | False |
| w05-expert-verified.json#rows[19] | expert_feed | Action Network | prop | None | 250 | False | False |
| w05-expert-verified.json#rows[41] | expert_feed | Action Network | spread | GB | 2.5 | False | False |
| w05-expert-verified.json#rows[71] | expert_feed | BettingPros | prop | None | 33.5 | False | False |
| w05-expert-verified.json#rows[74] | expert_feed | BettingPros | prop | None | 10.5 | False | False |
| w05-expert-verified.json#rows[83] | expert_feed | Daniel Jeremiah & Bucky Brooks | moneyline | CHI | None | False | False |
| w05-expert-verified.json#rows[127] | expert_feed | The Favorites | spread | GB | 2.5 | False | False |
| w05-expert-verified.json#rows[140] | expert_feed | BettingPros | spread | GB | None | False | False |
| w05-expert-verified.json#rows[153] | expert_feed | Even Money | spread | GB | 2.5 | False | False |
| w05-expert-verified.json#rows[173] | expert_feed | BettingPros | spread | CHI | -2.5 | False | False |
| w05-expert-verified.json#rows[181] | expert_feed | Sharp or Square | spread | CHI | -1.5 | False | False |
| w05-expert-verified.json#rows[194] | expert_feed | BettingPros | teaser | GB | 1.5 | False | False |
| w05-expert-verified.json#rows[195] | expert_feed | BettingPros | total | Over | 44.5 | False | False |
| w05-expert-verified.json#rows[221] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[222] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[245] | podcast | NFL Week 5 Picks &amp; Predictions: Best Bets, Upset Specials, Parlays &amp; Props (Ep. 1092) | spread | GB | 2.5 | False | False |
| w05-expert-verified.json#rows[251] | podcast | NFL Week 5 Picks &amp; Predictions: Best Bets, Upset Specials, Parlays &amp; Props (Ep. 1092) | prop | OVER | 13.5 | False | False |
| w05-expert-verified.json#rows[263] | podcast | 2026 NFL Week 5 Prop Bets &amp; Parlays | spread | GB | 2.5 | False | False |
| w05-expert-verified.json#rows[264] | podcast | 2026 NFL Week 5 Prop Bets &amp; Parlays | best_bet | None | 2.5 | False | False |
| w05-expert-verified.json#rows[289] | podcast | Early NFL BEST BETS &amp; Survivor Pool Picks: Week 5 Predictions (Ep. 1089) | spread | CHI | -2.5 | False | False |
| w05-expert-verified.json#rows[296] | podcast | 2026 NFL Week 5 Bets | spread | GB | 3 | False | False |
| w05-expert-verified.json#rows[297] | podcast | 2026 NFL Week 5 Bets | spread | GB | 3 | False | False |
| w05-expert-verified.json#rows[330] | podcast | NFL Week 5 Early Lines: Best Bets, Early Odds &amp; Betting Picks for Every Game (Ep. 1087) | spread | GB | 2.5 | False | False |
| w05-expert-verified.json#rows[331] | podcast | NFL Week 5 Early Lines: Best Bets, Early Odds &amp; Betting Picks for Every Game (Ep. 1087) | spread | GB | 2.5 | False | False |
| w05-expert-verified.json#rows[350] | podcast | Construction &amp; Big Dog Picks | NFL Week 5 Preview | spread | GB | 2.5 | False | False |
| w05-expert-verified.json#rows[373] | podcast | NFL WEEK 5 Betting Preview: Bucs-Cowboys, Bears-Packers and more | spread | CHI | -2.5 | False | False |
| w05-expert-verified.json#rows[392] | article | ESPN NFL | prop | Christian Watson (+195) | None | True | False |
| w05-expert-verified.json#rows[399] | article | ESPN NFL | prop | OVER 3.5 (+123) | None | False | False |
| w05-expert-verified.json#rows[400] | article | ESPN NFL | prop | OVER 0.5 (-102) | None | False | False |
| w05-expert-verified.json#rows[471] | article | Twitter/X Bookmarks (Personal) | prop | OVER 0.5 | None | False | False |
| w05-expert-verified.json#rows[512] | article | VSiN | spread | GB | 1.5 | False | True |
| w05-expert-verified.json#rows[519] | article | VSiN | moneyline | GB | None | True | False |
| w05-expert-verified.json#rows[533] | article | Pro Football Talk | moneyline | CHI | None | False | False |
| w05-expert-verified.json#rows[580] | article | Twitter/X Bookmarks (Personal) | prop | OVER | None | False | False |
| w05-expert-verified.json#rows[581] | article | Twitter/X Bookmarks (Personal) | prop | OVER | None | False | False |

- w05-expert-verified.json#rows[392] (ESPN NFL) https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games: "Watson has scored at least one touchdown in three of four games played, and he has four end zone targets on the season."

- w05-expert-verified.json#rows[512] (VSiN) https://vsin.com/nfl/steve-makinen-week-5-nfl-best-bets/: "NFL Best Bet: I'll back a much more motivated Green Bay +1.5 vs."

- w05-expert-verified.json#rows[519] (VSiN) https://vsin.com/nfl/expert-nfl-picks-week-5-best-bets-predictions-and-player-props-from-zachary-cohen/: "Bet: Packers ML (+120)"

## Read directly if needed

- weather_detail: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json (filter to CHI@GB)
- prop_markets: BKR/BEO rows for event "Chicago Bears @ Green Bay Packers" with market != game_lines
- player_stats: data/vault-seed/nflverse/player_stats_weekly.csv (season 2026) for CHI and GB
- projected_starters: data/projected-starters/2026/latest.json (teams.CHI, teams.GB)
