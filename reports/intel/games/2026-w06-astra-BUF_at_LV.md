# Astra W06 BUF@LV - Proposed synthesis (COMPLETE)

As of: Sat 2026-10-17 15:44 PT | Generated: 2026-10-17T22:44Z | HEAD ea74728e1e1f174f047755719896b90460c2eb64 (branch claude/w5-prop-cards-2026-10-11) | Kickoff: Sun 2026-10-18 13:25 PT (20:25Z), still future | Packet: /packets/9 sha256 e9701e6ca865b0ca065b7d0b509f7e7049e0c25ff6cf55b2a3a4b5d04ecddc8a, queue sha256 e5832e56..., queue requeued 2026-10-17T22:29:12Z | Roster gate: PASS, roster snapshot 2026-10-17T22:22Z, age about 0.3h at read (receipt read only; `npm run roster:vet` not rerun per instruction).

This is a proposal for Andy to react to. Nothing is placed, promoted or written anywhere. Relaunch note: supersedes the earlier STOPPED note for this game (prompt-hash drift; re-pinned to c2bf2b1b...).

## Disposition

**quantitative candidate, tier 2-.** Lean: **LV +4.5 (-108)**, a thin edge. The market-calibrated simulator gives LV cover 52.7% (excluding push; none at 4.5) with a +1.0 point judgment shade, against 51.9% break-even at -108. The pinned quantitative model alone (BUF 28.0 / LV 25.4, home margin -2.64) implies 55.0% for LV +4.5, but I shade it by about half (reasons below). Total 53.5 is **pass** (model 53.4 vs market 53.5, simulator 50.0%). BUF -4.5 is the counter side at 47.3%.

Why 2- and not 2: (a) the edge is under one point of cover probability after shading and sits inside model noise; (b) two scoped conditions apply and cap it at 2- (OFFICIAL_INACTIVES: DJ Moore and Joshua Palmer carry questionable tags on the BUF side; KICKOFF_WEATHER: fixed dome, no outdoor effect, nothing to resolve beyond confirming indoor treatment); (c) the line already moved 1.5 points toward LV from the opener, so part of the lean is priced. Price floor: the lean disappears at LV +3.5 and is marginal at +4 (see price sensitivity).

## Team form and schedule context

- BUF 4-1, ESPN per-game: 32.8 ppg for, 28.2 against, 6.78 yds/play offense vs 5.52 allowed, turnover margin -4 (9 giveaways, 5 takeaways). SRS 4.153 (rank 8), model composite rank 9. [Source: packet team_dossier team:BUF season_profile_espn and power, built 2026-10-17T02:04:52Z]
- LV 3-2: 26.4 for, 25.8 against, 5.16 yds/play offense vs 6.10 allowed, turnover margin +3 (7 giveaways, 10 takeaways), rushing only 82 yds/g, 2.2 three-and-outs/g. SRS 0.831 (rank 17), composite rank 14. [Source: packet team_dossier team:LV, same timestamp]
- Read: BUF is the stronger team on yardage efficiency; its turnover margin (-4) is the part most likely to regress favorably, LV's (+3) most likely to regress unfavorably. Both cut toward BUF and are reasons the shade is only +1.0, not the full model gap.
- Rest/spot: BUF played Monday night (2026-10-12) vs the Rams. Sources describe it as short rest after an overtime road game ("Bills are on short rest following an overtime road game" - Sharp or Square feed row, published 2026-10-15T19:27Z; Brandon Anderson rationale cites 78 defensive plays). These are source claims; I did not verify snaps or overtime against a box score here. [Source: packet expert_article_podcast.expert_registry_rows /rows/7; youtube approved_signals /picks/43]
- Coaching-tendency snapshot is flagged historical_context_only; not used.

## Availability and QB

