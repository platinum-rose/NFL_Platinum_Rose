# DEN @ ARI — Week 7 game synthesis, pass `sides`

As-of: Fri 2026-10-23 18:30 PT · Kickoff: Sun 10/25 13:05 PT (State Farm Stadium, retractable roof) · Inactives ~11:35 PT Sun · Packet built 2026-10-24T01:26:41Z · roster_vet: PASS (age 0.0h at build; 1 INFO / 1 UNVERIFIED)

## Recommendation box

- **SPREAD:** ARI +4 -101 (BKR live 13:12 PT) | **C** | fair DEN -3.5 | edge 0.5 pt | playable to ARI +4 -110; pass at +3.5
- **TOTAL:** Under 43 -107 (BKR) | **C** | fair 41.5 | edge 1.5 pts | playable to 42.5 -110; pass at 42
- **MONEYLINE/SU:** PASS (DEN -223 / ARI +193; sim ARI win 35% vs 34.1% implied, no usable edge) | SU winner: **DEN**
- **SuperContest:** ARI +4.5 — candidate (marginal, C; sim 52.7% at contest line)
- **Pool:** BUK BUK SU = DEN · confidence **9/16** (≈64-65% win)

## Game script

The base case is a low-event game: Denver's offense ranks 27th in EPA/play (-0.088), throws short (aDOT 4.9), and punts on 48.5% of drives (30th). Arizona has a bottom-five defense, worst against the pass (FTN pass-D DVOA +32.6%, EPA/DB +0.259). Arizona plays slow and moves the ball in small chunks: 6.2 plays/drive, high CPOE (+4.8%), very few explosives (4.5%). Without the rookie RB, Arizona splits carries between Knight and Allgeier. Denver's defense creates turnovers (10 takeaways) and has a 7.2% sack rate. That favors a field-position game decided by one or two Denver short fields. Denver has trailed in all 6 games and is 4-0 in one-score games. That record points to a Denver win by a field goal to a touchdown more than to a margin that clears 4. [Source: team dossiers DEN.md/ARI.md built 2026-10-22T22:58Z; article_notes Sharp Football Worksheet 2026-10-21; expert_picks_pull Action Network 2026-10-23]

## QB / availability (Friday designations)

- **QBs:** DEN Bo Nix (Payton said Monday there are no plans to bench him); ARI **Jacoby Brissett** (Andy-confirmed, qb_operator_notes). Carson Beck (back) is **Questionable** but is not the starter. Beck does not change the pick unless Brissett is hurt in-game. [qb_operator_notes; availability ESPN API 2026-10-24T00:50Z]
- **DEN Out:** S Talanoa Hufanga (ankle), OLB Jonah Elliss (ankle), RB Tyler Badie (thumb). **Questionable:** CB Pat Surtain II (ankle; limited all week, missed W5–W6). WR Jaylen Waddle (chest) has **no designation**. OLB Jonathon Cooper is reinstated from the Exempt List. [availability ESPN/FantasyPros 2026-10-23/24; denverbroncos.com Wed report 2026-10-21]
- **ARI Out:** RB Jeremiyah Love (ankle), DT Walter Nolen III, S Andrew Wingard (knee), G Jon Gaines II. **Questionable:** S Budda Baker (groin/illness), CB Max Melton (knee), DT Darius Robinson. The derived defensive-front cluster risk is flagged. [availability 2026-10-23/24]
- **If Surtain is in:** Denver's man/blitz coverage gets its shadow corner back, which helps DEN and the under. **If he is out:** this is the same setup that held LAC and SEA to 3.8 and 4.3 YPP, so the effect is small. Hufanga's absence opens the middle for Trey McBride (secondary file: te_middle_boost). That keeps Arizona's offense on schedule and supports the ARI cover more than the over.
- **If Baker and Melton are both out:** Arizona's secondary is down to backups. That is the main path for a Nix bounce-back and a Denver cover. Check at inactives.

## Market

- **Opener → current:** AN open DEN -4.5 / 43.5 / ML -210 (Sun 10/18 5 PM PT). BKR paste (Fri ~11:40 PT): DEN -4 -110 / 43 / -211. **BKR live board, newest (Fri 13:12 PT):** DEN -4 -116 · ARI +4 -101 · o43 -109 / u43 -107 · ML -223/+193. The spread moved half a point toward Arizona and the total dropped 0.5. The ML price moved slightly toward Denver while the spread moved toward Arizona, which is a mild tension. [market.an_opener; bookmaker-gamelines-2026-10-23-week7.raw.txt; bookmaker-live-2026-10-23-broncos-at-cardinals.json capturedAt 2026-10-23T20:12:08Z]
- **Contest vs BKR:** the SuperContest line is DEN -4.5 (locked 10/22), so Arizona gets half a point more in the contest than at BKR.
- **Splits (AN, 10/23 19:40Z):** spread 60% of bets / 68% of money on DEN (8-point gap, below the 10-point flag; money leans Denver). Total 53% of bets / 59% of money on the under (6-point gap). ML: 92% of bets / 89% of money on DEN. **No sharp flag.** The money lean on Denver works mildly against the ARI play.

## Quantitative

