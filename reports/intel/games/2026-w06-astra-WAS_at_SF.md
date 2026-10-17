# Astra W06 - WAS @ SF (Monday Night Football) - proposed single-game synthesis

- As-of: Sat 2026-10-17 3:40 PM PT (generated 2026-10-17T22:40Z). Proposal only; nothing placed, promoted or written to Supabase.
- HEAD ea74728e1e1f174f047755719896b90460c2eb64, branch claude/w5-prop-cards-2026-10-11 (not committed by this session).
- Kickoff: Mon 2026-10-19 17:15 PT (2026-10-20T00:15Z). Kickoff is ~2.1 days away; status not started (SEA@DEN is the only final in the ESPN file). [Source: data/research-intel/source-evidence/espn-status-w06.json, finals, 2026-10-17T02:03:26Z]
- Packet: queue scratch/w06-astra-synthesis-queue.json sha256 e5832e56...358f55, packet /packets/12 sha256 73ce164c...8f4ac, 48 sources, built 2026-10-17T22:06:53Z. Session prompt sha256 c2bf2b1b... (re-pinned, matches queue and board). Pre-reprompt .bak files ignored. This run supersedes the earlier STOPPED stub for this game.
- Gate record: HEAD/branch match; queue, packet, session prompt and all 47 non-self-rewriting source hashes re-verified at 22:38Z and again at 22:40Z with zero drift. Roster receipt data/generated/master-intel/w06-roster-vet.json read, not rerun: status PASS, 0 blocking, 10 UNVERIFIED informational, roster source 2026-10-17T22:22:11Z (about 0.3 h old when read; expires 2026-10-18T22:22Z). Command of record (run by controller): `npm run roster:vet -- --week 6 --date 2026-10-17 --strict`.

## 1. Disposition

**pass / tier research_only.** The market is -8 / 51.5 and the market-calibrated simulator, with a deliberately modest judgment adjustment, puts SF at 51.4% against a 51.9% break-even at -108. There is no price edge on the side or total. The only things leaning SF are the raw season form gap and three podcasters who laid -7.5 (now -8), and the public already agrees (76% of tickets, 80% of money on SF). The one concrete actionable fact in the packet is negative for a prop lead: WAS RB Jacory Croskey-Merritt has been ruled out, which voids the approved Giffen anytime-TD signal. Honest pass beats a thin candidate. Revisit after Sunday-night/Monday injury news (Bosa, Evans, Diggs, McLaurin).

## 2. Team form and schedule context

| | WAS | SF |
|---|---|---|
| Record through W5 | 1-3-1 | 5-0 |
| PPG / PAPG | 23.0 / 29.8 | 30.8 / 18.6 |
| Yds/play off / def | 5.14 / 5.54 | 6.54 / 4.70 |
| 3rd down off | 31.9% | 51.9% |
| Red-zone TD% | 50.0% | 87.5% |
| Pts/drive | 1.95 | 3.12 |
| Giveaways / takeaways | 2 / 7 | 5 / 7 |
| SRS (rank) | -9.74 (30) | +9.81 (2) |
| Net PPG (rank) | -6.8 (28) | +12.2 (1) |

[Source: data/generated/team-dossiers/2026-w06/matchups/WAS@SF.json via packet team_dossier.team_signals, through_week 5, 2026-10-17T02:04:52Z]

Read: SF is the better team by every efficiency measure. Caveats: five-game samples; WAS's +5 turnover margin (7 takeaways vs 2 giveaways) is a regression candidate that has not hurt them in the standings but is thin support for them; SF's 3rd-down (51.9%) and red-zone (87.5%) rates are well above sustainable levels, so some of the season PPG gap is variance the market already prices. Schedule strength is not in the packet; I do not claim it. nflverse analytic/regression fields are null for both teams, so no success-rate or EPA claim is made.

## 3. Availability / QB

