# IND @ JAX — Week 8 2026 game synthesis, pass `sides` (Saturday re-run)

- As-of: Sat 2026-10-31 ~3:30 PM PT (22:30Z)
- Kickoff: Sun 11/1 10:00 AM PT (18:00Z; 1:00 PM ET), EverBank Stadium, outdoor/grass. DST ends 2 AM Sunday, so 10:00 is PST. **Inactives ~8:30 AM PT.**
- Packet built_at: 2026-10-31T21:55:40Z (scratch/w08-game-synthesis-queue-sides.json) · roster_vet: **PASS** (roster 0.3 h old; 14 UNVERIFIED league-wide)
- Market: BKR game-lines paste Sat ~2:26 PM PT (raw.txt). The BKR per-game board was captured 2026-10-31T21:27:33Z (2:27 PM PT) and has **identical** main lines, so there's no newer number. Friday's baseline was BKR 6:51 PM PT Fri.

## Recommendation box

| Market | Pick | Tier | Fair | Edge | Playable-to |
|---|---|---|---|---|---|
| SPREAD | **PASS** (lean JAX -10 -106 BKR) | PASS | JAX -10.5 | +0.5 JAX | JAX -9.5 -110 or better = C; pass at -10 |
| TOTAL | **UNDER 46 -103 (BKR)** | **B** | 44.5 | 1.5 pts | to u45.5 -110; pass at 45 or lower |
| MONEYLINE / SU | **PASS** price (JAX -535 / IND +427); SU winner **JAX** | PASS | JAX ~-393 (79.7%) | -535 implies 84.3%, so JAX is overpriced by ~4.6 pts of prob | none |
| SuperContest | JAX -9.5: lean only, **not a candidate** (sim 52.9%, 1.0 pt edge, counter-signals) | C | JAX -10.5 | +1.0 | n |
| Pool | BUK BUK SU: **JAX** · Confidence **14/16** | — | — | — | — |

Card-fit: Under `parlay_leg_ok = y`. It correlates with an IND cover and with JAX ML; don't pair it with JAX -10 or JAX TT over. `standalone_preferred = n`. JAX ML works as a pool and survivor anchor only, not as a priced leg at -535.

## Changes vs Friday

1. **Price, not number.** BKR is still JAX -10 / 46. The JAX side went from -103 to **-106** (IND from +10 -113 to -110), and the ML moved from -519/+417 to **-535/+427**. The total is unchanged at o-113/u-103. IND TT 17.5 moved from o-102/u-112 to **o+100/u-114** (slightly more under-juice on IND), while JAX TT 28.5 and the 1H lines (JAX -6.5, 23.5) are unchanged. That's a small tilt toward JAX and the IND TT under. It isn't a line move. [bookmaker-live-2026-10-31-colts-at-jaguars.json 21:27Z vs _friday-20261031/bookmaker-live-2026-10-31-week8.json 01:50Z]
2. **IND backfield signal.** Jonathan Taylor's BKR rushing-yards line went 61.5 (Thu 23:01Z) → 57.5 (Fri) → **49.5** (Sat), and carries went from 15.5 to **14.5**. Seth McGowan's rushing-yards menu was **priced Friday (o/u 18.5, -113/-103)** and is now **listed with every row unavailable (no odds)**. McGowan isn't on the official injury report (nfl.com Week 8), and the BKR menu groups him with Taylor under "Colts vs Jaguars". A web search shows him as an IND backup RB ([RotoBaller handcuff note](https://www.rotoballer.com/?p=1959816)). The most likely reading is that **BKR pulled the IND RB2 market pending Taylor trade news**: ESPN reported Sat 14:49Z that the Colts are "willing to trade" Taylor and are in active talks, and Fowler said interest is "heavy and real" [news_notes]. Taylor's ATD is still -125, so the book expects him to play. Nothing on the official report changes. Treat this as a live tail risk; it isn't a fact.
3. **Splits (AN 2:23 PM PT).** Spread: JAX 57% of bets / 64% of money (Fri 56/64), so no flag. Total: over 49% bets / **53% money** (Fri 46/48), a 4-pt over money lean, still under the 10-pt flag. ML JAX money fell from 90% to 86% [packet splits].
4. **Official final injury report found** (Friday's search failed). It confirms the packet designations, with no surprises (QB section).
5. **Weather.** The Fantasy Forecasts X post (Sat pull) has 77°F, 32% rain, **15 mph wind, 25 mph gusts**, and the slate post flags IND@JAX as a major weather game. Open-Meteo in the packet is unchanged (13 mph, 21 mph gusts, 39%). Rain risk is down from the 10/28 tweet (71%), and wind is consistent to slightly higher. Net: the under support is unchanged.
6. **New intel on the total.** Action Network PRO Systems (Kolodziej, updated Oct 31 1:33 PM PT) flags **Under 46.5** on two systems, High Winds (58%) and Divisional Unders. These are **systems, not experts**, and they repeat the two Bet Labs systems already counted Friday, so they add no extra weight [chrome-article-picks].
7. **New Saturday podcast/article rows are all props/TD** (Gallant ATD Treadwell/Lawrence; Erickson Taylor u16.5 attempts and Rodriguez FTD; Welsh Hunter FTD; Tera Roberts Washington ATD; X bookmarks on Tuten/Lawrence/Jones/Taylor props). None is a side or total pick. Erickson's Taylor-under-attempts call and the BKR carries drop point the same way. The BettingPros Saturday refresh has **no IND@JAX picks**.
8. **Gate change:** `qb_operator_notes` is **empty** in today's packet (Friday's had entries). QBs are taken from the AN primer and news (below).

