# NFL_Dashboard — Current Handoff

## PICK UP HERE (2026-10-26 22:15 PT, H2C2 to Claude Team 2: Week 7 closed, Week 8 next)

- **PICK UP HERE:** `handoffs/2026-10-26-2215-claude-h2c2-claude2-briefing-w7-mnf-close.md`. Week 7 is fully settled: 39 real tickets, $387.51 risked, net −$234.99. MNF DAL 38–21: 8 tickets, −$1.39, DKP 46908050 won $62.00. The briefing covers the MNF island ladders (card §7k/§7l, paper), the Gary sack-line fix, the weekly prop-scraper cadence (live), the Yahoo API briefing for Codex, the needs-Andy list and the Week 8 start (TNF CAR @ GB, Thu 10/29). Snapshot: `reports/handoff-snapshots/2026-10-26-h2c2-w7-mnf-close-claude2/`.
- Newer than the list below and not previously indexed: commits `d8e26bf`, `1d504d7`, `8bc29a6`, `003e861`, `5d0824d`, `08256bc`, `7ab6fb0`, `21864cf`, `0493dfd`. None of them had their own handoff file; the briefing §2 records them.
- Last verified HEAD: `0493dfd` plus the H2C2 commit, on branch `claude/w5-prop-cards-2026-10-11`. `origin/main` = `61da10a`, which is not the working branch. Reconcile live git first.

## Superseded, kept for history: 2026-10-26 Codex day checkpoints (Week 7 football data and analytics)

- Was the pick-up: `handoffs/2026-10-26-codex-week7-football-stats.md`. The provisional post-mortem now includes 13 completed games, team/player stats, scoring plays, and ticket accounting; DAL @ PHI and proposal-vs-results analysis remain open.
- Prior ticket checkpoint: `handoffs/2026-10-26-codex-week7-postmortem-data.md`.
- Prior network checkpoint: `handoffs/2026-10-26-codex-espn-lookup-alignment.md`. The mobile tracker now shares the Monday settlement request helper; live DNS still failed in this shell.
- Prior engineering checkpoint: `handoffs/2026-10-26-codex-hedge-watch-engineering.md` (`35525d4`), including hedge-alert tests and replay results.
- Context and binding guardrails: `handoffs/2026-10-26-0745-claude-h2c2-codex-briefing-w7-mobile-tracker-hedge-watch.md`. Snapshot: `reports/handoff-snapshots/2026-10-26-h2c2-w7-mobile-tracker-hedge-watch/`.
- Reconcile live Git before acting. Preserve the dirty shared checkout and do not touch ledgers, Supabase, betting accounts, or artifact publication without the specific authorization recorded in the H2C2 briefing.

## Superseded, kept for history: Week 7 SuperContest report correction

> Superseded: the SC report was finalized 2026-10-25 (`34b0781`); see the 10/25 handoff.


Repository: `E:\dev\projects\NFL_Dashboard`
Branch: `claude/w5-prop-cards-2026-10-11`
Report checkpoint: `0284a88bf7addbd79601f8891ffa0f821cbe2258`, pushed and verified remotely. A documentation-only closeout follows it; reconcile live HEAD.

Read `handoffs/2026-10-24-1820-codex-resume-supercontest-sides-only.md` for the full resume prompt, source map, build command and remaining requirements.

**Next:** Inspect the exact local Week 7 SuperContest HTML and reproduce Andy's unresolved report issue. Restore substantive spread-only pitch summaries and weekly post-mortems while preserving the established layout, expert sides/current BKR spreads, standings and AI-versus-official tracking. A keyword audit is not proof of a working report.

**State:** Prior build and roster gate passed; rendered behavior remains unverified. No tests run during closeout. PDF remains stale. AI proposal has five sides plus three alternates; Andy/Amanda's official five remain pending.

## Guardrails

- Preserve the dirty shared checkout and local generated/reference files. No reset, clean, stash, broad staging or unrelated commits.
- Use `git -c core.fsmonitor=false` for Git inspection. Live Git wins over historical handoffs.
- SuperContest report is spread sides only; other markets stay out of its cards, expert rows and post-mortems.
- Current BKR capture and fixed contest spreads are distinct; legacy BKR current-lines files are opening-line evidence only.
- No wagers, account actions, official-pick promotion, ledger/Supabase writes or paid synthesis without explicit authorization.
- Rebuild with Windows Python 3.14; mandatory roster gate must pass. Verify actual rendered report before claiming the issue fixed.
