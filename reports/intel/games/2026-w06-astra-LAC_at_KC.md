# Platinum Rose W6 Astra - LAC @ KC (proposed synthesis)

- As of: Sat 2026-10-17 3:45 PM PT (generated 2026-10-17T22:45Z)
- HEAD: ea74728e1e1f174f047755719896b90460c2eb64 (branch claude/w5-prop-cards-2026-10-11)
- Kickoff: Sun 2026-10-18 1:25 PM PT (2026-10-18T20:25Z); future, ESPN capture (2026-10-17T02:03Z) shows no final/underway for this game
- Packet: scratch/w06-astra-synthesis-queue.json `/packets/10` sha256 6331ff59...d9a2 (verified); queue sha256 e5832e56...6255 (verified); session prompt sha256 c2bf2b1b... (verified); 47 of 48 evidence_manifest entries hash-match (the 48th, w06-roster-vet.json, is the self-rewriting receipt: read, PASS, roster snapshot 2026-10-17T22:22Z, ~0.3h old, expires 2026-10-18T22:22Z; `roster:vet` not rerun)
- Status: PROPOSAL ONLY. No wager, book contact, Supabase write or paid call.

## Disposition

**price moved / tier `skip`** (spread side: honest `pass`).

The qualitative case is a defensive-prop, low-scoring game with KC a heavy favorite and LAC the league's worst offense, and the under is the most-agreed signal. But every under pick in the packet was priced at 42.5 (or 43) and the board is now 41.5 (-113), so the number the analysts liked is gone. My simulator hypothesis (KC +0.5, total -0.5) gives Under 41.5 = 51.5% vs 53.1% needed at -113, and KC -7.5 = 51.4% vs 51.9% needed at -108. Neither side clears break-even. Money on the over (69%) is against the under lean. No candidate is promoted. My fair numbers are KC -8.0 and total 41.0 (the simulator is market-centered, so a different posted line means restating the adjustment relative to it). Had the under still been available at 42.5, the sim would give about 54.5% vs about 52.4% needed at -110, which would have been a tier 2- candidate; that price is not on the board.

## Team form and schedule context

- LAC 0-5: 16.8 ppg / 25.8 papg, 4.78 ypp vs 5.00 opp ypp, turnover margin -5, SRS -9.30 (rank 29), off EPA/play -0.188. [Source: data/generated/team-dossiers/2026-w06/matchups/LAC@KC.json side_by_side, built 2026-10-17T02:04Z; queue packet team_dossier]
- KC 4-0 (bye in W5): 29.5 ppg / 19.25 papg, 6.58 ypp vs 4.85 opp ypp, turnover margin +5, SRS +8.61 (rank 3), off EPA/play +0.153. Only four games, so the profile is small-sample. [Source: same]
- Shared opponents so far: DEN, LV. [Source: same matchup file]
- Narrative projection from the captured model: LAC 16.0, KC 25.3. [Source: reports/intel/master-intel-narratives-2026-w06.md lines 131-142]

## Availability / QB

- QBs: Herbert (LAC) and Mahomes (KC) are the ESPN depth-chart starters, flag ok. This is captured depth chart, not team confirmation. [Source: data/research-intel/availability/2026-w06-availability-layer.json, games LAC@KC teams[].qb_starter; espn_fetched 2026-10-17]
- LAC reported Out/IR: Derwin James Jr. (S, Out 10/17), Donte Jackson (CB, Out 10/17), Joe Alt (OT, Out 10/16), Kayode Awosika (G, Out 10/16), Tre' Harris (WR, Out 10/16), KeAndre Lambert-Smith (WR, IR; comment says questionable), Ingold (FB, IR), Perryman (LB, IR). Questionable/doubtful: Brenen Thompson, Rodney Shelley (doubtful), Daiyan Henley, Dalvin Tomlinson, Jamaree Caldwell. Roster IR/Out unconfirmed (day-to-day on ESPN roster, not confirmed Out): Slater, Pipkins, Penning, World, Njoku, Trey Lance. The dossier flags LAC OL risk as a "cluster". [Source: same availability layer; matchup file availability.away.ol_risk]
- KC reported Out/IR: Josh Simmons (OT, Out 10/16), Rashee Rice (WR, "will not play Sunday ... Sam McDowell of The Kansas City Star reports", 10/16), Tyquan Thornton (WR, IR). Sneed (CB) questionable (dated 10/14). [Source: same]
- All of this is reported status, not official inactives. Official inactives (about 90 minutes pre-kickoff) decide.

