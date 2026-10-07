# Handoff — Wed 2026-10-07 01:05 PT — Week 4 post-mortem page done, Week 4 ledger closed; Week 5 prep started

**Team:** Claude Team 2 (continued from `handoffs/2026-10-06-2345-claude-week4-archive-automation-postmortem-next-handoff.md`).
**Git:** `main`, **committed locally, not pushed** (Andy pushes; preference recorded 10/06). Commit via the temp index only. Real `.git/index` reset to HEAD after the commit (0 staged).

## 1. Done
- **`reports/bets/season-recap/week4-post-mortem.html`** — Week 1/2 format plus expert post-game views with source links. Cash $401.32 on 27 tickets, $126.39 back (3 BKR RRs) + $8.70 free-bet win → **−$266.23** (cash-only −$274.93). Placed legs 85/171. Projection 9/15 winners, totals +2.8 over, margin MAE 7.5.
  - Inputs/scripts: `ai_recs_w4.py` (card + 7b-A/B/C + SNF ladder + TNF S1/S2), `scripts/cfg_w4.py`, `scripts/paper_w4.py` → `w4paper.json` (11 paper tickets + 8 unbooked builds), `w4legs.json` via `build.py`.
  - Rebuild: `cd reports/bets/season-recap/scripts; WEEK=4 RECAP_DIR=.. PYTHONPATH=..:. python3 build.py && python3 paper_w4.py`, then run `gen_week.py 4` / `page_week.py 4` from a dir holding `w4legs.json w4paper.json w4gamesum.json css_part.txt` (PYTHONPATH=scripts:season-recap) and copy the html back.
  - Grader changes (backward compatible; W1–3 diffs unchanged): kicking points (Boswell 4 → TNF leg graded LOST), D/ST TD legs, TD counting by exact box name first (Bijan vs Brian Robinson Jr. was double-counting), Python 3.10 f-string fix in `gen_week.py`, season table from `cfg.SEASON`.
- **Two unplaced AI builds would have cashed:** TNF S2 (CLE ML + Rodgers 1+ INT) and 7b-A (Darnold / Purdy 2+ TD, Bolton / Cashman T+A, $5 → $38.45). Official SuperContest five 4/5 vs AI five 3/5.
- **Recommendation ledger Week 4 section (D14–D26)** — repo `docs/claude-project-dev/recommendation-ledger-2026.md` and DEV project `claude/recommendation-ledger-2026.md` (same content). Claude right: D14, D19, D21, D25; Andy right: D18, D26; Andy closer: D17; agreements D15/D16; rest IRRELEVANT.
- `weekly_review.py --week 4` + `build_season_report.py --week 4` rebuilt; `provenance.json` now has Week 4 ticket overrides (claude 5 / mixed 15 / andy 7). Season: −$1,321.89 on $1,699.29 cash.
- **Week 5 prep:** `reports/analysis/week5-intel/w05-prep-2026-10-07.md` — CHI@GB 10:00 fix in the BKR `_buildfmt` + provenance; US-book gap fill for MIN@NO, BAL@ATL, BUF@LAR (read from Supabase, no API call); lookahead→current moves; open items.

## 2. Not done / for Andy
- **Ledger hygiene (needs OK — wagers file):** 9 legs inside settled Week 4 tickets still `PENDING` (TNF props, ATL +4, Winston/Daniels/Herbert INT). Box scores grade them; no ticket result changes.
- **Supabase hygiene (needs OK — write):** `game_odds_snapshots` rows for Week 4 games captured 07-09…08-24 are tagged `week=5`.
- Old Week 2 paper record `paper_20260920_ai_master_rr_w2` still PENDING in `paper-wagers-2026.json` (its legs are graded in `w2paper.json`).
- BKR board for the 3 missing Week 5 games (Andy paste). Bills credit → LAR side on BUF@LAR (Andy places).
- `reports/bets/season-recap/work/metrics_w4.json`, `parts_w4.json` left untracked (build intermediates).
- Cleanup Andy can do on Windows: `.git\HEAD.lock.stale-20261007a/b`, `.git\main.lock.stale-20261007a`, `.git\objects\*\tmp_obj_*`.

## 3. Next
1. After 10:15 PT read `logs/cadence-reports/2026-w05-wed*.md` (first new cadence report) and the 15:40 one.
2. Week 5 Master Intel evidence cadence per `docs/MASTER_INTEL_REPORT_RUNBOOK.md`; TNF TB@DAL Thu 17:15 PT (DAL −8.5, 47.5 at DK).
3. Survivor team-ID bug (`scripts/sync-yahoo-survivor.mjs`, `NFL.T.33`) still open.

## 4. Guardrails
Unchanged from the 10/06 23:45 handoff §7, plus: commit locally only, Andy pushes.

## 5. Resume prompt
> You are Claude Team 2 continuing NFL_Dashboard ("Platinum Rose"). Read `handoffs/2026-10-07-0105-claude-week4-postmortem-done-week5-prep-handoff.md`, run `git -c core.fsmonitor=false status -sb` and `git log -5 --oneline` in E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard), read `reports/analysis/week5-intel/w05-prep-2026-10-07.md` and any `logs/cadence-reports/2026-w05-*.md`, then continue Week 5 prep (§3). Guardrails per §4.