- QBs: Josh Allen (BUF) and Kirk Cousins (LV) per ESPN depth chart, roster identity matched (Cousins on LV per the refreshed roster). Confirmation level: captured ESPN depth chart, not team confirmation. [Source: data/research-intel/availability/2026-w06-availability-layer.json /games/10, 2026-10-17T02:03:52Z; roster gate receipt]
- BUF reported questionable: DJ Moore (shoulder, Jay Skurski/Buffalo News, 2026-10-16), Joshua Palmer (shoulder, Sam Warren/The Athletic, 2026-10-16), DT Ed Oliver (knee, non-participant Wednesday walk-through), DT T.J. Sanders, CB Dee Alford, CB Te'Cory Couch (hamstring, doubtful 2026-10-04 note). No BUF Out/IR in the injury feed. [Source: availability layer /games/10 teams[0]]
- LV reported: WR Dont'e Thornton Jr. IR, not being activated; TE Carter Runyon IR (designated to return to practice 10/14); C Trey Zuhn III questionable; DT Tonka Hemingway in concussion protocol (10/12). [Source: availability layer /games/10 teams[1]]
- The availability layer is dated Fri 10/16 7:03 PM PT, about 20 hours old at generation. Official inactives (due roughly 90 minutes before kickoff) decide. No player leg is built on Moore or Palmer.
- Operator-confirmed starters file covers only PHI/BAL/TB; it adds nothing for this game.

## Weather and venue

Fixed dome (LV). No outdoor weather applies; no roof condition to track. [Source: data/research-intel/review/2026-w06-weather-venue.json /rows/12 materiality "fixed dome (LV): outdoor weather does not apply", 2026-10-17T20:16:18Z; packet weather.verdict fixed_dome_no_outdoor_effect] The reversed LV@BUF dossier is superseded and was not used.

## FTN and quantitative

- FTN weekly stats (accepted weekly cadence; context file 2026-10-16T22:00:08Z, capture completed 2026-10-13T18:14:26Z). Quantitative input only, never an expert tier. Note: FTN shows GP 4 for both teams while ESPN shows 5, so FTN likely omits the latest week; treat as slightly stale.
  - BUF offense: DVOA 29.8%, EPA/play 0.162, pass DVOA 45.5%. BUF defense: DVOA 9.5% (worse than average), pass-defense DVOA 22.6%, pressure rate 34.7%. [Source: ftn-stats-iq-weekly-synthesis-context-latest.json team_context/BUF team-offense efficiency, passing-analytics; team-defense efficiency, passing-analytics, pass-rush]
  - LV offense: DVOA -0.2%, EPA/play -0.015, pass DVOA 29.6%. LV defense: DVOA -5.0%, pass-defense DVOA -5.4%, sack rate 8.2%. [Source: same file team_context/LV]
  - Tempo: LV 67.8 plays/g, BUF 60.0. [Source: same file, team-offense tempo]
  - Read: BUF pass defense is a real weakness (22.6% DVOA allowed), LV pass offense is efficient; LV overall defense grades better than BUF's. This is consistent with the model putting LV scoring at 25.4.
- Quantitative model (rebuilt 2026-10-17T21:11:11Z on the 12:40 PM PT board): means BUF 28.02, LV 25.38, total 53.40, home margin -2.64; anchor diff vs baseline 0.0 on spread and total. Probabilities are provisional context only. [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json /games/10; reports/intel/master-intel-narratives-2026-w06.md lines 119-130: "Model LV +4.5 at 55.0% cover (the third-highest side)"; "Totals are essentially flat in the model (49.7% over)"]
- Secondary-matchup file (capped manual review): LV pass defense carries boundary WR, deep, post-cross, slot and underneath weaknesses; BUF defense carries slot, TE-middle and underneath weaknesses (Bowers flagged as alpha target). BUF CBs Dorian Strong and Jordan Hancock appear as IR in a FantasyPros feed flagged needs_human_review while the roster shows them day-to-day (see Ambiguity). [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w06.json matchups 22-23, 2026-10-17T02:04:07Z]

## Market (captured, not live offers)

