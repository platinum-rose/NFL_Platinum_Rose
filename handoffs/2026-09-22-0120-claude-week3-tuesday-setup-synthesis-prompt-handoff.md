# Handoff — 2026-09-22 01:20 PT — Week 3 Tuesday setup: ticket reconciliation + weekly synthesis prompt

Repo `E:\dev\projects\NFL_Dashboard` · branch `wip/yahoo-sync` · Supabase `aambmuzfcojxqvbzhngp`.
Supersedes the pickup in `handoffs/2026-09-21-2310-claude-week2-closeout-handoff.md`.

## Resume prompt (paste into a fresh session)

```
Resume NFL_Dashboard ("Platinum Rose") — Week 3 intel gathering (Tuesday/Wednesday).
Repo: E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard), branch wip/yahoo-sync.
Supabase aambmuzfcojxqvbzhngp.

Start from HANDOFF.md + live git (git status -sb, git log -5 --oneline), then read
handoffs/2026-09-22-0120-claude-week3-tuesday-setup-synthesis-prompt-handoff.md.
Then run agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md for 2026 Week 3 in TUE-WED mode
(read only that prompt; follow its phases and STOP A/B/C checkpoints).

Today's goal: gather and digest all Week 3 intel (articles, X bookmarks, podcasts/YouTube,
expert picks, injuries/starters, lines, prediction markets) and get every stale source
refreshed. Deliver the preflight freshness table + refresh asks first (STOP A), then the
digest (STOP B). Also: Bills-win credit play (lands Wed 9/23 by 7pm ET) and the futures
exposure matrix + Super Bowl price check (STOP C for non-SB boards).

Pending decisions for me: (1) Supabase sync of 19 ticket numbers + 1 book fix (dry-run diff
is in the handoff); (2) AssemblyAI top-up (podcasts blocked); (3) whether to build Codex's
bookmaker-live-parser CLI. Standing rules: Supabase writes need my per-change OK; no paid
synthesis without approval; scoped commits, never git add -A; ask once for delete permission
on E:\dev for .git lock cleanup.
```

## Done this session

**Week 2 ticket numbers (local wagers JSON; gitignored)**
- Every Week 2 ticket now has a ticket number:
  - 12 from BetOnline receipts (PDFs in `docs/tracked-wagers/`, untracked on purpose, since they're account records)
  - 7 parsed from the ticket IDs
- **Book correction:** `bet_20260920_bkr_indkc_sgp6_1959` ($10 IND@KC 6-leg SGP) was placed at **BetOnline** (receipt 998181629-1), not Bookmaker. The book field is fixed and a note added; the ID is kept so the Supabase row updates in place.
- Backup of the file before these changes: `scratch/user-placed-wagers-2026.backup-2026-09-22-ticketfill.json`.
- Week 1 BetOnline/Bookmaker/DraftKings ticket numbers stay null. Andy: not needed.

**Supabase — NOT yet written (awaiting Andy's OK)**
- `node scripts/sync-placed-wagers-to-bankroll.mjs` would change only:
  - `ticket_number` null → value on 19 Week 2 rows
  - `source` Bookmaker → BetOnline on `bet_20260920_bkr_indkc_sgp6_1959`
- Verified by intercepting the upsert and diffing against live rows: 0 status/stake/profit/odds/date changes, 0 new or orphan rows.
- The public JSON copy was already refreshed locally by that run.

**Commits (all pushed)**

| Commit | What |
|---|---|
| 213c15c | Week 2 post-mortem: book split BKR 25-25-1 / BEO 60-63; Bookmaker "edge" removed from watch list; near-miss line relabelled |
| 7cd7005 | `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md` + `scripts/weekly-synthesis-preflight.mjs` |
| c03fbe2 | Codex review fixes: ledger location, `docs/FUTURES_HEDGE_REFERENCE.md`, ≤60k budget + STOP A/B/C, lock rule, AGENTS.md #16 |
| 67d2176 | Old WEEKLY_BETTING_ANALYST prompt neutralized (triggers [], reference-only) |
| a0ad4b4 | PM_PROMPT roster routes weekly card work to the new prompt |

Codex final review of `a0ad4b4`: **no blocking findings**.

## Week 3 intel status at 01:00 PT Tue

- **Preflight: 10 of 21 local inputs stale.**
  - secondary matchups (still Week 2)
  - prediction markets + coherence (61h)
  - roster map (73h)
  - alpha packet (72h)
  - BKR current lines (47h)
  - Week 3 prop boards (none yet)
  - BEO/BKR futures boards (9/08–09)
  - legacy podcast recs file
- **Podcasts blocked.** The AssemblyAI balance is negative; 3 episodes errored 9/20–21. The BettingPros MNF episode is stuck `pending` (Week 2 content; marking it skipped needs a Supabase OK).
- **Articles and X bookmarks are flowing** (ESPN, VSiN, Rotowire, PFT, PFF, Action Network, BettingPros).
  - The Sharp Football feed has been down since 9/19.
  - `x_sharp_tweets` hasn't been written since June; the bookmarks pipeline replaces it.
- **Week number:** no Week 2 state needs clearing. Intel tables are timestamp-based, and the tweet scanner rolled to Week 3 at Tue 00:00 ET.
- **Line data trap:** `game_odds_snapshots` holds 16 stale preseason rows labelled week 3. Always filter by kickoff window (prompt Q2 does).
- **Futures:** BUF SB at BEO moved from +1000 to +750 this week (position blended +992). Only Super Bowl prices auto-ingest; other futures markets need Andy's screenshots.
- `public/weekly_stats.json` is 2025 data. Don't use it.

## Open items / needs Andy

1. OK the Supabase ticket-number sync (above).
2. Top up AssemblyAI, then re-run Podcast Ingest.
3. Bills-win credit (Wed 9/23 by 7pm ET). Andy's default is LAC + points; the post-mortem rule says to avoid spread dogs. The session will show both options.
4. Codex `bookmaker-live-parser.mjs`: go or no-go.
5. Carryovers:
   - eslint on `scripts/generate-live-tracker.mjs`
   - paper AI Master RR still pending
   - `HANDOFF-1.md` at the repo root (an old auto-generated 9/10 handoff, untracked; left alone)
   - Other-session uncommitted edits in `agents/dev/WEEKLY_BETTING_ANALYST_PROMPT.md` (left unstaged)

## Environment notes

- The device VM has no network. Use Firecrawl (`maxAge: 0`) on the ESPN summary API for box scores.
- Git in the VM prints a harmless "Empty last update token" warning and leaves `.git/index.lock` behind after commits. It needs delete permission on `E:\dev` (request once per session).
- Commits here were staged index-only where other agents had uncommitted edits in the same file.
