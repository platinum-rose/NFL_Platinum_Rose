# MIN@NO packet — Minnesota Vikings @ New Orleans Saints

Kickoff 2026-10-11T17:00:00.000Z UTC. Built 2026-10-11T01:22:14.064268+00:00. spread = HOME team line; favorite has the negative number; marginAdj in the simulator is home-positive points

## Market

**BKR** captured 2026-10-11T01:15:40.538Z; recommendation window ends 2026-10-11T07:15:40.538000+00:00; fresh at build: True
- spread: Minnesota Vikings -2.5 -103; New Orleans Saints 2.5 -113
- total: Over 41.5 -103; Under 41.5 -113
- moneyline: Minnesota Vikings  -131; New Orleans Saints  115

**BEO** captured 2026-10-11T01:19:56.400Z; recommendation window ends 2026-10-11T07:19:56.400000+00:00; fresh at build: True
- spread: Minnesota Vikings -1 -125; New Orleans Saints 1 105
- total: Over 42 100; Under 42 -120
- moneyline: Minnesota Vikings  -140; New Orleans Saints  120

**BOOK CONFLICT:** BKR home line 2.5 vs BEO 1 (>=1.0 pt apart); recapture before relying on either

Market-implied score: {"NO": 19.5, "MIN": 22.0, "basis": "BKR home line 2.5 total 41.5"}

Action Network opener: {"an_game_id": 290906, "kickoff_utc": "2026-10-11T17:00:00Z", "sp": {"NO": 1.5, "MIN": -1.5}, "sp_odds_home": -112, "sp_at": "2026-10-05T00:30:25Z", "tot": 43.0, "tot_at": "2026-10-05T00:30:25Z", "ml": {"MIN": -122, "NO": 101}, "carried_from_before_cutoff": false}

Action Network splits (captured 2026-10-09T19:41:08.878Z): {"game_id": 290906, "away_team": "MIN", "home_team": "NO", "kickoff_at": "2026-10-11T17:00:00.000Z", "spread": [{"side": "home", "value": 2.5, "price_american": -108, "ticket_pct": 44, "money_pct": 48}, {"side": "away", "value": -2.5, "price_american": -110, "ticket_pct": 56, "money_pct": 52}], "total": [{"side": "under", "value": 41.5, "price_american": -110, "ticket_pct": 24, "money_pct": 27}, {"side": "over", "value": 41.5, "price_american": -111, "ticket_pct": 76, "money_pct": 73}], "moneyline": [{"side": "home", "value": 0, "price_american": 119, "ticket_pct": 25, "money_pct": 31}, {"side": "away", "value": 0, "price_american": -143, "ticket_pct": 75, "money_pct": 69}]}

SuperContest row (contest line, not a book price; labels may be reversed): {"away_team": "NO", "home_team": "MIN", "favorite": "MIN", "underdog": "NO", "favorite_spread": -2.5, "kickoff_display": "Sun 1:00 pm"}

## Team state: schedule, results and standings

### MIN (NFC North) 4-0
- PF 86 / PA 51 (diff +35); PPG 21.5 / PAPG 12.8; home 2-0, away 2-0, division 2-0
- Opponents faced to date have a combined record of 5-11; rest before this game: 6.9 days; byes used: none; byes remaining: [6]

| week | site | opp | opp_record | result | pf | pa |
|---|---|---|---|---|---|---|
| 1 | H | GB | 2-2 | W | 39 | 22 |
| 2 | A | CHI | 3-1 | W | 9 | 3 |
| 3 | A | TB | 0-4 | W | 23 | 16 |
| 4 | H | MIA | 0-4 | W | 15 | 10 |

Next games: wk5 A NO; wk7 H IND; wk8 A DET; wk9 H BUF

### NO (NFC South) 1-3
- PF 105 / PA 128 (diff -23); PPG 26.2 / PAPG 32.0; home 0-2, away 1-1, division 0-1
- Opponents faced to date have a combined record of 10-6; rest before this game: 5.7 days; byes used: none; byes remaining: [8]

