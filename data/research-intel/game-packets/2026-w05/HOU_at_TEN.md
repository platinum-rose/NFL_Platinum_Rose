# HOU@TEN packet — Houston Texans @ Tennessee Titans

Kickoff 2026-10-11T17:00:00.000Z UTC. Built 2026-10-11T01:22:14.064268+00:00. spread = HOME team line; favorite has the negative number; marginAdj in the simulator is home-positive points

**Division game** (AFC South).

## Market

**BKR** captured 2026-10-11T01:15:40.538Z; recommendation window ends 2026-10-11T07:15:40.538000+00:00; fresh at build: True
- spread: Houston Texans -7 -103; Tennessee Titans 7 -113
- total: Over 37.5 -108; Under 37.5 -108
- moneyline: Houston Texans  -344; Tennessee Titans  289

**BEO** captured 2026-10-11T01:19:56.400Z; recommendation window ends 2026-10-11T07:19:56.400000+00:00; fresh at build: True
- spread: Houston Texans -7 -110; Tennessee Titans 7 -110
- total: Over 38 -110; Under 38 -110
- moneyline: Houston Texans  -365; Tennessee Titans  292

Market-implied score: {"TEN": 15.25, "HOU": 22.25, "basis": "BKR home line 7 total 37.5"}

Action Network opener: {"an_game_id": 290905, "kickoff_utc": "2026-10-11T17:00:00Z", "sp": {"TEN": 6.5, "HOU": -6.5}, "sp_odds_home": -106, "sp_at": "2026-10-05T00:06:56Z", "tot": 39.5, "tot_at": "2026-10-05T00:06:56Z", "ml": {"HOU": -317, "TEN": 243}, "carried_from_before_cutoff": false}

Action Network splits (captured 2026-10-09T19:41:08.878Z): {"game_id": 290905, "away_team": "HOU", "home_team": "TEN", "kickoff_at": "2026-10-11T17:00:00.000Z", "spread": [{"side": "home", "value": 7.5, "price_american": -114, "ticket_pct": 30, "money_pct": 34}, {"side": "away", "value": -7.5, "price_american": -104, "ticket_pct": 70, "money_pct": 66}], "total": [{"side": "over", "value": 38, "price_american": -109, "ticket_pct": 77, "money_pct": 70}, {"side": "under", "value": 38, "price_american": -109, "ticket_pct": 23, "money_pct": 30}], "moneyline": [{"side": "away", "value": 0, "price_american": -385, "ticket_pct": 94, "money_pct": 91}, {"side": "home", "value": 0, "price_american": 305, "ticket_pct": 6, "money_pct": 9}]}

SuperContest row (contest line, not a book price; labels may be reversed): {"away_team": "TEN", "home_team": "HOU", "favorite": "HOU", "underdog": "TEN", "favorite_spread": -7.5, "kickoff_display": "Sun 1:00 pm"}

## Team state: schedule, results and standings

### HOU (AFC South) 0-4
- PF 84 / PA 109 (diff -25); PPG 21.0 / PAPG 27.2; home 0-3, away 0-1, division 0-1
- Opponents faced to date have a combined record of 9-7; rest before this game: 7.0 days; byes used: none; byes remaining: [8]

| week | site | opp | opp_record | result | pf | pa |
|---|---|---|---|---|---|---|
| 1 | H | BUF | 3-1 | L | 31 | 36 |
| 2 | H | CIN | 2-2 | L | 6 | 20 |
| 3 | A | IND | 2-2 | L | 17 | 19 |
| 4 | H | DAL | 2-2 | L | 30 | 34 |

Next games: wk5 A TEN; wk6 A JAX; wk7 H NYG; wk9 A LAC

### TEN (AFC South) 0-4
- PF 55 / PA 83 (diff -28); PPG 13.8 / PAPG 20.8; home 0-2, away 0-2, division 0-0
- Opponents faced to date have a combined record of 9-7; rest before this game: 7.0 days; byes used: none; byes remaining: [9]

