# SF@SEA packet — San Francisco 49ers @ Seattle Seahawks

Kickoff 2026-10-11T20:25:00.000Z UTC. Built 2026-10-11T01:22:14.064268+00:00. spread = HOME team line; favorite has the negative number; marginAdj in the simulator is home-positive points

**Division game** (NFC West).

## Market

**BKR** captured 2026-10-11T01:15:40.538Z; recommendation window ends 2026-10-11T07:15:40.538000+00:00; fresh at build: True
- spread: San Francisco 49ers 3 105; Seattle Seahawks -3 -123
- total: Over 46.5 -104; Under 46.5 -112
- moneyline: San Francisco 49ers  149; Seattle Seahawks  -172

**BEO** captured 2026-10-11T01:19:56.400Z; recommendation window ends 2026-10-11T07:19:56.400000+00:00; fresh at build: True
- spread: San Francisco 49ers 3 -102; Seattle Seahawks -3 -118
- total: Over 46.5 -110; Under 46.5 -110
- moneyline: San Francisco 49ers  149; Seattle Seahawks  -170

Market-implied score: {"SEA": 24.75, "SF": 21.75, "basis": "BKR home line -3 total 46.5"}

Action Network opener: {"an_game_id": 290912, "kickoff_utc": "2026-10-11T20:25:00Z", "sp": {"SEA": -3.0, "SF": 3.0}, "sp_odds_home": -107, "sp_at": "2026-10-05T00:14:55Z", "tot": 47.0, "tot_at": "2026-10-05T00:06:55Z", "ml": {"SF": 140, "SEA": -175}, "carried_from_before_cutoff": false}

Action Network splits (captured 2026-10-09T19:41:08.878Z): {"game_id": 290912, "away_team": "SF", "home_team": "SEA", "kickoff_at": "2026-10-11T20:25:00.000Z", "spread": [{"side": "away", "value": 3, "price_american": -104, "ticket_pct": 82, "money_pct": 88}, {"side": "home", "value": -3, "price_american": -118, "ticket_pct": 18, "money_pct": 12}], "total": [{"side": "under", "value": 46.5, "price_american": -113, "ticket_pct": 29, "money_pct": 27}, {"side": "over", "value": 46.5, "price_american": -105, "ticket_pct": 71, "money_pct": 73}], "moneyline": [{"side": "away", "value": 0, "price_american": 137, "ticket_pct": 54, "money_pct": 42}, {"side": "home", "value": 0, "price_american": -166, "ticket_pct": 46, "money_pct": 58}]}

SuperContest row (contest line, not a book price; labels may be reversed): {"away_team": "SF", "home_team": "SEA", "favorite": "SEA", "underdog": "SF", "favorite_spread": -3, "kickoff_display": "Sun 4:25 pm"}

## Team state: schedule, results and standings

### SF (NFC West) 4-0
- PF 122 / PA 64 (diff +58); PPG 30.5 / PAPG 16.0; home 3-0, away 1-0, division 2-0
- Opponents faced to date have a combined record of 5-11; rest before this game: 7.0 days; byes used: none; byes remaining: [8]

| week | site | opp | opp_record | result | pf | pa |
|---|---|---|---|---|---|---|
| 1 | A | LAR | 2-2 | W | 27 | 7 |
| 2 | H | MIA | 0-4 | W | 35 | 13 |
| 3 | H | ARI | 1-3 | W | 36 | 30 |
| 4 | H | DEN | 2-2 | W | 24 | 14 |

Next games: wk5 A SEA; wk6 H WAS; wk7 A ATL; wk9 H LV

### SEA (NFC West) 3-1
- PF 105 / PA 73 (diff +32); PPG 26.2 / PAPG 18.2; home 2-0, away 1-1, division 1-0
- Opponents faced to date have a combined record of 4-12; rest before this game: 7.0 days; byes used: none; byes remaining: [11]

