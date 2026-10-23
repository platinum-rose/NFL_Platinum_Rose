# Astra W06 synthesis: CHI @ ATL (proposal, not a pick)

- As-of: Sat 2026-10-17 19:19 PT | Generated: 2026-10-18T02:19:15Z | HEAD: ccd8753 (branch claude/w5-prop-cards-2026-10-11) | Kickoff: Sun 2026-10-18 10:00 PT (17:00Z), about 14.6 h away | Packet: scratch/w06-astra-synthesis-queue.json, packet CHI@ATL, built 2026-10-17 (dossier 02:04Z; quant 21:11Z; board 19:40Z)
- Status: proposal for Andy to react to. Nothing placed, promoted or written to Supabase. No sportsbook visited.

## Disposition

**Disposition: conflicted. Tier: 2- (contest-only lean) / research_only for every market-price position.**

At the executable noon board (CHI -1 -113 / ATL +1 -103, total 52.5 -108/-108, ML CHI -119 / ATL +105) the model is a coin flip in the "Williams plays" scenario (ATL +1 covers 50.0% ex-push; over 50.0% baseline, 51.5% with my adjustments). That is no edge, so there is no market side or total play. The only lean is **ATL +3 in the SuperContest** (locked contest line captured 10/15, spread-only allowed market): it is 2 points better than the live number, and the simulator prices it at 54.8% to cover ex-push (Williams plays) and 62.6% (Williams out). It is a contest-only lean, not a sportsbook price, and it carries the CHI_STARTER_UNCONFIRMED condition, so it is capped at tier 2-. The lean on ATL holds in both Williams scenarios; the news that would flip it to CHI is in the delta checklist.

Two other things are true at the same time. (1) The market has already moved from the opener (CHI -2 / 48 on 10/12) to CHI -1 / 52.5, so the "value" in ATL +3 is the contest's stale number, not the market. (2) Several approved podcast ATL +3 picks (Fezzik, Tucker, Fitzmaurice) are 2 points stale against the board.

## Gate notes (advisory; nothing stopped the run)

1. Queue packet CHI@ATL: synthesis_status = blocked, queue_state = queued_hold, blockers = [CHI_STARTER_UNCONFIRMED], dispatch not relied on. Used anyway per standing rule; affected claims capped at tier 2-, Williams-dependent legs omitted. Resolves only with Sunday-morning team news/inactives.
2. Conditions: ARTICLE_GATE_RESOLVED (cleared 10/17, non-blocking), OFFICIAL_INACTIVES (due near kickoff, open), KICKOFF_WEATHER (open; roof unconfirmed). missing_inputs = OFFICIAL_INACTIVES, KICKOFF_WEATHER, CHI_STARTER_UNCONFIRMED.
3. HEAD drift: packet pins say ea74728e1e1f, observed ccd8753 on the same branch. Not a gate; no hashing done (no source looked wrong while reading).
4. Kickoff has not passed (about 14.6 h out), so this is a forward-looking synthesis.
5. Roster gate: data/generated/master-intel/w06-roster-vet.json status PASS, roster source 2026-10-17T22:22:11Z, age about 3.8 h at file write and about 4 h now; 0 blocking. Its 11 non-clean rows (1 QUESTIONABLE Olave NO, 10 UNVERIFIED) do not include any CHI or ATL player. roster:vet not rerun. Note: the roster/availability layer lists ATL QB depth as Penix, Tua Tagovailoa, Cooper Rush; I did not rely on that depth for any claim and flag it as unverified.
6. Odds-board sources differ in age: the availability layer carries an older board (CHI -3, total 49.5, ML -150/+133); the live-market comparison file drops signs. I used the signed 12:40 PM PT BKR board for everything priced.
7. BEO (10/17 21:15Z) has only 4 game-market rows for this game and no player rows; player prices below come from BKR (10/17 19:41Z) only.

## Team form and schedule context