| week | site | opp | opp_record | result | pf | pa |
|---|---|---|---|---|---|---|
| 1 | A | DET | 2-2 | L | 30 | 31 |
| 2 | A | BAL | 3-1 | W | 24 | 17 |
| 3 | H | LV | 3-1 | L | 27 | 35 |
| 4 | H | ATL | 2-2 | L | 24 | 45 |

Next games: wk5 H MIN; wk6 A NYG; wk7 H PIT; wk9 H CLE

## Standings context

**NFC North**
| rank | team | record | point_diff | div |
|---|---|---|---|---|
| 1 | MIN | 4-0 | 35 | 2-0 |
| 2 | CHI | 3-1 | 47 | 0-1 |
| 3 | DET | 2-2 | -8 | 0-0 |
| 4 | GB | 2-2 | -32 | 0-1 |

**NFC South**
| rank | team | record | point_diff | div |
|---|---|---|---|---|
| 1 | CAR | 2-2 | 12 | 1-0 |
| 2 | ATL | 2-2 | 4 | 1-1 |
| 3 | NO | 1-3 | -23 | 0-1 |
| 4 | TB | 0-4 | -20 | 0-0 |

**NFC order (top 8)**: 1 SF 4-0, 2 MIN 4-0, 3 CHI 3-1, 4 SEA 3-1, 5 NYG 3-1, 6 CAR 2-2, 7 DAL 2-2, 8 ATL 2-2

Order is win% then point differential only; official NFL tiebreakers are not applied. Includes the Week 5 TB@DAL final.

## Existing quantitative pass (provisional, unbacktested; 60% market / 25% FTN / 15% SRS)

Means: {"home": 18.92125789910636, "away": 23.41648140568521, "total": 42.33773930479157, "home_margin": -4.495223506578849}
Simulation: {"iterations": 100000, "mean_home": 19.309341190235397, "mean_away": 23.59861324440686, "home_win_pct": 0.39513, "home_cover_pct": 0.45617, "away_cover_pct": 0.54383, "over_pct": 0.52542, "under_pct": 0.47458}
Features: {"offense_z": {"NO": 0.4901901620420403, "MIN": -1.3997493634116442}, "defense_weakness_z": {"NO": 2.1758647510417384, "MIN": -2.3827805978412337}, "tempo_z": {"NO": 1.0588375622982542, "MIN": -0.043184392060692064}, "srs": {"NO": -5.097, "MIN": 8.477}, "secondary_adjustment_points": {"NO": 0.255, "MIN": 0.405}}

## Calibrated simulator edge sweep (home-margin edge in points vs BKR line)

| home_margin_edge_pts | home_cover | away_cover | side_push | over | under | total_push |
|---|---|---|---|---|---|---|
| -3 | 0.4215 | 0.5785 | 0 | 0.5 | 0.5 | 0 |
| -2 | 0.4476 | 0.5524 | 0 | 0.5 | 0.5 | 0 |
| -1 | 0.4738 | 0.5262 | 0 | 0.5 | 0.5 | 0 |
| 0 | 0.5 | 0.5 | 0 | 0.5 | 0.5 | 0 |
| 1 | 0.5262 | 0.4738 | 0 | 0.5 | 0.5 | 0 |
| 2 | 0.5522 | 0.4478 | 0 | 0.5 | 0.5 | 0 |
| 3 | 0.578 | 0.422 | 0 | 0.5 | 0.5 | 0 |

Zero edge is exactly 50/50. These rows convert a hypothesised home-margin edge (points vs the BKR line) into cover/over probability using the calibrated 2018-2025 key-number-aware model. Use scripts/intel/margin-simulator.mjs for other values; never do this arithmetic by hand.

## Power ratings

