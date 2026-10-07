# Unified NFL Expert & Twitter Sharp Pick Registry (Week 1)

> **Generated**: 2026-09-10T00:47:28.792Z  
> **Scope**: Master tracking registry across **all 4 betting categories** (Sides, Totals, Player Props, Futures).  
> **Total Actionable Picks Tracked**: **58 picks** across **27 analysts and Twitter sharps**.  
> **Evaluation Framework**: All picks are cataloged for post-game automated grading against game final scores (sides/totals) and official player box scores (player props).

---

## 1. Registry Architecture & Category Overview

| Betting Category | Total Picks | Primary Sources | Automated Grading Mechanism |
| :--- | :---: | :--- | :--- |
| **Player Props** | **47** | VSiN, BettingPros, Twitter Sharps (@propswithicy, @Zl0ckz21_, @DanGambleAI, @thejoeholkashow) | Box Score actuals vs. Line/Side (`agents/props-auto-grade.js`) |
| **Sides (Spread / ML)** | **8** | Sharp or Square, Even Money, Sunday Sixpack, Invisible Insider | Margin of victory vs. Spread line (`src/lib/expertStats.js`) |
| **Game Totals** | **2** | Dave Tuley (VSiN), Sunday Sixpack (Raybon) | Combined final score vs. Total line (`src/lib/expertStats.js`) |
| **Market Intel / Splits** | **1** | Ben Fawkes (@BFawkes22), John Ewing (@johnewing) | Monitored for CLV (Closing Line Value) evaluation |

---

## 2. Twitter/X Sharp Analysts (Dedicated Pick Ledger)

| Twitter Expert | Category | Matchup | Selection | Odds | Book | Stated Rationale |
| :--- | :---: | :---: | :--- | :---: | :--- | :--- |
| **Joe Holka (Twitter/X Bookmarks)** | `player_prop` | BAL @ IND | **Zay Flowers: Over 64.5 Receiving Yards** | `-114` | DraftKings | Ranked 6th in NFL in receiving yards last season (71.1 ypg). Colts allowed 2nd-most receiving yards to WRs. Cleared in 4 of final 5 games. |
| **Joe Holka (Twitter/X Bookmarks)** | `player_prop` | ARI @ LAC | **Omarion Hampton: Over 65.5 Rushing Yards** | `-114` | DraftKings | Jim Harbaugh ground-and-pound commitment against a soft Cardinals run defense. Hampton commands workhorse carries. |
| **What's Up P (@propswithicy)** | `player_prop` | NO vs. CAR / Week 1 | **Tyler Shough Over 14.5 Rush Yards** | `-112` | Consensus | Saints QB starter averaged 25 rush yards/game in 2025; cleared 14.5 in 5 of 7 games. |
| **What's Up P (@propswithicy)** | `player_prop` | SF @ LAR | **Brock Purdy Over 14.5 Rush Yards** | `-114` | DraftKings | Rams fierce D-Line with Aaron Donald returning will force Purdy into rollouts and scramble runs. |
| **ZR21 (@Zl0ckz21_)** | `player_prop` | SF @ LAR | **Brock Purdy Over 14.5 Rush Yards** | `-114` | FanDuel | Primetime mobility angle against aggressive edge pressure. |
| **ZR21 (@Zl0ckz21_)** | `player_prop` | SF @ LAR | **Christian McCaffrey Over 36.5 Receiving Yards** | `-110` | FanDuel | 49ers feature back receiving target funnel against Rams linebackers. |
| **ZR21 (@Zl0ckz21_)** | `player_prop` | SF @ LAR | **Kyren Williams Over 10.5 Receiving Yards** | `-110` | Bet365 | Rams screen game target against 49ers aggressive pass rush. |
| **Dan's AI Sports Picks (@DanGambleAI)** | `player_prop` | PHI vs. DAL | **Jalen Hurts Anytime Touchdown** | `+110` | Consensus | Eagles goal-line Tush Push / Brotherly Shove weapon. |
| **Dan's AI Sports Picks (@DanGambleAI)** | `player_prop` | DET vs. GB | **Amon-Ra St. Brown 8+ Receptions** | `+162` | Consensus | Elite volume target in divisional shootout. |
| **Dan's AI Sports Picks (@DanGambleAI)** | `player_prop` | CHI vs. MIN | **Caleb Williams 250+ Passing Yards** | `+154` | Consensus | Bears upgraded offensive weapons against blitz-heavy Flores defense. |
| **Joe Holka (@thejoeholkashow)** | `player_prop` | BAL @ IND | **Zay Flowers Over 64.5 Receiving Yards** | `-114` | DraftKings | Ranked 6th in NFL in rec yds (71.1 ypg); Colts allowed 2nd-most yards to WRs. |
| **Joe Holka (@thejoeholkashow)** | `player_prop` | ARI @ LAC | **Omarion Hampton Over 65.5 Rushing Yards** | `-114` | DraftKings | Jim Harbaugh ground-and-pound identity against soft Cardinals run front. |
| **Cody Brown Bets (@CodyBrownBets)** | `player_prop` | SF @ LAR | **Matthew Stafford Over 1.5 Passing Touchdowns** | `-105` | DraftKings | McVay red-zone pass funnel in projected 48.5 shootout. |
| **Cody Brown Bets (@CodyBrownBets)** | `player_prop` | SF @ LAR | **Jauan Jennings Over 23.5 Receiving Yards** | `-115` | DraftKings | Crucial 3rd-down chains mover when Rams shade bracket coverage to Aiyuk/CMC. |
| **Sal Bets (@salbets_)** | `player_prop` | NE @ SEA | **A.J. Brown Over 4.5 Catches (Alt DFS Line)** | `-145` | Sleeper / Underdog | Discounted reception threshold on DFS platforms for WR1 debut. |
| **Invisible Insider (@invisiblestats)** | `side` | SF @ LAR | **San Francisco 49ers Moneyline (+165)** | `+165` | Consensus | Heavy reverse line movement (+180 down to +165) on only 9% public dollars. |
| **Invisible Insider (@invisiblestats)** | `side` | BAL @ IND | **Indianapolis Colts Moneyline (+150)** | `+150` | Consensus | Sharp reverse line movement (+170 down to +150) on 11% public money. |
| **Ben Fawkes (@BFawkes22)** | `market_intel` | NE @ SEA | **Market Move: 71% of BetMGM Tickets on Seattle -3.5** | `-110` | BetMGM | Public betting distribution metric. |

