# CLE@NYJ packet — Cleveland Browns @ New York Jets

Kickoff 2026-10-11T17:00:00.000Z UTC. Built 2026-10-11T01:22:14.064268+00:00. spread = HOME team line; favorite has the negative number; marginAdj in the simulator is home-positive points

## Market

**BKR** captured 2026-10-11T01:15:40.538Z; recommendation window ends 2026-10-11T07:15:40.538000+00:00; fresh at build: True
- spread: Cleveland Browns 2.5 -109; New York Jets -2.5 -107
- total: Over 39.5 -108; Under 39.5 -108
- moneyline: Cleveland Browns  118; New York Jets  -135

**BEO** captured 2026-10-11T01:19:56.400Z; recommendation window ends 2026-10-11T07:19:56.400000+00:00; fresh at build: True
- spread: Cleveland Browns 1 105; New York Jets -1 -125
- total: Over 39.5 -110; Under 39.5 -110
- moneyline: Cleveland Browns  120; New York Jets  -140

**BOOK CONFLICT:** BKR home line -2.5 vs BEO -1 (>=1.0 pt apart); recapture before relying on either

Market-implied score: {"NYJ": 21.0, "CLE": 18.5, "basis": "BKR home line -2.5 total 39.5"}

Action Network opener: {"an_game_id": 290908, "kickoff_utc": "2026-10-11T17:00:00Z", "sp": {"NYJ": -1.5, "CLE": 1.5}, "sp_odds_home": -110, "sp_at": "2026-10-05T00:06:56Z", "tot": 40.0, "tot_at": "2026-10-05T00:04:45Z", "ml": {"CLE": -100, "NYJ": -120}, "carried_from_before_cutoff": false}

Action Network splits (captured 2026-10-09T19:41:08.878Z): {"game_id": 290908, "away_team": "CLE", "home_team": "NYJ", "kickoff_at": "2026-10-11T17:00:00.000Z", "spread": [{"side": "away", "value": 2.5, "price_american": -109, "ticket_pct": 84, "money_pct": 74}, {"side": "home", "value": -2.5, "price_american": -110, "ticket_pct": 16, "money_pct": 26}], "total": [{"side": "under", "value": 39.5, "price_american": -109, "ticket_pct": 27, "money_pct": 37}, {"side": "over", "value": 39.5, "price_american": -113, "ticket_pct": 73, "money_pct": 63}], "moneyline": [{"side": "home", "value": 0, "price_american": -137, "ticket_pct": 31, "money_pct": 34}, {"side": "away", "value": 0, "price_american": 114, "ticket_pct": 69, "money_pct": 66}]}

SuperContest row (contest line, not a book price; labels may be reversed): {"away_team": "CLE", "home_team": "NYJ", "favorite": "NYJ", "underdog": "CLE", "favorite_spread": -2.5, "kickoff_display": "Sun 1:00 pm"}

## Team state: schedule, results and standings

### CLE (AFC North) 3-1
- PF 81 / PA 95 (diff -14); PPG 20.2 / PAPG 23.8; home 2-0, away 1-1, division 1-0
- Opponents faced to date have a combined record of 7-9; rest before this game: 9.7 days; byes used: none; byes remaining: [11]

| week | site | opp | opp_record | result | pf | pa |
|---|---|---|---|---|---|---|
| 1 | A | JAX | 3-1 | L | 10 | 34 |
| 2 | A | TB | 0-4 | W | 23 | 19 |
| 3 | H | CAR | 2-2 | W | 21 | 18 |
| 4 | H | PIT | 2-2 | W | 27 | 24 |

Next games: wk5 A NYJ; wk6 H BAL; wk7 A TEN; wk8 A PIT

### NYJ (AFC East) 1-3
- PF 76 / PA 84 (diff -8); PPG 19.0 / PAPG 21.0; home 0-1, away 1-2, division 0-0
- Opponents faced to date have a combined record of 7-9; rest before this game: 7.0 days; byes used: none; byes remaining: [13]