- **Power:** SRS DEN +0.39 (#17) vs ARI -9.90 (#31). Net PPG -1.8 (#22) vs -8.7 (#30). Pythag .446 vs .306. Market-implied win totals 11.07 vs 6.07. Denver's market rating is well above its results model (delta +0.99 z); Denver is overvalued relative to its own production. [power_ratings]
- **Kalshi/Polymarket (context only):** DEN median 10.9 wins / 70% to make the playoffs; ARI median 5.9.
- **FTN (through W6):** DEN offense DVOA -5.8%, defense -10.0%. ARI offense -0.5%, defense +9.3%. Per-drive: DEN offense 1.62 (28th) vs ARI defense 2.73 allowed (29th). [ftn context; Sharp Worksheet]
- **Totals history:** Denver's games average 39.8 points (5/6 under 43). Arizona's games average 50.7 (3/6 over 43). Arizona's high totals came against SF, NYG and DET, all better offenses than Denver's.
- **Rest:** Denver last played Thursday 10/15, so it gets about 10 days of rest against Arizona's 7. That edge is small and already in the line.
- **Simulator** (calibration 2018-2025; adjustments: margin +0.5 home because DEN's results-based ratings trail its market rating, Arizona has a TE-middle edge, and DEN's offense is weak on the road at 1-2; total -1.5 because of DEN's offensive pace and punt rate and the likely closed roof):

| Run | Home line | Adj (m/t) | ARI cover (excl push) | Under (excl push) | ARI win |
|---|---|---|---|---|---|
| BKR baseline | +4 | 0 / 0 | 50.0% | 50.0% | 34.8% |
| BKR adjusted | +4 | +0.5 / -1.5 | 51.4% | 54.7% | 36.0% |
| Contest baseline | +4.5 | 0 / 0 | 50.0% | — | 33.7% |
| Contest adjusted | +4.5 | +1.0 / -1.5 | 52.7% | 54.7% | 36.2% |

Break-evens: ARI +4 -101 needs 50.2%; Under -107 needs 51.7%. Neither edge clears B. Exact-margin probabilities: 3 = 15%, 7 = 9%; 4 is not a key number.

## Expert / podcast / article agreement

- **ARI +4.5:** Steve Fezzik (2u) and Ross Tucker (2u Best Bet), both on the same YouTube show (f9sJImNONrQ), so count it as 2 opinions, not a consensus. Also Jason Radowitz (Tier 2), BettingPros (10/20), and Action Network ("value catching +4.5"). All were priced at +4.5; BKR is now +4, so these leads have lost half a point.
- **DEN:** Simon Hunter, "Sharp" pick DEN -4 (youtube-b9FjoVzHbY0). The same speaker had ARI +4.5 earlier in a different episode, so treat him as **split / neutral**. PFT predicts DEN 24-13 (an 11-point margin and a 37 total, which supports the under). Action Network has a DEN comeback-win prop (+150), which is "ARI covers, DEN wins", our exact base case.
- **Dropped/flagged:** VSiN "Broncos ML +130" cannot be this game (DEN is about -210), so it is probably mis-keyed to another matchup; excluded. ESPN "Under 35" is a W6 Rams-game time-of-possession line, not a pick; excluded. Makinen's selection text is a CIN@BAL pick mis-tagged to ARI/DEN; excluded. Radowitz "Panthers -3.5" is a different game.

## Counter-case

- **ARI +4:** Denver's defense is a real top-10 unit and gets Cooper back and possibly Surtain. Arizona has lost 9 straight at home and its pass defense ranks last. If Nix finally takes advantage of 8.6 YPA allowed, Denver wins by 7-10. Money is on Denver at 68%.
- **Under 43:** Arizona's games have gone over 50 three times. Its defense has allowed a QB1 fantasy game five weeks in a row, and the free safety (Wingard) is out (deep_pass_boost). One or two Denver defensive or return touchdowns would push it over too.
- **SU DEN:** Arizona's two wins are the two biggest upsets of the season (+9.5 vs LAC, then LAR). Brissett runs a high-CPOE, low-sack short game that can keep Arizona level on the scoreboard.

## Ambiguity / missing data

- `missing_inputs[]` is empty. No props intel articles (not needed for sides). There is no BetOnline board.
- **ARI head coach:** the dossier lists Jonathan Gannon (marked historical_context_only), but current Friday reporting (PFT, Rotowire, NBC fantasy notes since August) quotes **Mike LaFleur** as head coach. This needs a fix upstream. The secondary-matchup "Gannon zone match" and "Vance Joseph" labels were ignored, per the prompt rule.
- Roof status is undecided. Weather is treated as moot (status: venue verification required).
- ARI projected starters: needs a manual depth chart.

## Pre-kickoff delta checklist

1. Surtain active → hold; Surtain out → hold (W5–W6 showed it is priced in).
2. Baker **and** Melton out → downgrade ARI +4 to PASS.
3. BKR moves to ARI +3.5 → PASS the spread; ARI +4.5 or better → keep C (no upgrade unless +5).
4. Total moves to 42 or lower → PASS the under; 44 or higher → keep C.
5. A late 10+ point money-vs-bets gap on either side → revisit that market.
6. Brissett is anything but active → re-run everything (Beck is Q, back).

## Gate notes

- Roster vet PASS (fresh). missing_inputs: none.
- Kickoff has not passed; this is a forward pick.
- The availability feed (ESPN API) carries Friday designations; the official Friday PDF could not be fetched (the team site only had the Wednesday report). Statuses here come from the ESPN feed quoting Cardinals.com (Urban) and DEN.
- Coaching-name conflict noted above (dossier Gannon vs current LaFleur).
- Several pick_signals and article_selections were mis-keyed and were excluded (see the Experts section).
