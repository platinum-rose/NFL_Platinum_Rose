# Week 5 — Opus evidence manifest

Proposed analysis only. This is not a card, ticket, pool entry, or official record. Run by Opus in parallel with a separate Astra run; blind to all Astra outputs. Generated 2026-10-10T23:20Z (2026-10-10 16:20 PT).

## Run identity

| Item | Value |
|---|---|
| Prompt | prompts/2026-w05-astra-full-synthesis.md (followed with the user overrides of 2026-10-10 15:38 PT and the revised citation rules of 15:44 PT; "astra" → "opus" in every output path) |
| Outputs | reports/intel/2026-w05-opus-evidence-manifest.md; reports/intel/2026-w05-opus-full-synthesis.md; data/research-intel/proposed/2026-w05-opus-synthesis.json; reports/bets/2026-w05-opus-decision-support.md; reports/intel/2026-w05-opus-synthesis-qa.md (each verified to contain "opus" and not "astra") |
| Blind rule | No file with "astra" in its name and nothing under reports/intel/_bak/ was opened, listed or searched, except the prompt file itself, which the user directed me to follow. git status output was filtered with grep -vi astra. |
| Git HEAD | 7ef79ff (7ef79fff37c4cab99fd3b23699452dc1fafcfcdc) — matches pinned |
| Working tree | 915 status entries (dirty shared checkout, preserved; nothing staged/committed) |
| Preflight time | 2026-10-10T22:38Z (15:38 PT) |
| Pull window | window_start 2026-10-05T04:00:00.000Z (Mon 04:00Z per user; Monday-night Week 4 window not used); pulled_at 2026-10-10T20:44:35.275Z |
| Exclusions honored | data/research-intel/week-exclusions.json (4 rows: Sal Bets Week 4 MNF tweet; AN Isaiah Likely ATD mis-assigned to BAL@ATL; BettingPros Daniel Jones UNDER attempts mis-assigned to NYG@WAS; BettingPros Jayden Daniels OVER rush attempts mis-assigned to TB@DAL); pull carries 262 excluded_signals and 3 excluded_expert rows |
| Completed-game exclusion | ESPN API (site.api.espn.com scoreboard, seasontype=2 week=5) fetched 2026-10-10T22:42Z: TB@DAL STATUS_FINAL (TB 24, DAL 16); all 14 others STATUS_SCHEDULED |

## Preflight checks (run from scratch against disk)

| Check | Expected | Observed | Result |
|---|---|---|---|
| git HEAD | 7ef79ff | 7ef79ff | PASS |
| Calibration JSON SHA-256 | 0ea35592…0fc51 (pinned) | 0ea3559255d4b31fb919d585d9f07fdd542ea2f0bccb5745eb9b73ecd5935d33 | PASS |
| nflverse CSV SHA-256 | 51f76296…f0fc51 (pinned) | 51f762960b078c5a10ab61e79716cdfc22162ba91a357a42b620f1f816f0fc51 | PASS |
| JSON embedded source.sha256 | = pinned CSV hash | 51f762960b078c5a10ab61e79716cdfc22162ba91a357a42b620f1f816f0fc51 | PASS |
| CSV rows / REG with spread+total+result / max result season | 7,548 / 6,967 / 2025 | 7,548 / 6,967 / 2025 | PASS |
| 2026 CSV rows | no scores/results; placeholder lines expected | 272 rows; 0 results; 0 scores; 77 with placeholder spread | PASS (expected, not a contradiction) |
| Default era | 2018–2025, n 2,127, margin SD 12.772, total SD 13.128 | 2018-2025, n 2127, 12.772, 13.128 | PASS |
| Ignored inputs | calibration CSV is git-ignored | .gitignore:74 data/vault-seed/ (CSV ignored); pull/props JSON not ignored, untracked/modified as expected | noted |
| Roster vet (strict, week 5, 2026-10-10) | 0 blocking | PASS — 0 blocking; digest legs 56; 3 QUESTIONABLE info rows; 3 UNVERIFIED secondary absences; ESPN rosters 20.4h old | PASS (run in scratch mirror; see G11) |
| FTN context | 36/36 tables, 4,613 rows, 32 teams, Week 5 capture | 36/36, 4,613, 32 teams, unmapped 0, captured 2026-10-09T21:53:39Z (week 5 file) | PASS |
| BKR coverage/time | 14 games, fresh | 14 games, 5,836 rows, 2026-10-10T22:25:28Z | PASS |
| BEO coverage/time | 14 games, fresh | 14 games, 1,146 rows, 2026-10-10T21:15:15Z | PASS |
| Weather/venue | 14 games accounted | 9 forecasts + 5 venue rows | PASS (gaps per game) |
| Staged-copy integrity | workspace copies = disk | 50/50 SHA-256 match; 6 later stagings (ESPN article, ESPN rosters, BKR/BEO raw mirrors, two handoffs) also match | PASS |

## Freshness of time-sensitive sources

Current time at preflight: 2026-10-10T22:38Z (15:38 PT). Rule: same-day market snapshot older than 6h is stale_for_recommendation; inside 6h of kickoff the maximum is 3h.

| Source | Captured / generated | Threshold / role | Status |
|---|---|---|---|
| data/generated/props/bookmaker-live-2026-10-10-week5.json | 2026-10-10T22:25:28Z–22:27:43Z (per row) | 6h same-day; 3h inside kickoff window | 13 min at preflight — fresh; becomes stale_for_recommendation 2026-10-11T04:25Z (21:25 PT Sat) and for every kickoff window unless re-captured |
| data/generated/props/betonline-live-2026-10-10-week5.json | 2026-10-10T21:15:15Z (file-level; rows carry no capturedAt) | same | 1h23m at preflight — fresh; stale after 2026-10-11T03:15Z |
| data/generated/props/draftkings-predictions-live-2026-10-10-week5.json | 2026-10-10T16:23:47Z | context only (prediction market) | 6h14m at preflight — stale_for_recommendation; used as context only |
| data/generated/master-intel/w05-pull.json#splits | 2026-10-10T17:55:26Z | context only | 4h43m — context |
| data/player-availability/latest.json | generated 2026-10-10T16:45:22Z | event feed; inactives recheck required | 5h53m — usable as gate; official inactives not yet published |
| data/nfl-rosters/espn-full-rosters-latest.json | 2026-10-10T02:16:47Z | roster gate max 24h | 20.4h — PASS now; exceeds 24h at 2026-10-11T02:16Z (19:16 PT Sat) → re-run roster vet before game day |
| data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json | 2026-10-10T17:56:55Z | forecast; refresh near kickoff | 4h41m — forecast only |
| data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json | generated 2026-10-10T17:31:50Z | manual context | 5h06m — context; absences re-validated |
| data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json | capture 2026-10-09T21:41:47Z–21:53:39Z | season-to-date through Week 4 | 24.7h — current for season-to-date tables (no Week 5 games played except TNF, not included: all GP=4) |
| data/generated/team-profiles/team-power-ratings-2026.json | generated 2026-10-10T07:06:04Z | season-to-date | 15.5h — current through Week 4 |
| data/odds/actionnetwork-openers-2026-w05.json | pulled 2026-10-08T03:36:16Z (open recorded 2026-10-05) | opener context only | context |
| data/supercontest/week-05-2026-verified-lines.json | recorded 2026-10-09; source_capture_time null | contest line only | user-verified; no capture time |
| data/vault-seed/nflverse/player_stats_weekly.csv | mtime 2026-10-06T18:44:56Z; max week 4 | player 2026 form | expected (Week 4 latest completed) |

## SHA-256 manifest (computed on disk at HEAD 7ef79ff before model reading)

