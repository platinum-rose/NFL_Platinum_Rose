# Astra W06 - PIT @ TB (proposed synthesis)

**As of:** Sat 10/17 3:45 PM PT (22:45Z) | **Generated:** 2026-10-17T22:45:59Z | **HEAD:** ea74728e1e1f174f047755719896b90460c2eb64 (branch claude/w5-prop-cards-2026-10-11) | **Kickoff:** Sun 10/18 10:00 AM PT (17:00Z), roughly 18 hours out | **Packet:** `scratch/w06-astra-synthesis-queue.json` packets[2] (`/packets/2`), sha256 `e91307903ba1fd342e982de30d63d2d2c1167ba77bd857b253cc534f8c080885`; queue built 2026-10-17T22:06:53Z, queue sha256 `e5832e56de4087515a2a8550a9a3e7c33c18091a11ad3331d39d681446358f55`.

This is a proposal for Andy to react to. Nothing is placed, promoted or written anywhere. Prices below are captured rows, not live offers.

## 1. Disposition

**Disposition: `conflicted`. Tier: `2-`.** Lean: a thin, price-gated lean to **Tampa Bay +2.5** (captured -109). No lean on the total, either moneyline, or any player prop.

- The market-calibrated simulator, with my +0.5 TB-positive judgment adjustment, puts TB +2.5 at **51.3%** to cover against a **52.15%** break-even at -109. That is slightly negative at the captured price (about -1.6% per unit). Even the quantitative model's own implied +1.06 only reaches 52.8% (about +1.2% per unit). There is no model edge.
- The case for TB is qualitative. TB has a verified ~3-day rest edge, the public is heavy on PIT (71% of bets / 75% of money) while the line has not moved, and three independent-ish TB sources exist (Action Network, Ross Tucker's show, VSiN). All are priced at +2.5 or +3, none are model-priced. Note that +2.5 does not cover the most common margin: PIT by exactly 3 beats TB +2.5 (8.3% of the simulator's mass), whereas TB +3 would push on it. That is why the +3 price matters.
- The case against is real. TB has the worse team profile (SRS -0.40 vs PIT +2.49, turnover margin -2 vs +2, 1-4 vs 3-2). TB's offensive line allows a 44.3% pressure rate and a 10.1% sack rate against a blitz-heavy PIT defense. The starting QB is an operator-recorded rookie, Jalon Daniels, with Baker Mayfield out. Two article leads and every straight-up pick go PIT.
- Tier is capped at `2-` regardless, because the scoped condition OFFICIAL_INACTIVES is unresolved and the TB side depends on the QB.
- **Price gate:** TB +2.5 is a pass at the captured -109 on the model alone. It becomes a real `2-` candidate at TB +3 (sim about +0.8% per unit at -110) or TB +3.5 (54.0% vs 52.4% break-even), and it is a pass at TB +2 or worse (see section 9).
- The Under 39 has no model edge (50.0% vs 53.05% break-even at -113). The public-over/line-down pattern (81% of bets Over, total 40.5 to 39) is supportive but already priced.

## 2. Gate and pin record (all verified this session)