| week | site | opp | opp_record | result | pf | pa |
|---|---|---|---|---|---|---|
| 1 | H | NYJ | 1-3 | L | 10 | 23 |
| 2 | H | PHI | 2-2 | L | 20 | 24 |
| 3 | A | NYG | 3-1 | L | 7 | 12 |
| 4 | A | BAL | 3-1 | L | 18 | 24 |

Next games: wk5 H HOU; wk6 A IND; wk7 H CLE; wk8 A CIN

## Standings context

**AFC South**
| rank | team | record | point_diff | div |
|---|---|---|---|---|
| 1 | JAX | 3-1 | 51 | 0-0 |
| 2 | IND | 2-2 | -2 | 1-0 |
| 3 | HOU | 0-4 | -25 | 0-1 |
| 4 | TEN | 0-4 | -28 | 0-0 |

**AFC order (top 8)**: 1 KC 4-0, 2 JAX 3-1, 3 LV 3-1, 4 BUF 3-1, 5 BAL 3-1, 6 CLE 3-1, 7 CIN 2-2, 8 IND 2-2

Order is win% then point differential only; official NFL tiebreakers are not applied. Includes the Week 5 TB@DAL final.

## Existing quantitative pass (provisional, unbacktested; 60% market / 25% FTN / 15% SRS)

Means: {"home": 16.481518587997, "away": 21.545981412002998, "total": 38.0275, "home_margin": -5.064462824005997}
Simulation: {"iterations": 100000, "mean_home": 16.989205507982568, "mean_away": 21.755333991750273, "home_win_pct": 0.37941, "home_cover_pct": 0.55315, "away_cover_pct": 0.44684999999999997, "over_pct": 0.51642, "under_pct": 0.48358}
Features: {"offense_z": {"TEN": -1.1284898837342923, "HOU": -0.3686949712894789}, "defense_weakness_z": {"TEN": -0.3296929617842927, "HOU": 0.09368175967730452}, "tempo_z": {"TEN": -1.993588327156286, "HOU": -0.235600923774159}, "srs": {"TEN": -10.882, "HOU": -6.688}, "secondary_adjustment_points": {"TEN": 0.255, "HOU": 0.585}}

## Calibrated simulator edge sweep (home-margin edge in points vs BKR line)

| home_margin_edge_pts | home_cover | away_cover | side_push | over | under | total_push |
|---|---|---|---|---|---|---|
| -3 | 0.3902 | 0.5564 | 0.0534 | 0.5 | 0.5 | 0 |
| -2 | 0.4174 | 0.5283 | 0.0544 | 0.5 | 0.5 | 0 |
| -1 | 0.4447 | 0.5002 | 0.0551 | 0.5 | 0.5 | 0 |
| 0 | 0.4722 | 0.4722 | 0.0555 | 0.5 | 0.5 | 0 |
| 1 | 0.4997 | 0.4446 | 0.0557 | 0.5 | 0.5 | 0 |
| 2 | 0.527 | 0.4174 | 0.0556 | 0.5 | 0.5 | 0 |
| 3 | 0.554 | 0.3907 | 0.0553 | 0.5 | 0.5 | 0 |

Zero edge is exactly 50/50. These rows convert a hypothesised home-margin edge (points vs the BKR line) into cover/over probability using the calibrated 2018-2025 key-number-aware model. Use scripts/intel/margin-simulator.mjs for other values; never do this arithmetic by hand.

## Power ratings

{"HOU": {"season": 2026, "team": "Texans", "team_abbr": "HOU", "games_played": 4, "record": "0-4", "power_rating": {"srs": -6.688, "net_points_per_game": -6.25, "pythag_win_pct": 0.3504, "model_composite_z": -0.8974, "model_rank": 26, "srs_rank": 27, "net_ppg_rank": 26, "pythag_rank": 26, "market_implied_win_total": 8.6, "market_implied_rank": 19, "delta": 0.7559, "delta_basis": "z_score_market_minus_model"}, "attribution_note": "model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending."}, "TEN": {"season": 2026, "team": "Titans", "team_abbr": "TEN", "games_played": 4, "record": "0-4", "power_rating": {"srs": -10.882, "net_points_per_game": -7, "pythag_win_pct": 0.2738, "model_composite_z": -1.2805, "model_rank": 29, "srs_rank": 31, "net_ppg_rank": 27, "pythag_rank": 30, "market_implied_win_total": 4.45, "market_implied_rank": 31, "delta": -0.6329, "delta_basis": "z_score_market_minus_model"}, "attribution_note": "model_rank is a market-independent ensemble (SRS + net PPG + Pythagorean win%, z-averaged) derived from nflverse games.csv prior-season results. market_implied_rank/delta use Expansion F prediction-market win-total medians and are populated only where the win-total ladder is coherent; a full win-totals feed and scraped forward projections (FPI/nfelo/DVOA) are pending."}}

