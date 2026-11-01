# Week 8 FTN Stats IQ capture

**Update at 8:13 AM Pacific: the missing game is now included. A new 36-table capture with 4,674 rows passed coverage validation and was promoted to the canonical Week 8 context. See [Monday-night recheck and promotion](week8-ftn-mnf-recheck-2026-10-28.md).**

## Earlier capture — superseded

The remainder of this report describes the earlier 1 AM capture and its then-open hold. All 36 required charts were exported and validated: 4,682 records, 32 mapped teams, zero unmapped or malformed records. FTN readiness was held because Dallas and Philadelphia still excluded their completed Week 7 Monday night game.

The signed-in browser capture used 2026 / REG and the default unfiltered weeks, teams, opponents and player positions. The earlier public passing-overview export was retained after validation; the other 35 exports were captured after Andy signed in. Capture window: October 28, 2026, **1:01–1:41 AM Pacific** (`08:01:16.213Z`–`08:41:41.992Z`).

## Saved artifacts

- Raw CSV directory: `data/research-intel/source-evidence/2026-10-28-ftn-stats-iq/`.
- [Capture manifest](../../data/research-intel/source-evidence/2026-10-28-ftn-stats-iq/capture-manifest.json): exact source URLs, filters, download paths, timestamps, source headers and hashes for all 36 files.
- [Dated Week 8 review context](../../data/research-intel/review/ftn-stats-iq-week08-2026-10-28.json): built locally, explicitly marked `available_with_coverage_gaps_context_only` and `ready_for_current_week_synthesis: false`.
- [Coverage validation](../../data/research-intel/source-evidence/2026-10-28-ftn-stats-iq/coverage-validation.json): 64 team games-played checks and the live ESPN final confirmation.
- Previous canonical Week 7 context preserved byte for byte, with a hash-verified backup at `data/research-intel/source-evidence/2026-10-28-ftn-stats-iq/prior-context-week07.json`.

The canonical `ftn-stats-iq-weekly-synthesis-context-latest.json` was **not replaced**. Its Week 7 label must continue to block current-week readiness until the missing source coverage is resolved. The dated output is review material, not clearance for synthesis or publication.

## Export validation

| Category | Tables | Rows per table | Total records |
|---|---:|---:|---:|
| Passing | 5 | 33 | 165 |
| Rushing | 4 | 42 | 168 |
| Receiving | 5 | 136 | 680 |
| Coverage | 3 | 298 | 894 |
| Pass rush | 2 | 233 | 466 |
| Rush defense | 3 | 529 | 1,587 |
| Pass protection | 2 | 169 | 338 |
| Team offense | 7 | 32 | 224 |
| Team defense | 5 | 32 | 160 |
| **Total** | **36** | | **4,682** |

All required identities are present exactly once. Each CSV is nonempty, every row matches its header width, and all 36 schemas match the prior source schemas. All twelve team tables have 32 distinct teams. Duplicate source headers remain intact; the local adapter gives repeated model headers their normal `__2` suffixes. Every new CSV differs in content from its October 20 predecessor. Files with browser-added filename suffixes were copied to canonical names in this dedicated capture directory; source downloads were preserved.

## Source coverage gap

Week 8 is the **capture/preparation week**, not a claim that Week 8 games have been played. Comparing the FTN team offense and defense `GP` fields against completed games through Week 7 gives agreement for **30 of 32 teams**.

| Team | FTN offense GP | FTN defense GP | Completed games | FTN points/game | Points/game through Week 7 |
|---|---:|---:|---:|---:|---:|
| Dallas | 6 | 6 | 7 | 25.2 | 27.0 |
| Philadelphia | 6 | 6 | 7 | 17.7 | 18.1 |

The FTN point averages match the first six games, reinforcing that this is a statistics-coverage gap rather than just a stale `GP` label. A fresh free ESPN summary check at `2026-10-28T08:45:34Z` confirmed the Week 7 game final, Dallas 38–21 Philadelphia. Sources: [FTN team offense](https://stats.ftnfantasy.com/stats/team-offense/overview), [FTN team defense](https://stats.ftnfantasy.com/stats/team-defense/overview), [ESPN final summary](https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=401873009).

Games-played checks do not independently validate every FTN metric or every player row. No missing statistics were fabricated or inserted into the source exports.

## Next step

Re-export after FTN includes Monday night, then repeat the source, schema, hash, mapping and games-played checks before promoting the Week 8 context. Rebuilding from today's same inputs would not resolve the gap. No monitor or later refresh was scheduled.

Only local source captures, review artifacts and documentation were created. No paid API/model call, Supabase action, ledger/account/wager change, tracker publication or Tuesday cadence rerun occurred. No source code or parser changed, so the earlier test results remain the session's test evidence; this capture was verified through the actual adapter and data checks.
