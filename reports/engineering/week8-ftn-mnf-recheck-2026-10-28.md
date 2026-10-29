# FTN Monday-night coverage recheck — October 28, 2026

**The missing Dallas–Philadelphia game is now included. All 36 FTN Stats IQ charts were freshly exported, validated and promoted to the local canonical Week 8 context at 8:13 AM Pacific.**

Capture window: **8:02:49–8:09:42 AM Pacific** (`2026-10-28T15:02:49.095Z`–`15:09:42.621Z`). Filters remained 2026 / REG, with all weeks, teams, opponents and applicable player positions. Week 8 denotes preparation/capture week; statistics cover completed games through Week 7.

## Missing-game verification

| Team | Offense GP | Defense GP | Offensive points/game | Defensive points/game |
|---|---:|---:|---:|---:|
| Dallas | 7 | 7 | 27.0 | 25.7 |
| Philadelphia | 7 | 7 | 18.1 | 25.0 |

Both teams' games played and scoring averages now match their seven completed games, including the Week 7 Monday final. Sources: [FTN team offense](https://stats.ftnfantasy.com/stats/team-offense/overview), [FTN team defense](https://stats.ftnfantasy.com/stats/team-defense/overview). The earlier capture and its ESPN final confirmation remain preserved separately.

## Complete-capture validation

- **36 required tables, 4,674 records, 32 mapped teams, zero unmapped or malformed records.**
- All 36 schemas match the prior source schemas. Every raw file's hash matches its manifest entry and corresponding context table. Duplicate headers remain preserved and normalized by the existing adapter.
- Each of the twelve team tables contains 32 distinct teams. **All 384 team-table games-played checks** match completed Week 7 games. The Dallas/Philadelphia scoring checks also pass.
- Every CSV was newly downloaded during this capture. All 36 contents differ from the earlier blocked set. The eight-row reduction reflects the new source exports; no rows were manually removed. Per-table changes are retained in the manifest.
- A fresh strict Week 8 roster-vet invocation passed with zero blocking issues at approximately 8:03 AM Pacific. Its roster snapshot was 7.4 hours old; this was a new vet run, not a new roster fetch or Wednesday practice clearance.
- Independent read-only verification found no blocker to local promotion. Games-played and scoring checks do not independently certify every FTN metric or player attribution.

## Saved and promoted artifacts

- [Fresh capture manifest](../../data/research-intel/source-evidence/2026-10-28-ftn-mnf-recheck-150249Z/capture-manifest.json).
- [Coverage validation](../../data/research-intel/source-evidence/2026-10-28-ftn-mnf-recheck-150249Z/coverage-validation.json).
- [Versioned reviewed context](../../data/research-intel/review/ftn-stats-iq-week08-2026-10-28-mnf-complete.json).
- [Canonical latest context](../../data/research-intel/review/ftn-stats-iq-weekly-synthesis-context-latest.json), now Week 8 and byte-identical to that reviewed version.

Canonical SHA-256: `9d1e5ca2603ea752e2391c99161f007eb71bb15b79f1743af648313c7ad18ebd`.

The prior canonical hash was checked immediately before replacement; its hash-verified backup is `data/research-intel/source-evidence/2026-10-28-ftn-mnf-recheck-150249Z/prior-canonical-context.json`. Promotion used a verified temporary copy and a local file replacement. Original Downloads, the earlier held capture and its dated review context were preserved.

This resolves the **FTN source-coverage hold only**. Other synthesis inputs, practice availability, tracker activation and publication retain their separate gates. No cadence, Tuesday rerun, paid API/model call, Supabase operation, ledger/account/wager action, tracker build or publication was performed. Changes remain local and uncommitted; source/parser code was not changed.

Live Git also showed concurrent generated fantasy/roster and tracker-reconciliation changes at final verification. Those files were preserved without editing, staging or cleanup. HEAD remains `71c6b4f9906634293bb24e156aca3a7b16b8a6ff`.
