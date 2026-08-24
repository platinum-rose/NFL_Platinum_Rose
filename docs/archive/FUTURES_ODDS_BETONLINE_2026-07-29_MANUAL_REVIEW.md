# BetOnline Futures Manual Review - 2026-07-29

Purpose: preserve the local manual transcription of the July 29 BetOnline screenshot bundle used to generate `data/futures-imports/betonline-2026-07-29.json`.

Status: local manual review only. No network calls, Supabase writes, official-pick approvals, recommendation persistence, or open-parlay changes were made.

## Source Screenshots

- `docs/Futures_Odds/BEO_SB_0729.PNG`
- `docs/Futures_Odds/BEO_Conf_0729.PNG`
- `docs/Futures_Odds/BEO_Div_0729.PNG`
- `docs/Futures_Odds/BEO_RegWins1_0729.PNG`
- `docs/Futures_Odds/BEO_RegWins2_0729.PNG`
- `docs/Futures_Odds/BEO_RegWins3_0729.PNG`
- `docs/Futures_Odds/BEO_MakePlayoffs1_0729.PNG`
- `docs/Futures_Odds/BEO_MakePlayoffs2_0729.PNG`
- `docs/Futures_Odds/BEO_MakePlayoffs3_0729.PNG`

## Generated Import

- Output: `data/futures-imports/betonline-2026-07-29.json`
- Snapshot time: `2026-07-29T00:00:00Z`
- Total rows: 160
- Market counts: conference_afc 16, conference_nfc 16, division_afc_east 4, division_afc_north 4, division_afc_south 4, division_afc_west 4, division_nfc_east 4, division_nfc_north 4, division_nfc_south 4, division_nfc_west 4, playoffs 32, superbowl 32, wins 32
- The normalized import follows the existing local schema. For playoffs, the import row uses the `Yes` price; the full Yes/No transcription is retained below.

## Super Bowl Winner

| Team | Price |
| --- | --- |
| Los Angeles Rams | +475 |
| Buffalo Bills | +1000 |
| Baltimore Ravens | +1100 |
| Seattle Seahawks | +1100 |
| Kansas City Chiefs | +1600 |
| Los Angeles Chargers | +1800 |
| Philadelphia Eagles | +1800 |
| San Francisco 49ers | +1800 |
| Denver Broncos | +2000 |
| Detroit Lions | +2000 |
| Green Bay Packers | +2000 |
| Houston Texans | +2000 |
| New England Patriots | +2000 |
| Cincinnati Bengals | +2200 |
| Chicago Bears | +2500 |
| Dallas Cowboys | +2500 |
| Jacksonville Jaguars | +2800 |
| Minnesota Vikings | +4000 |
| Tampa Bay Buccaneers | +5500 |
| Washington Commanders | +5500 |
| Indianapolis Colts | +6600 |
| New York Giants | +6600 |
| Pittsburgh Steelers | +8000 |
| Atlanta Falcons | +10000 |
| Carolina Panthers | +10000 |
| Las Vegas Raiders | +10000 |
| New Orleans Saints | +10000 |
| Cleveland Browns | +25000 |
| New York Jets | +25000 |
| Tennessee Titans | +25000 |
| Miami Dolphins | +40000 |
| Arizona Cardinals | +50000 |

## Conference Winner

### AFC

| Team | Price |
| --- | --- |
| Buffalo Bills | +500 |
| Baltimore Ravens | +500 |
| Kansas City Chiefs | +700 |
| Los Angeles Chargers | +800 |
| New England Patriots | +850 |
| Houston Texans | +900 |
| Cincinnati Bengals | +950 |
| Denver Broncos | +1000 |
| Jacksonville Jaguars | +1200 |
| Indianapolis Colts | +2500 |
| Pittsburgh Steelers | +3300 |
| Tennessee Titans | +6600 |
| Las Vegas Raiders | +7500 |
| Cleveland Browns | +10000 |
| New York Jets | +12500 |
| Miami Dolphins | +15000 |

### NFC

| Team | Price |
| --- | --- |
| Los Angeles Rams | +275 |
| Seattle Seahawks | +575 |
| Detroit Lions | +900 |
| San Francisco 49ers | +900 |
| Philadelphia Eagles | +1000 |
| Green Bay Packers | +1100 |
| Dallas Cowboys | +1200 |
| Chicago Bears | +1400 |
| Minnesota Vikings | +2200 |
| Tampa Bay Buccaneers | +2500 |
| Washington Commanders | +2800 |
| New York Giants | +3300 |
| New Orleans Saints | +4000 |
| Carolina Panthers | +4000 |
| Atlanta Falcons | +4000 |
| Arizona Cardinals | +15000 |

## Division Winner

### AFC EAST

| Team | Price |
| --- | --- |
| Buffalo Bills | -140 |
| New England Patriots | +125 |
| New York Jets | +2000 |
| Miami Dolphins | +3300 |

### NFC WEST

| Team | Price |
| --- | --- |
| Los Angeles Rams | -105 |
| Seattle Seahawks | +210 |
| San Francisco 49ers | +300 |
| Arizona Cardinals | +6000 |

### AFC NORTH

| Team | Price |
| --- | --- |
| Baltimore Ravens | -110 |
| Cincinnati Bengals | +160 |
| Pittsburgh Steelers | +550 |
| Cleveland Browns | +2200 |

