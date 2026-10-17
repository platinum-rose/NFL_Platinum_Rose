# Astra W06 - NO @ NYG (proposed, single-game)

As of: Sat 10/17 03:41 PM PT | Generated: 2026-10-17T22:41:27Z | HEAD: ea74728e (claude/w5-prop-cards-2026-10-11) | Kickoff: 2026-10-18T17:00Z (Sun 10:00 PT) | Packet: /packets/7, sha256 666dbaa55ea3... (queue e5832e56de40..., built 2026-10-17T22:29Z, relaunch after session-prompt re-pin c2bf2b1b...)

Preflight (this run): queue bytes, packet canonical hash, session prompt and launch sheet hashes match the board; 51 of 52 manifest hashes match (the 52nd, w06-roster-vet.json, is the self-rewriting receipt, read only: status PASS, roster snapshot 2026-10-17T22:22Z, about 0.3h old at generation; `npm run roster:vet` NOT rerun per instruction). Kickoff in the future; no NO or NYG row in ESPN `finals` (only SEA@DEN final) [Source: data/research-intel/source-evidence/espn-status-w06.json, finals, 2026-10-17T02:03:26Z]. Stale pre-reprompt *.bak files ignored.

## Disposition

**pass / tier skip.** The market is a true pick'em (NYG -1, 46) and the quantitative model sits on top of it. After my judgment adjustments the best side (NO +1) is about 51.3% excluding pushes and the best total (Over 46) about 51.6%, both below the roughly 53.5% / 52.8% break-evens at the captured -115 / -112 prices. Expert and podcast support is real but was priced at NYG +1.5 / NO -1.5 / Over 44, and the board has since moved 2.5 points on the side and 2 on the total, so those signals no longer describe the current number. No player prop clears the bar either (see Props). Honest pass, no lean to play.

## Team form and schedule context

- NO 1-4: 23.6 PPG, 30.2 PAPG, turnover margin -6 (11 giveaways, 5 takeaways), SRS -4.0, model rank 27 [Source: team-dossiers/2026-w06/matchups/NO@NYG.json via packet team_dossier, through week 5, built 2026-10-17T02:04Z].
- NYG 3-1-1: 21.8 PPG, 21.2 PAPG, turnover margin +1, net PPG +0.6 (rank 14) but SRS -6.8 (rank 28) and model rank 23: record and efficiency disagree [same source].
- The dossier's nflverse efficiency fields (success rate, EPA-type, pressure) are null for both teams; coaching snapshot is historical-only. Nothing here is a current-week efficiency claim.

## Availability and QB

- QBs: NO Tyler Shough, NYG Jameis Winston, both ESPN depth chart, not team confirmation [Source: packet availability.quarterbacks; availability layer 2026-10-17T02:03Z].
- NYG reported out: TE Theo Johnson, S Tyler Nubin, CB Colton Hood (ESPN, 10/16); questionable: OT Andrew Thomas, LB Abdul Carter, OT Jermaine Eluemunor (10/17) [Source: data/research-intel/availability/2026-w06-availability-layer.json, games[8]].
- NO reported out: LB Kaden Elliss, LB Anfernee Jennings; questionable: RB Alvin Kamara (back), WR Chris Olave (illness), S Lorenzo Styles Jr., G Jeremiah Wright, DT Nathan Shepherd [same source]. Kelvin Banks Jr. is only "day-to-day" on the roster feed (an unconfirmed roster status, not Out).
- Saquon Barkley "OUT" appears only as Stuckey's reasoning ("missing Saquon Barkley"); it is a reporter hedge, unconfirmed, and does not appear in the availability layer's NYG out list. Not used.
- All of the above are ESPN-lagged claims; official inactives (about 90 minutes before kickoff) decide.

## Weather and venue

NYG home, forecast 55F, 0% precipitation, wind 6.5 km/h, gusts 12.2 km/h; no material flag. Forecast from Open-Meteo, captured Sat 1:16 PM PT (2026-10-17T20:16Z), a forecast not an observation [Source: data/research-intel/review/2026-w06-weather-venue.json, rows[5]]. Kickoff-day refresh still due.

## FTN and quantitative

