# Week 8 podcast pick grades (2026)

Source: `data/podcasts/youtube-extracted-picks-2026-w08.json` (177 extracted rows, status pending_andy_review; not edited). Graded against cached ESPN summaries in `data/fantasy/boxscores/espn-<event>.json` for all 14 final Week 8 games. Machine-readable: `reports/intel/w08-podcast-pick-grades.json`. Grader: `scripts/master-intel/grade_podcast_picks.py --week 8` (week-agnostic, read-only on inputs).

## Headline

- **67-96-0 on 167 unique expert positions, -26.51 units** (flat 1u; stated price, else -110). 4 ungradable.
- Best expert: **Andrew Erickson** 8-3-0, +5.61u. Best per-pick: Seth Woolcock 4-0, +5.02u.
- Worst expert: **Brandon Anderson** 9-20-0, -11.94u (alt-yardage ladders on Lamb/Bijan/Flowers/McLaughlin all missed). Sean Koerner 0-7 on long-shot TD scorers.
- By market: sides/totals 29-27-0 (-0.88u); player yardage/counts 28-32-0 (-6.81u); anytime/first TD 8-35-0 (-17.82u). The TD-scorer market accounts for most of the losses.
- By outlet: BettingPros best (+4.53u); Action Network worst (-28.87u, mostly TD-scorer and ladder picks).

## Grading rules applied