| Item | BUF/LV | Source and capture |
|---|---|---|
| Spread (Bookmaker board) | BUF -4.5 -108 / LV +4.5 -108 | /rows/3093-3094, raw lines 3785-3786, 2026-10-17T19:40Z (12:40 PM PT) |
| Total | Over 53.5 -109 / Under 53.5 -107 | /rows/3095-3096, same capture |
| Moneyline | BUF -217 / LV +194 | /rows/3097-3098, same capture |
| SuperContest locked line | BUF -4.5 (reference, not executable) | data/supercontest/week-06-lines.json, 2026-10-15 2:29 PM PT |
| Opener (Action Network) | LV +6 (-110), total 53.5, ML BUF -275 / LV +222 | data/odds/actionnetwork-openers-2026-w06.json, spread 2026-10-12T05:05Z, total 2026-10-12T01:02Z |

Movement, opener to 12:40 PM PT board: spread 1.5 points toward LV (LV +6 to +4.5), total unchanged at 53.5, BUF ML eased from -275 to -217 (LV +222 to +194), the same direction as the spread. The opener and the board are different books, so treat the movement as a note, not evidence. The locked contest line (-4.5, 10/15) equals the 10/17 board, so the number has been stable for at least 48 hours. The availability layer prints BUF -4 / -229 / +197; that is an older capture and is superseded by the signed board. No executable live price was checked; no sportsbook was visited.

## Expert, podcast and article agreement vs disagreement

Spread:
- LV side, approved YouTube signals (approved by Andy 2026-10-17): Chad Millman, Sharp or Square, official Chad's Choice, LV +5.5 ("Give me the Raiders plus 5 and a half"); Stuckey, Action Network Podcast, LV +5.5; Brandon Anderson, Action Network Podcast, LV +5.5 ("I am betting Raiders plus five and a half to cover against the Bills."). All three picked 5.5; the current number is 4.5, so each moved 1.0 point against LV. Steve Fezzik's LV +2.5 is a fourth-quarter parlay leg and is not comparable to the full-game number. The Sharp or Square expert-feed row (/rows/7, LV 4.5) is the same show as Millman and is one voice, not two; Stuckey and Anderson share a network but are distinct speakers. [Source: packet expert_article_podcast.youtube.approved_signals /picks/6, /picks/17, /picks/43, /picks/14]
- BUF side: Steve Makinen, VSiN, BUF -5.5 ("NFL Week 6 Best Bet: Give me Buffalo -5.5 in Las Vegas", 2026-10-15T20:33Z; article_id 8108, analyst lead priced at publish). Current BUF -4.5 is a better price for BUF by one point than his number. Quote quality unverified against raw. Straight-up picks for BUF (ESPN trio, article 8187; PFT Florio BUF 30-24, article 8054) are context, not edge, and the PFT/8054 mapping still appears in the packet's unresolved-ID list, so I do not lean on it.
- Net: 3 distinct approved LV voices all at a worse-for-LV price than today (they got 5.5), 1 BUF analyst at -5.5. The agreement is directionally for LV but the priced edge each cited (5.5 vs 4.5) has partly been taken by the market.

Total:
- Over: Seth Wilcox, BettingPros Podcast, Over 53 at -109 (now 53.5 -109); Matt Perrault, BettingPros Podcast, Over 52 (moved 1.5 points to 53.5); BettingPros expert-feed row, Over 53 (no URL, missing quote quality); article lead 8332 (Erickson, BettingPros) Over 53.5, mapping inferred from the line. Public contest: Average Joe 94% Over 53.5 (VSiN Burke, article 8365) - consensus context, not edge. Sharp Football row /rows/53 carries garbled navigation text, not a citable quote; not used.
- Simulator on the market number: 50.0% each way. No edge on the total, and public/ticket money is heavily one-sided (see splits). Disposition for the total: pass.

Props and other (see Props section for prices): Wilcox Cousins Over 239.5 and his SGP at +190 (2026-10-15); article lead 8208 ESPN Solak Brock Bowers 8+ receptions (+140); lead 8266 VSiN Swedelson Tre Tucker rec yards O38.5 (-120); lead 8339 BettingPros Conner Kirk Cousins completions O22.5 (caveat: slug says attempts; Cousins is LV per roster); Gilles Gallant Michael Mayer anytime TD +320 (no current row); Fezzik Bills first score and win at about even money (no current row).

