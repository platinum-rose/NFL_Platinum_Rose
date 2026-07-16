# Player Props — Architecture Readiness Report

**Purpose:** verify the full props pipeline is wired so a real prop-odds source can drop in cleanly.
**Date:** 2026-07-16 · **Scope:** ingest → storage → tools → agent → log → grade → results.
**Bottom line:** the *logic* is largely built, but three architecture pieces must land first. Two are
delivered in this batch (migrations 032/033 + ingest); the third (log→grade wiring) is a decision for you.

---

## 1. The pipeline, end to end

```
 (future) prop-odds source ──▶  player_prop_odds  ──▶  get_player_props / get_prop_line_shop
   [NOT YET SOURCED]              [NEW — mig 033]         (propsTools.js — rewire to read it)
                                                                   │
                              team scoring context ─▶ analyze_prop │ (projection vs line)
                                    ESPN injuries  ─▶ check_backup_depth
                                                                   ▼
                                                     PROPS agent (PropsAgentChat.jsx)
                                                                   │ log_prop (confirm first)
                                                                   ▼
                                        localStorage nfl_props_picks_v1   ──?──▶  user_bankroll_bets
                                                                                   [GAP — see §4]
                                                                                        │
                              player_stats (weekly actuals) ─▶ props-auto-grade.js ─────┘
                                    [NEW — mig 032 + ingest]        │ compares line vs actual
                                                                    ▼
                                              user_bankroll_bets.result = win|loss|push
```

## 2. What's already in place (verified)

- **Tool layer** — `src/lib/propsTools.js`: all 7 tools defined + executor, market catalog
  (`PROP_MARKETS`), SGP correlation model, ESPN backup-depth (live), unit tests
  (`tests/unit/propsTools.test.js`). Solid.
- **Agent** — `agents/product/tier1/PROPS.md` (spec, `status: draft`) + `PropsAgentChat.jsx` UI.
- **Grader logic** — `agents/props-auto-grade.js` + scheduled workflow. The grading *comparison*
  (`gradeProp`) is correct; it degrades gracefully when `player_stats` is absent.
- **Real-data awareness** — `get_player_props` already probes the odds snapshot for embedded
  `player_props[]` before falling back to stubs, so the seam was anticipated.

## 3. The integration seam (where a real source plugs in)

**A prop-odds source lands in one place: the `player_prop_odds` table (migration 033).**
One row per (game, player, market, book, snapshot_time) with `line / over_odds / under_odds` —
mirrors the proven `futures_odds_snapshots` shape. This is what makes real line-shopping possible
(multiple books per player+market), which the current embedded-in-blob approach could not support.

Once populated, exactly two functions rewire to read it (both flagged in code today):
- `get_player_props` → `select * from player_prop_odds where team=? and snapshot=latest`
- `get_prop_line_shop` → `group by book` for a given (player, market)  ← **currently 100% stub**

No other consumer changes. The stub generators stay as the offline fallback.

## 4. Gaps that must close before "props go live"

| # | Gap | Impact | Status |
|---|-----|--------|--------|
| 1 | **No prop-odds storage table** | Real odds have nowhere to land; line-shop can't compare books | **FIXED** — `player_prop_odds` (mig 033) |
| 2 | **`player_stats` table missing** | Grader skips 100% of props (no actuals to compare) | **FIXED** — `player_stats` weekly (mig 032) + ingest |
| 3 | **`user_bankroll_bets` lacks prop columns** | Grader filters `bet_type='prop'` / `graded` and reads `stat_column,player_id,direction,line,season` — none exist on the table. Grading can't run *even with* player_stats. | **FIXED (schema)** — mig 032 adds the columns; the log→grade *data path* is a decision, see §5 |

## 5. Open decision — the log→grade data path

The PROPS agent's `log_prop` writes to **localStorage `nfl_props_picks_v1`**. The grader reads
**Supabase `user_bankroll_bets` where `bet_type='prop'`**. These are two different stores — a prop
logged by the agent will not be auto-graded unless it also becomes a bankroll bet row carrying
`stat_column / player_id / line / direction / week / season`.

Three ways to close it (pick one — not built, awaiting your call):
1. **Agent logs straight to Supabase.** `log_prop` upserts a `user_bankroll_bets` row (bet_type='prop')
   in addition to localStorage. Cleanest for grading; the agent becomes the source of truth.
2. **Bankroll sync carries props.** When a localStorage prop syncs to Supabase, map its fields into the
   new grading columns. Keeps localStorage primary; needs a mapping in `src/lib/supabase.js`.
3. **Dedicated `user_prop_bets` table.** Split props out of the general bankroll table entirely and
   point the grader at it. Cleanest separation; most code churn.

Recommendation: **option 1** — least churn, and it means the moment you log a prop it's gradable.

## 6. Also note

- `check_backup_depth` returns injury-driven volume flags, not a true depth chart (no free source);
  a real QB2/RB2 chart needs a paid source (Sportradar). Acceptable as-is; documented in the spec.
- `PROPS.md` is still `status: draft` — promote to active when props go live.
- `player_stats` stat columns are named to the **market keys** (`player_rush_yds`, …) precisely so the
  grader's `select(bet.stat_column)` works with zero translation. The ingest does the nflverse→market
  mapping. Do not rename these columns without updating the grader.

## 7. Ready-to-source checklist

- [x] Prop-odds landing table exists (`player_prop_odds`, mig 033)
- [x] `player_stats` weekly actuals table + ingest (mig 032 + `agents/player-stats-ingest.js`)
- [x] `user_bankroll_bets` grading columns (mig 032)
- [ ] Apply migrations 032 + 033 in Supabase
- [ ] Run `node agents/player-stats-ingest.js` to seed historical actuals
- [ ] Decide the §5 log→grade path and wire it
- [ ] Rewire `get_player_props` + `get_prop_line_shop` to read `player_prop_odds` (2-function change)
- [ ] Then: hunt for the prop-odds source and write it to `player_prop_odds`
