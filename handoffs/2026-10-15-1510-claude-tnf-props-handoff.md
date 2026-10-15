# Handoff 2026-10-15 15:10 PT: Futures logged, resume for TNF (SEA@DEN) Island prop parlays

## Done this session (local commits, NOT pushed; Andy pushes)
- 2d6cd79: Franklin IR override retired; roster/availability/dossier pipeline rerun; ledger fixes (CHI exactas confirmed BetOnline; ticket 994540980 note).
- 502f584: DKP W6 capture (gate fix: names listed on failure, PLAYER_ALIAS_MAP additions, raw capture saved).
- 75f3157: 3 new BetOnline exactas logged in `andy-portfolio-ledger-2026.json` (as_of 2026-10-15):
  - sf_buf_exacta_1005664263: SF vs BUF $38.54 @+2200, to win $847.88, FUNDED BY FREE MONEY
  - sea_buf_exacta_1005664263: SEA vs BUF $17.58 @+3500, to win $615.30, cash
  - gb_kc_exacta_1005659723: GB vs KC $7.00 @+15800, to win $1,106.00, cash (ticket 1005659723)
  - Free-money balance ($38.54: slots 3.96+11.90, reloads 2.85+4.83, gift 15.00) now $0, deployed; promotions ledger updated. 24 positions, ~$401.63 staked.
- Week 5 Bills credit: received_unused, held for a later week. Week 3 credit used on LV +4.5 (ticket 1005591415).

## Next (fresh session): TNF SEA@DEN, kickoff 5:15 PM PT
1. Read Island template (memory `nfl_dashboard_island_game_parlay_template.md`).
2. Run `node scripts/build-player-props-intel.js` (free). Inputs: BEO props 2026-10-15 20:08Z (770 rows), DKP live capture 2026-10-15 (779 rows, 14 games).
3. Roster gate (`roster_vet.py --strict`) before naming any player. Franklin is healthy/off DEN report.
4. Build 3-tier parlays; Andy re-captures BEO/Bookmaker/DKP 30-45 min pre-kickoff for fresh prices.

## Open items needing Andy
- W6 QBs: Williams probable, Jackson doubtful; await confirmation, then create `data/research-intel/operator-confirmed-starters-2026-w06.json`.
- Quant synthesis go (`node scripts/build-w05-quantitative-synthesis.mjs --week 6 --dry-run` first).
- Twitter ingest fetched 345, ingested 0: widen relevance gate? (offered, unauthorized).
- DKP matchup-market check (browser refused DKP; Andy looks himself); WAS@SF DKP TD rows missing; b_vEEqWIg2c transcript missing.
- Wagers ledger working tree has another session's uncommitted edits (incl. my BetOnline book fix on two 10/09 tickets); not committed.
- Cleanup: `.git/stale-head-lock-*`, tmp_obj files, .bak files.

## Guardrails
No wagers/cashier actions by Claude; sportsbooks read-only; no paid synthesis/Supabase writes/pick promotion without specific authorization; commit own paths only via temp index; never `git status` / `git add -A`.