| Check | Result |
|---|---|
| HEAD / branch | `ea74728e...` / `claude/w5-prop-cards-2026-10-11`, matches queue and board |
| Session prompt sha256 | `c2bf2b1bb369...` matches the re-pinned board and queue (the `.pre-reprompt.bak` files were ignored) |
| Queue sha256 (exact bytes) | `e5832e56de40...` matches |
| Packet sha256 (sorted-key compact JSON) | `e91307903ba1...` matches the board and the activation |
| Queue state | `queued_hold`, `reproducible_for_dispatch: true`, packet `synthesis_status: conditional`, `blockers: []`, no `launch_blocking: true` conditions (ARTICLE_GATE_RESOLVED is `launch_blocking: false`) |
| Evidence manifest | 46 entries checked against path and sha256 and against `sources[source_id]`: 45 match. The one difference is `data/generated/master-intel/w06-roster-vet.json`, which is the self-rewriting receipt (see next row). |
| Roster gate | I did not rerun `npm run roster:vet`. I read the receipt: status **PASS**, `blocking: []`, 10 informational UNVERIFIED, roster snapshot **2026-10-17T22:22:11Z**, receipt rewritten at 22:35:07Z (not by this session). Roster age at my read was about 0.3 h (gate limit 24 h; expires 2026-10-18T22:22Z). Command on record: `npm run roster:vet -- --week 6 --date 2026-10-17 --strict` (queue `roster_gate`, exit 0, fetch performed). The snapshot source is unchanged from the pin. |
| Launch contract files | launch sheet sha `38bf344e...` and session prompt match |
| Kickoff / game status | 2026-10-18T17:00Z is in the future (current 22:44Z). The ESPN status file's `finals` list has no PIT@TB entry. Identity matches (PIT away, TB home, ESPN event 401873002). |
| Article gate | Cleared 2026-10-17 (0 unresolved, only 8303 excluded) [Source: scratch/w06-astra-launch-board.json, `article_gate_decision`; packet `conditions[0]`]. The stored activation template text in the session prompt that says "unresolved; STOP" is the superseded wording. The board and queue are current. |

Additional file used outside the manifest: `data/research-intel/review/w06-article-leads-read-2026-10-17.json` (sha256 `60c8f2d59c87070940315c27e47d1fe6e55f8a5896a38075fe8d70d424a6dbd8`, generated 2026-10-17T22:28:40Z). Its PIT@TB section matches the packet's `read_in_full_leads`. Only the PIT@TB selector was used for lead content.

## 3. Team form and schedule context

| | PIT | TB |
|---|---|---|
| Record | 3-2 (home 3-0, away 0-2) | 1-4 (home 0-3, away 1-1) |
| Results | W 20-13 ATL, L 3-20 @NE, W 30-27 CIN, L 24-27 @CLE, W 34-22 IND (10/11) | L 27-33 @CIN, L 19-23 CLE, L 16-23 MIN, L 14-17 GB, W 24-16 @DAL (Thu night, 10/8) |
| PPG / PA PG | 22.2 / 21.8 | 20.0 / 22.4 |
| Yds per play (off / def) | 5.34 / 5.50 | 5.02 / 5.30 |
| SRS / net PPG | +2.485 / +0.4 | -0.402 / -2.4 |
| Turnover margin | +2 (6 giveaways, 8 takeaways) | -2 (9 giveaways, 7 takeaways) |
| Sacks taken per game | 2.8 | 3.4 |
| Off EPA/play, def EPA/play (lower def is better) | -0.045, +0.014 | -0.079, -0.067 |

[Source: data/generated/team-dossiers/2026-w06/PIT.json and TB.json, `game_log`, `standing`, `season_profile_espn`, `power`; matchups/PIT@TB.json `side_by_side`, built 2026-10-17T02:04:52Z, through week 5.]

- **Rest:** TB last played 2026-10-09T00:15Z (Thursday night), PIT 2026-10-11T17:00Z, so by kickoff TB has about 9.7 days of rest and PIT 7.0 [Source: PIT.json / TB.json `game_log[4].date_utc`]. The podcast claims of "ten days" and "extra rest" (Fezzik, Anderson, Stuckey) are consistent with this.
- **Unit matchup:** PIT's offense (-0.045 EPA/play) faces TB's better-than-PIT defense (-0.067). TB's offense (-0.079) faces PIT's defense (+0.014). Both offenses are poor. TB's pass protection is the sharpest edge in PIT's direction (section 6).
- Shared opponents are CIN and CLE. PIT beat CIN 30-27 at home and lost 24-27 @CLE. TB lost 27-33 @CIN and 19-23 vs CLE. This is a small, noisy sample.
- The ESPN-derived efficiency fields (success rate, explosive rate, pressure rate, etc.) are null in the dossier [Source: dossier `data_quality.efficiency_nflverse.null_fields`]. Not used.