- QBs: Jayden Daniels (WAS) and Brock Purdy (SF) are the ESPN depth-chart starters; roster identity matched for both. This is a captured depth chart, not team confirmation. WAS backup Marcus Mariota is Doubtful (knee). [Source: data/research-intel/source-evidence/espn-status-w06.json, teams.WAS/SF qb_starter and injury_report_non_active, 2026-10-17T02:03:26Z]
- WAS (ESPN report, last dated 10/16): Stefon Diggs Q (hamstring, limited Fri), Terry McLaurin Q ("veteran rest day" Fri), Treylon Burks Q (shoulder), Austin Ekeler Q (chest), Rachaad White Q (shoulder), Lucas Patrick Q, Javon Kinlaw Q, Croskey-Merritt Q (groin, no practice Fri).
- SF: Deebo Samuel Sr. Out (hamstring; IR move held off because of the Week 8 bye), Christian Kirk and Demarcus Robinson on IR, Mike Evans Q (ribs/Achilles, DNP Fri), Nick Bosa Q (knee/calf, DNP Thu), Mykel Williams Q, Colton McKivitz Q (OT), Upton Stout Q (CB), Marques Sigle Doubtful, Garret Wallow Out, Dre Greenlaw suspended (appeal denied). SF's WR room is thin and the pass rush's best player is uncertain.
- **Newer than the availability layer:** ESPN (John Keim, article 8363, published 2026-10-17T17:29Z) summary: "Commanders running back Jacory Croskey-Merritt won't play Monday against San Francisco because of a groin injury, coach Dan Quinn said." RotoWire 8361 (16:46Z, citing Tashan Reed of The Washington Post) also says ruled out. The packet's availability layer (02:03Z, 10/17) still lists him Questionable, and BKR still posts his rush/rec ladders (captured 19:42Z, after the news). Treated as Out pending official inactives. [Source: data/research-intel/review/article-intel-review-latest.json, articles id 8363 and 8361, 2026-10-17T17:29:04Z and 16:46:00Z]
- Official inactives (Monday ~3:15 PM PT) decide everything above. Condition OFFICIAL_INACTIVES applies; any player leg is capped at tier 2- and none is proposed.
- Roster-map code is WSH, schedule code is WAS; normalized. BKR/roster receipt flag "Michael Evans" and "Chigoziem Okonkwo" (SF/WSH) as UNVERIFIED aliases; I did not infer them to be anyone and use no leg on them.

## 4. Weather / venue

Levi's Stadium (outdoor). Open-Meteo forecast sampled 2026-10-20T00:00Z: 18.8 C (65.8 F), 0% precipitation probability, 0 mm, wind direction 324 deg. [Source: data/research-intel/review/2026-w06-weather-venue.json, rows/9 forecast, 2026-10-17T20:16:18Z]

**Wind reconciliation (required before any wind claim):** the weather review, the raw Open-Meteo capture (outdoor_games/9) and the packet all carry wind_speed_kmh 18.6 and wind_gusts_kmh 15.1. A gust below sustained wind is not physically consistent (gusts are at or above sustained speed), so at least one field is wrong or mislabeled in the capture; the three copies agree with each other, so this is not a copy error downstream. I cannot resolve it from retained files. **No wind interpretation is made.** The forecast is about 5 days out and is not an observation; refresh Monday morning and at kickoff. Materiality flag in the source is "no_material_flag_in_current_forecast", which I carry only as the provider's label, not as a conclusion. [Source: data/research-intel/source-evidence/2026-10-17-week6-weather-openmeteo.json, outdoor_games/9 and caveats, 2026-10-17T20:16:18Z]

## 5. FTN and quantitative

- FTN weekly context (accepted weekly cadence; capture completed 2026-10-13T18:14Z, context file 2026-10-16T22:00Z): the retained team_context tables for WAS/SF are player-level coverage/air-yards style records. I rely on them only as background; I do not assert a specific FTN-derived edge, and FTN is not treated as an expert vote. [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, team_context.WAS/SF, 2026-10-16T22:00:08Z]
- Quantitative model (rebuilt on the 12:40 PM PT board, 2026-10-17T21:11Z): means SF 30.21, WAS 20.98, total 51.19, home margin 9.22 vs market 8 (so +1.22 vs market, total -0.31). Features: offense_z SF +1.97 / WAS -0.73; defense_weakness_z WAS +1.05 / SF -0.56; secondary adjustment SF -0.41 / WAS -0.00. Model menu: SF side 53.5% excl push, Under 50.9%. These are labeled provisional quantitative context in the packet. The model's contest field is null only because its script looks for a different lines filename; flag only. [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, games[13], 2026-10-17T21:11:11Z]
- Narrative projection: WAS 21.0, SF 30.2 (matches the model). [Source: reports/intel/master-intel-narratives-2026-w06.md, WAS@SF section]
- Note the model's tables drop spread signs; direction was read from the BKR board (WSH +8 / SF -8).

