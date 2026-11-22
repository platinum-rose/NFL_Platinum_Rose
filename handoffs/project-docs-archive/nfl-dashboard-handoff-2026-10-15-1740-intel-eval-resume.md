# NFL_Dashboard handoff: 2026-10-15 17:40 PT, TNF logged and pushed; next is a fresh-session intel evaluation

Supersedes the pickup pointer in `claude/nfl-dashboard-handoff-2026-10-15-tnf-props.md`. Repo `E:\dev\projects\NFL_Dashboard` (`$HOME/mnt/dev/projects/NFL_Dashboard` in device_bash).

## 1. State
- Branch `claude/w5-prop-cards-2026-10-11`, pushed. Remote tip is `ed23280` (was `5fc071d`; fast-forward of 9 commits including `b1cd36b`). Andy authorized "stage, commit and push" this turn only.
- Commit `ed23280` holds, via temp index (own paths only):
  - `data/official-picks/user-placed-wagers-2026.json` (175 tickets)
  - `public/live-tracker-sunday.html` and `docs/tracked-wagers/live-tracker-sunday.html` (regenerated, Week 6)
  - `reports/analysis/prop-planner/tnf-sea-at-den-island-parlays-2026-10-15.md` (initial card, superseded in chat)
  - `docs/player-props-intel/player-props-intel-latest.{md,html}`, `data/research-intel/review/player-props-intel-latest.json`
  - `data/generated/master-intel/w06-roster-vet.json`
  - `data/research-intel/source-evidence/2026-10-15-betonline-week6-props-parsed.json` (the 21:15Z recapture)
- The ledger diff also carried another session's edits: leg/book corrections on nine Week 5 tickets (no status changes). They were committed with the file.
- Not done: Supabase sync (`scripts/sync-placed-wagers-to-bankroll.mjs`), paid synthesis, pick promotion. No ledger writes beyond recording Andy's reported tickets.
- Git cleanup for Andy on Windows: `.git/HEAD.lock.stale-*`, `.git/objects/*/tmp_obj_*`, and any `HEAD.lock` the bridge left; the real `.git/index` is stale (use a temp index).

## 2. Week 6 TNF SEA@DEN tickets logged (all PENDING, cash assumed for DKP)
| Ticket | Book | Stake | To win / payout |
|---|---|---|---|
| 1005682691 SGP 8 legs (parlay insurance) | BetOnline | $5 | win $750 |
| 1005675166 Future/Prop 8 legs | BetOnline | $5 | win $3,185 |
| 39099380 DKP 5-pick | DK Predictions | $9.94 | pays $134 |
| 39129443 DKP 3-pick | DK Predictions | $4.99 | pays $311 |
| 39144341 DKP 6-pick | DK Predictions | $5.00 | pays $473 |
| 39149838 DKP 7-pick | DK Predictions | $10.00 | pays $623 |
| 740212915 9-team parlay | Bookmaker | $15 | win $1,405.41 |
| 740279274 4-team 6-pt teaser | Bookmaker | $30 | win $70.50 |
| 740269810 SGP 2 (SEA ML + Over 40) | Bookmaker | $25.39 | win $57.89 |

Anytime-TD overlap: JSN on three tickets; Wilson, Dobbins, Barner and Nix on two each. Per-leg prices on DKP and 740269810 were not supplied.

## 3. Evaluate the intel BEFORE any synthesis (task for the fresh session)
Read-only and free. Goal: decide whether the Week 6 intel is good enough to spend on `node scripts/build-w05-quantitative-synthesis.mjs --week 6`, and what to fix first. Do not run the paid synthesis; if Andy says go, run `--dry-run` first.
1. **Freshness and completeness:** list every Week 6 input with its timestamp and row count: BEO props (21:15Z, 764 rows; the earlier handoff said 20:08Z/770, reconcile), DKP props (21:30Z, 779), Bookmaker SGP (10/14), odds, availability, rosters, podcasts, experts, Twitter. Flag anything stale or missing for the Sunday slate (not just TNF).
2. **QBs and injuries:** `data/research-intel/operator-confirmed-starters-2026-w06.json` does not exist. QB status is ESPN-only (Mayfield doubtful; Lamar Jackson and Caleb Williams questionable). Get Andy's confirmations. Re-run the availability chain in the 10/14 handoff §3 if status changed. Roster gate: `python3 scripts/nfl-rosters/roster_vet.py --week 6 --date 2026-10-18 --fetch --strict` before naming any player.
3. **Quality of the player-props intel:** `build-player-props-intel.js` is article-based and did not consume the BEO/DKP captures. Check the 19 article props for matchup relevance and roster validity (Andy's rule: drop irrelevant articles, verify each expert against the matchup). Decide whether the Twitter relevance gate should be widened (offered, not authorized).
4. **Model vs market sanity:** `data/research-intel/proposed/2026-w06-quantitative-synthesis.json` is a dry-run output (TNF: total Under 51.4%, DEN cover 51.2%). Compare against the lines on the boards and the Action Network openers (`scripts/master-intel/actionnetwork_openers.py --week 6`).
5. **Known gaps:** DEN WR3 replacement for Franklin (no seed row); `build-w06-availability-layer.py` still lists Franklin as unconfirmed roster IR/Out; DKP matchup-market check not done; Lane E questions (ticket 994540980 duplicate, Bears exacta book, Week 3/5 credits, reloads); Gemini credit drain under investigation (Andy topped up $20; wants a $25/month cap), so avoid anything that calls Gemini.
6. **Deliverable:** a short evaluation (pass/fail per input, what to refresh, cost estimate for the synthesis) saved under `reports/analysis/` and mirrored to the project. Proposed != placed.

## 4. Guardrails (binding, unchanged)
Sportsbooks read-only; no wagers or cashier actions by Claude. No paid synthesis, Supabase writes, ledger changes (other than recording what Andy reports), or pick promotion without explicit per-action go. Never `git add -A`; never casual `git status`; temp-index commits of own paths only; push only when Andy says so.

## 5. Resume prompt
Read `HANDOFF.md`, then this file. Verify `git rev-parse --short HEAD` is `ed23280` or later on `claude/w5-prop-cards-2026-10-11` (20 s timeout, no `git status`). Run the section 3 evaluation read-only, report findings to Andy, and wait for his go before any synthesis.