- Quant model (rebuilt on the 12:40 PM PT board, 2026-10-17T21:11Z): means NYG 23.44, NO 22.97, total 46.41, home margin +0.47; model menu NO side cover 51.4% and Over 51.3% excluding pushes. Its tables drop spread signs; direction read from the BKR board (NYG -1) [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[6]]. It implies adjustments vs market of margin -0.53 (toward NO) and total +0.41.
- Drivers: NO defense weakness z +2.18 (NYG -0.16); NO offense z +0.49 vs NYG -0.78; NO tempo z +1.06 vs NYG -0.07; SRS NO -4.0 vs NYG -6.8. NO is a poor defense with a better offense/tempo than the Giants, which is why the model leans over and slightly NO.
- Model probabilities are provisional quantitative context only (packet status). FTN: weekly cadence accepted (Andy 10/17); team tables were captured 2026-10-13 and the context file built 2026-10-16T22:00Z. It is a numeric input, not an expert tier; I did not extract further FTN splits.
- Coverage-scheme/secondary file (data/secondary-matchups) is manual-review capped and internally dated (names a prior NO coach, FantasyPros IR labels needing review); not used.

## Market (captured, not live offers)

| Item | NO @ NYG | Source / time |
|---|---|---|
| Opener | NYG -1.5 (-107), total 45.5, ML NO -105 / NYG -113 | openers /games/NO@NYG; spread 10/12 00:08Z, total 10/12 01:01Z |
| SuperContest locked | NO -1.5 | data/supercontest/week-06-lines.json, captured 10/15 2:29 PM PT (21:29Z) |
| Current board (Bookmaker, 12:40 PM PT, 19:40Z) | NO +1 -115 / NYG -1 -101; o46 -112 / u46 -104; ML NO -112 / NYG -101 | data/odds/BKR_current_lines_1017_1240_buildfmt line 9 |

Movement: opener NYG -1.5 -> locked contest NO -1.5 -> board NYG -1 (narrative: flipped from NO -1 Friday evening). Net from the 10/15 lock the side moved 2.5 points toward NYG; total 45.5 opener to 46 (+0.5). The availability layer's own header (NO -1, 45.5, ML NO -113/NYG +100) is an older capture and is superseded by the 12:40 PM board. Raw lines were row-verified in the packet; this is a captured price, not a confirmed executable offer.

## Expert, podcast and article agreement

Treat the YouTube picks as approved signals (Andy, 2026-10-17); each is priced at its publish-time number.

- Side NYG (all +1.5, now NYG -1, move -2.5): Brandon Anderson, Action Network, 10/16 "I will take them here at plus one and a half." (captions verbatim) [staging youtube-C8cDtGmsRoc, ts 2809s]; Pat Fitzmaurice, BettingPros, 10/13 "I like the Giants as home dogs against the Saints. Giants are catching one and a half in that." [youtube-slfl5V7gaOY, 1156s]; Andrew Erickson, BettingPros, 10/12 "So, if I can get points with the Giants as the home team, that's what I would take." (quote_quality unverified) [youtube-_wZpv4TuNVI]. Article lead: ESPN, Maldonado, 10/17, "Giants +1.5 (108 ML) upset pick" (article 8331). Anderson's rationale is that he makes NYG -6.5 but had not committed pending tackles Thomas and Carter.
- Side NO: Stuckey, Action Network, 10/14, "...We'll call it minus one and a half at DraftKings right now." (quote unverified; move +2.5 against) [youtube-5AikVQLaJEg, 4558s]; Makinen, VSiN, 10/15, NO -1.5 (article 8108, manual-dispositioned execution-unverified). Fezzik and Ross Tucker teased NO to +7.5 (teaser, not comparable to the full-game line).
- Total: Over 44 Erickson (10/15, now 46, move +2) and Over 44.5 official play (BettingPros article 8332, 10/17); Under 45.5 Fezzik 2 units (10/16-17 show, "In fact, I will put two units on the under"; now 46, +0.5).
- Straight-up picks (context only): ESPN 8187 split NYG 24-20 (Maldonado), NO 27-24 (Moody), NO 20-14 (Walder); PFT Florio NYG 27-17 (article 8054).
- Read: sides are split, which is why this is a pass. Three NYG podcasters want the points but the points are gone (NYG is now the favorite at -1). The Over supporters beat the current total by 1.5-2 points. These are analyst leads at publish-time prices, not promoted picks. Same-show or same-source duplicates count as one signal.

