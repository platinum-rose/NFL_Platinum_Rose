# HANDOFF_PROMPT.md — NFL Platinum Rose

> Rolling session handoff. Read this first in a fresh session, then read WORKING-CONTEXT.md.

## Persistent Backlogs

> Read at every session start. Mark items done in the source file, not here.

| Backlog | File | Open Items | Last Touched |
|---------|------|-----------|--------------|
| Feature & Architecture | `docs/NFL_BACKLOG.md` | 1 open | 2026-06-07 |

## Last Session Summary

- Date: 2026-06-07
- Branch: main
- HEAD: S169 (pending Windows commit — see git command below)
- Previous HEAD: 42aac2b — S168 update session handoff + working context
- Tests: 632/632 passing

## What Was Done (S169)

**Doc fix** — WORKING-CONTEXT.md corrected: F-9 Sunday Slate Briefing was already done in S118;
stale 🔲 updated to ✅. Pillar 4 scoped.

**Parlay + round-robin pick types** added to `src/lib/picksDatabase.js`:
- `validateParlay` / `validateRoundRobin` — schema validation
- `addParlay` — single entry with embedded legs, combinedOdds, stake, contestName/Week
- `addRoundRobin` — auto-computes C(n,r) combinations + totalStake from stakePer
- `setPickResult(id, result, extra)` — manual grading; extra carries payout/effectiveTeamCount
  (parlays) or wonCombinations/totalPayout/netUnits (RRs)
- `statsByPickType()` — breakdown by all 5 types; parlay.byTeamCount (3-teamers, 5-teamers);
  round_robin.byConfig ('8-pick/4-team')
- `ALL_PICK_TYPES` constant

**`src/lib/agentTools.js`** updated:
- `log_pick` now accepts pick_type: 'parlay' | 'round_robin' with legs, parlay_size,
  contest_name, contest_week fields
- `toolLogPick` branches on parlay/RR, calling addParlay/addRoundRobin
- `get_performance_stats` returns `by_pick_type` in every response

**`src/components/agent/AgentChat.jsx`** — `buildCalibrationSummary` extended:
- Shows spread/total/ML breakdown (>= 3 graded picks threshold)
- Shows parlay record with byTeamCount sub-line
- Shows RR record with byConfig sub-line
- Auto-generates edge signal when best/worst type diverge by >= 10pp

**25 new tests** in `tests/unit/picksDatabase.test.js` (607 → 632).
`tests/unit/agentTools.test.js` mock updated with statsByPickType/addParlay/addRoundRobin.

**All 4 Offseason Architecture Pillars now complete.**

## Critical Status

- All 4 Offseason Architecture Pillars — ✅ COMPLETE
- 632/632 tests passing
- Parlay/RR types ready to use via BETTING agent `log_pick` tool
- Grade parlays/RRs via `setPickResult(id, result, { payout, effectiveTeamCount })` etc.

## Git Command (run from Windows in E:\dev\projects\NFL_Dashboard)

```
git add src/lib/picksDatabase.js src/lib/agentTools.js src/components/agent/AgentChat.jsx tests/unit/picksDatabase.test.js tests/unit/agentTools.test.js WORKING-CONTEXT.md HANDOFF_PROMPT.md && git commit -m "S169: parlay/RR pick types + Pillar 4 complete (statsByPickType, buildCalibrationSummary, 632 tests)" && git push
```

## What To Do Next

1. **Props auto-grade pipeline** — GHA agent to auto-grade `nfl_props_picks_v1` (needs player stats source)
2. **PFF grades** — drop CSVs in `data/vault-seed/pff/` when available
3. **Parlay/RR grading UI** — PicksTracker UI support for grading multi-leg tickets

## Resume Command

```text
Resume Platinum Rose NFL. HEAD = 42aac2b (main, S169 pending Windows commit). Suite: 632/632.
All 4 Offseason Architecture Pillars complete. Parlay + round-robin pick types shipped.
Next: props auto-grade pipeline (GHA). Read HANDOFF_PROMPT.md first.
```

## Notes

- Read order for fresh session: CLAUDE.md → HANDOFF_PROMPT.md → WORKING-CONTEXT.md
- `data/tweet-drops/` — drop screenshots/text/JSON here, run `npm run ingest-tweets`
- `data/vault-seed/{pff,splits,manual}/` — drop CSVs/MDs here, run `npm run seed:vault`
- Python scripts (`scripts/*.py`) are intentionally SEASON=2025 — defer to Aug 2026
- Podcast pipeline is live on M6 at Tailscale `atlas-m6.tail1e459d.ts.net` (renamed from `atlas` Jun 2026)
- Parlay grading: `setPickResult(id, 'WIN', { payout: X, effectiveTeamCount: N })`
- RR grading: `setPickResult(id, 'WIN'/'LOSS', { wonCombinations, totalPayout, netUnits })`
