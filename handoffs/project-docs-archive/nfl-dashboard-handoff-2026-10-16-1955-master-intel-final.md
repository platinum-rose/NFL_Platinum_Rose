# NFL Dashboard handoff — 2026-10-16 19:55 PT — Week 6 Master Intel final build

Repo: E:\dev\projects\NFL_Dashboard (bridge: $HOME/mnt/dev/projects/NFL_Dashboard), branch claude/w5-prop-cards-2026-10-11.
HEAD ea6fc5c (local, NOT pushed) on top of 40650ea (Andy's CLAUDE.md rule: print the resume prompt in-session on every handoff) and f0e1a42 (pushed).

## Done
- Cousin/Cousins fix: `PLAYER_NAME_FIXES` in splitTeamSuffix of scripts/props/betonline-prop-dump-parse.mjs and betonline-live-parser.mjs ("Kirk Cousin" -> "Kirk Cousins"). Verified: 16 BOL rows, 35 BKR rows, all "Kirk Cousins".
- Fresh captures (all passed their gates): BOL 856 rows (only HOU@JAX, BUF@LV, DAL@GB have player props), BKR SGP 4529 rows / 13 games (BAL@CLE and CAR@PHI have game/quarter lines only, no player props), DKP 935 rows / 13 games.
- New game-lines board data/odds/BKR_current_lines_1016_1933_buildfmt (+ provenance), derived from the 19:33 PT BKR capture. Moves vs 10:38 board: NO@NYG flipped (NYG -1, NO +1), CAR@PHI -3 (was -3.5), LAC@KC 7.5 (was 8), HOU@JAX total 42 (was 42.5), DAL@GB total 53 (was 53.5).
- Chain rerun: ESPN status, roster gate (PASS, 0 blocking), availability layer, live injuries, impact digest, secondary matchups, props intel (8 props, article-derived), alpha packet, Action Network openers, quant synthesis on the new board, 32 dossiers.
- Narratives (reports/intel/master-intel-narratives-2026-w06.md) patched to the new lines and model percentages (32 edits). Model side reads flipped to NO (NO@NYG) and CAR (CAR@PHI). Stale "Cousin/Cousins" sentence removed.
- Master Intel built with `build.py --week 6 --date 2026-10-17`; PDF (164 pages) exported in the cloud and delivered; dist/ is gitignored.
- Yahoo pick'em W6: SEA, 5 confidence, lost (DEN 17-14). Yahoo Fantasy API now authorizes (users/groups/teams/standings work) but has NO per-game pick endpoint; the pick came from the signed-in pick'em page via Chrome. Recorded in data/pickem/picks-2026-w06.json.
- Memory: Andy is out of both Yahoo survivor pools and has no other; survivor intel is research/history only. BEO exacta lines release Tue-Thu only.

## Open
- Hold CHI-dependent cards until Sunday morning (Caleb Williams Questionable).
- Yahoo W6 picks: page says 14 of 14 saved but shows no pick/confidence for the 13 open games and tiebreakers are not entered. Deadline Sun 10/18 10:00 AM PDT. Andy to verify.
- Build GAPs: no YouTube digest, no synthesis digest, no card tickets (reports/bets/2026-w06-card.md), no survivor pick-intel (moot), "DK Predictions saves 0 of 13" (build looks for dk-predictions-<date>-*.json; the live captures are draftkings-predictions-live-*; unconfirmed whether this is a filename mismatch).
- ESPN rosters were ~4h old at the last gate; rerun `roster_vet.py --fetch --strict` Sunday morning before any player card.
- Team dossiers regenerated but not committed; many tracked generated files still dirty in the working tree.
- No BEO exacta recapture until Tuesday of Week 7. Drive archive is manual (Andy drags files).
- Git: HEAD.lock and tmp indexes moved aside as .git/stale-*; commit via temp-index recipe only.