- CHI 3-2, ATL 2-3 through week 5 [Source: data/generated/team-dossiers/2026-w06/index.json, team_signals.record, 2026-10-17T02:04Z].
- CHI ESPN season profile: 23.8 PPG for, 19.2 against, 5.32 YPP (opponents 6.00), turnover margin -4 (10 giveaways, 6 takeaways), red-zone TD 42.9% [Source: packet team_dossier.team_signals[CHI].season_profile_espn]. SRS 5.72 (rank 6), pythag 0.625. ATL SRS 1.56 [Source: packet quantitative.features.srs].
- Schedule note from Pat Fitzmaurice (BettingPros, 10/13): CHI is "off a physical Lambeau road trip" (rationale text in approved signal /picks/106). Chad Millman (Sharp or Square, 10/15): "Ben Johnson is 12-2-1 ATS outside the division in his career and 5-2 ATS coming off a straight-up loss" [Source: packet expert_registry_rows /rows/5; quote quality missing_url_or_quote, context only].
- Tempo: CHI 74.5 plays/game vs ATL 57.0 (FTN) [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, team_context, tempo, capture completed 2026-10-13T18:14Z].

## Availability and QB (the swing factor)

- **CHI QB Caleb Williams: unconfirmed.** ESPN lists him Questionable (hamstring) as of 10/16 [Source: data/research-intel/availability/2026-w06-availability-layer.json, CHI.reported_questionable_doubtful, 2026-10-16]. Operator note 10/17 13:13 PT: "expected to play, not confirmed by the team; resolution Sunday morning" [Source: data/research-intel/operator-confirmed-starters-2026-w06.json, operator_notes]. ESPN headline slug 10/17 20:30Z reads "sources-bears-plan-start-qb-caleb-williams-vs-falcons" (article 8380, not a pick article; body not quoted here). Backups on the depth chart: Tyson Bagent, Case Keenum. FantasyPros was about 67% to play as of 10/16 19:54Z (operator file).
- CHI defense/availability (ESPN, ruled out unless noted): DE Dayo Odeyingbo (quad), LB T.J. Edwards (hamstring), RB Kyle Monangai (thumb/toe), LB Keyshaun Elliott, S Anthony Johnson Jr. (IR); CB Kyler Gordon Questionable (calf; the row's status field says Out but its comment says questionable, a source inconsistency), CB Tyrique Stevenson Questionable (hip). DE Montez Sweat suspended 2 games (PED policy) [Source: availability layer, CHI, 2026-10-13 to 10-17].
- ATL: QB Michael Penix Jr. is the listed starter. ESPN headline slug 10/16: "falcons-michael-penix-jr-ribs-cleared-play-vs-bears" (8246) and PFT "michael-penix-has-no-injury-designation-set-to-start-sunday" (8235); this is a captured depth chart, not team confirmation [Source: packet availability.quarterbacks]. CB C.J. Henderson Out (groin); DE Za'Darius Smith Questionable (neck); LB Yasir Abdullah IR.
- None of the above is official inactives; those arrive about 90 minutes before kickoff.

## Weather and venue

ATL is a retractable roof. Weather file verdict: venue_condition_verification_required; "do_not_apply_outdoor_weather_without_current venue/roof confirmation" [Source: data/research-intel/review/2026-w06-weather-venue.json, CHI@ATL row, Open-Meteo 2026-10-17 20:16Z, forecast not observation]. I apply **no outdoor weather**. A narrative note mentions gusts near 37 km/h if the roof were open; that is conditional on an open roof and is not used. Roof status is a kickoff-day check; a closed roof is neutral-to-positive for offense and for the total.

## FTN and quantitative

FTN (weekly cadence accepted by Andy 10/17; capture completed 2026-10-13T18:14Z, 4 games played per FTN GP) is a quantitative input, not an expert tier.

| Metric (FTN, season) | CHI | ATL |
|---|---|---|
| Offense DVOA / EPA per play | +12.3% / +0.077 | -4.0% / +0.025 |
| Pass offense DVOA | +39.8% | -12.0% (CPOE -7.2%) |
| Rush offense DVOA | -2.5% | +13.0% |
| Defense DVOA / EPA per play | -7.1% / -0.059 | -7.0% / -0.069 |
| Pass defense DVOA | -13.3% | +1.6% |
| Rush defense DVOA | +1.1% | -28.2% |
| Turnover rate (offense) | 1.34% | 3.07% |
| Defensive pressure rate / blitz | 35.3% / 39.7% | 34.4% / 22.6% |

Read: CHI's passing offense is the best unit on the field (conditional on Williams); ATL's run game is its strength and CHI's run defense has lost Edwards and Odeyingbo, which is Sharp's thesis (below). ATL's offense turns it over more and rarely goes deep (aDOT 5.4). FTN is 4-game and CHI/ATL rush-defense tables are noisy; treat as directional.

Quantitative model (rebuilt on the 12:40 PM board, 2026-10-17T21:11Z): home mean 25.95, away 27.06, total 53.00, home margin -1.11; sim home cover 48.5%, away cover 49.1%, push 2.4%; over 51.5% / under 48.5% ex-push; model_menu side CHI 50.3% (essentially flat), total Over 51.5% [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[2]]. Provisional context only, and its tables drop spread signs: read direction from the BKR file. Narrative projection CHI 27.1, ATL 25.9 [Source: reports/intel/master-intel-narratives-2026-w06.md, CHI@ATL]. The model has no QB-change term (the narrative notes the same limitation for BAL).

## Market (captured prices, not live offers)

| Item | Value | Source / time |
|---|---|---|
| Opener (Action Network) | CHI -2 (ATL +2, -110), total 48, ML CHI -129 / ATL +102 | data/odds/actionnetwork-openers-2026-w06.json, spread 10/12 00:22Z, total 10/12 00:21Z |
| Current board (Bookmaker/BKR, Sat about 12:40 PM PT) | CHI -1 -113 / ATL +1 -103; o/u 52.5 -108/-108; ML CHI -119 / ATL +105 | data/odds/BKR_current_lines_1017_1240_buildfmt line 6; captured 2026-10-17T19:40Z; raw rows verified (/rows/1351-1356) |
| Movement | Spread 1 point toward ATL; total up 4.5 points (48 to 52.5) | cross-book opener vs BKR, a note not a blocker |
| SuperContest locked line | CHI -3 (ATL +3) | data/supercontest/week-06-lines.json, captured 10/15 2:29 PM PT; locked reference, not executable |
| ESPN-published (Sat) | CHI -1.5 / 51.5 | ESPN article 8187, 10/17 |
| Executable live prices | none verified | no sportsbook visited |

Narrative detail: the line briefly flipped to ATL -1 around 1 AM PT before settling at CHI -1 [Source: master-intel-narratives-2026-w06.md]. Prediction contracts (DK Predictions) are reference only.

## Expert, podcast and article agreement

Straight-up and spread opinions are context; only the repriced numbers matter, and none is independent confirmation of an edge.

| Source | Position | Timing / price | Repriced against CHI -1 / ATL +1 |
|---|---|---|---|
| Chad Millman, Sharp or Square (10/15) | CHI -1.5 | spread at publish | now CHI -1: line moved 0.5 toward ATL; pre-Williams-news; quote quality missing_url_or_quote |
| Zachary Cohen, VSiN (10/14) | ATL ML +140 | at publish | now +105; price worse by 35 cents; his ATL -3 spread row is rejected_do_not_use in the registry and is not used |
| Pat Fitzmaurice, BettingPros (10/13) | ATL +3 at +100 (CHI -120) | /picks/106 | stale by 2 points; now ATL +1 -103 |
| Steve Fezzik / Ross Tucker (EC4r_E6mc0E) | ATL +3, 2 units each | /picks/72, /picks/73 | stale by 2 points; they are two voices on one episode, counted as one source |
| Brandon Anderson, Action Network (10/16) | "I will take Atlanta plus three and a half." | /picks/58 | contest pick only; contest lines locked Wednesday |
| Stuckey, Action Network (10/14) | ATL ML in a DraftKings parlay "plus 510" | parlay note | parlay price not comparable to a game line |
| ESPN (10/17) | Maldonado ATL 27-23; Moody CHI 27-23; Walder CHI 31-13 | straight-up, article 8187 | context, not edge |
| PFT, Florio (10/15) | CHI 24-20 | article 8054 | context only; article listed unresolved in source gate list but accepted as a lead by the cleared disposition |
| VSiN, Burke (10/17) | Average Joe contest: ATL PK 67% (308/458) | article 8365 | public consensus, context |

Attribution tally on the spread: ATL +3 (contest or older number): Fitzmaurice, Fezzik/Tucker (one episode), Anderson. CHI: Millman (pre-news), ESPN 2 of 3 straight-up, PFT. Signals disagree on side and none was priced at today's number, so they do not justify a market play. Warren Sharp's best bet is Bijan Robinson rushing over 89.5; see Props.

## Splits (with ages)

- Spread: ATL 63% of tickets / 68% of money; CHI 37% / 32% [Source: data/generated/master-intel/w06-splits-all.json, games/4, captured 2026-10-17T18:14:06Z, about 8 h old]. Public and money both lean ATL at +1 (tickets and money agree; the line also moved toward ATL, so no reverse-line-move signal).
- Total: over 69% tickets / 70% money [same source and time]. Heavy over-side action on a total that went from 48 to 52.5 is public-chasing; this is a mild under-lean flag, not an edge in the model (sim 50.0 to 51.5% over).
- Moneyline: ATL 40% of bettors / 46% of money, captured 2026-10-16T03:30Z, **about 42.6 h old and stale**; the packet withholds it. Not used.

## Simulator

Engine: scripts/intel/margin-simulator.mjs (market-calibrated; --selftest passed all checks). Adjustments are points, home-positive (ATL = home). Inputs: home line +1 (ATL +1), total 52.5. All probabilities are **conditional** on the stated scenario and on the market-calibrated centre; they are not unconditional probabilities that account for the unresolved QB (P(Williams plays) is my estimate, not model output). Prop, team-total, SGP and teaser values are not model outputs.

| Row | margin-adj | total-adj | ATL +1 cover (ex-push) | CHI -1 cover (ex-push) | Over 52.5 | ATL win | Mean margin (ATL) / total |
|---|---|---|---|---|---|---|---|
| Baseline (market) | 0 | 0 | 50.0% | 50.0% | 50.0% | 47.6% | -0.79 / 52.50 |
| H1 Williams plays | -0.3 | +0.5 | 49.2% | 50.8% | 51.5% | 46.8% | -1.05 / 53.00 |
| H2 Williams out (Bagent) | +2.5 | -2.0 | 56.7% | 43.3% | 43.9% | 54.1% | +1.34 / 50.50 |

Adjustment reasons. H1 (-0.3, +0.5): within a nominal flat model, the CHI passing-offense advantage (FTN pass DVOA +39.8% vs ATL pass defense +1.6%; SRS 5.7 vs 1.6) and the loss of Edwards/Odeyingbo/Monangai roughly offset; CHI's higher tempo (74.5 vs 57.0 plays) and the model's own 53.0 total justify +0.5 on the total. H2 (+2.5, -2.0): a Williams-to-Bagent swing is plausibly worth more than 2.5 points of margin; I stop at 2.5 because there is no model term for it, the soft cap is 2.0 and the hard cap 3.0, and the tail on a scratch is the market repricing, not my number. The total reduction is -2.0 (the soft cap). These are judgment inputs, not fitted.

SuperContest ATL +3 (home line +3; the 2.0-point line gap versus the live ATL +1 is a mechanical translation of the contest number, not a judgment adjustment; it is added to the scenario adjustment):

| Row | margin-adj used | ATL +3 cover (ex-push) | Push |
|---|---|---|---|
| Contest, baseline (+2 line gap only) | +2.0 | 55.7% | 8.2% |
| Contest, Williams plays (H1) | +1.7 | 54.8% | 8.2% |
| Contest, Williams out (H2) | +4.5 (2.5 judgment + 2.0 gap) | 62.6% | 8.0% |

The contest cover rates include 8.2% mass on exactly a 3-point CHI win (exact margin of 3 is about 16% of simulated outcomes, simulator exact_margin_pct.m3), so raw (non-ex-push) cover for ATL +3 is about 50.3% in H1 and 57.6% in H2. A three-point CHI win pushes the entry; that is a real cost in a contest and is why this is tier 2-, not 2.

## Props (only row-verified BKR prices at captured time; roster gate PASS)

Source: data/odds/ BKR player export, captured 2026-10-17T19:41:24Z, raw price verified for all 375 player rows in the packet; BEO has no player rows for this game. These are captured, not live. No model probability is attached to any prop.

- Bijan Robinson (ATL) rushing yards: over 93.5 -108 / under 93.5 -108 (/rows/1689, /rows/1690); ladder 94+ -114. Warren Sharp's best bet (approved signal /picks/115, "So now we're pivoting to the over for his total rushing yards.") was at 89.5 (FanDuel/Pinnacle) or 90.5 (Caesars/HR/MGM); the BKR number is **4.0 yards higher than 89.5**, so most of the line value Sharp described is gone. Sharp's own condition: needs about 18.5 carries, which depends on game script, i.e. ATL not trailing; Williams out helps that script, Williams in with CHI scoring early hurts it.
- Bijan Robinson carries: over 18.5 +107 / under 18.5 -124 (/rows/1738, /rows/1739) [row-verified]. ESPN's Bowen "Bijan Robinson longest rush O18.5 (-118)" (article 8208, 10/16) has no matching BKR row and is not used.
- Penix pass-yards 236.5 (-110/-106); the BettingPros Erickson article (8332) "Penix pass attempts U31.5" and VSiN Burke (8207) "Penix 1st-quarter passing yards U46.5 (-112)" have no current priced rows in BKR/BEO; omitted. 8332's body also has a flagged ingest cap.
- Drake London TD (ESPN, Bowen, 8331) and Kyle Pitts / Williams / Odunze markets: no Bookmaker TD-scorer rows exist; omitted.
- **Omitted: all Caleb Williams, CHI passing-game, and CHI-skill prop legs** (Williams pass yards 232.5 -114/-102 exists at capture but depends on the unresolved starter) until inactives. No SGP, teaser or parlay is priced here.

## Counter-case (what makes the other side right)

1. **For CHI -1 and the ATL +3 contest fade:** Williams plays and CHI's passing offense is the best unit in the game (FTN pass DVOA +39.8%, SRS 5.7 vs 1.6, pythag 0.625 vs ATL's weaker profile), ESPN's panel splits 2-1 for CHI, Ben Johnson's ATS record outside the division is strong, and CHI also gets tempo (74.5 plays). Three of the expert signals for ATL +3 were struck at a number two points higher than today's: the market has already moved a point toward ATL and a CHI win by 3 is the single most common margin, which kills the contest value.
2. **For the over:** model total 53.0, over-lean 51.5% with Williams, CHI missing both its DE and its LB, ATL pass-heavy only when trailing. The heavy public over (69/70) is a fade-the-public caution, not a model signal.
3. **For the under:** Williams out removes about 2 points; CHI's pass rush is without Sweat, but ATL's pass offense is poor on FTN (-12.0% DVOA, CPOE -7.2%, aDOT 5.4) and ATL plays slowly (57.0 plays per game).
4. **Broader caution:** CHI has a -4 turnover margin and ATL turns it over at 3.07% vs CHI 1.34%, so variance is two-sided.

