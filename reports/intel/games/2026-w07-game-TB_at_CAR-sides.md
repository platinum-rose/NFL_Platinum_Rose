# TB @ CAR — Week 7 game synthesis, pass: sides

As of 2026-10-23 18:30 PT · Kickoff Sun 10/25 10:00 PT (Bank of America Stadium, outdoors) · Packet built 2026-10-24T01:26:41Z · roster_vet PASS (roster age 0.0h; 1 INFO, 1 UNVERIFIED) · Inactives out 08:30 PT Sunday.

## Recommendation box

- **SPREAD: CAR -3 @ +106 (BKR)** | tier **C** | fair CAR -3.5 | edge +0.5 pt (and a plus-money price on the key number) | playable to CAR -3 -105; **pass at -3 -110 or worse, or at -3.5**. Not a strong side: the price drives this as much as the read.
- **TOTAL: OVER 45 @ +100 (BKR)** | tier **B** | fair 46.5 | edge +1.5 pts | playable to 45.5 -110; pass at 46 or above.
- **MONEYLINE/SU: PASS** (CAR -145, about 59.2% implied, vs about 60–61% fair; no edge). SU winner: **CAR**.
- **SuperContest (CAR -3, locked):** not a candidate. CAR covers 51.4% of non-push outcomes at the contest number, which is too thin, and the sharp money is on TB.
- **Pool:** SU CAR, confidence **7/16** (mid-tier: a home favourite that is roughly a coin flip against the spread).

