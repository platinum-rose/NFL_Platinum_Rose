# Week 8 refresh audit — October 28, 3:23 PM Pacific

**Readiness remains HOLD.** The scheduled 3 PM run refreshed availability, projected starters, and prediction markets, then stopped at Alpha's stale-input gate. This audit launched no cadence, remote retrieval, paid/model call, account/ledger action, or publication. HEAD remains `71c6b4f`; dirty/concurrent work was preserved.

**Correction after checking the existing Week 7 closeout:** complete Week 7 results and team statistics are already saved locally: 14 final games and 28 team-stat rows in `reports/analysis/week7-postmortem/espn-game-results-2026-10-26.csv` and `espn-team-stats-2026-10-26.csv`, refreshed October 27. All 14 corresponding saved box scores were rechecked as final, with 28 team box-score entries. The stale nflverse CSVs describe a downstream input gap, not missing Week 7 source data. First reconcile the existing exports with builder schemas and rebuild; retrieve a provider-specific feed only if required fields are absent. No new pull is required merely to obtain Week 7 results/team statistics.

## Refresh priorities

| Priority | Data | Finding | Next step |
|---|---|---|---|
| 1 | Secondary matchups | Canonical snapshot is Week 7, October 23 at 6:18 PM PT | Reconcile source/role seeds against current evidence, then build Week 8 locally |
| 1 | Player-prop intel | Canonical snapshot is also Week 7 | Finish extraction from the approved saved article export; preserve parlay-only and conditional source scopes |
| 1 | Power ratings / team profiles | Builder-facing nflverse CSVs stop at Week 6, while complete Week 7 ESPN result/team-stat exports already exist locally | Reconcile the existing exports with required builder fields and rebuild; only refresh provider-specific inputs if necessary. Do not rerun Tuesday |
| 1 | Alpha | Prior Week 7 packet remains; today's builder correctly refused the stale secondary/prop inputs | Build only after dependencies are clear; keep publication separate |
| 2 | Offense roster map / DK Predictions | Map is from October 23. Today's DK capture parses 14 games / 698 rows but fails on five unresolved player-team rows | Reconcile against the newer full roster and replay the saved capture through the acceptance gate; another scrape may be unnecessary |
| 2 | Bookmaker / SuperContest | No matching Week 8 local board or user-verified contest-lines file found. Generic market comparison still declares Week 7 despite a newer file-modification time | Capture or supply current Week 8 boards; do not treat opening/history prices as current |
| 2 | BetOnline player props | Today's 2:10 PM board covers all 14 games / 528 priced rows, but player props are saved only for TNF: 112 rows / 13 players | Capture remaining player markets as they open; recheck prices before using them |
| 2 | Schedule-attached odds | All 14 Week 8 games carry October 27, 7 AM PT prices | Refresh price evidence before line comparison; kickoff data and current offers are separate |
| 2 | Podcast synthesis evidence | Local `w08-pull.json` is missing. Discovery inventory exists but does not establish promoted episode coverage | Reconcile saved source artifacts; a new Supabase pull or model processing needs its own approval |

The approved article retrieval is already complete: 189 raw records / 159 current-window NFL records, retained under `week8-articles-2026-10-28-202315Z/`. Its one parser match is a parlay-only source leg; manual review retained a separate conditional lean. Do not rerun that database retrieval just to rebuild a local file. Source-body and extraction gaps remain described in `week8-article-retrieval-2026-10-28.md`.

## Current captures that need quality review

Availability was generated at **3:00:01 PM PT** with 1,070 events from ESPN, FantasyPros, and retained camp evidence. Projected starters followed at **3:00:03 PM PT** with 164 signals. Existing evidence/named-status checks pass and the detected conflict is withheld, but generation time does not establish complete Wednesday practice coverage or clear the depth-chart disagreements.

**218 FantasyPros normalized publication times are more than one hour after the snapshot capture**, reaching October 28 at 9:50 PM PT even though captured at 3 PM. The mapper already documents an unresolved naive-source-timezone interpretation. This is a timestamp-provenance problem to investigate, not proof of future reporting or a reason to repeatedly fetch the feed. Keep official team reports and ESPN evidence distinct. No timezone correction was guessed or applied.

The DK Predictions capture is retained at `data/generated/props/draftkings-predictions-live-2026-10-28-week8.last-capture.raw.txt`, captured **2:20:14 PM PT**. Offline parsing and the actual acceptance gate reproduced the five unresolved-team-row failure, with zero unresolved dates. The normalized Week 8 master is absent; raw capture alone is not a clean board. Prediction-contract prices must remain separate from sportsbook odds.

## Current enough now

- **FTN:** all 36 tables, through completed Week 7, including the formerly missing Monday game; 384 game-count checks passed. No repeat pull needed now.
- **Usage and box scores:** usage is through Week 7; all 14 Week 7 ESPN final box scores are present, 107 saved games total.
- **Full ESPN roster:** 32 teams / 2,549 players, captured Wednesday at 12:42 AM PT. It reaches 24 hours Thursday at 12:42 AM PT. Run the strict roster gate before player-named output; the old offense-only map is a separate dependency.
- **Prediction markets:** refreshed at **3:00:49 PM PT**, 4,055 contracts from live Kalshi/Polymarket sources; no sample fallback reported. Mapping/coherence has 629 mapped contracts, 331 eligible for coherence math, 3,340 liquidity warnings, one nesting inconsistency, and zero execution-eligible contracts. These need validation-aware interpretation, not an immediate repeat pull.

## Execution evidence and limits

`logs/toolbox-wednesday-pm.log` ends today's 3 PM run with exit 1 at Alpha. It is a partial cadence completion, not a total refresh failure. The installed job fetched FantasyPros; this audit did not launch that job or any authenticated source action. Existing task settings remain unchanged.

The pure Alpha freshness evaluator was rerun against live canonical files: availability/starters pass time freshness, secondary/props fail on age and Week 7. No `--allow-stale` override was used. Old host citations, dossiers, and source-inventory dates must also be reconciled against actual current source artifacts before claiming broad podcast/article coverage; refreshing their generation timestamps alone would not help.

Machine-readable evidence, file hashes and source paths: `week8-refresh-audit-2026-10-28.json`. New Supabase reads, paid API/model actions, account changes, wagers, ledger operations, or tracker publication still require Andy's per-action OK. The earlier single article-read approval has been fulfilled.