## Ambiguity and missing data

- Caleb Williams status: ESPN Questionable; operator says "expected to play"; no team confirmation. P(plays) is not a model input. Backup identity (Bagent vs Keenum) is from the ESPN depth chart.
- Roof status unknown; no outdoor weather applied. No kickoff-day forecast refresh.
- Official inactives are missing; every injury row above is a reported claim.
- ATL backup QB depth in the availability layer (Tua Tagovailoa, Cooper Rush) is not verified; it matters only in a Penix scratch scenario, which I treat as a flip-to-CHI condition without pricing it.
- Kyler Gordon row says status Out but its comment says questionable; treated as questionable.
- Packet "synthesis_status: blocked" and "queue_state: queued_hold" were used as notes only.
- The packet's HEAD pin (ea74728e1e1f) differs from observed HEAD (ccd8753); no source was re-hashed.
- Moneyline splits are 42.6 h old and unused; BEO has only 4 rows for this game (no player markets); no TD-scorer rows from Bookmaker.
- The queue packet's market block, availability-layer board and the live-market comparison file disagree on the spread/total age and sign (CHI -3/49.5 in availability layer vs CHI -1/52.5 board). The BKR 12:40 PM PT file governs.
- ESPN's CHI -1.5 / 51.5 (8187) is another point-in-time number and not an executable price.
- scripts/intel/validate-game-output.py is pinned to Week 5 paths (packet dir hardcoded to 2026-w05); not run against W06. A manual self-check was done: no forbidden keys in the JSON, disposition/tier pairing valid (conflicted -> 2-/research_only), adjustments within the hard cap 3.0 (2.5 and 2.0 on the judgment inputs; the 4.5 contest row is 2.5 judgment plus a 2.0 mechanical line-gap), and every non-trivial claim carries a source or sits in this section.
- The 4.5 margin-adj on the Williams-out contest row is 2.5 of judgment plus a 2.0 mechanical line-gap translation (contest ATL +3 vs live ATL +1). Counting only the judgment part against the caps, it is within the 3.0 hard cap but above the 2.0 soft cap, stated in the H2 reason; read that row as directional.

