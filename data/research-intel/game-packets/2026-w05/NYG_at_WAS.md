# NYG@WAS packet — New York Giants @ Washington Commanders

Kickoff 2026-10-11T17:00:00.000Z UTC. Built 2026-10-11T01:22:14.064268+00:00. spread = HOME team line; favorite has the negative number; marginAdj in the simulator is home-positive points

**Division game** (NFC East).

## Market

**BKR** captured 2026-10-11T01:15:40.538Z; recommendation window ends 2026-10-11T07:15:40.538000+00:00; fresh at build: True
- spread: New York Giants 3.5 -108; Washington Commanders -3.5 -108
- total: Over 41.5 -103; Under 41.5 -113
- moneyline: New York Giants  159; Washington Commanders  -182

**BEO** captured 2026-10-11T01:19:56.400Z; recommendation window ends 2026-10-11T07:19:56.400000+00:00; fresh at build: True
- spread: New York Giants 3.5 -113; Washington Commanders -3.5 -107
- total: Over 41.5 -110; Under 41.5 -110
- moneyline: New York Giants  157; Washington Commanders  -180

Market-implied score: {"WAS": 22.5, "NYG": 19.0, "basis": "BKR home line -3.5 total 41.5"}

Action Network opener: {"an_game_id": 290904, "kickoff_utc": "2026-10-11T17:00:00Z", "sp": {"WAS": -3.5, "NYG": 3.5}, "sp_odds_home": -107, "sp_at": "2026-10-05T00:12:55Z", "tot": 44.5, "tot_at": "2026-10-05T00:06:55Z", "ml": {"NYG": 147, "WAS": -182}, "carried_from_before_cutoff": false}

Action Network splits (captured 2026-10-09T19:41:08.878Z): {"game_id": 290904, "away_team": "NYG", "home_team": "WAS", "kickoff_at": "2026-10-11T17:00:00.000Z", "spread": [{"side": "home", "value": -4.5, "price_american": -110, "ticket_pct": 26, "money_pct": 25}, {"side": "away", "value": 4.5, "price_american": -112, "ticket_pct": 74, "money_pct": 75}], "total": [{"side": "under", "value": 41.5, "price_american": -109, "ticket_pct": 23, "money_pct": 30}, {"side": "over", "value": 41.5, "price_american": -113, "ticket_pct": 77, "money_pct": 70}], "moneyline": [{"side": "away", "value": 0, "price_american": 162, "ticket_pct": 46, "money_pct": 55}, {"side": "home", "value": 0, "price_american": -200, "ticket_pct": 54, "money_pct": 45}]}

SuperContest row (contest line, not a book price; labels may be reversed): {"away_team": "NYG", "home_team": "WAS", "favorite": "WAS", "underdog": "NYG", "favorite_spread": -3.5, "kickoff_display": "Sun 1:00 pm"}

## Team state: schedule, results and standings

### NYG (NFC East) 3-1
- PF 82 / PA 79 (diff +3); PPG 20.5 / PAPG 19.8; home 3-0, away 0-1, division 1-0
- Opponents faced to date have a combined record of 5-11; rest before this game: 7.0 days; byes used: none; byes remaining: [8]

| week | site | opp | opp_record | result | pf | pa |
|---|---|---|---|---|---|---|
| 1 | H | DAL | 2-2 | W | 28 | 20 |
| 2 | A | LAR | 2-2 | L | 6 | 28 |
| 3 | H | TEN | 0-4 | W | 12 | 7 |
| 4 | H | ARI | 1-3 | W | 36 | 24 |

Next games: wk5 A WAS; wk6 H NO; wk7 A HOU; wk9 A PHI

### WAS (NFC East) 1-3
- PF 88 / PA 122 (diff -34); PPG 22.0 / PAPG 30.5; home 1-1, away 0-2, division 0-2
- Opponents faced to date have a combined record of 9-7; rest before this game: 7.1 days; byes used: none; byes remaining: [7]

