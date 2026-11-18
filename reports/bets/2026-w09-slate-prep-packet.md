# Week 9 slate prep packet (2026)

Research context, not picks. Built Fri 11/06 06:57 PM PT by `scripts/analysis/slate_prep_packet.py`. 14 games (skipped: JAX@BAL).
Market: DK snapshot in `public/schedule.json`; BetOnline current lines from `data/generated/props/betonline-live-2026-11-06-week9.pregate.raw.txt` where the game was captured.
Form: Weeks 1-8 (`team-weeks.csv`); usage: last 3 games (`player-games.csv`); injuries: OUT / DOUBTFUL / QUESTIONABLE from `player-availability/latest.json` (2026-11-07T02:01Z). Podcast picks: `data/podcasts/youtube-extracted-picks-2026-w09.json`. SuperContest: `data/supercontest/week-09-lines.json`. FTN: `data/research-intel/source-evidence/2026-11-05-ftn-stats-iq`.

## Friday designations (Fri 11/06 ~1:00 PM PT; full list in `logs/cadence-reports/2026-w09-friday.md`)
- **CLE: Shedeur Sanders named the starter at NO**; Watson questionable (protocol). C4 shaky-QB rule still applies to CLE@NO.
- **SEA: Drew Lock starts** (elbow fine, expects every rep). **ARI: Minshew starts**; Bam Knight OUT -> Allgeier.
- **OUT:** Mike Evans + Deebo Samuel (SF), A.J. Brown + Hunter Henry + TreVeyon Henderson (NE), Garrett Wilson (NYJ), David Montgomery (HOU),
  B. Robinson Jr. (ATL), CJ Donaldson (NO), Yaya Diaby (TB). McCaffrey practiced. Egbuka Q but full Thu/Fri.
- Not yet confirmed: Nabers, Skattebo, Saquon, DeVonta Smith, Wirfs, St. Brown, Pickens/Ferguson, BUF WRs. Recheck Saturday.
- Market: HOU moved to -6 DK / -5.5 FD (SC HOU -4.5 = +1.5). ARI +4 and WAS +1 unchanged.

## Friday re-check (Fri 11/06 ~8:00 AM PT; Thursday reports; Friday designations post this afternoon)
- **CLE QB: Watson (concussion) DNP Wed + Thu; Shedeur Sanders on track to start at NO** (first-team reps; Yahoo/Browns Wire 11/05).
  Monken didn't rule Watson out but said clearing protocol without practice is harder; "I can't wait" on a Sanders start (ESPN 11/04).
  Gabriel (back from IR) is QB2. Treat CLE@NO as a **shaky-QB game (rule C4)** until Friday designations: no totals or same-team stacks.
  Also CLE Thu: DT Maliek Collins, LB Quincy Williams DNP; TE Harold Fannin Jr. (groin) new LP; WR Denzel Boston LP.
- **Bucky Irving (TB): Thursday DNP was a veteran rest day** (Bucs official report 11/05; Godwin also rest). No injury -> expect to play.
  Mayfield full Wed + Thu (thumb). Egbuka upgraded to full. **Wirfs (toe) new DNP Thursday**: watch Friday. CHI RB Monangai DNP x2.
- **Malik Nabers (NYG): knee DNP Thursday** (worked with trainers), told reporters he's "good" for Week 9; team not concerned (Rotoworld 11/05).
  Lean plays. Receiving props stay at the lowest rung until Friday's designation. McCarthy remains the NYG starter.
- **Garrett Wilson (NYJ): concussion protocol, DNP Wed + Thu, "long-shot" for KC** (Rotoworld 11/05). Plan without him:
  Adonai Mitchell (7-142-1 in W8) / Omar Cooper Jr. / Mason Taylor get the targets.
- **A.J. Brown is on NE, not PHI** (correction to the Thursday note). Ankle/knee DNP Wed + Thu, **"highly unlikely" vs GB** (Rotoworld 11/05).
  NE WRs left: DeMario Douglas, Kyle Williams, Efton Chism (+ Hollins/Doubs status to check Friday).
- **Deebo Samuel (SF): hamstring, hasn't practiced since Week 5; Lynch says likely out vs LV** (NBC 11/05). Brandin Cooks the main beneficiary;
  SF also without Mike Evans (Achilles/ribs). McCaffrey (hamstring) DNP Wed: check Friday.
- **ARI: Gardner Minshew named the Week 9 starter at SEA; Carson Beck QB2** (LaFleur; Yahoo/The Big Lead). The packet's ARI QB row still shows Brissett.
- Other Wed DNPs to clear Friday: Saquon Barkley + DeVonta Smith (PHI, hamstring), Kamara (NO, rest), Keenan Allen (IND, rest), Diggs (WAS).

## News-checked notes (updated Thu 11/05 ~7:45 PM PT)
- **SEA: Sam Darnold OUT (quad, hurt on MNF); Drew Lock starts** (Lock questionable, elbow). DK snapshot SEA -10.5 / 41.5 -> BEO SEA -8.5.
  **SuperContest has SEA -12.5: ARI +12.5 is 4 points better than the market**, the biggest SC edge this season. (AP/KIRO 7/Arizona Sports 11/04)
- **MIN: Kyler Murray (hamstring) won't play Monday; Carson Wentz starts**, Max Brosmer backs up (Rapoport, Alec Lewis 11/05).
  Podcasts: MIN +3.5 is a 2u best bet for both Fezzik and Tucker. SC MIN +3.5 vs BEO +3.
- **CLE: Deshaun Watson concussion protocol, DNP Wednesday.** Starter for CLE@NO not confirmed. SC NO -3 = market.
- **TB: Baker Mayfield full practice Wed (right thumb).** Bucky Irving DNP Thursday, no injury listed (rest?); watch Friday.
- **Thursday DNPs worth watching:** Malik Nabers (NYG), Garrett Wilson (NYJ, concussion protocol), A.J. Brown (NE, not PHI; 2nd day, ankle/knee),
  Deebo Samuel (hamstring). Upgrades: Jonathan Taylor (IND) full, Breece Hall (NYJ) full.
- **SuperContest vs market (BEO 11/05 4:11 PM):** ARI +4; HOU +1 (SC HOU -4.5 vs -5.5); WAS +1 (SC +5.5 vs +4.5);
  half-points: KC, PHI, SF, TB, MIN. NYG -3.5 is half a point worse than the market. Sheet saved `data/supercontest/week-09-lines.json`
  (public page via web fetch; confirm against the official sheet).
- Not re-checked here: NYG (Dart IR; McCarthy), ARI (Minshew started W8 for Brissett; Brissett reportedly being traded to BAL), PHI McKee (Hurts IR).

## Slate at a glance

| Kick (PT) | Game | DK home line / total (snapshot) | BEO now: away line, total, team totals | SuperContest (home line; value vs BEO) | Rest (A/H) | QB flags |
|---|---|---|---|---|---|---|
| Sun 06:30 AM | CIN@ATL | ATL +3 / 52.5 | CIN -3 (-113), o/u 52.5, TT CIN 27.5 / ATL 23.5 | ATL +3 · no edge | 6/6 | — |
| Sun 10:00 AM | DAL@IND | IND +6 / 51.5 | DAL -5.5 (-108), o/u 51.5, TT DAL 29.5 / IND 23.5 | IND +5.5 · no edge | 7/7 | — |
| Sun 10:00 AM | NYJ@KC | KC -9.5 / 46.5 | NYJ +10 (-115), o/u 47.5, TT NYJ 17.5 / KC 28.5 | KC -9.5 · KC +0.5 | 7/6 | — |
| Sun 10:00 AM | DET@MIA | MIA +7 / 50.5 | DET -7 (-107), o/u 50.5, TT DET 28.5 / MIA 20.5 | MIA +7 · no edge | 7/6 | — |
| Sun 10:00 AM | CLE@NO | NO -1.5 / 42.5 | CLE +3 (-104), o/u 42.5, TT CLE 20.5 / NO 23.5 | NO -3 · no edge | 7/14 | — |
| Sun 10:00 AM | NYG@PHI | PHI +3.5 / 39.5 | NYG -3 (-118), o/u 38.5, TT NYG 21.5 / PHI 18.5 | PHI +3.5 · PHI +0.5 | 14/6 | NYG: J.J. McCarthy started W6,7 (also Jameis Winston recently) |
| Sun 10:00 AM | LAR@WAS | WAS +5.5 / 47.5 | LAR -4.5 (-110), o/u 48.5, TT LAR 26.5 / WAS 20.5 | WAS +5.5 · WAS +1 | 6/6 | — |
| Sun 10:00 AM | DEN@CAR | CAR +2.5 / 43.5 | DEN -2.5 (-115), o/u 44, TT DEN 23.5 / CAR 20.5 | CAR +2.5 · no edge | 6/9 | — |
| Sun 01:05 PM | HOU@LAC | LAC +4.5 / 40.5 | HOU -5.5 (-110), o/u 40.5, TT HOU 22.5 / LAC 17.5 | LAC +4.5 · HOU +1 | 14/7 | — |
| Sun 01:25 PM | GB@NE | NE -3 / 46.5 | GB +3 (-103), o/u 45, TT GB 22.5 / NE 24.5 | NE -3 · no edge | 9/7 | — |
| Sun 01:25 PM | LV@SF | SF -10 / 52.5 | LV +10 (-110), o/u 52, TT LV 20.5 / SF 30.5 | SF -9.5 · SF +0.5 | 7/14 | — |
| Sun 01:25 PM | ARI@SEA | SEA -10.5 / 41.5 | ARI +8.5 (-108), o/u 39.5, TT ARI 14.5 / SEA 23.5 | SEA -12.5 · ARI +4 | 7/5 | ARI: Jacoby Brissett started W1,2,3,4,5,6,7,8 (also Gardner Minshew II recently) |
| Sun 05:20 PM | TB@CHI | CHI -6 / 46.5 | TB +6 (-109), o/u 47.5, TT TB 20.5 / CHI 26.5 | CHI -6.5 · TB +0.5 | 7/6 | TB: Baker Mayfield started W1,2,3,7 (also Jalon Daniels recently) |
| Mon 05:15 PM | BUF@MIN | MIN +3.5 / 45.5 | BUF -3 (-115), o/u 44.5, TT BUF ? / MIN ? | MIN +3.5 · MIN +0.5 | 8/8 | MIN QB Kyler Murray QUESTIONABLE |