| week | site | opp | opp_record | result | pf | pa |
|---|---|---|---|---|---|---|
| 1 | H | NE | 2-2 | W | 13 | 10 |
| 2 | A | ARI | 1-3 | W | 31 | 7 |
| 3 | A | WAS | 1-3 | L | 31 | 33 |
| 4 | H | LAC | 0-4 | W | 30 | 23 |

Next games: wk5 H SF; wk6 A DEN; wk7 H KC; wk8 H CHI

## Standings context

**NFC West**
| rank | team | record | point_diff | div |
|---|---|---|---|---|
| 1 | SF | 4-0 | 58 | 2-0 |
| 2 | SEA | 3-1 | 32 | 1-0 |
| 3 | LAR | 2-2 | 2 | 0-1 |
| 4 | ARI | 1-3 | -30 | 0-2 |

**NFC order (top 8)**: 1 SF 4-0, 2 MIN 4-0, 3 CHI 3-1, 4 SEA 3-1, 5 NYG 3-1, 6 CAR 2-2, 7 DAL 2-2, 8 ATL 2-2

Order is win% then point differential only; official NFL tiebreakers are not applied. Includes the Week 5 TB@DAL final.

## Existing quantitative pass (provisional, unbacktested; 60% market / 25% FTN / 15% SRS)

Means: {"home": 23.790676554242506, "away": 23.695574657447217, "total": 47.48625121168972, "home_margin": 0.09510189679528835}
Simulation: {"iterations": 100000, "mean_home": 23.865075832769534, "mean_away": 23.81334340381352, "home_win_pct": 0.50202, "home_cover_pct": 0.43042, "away_cover_pct": 0.56958, "over_pct": 0.52148, "under_pct": 0.47851999999999995}
Features: {"offense_z": {"SEA": 0.3079054432025402, "SF": 1.9709696504177077}, "defense_weakness_z": {"SEA": -1.6105102909402136, "SF": -0.5568605436081798}, "tempo_z": {"SEA": -0.3667940135787954, "SF": 0.813943794662932}, "srs": {"SEA": 1.698, "SF": 14.043}, "secondary_adjustment_points": {"SEA": 0.533, "SF": 0.375}}

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

## Power ratings

{"SF": {"season": 2026, "team": "49ers", "team_abbr": "SF", "games_played": 4, "record": "4-0", "power_rating": {"srs": 14.043, "net_points_per_game": 14.5, "pythag_win_pct": 0.8219, "model_composite_z": 1.9837, "model_rank": 1, "srs_rank": 2, "net_ppg_rank": 1, "pythag_rank": 2, "market_implied_win_total": 12.25, "market_implied_rank": 2, "delta": -0.6613, "delta_basis": "z_score_market_minus_model"}, "attribution_note": "model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending."}, "SEA": {"season": 2026, "team": "Seahawks", "team_abbr": "SEA", "games_played": 4, "record": "3-1", "power_rating": {"srs": 1.698, "net_points_per_game": 8, "pythag_win_pct": 0.703, "model_composite_z": 0.8543, "model_rank": 7, "srs_rank": 12, "net_ppg_rank": 6, "pythag_rank": 6, "market_implied_win_total": 11.61, "market_implied_rank": 6, "delta": 0.2346, "delta_basis": "z_score_market_minus_model"}, "attribution_note": "model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending."}}

## Weather / venue

{"game": "SF@SEA", "weather_status": "forecast_captured", "source_game": "SF@SEA", "materiality": "no_material_flag_in_current_forecast"}

## Availability digest (top events per team)

