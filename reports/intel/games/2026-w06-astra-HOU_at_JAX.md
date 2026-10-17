# Astra W06 - HOU@JAX (proposed synthesis)

As-of: Sat 2026-10-17 3:42 PM PT | Generated: 2026-10-17T22:42Z | HEAD ea74728e1e1f174f047755719896b90460c2eb64 (branch claude/w5-prop-cards-2026-10-11) | Kickoff: Sun 2026-10-18 06:30 PT (13:30Z), London | Packet: queue packets[0], sha256 8697ff83e953a8634b8e2c80500e3e60240e4f83482b5614d168a0eb53e16cf9, queue sha256 e5832e56...358f55, session prompt c2bf2b1b...

Status: PROPOSAL for Andy to react to. No wager, ledger, Supabase or sportsbook action taken. Relaunch of an earlier STOPPED launch (prompt-hash drift, since re-pinned); that stub is superseded by this file.

Preflight (all verified this session): HEAD/branch match; queue sha256 e5832e56... matches; packet hash 8697ff83... recomputed (sorted-key JSON) and matches; session prompt c2bf2b1b... matches board; launch sheet 38bf344e... matches; 44/44 evidence_manifest hashes match except data/generated/master-intel/w06-roster-vet.json (self-rewriting receipt, excluded by instruction; read: status PASS, roster_source 2026-10-17T22:22:11Z, age 0.2h at read, 0 blocking, 10 UNVERIFIED rows none of which are HOU/JAX players used here; `npm run roster:vet` NOT rerun); kickoff in the future; ESPN captured finals list contains no HOU@JAX. No blockers; conditions are non-launch-blocking (inactives, weather/roof, articles resolved).

## Disposition

**conflicted -> tier research_only.** There is no priced side edge. The market-calibrated model leans JAX (56.2% cover) but only via a +2.35-pt margin blend that is itself unbacktested, while the analyst/podcast lane splits (HOU +2.5/+3 from Anderson, Moore, Fezzik, Maldonado; JAX from Simon Hunter, Cohen, ESPN Bowen). The one convergent view is the under, but it is already priced: total opened 43.5 and now sits 42 (BKR) / 42.5 (BEO), and at 42 -106 the under only clears break-even by ~0.1 pt under my -1.0 hypothesis. Honest pass on the side; under 42/42.5 is a research lean only (see Pre-kickoff delta).

## Team form and schedule context
- HOU 1-4, JAX 4-1 [Source: data/generated/team-dossiers/2026-w06/matchups/HOU@JAX.json, side_by_side, 2026-10-13 build].
- SRS JAX +11.185 vs HOU -2.477; off EPA/play JAX +0.1481 vs HOU -0.0032; def EPA/play JAX -0.0839 vs HOU -0.0431; PPG/PAPG JAX 24.6/14.0, HOU 22.0/22.4; turnover margin JAX +5 vs HOU +3 [Source: same file, side_by_side].
- JAX pts/drive 2.548 and 3-and-outs 1.0/g vs HOU 2.062 and 2.8/g [Source: packet team_dossier.team_signals season_profile_espn].
- JAX results are flattered by takeaways (8 vs 3 giveaways); a turnover-regression risk named in the packet narrative [Source: reports/intel/master-intel-narratives-2026-w06.md, HOU@JAX section "What breaks it"].
- Site: London. Back-to-back-road context for HOU per Simon Hunter (see agreement). JAX is the designated home team; home-field edge is disputed (Anderson: "JAX loses home-field in London (about 2 to 2.5 pts)" - rationale text in approved signal /picks/33).

