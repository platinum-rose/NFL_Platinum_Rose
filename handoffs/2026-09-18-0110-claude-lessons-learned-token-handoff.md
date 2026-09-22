# Handoff — 2026-09-18 — Betting Lessons Learned Captured, Session Handoff for Token Refresh

**Session type:** Claude (Cowork), via `mcp__remote-devices__device_bash` bridge to Andy's Windows machine. Short continuation session, immediately following the 2026-09-17 TNF close-out session (see `handoffs/2026-09-17-2130-claude-tnf-close-price-watch-handoff.md`). This handoff exists specifically because this session is handing off to a fresh Claude session/instance to continue while tokens refresh — treat it as a cold-start briefing, not just a log entry.

## What shipped this session
### 1. New durable file: `docs/BETTING_LESSONS_LEARNED.md`
Andy asked to save the assessment of the TNF (DET @ BUF) card as a reusable lesson for future card-building, separate from the engineering-only `.atlas/lessons-learned.md`. Wrote a new file with:
- A "Week 2 TNF — 2026-09-17" entry covering: 14 of 18 unique player-prop legs hit clean, but 5 of 6 tickets still lost net because they were multi-leg parlays (one weak leg — Goff's 0-INT read, or Shakir's two near-misses — busts the whole ticket even when most legs hit); near-miss detail (Shakir missed receiving yards by 6.5 yds, receptions by exactly 1 catch); "graveyard" legs that hit with big margin but never got a standalone payout because they were buried in busted parlays (Cook rushing +54.5 over the line, Kincaid receiving +40.5, Gibbs receiving +29.5, Rousseau sacks 4x the line); and the actionable takeaway — fire the highest-margin reads as smaller standalone/2-leg tickets alongside the larger parlays, not only inside them.
- A reusable template for future entries (`## Week N <day> — date: <matchup>` / Headline / Near-misses / Graveyard legs / Actionable takeaway) so this file accumulates lessons game over game instead of being a one-off.
- Linked from `HANDOFF.md`'s "next session should start by" pointer so it surfaces automatically before the next card gets built.
### 2. Project memory updated
`/projects/01a0a41e-42ae-7769-a74b-5bdf69561eec/areas/nfl-dashboard.md` (Claude's cross-session project memory, separate from this repo) got a condensed version of the same lesson appended, so it surfaces in any future Claude session on this project even without reading the repo file.

## Everything still open from the 2026-09-17 TNF session (carried forward, unchanged)
1. **Andy still needs to restart the toolbox server** — picks up the double-tab launch fix and the 09-15 Human Review route fix (both need a fresh process; the running one predates them).
2. **Next real pipeline step: run the Friday intel cadence for the Sunday/Monday Week 2 slate.**
   `node scripts/toolbox.mjs --cadence friday`
   Runs in order: `build-player-availability.js --live-injuries` → `build-projected-starters.js` → `build-secondary-matchup-vulnerability.js` → `build-player-props-intel.js` → `build-alpha-data-packet.js`. Intentionally NOT run yet across either session — Andy asked to "prepare for the next session to start processing intel," not to run the pipeline itself.
3. **No paid synthesis run, no authorization requested or given.** If Sunday/Monday intel work is expected to include `agents/portfolio-synthesize.js`, that still needs Andy's own explicit per-run authorization (standing constraint, not yet satisfied).
4. **Nothing committed or pushed.** Working tree has ~1017 dirty files (`git status --porcelain`) spanning real feature work, generated data, and scratch/probe scripts going back several sessions. Git guardrail is REPEALED (normal judgment applies, per Andy's 2026-09-15 confirmation) but no one has done the deliberate triage-and-batch-commit pass called out in the 2026-09-15 handoff. This is now overdue across 3 sessions.
5. TNF tickets are fully closed: 6 settled tickets net **+$17.98**, synced to Bankroll/Supabase (`sync-placed-wagers-to-bankroll.mjs`, real run — do not treat as a standing green light for future Supabase writes, Andy authorized that specific run). The 11-team parlay (`bet_20260917_738825741_bkr_11team_ml_parlay`) still has 10 legs pending on Sunday/Monday games — correctly left as a PENDING ticket with only its BUF ML leg graded.

## Standing constraints (unchanged, still in effect)
- Git commit/push guardrail: REPEALED as of 2026-09-15 — normal git judgment applies (conventional commits, `--force-with-lease` never `--force`, check `AGENT_LOCK.json` before any force-push).
- Supabase writes: need per-change authorization from Andy. Not a standing blanket approval even though it's been granted twice now (09-15 area, 09-17 Bankroll sync).
- No paid synthesis runs (`agents/portfolio-synthesize.js`) without Andy's own explicit per-run authorization.
- Repo access is exclusively via the `mcp__remote-devices__device_bash` bridge (E:\dev mounted at `$HOME/mnt/dev` on Andy's Windows machine, repo at `projects/NFL_Dashboard` under that mount) — never plain cloud-sandbox Bash/Read/Edit/Write for this repo.

## Reorientation prompt for the next Claude session
A self-contained prompt for a fresh Claude/Cowork session picking this up is in `HANDOFF.md` under "Current Pick Up Here" and was also given directly to Andy in-chat this session — paste it as the first message to a new session to reorient instantly without re-reading this whole file.