## Splits (with ages)

- Spread (captured 2026-10-17T18:14:06Z, 11:14 AM PT): BUF 62% tickets / 55% money; LV 38% tickets / 45% money. LV money exceeds LV tickets by 7 points, a mild larger-bets-on-LV tilt.
- Total (same capture): Over 74% tickets / 83% money; Under 26% / 17%. Heavy Over crowd with the number not moving above 53.5 since the opener.
- Moneyline: LV 7% bettors / 19% money from the Thursday-night pull (2026-10-16T03:30Z, about 42.6 hours old at manifest). Stale; withheld. Not used.
[Source: data/generated/master-intel/w06-splits-all.json /games/9]

## Simulator (scripts/intel/margin-simulator.mjs; selftest passed)

Inputs: home (LV) line +4.5, total 53.5; adjustments are home-positive points.

| Run | margin-adj | total-adj | LV +4.5 cover | BUF -4.5 cover | Over 53.5 | Under | LV win (excl tie) |
|---|---|---|---|---|---|---|---|
| Baseline (no judgment) | 0 | 0 | 50.0% | 50.0% | 50.0% | 50.0% | 32.6% |
| **Hypothesis (proposed)** | +1.0 | 0 | **52.7%** | 47.3% | 50.0% | 50.0% | 35.0% |
| Quant-model anchor (reference, not my adj) | +1.86 | 0 | 55.0% | 45.0% | 50.0% | 50.0% | 37.2% |
| Counter-case | -1.0 | 0 | 47.3% | 52.7% | 50.0% | 50.0% | 30.2% |
| Total sensitivity | +1.0 | -1.0 | 52.7% | 47.3% | 47.0% | 53.0% | 35.0% |
| Total sensitivity | +1.0 | +1.0 | 52.7% | 47.3% | 53.0% | 47.0% | 35.0% |

Judgment adjustment: margin-adj +1.0 (within the 2.0 soft cap), total-adj 0. Reasons: (1) the pinned quantitative model puts the home margin at -2.64 against the market's -4.5, a +1.86 gap, which I take at roughly half weight because the model is provisional, the FTN inputs appear to be one week behind, and the line already moved 1.5 toward LV; (2) BUF short rest after the overtime Monday game (source claim, unverified snap count); (3) offset: BUF's -4 turnover margin and LV's +3 argue for BUF regression, and BUF's offense (DVOA 29.8%) faces a defense that is only about league average, which is why I do not use the full gap. Total adjustment 0 because the model total (53.40) equals the market (53.50).

Caveat: these are conditional probabilities from a market-calibrated margin distribution, not independent evidence; they scale my judgment shade and the market line, and the simulator recenters so zero adjustment is 50/50 at any supplied line. The LV win figure is derived from the same margin distribution (the board implies about 34% LV vs 35.0% here, a marginal gap). Props, team totals, SGPs and teasers have no joint model here and carry no model probability.

Price sensitivity (hold the fair home margin at -3.5, i.e. the +1.0 shade at +4.5, and vary the number LV is taken at):

| LV number | cover excl push | push | note |
|---|---|---|---|
| +3 | 48.6% | 8.3% | no edge |
| +3.5 | 50.0% | 0 | no edge, break-even is 52% at -108 |
| +4 | 51.4% | 2.4% | marginal, below break-even |
| **+4.5** | **52.7%** | 0 | about +0.8 points over -108 break-even (51.9%) |
| +5 | 54.1% | 2.5% | |
| +5.5 | 55.4% | 0 | where the podcasts were |
| +6 | 56.9% | 2.5% | opener |

The sensitivity rows beyond +5 use adjustments over the 2.0 soft cap only as a mechanical price sweep, not as new judgment. Take-away: the call is only a candidate at +4.5 or better; at +3.5 or shorter there is no edge.

## Props (verified current priced rows only; no model probabilities)

BKR rows captured 2026-10-17T19:42:14Z (12:42 PM PT, roster identity verified); BEO rows captured 2026-10-17T21:16:09Z (2:16 PM PT, roster identity verified). Both capture-only; execution not verified. No Bookmaker TD-scorer rows exist. DraftKings Predictions are reference-only. Per the availability condition, no DJ Moore or Joshua Palmer leg is offered.