## 4. Availability and QB (official inactives decide)

- **TB QB:** ESPN lists "Baker Mayfield Out" and moves Jalon Daniels to starter by its rule [Source: data/research-intel/source-evidence/espn-status-w06.json, `teams.TB.qb_starter`, `qb_note`, fetched 2026-10-17T02:03:26Z]. The quoted status row reads: "Mayfield (thumb) will not play Sunday, Brianna Dix of the Buccaneers' official site reports." (dated 2026-10-16). Daniels is **operator-recorded** (Andy approval 2026-10-16 14:53 PT) [Source: data/research-intel/operator-confirmed-starters-2026-w06.json]. Neither is an official inactive. TB QB depth per ESPN is only Mayfield and Daniels.
- **PIT QB:** Aaron Rodgers is the ESPN depth-chart starter (`captured_ESPN_depth_chart_not_team_confirmation`) [Source: packet `availability.quarterbacks[0]`].
- **PIT, Out / IR:** WR Michael Pittman Jr. (IR 10/10), WR Ben Skowronek (Out), WR Roman Wilson (Out), S DeShon Elliott (IR, ruled out), DT Derrick Harmon (IR). **Questionable:** WR DK Metcalf (illness, missed Friday practice), RB Rico Dowdle (toe), CB Jalen Ramsey (wrist), CB Jamel Dean (ankle), DT Keeanu Benton. [Source: espn-status-w06.json, `teams.PIT.injury_report_non_active`, 10/12 to 10/17.]
- **TB, Out / Doubtful / Questionable:** S Antoine Winfield Jr. (Out, ribs), CB Benjamin Morrison (Doubtful), RB Sean Tucker (Questionable, "game-time decision"), LB Josiah Trotter (Q), CB Ayden Garnes (Q), LB SirVocea Dennis (Q), WR David Sills V (IR). [Source: same file, `teams.TB.injury_report_non_active`.]
- 7 PIT and 3 TB players sit in `roster_ir_out_unconfirmed` (ESPN roster IR/Out group, marked day-to-day, not confirmed Out). I do not treat them as out.
- Secondary-matchup (manual-review-capped): TB's Winfield absence is tagged `deep_pass_boost`, `slot_wr_boost` and `post_cross_boost`, and Morrison `outside_wr_boost`. PIT's Ramsey is tagged `alpha_wr_boost` if he is limited. Both secondaries are thin [Source: data/secondary-matchups/secondary-matchup-vulnerability-2026-w06.json, matchups for PIT@TB, 2026-10-17T02:04:07Z; `needs_human_review: true`]. The roster gate lists Israel Mukuamu (PIT) as UNVERIFIED, so I do not use his status.
- **Dropped:** Najee Harris items are dropped per the packet (Najee Harris is on NYG, not PIT) [Source: packet `material_conflicts`].

## 5. Weather and venue

Raymond James Stadium: outdoors, grass [Source: data/vault-seed/nflverse/schedules.csv, game 2026_06_PIT_TB, `roof`, `surface`]. Forecast sampled for the 17:00Z kickoff hour: 75.9 F, 0% precipitation, wind 21.9 km/h (about 13.6 mph) from 36 degrees, gusts 38.5 km/h (about 23.9 mph) [Source: data/research-intel/review/2026-w06-weather-venue.json, row PIT@TB; source-evidence/2026-10-17-week6-weather-openmeteo.json; captured 2026-10-17T20:16:18Z = 1:16 PM PT]. This is a forecast, not an observation. The file's review thresholds are wind >= 25 km/h or gusts >= 40 km/h, so no flag today, but the gust number is 1.5 km/h under the line. The narrative's "17 mph / 29 mph gusts" from Sharp's Wednesday tool is not in a pinned source and is not used.

## 6. FTN and quantitative

**FTN** (weekly cadence accepted by Andy; capture 2026-10-09 to 2026-10-13, context file 2026-10-16T22:00Z; season-to-date, both teams show GP 4 in FTN). Context only, not an expert tier. [Source: data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json, `team_context.PIT|TB`, team-offense / team-defense tables.]