## 6. Market table (captured prices, not live offers)

| Item | Opener | Current captured (BKR 12:40 PM PT Sat) | Move |
|---|---|---|---|
| Spread | SF -7.5 (-108), WAS +7.5 | SF -8 (-108) / WSH +8 (-108) | SF -0.5 |
| Total | 51 | 51.5 (o -111 / u -105) | +0.5 |
| Moneyline | WAS +330 / SF -425 | WSH +324 / SF -390 | WAS shorter ~6 cents |
| Locked SuperContest | SF -7.5 (captured 10/15 2:29 PM PT) | n/a | line has since moved to -8 |

[Source: data/odds/actionnetwork-openers-2026-w06.json, games/WAS@SF, sp_at 2026-10-12T00:05:40Z, tot_at 00:01:55Z; data/odds/BKR_current_lines_1017_1240_buildfmt, line 15, 2026-10-17T19:40:00Z; data/supercontest/week-06-lines.json, games/13, 2026-10-15T21:29:08Z]

Opener is a cross-book historical open versus a single-book current board: a note, not a blocker. No sportsbook was visited; `executable_live_prices` is empty. Vig-free moneyline: SF about 77.1% (implied from -390/+324), consistent with the simulator's 77.1% at +0.5.

## 7. Experts, podcasts, articles

**Agreement on SF (-7.5, now -8 = price moved 0.5):**
- Doug Kezirian, The Action Network Podcast, 2026-10-14, ts 4571s: "seven and a half with the Niners on Monday night" (YouTube pick /picks/20; structured-segment match, not raw caption; verify before quoting externally).
- Matt Perrault, BettingPros Podcast, 2026-10-13, ts 1221s: "for me. I'm looking at the 49ers laying seven and a half against the Commanders." (verbatim caption match).
- Joe Pisapia, BettingPros Podcast, 2026-10-12, ts 2716s: "...I usually don't like laying this many points the 49ers. I think this is a spot where you lay it" (quote quality unverified in retained raw). He explicitly says he does not usually like laying this many.
- Erickson, BettingPros (article 8332, 2026-10-17): lead "49ers -7.5", no caveat in the leads file; priced at publish time, now -8. Note the leads file warns 8332's per-game mapping is ambiguous for unlabeled Over/Under picks (omitted there).
- Teasers (not comparable to the full-game number): Steve Fezzik and Ross Tucker, SF down to -1.5 (Ross Tucker show, ts 1481s/1495s). Same-episode, different market, so they are not independent spread votes.
- Straight-up context only: Florio, PFT (article 8054, 2026-10-15): SF 38-17. Public contest consensus is context, not edge.

**Disagreement / WAS-leaning:** Sharp or Square (expert feed rows 2 and 8, 2026-10-15): "Sharp buy-low spot on Commanders; Jayden Daniels offense is capable of keeping pace against a fluctuating 49ers defense" and a +270 ML round-robin leg. Both rows have no URL and missing quote quality ("context_pending_quote_and_date_review"), so context only. The master-intel narrative also cites Simon Hunter seeing a trap; that note is not independently sourced here, so not used.

**Excluded/rejected rows (not used):** VSiN survivor "Pick: 49ers" (not a pick), Dave Tuley teaser (rejected), BettingPros early "Commanders +7.5" (12 Oct, not_pick/rejected). Article 8303 is excluded by gate.

**Net:** 3 spread votes at -7.5 and 1 article at -7.5 all predate the half-point move to -8, and several are same-book-cluster podcasts (Action Network, BettingPros). Agreement is on the favorite, which the market already prices. Counting heads does not create edge.

## 8. Splits (with ages)

