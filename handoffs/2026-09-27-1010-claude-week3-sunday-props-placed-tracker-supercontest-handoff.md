# Week 3 Sunday: props placed, tracker loaded, SuperContest split stake

**Session:** Claude (Cowork), Sun 2026-09-27, ~03:00–10:15 PT. Continues `handoffs/2026-09-27-0315-claude-week3-sunday-props-card-handoff.md`.

## State at handoff
- Git: `main` at the commit that carries this file (pushed). The dirty shared checkout was preserved, with narrow staging only. A stale zero-byte `.git/index.lock` exists (created by a `git status` from the bridge; the bridge can't delete it). This commit was built with the `GIT_INDEX_FILE`/`commit-tree` workaround. Andy can `del .git\index.lock` locally.
- **Not committed on purpose:** `data/official-picks/user-placed-wagers-2026.json` (gitignored; now holds all Week 3 tickets below). The generated Live Tracker HTML (`public/` and `docs/tracked-wagers/live-tracker-sunday.html`) embeds wager data, so it stays local.
- **No Supabase or Bankroll sync was run.** A backup of the wagers file taken before the edits is in the bridge scratch (ephemeral; not relied on).

## Official Week 3 tickets now in the wagers file + Live Tracker (all PENDING)
BetOnline props (Sunday): 7a #1000102186 ($5 → $125) · 7b #1000104912 ($5 → $280) · 8a first-TD #1000172970 · ATD 6-leg #1000175585 · 8-leg #1000179616 · 8-leg #1000184658 ($8.85) · first-TD #999770738 (9/26) · 2+ TD 4-leg (no ticket #, $5 → $505) · last-minute 8-leg (no ticket #, $5 @ +16300 → $820; 3 CIN@PIT legs).
Bookmaker game tickets: Master RR #739361263 ($105) · 8-team #739361262 ($5) · 5-team #739361521 ($20.47) · 6-pt teaser #739360277 ($25.53) · 5-team #739360142 ($25.08) = **official Week 3 SuperContest five** (TEN +3 / PHI −4 / CIN −3 / JAX −3 / SF −8) · dog-ML RR #739358766 and favorites 8-team #739211245 (already in the file).
Leg-by-leg detail: `reports/bets/week3-prop-placements-2026-09-27.md`, `reports/bets/week3-game-card-record-2026-09-27.md`. Official Platinum Rose 4-leg paper rec (SF −7.5 + 3 Unders) remains paper-only and separate.

## Decisions Andy made this session (now in the templates)
1. **No round robins with player props.** Prop RR retired in `docs/NFL_WEEKLY_CARD_PROCESS.md` and `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`. Props go only in the slot 7/8 stack templates.
2. **SuperContest split stake from Week 4:** ~$15 5-team parlay + $10 2-team RR on the same five (Bookmaker). New section in the card-process doc. The opposite-side reverse RR was evaluated and rejected (math in that section).
3. Pick'em: Yahoo tiebreak entered PHI 23–20, LAR 23–20. Plan: `reports/pickem/2026-w03-pickem.md` (SimplySportsware = market order around GB@10; Yahoo = CLE@1, TB@2 flips around ATL@3; CBS = favorites except CLE, TB). Andy's actual entries were not confirmed back, so `data/pickem/picks-2026-w03.json` still shows only the Thursday picks.

## Open items for the next session (time-ordered)
- **#739211245 has 2 open spots** (BKR). Fill before the chosen games lock (BAL@DAL 1:25 PT; earlier recommendation PHI ML / BAL ML). Andy's call.
- Template gaps: slot 3 (morning parlay, now impossible) and **slot 4 afternoon parlay capped with the SNF ML** (possible until 1:05). Also the 7d prop Hybrid (reviewed: drop J. Rodriguez; swap Kyren carries for T. Ferguson 4+ rec. Note Rodriguez and Ferguson are now on other placed tickets, so rebuild before using) and the **SNF island ladder** (LAR@DEN; needs Nacua inactive status ~3:50 PT and a BKR SGP quote; must fit the LAR–DEN Unders held).
- Fill the missing ticket numbers (2+ TD 4-leg; last-minute 8-leg; 7a/7b are known) from BEO history.
- Grading: grade every ticket against book settlement; then, **only with Andy's explicit OK**, `node scripts/sync-placed-wagers-to-bankroll.mjs --dry-run` first.
- Recommendation ledger (DEV project `claude/recommendation-ledger-2026.md`): append Week 3 Sunday props, proposed vs placed (7b diverged: Roquan off board, Cousins dropped for the Jeanty-TD overlap, McCaffrey + Lamar added; +5500).
- Week 4 build: apply the SuperContest split stake; no prop RRs.

## Resume prompt
```
Resume in E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Read HANDOFF.md, then this handoff (handoffs/2026-09-27-*-claude-week3-sunday-props-placed-tracker-supercontest-handoff.md). Reconcile live Git without pull/reset/clean/stash; a stale .git/index.lock may exist, so use the GIT_INDEX_FILE workaround or ask Andy to delete it. Week 3 is in progress: all official tickets (BEO props + BKR game tickets, incl. SuperContest five #739360142) are in data/official-picks/user-placed-wagers-2026.json and the Live Tracker (regenerate with `node scripts/generate-live-tracker.mjs --week 3`). Next: (1) help Andy with any remaining same-day items (739211245 open spots before 1:25 PT, optional slot-4 afternoon parlay capped with the SNF ML, SNF LAR@DEN island ladder once Nacua's status is known; no prop round robins); (2) grade tickets as games finish, using the tracker and the ESPN box scores; (3) update the DEV-project recommendation ledger. Every player named must pass `npm run roster:vet -- --week 3 --date 2026-09-26 --fetch --strict`. No wagers, account actions, TheOddsAPI calls, Supabase writes or Bankroll sync without Andy's explicit per-action OK.
```