| SHA-256 | Path |
|---|---|
| c5628b4aa5602990ac046f3d11874743671592483c6372f8e0c987c5868eb9de | data/generated/master-intel/w05-pull.json |
| 5fe1d48a2513f5ac0a6f9198078638c5233ea74bfad7c58d40fbd92511dcd1f5 | data/generated/master-intel/w05-expert-verified.json |
| 1f6283afce94ed5f88cada1921697f233aa3edcd7610209af181fb49b2caf239 | data/generated/master-intel/w05-article-gemini-picks.json |
| 0f08691e65b8812a271db20cb5aaeee8a0ccd6f57f5e4592722ad232edd3b9af | data/research-intel/week-exclusions.json |
| e8ec4fe5b40bc678d82cf124bb86ee109bf4934e7820059cf9f3402c99159e45 | data/generated/props/bookmaker-live-2026-10-10-week5.json |
| 227cde7166332d3c804219162d6aeefefa09b5264759d4330131ed5430a16925 | data/generated/props/betonline-live-2026-10-10-week5.json |
| 6330f705bb6d01edcb906a840761737ff76242ebf322ab434714856c4af672dc | data/generated/props/draftkings-predictions-live-2026-10-10-week5.json |
| 836b11a4d6f3b4e43d4629e89ee8ef688155c833f22e5740b5d7198b8dfd2544 | data/supercontest/week-05-2026-verified-lines.json |
| ba977a355909b9826e966cf2e2271233c5636605289a58674f6422b126aba446 | data/odds/actionnetwork-openers-2026-w05.json |
| c030473bd752a162edfe9dd844ed0dfd5dbc3f3ce0b4b9126891dad8a1801fc3 | data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json |
| e23a6e48f0bd60f2969a7095c6752460e8087347e04ebe80c100fef9eabb4f25 | data/generated/team-profiles/team-power-ratings-2026.json |
| fdfa2f6309defc421756220a7126eeecd6e5c5a2e97358d24c7bbfa197dcac58 | data/generated/team-profiles/team-coaching-tendency-snapshots-2026-w2.json |
| 1f19496c3b8a01880e816942aa802e395d1063f45beab66f3c2b097618735aed | data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json |
| 98c16306da7a27f489c243ac08ac09c8162eaee6a6e0134375e48484d560b716 | data/player-availability/impact-digest-latest.json |
| 92ab7e25de80436a8f2082407f7cb3466edc94103790b02b6e73016f604b4cb4 | data/player-availability/latest.json |
| bc01261c74cab070914a3e5e164103d585cc9e379a7dfb2429a839330b3e495c | data/projected-starters/2026/latest.json |
| a8aa789bce1a299e1770ce4fbc7cfdb0b87748fffa44a0b0b89819f154dcf6b2 | data/nfl-rosters/roster-map-latest.json |
| c9cfd68220052e4ea1493d30b636bc041e0ad41f40a7229c2189abb74f269085 | data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json |
| fa7ee70f0cea94dcdd41bc65866eaf7eafdf10c124fa07654e27ecc4fdcc8cf3 | data/research-intel/review/2026-w05-weather-venue.json |
| 1341dfb25d8a859da2a42253e783b1d36d8aadac2588ec9c2ebc5edbe66606df | data/research-intel/review/player-props-intel-latest.json |
| 533b137843886685a125b690a47b36ff298be9570308c126e4493e78dc2499c8 | reports/intel/master-intel-narratives-2026-w05.md |
| 21aaf322cb40699d7733697e5e2f6b03238c1d7ee158911f62d80d79f64e3845 | scratch/w05-synthesis-digest-sat.md |
| 9e682bd066a36abb67a12932c588b24ad7024713f7aac27a073254f449383394 | data/vault-seed/nflverse/player_stats_weekly.csv |
| ea63e077f142ad0439de69d8bc320e720912b9ca2115e3b8213915ea0e9073f3 | data/projected-starters/2026/manual/week-usage-locks.json |
| dd61c5071093833a55e4c37c74acca55afb76b061cb9adbdcd720ae18e50e988 | data/research-intel/proposed/2026-w05-quantitative-synthesis.json |
| 1d856303757fdb2c1993ce1598a5cbaff28b333f1ad4d34c1475e03a43c885ac | reports/intel/2026-w05-quantitative-synthesis.md |
| 6cd77f61cc6be852eeceba34276359e328575f4a99e8a109a5f9b9bab866af0b | data/research-intel/proposed/2026-w05-expanded-decision-support.json |
| bf568e6863918f778ebff89081cb95feed06d690deda69c9065b7b7287ea236a | reports/bets/2026-w05-expanded-decision-support.md |
| f4d667250c215815a56ca39fa2cf99a4209757c556db7f409ce1470b7b60bee9 | docs/POSTMORTEM_DATA.md |
| b97ad3c709231ce870442d8d9364003c814393166aed8f38c7e2f5b4eb6953a6 | reports/bets/season-recap/expert_sides.json |
| 3c5268f9b7daf645e658402778aa302dfb33a745c5d82b4f8523c5015e0573ee | reports/bets/season-recap/expert_props.json |
| 25fbdfa76f817acc454407f92dc5fe9728b89916afb9b1e589621c79bd88e3f8 | data/prediction-markets/cross-market-coherence-latest.json |
| 4ddfc1b7029ed449ba32f56519f865534fb4787f296f534f5dab0bb97557ad06 | data/official-picks/user-placed-wagers-2026.json |
| f6569c27766fa7237a748b04e74ca577a2e0f64ff7925b28f2407ef73684983a | public/schedule.json |
| 0ea3559255d4b31fb919d585d9f07fdd542ea2f0bccb5745eb9b73ecd5935d33 | data/research-intel/proposed/2026-w05-historical-market-calibration.json |
| 51f762960b078c5a10ab61e79716cdfc22162ba91a357a42b620f1f816f0fc51 | data/vault-seed/nflverse/games-full-1999-2026.csv |
| 6bb47bc684fb7d2c1aeebe9f053644acad09adc59488631433b97e4529abc9c0 | data/research-intel/normalized-review/2026-10-09-action-network-sunday-attributable-selections.json |
| 3db334be97944720f4ea70a94dbd536c935f03914b49934805514e2de39658d2 | data/research-intel/source-evidence/2026-10-09-action-network-week5-betting-splits-raw.json |
| 9fe263cc281b476e8731794a2ce0ec9951eb5833bd6ef120f5188ff2e20446ab | data/research-intel/source-evidence/2026-10-09-action-network-week5-live-picks-raw.jsonl |
| 2002f025436d7aa703b1b79fec349579596f05121146232fab29fa7df2c7b83c | data/research-intel/normalized-review/2026-10-09-friday-podcast-attributable-intel.json |
| 1b849c0fbeecf4389ddeaa7e348240abbd9f79e45dd439b6c5c306c153cc0db1 | data/pickem/pools-2026.json |
| 5bc221b06d44263bcf52dccafe7567d0d06d33072344b86a3ac114f652e9de73 | data/survivor/YAHOO_SURVIVOR_WEEK_5_REPORT.md |
| 343cd5f450ef22a4ad4eaa543fa1d33b9449a7b324741b94d4f359602d2e1928 | data/research-intel/hypothesis-ledger/2026-w05-pilot.json |
| d4d17baf9cfdd09f888074a2d9f9e4e8edf7d6a594dac61f8910bde410d78670 | reports/bets/2026-w05-card.md |
| b0403ceea62489b3e4913a3fb944362827ac984083e23af5469afca2fbb45ad1 | data/research-intel/source-evidence/2026-10-10-user-yahoo-availability-conflict-notes.json |
| de22653b916d1b3e4c3f2234eb7fabc858c4676fa459eb06d0dc9349e985b7f3 | data/research-intel/source-evidence/2026-10-10-vsin-week5-current-feed.json |
| 378cb962a610443aa4ddb85366472dc121803eec57da3a945606cd4b49fc8c17 | data/research-intel/source-evidence/2026-10-10-bettingpros-week5-current-articles.json |
| e40bb78d8f4b5e26241632bdf8eb626e3c9b3044eae15071aaecaa29ce5d705c | data/podcasts/youtube-extracted-picks-2026-w05.json |
| cc74d6b6e4a60353ad1e7e2deaff198c6e9eb509556550e90c9963df84f765c8 | data/expert-dossiers/latest.json |
| f8d414c4a1bcc7a29c35eb3988044e101e359955a29cd16b96bcf1e1298b676f | data/research-intel/review/article-intel-review-latest.json |
| 438c507d04e1b83c0d355716123a3bd927a359eaf88e2b048cd8ca5445a4ff12 | data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md |

## Source inventory (groups A–F per prompt; X = diagnostic/contest/pool context)

