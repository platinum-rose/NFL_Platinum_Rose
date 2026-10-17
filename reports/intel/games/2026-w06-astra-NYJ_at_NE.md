# Astra W6 - NYJ @ NE (proposed synthesis)

- As of: Sat 10/17 03:43 PM PT (generated 2026-10-17T22:43:32Z). Branch claude/w5-prop-cards-2026-10-11, HEAD ea74728e1e1f174f047755719896b90460c2eb64.
- Kickoff: Sun 10/18 10:00 AM PT (2026-10-18T17:00:00Z). Packet: /packets/1 of scratch/w06-astra-synthesis-queue.json, SHA-256 32639e9e131a08623daa7fbe0baa73bde2b0caf1115fd1d371c8e1a7fa730e4a (queue e5832e56de4087515a2a8550a9a3e7c33c18091a11ad3331d39d681446358f55, built 2026-10-17T22:06:53Z). Session prompt SHA-256 c2bf2b1bb36979dd7a79b4922a4aa208d4fadf8950ffb41af02ee95edc9ee782 (re-pinned; relaunch after the earlier hash-drift STOP, which this run supersedes).
- Gates: queue, packet, session prompt, launch-contract files and 49 of 50 packet evidence hashes verified exact. The 50th (data/generated/master-intel/w06-roster-vet.json) differs from its pin by design (self-rewriting receipt, not rerun): receipt reads status PASS, roster_source 2026-10-17T22:22:11Z, 0 blocking, roster snapshot age about 0.3h at generation (receipt's own roster_age_h 0.2); no NYJ or NE name in its 10 UNVERIFIED rows. ESPN status file shows only SEA@DEN final; NYJ@NE not started; kickoff is about 18 hours out.
- Conditions: status conditional, zero blockers, zero launch_blocking conditions (ARTICLE_GATE_RESOLVED has launch_blocking false; OFFICIAL_INACTIVES, KICKOFF_WEATHER, AJ_BROWN_STATUS scoped).

## Disposition

**price moved - tier 2- - thin lean NYJ +7 (-103), no Brown leg, no total play.** The Jets side is supported by the calibrated quantitative context (provisional), a block of approved podcast voices and a lopsided public, but nearly all of the podcast support was priced at +7.5 and the board is now +7 (hook lost). After my judgment adjustments (net -0.5 toward NYJ) the simulator gives NYJ +7 a 51.5% cover excluding the 5.6% push, against a 50.7% breakeven at -103: roughly +0.7 points of edge, which is thin and sensitive to the A.J. Brown status that the packet's availability layer predates. This is a proposal for Andy to react to, not a placement. Honest alternative reading: pass.

## Team form and schedule context

- NYJ 2-3, NE 3-2 through week 5. NYJ: 18.6 ppg / 19.2 papg, 4.88 yds/play, SRS -1.81, turnover margin +3. NE: 22.0 ppg / 18.8 papg, 5.84 yds/play (opp 5.26), SRS +7.79, turnover margin -5 (11 giveaways). [Source: data/generated/team-dossiers/2026-w06/matchups/NYJ@NE.json, side_by_side + season_profile_espn; data/generated/team-dossiers/2026-w06/NYJ.json, NE.json; through week 5, built 2026-10-17T02:04:52Z]
- EPA/play: NYJ offense -0.0353, defense -0.0775 (lower is better); NE offense +0.0576, defense +0.0169. NE's raw efficiency edge on offense is clear; NYJ's defense grades better than NE's per EPA. [Source: same matchup file, side_by_side]
- NE's -5 turnover margin is a regression flag in the Jets' favor, but the nflverse regression fields (takeaway margin, fumble recovery pct) are null in this dossier, so it is a note rather than a quantified input. [Source: team dossier data_quality.efficiency_nflverse.null_fields]
- Coaching-tendency snapshot is historical_context_only (stale flag); not used. [Source: team dossier source_registry id=coaching]

## Availability and QB

- QBs: Geno Smith (NYJ) and Drake Maye (NE) are ESPN depth-chart starters; the packet labels this captured depth chart, not team confirmation. Roster identity matched on both. [Source: queue packet availability.quarterbacks; espn-status-w06.json teams.NYJ/NE.qb_starter, 2026-10-17T02:03:26Z]
- NYJ out/IR in the dossier: Breece Hall RB, Adonai Mitchell WR, Joseph Ossai DE, Dylan Parham G, Braiden McGregor DE (IR), Omar Cooper Jr. WR (dossier shows IR; ESPN article says he will play). Questionable: Kenyon Sadiq TE, Dane Belton S. [Source: matchup file availability.away; ESPN/Cimini article 8217, 2026-10-16T15:50Z: "Jets rookie WR Omar Cooper Jr. (ankle) will play against the Patriots, but RB Breece Hall and wideout Adonai Mitchell have been ruled out for Sunday's game."]
- NE out in the dossier: CBs Karon Prunty and Carlton Davis III (Out), Marcus Bryant OT (IR). Questionable: TreVeyon Henderson RB (high-ankle sprain, "hoping to play"), Will Campbell OT, Craig Woodson S, Christian Elliss LB, Channing Canada CB. [Source: matchup file availability.home; espn-status-w06.json teams.NE injury_report_non_active, 2026-10-16 comments]
- **A.J. Brown (NE) is the live conflict.** The dossier and ESPN status snapshot (02:03Z) carry him as Injured Reserve. Later articles: ESPN/Reiss 2026-10-17T13:25Z "Brown is likely to be activated Saturday after missing the past four games with a right high ankle sprain, a source told NFL Network's Ian Rapoport.." and RotoWire 2026-10-17T20:13Z "The Patriots activated Brown (ankle) from injured reserve Saturday, but he's still listed as questionable for Sunday's game against the Jets." [Source: data/research-intel/review/article-intel-review-latest.json, analysis_notes article_note__8348 and article_note__8383]. Status is questionable, not cleared, so no Brown leg. At game level I treat his probable return as an unmodeled plus for NE (+0.5 in my adjustment); the quantitative model's availability layer predates it.
- Official inactives (about 90 minutes before kickoff) decide everything above. Reporter and ESPN statuses are source claims, not inactives.

## Weather and venue

Forecast captured 2026-10-17T20:16Z (Open-Meteo, a forecast not an observation): 50.9F, 0% precipitation, wind 3.8 km/h, gusts 6.1 km/h; materiality "no_material_flag_in_current_forecast". No weather adjustment applied. Kickoff-day refresh still owed. [Source: data/research-intel/review/2026-w06-weather-venue.json, rows/1; packet weather]

## FTN and quantitative

- Quant model rebuilt on the 12:40 PM PT board (2026-10-17T21:11Z): mean score NE 24.42, NYJ 18.66 (total 43.07), home margin 5.76; its own simulation shows NYJ cover 53.6% excluding pushes and Under 51.3% excluding pushes. Warning in file: no SuperContest lines file found by the script (contest null); flag only. Model probabilities are labeled provisional quantitative context only. [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[5]; generated 2026-10-17T21:11:11Z]
- Features: SRS NE 7.787 vs NYJ -1.806; secondary adjustment NE -0.27 / NYJ +0.12 points (NE secondary thinned). [Source: same, games[5].features]
- The model's 53.6% reproduces exactly in the shared simulator at margin-adj -1.24 / total-adj -0.43 (sim row D below), so I treat it as comparable to, not additional to, my own adjustments.
- FTN weekly stats are a quantitative input accepted on the weekly cadence (capture completed 2026-10-13T18:14Z, context 2026-10-16T22:00Z). I consumed FTN only through the quant model's features and did not mine the 297/312 FTN team records independently. [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json]

## Market (captured, not live offers)

| Item | NYJ | NE | Total | Captured |
|---|---|---|---|---|
| Opener (Action Network, spread 10/12 00:02Z, total 10/12 03:05Z) | +7.5 | -7.5 (home side -105) | 44.5 | 2026-10-12 |
| Bookmaker board 12:40 PM PT (baseline) | +7 -103 | -7 -113 | o43.5 -108 / u43.5 -108 | 2026-10-17T19:40:00Z |
| Moneyline (Bookmaker, same board) | +284 | -338 | - | 2026-10-17T19:40:00Z |
| Opener moneyline | +280 | -366 | - | 2026-10-12 |
| SuperContest locked line | - | NE -7 | - | 2026-10-15T21:29Z (reference, not executable) |

Movement: spread NE -7.5 to -7 (half point toward NYJ: the hook above the key number 7 is gone), total 44.5 to 43.5 (-1.0), NE moneyline -366 to -338. No executable live price was checked; no sportsbook visited. [Source: packet market.opener, signed_reconciliation_baseline, noon_bookmaker_observations rows 456-461 raw-verified; data/odds/BKR_current_lines_1017_1240_buildfmt line 3; data/supercontest/week-06-lines.json games[2]]

## Experts, podcasts, articles

Approved YouTube signals (approved by Andy 2026-10-17; signals, not an expert tier; all priced +7.5 unless noted; current board is +7, so each is 0.5 off the number the speaker had):
- NYJ +7.5: Chad Millman (Sharp or Square, "side. I am taking the Jets."), Simon Hunter (same episode, agrees: "I'm glad to hear you say that. Uh, so am I."), Evan Abrams and Stuckey (Action Network, "the Jets at seven and a half is just a good bet" / "we'll throw in the Jets plus seven and a half to our six-pack"), Brandon Anderson (Action Network, standalone and as an SGP with Under 43.5, "Jets plus seven and a half. I gave that with the under. We'll take it standalone here."; two entries from one speaker count as one voice), Steve Fezzik ("So, get me the Jets plus the seven and a half, two units.") and Ross Tucker ("I'm going to take the Jets. Only one unit. They're still the Jets, but plus seven and a half on the Jets."). [Source: data/podcasts/youtube-extracted-picks-2026-w06.json picks 8, 9, 21, 22, 46, 48, 60, 61; line_movement delta -0.5 each]
- Not comparable to the full-game number: Fezzik's separate fourth-quarter Jets +2.5 leg (picks/12, line_movement delta +4.5), and Anderson's SGP price (+265) for Jets +7.5 / Under 43.5.
- NE side: Joe Pisapia (BettingPros, published 10/12): "Like, yeah, I I do like the Patriots laying even laying the full touchdown." (NE -7, same as current board). [Source: youtube-extracted-picks-2026-w06.json picks/100]
- Totals split: Anderson Under 43.5 (SGP leg) vs Pisapia Over (line not stated, 10/12, quote says "I actually like the over in this game"; unusable for pricing). Not agreement.
- Independence: the approved Jets voices come from four episodes (0XtOHyz2LRs, 5AikVQLaJEg, C8cDtGmsRoc, EC4r_E6mc0E); 7 distinct speakers, but they are a podcast cluster pricing the same +7.5 and partly reacting to one another (Hunter to Millman, Tucker to Fezzik, Stuckey to Abrams). Treat as roughly 4 independent opinions. Reasons given, as paraphrased in the packet's rationale fields: fade the public on Maye, Jets secondary and Glenn play-calling, NE missing Campbell and Henderson, low-scoring script.
- Expert feed row (verified, quote quality "missing_url_or_quote"): Sharp or Square, NE -7, 10/15: "Grabbing -7 line before potential AJ Brown return; Drake May is 9-2 ATS vs AFC East while Aaron Glenn is 3-6-1 ATS as a big dog." This is attributed to the same outlet that publishes the Millman/Hunter Jets video, so attribution is inconsistent; context only. [Source: data/generated/master-intel/w06-expert-verified.json rows/9]
- VSiN/Dave Tuley (10/15): "Best Bet: Jets +7 or better (Pool Play Percentages: Jets 60/40 in ATS contests, higher at +7.5, but New England still 70/30 in SU pools)." Quote quality "unverified_against_raw_source"; context only. [Source: same, rows/88]
- Rejected row: VSiN/Zachary Cohen "Ravens & Patriots ML vs." (verdict reject): not used.
- Articles (gate cleared 2026-10-17; analyst leads priced at publish time, not promoted): ESPN straight-up panel (Maldonado/Moody/Walder, article 8187, 10/17): "NE 27-21, NE 30-17, NE 24-16; line NE -7.5 / 43.5": the three score picks are NE by 6, 13 and 8, so against the current -7 two cover and one does not. Straight-up picks are context, not edge. PFT/Florio (article 8054, 10/15): "NE 27-17" (10-point NE margin, total 44). Straight-up score picks only; the packet had this article as unresolved in the source list but it is carried as a lead in read_in_full_leads. [Source: packet expert_article_podcast.articles.read_in_full_leads; expert row rows/71]
- VSiN/Burke first-TD lead (article 8136, 10/15): "Hunter Henry +950, DeMario Douglas +1200 (DK as of publish)"; body flagged suspected_ingest_cap, manual disposition "selection needs execution verification". Current Bookmaker prices are shorter (see Props). 
- Articles NOT agreeing on the packet's own reading: the packet narrative says "Sharp or Square is the lone voice on NE -7 (ahead of a possible A.J. Brown return, but Brown is on IR)". The IR claim is stale per the 10/17 RotoWire/ESPN items above.

Net read: pros lean NYJ (about 4 independent opinions) at a number that no longer exists; NE-side evidence is SU score picks (context) plus Pisapia. Public contest consensus is NE heavy in SU pools (Tuley) but NYJ-leaning ATS.

## Splits (spread/total captured 2026-10-17T18:14:06Z, 11:14 AM PT, about 4.5h before this run)

- Spread: NYJ 26% of bets / 28% of money; NE 74% / 72%. [Source: data/generated/master-intel/w06-splits-all.json games[1]]
- Total: Over 59% of bets / 67% of money; Under 41% / 33%.
- Moneyline splits (NE 97% bettors / 96% money) are the Thursday-night pull (2026-10-16T03:30Z, about 42.6h old at manifest): STALE, withheld, not used.
- Interpretation: NYJ is the contrarian spread side at a single key number; the money share on the Over (67%) is a mild contrarian signal for the Under, but my total edge is below breakeven so it is a note. Splits do not predict outcomes and these are one source's counts.

## Simulator (scripts/intel/margin-simulator.mjs; selftest passed; calibration 2018-2025, sha256 0ea3559255d4b31f; script sha256 ca67f384...)

Market-calibrated: probabilities are conditional on the adjustment stated, not forecasts. Re-centering means the line used defines the zero-edge point, so a row at another line answers "if the market stood there and I held my belief fixed", with the adjustment re-expressed accordingly.

| Row | Line (NE) | Total | margin-adj / total-adj | NYJ cover (incl push) | NYJ cover excl push | Push | NE win | Under excl push |
|---|---|---|---|---|---|---|---|---|
| A market baseline | -7 | 43.5 | 0 / 0 | 47.22% | 50.00% | 5.55% | 72.9% | 50.00% |
| B PRIMARY (my judgment) | -7 | 43.5 | -0.5 / -0.3 | 48.60% | 51.46% | 5.57% | 71.8% | 50.91% |
| C Brown ruled out | -7 | 43.5 | -1.0 / -0.3 | 49.97% | 52.92% | 5.57% | 70.6% | 50.91% |
| D quant-equivalent | -7 | 43.5 | -1.24 / -0.43 | 50.63% | 53.61% | 5.57% | 70.1% | 51.29% |
| E Brown fully healthy, bigger NE read | -7 | 43.5 | +0.5 / 0 | 45.85% | 48.53% | 5.53% | 74.0% | 50.00% |
| F NE stress | -7 | 43.5 | +1.0 / 0 | 44.47% | 47.07% | 5.51% | 75.1% | 50.00% |
| G NYJ +7.5 (hook), belief fixed | -7.5 | 43.5 | -1.0 / -0.3 | 52.79% | 52.79% | 0% | - | - |
| H NYJ +6.5, belief fixed | -6.5 | 43.5 | 0 / -0.3 | 50.00% | 50.00% | 0% | - | - |
| I NYJ +8, belief fixed | -8 | 43.5 | -1.5 / -0.3 | 52.95% | 54.31% | 2.50% | - | - |
| J Under 44.5, belief fixed | -7 | 44.5 | -0.5 / -1.3 | - | - | - | - | 53.94% |

Adjustments with reasons (home-positive points, caps respected: soft 2.0, hard 3.0):
1. -1.0 to margin: quant lean toward NYJ (-1.24 raw) weighted about 80% because the model is provisional and the simulator header says it is not validated against the 60/25/15 blend or FTN/power history.
2. +0.5 to margin: A.J. Brown probable return (questionable) is not in the quant layer's availability snapshot; NE's passing offense gains, and Maye's pass-yardage and TD lines imply NE offense is priced to it.
3. Net margin-adj -0.5. Total-adj -0.3: quant total lean -0.43 weighted about 70%, partly offset by a Brown return; weather neutral.

Price sensitivity on the pick: edge vs vig. NYJ +7 -103 needs 50.74% excl push; row B is 51.46% (about +0.7). NYJ +7.5 at -105 needs 51.2% (row G 52.79%, +1.6); at -110 needs 52.4% (+0.4). NYJ +6.5 has no edge. Under 43.5 -108 needs 51.9%; row B is 50.91% (no edge); Under 44.5 would be 53.94% (about +2) if it appears.

## Props (verified prices only, no model)

No calibrated joint model exists for props; none are recommended. Captured Bookmaker rows (2026-10-17T19:40:54Z, 12:40 PM PT): Geno Smith pass yds O/U 216.5 (-108/-108); Drake Maye pass yds O/U 232.5 (-112/-104); Smith pass TD O1.5 +211 / U1.5 -254; Maye pass TD O1.5 -147 / U1.5 +125. First TD (Bookmaker): Hunter Henry +919, DeMario Douglas +1063. The VSiN lead priced those at +950 and +1200 on DK at publish (10/15): the Bookmaker prices are shorter, so the lead has repriced against the angle (implied 9.5% to 9.8% on Henry; 7.7% to 8.6% on Douglas, comparing different books). BetOnline (2026-10-17T21:15:31Z) has only two kicker fantasy-point markets for this event (Sanders O/U 6, Borregales O/U 8.5, all -115); no player markets otherwise. DraftKings Predictions: 69 reference rows, non-executable, not used. No A.J. Brown prop row was present. Pass-yardage and TD lines may need repricing if inactives change. [Source: queue packet player_props.bkr.verified_rows pointers /rows/516-519, 574-577, 838, 848; player_props.beo; prediction_contracts]

## Counter-case (why NE -7 is the right side)

- NE has the stronger rating (SRS +7.8 vs -1.8, EPA gap on offense about 0.09/play, 5.84 vs 4.88 yds/play) and the market is at -7, below what the ratings alone would suggest. The SRS gap is 9.6 points before home field against a 7-point line, though the blended quant model still lands at a 5.8-point NE margin.
- Jets are without Hall and Mitchell (skill) and Parham (G), and their offense is -0.035 EPA/play. If Brown plays a normal snap share, NE adds its top WR against a Jets secondary whose air-yards coverage load (Stephens, Thomas) is not elite.
- NE's turnover problem (11 giveaways) can mean-revert, and a close one-score game would flip to -7 push/cover more often than the line implies (about 8% of simulated margins land exactly on 7).
- The edge I show (0.7 pts) is within the noise of my adjustments; reasonable alternative inputs (rows E, F) put NYJ below 50%.

## Ambiguity and missing data

1. A.J. Brown: ESPN/Reiss "likely" activation and RotoWire "activated... questionable" conflict with the dossier's IR status (stale 02:04Z). No Brown leg. My +0.5 adjustment is a judgment, not a sourced number.
2. Official inactives not available (due about 8:30 AM PT 10/18): affects Brown, Henderson, Campbell, Cooper, Sadiq, Belton.
3. Kickoff-day weather refresh not done; forecast is benign.
4. Moneyline splits stale (42.6h); withheld.
5. Sharp or Square attribution conflict (expert feed has NE -7; Millman and Hunter's video has Jets +7.5).
6. Packet narrative says "Brown is on IR" - stale per items above.
7. Quant model relies on a SuperContest file name mismatch (contest null); flagged, not fixed, not material here.
8. FTN used only via model features; no independent FTN mining.
9. Quote quality on several YouTube rows is "verify_against_retained_raw_before_quoting"; quotes above are those carried in the packet rows, and I did not open the caption files.
10. Article premises are priced at publish (ESPN panel at NE -7.5 / 43.5); not re-derived. PFT article was listed unresolved in the source's own id list but carried as a lead.
11. Session-prompt activation template inside agents/dev/ASTRA_W06_GAME_SESSION_PROMPT.md still contains the line "Article-gate decision in this queued version: unresolved; STOP"; the launch-board activation and prompt section 3 say cleared 2026-10-17. I followed the board and queue (article_gate cleared, launch_blocking false).
12. The W5 validator (scripts/intel/validate-game-output.py) is hard-wired to Week 5 packets and was not run; manual self-check performed (forbidden keys none, disposition/tier pairing price moved/2- valid, adjustment caps respected, claims sourced).
13. Shared RUNLOG tail displayed other games' status lines when I read the log; I did not use them.

## Pre-kickoff delta checklist

1. Official inactives (about 8:30 AM PT): if A.J. Brown is OUT, move to row C (NYJ +7 at 52.9% excl push) and the lean firms toward tier 2 candidate; if Brown is active with no snap limit, go to row E (NYJ 48.5%) and drop to skip/pass.
2. Henderson and/or Campbell inactive: shades toward NYJ (my judgment, roughly 0.3 to 0.5 point each, unsourced); both active: no change. Cooper or Sadiq out: shades toward NE.
3. Line crossing: NYJ +7.5 at -105 or better restores a real edge (row G +1.6); NYJ +6.5 removes it (row H). NE -7 with price drifting to -110 on the NYJ side: edge at +7 -110 needs 52.4%, row B 51.5%: skip.
4. Total: Under 43.5 has no edge; Under 44.5 or higher at -108 would be about 53.9% (row J).
5. Weather refresh: materially windy or wet conditions would pull total-adj lower (judgment, no sourced threshold); current forecast calm.
6. Check for any new Brown price/prop rows; re-pull Bookmaker/BetOnline before any use.
7. Re-run roster gate only if the roster snapshot is older than 24h (expires 2026-10-18T22:22Z); not an issue before kickoff.
