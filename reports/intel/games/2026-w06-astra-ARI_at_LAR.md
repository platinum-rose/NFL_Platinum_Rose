# Astra W06 - ARI @ LAR (single-game proposed synthesis)

As of: Sat 2026-10-17 15:39 PT | Generated: 2026-10-17T22:39Z | HEAD: ea74728 (branch claude/w5-prop-cards-2026-10-11) | Kickoff: Sun 10/18 13:05 PT (20:05Z) | Packet: /packets/8 (sha256 0d98e4d8...bc947d7), queue sha256 8677f594...bed90
Status: PROPOSAL ONLY. No wagers, no placement, nothing promoted.

## Disposition
**conflicted / tier research_only.** The market (LAR -13.5, total 52) is within about half a point of every independent estimate I can audit, so there is no price edge. If forced to lean, it is a marginal ARI +13.5 (or +14) side: simulator ARI cover is 51.5% at my -0.5 adjustment against a -117 breakeven of about 53.9%, so the captured price does not clear. The total is a coin flip (50.0% / 50.0% excl. push). Honest pass on a side and total; props listed below are price-checks only, with no calibrated model behind them.
[Source: scripts/intel/margin-simulator.mjs run 2026-10-17 below; data/odds/BKR_current_lines_1017_1240_buildfmt line 10, 2026-10-17T19:40Z]

## Gates (this session)
- Queue sha256, packet sha256 and 51 of 52 manifest sources match pins; the 52nd (data/generated/master-intel/w06-roster-vet.json) is the self-rewriting receipt (expected differ). Receipt read: status PASS, roster_source 2026-10-17T22:22:11Z, age 0.2h, blocking []. Roster:vet NOT rerun (per controller).
- Kickoff in the future; no packet blockers; conditions are non-launch-blocking (ARTICLE_GATE_RESOLVED, OFFICIAL_INACTIVES, KICKOFF_WEATHER).
- Note: agents/dev/ASTRA_W06_GAME_SESSION_PROMPT.md sha256 now c2bf2b1b...; the launch board recorded a9b86304...; file mtime 22:29Z equals the board build minute. Content matches the board's article-gate-cleared language. Treated as a harmless re-save, but flagged.

## Team form and schedule
- ARI 1-4: 21.6 ppg / 32.4 papg, 4.42 YPP vs 6.24 allowed, SRS -11.14 (rank 31), model rank 30, turnover margin +2. [Source: packet team_dossier.team_signals ARI, data/generated/team-dossiers/2026-w06/ARI.json, through wk5]
- LAR 2-3: 23.8 / 24.0, 6.04 YPP vs 4.82 allowed, SRS +0.49 (rank 18), turnover margin -3 (8 giveaways, 5 takeaways). [Source: same, LAR]
- EPA/play: ARI off -0.026 / def +0.120; LAR off +0.070 / def -0.042 (lower def EPA is better). [Source: data/generated/team-dossiers/2026-w06/matchups/ARI@LAR.json side_by_side]
- Rough SRS gap 11.6 + home edge lands near the 13.5 market, i.e. the price is already efficient. LAR's -3 turnover margin is a regression-to-mean upside for LAR; ARI's +2 is a regression downside for ARI.
- Brandon Anderson (Action Network Podcast, 2026-10-16): LAR 16-3 vs ARI (15 of 19 by double digits); ARI 1-13 with Brissett since midseason; "Give me the Rams minus 12 against the Cardinals." His own number is LAR -10.5. [Source: packet youtube /picks/44]

