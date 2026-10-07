# Season analysis (Claude Team 2) — end-of-week tools

Runbook: `docs/NFL_WEEKLY_CARD_PROCESS.md` → "End-of-week close-out". Reads only the settled wagers file
(`data/official-picks/user-placed-wagers-2026.json`, gitignored) and ESPN box scores in `data/fantasy/boxscores/`.
Stay in this folder; Codex writes under `reports/analysis/w1-3-deep/codex/` (its C1/C4 tables become the canonical leg
inputs when they land).

| Script | What it does |
|---|---|
| `scripts/grade_week.py --week N [--fill-dead-legs] [--payout <ticket#>=<USD>] [--apply]` | Grades open legs from the box scores and settles open tickets (dry run unless `--apply`; backs the wagers file up first). Round robins and push tickets need the book's payout. |
| `scripts/weekly_review.py --week N` | `out/week-NN.json`, `out/season-through-wNN.json`, `out/week-NN-summary.md`: net by book / family / legs / price band / provenance, leg-market hit rates, H1–H6 re-tests, build-checklist compliance, exposure per game. |
| `scripts/build_season_report.py --week N` | `season-review.html` → republish to the "Platinum Rose Season Review" artifact (same URL each week). |
| `scripts/merge_box_tsv.py <espn json> <tsv>` | Fallback when the ESPN API is unreachable: merges a transcribed final box score into the cached summary JSON. |
| `scripts/validate_postmortem_data.py --weeks 1-N [--fetch-supabase]` | Read-only data audit: raw boxes, derived files, nflverse cross-check, both leg graders, ledger consistency → `out/data-validation.md/.json` (exit 1 on ERROR). See `docs/POSTMORTEM_DATA.md`. |
| `scripts/build_player_games.py` | `data/archive/2026/season/player-games.csv`: one row per player per game keyed by ESPN athlete id (+ nflverse id). |
| `provenance.json` | Who built each ticket (claude / mixed / andy) where the automatic guess is wrong. From Week 4, log `recommended_by` on each ticket instead. |
| `roster-vet-names.md` | Roster-gate card for players named in these outputs. |

Anything under 2 SE is a hypothesis. Nothing here places, changes or syncs a wager.