## Weather / venue

Forecast (Open-Meteo, captured Sat 1:16 PM PT, a forecast not an observation): 64.2F, 0% precip, wind 20.6 km/h (about 12.8 mph), gusts 31.3 km/h (about 19.4 mph), direction 201 deg. Materiality "no_material_flag_in_current_forecast". Arrowhead is an outdoor venue; no roof issue. Wind is mild-to-moderate; a gust of about 19 mph could shave deep passing at the margin but is not a thesis driver. The narratives file shows "65F, wind 20.2 km/h", an earlier rendering of the same forecast; the weather file governs. [Source: data/research-intel/review/2026-w06-weather-venue.json rows[7], 2026-10-17T20:16Z]

## FTN and quantitative

- FTN weekly context (refreshed once per week by design; 10/16 context accepted by Andy 2026-10-17; KC's FTN is flagged stale_1wk through week 4 because of the W5 bye). Used as statistical color only, not an expert tier; I did not extract a team-level FTN claim beyond the dossier fields above. [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json generated 2026-10-16T22:00Z; packet team_signals[KC].data_quality.ftn]
- Quantitative model (rebuilt on the 12:40 PM board at 2026-10-17T21:11Z): means KC 25.26, LAC 16.00, total 41.26, home margin +9.26 vs market -7.5 (about +1.76 toward KC); offense z KC +1.24 / LAC -0.93, defense-weakness z KC -0.67 / LAC +0.31, tempo z KC +0.81 / LAC -1.12; secondary adjustment KC +0.22 / LAC -0.41. The narrative quotes "KC -7.5 at 54.9%, Under 50.7%" from this model. Status: provisional quantitative context only. Contest-field warning ("no SuperContest lines file for week 6") is a script path issue; the real file is week-06-lines.json. [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json /games/11; reports/intel/master-intel-narratives-2026-w06.md]
- My simulator run with the model's full +1.76 margin and -0.24 total reproduces those numbers (KC cover 54.9%, Under 50.7%). I do not adopt the full model margin: it rests on 4-5 game samples, a bye-week KC, and the market already carried the LAC injuries in (see movement below). I shrink it to +0.5 (see Simulator).

## Market (captured books, not live offers)

| Item | Value | Source / timestamp |
|---|---|---|
| Bookmaker (BKR) board, Sat ~12:40 PM PT | LAC +7.5 -108 / KC -7.5 -108; o41.5 -103 / u41.5 -113; ML LAC +326 / KC -393 | data/odds/BKR_current_lines_1017_1240_buildfmt line 12; captured 2026-10-17T19:40Z; raw rows verified (packet noon_bookmaker_observations /rows/3461-3466) |
| Opener (Action Network) | KC -7.5 (-110 home), total 43.5, ML LAC +320 / KC -420 | data/odds/actionnetwork-openers-2026-w06.json /games/LAC@KC; sp_at 2026-10-12T00:29Z, tot_at 00:42Z |
| Opener to board | Spread 0.0; total -2.0 (43.5 to 41.5). Cross-book comparison, note only | packet market.opener_to_baseline |
| SuperContest locked | KC -7.5 | data/supercontest/week-06-lines.json, captured 2026-10-15T21:29Z (10/15 2:29 PM PT) |
| Executable prices | none verified; no sportsbook visited | packet market.execution_note |

Movement notes: the spread has sat at KC -7.5 from the opener, but the teaser rationale from Hunter/Fezzik says "down from -8.5 to -2.5", implying KC was -8.5 at some point in the week; the packet does not carry that intermediate print, so it is unverified. Anderson's rationale says the total "dropped 3 from 45.5" while the packet opener shows 43.5; two inconsistent histories, flagged in Ambiguity. An older availability-layer render shows +8 / 43 / ML +344 -417, superseded by the 12:40 PM board.

## Expert / podcast / article agreement vs disagreement

All YouTube items below are Andy-approved signals (2026-10-17T21:44Z) and carry the movement note; quotes are verbatim from the packet.

Under (total):
- Brandon Anderson, The Action Network, 10/16: "Yeah, give me the under Chargers and Chiefs under 42 and a half." Rationale: total dropped from 45.5; LAC dead last offensive DVOA; Mahomes home unders as favorite 23-8 since 2022. Picked 42.5, board 41.5 (delta -1). [Source: data/podcasts/youtube-extracted-picks-2026-w06.json /picks/45; staging youtube-C8cDtGmsRoc ts 1970s, verbatim_match_retained_captions]
- Andrew Erickson, BettingPros podcast, 10/15: "Got the Chargers and the Chiefs going under 43 points, 42 and a half points on the poly market prediction side." Quote quality unverified against raw captions; the "poly market" phrasing suggests a prediction-market line rather than a sportsbook number. Picked 42.5, delta -1. [Source: /picks/90; staging youtube-M77HPuZkC5Q ts 2077s]
- Erickson, BettingPros article 8332, 10/17: UNDER 42.5 "official play". Same author as the podcast: one signal, not two. The packet marks the body as a suspected ingest cap; the lead was read in full. [Source: packet expert_article_podcast.articles.read_in_full_leads; data/research-intel/review/w06-article-leads-read-2026-10-17.json]
- Makinen, VSiN article 8108, 10/15: UNDER 42.5, manual review "needs execution verification", analyst lead only. [Source: same leads file]
- BettingPros expert feed row: Under 43, "4 of last 5 meetings stayed under 36; Chiefs 3-10 to the over after a bye since 2018; both offenses depleted by injuries." Quote has no URL (quote_quality missing_url_or_quote), context only. [Source: data/generated/master-intel/w06-expert-verified.json /rows/12]
- Net: three independent sources (Anderson, Erickson, Makinen) on the under, all at 42.5 or higher; none at 41.5. A one-point worse price is a real cost.

KC side:
- Teasers (not comparable to the full-game number): Simon Hunter, Sharp or Square, "taking a teaser here. But you're getting two and a half with Mahomes at home. It just feels like a good number against a team that hasn't won a game yet this year." [Source: /picks/11]. Steve Fezzik, "Put the Chiefs into my uh teaser portfolio. One unit only on my teasers." [/picks/75]. Ross Tucker, "I've got the Chiefs minus two and a half in my portfolio as well." [/picks/76]. KC -2.5 teaser legs are a base-line question (-8.5 teased down 6), so they are not agreement on KC -7.5.
- Straight-up context only: ESPN (Maldonado/Moody/Walder, article 8187) KC in all three; PFT Florio (8054) KC 30-17, and the PFT expert-feed row "Predicted score: Chiefs 30, Chargers 17 (KC vs LAC; margin 13, total 47)" (quote unverified against raw source). Note PFT's 47 total disagrees with the under camp. Score picks are not edge.
- Action Network PJ Walsh (8368): "Action PRO system pick (58% since 2005) on Chargers-Chiefs; side not captured"; paywalled stub, unusable.

LAC side:
- Sharp or Square expert-feed row (10/15): LAC +8.5, "Line is over-inflated due to injuries. Herbert is 8-2-1 ATS vs Chiefs, Harbaugh is 5-0 ATS vs Andy Reid, and Andy Reid is 6-12 ATS off a bye." Quote unverified (no URL); the +8.5 is also no longer available (board +7.5). [Source: w06-expert-verified.json /rows/3]
- Dave Tuley, VSiN: "Best Bet: Chargers +8 (Pool Play Percentages: Chargers 67/33 in ATS contests, but Chiefs still 67/33 in SU pools)." Unverified against raw source; +8 not on the current board. [Source: /rows/93]
- Burke, VSiN Average Joe contest (8365): LAC +8 74% (307/416). Public consensus is context, not edge; and it is a fade-the-public flag against LAC.

Props leads: Gallant, Action Network, 10/15: Kelce anytime TD, "So, I'm going to take him at plus 190 on the Chargers side." [/picks/83; ts 1702s]. Giffen: Omarion Hampton anytime TD, "Omar Hampton, he's around plus 280. That's my favorite touchdown score prop for the Chargers." (quote_quality unverified) [/picks/84]. Neither has a current priced row (see Props).

Summary: totals lean under (three independent, all at a better number); sides are split between a public-leaning LAC +8 camp (ATS trends, injury-inflated line, unverified quotes) and a KC straight-up/teaser camp that does not speak to -7.5. No source gives a priced, verifiable spread edge at the current number.

## Splits (with ages)

- Spread tickets: LAC 38% / KC 62%; money LAC 45% / KC 55%. Captured 2026-10-17T18:14Z (Sat 11:14 AM PT), about 4.5h before this report. KC's money share (55%) is below its ticket share (62%), so LAC takes relatively more money (45% vs 38% of tickets), a mild larger-bets-on-the-dog tilt. Weak signal.
- Total: Over tickets 60% / money 69%; Under 40% / 31%. Same capture. Money is on the over, which runs against the under lean.
- Moneyline splits (home 97% of bettors, 90% of money) are the stale Thursday-night pull (2026-10-16T03:30Z, about 42.6h old at manifest build) and are withheld. [Source: data/generated/master-intel/w06-splits-all.json /games/10]

## Simulator (scripts/intel/margin-simulator.mjs; `--selftest` passed all checks)

Inputs: home line -7.5 (KC), total 41.5, calibration 2018-2025 (sdMargin 12.77, sdTotal 13.13). Adjustments are home-positive points on margin, and points on total.

| Row | margin-adj | total-adj | KC cover | LAC cover | Over | Under | KC win |
|---|---|---|---|---|---|---|---|
| Baseline (market) | 0 | 0 | 50.0% | 50.0% | 50.0% | 50.0% | 75.1% |
| Hypothesis (adopted) | +0.5 | -0.5 | 51.4% | 48.6% | 48.5% | 51.5% | 76.1% |
| Upper hypothesis | +1.0 | -1.0 | 52.8% | 47.2% | 47.0% | 53.0% | 77.2% |
| Quant model full | +1.76 | -0.24 | 54.9% | 45.1% | n/a | 50.7% | 78.7% |
| Counter (LAC trends) | -0.5 | 0 | 48.6% | 51.4% | 50.0% | 50.0% | 74.0% |

Fair-number restatements (fair KC -8.0, total 41.0; adjustment restated against each posted line, so these are what a different price would be worth, none are on the board): KC -6.5 (adj +1.5) KC cover 54.1%; KC -7 (adj +1.0) KC 50.0%, LAC 44.5%, push 5.5%; KC -8 (adj 0) 48.8% each side, push 2.5%; KC -8.5 (adj -0.5) LAC +8.5 cover 51.4%; KC -9.5 (adj -1.5) LAC +9.5 cover 54.3%. Totals: Under 42.5 (adj -1.5) 54.5%; Under 42 (adj -1.0) 51.5% plus 3.0% push; Over 40.5 (adj +0.5) 51.5%.

Adjustment reasons:
- Margin +0.5 (toward KC): LAC OL cluster (Alt and Awosika Out, others day-to-day) into a KC front, plus two LAC DBs out (James, Jackson), versus KC losing Rice and Simmons. Partially offset by the market having carried this info already (spread unchanged at -7.5 from opener) and by 4-5 game samples. [Source: availability layer, matchup file]
- Total -0.5: LAC offense is the league's worst by EPA, LAC tempo z -1.12 slows the game, wind 12.8 mph with 19 mph gusts (mild). Partially offset by KC's 29.5 ppg and tempo z +0.81, and by Over money at 69%. The packet quant total (41.26) sits only 0.24 below the board, so I stay at half a point.
- Both are inside the 2.0 soft cap; sum of reasons is judgment, not a calibrated joint model.

Conditional-probability caveat: these are market-calibrated marginal probabilities for each separate bet. The sim is not a joint model. Do not multiply side and total probabilities for a parlay or SGP, and no prop, team-total, teaser or SGP probability is claimed.

Break-even check: KC -7.5 -108 needs 51.9% (sim 51.4%); LAC +7.5 -108 needs 51.9% (sim 48.6%); Under 41.5 -113 needs 53.1% (sim 51.5%); Over 41.5 -103 needs 50.7% (sim 48.5%). Nothing clears.

## Props (verified current rows only; reference, not recommendations)

Only rows with a raw-verified captured price and roster-identity match are usable. No Bookmaker TD-scorer rows exist. BKR 2026-10-17T19:42Z (427 rows, 367 player-tagged, all raw-verified); BEO (BetOnline) 2026-10-17T21:16Z (64 rows, 16 player-tagged). DraftKings Predictions (75 rows) are reference-only.

- Anytime-TD leads from YouTube (Kelce +190, Hampton +280): no current TD-scorer price exists for either. BEO atd_1_plus lists only Herbert Yes +500, Mahomes Yes +400, Kenneth Walker (KC RB) Yes -160 / No +130. Omitted per the prop rule, with the YouTube prices unverified. [Source: packet player_props.beo.verified_rows /rows/748-757]
- Walker (KC RB) anytime TD -160 is a real captured BEO price with no external lead behind it; with KC -7.5 it simply reflects a volume role (BKR rush line 90.5 at -118/+102 [/rows/3823], carries 19.5 [/rows/3864]). I make no claim on it.
- Reference lines for the game (BKR 19:42Z): Herbert pass yds O/U 192.5 -110/-106 [/rows/3521-3522]; Mahomes pass yds 223.5 -108/-108 [/rows/3523]; Kelce rec yds 51.5 (+110/-128) [/rows/3697]; McConkey rec yds 42.5 (-110/-106) [/rows/3695]; Hampton rushing alt ladder (31+ at -114) [/rows/3838]. Herbert's 192.5 and LAC's low scoring are consistent with the under-lean narrative but I run no prop through the sim. Rice has no props rows (reported Out). Any prop leg needs official inactives first; cap affected candidates at 2-.
- BEO coverage here is thin (QB, Walker, kickers only): a note, not a blocker.

## Counter-case

What makes the opposite side right:
- For LAC +7.5: KC is off a bye with only four games of evidence; Herbert is reported 8-2-1 ATS vs KC, Harbaugh 5-0 ATS vs Reid and Reid 6-12 ATS off a bye (Sharp or Square, unverified quotes); a 0-5 team can be undervalued by a market that has already priced LAC's injuries (the opener was -7.5, and Wednesday-era sources cite -8.5, so the number has not moved toward KC despite the OL losses). Rice and Simmons are out for KC. LAC-side contest consensus (74% Average Joe) is a fade signal, so the public lean is not purely contrarian support. The 3-point key number sits right under the spread; 12.8% of simulated margins land at exactly 3 and 8.1% at exactly 7.
- For the over: 69% of the money is on it, PFT's score pick implies 47, KC scores 29.5 ppg off a +5 turnover margin, and an LAC defense missing James and Jackson is exactly the type KC's offense (6.58 ypp) can exploit; if Herbert is under constant pressure, the likeliest "blow-open" game script (as the narrative itself says) adds KC points and short fields rather than lowering the total.
- For KC -7.5: if LAC's OL breaks, KC wins by double digits (sim KC win prob 76%).

## Ambiguity / missing data

- Official inactives not available; all availability is reported status. Open items: LAC OL day-to-day group, Lambert-Smith (IR status with "questionable" comment is internally inconsistent), Henley, Sneed, Rice (reported Out via The Kansas City Star, official inactive pending).
- Under picks are priced at 42.5/43 vs board 41.5; Erickson's 42.5 is explicitly a prediction-market number. Anderson says total fell from 45.5, packet opener shows 43.5 (Action Network 10/12): inconsistent histories, unresolved.
- KC -8.5 earlier in the week is quoted by teaser analysts but absent from the packet; the unchanged opener-to-board spread (0.0) coexists with it.
- Article lead 8368 is a paywalled stub (side not captured); 8332 suspected ingest cap; unresolved article IDs listed in the packet (8368, 7919, 8332, 8187, 8054, 8365, 8266) were dispositioned by Andy on 2026-10-17, only 8303 excluded.
- Several expert-feed quotes (Sharp or Square, BettingPros, PFT, Tuley) lack URLs or are unverified against raw source; used as context only.
- Moneyline splits stale (about 42.6h); withheld. Spread/total splits are 11:14 AM PT.
- Narrative file shows 65F and 20.2 km/h wind vs the weather file's 64.2F and 20.6 km/h; trivial.
- FTN for KC is stale_1wk in the dossier's data-quality block; the 10/16 FTN context was accepted by Andy. Team-level FTN tables not extracted for numeric claims.
- Props: no TD-scorer prices for Kelce or Hampton; DraftKings Predictions reference-only.
- The Week 5 validator `scripts/intel/validate-game-output.py` is pinned to W05 paths and was not run; manual self-check done (no ticket/stake/wager_amount/bet_slip/payout keys, disposition/tier pair legal, adjustments +0.5/-0.5 within 2.0 soft cap, every number above traced to a source line).
- While gathering the board price I opened the shared board file header and printed its first lines, which contain other games' market lines; I did not use, read or reference any other game's output files.

## Pre-kickoff delta checklist

1. Official inactives (about 11:55 AM PT Sunday): LAC OL (Slater, Pipkins, Penning, World), Lambert-Smith, Henley, Sneed, Rice. If a second LAC OL starter or Herbert is a surprise inactive, move margin-adj toward KC by up to +1.0 and recheck KC -7.5 against 51.9%; if LAC's OL returns (Slater and Pipkins both active), pull margin-adj back to 0.
2. Total crossing (fair total 41.0): Under at 42.5 or higher at -110 (sim 54.5% vs 52.4%) or at 42 (51.5% plus 3% push, marginal) upgrades the lean to a tier 2- candidate; Under 41.5 needs about -106 or better (51.5%). At 40.5 or lower, the Over side is the one with the small number edge (51.5%) but I do not lean over.
3. Spread crossing (fair KC -8.0): KC -6.5 or better at -110 (sim 54.1% vs 52.4%) or LAC +9.5 at -110 (sim 54.3%) would be priced candidates. LAC +8.5 (51.4%) is marginal at -110. KC -7.5 and LAC +7.5 at the current -108 are no edge.
4. Kickoff-day weather: gusts above about 25 mph would add to the under; confirm Open-Meteo refresh.
5. Refresh BKR/BEO props and any TD-scorer rows for Kelce and Hampton; neither has a current price today.
6. Rerun strict roster gate with --fetch Sunday morning; any new snapshot requires a requeue.