| week | site | opp | opp_record | result | pf | pa |
|---|---|---|---|---|---|---|
| 1 | A | TEN | 0-4 | W | 23 | 10 |
| 2 | H | GB | 2-2 | L | 17 | 20 |
| 3 | A | DET | 2-2 | L | 24 | 31 |
| 4 | A | CHI | 3-1 | L | 12 | 23 |

Next games: wk5 H CLE; wk6 A NE; wk7 H MIA; wk8 H LV

## Standings context

**AFC East**
| rank | team | record | point_diff | div |
|---|---|---|---|---|
| 1 | BUF | 3-1 | 20 | 0-1 |
| 2 | NE | 2-2 | -12 | 1-0 |
| 3 | NYJ | 1-3 | -8 | 0-0 |
| 4 | MIA | 0-4 | -55 | 0-0 |

**AFC North**
| rank | team | record | point_diff | div |
|---|---|---|---|---|
| 1 | BAL | 3-1 | 20 | 0-0 |
| 2 | CLE | 3-1 | -14 | 1-0 |
| 3 | CIN | 2-2 | 12 | 0-1 |
| 4 | PIT | 2-2 | -10 | 1-1 |

**AFC order (top 8)**: 1 KC 4-0, 2 JAX 3-1, 3 LV 3-1, 4 BUF 3-1, 5 BAL 3-1, 6 CLE 3-1, 7 CIN 2-2, 8 IND 2-2

Order is win% then point differential only; official NFL tiebreakers are not applied. Includes the Week 5 TB@DAL final.

## Existing quantitative pass (provisional, unbacktested; 60% market / 25% FTN / 15% SRS)

Means: {"home": 20.20089214495953, "away": 19.46185486180214, "total": 39.66274700676167, "home_margin": 0.739037283157387}
Simulation: {"iterations": 100000, "mean_home": 20.433728745261348, "mean_away": 19.755044437715263, "home_win_pct": 0.517, "home_cover_pct": 0.45582, "away_cover_pct": 0.54418, "over_pct": 0.50583, "under_pct": 0.49417}
Features: {"offense_z": {"NYJ": -0.3860357599446519, "CLE": -0.3444385109682544}, "defense_weakness_z": {"NYJ": 0.4491673187547484, "CLE": 0.2162801371695605}, "tempo_z": {"NYJ": -0.5941953692401646, "CLE": -0.9615360206931467}, "srs": {"NYJ": -4.359, "CLE": 0.405}, "secondary_adjustment_points": {"NYJ": 0.135, "CLE": 0.30000000000000004}}

## Calibrated simulator edge sweep (home-margin edge in points vs BKR line)

| home_margin_edge_pts | home_cover | away_cover | side_push | over | under | total_push |
|---|---|---|---|---|---|---|
| -3 | 0.422 | 0.578 | 0 | 0.5 | 0.5 | 0 |
| -2 | 0.4478 | 0.5522 | 0 | 0.5 | 0.5 | 0 |
| -1 | 0.4738 | 0.5262 | 0 | 0.5 | 0.5 | 0 |
| 0 | 0.5 | 0.5 | 0 | 0.5 | 0.5 | 0 |
| 1 | 0.5262 | 0.4738 | 0 | 0.5 | 0.5 | 0 |
| 2 | 0.5524 | 0.4476 | 0 | 0.5 | 0.5 | 0 |
| 3 | 0.5785 | 0.4215 | 0 | 0.5 | 0.5 | 0 |

Zero edge is exactly 50/50. These rows convert a hypothesised home-margin edge (points vs the BKR line) into cover/over probability using the calibrated 2018-2025 key-number-aware model. Use scripts/intel/margin-simulator.mjs for other values; never do this arithmetic by hand.

## Power ratings

