# IND @ JAX — Week 8 2026 game synthesis, pass `sides`

- As-of: Fri 2026-10-30 11:22 PM PT (2026-10-31T06:22Z)
- Kickoff: Sun 11/1 10:00 AM PT (18:00Z; 1:00 PM ET), EverBank Stadium, outdoor/grass. **DST ends 2 AM Sun, so 10:00 is PST.** Inactives ~8:30 AM PT.
- Packet built_at: 2026-10-31T06:09:16Z (scratch/w08-game-synthesis-queue-sides.json) · roster_vet: **PASS** (roster 8.5 h old, 2 UNVERIFIED league-wide)
- Market: BKR paste Fri 6:52 PM PT; BKR per-game board 2026-10-31T01:51:25Z (6:51 PM PT) shows **identical** game lines, so there's no newer number.

## Recommendation box

| Market | Pick | Tier | Fair | Edge | Playable-to |
|---|---|---|---|---|---|
| SPREAD | **PASS** (lean JAX -10 -103 BKR) | PASS | JAX -10.5 | +0.5 JAX | JAX playable only at -9.5 -110 or better; pass at -10 |
| TOTAL | **UNDER 46 -103 (BKR)** | **B** | 44.5 | 1.5 pts | to u45.5 -110; pass at 45 or lower |
| MONEYLINE / SU | **PASS** price (JAX -519 / IND +417); SU winner **JAX** | PASS | JAX ~-390 (79.7%) | JAX ML overpriced ~4 pts of prob | none |
| SuperContest | JAX -9.5: lean only, **not a candidate** (sim 52.9% cover, edge 1.0 pt, heavy counter-signals) | C | JAX -10.5 | +1.0 | n |
| Pool | BUK BUK SU: **JAX** · Confidence: **14/16** (2nd-tier lock behind the largest favourites) | — | — | — | — |

Card-fit: Under is `parlay_leg_ok = y` (correlates with an IND cover and a JAX ML; don't pair it with JAX -10 or JAX TT over). `standalone_preferred = n` (the edge isn't big enough to stand alone). JAX ML is fine as an SU anchor in pools. Don't use it as a priced parlay leg at -519.

## Game script
JAX comes off a Week 7 bye; its last game was the Week 6 34-31 London loss to HOU [packet availability JAX; dossier JAX game log]. IND arrives on a three-game losing streak after a 16-10 loss at MIN. The Colts traded G Quenton Nelson (SEA) and DT DeForest Buckner (SF) on 10/27 [qb_operator_notes; news_notes ESPN 2026-10-27]. The expected script is a JAX lead built on the run and play-action. IND's offense (4.51 YPP, -0.056 EPA/play #26, 12 giveaways) has a hard time sustaining drives against a JAX run defense posting -31.1% rush DVOA and 33.9% success allowed [dossiers IND/JAX, FTN through W6/W7]. IND has to throw into a 29.7% pressure-rate front without its best guard. Through six games JAX has been #3 in offensive EPA/play (0.152) and allows 17.3 PPG. The likely script is a 24-27 to 13-17 JAX win. A late IND backdoor is the main path to a cover in the 7-10 range.

## QB / availability
- QBs (Andy-confirmed): IND **Daniel Jones**, JAX **Trevor Lawrence** [qb_operator_notes]. Steichen reaffirmed Jones as QB1 on 10/26 [news_notes PFT].
- IND: WR Anthony Gould **OUT**. TE Drew Ogletree **Q**. CB Justin Walley (slot) **OUT**. LB Bryce Boettcher **Q**. TE Tyler Warren is playing (groin). CB Sauce Gardner is set to play (full practice Thu). WR Josh Downs is "ready to go" despite his trade request. WR Alec Pierce is not activated (heel). Kevin Givens (DT) and Charlie Heck (OT) were signed to replace the traded players [news_notes PFT/ESPN/Rotowire 10/26-10/30].
- JAX: WR Jakobi Meyers **Q** (hamstring/ankle, missed Fri). S Antonio Johnson **OUT** (FS). CB Caleb Ransaw is on IR. RB LeQuint Allen Jr. was limited (hamstring) [qb_operator_notes; availability; secondary_matchups].
- If Meyers is out, JAX's slot volume shifts to Parker Washington and the TEs. That changes almost nothing for the side or total, and the downgrade is mostly baked in. **If Jonathan Taylor is traded or held out** before Sunday (deadline Nov 10; he and Steichen deny a request), IND's offense loses its only efficient engine. That would favour JAX and the under: the fair line moves to about -12 and the total to about 43.
- The one allowed web search for the final Friday reports returned no 2026 Week 8 pages. Designations above come from the packet and qb_operator_notes (gate note 3).