- Graded at the line and price **as stated in the pick**; units at -110 when no price was stated. Wins pay at that price; losses -1u; pushes 0.
- Each expert position is counted once in rollups (same speaker + game + market + side/player + line). 10 repeat rows (same pick in a second episode or a clip re-cut) are graded but marked `duplicate_of_earlier`. Where copies differed, the copy with a stated price was used.
- Anytime TD = rushing + receiving + return + defensive TDs (passing TDs don't count). `anytime_touchdown` with line 1.5 = 2+ TDs.
- House rule: player absent from the final box score = LOST (Jaleel McLaughlin x3, Carnell Tate).
- Teaser legs and the survivor pick are graded W/L but carry no units. Futures are ungradable.
- Season-to-date: no earlier podcast grade files exist under `reports/intel/`, so this week starts the season-to-date record (the column equals Week 8).

### Per expert (sorted by units)

| Expert | Positions | W-L-P | Ungradable | Units | Season-to-date units |
|---|---:|---|---:|---:|---:|
| Andrew Erickson | 11 | 8-3-0 | 0 | +5.61 | +5.61 |
| Seth Woolcock | 4 | 4-0-0 | 0 | +5.02 | +5.02 |
| John Hansen | 17 | 9-6-0 | 2 | +2.13 | +2.13 |
| Matt Moore | 1 | 1-0-0 | 0 | +0.91 | +0.91 |
| Brandon Kravitz | 2 | 1-0-0 | 1 | +0.91 | +0.91 |
| Warren Sharp | 1 | 1-0-0 | 0 | +0.88 | +0.88 |
| Evan Abrams | 3 | 2-1-0 | 0 | +0.82 | +0.82 |
| Simon Hunter | 5 | 3-2-0 | 0 | +0.73 | +0.73 |
| Steve Fezzik | 9 | 5-4-0 | 0 | +0.55 | +0.55 |
| Matt Perrault | 3 | 2-1-0 | 0 | -0.03 | -0.03 |
| Kendra Middleton | 2 | 1-1-0 | 0 | -0.09 | -0.09 |
| Scott Bogman | 6 | 3-3-0 | 0 | -0.12 | -0.12 |
| Joe Gibbs | 2 | 0-1-0 | 1 | -1.00 | -1.00 |
| unknown_1 | 1 | 0-1-0 | 0 | -1.00 | -1.00 |
| John Jastremski | 1 | 0-1-0 | 0 | -1.00 | -1.00 |
| Doug Kezirian | 3 | 1-2-0 | 0 | -1.09 | -1.09 |
| Rich Hribar | 3 | 1-2-0 | 0 | -1.12 | -1.12 |
| Dustin Swedelson | 5 | 2-3-0 | 0 | -1.24 | -1.24 |
| Grant Neuffer | 10 | 2-8-0 | 0 | -1.75 | -1.75 |
| Stuckey | 6 | 2-4-0 | 0 | -2.09 | -2.09 |
| Tera Roberts | 4 | 1-3-0 | 0 | -2.09 | -2.09 |
| Chad Millman | 5 | 1-4-0 | 0 | -3.09 | -3.09 |
| Chris Welsh | 14 | 5-9-0 | 0 | -3.88 | -3.88 |
| Gilles Gallant | 13 | 3-10-0 | 0 | -5.55 | -5.55 |
| Sean Koerner | 7 | 0-7-0 | 0 | -7.00 | -7.00 |
| Brandon Anderson | 29 | 9-20-0 | 0 | -11.94 | -11.94 |

### Per show/outlet

| Outlet | Positions | W-L-P | Ungradable | Units | Season-to-date units |
|---|---:|---|---:|---:|---:|
| BettingPros | 42 | 23-19-0 | 0 | +4.53 | +4.53 |
| VSiN | 22 | 11-9-0 | 2 | +0.90 | +0.90 |
| Ross Tucker | 9 | 5-4-0 | 0 | +0.55 | +0.55 |
| Warren Sharp | 6 | 2-3-0 | 1 | -1.25 | -1.25 |
| Sharp or Square | 10 | 4-6-0 | 0 | -2.36 | -2.36 |
| Action Network | 78 | 22-55-0 | 1 | -28.87 | -28.87 |

### Per market group

| Market group | Positions | W-L-P | Ungradable | Units | Season-to-date units |
|---|---:|---|---:|---:|---:|
| side/total | 57 | 29-27-0 | 1 | -0.88 | -0.88 |
| other | 5 | 2-2-0 | 1 | -1.00 | -1.00 |
| player yardage/count | 62 | 28-32-0 | 2 | -6.81 | -6.81 |
| anytime/first TD | 43 | 8-35-0 | 0 | -17.82 | -17.82 |

## Flags

- Ungradable #110 John Hansen: Amon-Ra St. Brown rec_yds OVER (MIN@DET): line not stated by speaker.
- Ungradable #119 John Hansen: Jahmyr Gibbs rush_yds OVER (MIN@DET): line not stated by speaker.
- Ungradable #130 Joe Gibbs: SEA spread (line not stated) (CHI@SEA): line not stated by speaker.
- Ungradable #171 Brandon Kravitz: CHI super_bowl_winner YES (CHI@SEA): futures market, not decided by a Week 8 box score.
- #15 Doug Kezirian MIN ML: moneyline with no stated price, graded at -110 per instruction (real ML price differed).
- #16 Stuckey LAC ML: moneyline with no stated price, graded at -110 per instruction (real ML price differed).
- #137 Andrew Erickson DEN ML: moneyline with no stated price, graded at -110 per instruction (real ML price differed).
- `unknown_1` (#168, BAL +3.5, Action Network) has an unidentified speaker.
- Data note (fixed 11/03): the Week 1 cached box scores `espn-401872930.json` and `espn-401872931.json` were truncated by a non-atomic write in `scripts/generate-live-tracker.mjs` on 10/22. That broke this morning's archive `player_games` and validation steps. Both were re-fetched (truncated copies kept as `*.truncated-20261022`), the writer now uses `writeFileAtomic`, and both steps run again.

## All grades

| # | Game | Speaker | Outlet | Pick | Line | Price | Result | Units | Detail |
|---:|---|---|---|---|---:|---:|---|---:|---|
| 0 | PHI@WAS | Scott Bogman | BettingPros | PHI ML |  | 228 | L | -1.00 | PHI 10-27 |
| 1 | PHI@WAS | Chris Welsh | BettingPros | PHI ML |  | 228 | L | -1.00 | PHI 10-27 |
| 2 | PHI@WAS | Scott Bogman | BettingPros | Rachaad White o2.5 player_receptions | 2.5 | 118 | L | -1.00 | 2 vs 2.5 |
| 3 | PHI@WAS | Chris Welsh | BettingPros | Rachaad White o11.5 player_receiving_yds | 11.5 | -114 | L | -1.00 | 5 vs 11.5 |
| 4 | PHI@WAS | Scott Bogman | BettingPros | Antonio Williams o33.5 player_receiving_yds | 33.5 | -112 | W | +0.89 | 54 vs 33.5 |
| 5 | PHI@WAS | Chris Welsh | BettingPros | Dallas Goedert anytime_touchdown YES |  | 220 | L | -1.00 | 0 non-passing TD (needs 1) |
| 6 | CHI@SEA | Gilles Gallant | Action Network | Jaxon Smith-Njigba anytime TD | 0.5 |  | W (dup of #46) | +0.91 | 1 non-passing TD (needs 1) |
| 7 | CHI@SEA | Grant Neuffer | Action Network | AJ Barner anytime TD +225 | 0.5 | 225 | L | -1.00 | 0 non-passing TD (needs 1) |
| 8 | CHI@SEA | Sean Koerner | Action Network | Colston Loveland anytime TD +215 | 0.5 | 215 | L | -1.00 | 0 non-passing TD (needs 1) |
| 9 | PHI@WAS | Doug Kezirian | Action Network | WAS -5.5 | -5.5 |  | W | +0.91 | WSH 27-10 (-5.5) |
| 10 | ATL@TB | Stuckey | Action Network | TB -2.5 | -2.5 |  | W | +0.91 | TB 16-0 (-2.5) |
| 11 | KC@DEN | Evan Abrams | Action Network | DEN +1.5 | 1.5 |  | W | +0.91 | DEN 28-24 (+1.5) |
| 12 | BAL@BUF | Stuckey | Action Network | BAL +3.5 | 3.5 |  | L | -1.00 | BAL 10-36 (+3.5) |
| 13 | CHI@SEA | Doug Kezirian | Action Network | SEA -3 | -3.0 |  | L (dup of #169) | -1.00 | SEA 17-34 (-3) |
| 14 | LV@NYJ | Stuckey | Action Network | NYJ -1.5 | -1.5 |  | L | -1.00 | NYJ 33-38 (-1.5) |
| 15 | MIN@DET | Doug Kezirian | Action Network | MIN ML |  |  | L | -1.00 | MIN 15-19 |
| 16 | LAC@LAR | Stuckey | Action Network | LAC ML |  |  | L | -1.00 | LAC 9-24 |
| 17 | KC@DEN | Stuckey | Action Network | DEN teaser leg | 7.5 |  | W |  | DEN 28-24 (+7.5) |
| 18 | ATL@TB | Stuckey | Action Network | ATL teaser leg | 8.5 |  | L |  | ATL 0-16 (+8.5) |
| 19 | TEN@CIN | Matt Perrault | BettingPros | CIN survivor_pick |  |  | W |  | CIN 43-36 |
| 20 | BAL@BUF | Matt Perrault | BettingPros | BUF -3.5 | -3.5 | -103 | W | +0.97 | BUF 36-10 (-3.5) |
| 21 | CLE@PIT | Matt Perrault | BettingPros | CLE +3.5 | 3.5 | -108 | L | -1.00 | CLE 6-27 (+3.5) |
| 22 | LV@NYJ | Grant Neuffer | Action Network | Mason Taylor anytime TD +240 | 0.5 | 240 | L | -1.00 | 0 non-passing TD (needs 1) |
| 23 | LV@NYJ | Grant Neuffer | Action Network | Tre Tucker anytime TD +265 | 0.5 | 265 | L | -1.00 | 0 non-passing TD (needs 1) |
| 24 | ARI@DAL | Gilles Gallant | Action Network | Jeremiyah Love anytime TD +145 | 0.5 | 145 | L | -1.00 | 0 non-passing TD (needs 1) |
| 25 | ARI@DAL | Gilles Gallant | Action Network | George Pickens anytime TD +120 | 0.5 | 120 | L | -1.00 | 0 non-passing TD (needs 1) |
| 26 | ATL@TB | Sean Koerner | Action Network | Chris Godwin Jr. anytime TD +310 | 0.5 | 310 | L | -1.00 | 0 non-passing TD (needs 1) |
| 27 | ATL@TB | Sean Koerner | Action Network | Michael Penix Jr. anytime TD +1300 | 0.5 | 1300 | L | -1.00 | 0 non-passing TD (needs 1) |
| 28 | CLE@PIT | Grant Neuffer | Action Network | Darnell Washington anytime TD +320 | 0.5 | 320 | L | -1.00 | 0 non-passing TD (needs 1) |
| 29 | CLE@PIT | Grant Neuffer | Action Network | KC Concepcion anytime TD +340 | 0.5 | 340 | L | -1.00 | 0 non-passing TD (needs 1) |
| 30 | IND@JAX | Gilles Gallant | Action Network | Laquon Treadwell anytime TD +550 | 0.5 | 550 | L | -1.00 | 0 non-passing TD (needs 1) |
| 31 | IND@JAX | Gilles Gallant | Action Network | Trevor Lawrence anytime TD +350 | 0.5 | 350 | L | -1.00 | 0 non-passing TD (needs 1) |
| 32 | BAL@BUF | Sean Koerner | Action Network | Zay Flowers anytime TD +145 | 0.5 | 145 | L | -1.00 | 0 non-passing TD (needs 1) |
| 33 | BAL@BUF | Sean Koerner | Action Network | Ty Johnson anytime TD +650 | 0.5 | 650 | L | -1.00 | 0 non-passing TD (needs 1) |
| 34 | MIN@DET | Grant Neuffer | Action Network | T.J. Hockenson anytime TD +285 | 0.5 | 285 | W | +2.85 | 1 non-passing TD (needs 1) |
| 35 | MIN@DET | Grant Neuffer | Action Network | Amon-Ra St. Brown anytime TD +130 | 0.5 | 130 | L | -1.00 | 0 non-passing TD (needs 1) |
| 36 | TEN@CIN | Gilles Gallant | Action Network | Ja'Marr Chase anytime TD +110 | 0.5 | 110 | W | +1.10 | 1 non-passing TD (needs 1) |
| 37 | TEN@CIN | Gilles Gallant | Action Network | Elic Ayomanor anytime TD +650 | 0.5 | 650 | L | -1.00 | 0 non-passing TD (needs 1) |
| 38 | LAC@LAR | Sean Koerner | Action Network | Kimani Vidal anytime TD +500 | 0.5 | 500 | L | -1.00 | 0 non-passing TD (needs 1) |
| 39 | NE@MIA | Grant Neuffer | Action Network | Eli Raridon anytime TD +450 | 0.5 | 450 | L | -1.00 | 0 non-passing TD (needs 1) |
| 40 | NE@MIA | Grant Neuffer | Action Network | Malik Washington anytime TD +340 | 0.5 | 340 | W | +3.40 | 1 non-passing TD (needs 1) |
| 41 | KC@DEN | Gilles Gallant | Action Network | Courtland Sutton anytime TD +250 | 0.5 | 250 | L | -1.00 | 0 non-passing TD (needs 1) |
| 42 | KC@DEN | Gilles Gallant | Action Network | Xavier Worthy anytime TD +270 | 0.5 | 270 | L | -1.00 | 0 non-passing TD (needs 1) |
| 43 | PHI@WAS | Gilles Gallant | Action Network | Dallas Goedert anytime TD +180 | 0.5 | 180 | L | -1.00 | 0 non-passing TD (needs 1) |
| 44 | PHI@WAS | Grant Neuffer | Action Network | Makai Lemon anytime TD +320 | 0.5 | 320 | L | -1.00 | 0 non-passing TD (needs 1) |
| 45 | PHI@WAS | Sean Koerner | Action Network | Dyami Brown anytime TD +800 | 0.5 | 800 | L | -1.00 | 0 non-passing TD (needs 1) |
| 46 | CHI@SEA | Gilles Gallant | Action Network | Jaxon Smith-Njigba anytime TD +150 | 0.5 | 150 | W | +1.50 | 1 non-passing TD (needs 1) |
| 47 | CHI@SEA | Grant Neuffer | Action Network | AJ Barner anytime TD +225 | 0.5 | 225 | L (dup of #7) | -1.00 | 0 non-passing TD (needs 1) |
| 48 | CHI@SEA | Sean Koerner | Action Network | Colston Loveland anytime TD +215 | 0.5 | 215 | L (dup of #8) | -1.00 | 0 non-passing TD (needs 1) |
| 49 | BAL@BUF | Gilles Gallant | Action Network | DJ Moore anytime TD +185 | 0.5 | 185 | W | +1.85 | 1 non-passing TD (needs 1) |
| 50 | TEN@CIN | Andrew Erickson | BettingPros | Chase Brown o53.5 rushing_yards | 53.5 | -114 | W | +0.88 | 55 vs 53.5 |
| 51 | BAL@BUF | Chris Welsh | BettingPros | Zay Flowers o81.5 receiving_yards | 81.5 | -115 | L | -1.00 | 0 vs 81.5 |
| 52 | PHI@WAS | Andrew Erickson | BettingPros | Antonio Williams o32.5 receiving_yards | 32.5 | -114 | W | +0.88 | 54 vs 32.5 |
| 53 | NE@MIA | Chris Welsh | BettingPros | Drake Maye o21.5 rushing_yards | 21.5 | -114 | L | -1.00 | 5 vs 21.5 |
| 54 | LV@NYJ | Andrew Erickson | BettingPros | Garrett Wilson o59.5 receiving_yards | 59.5 | -115 | W | +0.87 | 83 vs 59.5 |
| 55 | LV@NYJ | Chris Welsh | BettingPros | Ashton Jeanty o27.5 receiving_yards | 27.5 | -114 | W | +0.88 | 64 vs 27.5 |
| 56 | CLE@PIT | Andrew Erickson | BettingPros | DK Metcalf u4.5 receptions | 4.5 | -138 | W | +0.72 | 1 vs 4.5 |
| 57 | NE@MIA | Chris Welsh | BettingPros | Malik Willis u16.5 completions | 16.5 | -102 | L | -1.00 | 21 vs 16.5 |
| 58 | IND@JAX | Andrew Erickson | BettingPros | Jonathan Taylor u16.5 rushing_attempts | 16.5 | -118 | W | +0.85 | 8 vs 16.5 |
| 59 | MIN@DET | Chris Welsh | BettingPros | Kyler Murray o1.5 passing_touchdowns | 1.5 | 128 | W | +1.28 | 2 vs 1.5 |
| 60 | MIN@DET | Andrew Erickson | BettingPros | T.J. Hockenson anytime_touchdown YES |  | 260 | W | +2.60 | 1 non-passing TD (needs 1) |
| 61 | PHI@WAS | Andrew Erickson | BettingPros | Jeremy McNichols anytime_touchdown YES |  | 430 | L | -1.00 | 0 non-passing TD (needs 1) |
| 62 | NE@MIA | Chris Welsh | BettingPros | Hunter Henry anytime_touchdown YES |  | 160 | L | -1.00 | 0 non-passing TD (needs 1) |
| 63 | LAC@LAR | Chris Welsh | BettingPros | Ladd McConkey anytime_touchdown YES |  | 280 | L | -1.00 | 0 non-passing TD (needs 1) |
| 64 | IND@JAX | Chris Welsh | BettingPros | Travis Hunter first_touchdown YES |  | 3000 | L | -1.00 | first TD: Brian Thomas Jr. 12 Yd pass from Trevor Lawrence (Cam Little Kick) |
| 65 | IND@JAX | Andrew Erickson | BettingPros | Chris Rodriguez first_touchdown YES |  | 1700 | L | -1.00 | first TD: Brian Thomas Jr. 12 Yd pass from Trevor Lawrence (Cam Little Kick) |
| 66 | ARI@DAL | Brandon Anderson | Action Network | CeeDee Lamb o78.5 player_receiving_yds | 78.5 | -115 | L | -1.00 | 58 vs 78.5 |
| 67 | ARI@DAL | Brandon Anderson | Action Network | CeeDee Lamb o100 player_receiving_yds | 100.0 | 252 | L | -1.00 | 58 vs 100.0 |
| 68 | ARI@DAL | Brandon Anderson | Action Network | CeeDee Lamb o150 player_receiving_yds | 150.0 | 950 | L | -1.00 | 58 vs 150.0 |
| 69 | ATL@TB | Brandon Anderson | Action Network | ATL@TB Under 45.5 | 45.5 | -110 | W | +0.91 | total 16 vs 45.5 |
| 70 | ATL@TB | Brandon Anderson | Action Network | Bijan Robinson o40 player_receiving_yds | 40.0 | 225 | L | -1.00 | 0 vs 40.0 |
| 71 | ATL@TB | Brandon Anderson | Action Network | Bijan Robinson o50 player_receiving_yds | 50.0 | 400 | L | -1.00 | 0 vs 50.0 |
| 72 | ATL@TB | Brandon Anderson | Action Network | Bijan Robinson o80 player_receiving_yds | 80.0 | 2000 | L | -1.00 | 0 vs 80.0 |
| 73 | CLE@PIT | Brandon Anderson | Action Network | Jaleel McLaughlin o8.5 player_receiving_yds | 8.5 | -115 | L | -1.00 | not in final box score (house rule: busted leg) |
| 74 | CLE@PIT | Brandon Anderson | Action Network | Jaleel McLaughlin o15 player_receiving_yds | 15.0 | 178 | L | -1.00 | not in final box score (house rule: busted leg) |
| 75 | CLE@PIT | Brandon Anderson | Action Network | Jaleel McLaughlin o20 player_receiving_yds | 20.0 | 270 | L | -1.00 | not in final box score (house rule: busted leg) |
| 76 | MIN@DET | Brandon Anderson | Action Network | DET -3 | -3.0 | -110 | W | +0.91 | DET 19-15 (-3) |
| 77 | PHI@WAS | Brandon Anderson | Action Network | PHI +6 | 6.0 | -112 | L | -1.00 | PHI 10-27 (+6) |
| 78 | IND@JAX | Brandon Anderson | Action Network | Parker Washington o65.5 player_receiving_yds | 65.5 | -115 | L | -1.00 | 16 vs 65.5 |
| 79 | IND@JAX | Brandon Anderson | Action Network | Bhayshul Tuten o60.5 player_rushing_yds | 60.5 | -115 | W | +0.87 | 104 vs 60.5 |
| 80 | NE@MIA | Brandon Anderson | Action Network | Ollie Gordon o58.5 player_rushing_yds | 58.5 | -115 | W | +0.87 | 69 vs 58.5 |
| 81 | TEN@CIN | Brandon Anderson | Action Network | Samaje Perine anytime_touchdown YES |  | 245 | L | -1.00 | 0 non-passing TD (needs 1) |
| 82 | BAL@BUF | Brandon Anderson | Action Network | BAL double_result BAL/BUF |  | 553 | L | -1.00 | half BAL 7-16; final BUF 36-10 |
| 83 | BAL@BUF | Brandon Anderson | Action Network | Josh Allen o9.5 player_rushing_attempts | 9.5 | 296 | L | -1.00 | 7 vs 9.5 |
| 84 | BAL@BUF | Brandon Anderson | Action Network | Josh Allen 1.5 anytime_touchdown | 1.5 | 350 | L | -1.00 | 1 non-passing TD (needs 2) |
| 85 | BAL@BUF | Brandon Anderson | Action Network | Lamar Jackson o25.5 player_rushing_yds | 25.5 | -115 | L | -1.00 | 0 vs 25.5 |
| 86 | BAL@BUF | Brandon Anderson | Action Network | Lamar Jackson o40 player_rushing_yds | 40.0 | 250 | L | -1.00 | 0 vs 40.0 |
| 87 | BAL@BUF | Brandon Anderson | Action Network | Josh Cuevas o8.5 player_longest_reception | 8.5 | -115 | W | +0.87 | 15 vs 8.5 |
| 88 | BAL@BUF | Brandon Anderson | Action Network | Zay Flowers o80.5 player_receiving_yds | 80.5 | -115 | L | -1.00 | 0 vs 80.5 |
| 89 | BAL@BUF | Brandon Anderson | Action Network | Zay Flowers o100 player_receiving_yds | 100.0 | 175 | L | -1.00 | 0 vs 100.0 |
| 90 | IND@JAX | Brandon Anderson | Action Network | JAX -7.5 | -7.5 |  | W | +0.91 | JAX 42-7 (-7.5) |
| 91 | NE@MIA | Brandon Anderson | Action Network | MIA +7.5 | 7.5 |  | W | +0.91 | MIA 19-24 (+7.5) |
| 92 | ARI@DAL | Brandon Anderson | Action Network | DAL -6.5 | -6.5 |  | L | -1.00 | DAL 30-33 (-6.5) |
| 93 | CHI@SEA | Brandon Anderson | Action Network | CHI +3.5 | 3.5 |  | W | +0.91 | CHI 34-17 (+3.5) |
| 94 | ATL@TB | Matt Moore | Action Network | TB -2.5 | -2.5 | -110 | W | +0.91 | TB 16-0 (-2.5) |
| 95 | TEN@CIN | Brandon Anderson | Action Network | CIN -2.5 | -2.5 | -110 | W | +0.91 | CIN 43-36 (-2.5) |
| 96 | MIN@DET | Simon Hunter | Sharp or Square | MIN +3.5 | 3.5 |  | L | -1.00 | MIN 15-19 (+3.5) |
| 97 | MIN@DET | Gilles Gallant | Action Network | Amon-Ra St. Brown anytime TD | 0.5 |  | L | -1.00 | 0 non-passing TD (needs 1) |
| 98 | LV@NYJ | Gilles Gallant | Action Network | Garrett Wilson anytime TD | 0.5 |  | L | -1.00 | 0 non-passing TD (needs 1) |
| 99 | PHI@WAS | Gilles Gallant | Action Network | Dallas Goedert anytime TD | 0.5 |  | L (dup of #43) | -1.00 | 0 non-passing TD (needs 1) |
| 100 | ARI@DAL | Steve Fezzik | Ross Tucker | DAL -6.5 | -6.5 |  | L | -1.00 | DAL 30-33 (-6.5) |
| 101 | KC@DEN | Steve Fezzik | Ross Tucker | DEN +1.5 | 1.5 |  | W | +0.91 | DEN 28-24 (+1.5) |
| 102 | CLE@PIT | Steve Fezzik | Ross Tucker | CLE +3.5 | 3.5 |  | L | -1.00 | CLE 6-27 (+3.5) |
| 103 | BAL@BUF | Steve Fezzik | Ross Tucker | BAL +3.5 | 3.5 |  | L | -1.00 | BAL 10-36 (+3.5) |
| 104 | CHI@SEA | Steve Fezzik | Ross Tucker | CHI +3.5 | 3.5 |  | W | +0.91 | CHI 34-17 (+3.5) |
| 105 | MIN@DET | Steve Fezzik | Ross Tucker | MIN +0.5 | 0.5 | -135 | L | -1.00 | MIN 15-19 (+0.5) |
| 106 | ATL@TB | Steve Fezzik | Ross Tucker | ATL@TB Under 45.5 | 45.5 |  | W | +0.91 | total 16 vs 45.5 |
| 107 | CLE@PIT | Steve Fezzik | Ross Tucker | CLE@PIT Under 39.5 | 39.5 |  | W | +0.91 | total 33 vs 39.5 |
| 108 | LAC@LAR | Steve Fezzik | Ross Tucker | LAC@LAR Under 45.5 | 45.5 |  | W | +0.91 | total 33 vs 45.5 |
| 109 | BAL@BUF | John Hansen | VSiN | Zay Flowers o81.5 rec_yds | 81.5 | -114 | L | -1.00 | 0 vs 81.5 |
| 110 | MIN@DET | John Hansen | VSiN | Amon-Ra St. Brown rec_yds OVER |  |  | ungradable |  | line not stated by speaker |
| 111 | BAL@BUF | John Hansen | VSiN | Derrick Henry o77.5 rush_yds | 77.5 |  | L | -1.00 | 53 vs 77.5 |
| 112 | TEN@CIN | John Hansen | VSiN | Ja'Marr Chase o79.5 rec_yds | 79.5 | -114 | W | +0.88 | 141 vs 79.5 |
| 113 | TEN@CIN | John Hansen | VSiN | Tony Pollard u65.5 rush_yds | 65.5 | -115 | L | -1.00 | 117 vs 65.5 |
| 114 | MIN@DET | John Hansen | VSiN | Sam LaPorta u4.5 receptions | 4.5 |  | W | +0.91 | 3 vs 4.5 |
| 115 | TEN@CIN | John Hansen | VSiN | Carnell Tate u4.5 receptions | 4.5 |  | L | -1.00 | not in final box score (house rule: busted leg) |
| 116 | BAL@BUF | John Hansen | VSiN | DJ Moore o55.5 rec_yds | 55.5 |  | W | +0.91 | 82 vs 55.5 |
| 117 | TEN@CIN | John Hansen | VSiN | Chase Brown o54.5 rush_yds | 54.5 | -114 | W | +0.88 | 55 vs 54.5 |
| 118 | ARI@DAL | John Hansen | VSiN | Ryan Flournoy o33.5 rec_yds | 33.5 |  | W | +0.91 | 38 vs 33.5 |
| 119 | MIN@DET | John Hansen | VSiN | Jahmyr Gibbs rush_yds OVER |  |  | ungradable |  | line not stated by speaker |
| 120 | KC@DEN | John Hansen | VSiN | Kenneth Walker III o85.5 rush_yds | 85.5 | -115 | L | -1.00 | 69 vs 85.5 |
| 121 | CLE@PIT | John Hansen | VSiN | DK Metcalf o53.5 rec_yds | 53.5 |  | L | -1.00 | 4 vs 53.5 |
| 122 | LV@NYJ | John Hansen | VSiN | Michael Mayer o25.5 rec_yds | 25.5 | -108 | W | +0.93 | 53 vs 25.5 |
| 123 | MIN@DET | John Hansen | VSiN | T.J. Hockenson o39.5 rec_yds | 39.5 |  | W | +0.91 | 58 vs 39.5 |
| 124 | KC@DEN | John Hansen | VSiN | Noah Gray o13.5 rec_yds | 13.5 |  | W | +0.91 | 15 vs 13.5 |
| 125 | ARI@DAL | John Hansen | VSiN | Michael Wilson o55.5 rec_yds | 55.5 |  | W | +0.91 | 111 vs 55.5 |
| 126 | TEN@CIN | Rich Hribar | Warren Sharp | Chase Brown o13.5 rushing_attempts | 13.5 | -107 | L | -1.00 | 12 vs 13.5 |
| 127 | IND@JAX | Rich Hribar | Warren Sharp | Bhayshul Tuten o60.5 rushing_yards | 60.5 | -114 | W | +0.88 | 104 vs 60.5 |
| 128 | CHI@SEA | Rich Hribar | Warren Sharp | Sam Darnold o232.5 passing_yards | 232.5 | -114 | L | -1.00 | 188 vs 232.5 |
| 129 | BAL@BUF | Joe Gibbs | Warren Sharp | BAL +3.5 | 3.5 |  | L | -1.00 | BAL 10-36 (+3.5) |
| 130 | CHI@SEA | Joe Gibbs | Warren Sharp | SEA spread (line not stated) |  |  | ungradable |  | line not stated by speaker |
| 131 | KC@DEN | Warren Sharp | Warren Sharp | Jonah Coleman o8.5 receiving_yards | 8.5 | -114 | W | +0.88 | 63 vs 8.5 |
| 132 | CLE@PIT | Andrew Erickson | BettingPros | CLE +3.5 | 3.5 | -110 | L | -1.00 | CLE 6-27 (+3.5) |
| 133 | BAL@BUF | Seth Woolcock | BettingPros | BUF -3 | -3.0 | -110 | W | +0.91 | BUF 36-10 (-3) |
| 134 | PHI@WAS | Andrew Erickson | BettingPros | WAS -5.5 | -5.5 | -110 | W | +0.91 | WSH 27-10 (-5.5) |
| 135 | MIN@DET | Seth Woolcock | BettingPros | T.J. Hockenson anytime_touchdown YES |  | 260 | W | +2.60 | 1 non-passing TD (needs 1) |
| 136 | BAL@BUF | Seth Woolcock | BettingPros | BUF ML |  | -165 | W | +0.61 | BUF 36-10 |
| 137 | KC@DEN | Andrew Erickson | BettingPros | DEN ML |  |  | W | +0.91 | DEN 28-24 |
| 138 | IND@JAX | Seth Woolcock | BettingPros | IND team_total UNDER 18.5 | 18.5 |  | W | +0.91 | IND 7 vs 18.5 |
| 139 | MIN@DET | Simon Hunter | Sharp or Square | MIN +3.5 | 3.5 |  | L (dup of #96) | -1.00 | MIN 15-19 (+3.5) |
| 140 | PHI@WAS | Doug Kezirian | Action Network | WAS -5.5 | -5.5 |  | W (dup of #9) | +0.91 | WSH 27-10 (-5.5) |
| 141 | LV@NYJ | Dustin Swedelson | VSiN | Ashton Jeanty o49.5 rush_yds | 49.5 | -114 | L | -1.00 | 9 vs 49.5 |
| 142 | CLE@PIT | Dustin Swedelson | VSiN | Jaylen Warren o64.5 rush_yds | 64.5 | -117 | W | +0.85 | 143 vs 64.5 |
| 143 | TEN@CIN | Dustin Swedelson | VSiN | Chase Brown o53.5 rush_yds | 53.5 | -110 | W | +0.91 | 55 vs 53.5 |
| 144 | ATL@TB | Dustin Swedelson | VSiN | Bijan Robinson o26.5 rec_yds | 26.5 | -118 | L | -1.00 | 0 vs 26.5 |
| 145 | ATL@TB | Dustin Swedelson | VSiN | Kyle Pitts Sr. o45.5 rec_yds | 45.5 |  | L | -1.00 | 6 vs 45.5 |
| 146 | BAL@BUF | Tera Roberts | BettingPros | Zay Flowers anytime TD | 0.5 |  | L | -1.00 | 0 non-passing TD (needs 1) |
| 147 | BAL@BUF | Tera Roberts | BettingPros | Lamar Jackson o1.5 pass_tds | 1.5 |  | L | -1.00 | 0 vs 1.5 |
| 148 | IND@JAX | Tera Roberts | BettingPros | Parker Washington anytime TD | 0.5 |  | L | -1.00 | 0 non-passing TD (needs 1) |
| 149 | LV@NYJ | Tera Roberts | BettingPros | Geno Smith o1.5 pass_tds | 1.5 |  | W | +0.91 | 2 vs 1.5 |
| 150 | ARI@DAL | Chad Millman | Sharp or Square | ARI +7 | 7.0 |  | W | +0.91 | ARI 33-30 (+7) |
| 151 | ARI@DAL | Simon Hunter | Sharp or Square | ARI +7 | 7.0 |  | W | +0.91 | ARI 33-30 (+7) |
| 152 | MIN@DET | Simon Hunter | Sharp or Square | MIN +3.5 | 3.5 |  | L (dup of #96) | -1.00 | MIN 15-19 (+3.5) |
| 153 | MIN@DET | Chad Millman | Sharp or Square | MIN +3.5 | 3.5 |  | L | -1.00 | MIN 15-19 (+3.5) |
| 154 | ATL@TB | Simon Hunter | Sharp or Square | TB -2.5 | -2.5 |  | W | +0.91 | TB 16-0 (-2.5) |
| 155 | LV@NYJ | Chad Millman | Sharp or Square | NYJ -1.5 | -1.5 |  | L | -1.00 | NYJ 33-38 (-1.5) |
| 156 | CLE@PIT | Chad Millman | Sharp or Square | CLE +3.5 | 3.5 |  | L | -1.00 | CLE 6-27 (+3.5) |
| 157 | BAL@BUF | Simon Hunter | Sharp or Square | BAL +3.5 | 3.5 |  | L | -1.00 | BAL 10-36 (+3.5) |
| 158 | KC@DEN | Simon Hunter | Sharp or Square | DEN +1.5 | 1.5 |  | W | +0.91 | DEN 28-24 (+1.5) |
| 159 | MIN@DET | Chad Millman | Sharp or Square | MIN +3.5 | 3.5 |  | L (dup of #153) | -1.00 | MIN 15-19 (+3.5) |
| 160 | BAL@BUF | Chad Millman | Sharp or Square | BAL +3.5 | 3.5 |  | L | -1.00 | BAL 10-36 (+3.5) |
| 161 | ATL@TB | Simon Hunter | Sharp or Square | TB -2.5 | -2.5 |  | W (dup of #154) | +0.91 | TB 16-0 (-2.5) |
| 162 | CHI@SEA | Scott Bogman | BettingPros | SEA -3.5 | -3.5 | -110 | L | -1.00 | SEA 17-34 (-3.5) |
| 163 | CHI@SEA | Chris Welsh | BettingPros | CHI@SEA Over 46.5 | 46.5 | -110 | W | +0.91 | total 51 vs 46.5 |
| 164 | CHI@SEA | Scott Bogman | BettingPros | Caleb Williams o20.5 completions | 20.5 | 104 | W | +1.04 | 24 vs 20.5 |
| 165 | CHI@SEA | Chris Welsh | BettingPros | Colston Loveland o4.5 receptions | 4.5 | 115 | W | +1.15 | 7 vs 4.5 |
| 166 | CHI@SEA | Scott Bogman | BettingPros | Sam Darnold o0.5 interceptions | 0.5 | -105 | W | +0.95 | 1 vs 0.5 |
| 167 | CHI@SEA | Chris Welsh | BettingPros | Caleb Williams u21.5 rush_yds | 21.5 | -110 | W | +0.91 | 1 vs 21.5 |
| 168 | BAL@BUF | unknown_1 | Action Network | BAL +3.5 | 3.5 |  | L | -1.00 | BAL 10-36 (+3.5) |
| 169 | CHI@SEA | Doug Kezirian | Action Network | SEA -3 | -3.0 | -115 | L | -1.00 | SEA 17-34 (-3) |
| 170 | CHI@SEA | Evan Abrams | Action Network | SEA -3 | -3.0 | -115 | L | -1.00 | SEA 17-34 (-3) |
| 171 | CHI@SEA | Brandon Kravitz | Action Network | CHI super_bowl_winner YES |  | 1400 | ungradable |  | futures market, not decided by a Week 8 box score |
| 172 | KC@DEN | Evan Abrams | Action Network | DEN +1.5 | 1.5 | -110 | W | +0.91 | DEN 28-24 (+1.5) |
| 173 | IND@JAX | Brandon Kravitz | Action Network | JAX -7.5 | -7.5 | -110 | W | +0.91 | JAX 42-7 (-7.5) |
| 174 | MIN@DET | Kendra Middleton | Action Network | DET -3.5 | -3.5 | -110 | W | +0.91 | DET 19-15 (-3.5) |
| 175 | LV@NYJ | John Jastremski | Action Network | NYJ -1.5 | -1.5 | -110 | L | -1.00 | NYJ 33-38 (-1.5) |
| 176 | ARI@DAL | Kendra Middleton | Action Network | DAL -6.5 | -6.5 | -110 | L | -1.00 | DAL 30-33 (-6.5) |
