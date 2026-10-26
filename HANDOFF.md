# NFL_Dashboard — Current Handoff

## PICK UP HERE (2026-10-26, Claude → Codex H2C2)

- **PICK UP HERE:** `handoffs/2026-10-26-0745-claude-h2c2-codex-briefing-w7-mobile-tracker-hedge-watch.md`. Week 7 real tickets are all settled (31 tickets, net −$233.60); mobile Live Tracker (`scripts/generate-live-tracker-mobile.mjs`, private artifact https://claude.ai/artifact/Q7NBq3G5MLgzVzraUPsuiy); Hedge Watch alerts (`scripts/lib/hedge-alerts.mjs`) with 5 scheduled pre-window runs. The resume prompt for Codex is in §9. Snapshot: `reports/handoff-snapshots/2026-10-26-h2c2-w7-mobile-tracker-hedge-watch/`.
- Newer session handoffs the index was missing: `handoffs/2026-10-25-1415-claude-w7-sunday-tracking-mobile-tracker-next.md`.
- Last verified HEAD: `b98a243` on `claude/w5-prop-cards-2026-10-11` (before the H2C2 commit).

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