{"SF": {"event_count": 34, "qb_events": 1, "offensive_line_worsening": 1, "defensive_front_worsening": 8, "top_score": 96, "top_events": [{"player_name": "James Thompson Jr.", "position": "DT", "unit": "defensive_front", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 96, "signal": "negative_availability"}, {"player_name": "Brock Purdy", "position": "QB", "unit": "quarterback", "event_type": "active_news", "availability_trend": "unknown", "impact_bucket": "qb_major", "score": 93, "signal": "review_context"}, {"player_name": "Sam Okuayinonu", "position": "DE", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Alfred Collins", "position": "DT", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "C.J. West", "position": "DT", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Christian Kirk", "position": "WR", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Trent Williams", "position": "OT", "unit": "offensive_line", "event_type": "setback", "availability_trend": "worsening", "impact_bucket": "offensive_line_major", "score": 79, "signal": "negative_availability"}, {"player_name": "Mykel Williams", "position": "DE", "unit": "defensive_front", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 77, "signal": "negative_availability"}]}, "SEA": {"event_count": 19, "qb_events": 0, "offensive_line_worsening": 0, "defensive_front_worsening": 0, "top_score": 86, "top_events": [{"player_name": "Irv Charles", "position": "WR", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Jadarian Price", "position": "RB", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 72, "signal": "negative_availability"}, {"player_name": "Jake Bobo", "position": "WR", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 72, "signal": "negative_availability"}, {"player_name": "Robbie Ouzts", "position": "TE", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 72, "signal": "negative_availability"}, {"player_name": "Bud Clark", "position": "S", "unit": "secondary", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 72, "signal": "negative_availability"}, {"player_name": "Zach Charbonnet", "position": "RB", "unit": "offensive_skill", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 68, "signal": "negative_availability"}, {"player_name": "Chazz Surratt", "position": "LB", "unit": "linebacker", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 63, "signal": "negative_availability"}, {"player_name": "Julian Neal", "position": "CB", "unit": "secondary", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 63, "signal": "negative_availability"}]}}

## Secondary matchup context (manual; capped, never a dominant driver)

- {"offense_team": "SF", "defense_team": "SEA", "severity_score": 3.75}
- {"offense_team": "SEA", "defense_team": "SF", "severity_score": 5.33}

## FTN team-level tables (names preserved)