| week | site | opp | opp_record | result | pf | pa |
|---|---|---|---|---|---|---|
| 1 | A | PHI | 2-2 | L | 22 | 24 |
| 2 | A | DAL | 2-2 | L | 20 | 37 |
| 3 | H | SEA | 3-1 | W | 33 | 31 |
| 4 | H | IND | 2-2 | L | 13 | 30 |

Next games: wk5 H NYG; wk6 A SF; wk8 H PHI; wk9 H LAR

## Standings context

**NFC East**
| rank | team | record | point_diff | div |
|---|---|---|---|---|
| 1 | NYG | 3-1 | 3 | 1-0 |
| 2 | DAL | 2-2 | 10 | 1-1 |
| 3 | PHI | 2-2 | -18 | 1-0 |
| 4 | WAS | 1-3 | -34 | 0-2 |

**NFC order (top 8)**: 1 SF 4-0, 2 MIN 4-0, 3 CHI 3-1, 4 SEA 3-1, 5 NYG 3-1, 6 CAR 2-2, 7 DAL 2-2, 8 ATL 2-2

Order is win% then point differential only; official NFL tiebreakers are not applied. Includes the Week 5 TB@DAL final.

## Existing quantitative pass (provisional, unbacktested; 60% market / 25% FTN / 15% SRS)

Means: {"home": 21.644559153513356, "away": 20.885122830167827, "total": 42.529681983681186, "home_margin": 0.759436323345529}
Simulation: {"iterations": 100000, "mean_home": 21.810293745806263, "mean_away": 21.033370487343273, "home_win_pct": 0.51725, "home_cover_pct": 0.43365, "away_cover_pct": 0.56635, "over_pct": 0.52301, "under_pct": 0.47699}
Features: {"offense_z": {"WAS": -0.7313032483467585, "NYG": -0.7816741106308326}, "defense_weakness_z": {"WAS": 1.0499739719419563, "NYG": -0.16481928170849797}, "tempo_z": {"WAS": -0.21810851180020724, "NYG": -0.06942301002161909}, "srs": {"WAS": -11.37, "NYG": -4.141}, "secondary_adjustment_points": {"WAS": 0.525, "NYG": 0.555}}

## Calibrated simulator edge sweep (home-margin edge in points vs BKR line)

| home_margin_edge_pts | home_cover | away_cover | side_push | over | under | total_push |
|---|---|---|---|---|---|---|
| -3 | 0.421 | 0.579 | 0 | 0.5 | 0.5 | 0 |
| -2 | 0.4471 | 0.5529 | 0 | 0.5 | 0.5 | 0 |
| -1 | 0.4734 | 0.5266 | 0 | 0.5 | 0.5 | 0 |
| 0 | 0.5 | 0.5 | 0 | 0.5 | 0.5 | 0 |
| 1 | 0.5267 | 0.4733 | 0 | 0.5 | 0.5 | 0 |
| 2 | 0.5534 | 0.4466 | 0 | 0.5 | 0.5 | 0 |
| 3 | 0.58 | 0.42 | 0 | 0.5 | 0.5 | 0 |

Zero edge is exactly 50/50. These rows convert a hypothesised home-margin edge (points vs the BKR line) into cover/over probability using the calibrated 2018-2025 key-number-aware model. Use scripts/intel/margin-simulator.mjs for other values; never do this arithmetic by hand.

## Power ratings

{"NYG": {"season": 2026, "team": "Giants", "team_abbr": "NYG", "games_played": 4, "record": "3-1", "power_rating": {"srs": -4.141, "net_points_per_game": 0.75, "pythag_win_pct": 0.5221, "model_composite_z": -0.1154, "model_rank": 14, "srs_rank": 22, "net_ppg_rank": 13, "pythag_rank": 13, "market_implied_win_total": 7.82, "market_implied_rank": 25, "delta": -0.3908, "delta_basis": "z_score_market_minus_model"}, "attribution_note": "model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending."}, "WAS": {"season": 2026, "team": "Commanders", "team_abbr": "WAS", "games_played": 4, "record": "1-3", "power_rating": {"srs": -11.37, "net_points_per_game": -8.5, "pythag_win_pct": 0.3156, "model_composite_z": -1.2959, "model_rank": 30, "srs_rank": 32, "net_ppg_rank": 30, "pythag_rank": 28, "market_implied_win_total": 7.29, "market_implied_rank": 26, "delta": 0.6054, "delta_basis": "z_score_market_minus_model"}, "attribution_note": "model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending."}}