| Player / market | Current row | Lead / pick and movement |
|---|---|---|
| Kirk Cousins pass yds | BKR O/U 251.5 -114/-102 (/rows/3155-3156); BEO O/U 249.5 -115 (/rows/612-613) | Wilcox Over 239.5 -115 (10/15): number now 10-12 yards higher; the pick is not available at its price, so it is no longer support. The BEO Josh Allen line is 239.5 (/rows/592), a coincidental match; do not map it to Cousins. |
| Kirk Cousins completions | BKR O22.5 -120 / U +103 (/rows/3193-3194); BEO O22.5 -125 (/rows/614) | Lead 8339 Conner (BettingPros 2026-10-17), caveat slug says attempts. Cousins attempts line BEO 36.5 -115 (/rows/620) is consistent with 22.5 completions. |
| Tre Tucker rec yards | BKR O38.5 -114 / U -102 (/rows/3297-3298); BEO O/U 38.5 -115 (/rows/686-687) | Lead 8266 Swedelson (VSiN 2026-10-16) O38.5 -120: same line, slightly better price now. Tucker is LV per refreshed roster. |
| Brock Bowers receptions | BKR O/U 6.5 -135/+115 (/rows/3235-3236), 8+ +126 (/rows/3269); BEO O/U 6.5 -130/+100 (/rows/676-677) | Lead 8208 Solak (ESPN 2026-10-16) 8+ at +140: price now +126 on BKR, about 14 cents of price gone. |
| Brock Bowers rec yards | BKR O/U 81.5 -114/-102; BEO O/U 80.5 -125/-105 | Context only. |
| Michael Mayer anytime TD | none | Gallant +320: no BEO atd_1_plus row for Mayer and no BKR TD rows. Unavailable. |
| Bills first score and win | none | Fezzik +100 area: no row. Unavailable. |
| SGP "What happens in Vegas" +190 | none | Wilcox legs Over 53 and Cousins Over 239.5; both legs have moved; SGP has no joint model. Not comparable. |

These are leads, not picks; I am not recommending any prop.

## Counter-case (what makes BUF -4.5 right)

BUF has the better offense by every efficiency stat in the packet (DVOA 29.8% vs -0.2%, 6.78 vs 5.16 yards/play, 32.8 vs 26.4 ppg) and faces an LV defense that allows 6.10 yards/play. Its negative turnover margin (-4) is more likely noise than skill, while LV's +3 is the kind of number that regresses, so the market's four-and-a-half may already be fair or low. "Short week" effects are small in the long run, and the Monday-night overtime and snap-count claims are unverified source assertions. This is the Makinen -5.5 view. LV's rushing offense is thin (82 yds/g) and LV converts red-zone trips to touchdowns at 55.6% against BUF's 71.4% (ESPN box-score aggregate). If DJ Moore and Palmer both play, the BUF passing game faces a pass defense the secondary file rates weak. Lastly, the lean exists only because a provisional model disagrees with the market by 1.9 points; with a half-point of price tolerance it is easy to be on the wrong side of 4.5.

## Ambiguity and missing data