## Availability / QB
- QBs: ARI Jacoby Brissett, LAR Matthew Stafford (ESPN depth chart, roster identity matched; not team-confirmed). [Source: availability layer /games/9, 2026-10-17T02:03Z]
- ARI reported Out/IR: RB Jeremiyah Love (ankle, Out), RB James Conner (IR), S Andrew Wingard (Out), S Wydett Williams Jr. (Out), S Kitan Crawford (IR). Questionable: LB Zaven Collins, S Budda Baker, P Blake Gillikin. Day-to-day/unconfirmed: RB Trey Benson, OL Paris Johnson Jr. / Isaiah Adams / Chase Bisontis, TE Tip Reiman / Hunter Long / Jameson Geers, WR Xavier Weaver. Operator note: Marvin Harrison Jr. traded ARI->HOU. [Source: data/research-intel/source-evidence/espn-status-w06.json; matchup dossier operator_reported]
- LAR: DE Myles Garrett IR (McVay: will not play), OT Keagen Trost IR (designated for return), OT Alaric Jackson suspended one game, CB Trent McDuffie and S Kam Curl questionable (10/17). [Source: espn-status-w06.json]
- ARI backfield is thin (Love Out, Conner IR, Benson unconfirmed) and the safety room is depleted; the lines already reflect Love (open 12.5 to 13.5). Official inactives decide.
- Conflict: the dossier lists ol_risk "none" for ARI, while Kezirian's pick rationale cites a "depleted offensive line"; ESPN shows three OL as day-to-day-unconfirmed only. Unresolved until inactives.

## Weather / venue
SoFi, open-sided. Forecast (Open-Meteo, Sat 2026-10-17 20:16Z / 1:16 PM PT, forecast not observation): 86.9F, precip 1%, wind 13 km/h, gusts 14.8 km/h. No material flag. [Source: data/research-intel/review/2026-w06-weather-venue.json /rows/6]

## FTN and quantitative
- FTN (weekly cadence accepted; capture completed 2026-10-13, context file 2026-10-16T22:00Z) is a numeric input only; I did not extract an FTN-based tilt beyond the dossier EPA/YPP above.
- Quantitative model (rebuilt on the 12:40 PM board, 2026-10-17T21:11Z): means LAR 31.7, ARI 20.3, total 51.9, home margin 11.4; ARI cover 56.2%, home win 81.4%, over 48.3% / under 48.7% (50.2% under excl. push). Provisional only; the model's own adjustment vs market is margin -2.10, which is beyond the 2.0 soft cap, so I do not take it at face value. [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json /games/9]
- Master-intel narrative projection: ARI 20.3, LAR 31.7; "Model ARI +13.5 at 56.2%". [Source: reports/intel/master-intel-narratives-2026-w06.md lines 107-118]
- Secondary-matchup context (capped manual review): LAR defense zone/two-high with no secondary absences, vulnerability tier low (slot/underneath tags for ARI Brooks and Bourne); ARI defense missing several safeties (Wingard Out, Williams Out, Crawford IR, Blount IR per FantasyPros). [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w06.json /matchups/18-19]

## Market (captured, not live offers)
| Item | Opener (AN, 10/12) | Bookmaker board 10/17 12:40 PM PT (19:40Z) | Locked contest 10/15 |
|---|---|---|---|
| Spread | LAR -12.5 (-110) | LAR -13.5 +101 / ARI +13.5 -117 | LAR -12.5 |
| Total | 52 | o52 -103 / u52 -113 | n/a |
| ML | ARI +510 / LAR -706 | ARI +613 / LAR -746 | n/a |
Opener to current: spread +1.0 toward LAR (LAR -12.5 to -13.5), total unchanged. [Source: data/odds/actionnetwork-openers-2026-w06.json /games/ARI@LAR; BKR board line 10 raw-verified rows 3270-3276; data/supercontest/week-06-lines.json /games/9 captured 2026-10-15T21:29Z]
No sportsbook visited; execution availability unverified.