## Weather / venue

{"game": "NYG@WAS", "weather_status": "forecast_captured", "source_game": "NYG@WAS", "materiality": "review_required: precipitation probability 72%"}

## Availability digest (top events per team)

{"NYG": {"event_count": 20, "qb_events": 2, "offensive_line_worsening": 0, "defensive_front_worsening": 4, "top_score": 131, "top_events": [{"player_name": "Jaxson Dart", "position": "QB", "unit": "quarterback", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "qb_major", "score": 131, "signal": "negative_availability"}, {"player_name": "Brian Burns", "position": "DE", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Roy Robertson-Harris", "position": "DT", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Braxton Berrios", "position": "WR", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Jake Haener", "position": "QB", "unit": "quarterback", "event_type": "active_news", "availability_trend": "unknown", "impact_bucket": "qb_major", "score": 80, "signal": "review_context"}, {"player_name": "Chauncey Golston", "position": "DE", "unit": "defensive_front", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 77, "signal": "negative_availability"}, {"player_name": "Chauncey Golston", "position": "DT", "unit": "defensive_front", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 77, "signal": "negative_availability"}, {"player_name": "Braxton Berrios", "position": "WR", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 72, "signal": "negative_availability"}]}, "WAS": {"event_count": 37, "qb_events": 4, "offensive_line_worsening": 0, "defensive_front_worsening": 4, "top_score": 125, "top_events": [{"player_name": "Jayden Daniels", "position": "QB", "unit": "quarterback", "event_type": "setback", "availability_trend": "worsening", "impact_bucket": "qb_major", "score": 125, "signal": "negative_availability"}, {"player_name": "Marcus Mariota", "position": "QB", "unit": "quarterback", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "qb_major", "score": 104, "signal": "negative_availability"}, {"player_name": "Marcus Mariota", "position": "QB", "unit": "quarterback", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "qb_major", "score": 104, "signal": "negative_availability"}, {"player_name": "Jayden Daniels", "position": "QB", "unit": "quarterback", "event_type": "status_update", "availability_trend": "unknown", "impact_bucket": "qb_major", "score": 94, "signal": "review_context"}, {"player_name": "Jer'Zhan Newton", "position": "DT", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Trey Amos", "position": "CB", "unit": "secondary", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Jeremy McNichols", "position": "RB", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Jacory Croskey-Merritt", "position": "RB", "unit": "offensive_skill", "event_type": "limited_return", "availability_trend": "improving", "impact_bucket": "skill_major", "score": 83, "signal": "positive_availability"}]}}

## Secondary matchup context (manual; capped, never a dominant driver)

- {"offense_team": "NYG", "defense_team": "WAS", "severity_score": 5.55}
- {"offense_team": "WAS", "defense_team": "NYG", "severity_score": 5.25}

## FTN team-level tables (names preserved)

{"NYG": {"record_count": 145, "team_level_tables": [{"category": "team-defense", "subpage": "efficiency", "team_abbr": "NYG", "metrics": {"Team": "New York Giants", "GP": "4", "EPA/PLY": "-0.003", "DVOA": "-0.3%", "SUCC%": "46.1%", "EXP%": "8.2%", "CONV%": "46.8%", "TO": "7", "TO%": "3.0%", "3&O": "29.3%", "MTKL%": "14.3%", "PEN%": "4.3%", "PENY": "33.5"}}, {"category": "team-defense", "subpage": "overview", "team_abbr": "NYG", "metrics": {"Team": "New York Giants", "GP": "4", "YD/PLY": "5.5", "PT/GM": "18.3", "FD%": "30.6%", "TO": "7", "DPBK%": "62.1%", "YD": "849", "TD": "9", "INT": "6", "RUSH%": "37.9%", "YD__2": "436", "TD__2": "2"}}, {"category": "team-defense", "subpage": "pass-rush", "team_abbr": "NYG", "metrics": {"Team": "New York Giants", "GP": "4", "DPBK": "144", "SK": "3", "SK%": "2.1%", "QBH%": "9.7%", "PRESS": "39", "PRESS%": "27.1%", "QPRESS%": "56.4%", "TTPR": "2.46", "DISR%": "0.0%", "BLZ%": "33.3%"}}, {"category": "team-defense", "subpage": "passing-analytics", "team_abbr": "NYG", "metrics": {"Team": "New York Giants", "GP": "4", "EPA/DB": "0.034", "SUCC%": "47.2%", "DVOA": "5.8%", "CPOE": "7.19%", "CBALL%": "72.8%", "EXP%": "9.1%", "INTW%": "5.1%", "TGHT%": "37.5%", "OPEN%": "52.9%", "TA%": "2.9%", "DROP%": "4.4%"}}, {"category": "team-defense", "subpage": "rush-analytics", "team_abbr": "NYG", "metrics": {"Team": "New York Giants", "GP": "4", "EPA/ATT": "-0.063", "SUCC%": "44.3%", "DVOA": "-9.0%", "aRYOE": "", "EXP%": "11.4%", "STF%": "15.9%", "YBCO": "1.97", "YACO": "2.26"}}, {"category": "team-offense", "subpage": "efficiency", "team_abbr": "NYG", "metrics": {"Team": "New York Giants", "GP": "4", "EPA/PLY": "-0.058", "DVOA": "-18.8%", "SUCC%": "39.3%", "EXP%": "6.1%", "CONV%": "43.6%", "TO": "5", "TO%": "2.05%", "PENY": "32.8", "PEN%": "7.79%"}}, {"category": "team-offense", "subpage": "overview", "team_abbr": "NYG", "metrics": {"Team": "New York Giants", "GP": "4", "YD/PLY": "4.8", "PT/GM": "19.0", "FD%": "26.6%", "TO": "5", "DPBK%": "52.0%", "YD": "729", "TD": "6", "INT": "3", "RUSH%": "48.0%", "YD__2": "444", "TD__2": "1"}}, {"category": "team-offense", "subpage": "pass-protection", "team_abbr": "NYG", "metrics": {"Team": "New York Giants", "GP": "4", "SK": "11", "SK%": "8.7%", "QBSK%": "54.5%", "QBH%": "19.7%", "PRESS%": "33.1%", "UPRES%": "21.2%", "BLITZ%": "29.9%", "TTPR": "2.43", "TTT": "2.56", "EPA/DB": "-0.402", "DVOA": "-100.5%", "SUCC%": "28.6%", "EPA/DB__2": "0.241", "DVOA__2": "20.4%", "SUCC%__2": "50.6%"}}, {"category": "team-offense", "subpage": "passing-analytics", "team_abbr": "NYG", "metrics": {"Team": "New York Giants", "GP": "4", "EPA/DB": "0.028", "SUCC%": "43.3%", "DVOA": "-1.6%", "CPOE": "-0.4%", "CBALL%": "64.6%", "EXP%": "10.1%", "INTW%": "4.4%", "HLT%": "0.9%", "TA%": "0.9%", "DROP%": "1.8%", "aDOT": "9.3", "aYAC": "3.3"}}, {"category": "team-offense", "subpage": "rushing-analytics", "team_abbr": "NYG", "metrics": {"Team": "New York Giants", "GP": "4", "EPA/ATT": "-0.152", "SUCC%": "35.0%", "DVOA": "-17.3%", "aRYOE": "", "EXP%": "6.0%", "STF%": "14.5%", "aYBCO": "0.96", "aYACO": "1.89", "CRT%": "52.7%"}}, {"category": "team-offense", "subpage": "tempo", "team_abbr": "NYG", "metrics": {"Team": "New York Giants", "GP": "4", "PLY/GM": "61.0", "TOP": "30.83", "DRV/GM": "10.0", "SEC/PLY": "30.3", "PLY/DRV": "6.1", "YD/DRV": "29.3", "SEC/DRV": "185", "3&O": "17.5%", "SCD%": "40.0%"}}, {"category": "team-offense", "subpage": "tendencies", "team_abbr": "NYG", "metrics": {"Team": "New York Giants", "GP": "4", "DPBK%": "52.0%", "RUSH%": "48.0%", "SHG%": "52.0%", "NH%": "3.7%", "MOT%": "51.6%", "PA%": "22.8%", "IZ%": "12.8%", "OZ%": "15.4%", "MD%": "40.2%", "PWR%": "14.5%", "CTR%": "1.7%"}}]}, "WAS": {"record_count": 146, "team_level_tables": [{"category": "team-defense", "subpage": "efficiency", "team_abbr": "WAS", "metrics": {"Team": "Washington Commanders", "GP": "4", "EPA/PLY": "0.031", "DVOA": "5.3%", "SUCC%": "45.1%", "EXP%": "8.9%", "CONV%": "44.2%", "TO": "5", "TO%": "2.1%", "3&O": "21.7%", "MTKL%": "13.8%", "PEN%": "3.8%", "PENY": "19.0"}}, {"category": "team-defense", "subpage": "overview", "team_abbr": "WAS", "metrics": {"Team": "Washington Commanders", "GP": "4", "YD/PLY": "5.9", "PT/GM": "29.0", "FD%": "30.0%", "TO": "5", "DPBK%": "64.1%", "YD": "1,018", "TD": "11", "INT": "3", "RUSH%": "35.9%", "YD__2": "374", "TD__2": "3"}}, {"category": "team-defense", "subpage": "pass-rush", "team_abbr": "WAS", "metrics": {"Team": "Washington Commanders", "GP": "4", "DPBK": "152", "SK": "7", "SK%": "4.6%", "QBH%": "14.5%", "PRESS": "39", "PRESS%": "25.7%", "QPRESS%": "35.9%", "TTPR": "2.72", "DISR%": "0.7%", "BLZ%": "47.4%"}}, {"category": "team-defense", "subpage": "passing-analytics", "team_abbr": "WAS", "metrics": {"Team": "Washington Commanders", "GP": "4", "EPA/DB": "0.101", "SUCC%": "48.0%", "DVOA": "19.7%", "CPOE": "1.83%", "CBALL%": "75.0%", "EXP%": "13.2%", "INTW%": "2.2%", "TGHT%": "22.8%", "OPEN%": "72.1%", "TA%": "8.1%", "DROP%": "2.9%"}}, {"category": "team-defense", "subpage": "rush-analytics", "team_abbr": "WAS", "metrics": {"Team": "Washington Commanders", "GP": "4", "EPA/ATT": "-0.094", "SUCC%": "40.0%", "DVOA": "-17.5%", "aRYOE": "", "EXP%": "7.1%", "STF%": "23.5%", "YBCO": "0.58", "YACO": "2.75"}}, {"category": "team-offense", "subpage": "efficiency", "team_abbr": "WAS", "metrics": {"Team": "Washington Commanders", "GP": "4", "EPA/PLY": "-0.051", "DVOA": "-16.6%", "SUCC%": "38.3%", "EXP%": "7.7%", "CONV%": "34.4%", "TO": "1", "TO%": "0.38%", "PENY": "37.0", "PEN%": "8.05%"}}, {"category": "team-offense", "subpage": "overview", "team_abbr": "WAS", "metrics": {"Team": "Washington Commanders", "GP": "4", "YD/PLY": "4.9", "PT/GM": "20.5", "FD%": "25.7%", "TO": "1", "DPBK%": "60.2%", "YD": "786", "TD": "8", "INT": "1", "RUSH%": "39.8%", "YD__2": "496", "TD__2": "1"}}, {"category": "team-offense", "subpage": "pass-protection", "team_abbr": "WAS", "metrics": {"Team": "Washington Commanders", "GP": "4", "SK": "5", "SK%": "3.2%", "QBSK%": "0.0%", "QBH%": "17.2%", "PRESS%": "34.4%", "UPRES%": "25.0%", "BLITZ%": "19.7%", "TTPR": "2.53", "TTT": "2.79", "EPA/DB": "-0.358", "DVOA": "-81.6%", "SUCC%": "27.8%", "EPA/DB__2": "0.235", "DVOA__2": "25.6%", "SUCC%__2": "45.6%"}}, {"category": "team-offense", "subpage": "passing-analytics", "team_abbr": "WAS", "metrics": {"Team": "Washington Commanders", "GP": "4", "EPA/DB": "0.031", "SUCC%": "39.5%", "DVOA": "3.1%", "CPOE": "-1.6%", "CBALL%": "67.4%", "EXP%": "11.5%", "INTW%": "1.4%", "HLT%": "2.2%", "TA%": "8.0%", "DROP%": "5.1%", "aDOT": "9.7", "aYAC": "4.0"}}, {"category": "team-offense", "subpage": "rushing-analytics", "team_abbr": "WAS", "metrics": {"Team": "Washington Commanders", "GP": "4", "EPA/ATT": "-0.174", "SUCC%": "36.5%", "DVOA": "-22.0%", "aRYOE": "", "EXP%": "5.8%", "STF%": "21.2%", "aYBCO": "1.40", "aYACO": "2.09", "CRT%": "58.0%"}}, {"category": "team-offense", "subpage": "tempo", "team_abbr": "WAS", "metrics": {"Team": "Washington Commanders", "GP": "4", "PLY/GM": "65.3", "TOP": "30.08", "DRV/GM": "11.8", "SEC/PLY": "27.7", "PLY/DRV": "5.6", "YD/DRV": "27.3", "SEC/DRV": "154", "3&O": "25.5%", "SCD%": "34.0%"}}, {"category": "team-offense", "subpage": "tendencies", "team_abbr": "WAS", "metrics": {"Team": "Washington Commanders", "GP": "4", "DPBK%": "60.2%", "RUSH%": "39.8%", "SHG%": "64.0%", "NH%": "8.8%", "MOT%": "51.3%", "PA%": "22.3%", "IZ%": "26.0%", "OZ%": "43.3%", "MD%": "16.3%", "PWR%": "3.8%", "CTR%": "1.9%"}}]}}

## Digest rows for this game (research digest; tier labels are strict)

    NYG@WAS | NYG +3.5 / WAS -3.5 | split | V: VSiN; RO: Action Network, The Favorites, Steve Fezzik, Ross Tucker, Kendra Middleton; vs WAS: VSiN, Sharp or Square (RO), Simon Hunter (RO), Andrew Erickson (RO), ESPN NFL (RO), Pro Football Talk (RO); YT: NYG +3.5 Brandon Anderson… | skip
    NYG@WAS | Isaiah Likely o40.5 rec yds -125 | Over | YT/PI: Josh Shepardson (Sharp Football) (PI); RO: Sharp Football; src px not BKR | 2- research-only
    NYG@WAS | Isaiah Likely ATD +245 | Yes | RO: Action Network, Grant Neiffer; src px not BKR | 2- research-only
    NYG@WAS | Jayden Daniels ATD +250 | Yes | RO: Action Network, Grant Neiffer; src px not BKR | 2- research-only
    NYG@WAS | Isaiah Likely rec Over (line n/a) | Over | RO: Cody Brown; no source price; src px not BKR | 2- research-only

## Source rows (verified only): counts {"corroboration_only": 25, "tier_eligible": 2}

Only rows with tier_eligible=true may support a tier. near_miss and corroboration_only rows are context.

| row | kind | outlet | market | side | line | tier_eligible | near_miss |
|---|---|---|---|---|---|---|---|
| w05-expert-verified.json#rows[29] | expert_feed | Action Network | prop | None | 245 | False | False |
| w05-expert-verified.json#rows[30] | expert_feed | Action Network | prop | None | 250 | False | False |
| w05-expert-verified.json#rows[43] | expert_feed | Action Network | teaser | WAS | 3.5 | False | False |
| w05-expert-verified.json#rows[60] | expert_feed | BettingPros | prop | None | 170 | False | False |
| w05-expert-verified.json#rows[103] | expert_feed | Action Network | spread | NYG | 3.5 | False | False |
| w05-expert-verified.json#rows[120] | expert_feed | The Favorites | spread | NYG | 3.5 | False | False |
| w05-expert-verified.json#rows[132] | expert_feed | Sharp or Square | spread | WAS | -3.5 | False | False |
| w05-expert-verified.json#rows[158] | expert_feed | Action Network | spread | NYG | None | False | False |
| w05-expert-verified.json#rows[207] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[208] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[236] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[254] | podcast | SHARP NFL Week 5 Bets: Bears-Packers, Niners-Seahawks and more | spread | WAS | -3.5 | False | False |
| w05-expert-verified.json#rows[266] | podcast | 2026 NFL Week 5 Prop Bets &amp; Parlays | prop | UNDER | 35.5 | False | False |
| w05-expert-verified.json#rows[302] | podcast | 2026 NFL Week 5 Bets | spread | NYG | 3.5 | False | False |
| w05-expert-verified.json#rows[303] | podcast | 2026 NFL Week 5 Bets | spread | NYG | 3 | False | False |
| w05-expert-verified.json#rows[322] | podcast | NFL Week 5 Early Lines: Best Bets, Early Odds &amp; Betting Picks for Every Game (Ep. 1087) | spread | WAS | -3.5 | False | False |
| w05-expert-verified.json#rows[346] | podcast | Construction &amp; Big Dog Picks | NFL Week 5 Preview | spread | NYG | 3.5 | False | False |
| w05-expert-verified.json#rows[370] | podcast | NFL WEEK 5 Betting Preview: Bucs-Cowboys, Bears-Packers and more | spread | WAS | -3.5 | False | False |
| w05-expert-verified.json#rows[380] | article | Cody Brown Bets | prop | OVER | None | False | False |
| w05-expert-verified.json#rows[394] | article | ESPN NFL | spread | WAS | -3.5 | False | False |
| w05-expert-verified.json#rows[415] | article | Sharp Football | prop | OVER 40.5 (-125) | None | False | False |
| w05-expert-verified.json#rows[420] | article | Action Network | prop | OVER 2.5 (-102) | None | False | False |
| w05-expert-verified.json#rows[433] | article | Twitter/X Bookmarks (Personal) | prop | OVER 0.5 | None | False | False |
| w05-expert-verified.json#rows[452] | article | VSiN | spread | WAS | -3.5 | True | False |
| w05-expert-verified.json#rows[470] | article | Twitter/X Bookmarks (Personal) | prop | OVER 0.5 | None | False | False |
| w05-expert-verified.json#rows[540] | article | Pro Football Talk | moneyline | WAS | None | False | False |
| w05-expert-verified.json#rows[564] | article | VSiN | spread | NYG | 3.5 | True | False |

- w05-expert-verified.json#rows[452] (VSiN) https://vsin.com/nfl/wes-reynolds-nfl-week-5-best-bets-and-predictions/: "Washington Commanders -3.5 vs."

- w05-expert-verified.json#rows[564] (VSiN) https://vsin.com/nfl/tuleys-takes-for-nfl-week-5/: "Best Bet: Giants +3.5 (Pool Play Percentages: Giants 67/33 in ATS contests, but Commanders still 67/33 in SU pools)."

## Read directly if needed

- weather_detail: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json (filter to NYG@WAS)
- prop_markets: BKR/BEO rows for event "New York Giants @ Washington Commanders" with market != game_lines
- player_stats: data/vault-seed/nflverse/player_stats_weekly.csv (season 2026) for NYG and WAS
- projected_starters: data/projected-starters/2026/latest.json (teams.NYG, teams.WAS)
