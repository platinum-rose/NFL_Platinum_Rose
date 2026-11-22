# NFL Dashboard handoff — 2026-10-17 16:45 PT — W6 Astra per-game synthesis done (12/13)

## State
- Repo `E:\dev\projects\NFL_Dashboard`, branch `claude/w5-prop-cards-2026-10-11`, HEAD `b33e1bc` (pushed to origin). Checkout is still very dirty (~1570 paths): never `git add -A`, never a full `git status` (times out); commit with `git commit --only -- <paths>`. Two stale git locks were moved to `.git/stale-head-lock-1017` and `.git/stale-next-index-lock-1017`; the shell cannot delete files without approval.
- Committed this session: session prompt `agents/dev/ASTRA_W06_GAME_SESSION_PROMPT.md`, dispositions + review-latest, `w06-article-leads-read-2026-10-17.json`, approved `youtube-extracted-picks-2026-w06.json`, refreshed `espn-full-rosters-latest.json`, queue + launch board + launch sheet + hold prompts in `scratch/`, and all 12 game outputs (`reports/intel/games/2026-w06-astra-*.md`, `data/research-intel/proposed/games-w06/*.json`, `2026-w06-astra-RUNLOG.md`).
- Not committed (left untracked on purpose): `scratch/w06-article-bodies/` (raw Supabase article bodies), `*.bak` backups, `scratch/_requeue_hashes.json`, `scratch/.tmp_dalgb_rest.txt` (stray), W5 sonnet reports.

## Approvals recorded
- Article gate: 521 records, 0 unresolved pick-oriented. Only 8303 (X bookmark, no body) excluded as unreadable.
- YouTube picks approved: Isaiah Likely kept as NO@NYG (price +225 unverified, source said "against Cleveland"); the other 7 flagged items dropped. Line movements are noted, never blocking.

## W6 Astra results (all proposals; nothing placed)
| Game | Disposition | Tier | Lean |
|---|---|---|---|
| NYJ@NE | price moved | 2- | NYJ +7 (-103), thin, no A.J. Brown leg (51.46% vs 50.74% BE) |
| BUF@LV | quant candidate | 2- | LV +4.5 (-108), thin (52.7% vs 51.9%); floor +4 |
| PIT@TB | conflicted | 2- | TB +2.5 only playable at +3 or better; Daniels unconfirmed |
| HOU@JAX | conflicted | research_only | none; gust forecast 42.8 km/h London |
| TEN@IND | conflicted | research_only | none; roof unconfirmed |
| CAR@PHI | price moved | research_only | none; now CAR -3 after Hurts OUT |
| ARI@LAR | conflicted | research_only | marginal ARI +13.5/+14 |
| DAL@GB | conflicted | research_only | none |
| WAS@SF | pass | research_only | none; Croskey-Merritt reported Out; wind/gust data impossible (gust < wind) |
| BAL@CLE | price moved | skip | none; Lamar OUT, Huntley starts |
| LAC@KC | price moved | skip | none; Under only works at 42.5+ |
| NO@NYG | pass | skip | none |
| CHI@ATL | BLOCKED | n/a | Caleb Williams unconfirmed until Sunday AM |

## Known issues
- First launch STOPPED on all games because I edited the session prompt after pinning (my preflight did not hash it). Fixed by re-pinning: prompt hash now `c2bf2b1b…`, queue sha256 `e5832e56…`. Old values in `*.pre-reprompt.bak`. Sessions that finished before the re-pin (CAR@PHI, ARI@LAR, TEN@IND) noted the mismatch and proceeded; content is consistent.
- Queue `packet_pins` block does not match the real packet hashes for any game (board hashes are correct and were used). Do not "fix" casually: it changes the queue hash and invalidates the board.
- `scripts/intel/validate-game-output.py` is W5-pinned; every session did a manual self-check instead. Adapting it for W6 paths is a todo.
- Moneyline splits are ~42h stale (withheld everywhere). Bookmaker board is thin for CAR@PHI and BAL@CLE.
- Roster-vet receipt rewrites itself; sessions read it, never rerun it in parallel.

## Standing constraints
- No spend on Gemini/AssemblyAI/OpenAI. Nothing placed, promoted or written to Supabase by Claude. Sportsbooks read-only.
- Hold all CHI cards until Sunday's Williams decision. Likely and Najee Harris need a human check before any use.
- Andy prefs: viewable files in-session; copy-paste text inline in a code block.

## Next
1. Sunday AM: Williams decision, then `fetch_espn_rosters.py` and `npm run roster:vet -- --week 6 --date 2026-10-17 --strict`; unblock CHI@ATL and run its Astra synthesis (same queue/board flow).
2. Refresh before kickoff: official inactives (all games), A.J. Brown status, Barkley hedge, Likely price, WAS@SF wind/gust reconciliation, IND/ATL roof and kickoff weather. If a game's lean depends on one of these, rerun that game.
3. Build the official Master Intel report from the 13 outputs (v3 SuperContest layout is locked, `docs/MASTER_INTEL_REPORT_FORMAT.md` §8).
4. Await Andy and Amanda's official five (save to `data/supercontest/locked-card-week-6.json`); optional GB SB add go/no-go; contest deadline check.
5. Optional: adapt W5 validator for W6; delete scratch leftovers (needs permission).

## Resume prompt
Resume NFL_Dashboard. HEAD `b33e1bc` on `claude/w5-prop-cards-2026-10-11` (pushed). W6 Astra per-game synthesis is done for 12 of 13 games (outputs in `reports/intel/games/2026-w06-astra-*.md`, run log alongside); CHI@ATL is blocked on Caleb Williams. Read the project handoff `claude/nfl-dashboard-handoff-2026-10-17-1645-w6-astra-synthesis-done.md` first. Keep the dirty checkout untouched (no `git add -A`, no full `git status`; use `git commit --only`). Do the Sunday-morning refresh list, then the official Master Intel report. Everything is a proposal; await direction.
