# PHI@JAX packet — Philadelphia Eagles @ Jacksonville Jaguars

Kickoff 2026-10-11T13:30:00.000Z UTC. Built 2026-10-11T01:22:14.064268+00:00. spread = HOME team line; favorite has the negative number; marginAdj in the simulator is home-positive points

## Market

**BKR** captured 2026-10-11T01:15:40.538Z; recommendation window ends 2026-10-11T07:15:40.538000+00:00; fresh at build: True
- spread: Philadelphia Eagles 7.5 -103; Jacksonville Jaguars -7.5 -113
- total: Over 42 -102; Under 42 -114
- moneyline: Philadelphia Eagles  293; Jacksonville Jaguars  -350

**BEO** captured 2026-10-11T01:19:56.400Z; recommendation window ends 2026-10-11T07:19:56.400000+00:00; fresh at build: True
- spread: Philadelphia Eagles 7.5 -105; Jacksonville Jaguars -7.5 -115
- total: Over 42 -107; Under 42 -113
- moneyline: Philadelphia Eagles  299; Jacksonville Jaguars  -375

Market-implied score: {"JAX": 24.75, "PHI": 17.25, "basis": "BKR home line -7.5 total 42"}

Action Network opener: {"an_game_id": 290820, "kickoff_utc": "2026-10-11T13:30:00Z", "sp": {"JAX": -3.5, "PHI": 3.5}, "sp_odds_home": -105, "sp_at": "2026-10-05T00:14:25Z", "tot": 43.5, "tot_at": "2026-10-05T00:12:25Z", "ml": {"PHI": 155, "JAX": -182}, "carried_from_before_cutoff": false}

Action Network splits (captured 2026-10-09T19:41:08.878Z): {"game_id": 290820, "away_team": "PHI", "home_team": "JAC", "kickoff_at": "2026-10-11T13:30:00.000Z", "spread": [{"side": "home", "value": -7.5, "price_american": -110, "ticket_pct": 60, "money_pct": 57}, {"side": "away", "value": 7.5, "price_american": -110, "ticket_pct": 40, "money_pct": 43}], "total": [{"side": "over", "value": 41.5, "price_american": -111, "ticket_pct": 40, "money_pct": 37}, {"side": "under", "value": 41.5, "price_american": -108, "ticket_pct": 60, "money_pct": 63}], "moneyline": [{"side": "home", "value": 0, "price_american": -387, "ticket_pct": 70, "money_pct": 67}, {"side": "away", "value": 0, "price_american": 300, "ticket_pct": 30, "money_pct": 33}]}

SuperContest row (contest line, not a book price; labels may be reversed): {"away_team": "PHI", "home_team": "JAX", "favorite": "JAX", "underdog": "PHI", "favorite_spread": -7.5, "kickoff_display": "Sun 9:30 am"}

## Team state: schedule, results and standings

### PHI (NFC East) 2-2
- PF 75 / PA 93 (diff -18); PPG 18.8 / PAPG 23.2; home 1-1, away 1-1, division 1-0
- Opponents faced to date have a combined record of 6-10; rest before this game: 6.9 days; byes used: none; byes remaining: [10]

| week | site | opp | opp_record | result | pf | pa |
|---|---|---|---|---|---|---|
| 1 | H | WAS | 1-3 | W | 24 | 22 |
| 2 | A | TEN | 0-4 | W | 24 | 20 |
| 3 | A | CHI | 3-1 | L | 7 | 27 |
| 4 | H | LAR | 2-2 | L | 20 | 24 |

Next games: wk5 A JAX; wk6 H CAR; wk7 H DAL; wk8 A WAS

### JAX (AFC South) 3-1
- PF 104 / PA 53 (diff +51); PPG 26.0 / PAPG 13.2; home 2-0, away 1-1, division 0-0
- Opponents faced to date have a combined record of 9-7; rest before this game: 6.9 days; byes used: none; byes remaining: [7]

| week | site | opp | opp_record | result | pf | pa |
|---|---|---|---|---|---|---|
| 1 | H | CLE | 3-1 | W | 34 | 10 |
| 2 | A | DEN | 2-2 | L | 13 | 20 |
| 3 | H | NE | 2-2 | W | 35 | 6 |
| 4 | A | CIN | 2-2 | W | 22 | 17 |