---

## 3. Article & Podcast Specialists (Player Props Ledger)

| Expert / Analyst | Source | Matchup | Prop Category | Line & Side | Odds | Sportsbook | Rationale |
| :--- | :--- | :---: | :--- | :---: | :---: | :--- | :--- |
| **Zachary Cohen (VSiN)** | VSiN | SF @ LAR | receiving | `4.5 OVER` | **-120** | DraftKings | Averaged 14.5 rec yds/game vs Rams last season. Shanahan schemes him open with extended prep time. OptaAI projects 12.62 receiving yards (35.5% edge, 3-star confidence play). |
| **Zachary Cohen (VSiN)** | VSiN | NE @ SEA | passing | `226.5 OVER` | **-117** | DraftKings | MVP runner-up averaged 248.7 pass yds/game across 21 games. Threw for 295 yds against Seattle in Super Bowl LX. With Henderson banged up and Brown/Doubs added, volume will be massive. |
| **Zachary Cohen (VSiN)** | VSiN | TB @ CIN | rushing | `14.5 OVER` | **-103** | DraftKings | OptaAI projection models 15.53 carries against a Bengals defense susceptible to outside-zone running. Clear RB1 volume workload. |
| **Zachary Cohen (VSiN)** | VSiN | BAL @ IND | receiving | `44.5 OVER` | **-113** | DraftKings | OptaAI projection calls for 72.60 receiving yards. Ravens were 21st in dropback EPA/play allowed (0.101). Pierce is Daniel Jones' premier vertical target. |
| **Zachary Cohen (VSiN)** | VSiN | NYJ @ TEN | passing | `0.5 OVER` | **-103** | DraftKings | Titans revamped defensive front under Dennard Wilson will force turnover-prone Smith into contested sideline throws under duress. |
| **Walter Cherepinsky (Walter Football)** | Walter Football | NE @ SEA | rushing | `25+ OVER` | **+110** | DraftKings | Key leg of official Walter Football SGP (+1050). Maye's rushing floor is essential against Seattle's aggressive front. |
| **Walter Cherepinsky (Walter Football)** | Walter Football | NE @ SEA | receiving | `60+ OVER` | **-135** | DraftKings | Primary target in New England passing offense. Safest yardage floor leg for SGP construction. |
| **Adam Burke (VSiN)** | VSiN | BAL @ IND | touchdown | `First TD YES` | **+400** | DraftKings | Colts led the entire NFL in 2025 by scoring the first TD in 15 of 17 games (88.2%). Taylor scored 5 first team TDs last year. Shane Steichen scripted drives are elite. |
| **Adam Burke (VSiN)** | VSiN | BUF @ HOU | touchdown | `First TD YES` | **+550** | DraftKings | Bills led the NFL with 10 opening-possession TDs in 19 games. Cook was their most frequent scorer with 13 first team TDs over the last 2 seasons. |
| **Adam Burke (VSiN)** | VSiN | CLE @ JAX | touchdown | `First TD YES` | **+850** | DraftKings | Jaguars scored first TD at 72.2% clip under Liam Coen. Washington led the team with 4 first TDs as Coen loves throwing inside the 10. |
| **Adam Burke (VSiN)** | VSiN | CLE @ JAX | touchdown | `First TD YES` | **+1700** | DraftKings | Todd Monken offense from Baltimore scored first in 73% of games over 3 seasons and heavily utilizes tight ends in the red zone. |
| **Adam Burke (VSiN)** | VSiN | BUF @ HOU | touchdown | `First TD YES` | **+1700** | DraftKings | Kincaid caught 3 first-team touchdowns early last season as Josh Allen's favorite early-read target in the red zone. |
| **John Hansen ("The Guru", VSiN Pro Picks)** | VSiN | NE @ SEA | rushing | `57.5 OVER` | **-111** | VSiN Pro Picks (Consensus) | Primary bell cow rusher in Mike Vrabel's ground-and-pound game plan. Will command 16-20 carries with Henderson sidelined. |
| **John Hansen ("The Guru", VSiN Pro Picks)** | VSiN | NE @ SEA | receiving | `34.5 OVER` | **-110** | VSiN Pro Picks (Consensus) | Henry averaged 42.1 receiving yards per game with Maye last season and remains the primary target over the middle. |
| **Curtis Hirsch (Sharp Football)** | Sharp Football Analysis | NE @ SEA | receiving | `70+ OVER` | **+115** | DraftKings | Patriots paid a future first-round pick for Brown and will feature him on NFL Opening Night against a Seattle secondary missing Riq Woolen and Coby Bryant. |
| **Curtis Hirsch (Sharp Football)** | Sharp Football Analysis | NE @ SEA | receiving | `40+ OVER` | **+125** | DraftKings | New offensive coordinator giving Shaheed increased short/intermediate crossing routes and screen packages to complement deep ball ability. |

