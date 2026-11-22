# NFL Dashboard handoff — 2026-11-15 01:35 PT — W10 Saturday final done, continue Sunday card building

Repo: `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`, commit **f1d6eb66** pushed. Full repo handoff: `handoffs/2026-11-15-0135-claude-w10-saturday-final-card-building-next.md`.

## Done
- Master Intel + SuperContest rebuilt Sat night (archive `2026-11-14-2145-build`). Roster vet PASS, SC format gate PASS. Saturday gate RED only on S2 (BKR props thin for SEA@LV / SF@DAL). Andy accepted it.
- Saturday re-run synthesis: Claude 10 games, Codex 3 games. Card expanded to all B/C +EV plays (10 sides/totals, 20 props) plus every-game leans with break-even caveats.
- Weekend template proposals for every slot are in `reports/bets/2026-w10-card.md`. The 16 parlays are logged as imaginary $10 paper tickets.
- AI SC five re-ranked: KC -3.5, SF -4.5, BAL -4.5, JAX -10.5, ARI +9.5. Official SC five (Andy & Amanda): IND -3, KC -3.5, SF -4.5, JAX -10.5, BUF -7.5, saved to `data/supercontest/locked-card-week-10.json`.
- Real tickets logged locally (no Supabase):
  - 4 DKP Alejandro splits.
  - BKR 6-leg x2 (split + Andy double).
  - Master 8-team parlay #741847132 + 4s RR #741847133.
  - SC 5-team #741847526 + 2s RR.
  - Tracker shows 10 real + 16 paper open.
- Code committed: BEO Props Builder capture wired into the BOL cron, Kalshi props capture, DKP feed fallback, Q/D/O prop filter.

## Next
1. Continue Sunday card building. The BEO 8-leg prop slip (+12,800) was priced but not confirmed placed.
2. Fill missing ticket numbers (BKR 6-leg x2, SC RR).
3. Sunday AM refresh if wanted: splits, pull and injuries go stale overnight. Check inactives. NE@DET kicks off 6:30 AM PT.
4. Mobile tracker not republished.
5. Investigate the scheduled BOL sync skipping Props Builder.
6. Possible fix: make SC grades use each game's final sim run (the CAR draft-sim bug).