Next games: wk5 H PHI; wk6 H HOU; wk8 H IND; wk9 A BAL

## Standings context

**AFC South**
| rank | team | record | point_diff | div |
|---|---|---|---|---|
| 1 | JAX | 3-1 | 51 | 0-0 |
| 2 | IND | 2-2 | -2 | 1-0 |
| 3 | HOU | 0-4 | -25 | 0-1 |
| 4 | TEN | 0-4 | -28 | 0-0 |

**NFC East**
| rank | team | record | point_diff | div |
|---|---|---|---|---|
| 1 | NYG | 3-1 | 3 | 1-0 |
| 2 | DAL | 2-2 | 10 | 1-1 |
| 3 | PHI | 2-2 | -18 | 1-0 |
| 4 | WAS | 1-3 | -34 | 0-2 |

**AFC order (top 8)**: 1 KC 4-0, 2 JAX 3-1, 3 LV 3-1, 4 BUF 3-1, 5 BAL 3-1, 6 CLE 3-1, 7 CIN 2-2, 8 IND 2-2

**NFC order (top 8)**: 1 SF 4-0, 2 MIN 4-0, 3 CHI 3-1, 4 SEA 3-1, 5 NYG 3-1, 6 CAR 2-2, 7 DAL 2-2, 8 ATL 2-2

Order is win% then point differential only; official NFL tiebreakers are not applied. Includes the Week 5 TB@DAL final.

## Existing quantitative pass (provisional, unbacktested; 60% market / 25% FTN / 15% SRS)

Means: {"home": 26.026140637824454, "away": 16.958848489995617, "total": 42.98498912782007, "home_margin": 9.067292147828837}
Simulation: {"iterations": 100000, "mean_home": 26.1297951045799, "mean_away": 17.452505681000254, "home_win_pct": 0.70394, "home_cover_pct": 0.53174, "away_cover_pct": 0.46826, "over_pct": 0.52904, "under_pct": 0.47096000000000005}
Features: {"offense_z": {"JAX": 0.9315545209082298, "PHI": -1.0544818750095368}, "defense_weakness_z": {"JAX": -1.1059421206931759, "PHI": 0.46296896165702284}, "tempo_z": {"JAX": 0.5340652030797087, "PHI": -1.1626987583935888}, "srs": {"JAX": 14.746, "PHI": -6.319}, "secondary_adjustment_points": {"JAX": 0.45, "PHI": 0.645}}

## Calibrated simulator edge sweep (home-margin edge in points vs BKR line)

| home_margin_edge_pts | home_cover | away_cover | side_push | over | under | total_push |
|---|---|---|---|---|---|---|
| -3 | 0.4172 | 0.5828 | 0 | 0.4848 | 0.4848 | 0.0304 |
| -2 | 0.4444 | 0.5556 | 0 | 0.4848 | 0.4848 | 0.0304 |
| -1 | 0.4721 | 0.5279 | 0 | 0.4848 | 0.4848 | 0.0304 |
| 0 | 0.5 | 0.5 | 0 | 0.4848 | 0.4848 | 0.0304 |
| 1 | 0.5281 | 0.4719 | 0 | 0.4848 | 0.4848 | 0.0304 |
| 2 | 0.5562 | 0.4438 | 0 | 0.4848 | 0.4848 | 0.0304 |
| 3 | 0.5843 | 0.4157 | 0 | 0.4848 | 0.4848 | 0.0304 |

Zero edge is exactly 50/50. These rows convert a hypothesised home-margin edge (points vs the BKR line) into cover/over probability using the calibrated 2018-2025 key-number-aware model. Use scripts/intel/margin-simulator.mjs for other values; never do this arithmetic by hand.

## Power ratings

{"PHI": {"season": 2026, "team": "Eagles", "team_abbr": "PHI", "games_played": 4, "record": "2-2", "power_rating": {"srs": -6.319, "net_points_per_game": -4.5, "pythag_win_pct": 0.3752, "model_composite_z": -0.7492, "model_rank": 25, "srs_rank": 26, "net_ppg_rank": 23, "pythag_rank": 24, "market_implied_win_total": 9.21, "market_implied_rank": 15, "delta": 0.8647, "delta_basis": "z_score_market_minus_model"}, "attribution_note": "model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending."}, "JAX": {"season": 2026, "team": "Jaguars", "team_abbr": "JAX", "games_played": 4, "record": "3-1", "power_rating": {"srs": 14.746, "net_points_per_game": 12.75, "pythag_win_pct": 0.8317, "model_composite_z": 1.953, "model_rank": 2, "srs_rank": 1, "net_ppg_rank": 2, "pythag_rank": 1, "market_implied_win_total": 11.75, "market_implied_rank": 4, "delta": -0.8447, "delta_basis": "z_score_market_minus_model"}, "attribution_note": "model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending."}}