## Weather / venue

{"game": "HOU@TEN", "weather_status": "forecast_captured", "source_game": "HOU@TEN", "materiality": "no_material_flag_in_current_forecast"}

## Availability digest (top events per team)

{"HOU": {"event_count": 29, "qb_events": 2, "offensive_line_worsening": 0, "defensive_front_worsening": 4, "top_score": 108, "top_events": [{"player_name": "Graham Mertz", "position": "QB", "unit": "quarterback", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "qb_major", "score": 108, "signal": "negative_availability"}, {"player_name": "Mario Edwards Jr.", "position": "DE", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Ali Gaye", "position": "DE", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Dylan Horton", "position": "DT", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Solomon Byrd", "position": "DE", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Tank Dell", "position": "WR", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 86, "signal": "negative_availability"}, {"player_name": "M.J. Stewart", "position": "S", "unit": "secondary", "event_type": "out", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 82, "signal": "negative_availability"}, {"player_name": "Mark Gronowski", "position": "QB", "unit": "quarterback", "event_type": "active_news", "availability_trend": "unknown", "impact_bucket": "qb_major", "score": 80, "signal": "review_context"}]}, "TEN": {"event_count": 22, "qb_events": 1, "offensive_line_worsening": 0, "defensive_front_worsening": 2, "top_score": 93, "top_events": [{"player_name": "Cam Ward", "position": "QB", "unit": "quarterback", "event_type": "active_news", "availability_trend": "unknown", "impact_bucket": "qb_major", "score": 93, "signal": "review_context"}, {"player_name": "Tanoh Kpassagnon", "position": "DE", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Jaylen Harrell", "position": "DE", "unit": "defensive_front", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_front_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Joshua Williams", "position": "CB", "unit": "secondary", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 86, "signal": "negative_availability"}, {"player_name": "Milo Eifler", "position": "LB", "unit": "linebacker", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 72, "signal": "negative_availability"}, {"player_name": "Kendell Brooks", "position": "S", "unit": "secondary", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 72, "signal": "negative_availability"}, {"player_name": "Dominique Hampton", "position": "CB", "unit": "secondary", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "defensive_major", "score": 72, "signal": "negative_availability"}, {"player_name": "Jaren Kanak", "position": "TE", "unit": "offensive_skill", "event_type": "ir", "availability_trend": "worsening", "impact_bucket": "skill_major", "score": 72, "signal": "negative_availability"}]}}

## Secondary matchup context (manual; capped, never a dominant driver)

- {"offense_team": "HOU", "defense_team": "TEN", "severity_score": 5.85}
- {"offense_team": "TEN", "defense_team": "HOU", "severity_score": 2.55}

## FTN team-level tables (names preserved)