| Grp | Path | Time | Coverage | Role | Classification |
|---|---|---|---|---|---|
| A | data/generated/props/bookmaker-live-2026-10-10-week5.json | 2026-10-10T22:25Z | 14/14 games; 5,836 rows; game/period lines all games; player props 13/14 (SF@SEA none); 388 parser-review rows | market baseline (sides/totals/ML) + prop offers | numeric |
| A | data/generated/props/bookmaker-live-2026-10-10-week5.raw.txt | 2026-10-10T22:27Z | raw DOM mirror | raw evidence | context-only |
| A | data/generated/props/betonline-live-2026-10-10-week5.json | 2026-10-10T21:15Z | 14/14 games; 1,146 rows; 130 players; 24 markets; player props 12/14 (MIN@NO, BUF@LAR none) | second captured book; line agreement; O/U prop main lines | numeric |
| A | data/generated/props/betonline-live-2026-10-10-week5.raw.txt | 2026-10-10T21:16Z | raw DOM mirror | raw evidence | context-only |
| A | data/generated/props/draftkings-predictions-live-2026-10-10-week5.json | 2026-10-10T16:23Z | 14 games; game lines + ATD/first/2+ TD contracts | prediction-market context; not executable | stale / context-only |
| A | data/supercontest/week-05-2026-verified-lines.json | recorded 2026-10-09 | 15 lines (TB@DAL included) | contest reference | context-only (contest) |
| A | data/odds/actionnetwork-openers-2026-w05.json + data/generated/odds/actionnetwork-history-2026-w05/ | 2026-10-08T03:36Z | 15 games | opener/movement context | context-only |
| A | data/generated/master-intel/w05-pull.json#splits | 2026-10-10T17:55Z | 15 games | public splits | context-only |
| A | data/research-intel/normalized-review/2026-10-09-action-network-sunday-attributable-selections.json; data/research-intel/source-evidence/2026-10-09-action-network-week5-live-picks-raw.jsonl; ...-betting-splits-raw.json | 2026-10-09 | AN picks/splits | research_only (no rule-2 trace) | qualitative |
| B | data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json | 2026-10-09T21:53Z | 36/36 tables; 4,613 rows; 32 teams; 0 unmapped | numeric team analytics (25% blend weight) | numeric |
| B | data/generated/team-profiles/team-power-ratings-2026.json | 2026-10-10T07:06Z | 32 teams; SRS/net PPG/pythag | separate power signal (15% margin weight) | numeric |
| B | data/generated/team-profiles/team-dvoa-snapshots-2026.json | retired | — | not read (retired by prompt) | excluded |
| B | data/generated/team-profiles/team-coaching-tendency-snapshots-2026-w2.json | generated 2026-10-10T02:01Z; sample 2026-09-10..09-20 (2 games) | only neutral_pass_rate populated | stale historical context | stale |
| B | data/secondary-matchups/secondary-matchup-vulnerability-2026-w05.json | 2026-10-10T17:31Z | 15 games / 30 matchups | manual matchup context (qualitative, capped) | context-only |
| C | data/player-availability/latest.json | 2026-10-10T16:45Z | 1,173 events / 32 teams | availability gate | numeric gate (not points) |
| C | data/player-availability/impact-digest-latest.json | 2026-10-10T16:45Z | 800 digest events | starter-impact context | context-only |
| C | data/projected-starters/2026/latest.json | 2026-10-10T16:45Z | estimated, incomplete depth | context | context-only |
| C | data/nfl-rosters/roster-map-latest.json + espn-full-rosters-latest.json | 2026-10-10T19:52Z / 02:16Z | 2,562 players | roster gate | numeric gate |
| C | data/research-intel/source-evidence/2026-10-10-week5-weather-openmeteo.json + data/research-intel/review/2026-w05-weather-venue.json | 2026-10-10T17:56Z | 9 outdoor forecasts; 5 venue-verification rows | weather/venue context | context-only |
| C | public/schedule.json | 2026-10-06 | home lines (stale) | identity cross-check only | stale |
| D | data/generated/master-intel/w05-pull.json | pulled 2026-10-10T20:44:35Z | 421 signals / 840 notes / 205 expert / 262 excluded signals | corpus | qualitative |
| D | data/generated/master-intel/w05-expert-verified.json | 2026-10-10T20:44:36Z | 633 rows: 460 verified / 132 reject / 41 not_pick | verifier; row-ID source | qualitative (19 qualified / 441 research_only) |
| D | data/generated/master-intel/w05-article-gemini-picks.json | 2026-10-10T20:38:33Z | 7 articles (3 TNF) | rule-2 match set | qualitative |
| D | data/research-intel/source-evidence/2026-10-10-vsin-week5-current-feed.json | 2026-10-10T18:25Z | 10 records w/ bodies | verbatim trace source (VSiN) | qualitative |
| D | data/intel/articles/2026-w05/espn-nfl/espn-betting-story---id-50107426-week-5-nfl-odds-props-best-bets-sunday-games.md | captured 2026-10-09T13:05Z | body truncated at 20,000/23,082 chars | verbatim trace source (ESPN) | qualitative |
| D | data/research-intel/review/player-props-intel-latest.json | 2026-10-10T19:52Z | 20 props | props intel (research_only) | qualitative |
| D | data/podcasts/youtube-extracted-picks-2026-w05.json | 2026-10-10T19:58Z | 49 picks, pending_andy_review | research_only | qualitative |
| D | reports/intel/master-intel-narratives-2026-w05.md; scratch/w05-synthesis-digest-sat.md | 07:21Z / 21:17Z | prior synthesis | audited, not copied | context-only (tiers unreliable — rule 5) |
| E | data/vault-seed/nflverse/player_stats_weekly.csv | 2026-10-06T18:44Z | 2026 weeks 1–4, 4,449 rows | 2026 player form for prop usage context | numeric context |
| E | data/projected-starters/2026/manual/week-usage-locks.json | 2026-10-10T02:01Z | small seed | flagged usage seed | context-only |
| F | data/research-intel/proposed/2026-w05-quantitative-synthesis.json (+ .md) | 2026-10-10T16:59Z | 14 games | audited baseline | excluded (sign defect, see Gaps) |
| F | data/research-intel/proposed/2026-w05-expanded-decision-support.json (+ .md) | 2026-10-10T16:50Z | menus | broad menu only | context-only (not used) |
| F | data/research-intel/proposed/2026-w05-historical-market-calibration.json | 2026-10-10T22:03:55Z | 4 eras; default 2018–2025 n=2,127 | market-only calibration (pinned) | numeric (calibration) |
| F | data/vault-seed/nflverse/games-full-1999-2026.csv | 2026-06-05 file; pinned | 7,548 rows | calibration source + HFA constant | numeric (calibration) |
| X | docs/POSTMORTEM_DATA.md; reports/bets/season-recap/expert_sides.json; expert_props.json; data/expert-dossiers/latest.json | 2026-09-28..10-10 | diagnostics | diagnostic context only; no source weights manufactured | context-only |
| X | data/prediction-markets/cross-market-coherence-latest.json | 2026-10-09T22:01Z | futures/win-total coherence; no Week 5 game-level contracts used | inspected; not a game-level input | excluded |
| X | data/official-picks/user-placed-wagers-2026.json | 2026-10-10T17:00Z | 4 Week 5 records, all TB@DAL, all SETTLED | open-exposure summary only | context-only |
| X | data/pickem/pools-2026.json | updated 2026-10-06T19:35Z | 3 pools; lock per_game_kickoff | pool rules | context |
| X | data/survivor/YAHOO_SURVIVOR_WEEK_5_REPORT.md | 2026-10-10T17:00Z | 2 leagues | data-quality inspection only (survivor not an output) | context-only |

## Game crosswalk (canonical AWAY@HOME from ESPN schedule; never joined on display strings)