## CIN @ ATL (Sun 06:30 AM PT)

**Market.** DK snapshot ATL +3, total 52.5 (2026-11-03T21:00). BEO now: CIN -3 (-113), o/u 52.5, TT CIN 27.5 / ATL 23.5. ML CIN -170 / ATL +149.
**Rest.** CIN 6 days, ATL 6 days. **SuperContest:** ATL +3 · no edge.

| Team | W-L | ATS | O/U | PF/g | PA/g | ypp | opp ypp | TO | pts/drive | Last 3 |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| CIN | 5-2 | 3-4-0 | 5-2-0 | 29.4 | 22.6 | 5.97 | 5.74 | +1 | 2.88 | W5 @MIA 31-24 L; W7 @BAL 35-13 W; W8 vTEN 43-36 L |
| ATL | 3-5 | 3-5-0 | 4-4-0 | 21.4 | 23.6 | 5.41 | 5.21 | -6 | 1.96 | W6 vCHI 23-31 L; W7 vSF 29-20 W; W8 @TB 0-16 L |

**CIN QB starts (10+ att):** Joe Burrow W1,2,3,4,5,7,8
**CIN usage, last 3 games:**
- QB Joe Burrow: pass att 32/30/48, pass yds 190/292/462, pass td 4/4/5, pass int 0/0/3, rush yds 10/12/10
- RB Chase Brown: rush car 13/11/12, rush yds 39/39/55, rec 3/4/8, tds total 0/0/0
- RB Samaje Perine: rush car 14/4/4, rush yds 68/16/10, rec 2/0/1, tds total 1/1/0
- REC Ja'Marr Chase: targets 10/7/16, rec 6/5/11, rec yds 77/62/141, tds total 1/1/1
- REC Tee Higgins: targets 4/7/11, rec 2/6/10, rec yds 22/148/155, tds total 0/1/2
- DEF Barrett Carter: tackles 11/9/8, sacks 1/0/0
- DEF Jordan Battle: tackles 7/5/12, sacks 0/0/0
- DEF Demetrius Knight Jr.: tackles 8/8/5, sacks 0/0/0

**ATL QB starts (10+ att):** Cooper Rush W1,2; Jack Strand W2; Michael Penix Jr. W3,4,5,6,7,8
**ATL usage, last 3 games:**
- QB Michael Penix Jr.: pass att 33/34/24, pass yds 225/213/125, pass td 3/3/0, pass int 0/0/4, rush yds 1/-1/11
- RB Bijan Robinson: rush car 9/20/19, rush yds 61/63/76, rec 2/5/0, tds total 0/0/0
- RB Khalil Herbert: rush car 2/4, rush yds 9/12, rec 1/1, tds total 0/0
- REC Drake London: targets 10/10/6, rec 4/7/1, rec yds 62/66/8, tds total 0/1/0
- REC Kyle Pitts Sr.: targets 7/5/5, rec 5/5/2, rec yds 60/22/6, tds total 2/1/0
- REC Jahan Dotson: targets 5/3/5, rec 3/1/2, rec yds 87/6/95, tds total 1/0/0
- DEF Kendal Daniels: tackles 7/11/13, sacks 0/0/0
- DEF Jessie Bates III: tackles 7/9/6, sacks 0/0/0
- DEF Harold Perkins Jr.: tackles 4/9/7, sacks 0/0/1
**CIN injuries:** Kyle Dugger (S) OUT
**ATL injuries:** James Pearce Jr. (LB) QUESTIONABLE (back); Divine Deablo (LB) QUESTIONABLE (forearm)