| FTN metric | PIT | TB |
|---|---|---|
| Offense EPA/play, DVOA | -0.115, -6.0% | -0.153, -12.5% |
| Pass offense EPA/dropback, CPOE | -0.147, -3.8% | -0.211, -3.0% |
| Sack rate taken, pressure rate allowed | 7.6%, 26.2% | **10.1%, 44.3%** |
| Offense turnovers (interceptions) | 5 (4) | **9 (5)** |
| Defense EPA/play, DVOA | -0.001, -0.5% | -0.071, -6.6% |
| Pass defense EPA/dropback | +0.054 | +0.044 |
| Rush defense EPA/att, DVOA | -0.074, -13.7% | **-0.241, -26.9%** |
| Pass-rush: pressure rate, sack rate, blitz rate | 23.8%, 7.7%, 28.5% | 30.9%, 4.4%, 41.9% |
| Rush offense EPA/att | -0.051 | -0.039 |

Takeaways: TB's rush defense is elite, which makes PIT one-dimensional against a pass defense that is only average (+0.044). TB's offense is the more fragile unit (pressure and sack rates, turnovers) and now has a rookie QB. TB's defense blitzes much more (41.9%), which is a Daniels-versus-pressure issue in both directions. PIT receiving usage: Freiermuth 19 targets / 14 rec / 125 yds in 4 GP, route rate 64.5%; Metcalf 33 targets, 16 rec; Wilson (now Out) 24 targets. PIT has lost its second-most-targeted wideout.

**Quantitative model** (rebuilt 2026-10-17T21:11:11Z on the 12:40 PM PT board; its tables drop spread signs): PIT 20.38, TB 18.94, total 39.32, mean home margin -1.44, so PIT by about 1.4 against a PIT -2.5 market. TB cover 52.8% (PIT 47.2%), TB win 46.7%, Over 51.0% excluding pushes. The model's feature list has no QB term, so the Mayfield-to-Daniels change is not in it [Source: data/research-intel/proposed/2026-w06-quantitative-synthesis.json, `games[8]`, `features`, `simulation`]. Its probabilities are admitted only as "provisional_quantitative_context_only" [Source: packet `team_dossier.quantitative.model_probabilities_admitted`]. The model carries a flagged warning that it expected a different SuperContest file name; the real `week-06-lines.json` exists (flag only, per the packet).

## 7. Market (captured rows, not live offers)

| Market | Opener (Action Network, 10/12 ~01:00Z) | Bookmaker board, 10/17 19:40Z (12:40 PM PT) | Move |
|---|---|---|---|
| Spread | PIT -2.5 / TB +2.5 (TB -103) | PIT -2.5 -107 / TB +2.5 -109 | 0 points; TB side now costs 6 cents more |
| Total | 40.5 | 39: Over -103 / Under -113 | **-1.5** (Under is the heavier juice) |
| Moneyline | PIT -150 / TB +125 | PIT -141 / TB +123 | PIT 9 cents cheaper; TB 2 cents shorter |

[Source: data/odds/actionnetwork-openers-2026-w06.json, `/games/PIT@TB`, 2026-10-12T00:56Z to 01:00Z; data/odds/BKR_current_lines_1017_1240_buildfmt line 4, 2026-10-17T19:40:00Z; raw lines 1043 to 1049 verified.] SuperContest locked line (captured 2026-10-15 21:29Z, 2:29 PM PT): PIT -2.5, spread only, reference and non-executable [Source: data/supercontest/week-06-lines.json]. `live-market-comparison.json` drops signs and was not used. No executable live price was checked (no sportsbook visited). Line history between the opener and the 19:40Z board is not in the packet (`later_capture_differences: []`).