| Canonical | Kickoff (UTC) | ESPN id | nflverse id | schedule.json id | AN id | Splits provider id (HOME_AWAY order) | BKR / BEO / DKP event strings | SuperContest file orientation |
|---|---|---|---|---|---|---|---|---|
| PHI@JAX | 2026-10-11T13:30Z | 401872981 | 2026_05_PHI_JAX | nfl_2026_2_w05_PHI_at_JAX | 290820 | 2026_05_JAX_PHI | Philadelphia Eagles @ Jacksonville Jaguars / Philadelphia Eagles @ Jacksonville Jaguars / PHI Eagles @ JAX Jaguars | matches |
| CHI@GB | 2026-10-11T17:00Z | 401872990 | 2026_05_CHI_GB | nfl_2026_2_w05_CHI_at_GB | 290914 | 2026_05_GB_CHI | Chicago Bears @ Green Bay Packers / Chicago Bears @ Green Bay Packers / CHI Bears @ GB Packers | REVERSED (GB@CHI) |
| HOU@TEN | 2026-10-11T17:00Z | 401872984 | 2026_05_HOU_TEN | nfl_2026_2_w05_HOU_at_TEN | 290905 | 2026_05_TEN_HOU | Houston Texans @ Tennessee Titans / Houston Texans @ Tennessee Titans / HOU Texans @ TEN Titans | REVERSED (TEN@HOU) |
| CIN@MIA | 2026-10-11T17:00Z | 401872982 | 2026_05_CIN_MIA | nfl_2026_2_w05_CIN_at_MIA | 290907 | 2026_05_MIA_CIN | Cincinnati Bengals @ Miami Dolphins / Cincinnati Bengals @ Miami Dolphins / CIN Bengals @ MIA Dolphins | REVERSED (MIA@CIN) |
| LV@NE | 2026-10-11T17:00Z | 401872986 | 2026_05_LV_NE | nfl_2026_2_w05_LV_at_NE | 290910 | 2026_05_NE_LV | Las Vegas Raiders @ New England Patriots / Las Vegas Raiders @ New England Patriots / LV Raiders @ NE Patriots | matches |
| MIN@NO | 2026-10-11T17:00Z | 401872987 | 2026_05_MIN_NO | nfl_2026_2_w05_MIN_at_NO | 290906 | 2026_05_NO_MIN | Minnesota Vikings @ New Orleans Saints / Minnesota Vikings @ New Orleans Saints / MIN Vikings @ NO Saints | REVERSED (NO@MIN) |
| CLE@NYJ | 2026-10-11T17:00Z | 401872983 | 2026_05_CLE_NYJ | nfl_2026_2_w05_CLE_at_NYJ | 290908 | 2026_05_NYJ_CLE | Cleveland Browns @ New York Jets / Cleveland Browns @ New York Jets / CLE Browns @ NY Jets | matches |
| IND@PIT | 2026-10-11T17:00Z | 401872985 | 2026_05_IND_PIT | nfl_2026_2_w05_IND_at_PIT | 290909 | 2026_05_PIT_IND | Indianapolis Colts @ Pittsburgh Steelers / Indianapolis Colts @ Pittsburgh Steelers / IND Colts @ PIT Steelers | matches |
| NYG@WAS | 2026-10-11T17:00Z | 401872988 | 2026_05_NYG_WAS | nfl_2026_2_w05_NYG_at_WAS | 290904 | 2026_05_WSH_NYG | New York Giants @ Washington Commanders / New York Giants @ Washington Commanders / NY Giants @ WAS Commanders | matches |
| DEN@LAC | 2026-10-11T20:05Z | 401872989 | 2026_05_DEN_LAC | nfl_2026_2_w05_DEN_at_LAC | 290911 | 2026_05_LAC_DEN | Denver Broncos @ Los Angeles Chargers / Denver Broncos @ Los Angeles Chargers / DEN Broncos @ LA Chargers | REVERSED (LAC@DEN) |
| DET@ARI | 2026-10-11T20:25Z | 401872991 | 2026_05_DET_ARI | nfl_2026_2_w05_DET_at_ARI | 290913 | 2026_05_ARI_DET | Detroit Lions @ Arizona Cardinals / Detroit Lions @ Arizona Cardinals / DET Lions @ ARI Cardinals | REVERSED (ARI@DET) |
| SF@SEA | 2026-10-11T20:25Z | 401872992 | 2026_05_SF_SEA | nfl_2026_2_w05_SF_at_SEA | 290912 | 2026_05_SEA_SF | San Francisco 49ers @ Seattle Seahawks / San Francisco 49ers @ Seattle Seahawks / SF 49ers @ SEA Seahawks | matches |
| BAL@ATL | 2026-10-12T00:20Z | 401872993 | 2026_05_BAL_ATL | nfl_2026_2_w05_BAL_at_ATL | 290915 | 2026_05_ATL_BAL | Baltimore Ravens @ Atlanta Falcons / Baltimore Ravens @ Atlanta Falcons / BAL Ravens @ ATL Falcons | matches |
| BUF@LAR | 2026-10-13T00:15Z | 401872994 | 2026_05_BUF_LA (CSV uses LA) | nfl_2026_2_w05_BUF_at_LAR | 290916 | 2026_05_LAR_BUF | Buffalo Bills @ Los Angeles Rams / Buffalo Bills @ Los Angeles Rams / BUF Bills @ LA Rams | matches |

TB@DAL (2026_05_TB_DAL / nfl_2026_2_w05_TB_at_DAL / split id 2026_05_DAL_TB / ESPN 401872980) is final and excluded.


## Line-agreement table (no pseudo-consensus; BKR is baseline)

