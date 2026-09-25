# Handoff: Week 3 THU night — TNF graded, four Live Tracker grading bugs fixed

**Session:** Thu 2026-09-24 18:07 → 21:10 PT · **Author:** Claude · **Branch:** `main` (HEAD was `65fbf56` = origin/main at start)
**Commits:** `c717932`, `fc1b7b2` (tracker fixes) + this handoff/card/HANDOFF commit — pushed by Claude at Andy's request.

## 1. TNF graded — ATL 35, GB 14 (total 49). ESPN event 401872948
Box: Love 28/53, 311, 2 TD, 1 INT, 1 rush/0 · Penix 18/25, 256, 1 TD, 1 INT · Bijan 29-194-2 rush, 2 rec · Brian Robinson 10-50-1 · London 9-194, 0 TD · Golden 5-100-1 · Watson 7-96-1 (first TD of game, Q1 5:17) · GB defense 0 sacks.

| Ticket | Result | P/L |
|---|---|---|
| Tier 1 999235271 (BEO) | Love 1+ INT won; Love U19.5 comp (28), Penix o19.5 comp (18), Z. Smith sack lost → Primetime insurance NOT triggered | −$10.00 |
| Tier 2 739202488 (BKR) | Bijan 5+ rec (2) and London TD lost; Bijan 194 / B. Rob 50 / London 194 won | −$6.48 |
| Tier 3 999241744 (BEO) | Love rush (0), Wyatt, Van Ness lost; Golden 100, Penix INT, Watson 96 won | −$5.00 |
| 1st-TD SGP 739213650 (BKR) | Bijan 1st TD lost (Watson first); other 3 legs won | −$5.00 |
| Favorites 739210986 (BKR) | U43.5 lost (49) — dead | −$10.00 |
| GB −4/BUF 739213766 (BKR) | GB −4 lost — dead; open spot need NOT be filled | −$60.00 |
| 8-team open 739211245 (BKR) | ATL +5 WON — alive (5 Sunday legs + 2 open spots) | — |
**TNF night −$96.48.** Wagers JSON (`data/official-picks/user-placed-wagers-2026.json`, gitignored) updated: leg statuses + actual_stat, 6 tickets SETTLED/loss. Backups on the device VM `$HOME/bak/` (session-scoped).
Ledger (DEV `claude/recommendation-ledger-2026.md`): D13, D14, D15 all **IRRELEVANT** (D14 settled TNF, not MNF — GB ML would also have lost). Week 3 tally 0/3/0. The divergent legs D13 (Love INT) and D15 (Golden TD) both hit. Pick'em: GB lost on SimplySportsware (@10) and CBS; Yahoo ATL @3 won.

## 2. Live Tracker fixes (`scripts/generate-live-tracker.mjs`)
- `c717932` **First-TD legs** graded as anytime TD (Bijan's 2nd TD showed HIT). Now read the actual first TD scorer from ESPN `scoringPlays` via self-contained helpers injected with `Function#toString` (build + live poll share code). Team-scoped markets use the team's first TD.
- `c717932` **Bare `interceptions` market** read defensive INTs → QB INT legs never moved. Now: player with pass attempts → INTs thrown.
- `fc1b7b2` **Pass completions** had no grading branch (always 0) — added in all 3 grading sites.
- `fc1b7b2` **Unders graded as Overs** — legs now carry `data-direction` (leg.direction, else "Under" in selection); Unders burn when the line is reached, hit only at final, pace shown vs projection.
- Known, NOT fixed: inside the client template literal, `\b`/`\s` regexes lose backslashes (Jr./Sr. suffix strip emits a backspace char; the pacing `@`/`vs` game-label split uses `s`). Fix with `\\b`/`\\s` or the toString pattern.
- Build note: the device shell can't reach ESPN (`fetch failed`), so build snapshots lack live data; the browser's own poll fills it.

## 3. Ops
- Git on the E: mount could not unlink its lock/tmp files (`HEAD.lock` left by the 18:05 commit). Andy granted delete permission for this session; future sessions without it: stage and hand Andy the commit command, or request delete permission once.
- Bridge dropped briefly ~20:05; recovered by itself.

## 4. Next (Fri 9/25)
1. Open spots: 739211245 (2) — paste slips; update entry. 739213766 is dead (no fill needed).
2. Confirm: SuperContest 5 submitted? (ATL +5.5 covered) · Bills $10 credit · card slots 1–5 (JAX/CIN/BAL/LAR/NO overlap now irrelevant — favorites parlay dead). $6.81 free money unassigned.
3. Friday: Nacua/Darnold status; pick'em leaderboards (all three) → `data/pickem/pools-2026.json` → `npm run pickem:card`; futures §8; Circa re-price if photos arrive.
4. Carry-forward: template-literal regex escapes (above), CI-GREEN, props-intel WIP commit, governance pass, worktree cleanup, FantasyPros published_at bug, futures-ingest quota guard + re-enable Futures Odds Ingest, BEO Primetime terms → promotions-2026.json, Supabase sync of Week 2/3 wager changes (needs Andy's OK).

## 5. Resume prompt
```
Resume NFL_Dashboard ("Platinum Rose") — Week 3 FRI. Repo E:\dev\projects\NFL_Dashboard (device_bash $HOME/mnt/dev/projects/NFL_Dashboard), branch main; verify HEAD vs origin/main.
Read: HANDOFF.md → handoffs/2026-09-24-2110-claude-week3-tnf-graded-tracker-fixes-handoff.md → reports/bets/2026-w03-card.md (bottom) → DEV claude/recommendation-ledger-2026.md (Week 3 TNF results).
State: TNF graded (ATL 35-14; −$96.48; only 739211245 alive on ATL +5). Tracker fixes c717932/fc1b7b2 pushed.
First: Andy's status on 739211245 open spots (2), SuperContest 5, Bills $10 credit, card slots 1–5. Then Friday: Nacua/Darnold injury status; pick'em leaderboards → data/pickem/pools-2026.json → npm run pickem:card; futures §8; Circa re-price if photos arrive. Optional: fix the client template-literal regex escapes in generate-live-tracker.mjs.
Standing constraints: no git add -A; never reset/clean/stash; Supabase writes need per-change OK; no bet placement/account actions; Andy pushes (unless he asks); docs/Futures_Odds/ untracked; no team power ratings as evidence; $6.81 free money unassigned; local scheduled tasks run from this checkout; paste-slip check on every ticket; keep file scans scoped (bridge stalls); git can't unlink lock files on the E: mount without delete permission — request it once or hand Andy the commit command.
```