## Availability / QB
- QBs: Stroud (HOU), Lawrence (JAX); both ESPN depth chart starters, roster-matched; "captured_ESPN_depth_chart_not_team_confirmation" [Source: packet availability.quarterbacks, espn 2026-10-17T02:03Z].
- HOU out/IR: Jalen Pitre S (Out, 10/16 comment: "ruled out for Sunday's game against Jacksonville"), David Montgomery RB (Out, groin), Tank Dell WR (IR), Henry To'oTo'o LB (IR), Ja'Marcus Ingram CB (IR). Marvin Harrison Jr. WR traded ARI->HOU (operator override) [Source: data/research-intel/source-evidence/espn-status-w06.json teams.HOU; matchup file availability].
- JAX out/IR: Montaric Brown CB (Out, hamstring, 10/17), Ross Matiscik LS (Out), Anton Harrison OT (IR). OL risk flag "watch" [Source: espn-status-w06.json teams.JAX; matchup file].
- 11 HOU and 9 JAX roster-IR/Out entries are "day-to-day unconfirmed", not confirmed Out. ESPN statuses lag; official inactives (due ~75 min pre-kick, i.e., ~05:15 PT) decide. Source timestamp 2026-10-17T02:03Z is ~20h old.

## Weather / venue
Open-Meteo forecast captured Sat 2026-10-17 1:16 PM PT (forecast, not observation): 13.7C / 56.7F, wind 20.9 km/h, gusts 42.8 km/h (materiality "review_required: gusts 42.8 km/h"), precip prob 11%, 0 mm [Source: data/research-intel/review/2026-w06-weather-venue.json rows/0]. Anderson's "windy/drizzly" framing (/picks/35 rationale) is only half supported: wind yes, rain probability low. Gusts of this size are a passing-volume and deep-ball headwind and the main support for any under/downward Collins lean. Refresh on kickoff morning.

## FTN and quantitative
- Quant model (rebuilt 2026-10-17T21:11Z on the BKR 19:40Z board): means JAX 23.53, HOU 18.68, total 42.21; JAX cover 56.15% / HOU 43.85% at -2.5; over 50.65% / under 49.35% excl pushes; JAX win 62.1%. Margin adjustment vs market +2.348, total +0.208 [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json games[1].simulation].
- Blend is 60% market / 25% FTN season-to-date / 15% SRS, "NOT backtested; no edge is claimed" (numeric_model). FTN is a quantitative input only, not an expert vote. FTN weekly refresh 2026-10-16T22:00Z (current by design).
- Narrative file projection: HOU 18.7, JAX 23.5 [Source: reports/intel/master-intel-narratives-2026-w06.md]; it flags HOU 31st in run-offense efficiency against the top run defense, so script leans pass for HOU.

## Market (captured, not live offers; no sportsbook visited)
| Book / capture | Time | HOU spread | JAX spread | Total | ML |
|---|---|---|---|---|---|
| Opener (Action Network) | spread 10/12 00:06Z, total 10/12 00:00Z | +2.5 | -2.5 (-119) | 43.5 | HOU +125 / JAX -151 |
| BKR 12:40 PM PT board (signed baseline) | 2026-10-17T19:40Z | +2.5 -105 | -2.5 -111 | o42 -110 / u42 -106 | HOU +123 / JAX -137 |
| BetOnline (BEO) | 2026-10-17T21:15Z (2:15 PM PT) | +2.5 -105 | -2.5 -115 | O/U 42.5 -110/-110 | HOU +122 / JAX -142 |
| SuperContest locked | captured 10/15 2:29 PM PT | HOU +2.5 | JAX -2.5 | n/a | n/a |
Movement: spread 0 pts since open; total -1.5 (43.5 -> 42), a note not a blocker. BEO is half a point higher on the total than BKR; ML spread across books is 15-20 cents. [Source: packet market.*; data/research-intel/source-evidence/2026-10-17-betonline-week6-props-parsed.json game_lines]. DraftKings Predictions contracts are reference-only, not used.