Break-evens at the captured prices: PIT -2.5 -107 = 51.69%; TB +2.5 -109 = 52.15%; Over 39 -103 = 50.74%; Under 39 -113 = 53.05%; PIT ML -141 = 58.51% (no-vig about 56.6%); TB ML +123 = 44.84% (no-vig about 43.4%).

## 8. Experts, podcasts and articles: agreement and disagreement

Approved YouTube signals (Andy approved 2026-10-17 21:44Z) are admitted as signals only. Same-source duplicates count once; different markets or lines are not independent votes [Source: packet `expert_article_podcast.comparison_policy`, `youtube`]. Quotes below are copied from packet rows.

**TB side (spread):**

| Source | Pick | Published | Move since pick |
|---|---|---|---|
| Stuckey, The Action Network Podcast (youtube-5AikVQLaJEg, ~4550s) | "my favorite three picks, we're going with the Bucks plus two and a half" | 10/14 | 0 (+2.5 still) |
| Brandon Anderson, The Action Network Podcast (youtube-C8cDtGmsRoc, ~2787s) | "So, Bucks plus two and a half, Raiders plus five and a half." Rationale: his number is TB -2, TB off extra rest, "expects Daniels not Mayfield". | 10/16 | 0 |
| Steve Fezzik, Ross Tucker show (youtube-EC4r_E6mc0E, ~1205s) | "I'll take Tampa for two units." (TB +3) | ~10/13 | -0.5 (now +2.5, worse for TB bettors) |
| Ross Tucker, same episode | "I'll take Tampa Bay as well, but again, I'm only going one unit." (TB +3) | ~10/13 | -0.5 |
| Steve Makinen, VSiN article 8108 | Tampa Bay +2.5 ("live home dog") | 10/15 | 0 |

Independence: Stuckey and Anderson are the same outlet, and Fezzik and Tucker are one episode, so there are three independent-ish sources (Action Network, the Tucker show, VSiN) with five voices. Quote quality: Stuckey's and Anderson's +2.5 quotes are `match_structured_segment_only` (no retained captions). The Makinen row is `unverified_against_raw_source` and the stored body is flagged as a suspected ingest cap. Treat Makinen as a lead. Anderson's alt-line leg (TB -6.5 at +330, line moved by 9 points) is not comparable to the full-game number and is excluded.

**PIT side:**
- Erickson, BettingPros (article 8332, 10/17): "Steelers -2.5 (official play)". The article's primer is flagged for internal inconsistency elsewhere, but this line has no caveat in the lead.
- Action Network PRO system pick (PJ Walsh, 8368, 10/17): a system pick on the game with "PIT -2.5 noted", but the side was not captured (paywalled stub). No directional weight.
- ESPN panel Maldonado/Moody/Walder (8187, 10/17): PIT in all three (17-16, 20-17, 23-20). PFT Florio (8054, 10/15): PIT 20-17. These are straight-up score picks, context only.
- Sharp or Square (Simon Hunter, 10/15): a 6-point teaser leg on PIT (-3.5 to +2.5). The registry row is `missing_url_or_quote` and the teaser is not comparable to the full-game line. Context only.

**Total:** ESPN Bowen (8208, 10/16) lead "UNDER 39.5 (-105)". It was priced a half point higher than now (39) and 8 cents cheaper, so the number has moved against the under. The caveat is a garbled reference to "Rookie quarterback Jalon Daniels", and the expert-registry row for the same quote is marked `rejected_do_not_use`, so this is a lead only.

**Net:** the handicapper side leans TB (3 sources vs 1 official PIT play plus an unknown system side), but the sample is small, mostly priced before today, and none of it is model-priced. Straight-up picks and contest consensus favor PIT but carry no ATS information.

## 9. Splits and simulator

**Splits** [Source: data/generated/master-intel/w06-splits-all.json `games[2]`, spread and total captured 2026-10-17T18:14:06Z (11:14 AM PT), about 4.5 h old at generation]:

| | Bets | Money |
|---|---|---|
| Spread: PIT / TB | 71% / 29% | 75% / 25% |
| Total: Over / Under | 81% / 19% | 76% / 24% |