{"MIN": {"season": 2026, "team": "Vikings", "team_abbr": "MIN", "games_played": 4, "record": "4-0", "power_rating": {"srs": 8.477, "net_points_per_game": 8.75, "pythag_win_pct": 0.7753, "model_composite_z": 1.3537, "model_rank": 5, "srs_rank": 5, "net_ppg_rank": 5, "pythag_rank": 4, "market_implied_win_total": 11, "market_implied_rank": 9, "delta": -0.5459, "delta_basis": "z_score_market_minus_model"}, "attribution_note": "model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending."}, "NO": {"season": 2026, "team": "Saints", "team_abbr": "NO", "games_played": 4, "record": "1-3", "power_rating": {"srs": -5.097, "net_points_per_game": -5.75, "pythag_win_pct": 0.3848, "model_composite_z": -0.7316, "model_rank": 24, "srs_rank": 25, "net_ppg_rank": 25, "pythag_rank": 23, "market_implied_win_total": 7.88, "market_implied_rank": 23, "delta": 0.274, "delta_basis": "z_score_market_minus_model"}, "attribution_note": "model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending."}}

## Weather / venue

{"game": "MIN@NO", "weather_status": "venue_condition_verification_required", "materiality": "do_not_apply_outdoor_weather_without_current venue/roof confirmation"}

## Availability digest (top events per team)