| Game | BKR (home line, odds h/a, total, ML a/h) | BEO | DKP (prediction mkt) | AN open | SuperContest | schedule.json home / nflverse placeholder (spread_line>0 = home fav) | Market-implied score (BKR) | BKR−BEO |
|---|---|---|---|---|---|---|---|---|
| PHI@JAX | JAX -7.5 (-113/-103) T42 ML +295/-353 @22:25:28Z | JAX -7.5 (-115/-105) T42 ML +299/-375 @21:15:15Z | JAX -7.5 T42.5 ML p 0.25/0.78 @16:23Z (stale ctx) | JAX -3.5 T43.5 | JAX -7.5 | -7 / -2.5 (stale) | JAX 24.75 – PHI 17.25 | Δspread +0, Δtotal +0 |
| CHI@GB | GB +1.5 (-119/+102) T46 ML -112/-101 @22:27:20Z | GB +1 (-108/-112) T46.5 ML -119/-101 @21:15:15Z | GB +1.5 T45.5 ML p 0.53/0.48 @16:23Z (stale ctx) | GB +1.5 T44.5 | CHI -3 | 3 /  (stale) | CHI 23.75 – GB 22.25 | Δspread +0.5, Δtotal -0.5 |
| HOU@TEN | TEN +7 (-113/-103) T37.5 ML -344/+289 @22:26:41Z | TEN +7 (-110/-110) T38 ML -365/+292 @21:15:15Z | TEN +7.5 T36.5 ML p 0.77/0.25 @16:23Z (stale ctx) | TEN +6.5 T39.5 | HOU -7.5 | 7 / -3.5 (stale) | HOU 22.25 – TEN 15.25 | Δspread +0, Δtotal -0.5 |
| CIN@MIA | MIA +7 (-113/-103) T43.5 ML -310/+263 @22:26:10Z | MIA +7 (-115/-105) T44 ML -330/+267 @21:15:15Z | MIA +6.5 T42.5 ML p 0.76/0.25 @16:23Z (stale ctx) | MIA +7.5 T44.0 | CIN -7 | 7 / -5.5 (stale) | CIN 25.25 – MIA 18.25 | Δspread +0, Δtotal -0.5 |
| LV@NE | NE -3.5 (-109/-107) T45 ML +167/-191 @22:26:21Z | NE -3.5 (-110/-110) T45 ML +160/-183 @21:15:15Z | NE -3.5 T45.5 ML p 0.38/0.65 @16:23Z (stale ctx) | NE -3.5 T45.5 | NE -3.5 | -3.5 / 8.5 (stale) | NE 24.25 – LV 20.75 | Δspread +0, Δtotal +0 |
| MIN@NO | NO +2.5 (-113/-103) T41.5 ML -131/+115 @22:25:48Z | NO +1 (+105/-125) T42 ML -140/+120 @21:15:15Z | NO +2.5 T42.5 ML p 0.57/0.44 @16:23Z (stale ctx) | NO +1.5 T43.0 | MIN -2.5 | 1.5 / -1.5 (stale) | MIN 22.0 – NO 19.5 | Δspread +1.5, Δtotal -0.5 |
| CLE@NYJ | NYJ -2.5 (-107/-109) T39.5 ML +118/-135 @22:26:01Z | NYJ -1 (-125/+105) T39.5 ML +120/-140 @21:15:15Z | NYJ -2.5 T39.5 ML p 0.46/0.57 @16:23Z (stale ctx) | NYJ -1.5 T40.0 | NYJ -2.5 | -2.5 / 2.5 (stale) | NYJ 21.0 – CLE 18.5 | Δspread -1.5, Δtotal +0 |
| IND@PIT | PIT -3 (+103/-118) T43.5 ML +126/-145 @22:25:39Z | PIT -2.5 (-115/-105) T43.5 ML +128/-148 @21:15:15Z | PIT -2.5 T42.5 ML p 0.43/0.59 @16:23Z (stale ctx) | PIT -2.5 T44.5 | PIT -2.5 | -2.5 / 2.5 (stale) | PIT 23.25 – IND 20.25 | Δspread -0.5, Δtotal +0 |
| NYG@WAS | WAS -3.5 (-108/-108) T41.5 ML +159/-182 @22:26:30Z | WAS -3.5 (-111/-109) T41.5 ML +161/-185 @21:15:15Z | WAS -3.5 T42.5 ML p 0.38/0.64 @16:23Z (stale ctx) | WAS -3.5 T44.5 | WAS -3.5 | -3 / 2.5 (stale) | WAS 22.5 – NYG 19.0 | Δspread +0, Δtotal +0 |
| DEN@LAC | LAC +3.5 (-103/-113) T42 ML -194/+170 @22:26:52Z | LAC +3.5 (-108/-112) T42 ML -180/+157 @21:15:15Z | LAC +3.5 T42.5 ML p 0.64/0.37 @16:23Z (stale ctx) | LAC +3.5 T43.5 | DEN -3.5 | 3.5 / 2.5 (stale) | DEN 22.75 – LAC 19.25 | Δspread +0, Δtotal +0 |
| DET@ARI | ARI +5.5 (-106/-110) T54.5 ML -254/+218 @22:27:10Z | ARI +5.5 (-110/-110) T54.5 ML -255/+211 @21:15:15Z | ARI +5.5 T54.5 ML p 0.7/0.32 @16:23Z (stale ctx) | ARI +4.5 T53.5 | DET -5.5 | 4.5 /  (stale) | DET 30.0 – ARI 24.5 | Δspread +0, Δtotal +0 |
| SF@SEA | SEA -3 (-122/+105) T46.5 ML +149/-171 @22:27:01Z | SEA -3 (-118/-102) T46 ML +149/-170 @21:15:15Z | SEA -3.5 T45.5 ML p 0.39/0.62 @16:23Z (stale ctx) | SEA -3 T47.0 | SEA -3 | -2.5 / 3.5 (stale) | SEA 24.75 – SF 21.75 | Δspread +0, Δtotal +0.5 |
| BAL@ATL | ATL -3 (-117/+102) T44 ML +140/-161 @22:27:32Z | ATL -3.5 (+100/-120) T43.5 ML +149/-170 @21:15:15Z | ATL -3.5 T42.5 ML p 0.39/0.62 @16:23Z (stale ctx) | ATL +4.5 T47.5 | ATL -3.5 | -3.5 /  (stale) | ATL 23.5 – BAL 20.5 | Δspread +0.5, Δtotal +0.5 |
| BUF@LAR | LAR -3.5 (-106/-108) T54.5 ML +164/-188 @22:27:43Z | LAR -3.5 (-105/-115) T54.5 ML +153/-175 @21:15:15Z | LAR -3.5 T54.5 ML p 0.39/0.63 @16:23Z (stale ctx) | LAR -2.5 T53.5 | LAR -3 | -2.5 /  (stale) | LAR 29.0 – BUF 25.5 | Δspread +0, Δtotal +0 |

Market-implied score uses favourite = (T+s)/2, underdog = (T−s)/2 with s = |home line| from the BKR capture. nflverse spread_line sign convention is home-favoured positive; schedule.json spread is a home-team handicap; both are stale references only.


## Prop coverage matrix (per game, per book, per family)


**PHI@JAX**

| Family | BKR | BEO | DKP (context) |
|---|---|---|---|
| QB passing | captured_available:70 | captured_available:24 | not published/not captured |
| rushing | captured_available:108 | captured_available:16 | not published/not captured |
| receiving | captured_available:211 | captured_available:48 | not published/not captured |
| rush+rec | not published/not captured | captured_available:2 | not published/not captured |
| fantasy points | not published/not captured | captured_available:16 | not published/not captured |
| TD anytime | captured_available:26 | captured_available:22 | captured_available:21 |
| TD first | captured_available:28 | not published/not captured | captured_available:21 |
| TD 2+ | captured_available:26 | not published/not captured | captured_available:21 |
| TD 3+ | captured_available:27 | not published/not captured | not published/not captured |
| defense/special teams (player) | not published/not captured | not published/not captured | not published/not captured |
| game lines | captured_available:6 | captured_available:6 | captured_available:6 |
| period lines | captured_available:30 | captured_available:10 | not published/not captured |
| team/game specials | not published/not captured | captured_available:26 | not published/not captured |
| team/game specials (kicking) | not published/not captured | captured_available:4 | not published/not captured |
| parser review required | parser review required:28 | not published/not captured | not published/not captured |

**CHI@GB**

| Family | BKR | BEO | DKP (context) |
|---|---|---|---|
| QB passing | captured_available:35 | captured_available:24 | not published/not captured |
| rushing | captured_available:30 | captured_available:12 | not published/not captured |
| receiving | captured_available:114 | captured_available:54 | not published/not captured |
| rush+rec | not published/not captured | captured_available:4 | not published/not captured |
| fantasy points | not published/not captured | captured_available:20 | not published/not captured |
| TD anytime | not published/not captured | captured_available:18 | captured_available:22 |
| TD first | not published/not captured | not published/not captured | captured_available:22 |
| TD 2+ | not published/not captured | not published/not captured | captured_available:22 |
| TD 3+ | not published/not captured | not published/not captured | not published/not captured |
| defense/special teams (player) | not published/not captured | not published/not captured | not published/not captured |
| game lines | captured_available:6 | captured_available:6 | captured_available:6 |
| period lines | captured_available:30 | captured_available:10 | not published/not captured |
| team/game specials | not published/not captured | captured_available:12 | not published/not captured |
| team/game specials (kicking) | not published/not captured | not published/not captured | not published/not captured |
| parser review required | parser review required:28 | not published/not captured | not published/not captured |

**HOU@TEN**

| Family | BKR | BEO | DKP (context) |
|---|---|---|---|
| QB passing | captured_available:70 | not published/not captured | not published/not captured |
| rushing | captured_available:111 | not published/not captured | not published/not captured |
| receiving | captured_available:289 | captured_available:6 | not published/not captured |
| rush+rec | not published/not captured | not published/not captured | not published/not captured |
| fantasy points | not published/not captured | captured_available:20 | not published/not captured |
| TD anytime | not published/not captured | captured_available:14 | captured_available:24 |
| TD first | not published/not captured | not published/not captured | captured_available:24 |
| TD 2+ | captured_available:29 | not published/not captured | captured_available:24 |
| TD 3+ | captured_available:29 | not published/not captured | not published/not captured |
| defense/special teams (player) | not published/not captured | not published/not captured | not published/not captured |
| game lines | captured_available:6 | captured_available:6 | captured_available:6 |
| period lines | captured_available:30 | captured_available:10 | not published/not captured |
| team/game specials | not published/not captured | captured_available:12 | not published/not captured |
| team/game specials (kicking) | not published/not captured | not published/not captured | not published/not captured |
| parser review required | parser review required:28 | not published/not captured | not published/not captured |

**CIN@MIA**

