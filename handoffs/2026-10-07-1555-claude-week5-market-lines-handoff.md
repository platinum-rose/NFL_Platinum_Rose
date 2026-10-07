# Handoff — Wed 2026-10-07 15:55 PT — next lane: compile Week 5 market lines

**Team:** Claude Team 2. Fresh session, continuing from `handoffs/2026-10-07-0105-claude-week4-postmortem-done-week5-prep-handoff.md`.
**Git:** `main` = `origin/main` after this handoff's commit. Everything needed is committed and pushed. These are left uncommitted on purpose (Andy, 10/07): `scratch/`, `*.bak*`, `.nfl/gmail-summaries/*test-injury-alert*`, the `docs/*.eml` files, `data/prediction-markets/team-market-map-2026-09-*`, `data/fantasy/Week1_*.xlsx`, `reports/bets/season-recap/work/*_w4.json`, and the repo-root scratch files. Commit nothing from that list.

## 1. State at close

- **Week 4 is closed:** post-mortem page, recommendation ledger D14–D26, post-mortem data validator (0 errors), `data/archive/2026/season/player-games.csv`. See `docs/POSTMORTEM_DATA.md`.
- **Wednesday cadences ran:**
  - Reports: `logs/cadence-reports/2026-w05-wednesday.md` (AM) and `2026-w05-wednesday-pm.md` (PM).
  - Both runs exited 1, for known reasons:
    - AM: the YouTube OAuth token expired. Andy has to run `node scripts/youtube-oauth-setup.js`.
    - PM: the alpha packet needs the Friday inputs. Expected; it will fail every Wednesday PM until moved or run with `--allow-stale`.
  - Key Week 5 news:
    - Mayfield is OUT for TNF.
    - Lamar did not practice; Huntley is BAL's likely QB1.
    - Chase is in concussion protocol; Higgins did not practice.
    - Caleb Williams is out; Bagent starts at GB.
    - Barkley has a hamstring injury, and Lane Johnson has retired.
    - Kalshi: ATL 28 → 62 over BAL.
- **Commits today:** `debf64b` (article-intel review parser + toolbox; not written by Team 2, tests 9/9 pass) and `bb27b05` (Wednesday cadence data outputs + BEO Week 5 TB@DAL board).

## 2. Next lane: compile Week 5 market lines

Goal: one complete, sourced Week 5 line set for all 15 games (spread, total, ML; openers → current) for the Master Intel build, the SuperContest and the card. Runbook: `docs/MASTER_INTEL_REPORT_RUNBOOK.md` (steps 3, 4 and 8a, plus the line-movement section).

**What already exists**

| Source | File / table | Coverage | Notes |
|---|---|---|---|
| BKR paste (Andy) | `data/odds/BKR_current_lines_1005_1205` (+ `_buildfmt`, `.provenance.md`) | 12 of 15 games | Missing MIN@NO, BAL@ATL (SNF), BUF@LAR (MNF). NYG@WAS has no ML, so `build.py` skips it. CHI@GB label fixed to 10:00 PT. |
| TheOddsAPI → Supabase | `game_odds_snapshots` (week=5, DK/FD/MGM, last capture 10/06 21:00Z) | 15 of 15 | Read-only. Rows captured 07-09…08-24 for **Week 4** games are mis-tagged `week=5`: filter `captured_at >= '2026-08-25'`. Spread column = home spread. No new pulls from a session; only the Tuesday cadence spends credits (≈470 left). |
| US-book gap fill + lookahead→now moves | `reports/analysis/week5-intel/w05-prep-2026-10-07.md` | 3 missing games + 10 big movers | Reference only, not BKR. |
| Action Network openers | `data/odds/actionnetwork-openers-2026-w05.json` | **not built yet** | `python3 scripts/master-intel/actionnetwork_openers.py --week 5`. This is the line-movement baseline; run it on the laptop if the bridge can't reach AN. |
| BEO prop/game boards | `docs/Player_Prop_Odds_Weekly/Week5/` | TB@DAL only (Andy pasted) | Parse: `python3 scripts/props/beo.py docs/Player_Prop_Odds_Weekly/Week5 data/generated/props/beo-w05.json` |
| DK Predictions | `scripts/props/dk-predictions-mhtml-parse.py` | none saved for Week 5 | Andy saves the pages. |
| SuperContest contest lines | `data/supercontest/week-05-lines.json` | **missing** | Week 4 precedent: `week-04-lines.json`. `live-market-comparison.json` still says `supercontest_week: 4`. |
| Kalshi / Polymarket | `data/prediction-markets/latest.json` (10/07 PM) | all games | Contract percentages, not sportsbook odds. |

