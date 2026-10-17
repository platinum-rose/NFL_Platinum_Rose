> **REQUEUED 2026-10-17 3:24 PM PT.** Article gate cleared by disposition (24 records: 14 read/triaged, only 8303 excluded). Roster snapshot refreshed 3:22 PM PT; strict gate PASS. Status unchanged: 0 ready, 12 conditional, 1 blocked (CHI@ATL). Sections below that say the article gate awaits Andy's decision are superseded.

# Week 6 Astra synthesis queue — HOLD

**0 ready · 12 conditional · 1 blocked. No Astra run has started.**

Prepared 10/17, 3:06 PM PT at HEAD `ea74728e1e1f174f047755719896b90460c2eb64`, branch `claude/w5-prop-cards-2026-10-11`. Queue schema remains `w06_astra_synthesis_queue_v1`. Test suite unverified; no passing count claimed.

Strict roster gate PASS: 0 blockers, 10 informational warnings; snapshot 10/16, 3:20 PM PT, 23.7 hours old at gate. No fetch/network used. Snapshot reaches 24 hours at **3:20 PM PT Saturday**; every launch needs a fresh gate check. The command regenerated its standard gate report.

## Readiness

| Game | Status | Reason |
|---|---|---|
| HOU@JAX | conditional | Article decision; kickoff London gust review |
| NYJ@NE | conditional | Article decision; Brown status before any Brown leg |
| PIT@TB | conditional | Article decision; Daniels/operator record, final inactives |
| BAL@CLE | conditional | Article decision; Huntley/operator record, final inactives |
| CHI@ATL | blocked | Williams unconfirmed; article decision |
| TEN@IND | conditional | Article decision; roof confirmation |
| CAR@PHI | conditional | Article decision; McKee record, Barkley hedge |
| NO@NYG | conditional | Article decision; Likely price/opponent caveat |
| ARI@LAR | conditional | Article decision; normal kickoff checks |
| BUF@LV | conditional | Article decision; fixed-dome confirmation |
| LAC@KC | conditional | Article decision; normal kickoff checks |
| DAL@GB | conditional | Article decision; normal kickoff checks |
| WAS@SF | conditional | Article decision; wind/gust fields need checking |

All rows remain on HOLD. Conditional status is not an article waiver: `ARTICLE_GATE_DECISION` is launch-blocking until Andy explicitly resolves or waives it and the packet is requeued. Future weather/inactive checks restrict the claims they affect; thin boards and moved lines are not blockers.

## Freshness matrix

| Source | Source time | Scope | Verdict |
|---|---|---|
| `slate` | 10/13, 12:30 AM PT | 13 remaining game identities | identity_only |
| `index` | 10/16, 7:04 PM PT | 32-team index; 26 teams used | mixed_freshness_snapshot |
| `cross` | not embedded | Canonical codes | identity_only |
| `pull` | 10/16, 10:38 PM PT | 191 signals, 715 notes, 40 expert rows | mixed_age |
| `gate` | not embedded | 0 blocking; 10 informational warnings | pass_cached_roster |
| `experts` | 10/16, 10:38 PM PT | 128 rows before game filtering | conditional_provenance |
| `availability` | 10/16, 7:03 PM PT | 13 filtered games | conditional_status_only |
| `starters` | 10/16, 2:53 PM PT | PHI/BAL/TB only; CHI unresolved | partial_operator_confirmation |
| `espn` | 10/16, 7:03 PM PT | 32-team captured feed | conditional_status |
| `weather` | 10/17, 1:16 PM PT | 10 outdoor forecasts, 3 venue conditions | current_forecast_context |
| `weatherRaw` | 10/17, 1:16 PM PT | 10 forecasts | fresh_forecast_with_flags |
| `quant` | 10/17, 2:11 PM PT | 13 applicable model rows | current_anchor_with_warning |
| `quantMd` | not embedded | Rendered model report | current_rendered_model |
| `ftn` | 10/16, 3:00 PM PT | 74 tables / 9,309 records | current_weekly_context |
| `secondary` | 10/16, 7:04 PM PT | 26 directional matchups | manual_review_only |
| `expertMd` | not embedded | Expert verification report | audit_only |
| `narratives` | not embedded | 13 game sections | current_captured_context |
| `youtube` | 10/16, 9:27 PM PT | 124 picks / 75 notes before scope filtering | approved_by_andy_2026-10-17 |
| `openers` | 10/16, 7:04 PM PT | 13 matched games | historical_baseline |
| `board` | 10/17, 12:40 PM PT | 13 signed spread/total/ML rows | current_captured_baseline |
| `comparison` | 10/17, 11:00 AM PT | 13 matched games | reference_only_repinned |
| `splits` | 10/17, 1:26 PM PT | 13 spread/total/ML game rows | mixed_freshness |
| `rawSplits` | not embedded | 13 unique remaining matchups; multiple aliases | timestamp_provenance_external |
| `contest` | 10/15, 2:29 PM PT | 13 remaining contest spreads | locked_reference |
| `bkr` | 10/17, 12:40 PM PT | 4,804 rows / 13 games | partial_captured_sportsbook |
| `beo` | 10/17, 2:15 PM PT | 1,020 rows / 13 games | partial_current_capture |
| `dkp` | 10/17, 12:48 PM PT | 13 events | reference_only_non_executable |
| `bkrRaw` | not embedded | 13 captured events | raw_provenance |
| `beoRaw` | not embedded | 13 captured events | raw_provenance_repinned |
| `dkpRaw` | not embedded | 13 captured events | raw_provenance |
| `articles` | 10/17, 2:27 PM PT | 522 records; 24 unresolved; 19 metadata-only and 63 suspected ingestion caps overall | conditional_andy_gate_decision |
| `canonical` | not embedded | 394 legacy structured rows | historical_inventory_only |
| `podcastManifest` | not embedded | 57 legacy transcript records | historical_inventory_only |
| `roster` | 10/16, 3:20 PM PT | 32 teams / 2,563 players | pass_under_24h |
| `email_cody` | 10/17, 6:19 AM PT | 23 source rows | reference_only_image_extraction |