| Family | BKR | BEO | DKP (context) |
|---|---|---|---|
| QB passing | captured_available:35 | not published/not captured | not published/not captured |
| rushing | captured_available:103 | not published/not captured | not published/not captured |
| receiving | captured_available:127 | captured_available:2 | not published/not captured |
| rush+rec | not published/not captured | not published/not captured | not published/not captured |
| fantasy points | not published/not captured | captured_available:12 | not published/not captured |
| TD anytime | not published/not captured | captured_available:6 | captured_available:23 |
| TD first | captured_available:27 | not published/not captured | captured_available:23 |
| TD 2+ | not published/not captured | not published/not captured | captured_available:23 |
| TD 3+ | not published/not captured | not published/not captured | not published/not captured |
| defense/special teams (player) | not published/not captured | not published/not captured | not published/not captured |
| game lines | captured_available:6 | captured_available:6 | captured_available:6 |
| period lines | captured_available:30 | captured_available:10 | not published/not captured |
| team/game specials | not published/not captured | captured_available:12 | not published/not captured |
| team/game specials (kicking) | not published/not captured | not published/not captured | not published/not captured |
| parser review required | parser review required:28 | not published/not captured | not published/not captured |

**LV@NE**

| Family | BKR | BEO | DKP (context) |
|---|---|---|---|
| QB passing | captured_available:70 | not published/not captured | not published/not captured |
| rushing | captured_available:74; captured_unavailable:4 | not published/not captured | not published/not captured |
| receiving | captured_available:209; captured_unavailable:20 | not published/not captured | not published/not captured |
| rush+rec | not published/not captured | not published/not captured | not published/not captured |
| fantasy points | not published/not captured | captured_available:4 | not published/not captured |
| TD anytime | captured_available:25 | not published/not captured | captured_available:21 |
| TD first | captured_available:28 | not published/not captured | captured_available:21 |
| TD 2+ | captured_available:25 | not published/not captured | captured_available:21 |
| TD 3+ | captured_available:26 | not published/not captured | not published/not captured |
| defense/special teams (player) | not published/not captured | not published/not captured | not published/not captured |
| game lines | captured_available:6 | captured_available:6 | captured_available:6 |
| period lines | captured_available:30 | captured_available:10 | not published/not captured |
| team/game specials | not published/not captured | captured_available:12 | not published/not captured |
| team/game specials (kicking) | not published/not captured | not published/not captured | not published/not captured |
| parser review required | parser review required:28 | not published/not captured | not published/not captured |

**MIN@NO**

| Family | BKR | BEO | DKP (context) |
|---|---|---|---|
| QB passing | captured_available:41 | not published/not captured | not published/not captured |
| rushing | captured_available:79; captured_unavailable:13 | not published/not captured | not published/not captured |
| receiving | captured_available:77; captured_unavailable:4 | not published/not captured | not published/not captured |
| rush+rec | not published/not captured | not published/not captured | not published/not captured |
| fantasy points | not published/not captured | not published/not captured | not published/not captured |
| TD anytime | not published/not captured | not published/not captured | captured_available:24 |
| TD first | not published/not captured | not published/not captured | captured_available:24 |
| TD 2+ | not published/not captured | not published/not captured | captured_available:24 |
| TD 3+ | not published/not captured | not published/not captured | not published/not captured |
| defense/special teams (player) | not published/not captured | not published/not captured | not published/not captured |
| game lines | captured_available:6 | captured_available:6 | captured_available:6 |
| period lines | captured_available:30 | captured_available:10 | not published/not captured |
| team/game specials | not published/not captured | not published/not captured | not published/not captured |
| team/game specials (kicking) | not published/not captured | not published/not captured | not published/not captured |
| parser review required | parser review required:28 | not published/not captured | not published/not captured |

**CLE@NYJ**

| Family | BKR | BEO | DKP (context) |
|---|---|---|---|
| QB passing | captured_available:70 | not published/not captured | not published/not captured |
| rushing | captured_available:67; captured_unavailable:17 | not published/not captured | not published/not captured |
| receiving | captured_available:219 | captured_available:10 | not published/not captured |
| rush+rec | not published/not captured | not published/not captured | not published/not captured |
| fantasy points | not published/not captured | captured_available:22 | not published/not captured |
| TD anytime | captured_available:26 | captured_available:16 | captured_available:19 |
| TD first | captured_available:25 | not published/not captured | captured_available:19 |
| TD 2+ | captured_available:29 | not published/not captured | captured_available:19 |
| TD 3+ | captured_available:29 | not published/not captured | not published/not captured |
| defense/special teams (player) | not published/not captured | not published/not captured | not published/not captured |
| game lines | captured_available:6 | captured_available:6 | captured_available:6 |
| period lines | captured_available:30 | captured_available:10 | not published/not captured |
| team/game specials | not published/not captured | captured_available:12 | not published/not captured |
| team/game specials (kicking) | not published/not captured | not published/not captured | not published/not captured |
| parser review required | parser review required:28 | not published/not captured | not published/not captured |

**IND@PIT**

| Family | BKR | BEO | DKP (context) |
|---|---|---|---|
| QB passing | captured_available:70 | not published/not captured | not published/not captured |
| rushing | captured_available:70 | not published/not captured | not published/not captured |
| receiving | captured_available:229 | not published/not captured | not published/not captured |
| rush+rec | not published/not captured | not published/not captured | not published/not captured |
| fantasy points | not published/not captured | captured_available:8 | not published/not captured |
| TD anytime | captured_available:24 | captured_available:18 | captured_available:21 |
| TD first | captured_available:26 | not published/not captured | captured_available:21 |
| TD 2+ | captured_available:26 | not published/not captured | captured_available:21 |
| TD 3+ | captured_available:26 | not published/not captured | not published/not captured |
| defense/special teams (player) | not published/not captured | not published/not captured | not published/not captured |
| game lines | captured_available:6 | captured_available:6 | captured_available:6 |
| period lines | captured_available:30 | captured_available:10 | not published/not captured |
| team/game specials | not published/not captured | captured_available:12 | not published/not captured |
| team/game specials (kicking) | not published/not captured | not published/not captured | not published/not captured |
| parser review required | parser review required:28 | not published/not captured | not published/not captured |

**NYG@WAS**

| Family | BKR | BEO | DKP (context) |
|---|---|---|---|
| QB passing | captured_available:35 | not published/not captured | not published/not captured |
| rushing | captured_available:98 | not published/not captured | not published/not captured |
| receiving | captured_available:94 | captured_available:4 | not published/not captured |
| rush+rec | not published/not captured | not published/not captured | not published/not captured |
| fantasy points | not published/not captured | captured_available:12 | not published/not captured |
| TD anytime | not published/not captured | captured_available:12 | captured_available:24 |
| TD first | not published/not captured | not published/not captured | captured_available:23 |
| TD 2+ | not published/not captured | not published/not captured | captured_available:23 |
| TD 3+ | not published/not captured | not published/not captured | not published/not captured |
| defense/special teams (player) | not published/not captured | not published/not captured | not published/not captured |
| game lines | captured_available:6 | captured_available:6 | captured_available:6 |
| period lines | captured_available:30 | captured_available:10 | not published/not captured |
| team/game specials | not published/not captured | not published/not captured | not published/not captured |
| team/game specials (kicking) | not published/not captured | not published/not captured | not published/not captured |
| parser review required | parser review required:28 | not published/not captured | not published/not captured |

**DEN@LAC**

| Family | BKR | BEO | DKP (context) |
|---|---|---|---|
| QB passing | captured_available:70 | not published/not captured | not published/not captured |
| rushing | captured_available:135 | not published/not captured | not published/not captured |
| receiving | captured_available:122 | captured_available:4 | not published/not captured |
| rush+rec | not published/not captured | not published/not captured | not published/not captured |
| fantasy points | not published/not captured | captured_available:16 | not published/not captured |
| TD anytime | captured_available:26 | captured_available:20 | captured_available:24 |
| TD first | captured_available:24 | not published/not captured | captured_available:24 |
| TD 2+ | captured_available:26 | not published/not captured | captured_available:24 |
| TD 3+ | captured_available:26 | not published/not captured | not published/not captured |
| defense/special teams (player) | not published/not captured | not published/not captured | not published/not captured |
| game lines | captured_available:6 | captured_available:6 | captured_available:6 |
| period lines | captured_available:30 | captured_available:10 | not published/not captured |
| team/game specials | not published/not captured | captured_available:10 | not published/not captured |
| team/game specials (kicking) | not published/not captured | not published/not captured | not published/not captured |
| parser review required | parser review required:24 | not published/not captured | not published/not captured |