## Pre-kickoff delta checklist

1. **Williams decision (Sunday morning, then inactives).**
   - Williams confirmed: no market play (ATL +1 50.0 to 49.2% in H1). The ATL +3 contest lean stays (54.8% ex-push, 8.2% push) as a contest-only item. If the market moves to CHI -2 or more, the live ATL side is worse and the contest edge widens only on paper.
   - Williams out or doubtful: model side becomes ATL +1 (56.7% in H2) only if ATL +1 or better is still available before the market reprices; at ATL -1.5 or higher it no longer clears. The under is the model's total lean (over 43.9% at 52.5). This is the news that moves the game from tier 2- toward a live market lean.
2. **What flips the lean to CHI:** Penix ruled out (rib issue; ATL backup depth unverified) with Williams active, or additional ATL defensive/OL absences beyond Henderson. Re-run the simulator with a negative margin-adj and treat as conflicted.
3. **Roof/venue:** if the roof is confirmed open and kickoff weather is windy (the one cited figure is about 37 km/h), shade the total down and run-game props up; a closed roof keeps the baseline. Confirm on the kickoff-day weather refresh.
4. **Price crossings (ATL side):** ATL +1 improving to +1.5 or +2 with Williams in moves ATL toward about 52 to 54%; CHI at pick'em or ATL -1 reverses the sign. In the simulator one point of margin is worth about 2.6 points of cover probability. A total crossing 51.5 or 54 changes the total from no lean to a small over/under lean.
5. **Props:** re-pull Bijan rushing yards (BKR 93.5 -108 vs Sharp's 89.5) and carries 18.5. Reconsider only if the line returns to 89.5 to 90.5, with ATL not expected to trail. Omit all CHI passing legs until the QB is official.
6. **Official inactives (about 90 minutes pre-kickoff):** CHI Gordon, Stevenson; ATL Smith; confirm Edwards, Odeyingbo, Monangai Out.
7. **SuperContest:** lines were locked 10/15; the 8.2% push on ATL +3 is the price of the contest number.