{"CLE": {"season": 2026, "team": "Browns", "team_abbr": "CLE", "games_played": 4, "record": "3-1", "power_rating": {"srs": 0.405, "net_points_per_game": -3.5, "pythag_win_pct": 0.4066, "model_composite_z": -0.3184, "model_rank": 20, "srs_rank": 14, "net_ppg_rank": 22, "pythag_rank": 21, "market_implied_win_total": 8.36, "market_implied_rank": 21, "delta": 0.0521, "delta_basis": "z_score_market_minus_model"}, "attribution_note": "model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending."}, "NYJ": {"season": 2026, "team": "Jets", "team_abbr": "NYJ", "games_played": 4, "record": "1-3", "power_rating": {"srs": -4.359, "net_points_per_game": -2, "pythag_win_pct": 0.441, "model_composite_z": -0.4109, "model_rank": 23, "srs_rank": 23, "net_ppg_rank": 18, "pythag_rank": 18, "market_implied_win_total": 6.12, "market_implied_rank": 28, "delta": -0.816, "delta_basis": "z_score_market_minus_model"}, "attribution_note": "model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending."}}

## Weather / venue

{"game": "CLE@NYJ", "weather_status": "forecast_captured", "source_game": "CLE@NYJ", "materiality": "review_required: precipitation probability 78%, forecast precipitation 1.8 mm, gusts 37.1 km/h"}

## Availability digest (top events per team)

{"CLE": {"event_count": 23, "qb_events": 2, "offensive_line_worsening": 1, "defensive_front_worsening": 7, "top_score": 108, "top_events": [{"player_name": "Dillon Gabriel", "position": "QB", "unit": "quarterback", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "qb_major", "score": 108, "signal": "negative_availability"}, {"player_name": "Dillon Gabriel", "position": "QB", "unit": "quarterback", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "qb_major", "score": 104, "signal": "negative_availability"}, {"player_name": "Kalia Davis", "position": "DT", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 100, "signal": "negative_availability"}, {"player_name": "Alex Wright", "position": "DE", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Teven Jenkins", "position": "G", "unit": "offensive_line", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "offensive_line_major", "score": 81, "signal": "negative_availability"}, {"player_name": "Mike Hall Jr.", "position": "DT", "unit": "defensive_front", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 77, "signal": "negative_availability"}, {"player_name": "Mason Graham", "position": "DT", "unit": "defensive_front", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 77, "signal": "negative_availability"}, {"player_name": "Mason Graham", "position": "DT", "unit": "defensive_front", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 77, "signal": "negative_availability"}]}, "NYJ": {"event_count": 36, "qb_events": 1, "offensive_line_worsening": 1, "defensive_front_worsening": 4, "top_score": 93, "top_events": [{"player_name": "Geno Smith", "position": "QB", "unit": "quarterback", "event_type": "active_news", "availability_trend": "unknown", "impact_bucket": "qb_major", "score": 93, "signal": "review_context"}, {"player_name": "David Onyemata", "position": "DT", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Kingsley Jonathan", "position": "DT", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Braiden McGregor", "position": "DE", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Tyler Baron", "position": "DT", "unit": "defensive_front", "event_type": "pup", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 82, "signal": "negative_availability"}, {"player_name": "Breece Hall", "position": "RB", "unit": "offensive_skill", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 82, "signal": "negative_availability"}, {"player_name": "Breece Hall", "position": "RB", "unit": "offensive_skill", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 82, "signal": "negative_availability"}, {"player_name": "Dylan Parham", "position": "G", "unit": "offensive_line", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "offensive_line_major", "score": 81, "signal": "negative_availability"}]}}

## Secondary matchup context (manual; capped, never a dominant driver)

- {"offense_team": "CLE", "defense_team": "NYJ", "severity_score": 3}
- {"offense_team": "NYJ", "defense_team": "CLE", "severity_score": 1.35}

## FTN team-level tables (names preserved)

