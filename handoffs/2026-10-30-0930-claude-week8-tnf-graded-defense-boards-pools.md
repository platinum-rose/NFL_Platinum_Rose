# Claude handoff — Week 8 TNF graded, defensive boards built, pools re-slotted (October 30, 2026, ~9:30 AM PT)

## Resume

1. Read `HANDOFF.md`, reconcile live Git. Branch `claude/w5-prop-cards-2026-10-11`, **8 local commits ahead of origin** on top of `03cd52c` (Andy pushes). Use `git -c core.fsmonitor=false`.
2. Git lock note: this session's VM cannot delete files, so git left lock files; they were renamed to `.git/stale-*-claude-*`. Andy can delete them.
3. Suite: not run in full. Focused runs pass: liveTrackerRegression 6/6, defensiveProps 5/5, defensiveBoards 8/8, dkpEventFeed 11/11.
4. Preserve unrelated dirty/generated work: the wagers file has a number-format-only re-save from a 7:27 AM job (10.0 → 10). Two scripts carry Codex's uncommitted atomic-write repairs (`scripts/build-player-availability.js`, `scripts/sync-live-market-lines.mjs`).

## Done since the 5:40 PM handoff

- **Live tracker fix** (`4ebb736`): ESPN scoreboard URL had `groups=50` (NCAA filter) → 0 NFL events, so live stats never updated. Built tracker HTML patched in place (uncommitted, as before).
- **TNF graded** (CAR @ GB, GB 27–19; `69ced5e`):
  - All 8 TNF-only tickets lost (cash −$51.02; DK promo $29.85).
  - BKR 740983886 (Jacobs ATD) and 740984963 (Love 2+ TD) TNF legs won; both still alive.
  - Another session ("Claude TNF settle check-in 20:50 PT") settled the wagers file first with identical grades; its version was kept.
  - Ledger TNF section + D52/D53 paper grades written (repo + DEV project).
- **Supabase settle** (Andy approved 9:43 PM): 8 rows in `user_bankroll_bets` set lost/loss, profit −amount, per-leg results. Receipt: `reports/analysis/week8-tnf-postmortem/supabase-settle-receipt-2026-10-29.md`.
- **TNF post-mortem with source attribution** (`5ddb815`): `reports/analysis/week8-tnf-postmortem/w08-tnf-postmortem-2026-10-29.md`.
  - TNF legs went 25-14-1; tickets died on leg count.
  - Weeks 4–7 expert history graded (795 picks).
  - Sunday rules: 3–4-leg cores, sourced legs only, re-score conditional legs at inactives, no yardage behind a broken OL, correlation check.
- **Defensive props layer** (`4df3db1`, `832b0a7`, `82883eb`):
  - `npm run defense:props`, backtests, nflverse snaps/PBP backfill, Andy's 124 defensive legs graded.
  - Andy's legs: tackles +28% as straights, sacks −37%, QB INT −26%.
  - Findings: `docs/defensive-props/defensive-intel-findings-2026-w07.md` (also in DEV project).
- **Defensive boards saved weekly** (`ff8fd25`):
  - BetOnline parlay-builder ladder parser (drop folder `data/intake-drop/beo-sgp/`).
  - DK defensive tab chips plus `--defense-only`.
  - Merged weekly boards plus season history; grader; priced-offers table on the sheet; role-change flag from snap share.
  - Runbook: `docs/defensive-props/DEFENSIVE_BOARDS_RUNBOOK.md`.
- **Pools** (this morning; uncommitted until this handoff's commit):
  - Duma rule fixed in `data/pickem/pools-2026.json` (top slot 16; one rolling 4-week prize).
  - Friday re-slot appended to `reports/bets/2026-w08-pool-picks-proposal-2026-10-29.md` (DK via ESPN, 9:10 AM PT). The only change: BUF 8 / DET 7.

## Open for Andy

1. Push the branch.
2. Run once: `npm run props:dkp:launch`, then `npm run props:dkp:defense`, to confirm DK's real chip labels. Then `npm run props:defense:register` to schedule.
3. Tell Claude how he reaches BetOnline's parlay-builder board (tab/button label) so the BOL scraper can capture it. Claude in Chrome was not connected, and the built-in browser blocks sportsbooks.
4. Check for a duplicate TNF grading scheduled task (another session graded the same tickets).

## Next

1. **~1 PM PT Friday injury report:** recheck A.J. Brown (NE), Kincaid/DJ Moore (BUF), Gibbs/St. Brown (DET), Bucky Irving (TB; also a leg on BKR 740983886), why TB's moneyline was off the board; adjust the re-slot.
2. Sunday morning: refresh prices, inactives, enter Sunday slots (duma 3–9/11–16, Yahoo, CBS), Sunday tiebreaker 1 (SEA 24–21, WSH 23–17 proposed; not confirmed entered).
3. Sunday: BKR weekend parlays (WSH ML SNF cap on both); PHI hedge watch.
4. Andy runs `npm run twitter:bookmarks` on Windows; transcribe the Sal Bets TNF/Week 8 videos.

## Guardrails

- No wager, account, Supabase, paid call or publication without Andy's per-action OK.
- No player-named output without a current strict roster gate.
- Stage narrowly; never `git add -A`.

Resume prompt:
```
Resume Platinum Rose NFL. HEAD = <commit containing handoffs/2026-10-30-0930-claude-week8-tnf-graded-defense-boards-pools.md> (claude/w5-prop-cards-2026-10-11, 8 ahead of origin unless pushed). TNF graded and settled; two BKR weekend parlays alive. Next: 1 PM PT Friday injury report re-check of the pool re-slot, then Sunday entries. Read HANDOFF.md, reconcile live Git, then handoffs/2026-10-30-0930-claude-week8-tnf-graded-defense-boards-pools.md.
```
