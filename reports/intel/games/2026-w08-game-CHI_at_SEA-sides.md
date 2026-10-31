# CHI @ SEA — Week 8 game synthesis, pass `sides` (Monday Night Football)

As-of: Fri 2026-10-30 ~11:25 PM PT · Kickoff: Mon 11/2 5:15 PM PT (2026-11-03T01:15Z) · Inactives ~3:45 PM PT Mon · Packet built_at 2026-10-31T06:09:16Z · roster_vet PASS (roster age 8.5h, 2 UNVERIFIED slate-wide)

## Recommendation box

| Market | Pick @ BKR | Tier | Fair | Edge | Playable-to |
|---|---|---|---|---|---|
| SPREAD | **CHI +3 +103** | C (B at +3.5) | SEA -2.0 | ~1.0 pt (1.25 vs juice-adjusted -3.2) | +3 at -112 or better; **pass at +2.5** |
| TOTAL | **UNDER 46 -106** | C | 44.5 | 1.5 pts | to 45 -110; pass at 44.5 |
| MONEYLINE / SU | CHI ML +156 lean only — **PASS as a bet**; SU winner **SEA** | PASS | CHI ~+144 | ~1-2% | revisit at CHI +165 or better |
| SuperContest | CHI +3 (contest line SEA -3) — candidate, secondary tier | C | | | |
| Pool | BUK BUK SU: **SEA**; confidence **4/16** (coin-flip-plus) | | | | |

Card fit: spread `parlay_leg_ok=n` (8.3% push mass on 3; keep standalone/contest); under `parlay_leg_ok=y` (C-tier, low correlation with CHI +3 only mildly positive); `standalone_preferred=n` (edges are thin).

## Game script