## Splits (ages stated)

- Spread: NO 45% tickets / 44% money; NYG 55% tickets / 56% money. Total: Over 59% tickets / 76% money; Under 41% / 24%. Captured 2026-10-17T18:14Z (Sat 11:14 AM PT), about 1.5h before the 12:40 PM line [Source: w06-splits-all.json /games/7]. Money skew to the Over is large; spread is balanced.
- Moneyline splits (NYG 53% bettors / 36% money) are the Thursday-night pull, 42.6h old at manifest: withheld, not used.
- BettingPros expert-feed lines (Over 44, Winston volatility, NO 30.2 PPG allowed) have no URL/quote verification; context only.

## Simulator (scripts/intel/margin-simulator.mjs, --selftest passed; home-line -1, total 46)

| Run | margin-adj | total-adj | NO +1 cover (excl push) | NYG -1 cover | Over 46 (excl push) | Under 46 |
|---|---|---|---|---|---|---|
| Baseline | 0 | 0 | 50.0% | 50.0% | 50.0% | 50.0% |
| Hypothesis A (adopted side) | -0.5 | 0 | 51.3% | 48.7% | 50.0% | 50.0% |
| Hypothesis B (stronger NO) | -1.0 | 0 | 52.7% | 47.3% | 50.0% | 50.0% |
| Hypothesis C (NYG healthy) | +0.5 | 0 | 48.7% | 51.3% | 50.0% | 50.0% |
| Total up | 0 | +0.5 | n/a | n/a | 51.6% | 48.4% |
| Total down | 0 | -0.5 | n/a | n/a | 48.4% | 51.6% |
| Adopted combined | -0.5 | +0.5 | 51.3% | 48.7% | 51.6% | 48.4% |

Reasons: margin -0.5 toward NO mirrors the quant model's own -0.53 (NO defense weakness z +2.18 is offset by NYG's reported outs of Johnson, Nubin and Hood, while NO's Elliss/Jennings absences and Kamara/Olave questionable status cut the other way, so I do not go beyond the model). Total +0.5 mirrors the model's +0.41 (NO pace/tempo z +1.06, NO 30.2 PPG allowed, Winston volatility), tempered because the Over already moved up 0.5 from the opener and 76% of money sits on it. Both adjustments are within the 2.0 soft cap. These are conditional probabilities given the stated adjustments; they are not a calibrated claim about the true outcome. Side push is about 2.4%, total push about 3.0%.

Break-even at the captured prices: NO +1 -115 needs 53.5%; Over 46 -112 needs 52.8%; Under 46 -104 needs 51.0% (adopted Under 48.4%). No side or total clears its price.

## Props (verified prices only)

Verified Bookmaker rows exist for Isaiah Likely (NYG per roster): receptions Over 5.5 +104 / Under 5.5 -121 (rows 2412-2413), receiving yards Over 51.5 -113 / Under 51.5 -103 (rows 2502-2503), plus ladders; Malik Nabers rec Over 5.5 -127 / Under 5.5 +109 (rows 2416-2417) and rec yards Over 71.5 -110 / Under 71.5 -106 (rows 2508-2509) [Source: data/research-intel/source-evidence/2026-10-17-bookmaker-week6-sgp-parsed.json, captured 2026-10-17T19:41:52Z; availability at capture only]. Also NO/NYG QB lines (Shough pass yds 232.5, Winston pass yds 218.5 Over +103 / Under -120). No joint model exists, so none of these is a model probability and I draw no edge. Theo Johnson being reported out adds Likely volume context, unquantified, and Likely's status still needs the inactive check.

