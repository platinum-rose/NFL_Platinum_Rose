# LAR @ LV — Week 7 game synthesis, pass `sides`

As of: Fri 2026-10-23 18:30 PT · Kickoff: Sun 10/25 13:25 PT (Allegiant Stadium, fixed dome) · Inactives: ~11:55 PT Sun · Packet built: 2026-10-24T01:26:41Z · roster_vet: PASS (age 0.0 h; 1 INFO / 1 UNVERIFIED)

## Recommendation box

| Market | Pick @ BKR | Tier | Fair | Edge | Playable to |
|---|---|---|---|---|---|
| SPREAD | **PASS** (LAR -3 -116 / LV +3 +100) | PASS | LAR -3.4 blended (Nacua in -4.25 / out -2.5) | 0.4 pt, on the 3 | Conditional only: Nacua **active** and LAR -3 at -110 or better → LAR -3 C. Nacua **out** and LV +3 at +100 or better → LV +3 C. Pass at -3.5/+2.5 either way |
| TOTAL | **Over 48.5 -106** | C | 49.25 (in 49.75 / out 48.5) | +0.75 | Playable at 48.5 -110 or better; pass at 49 |
| MONEYLINE / SU | **PASS** (LAR -172 / LV +149) | PASS | LAR ~-157 (61%) | none vs 63.2% break-even | n/a |
| SuperContest | **LV +4** (contest line LAR -4) | C | LAR -3.4 | +0.6 vs contest | Stronger if Nacua is ruled out before you lock (+1.5 edge) |
| Pool | SU **Rams**, confidence **6/16** | — | Rams ~61% to win | — | Drop to 4 if Nacua is out |

[Source: market.bkr_current_line_text, paste ~11:40 PT; newest BKR rows data/generated/props/bookmaker-live-2026-10-23-rams-at-raiders.json, capturedAt 2026-10-23T20:12:29Z; sim runs below]

## Game script
Both offenses lean on the pass: LAR dropback rate 65%, LV 61%. LV's run game ranks near the bottom (EPA/rush -0.248, success 30.7%, stuff rate 29.4%), so Kubiak's offense runs through Cousins and the tight ends. The likeliest game is a shootout in the mid-20s for both teams. LV's defense has allowed a league-high 3.27 points per drive over the last three weeks (it was 4th at 1.54 over the first three). The Rams' defensive front is gutted (Turner, Ford and Garrett on IR, Landman out), which opens the middle for Bowers, Mayer and Tucker. On their side the Rams lose explosiveness at WR: Adams is on IR, and Nacua is the swing factor. Without Nacua, Stafford works the TEs (Higbee, Parkinson) and RB targets against the worst RB-pass defense in the league (Sharp), which keeps the score close. [Source: dossiers data/generated/team-dossiers/2026-w07/LAR.md & LV.md, built 2026-10-22T22:58Z; article_notes Sharp Football worksheet 2026-10-21; expert_picks_pull Warren Sharp]