FTN is current weekly context by Andy’s decision. The quantitative JSON is rebuilt at 21:11Z on the noon Bookmaker board; narratives match the same board. YouTube is approved: 125 source rows, 118 in-scope game signals after excluding futures, awards and Survivor. Their original quotes remain source claims; movement never blocks a packet.

Live-file differences: the article review is 21:27Z, not 21:13Z, and remains blocked on 24 records. The latest BetOnline artifact is 21:15Z with 1,020 rows; CHI@ATL has only four game-market rows and no player props. No superseded BetOnline prices were restored.

The model’s missing SuperContest warning is a script-path mismatch (`week-06-2026-verified-lines.json` versus actual `week-06-lines.json`). The actual locked lines are separately pinned; no script was changed.

## Exact article-gate remainder

Source gate: **blocked, not waived**. 20 records have no extracted selection; 4 have body-evidence problems. The four body IDs are **8332, 8208, 8187, 8303**. Records 8108 and 8136 have manual analyst-lead dispositions and are not promoted. All-game records 8332/8054 make the condition conservatively applicable to every packet; team-tag mappings are candidates, not verified relevance.

| ID | Status | Body | Scope assessment | Title / source |
|---|---|---|---|
| 8368 | unresolved_no_selection_extracted | body_available | current_slate_candidate_requires_review | [NFL Odds Sunday: 61% Spread System Leads Smartest Week 6 Picks ...](https://www.actionnetwork.com/nfl/nfl-odds-sunday-picks-betting-week-6) |
| 8369 | unresolved_no_selection_extracted | body_available | current_slate_candidate_requires_review | [NFL London Odds: Delicious TD Edge Fuels +363 Texans vs Jaguars Parlay ...](https://www.actionnetwork.com/nfl/nfl-london-odds-parlay-texans-vs-jaguars-week-6) |
| 8245 | unresolved_no_selection_extracted | body_available | current_slate_candidate_requires_review | [Baltimore Ravens vs. Cleveland Browns Best Picks & Predictions ...](https://www.actionnetwork.com/nfl/baltimore-ravens-vs-cleveland-browns-best-picks-predictions) |
| 8238 | unresolved_no_selection_extracted | body_available | current_slate_candidate_requires_review | [Packers vs Cowboys Picks, Predictions & Parlay Options ...](https://www.actionnetwork.com/nfl/packers-vs-cowboys-picks-predictions-parlay-options) |
| 7919 | unresolved_no_selection_extracted | body_available | current_slate_candidate_requires_review | [5 NFL Picks & Predictions on Kalshi for Week 6: Seahawks, Broncos, Chiefs and More ...](https://www.actionnetwork.com/nfl/5-nfl-trades-for-week-6-seahawks-broncos-chiefs-kalshi) |
| 8332 | unresolved_body_evidence | suspected_ingest_cap | current_slate_candidate_requires_review | [NFL Betting Primer, Picks & Predictions: Week 6 (2026)](https://www.bettingpros.com/articles/nfl-betting-primer-picks-predictions-week-6-2026/) |
| 8333 | unresolved_no_selection_extracted | body_available | current_slate_candidate_requires_review | [NFL Player Props & Bets: Texans vs. Jaguars (Week 6)](https://www.bettingpros.com/articles/nfl-player-props-bets-texans-vs-jaguars-week-6-2026/) |
| 8336 | unresolved_no_selection_extracted | body_available | current_slate_candidate_requires_review | [NFL Week 6 Picks: Sleepers & Longshot Bets (2026)](https://www.bettingpros.com/articles/nfl-week-6-picks-sleepers-longshot-bets-2026/) |
| 8339 | unresolved_no_selection_extracted | body_available | current_slate_candidate_requires_review | [NFL Week 6 PrizePicks Player Predictions: Sunday (2026)](https://www.bettingpros.com/articles/nfl-week-6-prizepicks-player-predictions-sunday-2026/) |
| 7883 | unresolved_no_selection_extracted | body_available | completed_game_only_excluded_from_packets | [NFL Thursday Night Football Picks: Seahawks vs. Broncos (Week 6)](https://www.bettingpros.com/articles/nfl-thursday-night-football-picks-seahawks-vs-broncos-week-6/) |
| 8331 | unresolved_no_selection_extracted | body_available | current_slate_candidate_requires_review | [NFL Week 6 predictions: Upsets, fantasy sleepers, stat lines, TD scorers, more](https://www.espn.com/nfl/story/_/id/50189544/week-6-predictions-upsets-fantasy-sleepers-stats-2026) |
| 8208 | unresolved_body_evidence | suspected_ingest_cap | current_slate_candidate_requires_review | [NFL Week 6 betting guide: Analysis, best bets and TD predictions](https://www.espn.com/espn/betting/story/_/id/50133296/week-6-nfl-odds-touchdown-props-best-bets-sunday-preview) |
| 8185 | unresolved_no_selection_extracted | body_available | fantasy_or_DFS_context_not_weekly_betting_evidence | [The Week 6 QB shuffle: Six quarterbacks to pick up if yours is underperforming](https://www.espn.com/fantasy/football/story/_/id/50190576/fantasy-football-start-sit-week-6-quarterbacks) |
| 8187 | unresolved_body_evidence | suspected_ingest_cap | current_slate_candidate_requires_review | [NFL Week 6 preview: Picks, predictions, schedule, betting odds, fantasy tips](https://www.espn.com/nfl/story/_/id/50188997/week-6-picks-predictions-schedule-fantasy-odds-2026) |
| 8164 | unresolved_no_selection_extracted | body_available | completed_game_only_excluded_from_packets | [Broncos beat the Seahawks 17-14 in OT on Ja'Quan McMillian's pick, Wil Lutz's 53-yarder](http://www.espn.com/nfl/recap?gameId=401872995) |
| 8054 | unresolved_no_selection_extracted | body_available | current_slate_candidate_requires_review | [PFT's Week 6 2026 NFL picks](https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/pfts-week-6-2026-nfl-picks) |
| 8354 | unresolved_no_selection_extracted | body_available | fantasy_or_DFS_context_not_weekly_betting_evidence | [Week 6 DFS Picks: Core Players and Best Plays](https://www.sharpfootballanalysis.com/fantasy/core-dfs-picks-week-6-2026/) |
| 8355 | unresolved_no_selection_extracted | body_available | fantasy_or_DFS_context_not_weekly_betting_evidence | [Week 6 DFS Picks: Tournament Plays](https://www.sharpfootballanalysis.com/fantasy/tournament-dfs-picks-week-6-2026/) |
| 8356 | unresolved_no_selection_extracted | body_available | fantasy_or_DFS_context_not_weekly_betting_evidence | [Week 6 DFS Picks: Best Game and Team Stacks](https://www.sharpfootballanalysis.com/fantasy/dfs-stacks-week-6-2026/) |
| 8303 | unresolved_body_evidence | metadata_only | current_slate_candidate_requires_review | [From @WunderdogSports: My picks here have been on a little slide, so it's time to mix it up.](https://x.com/VSiNLive/status/2111235179192996248) |
| 8365 | unresolved_no_selection_extracted | body_available | current_slate_candidate_requires_review | [Average Joe Contest NFL Consensus Picks Week 6](https://vsin.com/nfl/average-joe-contest-nfl-consensus-picks-week-6/) |
| 8266 | unresolved_no_selection_extracted | body_available | current_slate_candidate_requires_review | [Favorite Week 6 NFL Player Props from Dustin Swedelson and OptaAI](https://vsin.com/nfl/favorite-week-6-nfl-player-props-from-dustin-swedelson-and-optaai/) |
| 8207 | unresolved_no_selection_extracted | body_available | current_slate_candidate_requires_review | [NFL Player Prop Bets for Week 6 from Adam Burke](https://vsin.com/nfl/nfl-player-prop-bets-for-week-6-from-adam-burke/) |
| 8007 | unresolved_no_selection_extracted | body_available | current_slate_candidate_requires_review | [Circa Friday Football Invitational Picks Hit 55.2% Win Rate Through Five Weeks](https://vsin.com/nfl/circa-friday-football-invitational-picks-hit-55-2-win-rate-through-five-weeks-2/) |

The completed-game/fantasy/DFS rows above are audit-only unresolved source records; they are excluded from game evidence. No underlying article disposition was changed in this task.

## Per-game manifests

### HOU@JAX — CONDITIONAL

Sun 10/18 06:30 PT. Packet SHA-256: `8697ff83e953a8634b8e2c80500e3e60240e4f83482b5614d168a0eb53e16cf9`.

- Market: JAX -2.5 / 43.5 opener → JAX -2.5 / 42 noon baseline. Captured ML HOU +123, JAX -137. No live executable-price claim.
- Model: noon anchor matches exactly. Projection source: projection: HOU 18.7, JAX 23.5. Provisional context, not a new recommendation.
- QB evidence: HOU C.J. Stroud (captured ESPN depth chart not team confirmation); JAX Trevor Lawrence (captured ESPN depth chart not team confirmation). Official inactives decide.
- Weather: review_required: gusts 42.8 km/h. Kickoff-day/venue condition still applies.
- Approved signals: 9. Article gate IDs associated with this game: 8369, 8332, 8333, 8331, 8054, 8207. Every signal retains source, quote, review timestamp, raw fields and movement metadata in JSON.
- Props: BKR 456 rows / 396 price-and-roster-matched player rows; BEO 194 rows / 152 price-and-roster-matched player rows. Counts include both sides and ladders; gaps are coverage notes only.
- Splits: home spread tickets/money 56%/51%; over tickets/money 45%/68%. Moneyline withheld as stale; SuperContest spread-only.
- Conditions: ARTICLE_GATE_DECISION — Andy must decide whether to resolve or explicitly waive the unresolved article evidence gate. A launch signal alone is not a waiver. OFFICIAL_INACTIVES — Refresh official inactives; current captured depth chart/operator record is not final inactive confirmation. KICKOFF_WEATHER — Refresh forecast; confirm ATL/IND roof and LV indoor venue treatment where applicable.
- Cautions: No additional hard blocker beyond the named conditions. Named source restrictions remain in effect.
- Counter-case: queued for a future authorized session; current narrative counter-case and exact evidence selectors are pinned, no new thesis formed.

### NYJ@NE — CONDITIONAL

Sun 10/18 10:00 PT. Packet SHA-256: `32639e9e131a08623daa7fbe0baa73bde2b0caf1115fd1d371c8e1a7fa730e4a`.

- Market: NE -7.5 / 44.5 opener → NE -7 / 43.5 noon baseline. Captured ML NYJ +284, NE -338. No live executable-price claim.
- Model: noon anchor matches exactly. Projection source: projection: NYJ 18.7, NE 24.4. Provisional context, not a new recommendation.
- QB evidence: NYJ Geno Smith (captured ESPN depth chart not team confirmation); NE Drake Maye (captured ESPN depth chart not team confirmation). Official inactives decide.
- Weather: no_material_flag_in_current_forecast. Kickoff-day/venue condition still applies.
- Approved signals: 12. Article gate IDs associated with this game: 8332, 8339, 8054, 8365, 8266. Every signal retains source, quote, review timestamp, raw fields and movement metadata in JSON.
- Props: BKR 406 rows / 346 price-and-roster-matched player rows; BEO 52 rows / 4 price-and-roster-matched player rows. Counts include both sides and ladders; gaps are coverage notes only.
- Splits: home spread tickets/money 74%/72%; over tickets/money 59%/67%. Moneyline withheld as stale; SuperContest spread-only.
- Conditions: ARTICLE_GATE_DECISION — Andy must decide whether to resolve or explicitly waive the unresolved article evidence gate. A launch signal alone is not a waiver. OFFICIAL_INACTIVES — Refresh official inactives; current captured depth chart/operator record is not final inactive confirmation. KICKOFF_WEATHER — Refresh forecast; confirm ATL/IND roof and LV indoor venue treatment where applicable. AJ_BROWN_STATUS — No Brown leg until current status check; game-level analysis can proceed conditionally.
- Cautions: A.J. Brown status before any Brown leg.
- Counter-case: queued for a future authorized session; current narrative counter-case and exact evidence selectors are pinned, no new thesis formed.

### PIT@TB — CONDITIONAL

Sun 10/18 10:00 PT. Packet SHA-256: `e91307903ba1fd342e982de30d63d2d2c1167ba77bd857b253cc534f8c080885`.

- Market: TB +2.5 / 40.5 opener → TB +2.5 / 39 noon baseline. Captured ML PIT -141, TB +123. No live executable-price claim.
- Model: noon anchor matches exactly. Projection source: projection: PIT 20.4, TB 18.9. Provisional context, not a new recommendation.
- QB evidence: PIT Aaron Rodgers (captured ESPN depth chart not team confirmation); TB Jalon Daniels (operator recorded official inactives pending). Official inactives decide.
- Weather: no_material_flag_in_current_forecast. Kickoff-day/venue condition still applies.
- Approved signals: 9. Article gate IDs associated with this game: 8368, 8238, 8332, 8336, 8208, 8054, 8365, 8207. Every signal retains source, quote, review timestamp, raw fields and movement metadata in JSON.
- Props: BKR 429 rows / 294 price-and-roster-matched player rows; BEO 40 rows / 4 price-and-roster-matched player rows. Counts include both sides and ladders; gaps are coverage notes only.
- Splits: home spread tickets/money 29%/25%; over tickets/money 81%/76%. Moneyline withheld as stale; SuperContest spread-only.
- Conditions: ARTICLE_GATE_DECISION — Andy must decide whether to resolve or explicitly waive the unresolved article evidence gate. A launch signal alone is not a waiver. OFFICIAL_INACTIVES — Refresh official inactives; current captured depth chart/operator record is not final inactive confirmation. KICKOFF_WEATHER — Refresh forecast; confirm ATL/IND roof and LV indoor venue treatment where applicable.
- Cautions: Mayfield OUT per captured reports; Daniels operator-recorded; official inactives decide. Najee source items dropped; do not reintroduce them.
- Counter-case: queued for a future authorized session; current narrative counter-case and exact evidence selectors are pinned, no new thesis formed.

### BAL@CLE — CONDITIONAL

Sun 10/18 10:00 PT. Packet SHA-256: `4058d090b3e7c560e8660a27e050d61e06dadf8ebb066235879e2585ccf70afe`.

- Market: CLE +4.5 / 41 opener → CLE +3 / 40.5 noon baseline. Captured ML BAL -171, CLE +154. No live executable-price claim.
- Model: noon anchor matches exactly. Projection source: projection: BAL 21.2, CLE 18.7. Provisional context, not a new recommendation.
- QB evidence: BAL Tyler Huntley (operator recorded official inactives pending); CLE Deshaun Watson (captured ESPN depth chart not team confirmation). Official inactives decide.
- Weather: no_material_flag_in_current_forecast. Kickoff-day/venue condition still applies.
- Approved signals: 8. Article gate IDs associated with this game: 8245, 8332, 8331, 8054. Every signal retains source, quote, review timestamp, raw fields and movement metadata in JSON.
- Props: BKR 60 rows / 0 price-and-roster-matched player rows; BEO 66 rows / 50 price-and-roster-matched player rows. Counts include both sides and ladders; gaps are coverage notes only.
- Splits: home spread tickets/money 41%/46%; over tickets/money 80%/71%. Moneyline withheld as stale; SuperContest spread-only.
- Conditions: ARTICLE_GATE_DECISION — Andy must decide whether to resolve or explicitly waive the unresolved article evidence gate. A launch signal alone is not a waiver. OFFICIAL_INACTIVES — Refresh official inactives; current captured depth chart/operator record is not final inactive confirmation. KICKOFF_WEATHER — Refresh forecast; confirm ATL/IND roof and LV indoor venue treatment where applicable.
- Cautions: Lamar OUT per captured reports; Huntley operator-recorded; official inactives decide. Makinen BAL -4.5 depended on Lamar playing and is void.
- Counter-case: queued for a future authorized session; current narrative counter-case and exact evidence selectors are pinned, no new thesis formed.

### CHI@ATL — BLOCKED

Sun 10/18 10:00 PT. Packet SHA-256: `71b4e837d42b23d05c65689c99cdfe438a4bfbf5448515932ab53f79f4e5afe3`.

- Market: ATL +2 / 48 opener → ATL +1 / 52.5 noon baseline. Captured ML CHI -119, ATL +105. No live executable-price claim.
- Model: noon anchor matches exactly. Projection source: projection: CHI 27.1, ATL 25.9. Provisional context, not a new recommendation.
- QB evidence: CHI Caleb Williams (UNRESOLVED SUNDAY DECISION); ATL Michael Penix Jr. (captured ESPN depth chart not team confirmation). Official inactives decide.
- Weather: retractable roof (ATL): do_not_apply_outdoor_weather_without_current venue/roof confirmation. Kickoff-day/venue condition still applies.
- Approved signals: 6. Article gate IDs associated with this game: 8332, 8054, 8365, 8207, 8007. Every signal retains source, quote, review timestamp, raw fields and movement metadata in JSON.
- Props: BKR 435 rows / 375 price-and-roster-matched player rows; BEO 4 rows / 0 price-and-roster-matched player rows. Counts include both sides and ladders; gaps are coverage notes only.
- Splits: home spread tickets/money 63%/68%; over tickets/money 69%/70%. Moneyline withheld as stale; SuperContest spread-only.
- Conditions: ARTICLE_GATE_DECISION — Andy must decide whether to resolve or explicitly waive the unresolved article evidence gate. A launch signal alone is not a waiver. OFFICIAL_INACTIVES — Refresh official inactives; current captured depth chart/operator record is not final inactive confirmation. KICKOFF_WEATHER — Refresh forecast; confirm ATL/IND roof and LV indoor venue treatment where applicable.
- Cautions: Caleb Williams expected but not team-confirmed; hold until Sunday decision. Latest BEO capture removed CHI player markets; use no superseded BEO prices.
- Counter-case: queued for a future authorized session; current narrative counter-case and exact evidence selectors are pinned, no new thesis formed.

### TEN@IND — CONDITIONAL

Sun 10/18 10:00 PT. Packet SHA-256: `a44610034f2a19151d50982da98b64fe3469bbdf9b0ba0ac00029c97c00f01c0`.

- Market: IND -7 / 44 opener → IND -7 / 44.5 noon baseline. Captured ML TEN +251, IND -296. No live executable-price claim.
- Model: noon anchor matches exactly. Projection source: projection: TEN 18.8, IND 25.4. Provisional context, not a new recommendation.
- QB evidence: TEN Cam Ward (captured ESPN depth chart not team confirmation); IND Daniel Jones (captured ESPN depth chart not team confirmation). Official inactives decide.
- Weather: retractable roof (IND): do_not_apply_outdoor_weather_without_current venue/roof confirmation. Kickoff-day/venue condition still applies.
- Approved signals: 7. Article gate IDs associated with this game: 8332, 8336, 8187, 8054, 8207. Every signal retains source, quote, review timestamp, raw fields and movement metadata in JSON.
- Props: BKR 422 rows / 320 price-and-roster-matched player rows; BEO 52 rows / 4 price-and-roster-matched player rows. Counts include both sides and ladders; gaps are coverage notes only.
- Splits: home spread tickets/money 76%/86%; over tickets/money 59%/69%. Moneyline withheld as stale; SuperContest spread-only.
- Conditions: ARTICLE_GATE_DECISION — Andy must decide whether to resolve or explicitly waive the unresolved article evidence gate. A launch signal alone is not a waiver. OFFICIAL_INACTIVES — Refresh official inactives; current captured depth chart/operator record is not final inactive confirmation. KICKOFF_WEATHER — Refresh forecast; confirm ATL/IND roof and LV indoor venue treatment where applicable.
- Cautions: No additional hard blocker beyond the named conditions. Named source restrictions remain in effect.
- Counter-case: queued for a future authorized session; current narrative counter-case and exact evidence selectors are pinned, no new thesis formed.

### CAR@PHI — CONDITIONAL

Sun 10/18 10:00 PT. Packet SHA-256: `160369a0fdd78528129f719784e8448e657a47df98225575ba5ac097b9d4d473`.

- Market: PHI -1.5 / 42.5 opener → PHI +3 / 39 noon baseline. Captured ML CAR -173, PHI +157. No live executable-price claim.
- Model: noon anchor matches exactly. Projection source: projection: CAR 21.3, PHI 18.2. Provisional context, not a new recommendation.
- QB evidence: CAR Bryce Young (captured ESPN depth chart not team confirmation); PHI Tanner McKee (operator recorded official inactives pending). Official inactives decide.
- Weather: no_material_flag_in_current_forecast. Kickoff-day/venue condition still applies.
- Approved signals: 10. Article gate IDs associated with this game: 8332, 8331, 8054, 8266, 8207. Every signal retains source, quote, review timestamp, raw fields and movement metadata in JSON.
- Props: BKR 60 rows / 0 price-and-roster-matched player rows; BEO 42 rows / 26 price-and-roster-matched player rows. Counts include both sides and ladders; gaps are coverage notes only.
- Splits: home spread tickets/money 48%/38%; over tickets/money 69%/73%. Moneyline withheld as stale; SuperContest spread-only.
- Conditions: ARTICLE_GATE_DECISION — Andy must decide whether to resolve or explicitly waive the unresolved article evidence gate. A launch signal alone is not a waiver. OFFICIAL_INACTIVES — Refresh official inactives; current captured depth chart/operator record is not final inactive confirmation. KICKOFF_WEATHER — Refresh forecast; confirm ATL/IND roof and LV indoor venue treatment where applicable. BARKLEY_REPORTER_HEDGE — OUT mapping is unconfirmed reporter hedge; verify before use.
- Cautions: Hurts OUT; McKee starts. Millman CAR +1.5 is pre-Hurts-OUT. Barkley reporter-hedge OUT remains unconfirmed.
- Counter-case: queued for a future authorized session; current narrative counter-case and exact evidence selectors are pinned, no new thesis formed.

### NO@NYG — CONDITIONAL

Sun 10/18 10:00 PT. Packet SHA-256: `666dbaa55ea365c3dcd753157100fce828f16ad20b2881e23fbdb48d726d0b46`.

- Market: NYG -1.5 / 45.5 opener → NYG -1 / 46 noon baseline. Captured ML NO -112, NYG -101. No live executable-price claim.
- Model: noon anchor matches exactly. Projection source: projection: NO 23.0, NYG 23.4. Provisional context, not a new recommendation.
- QB evidence: NO Tyler Shough (captured ESPN depth chart not team confirmation); NYG Jameis Winston (captured ESPN depth chart not team confirmation). Official inactives decide.
- Weather: no_material_flag_in_current_forecast. Kickoff-day/venue condition still applies.
- Approved signals: 9. Article gate IDs associated with this game: 8332, 8339, 8331, 8208, 8187, 8054, 8266. Every signal retains source, quote, review timestamp, raw fields and movement metadata in JSON.
- Props: BKR 404 rows / 283 price-and-roster-matched player rows; BEO 40 rows / 2 price-and-roster-matched player rows. Counts include both sides and ladders; gaps are coverage notes only.
- Splits: home spread tickets/money 55%/56%; over tickets/money 59%/76%. Moneyline withheld as stale; SuperContest spread-only.
- Conditions: ARTICLE_GATE_DECISION — Andy must decide whether to resolve or explicitly waive the unresolved article evidence gate. A launch signal alone is not a waiver. OFFICIAL_INACTIVES — Refresh official inactives; current captured depth chart/operator record is not final inactive confirmation. KICKOFF_WEATHER — Refresh forecast; confirm ATL/IND roof and LV indoor venue treatment where applicable. LIKELY_SOURCE_PRICE — NYG mapping confirmed by Andy; old rationale says Cleveland and +225 is not current verified NYG price. Do not reuse matchup rationale or treat +225 as live.
- Cautions: Likely retained on NYG per Andy; original Cleveland rationale and +225 price require separation.
- Counter-case: queued for a future authorized session; current narrative counter-case and exact evidence selectors are pinned, no new thesis formed.

### ARI@LAR — CONDITIONAL

Sun 10/18 13:05 PT. Packet SHA-256: `0d98e4d8daa66f90677ff2e3f7b1fe2d7a99120480600802d25c385bcbc947d7`.

- Market: LAR -12.5 / 52 opener → LAR -13.5 / 52 noon baseline. Captured ML ARI +613, LAR -746. No live executable-price claim.
- Model: noon anchor matches exactly. Projection source: projection: ARI 20.3, LAR 31.7. Provisional context, not a new recommendation.
- QB evidence: ARI Jacoby Brissett (captured ESPN depth chart not team confirmation); LAR Matthew Stafford (captured ESPN depth chart not team confirmation). Official inactives decide.
- Weather: no_material_flag_in_current_forecast (covered but open-sided: weather can still matter). Kickoff-day/venue condition still applies.
- Approved signals: 8. Article gate IDs associated with this game: 8332, 8336, 8339, 8054, 8303, 8365, 8007. Every signal retains source, quote, review timestamp, raw fields and movement metadata in JSON.
- Props: BKR 421 rows / 361 price-and-roster-matched player rows; BEO 86 rows / 38 price-and-roster-matched player rows. Counts include both sides and ladders; gaps are coverage notes only.
- Splits: home spread tickets/money 68%/64%; over tickets/money 55%/65%. Moneyline withheld as stale; SuperContest spread-only.
- Conditions: ARTICLE_GATE_DECISION — Andy must decide whether to resolve or explicitly waive the unresolved article evidence gate. A launch signal alone is not a waiver. OFFICIAL_INACTIVES — Refresh official inactives; current captured depth chart/operator record is not final inactive confirmation. KICKOFF_WEATHER — Refresh forecast; confirm ATL/IND roof and LV indoor venue treatment where applicable.
- Cautions: No additional hard blocker beyond the named conditions. Named source restrictions remain in effect.
- Counter-case: queued for a future authorized session; current narrative counter-case and exact evidence selectors are pinned, no new thesis formed.

### BUF@LV — CONDITIONAL

Sun 10/18 13:25 PT. Packet SHA-256: `e9701e6ca865b0ca065b7d0b509f7e7049e0c25ff6cf55b2a3a4b5d04ecddc8a`.

- Market: LV +6 / 53.5 opener → LV +4.5 / 53.5 noon baseline. Captured ML BUF -217, LV +194. No live executable-price claim.
- Model: noon anchor matches exactly. Projection source: projection: BUF 28.0, LV 25.4. Provisional context, not a new recommendation.
- QB evidence: BUF Josh Allen (captured ESPN depth chart not team confirmation); LV Kirk Cousins (captured ESPN depth chart not team confirmation). Official inactives decide.
- Weather: fixed dome (LV): outdoor weather does not apply. Kickoff-day/venue condition still applies.
- Approved signals: 10. Article gate IDs associated with this game: 8332, 8336, 8339, 8054, 8365, 8266, 8007. Every signal retains source, quote, review timestamp, raw fields and movement metadata in JSON.
- Props: BKR 368 rows / 308 price-and-roster-matched player rows; BEO 156 rows / 108 price-and-roster-matched player rows. Counts include both sides and ladders; gaps are coverage notes only.
- Splits: home spread tickets/money 38%/45%; over tickets/money 74%/83%. Moneyline withheld as stale; SuperContest spread-only.
- Conditions: ARTICLE_GATE_DECISION — Andy must decide whether to resolve or explicitly waive the unresolved article evidence gate. A launch signal alone is not a waiver. OFFICIAL_INACTIVES — Refresh official inactives; current captured depth chart/operator record is not final inactive confirmation. KICKOFF_WEATHER — Refresh forecast; confirm ATL/IND roof and LV indoor venue treatment where applicable.
- Cautions: No additional hard blocker beyond the named conditions. Named source restrictions remain in effect.
- Counter-case: queued for a future authorized session; current narrative counter-case and exact evidence selectors are pinned, no new thesis formed.

### LAC@KC — CONDITIONAL

Sun 10/18 13:25 PT. Packet SHA-256: `6331ff595587511f58bf35aa32454ab663e90f27b0107e6ba6c183f38978d9a2`.

- Market: KC -7.5 / 43.5 opener → KC -7.5 / 41.5 noon baseline. Captured ML LAC +326, KC -393. No live executable-price claim.
- Model: noon anchor matches exactly. Projection source: projection: LAC 16.0, KC 25.3. Provisional context, not a new recommendation.
- QB evidence: LAC Justin Herbert (captured ESPN depth chart not team confirmation); KC Patrick Mahomes (captured ESPN depth chart not team confirmation). Official inactives decide.
- Weather: no_material_flag_in_current_forecast. Kickoff-day/venue condition still applies.
- Approved signals: 7. Article gate IDs associated with this game: 8368, 7919, 8332, 8187, 8054, 8365, 8266. Every signal retains source, quote, review timestamp, raw fields and movement metadata in JSON.
- Props: BKR 427 rows / 367 price-and-roster-matched player rows; BEO 64 rows / 16 price-and-roster-matched player rows. Counts include both sides and ladders; gaps are coverage notes only.
- Splits: home spread tickets/money 62%/55%; over tickets/money 60%/69%. Moneyline withheld as stale; SuperContest spread-only.
- Conditions: ARTICLE_GATE_DECISION — Andy must decide whether to resolve or explicitly waive the unresolved article evidence gate. A launch signal alone is not a waiver. OFFICIAL_INACTIVES — Refresh official inactives; current captured depth chart/operator record is not final inactive confirmation. KICKOFF_WEATHER — Refresh forecast; confirm ATL/IND roof and LV indoor venue treatment where applicable.
- Cautions: No additional hard blocker beyond the named conditions. Named source restrictions remain in effect.
- Counter-case: queued for a future authorized session; current narrative counter-case and exact evidence selectors are pinned, no new thesis formed.

### DAL@GB — CONDITIONAL

Sun 10/18 17:20 PT. Packet SHA-256: `674601fa88b047f4ccc658d5163b23169da29578efeaec88a11c39b11bb08817`.

- Market: GB +0.5 / 52 opener → GB -1.5 / 53 noon baseline. Captured ML DAL +100, GB -113. No live executable-price claim.
- Model: noon anchor matches exactly. Projection source: projection: DAL 25.8, GB 27.4. Provisional context, not a new recommendation.
- QB evidence: DAL Dak Prescott (captured ESPN depth chart not team confirmation); GB Jordan Love (captured ESPN depth chart not team confirmation). Official inactives decide.
- Weather: no_material_flag_in_current_forecast. Kickoff-day/venue condition still applies.
- Approved signals: 17. Article gate IDs associated with this game: 8238, 8332, 8336, 8331, 8054, 8365, 8207. Every signal retains source, quote, review timestamp, raw fields and movement metadata in JSON.
- Props: BKR 490 rows / 430 price-and-roster-matched player rows; BEO 176 rows / 124 price-and-roster-matched player rows. Counts include both sides and ladders; gaps are coverage notes only.
- Splits: home spread tickets/money 45%/38%; over tickets/money 62%/86%. Moneyline withheld as stale; SuperContest spread-only.
- Conditions: ARTICLE_GATE_DECISION — Andy must decide whether to resolve or explicitly waive the unresolved article evidence gate. A launch signal alone is not a waiver. OFFICIAL_INACTIVES — Refresh official inactives; current captured depth chart/operator record is not final inactive confirmation. KICKOFF_WEATHER — Refresh forecast; confirm ATL/IND roof and LV indoor venue treatment where applicable.
- Cautions: No additional hard blocker beyond the named conditions. Named source restrictions remain in effect.
- Counter-case: queued for a future authorized session; current narrative counter-case and exact evidence selectors are pinned, no new thesis formed.

### WAS@SF — CONDITIONAL

Mon 10/19 17:15 PT. Packet SHA-256: `73ce164c16a7607fd29b2e9d3329a564b323c6ae4f81f200d1c4a4c14298f4ac`.

- Market: SF -7.5 / 51 opener → SF -8 / 51.5 noon baseline. Captured ML WAS +324, SF -390. No live executable-price claim.
- Model: noon anchor matches exactly. Projection source: projection: WAS 21.0, SF 30.2. Provisional context, not a new recommendation.
- QB evidence: WAS Jayden Daniels (captured ESPN depth chart not team confirmation); SF Brock Purdy (captured ESPN depth chart not team confirmation). Official inactives decide.
- Weather: no_material_flag_in_current_forecast. Kickoff-day/venue condition still applies.
- Approved signals: 6. Article gate IDs associated with this game: 8332, 8054, 8266, 8207, 8007. Every signal retains source, quote, review timestamp, raw fields and movement metadata in JSON.
- Props: BKR 426 rows / 332 price-and-roster-matched player rows; BEO 48 rows / 0 price-and-roster-matched player rows. Counts include both sides and ladders; gaps are coverage notes only.
- Splits: home spread tickets/money 76%/80%; over tickets/money 63%/77%. Moneyline withheld as stale; SuperContest spread-only.
- Conditions: ARTICLE_GATE_DECISION — Andy must decide whether to resolve or explicitly waive the unresolved article evidence gate. A launch signal alone is not a waiver. OFFICIAL_INACTIVES — Refresh official inactives; current captured depth chart/operator record is not final inactive confirmation. KICKOFF_WEATHER — Refresh forecast; confirm ATL/IND roof and LV indoor venue treatment where applicable. WEATHER_WIND_GUST_RECONCILIATION — Provider forecast wind 18.6/gust 15.1 km/h needs verification; withhold wind interpretation meanwhile.
- Cautions: WAS/WSH normalized. Forecast wind/gust anomaly affects wind interpretation only.
- Counter-case: queued for a future authorized session; current narrative counter-case and exact evidence selectors are pinned, no new thesis formed.

## Remaining refreshes / decisions

- **ARTICLE_GATE_DECISION** (before packet release): Andy decides whether to resolve/disposition or explicitly waive the 24-record article gate. No waiver inferred. Requeue after decision.
- **CHI_STARTER_UNCONFIRMED** (Sunday morning): Confirm Caleb Williams/team starting-QB decision; then strict roster gate rerun with --fetch when network is available.
- **ROSTER_LAUNCH_PREFLIGHT** (every launch signal; again Sunday morning): Verify existing source pins first, then run strict roster gate. Fetch with network on kickoff day. Any changed roster snapshot requires requeue; BLOCK or snapshot older than 24h refuses launch.
- **KICKOFF_WEATHER_ROOF** (kickoff day): Refresh forecast, confirm ATL/IND retractable-roof status and LV fixed-dome/indoor treatment. Do not apply outdoor weather to LV. Recheck London gusts; reconcile WAS wind/gust anomaly before wind-dependent claims.
- **AJ_BROWN_STATUS** (before any Brown leg): Check current status; captured ESPN day-to-day is not clearance.
- **OFFICIAL_INACTIVES** (near each kickoff): Confirm official inactives; keep Barkley hedge uncertain until verified. Omit unmatched player aliases or unverified prices.
- **OPTIONAL_LANE_REFRESH** (only if a lane is used): Stale moneyline splits remain omitted unless refreshed. Missing props stay unavailable; no game blocker solely for thin coverage or line movement. Likely source +225 is unverified; use NYG mapping but not old opponent rationale.

## Launch contract and validation

`dispatch_allowed: false` and `hold_for_andy: true` mean the preparing chat cannot run synthesis. A launch signal performs verification and returns activation text only. The later fresh session requires Andy to paste that text and all launch-blocking conditions to be satisfied.

Packet hashes use SHA-256 of recursively key-sorted compact UTF-8 JSON. Source pins reside in each packet’s `evidence_manifest` and top-level `sources`. The launch board pins exact queue-file bytes. Check source pins before roster rerun; only its expected report rewrite after PASS may differ. A changed roster snapshot or any other source drift requires requeue.

Resolved prompt mismatches: dispatch_allowed false treated as unconditional failure despite intentional HOLD → Separate controller HOLD from separately authorized fresh-session activation. conditional automatically proceeded without article decision → Explicit launch_blocking conditions require Andy resolution/waiver and requeue. No exact packet hash algorithm or queue-byte pin → Canonical sorted-JSON packet hash and exact saved queue-byte hash in activation. Gate rewrites a pinned report and can cause false drift → Hash before gate; permit only expected receipt rewrite after PASS with unchanged roster source. Fresh roster requires requeue. Source hashes, launch contract hashes and output references underspecified → Name sources/evidence_manifest fields and exact outputs in activation. BEO prose says four full boards but current file removed CHI props → Use latest event-specific capture coverage.

Verified: 13 unique oriented games, 13 packet hashes, 110 source hashes, 4,340 admitted captured-price references, 118 approved signal selectors, current model anchors, future kickoffs, exact template agreement, and excluded evidence absence. No full application test suite was run.

Only queue/launch artifacts and the two authorized launch instruction files were authored. The roster gate regenerated its normal report. No game outputs or RUNLOG lines were created.