## Weather / venue

{"game": "PHI@JAX", "weather_status": "forecast_captured", "source_game": "PHI@JAX", "materiality": "no_material_flag_in_current_forecast"}

## Availability digest (top events per team)

{"PHI": {"event_count": 30, "qb_events": 3, "offensive_line_worsening": 1, "defensive_front_worsening": 1, "top_score": 94, "top_events": [{"player_name": "Jalen Hurts", "position": "QB", "unit": "quarterback", "event_type": "status_update", "availability_trend": "unknown", "impact_bucket": "qb_major", "score": 94, "signal": "review_context"}, {"player_name": "Jalen Hurts", "position": "QB", "unit": "quarterback", "event_type": "active_news", "availability_trend": "unknown", "impact_bucket": "qb_major", "score": 93, "signal": "review_context"}, {"player_name": "Tanner McKee", "position": "QB", "unit": "quarterback", "event_type": "active_news", "availability_trend": "unknown", "impact_bucket": "qb_major", "score": 89, "signal": "review_context"}, {"player_name": "Saquon Barkley", "position": "RB", "unit": "offensive_skill", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Drew Kendall", "position": "C", "unit": "offensive_line", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "offensive_line_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Saquon Barkley", "position": "RB", "unit": "offensive_skill", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Tank Bigsby", "position": "RB", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Jonathan Greenard", "position": "DE", "unit": "defensive_front", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 77, "signal": "negative_availability"}]}, "JAX": {"event_count": 16, "qb_events": 0, "offensive_line_worsening": 0, "defensive_front_worsening": 1, "top_score": 86, "top_events": [{"player_name": "B.J. Green II", "position": "DE", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Christian Braswell", "position": "CB", "unit": "secondary", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 82, "signal": "negative_availability"}, {"player_name": "Christian Braswell", "position": "CB", "unit": "secondary", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 82, "signal": "negative_availability"}, {"player_name": "Caleb Ransaw", "position": "CB", "unit": "secondary", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 72, "signal": "negative_availability"}, {"player_name": "Jared Bartlett", "position": "LB", "unit": "linebacker", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 72, "signal": "negative_availability"}, {"player_name": "Parker Hughes", "position": "LB", "unit": "linebacker", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 72, "signal": "negative_availability"}, {"player_name": "Caleb Ransaw", "position": "S", "unit": "secondary", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 67, "signal": "negative_availability"}, {"player_name": "Jaylon Jones", "position": "CB", "unit": "secondary", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 63, "signal": "negative_availability"}]}}

## Secondary matchup context (manual; capped, never a dominant driver)

- {"offense_team": "PHI", "defense_team": "JAX", "severity_score": 6.45}
- {"offense_team": "JAX", "defense_team": "PHI", "severity_score": 4.5}

## FTN team-level tables (names preserved)