Moneyline splits (TB 16% of bettors / 13% of money) are from the Thursday-night pull (2026-10-16T03:30Z, 42.6 h stale at manifest time) and are **withheld**. The narrative file says 82% Over; the splits file says 81%, and I use the splits file. Read: the public and money are on PIT and the Over, yet the spread did not move and the total fell 1.5. That pattern points toward TB and the Under, but it is a single snapshot and the book may simply be holding the number.

**Simulator** (`scripts/intel/margin-simulator.mjs`, selftest PASS, calibration `data/research-intel/proposed/2026-w05-historical-market-calibration.json` sha `0ea3559255d4...`, era 2018-2025). Home = TB, `--home-line 2.5 --total 39`. Adjustments are home-positive points.

| Run | margin-adj | total-adj | TB cover (excl. push) | PIT cover | Over / Under (excl. push) | TB win (excl. tie) | Mean margin (home) |
|---|---|---|---|---|---|---|---|
| Baseline (zero edge) | 0 | 0 | 50.0% | 50.0% | 50.0% / 50.0% | 42.7% | -1.98 |
| **Central** | **+0.5** | **0** | **51.3%** | **48.7%** | 50.0% / 50.0% | 44.0% | -1.56 |
| Quant-implied | +1.06 | +0.32 | 52.8% | 47.2% | 51.0% / 49.0% | 45.5% | -1.08 |
| TB upside (soft cap) | +2.0 | 0 | 55.2% | 44.8% | n/a | 47.9% | -0.27 |
| TB hard cap (illustration only) | +3.0 | 0 | 57.8% | 42.2% | n/a | 50.6% | +0.58 |
| PIT upside | -1.0 | 0 | 47.4% | 52.6% | n/a | 40.2% | -2.84 |
| Central, total down | +0.5 | -1.0 | 51.3% | 48.7% | 46.9% / 53.1% | 44.0% | -1.56 |
| Central, total up | +0.5 | +1.0 | 51.3% | 48.7% | 53.1% / 46.9% | 44.0% | -1.56 |

**Conditional-probability caveat:** the simulator is re-centered so a zero adjustment is 50/50 at the market number. Every probability here is conditional on my stated adjustment being right. They are not independent forecasts of the game, and the model has no QB term.

**Adjustment reasons (soft cap 2.0, hard cap 3.0, both respected):**
1. margin_adj +0.5 (toward TB): the quantitative model's own mean is PIT by 1.44 vs a market PIT 2.5 (+1.06 toward TB) [quant `games[8].means`]. I take about half of that because it is anchored on the same noon board, rests on 4 to 5 games of data, and has no term for the Daniels change. The verified rest edge (about +3 days for TB) is folded in and is small.
2. total_adj 0: the model's +0.32 toward the Over is offset by gusts near the review threshold, a rookie QB, and two negative-EPA offenses. Net zero.

**Price sensitivity** (my projected margin held fixed, so each line gets the matching adjustment; TB cover includes the push at 3):

| TB line | TB cover | Push | PIT cover | Read at about -110 |
|---|---|---|---|---|
| +2.0 | 48.8% | 2.4% | 48.8% | pass |
| **+2.5 (captured -109)** | **51.3%** | 0 | 48.7% | slightly negative (-1.6% per unit) |
| +3.0 | 48.5% | 8.3% | 43.2% | about +0.8% per unit, marginal |
| +3.5 | 54.0% | 0 | 46.0% | positive (+1.6 pts over break-even) |

## 10. Props (verified rows only)

Props, team totals and SGPs have no calibrated joint model here. Nothing below is presented as a model probability.