[Source: data/generated/props/bookmaker-live-2026-10-23-buccaneers-at-panthers.json game_lines, capturedAt 2026-10-23T20:10:54Z. This matches Andy's paste in data/generated/props/bookmaker-gamelines-2026-10-23-week7.raw.txt, ~11:40 PT, so there was no move between the two captures.]

## Game script

Carolina has the league's most aggressive passing script: 2nd in pass rate over expected, 3rd in neutral pace, 68.8 plays/game at 25.0 sec/play. Tampa Bay is a pass-funnel defence: opponents throw 5.3% over expected against it [Source: packet news_notes/article_notes Sharp Football Worksheet, 2026-10-21; CAR.md FTN tempo]. Bryce Young leads the NFL at 309.8 pass yds/g and has 281+ in every game [Source: Worksheet market_sentiment note]. Tampa Bay's elite free safety Antoine Winfield Jr. is OUT, which removes the piece that disguises Todd Bowles' 42% blitz rate [Source: TB.md FTN pass-rush BLZ% 42.1%; Bucs Friday report]. The most likely script is Carolina moving the ball through the air early. Baker Mayfield returns from a dislocated right thumb, wearing a glove, without Emeka Egbuka and without RT Luke Goedeke. He faces a Carolina pass rush missing both Jaelan Phillips and Thomas Incoom, which softens the sack problem that wrecked his first three games (11.0% sack rate). Tampa Bay keeps it close, as it has in every game so far: its six results were decided by 6, 4, 7, 3, 8 and 7 points [Source: TB.md game log]. The final looks like the high 20s to low 20s, with Carolina slightly more likely to win by 4+ than to land exactly on 3.

## QB / availability (official Friday report, buccaneers.com, 2026-10-23)

- **TB:** Mayfield **Questionable** (FP all week; Bowles: "ready to go"; operator note: starts) [Source: qb_operator_notes; ESPN 2026-10-23T17:50Z]. **OUT:** WR Egbuka (concussion/foot), RT Goedeke (calf), S Winfield Jr. (rib). LB Rozeboom placed on IR. No designation: RB Bucky Irving, CB Zyon McCollum, DT Calijah Kancey (all illness, now FP), WR David Sills V (activated from IR).
- **CAR:** QB Young no designation. **OUT:** OLB Jaelan Phillips (hamstring), OLB Thomas Incoom (calf). **Questionable:** T Monroe Freeling (FP all week), LB Bam Martin-Scott (FP). CBs Jaycee Horn and Mike Jackson are on IR (both placed ~10/01 with ~8-week timelines) [Source: Spectrum News 2026-10-01; packet secondary_matchups].
- **If Mayfield is out (unlikely):** Jalon Daniels starts. He went 22/43 for 164 yards, 1 TD and 2 INT last week [Source: availability TB, 2026-10-19]. Move to CAR -3 at tier B, and lower Over 45 to PASS. Neither ticket should be placed before 08:30 PT inactives if Mayfield's status is in any doubt.

## Market

- **Spread:** AN open CAR -3 (-119 home) → BKR CAR -3 **+106** / TB +3 **-124**. The juice flipped about 25 cents toward Tampa Bay, roughly 0.4 pt of movement, on the Mayfield news [Source: packet market.an_opener, sp_at 2026-10-19T00:43Z]. BKR equals the contest line (CAR -3), so there is no gap.
- **ML:** AN open CAR -178 / TB +145 → CAR -145 / TB +127. That is a large move toward Tampa Bay.
- **Total:** AN open 44.5 → 45 (Over +100 / Under -117). The juice is leaning Under.
- **Splits (AN, 2026-10-23T19:40Z):** spread 65% of bets CAR but only 40% of money, so 60% of the money is on TB from 35% of tickets. **Sharp flag: TB** (25-pt gap). Total: Over 55% bets / 61% money (6-pt gap, no flag). ML: CAR 84%/88%.

## Quantitative

- **Power:** CAR SRS +4.33 (#8) vs TB -0.63 (#21); model rank 7 vs 23; net PPG +4.6 vs -3.2. Raw SRS difference plus home field gives roughly CAR -6.5 [Source: packet power_ratings]. That figure includes Tampa Bay's three Daniels starts, and early-season SRS is noisy, so I shrink it heavily. Prediction-market win totals: CAR 9.43, TB 6.28 [Source: prediction_markets].
- **Efficiency (nflverse, through W6):** CAR offence EPA/play +0.097 (#7), defence +0.005 (#19). TB offence -0.122 (#29), defence -0.093 (#3). Mayfield's three 2026 starts: EPA/DB -0.256, CPOE -5.1, 11.0% sacks [Source: TB.md/CAR.md].
- **FTN:** CAR passing DVOA +29.1%, 17.4% explosive. TB pass-protection DVOA -119.3% under pressure. CAR's defence allows passing DVOA +10.2%. CAR's FTN data is stale by one week (through W5) [Source: ftn-stats-iq-weekly-synthesis-context-latest.json, 2026-10-20].
- **Secondary matchups:** TB offence vs CAR rated **high** vulnerability (severity 6.08, Horn and Jackson out). CAR offence vs TB rated deep/post/slot boost with Winfield out [Source: packet secondary_matchups].
- **Simulator** (`margin-simulator.mjs`, selftest PASS):

| Run | Home line / total | margin_adj / total_adj | CAR cover (excl push) | Push | Over (excl push) | CAR win |
|---|---|---|---|---|---|---|
| Baseline | -3 / 45 | 0 / 0 | 50.0% | 8.3% | 50.0% | 60.1% |
| **Adjusted (view)** | -3 / 45 | +0.5 / +1.5 | **51.4%** | 8.3% | **54.7%** | 61.4% |
| TB-lean check | -3 / 45 | -0.5 / 0 | 48.6% | 8.3% | 50.0% | 58.9% |

The SuperContest run is the same as the adjusted run, because the contest line is also -3. Break-evens: CAR +106 needs 48.5% excluding pushes; TB -124 needs 55.4%; Over +100 needs 50.0%.
- **Adjustment reasons:** margin_adj **+0.5 CAR**. Carolina is meaningfully better on power and EPA, and Tampa Bay's injuries (Winfield, Egbuka, Goedeke) are bigger than Carolina's (two edge rushers). I shade this back toward the line because of the sharp money and Tampa Bay's one-score profile. total_adj **+1.5**: Carolina's pace and PROE against a pass funnel, two secondaries missing elite pieces, Carolina's edge rush depleted (fewer drive-killing sacks for TB), and good weather (67°F, 0% precip, wind 15 km/h) [Source: weather].

## Expert / podcast / article agreement

- **TB side:** Action Network writer, TB +3.5 ("TB won 10 of 12 vs CAR"). Steve Fezzik, TB +3.5 (top-5 contest). Simon Hunter, TB +3.5 (two episodes of the same show, counted as one opinion). Ross Tucker, TB +3.5. Dave Tuley (VSiN), TB +9 in teasers. John Ewing/Bet Labs: division dogs are 20-8 ATS. **Every TB lead was priced at +3.5. BKR is now +3 -124, so those leads have lost the hook and are paying 24 cents of juice.** They do not carry over at full weight.
- **CAR side:** Action Network "Matt", CAR -3.5 ("market lagging CAR's rating"). BettingPros, CAR -3.5 (10/20). PFT, CAR 20-17 (a push at -3; total 37). Steve Krebs, CAR ML -192 (stale price).
- **Total:** Over side: Fezzik Over 44.5 (2u). Josh Shepardson (Sharp), CAR team total Over 23.5 and Young Over 250.5 pass yds. Warren Sharp, Young Over 21.5 completions. Under side: PFT's 20-17 projection is the only opinion in the packet on the Under.
- Dropped: Steve Makinen's "+3" (about NE on TNF); Jason Radowitz "Panthers -3.5 -115" (tagged CAR/DEN, wrong opponent).

## Counter-case

- **CAR -3:** The sharp money is clearly on Tampa Bay, and the line has moved toward Tampa Bay since the open. Tampa Bay's defence is #3 in EPA, and none of its games has been decided by more than 8 points. Division dogs are 20-8 ATS. Mayfield's return lifts the offence above the Daniels baseline that the SRS numbers include. The exact margin of 3 (15.4%) is the single most likely result and pays only a push.
- **Over 45:** Tampa Bay's game totals are 60, 42, 39, 31, 40 and 45: five of six were at or under 45. Its offence is #29 in EPA, and Mayfield is rusty and playing in a glove. Carolina's median game total is 39 if you drop the 96-point W1. The BKR juice (-117 Under) shows the book leaning Under.

## Ambiguity / missing data

- The packet's CAR availability block is **null**. CAR statuses come from the official Friday report (web).
- The TB projected-starters entry lists Jalon Daniels and is stale. The operator note and ESPN supersede it.
- The CB-absence rows in secondary_matchups carry a FantasyPros `published_at` of 2026-10-24T08:10Z, which is later than the packet build. The facts are corroborated by Spectrum 10/01.
- BKR team-total rows (TB 21.5, CAR 23.5) are unparsed and marked unavailable, so they are reference only.
- The coverage notes in secondary_matchups name a CAR coordinator and reference Winfield's role. Per the gate rule, the coach name is ignored, and Winfield is OUT.

## Pre-kickoff delta checklist

1. **08:30 PT inactives:** Mayfield active (expected). If he is inactive: CAR -3 goes to tier B and the Over goes to PASS.
2. BKR moves to **CAR -2.5**: CAR becomes tier B at -110 or better. Moves to **CAR -3 -110 or worse**: spread PASS.
3. BKR moves to **TB +3.5**: the side flips to PASS for CAR. TB +3.5 at -110 is acceptable as a contrarian C, in line with the expert consensus.
4. Total moves to **46+**: Over PASS. Drops to **44.5 or lower** at -110: Over stays B.
5. Freeling (CAR T) inactive: small knock on CAR protection against the TB blitz, about -0.25 to CAR.

## Gate notes

- missing_inputs: none. roster_vet: PASS (fresh).
- Kickoff has not passed. Forward picks are given.
- The availability feed lacked Friday designations for CAR (null) and had a stale TB projected starter. Resolved with the official Bucs Friday report.
- secondary_matchups: future-dated `published_at` on two rows; coordinator name ignored per rule 7.
- FTN CAR data stale by one week (through W5). Weekly-only by design, no refresh requested.
- Article selections were mis-tagged by team (CAR/DEN, CAR/MIN). Verified against the current-week Sharp article before citing.

Sources: [Bucs Friday injury report 10/23](https://www.buccaneers.com/news/buccaneers-panthers-injury-report-oct-23-week-7-2026) · [Bucs Wed report 10/21](https://www.buccaneers.com/news/buccaneers-panthers-injury-report-oct-21-week-7-2026) · [Panthers Wed report](https://www.panthers.com/news/week-7-wednesday-injury-report-jaelan-phillips-held-out-of-practice) · [Spectrum: Horn/Jackson ~8 weeks](https://spectrumlocalnews.com/nc/charlotte/news/2026/10/01/panthers-starting-cbs-jaycee-horn-and-mike-jackson-expected-to-miss-about-8-weeks)