| FTN (season) | Offense | vs defense | Offense | vs defense |
|---|---|---|---|---|
| | **CIN O** | ATL D | **ATL O** | CIN D |
| DVOA | 19.8% (#3) | -9.0% (#9) | -11.3% (#26) | 0.5% (#16) |
| Rush DVOA | -2.9% (#14) | -11.8% (#13) | 0.6% (#10) | -13.3% (#11) |
| Pressure % (allowed / generated) | 25.9% (#9) | 31.2% (#10) | 19.2% (#1) | 30.1% (#15) |

**Podcast picks:**
- ATL +3 — Pat Fitzmaurice, BettingPros — Early NFL BEST BETS & Survivor 
- **BEST BET** Joe Burrow o5.5 rushing_yards — Warren Sharp, Warren Sharp — (41-16, 72%) NFL Week 9 Best B
- CIN@ATL Over 51.5 — BettingPros show (Erickson/Wormeli; turn not attributable from captions), BettingPros — NFL Week 9 Early Picks & Line M
- ATL +3 — BettingPros show (Erickson/Wormeli; turn not attributable from captions), BettingPros — NFL Week 9 Early Picks & Line M
- CIN -3.5 — The Favorites show (Brandon Kravitz & Kendra Middleton; joint contest plays), The Action Network: Sports Betting Picks & Ti
- ATL +3 (1u) — Ross Tucker, Ross Tucker — 2026 NFL Week 9 BETS!
**Podcast leans (not picks):** ATL spread 3.0 (Simon Hunter); OVER first_touchdown 0.5 (Tara Roberts); ATL spread 3.0 (Steve Fezzik)
## DAL @ IND (Sun 10:00 AM PT)

**Market.** DK snapshot IND +6, total 51.5 (2026-11-03T21:00). BEO now: DAL -5.5 (-108), o/u 51.5, TT DAL 29.5 / IND 23.5. ML DAL -240 / IND +200.
**Rest.** DAL 7 days, IND 7 days. **SuperContest:** IND +5.5 · no edge.

| Team | W-L | ATS | O/U | PF/g | PA/g | ypp | opp ypp | TO | pts/drive | Last 3 |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| DAL | 3-5 | 3-4-1 | 6-2-0 | 27.4 | 26.6 | 5.39 | 5.98 | -1 | 2.89 | W6 @GB 13-23 L; W7 @PHI 38-21 W; W8 vARI 30-33 L |
| IND | 2-6 | 4-4-0 | 5-3-0 | 20.1 | 27.8 | 4.45 | 5.82 | -11 | 1.85 | W6 vTEN 20-26 L; W7 @MIN 10-16 W; W8 @JAX 7-42 L |

**DAL QB starts (10+ att):** Dak Prescott W1,2,3,4,5,6,7,8
**DAL usage, last 3 games:**
- QB Dak Prescott: pass att 54/27/29, pass yds 258/212/195, pass td 1/3/1, pass int 2/0/0, rush yds 7/8/20
- RB Javonte Williams: rush car 11/25/24, rush yds 41/155/56, rec 2/0/1, tds total 1/1/0
- RB Tyler Goodson: rush car 2/10/7, rush yds 0/38/14, rec 1/0/2, tds total 0/0/0
- REC CeeDee Lamb: targets 18/12/11, rec 9/5/7, rec yds 70/74/58, tds total 0/2/0
- REC George Pickens: targets 11/6/4, rec 6/4/2, rec yds 73/57/48, tds total 0/1/0
- REC Ryan Flournoy: targets 9/4/4, rec 7/4/3, rec yds 40/70/38, tds total 1/0/1
- DEF Caleb Downs: tackles 12/5/4, sacks 0/0/0
- DEF Shemar James: tackles 5/6/9, sacks 0/0/0
- DEF Quinnen Williams: tackles 3/4/7, sacks 1/1/2

**IND QB starts (10+ att):** Daniel Jones W1,2,3,4,5,6,7,8
**IND usage, last 3 games:**
- QB Daniel Jones: pass att 42/22/28, pass yds 269/108/144, pass td 1/0/1, pass int 2/1/2, rush yds 30/13/7
- RB Jonathan Taylor: rush car 21/18/8, rush yds 94/95/23, rec 2/2/4, tds total 1/1/0
- RB Seth McGowan: rush car 4/11/5, rush yds 27/46/29, rec 0/1/0, tds total 0/0/0
- REC Keenan Allen: targets 11/3/7, rec 8/3/7, rec yds 82/31/67, tds total 0/0/0
- REC Josh Downs: targets 8/4/5, rec 4/2/4, rec yds 40/18/23, tds total 0/0/1
- DEF Akeem Davis-Gaither: tackles 9/7/5, sacks 0/0/0
- DEF A.J. Haulcy: tackles 6/9/3, sacks 0/0/0
- DEF Adetomiwa Adebawore: tackles 4/5/2, sacks 0/2/0
**DAL injuries:** Joey Porter Jr. (CB) QUESTIONABLE (ankle); DeMarvion Overshown (LB) QUESTIONABLE (hamstring/back)
**IND injuries:** none listed Q/D/O

| FTN (season) | Offense | vs defense | Offense | vs defense |
|---|---|---|---|---|
| | **DAL O** | IND D | **IND O** | DAL D |
| DVOA | 11.4% (#8) | 9.5% (#27) | -12.4% (#27) | 14.4% (#29) |
| Rush DVOA | -5.5% (#16) | 3.0% (#30) | 4.5% (#8) | -1.2% (#29) |
| Pressure % (allowed / generated) | 27.0% (#13) | 22.3% (#32) | 26.3% (#11) | 31.5% (#9) |

**Podcast picks:**
- George Pickens o62.5 receiving_yards — Tara Roberts, BettingPros — Top 10 NFL Player Props Picks f
- Ryan Flournoy o35.5 receiving_yards — Andrew Erickson, BettingPros — Top 10 NFL Player Props Picks f
- DAL@IND Under 51.5 — Pat Fitzmaurice, BettingPros — Early NFL BEST BETS & Survivor 
**Podcast leans (not picks):** IND spread 5.5 (Simon Hunter); OVER total 51.5 (Steve Fezzik); DAL spread -6.0 (Ross Tucker)
## NYJ @ KC (Sun 10:00 AM PT)

**Market.** DK snapshot KC -9.5, total 46.5 (2026-11-03T21:00). BEO now: NYJ +10 (-115), o/u 47.5, TT NYJ 17.5 / KC 28.5. ML NYJ +374 / KC -485.
**Rest.** NYJ 7 days, KC 6 days. **SuperContest:** KC -9.5 · KC +0.5.

| Team | W-L | ATS | O/U | PF/g | PA/g | ypp | opp ypp | TO | pts/drive | Last 3 |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| NYJ | 2-6 | 4-3-1 | 4-4-0 | 21.2 | 23.5 | 5.51 | 4.91 | +2 | 2.10 | W6 @NE 19-26 W; W7 vMIA 25-28 L; W8 vLV 33-38 L |
| KC | 5-2 | 3-4-0 | 3-4-0 | 23.9 | 18.7 | 6.29 | 4.94 | +5 | 2.19 | W6 vLAC 22-6 W; W7 @SEA 3-20 L; W8 @DEN 24-28 L |

**NYJ QB starts (10+ att):** Geno Smith W1,2,3,4,5,6,7,8
**NYJ usage, last 3 games:**
- QB Geno Smith: pass att 30/30/32, pass yds 252/287/290, pass td 1/3/2, pass int 1/1/1, rush yds -1/0/4
- RB Braelon Allen: rush car 17/17/21, rush yds 78/104/147, rec 2/6/2, tds total 0/0/1
- RB Isaiah Davis: rush car 7/1/5, rush yds 16/5/15, rec 1/3/0, tds total 0/0/0
- REC Garrett Wilson: targets 6/3/12, rec 4/2/6, rec yds 44/26/83, tds total 0/0/0
- REC Mason Taylor: targets 6/6/5, rec 4/5/3, rec yds 33/62/19, tds total 0/2/0
- REC Omar Cooper Jr.: targets 7/5, rec 6/5, rec yds 103/115, tds total 1/1
- DEF Jamien Sherwood: tackles 11/8/14, sacks 0/0/0
- DEF Dane Belton: tackles 9/9/12, sacks 0/0/0
- DEF Minkah Fitzpatrick: tackles 5/10/9, sacks 0/0/0

**KC QB starts (10+ att):** Patrick Mahomes W1,2,3,4,6,7,8
**KC usage, last 3 games:**
- QB Patrick Mahomes: pass att 30/33/41, pass yds 272/165/321, pass td 0/0/3, pass int 1/1/0, rush yds 16/14/6
- RB Kenneth Walker III: rush car 19/14/21, rush yds 128/36/69, rec 2/4/4, tds total 2/0/0
- REC Travis Kelce: targets 5/8/7, rec 4/4/5, rec yds 53/44/67, tds total 0/0/0
- REC Xavier Worthy: targets 7/6/6, rec 7/3/3, rec yds 73/11/13, tds total 0/0/0
- DEF Nick Bolton: tackles 11/11/9, sacks 0/0/0
- DEF Drue Tranquill: tackles 7/12/5, sacks 0/0/0
- DEF Nohl Williams: tackles 4/10/4, sacks 0/0/0
**NYJ injuries:** none listed Q/D/O
**KC injuries:** none listed Q/D/O

| FTN (season) | Offense | vs defense | Offense | vs defense |
|---|---|---|---|---|
| | **NYJ O** | KC D | **KC O** | NYJ D |
| DVOA | -1.8% (#16) | -3.2% (#13) | 19.6% (#4) | 8.6% (#26) |
| Rush DVOA | -8.6% (#17) | -22.2% (#7) | 4.8% (#7) | -5.4% (#24) |
| Pressure % (allowed / generated) | 23.6% (#4) | 33.8% (#5) | 30.2% (#19) | 23.5% (#28) |

**Podcast picks:**
- NYJ +10 — Brandon Anderson, The Action Network: Sports Betting Picks & Ti
- **BEST BET** NYJ +9.5 — Chad Millman, Sharp or Square — NFL WEEK 9 BETS: Jags-Raven
- NYJ@KC Over 46.5 (1u) — Steve Fezzik, Ross Tucker — 2026 NFL Week 9 BETS!
**Podcast leans (not picks):** KC spread -10.0 (Matt Perrault); NYJ spread 9.5 (The Favorites show (Brandon Kravitz & Kendra Middleton; joint contest plays)); NYJ spread 9.5 (Ross Tucker)
## DET @ MIA (Sun 10:00 AM PT)

**Market.** DK snapshot MIA +7, total 50.5 (2026-11-03T21:00). BEO now: DET -7 (-107), o/u 50.5, TT DET 28.5 / MIA 20.5. ML DET -310 / MIA +252.
**Rest.** DET 7 days, MIA 6 days. **SuperContest:** MIA +7 · no edge.

| Team | W-L | ATS | O/U | PF/g | PA/g | ypp | opp ypp | TO | pts/drive | Last 3 |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| DET | 5-2 | 2-4-1 | 5-2-0 | 29.0 | 25.7 | 5.94 | 5.51 | +3 | 2.79 | W5 @ARI 45-21 W; W7 vGB 20-17 L; W8 vMIN 19-15 W |
| MIA | 1-6 | 4-3-0 | 4-3-0 | 16.7 | 25.9 | 5.13 | 5.84 | -3 | 1.78 | W5 vCIN 24-31 W; W7 @NYJ 28-25 W; W8 vNE 19-24 W |

**DET QB starts (10+ att):** Jared Goff W1,2,3,4,5,7,8
**DET usage, last 3 games:**
- QB Jared Goff: pass att 30/32/25, pass yds 271/303/176, pass td 3/2/1, pass int 0/0/1, rush yds 1/-1/0
- RB Jahmyr Gibbs: rush car 25/29/23, rush yds 151/116/153, rec 5/5/2, tds total 1/0/1
- RB Sione Vaki: rush car 6/1/11, rush yds 11/5/65, rec 0/0/1, tds total 0/0/0
- REC Amon-Ra St. Brown: targets 11/11/8, rec 6/9/7, rec yds 69/153/46, tds total 0/0/0
- REC Jameson Williams: targets 4/9/6, rec 2/5/4, rec yds 47/91/70, tds total 2/2/1
- DEF Jack Campbell: tackles 11/11/3, sacks 0/0/0
- DEF Chuck Clark: tackles 7/5/3, sacks 0/0/0
- DEF Roger McCreary: tackles 6/4/4, sacks 0/0/0

**MIA QB starts (10+ att):** Malik Willis W1,2,3,4,5,7,8
**MIA usage, last 3 games:**
- QB Malik Willis: pass att 27/21/32, pass yds 137/208/211, pass td 1/2/2, pass int 2/0/1, rush yds 74/37/2
- RB Ollie Gordon II: rush car 18/25/19, rush yds 88/103/69, rec 0/1/0, tds total 1/1/0
- RB Jaylen Wright: rush car 6/6/2, rush yds 11/8/5, rec 0/0/0, tds total 0/0/0
- REC Malik Washington: targets 8/3/6, rec 6/3/5, rec yds 43/27/40, tds total 0/0/1
- REC Greg Dulcich: targets 5/5/6, rec 4/5/4, rec yds 37/86/43, tds total 0/0/0
- REC Chris Bell: targets 2/4/6, rec 0/3/4, rec yds 0/25/31, tds total 0/0/0
- DEF Jordyn Brooks: tackles 8/9/11, sacks 0/0/0
- DEF Jacob Rodriguez: tackles 11/4/8, sacks 0/0/0
- DEF Dante Trader Jr.: tackles 7/7/4, sacks 0/0/0
**DET injuries:** none listed Q/D/O
**MIA injuries:** Kaytron Allen (RB) QUESTIONABLE (quadriceps)

| FTN (season) | Offense | vs defense | Offense | vs defense |
|---|---|---|---|---|
| | **DET O** | MIA D | **MIA O** | DET D |
| DVOA | 12.1% (#7) | 13.9% (#28) | -10.9% (#25) | 8.3% (#25) |
| Rush DVOA | 8.4% (#4) | -2.0% (#26) | -16.9% (#25) | -8.0% (#21) |
| Pressure % (allowed / generated) | 24.2% (#5) | 26.7% (#26) | 36.0% (#28) | 30.9% (#13) |

**Podcast picks:**
- MIA +7 — Chad Millman, The Volume — SHARP NFL Week 9 Bets: Giants-Ea
- Greg Dulcich o3.5 receptions — Brandon Anderson, The Action Network: Sports Betting Picks & Ti
- Jahmyr Gibbs o3.5 receptions — Brandon Anderson, The Action Network: Sports Betting Picks & Ti
- Caleb Douglas o38.5 receiving_yards — Tara Roberts, BettingPros — Top 10 NFL Player Props Picks f
- Sam LaPorta o42.5 receiving_yards — Rich Hribar, Warren Sharp — (41-16, 72%) NFL Week 9 Best B
- MIA +7 (1u) — Steve Fezzik, Ross Tucker — 2026 NFL Week 9 BETS!
- **BEST BET** MIA +7 (2u) — Ross Tucker, Ross Tucker — 2026 NFL Week 9 BETS!
**Podcast leans (not picks):** OVER anytime_touchdown 0.5 (Andrew Erickson); MIA spread 7.5 (Sharp or Square (Chad Millman; turn not named from captions))
## CLE @ NO (Sun 10:00 AM PT)

**Market.** DK snapshot NO -1.5, total 42.5 (2026-11-03T21:00). BEO now: CLE +3 (-104), o/u 42.5, TT CLE 20.5 / NO 23.5. ML CLE +147 / NO -167.
**Rest.** CLE 7 days, NO 14 days. Off a bye. **SuperContest:** NO -3 · no edge.

| Team | W-L | ATS | O/U | PF/g | PA/g | ypp | opp ypp | TO | pts/drive | Last 3 |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| CLE | 5-3 | 5-3-0 | 4-4-0 | 17.4 | 21.6 | 5.00 | 5.19 | -1 | 1.47 | W6 vBAL 13-10 W; W7 @TEN 27-24 W; W8 @PIT 6-27 L |
| NO | 2-5 | 3-4-0 | 4-3-0 | 23.1 | 27.7 | 4.71 | 5.83 | -4 | 2.13 | W5 vMIN 13-23 L; W6 @NYG 34-27 W; W7 vPIT 10-16 L |

**CLE QB starts (10+ att):** Deshaun Watson W1,2,3,4,5,6,7,8
**CLE usage, last 3 games:**
- QB Deshaun Watson: pass att 26/36/39, pass yds 164/308/324, pass td 0/0/0, pass int 0/1/0, rush yds 29/19/2
- RB Quinshon Judkins: rush car 17/11, rush yds 96/25, rec 1/2, tds total 2/0
- RB Jaleel McLaughlin: rush car 9/0, rush yds 41/0, rec 4/0, tds total 0/0
- REC Denzel Boston: targets 5/8/12, rec 1/3/6, rec yds 15/27/37, tds total 0/0/0
- REC Harold Fannin Jr.: targets 3/9/12, rec 1/6/10, rec yds 9/91/154, tds total 0/0/0
- REC KC Concepcion: targets 6/10/4, rec 4/8/3, rec yds 37/129/37, tds total 0/0/0
- DEF Carson Schwesinger: tackles 13/8/10, sacks 0/0/0
- DEF Ronnie Hickman: tackles 5/10/7, sacks 0/0/0
- DEF Quincy Williams: tackles 6/10/5, sacks 1/0/0

**NO QB starts (10+ att):** Tyler Shough W1,2,3,4,5,6,7
**NO usage, last 3 games:**
- QB Tyler Shough: pass att 25/30/38, pass yds 96/144/278, pass td 0/3/1, pass int 2/0/1, rush yds 0/32/7
- RB Kendre Miller: rush car 10/20/8, rush yds 30/70/6, rec 0/2/3, tds total 1/0/0
- RB Alvin Kamara: rush car 3/7/6, rush yds 12/34/5, rec 2/2/7, tds total 0/1/0
- REC Chris Olave: targets 6/7/10, rec 4/4/6, rec yds 46/43/56, tds total 0/1/0
- REC Devaughn Vele: targets 6/6/5, rec 4/3/5, rec yds 26/42/54, tds total 0/0/1
- DEF Pete Werner: tackles 10/11/8, sacks 0/1/0
- DEF Jonas Sanker: tackles 7/2/9, sacks 0/0/0
- DEF Justin Reid: tackles 10/4/4, sacks 0/0/0
**CLE injuries:** none listed Q/D/O
**NO injuries:** none listed Q/D/O

| FTN (season) | Offense | vs defense | Offense | vs defense |
|---|---|---|---|---|
| | **CLE O** | NO D | **NO O** | CLE D |
| DVOA | -14.7% (#29) | 16.1% (#31) | -12.5% (#28) | -6.5% (#11) |
| Rush DVOA | -16.9% (#26) | 9.8% (#32) | -23.7% (#30) | -7.5% (#22) |
| Pressure % (allowed / generated) | 36.5% (#29) | 22.8% (#29) | 28.9% (#17) | 31.1% (#12) |

**Podcast picks:**
- NO -3.5 — BettingPros show (Erickson/Wormeli; turn not attributable from captions), BettingPros — NFL Week 9 Early Picks & Line M
- CLE@NO Under (line not stated) — BettingPros show (Erickson/Wormeli; turn not attributable from captions), BettingPros — NFL Week 9 Early Picks & Line M
- CLE teaser leg (2u) — Steve Fezzik, Ross Tucker — 2026 NFL Week 9 BETS!
- CLE teaser leg (2u) — Ross Tucker, Ross Tucker — 2026 NFL Week 9 BETS!
## NYG @ PHI (Sun 10:00 AM PT)

**Market.** DK snapshot PHI +3.5, total 39.5 (2026-11-03T21:00). BEO now: NYG -3 (-118), o/u 38.5, TT NYG 21.5 / PHI 18.5. ML NYG -175 / PHI +153.
**Rest.** NYG 14 days, PHI 6 days. Off a bye. **SuperContest:** PHI +3.5 · PHI +0.5.

| Team | W-L | ATS | O/U | PF/g | PA/g | ypp | opp ypp | TO | pts/drive | Last 3 |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| NYG | 4-2-1 | 5-2-0 | 5-2-0 | 23.3 | 23.0 | 5.17 | 5.29 | -2 | 2.13 | W5 @WAS 27-27 W; W6 vNO 27-34 L; W7 @HOU 27-21 W |
| PHI | 2-6 | 2-6-0 | 4-4-0 | 17.1 | 25.2 | 4.45 | 5.58 | -4 | 1.66 | W6 vCAR 14-25 L; W7 vDAL 21-38 L; W8 @WAS 10-27 L |

**NYG QB starts (10+ att):** Jaxson Dart W1; Jameis Winston W2,3,4,5,6; J.J. McCarthy W6,7
**NYG usage, last 3 games:**
- QB J.J. McCarthy: pass att 0/21/28, pass yds 0/243/252, pass td 0/1/0, pass int 0/1/0, rush yds 2/26/1
- RB Cam Skattebo: rush car 13/17, rush yds 59/124, rec 2/1, tds total 0/1
- RB Tyrone Tracy Jr.: rush car 3/6/6, rush yds 6/18/15, rec 2/2/1, tds total 0/2/1
- REC Malik Nabers: targets 20/15/9, rec 11/12/7, rec yds 121/165/111, tds total 1/0/0
- REC Isaiah Likely: targets 13/11/4, rec 11/6/2, rec yds 94/99/12, tds total 2/1/0
- REC Malachi Fields: targets 2/8/5, rec 2/2/4, rec yds 20/19/83, tds total 0/0/0
- DEF Arvell Reese: tackles 9/6/7, sacks 1/0/0
- DEF Tremaine Edmunds: tackles 9/9, sacks 1/0
- DEF Ar'Darius Washington: tackles 3/5/7, sacks 0/0/0

**PHI QB starts (10+ att):** Jalen Hurts W1,2,3,4,5; Tanner McKee W6,7,8
**PHI usage, last 3 games:**
- QB Tanner McKee: pass att 45/35/34, pass yds 215/211/212, pass td 1/1/0, pass int 0/1/1, rush yds 0/1/25
- RB Dameon Pierce: rush car 12/14, rush yds 35/47, rec 4/1, tds total 1/1
- RB Saquon Barkley: rush car 7/13, rush yds 62/30, rec 2/1, tds total 1/1
- REC Makai Lemon: targets 6/8/9, rec 3/7/6, rec yds 19/67/57, tds total 0/1/0
- REC Dallas Goedert: targets 8/7/4, rec 6/5/4, rec yds 61/48/30, tds total 0/0/0
- REC DeVonta Smith: targets 14, rec 7, rec yds 75, tds total 1
- DEF Andrew Mukuba: tackles 8/7/9, sacks 0/0/0
- DEF Zack Baun: tackles 6/9/7, sacks 0/0/0
- DEF Jeremiah Trotter Jr.: tackles 6/5/10, sacks 0/0/0
**NYG injuries:** none listed Q/D/O
**PHI injuries:** none listed Q/D/O

| FTN (season) | Offense | vs defense | Offense | vs defense |
|---|---|---|---|---|
| | **NYG O** | PHI D | **PHI O** | NYG D |
| DVOA | -10.2% (#24) | 6.8% (#23) | -17.8% (#31) | 4.2% (#21) |
| Rush DVOA | -10.8% (#19) | -2.9% (#25) | -16.3% (#23) | -8.6% (#19) |
| Pressure % (allowed / generated) | 29.3% (#18) | 27.7% (#24) | 36.6% (#30) | 28.6% (#17) |

**Podcast picks:**
- NYG -2.5 — BettingPros show (Erickson/Wormeli; turn not attributable from captions), BettingPros — NFL Week 9 Early Picks & Line M
- PHI +3.5 (1u) — Steve Fezzik, Ross Tucker — 2026 NFL Week 9 BETS!
**Podcast leans (not picks):** PHI spread 3.5 (Brandon Anderson); PHI spread (Sharp or Square (Simon Hunter; turn not named from captions)); PHI spread 3.5 (Ross Tucker)
## LAR @ WAS (Sun 10:00 AM PT)

**Market.** DK snapshot WAS +5.5, total 47.5 (2026-11-03T21:00). BEO now: LAR -4.5 (-110), o/u 48.5, TT LAR 26.5 / WAS 20.5. ML LAR -225 / WAS +189.
**Rest.** LAR 6 days, WAS 6 days. **SuperContest:** WAS +5.5 · WAS +1.

| Team | W-L | ATS | O/U | PF/g | PA/g | ypp | opp ypp | TO | pts/drive | Last 3 |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| LAR | 4-4 | 3-5-0 | 4-4-0 | 24.2 | 21.0 | 5.79 | 4.93 | -4 | 2.19 | W6 vARI 16-18 L; W7 @LV 35-21 W; W8 vLAC 24-9 W |
| WAS | 2-4-1 | 4-3-0 | 4-3-0 | 22.7 | 26.0 | 5.24 | 5.40 | +7 | 1.99 | W5 vNYG 27-27 L; W6 @SF 17-23 W; W8 vPHI 27-10 W |

**LAR QB starts (10+ att):** Matthew Stafford W1,2,3,4,5,6,7,8
**LAR usage, last 3 games:**
- QB Matthew Stafford: pass att 33/29/25, pass yds 222/195/157, pass td 2/3/1, pass int 0/1/1, rush yds 0/-3/0
- RB Kyren Williams: rush car 10/16/16, rush yds 50/99/56, rec 3/2/1, tds total 0/1/1
- RB Blake Corum: rush car 9/17/11, rush yds 42/93/73, rec 2/1/0, tds total 1/1/1
- REC Puka Nacua: targets 7/10/12, rec 6/8/11, rec yds 80/68/80, tds total 0/1/1
- REC Colby Parkinson: targets 6/6, rec 5/5, rec yds 31/48, tds total 1/0
- DEF Quentin Lake: tackles 7/7/7, sacks 0/0/0
- DEF Nate Landman: tackles 10/8, sacks 0/0
- DEF Josh Wallace: tackles 8/6/4, sacks 0/0/0

**WAS QB starts (10+ att):** Jayden Daniels W1,2,5,6,8; Marcus Mariota W2,3; Athan Kaliakmanis W4
**WAS usage, last 3 games:**
- QB Jayden Daniels: pass att 25/40/29, pass yds 199/300/217, pass td 0/2/1, pass int 0/0/0, rush yds 103/10/23
- RB Rachaad White: rush car 7/7/11, rush yds 18/27/55, rec 1/4/2, tds total 0/1/1
- RB Austin Ekeler: rush car 3/1/8, rush yds -1/3/36, rec 1/2/0, tds total 0/0/0
- REC Chig Okonkwo: targets 6/7/4, rec 4/7/2, rec yds 60/69/32, tds total 0/0/0
- REC Treylon Burks: targets 5/6/5, rec 2/4/3, rec yds 26/66/81, tds total 0/0/0
- REC Antonio Williams: targets 3/4/7, rec 3/3/5, rec yds 31/50/54, tds total 0/0/0
- DEF Sonny Styles: tackles 13/13/8, sacks 0/0/0
- DEF Frankie Luvu: tackles 9/8/8, sacks 0/0/0
- DEF Amik Robertson: tackles 7/7/6, sacks 0/0/0
**LAR injuries:** none listed Q/D/O
**WAS injuries:** none listed Q/D/O

| FTN (season) | Offense | vs defense | Offense | vs defense |
|---|---|---|---|---|
| | **LAR O** | WAS D | **WAS O** | LAR D |
| DVOA | 13.5% (#6) | 2.5% (#19) | -6.9% (#19) | -14.1% (#5) |
| Rush DVOA | 11.2% (#3) | -14.5% (#9) | -15.0% (#22) | -25.1% (#3) |
| Pressure % (allowed / generated) | 23.5% (#3) | 28.7% (#16) | 35.6% (#27) | 27.8% (#23) |

**Podcast picks:**
- WAS +5.5 — BettingPros show (Erickson/Wormeli; turn not attributable from captions), BettingPros — NFL Week 9 Early Picks & Line M
- LAR@WAS Under 47.5 — BettingPros show (Erickson/Wormeli; turn not attributable from captions), BettingPros — NFL Week 9 Early Picks & Line M
- LAR -5.5 — Simon Hunter, Sharp or Square — NFL WEEK 9 BETS: Jags-Raven
- WAS +5.5 (2u) — Ross Tucker, Ross Tucker — 2026 NFL Week 9 BETS!
**Podcast leans (not picks):** WAS spread 5.5 (Brandon Anderson); WAS spread 5.5 (The Favorites show (Brandon Kravitz & Kendra Middleton; joint contest plays)); WAS spread 5.5 (Steve Fezzik)
## DEN @ CAR (Sun 10:00 AM PT)

**Market.** DK snapshot CAR +2.5, total 43.5 (2026-11-03T21:00). BEO now: DEN -2.5 (-115), o/u 44, TT DEN 23.5 / CAR 20.5. ML DEN -143 / CAR +123.
**Rest.** DEN 6 days, CAR 9 days. **SuperContest:** CAR +2.5 · no edge.

| Team | W-L | ATS | O/U | PF/g | PA/g | ypp | opp ypp | TO | pts/drive | Last 3 |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| DEN | 6-2 | 6-2-0 | 3-5-0 | 21.5 | 20.6 | 4.74 | 5.13 | +4 | 1.97 | W6 vSEA 17-14 W; W7 @ARI 30-16 W; W8 vKC 28-24 W |
| CAR | 3-4 | 3-4-0 | 3-4-0 | 25.4 | 27.6 | 5.50 | 5.31 | +0 | 2.21 | W6 @PHI 25-14 W; W7 vTB 13-43 L; W8 @GB 19-27 L |

**DEN QB starts (10+ att):** Bo Nix W1,2,3,4,5,6,7,8
**DEN usage, last 3 games:**
- QB Bo Nix: pass att 27/29/32, pass yds 107/222/222, pass td 0/1/2, pass int 0/0/0, rush yds 2/73/4
- RB J.K. Dobbins: rush car 17/6/7, rush yds 41/23/13, rec 3/0/0, tds total 1/1/0
- RB Jonah Coleman: rush car 9/11, rush yds 54/41, rec 2/4, tds total 0/1
- REC Jaylen Waddle: targets 7/7/6, rec 4/4/3, rec yds 24/48/39, tds total 0/0/1
- REC Courtland Sutton: targets 3/5/4, rec 2/3/4, rec yds 19/45/53, tds total 0/0/0
- REC Marvin Mims Jr.: targets 4/2/3, rec 2/2/2, rec yds 13/53/10, tds total 0/0/0
- DEF Alex Singleton: tackles 13/19/14, sacks 0/1/1
- DEF Brandon Jones: tackles 8/9/3, sacks 0/0/0
- DEF Taylor Rapp: tackles 6/2/6, sacks 0/0/0

**CAR QB starts (10+ att):** Bryce Young W1,2,3,4,6,7,8
**CAR usage, last 3 games:**
- QB Bryce Young: pass att 39/27/41, pass yds 281/163/209, pass td 2/1/1, pass int 0/2/1, rush yds 6/9/0
- RB Chuba Hubbard: rush car 28/7/22, rush yds 120/33/81, rec 1/4/7, tds total 1/0/1
- RB Trevor Etienne: rush car 1/6/1, rush yds -1/8/1, rec 0/2/0, tds total 0/0/0
- REC Tetairoa McMillan: targets 9/6/11, rec 6/4/6, rec yds 86/40/58, tds total 0/0/0
- REC Jalen Coker: targets 13/4/5, rec 6/1/2, rec yds 97/9/36, tds total 0/0/1
- DEF Bobby Okereke: tackles 8/10/5, sacks 1/0/0
- DEF Nick Scott: tackles 6/7/5, sacks 0/0/0
- DEF Will Lee III: tackles 6/5/4, sacks 0/0/0
**DEN injuries:** Eyioma Uwazurike (DE) OUT (shoulder); Brandon Jones (S) OUT (hamstring); Talanoa Hufanga (S) QUESTIONABLE (ankle)
**CAR injuries:** none listed Q/D/O

| FTN (season) | Offense | vs defense | Offense | vs defense |
|---|---|---|---|---|
| | **DEN O** | CAR D | **CAR O** | DEN D |
| DVOA | -1.8% (#17) | 4.0% (#20) | 1.4% (#14) | -8.3% (#10) |
| Rush DVOA | -1.6% (#13) | -6.3% (#23) | -1.2% (#11) | -11.5% (#14) |
| Pressure % (allowed / generated) | 27.0% (#14) | 27.6% (#25) | 33.6% (#23) | 33.2% (#7) |

**Podcast picks:**
- **BEST BET** CAR +3 — Simon Hunter, The Volume — SHARP NFL Week 9 Bets: Giants-Ea
- Tetairoa McMillan u5.5 receptions — Tara Roberts, BettingPros — Top 10 NFL Player Props Picks f
- DEN -2.5 — Matt Perrault, BettingPros — Early NFL BEST BETS & Survivor 
- Jonah Coleman o52.5 rushing_yards — Rich Hribar, Warren Sharp — (41-16, 72%) NFL Week 9 Best B
- CAR +3 — BettingPros show (Erickson/Wormeli; turn not attributable from captions), BettingPros — NFL Week 9 Early Picks & Line M
- DEN@CAR Under 43.5 — BettingPros show (Erickson/Wormeli; turn not attributable from captions), BettingPros — NFL Week 9 Early Picks & Line M
- **BEST BET** CAR +2.5 — Simon Hunter, Sharp or Square — NFL WEEK 9 BETS: Jags-Raven
- CAR +2.5 — The Favorites show (Brandon Kravitz & Kendra Middleton; joint contest plays), The Action Network: Sports Betting Picks & Ti
- CAR teaser leg (2u) — Steve Fezzik, Ross Tucker — 2026 NFL Week 9 BETS!
- CAR teaser leg (2u) — Ross Tucker, Ross Tucker — 2026 NFL Week 9 BETS!
**Podcast leans (not picks):** OVER anytime_touchdown 0.5 (Tara Roberts)
## HOU @ LAC (Sun 01:05 PM PT)

**Market.** DK snapshot LAC +4.5, total 40.5 (2026-11-03T21:00). BEO now: HOU -5.5 (-110), o/u 40.5, TT HOU 22.5 / LAC 17.5. ML HOU -245 / LAC +203.
**Rest.** HOU 14 days, LAC 7 days. Off a bye. **SuperContest:** LAC +4.5 · HOU +1.

| Team | W-L | ATS | O/U | PF/g | PA/g | ypp | opp ypp | TO | pts/drive | Last 3 |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| HOU | 2-5 | 2-5-0 | 4-3-0 | 23.6 | 24.3 | 5.54 | 5.41 | +3 | 2.26 | W5 @TEN 26-3 W; W6 @JAX 34-31 W; W7 vNYG 21-27 L |
| LAC | 0-7 | 0-6-1 | 1-6-0 | 14.1 | 25.0 | 4.71 | 5.39 | -6 | 1.19 | W5 vDEN 17-23 L; W6 @KC 6-22 L; W8 @LAR 9-24 L |

**HOU QB starts (10+ att):** C.J. Stroud W1,2,3,4,5,6,7
**HOU usage, last 3 games:**
- QB C.J. Stroud: pass att 34/34/28, pass yds 261/312/153, pass td 1/3/2, pass int 0/1/0, rush yds 5/5/4
- RB Woody Marks: rush car 15/15/19, rush yds 62/56/66, rec 4/2/1, tds total 0/0/0
- RB Jawhar Jordan: rush car 6, rush yds 43, rec 1, tds total 1
- REC Nico Collins: targets 7/5/5, rec 5/3/2, rec yds 56/74/6, tds total 0/0/0
- REC Dalton Schultz: targets 4/6/6, rec 3/4/5, rec yds 30/33/45, tds total 0/0/0
- REC Xavier Hutchinson: targets 5/3/6, rec 4/2/3, rec yds 65/10/17, tds total 0/0/1
- DEF Azeez Al-Shaair: tackles 11/7/9, sacks 0/0/0
- DEF Kamari Lassiter: tackles 4/8/8, sacks 0/0/1
- DEF Tommy Togiai: tackles 8/6/3, sacks 0/0/0

**LAC QB starts (10+ att):** Justin Herbert W1,2,3,4,5,6,8
**LAC usage, last 3 games:**
- QB Justin Herbert: pass att 24/37/32, pass yds 121/204/257, pass td 1/0/0, pass int 1/1/2, rush yds 54/26/15
- RB Omarion Hampton: rush car 14/7/9, rush yds 33/18/20, rec 1/4/2, tds total 0/0/0
- RB Kimani Vidal: rush car 8/7/8, rush yds 57/21/23, rec 1/3/2, tds total 1/0/0
- REC Charlie Kolar: targets 4/6/4, rec 3/3/1, rec yds 37/20/20, tds total 0/0/0
- REC Oronde Gadsden: targets 1/5/5, rec 0/3/5, rec yds 0/17/52, tds total 0/0/0
- REC KeAndre Lambert-Smith: targets 9/0, rec 5/0, rec yds 32/0, tds total 0/0
- DEF Tony Jefferson: tackles 5/5/7, sacks 0/0/0
- DEF Tarheeb Still: tackles 5/8/3, sacks 0/0/0
- DEF Elijah Molden: tackles 7/7/1, sacks 0/0/0
**HOU injuries:** none listed Q/D/O
**LAC injuries:** Deane Leonard (CB) OUT; Kendall Williamson (S) OUT; Kayode Awosika (G) DOUBTFUL; Brenen Thompson (WR) DOUBTFUL (quadriceps/hamstring)

| FTN (season) | Offense | vs defense | Offense | vs defense |
|---|---|---|---|---|
| | **HOU O** | LAC D | **LAC O** | HOU D |
| DVOA | 7.7% (#9) | 1.4% (#17) | -29.7% (#32) | 2.2% (#18) |
| Rush DVOA | -16.3% (#24) | -1.6% (#27) | -18.4% (#28) | -10.7% (#17) |
| Pressure % (allowed / generated) | 24.5% (#7) | 28.4% (#18) | 37.6% (#32) | 28.0% (#21) |

**Podcast picks:**
- LAC futures UNDER 4.5 — Steve Fezzik, Ross Tucker — 2026 NFL Week 9 PROP BETS & PAR
- HOU -4.5 — Brandon Anderson, The Action Network: Sports Betting Picks & Ti
- HOU -4.5 — BettingPros show (Erickson/Wormeli; turn not attributable from captions), BettingPros — NFL Week 9 Early Picks & Line M
- HOU@LAC Under 41.5 — BettingPros show (Erickson/Wormeli; turn not attributable from captions), BettingPros — NFL Week 9 Early Picks & Line M
- HOU@LAC Under 40.5 (2u) — Steve Fezzik, Ross Tucker — 2026 NFL Week 9 BETS!
**Podcast leans (not picks):** HOU spread -4.5 (Steve Fezzik + Ross Tucker)
## GB @ NE (Sun 01:25 PM PT)

**Market.** DK snapshot NE -3, total 46.5 (2026-11-03T21:00). BEO now: GB +3 (-103), o/u 45, TT GB 22.5 / NE 24.5. ML GB +149 / NE -170.
**Rest.** GB 9 days, NE 7 days. **SuperContest:** NE -3 · no edge.

| Team | W-L | ATS | O/U | PF/g | PA/g | ypp | opp ypp | TO | pts/drive | Last 3 |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| GB | 5-3 | 5-3-0 | 2-6-0 | 21.4 | 20.5 | 5.34 | 4.73 | +4 | 1.90 | W6 vDAL 23-13 W; W7 @DET 17-20 W; W8 vCAR 27-19 W |
| NE | 5-3 | 3-4-1 | 5-3-0 | 23.0 | 20.2 | 5.96 | 5.29 | -7 | 2.12 | W6 vNYJ 26-19 L; W7 @CHI 24-30 L; W8 @MIA 24-19 L |

**GB QB starts (10+ att):** Jordan Love W1,2,3,4,5,6,7,8
**GB usage, last 3 games:**
- QB Jordan Love: pass att 41/45/41, pass yds 276/274/288, pass td 1/2/3, pass int 1/1/1, rush yds 12/0/0
- RB Josh Jacobs: rush car 11/21, rush yds 36/39, rec 5/6, tds total 1/2
- RB MarShawn Lloyd: rush car 8/6/3, rush yds 10/20/7, rec 0/2/1, tds total 0/0/0
- REC Matthew Golden: targets 13/12/13, rec 6/6/7, rec yds 104/39/79, tds total 1/0/1
- REC Christian Watson: targets 8/8/10, rec 3/5/8, rec yds 64/57/113, tds total 0/0/0
- REC Tucker Kraft: targets 8/6/6, rec 5/4/6, rec yds 37/48/53, tds total 0/1/1
- DEF Isaiah McDuffie: tackles 5/11/10, sacks 0/0/0
- DEF Evan Williams: tackles 6/9/10, sacks 0/0/0
- DEF Ty'Ron Hopper: tackles 5/7/8, sacks 0/0/1

**NE QB starts (10+ att):** Drake Maye W1,2,3,4,5,6,7,8
**NE usage, last 3 games:**
- QB Drake Maye: pass att 32/31/20, pass yds 235/321/199, pass td 3/2/2, pass int 0/1/0, rush yds 24/26/5
- RB Rhamondre Stevenson: rush car 14/6/19, rush yds 36/22/82, rec 0/5/3, tds total 0/1/0
- RB Corey Kiner: rush car 11/4/7, rush yds 57/13/38, rec 0/0/0, tds total 0/0/0
- REC A.J. Brown: targets 10/6, rec 3/3, rec yds 27/48, tds total 0/0
- REC DeMario Douglas: targets 8/4/3, rec 7/3/3, rec yds 86/23/76, tds total 1/0/1
- REC Hunter Henry: targets 5/7/3, rec 4/7/3, rec yds 48/71/30, tds total 1/0/0
- DEF Christian Elliss: tackles 6/13/9, sacks 0/0/0
- DEF Marcus Jones: tackles 8/9/5, sacks 0/1/0
- DEF Kevin Byard: tackles 7/7/7, sacks 0/0/0
**GB injuries:** Zaire Franklin (LB) OUT (shin); Josh Whyle (TE) OUT (concussion); Keisean Nixon (CB) QUESTIONABLE (groin)
**NE injuries:** none listed Q/D/O

| FTN (season) | Offense | vs defense | Offense | vs defense |
|---|---|---|---|---|
| | **GB O** | NE D | **NE O** | GB D |
| DVOA | -8.8% (#20) | -6.3% (#12) | 4.6% (#11) | -14.8% (#4) |
| Rush DVOA | -31.5% (#32) | -11.2% (#15) | -12.0% (#20) | -11.0% (#16) |
| Pressure % (allowed / generated) | 27.4% (#15) | 33.3% (#6) | 31.1% (#21) | 28.4% (#19) |

**Podcast picks:**
- Jordan Love o1.5 passing_touchdowns — Andrew Erickson, BettingPros — Top 10 NFL Player Props Picks f
- GB@NE Under 47.5 — Andrew Erickson, BettingPros — NFL Week 9 Early Picks & Line M
- NE -2.5 — The Favorites show (Brandon Kravitz & Kendra Middleton; joint contest plays), The Action Network: Sports Betting Picks & Ti
- GB@NE Over 46.5 (2u) — Steve Fezzik, Ross Tucker — 2026 NFL Week 9 BETS!
- GB teaser leg (2u) — Ross Tucker, Ross Tucker — 2026 NFL Week 9 BETS!
**Podcast leans (not picks):** NE spread -3.5 (Simon Hunter); GB spread 3.0 (Joe Gibbs); OVER total 45.5 (Joe Gibbs); NE spread -2.5 (Chad Millman + Simon Hunter)
## LV @ SF (Sun 01:25 PM PT)

**Market.** DK snapshot SF -10, total 52.5 (2026-11-03T21:00). BEO now: LV +10 (-110), o/u 52, TT LV 20.5 / SF 30.5. ML LV +358 / SF -460.
**Rest.** LV 7 days, SF 14 days. Off a bye. **SuperContest:** SF -9.5 · SF +0.5.

| Team | W-L | ATS | O/U | PF/g | PA/g | ypp | opp ypp | TO | pts/drive | Last 3 |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| LV | 4-4 | 6-2-0 | 6-2-0 | 27.6 | 28.8 | 5.39 | 6.10 | +5 | 2.44 | W6 vBUF 30-33 W; W7 vLAR 21-35 L; W8 @NYJ 38-33 W |
| SF | 6-1 | 4-3-0 | 3-4-0 | 28.1 | 19.9 | 6.44 | 4.76 | -3 | 2.91 | W5 @SEA 32-29 W; W6 vWAS 23-17 L; W7 @ATL 20-29 L |

**LV QB starts (10+ att):** Kirk Cousins W1,2,3,4,5,6,7,8
**LV usage, last 3 games:**
- QB Kirk Cousins: pass att 41/44/26, pass yds 313/295/247, pass td 2/2/3, pass int 1/0/0, rush yds 0/6/3
- RB Mike Washington Jr.: rush car 9/6/25, rush yds 43/27/83, rec 1/0/0, tds total 0/0/0
- RB Ashton Jeanty: rush car 10/8/2, rush yds 22/15/9, rec 4/8/3, tds total 1/1/0
- REC Brock Bowers: targets 9/8/10, rec 4/6/7, rec yds 70/73/92, tds total 0/0/2
- REC Tre Tucker: targets 7/12/1, rec 5/5/0, rec yds 97/103/0, tds total 2/1/0
- DEF Nakobe Dean: tackles 12/12/12, sacks 0/0/0
- DEF Jeremy Chinn: tackles 10/7/10, sacks 0/0/0
- DEF Quay Walker: tackles 6/12/9, sacks 1/0/0

**SF QB starts (10+ att):** Brock Purdy W1,2,3,4,5,6,7
**SF usage, last 3 games:**
- QB Brock Purdy: pass att 29/29/40, pass yds 189/264/288, pass td 2/1/1, pass int 1/0/2, rush yds 6/28/5
- RB Christian McCaffrey: rush car 11/16/7, rush yds 68/64/39, rec 3/9/6, tds total 1/2/1
- RB Kaelon Black: rush car 6/8/12, rush yds 16/34/63, rec 0/1/1, tds total 0/0/1
- REC George Kittle: targets 6/8/10, rec 5/5/8, rec yds 24/69/88, tds total 0/1/0
- REC Mike Evans: targets 10/5, rec 7/3, rec yds 113/94, tds total 1/0
- DEF Fred Warner: tackles 10/8/13, sacks 0/0/0
- DEF Jaden Dugger: tackles 9/11/2, sacks 1/0/0
- DEF Malik Mustapha: tackles 7/4/8, sacks 0/0/0
**LV injuries:** Thomas Booker IV (DT) OUT; Darien Porter (CB) QUESTIONABLE (groin)
**SF injuries:** none listed Q/D/O

| FTN (season) | Offense | vs defense | Offense | vs defense |
|---|---|---|---|---|
| | **LV O** | SF D | **SF O** | LV D |
| DVOA | 1.6% (#13) | -10.1% (#8) | 27.9% (#1) | 15.1% (#30) |
| Rush DVOA | -24.8% (#31) | -22.9% (#6) | 5.9% (#5) | 8.2% (#31) |
| Pressure % (allowed / generated) | 32.2% (#22) | 27.9% (#22) | 22.6% (#2) | 34.6% (#4) |

**Podcast picks:**
- Mike Washington u10.5 rushing_attempts — Tara Roberts, BettingPros — Top 10 NFL Player Props Picks f
- Ashton Jeanty o35.5 receiving_yards — Andrew Erickson, BettingPros — Top 10 NFL Player Props Picks f
- SF survivor SF — Pat Fitzmaurice, BettingPros — Early NFL BEST BETS & Survivor 
- LV@SF Over 51.5 — BettingPros show (Erickson/Wormeli; turn not attributable from captions), BettingPros — NFL Week 9 Early Picks & Line M
- LV +10 (1u) — Ross Tucker, Ross Tucker — 2026 NFL Week 9 BETS!
**Podcast leans (not picks):** OVER total 51.5 (Steve Fezzik)
## ARI @ SEA (Sun 01:25 PM PT)

**Market.** DK snapshot SEA -10.5, total 41.5 (2026-11-03T21:00). BEO now: ARI +8.5 (-108), o/u 39.5, TT ARI 14.5 / SEA 23.5. ML ARI +310 / SEA -390.
**Rest.** ARI 7 days, SEA 5 days. **SuperContest:** SEA -12.5 · ARI +4.

| Team | W-L | ATS | O/U | PF/g | PA/g | ypp | opp ypp | TO | pts/drive | Last 3 |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| ARI | 3-5 | 4-4-0 | 5-3-0 | 21.9 | 29.8 | 4.70 | 5.83 | +0 | 1.93 | W6 @LAR 18-16 W; W7 vDEN 16-30 L; W8 @DAL 33-30 W |
| SEA | 4-4 | 2-4-2 | 4-4-0 | 23.1 | 19.9 | 5.28 | 4.11 | -1 | 2.01 | W6 @DEN 14-17 L; W7 vKC 20-3 W; W8 vCHI 17-34 L |

**ARI QB starts (10+ att):** Jacoby Brissett W1,2,3,4,5,6,7,8; Gardner Minshew II W8
**ARI usage, last 3 games:**
- QB Jacoby Brissett: pass att 35/48/23, pass yds 218/272/119, pass td 0/1/0, pass int 1/0/1, rush yds 2/16/7
- RB Tyler Allgeier: rush car 18/8/11, rush yds 38/19/147, rec 1/3/5, tds total 0/0/2
- RB Bam Knight: rush car 15/7/3, rush yds 80/48/8, rec 2/3/1, tds total 0/0/0
- REC Trey McBride: targets 9/13/8, rec 7/10/7, rec yds 53/111/72, tds total 0/1/1
- REC Michael Wilson: targets 7/8/15, rec 4/4/8, rec yds 32/55/111, tds total 0/0/1
- REC Kendrick Bourne: targets 8/6/2, rec 5/3/1, rec yds 47/9/29, tds total 0/0/0
- DEF Jack Gibbens: tackles 7/7/11, sacks 0/0/0
- DEF Mack Wilson Sr.: tackles 9/3/8, sacks 0/0/0
- DEF Budda Baker: tackles 6/2/7, sacks 1/0/0

**SEA QB starts (10+ att):** Drew Lock W1,2; Sam Darnold W3,4,5,6,7,8
**SEA usage, last 3 games:**
- QB Sam Darnold: pass att 51/28/34, pass yds 278/257/188, pass td 0/1/2, pass int 2/1/1, rush yds 19/17/20
- RB Emanuel Wilson: rush car 14/24, rush yds 52/100, rec 0/1, tds total 0/1
- RB George Holani: rush car 5/5/1, rush yds 20/11/9, rec 0/1/0, tds total 1/0/0
- REC Jaxon Smith-Njigba: targets 16/12/11, rec 12/9/6, rec yds 134/150/118, tds total 0/1/1
- REC Cooper Kupp: targets 10/2/3, rec 5/2/1, rec yds 50/20/7, tds total 0/0/1
- REC AJ Barner: targets 4/5/5, rec 3/4/2, rec yds 16/42/23, tds total 0/0/0
- DEF Ernest Jones IV: tackles 9/9/13, sacks 1/0/0
- DEF Tyrice Knight: tackles 8/8/1, sacks 0/0/0
- DEF Devon Witherspoon: tackles 5/4/8, sacks 0/0/0
**ARI injuries:** none listed Q/D/O
**SEA injuries:** none listed Q/D/O

| FTN (season) | Offense | vs defense | Offense | vs defense |
|---|---|---|---|---|
| | **ARI O** | SEA D | **SEA O** | ARI D |
| DVOA | -2.6% (#18) | -19.6% (#2) | -9.5% (#22) | 6.9% (#24) |
| Rush DVOA | -9.2% (#18) | -23.8% (#5) | -22.2% (#29) | -15.7% (#8) |
| Pressure % (allowed / generated) | 28.2% (#16) | 37.4% (#2) | 33.7% (#24) | 24.4% (#27) |

**Podcast picks:**
- **BEST BET** SEA -8.5 — Simon Hunter, The Volume — SHARP NFL Week 9 Bets: Giants-Ea
- Jaxon Smith-Njigba o0.5 anytime_touchdown — Brandon Anderson, The Action Network: Sports Betting Picks & Ti
- SEA -11.5 — Matt Moore, The Action Network: Sports Betting Picks & Ti
- Drew Lock u28.5 pass_attempts — Tara Roberts, BettingPros — Top 10 NFL Player Props Picks f
- SEA -2.5 (1.2u) — Matt Perrault, BettingPros — 4 BETS BETS for Thursday Night 
- SEA survivor SEA — Matt Perrault, BettingPros — Early NFL BEST BETS & Survivor 
- SEA -10.5 — Matt Perrault, BettingPros — Early NFL BEST BETS & Survivor 
- Gardner Minshew u200.5 passing_yards — Rich Hribar, Warren Sharp — (41-16, 72%) NFL Week 9 Best B
- ARI@SEA Under 45 — BettingPros show (Erickson/Wormeli; turn not attributable from captions), BettingPros — NFL Week 9 Early Picks & Line M
- SEA -10.5 — Simon Hunter + Chad Millman (joint), Sharp or Square — NFL WEEK 9 BETS: Jags-Raven
- ARI +11.5 — The Favorites show (Brandon Kravitz & Kendra Middleton; joint contest plays), The Action Network: Sports Betting Picks & Ti
- ARI +10.5 (1u) — Ross Tucker, Ross Tucker — 2026 NFL Week 9 BETS!
**Podcast leans (not picks):** OVER anytime_touchdown 0.5 (Andrew Erickson); ARI spread 10.5 (Steve Fezzik)
## TB @ CHI (Sun 05:20 PM PT)

**Market.** DK snapshot CHI -6, total 46.5 (2026-11-03T21:00). BEO now: TB +6 (-109), o/u 47.5, TT TB 20.5 / CHI 26.5. ML TB +222 / CHI -270.
**Rest.** TB 7 days, CHI 6 days. **SuperContest:** CHI -6.5 · TB +0.5.

| Team | W-L | ATS | O/U | PF/g | PA/g | ypp | opp ypp | TO | pts/drive | Last 3 |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| TB | 3-5 | 3-5-0 | 4-4-0 | 22.2 | 18.9 | 4.88 | 4.95 | +4 | 2.07 | W6 vPIT 19-26 L; W7 @CAR 43-13 W; W8 vATL 16-0 W |
| CHI | 6-2 | 6-2-0 | 4-4-0 | 26.8 | 20.0 | 5.36 | 5.90 | -1 | 2.34 | W6 @ATL 31-23 W; W7 vNE 30-24 W; W8 @SEA 34-17 W |

**TB QB starts (10+ att):** Baker Mayfield W1,2,3,7; Jalon Daniels W4,5,6
**TB usage, last 3 games:**
- QB Baker Mayfield: pass att 11/3, pass yds 64/0, pass td 1/0, pass int 0/0, rush yds 1/14
- RB Bucky Irving: rush car 19/24/27, rush yds 46/106/170, rec 2/1/0, tds total 0/2/1
- RB Kenny Gainwell: rush car 2/14/25, rush yds 17/88/140, rec 1/0/0, tds total 0/0/0
- REC Emeka Egbuka: targets 16, rec 7, rec yds 48, tds total 1
- REC Chris Godwin Jr.: targets 8/5/1, rec 4/4/0, rec yds 37/27/0, tds total 0/0/0
- REC Ted Hurst III: targets 6/1/1, rec 3/0/0, rec yds 40/0/0, tds total 0/0/0
- DEF Josiah Trotter: tackles 12/10/6, sacks 0/0/0
- DEF Tykee Smith: tackles 10/7/2, sacks 0/0/0
- DEF Keionte Scott: tackles 8/6/1, sacks 1/0/0

**CHI QB starts (10+ att):** Caleb Williams W1,2,6,7,8; Case Keenum W3,5; Tyson Bagent W4,5
**CHI usage, last 3 games:**
- QB Caleb Williams: pass att 36/33/34, pass yds 305/308/247, pass td 1/2/1, pass int 0/0/0, rush yds 3/18/1
- RB D'Andre Swift: rush car 16/22/27, rush yds 44/78/69, rec 4/4/2, tds total 2/1/3
- RB Roschon Johnson: rush car 13/2/5, rush yds 51/13/17, rec 2/0/1, tds total 1/0/0
- REC Colston Loveland: targets 7/12/9, rec 6/7/7, rec yds 65/69/65, tds total 1/1/0
- REC Luther Burden III: targets 8/4/9, rec 8/4/7, rec yds 95/130/56, tds total 0/1/1
- REC Rome Odunze: targets 4/5/6, rec 3/4/4, rec yds 39/69/87, tds total 0/0/0
- DEF Devin Bush: tackles 7/4/6, sacks 0/0/1
- DEF Dillon Thieneman: tackles 2/8/5, sacks 1/0/0
- DEF Noah Sewell: tackles 6/2/3, sacks 0/0/0
**TB injuries:** none listed Q/D/O
**CHI injuries:** none listed Q/D/O

| FTN (season) | Offense | vs defense | Offense | vs defense |
|---|---|---|---|---|
| | **TB O** | CHI D | **CHI O** | TB D |
| DVOA | -8.9% (#21) | -1.6% (#15) | 6.7% (#10) | -21.7% (#1) |
| Rush DVOA | 1.3% (#9) | -8.1% (#20) | -1.5% (#12) | -24.0% (#4) |
| Pressure % (allowed / generated) | 37.4% (#31) | 32.5% (#8) | 33.8% (#25) | 31.1% (#11) |

**Podcast picks:**
- Caleb Williams o21.5 pass_completions — Scott Bogman, BettingPros — NFL Sunday Night Football Bets 
- Colston Loveland o52.5 receiving_yards — Tara Roberts, BettingPros — NFL Sunday Night Football Bets 
- D'Andre Swift o65.5 rushing_yards — Scott Bogman, BettingPros — NFL Sunday Night Football Bets 
- TB +6 — Scott Bogman, BettingPros — NFL Sunday Night Football Bets 
- CHI -6 — Tara Roberts, BettingPros — NFL Sunday Night Football Bets 
- **BEST BET** TB +6.5 — Simon Hunter + Chad Millman (joint), The Volume — SHARP NFL Week 9 Bets: Giants-Ea
- Colston Loveland o5.5 receptions — Brandon Anderson, The Action Network: Sports Betting Picks & Ti
- Colston Loveland o0.5 anytime_touchdown — Brandon Anderson, The Action Network: Sports Betting Picks & Ti
- TB +5.5 — Brandon Anderson, The Action Network: Sports Betting Picks & Ti
- D'Andre Swift o16.5 rushing_attempts — Andrew Erickson, BettingPros — Top 10 NFL Player Props Picks f
- TB +5.5 — Pat Fitzmaurice, BettingPros — Early NFL BEST BETS & Survivor 
- TB@CHI Under 47.5 — BettingPros show (Erickson/Wormeli; turn not attributable from captions), BettingPros — NFL Week 9 Early Picks & Line M
**Podcast leans (not picks):** TB spread 6.0 (Ross Tucker)
## BUF @ MIN (Mon 05:15 PM PT)

**Market.** DK snapshot MIN +3.5, total 45.5 (2026-11-03T21:00). BEO now: BUF -3 (-115), o/u 44.5, TT BUF ? / MIN ?. ML BUF -168 / MIN +148.
**Rest.** BUF 8 days, MIN 8 days. **SuperContest:** MIN +3.5 · MIN +0.5.

| Team | W-L | ATS | O/U | PF/g | PA/g | ypp | opp ypp | TO | pts/drive | Last 3 |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| BUF | 6-1 | 5-2-0 | 5-2-0 | 33.3 | 25.9 | 6.41 | 5.24 | -2 | 3.08 | W5 @LAR 37-34 W; W6 @LV 33-30 L; W8 vBAL 36-10 W |
| MIN | 6-1 | 4-3-0 | 1-6-0 | 20.0 | 13.3 | 4.74 | 4.61 | +7 | 1.79 | W5 @NO 23-13 W; W7 vIND 16-10 L; W8 @DET 15-19 L |

**BUF QB starts (10+ att):** Josh Allen W1,2,3,4,5,6,8
**BUF usage, last 3 games:**
- QB Josh Allen: pass att 19/33/34, pass yds 210/255/289, pass td 1/2/2, pass int 1/0/1, rush yds 121/1/30
- RB James Cook III: rush car 25/22/21, rush yds 111/95/80, rec 1/3/2, tds total 2/1/1
- RB Ray Davis: rush car 2/1/6, rush yds 2/4/30, rec 1/1/0, tds total 0/0/0
- REC Dalton Kincaid: targets 2/8/6, rec 1/7/4, rec yds 7/38/86, tds total 0/0/1
- REC Khalil Shakir: targets 3/6/6, rec 3/4/5, rec yds 80/34/64, tds total 0/1/0
- REC Keon Coleman: targets 2/6/3, rec 1/4/1, rec yds 7/59/4, tds total 1/1/0
- DEF Terrel Bernard: tackles 7/9/6, sacks 0/0/0
- DEF Cole Bishop: tackles 11/7/2, sacks 0/0/1
- DEF Dorian Williams: tackles 9/5/3, sacks 0/0/0

**MIN QB starts (10+ att):** Carson Wentz W1,2; Kyler Murray W3,4,5,7,8
**MIN usage, last 3 games:**
- QB Kyler Murray: pass att 30/24/29, pass yds 229/150/210, pass td 1/1/2, pass int 0/0/1, rush yds 51/39/35
- RB Aaron Jones Sr.: rush car 25/8/5, rush yds 113/26/22, rec 3/1/2, tds total 1/0/0
- RB Jordan Mason: rush car 15/8, rush yds 68/20, rec 0/0, tds total 0/0
- REC Justin Jefferson: targets 7/7/9, rec 6/4/5, rec yds 79/44/33, tds total 1/0/1
- REC T.J. Hockenson: targets 1/5/5, rec 1/4/4, rec yds 7/35/58, tds total 0/1/1
- REC Jordan Addison: targets 3/8, rec 2/3, rec yds 20/66, tds total 0/0
- DEF Blake Cashman: tackles 9/12/10, sacks 0/2/0
- DEF Joshua Metellus: tackles 5/7/13, sacks 0/0/0
- DEF Eric Wilson: tackles 2/4/11, sacks 0/0/1
**BUF injuries:** Sam Franklin Jr. (S) QUESTIONABLE; Keon Coleman (WR) QUESTIONABLE (shoulder)
**MIN injuries:** Andrew Van Ginkel (LB) QUESTIONABLE (chest); Kyler Murray (QB) QUESTIONABLE; Demond Claiborne (RB) QUESTIONABLE; Jay Ward (S) QUESTIONABLE; Jauan Jennings (WR) QUESTIONABLE (calf)

| FTN (season) | Offense | vs defense | Offense | vs defense |
|---|---|---|---|---|
| | **BUF O** | MIN D | **MIN O** | BUF D |
| DVOA | 23.9% (#2) | -19.5% (#3) | -17.1% (#30) | 5.0% (#22) |
| Rush DVOA | 12.0% (#2) | -11.9% (#12) | -17.3% (#27) | -8.9% (#18) |
| Pressure % (allowed / generated) | 30.7% (#20) | 37.7% (#1) | 24.4% (#6) | 34.9% (#3) |

**Podcast picks:**
- Josh Allen o0.5 anytime_touchdown — Brandon Anderson, The Action Network: Sports Betting Picks & Ti
- Justin Jefferson o77.5 receiving_yards — Andrew Erickson, BettingPros — Top 10 NFL Player Props Picks f
- BUF@MIN 1H_Under (line not stated) — Matt Perrault, BettingPros — Early NFL BEST BETS & Survivor 
- BUF -3.5 — BettingPros show (Erickson/Wormeli; turn not attributable from captions), BettingPros — NFL Week 9 Early Picks & Line M
- BUF -3.5 — The Favorites show (Brandon Kravitz & Kendra Middleton; joint contest plays), The Action Network: Sports Betting Picks & Ti
- **BEST BET** MIN +3.5 (2u) — Steve Fezzik, Ross Tucker — 2026 NFL Week 9 BETS!
- **BEST BET** MIN +3.5 (2u) — Ross Tucker, Ross Tucker — 2026 NFL Week 9 BETS!
**Podcast leans (not picks):** MIN spread 3.5 (Simon Hunter); MIN spread 3.5 (Brandon Anderson); MIN spread 3.5 (Joe Gibbs); UNDER total 45.5 (BettingPros show (Erickson/Wormeli; turn not attributable from captions)); MIN spread 3.5 (Sharp or Square (Simon Hunter; turn not named from captions)); UNDER total 45.5 (Steve Fezzik)

---
Gates before any ticket: roster gate on every named player; Friday injury reports; prop boards captured; Andy pastes each slip.