## Expert / podcast / article agreement
Counted as independent signals only when source and market differ (packet comparison_policy).
- Side HOU: Brandon Anderson (Action Network Podcast, 10/16, "I think Houston plus two and a half is the side." /picks/33; says near coin flip, prefers ML); Matt Moore (same episode, "I'm going to bet the Texans here." /picks/34); Steve Fezzik (Ross Tucker, "Still two units Texans." taken at +3, now +2.5, /picks/59); Stuckey (Action Network, HOU as first leg of an "All Texas Teaser", /picks/26, teaser not comparable to the full-game number); Maldonado (ESPN article 8331, "Texans +3 (+120 ML) upset pick"; also HOU 20-19 straight-up, article 8187); Walder ESPN SU HOU 23-21.
- Side JAX: Simon Hunter (Sharp or Square 10/15, "backing Jacksonville in London as the more complete team"; quote_quality missing_url_or_quote, context only); Zachary Cohen VSiN 10/14 "Bet: Jaguars -2.5 (+100)" (priced at +100 vs current -111/-115, so the price is now worse); ESPN Bowen Game of the Week JAX ML -142 / -2.5 (article 8208, 10/16); PFT Florio JAX 20-17 and Moody JAX 24-20 are straight-up score picks (context, not edge). Action Network registry rows for this game (HOU +3, JAX ML) are source-flagged not_pick/rejected and not used. Tuley's HOU +8.5 teaser row is rejected.
- Total under: Makinen VSiN 10/15 "NFL Week 6 Best Bet: I'll go with Under 42.5 in a tightly contested Houston-Jacksonville tilt" (quote unverified against raw source; article 8108, analyst lead, not promoted); Anderson lean under 42.5 (about half unit, /picks/35); Erickson BettingPros under 42.5 official play (article 8332; caveat: body is 60k chars with internal line inconsistencies, game mapping ambiguous - treat as weak); ESPN Bowen under in London games 42.5 (8208). Current board 42 (BKR) / 42.5 (BEO): Anderson/Makinen/Erickson numbers at 42.5 are matched exactly only at BEO; at BKR 42 the buy is half a point worse.
- Net: side is a genuine split (4+ HOU voices vs 3 JAX). Under is the consensus but the market already moved 1.5 points and the sim edge at the posted price is ~0. Straight-up picks and Average Joe style consensus are context only.

## Splits (ages stated)
- Spread: HOU 44% tickets / 49% money; JAX 56% tickets / 51% money (captured 2026-10-17T18:14Z, Sat 11:14 AM PT, ~4.5h old). Roughly balanced; a slight money lean to HOU relative to tickets.
- Total: Over 45% tickets / 68% money; Under 55% tickets / 32% money (same capture). Money is heavily on the over while tickets lean under, i.e., a ticket/money divergence worth noting against an under-only thesis.
- Moneyline split (JAX 76% bettors / 66% money) is the Thursday-night Supabase pull, 2026-10-16T03:30Z, ~42.6h old: WITHHELD as stale. [Source: data/generated/master-intel/w06-splits-all.json via packet betting_splits.]

## Simulator (scripts/intel/margin-simulator.mjs; --selftest passed; home-line -2.5, total 42 unless noted; home = JAX; cover probabilities exclude pushes)
Conditional-probability caveat: these are market-calibrated conditional probabilities given the stated judgment adjustment; adjustments are hypotheses, not evidence of edge, and the model has no joint component for props/SGP/teasers.