### AFC SOUTH

| Team | Price |
| --- | --- |
| Houston Texans | +130 |
| Jacksonville Jaguars | +190 |
| Indianapolis Colts | +375 |
| Tennessee Titans | +750 |

### AFC WEST

| Team | Price |
| --- | --- |
| Kansas City Chiefs | +175 |
| Los Angeles Chargers | +185 |
| Denver Broncos | +210 |
| Las Vegas Raiders | +1400 |

### NFC EAST

| Team | Price |
| --- | --- |
| Philadelphia Eagles | +130 |
| Dallas Cowboys | +210 |
| Washington Commanders | +425 |
| New York Giants | +550 |

### NFC NORTH

| Team | Price |
| --- | --- |
| Detroit Lions | +160 |
| Green Bay Packers | +250 |
| Chicago Bears | +320 |
| Minnesota Vikings | +400 |

### NFC SOUTH

| Team | Price |
| --- | --- |
| Tampa Bay Buccaneers | +195 |
| New Orleans Saints | +240 |
| Atlanta Falcons | +325 |
| Carolina Panthers | +325 |

## Regular Season Wins

| Team | Line | Over | Under |
| --- | --- | --- | --- |
| Arizona Cardinals | 4.5 | +135 | -165 |
| Atlanta Falcons | 7.5 | +100 | -130 |
| Baltimore Ravens | 11.5 | +110 | -140 |
| Buffalo Bills | 10.5 | -145 | +115 |
| Carolina Panthers | 7.5 | +125 | -155 |
| Chicago Bears | 9.5 | +100 | -130 |
| Cincinnati Bengals | 9.5 | -170 | +140 |
| Cleveland Browns | 5.5 | -115 | -115 |
| Dallas Cowboys | 9.5 | +100 | -130 |
| Denver Broncos | 9.5 | -130 | +100 |
| Detroit Lions | 10.5 | -135 | +105 |
| Green Bay Packers | 9.5 | -120 | -110 |
| Houston Texans | 9.5 | -130 | +100 |
| Indianapolis Colts | 7.5 | -135 | +105 |
| Jacksonville Jaguars | 9.5 | +110 | -140 |
| Kansas City Chiefs | 10.5 | +120 | -150 |
| Las Vegas Raiders | 5.5 | -145 | +115 |
| Los Angeles Chargers | 9.5 | -145 | +115 |
| Los Angeles Rams | 11.5 | -145 | +115 |
| Miami Dolphins | 4.5 | +145 | -175 |
| Minnesota Vikings | 8.5 | -115 | -115 |
| New England Patriots | 9.5 | -160 | +130 |
| New Orleans Saints | 7.5 | -135 | +105 |
| New York Giants | 7.5 | -110 | -120 |
| New York Jets | 5.5 | -115 | -115 |
| Philadelphia Eagles | 9.5 | -145 | +115 |
| Pittsburgh Steelers | 7.5 | -145 | +115 |
| San Francisco 49ers | 10.5 | +115 | -145 |
| Seattle Seahawks | 10.5 | -130 | +100 |
| Tampa Bay Buccaneers | 8.5 | +120 | -150 |
| Tennessee Titans | 6.5 | +100 | -130 |
| Washington Commanders | 7.5 | -130 | +100 |

## Make Playoffs

| Team | Yes | No |
| --- | --- | --- |
| Arizona Cardinals | +2000 | -10000 |
| Atlanta Falcons | +205 | -265 |
| Baltimore Ravens | -325 | +250 |
| Buffalo Bills | -325 | +250 |
| Carolina Panthers | +250 | -325 |
| Chicago Bears | +105 | -135 |
| Cincinnati Bengals | -200 | +160 |
| Cleveland Browns | +700 | -1400 |
| Dallas Cowboys | -105 | -125 |
| Denver Broncos | -150 | +120 |
| Detroit Lions | -215 | +175 |
| Green Bay Packers | -120 | -110 |
| Houston Texans | -160 | +130 |
| Indianapolis Colts | +160 | -200 |
| Jacksonville Jaguars | -115 | -115 |
| Kansas City Chiefs | -180 | +150 |
| Las Vegas Raiders | +500 | -800 |
| Los Angeles Chargers | -170 | +140 |
| Los Angeles Rams | -500 | +350 |
| Miami Dolphins | +1400 | -3000 |
| Minnesota Vikings | +160 | -200 |
| New England Patriots | -220 | +180 |
| New Orleans Saints | +170 | -210 |
| New York Giants | +250 | -325 |
| New York Jets | +700 | -1400 |
| Philadelphia Eagles | -155 | +125 |
| Pittsburgh Steelers | +175 | -215 |
| San Francisco 49ers | -155 | +125 |
| Seattle Seahawks | -210 | +170 |
| Tampa Bay Buccaneers | +145 | -175 |
| Tennessee Titans | +400 | -600 |
| Washington Commanders | +220 | -280 |

## Synthesis Caveat

This artifact upgrades BetOnline from screenshot-current/exact-price-excluded to manually normalized for the markets listed above. Any market not listed here, including exact Super Bowl matchup, remains unavailable from BetOnline in the July 29 bundle.
