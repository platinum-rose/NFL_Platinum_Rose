# NFL_Dashboard — Current Handoff

## Pick up here — November 24, 2026 14:00 PT: W12 pools + island prep (Claude Team 1 -> Claude Team 2, H2C2)

**PICK UP HERE:** read `CLAUDE.md` "Lean Session Rules" (top), `STATE.md`, then [`handoffs/2026-11-24-1400-claude-h2c2-team2-briefing-w12-pools-prep.md`](handoffs/2026-11-24-1400-claude-h2c2-team2-briefing-w12-pools-prep.md). Snapshot: `reports/handoff-snapshots/2026-11-24-h2c2-w12-pools-prep/`. Branch claude/w5-prop-cards-2026-10-11. First deadline: GB@LAR pool picks before Wed 5:00 PM PT. Entries below are superseded, kept for history.

## Pick up here — November 21, 2026 · Week 11 Intel finalization (Codex → Claude)

Reconcile live Git in `E:/dev/projects/NFL_Dashboard`, then read
[`handoffs/2026-11-21-week11-intel-finalization-START-HERE.md`](handoffs/2026-11-21-week11-intel-finalization-START-HERE.md).
The Saturday research HTML is ready for review. The official Saturday gate was RED at the last check, so finalization starts with the evidence refresh and matchup deltas.

## Pick up here — November 19, 2026 16:30 PT: Week 11 TNF placed / pools, futures, bankroll (Team 1 -> Team 2)

Read `CLAUDE.md` and `docs/OPERATIONS_MAP.md`, then `handoffs/2026-11-19-1630-week11-tnf-placed-pools-futures-bankroll-START-HERE.md`.
Branch: claude/w5-prop-cards-2026-10-11. TNF: 3 tickets placed and logged; settle after the game. Open: BKR ledger fixes (Andy's OK), Circa futures prices, W11 fair lines + Sunday card. `data/bankroll/` is private and gitignored.

## Pick up here — November 16, 2026 20:40 PT: Week 10 MNF final / Week 11 open

Read `handoffs/2026-11-16-2040-claude-w10-mnf-final-settle-next-START-HERE.md` first.
Branch: claude/w5-prop-cards-2026-10-11. First task: settle the 7 MNF tickets (LAC 23, BAL 20 final),
then report the final W10 P/L. Live Tracker is built for Week 11. Older entries below.

## Pick up here — November 2, 2026: Monday / Week 8

Read only handoffs/2026-11-02-week8-monday-resume.md after reconciling live Git
in E:/dev/projects/NFL_Dashboard. Reuse this checkout and its private inputs.
Branch: claude/w5-prop-cards-2026-10-11. Pre-closeout HEAD: da68caa; the commit
containing this handoff is the new checkpoint.

Monday cadence completed as a dry-run settlement preview per Andy's log.
SNF is final; CHI@SEA was pending. Saved reconciliation files are older than
that log, and the local ledger already contains settlement updates. Reconcile
read-only; do not attribute ledger writes to the preview or blindly replay them.

Completed: compact tracker titles/tooltips, combined-yard grading, live completion
aliases and explicit inclusive sack thresholds. Current focused checks: 38/38
across nine files; production build PASS. Last full suite was historically
2094/2114 with 20 unresolved failures; not rerun in this closeout.

Next: read-only Monday readiness review, then establish the next task with Andy.
Before MNF candidates, load the synthesis prompt and slot 9, run preflight with
--no-fetch, refresh required evidence and pass a scoped strict roster gate.
Stop on required stale evidence, roster failure, or a started/final target game.

The repo is public. Private ledgers, generated personal trackers, reconciliation
details, raw sources, backups and unrelated dirty work stay local and unpushed.
No clean/reset/stash or broad staging. No wagers, accounts, paid calls, Supabase
writes, settlement apply, tracker rebuild, publication or push without current
per-action approval. Closeout push approval is not standing authorization.