## Expert / podcast / article agreement
- ARI side: Dave Tuley (VSiN, 10/15) "Best Bet: Cardinals +12.5" [experts /rows/92]; Erickson (BettingPros, article 8332, 10/17) Cardinals +12.5; Simon Hunter (Sharp or Square) ARI 13.5, "Aren't we supposed to just blindly bet the Cardinals here?"; Ross Tucker ARI +13.5, "Two units." Hunter and Tucker are priced at the current 13.5 (no movement).
- LAR side: Doug Kezirian (Action Network Podcast, 10/14) "laying 12 and a half with the Rams" (now 13.5, moved 1.0); Brandon Anderson LAR -12 (moved 1.5); ESPN Solak (article 8208) LAR -12.5 and Stafford U283.5 (-113). Straight-up context only: ESPN panel LAR x3 (8187), PFT Florio LAR 41-17 (8054). Average Joe contest (8365, Burke): 64% on LAR to cover, Over 51.5 87%; public consensus is context, not edge.
- Reading: sharps/analysts who took ARI did so at +12.5 to +13.5 and those on LAR at -12 to -12.5; every LAR-side number is now worse by 1 to 1.5 points, every ARI-side number is unchanged or better. Rejected rows (VSiN Cohen LAR -3.5, Action Network LAR -3, BettingPros week-7 lookahead) are not used.
- Not used: VSiN 2111235179192996248 (rejected), items unverified against raw.

## Splits (ages stated)
- Spread: ARI 32% of bets / 36% of money; LAR 68% / 64% (captured 2026-10-17T18:14Z, ~4.5h before this run). Total: Over 55% bets / 65% money (same capture).
- Moneyline split (home bettors 97% / money 87%) is the Thursday-night pull (2026-10-16T03:30Z, about 42.6h at manifest): STALE, withheld.
- Read: public on LAR, money more balanced on the ARI side than bets, and the total shows money-heavy Over. Context only.
[Source: data/generated/master-intel/w06-splits-all.json /games/8]

## Simulator (scripts/intel/margin-simulator.mjs; selftest PASS; home-line -13.5, total 52)
| Run | margin-adj (home +) | total-adj | LAR cover | ARI cover | Over | Under |
|---|---|---|---|---|---|---|
| Baseline | 0 | 0 | 50.0% | 50.0% | 50.0% | 50.0% |
| **Chosen** | -0.5 | 0 | 48.5% | **51.5%** | 50.0% | 50.0% |
| Hypothesis A | -1.0 | 0 | 47.0% | 53.0% | 50.0% | 50.0% |
| Hypothesis B | +1.0 | 0 | 53.0% | 47.0% | 50.0% | 50.0% |
| Total tilt | -0.5 | -1 | 48.5% | 51.5% | 46.9% | 53.1% |
| Key-number check, ARI +14 | -0.5 | 0 | 47.2% | 50.2% (push 2.6%) | n/a | n/a |
(cover/over excl. push; baseline distribution mean margin 14.05 from the home-line; home win ~84%.)
Adjustment reasons: -0.5 toward ARI: quant mean margin 11.4 and model-gap vs 13.5, LAR -3 turnover margin (regression upside for LAR) argues the other way, and Love Out / ARI safety depletion are already in the 13.5, so the net is kept small. Total adj 0 for the main read; the -1 row is shown only as sensitivity (no sourced reason strong enough to move it). Caveat: probabilities are market-calibrated conditional on the input line; they are not independent edge estimates. ARI +13.5 -117 needs about 53.9% to break even; the chosen run gives 51.5%, ARI +14 at -110 would need 52.4% against 50.2%/51.5% excl. push (still no).

