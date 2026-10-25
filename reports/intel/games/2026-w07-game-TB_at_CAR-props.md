# TB @ CAR — Week 7 game synthesis, pass: props

As of 2026-10-24 ~15:00 PT · Kickoff Sun 10/25 10:00 PT (Bank of America Stadium, outdoors), so this is a morning-window game (7a) · Queue built 2026-10-24T21:33:58Z · roster_vet PASS (roster age 13.3h; 1 INFO, 9 UNVERIFIED) · Inactives out 08:30 PT Sunday.
Prices come from the BKR board, `data/generated/props/bookmaker-live-2026-10-24-buccaneers-at-panthers.json` (capturedAt 2026-10-24T20:25:20Z, ~1:25 PM PT). The BKR main line on that board is **CAR -3 +102 / TB +3 -117, total 44.5 -108/-108, ML CAR -152**. BetOnline has **no player-prop rows** for this game (44 rows, all game- or team-level; capturedAt 21:15Z).

## Recommendation box

| # | Player | Market | Line | Price | Book | Basis | Tier | Leg flag | card_slot |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Bryce Young | Pass TDs Over | 1.5 | -129 | BKR | 11 TD in 5 games, multi-TD in 4 of 5; TB missing Winfield; CAR 2nd in PROE | **B** | ok | 7a / single |
| 2 | Bryce Young | Pass yds Over (alt) | 233.5 | -174 | BKR | 281+ yards in every game (309.8/g); TB is a pass funnel | **B** | ok | 7a / 7d |
| 3 | Tetairoa McMillan | Receptions Over (alt) | 4.5 | -181 | BKR | Shares WR1 targets with Coker (32 vs 35 targets over 4 shared games); 6-of-9 in W6; CAR is the expected winner | **B** | ok | 7a |
| 4 | Jalen Coker | Receptions Over (alt) | 4.5 | -267 | BKR | 13 targets (6-97) in W6, team target leader | C | **< -200 flag** | 7d (anchor only) |
| 5 | Bryce Young | Completions Over (alt) | 20.5 | -260 | BKR | 24.2 completions/g (121/5) | C | **< -200 flag** | 7d (anchor only) |
| 6 | Tetairoa McMillan | Anytime TD | — | +130 | BKR | Primary red-zone WR (2 TDs vs DET W4) | **B** | ok | 7e |
| 7 | Chuba Hubbard | Anytime TD | — | -160 | BKR | Goal-line back, 28 carries in W6. TB has allowed only 2 rush TDs all season | C | ok | 7e (alt) |
| 8 | Bucky Irving | Anytime TD | — | +100 | BKR | CAR has allowed 8 rush TDs in 5 games; no injury designation | C | Mayfield-dependent | 7e (TB leg) |

**First TD (8a):** McMillan **+747** (B-, preferred), Hubbard +451 (C), Irving +629 (C, TB leg). **2+ TD (8b):** Hubbard +363 (C), McMillan +722 (C).
**Island ladder:** N/A (Sunday early window). **Tackles + assists:** not posted on BKR or BEO, so no pick. If BKR posts them, look at TB LB Josiah Trotter (12 tackles in W6, Rozeboom on IR) and S Tykee Smith (10 in W6, more snaps with Winfield out), because Carolina's pass-heavy script feeds TB's second level.
**BEO (multi-game stacks, max 2 legs per game):** no player rows exist. The only BEO candidates are game-level: Game TD Over 4.5 at -140, which fits the sides pass's Over lean. Those belong to the sides card, not the props card.
**Stack flag:** if both #4 and #5 go into one stack, it carries 2 legs shorter than -200, which is the warning threshold. Do not add a third.

## Game script

The sides pass has CAR -3 (C) and Over 45 (B; now 44.5), and that script holds: Carolina throws at the league's 2nd-highest PROE (7.3%) and 3rd-fastest neutral pace, and Tampa Bay's opponents throw 5.3% over expected [Source: props_intel_articles Shepardson/Sharp; article_notes Worksheet 2026-10-21]. Winfield is OUT, which strips the disguise from Bowles' 42% blitz. Young's rate under no pressure is excellent (EPA/DB +0.386), though he struggles when pressured (-0.208) [Source: CAR.md FTN QB1 pressure]. Carolina's runs go into TB's best unit: rush DVOA -22.0%, EPA/att -0.177, only 2 rush TDs allowed in 6 games [Source: TB.md FTN team-defense]. That is why the CAR legs are passing legs and Hubbard is tier C. Carolina's defence has allowed 8 rush TDs in 5 games [Source: CAR.md FTN team-defense overview TD__2], which is why Irving is the TB TD leg.

## QB / availability (official Friday report, buccaneers.com 2026-10-23)

- **TB:** Mayfield is Questionable (thumb). He was a full participant all week, Bowles says he is "ready to go," and per Andy's operator note he starts. BKR has **pulled Mayfield's main O/U markets** (only alt ladders remain), and it has also pulled the main markets for Godwin, Otton, Metchie, Gainwell, Tez Johnson and Hurst. That is the book hedging on the QB, so **no TB passing-game props**. Mayfield's three 2026 starts: 205 yd/g, EPA/DB -0.256, sack rate 11.0%, 3 fumbles [Source: TB.md FTN QB1]. **OUT:** Egbuka, Goedeke, Winfield. Irving (illness) and Godwin (rest DNP Thursday, full Friday) carry no designation.
- **CAR:** Young has no designation. OUT: OLB Phillips and OLB Incoom. Questionable: T Freeling and LB Martin-Scott (both full participants). No CAR skill player has a designation.
- **If Mayfield is out (Jalon Daniels starts):** BKR will likely void or reprice the TB markets. Drop Irving ATD and Irving First TD. Keep every CAR leg. Upgrade Hubbard ATD to B (CAR leading means more late carries). Young TD and McMillan stay. Daniels has **no captured row**, so there is no pick on him. If BKR posts Daniels rushing, he ran 4 times for 39 yards last week and CAR is missing both edge rushers, so scramble lanes are open. That would be a C-tier candidate only, and only at a fresh price. Never use Daniels INT, because BKR SGPs do not take INT legs. The decision point is inactives at 08:30 PT.