- **Bookmaker (captured 2026-10-17T19:41:05Z):** Rodgers pass yards O/U 226.5 (+102 / -119), completions 21.5 (+104 / -122), passing TDs O/U 1.5 (+137 / -163; ladder 2+ is +134). Daniels pass yards 176.5 (-109 / -107), TDs O0.5 -194. Metcalf receptions 4.5 (+128 / -150), yards 53.5 (-107 / -109). Warren rushing 60.5 (+102 / -119). [Source: data/research-intel/source-evidence/2026-10-17-bookmaker-week6-sgp-parsed.json, rows /rows/922 to /rows/1275, with raw lines in 2026-10-17-bkr-sgp-live-week6.raw.txt.]
- **BetOnline (captured 2026-10-17T21:15:35Z, latest artifact):** player coverage is kicker fantasy points only (Boswell O/U 8.5 -130 / +100; McLaughlin O/U 8.5 -115 / -115) [Source: packet `player_props.beo`]. Thin coverage is a note, not a blocker.
- **Rodgers 2+ passing TDs (+137), ESPN Solak 10/16:** the lead price matches the captured Bookmaker O1.5 row exactly (+137). No edge basis is available, and PIT's wide receiver room is depleted (Pittman IR, Wilson/Skowronek Out, Metcalf Q). **Not a candidate** (`research_only`).
- **Rodgers pass attempts O33.5 (-113), VSiN Burke 10/16:** there is no pass-attempts market in the Bookmaker or BetOnline captures. **Unverified, omitted.**
- **Pat Freiermuth receptions (Anderson O3.5 +130 / O4.5 +270, Hribar O3.5 +118, Anderson SGP +1068):** Bookmaker lists the Freiermuth receptions and receiving-yards markets **without prices** at the 19:41Z capture (`/rows/996`, `997`, `1024` to `1030`, `1086`, `1087`, `1111` to `1120`). Absent odds are not injury evidence. These podcast legs cannot be priced against a current row, so they are **unavailable and omitted**. The SGP leg is also not comparable. The only current Freiermuth row is first TD +1053, which is not part of this synthesis.
- Omitted legs: any Daniels, Metcalf, Dowdle or Tucker leg until official inactives, and Mar'Keise Irving and Kenneth Gainwell (UNVERIFIED in the roster gate). DraftKings Predictions contracts (66 rows) are reference-only and unused. No Bookmaker TD-scorer rows exist beyond first TD.

## 11. Counter-case (what makes PIT the right side)

PIT has the better team profile by every power measure (SRS +2.49 vs -0.40, model composite rank 13 vs 22, turnover margin +2 vs -2). TB's 1-4 record includes an 0-3 home mark, and its one win came on a Thursday night with three takeaways and a single sack taken, which looks like variance. TB's offense is the fragile one: a 44.3% pressure rate allowed, 10.1% sack rate and 9 giveaways, now with an operator-recorded rookie QB against Tomlin's blitz-heavy man-match scheme (secondary-matchup coverage tags `man_heavy`, `blitz_heavy`). TB's secondary is also missing its elite free safety and a starting corner, so Rodgers can attack deep and over the middle. PIT's weakness is on the road (0-2, scoring 3 and 24), but its 34-22 win last week came with zero giveaways and one sack taken. A PIT win by exactly 3 (8.3% of the simulator's margin mass) loses TB +2.5 outright; the half-point does not protect TB bettors on the most common margin. Finally, the market has held PIT -2.5 since 10/12, through Mayfield's Out report, which suggests the Daniels downgrade was already priced and the TB number is not obviously stale in TB's favor.

## 12. Ambiguity and missing data