Omitted on purpose:
- Likely anytime TD +225 (Gallant, Action Network 10/17, "Isaiah likely at plus 225, you just can't pass this one up"): no Bookmaker TD-scorer rows exist, the source rationale said "against Cleveland", and the price is unverified on the NYG board. Do not treat +225 as live or reuse the Cleveland reasoning.
- Cam Skattebo rush (Erickson O56.5, ESPN Bowen O58.5 -109, Conner O57.5): Skattebo is an unresolved alias in the BKR parse and UNVERIFIED in the roster gate; no priced row. Conner's article also gives no team/game.
- Najee Harris rush O23.5 (VSiN Swedelson): per instructions not used; no Harris row in the verified BKR set.
- Wan'Dale Robinson rec O35.5 (Erickson): no Robinson row in the verified BKR rows.
- ESPN Walder "Saints to NOT allow first-drive sack -385": no priced row in the captured books; omitted.
- BetOnline has only 2 fantasy-points rows for Daniel Carlson in this event, with an unexplained team mapping; not used. DraftKings Predictions contracts are reference-only.

## Counter-case

For NYG -1: the home team has the stronger record (3-1-1 vs 1-4), the plus turnover margin (+1 vs -6) and a markedly better scoring defense (21.2 vs 30.2 PAPG); the SRS gap favors NO only because the Giants' early schedule was weak by this metric. Three ESPN/PFT picks and three podcasters favor NYG, and Brandon Anderson makes the Giants -6.5. If Thomas and Carter both play, the Giants are healthier on the line and the only reason to back NO weakens. The model's 51.4% NO number is a 1.4-point sliver, and the market already moved 2.5 points toward the Giants since the lock, so NO's price improved only if you hold the earlier number. For NO: the market-calibrated model plus the 30.2 PPG allowed and heavy turnover problems on NO are two-sided; NO's offense/tempo is better, Winston's volatility cuts both ways, and the NYG secondary is missing Nubin and Hood.

## Ambiguity and missing data

1. Official inactives not available (due about 8:30 AM PT Sunday); every player claim is conditioned on them.
2. Kickoff-day weather refresh not done (forecast only).
3. Moneyline splits 42.6h stale and withheld; spread/total splits 1.5h older than the 12:40 PM board.
4. Likely +225 TD unverified and mis-attributed (Cleveland); Skattebo alias unresolved; Najee Harris excluded; Robinson and Walder first-drive-sack props have no priced row.
5. Barkley "OUT" is a reporter hedge; not in the availability out list. Banks Jr. is only day-to-day.
6. Several quotes are `quote_quality: unverified` in the packet (Stuckey, Erickson 10/12, Makinen, PFT); used as attributed signals only, not as verbatim evidence.
7. Oddities: the quant's contest field is null (script expected a different lines filename); packet's locked SuperContest line (NO -1.5) is not the current number; the availability header line (NO -1 / 45.5) is superseded.
8. `python3 scripts/intel/validate-game-output.py` is pinned to Week 5 paths and was not run; manual self-check done for forbidden keys (none), disposition/tier pairing (pass/skip), adjustment caps (0.5/0.5 within the 2.0 soft cap) and sourcing.
9. The roster gate's 10 UNVERIFIED informational items include Skattebo (NO/NYG); none block. The roster receipt was not rerun; the 22:22Z snapshot expires 2026-10-18T22:22Z, after kickoff.

## Pre-kickoff delta checklist

- Official inactives (about 8:30 AM PT): Thomas, Carter, Eluemunor (NYG); Kamara, Olave (NO); Johnson, Nubin, Hood confirm. If Thomas and Carter are both out, the lean moves toward NO and a NO +1 or better becomes worth rechecking against the 53.5% break-even; if Olave and Kamara are both out, move the total down 0.5-1.
- Price crossings: the simulator re-centres on whatever line is supplied (rerun at NO +1.5 / total 45 gives the same 51.3% / 51.6%), so a line move changes the call only through the juice and my adjustments, not the model number. At the same 51.3% NO would need about -105 or better (break-even 51.2%) to be even; at -115 it is not. A move back toward NYG -2 or longer would be worth a fresh look only if I thought the move was news, not noise. Over 46 at -105 or better is about break-even on 51.6%.
- Weather: any forecast wind above about 20 km/h sustained, or precipitation, favors the Under.
- Reconfirm Likely's availability before any Likely rec leg; do not use the TD until a real NYG price exists.
- Re-pull moneyline splits if that lane will be used.