Seattle's defense is the best unit on the field: 3.96 YPP allowed, EPA/play def -0.134 (#2), FTN defense DVOA -21.1%, run-D DVOA -28.6%, 36% pressure rate [Source: data/generated/team-dossiers/2026-w08/SEA.md, FTN generated 2026-10-30T22:00Z]. Seattle's offense is the weak link: EPA/play -0.048 (#24), rush EPA/att -0.261 (DVOA -24.6%), 12 giveaways in 6 FTN games. Chicago is the opposite shape: competent offense (pass DVOA 25.4%, CPOE 4.5%, 72 plays/g, 33.9 min TOP) with a leaky pass defense (6.10 YPP allowed, EPA/DB allowed +0.036) [Source: CHI.md]. Most likely script: a grinding, field-position game in which Seattle's offense must throw (Darnold) against a Bears secondary that allows the most yards per attempt [Source: expert_picks_pull Rich Hribar 2026-10-30], while Seattle's defense keeps Caleb Williams in the low 20s. Last meeting under the same QB/HC pairing was a 6-3 game [Source: an_primer W8_custom_1792774054278]. Margin centre ~SEA by 2, total ~44-45.

## QB / availability

QBs confirmed: Caleb Williams (CHI) vs Sam Darnold (SEA) [Source: qb_operator_notes, scratch/w08-qb-confirmations-1030.md].
- **SEA LT Charles Cross OUT (ankle)** and **LB Drake Thomas OUT** [Source: qb_operator_notes]. Cross matters most: Darnold's EPA/DB under pressure is -0.729 vs +0.341 clean (FTN pressure table) [Source: SEA.md]. Offsetting: **G Quenton Nelson** acquired 10/27 and will start at LG Monday [Source: news_notes PFT 2026-10-29T19:28Z].
- **CHI adds DT Jeffery Simmons** (trade 10/29) and DE Montez Sweat is back from suspension [Source: news_notes ESPN 2026-10-29T15:01Z; Rotowire 2026-10-24]. Simmons' snap share after five days in the building is unknown.
- CHI: TE Cole Kmet IR; RB Kyle Monangai Q (DNP Friday, thumb/toe); TE Colston Loveland Q (limited Fri, neck); CB Beanie Bishop Jr. suspension flag (needs review) [Source: qb_operator_notes; availability feed 2026-10-30/31].
- SEA: RB Zach Charbonnet Q (limited Fri, knee — possible season debut post-ACL); WR Rashid Shaheed Q (DNP Thu, knee); DT Byron Murphy II Q; RB Jadarian Price listed IR by operator note but designated to return 10/29 and **full Friday** [Source: news_notes Rotowire 2026-10-30T23:25Z] — could be activated.
- Web check: Seahawks.com Monday update (10/26) confirms Cross ankle, Shaheed knee, Charbonnet/Price both possible returns; no final designations yet — **for a Monday game the final report is released Saturday**, so the Friday statuses above are practice-based, not final.
- Scenarios: *If Shaheed is OUT*, SEA's explosive-pass outlet shrinks → strengthens under and CHI +3. *If Simmons is active and plays 30+ snaps* vs a backup LT, CHI's pressure edge grows. *If Cross were surprisingly active*, trim the CHI lean to a pass at +3.

## Market

- BKR current: CHI +3 +103 / SEA -3 -119; o46 -110 / u46 -106; ML CHI +156 / SEA -178 [Source: data/generated/props/bookmaker-gamelines-2026-10-31-week8.raw.txt, captured Fri 6:52 PM PT]; per-game BKR board at the same capture (2026-10-31T01:52:39Z) matches exactly; team totals CHI 21.5 / SEA 24.5 [Source: data/generated/props/bookmaker-live-2026-10-31-bears-at-seahawks.json].
- AN open (Sun 10/25 5:00 PM PT): SEA -3 -113, total 47, ML CHI +140 / SEA -169 [Source: packet market.an_opener]. Movement: spread flat on 3 but juice moved 6 cents toward SEA; +3.5 was widely available midweek (every +3.5 expert pick below) and is gone; ML moved toward SEA (+140 → +156); **total down 1 (47 → 46; AN primer shows 47.5 → 46.5)**.
- SuperContest locked line SEA -3 = BKR number; no gap [Source: data/supercontest/week-08-lines.json, 2026-10-29T16:07Z].
- Splits (AN, 2026-10-31T02:06Z): spread CHI 60% bets / 51% money (SEA money 49% vs 40% bets, +9 — just under the sharp threshold); **ML: SEA 75% bets but only 53% money → CHI ML gets 47% of money on 25% of tickets (+22 gap) — sharp-money flag on CHI ML**; total over 70% bets / 79% money, yet the total fell 1-1.5 pts → **reverse line movement toward the under**. BetMGM: 71% of money on SEA -3 [Source: news_notes John Ewing 2026-10-30].

## Quantitative

- Power: CHI SRS 6.77 (#4) vs SEA 4.57 (#7); net PPG SEA 6.1 vs CHI 5.3; composite z 1.070 vs 1.073 — dead even. Neutral-field ≈ pick'em, + home field ~1.5-2 → SEA -1.5 to -2 [Source: packet power_ratings, through W7].
- Prediction markets: both teams implied median 11.4 wins; no game-level contracts; context only [Source: packet prediction_markets].
- Rest: CHI played TNF W7 (11 days rest) vs SEA SNF W7 (8 days); league-wide, rest-advantage teams are 22-8-1 ATS this season [Source: an_primer slate trend]. SEA is on its 3rd straight primetime game and 5th straight opponent with a 9+ preseason win total (5-14 ATS historical spot) [Source: an_primer].
- Secondary: SEA match-zone, aggressive pressure; SEA CB Julian Neal and S Bud Clark IR; vulnerability tier medium [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w08.json].
- Weather: 9.5°C, 1% precip, wind <1 km/h — immaterial [Source: packet weather].

Simulator (calibration 2018-2025, sha 0ea35592…):

| Run | home-line | total | margin-adj | total-adj | CHI cover / push | SEA cover | Over / Under | SEA win |
|---|---|---|---|---|---|---|---|---|
| Baseline | -3 | 46 | 0 | 0 | 45.9% / 8.3% | 45.9% | 48.5 / 48.5 | 60.1% |
| Adjusted (BKR = contest line) | -3 | 46 | -1.0 | -1.5 | **48.5% / 8.3%** (52.9% ex-push) | 43.2% | 44.0 / **53.0** | 57.6% (CHI 40.0%, tie 2.4%) |
| Price check | -2.5 | 46 | -0.5 | -1.5 | 51.3% | 48.7% | — | 54.8% |

Adjustments (home-positive): margin **-1.0** = rest edge (+0.5 CHI; primer rest trend), Cross OUT vs CHI's added pass rush, partly offset by Nelson (+0.5 CHI net), ratings parity implies SEA -2 not -3.2. Total **-1.5** = elite SEA defense + SEA rush-offense inefficiency (EPA/att -0.261), reverse line movement 47→46 against 79% over money, prior meeting 6-3. Both within the 2.0 soft cap. At +2.5 the CHI side is 51.3% vs 52.4% break-even → pass.

## Expert / podcast / article agreement

- **CHI side:** Brandon Anderson (+3.5; also a Four-Square parlay leg — one opinion across pipelines), Even Money (+3.5, two entries = one opinion; 11 days prep), Steve Fezzik (+3.5), Lock & Cash (+3.5, best bet, expects outright win), ESPN betting staff (Bears +3 -105), Tuley (Bears +9 teaser — not comparable). Koerner projects exactly +3 (0.0% edge, ATS confidence #14). Brandon Kravitz (Bears SB 14/1 after Simmons) is a futures signal only. Note: four of these were priced at +3.5 and have lost the hook.
- **SEA side:** Doug Kezirian (-3; Macdonald limits explosives), Joe Gibbs (SEA, line not stated; ref Shawn Smith home teams 29-10-1 ATS), Simon/Sharp or Square (-3), Zachary Cohen/VSiN (-2.5 -115), PFT (SEA 20-14 SU). Primer: Darnold 8-0 SU in home night starts since leaving NYJ.
- **Total:** no expert total on the full game; PFT 20-14 (34) implies under; Caleb Williams road overs 8-2-1 is the over argument; John Ewing CHI "O 10.5" pick_signal is a non-comparable market — ignored.

## Counter-case

- **CHI +3:** Seattle's defense (#2 EPA) is the best unit in the game and Darnold has been unbeatable at home at night; Shawn Smith home-team ATS trend; juice to -119 says the market wants SEA -3.5; Simmons may be a part-timer; Ben Johnson's teams have been strong primetime but he is 2-7 1H in division — irrelevant here, and his 14-2-1 non-division ATS is a small sample. A 7-point SEA win via one defensive TD is entirely plausible.
- **Under 46:** CHI runs 72 plays/g and Caleb's road games have gone over by 12.3 PPG; Seattle's 12 giveaways can create short fields; public money is heavy on the over and two of SEA's games went 61+.
- **SEA SU:** the model makes CHI 40% outright; the sharp ML money on CHI says it could be closer to 43-45%.

## Ambiguity / missing data

- `missing_inputs[]` empty. Final (Saturday) injury designations not yet published for this MNF game.
- Jadarian Price: operator says IR, Rotowire says designated to return + full Friday. Drake Thomas: operator OUT vs feed "limited Thursday" — operator note used.
- Simmons/Nelson role and snap counts after mid-week trades: unknown.
- Beanie Bishop Jr. "SUSPENSION" from FantasyPros feed (needs_human_review) — unverified.
- Projected-starters coverage is thin (manual/estimated); dossier availability sections empty.
- Primer "double-digit preseason win total" trend not applied: CHI's preseason total is not in the packet.

## Pre-kickoff delta checklist

1. Saturday final injury report: Cross (expected OUT), Shaheed, Charbonnet, Monangai, Loveland, Murphy II. Cross active → drop CHI to pass.
2. Spread: CHI +3.5 appears → upgrade to B and SC primary; SEA -2.5 → pass the side.
3. SEA juice past -125 on -3 → recheck (market heading to 3.5; wait for the hook).
4. Total: 45 or lower → under becomes pass at 44.5; 47 → upgrade under to B.
5. Monday inactives ~3:45 PM PT: Simmons active/role; Jadarian Price activated from IR.
6. CHI ML at +165+ with sharp ML split persisting → reconsider ML at C.

## Gate notes

- Roster vet: PASS (age 8.5h). No props in this pass, so UNVERIFIED players do not affect picks.
- Kickoff not passed (Mon 5:15 PM PT).
- Operator notes vs feed conflicts (Price IR, Drake Thomas) — operator notes preferred, flagged.
- Final injury designations: one web search done; Seahawks.com 10/26 update only; MNF final report publishes Saturday.
- Secondary-matchups coach names ignored per rule; dossier coaching (Ben Johnson, Mike Macdonald) used.
- Prop-board game rows are the same capture as the paste (01:52:39Z) — no newer BKR number available.

Sources: [Seahawks.com injury plan 10/26](https://www.seahawks.com/news/this-week-s-plan-for-rb-jadarian-price-zach-charbonnet-and-other-seahawks-injury-updates); [TSN — Cross high ankle sprain](https://www.tsn.ca/nfl/article/source-seahawks-lt-cross-has-high-ankle-sprain-likely-to-miss-time-n1-50288850/).