{"PHI": {"record_count": 140, "team_level_tables": [{"category": "team-defense", "subpage": "efficiency", "team_abbr": "PHI", "metrics": {"Team": "Philadelphia Eagles", "GP": "4", "EPA/PLY": "0.045", "DVOA": "3.5%", "SUCC%": "46.0%", "EXP%": "7.5%", "CONV%": "46.2%", "TO": "2", "TO%": "0.8%", "3&O": "22.7%", "MTKL%": "14.8%", "PEN%": "4.2%", "PENY": "15.5"}}, {"category": "team-defense", "subpage": "overview", "team_abbr": "PHI", "metrics": {"Team": "Philadelphia Eagles", "GP": "4", "YD/PLY": "5.3", "PT/GM": "23.3", "FD%": "29.1%", "TO": "2", "DPBK%": "57.4%", "YD": "911", "TD": "4", "INT": "2", "RUSH%": "42.6%", "YD__2": "488", "TD__2": "7"}}, {"category": "team-defense", "subpage": "pass-rush", "team_abbr": "PHI", "metrics": {"Team": "Philadelphia Eagles", "GP": "4", "DPBK": "152", "SK": "4", "SK%": "2.6%", "QBH%": "8.6%", "PRESS": "43", "PRESS%": "28.3%", "QPRESS%": "55.8%", "TTPR": "2.45", "DISR%": "0.7%", "BLZ%": "19.7%"}}, {"category": "team-defense", "subpage": "passing-analytics", "team_abbr": "PHI", "metrics": {"Team": "Philadelphia Eagles", "GP": "4", "EPA/DB": "0.096", "SUCC%": "46.7%", "DVOA": "12.1%", "CPOE": "0.29%", "CBALL%": "67.1%", "EXP%": "12.6%", "INTW%": "2.1%", "TGHT%": "32.1%", "OPEN%": "60.7%", "TA%": "5.7%", "DROP%": "3.6%"}}, {"category": "team-defense", "subpage": "rush-analytics", "team_abbr": "PHI", "metrics": {"Team": "Philadelphia Eagles", "GP": "4", "EPA/ATT": "-0.024", "SUCC%": "45.1%", "DVOA": "-6.5%", "aRYOE": "", "EXP%": "6.2%", "STF%": "16.8%", "YBCO": "0.98", "YACO": "2.27"}}, {"category": "team-offense", "subpage": "efficiency", "team_abbr": "PHI", "metrics": {"Team": "Philadelphia Eagles", "GP": "4", "EPA/PLY": "-0.107", "DVOA": "-9.2%", "SUCC%": "37.0%", "EXP%": "7.4%", "CONV%": "35.0%", "TO": "4", "TO%": "1.74%", "PENY": "32.5", "PEN%": "7.83%"}}, {"category": "team-offense", "subpage": "overview", "team_abbr": "PHI", "metrics": {"Team": "Philadelphia Eagles", "GP": "4", "YD/PLY": "5.0", "PT/GM": "18.8", "FD%": "23.9%", "TO": "4", "DPBK%": "60.0%", "YD": "713", "TD": "7", "INT": "4", "RUSH%": "40.0%", "YD__2": "436", "TD__2": "2"}}, {"category": "team-offense", "subpage": "pass-protection", "team_abbr": "PHI", "metrics": {"Team": "Philadelphia Eagles", "GP": "4", "SK": "12", "SK%": "8.7%", "QBSK%": "58.3%", "QBH%": "15.2%", "PRESS%": "37.7%", "UPRES%": "17.4%", "BLITZ%": "38.4%", "TTPR": "2.67", "TTT": "3.01", "EPA/DB": "-0.628", "DVOA": "-109.5%", "SUCC%": "21.2%", "EPA/DB__2": "0.226", "DVOA__2": "2.6%", "SUCC%__2": "48.8%"}}, {"category": "team-offense", "subpage": "passing-analytics", "team_abbr": "PHI", "metrics": {"Team": "Philadelphia Eagles", "GP": "4", "EPA/DB": "-0.096", "SUCC%": "38.4%", "DVOA": "1.6%", "CPOE": "3.3%", "CBALL%": "61.7%", "EXP%": "11.8%", "INTW%": "4.3%", "HLT%": "2.6%", "TA%": "8.7%", "DROP%": "0.9%", "aDOT": "7.7", "aYAC": "3.4"}}, {"category": "team-offense", "subpage": "rushing-analytics", "team_abbr": "PHI", "metrics": {"Team": "Philadelphia Eagles", "GP": "4", "EPA/ATT": "-0.122", "SUCC%": "34.8%", "DVOA": "-14.6%", "aRYOE": "", "EXP%": "5.4%", "STF%": "23.9%", "aYBCO": "0.92", "aYACO": "1.64", "CRT%": "44.5%"}}, {"category": "team-offense", "subpage": "tempo", "team_abbr": "PHI", "metrics": {"Team": "Philadelphia Eagles", "GP": "4", "PLY/GM": "57.5", "TOP": "27.43", "DRV/GM": "10.5", "SEC/PLY": "28.6", "PLY/DRV": "5.5", "YD/DRV": "27.4", "SEC/DRV": "157", "3&O": "33.3%", "SCD%": "31.0%"}}, {"category": "team-offense", "subpage": "tendencies", "team_abbr": "PHI", "metrics": {"Team": "Philadelphia Eagles", "GP": "4", "DPBK%": "60.0%", "RUSH%": "40.0%", "SHG%": "64.3%", "NH%": "13.5%", "MOT%": "53.5%", "PA%": "18.8%", "IZ%": "15.2%", "OZ%": "30.4%", "MD%": "31.5%", "PWR%": "7.6%", "CTR%": "3.3%"}}]}, "JAX": {"record_count": 138, "team_level_tables": [{"category": "team-defense", "subpage": "efficiency", "team_abbr": "JAX", "metrics": {"Team": "Jacksonville Jaguars", "GP": "4", "EPA/PLY": "-0.048", "DVOA": "-19.2%", "SUCC%": "43.7%", "EXP%": "8.8%", "CONV%": "36.7%", "TO": "6", "TO%": "2.5%", "3&O": "10.8%", "MTKL%": "7.9%", "PEN%": "3.8%", "PENY": "25.0"}}, {"category": "team-defense", "subpage": "overview", "team_abbr": "JAX", "metrics": {"Team": "Jacksonville Jaguars", "GP": "4", "YD/PLY": "6.1", "PT/GM": "13.3", "FD%": "30.7%", "TO": "6", "DPBK%": "65.1%", "YD": "1,166", "TD": "3", "INT": "6", "RUSH%": "34.9%", "YD__2": "297", "TD__2": "2"}}, {"category": "team-defense", "subpage": "pass-rush", "team_abbr": "JAX", "metrics": {"Team": "Jacksonville Jaguars", "GP": "4", "DPBK": "155", "SK": "9", "SK%": "5.8%", "QBH%": "16.8%", "PRESS": "46", "PRESS%": "29.7%", "QPRESS%": "39.1%", "TTPR": "2.71", "DISR%": "0.6%", "BLZ%": "25.8%"}}, {"category": "team-defense", "subpage": "passing-analytics", "team_abbr": "JAX", "metrics": {"Team": "Jacksonville Jaguars", "GP": "4", "EPA/DB": "0.017", "SUCC%": "49.0%", "DVOA": "-6.7%", "CPOE": "2.17%", "CBALL%": "72.5%", "EXP%": "16.8%", "INTW%": "7.2%", "TGHT%": "21.7%", "OPEN%": "71.0%", "TA%": "2.9%", "DROP%": "1.4%"}}, {"category": "team-defense", "subpage": "rush-analytics", "team_abbr": "JAX", "metrics": {"Team": "Jacksonville Jaguars", "GP": "4", "EPA/ATT": "-0.170", "SUCC%": "33.7%", "DVOA": "-32.5%", "aRYOE": "", "EXP%": "6.0%", "STF%": "18.1%", "YBCO": "1.05", "YACO": "1.34"}}, {"category": "team-offense", "subpage": "efficiency", "team_abbr": "JAX", "metrics": {"Team": "Jacksonville Jaguars", "GP": "4", "EPA/PLY": "0.173", "DVOA": "21.1%", "SUCC%": "48.2%", "EXP%": "10.2%", "CONV%": "51.1%", "TO": "2", "TO%": "0.88%", "PENY": "36.5", "PEN%": "8.41%"}}, {"category": "team-offense", "subpage": "overview", "team_abbr": "JAX", "metrics": {"Team": "Jacksonville Jaguars", "GP": "4", "YD/PLY": "5.8", "PT/GM": "26.0", "FD%": "34.1%", "TO": "2", "DPBK%": "50.9%", "YD": "843", "TD": "8", "INT": "2", "RUSH%": "49.1%", "YD__2": "469", "TD__2": "4"}}, {"category": "team-offense", "subpage": "pass-protection", "team_abbr": "JAX", "metrics": {"Team": "Jacksonville Jaguars", "GP": "4", "SK": "8", "SK%": "7.0%", "QBSK%": "0.0%", "QBH%": "19.1%", "PRESS%": "28.7%", "UPRES%": "21.4%", "BLITZ%": "28.7%", "TTPR": "2.76", "TTT": "2.56", "EPA/DB": "-0.097", "DVOA": "-27.5%", "SUCC%": "33.3%", "EPA/DB__2": "0.419", "DVOA__2": "54.2%", "SUCC%__2": "58.5%"}}, {"category": "team-offense", "subpage": "passing-analytics", "team_abbr": "JAX", "metrics": {"Team": "Jacksonville Jaguars", "GP": "4", "EPA/DB": "0.271", "SUCC%": "51.3%", "DVOA": "47.2%", "CPOE": "3.3%", "CBALL%": "77.1%", "EXP%": "15.3%", "INTW%": "2.9%", "HLT%": "2.9%", "TA%": "4.8%", "DROP%": "4.8%", "aDOT": "8.4", "aYAC": "4.4"}}, {"category": "team-offense", "subpage": "rushing-analytics", "team_abbr": "JAX", "metrics": {"Team": "Jacksonville Jaguars", "GP": "4", "EPA/ATT": "0.072", "SUCC%": "45.0%", "DVOA": "7.3%", "aRYOE": "", "EXP%": "10.8%", "STF%": "18.9%", "aYBCO": "1.43", "aYACO": "2.42", "CRT%": "58.4%"}}, {"category": "team-offense", "subpage": "tempo", "team_abbr": "JAX", "metrics": {"Team": "Jacksonville Jaguars", "GP": "4", "PLY/GM": "56.5", "TOP": "29.26", "DRV/GM": "9.3", "SEC/PLY": "31.1", "PLY/DRV": "6.1", "YD/DRV": "35.5", "SEC/DRV": "190", "3&O": "10.8%", "SCD%": "51.4%"}}, {"category": "team-offense", "subpage": "tendencies", "team_abbr": "JAX", "metrics": {"Team": "Jacksonville Jaguars", "GP": "4", "DPBK%": "50.9%", "RUSH%": "49.1%", "SHG%": "51.3%", "NH%": "5.8%", "MOT%": "59.3%", "PA%": "26.1%", "IZ%": "24.3%", "OZ%": "38.7%", "MD%": "11.7%", "PWR%": "4.5%", "CTR%": "4.5%"}}]}}