{"MIN": {"event_count": 21, "qb_events": 0, "offensive_line_worsening": 4, "defensive_front_worsening": 1, "top_score": 104, "top_events": [{"player_name": "Michael Jurgens", "position": "C", "unit": "offensive_line", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "offensive_line_major", "score": 104, "signal": "negative_availability"}, {"player_name": "Donovan Jackson", "position": "G", "unit": "offensive_line", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "offensive_line_major", "score": 90, "signal": "negative_availability"}, {"player_name": "Tyler Batty", "position": "DT", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Ben Yurosek", "position": "TE", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Christian Darrisaw", "position": "OT", "unit": "offensive_line", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "offensive_line_major", "score": 81, "signal": "negative_availability"}, {"player_name": "Brian O'Neill", "position": "OT", "unit": "offensive_line", "event_type": "setback", "availability_trend": "worsening", "impact_bucket": "offensive_line_major", "score": 79, "signal": "negative_availability"}, {"player_name": "Jordan Mason", "position": "RB", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 72, "signal": "negative_availability"}, {"player_name": "Josh Oliver", "position": "TE", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 72, "signal": "negative_availability"}]}, "NO": {"event_count": 33, "qb_events": 2, "offensive_line_worsening": 1, "defensive_front_worsening": 1, "top_score": 100, "top_events": [{"player_name": "Tyler Shough", "position": "QB", "unit": "quarterback", "event_type": "limited", "availability_trend": "stable", "impact_bucket": "qb_major", "score": 100, "signal": "review_context"}, {"player_name": "Tyler Shough", "position": "QB", "unit": "quarterback", "event_type": "status_update", "availability_trend": "unknown", "impact_bucket": "qb_major", "score": 94, "signal": "review_context"}, {"player_name": "Bryan Bresee", "position": "DT", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Jaylan Ford", "position": "LB", "unit": "linebacker", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Lorenzo Styles Jr.", "position": "S", "unit": "secondary", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Jeremiah Wright", "position": "G", "unit": "offensive_line", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "offensive_line_major", "score": 81, "signal": "negative_availability"}, {"player_name": "Travis Etienne Jr.", "position": "RB", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 72, "signal": "negative_availability"}, {"player_name": "Zach Wood", "position": "TE", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 72, "signal": "negative_availability"}]}}

## Secondary matchup context (manual; capped, never a dominant driver)

- {"offense_team": "MIN", "defense_team": "NO", "severity_score": 4.05}
- {"offense_team": "NO", "defense_team": "MIN", "severity_score": 2.55}

## FTN team-level tables (names preserved)

{"MIN": {"record_count": 137, "team_level_tables": [{"category": "team-defense", "subpage": "efficiency", "team_abbr": "MIN", "metrics": {"Team": "Minnesota Vikings", "GP": "4", "EPA/PLY": "-0.184", "DVOA": "-22.1%", "SUCC%": "32.8%", "EXP%": "9.7%", "CONV%": "25.0%", "TO": "7", "TO%": "2.9%", "3&O": "23.9%", "MTKL%": "7.5%", "PEN%": "3.8%", "PENY": "26.3"}}, {"category": "team-defense", "subpage": "overview", "team_abbr": "MIN", "metrics": {"Team": "Minnesota Vikings", "GP": "4", "YD/PLY": "5.3", "PT/GM": "14.3", "FD%": "22.7%", "TO": "7", "DPBK%": "64.7%", "YD": "881", "TD": "3", "INT": "4", "RUSH%": "35.3%", "YD__2": "378", "TD__2": "1"}}, {"category": "team-defense", "subpage": "pass-rush", "team_abbr": "MIN", "metrics": {"Team": "Minnesota Vikings", "GP": "4", "DPBK": "154", "SK": "16", "SK%": "10.4%", "QBH%": "24.0%", "PRESS": "63", "PRESS%": "40.9%", "QPRESS%": "42.9%", "TTPR": "2.79", "DISR%": "0.6%", "BLZ%": "72.1%"}}, {"category": "team-defense", "subpage": "passing-analytics", "team_abbr": "MIN", "metrics": {"Team": "Minnesota Vikings", "GP": "4", "EPA/DB": "-0.164", "SUCC%": "34.4%", "DVOA": "-18.3%", "CPOE": "-11.87%", "CBALL%": "58.8%", "EXP%": "17.9%", "INTW%": "3.8%", "TGHT%": "26.7%", "OPEN%": "61.1%", "TA%": "4.6%", "DROP%": "4.6%"}}, {"category": "team-defense", "subpage": "rush-analytics", "team_abbr": "MIN", "metrics": {"Team": "Minnesota Vikings", "GP": "4", "EPA/ATT": "-0.222", "SUCC%": "29.8%", "DVOA": "-28.0%", "aRYOE": "", "EXP%": "10.7%", "STF%": "20.2%", "YBCO": "1.31", "YACO": "2.55"}}, {"category": "team-offense", "subpage": "efficiency", "team_abbr": "MIN", "metrics": {"Team": "Minnesota Vikings", "GP": "4", "EPA/PLY": "-0.119", "DVOA": "-23.4%", "SUCC%": "32.5%", "EXP%": "7.1%", "CONV%": "38.5%", "TO": "2", "TO%": "0.83%", "PENY": "28.8", "PEN%": "7.08%"}}, {"category": "team-offense", "subpage": "overview", "team_abbr": "MIN", "metrics": {"Team": "Minnesota Vikings", "GP": "4", "YD/PLY": "4.7", "PT/GM": "20.0", "FD%": "22.1%", "TO": "2", "DPBK%": "55.0%", "YD": "709", "TD": "4", "INT": "2", "RUSH%": "45.0%", "YD__2": "427", "TD__2": "2"}}, {"category": "team-offense", "subpage": "pass-protection", "team_abbr": "MIN", "metrics": {"Team": "Minnesota Vikings", "GP": "4", "SK": "13", "SK%": "9.8%", "QBSK%": "7.7%", "QBH%": "15.9%", "PRESS%": "28.0%", "UPRES%": "27.0%", "BLITZ%": "37.9%", "TTPR": "2.75", "TTT": "2.50", "EPA/DB": "-0.610", "DVOA": "-143.5%", "SUCC%": "16.2%", "EPA/DB__2": "0.147", "DVOA__2": "14.9%", "SUCC%__2": "41.1%"}}, {"category": "team-offense", "subpage": "passing-analytics", "team_abbr": "MIN", "metrics": {"Team": "Minnesota Vikings", "GP": "4", "EPA/DB": "-0.066", "SUCC%": "34.1%", "DVOA": "-17.4%", "CPOE": "-4.5%", "CBALL%": "67.6%", "EXP%": "13.2%", "INTW%": "1.8%", "HLT%": "1.8%", "TA%": "9.0%", "DROP%": "2.7%", "aDOT": "6.9", "aYAC": "4.7"}}, {"category": "team-offense", "subpage": "rushing-analytics", "team_abbr": "MIN", "metrics": {"Team": "Minnesota Vikings", "GP": "4", "EPA/ATT": "-0.185", "SUCC%": "30.6%", "DVOA": "-11.3%", "aRYOE": "", "EXP%": "6.5%", "STF%": "22.2%", "aYBCO": "1.31", "aYACO": "1.76", "CRT%": "49.9%"}}, {"category": "team-offense", "subpage": "tempo", "team_abbr": "MIN", "metrics": {"Team": "Minnesota Vikings", "GP": "4", "PLY/GM": "60.0", "TOP": "30.31", "DRV/GM": "11.5", "SEC/PLY": "30.3", "PLY/DRV": "5.2", "YD/DRV": "24.7", "SEC/DRV": "158", "3&O": "30.4%", "SCD%": "41.3%"}}, {"category": "team-offense", "subpage": "tendencies", "team_abbr": "MIN", "metrics": {"Team": "Minnesota Vikings", "GP": "4", "DPBK%": "55.0%", "RUSH%": "45.0%", "SHG%": "55.0%", "NH%": "5.8%", "MOT%": "55.4%", "PA%": "27.3%", "IZ%": "20.4%", "OZ%": "27.8%", "MD%": "29.6%", "PWR%": "6.5%", "CTR%": "1.9%"}}]}, "NO": {"record_count": 156, "team_level_tables": [{"category": "team-defense", "subpage": "efficiency", "team_abbr": "NO", "metrics": {"Team": "New Orleans Saints", "GP": "4", "EPA/PLY": "0.134", "DVOA": "20.6%", "SUCC%": "50.8%", "EXP%": "10.4%", "CONV%": "47.6%", "TO": "1", "TO%": "0.4%", "3&O": "22.2%", "MTKL%": "17.4%", "PEN%": "4.4%", "PENY": "16.0"}}, {"category": "team-defense", "subpage": "overview", "team_abbr": "NO", "metrics": {"Team": "New Orleans Saints", "GP": "4", "YD/PLY": "6.0", "PT/GM": "32.0", "FD%": "34.8%", "TO": "1", "DPBK%": "55.6%", "YD": "912", "TD": "7", "INT": "1", "RUSH%": "44.4%", "YD__2": "591", "TD__2": "9"}}, {"category": "team-defense", "subpage": "pass-rush", "team_abbr": "NO", "metrics": {"Team": "New Orleans Saints", "GP": "4", "DPBK": "139", "SK": "8", "SK%": "5.8%", "QBH%": "14.4%", "PRESS": "39", "PRESS%": "28.1%", "QPRESS%": "56.4%", "TTPR": "2.50", "DISR%": "0.7%", "BLZ%": "33.8%"}}, {"category": "team-defense", "subpage": "passing-analytics", "team_abbr": "NO", "metrics": {"Team": "New Orleans Saints", "GP": "4", "EPA/DB": "0.171", "SUCC%": "50.4%", "DVOA": "21.5%", "CPOE": "-0.32%", "CBALL%": "72.8%", "EXP%": "13.1%", "INTW%": "2.4%", "TGHT%": "19.2%", "OPEN%": "79.2%", "TA%": "5.6%", "DROP%": "2.4%"}}, {"category": "team-defense", "subpage": "rush-analytics", "team_abbr": "NO", "metrics": {"Team": "New Orleans Saints", "GP": "4", "EPA/ATT": "0.088", "SUCC%": "51.4%", "DVOA": "19.7%", "aRYOE": "", "EXP%": "11.7%", "STF%": "15.3%", "YBCO": "1.46", "YACO": "2.39"}}, {"category": "team-offense", "subpage": "efficiency", "team_abbr": "NO", "metrics": {"Team": "New Orleans Saints", "GP": "4", "EPA/PLY": "-0.008", "DVOA": "-9.5%", "SUCC%": "44.2%", "EXP%": "7.2%", "CONV%": "53.5%", "TO": "7", "TO%": "2.40%", "PENY": "27.0", "PEN%": "5.48%"}}, {"category": "team-offense", "subpage": "overview", "team_abbr": "NO", "metrics": {"Team": "New Orleans Saints", "GP": "4", "YD/PLY": "5.3", "PT/GM": "26.3", "FD%": "30.1%", "TO": "7", "DPBK%": "67.8%", "YD": "1,203", "TD": "9", "INT": "3", "RUSH%": "32.2%", "YD__2": "356", "TD__2": "4"}}, {"category": "team-offense", "subpage": "pass-protection", "team_abbr": "NO", "metrics": {"Team": "New Orleans Saints", "GP": "4", "SK": "12", "SK%": "6.1%", "QBSK%": "16.7%", "QBH%": "16.2%", "PRESS%": "33.8%", "UPRES%": "33.8%", "BLITZ%": "30.3%", "TTPR": "2.42", "TTT": "2.45", "EPA/DB": "-0.346", "DVOA": "-53.5%", "SUCC%": "35.8%", "EPA/DB__2": "0.214", "DVOA__2": "9.7%", "SUCC%__2": "52.7%"}}, {"category": "team-offense", "subpage": "passing-analytics", "team_abbr": "NO", "metrics": {"Team": "New Orleans Saints", "GP": "4", "EPA/DB": "0.025", "SUCC%": "47.0%", "DVOA": "3.4%", "CPOE": "1.8%", "CBALL%": "72.4%", "EXP%": "12.4%", "INTW%": "2.2%", "HLT%": "1.1%", "TA%": "5.0%", "DROP%": "2.2%", "aDOT": "8.2", "aYAC": "3.7"}}, {"category": "team-offense", "subpage": "rushing-analytics", "team_abbr": "NO", "metrics": {"Team": "New Orleans Saints", "GP": "4", "EPA/ATT": "-0.077", "SUCC%": "38.3%", "DVOA": "-16.3%", "aRYOE": "", "EXP%": "4.3%", "STF%": "18.1%", "aYBCO": "0.89", "aYACO": "1.81", "CRT%": "56.5%"}}, {"category": "team-offense", "subpage": "tempo", "team_abbr": "NO", "metrics": {"Team": "New Orleans Saints", "GP": "4", "PLY/GM": "73.0", "TOP": "30.43", "DRV/GM": "11.0", "SEC/PLY": "24.9", "PLY/DRV": "6.7", "YD/DRV": "35.4", "SEC/DRV": "166", "3&O": "13.6%", "SCD%": "40.9%"}}, {"category": "team-offense", "subpage": "tendencies", "team_abbr": "NO", "metrics": {"Team": "New Orleans Saints", "GP": "4", "DPBK%": "67.8%", "RUSH%": "32.2%", "SHG%": "69.2%", "NH%": "15.8%", "MOT%": "59.2%", "PA%": "17.7%", "IZ%": "33.0%", "OZ%": "20.2%", "MD%": "22.3%", "PWR%": "1.1%", "CTR%": "4.3%"}}]}}

## Digest rows for this game (research digest; tier labels are strict)

    MIN@NO | MIN -2.5 -103 / ML -131 | MIN | V: VSiN; RO: Daniel Jeremiah & Bucky Brooks, Action Network, Pro Football Talk; vs NO: Action Network (RO), Daniel Jeremiah & Bucky Brooks (RO), Sharp or Square (RO), BettingPros (RO), Seth Woolcock (RO), Simon Hunter (RO), Pat Fitzma… | 2-
    MIN@NO | U41.5 -113 | Under | RO: Action Network, BettingPros, Steve Fezzik, Andrew Erickson (src 42/42.5 vs now 41.5) | 2- research-only
    MIN@NO | Aaron Jones ATD | Yes | RO: Cody Brown Bets (X), @thepropdealer (X), @thejoeholkashow (X); src px not BKR | 2- research-only
    MIN@NO | Devaughn Vele ATD +330 | Yes | RO: Action Network, Sean Koerner; src px not BKR | 2- research-only
    MIN@NO | Justin Jefferson ATD | Yes | RO: Action Network, Gilles Gallant; src px not BKR; QUESTIONABLE per availability feed 2026-10-10T18:48Z | 2- research-only
    MIN@NO | Kyler Murray ATD +475 | Yes | RO: Action Network, Sean Koerner; src px not BKR | 2- research-only
    MIN@NO | Aaron Jones rush yds Over (line n/a) | Over | RO: Cody Brown; no source price; src px not BKR | 2- research-only

## Source rows (verified only): counts {"corroboration_only": 50, "near_miss": 1, "tier_eligible": 1}

Only rows with tier_eligible=true may support a tier. near_miss and corroboration_only rows are context.

| row | kind | outlet | market | side | line | tier_eligible | near_miss |
|---|---|---|---|---|---|---|---|
| w05-expert-verified.json#rows[7] | expert_feed | Action Network | prop | None | None | False | False |
| w05-expert-verified.json#rows[33] | expert_feed | Action Network | prop | None | 330 | False | False |
| w05-expert-verified.json#rows[34] | expert_feed | Action Network | prop | None | 475 | False | False |
| w05-expert-verified.json#rows[40] | expert_feed | Action Network | spread | NO | 1.5 | False | False |
| w05-expert-verified.json#rows[54] | expert_feed | Daniel Jeremiah & Bucky Brooks | moneyline | NO | None | False | False |
| w05-expert-verified.json#rows[66] | expert_feed | BettingPros | prop | None | 800 | False | False |
| w05-expert-verified.json#rows[67] | expert_feed | BettingPros | prop | None | 400 | False | False |
| w05-expert-verified.json#rows[92] | expert_feed | Daniel Jeremiah & Bucky Brooks | moneyline | NO | None | False | False |
| w05-expert-verified.json#rows[93] | expert_feed | Daniel Jeremiah & Bucky Brooks | moneyline | MIN | None | False | False |
| w05-expert-verified.json#rows[97] | expert_feed | Action Network | spread | MIN | -1.5 | False | False |
| w05-expert-verified.json#rows[98] | expert_feed | Action Network | total | Under | 42 | False | False |
| w05-expert-verified.json#rows[99] | expert_feed | Action Network | prop | None | 7.5 | False | False |
| w05-expert-verified.json#rows[128] | expert_feed | Sharp or Square | moneyline | NO | 115 | False | False |
| w05-expert-verified.json#rows[131] | expert_feed | Sharp or Square | spread | NO | 2.5 | False | False |
| w05-expert-verified.json#rows[163] | expert_feed | Even Money | teaser | NO | 7.5 | False | False |
| w05-expert-verified.json#rows[177] | expert_feed | BettingPros | moneyline | NO | 105 | False | False |
| w05-expert-verified.json#rows[180] | expert_feed | Sharp or Square | spread | NO | 2 | False | False |
| w05-expert-verified.json#rows[201] | expert_feed | BettingPros | spread | NO | 1.5 | False | False |
| w05-expert-verified.json#rows[202] | expert_feed | BettingPros | total | Under | 42.5 | False | False |
| w05-expert-verified.json#rows[211] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[212] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[237] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[249] | podcast | NFL Week 5 Picks &amp; Predictions: Best Bets, Upset Specials, Parlays &amp; Props (Ep. 1092) | moneyline | NO | None | False | False |
| w05-expert-verified.json#rows[255] | podcast | SHARP NFL Week 5 Bets: Bears-Packers, Niners-Seahawks and more | moneyline | NO | None | False | False |
| w05-expert-verified.json#rows[267] | podcast | 2026 NFL Week 5 Prop Bets &amp; Parlays | prop | OVER | 67.5 | False | False |
| w05-expert-verified.json#rows[285] | podcast | Early NFL BEST BETS &amp; Survivor Pool Picks: Week 5 Predictions (Ep. 1089) | moneyline | NO | None | False | False |
| w05-expert-verified.json#rows[304] | podcast | 2026 NFL Week 5 Bets | teaser | NO | 7.5 | False | False |
| w05-expert-verified.json#rows[305] | podcast | 2026 NFL Week 5 Bets | total | Under | 42.5 | False | False |
| w05-expert-verified.json#rows[326] | podcast | NFL Week 5 Early Lines: Best Bets, Early Odds &amp; Betting Picks for Every Game (Ep. 1087) | spread | NO | 1.5 | False | False |
| w05-expert-verified.json#rows[327] | podcast | NFL Week 5 Early Lines: Best Bets, Early Odds &amp; Betting Picks for Every Game (Ep. 1087) | totals | None | 42.5 | False | False |
| w05-expert-verified.json#rows[328] | podcast | NFL Week 5 Early Lines: Best Bets, Early Odds &amp; Betting Picks for Every Game (Ep. 1087) | spread | NO | 1.5 | False | False |
| w05-expert-verified.json#rows[368] | podcast | NFL WEEK 5 Betting Preview: Bucs-Cowboys, Bears-Packers and more | spread | NO | 2.5 | False | False |
| w05-expert-verified.json#rows[378] | article | Cody Brown Bets | prop | OVER | None | False | False |
| w05-expert-verified.json#rows[388] | article | VSiN | prop | OVER 14.5 (-120) | None | False | False |
| w05-expert-verified.json#rows[427] | article | Twitter/X Bookmarks (Personal) | prop | OVER 0.5 | None | False | False |
| w05-expert-verified.json#rows[435] | article | Twitter/X Bookmarks (Personal) | prop | OVER 36.5 | None | False | False |
| w05-expert-verified.json#rows[449] | article | VSiN | spread | NO | 3.0 | False | True |
| w05-expert-verified.json#rows[465] | article | Twitter/X Bookmarks (Personal) | prop | OVER 0.5 | None | False | False |
| w05-expert-verified.json#rows[480] | article | Twitter/X Bookmarks (Personal) | prop | OVER 0.5 | None | False | False |
| w05-expert-verified.json#rows[518] | article | VSiN | moneyline | MIN | None | True | False |
| w05-expert-verified.json#rows[536] | article | Pro Football Talk | moneyline | MIN | None | False | False |
| w05-expert-verified.json#rows[603] | article | Twitter/X Bookmarks (Personal) | prop | OVER 257.5 | None | False | False |
| w05-expert-verified.json#rows[604] | article | Twitter/X Bookmarks (Personal) | prop | UNDER 37.5 | None | False | False |
| w05-expert-verified.json#rows[605] | article | Twitter/X Bookmarks (Personal) | prop | UNDER 23.5 | None | False | False |
| w05-expert-verified.json#rows[606] | article | Twitter/X Bookmarks (Personal) | prop | OVER 16.5 | None | False | False |
| w05-expert-verified.json#rows[607] | article | Twitter/X Bookmarks (Personal) | prop | OVER 85.5 | None | False | False |
| w05-expert-verified.json#rows[608] | article | Twitter/X Bookmarks (Personal) | prop | UNDER 44.5 | None | False | False |
| w05-expert-verified.json#rows[609] | article | Twitter/X Bookmarks (Personal) | prop | OVER 40.5 | None | False | False |
| w05-expert-verified.json#rows[610] | article | Twitter/X Bookmarks (Personal) | prop | UNDER 16.5 | None | False | False |
| w05-expert-verified.json#rows[611] | article | Twitter/X Bookmarks (Personal) | prop | OVER 14.5 | None | False | False |
| w05-expert-verified.json#rows[612] | article | Twitter/X Bookmarks (Personal) | prop | UNDER 7.5 | None | False | False |
| w05-expert-verified.json#rows[618] | article | Twitter/X Bookmarks (Personal) | prop | OVER 3.5 | None | False | False |

- w05-expert-verified.json#rows[449] (VSiN) https://vsin.com/nfl/wes-reynolds-nfl-week-5-best-bets-and-predictions/: "Wes Reynolds: NFL Week 5 Best Bets"

- w05-expert-verified.json#rows[518] (VSiN) https://vsin.com/nfl/expert-nfl-picks-week-5-best-bets-predictions-and-player-props-from-zachary-cohen/: "Bet: Vikings ML (-130) & Jones Over 71.5 Rushing Yards (-110)"

## Read directly if needed

- weather_detail: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json (filter to MIN@NO)
- prop_markets: BKR/BEO rows for event "Minnesota Vikings @ New Orleans Saints" with market != game_lines
- player_stats: data/vault-seed/nflverse/player_stats_weekly.csv (season 2026) for MIN and NO
- projected_starters: data/projected-starters/2026/latest.json (teams.MIN, teams.NO)