**Net change: no change to any pick or tier.** The under stays B at 46. The spread stays PASS, and its price got 3 cents worse for JAX backers. The Taylor tail risk adds a little to the under and JAX, but it isn't priced into the view, and the delta checklist covers it.

## Game script
JAX comes off a Week 7 bye; its last game was a 34-31 London loss to HOU. IND is on a three-game skid after a 16-10 loss at MIN and traded G Quenton Nelson (SEA) and DT DeForest Buckner (SF) on 10/27 [news_notes ESPN/PFT]. The base script is a JAX lead built on Tuten/play-action against a run defense missing Buckner. IND's offense (4.51 YPP, EPA/play #26, 12 giveaways) has to throw into a JAX front with a 29.7% pressure rate without its best guard [dossiers IND/JAX]. Likely final range: JAX 24-27, IND 13-17. A late IND backdoor is the main path to a 7-10 margin.

## QB / availability
- QBs: IND **Daniel Jones** (Steichen reaffirmed him as QB1 on 10/26), JAX **Trevor Lawrence** [an_primer.game; news_notes PFT/Rotowire]. Andy-confirmed operator notes are absent today.
- **Official final report (nfl.com Week 8, fetched Sat):** IND: WR Anthony Gould **OUT** (concussion), CB Justin Walley **OUT** (knee, slot), TE Andrew (Drew) Ogletree **Q** (knee, DNP), LB Bryce Boettcher **Q** (groin, DNP). Sauce Gardner and Tyler Warren are full with no designation. JAX: S Antonio Johnson **OUT** (ankle), WR Jakobi Meyers **Q** (hamstring/ankle, DNP). Hines-Allen, LeQuint Allen Jr., Tavai and Matiscik were limited with no designation.
- Meyers was DNP all week, so read Q as likely out. Slot volume moves to Parker Washington and the TEs, which doesn't move the side or total.
- **If Taylor is traded or inactive** before 10 AM Sunday: fair JAX ≈ -12, total ≈ 43, and the under goes to B+ (sim: +2.0/-3.0 gives under 59.3% ex-push, JAX -10 55.9%). JAX -10 becomes a C play at -10/-110 in that scenario only.

## Market
- AN open (Sun 10/25 5 PM PT): JAX -7.5 (-108), 46.5, ML -400/+305. Mid-week JAX -8.5/-9. **Now JAX -10 -106 / IND +10 -110, 46 o-113/u-103.** That's 2.5 pts toward JAX since open, almost all of it after the trades. The total is down 0.5 (the primer lists a 48.5 open; see Ambiguity).
- SuperContest JAX -9.5 (locked 10/29), which is 0.5 better for JAX than BKR.
- Splits: no sharp flags (+7 JAX money on the spread, +4 over money on the total). Public is 94% on the JAX ML.