## Digest rows for this game (research digest; tier labels are strict)

    PHI@JAX | PHI +7.5 -103 / ML +293 | PHI | V: VSiN; vs JAX: Daniel Jeremiah & Bucky Brooks (RO), BettingPros (RO), The Favorites (RO), Andrew Erickson (RO), Ryan Wormeli (RO), Simon Hunter (RO), Pro Football Talk (RO) (src +7.5/+8 vs now +7.5) | 2-
    PHI@JAX | Brenton Strange u35.5 rec yds -110 | Under | YT/PI: Brandon Anderson (YT); RO: Action Network; src px not BKR | 2- research-only
    PHI@JAX | Trevor Lawrence ATD +310 | Yes | YT/PI: Brandon Anderson (YT); RO: Action Network; src px not BKR | 2- research-only
    PHI@JAX | Bhayshul Tuten ATD | Yes | RO: Ryan Wormeli, Cody Brown Bets (X); src px not BKR | 2- research-only
    PHI@JAX | Brenton Strange ATD +290 | Yes | RO: Action Network, Sean Koerner; src px not BKR | 2- research-only
    PHI@JAX | Darius Cooper ATD +460 | Yes | RO: Action Network, Sean Koerner; src px not BKR | 2- research-only

## Source rows (verified only): counts {"corroboration_only": 23, "tier_eligible": 4}