- Spread: WSH 24% of tickets / 20% of money; SF 76% / 80%. Total: over 63% tickets / 77% money; under 37% / 23%. Captured 2026-10-17T18:14:06Z (Sat 11:14 AM PT); about 4.4 h old at generation and taken before the 12:40 PM board was fully reflected (the spread was -8 at 12:40; splits capture time precedes by ~1.5 h). [Source: data/generated/master-intel/w06-splits-all.json, games/12 (key WSH@SF), 2026-10-17T18:14:06Z]
- Moneyline splits (SF 98% of bettors, 95% of money) are the Thursday-night pull, 2026-10-16T03:30Z, **42.6 h old: withheld as stale**, shown only to name the age.
- Read: heavy public SF/over. Money on the over (77%) is sharper-looking than tickets (63%) but the line only moved +0.5 on the total, so I draw no conclusion. SuperContest allowed market is spread only.

## 9. Simulator (scripts/intel/margin-simulator.mjs; selftest passed; home = SF, line -8, total 51.5)

Adjustments are my judgment, home-positive, within the 2.0 soft cap:
- margin_adj +0.5 (SF): the quant model wants +1.2 vs market on SF's 5-0 form and WAS's weak defense (defense_weakness_z +1.05); I credit less than half because the model is itself market-calibrated and provisional, samples are five games, SF's WR corps is badly depleted (Samuel out, Kirk/Robinson IR, Evans Q) and Bosa is Q. WAS also loses its lead back.
- total_adj -0.3: matches the model's -0.31; no weather input is used (wind unreconciled).

| Run | margin / total adj | SF cover (excl push) | WSH cover | Under (excl push) | SF win | Side push |
|---|---|---|---|---|---|---|
| Baseline | 0 / 0 | 50.00% | 50.00% | 50.00% | 76.0% | 2.49% |
| **Hypothesis (used)** | +0.5 / -0.3 | **51.45%** | 48.55% | 50.91% | 77.1% | 2.48% |
| Full model credit | +1.2 / -0.3 | 53.48% | 46.52% | 50.91% | 78.5% | 2.46% |
| Counter (SF hurt / WAS keeps pace) | -1.0 / 0 | 47.12% | 52.88% | 50.00% | 73.9% | 2.50% |
| Counter + shootout | -1.0 / +1.0 | 47.12% | 52.88% | 46.96% (Over 53.04%) | 73.9% | 2.50% |
| Low-scoring | 0 / -1.5 | 50.00% | 50.00% | 54.55% | 76.0% | 2.49% |

Break-evens at captured prices: SF -108 = 51.92%; WSH +8 -108 = 51.92%; Over -111 = 52.61%; Under -105 = 51.22%. The used hypothesis is 0.5 points short on SF; even the full-credit row clears by 1.6 points, inside model noise. Conditional-probability caveat: the simulator is calibrated to the market line, so every probability is conditional on my adjustment, not independent evidence; re-running at -7.5 or -8.5 with the same adjustment returns about 51.4%, so moving the number does not by itself create value, only a change in the adjustment (news) does. Props, team totals, SGPs and teasers have no calibrated joint model here and no model probabilities are given for them.

## 10. Props (only row-verified captured prices; none recommended)

BKR props captured 2026-10-17T19:42:50Z (332 rows pass raw price and roster identity); BEO captured 2026-10-17T21:16:24Z has 48 rows, zero player-tagged, so no BetOnline player prices exist for this game (thin coverage noted, not a blocker). DraftKings Predictions contracts are reference only. Prices below are captured, not live.

- Jayden Daniels rushing yards: Erickson lead "U38.5" (article 8332, no price stated). BKR ladder: Daniels 38+ (37.5) -112, 48+ +135; carries over 6.5 -129 / under +110. The under 38.5 has no matching row, so the lead is not reproducible at a price; roughly a coin flip. Lead only.
- **Jacory Croskey-Merritt anytime TD +185 (Nick Giffen, Action Network Sports Betting, 2026-10-15, ts 1954s, "So, uh, to get that RB1 on the commander side at plus 185, uh, that's who I'm going with."): VOIDED.** He is reported Out (ESPN 8363, RotoWire 8361, 10/17), and BKR carries no anytime-TD row for him (only first-TD rows, none for him). Omitted.
- Reference lines only, no leg proposed: Daniels passing yards over 205.5 -124 / under +106; Purdy 246.5 over +102 / under -119; Diggs rec yards 41.5 -109/-107 (Q); McLaurin 45.5 -108/-108 (Q, rest day); Kittle 64.5 -107/-109; McCaffrey rec yards 41.5 -102/-114; Ekeler rush 18.5 and Kaelon Black rush 25.5 (both posted, WAS backfield in flux). All WAS skill legs depend on Sunday-night/Monday inactives.
- Cody Brown "#31 vs TE TDs" (X bookmark, unverified against raw): no price, no leg.

