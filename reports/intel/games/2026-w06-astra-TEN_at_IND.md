# Week 6 Astra synthesis - TEN @ IND (PROPOSED, not a pick)

- As-of: Sat 2026-10-17 3:40 PM PT | Generated: 2026-10-17T22:40:00Z
- HEAD: ea74728e1e1f174f047755719896b90460c2eb64 (branch claude/w5-prop-cards-2026-10-11)
- Kickoff: Sun 10/18 10:00 AM PT (2026-10-18T17:00:00Z), Lucas Oil Stadium (IND retractable roof)
- Packet: scratch/w06-astra-synthesis-queue.json /packets/5, SHA-256 a44610034f2a19151d50982da98b64fe3469bbdf9b0ba0ac00029c97c00f01c0 (verified); queue SHA-256 8677f594...ed90 (verified); 46/46 manifest hashes re-verified except the self-rewriting w06-roster-vet.json receipt (read: status PASS, roster_source 2026-10-17T22:22:11Z, age 0.2h).
- Nothing here is placed, promoted, or written anywhere else.

## Disposition

**conflicted / tier research_only.** The market is TEN +7 / IND -7 on a 44.5 total. The market-calibrated simulator with my small adjustments (margin -0.4 toward TEN, total -0.5) puts TEN +7 at 51.2% to cover excluding pushes, but the posted price (-115) needs about 53.5%, so the side is still about -4% EV. The Under 44.5 (-104) clears breakeven by roughly half a point (51.5% vs 50.98%, about +1% EV), which is inside model noise. Directionally soft lean is TEN +7 / Under, but there is no price edge on either, so this is an honest research_only, not a candidate. Expert signal leans TEN +7 (three approved or checked sources) while the mainstream straight-up picks and one teaser take lean IND; those cancel and neither is edge.

## Team form and schedule context

- TEN 0-5: 11.6 ppg for, 21.8 against, turnover margin -5, SRS -13.2 (rank 32), net -10.2/game. [Source: scratch/w06-astra-synthesis-queue.json /packets/5/team_dossier team:TEN season_profile_espn + power, dossier build 2026-10-17T02:04Z, through week 5]
- IND 2-3: 24.8 ppg for, 27.6 against, turnover margin -6, SRS -2.8 (rank 23), net -2.8/game; defense 6.14 yards/play allowed. [Source: same, team:IND]
- Raw SRS gap (~10.4 points plus home field) would argue for a bigger IND number than 7; the market-calibrated model instead lands at 6.6 (below). Nothing in the packet explains why the model discounts the gap, so treat the SRS gap as a counter-case input, not a signal.
- Anderson (Action Network Podcast) says IND is a touchdown favorite with "6 straight wins vs TEN" - paraphrased rationale, not a verbatim quote. [Source: packet expert_article_podcast.youtube.approved_signals /picks/51]

## Availability / QB

- QBs: TEN Cam Ward, IND Daniel Jones, both ESPN depth chart only, not team-confirmed. [Source: packet availability.quarterbacks, espn 2026-10-17T02:03:26Z]
- TEN reported Out: DT Jordan Elliott, S Kevin Winston Jr.; CB Joshua Williams on IR; RB Tyjae Spears Questionable (knee). [Source: data/research-intel/availability/2026-w06-availability-layer.json games[6], 2026-10-17T02:03:52Z]
- IND reported Out/IR: WR Ashton Dulin (Out), LB Jaylon Carlies (Out), WR Alec Pierce (IR, but the cited comment says he was spotted without a cast, internally ambiguous), DE Arden Key (IR), TE Will Mallory (listed IR, comment says Questionable, contradictory); TE Tyler Warren Questionable (groin, limited Friday). [Source: same file]
- All of this is up to 20 hours old and is not an official inactive list. Official inactives decide (packet condition OFFICIAL_INACTIVES, due near kickoff).
- The roster gate flags UNVERIFIED for TEN "Dominique Hampton" in secondary-matchups:absences, and the BKR alias "Cameron Ward" is unresolved. No TEN QB props are used. [Source: data/generated/master-intel/w06-roster-vet.json, 2026-10-17T22:22Z]