{"CLE": {"record_count": 153, "team_level_tables": [{"category": "team-defense", "subpage": "efficiency", "team_abbr": "CLE", "metrics": {"Team": "Cleveland Browns", "GP": "4", "EPA/PLY": "0.016", "DVOA": "-0.3%", "SUCC%": "43.6%", "EXP%": "11.6%", "CONV%": "36.2%", "TO": "4", "TO%": "1.5%", "3&O": "13.6%", "MTKL%": "10.8%", "PEN%": "6.6%", "PENY": "24.5"}}, {"category": "team-defense", "subpage": "overview", "team_abbr": "CLE", "metrics": {"Team": "Cleveland Browns", "GP": "4", "YD/PLY": "5.7", "PT/GM": "23.8", "FD%": "30.1%", "TO": "4", "DPBK%": "62.2%", "YD": "1,017", "TD": "9", "INT": "4", "RUSH%": "37.8%", "YD__2": "455", "TD__2": "0"}}, {"category": "team-defense", "subpage": "pass-rush", "team_abbr": "CLE", "metrics": {"Team": "Cleveland Browns", "GP": "4", "DPBK": "161", "SK": "12", "SK%": "7.5%", "QBH%": "16.1%", "PRESS": "59", "PRESS%": "36.6%", "QPRESS%": "47.5%", "TTPR": "2.52", "DISR%": "0.6%", "BLZ%": "24.2%"}}, {"category": "team-defense", "subpage": "passing-analytics", "team_abbr": "CLE", "metrics": {"Team": "Cleveland Browns", "GP": "4", "EPA/DB": "0.038", "SUCC%": "43.5%", "DVOA": "4.9%", "CPOE": "2.23%", "CBALL%": "66.4%", "EXP%": "17.2%", "INTW%": "2.1%", "TGHT%": "28.8%", "OPEN%": "52.1%", "TA%": "8.2%", "DROP%": "2.7%"}}, {"category": "team-defense", "subpage": "rush-analytics", "team_abbr": "CLE", "metrics": {"Team": "Cleveland Browns", "GP": "4", "EPA/ATT": "-0.021", "SUCC%": "43.9%", "DVOA": "-7.2%", "aRYOE": "", "EXP%": "14.3%", "STF%": "20.4%", "YBCO": "1.77", "YACO": "2.14"}}, {"category": "team-offense", "subpage": "efficiency", "team_abbr": "CLE", "metrics": {"Team": "Cleveland Browns", "GP": "4", "EPA/PLY": "-0.017", "DVOA": "-14.1%", "SUCC%": "42.2%", "EXP%": "7.4%", "CONV%": "34.6%", "TO": "3", "TO%": "1.30%", "PENY": "46.0", "PEN%": "10.87%"}}, {"category": "team-offense", "subpage": "overview", "team_abbr": "CLE", "metrics": {"Team": "Cleveland Browns", "GP": "4", "YD/PLY": "5.3", "PT/GM": "20.3", "FD%": "27.0%", "TO": "3", "DPBK%": "61.3%", "YD": "855", "TD": "6", "INT": "2", "RUSH%": "38.7%", "YD__2": "375", "TD__2": "2"}}, {"category": "team-offense", "subpage": "pass-protection", "team_abbr": "CLE", "metrics": {"Team": "Cleveland Browns", "GP": "4", "SK": "11", "SK%": "7.8%", "QBSK%": "54.5%", "QBH%": "16.3%", "PRESS%": "39.7%", "UPRES%": "27.3%", "BLITZ%": "36.2%", "TTPR": "2.51", "TTT": "2.59", "EPA/DB": "-0.135", "DVOA": "-55.4%", "SUCC%": "41.1%", "EPA/DB__2": "0.331", "DVOA__2": "34.8%", "SUCC%__2": "55.3%"}}, {"category": "team-offense", "subpage": "passing-analytics", "team_abbr": "CLE", "metrics": {"Team": "Cleveland Browns", "GP": "4", "EPA/DB": "0.146", "SUCC%": "49.6%", "DVOA": "20.5%", "CPOE": "-1.3%", "CBALL%": "76.9%", "EXP%": "11.1%", "INTW%": "3.4%", "HLT%": "0.9%", "TA%": "2.6%", "DROP%": "2.6%", "aDOT": "6.5", "aYAC": "6.4"}}, {"category": "team-offense", "subpage": "rushing-analytics", "team_abbr": "CLE", "metrics": {"Team": "Cleveland Browns", "GP": "4", "EPA/ATT": "-0.275", "SUCC%": "30.3%", "DVOA": "-32.0%", "aRYOE": "", "EXP%": "5.6%", "STF%": "22.5%", "aYBCO": "0.70", "aYACO": "1.58", "CRT%": "52.6%"}}, {"category": "team-offense", "subpage": "tempo", "team_abbr": "CLE", "metrics": {"Team": "Cleveland Browns", "GP": "4", "PLY/GM": "57.5", "TOP": "27.12", "DRV/GM": "12.0", "SEC/PLY": "28.3", "PLY/DRV": "4.8", "YD/DRV": "25.6", "SEC/DRV": "136", "3&O": "18.8%", "SCD%": "33.3%"}}, {"category": "team-offense", "subpage": "tendencies", "team_abbr": "CLE", "metrics": {"Team": "Cleveland Browns", "GP": "4", "DPBK%": "61.3%", "RUSH%": "38.7%", "SHG%": "70.0%", "NH%": "1.7%", "MOT%": "50.4%", "PA%": "20.6%", "IZ%": "30.3%", "OZ%": "20.2%", "MD%": "13.5%", "PWR%": "15.7%", "CTR%": "5.6%"}}]}, "NYJ": {"record_count": 150, "team_level_tables": [{"category": "team-defense", "subpage": "efficiency", "team_abbr": "NYJ", "metrics": {"Team": "New York Jets", "GP": "4", "EPA/PLY": "-0.021", "DVOA": "1.9%", "SUCC%": "48.4%", "EXP%": "8.3%", "CONV%": "38.5%", "TO": "3", "TO%": "1.2%", "3&O": "22.5%", "MTKL%": "12.8%", "PEN%": "6.7%", "PENY": "44.3"}}, {"category": "team-defense", "subpage": "overview", "team_abbr": "NYJ", "metrics": {"Team": "New York Jets", "GP": "4", "YD/PLY": "5.2", "PT/GM": "21.0", "FD%": "29.0%", "TO": "3", "DPBK%": "56.7%", "YD": "822", "TD": "5", "INT": "1", "RUSH%": "43.3%", "YD__2": "494", "TD__2": "4"}}, {"category": "team-defense", "subpage": "pass-rush", "team_abbr": "NYJ", "metrics": {"Team": "New York Jets", "GP": "4", "DPBK": "143", "SK": "9", "SK%": "6.3%", "QBH%": "10.5%", "PRESS": "24", "PRESS%": "16.8%", "QPRESS%": "29.2%", "TTPR": "2.83", "DISR%": "0.7%", "BLZ%": "37.1%"}}, {"category": "team-defense", "subpage": "passing-analytics", "team_abbr": "NYJ", "metrics": {"Team": "New York Jets", "GP": "4", "EPA/DB": "0.076", "SUCC%": "50.3%", "DVOA": "5.7%", "CPOE": "1.34%", "CBALL%": "76.4%", "EXP%": "10.6%", "INTW%": "1.6%", "TGHT%": "30.7%", "OPEN%": "59.8%", "TA%": "5.5%", "DROP%": "3.9%"}}, {"category": "team-defense", "subpage": "rush-analytics", "team_abbr": "NYJ", "metrics": {"Team": "New York Jets", "GP": "4", "EPA/ATT": "-0.149", "SUCC%": "45.9%", "DVOA": "-2.7%", "aRYOE": "", "EXP%": "11.0%", "STF%": "15.6%", "YBCO": "1.51", "YACO": "2.67"}}, {"category": "team-offense", "subpage": "efficiency", "team_abbr": "NYJ", "metrics": {"Team": "New York Jets", "GP": "4", "EPA/PLY": "0.007", "DVOA": "-6.7%", "SUCC%": "43.0%", "EXP%": "8.7%", "CONV%": "37.0%", "TO": "1", "TO%": "0.43%", "PENY": "33.3", "PEN%": "8.70%"}}, {"category": "team-offense", "subpage": "overview", "team_abbr": "NYJ", "metrics": {"Team": "New York Jets", "GP": "4", "YD/PLY": "5.4", "PT/GM": "19.0", "FD%": "28.3%", "TO": "1", "DPBK%": "60.4%", "YD": "902", "TD": "5", "INT": "0", "RUSH%": "39.6%", "YD__2": "336", "TD__2": "3"}}, {"category": "team-offense", "subpage": "pass-protection", "team_abbr": "NYJ", "metrics": {"Team": "New York Jets", "GP": "4", "SK": "12", "SK%": "8.6%", "QBSK%": "0.0%", "QBH%": "15.8%", "PRESS%": "23.0%", "UPRES%": "15.8%", "BLITZ%": "25.2%", "TTPR": "2.64", "TTT": "2.78", "EPA/DB": "-0.592", "DVOA": "-121.3%", "SUCC%": "25.0%", "EPA/DB__2": "0.356", "DVOA__2": "39.3%", "SUCC%__2": "53.3%"}}, {"category": "team-offense", "subpage": "passing-analytics", "team_abbr": "NYJ", "metrics": {"Team": "New York Jets", "GP": "4", "EPA/DB": "0.137", "SUCC%": "46.8%", "DVOA": "23.1%", "CPOE": "5.8%", "CBALL%": "81.5%", "EXP%": "14.1%", "INTW%": "1.7%", "HLT%": "2.5%", "TA%": "3.4%", "DROP%": "5.0%", "aDOT": "7.0", "aYAC": "4.8"}}, {"category": "team-offense", "subpage": "rushing-analytics", "team_abbr": "NYJ", "metrics": {"Team": "New York Jets", "GP": "4", "EPA/ATT": "-0.193", "SUCC%": "37.4%", "DVOA": "-12.7%", "aRYOE": "", "EXP%": "7.7%", "STF%": "24.2%", "aYBCO": "1.07", "aYACO": "1.97", "CRT%": "60.3%"}}, {"category": "team-offense", "subpage": "tempo", "team_abbr": "NYJ", "metrics": {"Team": "New York Jets", "GP": "4", "PLY/GM": "57.5", "TOP": "29.66", "DRV/GM": "10.0", "SEC/PLY": "31.0", "PLY/DRV": "5.8", "YD/DRV": "30.9", "SEC/DRV": "178", "3&O": "25.0%", "SCD%": "37.5%"}}, {"category": "team-offense", "subpage": "tendencies", "team_abbr": "NYJ", "metrics": {"Team": "New York Jets", "GP": "4", "DPBK%": "60.4%", "RUSH%": "39.6%", "SHG%": "57.8%", "NH%": "4.8%", "MOT%": "46.5%", "PA%": "21.6%", "IZ%": "28.6%", "OZ%": "29.7%", "MD%": "24.2%", "PWR%": "5.5%", "CTR%": "3.3%"}}]}}

