# Handoff — Tue 2026-10-06 23:45 PT — Week 4 settled + archived; weekly automation live; next: Week 4 post-mortem page, then Week 5 prep

**Team:** Claude Team 2 (continued from `handoffs/2026-10-05-1720-claude-mnf-planner-experts-tickets-handoff.md`).
**Git:** `main`, pushed through the commit that adds this file. Commit only via the temp index (below); the real `.git/index` was reset to HEAD this session (`git read-tree HEAD`) and showed 0 staged.
**Next session (Andy, 23:42 PT):** continue the **Week 4 post-mortem**, then start **Week 5 preparation**.

---

## 1. State at close

- **Week 4 ledger: fully settled.** 0 open tickets, week net **−$266.23** (all 5 MNF tickets graded from the ESPN box score; backup `data/official-picks/user-placed-wagers-2026.json.bak-team2-20261006-035551`).
- **Week 4 archive: done.** `data/archive/2026/week-04/` + Obsidian `NFL/2026/Week 04/` (Games, Teams, Fantasy, Contests, Betting). Yahoo week 4 = postevent/final. Backfill weeks 1–3 done; 25 league drafts 2022–2026 saved (`data/archive/2026/drafts/`, vault `NFL/2026/Drafts/`).
- **Pick'em Week 4 captured** (CBS BUKBUK 19th, 9-way tie at 40; SimplySportsware + Yahoo) — commits `82c114b`, `903b771`, `4a9b9bf` (weeks 1–3 backfill).
- **Tuesday toolbox ran manually 11:44 PT, all 7 steps ok:** Week 4 nflverse stats → Supabase (4,445 weekly / 1,518 seasonal), usage locks from Week 4 (24 candidates), projected starters (0 teams need manual depth chart), Week 5 opening odds written (15 events, 135 rows, 41 line movements; TheOddsAPI **470 credits left**), roster audit 0 conflicts.

## 2. What was built this session (all pushed)

| Area | Files |
|---|---|
| Team post-mortem data | `reports/analysis/season/claude/scripts/team_postmortem.py` → `out/week-NN-teams.{json,csv,-summary.md}` |
| Game data for recaps | `reports/bets/season-recap/scripts/espn_week.py` → `wNgames.json`, `wNgamesum.json`; expert post-game commentary `w4expert-commentary.json`; `recaps_w4.py` (16 games) |
| Live tracker | `scripts/generate-live-tracker.mjs`: `playerNameKey()` strips Jr/Sr/II/III/IV/V (Kyle Pitts Sr. fix); default week = NFL week of (now − 14h) |
| Weekly archive (Mon night) | `scripts/archive/weekly-archive.mjs` (orchestrator), `yahoo-week-archive.mjs`, `yahoo-draft-results.mjs`, `agents/lib/vaultWriter.js`; runbook `docs/WEEKLY_ARCHIVE_RUNBOOK.md` |
| Toolbox cadences on a schedule | `scripts/windows/hidden-tasks/toolbox-<day>.cmd`, `scripts/windows/register-toolbox-cadence-tasks.ps1` (also in `setup-all-nfl-scheduled-tasks.ps1`); `toolbox.mjs --cadence sunday --no-launch` |

## 3. Automation now running (laptop must be on)

**Windows Task Scheduler** (all registered and confirmed by Andy):
- `NFL_Dashboard_Weekly_Archive` — Mon 23:30, Tue 06:00, Thu 06:00 (grades the ledger from box scores with `grade_week.py --apply` — standing OK from Andy 2026-10-05).
- `NFL_Dashboard_Toolbox_<Day>` — Tue 10:00, Wed 09:00, WedPM 15:00, Thu 14:30, Fri 15:00, Sat 10:00, Sun 08:30 + 11:45, Mon 22:30. Logs: `logs\toolbox-<day>.log` (`==== exit N ====` per run). Tuesday spends ~3 TheOddsAPI credits/week and writes Supabase; Saturday mirrors placed wagers to Supabase `user_bankroll_bets` (both approved by Andy 2026-10-06).

**Claude scheduled tasks** (read-only, push notification, report saved to `logs/cadence-reports/2026-wNN-<day>.md`): one "NFL toolbox report: <Day>" per cadence, 25–40 min after each Windows run (Tue 10:40, Wed 10:15, Wed 15:40, Thu 15:10, Fri 15:40, Sat 10:35, Sun 12:10, Mon 22:55). Plus the existing "Weekly pick'em pool capture" (Tue 06:52) and "Weekly fantasy waiver results check" (Wed 05:00). First new report fires **Wed 2026-10-07 10:15**.

## 4. Next: finish the Week 4 post-mortem page (`reports/bets/season-recap/week4-post-mortem.html`)