## Props (verified captured prices only; no calibrated joint model; availability = available_at_capture_only)
BKR 2026-10-17T19:42Z; BEO 2026-10-17T21:16Z. DK Predictions contracts are reference-only.
- Corum rush attempts: BKR ladder 10+ (i.e. over 9.5) -130, Over 10.5 +131 / Under 10.5 -155. Hribar's quoted "-105" (MGM) and Wilcox's "55%" (prediction market) are not matched to a captured row; price has moved against the over (-105 to -130). [BKR /rows/3069-3072]
- Kyren Williams: rush yds O/U 69.5 -108/-108 (110+ is +379; Phil Wood lead 8336 quoted 110+ at +467, matchup inferred, price shortened); carries O/U 14.5 -101/-115. [BKR /rows/3037-3038, 3062, 3067-3068]
- Tyler Higbee: rec yds O31.5 -115 / U31.5 -101 (Trent Conner lead 8339 at 30.5, game not stated in source; line moved up 1.0); rec O2.5 -164. Nick Giffen anytime TD +260: no Higbee row in captured BEO anytime-TD board, price unverified, omitted. [BKR /rows/2915-2916, 2819-2820]
- Stafford pass yds O286.5 -107 / U286.5 -109 (ESPN Solak U283.5 -113 is now 3 yards stale vs the current line); Brissett O/U 237.5 -127/+109. [BKR /rows/2732-2735]
- McBride: rec yds O/U 64.5 -108/-108; targets O/U 10 -115 (BEO); anytime TD Yes +145 (BEO /rows/518-521). Hribar McBride "under longest reception 19.5": no longest-reception market exists in the captured BKR/BEO files, so UNAVAILABLE.
- No prop is carried as a candidate; Love Out and unconfirmed ARI skill depth make ARI receiving legs inactives-dependent.

## Counter-case (the opposite side)
For LAR -13.5: ARI is 31st in SRS, 32.4 ppg allowed, 6.24 YPP allowed and 5 of its defensive back seven are Out/IR; Love is Out and Conner is IR, so the run game that keeps Brissett's drives alive is gone; LAR owns a 16-3 head-to-head record (15 by double digits); the Rams' Stafford pace (55/51/54 attempts) can score late even without the run; LAR's -3 turnover margin is the kind that regresses upward. If ARI's OL is truly depleted, ARI +13.5 loses on a single blowout. PFT's 41-17 and the Average Joe public skew reflect this. For the Over (public 87%): LAR 31.7 projected points alone is most of the total.
For ARI +13.5/+14 (the lean if forced): book sits at 13.5, the juice on ARI is the cost (-117), the quant model and four sources (Tuley, Erickson, Hunter, Tucker) are ARI,; none of this clears the -117 price in the simulator.

## Ambiguity / missing data
- Official inactives (Love, Benson, ARI OL, McDuffie, Curl, Collins, Baker) not available until ~11:30 AM PT Sunday.
- ARI OL status conflict (dossier "none" vs Kezirian "depleted").
- Moneyline splits are 42h stale (withheld). Spread/total splits are 4.5h old.
- DK Predictions, Higbee anytime TD +260, McBride longest reception: unverified or no row.
- quant model contest field warning: script expects week-06-2026-verified-lines.json; real file is week-06-lines.json (flag only).
- Launch-board record of the session prompt hash (a9b86304) differs from the file now (c2bf2b1b); content consistent.
- Packet source_gate "blocked_in_source_not_waived" text in articles section is superseded by the cleared condition; I followed the cleared condition and prompt section 3.
- Validation: scripts/intel/validate-game-output.py is pinned to Week 5 paths and was NOT run; manual self-check done for forbidden keys, disposition/tier pairing, adjustment caps (|-0.5| < 2.0) and unsourced claims.

## Pre-kickoff delta checklist
1. Official inactives (~90 min): if ARI OL starters (Johnson/Adams/Bisontis) are out, or Benson is inactive, shift margin-adj +0.5 to +1.0 toward LAR; if Love is somehow active, shift -0.5 toward ARI.
2. Price crossing: ARI +14 at -110 or better, or ARI +13.5 at -105 or better, re-run sim (need ARI cover > breakeven by roughly 2 points); LAR at -12.5 or lower reopens LAR side.
3. Total: a move to 53+ with LAR 31.7 model supports Under sensitivity; 51 or lower reverses it. Wind above 20 km/h would matter (forecast 13/14.8).
4. LAR defensive status: McDuffie and Curl active or out (secondary matchup tier is low only if healthy).
5. Re-pull BKR/BEO props for Corum 9.5 attempts (back to -105?), Higbee 30.5, Stafford under, and confirm any anytime-TD price before any prop leg.
6. Refresh moneyline splits only if used. Roster gate re-run Sunday morning with --fetch.