1. Queue-internal pin mismatch: `packet_pins["BUF@LV"].sha256` in the queue is a6da125a..., which does not equal the recomputed canonical hash of /packets/9 (e9701e6c...). The same disagreement occurs for all 13 packets. The activation text, launch board, and my recomputation of the packet object agree on e9701e6c..., so I treated that as the governing pin. Please check how `packet_pins` is generated before the next requeue.
2. Packet article block is internally inconsistent: it still lists unresolved_ids (8332, 8336, 8339, 8054, 8365, 8266, 8007) and source_gate "blocked_in_source_not_waived" while the packet condition ARTICLE_GATE_RESOLVED and the launch board say the gate was cleared on 2026-10-17 with only 8303 excluded. I followed the session prompt (gate cleared) but kept every article-derived item as a lead or context, none as thesis support.
3. Official inactives are not available. The availability layer is Fri 7:03 PM PT. DJ Moore and Palmer questionable status unresolved; no Moore or Palmer claim made.
4. BUF CBs Strong and Hancock, and LV CB Anusiem: a FantasyPros feed says IR (needs_human_review) while the ESPN roster group lists them day-to-day. Not confirmed Out; not used.
5. Short-rest, overtime and 78-defensive-snap claims come from podcast and expert-feed rationales; not checked against a box score.
6. Quote-quality: Makinen, Sharp Football, PFT and Action Network rows are `unverified_against_raw_source`; the Action Network "Pick: Bills -4.5" row is marked `not_pick` / `rejected_do_not_use` and was ignored.
7. FTN GP is 4 for both teams versus 5 in ESPN; captured weekly (accepted by Andy 2026-10-17), so treated as one week behind.
8. Moneyline splits stale (42.6 hours); no moneyline split analysis. Prop coverage is full on BKR (308 verified rows) and BEO (108) for this game, but BEO has no Mayer anytime-TD row and Bookmaker has no TD rows.
9. The quantitative file warns that no SuperContest lines file was found (script expects a different filename); I read data/supercontest/week-06-lines.json directly (BUF -4.5).
10. Roster-vet receipt was read, not regenerated: PASS, roster source 2026-10-17T22:22:11Z, 0.2 hours old at receipt time. Its hash is excluded from the pin check by instruction.
11. Opener comparison is cross-book (Action Network opener vs Bookmaker board).
12. `scripts/intel/validate-game-output.py` is pinned to Week 5 paths and was not run. Manual self-check done: no forbidden keys (ticket, stake, wager_amount, bet_slip, payout), disposition/tier pairing valid (quantitative candidate with tier 2-), adjustment within the 2.0 soft cap, every number cited to a packet or pinned file.

## Pre-kickoff delta checklist

1. Official inactives (about 11:55 AM PT): Allen, Cousins, Bowers, Cook, Kincaid must be active. If Allen or Cousins is out, the lean is void and rerun. If both Moore and Palmer are out, BUF's passing game thins: the LV lean could firm, but rerun the simulator with a documented adjustment before relying on it; no total edge exists now. If Moore plays, no change.
2. Spread: LV +4.5 -108 is the reference. LV +5 or +5.5 appearing improves the cover estimate to about 54-55%; LV +4 is marginal (51.4%); LV +3.5 or shorter (BUF -3.5 or shorter) removes the edge entirely. A move through 3 (to LV +3) is a key number: stay off.
3. Total: simulator fair at 53.5. If the number moves to 55.5 or above or to 51.5 or below, rerun; there is no current total edge and the 74%/83% Over crowd has not moved the line.
4. News: any Bills announcement on rest/practice status, Hemingway or Zuhn status for LV, or an Allen injury designation.
5. Props: re-pull BKR and BEO rows; the Cousins yardage line was 249.5-251.5 in the afternoon captures, not 239.5; Tucker O38.5, Cousins completions O22.5 and Bowers 8+ prices will have moved. Omit any leg whose price cannot be row-verified in a later capture.
6. Venue: confirm LV home game is indoors (fixed dome); no outdoor weather input.
7. Optional: refresh moneyline splits if that lane is used; DraftKings Predictions remain reference-only.

## Key sources

- Queue: scratch/w06-astra-synthesis-queue.json (sha256 e5832e56de4087515a2a8550a9a3e7c33c18091a11ad3331d39d681446358f55), packet /packets/9.
- Session prompt: agents/dev/ASTRA_W06_GAME_SESSION_PROMPT.md (sha256 c2bf2b1bb36979dd7a79b4922a4aa208d4fadf8950ffb41af02ee95edc9ee782, matches queue launch_contract and board).
- Pins verified this run: HEAD ea74728e..., branch claude/w5-prop-cards-2026-10-11, queue and packet hashes, session prompt and launch sheet hashes, 51 of 52 manifest sources (w06-roster-vet.json excluded by instruction and read for PASS), kickoff future, ESPN file shows no BUF@LV game underway (only SEA@DEN final).