| Row | margin-adj | total-adj | JAX cover | HOU cover | Over | Under | JAX win (incl tie) |
|---|---|---|---|---|---|---|---|
| Baseline (market) | 0 | 0 | 50.0% | 50.0% | 50.0% | 50.0% | 56.1% |
| H1 JAX quality (SRS/EPA, capped) | +1.0 | 0 | 52.6% | 47.4% | 50.0% | 50.0% | 58.7% |
| H1b model-like (quant blend, soft cap) | +2.0 | 0 | 55.2% | 44.8% | 50.0% | 50.0% | 61.2% |
| H2 London HFA loss (Anderson/Moore) | -1.0 | 0 | 47.4% | 52.6% | 50.0% | 50.0% | 53.5% |
| H3 gusts/pace (chosen) | 0 | -0.5 | 50.0% | 50.0% | 48.4% | 51.6% | 56.1% |
| H4 gusts/pace (stronger) | 0 | -1.0 | 50.0% | 50.0% | 46.9% | 53.1% | 56.1% |
| BEO total 42.5 baseline | 0 | 0 | 50.0% | 50.0% | 50.0% | 50.0% | 56.1% |
| BEO total 42.5, adj -1.0 | 0 | -1.0 | 50.0% | 50.0% | 47.0% | 53.0% | 56.1% |
Price tests: JAX -2.5 -111 breaks even at 52.6%; HOU +2.5 -105 at 51.2%; Under 42 -106 at 51.5% (incl. 3.0% push mass, under wins 51.5% / over 45.5% at -1.0 adj, so edge about 0); Under 42.5 -110 at 52.4% vs 53.0% at -1.0 adj (about +0.6 pt, within noise). Chosen adjustments: margin_adj 0 (no auditable reason to move off the market; quant +2.35 is unbacktested and adopting it would exceed the 2.0 soft cap), total_adj -0.5 (wind-gust flag plus slow-pace commentary, hedged because the line already fell 1.5). Neither crosses a break-even by enough to call a candidate.

## Props (only row-verified prices; captured BKR 2026-10-17T19:40Z / BEO 2026-10-17T21:15Z; all "available_at_capture_only"; not model probabilities)
- Nico Collins receiving yards: Anderson O69.5 -114 and ladder 100 +270 / 125 +580 / 150 +1329 (podcast prices, 10/16). Current: BKR O/U 72.5 -103/-113, ladder 62.5+ -210, 72.5+ -115, 102.5+ +208, 122.5+ +369; BEO O/U 74.5 -115/-115. The over line has moved up 3-5 yards, so Anderson's 69.5 -114 is gone and 100+ is now cheaper at +208 (102.5) but a different threshold. Fanelli (BettingPros 8333) Collins rec O74.5 -110 matches BEO line at a slightly worse price (-115). Collins receptions: BKR 5.5 -121/+104, BEO 5.5 -135/+105; BEO targets 8.5 -160/+130. Supporting claim is Anderson's rationale text (Collins 100+ yds in 5 of 5 vs JAX, "Top-10 vs man") taken from the approved signal /picks/29; Sharp per narrative says 5 of 6; flagged as conflicting counts. Gust risk cuts against overs. Status: price moved; no tier.
- Stroud passing yards: ESPN Solak O257.5 -111 (article 8208). Current BKR O/U 255.5 +109/-127; BEO 255.5 -115/-115. Line is 2 yards lower and BKR over is +109; gust risk applies. Price moved/reprice only.
- Tuten rushing yards: Fanelli U63.5 -109 (8333). BKR 62.5 O/U -108/-108; BEO O/U 63.5 -110/-120 (under -120, worse than -109). Price moved against.
- Parker Washington anytime TD: Fanelli +185. BEO yes +160 / no -200 (worse); BKR lacks an ATD market. Price moved.
- Chris Rodriguez Jr. rushing U16.5 -118 (Burke, 8207): player is JAX RB, roster-verified; NO row for him in BKR or BEO. Unavailable.
- Stroud rushing / anytime TD SGP +363 (Walsh, 8369): paywalled stub, selections not captured. Omitted. BKR does show Stroud rush O/U 9.5 -111/-104 but the SGP legs are unknown.
- Marvin Harrison Jr. (HOU via ARI, operator override on roster): BEO rec yds O/U 21.5 -115/-115, recs 1.5 -140/+110. Narrative angle (boundary target vs JAX secondary missing Montaric Brown) is context only; no priced thesis.
- Teaser (Stuckey), alt/escalator and SGP legs are not comparable to the full-game number and carry no model probability.