**Suggested order**
1. Read `logs/cadence-reports/2026-w05-*.md` (any newer than the two above), then `git status -sb` and `git log -5 --oneline`.
2. Build the AN openers for Week 5.
3. Ask Andy for a fresh BKR board paste covering all 15 games, especially the 3 missing ones. Save it as `data/odds/BKR_current_lines_<MMDD_HHMM>` with a `_buildfmt` copy and a provenance note, following the 1005_1205 pattern.
4. Get the SuperContest Week 5 lines from Andy, or read-only from nfl-supercontest.com, into `data/supercontest/week-05-lines.json`. Then check the contest line against the book line for every game (≥ 1.5-pt middle check).
5. Write one consolidated table: `reports/analysis/week5-intel/w05-market-lines-<date>.md` (+ json). Columns: game, kickoff PT, AN open, BKR now, DK/FD/MGM (Supabase), contest line, Kalshi %, move since open, key injury news. Flag moves ≥ 1.5 pts and QB changes (TB Mayfield out, BAL Lamar doubtful, CHI Bagent).
6. Run `python3 scripts/master-intel/build.py --week 5 --date <BKR date> --no-export` once the inputs exist. Evidence cadence only: no wagering synthesis until the readiness gates pass. TNF TB@DAL is Thu 17:15 PT (DAL −8.5 to −9.5, total 47.5).

## 3. Open items (not this lane)
- **Fantasy:**
  - Honey Badgers has no starting kicker.
  - Rose Bowl K Butker is on bye (KC bye).
  - Chase, Breece Hall and Swift are injured starters.
  - Bucky Irving loses Mayfield for TNF; lock decisions are due before Thursday night.
- **"Weekly fantasy waiver results check" scheduled task** (`trig_01Bd9zqWrPADW41XeG12q2E8`) was held at 05:00 with `device_absent`. Team 2 ran the check by hand at 07:35, and the baseline is refreshed. Andy may want it moved later than 05:00.
- **Supabase hygiene** (week tag fix) and the BUF@LAR Bills credit both need Andy.
- Survivor team-ID bug: `scripts/sync-yahoo-survivor.mjs`, `NFL.T.33`.

## 4. Guardrails (unchanged)
- Sportsbooks and pool sites are read-only.
- No TheOddsAPI calls from a session.
- No Supabase writes or paid model calls without Andy's per-action OK.
- Ledger changes record only what Andy reports or what box scores settle.
- Commit via the temp index with explicit paths, never `git add -A`. Use `git -c core.fsmonitor=false`. Whole-repo `git status`/`diff` can hang over the bridge, so path-limit them and use `timeout_ms`. Move stale `.lock` files directly under `.git/` (no deletes allowed).
- Every handoff document goes to both the repo and the DEV project.

## 5. Resume prompt
> You are Claude Team 2 continuing NFL_Dashboard ("Platinum Rose"). Read `handoffs/2026-10-07-1555-claude-week5-market-lines-handoff.md`, then run `git -c core.fsmonitor=false status -sb -uno` and `git log -5 --oneline` in E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Read any `logs/cadence-reports/2026-w05-*.md`. Then compile the Week 5 market lines per §2. Guardrails per §4.
