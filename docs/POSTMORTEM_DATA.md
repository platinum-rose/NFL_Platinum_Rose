# Post-mortem data: sources, canonical tables, rebuild and validation

Use this page to find NFL results, box-score stats and graded bets for analysis, and to check the data is sound before you use it. Last reviewed 2026-10-07 (Claude Team 2) across Weeks 1–4: 64 games, 725 placed legs, 0 validation errors.

## Source of truth

| Layer | File(s) | Key | Notes |
|---|---|---|---|
| Raw box scores | `data/fantasy/boxscores/espn-<event_id>.json` | ESPN event id; athlete id inside | Primary source for every derived table. Fetched by `reports/bets/season-recap/scripts/espn_week.py` / the Monday archive. `merge_box_tsv.py` patches a box by hand if the API fails (`espn-*.pre-merge` keeps the original). |
| Placed wagers | `data/official-picks/user-placed-wagers-2026.json` | ticket `id` | Real money only. Ledger writes only via `grade_week.py --apply` (backs up first) or what Andy reports. |
| Paper (AI) tickets | `data/official-picks/paper-wagers-2026.json` | `paper_*` id | Never in cash totals; the validator errors if one appears in the wagers file. |
| Independent cross-check | Supabase `game_results`, `player_stats` (nflverse, loaded Tuesdays) | espn_id / nflverse player_id | Read-only snapshot cached in `reports/analysis/season/claude/data/xcheck/`. |

## Canonical analysis tables

| Table | Grain | Key | Built by |
|---|---|---|---|
| `data/archive/2026/season/player-games.csv` | player × game | `event_id` + `espn_athlete_id` (plus `nflverse_id` when the name and team match uniquely) | `reports/analysis/season/claude/scripts/build_player_games.py` |
| `data/archive/2026/season/team-weeks.csv` | team × week | `week` + `team` | `scripts/archive/weekly-archive.mjs` (rollups) |
| `reports/analysis/season/claude/out/week-NN-teams.json/.csv` | team × week (wider: lines, ATS, drives) | `event_id` + `team` | `team_postmortem.py --week N` |
| `reports/bets/season-recap/wNlegs.json` | placed leg + AI-only rec | ticket id + leg order | `reports/bets/season-recap/scripts/build.py` (WEEK=N) |
| `reports/bets/season-recap/wNpaper.json` | paper ticket legs | paper name | `paper_w12.py` (W1–2), `paper_w4.py` (W4); W3 is in `reports/bets/week3-recap/w3paper.json` |
| `reports/analysis/season/claude/out/week-NN.json`, `season-through-wNN.json` | ticket / unique leg position | ticket id; (week, game, player, market, line) | `weekly_review.py --week N` |
| `data/archive/2026/season/fantasy-player-weeks.csv`, `fantasy-matchups.csv` | Yahoo fantasy | Yahoo keys | weekly archive |

Name-keyed files (`wNgames.json`, `wNgamesum.json`) are page inputs only. Join across weeks with `player-games.csv`, not by name.

`reports/bets/week3-recap/w3legs.json` is a pre-MNF copy (34 tickets, 7 legs pending). Use `reports/bets/season-recap/w3legs.json` (40 tickets, rebuilt 2026-10-07).

## Grading rules (both graders)

There are two leg graders: `reports/bets/season-recap/scripts/grade.py` for the post-mortem pages and `reports/analysis/season/claude/scripts/lib.py` for ledger settlement and the season review. The validator grades every placed leg with both and errors on any disagreement.

- A player missing from the final box score = lost leg.
- "N+" needs stat ≥ N. An anytime TD with no N means 1+. Over/under: strictly over/under the line; equal to the line is a push.
- Names match exactly after normalising (accents, punctuation and Jr/Sr/II–IV removed). The last-name + first-initial fallback is used only when exactly one box player fits (on the leg's team when known). So "Bijan Robinson" never resolves to "Brian Robinson Jr.", which inflated Bijan's Week 4 TD count before 2026-10-07.
- TDs come from the scoring plays credited to the player's exact name. First TD = first non-FG, non-safety scoring play.
- Kicking points = the kicker's box `PTS`. A D/ST TD = a return or defensive TD in that team's scoring plays.

## Validation

```
python reports/analysis/season/claude/scripts/validate_postmortem_data.py --weeks 1-4 --fetch-supabase
```

It writes `reports/analysis/season/claude/out/data-validation.md` and `.json`, and exits 1 on any ERROR. The Monday weekly archive runs it, together with `build_player_games.py` and `grade_week.py --apply --fill-dead-legs`, and copies the report into `data/archive/2026/week-NN/betting/`.

| Area | Checks |
|---|---|
| Raw boxes | one final box per game; linescores sum to the final; the last scoring play equals the final; every scoring increment is legal; player rush/pass/receiving sums equal team stats; no shared display names; every TD scorer has an exact box name |
| Derived | `wNgames.json`, `wNgamesum.json`, `week-NN-teams.json`, `team-weeks.csv` and Supabase `game_results` all match the raw finals and game counts |
| nflverse | rush yds/att, rec/rec yds, pass yds/TD/INT per player vs ESPN |
| Legs | both graders agree; nothing ungradable; ledger leg status matches the box; ticket win/loss matches its legs; won tickets have a payout; stored `wNlegs.json` matches a fresh grade; paper kept out of real |

Status at 2026-10-07, Weeks 1–4: 0 errors. 3,514 player stat lines match nflverse exactly. 725 legs graded identically by both graders. Two warnings are by design: "Cameron Skattebo" on two DK Pick6 tickets resolves to the box's "Cam Skattebo" through the unique fallback. Nine players on legs had no box line and were confirmed absent in nflverse too (DNP): Stribling and Garrett (W1), Gesicki and Higbee (W2), Graham, Jefferson, Fant and Za'Darius Smith (W4).

## Fixed on 2026-10-07

- `lib.py` graded "Anytime TD Scorer" legs with line 1 as a push when the player scored once (W1 DK Pick6 tickets). Those legs now win, and unique-position counts dedupe them with the "1+ TD" legs.
- Both graders: the fuzzy name fallback was non-unique, and first-TD matched on last name only.
- `lib.py` could not grade kicking-points or D/ST-TD legs.
- 11 legs left PENDING inside settled tickets (W2: 2, W4: 9) were filled from the box scores by `grade_week.py --fill-dead-legs --apply`. Backups: `user-placed-wagers-2026.json.bak-team2-20261007-0754*`.
- Week 3 got a complete post-mortem leg table in `season-recap/w3legs.json`.