## Weather / venue

IND is a retractable roof. The weather row is `venue_condition_verification_required`: no outdoor weather is applied and no weather-based adjustment is made. Roof status not confirmed. [Source: data/research-intel/review/2026-w06-weather-venue.json row TEN@IND, Open-Meteo Sat 1:16 PM PT]

## FTN and quantitative

- FTN weekly stats (capture completed 2026-10-13T18:14Z, context 2026-10-16T22:00Z) is accepted by Andy as weekly cadence; the TEN/IND context in the packet is player-level tables, and I did not derive a team-level FTN number from them. It is a quantitative input only, not an expert vote. [Source: packet team_dossier.ftn]
- Quantitative model (rebuilt on the 12:40 PM PT board, 2026-10-17T21:11:11Z): means IND 25.40, TEN 18.78, total 44.18, home margin 6.62; model adjustments vs market -0.38 margin, -0.32 total; model side TEN 51.1% excl push, Under 51.0%. Features: offense z IND +0.24 / TEN -1.13; tempo z IND +0.72 / TEN -1.99; secondary adjustment IND +0.18 / TEN -0.27. Model probabilities are labeled provisional context. [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json games[4]; packet team_dossier.quantitative]
- Packet warning: the quant script expected a different SuperContest filename (contest field null); flag only. Real file is data/supercontest/week-06-lines.json (IND -7, locked 10/15).

## Market (captured, not live offers)

| Item | Opener (Mon 10/12) | Current board (Sat 10/17 ~12:40 PM PT, captured 19:40Z) | Move |
|---|---|---|---|
| Spread | IND -7 (-106) | TEN +7 -115 / IND -7 -101 | 0 pts, juice toward IND |
| Total | 44 | o44.5 -112 / u44.5 -104 | +0.5 |
| Moneyline | TEN +255 / IND -325 | TEN +251 / IND -296 | IND shortened ~29 cents |

[Source: packet market.opener (openers /games/TEN@IND, 2026-10-12T04:30Z); market.signed_reconciliation_baseline, data/odds/BKR_current_lines_1017_1240_buildfmt line 7.] The opener is cross-book historical, so the comparison is a note, not a blocker. SuperContest locked line IND -7 (captured 10/15 2:29 PM PT) is a locked reference, not executable. The availability layer embeds an older line (total 44, ML +259/-304); embedded market fields are excluded.

## Expert / podcast / article: agreement and disagreement

TEN side (spread):
- Dave Tuley, VSiN, 2026-10-15: "Taking the Titans +7 here is more of a bet against the Colts, who are 2-3 and looking like a mediocre, middle-of-the-road team that shouldn't be laying a full TD vs. anyone, even the dregs of the league." Quote quality: unverified_against_raw_source. [Source: packet expert_registry_rows /rows/91]
- Steve Fezzik (Ross Tucker, EC4r_E6mc0E): "Titans two units" (rationale: yards-per-play edge). Ross Tucker: "Titans plus seven, one unit." Both at +7, same episode, moved 0 vs board. [Source: approved_signals /picks/64, /picks/65]
- Fezzik also took TEN +2.5 in the 4th quarter (parlay leg). Not comparable to the full-game number (moved 4.5 vs +7); excluded from agreement.

Total: Pat Fitzmaurice (BettingPros) "I like under and Titans Colts because I think those two offenses are just terrible" - no line stated, reprice needed. [Source: /picks/108] Model also leans Under by 0.32.

IND side:
- Brandon Anderson: IND "best teaser leg of the week" ("Angus" is a caption garble); a teaser leg is not comparable to the full-game number. [Source: /picks/51]
- ESPN straight-up (article 8187, Maldonado/Moody/Walder, 10/17): IND in all three (27-19, 30-17, 23-10). PFT (article 8054, Florio, 10/15): Colts 27, Titans 10. Straight-up picks are context, not edge. [Source: packet articles.read_in_full_leads; expert row /rows/70]
- Anderson on Jonathan Taylor 2+ TD at +205 and 3 TD at +900 (DraftKings, source quote only): see props; not repriceable here.