Only rows with tier_eligible=true may support a tier. near_miss and corroboration_only rows are context.

| row | kind | outlet | market | side | line | tier_eligible | near_miss |
|---|---|---|---|---|---|---|---|
| w05-expert-verified.json#rows[27] | expert_feed | Action Network | prop | None | 290 | False | False |
| w05-expert-verified.json#rows[28] | expert_feed | Action Network | prop | None | 460 | False | False |
| w05-expert-verified.json#rows[68] | expert_feed | BettingPros | prop | None | 6.5 | False | False |
| w05-expert-verified.json#rows[85] | expert_feed | Daniel Jeremiah & Bucky Brooks | moneyline | JAX | None | False | False |
| w05-expert-verified.json#rows[105] | expert_feed | Action Network | prop | None | 35.5 | False | False |
| w05-expert-verified.json#rows[106] | expert_feed | Action Network | prop | None | 310 | False | False |
| w05-expert-verified.json#rows[139] | expert_feed | BettingPros | spread | JAX | -7 | False | False |
| w05-expert-verified.json#rows[170] | expert_feed | Even Money | teaser | JAX | -0.5 | False | False |
| w05-expert-verified.json#rows[198] | expert_feed | BettingPros | spread | JAX | -4.5 | False | False |
| w05-expert-verified.json#rows[204] | expert_feed | The Favorites | spread | JAX | -4.5 | False | False |
| w05-expert-verified.json#rows[205] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[206] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[244] | podcast | NFL Week 5 Picks &amp; Predictions: Best Bets, Upset Specials, Parlays &amp; Props (Ep. 1092) | spread | JAX | -7 | False | False |
| w05-expert-verified.json#rows[265] | podcast | 2026 NFL Week 5 Prop Bets &amp; Parlays | teaser | JAX | -1 | False | False |
| w05-expert-verified.json#rows[291] | podcast | 2026 NFL Week 5 Bets | teaser | JAX | -0.5 | False | False |
| w05-expert-verified.json#rows[318] | podcast | NFL Week 5 Early Lines: Best Bets, Early Odds &amp; Betting Picks for Every Game (Ep. 1087) | spread | JAX | -4.5 | False | False |
| w05-expert-verified.json#rows[319] | podcast | NFL Week 5 Early Lines: Best Bets, Early Odds &amp; Betting Picks for Every Game (Ep. 1087) | spread | JAX | -4.5 | False | False |
| w05-expert-verified.json#rows[357] | podcast | Fantasy Football Start or Sit Lineup Advice: Experts Pick Who To Start Week 5 (2026) | prop | UNKNOWN | None | False | False |
| w05-expert-verified.json#rows[358] | podcast | Fantasy Football Start or Sit Lineup Advice: Experts Pick Who To Start Week 5 (2026) | prop | UNKNOWN | None | False | False |
| w05-expert-verified.json#rows[371] | podcast | NFL WEEK 5 Betting Preview: Bucs-Cowboys, Bears-Packers and more | spread | JAX | -6.5 | False | False |
| w05-expert-verified.json#rows[419] | article | Action Network | prop | UNDER 15.5 (-115) | None | False | False |
| w05-expert-verified.json#rows[428] | article | Twitter/X Bookmarks (Personal) | prop | OVER 0.5 | None | False | False |
| w05-expert-verified.json#rows[447] | article | VSiN | spread | PHI | 7.5 | True | False |
| w05-expert-verified.json#rows[516] | article | VSiN | spread | PHI | 8.0 | True | False |
| w05-expert-verified.json#rows[517] | article | VSiN | moneyline | PHI | None | True | False |
| w05-expert-verified.json#rows[532] | article | Pro Football Talk | moneyline | JAX | None | False | False |
| w05-expert-verified.json#rows[559] | article | VSiN | spread | PHI | 7.5 | True | False |