Follow the Week 1/2 pattern (`week1-post-mortem.html`, `ai_recs_w1.py`, `w1paper.json`, `w1legs.json`) — Andy picked "option 1" (Week 1/2 format) augmented with expert post-game commentary (`w4expert-commentary.json`, already built; paraphrases only).
1. `ai_recs_w4.py` from `reports/bets/2026-w04-card.md` (the AI card recommendations, graded vs `w4games.json`).
2. `w4paper.json`: grade the **11 paper tickets** in `data/official-picks/paper-wagers-2026.json` (Week 4) from box scores. Paper ≠ real — keep separate.
3. `cfg_w4.py`: RET payouts incl. round-robin returns **29.64 / 12.28 / 84.47**, buckets, names, DIV, TEXT, `EXPERTS` path → `w4expert-commentary.json`.
4. `w4legs.json` via `build.py`; then `gen_week.py` / `page_week.py` → `week4-post-mortem.html`.
5. Manual grade: **TNF Boswell kicking-points leg** (not auto-gradable).
6. Then `weekly_review` / `build_season_report` and close the **Week 4 recommendation ledger** (`claude/recommendation-ledger-2026.md` in the DEV project).
Inputs already present: `w4games.json`, `w4gamesum.json`, `recaps_w4.py`, `reports/analysis/season/claude/out/week-04-teams*.{json,csv,md}`.

## 5. Then: Week 5 preparation

- Opening lines are in Supabase (`game_odds_snapshots`, captured 2026-10-06 18:00Z, e.g. TB@DAL DAL −8.5 / 47.5). The Wednesday cadences + reports will bring practice reports, prediction markets and expert sweep automatically — read those reports first rather than re-running.
- Open Week 5 items from `HANDOFF.md` lanes: missing BKR games, CHI@GB time correction, Week 5 Master Intel (evidence cadence only; no wagering synthesis before readiness gates pass), Bills-credit/reload only if Andy authorizes.
- Week 5 pick'em / survivor / fantasy: survivor is eliminated; pick'em capture runs Tuesday after Week 5.

## 6. Other open items

- **Survivor team-ID bug:** `scripts/sync-yahoo-survivor.mjs` maps Yahoo `NFL.T.33` wrong (likely BAL; check the `YAHOO_NFL_TEAMS` map).
- **Week rollover** in shared `src/lib/constants.js` (Tue 00:00 UTC) — change only with Andy's OK.
- **Andy's Windows cleanup** (bridge can't delete): `.git\HEAD.lock.stale-*` (20261005q–z, 20261006a–g), `.git\main.lock.stale-20261006d`, `.git\objects\*\tmp_obj_*`.
- **Left uncommitted on purpose at this close** (local only, nothing lost): untracked `scratch/` (481 files, incl. a 45 MB mp3), 9 repo-root scratch files (`_rev20_*`, `.patch_synth*.py`, `HANDOFF-1.md`, …), 15 test injury-alert Gmail summaries (`.nfl/gmail-summaries/*test-injury-alert*`), 24 `*.bak*` ledger/pick'em backups, 4 dated `team-market-map-2026-09-*.json` snapshots (27–31 MB each), `data/fantasy/Week1_Available_Top_Scorers.xlsx`, and a `.eml` in `docs/`. Commit them only if Andy asks.

## 7. Guardrails (unchanged)

- Sportsbooks read-only; no TheOddsAPI calls from a session (the scheduled Tuesday cadence is Andy's approved spend). No Supabase writes or paid model calls without Andy's per-action OK. Ledger changes only record what Andy reports or what box scores settle.
- Pool sites read-only; never Make/Save/Clear picks; never enter or store passwords.
- Vault: atomic writes via `agents/lib/vaultWriter.js`; never bulk-write through the Linux↔NTFS mount.
- Commit via temp index only, explicit paths, never `git add -A`; git on E:\dev from the bridge: `git -c core.fsmonitor=false`:
  ```
  export GIT_INDEX_FILE=$HOME/tmpidx; rm -f $GIT_INDEX_FILE; git read-tree HEAD; git add -- <paths>
  T=$(git write-tree); P=$(git rev-parse HEAD); C=$(printf 'msg\n\nCo-Authored-By: ...\n' | git commit-tree $T -p $P)
  git update-ref refs/heads/main $C $P && git push origin main; mv -n .git/HEAD.lock .git/HEAD.lock.stale-<date><x>
  ```
- If live Git or evidence contradicts this file, stop and report the mismatch.

## 8. Resume prompt

> You are Claude Team 2 continuing NFL_Dashboard ("Platinum Rose"). Read `handoffs/2026-10-06-2345-claude-week4-archive-automation-postmortem-next-handoff.md`, then run `git -c core.fsmonitor=false status -sb` and `git log -5 --oneline` in E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Read any new `logs/cadence-reports/2026-w05-*.md`. Then finish the Week 4 post-mortem page per §4, and after that start Week 5 prep per §5. Guardrails per §7.