## Market / pricing notes

- Spread: AN open CAR -3 (-119), then 10/23 +106, now **+102**. Money splits favor TB: 40% of money on CAR from 65% of tickets [Source: splits 2026-10-23T19:40Z]. Total: 44.5 open, 45, now 44.5 -108. A CAR implied total of about 23.75 matches Shepardson's CAR team total Over 23.5.
- Shepardson's Young Over 250.5 pass yards (-115, DK/FD) is now 253.5 on BKR, a median line at -109/-116 that Andy's rules avoid. I took the 233.5 alt instead.
- Warren Sharp's Young Over 21.5 completions compares to BKR's 22.5 main (-114, median) and 20.5 alt (-260, flagged).
- Simulator (context only; props have no joint model): at -3/44.5, baseline CAR win 60.1%. With the sides pass's view (+0.5 / +1.5): CAR win 61.4%, Over 54.5%, mean total 46.0.

## Expert agreement / disagreement

- **For CAR passing volume:** Josh Shepardson (Sharp: Young Over 250.5; CAR team total Over 23.5), Rich Hribar (Worksheet: Young QB1, 281+ in every game), Warren Sharp (Young Over 21.5 completions), Fezzik (Over 44.5).
- **Against:** Evan Abrams (Action Network: "Bowles 5-1 vs Bryce Young"; CAR 15 ppg in that split), PFT 20-17 projection (total 37), and the sharp money on TB. Bowles' blitz-heavy scheme has historically held Young down.

## Counter-case

- **Young TDs / yards:** In five prior meetings Bowles beat Young four times. A TB lead would mean more Hubbard, and a CAR lead would mean clock-killing runs. W6 was Young's lowest scoring game: 25 points, with Hubbard's 28 carries carrying it. Young TD% of 5.4% is above his career norm, so some regression is due.
- **McMillan receptions:** Coker out-targeted him 13-9 in W6, so the target split is volatile. 4.5 still needs only 5 catches.
- **McMillan ATD / First TD:** Tremble (2 TDs in W6, ATD +293) and Hubbard compete for red-zone touches.
- **Hubbard ATD:** TB rush defence is elite at the goal line (2 rush TDs allowed). At -160 (61.5% implied), the price is close to fair.
- **Irving ATD:** Rusty-Mayfield risk, TB red-zone TD rate of 47%, and the illness week. If TB's TD comes through the air, Godwin (+228) or Otton (+202) gets it instead.

## Ambiguity / missing data

- The BetOnline prop board is thin (missing input). All prop legs are BKR SGP, same game only.
- No tackles+assists markets were captured, which removes Andy's best season category for this game.
- Player target shares are from web (DraftSharks 10/18), not repo data. There is no player-level stats file in the packet.
- BEO team-TD rows have no team label (O2.5 +135 is likely TB and -110 likely CAR), so treat them as unverified.
- The projected-starters entry for TB QB (Daniels) is stale. The operator note supersedes it.

## Pre-kickoff delta checklist

1. **08:30 PT inactives:** if Mayfield is inactive, apply the Daniels branch above. If any CAR WR or Young is inactive, the related legs are LOST, so pull them.
2. Young pass TDs moves to -150 or shorter at 1.5: still B up to -150; pass beyond that.
3. McMillan 4.5 receptions moves to -220 or shorter: it becomes a flagged leg. Drop it rather than swapping to 70.5 yds, which is a median line.
4. Hubbard ATD moves to -200: drop it.
5. CAR total or the game total drops to 43 or lower: downgrade Young yards to C.
6. If BKR re-posts Mayfield or Godwin main markets after inactives, re-check them, but there is no edge without a captured row.

## Gate notes

- missing_inputs: BetOnline player-prop board thin (44 rows). Capped: no BEO prop picks. BKR is the venue for every leg.
- roster_vet: PASS, 13.3h old. 9 UNVERIFIED entries; every player named here was cross-checked against the 10/23 official report, ESPN availability, and the BKR board listing.
- Kickoff has not passed. Forward picks are given.
- Coaching names come from the dossiers. The secondary_matchups coach names are ignored.
- Action Network's "CAR 15 ppg vs Bowles" is a multi-season split, not 2026 data.

Sources: [Bucs Friday injury report 10/23](https://www.buccaneers.com/news/buccaneers-panthers-injury-report-oct-23-week-7-2026) · [DraftSharks: Coker 13 targets in return](https://www.draftsharks.com/fantasy-football-news/83522/jalen-coker-leads-receiving-in-return) · [WBTV: Young-McMillan 2 TDs vs DET](https://www.wbtv.com/2026/10/05/bryce-young-tetairoa-mcmillan-connect-2-tds-lead-panthers-past-lions-32-26/) · [4for4: Coker quad, Oct 1](https://www.4for4.com/node/181710)