**DET@ARI**

| Family | BKR | BEO | DKP (context) |
|---|---|---|---|
| QB passing | captured_available:81 | not published/not captured | not published/not captured |
| rushing | captured_available:79 | not published/not captured | not published/not captured |
| receiving | captured_available:122 | captured_available:10 | not published/not captured |
| rush+rec | not published/not captured | not published/not captured | not published/not captured |
| fantasy points | not published/not captured | captured_available:18 | not published/not captured |
| TD anytime | not published/not captured | captured_available:14 | captured_available:18 |
| TD first | not published/not captured | not published/not captured | captured_available:18 |
| TD 2+ | not published/not captured | not published/not captured | captured_available:18 |
| TD 3+ | not published/not captured | not published/not captured | not published/not captured |
| defense/special teams (player) | not published/not captured | not published/not captured | not published/not captured |
| game lines | captured_available:6 | captured_available:6 | captured_available:6 |
| period lines | captured_available:30 | captured_available:10 | not published/not captured |
| team/game specials | not published/not captured | captured_available:12 | not published/not captured |
| team/game specials (kicking) | not published/not captured | not published/not captured | not published/not captured |
| parser review required | parser review required:28 | not published/not captured | not published/not captured |

**SF@SEA**

| Family | BKR | BEO | DKP (context) |
|---|---|---|---|
| QB passing | not published/not captured | captured_available:24 | not published/not captured |
| rushing | not published/not captured | captured_available:16 | not published/not captured |
| receiving | not published/not captured | captured_available:58 | not published/not captured |
| rush+rec | not published/not captured | captured_available:4 | not published/not captured |
| fantasy points | not published/not captured | captured_available:18 | not published/not captured |
| TD anytime | not published/not captured | captured_available:22 | captured_available:22 |
| TD first | not published/not captured | not published/not captured | captured_available:22 |
| TD 2+ | not published/not captured | not published/not captured | captured_available:22 |
| TD 3+ | not published/not captured | not published/not captured | not published/not captured |
| defense/special teams (player) | not published/not captured | not published/not captured | not published/not captured |
| game lines | captured_available:6 | captured_available:6 | captured_available:6 |
| period lines | captured_available:30 | captured_available:10 | not published/not captured |
| team/game specials | not published/not captured | captured_available:12 | not published/not captured |
| team/game specials (kicking) | not published/not captured | not published/not captured | not published/not captured |
| parser review required | parser review required:28 | not published/not captured | not published/not captured |

**BAL@ATL**

| Family | BKR | BEO | DKP (context) |
|---|---|---|---|
| QB passing | captured_available:70 | captured_available:24 | not published/not captured |
| rushing | captured_available:123 | captured_available:22 | not published/not captured |
| receiving | captured_available:212 | captured_available:50 | not published/not captured |
| rush+rec | not published/not captured | captured_available:4 | not published/not captured |
| fantasy points | not published/not captured | captured_available:20 | not published/not captured |
| TD anytime | not published/not captured | captured_available:4 | captured_available:23 |
| TD first | not published/not captured | not published/not captured | captured_available:23 |
| TD 2+ | not published/not captured | not published/not captured | captured_available:23 |
| TD 3+ | not published/not captured | not published/not captured | not published/not captured |
| defense/special teams (player) | not published/not captured | not published/not captured | not published/not captured |
| game lines | captured_available:6 | captured_available:6 | captured_available:6 |
| period lines | captured_available:30 | captured_available:10 | not published/not captured |
| team/game specials | not published/not captured | not published/not captured | not published/not captured |
| team/game specials (kicking) | not published/not captured | not published/not captured | not published/not captured |
| parser review required | parser review required:28 | not published/not captured | not published/not captured |

**BUF@LAR**

| Family | BKR | BEO | DKP (context) |
|---|---|---|---|
| QB passing | captured_available:69 | not published/not captured | not published/not captured |
| rushing | captured_available:92 | not published/not captured | not published/not captured |
| receiving | captured_available:189 | not published/not captured | not published/not captured |
| rush+rec | not published/not captured | not published/not captured | not published/not captured |
| fantasy points | not published/not captured | not published/not captured | not published/not captured |
| TD anytime | captured_available:27 | not published/not captured | captured_available:21 |
| TD first | captured_available:27 | not published/not captured | captured_available:21 |
| TD 2+ | captured_available:27 | not published/not captured | captured_available:21 |
| TD 3+ | captured_available:27 | not published/not captured | not published/not captured |
| defense/special teams (player) | not published/not captured | not published/not captured | not published/not captured |
| game lines | captured_available:6 | captured_available:6 | captured_available:6 |
| period lines | captured_available:30 | captured_available:10 | not published/not captured |
| team/game specials | not published/not captured | captured_available:12 | not published/not captured |
| team/game specials (kicking) | not published/not captured | not published/not captured | not published/not captured |
| parser review required | parser review required:28 | not published/not captured | not published/not captured |

QB rushing rows (rushing family where the player is a roster QB): PHI@JAX BKR 32; IND@PIT BKR 7; MIN@NO BKR 18; CLE@NYJ BKR 30; CIN@MIA BKR 30; LV@NE BKR 26; NYG@WAS BKR 22; HOU@TEN BKR 7; DEN@LAC BKR 47; DET@ARI BKR 4; CHI@GB BKR 5; BAL@ATL BKR 26; BUF@LAR BKR 26; PHI@JAX BEO 4; CHI@GB BEO 4; SF@SEA BEO 4; BAL@ATL BEO 4.


## Expert / article / podcast accounting (revised rules 1–6)

| Class | Count | Use |
|---|---|---|
| Verified rows on the 14 remaining games | 460 | — |
| Qualified named-expert picks (article, URL, quote traced verbatim to stored source text, matched to w05-article-gemini-picks.json) | 19 | may set tier 2 / count as named-expert pick |
| research_only — expert_feed (no URL; rationale-style quote) | 185 | corroboration tag only |
| research_only — podcast (no URL; extractor rationale) | 134 | corroboration tag only |
| research_only — article not in matched set / untraceable | 122 | corroboration tag only |
| Verifier reject / not_pick (all games) | 132 / 41 | excluded |

Qualified rows: rows[383] CIN@MIA OVER 26.5 (-125) (VSiN); rows[384] CIN@MIA OVER 66.5 (-114) (VSiN); rows[385] DEN@LAC OVER 38.5 (-113) (VSiN); rows[386] DEN@LAC OVER 13.5 (-117) (VSiN); rows[387] IND@PIT UNDER 209.5 (-111) (VSiN); rows[388] MIN@NO OVER 14.5 (-120) (VSiN); rows[390] IND@PIT UNDER 44.5 (-118) (ESPN NFL); rows[391] IND@PIT OVER 105.5 (-114) (ESPN NFL); rows[392] CHI@GB Christian Watson (+195) (ESPN NFL); rows[393] SF@SEA UNDER 45.5 (-105) (ESPN NFL); rows[394] NYG@WAS Washington Commanders -3.5 (ESPN NFL); rows[395] CLE@NYJ UNDER 59.5 (-114) (ESPN NFL); rows[396] BAL@ATL OVER 5.5 (-109) (ESPN NFL); rows[397] LV@NE OVER 30.5 (-109) (ESPN NFL); rows[398] LV@NE OVER 39.5 (+165) (ESPN NFL); rows[399] CHI@GB OVER 3.5 (+123) (ESPN NFL); rows[400] CHI@GB OVER 0.5 (-102) (ESPN NFL); rows[402] HOU@TEN OVER 1.5 (+119) (ESPN NFL); rows[403] CLE@NYJ UNDER 0.5 (+122) (ESPN NFL).


## Gaps and risks

