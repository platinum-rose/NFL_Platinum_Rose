# Handoff — 2026-09-27 21:30 PT — Claude (Cowork): Week 3 Sunday fully graded; MNF prep + Novig credits

Repo copy: `handoffs/2026-09-27-2130-claude-week3-sunday-graded-mnf-prep-handoff.md` (commit `2fe6548`, pushed). This replaces the 00:12 PT version of this doc (the intel-sheet STOP was resolved earlier in the day).

## State
- `main` = `origin/main` = `2fe6548` (on top of `fbed7cc`: SuperContest Week 3 locked card + tracker fix so the Week 1 board no longer leaks into later weeks).
- Stale zero-byte lock files the bridge can't delete: `.git\index.lock`, `.git\HEAD.lock`, `.git\refs\heads\main.lock`. Andy: delete all three locally. Until then `git status` shows committed files as modified (real index stale); commits need the `GIT_INDEX_FILE` / `commit-tree` workaround and `git push origin <sha>:refs/heads/main`.
- Not committed on purpose: `data/official-picks/user-placed-wagers-2026.json` (gitignored; all tickets graded) and the Live Tracker HTML. Regenerate with `node scripts/generate-live-tracker.mjs --week 3`, then Ctrl+F5.
- No Supabase / Bankroll sync / TheOddsAPI calls. Ledger `claude/recommendation-ledger-2026.md` updated through SNF.

## Week 3 results
- Only winner: **dog-ML RR #739358766** (IND, CLE, LV → 3 of 10 combos ≈ $39.21 on $25; confirm vs BKR).
- Lost: all morning/afternoon game tickets incl. SuperContest five #739360142, slot-4 #739396029, all BEO prop stacks (7a, 7b, Stack A, Stack B, 2+ TD, first-TD re-run, the 8-legs), SNF ladder Tiers 1–3, Moonshots 1–2, BKR 2-team SGP ×2 (DEN 30–26, total 56).
- Live: **Master RR #739361263** — one combo (IND / NYJ-DET O47.5 / JAX / PHI −3) needs PHI −3 Monday (~$18). **Novig credit #1**: PHI ML + U41.5 SGP 2.85x ($10 trade credit → $28.48, no cash).
- Week 3 cash to date: 33 tickets, $466.55 staked, $336.55 lost outright; master RR $105 pending.

## Lessons
- BEO "Game Props" (largest lead, team TDs, first downs, scoreless/highest-scoring Q, longest TD) can't be combined in parlays.
- Andy rejects first-half legs on full-game tickets.
- Novig trade credits pay full contract value → EV ≈ $10 at any fair price; min 1.50x; no USD mixing; parlays OK; expire Tue 9/29 5:00 PM ET.

## Next
1. MNF PHI @ CHI (Mon 5:15 PT): review new Twitter bookmarks; confirm CHI QB (Keenum vs Bagent), Saquon (Holka: out), DeVonta Smith, inactives. Novig credit #2 pending: Hurts ATD 2.56x / Lemon 4+ rec 2.94x / Kmet 20+ rec yds 3.23x / Loveland 5+ rec 2.86x = 65.02x → $650.18 (pay with the Trade Credit). BKR ladder: `reports/bets/week3-mnf-phi-chi-island-ladder-2026-09-27.md` (re-price).
2. Grade MNF, master RR, Novig credits; settle Week 3; ledger.
3. Bankroll sync dry-run only with Andy's OK.
4. Week 4 build: SuperContest split stake; no prop RRs; TNF PIT @ CLE ladder.

## Resume prompt
```
Resume in E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Read HANDOFF.md, then handoffs/2026-09-27-2130-claude-week3-sunday-graded-mnf-prep-handoff.md. Reconcile live Git without pull/reset/clean/stash; stale .git/index.lock, .git/HEAD.lock and .git/refs/heads/main.lock may exist, so use the GIT_INDEX_FILE / commit-tree workaround (push with `git push origin <sha>:refs/heads/main`) or ask Andy to delete them. Week 3 Sunday is fully graded in data/official-picks/user-placed-wagers-2026.json (Live Tracker: `node scripts/generate-live-tracker.mjs --week 3`). Today is MNF PHI @ CHI (5:15 PT): (1) ingest new Twitter bookmarks in .nfl/reports/twitter-bookmarks/ for PHI/CHI ideas and confirm CHI QB (Keenum vs Bagent), Saquon, DeVonta Smith and inactives; (2) help Andy finalize Novig trade credit #2 (pending 4-pick SGP Hurts ATD / Lemon 4+ rec / Kmet 20+ yds / Loveland 5+ rec, 65.02x — credits expire Tue 9/29 5:00 PM ET, must pay with the Trade Credit, min 1.50x) and the BKR MNF ladder in reports/bets/week3-mnf-phi-chi-island-ladder-2026-09-27.md (re-price on Monday's board); (3) after MNF, grade the master RR #739361263 (needs PHI −3), the Novig credit tickets and any MNF tickets, settle Week 3, and update the DEV-project ledger claude/recommendation-ledger-2026.md. Every player named must pass `npm run roster:vet -- --week 3 --date 2026-09-26 --fetch --strict`. No wagers, account actions, TheOddsAPI calls, Supabase writes or Bankroll sync without Andy's explicit per-action OK.
```