## Digest rows for this game (research digest; tier labels are strict)

    CLE@NYJ | NYJ -2.5 -107 / ML -135 | NYJ | V: VSiN; RO: Daniel Jeremiah & Bucky Brooks, Action Network, Sharp or Square, Even Money, Steve Fezzik; vs CLE: Daniel Jeremiah & Bucky Brooks (RO), Action Network (RO), BettingPros (RO), Pat Fitzmaurice (RO), Pro Football Talk (RO); … | 2-
    CLE@NYJ | Quinshon Judkins u59.5 rush yds -114 | Under | YT/PI: Josh Shepardson (Sharp Football) (PI); RO: ESPN NFL, Sharp Football; src prices -114/-112; src px not BKR | 2- research-only
    CLE@NYJ | Garrett Wilson ATD +140 | Yes | RO: BettingPros, PFF, @thepropdealer (X); src px not BKR | 2- research-only
    CLE@NYJ | Isaiah Williams ATD +450 | Yes | RO: Action Network, Gilles Gallant; src px not BKR | 2- research-only
    CLE@NYJ | KC Concepcion ATD +320 | Yes | RO: Action Network, Gilles Gallant; src px not BKR | 2- research-only

## Source rows (verified only): counts {"corroboration_only": 26, "tier_eligible": 1}

