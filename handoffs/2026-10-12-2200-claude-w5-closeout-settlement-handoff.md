# Week 5 close-out: settlement, stats, bankroll sync (Mon 2026-10-12 ~22:00 PT)

Branch `claude/w5-prop-cards-2026-10-11`.

## Done
- All 15 W5 ESPN summaries cached to `data/fantasy/boxscores/espn-4018729{80..94}.json` (all final; BUF 37 LAR 34 OT).
- Ledger `data/official-picks/user-placed-wagers-2026.json`: 8 MNF tickets added; all 15 open tickets settled (0 PENDING). Backups: `.bak-20261012-mnf`, `.bak-20261012-settle`.
- Results: every cash ticket lost; RR 6x2 #740069722 -$7.79 (Bookmaker-confirmed, NYG tie = push); RR 8x4 -$105; #740087500/#740087501 already loss (CIN -7 push confirmed by Andy's slips). DK promo: 5-pick and 8-pick lost, 2-pick WON ($84 paid, promo credit; profit 53.76 in sync row, amount 0).
- `data/archive/2026/season/player-games.csv` now has weeks 1-5 (W5 = 988 rows; nflverse ids unlinked, Supabase snapshot stale).
- Live tracker regenerated with final data (`public/` and `docs/tracked-wagers/live-tracker-sunday.html`) - built on a no-network VM via fetch shim in `E:\dev\Claude outputs\mnf-live\` (not part of repo). `generate-live-tracker.mjs` patched: rush+rec combined yards market, `alternate_total_points`.
- Supabase `user_bankroll_bets`: 15 changed rows upserted via MCP (VM had no network). Result: 149 rows, 9 won / 140 lost.
- BKR Week 6 opening lines saved: `data/odds/BKR_current_lines_1012_2150` (+ provenance). Paste ended at WSH@SF Oct 19; rest not yet supplied.

## Open
- BEO parlay insurance refund on #1004819658 (Wed if at all) - not blocking.
- Ticket numbers for the 3 DK promo combos (`pending-not-supplied`) and the SNF island 6-leg.
- NYG@WSH tie vs Washington spread legs: ledger graded WAS -2.5 LOST; confirm with book if ever disputed.
- Tuesday: `weekly-archive.mjs --week 5` on native Windows (postmortem, Yahoo, pools, vault); DKP acceptance gate (500-row minimum blocks 1-game board) needs Andy's OK before editing; `npx vitest run` unverified.
- Week 6: need rest of BKR opening lines, then standard Tuesday setup.