## Quantitative
- Power ratings (through W7): JAX SRS +8.41 (#2), IND -4.13 (#25). Regressing 50% toward priors and adding ~1 pt for the trades gives a **fair JAX -10.5**. Koerner projected IND +9.5 on 10/28 [article picks]. Prediction markets: JAX division 80%, IND playoffs 4% (context only).
- Secondary matchups: IND secondary vulnerability is HIGH (Walley out); JAX's is medium (A. Johnson FS out, deep-pass boost for IND). Coverage-note coach names are ignored.

**Simulator** (`margin-simulator.mjs`, selftest PASS; calibration 2018-2025):

| Run | Home cover | Away cover | Push | Over | Under (ex-push) | JAX win |
|---|---|---|---|---|---|---|
| BKR -10 / 46 baseline | 48.7% | 48.7% | 2.5% | 48.5% | 48.5% (50.0%) | 79.6% |
| BKR -10 / 46, +0.5 / -1.5 | **50.2%** (51.5% ex-push) | 47.3% | 2.5% | 43.9% | **53.0% (54.7%)** | 80.5% |
| SC -9.5 baseline | 50.0% | 50.0% | 0 | — | — | 78.7% |
| SC -9.5, +1.0 / -1.5 | **52.9%** | 47.1% | 0 | — | — | 80.6% |
| Taylor-out scenario -10/46, +2.0 / -3.0 | 54.5% | 43.0% | 2.5% | 39.5% | 57.5% (59.3%) | 83.3% |

Adjustments are unchanged from Friday: **margin +0.5** (fair -10.5 = regressed SRS plus the trade downgrade) and **total -1.5** (IND offense bottom-7 YPP with an OL downgrade against a strong JAX run D; 15 mph wind and 25 mph gusts; JAX 19-7 home 1H-under profile; wind/divisional-under systems). JAX -10 at -106 needs 51.5% ex-push and the sim gives 51.5%, so it's a pass. Under 46 at -103 needs 50.7% and the sim gives 54.7% ex-push, so it's playable.

## Expert / podcast / article agreement
- **JAX side:** Kravitz, B. Anderson (four-square leg), BettingPros (-7.5; survivor), PFT (24-9). All were priced at -7.5, and the line has since moved **2.5 against them**.
- **IND side:** Tuley (VSiN Best Bet IND +10) and Koerner (IND +10, conf #6/26). Situational support: division dogs are 23-10 ATS, 6+ pt favorites are 8-21-3 ATS, and ref Adrian Hill trends (home favorites 0-12 ATS; Lawrence 0-6 ATS). Bet Labs IND spread systems agree.
- **JAX trends:** 18-3-1 ATS vs IND since 2015, Coen/Lawrence 9-2 ATS at home, rest edge.
- **Total:** BettingPros Under 46.5, Woolcock IND TT u18.5, PFT's 33-point projection, AN PRO High Winds + Divisional Unders systems. **Nobody is on the over.** Ewing's "O6.5/O11.5" are season win totals and are excluded.

## Counter-case
- **Spread:** For JAX, the series history, the bye and the selloff all point their way, and the Taylor tail adds to it. For IND, it's the classic overreaction number: 2.5 pts of trade move into a key-number-adjacent 10, with a ref and big-favorite ATS climate that punishes it. The two cancel.
- **Under:** JAX scores 30.8 PPG at home under Coen/Lawrence. IND's 12 giveaways mean short fields. An IND defense missing Buckner, Walley and depth could give up 30+ alone. A garbage-time IND TD gets over 46. Money is leaning slightly over today (53%).
- **ML:** 80% fair vs 84% implied. An upset needs IND turnover luck.

## Ambiguity / missing data
- AN primer total open of 48.5 vs the packet opener of 46.5 (10/26 00:12Z). This report uses 46.5. If the open was 48.5, the total has dropped 2.5.
- The McGowan market suspension is unexplained. The trade-news reading is an inference, not a source.
- `qb_operator_notes` is empty today. The Open-Meteo forecast is a Friday-night snapshot (mtime 01:02Z).
- The availability feed has known misclassification bugs (the Travis Hunter row is dated 2025). The official report supersedes it.

## Pre-kickoff delta checklist
1. **Taylor trade, inactive or limited** (watch Schefter/Rapoport through Sunday morning; inactives 8:30 AM PT): under goes to B+, JAX -10 to C, fair -12 / 43.
2. JAX at -9.5 at BKR: JAX becomes playable at C. At -10.5 or higher, still a pass.
3. Total at 45 or lower: under goes to PASS. At 46.5 or higher: the under strengthens (still B).
4. Sunday morning forecast calm and clear: trim the under to C. Sustained 15+ mph wind or rain: hold B.
5. Meyers OUT: no change. Any Lawrence or Jones status change: everything goes to PASS.

## Gate notes
1. `missing_inputs[]` is empty, so no tier caps.
2. roster_vet PASS (0.3 h, 14 UNVERIFIED league-wide); no player picks in this pass.
3. Kickoff hasn't happened, so these are forward picks.
4. **`qb_operator_notes` is empty** in the Saturday packet. QBs come from the AN primer and team news.
5. The one injury search found 2025 pages. The nfl.com 2026 Week 8 injury page was fetched directly and used as authoritative. A separate quick search was used for McGowan's status (rule 4).
6. Coach names in `secondary_matchups` were ignored. HCs per the dossiers/primer: Steichen (IND), Coen (JAX).