{"HOU": {"record_count": 133, "team_level_tables": [{"category": "team-defense", "subpage": "efficiency", "team_abbr": "HOU", "metrics": {"Team": "Houston Texans", "GP": "4", "EPA/PLY": "0.035", "DVOA": "-0.5%", "SUCC%": "39.1%", "EXP%": "9.8%", "CONV%": "42.1%", "TO": "3", "TO%": "1.2%", "3&O": "13.3%", "MTKL%": "15.3%", "PEN%": "3.1%", "PENY": "21.3"}}, {"category": "team-defense", "subpage": "overview", "team_abbr": "HOU", "metrics": {"Team": "Houston Texans", "GP": "4", "YD/PLY": "5.6", "PT/GM": "27.3", "FD%": "28.9%", "TO": "3", "DPBK%": "62.5%", "YD": "1,111", "TD": "6", "INT": "1", "RUSH%": "37.5%", "YD__2": "335", "TD__2": "5"}}, {"category": "team-defense", "subpage": "pass-rush", "team_abbr": "HOU", "metrics": {"Team": "Houston Texans", "GP": "4", "DPBK": "160", "SK": "14", "SK%": "8.8%", "QBH%": "17.5%", "PRESS": "41", "PRESS%": "25.6%", "QPRESS%": "36.6%", "TTPR": "3.12", "DISR%": "1.9%", "BLZ%": "20.6%"}}, {"category": "team-defense", "subpage": "passing-analytics", "team_abbr": "HOU", "metrics": {"Team": "Houston Texans", "GP": "4", "EPA/DB": "0.122", "SUCC%": "40.0%", "DVOA": "15.5%", "CPOE": "0.71%", "CBALL%": "73.2%", "EXP%": "17.7%", "INTW%": "3.5%", "TGHT%": "32.4%", "OPEN%": "58.5%", "TA%": "2.8%", "DROP%": "2.1%"}}, {"category": "team-defense", "subpage": "rush-analytics", "team_abbr": "HOU", "metrics": {"Team": "Houston Texans", "GP": "4", "EPA/ATT": "-0.110", "SUCC%": "37.5%", "DVOA": "-23.6%", "aRYOE": "", "EXP%": "7.3%", "STF%": "17.7%", "YBCO": "0.68", "YACO": "2.46"}}, {"category": "team-offense", "subpage": "efficiency", "team_abbr": "HOU", "metrics": {"Team": "Houston Texans", "GP": "4", "EPA/PLY": "-0.027", "DVOA": "1.9%", "SUCC%": "41.3%", "EXP%": "10.2%", "CONV%": "34.4%", "TO": "2", "TO%": "0.79%", "PENY": "45.8", "PEN%": "8.27%"}}, {"category": "team-offense", "subpage": "overview", "team_abbr": "HOU", "metrics": {"Team": "Houston Texans", "GP": "4", "YD/PLY": "5.7", "PT/GM": "21.0", "FD%": "27.6%", "TO": "2", "DPBK%": "67.3%", "YD": "1,141", "TD": "5", "INT": "0", "RUSH%": "32.7%", "YD__2": "316", "TD__2": "4"}}, {"category": "team-offense", "subpage": "pass-protection", "team_abbr": "HOU", "metrics": {"Team": "Houston Texans", "GP": "4", "SK": "12", "SK%": "7.0%", "QBSK%": "0.0%", "QBH%": "15.8%", "PRESS%": "24.6%", "UPRES%": "15.7%", "BLITZ%": "19.9%", "TTPR": "2.88", "TTT": "2.82", "EPA/DB": "-0.857", "DVOA": "-149.2%", "SUCC%": "14.3%", "EPA/DB__2": "0.368", "DVOA__2": "45.5%", "SUCC%__2": "57.4%"}}, {"category": "team-offense", "subpage": "passing-analytics", "team_abbr": "HOU", "metrics": {"Team": "Houston Texans", "GP": "4", "EPA/DB": "0.067", "SUCC%": "46.8%", "DVOA": "25.8%", "CPOE": "7.9%", "CBALL%": "64.5%", "EXP%": "20.4%", "INTW%": "0.7%", "HLT%": "2.6%", "TA%": "5.3%", "DROP%": "0.7%", "aDOT": "10.0", "aYAC": "4.3"}}, {"category": "team-offense", "subpage": "rushing-analytics", "team_abbr": "HOU", "metrics": {"Team": "Houston Texans", "GP": "4", "EPA/ATT": "-0.221", "SUCC%": "30.1%", "DVOA": "-19.3%", "aRYOE": "", "EXP%": "4.8%", "STF%": "24.1%", "aYBCO": "0.66", "aYACO": "1.98", "CRT%": "65.1%"}}, {"category": "team-offense", "subpage": "tempo", "team_abbr": "HOU", "metrics": {"Team": "Houston Texans", "GP": "4", "PLY/GM": "63.5", "TOP": "28.25", "DRV/GM": "11.3", "SEC/PLY": "26.7", "PLY/DRV": "5.6", "YD/DRV": "32.4", "SEC/DRV": "151", "3&O": "31.1%", "SCD%": "35.6%"}}, {"category": "team-offense", "subpage": "tendencies", "team_abbr": "HOU", "metrics": {"Team": "Houston Texans", "GP": "4", "DPBK%": "67.3%", "RUSH%": "32.7%", "SHG%": "60.2%", "NH%": "7.5%", "MOT%": "54.7%", "PA%": "21.1%", "IZ%": "12.0%", "OZ%": "28.9%", "MD%": "15.7%", "PWR%": "16.9%", "CTR%": "13.3%"}}]}, "TEN": {"record_count": 138, "team_level_tables": [{"category": "team-defense", "subpage": "efficiency", "team_abbr": "TEN", "metrics": {"Team": "Tennessee Titans", "GP": "4", "EPA/PLY": "0.047", "DVOA": "12.1%", "SUCC%": "42.1%", "EXP%": "9.4%", "CONV%": "40.4%", "TO": "2", "TO%": "0.8%", "3&O": "23.8%", "MTKL%": "11.4%", "PEN%": "4.7%", "PENY": "18.8"}}, {"category": "team-defense", "subpage": "overview", "team_abbr": "TEN", "metrics": {"Team": "Tennessee Titans", "GP": "4", "YD/PLY": "5.4", "PT/GM": "20.8", "FD%": "28.7%", "TO": "2", "DPBK%": "50.0%", "YD": "882", "TD": "4", "INT": "2", "RUSH%": "50.0%", "YD__2": "491", "TD__2": "4"}}, {"category": "team-defense", "subpage": "pass-rush", "team_abbr": "TEN", "metrics": {"Team": "Tennessee Titans", "GP": "4", "DPBK": "127", "SK": "8", "SK%": "6.3%", "QBH%": "12.6%", "PRESS": "29", "PRESS%": "22.8%", "QPRESS%": "31.0%", "TTPR": "2.95", "DISR%": "0.0%", "BLZ%": "22.0%"}}, {"category": "team-defense", "subpage": "passing-analytics", "team_abbr": "TEN", "metrics": {"Team": "Tennessee Titans", "GP": "4", "EPA/DB": "0.196", "SUCC%": "47.2%", "DVOA": "35.8%", "CPOE": "3.18%", "CBALL%": "82.1%", "EXP%": "15.9%", "INTW%": "1.8%", "TGHT%": "16.1%", "OPEN%": "63.4%", "TA%": "5.4%", "DROP%": "6.3%"}}, {"category": "team-defense", "subpage": "rush-analytics", "team_abbr": "TEN", "metrics": {"Team": "Tennessee Titans", "GP": "4", "EPA/ATT": "-0.101", "SUCC%": "37.0%", "DVOA": "-7.3%", "aRYOE": "", "EXP%": "7.1%", "STF%": "22.8%", "YBCO": "1.13", "YACO": "1.39"}}, {"category": "team-offense", "subpage": "efficiency", "team_abbr": "TEN", "metrics": {"Team": "Tennessee Titans", "GP": "4", "EPA/PLY": "-0.085", "DVOA": "-10.8%", "SUCC%": "41.2%", "EXP%": "7.9%", "CONV%": "36.5%", "TO": "2", "TO%": "0.93%", "PENY": "22.5", "PEN%": "5.09%"}}, {"category": "team-offense", "subpage": "overview", "team_abbr": "TEN", "metrics": {"Team": "Tennessee Titans", "GP": "4", "YD/PLY": "5.0", "PT/GM": "13.8", "FD%": "25.9%", "TO": "2", "DPBK%": "63.0%", "YD": "726", "TD": "3", "INT": "2", "RUSH%": "37.0%", "YD__2": "356", "TD__2": "3"}}, {"category": "team-offense", "subpage": "pass-protection", "team_abbr": "TEN", "metrics": {"Team": "Tennessee Titans", "GP": "4", "SK": "6", "SK%": "4.4%", "QBSK%": "50.0%", "QBH%": "11.8%", "PRESS%": "27.9%", "UPRES%": "7.9%", "BLITZ%": "22.1%", "TTPR": "2.72", "TTT": "2.78", "EPA/DB": "-0.509", "DVOA": "-122.1%", "SUCC%": "26.3%", "EPA/DB__2": "0.053", "DVOA__2": "18.6%", "SUCC%__2": "50.0%"}}, {"category": "team-offense", "subpage": "passing-analytics", "team_abbr": "TEN", "metrics": {"Team": "Tennessee Titans", "GP": "4", "EPA/DB": "-0.104", "SUCC%": "43.4%", "DVOA": "0.6%", "CPOE": "0.4%", "CBALL%": "70.8%", "EXP%": "12.0%", "INTW%": "2.5%", "HLT%": "3.3%", "TA%": "10.0%", "DROP%": "3.3%", "aDOT": "6.5", "aYAC": "5.0"}}, {"category": "team-offense", "subpage": "rushing-analytics", "team_abbr": "TEN", "metrics": {"Team": "Tennessee Titans", "GP": "4", "EPA/ATT": "-0.053", "SUCC%": "37.5%", "DVOA": "-19.7%", "aRYOE": "", "EXP%": "8.8%", "STF%": "15.0%", "aYBCO": "0.93", "aYACO": "1.88", "CRT%": "49.5%"}}, {"category": "team-offense", "subpage": "tempo", "team_abbr": "TEN", "metrics": {"Team": "Tennessee Titans", "GP": "4", "PLY/GM": "54.0", "TOP": "23.72", "DRV/GM": "10.0", "SEC/PLY": "26.4", "PLY/DRV": "5.4", "YD/DRV": "27.1", "SEC/DRV": "142", "3&O": "35.0%", "SCD%": "25.0%"}}, {"category": "team-offense", "subpage": "tendencies", "team_abbr": "TEN", "metrics": {"Team": "Tennessee Titans", "GP": "4", "DPBK%": "63.0%", "RUSH%": "37.0%", "SHG%": "68.5%", "NH%": "13.4%", "MOT%": "45.8%", "PA%": "21.3%", "IZ%": "26.3%", "OZ%": "12.5%", "MD%": "32.5%", "PWR%": "10.0%", "CTR%": "10.0%"}}]}}