## 11. Counter-case (required)

WAS +8 / WAS ML is right if: (a) SF's inflated efficiency (51.9% on 3rd down, 87.5% red-zone TD) regresses and SF's 5 giveaways start costing points; (b) Bosa and/or Evans are limited and the thin SF receiver group (Samuel out, Kirk and Robinson on IR) cannot punish a WAS defense that has been bad; (c) Daniels and the offense keep pace as Sharp or Square argues, with the 8-point number sitting on and just over the key numbers (the simulator puts 7.9% of outcomes on a 7-point margin and 12.5% on 3), so +8 holds the 8 and 7 outcomes; (d) late-night primetime road dogs with a back door; (e) the public is 76/80 on SF and the over is 63/77, a crowded side. Against that: WAS ranks 28th to 30th in net PPG, SRS and Pythagorean, allows 29.8 PPG, and lost its lead back. WAS +8 prices at 48.6% in the used run versus 51.9% needed, so the counter is a reason not to lay SF, not a reason to take WAS.

## 12. Ambiguity / missing data

1. Official inactives not available; ESPN statuses lag (the Croskey-Merritt news in two outlets postdates the packet's availability layer). Condition OFFICIAL_INACTIVES.
2. Wind 18.6 km/h vs gust 15.1 km/h is internally inconsistent in all three copies; unresolved, wind claims withheld. Forecast is 5 days out; KICKOFF_WEATHER refresh required.
3. Moneyline splits 42.6 h stale; spread/total splits 4.4 h old and precede the final 12:40 board.
4. No BetOnline player-prop rows for this game; BKR is a single book; no anytime-TD market row for any WAS player was found in the verified set.
5. Quote quality: Kezirian is a structured-segment match only; Pisapia unverified in retained raw; Sharp or Square rows lack URL.
6. FTN team_context is mostly player-level tables in the retained slice; no team FTN number is cited. nflverse success-rate/EPA-type fields are null.
7. Quant model contest field null (filename mismatch); locked contest line -7.5 is stale vs -8.
8. Coaching snapshot is historical only (stale flag); not used.
9. Michael Evans / Chigoziem Okonkwo aliases unresolved; Mike Evans (SF) is Q per ESPN.
10. W5 validator is pinned to Week 5 paths and cannot validate this packet schema; manual self-check done (no forbidden keys, disposition/tier pairing valid, adjustments within caps, every non-trivial claim sourced or placed here).
11. Condition WEATHER_WIND_GUST_RECONCILIATION and KICKOFF_WEATHER remain open; none is launch-blocking.

## 13. Pre-kickoff delta checklist

- Official inactives (Mon ~3:15 PM PT): Croskey-Merritt (confirm Out), Diggs, McLaurin, Ekeler, White, Burks, Patrick, Kinlaw; Bosa, Evans, Mykel Williams, McKivitz, Stout, Sigle. Bosa Out with McKivitz Out would move margin_adj toward -1.0 (SF cover about 47%); Bosa and Evans both active and healthy would support +1.0 to +1.2 (SF about 53%) and make SF a possible 2- only if the price is still -8 or better at -108 or shorter.
- Price: SF -8 at -108 is the baseline. SF to -7 or -7.5 at -108 with unchanged news is no better in this calibrated model (about 51%); a drop to 2-/candidate needs news, not price alone. WAS +8.5 or +9 at -108 would shift the numbers only if the market moved on WAS-positive news.
- Total: Under needs a cleaner 53%+ (total_adj around -1.5 or stronger wind evidence plus a 52.5 number); Over needs the shootout case (WAS Diggs and McLaurin active, SF Bosa out). Currently neither.
- Weather: re-pull the forecast Monday morning and at 2 PM PT; reconcile wind vs gust field definitions before any wind angle.
- Props: Daniels rushing U38.5 needs a matching priced row and Daniels confirmed active; ignore Croskey-Merritt legs unless he is active; any WAS RB prop waits on who is active (Ekeler, White, Black).