| ID | Area | Finding | Handling |
|---|---|---|---|
| G1 | Citation gate | w05-expert-verified.json has no source-row IDs; 319 verified rows lack URLs; 22 verified article rows have empty quotes; expert-feed and podcast "quotes" are extractor rationale. | Known limitation per user (15:44 PT). Applied revised rules 1–6: row-ID = file#rows[i]; 19 article rows traced verbatim to stored source text qualify; 441 verified rows are research_only tags; no feed/podcast row sets a tier or consensus. |
| G2 | Existing quantitative pass defective | data/research-intel/proposed/2026-w05-quantitative-synthesis.json uses the favourite spread as the home line: sign flipped in all 6 away-favourite games (MIN@NO, CIN@MIA, HOU@TEN, DEN@LAC, DET@ARI, CHI@GB); also assumed normal errors and a 16:16Z anchor; 14/14 totals "Over". | Rejected; not used. Its side menu (MIA, GB, NO, TEN, LAC first) is an artifact of the defect. Re-ran an independent simulation. |
| G3 | Structural QB staleness | FTN/SRS samples measure a different QB than the Week 5 starter: BAL (Lamar-only; Huntley starts), CHI (Williams/Keenum/Bagent; Bagent named), WAS (backups wk2–4; Daniels returns). | Those games cannot be Tier 1; labelled conflicted. Partial changes (MIN, NYG, SEA, ATL) noted per game. |
| G4 | SuperContest file orientation | week-05-2026-verified-lines.json lists 6 games with home/away reversed (TEN@HOU, MIA@CIN, NO@MIN, GB@CHI, LAC@DEN, ARI@DET); source_capture_time null. | Joined on unordered team pair; favourite/underdog fields used; orientation flag carried per row. |
| G5 | Book disagreement | BKR vs BEO spread: MIN@NO 2.5 vs 1; CLE@NYJ 2.5 vs 1; IND@PIT 3 vs 2.5; BAL@ATL 3 vs 3.5; CHI@GB 1.5 vs 1. | No cross-book synthesis; BKR baseline; both shown. |
| G6 | Prop coverage gaps | SF@SEA: no BKR player props. MIN@NO and BUF@LAR: no BEO player props. BKR TD markets absent for CHI@GB, MIN@NO, NYG@WAS, DET@ARI, BAL@ATL; HOU@TEN lacks ATD/first; CIN@MIA lacks 2+/3+ TD. No rush+rec or fantasy-point markets at BKR. | Recorded per game; not filled. |
| G7 | Parser review | BKR 388 rows market=unknown (team totals incl. period team totals; 108 have line/odds null and available=false). | parser review required; excluded from menus. |
| G8 | DEF/ST player markets | No BKR/BEO/DKP row classified as a defensive or special-teams player market. BEO has team-level FG/TD totals only. | not published/not captured; no defensive legs listed. |
| G9 | DKP freshness | DKP capture 16:23:47Z is >6h old at preflight. | stale_for_recommendation; prediction-market context only. |
| G10 | Availability feed quality | FantasyPros rows carry published_at 2026-10-10T23:30:03Z, later than capture 16:45Z; status conflicts (Jonathan Greenard OUT 10/09 vs questionable 10/10; Kyler Gordon labelled OUT with questionable text). | Gate uses the most recent credible timestamp (published capped at captured); conflicts shown as questionable. Official inactives not yet published. |
| G11 | Roster gate timing | ESPN roster snapshot 20.4h old; crosses 24h at 2026-10-11T02:16Z. npm run roster:vet writes data/generated/master-intel/w05-roster-vet.json. | Ran the identical script against a byte-copy mirror outside the repo (PASS, 0 blocking). Must re-run with --fetch before game day. |
| G12 | Weather/venue | Open-Meteo forecasts for 9 outdoor games only; SoFi (DEN@LAC, BUF@LAR) ESPN indoor=False vs nflverse roof=dome; MIN@NO, DET@ARI, BAL@ATL indoor per ESPN. | Indoor/covered venues: not applicable. Material forecasts (IND@PIT, CLE@NYJ, NYG@WAS, CHI@GB) need kickoff refresh. |
| G13 | Coaching snapshot | Week 2 sample (2 games, through 2026-09-20); only neutral_pass_rate populated. | stale historical context; no numeric use. |
| G14 | Secondary manual file | WAS coverage tagged "passive" while FTN team-defense/pass-rush BLZ% = 47.4% (2nd); 3 absence names unresolved on roster (Travis Hunter (CB), Dominique Hampton, Israel Mukuamu); published_at can post-date generated_at. | Qualitative only; FTN preferred; conflict recorded. |
| G15 | Calibration limits | No blend backtest possible (no historical FTN/power inputs). Model fav-win by bucket vs artifact: 0-1 50.7/45.1 (n=142), 10+ 83.2/86.6. Sparse 4/6/8/10 pushes treated as noise. | Probabilities labelled comparison signals, not edges. |
| G16 | FTN component | Raw 4-game EPA/play, not opponent-adjusted; context file collapses duplicate column names (second RATE/EPA/DB/DVOA in passing-pressure and pass-protection tables lost). | Fixed 25% weight per contract; sensitivity shown at market weights 1.0/0.8/0.6/0.4. |
| G17 | Power-ratings provenance | Attribution note says "prior-season results" while rows carry 2026 4-game records; source is data/vault-seed/nflverse/games.csv (not the pinned full CSV). | Treated as 2026 season-to-date SRS; provenance inconsistency recorded. |
| G18 | Survivor report data quality | Field share MIA 63.2% / 48.1% in both leagues although MIA is a +7 home underdog (likely team mapping defect); both leagues show a single 17:00Z lock while PHI@JAX kicks at 13:30Z. | Flagged only; survivor is not an output (both pools lost per user). |
| G19 | Pool inputs | Rules from data/pickem/pools-2026.json (updated 10-06); no Week 5 pool picks/leans files; TB@DAL confidence slot already locked and unknown. | Ordering given for the 14 remaining games only; slot mapping left to user. |
| G20 | Handoff reproducibility | HANDOFF.md (16:30Z) predates the pinned pull (20:44Z). Newest in-repo dated handoff: handoffs/2026-10-10-codex-week5-card-prep-and-prop-capture-handoff.md. A later handoff exists only in the claude.ai Project (claude/handoff-2026-10-10-week5-article-refresh-gemini-picks-digest-next.md, 20:51Z) and is not committed. | Read both; neither used as source of truth. |
| G21 | Dirty checkout | 915 git status entries at HEAD 7ef79ff, including modified pipeline code (agents/podcast-gemini-intel.js, agents/portfolio-dossier.js, ...). | No repo code executed except an unmodified copy of scripts/nfl-rosters/roster_vet.py in a scratch mirror. Reproducibility risk named. |
| G22 | Expert props not captured | Daniel Jones U209.5 pass yds, Aaron Jones longest rush O14.5, Jonathan Taylor rush+rec O105.5, Quinshon Judkins U59.5 rush yds, Geno Smith U0.5 INT, Kalif Raymond 4+ rec: no BKR/BEO row at that market. | captured line not found → unavailable; no price invented. |
| G23 | Simulation runs | Three executions: run 1 (22:53:53Z) and run 2 (22:54:35Z) rejected for methodology defects (location shift from key-number weights; step-function median mapping); run 3 (22:55:19Z) accepted. | All three output hashes logged; no rejected output used. |
| G24 | Delta checklist | Pre-Sunday run: inactives, fresh market capture, weather recheck, game status and source-pick repricing have not been done for any kickoff window. | Every row is stale_for_recommendation at its kickoff window until the checklist runs. |
| G25 | Uncaptured evidence | Cody Brown touchdown sheet (image) not captured; Sal Bets video picks missing; SportsLine/FantasyPros podcast feeds returned 0 episodes (per Project handoff 20:51Z). | Not filled. |
| G26 | Schedule/kickoff | nflverse CSV lists CHI@GB 16:25 ET; ESPN API 2026-10-11T17:00Z. | ESPN used. A WebFetch summary of the ESPN API returned an incorrect TB@DAL status; the direct API call (STATUS_FINAL, TB 24–16) was used. |
| G27 | Schema | No shared Astra/Opus JSON schema file found in the repo or prompt. | Opus schema documented inside the JSON ("schema_doc"); adjudicator may need to map fields. |
| G28 | Prior digest tiers | scratch/w05-synthesis-digest-sat.md (14:17 PT) assigns tier 2 from expert-feed/podcast rows and an undated BKR display board, and tags the traceable ESPN article as research-only. | Treated as unreliable (rule 5); tiers re-derived here. |