## Digest rows for this game (research digest; tier labels are strict)

    HOU@TEN | TEN +7 -113 | TEN | V: VSiN; RO: Action Network, Even Money, Steve Fezzik, VSiN; vs HOU: Action Network (RO), Sharp or Square (RO), BettingPros (RO), Chad Millman (RO), Ryan Wormeli (RO), Simon Hunter (RO), Pro Football Talk (RO); YT: TEN +6.5 Matt Moore (src +7.5 vs now +7) | 2-
    HOU@TEN | U37.5 -108 | Under | RO: Action Network (src 38.5 vs now 37.5) | 2- research-only
    HOU@TEN | Brevin Jordan ATD +2500 | Yes | RO: Action Network, Gilles Gallant; src px not BKR | 2- research-only
    HOU@TEN | Nico Collins ATD +140 | Yes | RO: BettingPros, @thepropdealer (X); src px not BKR | 2- research-only
    HOU@TEN | Tony Pollard ATD +250 | Yes | RO: Action Network, Gilles Gallant; src px not BKR | 2- research-only

## Source rows (verified only): counts {"corroboration_only": 27, "near_miss": 1, "tier_eligible": 1}

Only rows with tier_eligible=true may support a tier. near_miss and corroboration_only rows are context.

| row | kind | outlet | market | side | line | tier_eligible | near_miss |
|---|---|---|---|---|---|---|---|
| w05-expert-verified.json#rows[31] | expert_feed | Action Network | prop | None | 250 | False | False |
| w05-expert-verified.json#rows[32] | expert_feed | Action Network | prop | None | 2500 | False | False |
| w05-expert-verified.json#rows[44] | expert_feed | Action Network | spread | HOU | -7 | False | False |
| w05-expert-verified.json#rows[57] | expert_feed | BettingPros | prop | None | 39.5 | False | False |
| w05-expert-verified.json#rows[62] | expert_feed | BettingPros | prop | None | 140 | False | False |
| w05-expert-verified.json#rows[73] | expert_feed | BettingPros | prop | None | 5.5 | False | False |
| w05-expert-verified.json#rows[95] | expert_feed | Action Network | total | Under | 38.5 | False | False |
| w05-expert-verified.json#rows[96] | expert_feed | Action Network | moneyline | HOU | None | False | False |
| w05-expert-verified.json#rows[101] | expert_feed | Action Network | spread | TEN | 6.5 | False | False |
| w05-expert-verified.json#rows[111] | expert_feed | Action Network | total | Under | 38.5 | False | False |
| w05-expert-verified.json#rows[134] | expert_feed | Sharp or Square | spread | HOU | -7 | False | False |
| w05-expert-verified.json#rows[151] | expert_feed | Even Money | spread | TEN | 7.5 | False | False |
| w05-expert-verified.json#rows[157] | expert_feed | Action Network | futures | None | None | False | False |
| w05-expert-verified.json#rows[203] | expert_feed | BettingPros | spread | HOU | -6.5 | False | False |
| w05-expert-verified.json#rows[209] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[210] | podcast | Our Anytime Touchdown Picks for Week 5 of The NFL Season! | prop | YES | None | False | False |
| w05-expert-verified.json#rows[252] | podcast | SHARP NFL Week 5 Bets: Bears-Packers, Niners-Seahawks and more | spread | HOU | -7.5 | False | False |
| w05-expert-verified.json#rows[258] | podcast | SHARP NFL Week 5 Bets: Bears-Packers, Niners-Seahawks and more | survivor_pick | None | None | False | False |
| w05-expert-verified.json#rows[261] | podcast | 2026 NFL Week 5 Prop Bets &amp; Parlays | spread | TEN | 7.5 | False | False |
| w05-expert-verified.json#rows[293] | podcast | 2026 NFL Week 5 Bets | spread | TEN | 6.5 | False | False |
| w05-expert-verified.json#rows[329] | podcast | NFL Week 5 Early Lines: Best Bets, Early Odds &amp; Betting Picks for Every Game (Ep. 1087) | spread | HOU | -6.5 | False | False |
| w05-expert-verified.json#rows[372] | podcast | NFL WEEK 5 Betting Preview: Bucs-Cowboys, Bears-Packers and more | spread | HOU | -7 | False | False |
| w05-expert-verified.json#rows[402] | article | ESPN NFL | prop | OVER 1.5 (+119) | None | False | False |
| w05-expert-verified.json#rows[425] | article | BettingPros | prop | OVER 259.5 (+505) | None | False | False |
| w05-expert-verified.json#rows[436] | article | Twitter/X Bookmarks (Personal) | prop | OVER 77.5 | None | False | False |
| w05-expert-verified.json#rows[469] | article | Twitter/X Bookmarks (Personal) | prop | OVER 0.5 | None | False | False |
| w05-expert-verified.json#rows[511] | article | VSiN | spread | TEN | 7.5 | False | True |
| w05-expert-verified.json#rows[539] | article | Pro Football Talk | moneyline | HOU | None | False | False |
| w05-expert-verified.json#rows[565] | article | VSiN | spread | TEN | 7.5 | True | False |

- w05-expert-verified.json#rows[511] (VSiN) https://vsin.com/nfl/steve-makinen-week-5-nfl-best-bets/: "NFL Best Bet: It's got to be Tennessee +7.5 here versus Houston"

- w05-expert-verified.json#rows[565] (VSiN) https://vsin.com/nfl/tuleys-takes-for-nfl-week-5/: "Best Bet: Titans +7.5 (Pool Play Percentages: Titans 67/33 in ATS contests, but Texans 80/20 in SU pools)."

## Read directly if needed

- weather_detail: data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json (filter to HOU@TEN)
- prop_markets: BKR/BEO rows for event "Houston Texans @ Tennessee Titans" with market != game_lines
- player_stats: data/vault-seed/nflverse/player_stats_weekly.csv (season 2026) for HOU and TEN
- projected_starters: data/projected-starters/2026/latest.json (teams.HOU, teams.TEN)