## Market
- AN open (Sun 10/25 5:00 PM PT): JAX -7.5 (-108), total 46.5, ML JAX -400 / IND +305 [market.an_opener]. Mid-week the line was JAX -8.5 / IND +9 (Ewing tweets, 10/28 00:00Z), and it is now **JAX -10 -103 / IND +10 -113, 46 o-113/u-103** at BKR. The spread moved **2.5 points toward JAX**, almost all of it after the 10/27 trades. The total ticked down 0.5.
- SuperContest locked line: JAX -9.5 (captured 10/29). BKR is 0.5 worse for JAX backers, sitting on the 10.
- AN splits (7:06 PM PT): spread JAX 56% of bets / 64% of money (+8, **under the 10-point sharp flag**, mild JAX money lean). Total under 54% bets / 52% money (no flag). ML JAX 94/90 [splits; an_primer.public].
- BKR derivatives: team totals JAX 28.5 / IND 17.5 (u-112). 1H JAX -6.5 -112, 1H total 23.5 (u-112) [prop_boards.bookmaker 01:51Z].

## Quantitative
- Power ratings (nflverse through W7): JAX SRS +8.41 (#2), net +8.3 PPG; IND SRS -4.13 (#25), net -3.7 PPG [power_ratings]. The raw gap (~12.5 + ~1.5 HFA ≈ 14) is too hot on six or seven games. Regressing 50% toward the 2025 priors (JAX SRS #3, IND #8) gives about 9.5. Adding about 1 point for the Nelson/Buckner trades gives a **fair JAX -10.5**. Koerner's independent projection was IND +9.5 on 10/28 [youtube_picks_approved, Koerner].
- Prediction markets: JAX division 80%, median wins 11.6. IND playoffs 4%, median wins 6.3. This is context only and agrees with the direction.
- FTN: IND pass protection allows a 25.1% pressure rate and a 7.1% sack rate. JAX's pressure rate is 29.7%. IND's defense allows 6.0 YPP and 24.9 PPG, and its defensive-front cluster risk is flagged with opponent-boost risk [dossiers; availability.summary].
- Secondary matchups: IND secondary vulnerability is HIGH (slot CB Walley out). That favours JAX passing efficiency more than volume. Coach names in that block are ignored per the rule.
- Weather: Open-Meteo shows 78°F, 39% precip probability, 0 mm, wind 13 mph with 21 mph gusts, materiality "none" [weather]. A Fantasy4Casts tweet on 10/28 had 71% rain and 24 mph gusts, so wind is a soft under factor.

**Simulator** (`margin-simulator.mjs`, selftest PASS):

| Run | Home cover | Away cover | Push | Over | Under | JAX win |
|---|---|---|---|---|---|---|
| BKR -10 / 46 baseline | 48.7% | 48.7% | 2.5% | 48.5% | 48.5% | 79.6% |
| BKR -10 / 46, margin +0.5, total -1.5 | **50.2%** | 47.3% | 2.5% | 44.0% | **53.0%** (54.7% ex-push) | 80.5% |
| SC -9.5 baseline | 50.0% | 50.0% | 0 | — | — | 78.7% |
| SC -9.5, margin +1.0, total -1.5 | **52.9%** | 47.1% | 0 | 44.0% | 53.0% | 80.6% |

Adjustments (within the soft cap):
- **Margin +0.5 vs -10**: fair -10.5 from the regressed power rating plus the trade downgrade.
- **Total -1.5**: IND's offense is bottom-7 in YPP with an OL downgrade into an elite run defense; wind/rain risk; JAX's 19-7 home 1H-under profile; two Bet Labs under systems.

JAX -10 at -103 needs 50.7% and the sim gives 50.2%, so **no bet**. Under 46 at -103 needs 50.7% against 53.0% (54.7% ex-push), so that's the playable edge.

## Expert / podcast / article agreement
- **JAX side:** Brandon Kravitz (AN Favorites, JAX -7.5), Brandon Anderson (JAX -7.5, four-square leg), BettingPros (JAX -7.5, survivor pick), PFT (24-9 JAX). Every one of these was priced at -7.5 and **the line has moved 2.5 against them**, through 8, 9 and 10.
- **IND side:** Dave Tuley (VSiN Best Bet **IND +10**), Sean Koerner (IND +10, confidence #6/26, edge 1.5%). The situational systems also favour IND: division dogs are 23-10 ATS this season, 6+ point favourites are 8-21-3 ATS, and two Bet Labs spread systems are on IND.
- **Ref:** Adrian Hill. Home favourites are 0-12 ATS with Hill since 2025, and Lawrence is 0-6 ATS with him [an_primer, Abrams].
- **For JAX:** JAX is 18-3-1 ATS vs IND since 2015 and 9-1 ATS at home in the series. Coen/Lawrence are 9-2 ATS at home. JAX has the rest edge (rest-advantage teams are 22-8-1 ATS) [an_primer; FATBOSSPICKS tweet].
- **Total:** BettingPros has Under 46.5 and Seth Woolcock has IND TT Under 18.5 (Polymarket 55%). PFT's projected 33 total points out of 24-9 also implies the under. Bet Labs has two under systems (Med-High Wind, Divisional Unders High Total). Nobody in the packet is on the over. Ewing's "IND O6.5 / JAX O11.5" pick_signals are **season win totals**, not game totals, so they're excluded.

## Counter-case
- **Spread (pass):** If you're on JAX, the series history, the bye, the selloff and Coen at home all point that way. If you're on IND, a 10-point division number off a two-man selloff is the "overreaction" spot that this season's big-favourite ATS data punishes. Hill's ref trend, Tuley and Koerner also back the dog. The two sides cancel at -10.
- **Under:** JAX scores 30.8 PPG at home under Coen/Lawrence. IND's 12 giveaways hand JAX short fields. IND's defence without Buckner, and with the slot CB and S depth issues, could give up 30+ alone. A garbage-time IND TD also pushes it over 46. The 34-31 HOU game shows JAX can play shootouts.
- **ML pass:** At 80% fair, -519 has no value. An upset would need IND turnover luck (IND has 3 takeaways in seven games, so that's unlikely).

## Ambiguity / missing data
- `missing_inputs` is empty. The AN primer lists the total open as **48.5**, while the packet's AN opener shows **46.5** (10/26 00:12Z). This report uses 46.5 as AN open. If the open was 48.5, the total dropped 2.5, which would support the under.
- JAX's FTN tables are stale by one week (bye week), so that's expected.
- The Open-Meteo forecast (0 mm, 39%) and the 10/28 tweet (71% rain) disagree. Recheck Sunday morning.
- The availability feed has known misclassification bugs (source_note). The DST change on Sunday doesn't affect the 10:00 PT kickoff.

## Pre-kickoff delta checklist
1. JAX moves to -9.5 at BKR, so JAX -9.5 becomes playable at C (also the SC line). At -10.5 or higher, stay on the pass.
2. Total moves to 45 or lower: the under goes to PASS. At 46.5 or higher: the under gets stronger (still B).
3. Jonathan Taylor is traded, inactive or limited: fair goes to JAX -12, total about 43, and the under goes to B+/A-.
4. Meyers is OUT at 8:30 AM PT inactives: no change. If Lawrence shows up on any report, everything goes to PASS.
5. Sunday forecast shows sustained 15+ mph wind or rain: the under holds. A clear, calm forecast trims it to C.

## Gate notes
1. `missing_inputs[]` is empty, so no tier caps were applied.
2. roster_vet PASS (8.5 h). No player-specific picks in this pass.
3. The kickoff hasn't happened yet, so these are forward picks.
4. The one allowed web search for the final Friday injury reports returned only old-season pages. Designations come from qb_operator_notes and the availability feed.
5. Coach names in `secondary_matchups` (coverage notes) were ignored per rule 7. HCs per the dossiers: Steichen (IND), Coen (JAX).
6. The total-open conflict (48.5 vs 46.5) is logged under Ambiguity.