- w05-expert-verified.json#rows[447] (VSiN) https://vsin.com/nfl/matt-youmans-nfl-week-5-best-bets-and-predictions/: "Eagles +7.5 vs Jaguars (London)"

- w05-expert-verified.json#rows[516] (VSiN) https://vsin.com/nfl/expert-nfl-picks-week-5-best-bets-predictions-and-player-props-from-zachary-cohen/: "Bet: Eagles +8 (-110 - 1.5 units) & Eagles ML (+320 - 0.5 units)"

- w05-expert-verified.json#rows[517] (VSiN) https://vsin.com/nfl/expert-nfl-picks-week-5-best-bets-predictions-and-player-props-from-zachary-cohen/: "Bet: Eagles +8 (-110 - 1.5 units) & Eagles ML (+320 - 0.5 units)"

- w05-expert-verified.json#rows[559] (VSiN) https://vsin.com/nfl/tuleys-takes-for-nfl-week-5/: "Best Bet: Eagles +7.5 or better (Pool Play Percentages: Eagles 67/33 in ATS contests, but Jaguars still 75/25 in SU pools)."

## Read directly if needed

- weather_detail: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json (filter to PHI@JAX)
- prop_markets: BKR/BEO rows for event "Philadelphia Eagles @ Jacksonville Jaguars" with market != game_lines
- player_stats: data/vault-seed/nflverse/player_stats_weekly.csv (season 2026) for PHI and JAX
- projected_starters: data/projected-starters/2026/latest.json (teams.PHI, teams.JAX)
