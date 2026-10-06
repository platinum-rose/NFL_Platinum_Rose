# Weekly archive — runbook (added 2026-10-05, Claude Team 2)

End-of-week capture of everything that finished that week, for betting, fantasy and contest research.
One command, run by Windows Task Scheduler; safe to re-run (every step is idempotent).

```
node scripts/archive/weekly-archive.mjs            # week = the NFL week that ended in the last 72h
node scripts/archive/weekly-archive.mjs --week 4   # explicit week
  --no-vault     stage notes in the repo only        --vault-only  rebuild notes from what is archived
  --skip-yahoo   --skip-espn                         --refresh     let a past week regenerate its outputs
```

## Schedule
| When (local) | Who | What |
|---|---|---|
| Mon 23:30 | Windows task `NFL_Dashboard_Weekly_Archive` | main capture; exits 75 and waits if any game is not final |
| Tue 06:00 | same task | retry (late games, overnight API hiccups) |
| Tue 06:52 | Claude scheduled task "Weekly pick'em pool capture" (needs the desktop app open) | CBS BUKBUK + SimplySportsware (+ Yahoo Pick'em if the API has none) through the signed-in browser pane, read-only; saves `data/pickem/<pool>-2026-wNN.json` |
| Thu 06:00 | Windows task | refresh after NFL stat corrections; picks up the pool captures; writes the vault |

Register the Windows task once (does not touch the other NFL tasks):
`powershell -ExecutionPolicy Bypass -File E:\dev\projects\NFL_Dashboard\scripts\windows\register-weekly-archive-task.ps1`
then `Start-ScheduledTask -TaskName NFL_Dashboard_Weekly_Archive` and read `logs\weekly-archive.log`.

## What it captures (data/archive/<season>/week-NN/)
| Step | Output |
|---|---|
| espn | every game summary → `data/fantasy/boxscores/espn-<id>.json` (gate: all STATUS_FINAL) |
| betting | `betting/`: team post-mortem (`week-NN-teams.*`), game summaries, `grade-apply.txt` (settles every ticket the box score fully decides; ledger backed up first as `…bak-team2-<ts>`), weekly betting review. Round robins, pushes needing the book payout and unsupported markets (e.g. D/ST TD) stay open and are listed under "Left open" in the Betting note and `manifest.json` |
| yahoo | `yahoo/yahoo-week.json`: each fantasy league's settings, standings, matchups, every roster with the week's player points + stats, the week's transactions; `yahoo/survivor/` (existing survivor sync, frozen); probe of every other Yahoo game (Pick'em) with raw responses. Raw API responses: `yahoo/raw/` (gitignored); re-parse offline with `node scripts/archive/yahoo-week-archive.mjs --week N --from-raw` |
| pools | `pools/`: this week's pick'em captures (schema `pickem_pool_capture_v1`) |
| notes | `vault/`: staged Obsidian notes (committed) |
| vault | `VAULT_DIR/NFL/<season>/Week NN/` via `agents/lib/vaultWriter.js` (atomic, hash-verified, unchanged notes skipped) |
| rollups | `data/archive/<season>/season/team-weeks.csv`, `fantasy-player-weeks.csv`, `fantasy-matchups.csv` |
| — | `manifest.json`: per-step status, counts, errors |

## Obsidian layout (`NFL/<season>/Week NN/`)
`Week NN Index.md` (links + Dataview examples) · `Games/<AWY> @ <HOME>.md` (line, linescore, team stats, leaders, expert post-game view, scoring plays) · `Teams/<TEAM>.md` (one per team; links the long-lived `NFL/Teams/<TEAM>` page) · `Fantasy/<league>.md` · `Contests.md` (pick'em pools + survivor) · `Betting.md` (`sensitivity: yellow` — personal money, local-only).
Every note carries `sensitivity`, `owner_project: nfl-dashboard`, `source_system: weekly-archive`, `season`, `week`, `type` (`team-week`, `game-week`, `fantasy-league-week`, `contests-week`, `betting-week`, `week-index`) and tags (`nfl/<type>`, `team/<ABBR>`, `week-NN`), so Dataview can query across weeks, e.g.
```dataview
TABLE week, opponent, result, ats, ypp_diff, to_margin FROM "NFL/2026" WHERE type = "team-week" AND team = "HOU" SORT week ASC
```

## Rules (binding)
- Read-only APIs; local files only. No Supabase writes, no paid model calls. The only ledger write is `grade_week.py --apply` (box-score facts, Andy's standing OK 2026-10-05); it never invents a payout it cannot see.
- The vault is written only by the Windows task (native filesystem). The script refuses to write the vault from a Linux VM mount (vault `CLAUDE.md` writer rule 3). Claude sessions use `--no-vault`.
- Pool captures: browser pane, read-only pages; never Make/Remove/Save picks; never store passwords.
- A past week (`--week` < current) never rewrites existing game summaries or betting reviews unless `--refresh`.

## Known gaps / next
- Yahoo Pick'em: the public Fantasy API may not expose it; the first Windows run's probe (`yahoo/yahoo-week.json` → `other_games`) answers this. Until then the Tuesday browser task covers it.
- Yahoo parsing has not yet run against live responses (the Claude sandbox cannot reach Yahoo). Check the first run's `manifest.json` and `yahoo-week.json`; fix the parser and re-run with `--from-raw` if any field is empty.
- Survivor report shows an unresolved team id (`NFL.T.33`) in the field pick distribution — `sync-yahoo-survivor.mjs` team-id map needs a fix.
- Backfill Yahoo weeks 1-3 on Windows: `node scripts/archive/weekly-archive.mjs --week 1 --skip-espn` (repeat for 2, 3).