Only rows with tier_eligible=true may support a tier. near_miss and corroboration_only rows are context.

| row | kind | outlet | market | side | line | tier_eligible | near_miss |
|---|---|---|---|---|---|---|---|
| w05-expert-verified.json#rows[10] | expert_feed | Action Network | prop | None | 320 | False | False |
| w05-expert-verified.json#rows[11] | expert_feed | Action Network | prop | None | 450 | False | False |
| w05-expert-verified.json#rows[52] | expert_feed | Daniel Jeremiah & Bucky Brooks | moneyline | CLE | None | False | False |
| w05-expert-verified.json#rows[53] | expert_feed | Daniel Jeremiah & Bucky Brooks | moneyline | NYJ | None | False | False |
| w05-expert-verified.json#rows[59] | expert_feed | BettingPros | prop | None | 140 | False | False |
| w05-expert-verified.json#rows[110] | expert_feed | Action Network | spread | NYJ | -1.5 | False | False |
| w05-expert-verified.json#rows[135] | expert_feed | Sharp or Square | spread | NYJ | -1.5 | False | False |
| w05-expert-verified.json#rows[150] | expert_feed | Even Money | spread | NYJ | -1.5 | False | False |
| w05-expert-verified.json#rows[159] | expert_feed | Action Network | futures | None | 7.5 | False | False |
| w05-expert-verified.json#rows[160] | expert_feed | Action Network | spread | CLE | None | False | False |
| w05-expert-verified.json#rows[161] | expert_feed | Even Money | teaser | CLE | 8.5 | False | False |
| w05-expert-verified.json#rows[178] | expert_feed | BettingPros | moneyline | CLE | 110 | False | False |
| w05-expert-verified.json#rows[215] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[216] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[260] | podcast | 2026 NFL Week 5 Prop Bets &amp; Parlays | spread | NYJ | -1.5 | False | False |
| w05-expert-verified.json#rows[286] | podcast | Early NFL BEST BETS &amp; Survivor Pool Picks: Week 5 Predictions (Ep. 1089) | moneyline | CLE | None | False | False |
| w05-expert-verified.json#rows[298] | podcast | 2026 NFL Week 5 Bets | teaser | CLE | 8.5 | False | False |
| w05-expert-verified.json#rows[299] | podcast | 2026 NFL Week 5 Bets | teaser | CLE | 8.5 | False | False |
| w05-expert-verified.json#rows[355] | podcast | Construction &amp; Big Dog Picks | NFL Week 5 Preview | prop | OVER | 10.5 | False | False |
| w05-expert-verified.json#rows[359] | podcast | Fantasy Football Start or Sit Lineup Advice: Experts Pick Who To Start Week 5 (2026) | prop | UNKNOWN | None | False | False |
| w05-expert-verified.json#rows[395] | article | ESPN NFL | prop | UNDER 59.5 (-114) | None | False | False |
| w05-expert-verified.json#rows[403] | article | ESPN NFL | prop | UNDER 0.5 (+122) | None | False | False |
| w05-expert-verified.json#rows[413] | article | Sharp Football | prop | UNDER 59.5 (-112) | None | False | False |
| w05-expert-verified.json#rows[418] | article | PFF | prop | Garrett Wilson | None | False | False |
| w05-expert-verified.json#rows[454] | article | VSiN | moneyline | NYJ | None | True | False |
| w05-expert-verified.json#rows[467] | article | Twitter/X Bookmarks (Personal) | prop | OVER 0.5 | None | False | False |
| w05-expert-verified.json#rows[537] | article | Pro Football Talk | moneyline | CLE | None | False | False |

- w05-expert-verified.json#rows[454] (VSiN) https://vsin.com/nfl/wes-reynolds-nfl-week-5-best-bets-and-predictions/: "New York Jets -130 ML vs."

## Read directly if needed

- weather_detail: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json (filter to CLE@NYJ)
- prop_markets: BKR/BEO rows for event "Cleveland Browns @ New York Jets" with market != game_lines
- player_stats: data/vault-seed/nflverse/player_stats_weekly.csv (season 2026) for CLE and NYJ
- projected_starters: data/projected-starters/2026/latest.json (teams.CLE, teams.NYJ)