{"SF": {"record_count": 140, "team_level_tables": [{"category": "team-defense", "subpage": "efficiency", "team_abbr": "SF", "metrics": {"Team": "San Francisco 49ers", "GP": "4", "EPA/PLY": "0.013", "DVOA": "-13.3%", "SUCC%": "45.2%", "EXP%": "3.5%", "CONV%": "46.3%", "TO": "1", "TO%": "0.4%", "3&O": "16.7%", "MTKL%": "8.9%", "PEN%": "3.1%", "PENY": "22.5"}}, {"category": "team-defense", "subpage": "overview", "team_abbr": "SF", "metrics": {"Team": "San Francisco 49ers", "GP": "4", "YD/PLY": "4.9", "PT/GM": "16.0", "FD%": "25.5%", "TO": "1", "DPBK%": "59.8%", "YD": "859", "TD": "4", "INT": "1", "RUSH%": "40.2%", "YD__2": "401", "TD__2": "2"}}, {"category": "team-defense", "subpage": "pass-rush", "team_abbr": "SF", "metrics": {"Team": "San Francisco 49ers", "GP": "4", "DPBK": "155", "SK": "6", "SK%": "3.9%", "QBH%": "12.3%", "PRESS": "40", "PRESS%": "25.8%", "QPRESS%": "50.0%", "TTPR": "2.60", "DISR%": "0.6%", "BLZ%": "31.0%"}}, {"category": "team-defense", "subpage": "passing-analytics", "team_abbr": "SF", "metrics": {"Team": "San Francisco 49ers", "GP": "4", "EPA/DB": "0.060", "SUCC%": "42.6%", "DVOA": "-5.3%", "CPOE": "0.75%", "CBALL%": "68.3%", "EXP%": "6.4%", "INTW%": "2.1%", "TGHT%": "24.8%", "OPEN%": "53.1%", "TA%": "4.1%", "DROP%": "2.1%"}}, {"category": "team-defense", "subpage": "rush-analytics", "team_abbr": "SF", "metrics": {"Team": "San Francisco 49ers", "GP": "4", "EPA/ATT": "-0.058", "SUCC%": "49.0%", "DVOA": "-22.5%", "aRYOE": "", "EXP%": "2.9%", "STF%": "17.3%", "YBCO": "1.42", "YACO": "2.14"}}, {"category": "team-offense", "subpage": "efficiency", "team_abbr": "SF", "metrics": {"Team": "San Francisco 49ers", "GP": "4", "EPA/PLY": "0.278", "DVOA": "44.9%", "SUCC%": "53.5%", "EXP%": "13.6%", "CONV%": "57.1%", "TO": "1", "TO%": "0.44%", "PENY": "20.8", "PEN%": "3.95%"}}, {"category": "team-offense", "subpage": "overview", "team_abbr": "SF", "metrics": {"Team": "San Francisco 49ers", "GP": "4", "YD/PLY": "6.8", "PT/GM": "30.5", "FD%": "36.8%", "TO": "1", "DPBK%": "53.9%", "YD": "1,007", "TD": "11", "INT": "1", "RUSH%": "46.1%", "YD__2": "549", "TD__2": "5"}}, {"category": "team-offense", "subpage": "pass-protection", "team_abbr": "SF", "metrics": {"Team": "San Francisco 49ers", "GP": "4", "SK": "0", "SK%": "0.0%", "QBSK%": "", "QBH%": "8.9%", "PRESS%": "20.3%", "UPRES%": "35.0%", "BLITZ%": "32.5%", "TTPR": "2.49", "TTT": "2.64", "EPA/DB": "0.244", "DVOA": "11.1%", "SUCC%": "56.0%", "EPA/DB__2": "0.646", "DVOA__2": "70.0%", "SUCC%__2": "64.3%"}}, {"category": "team-offense", "subpage": "passing-analytics", "team_abbr": "SF", "metrics": {"Team": "San Francisco 49ers", "GP": "4", "EPA/DB": "0.565", "SUCC%": "62.6%", "DVOA": "89.7%", "CPOE": "5.2%", "CBALL%": "76.1%", "EXP%": "16.5%", "INTW%": "2.7%", "HLT%": "3.5%", "TA%": "2.7%", "DROP%": "2.7%", "aDOT": "7.8", "aYAC": "5.4"}}, {"category": "team-offense", "subpage": "rushing-analytics", "team_abbr": "SF", "metrics": {"Team": "San Francisco 49ers", "GP": "4", "EPA/ATT": "-0.057", "SUCC%": "42.9%", "DVOA": "2.9%", "aRYOE": "", "EXP%": "12.4%", "STF%": "17.1%", "aYBCO": "1.67", "aYACO": "2.37", "CRT%": "57.4%"}}, {"category": "team-offense", "subpage": "tempo", "team_abbr": "SF", "metrics": {"Team": "San Francisco 49ers", "GP": "4", "PLY/GM": "57.0", "TOP": "27.30", "DRV/GM": "9.3", "SEC/PLY": "28.7", "PLY/DRV": "6.2", "YD/DRV": "42.1", "SEC/DRV": "177", "3&O": "16.2%", "SCD%": "54.1%"}}, {"category": "team-offense", "subpage": "tendencies", "team_abbr": "SF", "metrics": {"Team": "San Francisco 49ers", "GP": "4", "DPBK%": "53.9%", "RUSH%": "46.1%", "SHG%": "43.4%", "NH%": "0.9%", "MOT%": "78.1%", "PA%": "23.6%", "IZ%": "29.5%", "OZ%": "34.3%", "MD%": "8.6%", "PWR%": "3.8%", "CTR%": "1.0%"}}]}, "SEA": {"record_count": 150, "team_level_tables": [{"category": "team-defense", "subpage": "efficiency", "team_abbr": "SEA", "metrics": {"Team": "Seattle Seahawks", "GP": "4", "EPA/PLY": "-0.142", "DVOA": "-22.5%", "SUCC%": "36.4%", "EXP%": "5.7%", "CONV%": "40.3%", "TO": "7", "TO%": "2.8%", "3&O": "30.4%", "MTKL%": "8.8%", "PEN%": "6.5%", "PENY": "51.0"}}, {"category": "team-defense", "subpage": "overview", "team_abbr": "SEA", "metrics": {"Team": "Seattle Seahawks", "GP": "4", "YD/PLY": "4.3", "PT/GM": "16.8", "FD%": "23.9%", "TO": "7", "DPBK%": "60.3%", "YD": "645", "TD": "6", "INT": "6", "RUSH%": "39.7%", "YD__2": "408", "TD__2": "1"}}, {"category": "team-defense", "subpage": "pass-rush", "team_abbr": "SEA", "metrics": {"Team": "Seattle Seahawks", "GP": "4", "DPBK": "149", "SK": "11", "SK%": "7.4%", "QBH%": "20.8%", "PRESS": "55", "PRESS%": "36.9%", "QPRESS%": "52.7%", "TTPR": "2.47", "DISR%": "6.0%", "BLZ%": "21.5%"}}, {"category": "team-defense", "subpage": "passing-analytics", "team_abbr": "SEA", "metrics": {"Team": "Seattle Seahawks", "GP": "4", "EPA/DB": "-0.078", "SUCC%": "40.9%", "DVOA": "-10.9%", "CPOE": "-0.36%", "CBALL%": "71.8%", "EXP%": "6.4%", "INTW%": "5.6%", "TGHT%": "21.8%", "OPEN%": "59.7%", "TA%": "4.0%", "DROP%": "5.6%"}}, {"category": "team-defense", "subpage": "rush-analytics", "team_abbr": "SEA", "metrics": {"Team": "Seattle Seahawks", "GP": "4", "EPA/ATT": "-0.239", "SUCC%": "29.6%", "DVOA": "-37.4%", "aRYOE": "", "EXP%": "6.1%", "STF%": "24.5%", "YBCO": "0.98", "YACO": "1.51"}}, {"category": "team-offense", "subpage": "efficiency", "team_abbr": "SEA", "metrics": {"Team": "Seattle Seahawks", "GP": "4", "EPA/PLY": "0.001", "DVOA": "-2.7%", "SUCC%": "43.9%", "EXP%": "10.1%", "CONV%": "34.0%", "TO": "5", "TO%": "2.11%", "PENY": "30.8", "PEN%": "8.02%"}}, {"category": "team-offense", "subpage": "overview", "team_abbr": "SEA", "metrics": {"Team": "Seattle Seahawks", "GP": "4", "YD/PLY": "6.1", "PT/GM": "24.8", "FD%": "32.5%", "TO": "5", "DPBK%": "53.6%", "YD": "996", "TD": "10", "INT": "3", "RUSH%": "46.4%", "YD__2": "441", "TD__2": "3"}}, {"category": "team-offense", "subpage": "pass-protection", "team_abbr": "SEA", "metrics": {"Team": "Seattle Seahawks", "GP": "4", "SK": "6", "SK%": "4.7%", "QBSK%": "50.0%", "QBH%": "18.1%", "PRESS%": "28.3%", "UPRES%": "34.5%", "BLITZ%": "40.9%", "TTPR": "3.01", "TTT": "2.86", "EPA/DB": "-0.575", "DVOA": "-104.2%", "SUCC%": "27.8%", "EPA/DB__2": "0.497", "DVOA__2": "56.0%", "SUCC%__2": "60.4%"}}, {"category": "team-offense", "subpage": "passing-analytics", "team_abbr": "SEA", "metrics": {"Team": "Seattle Seahawks", "GP": "4", "EPA/DB": "0.193", "SUCC%": "51.2%", "DVOA": "40.2%", "CPOE": "3.0%", "CBALL%": "78.0%", "EXP%": "16.0%", "INTW%": "2.5%", "HLT%": "2.5%", "TA%": "3.4%", "DROP%": "4.2%", "aDOT": "7.0", "aYAC": "6.1"}}, {"category": "team-offense", "subpage": "rushing-analytics", "team_abbr": "SEA", "metrics": {"Team": "Seattle Seahawks", "GP": "4", "EPA/ATT": "-0.220", "SUCC%": "35.5%", "DVOA": "-28.4%", "aRYOE": "", "EXP%": "9.1%", "STF%": "24.5%", "aYBCO": "1.09", "aYACO": "2.01", "CRT%": "53.4%"}}, {"category": "team-offense", "subpage": "tempo", "team_abbr": "SEA", "metrics": {"Team": "Seattle Seahawks", "GP": "4", "PLY/GM": "59.3", "TOP": "28.86", "DRV/GM": "11.8", "SEC/PLY": "29.2", "PLY/DRV": "5.0", "YD/DRV": "30.6", "SEC/DRV": "147", "3&O": "12.8%", "SCD%": "38.3%"}}, {"category": "team-offense", "subpage": "tendencies", "team_abbr": "SEA", "metrics": {"Team": "Seattle Seahawks", "GP": "4", "DPBK%": "53.6%", "RUSH%": "46.4%", "SHG%": "45.1%", "NH%": "1.7%", "MOT%": "56.5%", "PA%": "34.6%", "IZ%": "17.3%", "OZ%": "40.0%", "MD%": "15.5%", "PWR%": "14.5%", "CTR%": "5.5%"}}]}}

