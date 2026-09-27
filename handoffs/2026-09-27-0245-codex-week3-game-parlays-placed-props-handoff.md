# Week 3 game-parlay closeout — resume for player props

## State

- Working tree is dirty/shared. Do not pull, reset, clean, stash, broad-stage, or overwrite unrelated changes.
- No wager, account, Supabase, TheOddsAPI, or official-pick mutation was performed during closeout. The local record is [week3-game-card-record-2026-09-27.md](../reports/bets/week3-game-card-record-2026-09-27.md).
- The shared JSON ledgers were locked by concurrent tooling, so the record is preserved in that dated local report for later ledger import/reconciliation.

## Game card record

- Official Platinum Rose paper recommendation, explicitly approved by Andy but disregarded: SF -7.5 / LAR-DEN Under 45 / CIN-PIT Under 43.5 / PHI-CHI Under 43; displayed $20 to win $218.13 (about +1091). Paper only.
- Placed #739361263: Compact RR 70P-4T, $105 risk, $1,210.51 maximum win; eight legs CIN -3, SF -8, PHI -3, TEN +2.5, IND +2.5, LAR-DEN Under 44.5, NYJ-DET Over 47.5, JAX -3.
- Placed #739361262: eight-team parlay, $5 risk, $778.66 maximum win; same eight legs.
- Placed #739361521: five-team parlay, $20.47 risk, $390.32 maximum win; SF -7, LAR-DEN Under 45, CIN-PIT Under 43.5, PHI-CHI Under 43, BUF -6.5.
- The final ticket changed SF -7.5 to SF -7 and added BUF -6.5 while retaining the three totals. All tickets are review-only pending bookmaker settlement and must be graded against Bankroll without altering the wager records.

## Resume prompt for Claude

Resume in `E:\dev\projects\NFL_Dashboard`. Read `HANDOFF.md`, this handoff, and `agents/dev/WEEKLY_SYNTHESIS_SESSION_PROMPT.md`; reconcile live Git (no pull/reset/clean/stash). Treat `reports/bets/week3-game-card-record-2026-09-27.md` as the current Week 3 game-card context. The official Platinum Rose four-leg paper recommendation is explicitly approved but disregarded; do not confuse it with placed tickets `#739361263`, `#739361262`, and `#739361521`. The local dated report is the grading source until the shared JSON ledgers are available for a safe append; do not run normal Bankroll/Supabase sync without Andy's explicit approval. Player-prop scope only: use current pasted BKR/BEO boards, save dated captures before pricing, re-verify every named player against `data/nfl-rosters/espn-full-rosters-latest.json` and `data/player-availability/latest.json`, run `npm.cmd run roster:vet -- --week 3 --date 2026-09-26 --fetch --strict` before presenting any prop card, and do not call TheOddsAPI. Build only supported Prop RR, kickoff-window stacks, TD/first-TD/2+TD moonshots, and SNF islands; hold or skip templates when current price or status is missing. No wagers, Supabase writes, account actions, or official-pick mutations.
