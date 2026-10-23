# Week 5 market evidence coverage — 2026-10-07

## Ingested locally

| Evidence | Source | Coverage | Status |
|---|---|---:|---|
| BKR game board | `data/odds/BKR_current_lines_1007_2040` | 15 / 15 Week 5 games; spread, total, moneyline | Complete snapshot; capture time not shown in paste |
| BKR build input | `data/odds/BKR_current_lines_1007_2040_buildfmt` | 15 / 15 parsable game rows | Complete; NYG @ WAS now includes moneyline |
| BEO player props | `docs/Player_Prop_Odds_Weekly/Week5/BEO_Week5_TB_DAL` -> `data/generated/props/beo-w05.json` | TB @ DAL only; 490 player ladder/scorer records | Locally parsed and schema-checked |
| BEO futures screenshots | `docs/Futures_Odds/BEO_{SB,SB_Exacta1..4,Div1..4,Conf1..2,MakePlayoffs1..4,RegWins1..4}_100726.png` | 408 normalized records from 19 screenshots | Local-only Gemini Vision dry run; no Supabase write or archive move |

## Still needed from Andy

### Week 5 game and contest lines

1. **SuperContest Week 5 board:** all 15 contest spreads, with the source/capture time. This is needed for the contest-versus-book middle check.
2. **Fresh book comparison board(s), if available:** DraftKings, FanDuel, or BetMGM for all 15 games. The existing Supabase snapshot is historical evidence, not a fresh executable board.

### Week 5 player props

1. **All player props for the other 14 games.** Current local player-prop coverage is TB @ DAL only.
2. **Standard two-sided player O/U markets for TB @ DAL** (passing yards/completions/attempts/TDs/INTs, rushing yards/carries, receiving yards/receptions, sacks and defensive INTs). The BEO board contains ladders and scoring markets, but its `Over/Under (...)` headings have no underlying player rows.
3. **Optional, if wanted for SGP analysis:** actual BKR prop rows behind the advertised prop counts on the game board. Counts alone are not price evidence.

### Current futures markets

1. **AFC North division screenshot:** no AFC North division record is present. Capture BAL, CIN, CLE, and PIT.
2. **Make/miss-playoffs prices:** BAL and PHI are absent from the 30 normalized records.
3. **Regular-season win totals:** BAL and LAC are absent from the 30 normalized records.
4. **Any desired player futures:** awards, season passing/rushing/receiving totals, stat leaders, and weekly milestones. None are in the Oct. 7 screenshot set.
5. **Any desired team specials:** exact record, seed/order markets, playoff seeding exacta, conference-championship matchup markets, and divisional placing markets. The supplied screenshots include Super Bowl exact matchups (256 combinations) but not these other specials.

### Validated futures coverage

- Super Bowl winner: 32 teams.
- Conference winner: 16 AFC and 16 NFC teams.
- Division winner: 28 team records across seven divisions; AFC North is missing.
- Make/miss playoffs: 30 teams; BAL and PHI are missing.
- Win totals: 30 teams; BAL and LAC are missing.
- Super Bowl exact matchup: 256 unique combinations, with no duplicate normalized rows.

## Guardrails

- Every listed board is evidence only, not an executable-price assertion.
- No wagering, ledger, Supabase, or paid-data actions were performed.