---

## 4. Traditional Experts (Sides & Totals Ledger)

| Expert Name | Source | Game | Pick Type | Official Selection | Line / Price | Rationale |
| :--- | :--- | :---: | :---: | :--- | :---: | :--- |
| **Invisible Insider (@invisiblestats)** | Twitter/X | SF @ LAR | `side` | **San Francisco 49ers Moneyline (+165)** | `+165` | Heavy reverse line movement (+180 down to +165) on only 9% public dollars. |
| **Invisible Insider (@invisiblestats)** | Twitter/X | BAL @ IND | `side` | **Indianapolis Colts Moneyline (+150)** | `+150` | Sharp reverse line movement (+170 down to +150) on 11% public money. |
| **Simon Hunter** | Sharp or Square | NE @ SEA | `side` | **New England Patriots +3.5** | `-108` | Super Bowl rematch motivation, defensive structure under Vrabel, and secondary injuries on Seattle. |
| **Chad Millman** | Sharp or Square | NE @ SEA | `side` | **New England Patriots +3.5** | `-108` | Underdog value through the key number 3; Seattle laying over a field goal in a season opener. |
| **Dave Tuley** | VSiN | NE @ SEA | `side` | **New England Patriots +3.5** | `-110` | Tuley's classic dogs or pass philosophy: taking the +3.5 points in a defensive trench battle. |
| **Dave Tuley** | VSiN | SF @ LAR | `total` | **SF @ LAR Under 48.5** | `-110` | Opening international game travel lag to Melbourne, slow initial tempo, and defensive familiarity. |
| **Steve Fezzik** | Even Money | SF @ LAR | `side` | **San Francisco 49ers +3.5** | `-110` | Value on Shanahan getting over a field goal with extra preparation time. |
| **Ross Tucker** | Even Money | SF @ LAR | `side` | **Los Angeles Rams -3.5** | `-110` | Rams offensive line continuity and Stafford chemistry with Nacua. |
| **Chris Raybon** | Sunday Sixpack | NE @ SEA | `total` | **NE @ SEA Under 43.5** | `-110` | Vrabel clock-bleeding pace and Seattle adjusting to new offensive playcaller. |
| **Stuckey** | Sunday Sixpack | NE @ SEA | `side` | **New England Patriots +3.5** | `-110` | Situational underdog spot and special teams edge. |

---

## 5. Post-Game Evaluation & Grading Plan

When Week 1 games conclude:
1. **Sides & Totals**: Evaluated against final scores via `src/lib/expertStats.js` (`gradeSpread` and `gradeTotal`) to compute Win-Loss-Push records and ROI on the `ExpertLeaderboard`.
2. **Player Props**: Evaluated against weekly player actuals from `player_stats` table (using `agents/props-auto-grade.js`). Receptions, rushing yards, passing yards, and anytime touchdowns will be automatically marked WIN or LOSS.
3. **Twitter Expert Evaluation**: Each Twitter analyst now has an assigned expert ID and unified entry in `src/lib/experts.js`. Their graded performance will display side-by-side with podcast and article experts on the unified leaderboard.