Articles 8136 (VSiN Burke: Taylor +265 / Warren +900 first TD, DK as of publish, suspected_ingest_cap, execution unverified) and 8336 (BettingPros Wood: Pollard 2+ TD +1100, "Matchup inferred from article text") are analyst leads priced at publish time, not picks; no matching Bookmaker TD rows exist. The Cody Brown "OVER 12.5" and Harry Lock "OVER 69.5" bookmark rows have no market, player, or verifiable quote and are excluded. Agreement summary: three TEN +7 voices, one Under voice (no line), all IND voices are straight-up or teaser context.

## Splits (ages stated)

- Spread: TEN 24% bet-count / 14% money; IND 76% bet-count / 86% money. Captured 2026-10-17T18:14:06Z (about 4.5 h old).
- Total: Over 59% bet-count / 69% money; Under 41% / 31%. Same capture.
- Moneyline split (IND 96% bettors / 93% money) is the Thursday-night pull (2026-10-16T03:30Z, ~42.6 h old), withheld as stale.
[Source: data/generated/master-intel/w06-splits-all.json; packet betting_splits]
Read: heavy public and money on IND -7 with the line not moving off 7 is a mild contrarian note for TEN, but money on the Over (69%) cuts against the Under lean. Neither is a signal without line movement.

## Simulator (scripts/intel/margin-simulator.mjs, selftest PASS; home line -7, total 44.5)

Conditional-probability caveat: the simulator is market-calibrated and only shifts the distribution by my stated adjustments; it is not an independent projection. Probabilities exclude pushes; TEN +7 pushes on exactly 7 about 5.6% of the time.

| Run | margin-adj (home+) | total-adj | TEN +7 cover | IND -7 cover | Over 44.5 | Under 44.5 | IND win |
|---|---|---|---|---|---|---|---|
| Baseline (market) | 0 | 0 | 50.0% | 50.0% | 50.0% | 50.0% | 71.9% |
| **Hypothesis (used)** | -0.4 | -0.5 | 51.2% | 48.8% | 48.5% | 51.5% | 71.0% |
| Alt: mild TEN | -1.0 | -1.0 | 52.9% | 47.1% | 47.0% | 53.0% | 69.6% |
| Alt: IND tilt | +0.4 | -0.5 | 48.8% | 51.2% | 48.5% | 51.5% | 72.8% |

Adjustment reasons: margin -0.4 mirrors the quantitative model's -0.38 vs market [Source: quantitative-synthesis games[4].simulation.adjustments_vs_market]; total -0.5 is the model's -0.32 plus a small allowance for TEN tempo z -1.99 and two offenses ranked poorly, partly offset by IND tempo z +0.72. Both are well inside the 2.0 soft cap.

Price sensitivity (hypothesis row, no pushes at half points): TEN +6.5 51.1%, TEN +7.5 51.1% (the sim is not materially hook-sensitive here); TEN +7 breakeven is about -105 (currently -115, about -4.1% EV; IND -7 -101 about -2.7% EV). Under 44.5 -104: 51.5% vs 50.98% breakeven, about +1.0% EV; Over -112 about -8% EV. Total at 43.5 or 45.5 does not change the sim probabilities because the sim re-centers on the posted number.

## Props (only verified captured prices; none promoted)