## Counter-case
- Against JAX: the market gives JAX only a 2.5-pt edge with London removing most home field (Anderson estimates 2-2.5 pts, Moore concedes HOU "are good after rating work"); HOU is 1-4 but net PPG is only -0.4 and pythag 48.9%, i.e., a better team than the record; Stroud at 255.5 with a pass-first script vs a JAX corner room without Montaric Brown; JAX turnover margin +5 (8 takeaways) is regression bait; Fezzik rates them equal at +3.
- Against HOU: SRS/EPA gap is large (+11.2 vs -2.5, off EPA +0.148 vs -0.003) and the quantitative blend sits JAX 62% to win; HOU is missing Montgomery (RB), Pitre (S), Dell and Ingram; HOU rush offense is bottom-tier against JAX's run defense per the narrative; JAX's 14.0 PAPG is the best in the dossier.
- Against the under: money is 68% over vs tickets 45%; HOU pass-heavy script plus JAX turnovers could create short fields; BEO is a half-point higher on the total.

## Ambiguity / missing data
1. Official inactives not yet available; QBs unconfirmed beyond ESPN depth (nothing flags either as doubtful).
2. Forecast-only weather (1:16 PM PT Sat); venue is London (Wembley per narratives file, roof not applicable); no kickoff observation. Anderson's "drizzly" vs 11%/0 mm precip.
3. Moneyline splits are 42.6h old and withheld; spread/total splits 4.5h old.
4. Several expert quotes are `unverified_against_raw_source` or `missing_url_or_quote` (Simon Hunter, Makinen, Cohen, PFT); article 8332 body has internal line inconsistencies; 8369 and 8054 are stubs/no selection; article 8303 excluded per gate.
5. Collins 100+ counts disagree (5 of 5 per Anderson rationale, 5 of 6 per narrative/Sharp).
6. Thin/partial coverage: BKR has no ATD market; no Bookmaker TD-scorer rows; BEO 152 player rows. These are notes not blockers.
7. The Week 5 validator `scripts/intel/validate-game-output.py` is hardcoded to Week 5 paths and was not run; manual self-check performed for forbidden keys (none), disposition/tier pairing (conflicted -> research_only OK), adjustment caps (margin 0, total -0.5, within 2.0 soft cap), unsourced claims (none left in thesis; the "regression bait" point relies on the narratives file and the dossier turnover margin).
8. Roster gate: 10 UNVERIFIED rows exist slate-wide; none are HOU/JAX players used above (Travis Hunter row is a secondary-matchups note under JAX and is not relied on).
9. I opened the full odds board and narratives files, which contain other games; only HOU@JAX rows were used. No other game's Astra output was read or referenced (RUNLOG tail glimpsed before append is not used).

## Pre-kickoff delta checklist
- Official inactives (~05:15 PT): any change to Stroud, Lawrence, Collins, Harrison, Tuten, JAX OL (Mekari/Mustipher/DiGiorgio day-to-day) or Montaric Brown status. A Stroud or Lawrence scratch voids everything here.
- Weather: if gusts forecast above ~45 km/h or rain probability rises, moves the under lean toward a real candidate (re-run total-adj -1.0 to -1.5 on the then-current total); if gusts fall below ~30 km/h, drop the under lean.
- Price crossing: Under at 42.5 -110 or better, or total back to 43+ with gusts still flagged, would justify revisiting tier 2-. JAX -2.5 at -105 or HOU +3 at -110 are the numbers that would make the side worth a second look; a move to JAX -3 changes the key number and favors HOU cover probability by about 2-4 pts (simulator key-number self-test).
- Collins: wait for official inactives and a refreshed priced row before using any rung; compare 100+ rung only at the same threshold.
- Roster re-vet with --fetch on kickoff day; a changed snapshot requires requeue.