## Digest rows for this game (research digest; tier labels are strict)

    SF@SEA | SEA -3 -123 / ML -172 | SEA | V: VSiN; RO: Action Network, Daniel Jeremiah & Bucky Brooks, The Favorites, Sharp or Square, BettingPros, Ryan Wormeli, Kendra Middleton, Chad Millman, Pro Football Talk; vs SF: PFF (Sam Monson & Steve Palazzolo) (RO), Ross Tucker (RO… | 2-
    SF@SEA | U46.5 -112 | Under | RO: BettingPros, Seth Woolcock, Andrew Erickson, ESPN NFL (src 46.5/47/47.5/49 vs now 46.5) | 2- research-only
    SF@SEA | Brayden Willis ATD +2200 | Yes | YT/PI: Brandon Anderson (YT); RO: Action Network; src px not BKR | 2- research-only
    SF@SEA | Christian McCaffrey o4.5 rec -116 | Over | YT/PI: Brandon Anderson (YT); RO: Action Network, Cody Brown Bets (X); src px not BKR | 2- research-only
    SF@SEA | AJ Barner ATD +310 | Yes | RO: Action Network, Grant Neiffer; src px not BKR | 2- research-only
    SF@SEA | Mike Evans ATD +210 | Yes | RO: Action Network, Grant Neiffer; src px not BKR | 2- research-only
    SF@SEA | Brock Purdy o22.5 rush yds -114 | Over | RO: Cody Brown; src px not BKR | 2- research-only

## Source rows (verified only): counts {"corroboration_only": 30, "near_miss": 2, "tier_eligible": 1}

Only rows with tier_eligible=true may support a tier. near_miss and corroboration_only rows are context.

| row | kind | outlet | market | side | line | tier_eligible | near_miss |
|---|---|---|---|---|---|---|---|
| w05-expert-verified.json#rows[22] | expert_feed | Action Network | prop | None | 310 | False | False |
| w05-expert-verified.json#rows[23] | expert_feed | Action Network | prop | None | 210 | False | False |
| w05-expert-verified.json#rows[42] | expert_feed | Action Network | spread | SEA | -2.5 | False | False |
| w05-expert-verified.json#rows[46] | expert_feed | Daniel Jeremiah & Bucky Brooks | moneyline | SEA | None | False | False |
| w05-expert-verified.json#rows[69] | expert_feed | BettingPros | prop | None | 32.5 | False | False |
| w05-expert-verified.json#rows[72] | expert_feed | BettingPros | prop | None | 94.5 | False | False |
| w05-expert-verified.json#rows[94] | expert_feed | Daniel Jeremiah & Bucky Brooks | moneyline | SEA | None | False | False |
| w05-expert-verified.json#rows[100] | expert_feed | Action Network | prop | None | 2200 | False | False |
| w05-expert-verified.json#rows[115] | expert_feed | Action Network | prop | None | 4.5 | False | False |
| w05-expert-verified.json#rows[123] | expert_feed | The Favorites | spread | SEA | -2.5 | False | False |
| w05-expert-verified.json#rows[141] | expert_feed | BettingPros | total | Under | 47.5 | False | False |
| w05-expert-verified.json#rows[179] | expert_feed | PFF (Sam Monson & Steve Palazzolo) | moneyline | SF | None | False | False |
| w05-expert-verified.json#rows[186] | expert_feed | Sharp or Square | spread | SEA | -2.5 | False | False |
| w05-expert-verified.json#rows[189] | expert_feed | BettingPros | total | Under | 46.5 | False | False |
| w05-expert-verified.json#rows[190] | expert_feed | BettingPros | spread | SEA | -3 | False | False |
| w05-expert-verified.json#rows[225] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[226] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[246] | podcast | NFL Week 5 Picks &amp; Predictions: Best Bets, Upset Specials, Parlays &amp; Props (Ep. 1092) | total | Under | 47.5 | False | False |
| w05-expert-verified.json#rows[308] | podcast | 2026 NFL Week 5 Bets | spread | SF | 3 | False | False |
| w05-expert-verified.json#rows[339] | podcast | NFL Week 5 Early Lines: Best Bets, Early Odds &amp; Betting Picks for Every Game (Ep. 1087) | totals | None | 47 | False | False |
| w05-expert-verified.json#rows[340] | podcast | NFL Week 5 Early Lines: Best Bets, Early Odds &amp; Betting Picks for Every Game (Ep. 1087) | spread | SEA | -2.5 | False | False |
| w05-expert-verified.json#rows[348] | podcast | Construction &amp; Big Dog Picks | NFL Week 5 Preview | spread | SEA | -2.5 | False | False |
| w05-expert-verified.json#rows[369] | podcast | NFL WEEK 5 Betting Preview: Bucs-Cowboys, Bears-Packers and more | spread | SEA | -2.5 | False | False |
| w05-expert-verified.json#rows[377] | article | Cody Brown Bets | prop | OVER 22.5 (-114) | None | False | False |
| w05-expert-verified.json#rows[393] | article | ESPN NFL | total | Under | 49.0 | False | True |
| w05-expert-verified.json#rows[423] | article | BettingPros | prop | OVER 47.5 | None | False | False |
| w05-expert-verified.json#rows[431] | article | Twitter/X Bookmarks (Personal) | prop | OVER 0.5 | None | False | False |
| w05-expert-verified.json#rows[437] | article | Twitter/X Bookmarks (Personal) | prop | OVER 35.5 | None | False | False |
| w05-expert-verified.json#rows[450] | article | VSiN | spread | SEA | -3.0 | True | False |
| w05-expert-verified.json#rows[473] | article | Twitter/X Bookmarks (Personal) | prop | OVER 0.5 | None | False | False |
| w05-expert-verified.json#rows[505] | article | Twitter/X Bookmarks (Personal) | prop | OVER 0.5 | None | False | True |
| w05-expert-verified.json#rows[543] | article | Pro Football Talk | moneyline | SEA | None | False | False |
| w05-expert-verified.json#rows[582] | article | Twitter/X Bookmarks (Personal) | prop | OVER 4.5 | None | False | False |

- w05-expert-verified.json#rows[393] (ESPN NFL) https://www.espn.com/espn/betting/story/_/id/50107426/week-5-nfl-odds-props-best-bets-sunday-games: "In the two games these clubs played last season, the totals hit 30 and 16. Mike Macdonald has the scheme (and personnel) to limit the 49ers' offense."

- w05-expert-verified.json#rows[450] (VSiN) https://vsin.com/nfl/wes-reynolds-nfl-week-5-best-bets-and-predictions/: "Seattle Seahawks -3 vs."

- w05-expert-verified.json#rows[505] (Twitter/X Bookmarks (Personal)) https://x.com/thepropdealer/status/2108253933227635054: "Anytime TD Scorer"

## Read directly if needed

- weather_detail: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json (filter to SF@SEA)
- prop_markets: BKR/BEO rows for event "San Francisco 49ers @ Seattle Seahawks" with market != game_lines
- player_stats: data/vault-seed/nflverse/player_stats_weekly.csv (season 2026) for SF and SEA
- projected_starters: data/projected-starters/2026/latest.json (teams.SF, teams.SEA)
