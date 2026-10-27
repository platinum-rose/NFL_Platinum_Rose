# NFL_Dashboard — Current Handoff

## PICK UP HERE (2026-10-27, H2C2 to Claude Team 2: Week 8 readiness and futures update)

- **Start here:** `reports/handoff-snapshots/2026-10-27-h2c2-week8-futures-claude2/H2C2_START_HERE.md`, then the detailed briefing at `handoffs/2026-10-27-1549-claude-h2c2-claude2-closeout-week8-futures.md`.
- Week 7 is closed and its post-mortem / Platinum AI paper-proposal grades are in `reports/analysis/week7-postmortem/`. Week 8 is underway; the Tuesday cadence already ran 10/27 at 07:18 PT. Do not rerun Tuesday; next cadence is Wednesday. TNF CAR @ GB is Thu 10/29.
- The latest BEO futures capture and normalized rows are `data/odds/BEO_futures_1027_1456.md`, `data/generated/futures/betonline-futures-2026-10-27_1456.json`, and `data/futures-imports/betonline-2026-10-27.json`. Reconcile prior movement / merged-duplicate discussion against these saved inputs before recommending portfolio changes.
- Closeout commit: inspect live `git status`, branch, `HEAD`, and upstream before further work. The user's approval covers this scoped project-work commit and push only. The Yahoo API briefing, account statements, private test summaries, scratch media, backups, and `.nfl` transfer buffers were excluded.

### Required startup order

1. Read the H2C2 start brief.
2. Reconcile current Git and upstream.
3. Choose one active lane and load only the mapped artifacts.
4. Consult the detailed briefing / manifest / older handoffs only when that lane needs them.

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
