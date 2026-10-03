# Week 4 handoff snapshot (2026-10-02, 22:15 PT)

Andy asked (10/2 21:56 PT) for every file and artifact the 10/2 handoffs reference to be saved in the repo, so the next team (Claude Team 2, Codex) can pick up from any checkout. Most of these files live in gitignored folders (`dist/`, `data/generated/`, the wagers ledger), so this folder holds **point-in-time copies**. The originals stay where they are and keep being regenerated.

**Rules for this folder**
- These are snapshots: read from them, don't build from them, and don't edit them. The live paths below are the working copies.
- To refresh the hosted client report, rebuild from the live paths (`build.py` → `dist/.../site/`), then republish (handoff §3.3).
- Wager data is included at Andy's explicit request (10/2 21:58 PT).

| Folder | What | Live source |
|---|---|---|
| `master-packet/` | Week 4 Master Intel build from Fri 10/2 21:19 PT: single page (`.html` `.md` `.json` `.docx`), SuperContest companion, and **`site/`, the multi-page client site.** `site/` is the source of the hosted Artifact https://claude.ai/artifact/E6RSz4VGWJayUWNJG9mRi6 (`site/_artifact_index.html` = the hosted home page; `site/index.html` = the same page for local viewing) | `dist/nfl_week4_master_packet/` |
| `master-intel-inputs/` | `w04-pull.json` (pulled 10/2 20:30 PT: 601 signals, 86 expert picks, 0 splits), `w04-roster-vet.json` (PASS), `big-money-flags-2026-w04.json` (empty: no splits yet) | `data/generated/master-intel/` |
| `props/` | Week 4 market boards. BKR combined boards + raw captures for 10/1 and 10/2 (6,304 rows on 10/2), BEO boards (`beo-w04.json`), BetOnline IND@WAS O/U raw, DK Predictions per-game files + inventory + the live-capture folder (highlighted yardage rungs for 289 players). Per-game BKR files are left out: they are split copies of the combined board, and the parser regenerates them | `data/generated/props/` |
| `wagers/` | `user-placed-wagers-2026.json`: the local wagers ledger as of 10/2 22:00 PT, with TNF graded, the 5 official Week 4 tickets and the Jay's Lock Box promo. `live-tracker-sunday.html`: the Live Tracker | `data/official-picks/user-placed-wagers-2026.json` (gitignored), `docs/tracked-wagers/` |
| `other-agents-wip/` | **Not applied to `main`.** Antigravity's billing-alert work: `antigravity-billing-alert-2026-10-02.patch` (podcast-ingest, podcast-gemini-intel, the podcast workflow, preflight) plus `billing-alert.js`. Also `handoffs-team-power-ratings-rule-change.patch`: on-disk edits to 8 Week 3 handoffs that flip the rule to "team power ratings are allowed as evidence" (Andy to confirm) | Working tree (uncommitted) |

**Restored or committed alongside this snapshot**
- `docs/futures-odds-20260929/` (12 raw 9/29 boards) and `handoffs/2026-09-30-0050-claude-futures-exactas-placed-week4-intel-resume-handoff.md` were deleted on disk. Both were restored from HEAD.
- `data/futures-imports/andy-portfolio-ledger-2026.json`: Andy picked the **per-ticket layout** (the on-disk version, saved 9/30 07:35 PT) as canonical. It has 19 positions and the same $179.42 stake as the blended HEAD version, and passes the 69 portfolio tests.
- `scripts/windows/task-backups/`: Antigravity's XML exports of the Windows scheduled tasks (9/19 and the 10/2 restore).

**Not in the repo** (and why)
- The DEV-project docs (`claude/…` on claude.ai):
  - The recommendation ledger is already mirrored, up to date, in `docs/claude-project-dev/recommendation-ledger-2026.md`. It hasn't been updated for Week 4 yet: the TNF tickets, the 10-teamer and the Jay's Lock Box promo are not logged there.
  - The 10/1 and 10/2 DEV handoff docs are summaries of handoffs already in `handoffs/`.
  - The 10/2 22:05 handoff is in `handoffs/` and the DEV project.
- Not built yet: the YouTube pick digest, `data/survivor/pick-intel-2026-w04.json`, the synthesis digest, `reports/bets/2026-w04-card.md`, the narratives and `data/supercontest/locked-card-week-4.json`.