Bookmaker rows captured 2026-10-17T19:41:35Z (raw-verified, IND/TEN rosters matched): Jonathan Taylor rush yards o/u 88.5 -108/-108, carries o/u 20.5 +119/-139, receiving yards o/u 17.5 -110/-106; Tony Pollard rush yards o/u 54.5 -109/-107; Daniel Jones pass yards o/u 228.5 +103/-119. BetOnline (21:15Z) only has kicker fantasy-point rows for this game. These are listed for context only; I have no calibrated joint model and make no prop lean. Omitted: any Cam Ward prop (alias unresolved), any Tyler Warren or Tyjae Spears leg (both Questionable; capped at 2- and omitted), the Taylor 2+/3 TD and first-TD leads (no Bookmaker TD-scorer rows; DraftKings Predictions are reference-only, 75 rows, non-executable), and all SGP or teaser legs.

## Counter-case (why the opposite side could be right)

If IND is the right side: TEN is 0-5 with the worst SRS in the league (-13.2 vs IND -2.8), 11.6 ppg, and a 3.2 three-and-outs per game profile; a 10-point SRS gap plus home field implies more than 7. Public and money splits (76/86 on IND) and the straight-up consensus agree, IND has won six straight in the series per Anderson, and IND's offense (24.8 ppg, 2.27 points/drive) is far more productive than TEN's (1.18). The TEN +7 case rests mainly on a mediocre IND defense (6.14 yards/play allowed) and the price already being a full touchdown. If the Over is right: IND concedes 27.6 ppg and 384 yards/game, and 69% of total money is on the Over.

## Ambiguity / missing data

1. Official inactives not available (due near kickoff); TEN Ward and IND Jones are depth-chart only. Warren, Spears, Mallory, Pierce statuses are reported-only and partly self-contradictory.
2. Roof status unknown; no weather applied.
3. Moneyline splits are 42.6 h old and withheld; spread/total splits are 4.5 h old.
4. BetOnline has only four kicker fantasy-point rows for this game; no TD-scorer or QB props for TEN; coverage gap named, not a blocker.
5. FTN team-level numbers were not extracted (packet holds player-level tables); I cite no FTN team figure.
6. SRS gap vs model gap (above) is unexplained.
7. Expert quotes carry quote_quality unverified_against_raw_source (Tuley, PFT) or match_structured_segment_only (Anderson); the YouTube rationales are the packet's paraphrase.
8. Process: agents/dev/ASTRA_W06_GAME_SESSION_PROMPT.md SHA-256 now c2bf2b1b...e782 versus a9b86304...58346b recorded in the launch board (file modified 8 seconds after the board was built, 22:29:25Z vs 22:29:17Z). It is an instruction file, not a packet source; its content matches the board's activation text, so I proceeded, but the controller should confirm. The w06-roster-vet.json receipt was rewritten at 22:35:07Z by another session; I read it only.
9. validate-game-output.py is pinned to Week 5 paths and was not run; a manual self-check was done (no forbidden keys, disposition/tier pairing valid, adjustments within caps, claims sourced).
10. ESPN captured game status (10/17 02:03Z) lists only SEA@DEN as final; TEN@IND not started; 3:40 PM PT is before 10:00 AM PT Sunday kickoff.

## Pre-kickoff delta checklist

1. Official inactives (Sun ~8:30 AM PT): Ward, Jones, Warren, Spears, Dulin, Pierce, Mallory. Warren or Taylor OUT moves IND toward the margin-adj +0.4 row and weakens the Under.
2. Roof open or closed (Lucas Oil): if open, pull the real forecast; an outdoor-wind game would strengthen the Under only if the roof is confirmed open.
3. Price crossings: TEN +7 at -105 or better, or TEN +7.5, turns the side to roughly breakeven (still not edge); IND -6.5 would make TEN +6.5 plain; total 45.5 or higher with Under -104 or better raises the Under to about +2% EV; total 43.5 or lower removes it.
4. Line move toward TEN (+6.5 or lower) with the same 76/86 splits would suggest reverse movement worth rechecking; a move to IND -7.5 or -8 changes the counter-case weight.
5. Refresh splits (spread/total at 18:14Z and moneyline from Thursday) and confirm no new BetOnline or Bookmaker player rows for Taylor or Ward.
6. Recheck Pollard/Ridley/Robinson TEN skill statuses before any prop leg is considered.