## QB / availability
- QBs: Stafford (LAR) and Cousins (LV; Andy-confirmed, no Mendoza yet). [Source: qb_operator_notes]
- **Puka Nacua (LAR WR): QUESTIONABLE (calf).** He left Thursday's practice, did not practice Friday, and the injury is "not believed serious" (PFT 10/23 13:29Z). *If out:* the Rams' WR room is Mumpfield/Whittington/Atwell with Adams on IR, and my fair line drops to LAR -2.5. *If in:* fair LAR -4.25 (he is the alpha_x against LV's Cover-3 zone; secondary_matchups flags boundary and underneath boosts). Inactives post around 11:55 PT Sunday. [Source: news_notes ESPN 2026-10-23T18:53Z; availability.LAR]
- LAR Friday designations from the ESPN feed: **Nate Landman LB OUT (concussion)**, **Trent McDuffie CB Q (groin)**, rated outside CB1 and "elite" impact in secondary_matchups. IR: Adams, Kobie Turner, Poona Ford, Myles Garrett, Terrance Ferguson (TE), Blake Grupe (K). Brandon McManus has signed as kicker. [Source: availability.LAR 2026-10-23T23:34–23:40Z; LAR.md Availability]
- LV: **Mike Washington Jr. RB Q (foot)**. Quay Walker and Tonka Hemingway carry no designation. Bowers had a full practice Thursday (Friday status not in the feed; treat as probable). TE Carter Runyon is OUT. [Source: availability.LV 2026-10-24T00:03–00:04Z]

## Market
- AN open LAR -5.5 / 47.5 (10/18 17:00 PT) → BKR LAR -3 / 48.5. The line moved **2.5 points toward LV**, through the 4 and the 3.5. The juice went from LAR -3 -124 (11:40 PT paste) to **-116** (13:12 PT DOM capture, after the Nacua news), so the 3 is under pressure toward LV +3. ML went from -186 to -172. [Source: market.an_opener; BKR files above]
- SuperContest LAR -4 is a full point more than BKR. LV +4 in the contest gets the 4-point hook that BKR doesn't offer. [Source: market.supercontest_line, 2026-10-22T15:03Z]
- Splits (AN 10/23 19:40Z): spread LV 61% of bets / 64% of money (3-pt gap, no flag). **Total Over 49% of bets / 60% of money: 11-pt gap, sharp flag on the OVER.** ML LV 22% / 19%. Caesars reported sharp action on **Raiders +4.5** (10/22). [Source: splits; news_notes Twitter/X 2026-10-22T13:28Z]
- Prediction markets (context only): Rams make-playoffs 44%, LV 23%. [Source: prediction_markets]

## Quantitative
| | LAR | LV |
|---|---|---|
| Record / PF-PA | 2-4, 135-138 | 3-3, 162-162 |
| EPA/play off / def (nflverse) | 0.048 (#11) / -0.038 (#10) | 0.016 (#14) / 0.052 (#24) |
| YPP for / against | 5.88 / 4.82 | 5.33 / 5.98 |
| DVOA off / def (FTN) | +13.1% / -9.4% | -0.7% / +9.1% |
| Pythag delta, one-score | -0.92 (rank 29), 1-3 | 0.0, 1-2 |
| Packet SRS | -2.31 (#22) | 0.51 (#16) |

On full-season efficiency the Rams are about 5–6 points better on a neutral field (YPP gap of about 1.7, net EPA gap of about 0.12 per play). Their 2-4 record is mostly close-game luck and a -3 turnover margin. Injuries take back roughly 2.5–3 points (WR, DL, LB, CB), and LV gets about 1.5 for home field. That produces a blended fair line of **LAR -3.4**.

Totals check: PPG average gives LAR about 24.8 and LV about 25.0 (49.8 combined). LV's last four games totaled 57, 62, 62 and 63. I trim for the Rams' WR losses → fair **49.25**.

Simulator (`margin-simulator.mjs`, selftest PASS; probabilities exclude pushes):

| Run | home-line | margin-adj | total-adj | LV cover | LAR cover | Over | Push@3 |
|---|---|---|---|---|---|---|---|
| BKR baseline | +3 | 0 | 0 | 50.0% | 50.0% | 50.0% | 8.3% |
| BKR blended | +3 | -0.4 | +0.75 | 48.9% | 51.1% | 52.3% | 8.3% |
| BKR Nacua in | +3 | -1.25 | +1.25 | 46.4% | 53.6% | 53.8% | 8.2% |
| BKR Nacua out | +3 | +0.5 | 0 | 51.4% | 48.6% | 50.0% | 8.3% |
| SC blended | +4 | +0.6 | +0.75 | **51.6%** | 48.4% | 52.3% | 2.4% |
| SC Nacua in | +4 | -0.25 | +1.25 | 49.3% | 50.7% | 53.8% | 2.4% |
| SC Nacua out | +4 | +1.5 | 0 | **54.1%** | 45.9% | 50.0% | 2.5% |

Break-evens: LAR -3 -116 = 53.7%; LV +3 +100 = 50.0%; Over -106 = 51.5%. Even with Nacua in, LAR -3 -116 only reaches break-even (53.6%), so the spread is a pass at this price. Over 48.5 clears its break-even in the blended and Nacua-in runs.

## Expert / podcast / article agreement
- **LV side:** Ross Tucker (2u best bet, +4.5), Steve Fezzik (+4.5, top-5 contest pick; he appears in two episodes, which counts as ONE opinion), Simon Hunter (+4.5; his rationale cites "Aaron Donald declining," and Donald is not on the packet's Rams roster, so I discount it), Action Network ("sharp value +4.5"), Caesars sharp report (+4.5). All of these were priced at +4.5. **Repriced: BKR +3 is 1.5 pts worse; the contest's +4 is 0.5 worse.**
- **LAR side:** Steve Makinen/VSiN (Rams -3.5 best bet; BKR -3 is half a point better), SI Betting (Rams -4.5, 10/20, pre-Turner IR and pre-Nacua), PFT (Rams 26-23: SU Rams, a push at -3, total 49 → supports the Over).
- Total: PFT's 49 and the sharp-money flag lean Over. I found no Under voices tied to this matchup.

## Counter-case
- **SC LV +4:** If Nacua plays and McDuffie clears, the Rams' efficiency edge (DVOA off +13.1% against a defense allowing 3.27 points per drive) shows up and they win by 7. The Nacua-in sim has LV covering only 49.3%.
- **Over 48.5:** The Rams' 34-point games (W1, W6) came from a run-heavy, short-field offense. Without Adams or Nacua, Stafford could dink and dunk to TEs (Higbee's 4 catches for 22 yards in W6). LV's run game is broken, which shortens possessions. A 24-20 game sits under the number.
- **Pass on the spread:** Taking LAR -3 now while the juice is soft (-116) gets ahead of an active Nacua moving it to -3.5. Taking LV +3 now gets ahead of an inactive Nacua moving it to +2.5.

## Ambiguity / missing data
- `missing_inputs[]` is empty.
- I couldn't retrieve official Friday injury PDFs (nfl.com is not on the allowlist; CBS and Rotowire fetches failed). Designations come from ESPN feed items posted Friday evening.
- Power-rating conflict: the packet has LAR SRS -2.31 (#22) and the dossier has 0.48 (#18). I weighted efficiency over SRS.
- Mike Washington's Rotowire blurb says Jeanty is "uncertain with an ankle injury," but that appears to be August text. Jeanty is a known starter in projected_starters and has no designation, so I treat him as active.
- `secondary_matchups` coach names are ignored; the dossier names Klint Kubiak (LV HC) and Sean McVay (LAR HC).

## Pre-kickoff delta checklist
1. **Nacua inactive (11:55 PT Sun):** SC LV +4 goes to B. LV +3 +100 or better becomes a C play. Over drops to PASS (fair 48.5).
2. **Nacua active:** LAR -3 at -110 or better becomes C. If the number goes to -3.5, pass. Over holds at C.
3. McDuffie out → +0.5 to LV and +0.5 to the total.
4. BKR total moves to 49 or higher → Over is a PASS.
5. LV RB Washington out → no change (LV's run game is already priced as broken).

## Gate notes
- Roster gate PASS (age 0 h); I did not rerun it.
- Kickoff is still ahead, so this is a forward pick.
- Final injury report: one web search; official PDF unavailable; I used the ESPN feed from Friday 23:34–24:04Z.
- Weather is moot (fixed dome).
- The newest BKR rows (20:12Z) beat the paste (~18:40Z); both are cited.
- Flagged Hunter's stale "Aaron Donald" rationale.
