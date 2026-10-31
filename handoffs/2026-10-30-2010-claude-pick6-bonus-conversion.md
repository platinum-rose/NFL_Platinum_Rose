# Handoff — DraftKings Pick 6 $5 bonus-pick conversion (split from the Week 8 Master Intel session)
Fri 2026-10-30 ~8:10 PM PT. Side task only; the Master Intel / SC lanes continue in the original session. Do not touch those files.

## Goal (Andy)
Andy has "a handful" of $5 DraftKings Pick 6 bonus (free) picks. Turn them into real, unrestricted cash using the same strategy as the FanDuel Predictions workflow (`reports/bets/2026-w08-fdp-promo-plan.md`): short entries to bank a win, legs spread across different games, leg types weighted by Andy's own graded history, min-accept price check before placing. **Proposal only — Andy places every entry.**

## Verified facts
- Pick 6 is pooled/peer-to-peer: each contest has a prize pool split by tier; payouts vary by contest and entry count (shown under "View Contest Details"). Entries need 2–6 players with at least two different teams; each player once per entry; entries compete only vs same-size entries. (thelines.com/draftkings-pick6-guide)
- Bonus picks (DK promo terms as reproduced at foxsports.com/draftkings-pick-6-terms): site credit, no cash value, **winnings only** go to the cash balance (stake not returned), and those winnings are withdrawable. Example promo bonus picks expired 14 days after issue. Minimum picks "may vary by contest and jurisdiction".
- Claude in Chrome **refuses all draftkings.com domains** (sportsbook, Predictions, presumably Pick 6) — Andy must read Pick 6 lines/contest details to you (screenshot or paste).

## Still unknown — ask Andy first (one AskUserQuestion)
1. How many $5 bonus picks, and their expiry dates.
2. Pick 6 contest sizes/payouts he sees for 2-pick vs 3-pick (prize split per tier).
3. The actual Pick 6 lines for the candidate players (lines may differ from Bookmaker's).

## Method started
- Source: Bookmaker Week 8 capture 2026-10-31 (13 games, parsed clean): `data/generated/props/bookmaker-live-2026-10-31-*-at-*.json`.
- `scratch/w08-pick6/bkr_two_way_candidates.py` de-vigs every two-way player prop and ranks More/Less sides; output `scratch/w08-pick6/bkr-two-way-candidates-2026-10-31.json` (fair ≥ 56%). Top sides were mostly QB pass-TD Unders/Overs at 0.5/1.5/2.5 and low-volume receptions Unders (~60–67% fair).
- Edge only holds if Pick 6 posts the SAME line (or a better one for the side). Re-check each line Andy reports; recompute fair at Pick 6's line from the BKR alt ladders (same json, `threshold` rows) if it differs.
- Andy's leg-type history (from the FDP plan): best = tackles (+12/+17), QB pass TDs (near-even +30, n=12), QB INT (+7), low rec-yd rungs priced as favorites (+11); worst = short-priced ATDs, heavy ML favs, sacks, first TD, near-even game totals, near-even rec yds (−17).
- Build: 2-pick entries (shortest = highest hit rate; mirrors Andy's short-stack preference), one leg per game, no game used twice across entries, ≥58% fair each leg; optionally one 3-pick if payouts justify. Show win %, and EV per $5 bonus using the payout Andy reports.

## Required gates
- Strict roster gate before naming any player to Andy: `export PATH=$HOME/pyenv312/bin:$PATH; python3 scripts/nfl-rosters/roster_vet.py --week 8 --date 2026-10-31 --fetch --strict` (or check `data/nfl-rosters/roster-map-latest.json` freshness + live web search for anything surprising). Never judge a player's team from memory.
- Check the game-day injury report (live search) for every leg; QB legs especially (e.g. Lamar Jackson ankle — expected to play per Rapoport Oct 28).
- Record entries Andy places in the placed-wager records only after he confirms placement; bonus-funded, not bankroll.

## Environment
Repo `E:\dev\projects\NFL_Dashboard` via device_bash (`$HOME/mnt/dev/projects/NFL_Dashboard`). Branch `claude/w5-prop-cards-2026-10-11`, not pushed; dirty tree — stage by explicit path only, never `git add -A`/reset/clean/stash; rename new 0-byte `.git/**/*.lock` to `.git/stale-*` after git commands. No wagers, Supabase writes, paid calls, publishing or pushes without Andy's per-action OK. Andy wants Claude to use the Chrome extension only (no desktop takeover).