1. **Official inactives are pending** (condition OFFICIAL_INACTIVES, due near kickoff). TB QB, Metcalf, Dowdle, Ramsey, Dean (PIT) and Tucker, Morrison, Trotter (TB) are all unconfirmed. This caps the tier at `2-` and removes all player legs.
2. **Whether the market has priced Daniels is unknown.** The line has been PIT -2.5 since the 10/12 opener and the 10/15 SuperContest lock, through the 10/16 Mayfield Out report, with only the total moving. No intermediate line history is in the packet. If Mayfield is somehow active, TB's number is far too high; if Daniels' play is poor, the PIT side is underpriced.
3. **Daniels' background is thin.** The only descriptor is "Rookie quarterback Jalon Daniels" in ESPN's article text (flagged garbled), plus Anderson's remark that TB "expects Daniels not Mayfield". No sourced experience or performance data is in the packet.
4. **FTN shows GP 4 for both teams** while ESPN shows 5 games played, and the FTN capture window (10/9 to 10/13) may predate week-5 data for some tables. Use FTN as rough context.
5. **Unsourced narrative claims not used:** "TB allows six receptions per game to tight ends", "Highest PROE matchup of the week per Sharp", and the wind readings from Sharp's Wednesday tool. The Hribar rationale (Freiermuth ran a route on 82% of dropbacks last week) is a rationale quote, not a pinned stat; FTN shows a 64.5% season route rate.
6. **Expert-registry conflicts:** the ESPN Bowen under row is `rejected_do_not_use` in the registry but included as a lead in `read_in_full_leads` with a caveat. The Makinen and Erickson rows carry ingest-cap or inconsistency notes. I used them as leads and flagged them.
7. **Moneyline splits are stale** (42.6 h) and withheld. Spread and total splits are 4.5 h old at generation and will change by kickoff.
8. **Roster gate UNVERIFIED rows** that touch this game: Mar'Keise Irving, Kenneth Gainwell (book props) and Israel Mukuamu (secondary absences). Their team, role and status are not inferred.
9. **Week 5 validator not usable:** `scripts/intel/validate-game-output.py` hardcodes the Week 5 packet directory (`PK = data/research-intel/game-packets/2026-w05`), so it cannot be pointed at this packet schema and was not run. Manual self-check done: no forbidden keys (`ticket`, `stake`, `wager_amount`, `bet_slip`, `payout`) in the JSON, disposition/tier pairing valid (`conflicted` with `2-`), adjustments within the 2.0 soft cap, every thesis claim carries a source or sits in this list.
10. The quantitative model's tables drop spread signs; direction here was read from the Bookmaker board file. `data/supercontest/live-market-comparison.json` also drops signs and was not used.
11. Mayfield and Daniels statuses are from ESPN and operator approval, not an official source. Official inactives decide.

## 13. Pre-kickoff delta checklist

1. **Official inactives (about 90 minutes before the 10:00 AM PT kickoff):** confirm Daniels starts for TB. If Mayfield is active, discard this synthesis and reprice, because the TB number should move sharply (the +3.0 sim row is illustrative only). Check Metcalf (illness) and Dowdle (toe) for PIT: a Metcalf scratch weakens PIT's offense and nudges toward the TB side and the Under. Check Tucker (TB RB, game-time decision).
2. **Spread crossings:** TB +3 or better at -115 or shorter upgrades the lean to a real `2-` candidate (TB +3.5 more so). TB +2 or worse, or PIT -3 or longer, makes this a pass. PIT -2.5 with TB juice moving to -115 or worse is also a pass.
3. **Total:** the Under 39 stays a pass at -113 or worse. Below 38 the under value is mostly gone, and above 40 the book is paying for a Mayfield or wind change. Re-check the sim with the new total, since the model re-centers.
4. **Weather:** refresh the Open-Meteo forecast on game morning. Wind >= 25 km/h sustained or gusts >= 40 km/h trigger a review (current 21.9 / 38.5). A cross strengthens the Under read and weakens pass-volume props.
5. **Splits:** refresh the spread and total splits and look for the PIT bet-count share holding above 70% with the line still at 2.5 (supports the TB read) versus the line moving to -3 (removes the hook).
6. **Line history:** pull any 10/15 to 10/17 line history to establish when the Mayfield-out news was priced (section 12, item 2).
7. **Props:** recheck Freiermuth receptions and receiving-yards prices (currently unpriced on Bookmaker); only price a leg once a row with a real price exists and roster status is confirmed. Rodgers 2+ TD +137 stays research-only.
8. **Roster snapshot:** do not silently repin. A changed roster snapshot or a new BLOCK requires a requeue.
