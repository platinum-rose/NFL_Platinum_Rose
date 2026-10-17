Resume Platinum Rose NFL Week 6: QUEUE the Astra per-game runs, then HOLD for Andy's launch signal.

Repo: E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Branch claude/w5-prop-cards-2026-10-11. Sat 2026-10-17.
This replaces the earlier "queue" prompt (scratch/w06-astra-codex-prompt.md). Read that file for source layers and cautions; where the two differ, THIS prompt wins. Live files beat prose. Preserve the dirty shared checkout: never reset, clean, stash, commit, or git add -A. Do not run git status.

NO Astra invocation. No wagers, sportsbook clicks, TheOddsAPI, Supabase writes, paid model calls, ledger/portfolio changes, official-pick promotion, or publishing.

## What changed since your last (blocked) queue. Re-pin all of it.
- live-market-comparison.json drifted: repin it (the cause of the stopped_source_hash_drift).
- Quantitative synthesis rebuilt 2026-10-17 21:11Z on the 12:40 PM PT Bookmaker board (data/odds/BKR_current_lines_1017_1240_buildfmt). Backups of the old ones exist; do not use them.
- reports/intel/master-intel-narratives-2026-w06.md edited against the same board (projections CHI 27.1/ATL 25.9, TEN 18.8/IND 25.4, WAS 21.0/SF 30.2). Roster gate passed after the edit.
- Weather refreshed Sat 1:16 PM PT (Open-Meteo).
- data/generated/master-intel/w06-splits-all.json (13 games; moneyline splits stale, Thursday pull).
- data/supercontest/week-06-lines.json and handoffs/2026-10-17-1215-claude-sc-report-v3-locked-handoff.md exist in the repo.
- YouTube picks (data/podcasts/youtube-extracted-picks-2026-w06.json): APPROVED by Andy 2026-10-17 (status approved_by_andy_2026-10-17; 125 picks). Likely kept on NYG (NO@NYG); Najee Harris and SEA@DEN items dropped. Each pick carries line_movement vs the 12:40 PM board. Line movement is NOTED, NEVER a blocker. Remove YOUTUBE_REVIEW_PENDING.
- FTN is weekly by design (10/16 context is current). Remove FTN_CONTEXT_STALE. Andy decided no refresh is needed.
- Article gate: Makinen (id 8108) and the VSiN first-TD piece (8136) were read in full and dispositioned (analyst leads, not promoted). 17 non-Week-6 records dispositioned. article-intel-review-latest.json regenerated 2026-10-17 21:13Z: 24 pick-oriented records still unresolved. Do NOT waive the gate yourself. Re-evaluate it, report exactly what remains, and mark affected packets `conditional` with the named condition (or `blocked` if your own rules require it). Andy decides whether to waive.
- Quantitative model warning "no SuperContest lines file for week 6" is a script-path issue (expects week-06-2026-verified-lines.json); the real file is week-06-lines.json. Flag, do not "fix".

## Tasks
1. Pins: HEAD, branch, roster gate (`npm run roster:vet -- --week 6 --date 2026-10-17 --strict`; add --fetch only with network; state roster age). BLOCK ends the run.
2. Regenerate scratch/w06-astra-synthesis-queue.json and .md: 13 games, same schema, with fresh hashes for every source, a fresh freshness matrix, and a refresh plan limited to what is genuinely still open.
3. Per game packet, set synthesis_status ready | conditional | blocked with explicit reasons. Known holds: CHI@ATL cannot be ready (Caleb Williams unconfirmed until Sunday morning; operator note 13:13 PT). A.J. Brown (NE) day-to-day: NYJ@NE conditional on any Brown leg. CAR@PHI: Hurts OUT, McKee starts; Millman's CAR +1.5 is "pre-Hurts-OUT". BAL@CLE/PIT@TB: Lamar/Mayfield out per ESPN; Huntley/Daniels operator-recorded; official inactives decide. Thin Bookmaker boards (BAL@CLE, CAR@PHI) and BetOnline player props existing for only HOU@JAX, CHI@ATL, BUF@LV, DAL@GB are coverage notes, not blockers.
4. Build the LAUNCH BOARD: scratch/w06-astra-launch-board.md and .json, one row per game in kickoff order (HOU@JAX 06:30 PT; NYJ@NE, PIT@TB, BAL@CLE, CHI@ATL, TEN@IND, CAR@PHI, NO@NYG 10:00; ARI@LAR 13:05; BUF@LV, LAC@KC 13:25; DAL@GB 17:20; WAS@SF Mon 10/19 17:15) with: status, blockers/conditions, packet hash, the exact session activation message from scratch/w06-astra-per-game-launch-sheet.md pre-filled for that game, and expected output paths (reports/intel/games/2026-w06-astra-<AWAY>_at_<HOME>.md, data/research-intel/proposed/games-w06/..json, RUNLOG line). Put a one-line "can launch now? yes/no because..." on each row.
5. Re-validate that the launch sheet and agents/dev/ASTRA_W06_GAME_SESSION_PROMPT.md agree with the queue schema (field names, stop conditions). Report mismatches; fix only those two files and the launch board.
6. Final message: a compact table (game | status | one-line reason) plus the exact remaining refreshes (Sunday morning: Williams decision then roster gate rerun with --fetch, kickoff-day weather and roof confirmation for ATL/IND/LV, A.J. Brown status, official inactives, and the article-gate decision for Andy).

## HOLD
After step 6, STOP and wait. Do not start any game. Accept only these signals from Andy:
- `launch <GAME>`: re-verify the pins for that packet (HEAD, source hashes, kickoff not passed, roster gate) and report ready/not-ready with the activation message to paste into a fresh session. Do not run synthesis yourself.
- `launch all ready`: same check for every ready/conditional game, listing activation messages in kickoff order.
- `refresh <GAME>` or `requeue`: rebuild that packet/queue after Andy changes inputs.
A stale pin, passed kickoff, or roster BLOCK on a launch signal = refuse and say why.
