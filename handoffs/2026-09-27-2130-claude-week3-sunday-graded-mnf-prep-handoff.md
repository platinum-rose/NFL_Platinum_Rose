# Week 3 Sunday: afternoon + SNF tickets placed and graded; MNF prep + Novig credits

**Session:** Claude (Cowork), Sun 2026-09-27 ~10:10–21:30 PT. Continues `handoffs/2026-09-27-1010-claude-week3-sunday-props-placed-tracker-supercontest-handoff.md`.

## State at handoff
- Git: `main`, pushed. Commits this session: `fbed7cc` (SuperContest Week 3 locked card + tracker fix so the hardcoded Week 1 board no longer leaks into later weeks) and the commit carrying this file. Built with the `GIT_INDEX_FILE` / `commit-tree` workaround: stale zero-byte `.git/index.lock` **and** `.git/HEAD.lock` exist (bridge can't delete). Andy: `del .git\index.lock .git\HEAD.lock`. Until then `git status` shows committed files as modified (real index is stale).
- **Not committed on purpose:** `data/official-picks/user-placed-wagers-2026.json` (gitignored; all tickets below are in it, graded) and the Live Tracker HTML (`public/` + `docs/tracked-wagers/live-tracker-sunday.html`, embeds wager data). Regenerate: `node scripts/generate-live-tracker.mjs --week 3`, then Ctrl+F5 (the in-page 🔄 only refetches scores).
- No Supabase / Bankroll sync / TheOddsAPI calls. DEV-project ledger `claude/recommendation-ledger-2026.md` updated through SNF (D6–D11 + results).

## Week 3 results (graded from ESPN box scores)
- Morning: SuperContest five #739360142 lost (TEN +3, CIN −3; contest lines TEN +2.5 / CIN −3.5 also missed), 8-team #739361262, 5-team #739361521, teaser #739360277, #739211245 (open spots never filled), 7a #1000102186, #999770738, #1000184658, #1000179616, #1000175585, last-minute 8-leg — all lost.
- Afternoon: #739396029 slot-4 5-team lost (TB ML, SF −7, LV/NO U44), Stack A 6-leg lost (Andrews 24, J. Thompson 3), Stack B 7-leg lost (Dak 1 TD, Vele 3, Jefferson 2), 7b #1000104912 lost, 2+ TD 4-leg lost (CMC 1 TD), First-TD re-run lost (Deebo first TD).
- **Dog-ML RR #739358766 WON**: IND, CLE, LV → 3 of 10 combos ≈ $39.21 on $25 (estimate from ticket prices — confirm vs BKR settlement).
- SNF (DEN 30–26, total 56): Tiers 1–3, Moonshots 1–2, BKR 2-team SGP ×2 (#739428145/#739428148, U43.5 / LAR +2 — Andy placed it twice by accident, both official) all lost.
- **Still live:** Master RR #739361263 — one combo (IND / NYJ-DET O47.5 / JAX / **PHI −3**) needs PHI −3 Monday (~$18 back). Novig credit #1 (PHI ML + U41.5 SGP 2.85x, $10 trade credit → $28.48, no cash).
- Week 3 cash to date: 33 tickets, $466.55 staked, $336.55 lost outright, dog RR +$14.21 net, master RR $105 pending.
- Paper (not placed, not in wagers file): 7-leg +6200 lost 2 of 7.
- Missing BEO ticket numbers (from BEO history): 2+ TD 4-leg, last-minute 8-leg, first-TD re-run, Stack A, Stack B, SNF Tier 1/2/3, Moonshot 1/2.

## Decisions / lessons this session
- BEO won't combine its "Game Props" section (largest lead, team TDs, first downs, scoreless/highest-scoring quarter, longest TD) in parlays; player props + Game Markets (totals, team totals, halves) are fine.
- Andy rejects first-half legs on full-game tickets (can die at halftime).
- Novig trade credits: priced as probability, min 1.50x (≤66.7%), can't mix with USD, usable on parlays, **pay full contract value** (so EV ≈ $10 at any fair price — pick confidence, not longshots). Expire **Tue 9/29 5:00 PM ET**.
- SNF read (low-scoring, Rams run) was wrong: DEN scored 30 (two 2-pt tries + pick-six), Corum 6-15.

## Open items for the next session
1. **MNF PHI @ CHI (Mon 5:15 PT).** Andy wants to review more Twitter intel first (`.nfl/reports/twitter-bookmarks/`), then place:
   - **Novig credit #2 (pending, not placed):** 4-pick SGP Hurts ATD 2.56x / Makai Lemon 4+ rec 2.94x / Cole Kmet 20+ rec yds 3.23x / Colston Loveland 5+ rec 2.86x = 65.02x → $650.18 on the $10 trade credit. Depends on Case Keenum starting (TE-heavy). Confirm CHI QB + inactives; make sure the Trade Credit (not USD) is the payment.
   - **BKR MNF ladder** (proposal): `reports/bets/week3-mnf-phi-chi-island-ladder-2026-09-27.md` (Tier 3 there is superseded by the Novig slip). Saquon OUT (Holka), D. Smith hamstring watch, Bagent Q / Keenum likely. Re-price on Monday's board; roster vet PASSED.
2. Grade MNF + master RR + Novig credits; settle Week 3; ledger.
3. Only with Andy's explicit OK: `node scripts/sync-placed-wagers-to-bankroll.mjs --dry-run`.
4. Week 4 build (TUE–WED): apply the SuperContest split stake (~$15 5-team + $10 2-team RR); no prop RRs; TNF PIT @ CLE island ladder.

## Resume prompt
```
Resume in E:\dev\projects\NFL_Dashboard (device_bash: $HOME/mnt/dev/projects/NFL_Dashboard). Read HANDOFF.md, then handoffs/2026-09-27-2130-claude-week3-sunday-graded-mnf-prep-handoff.md. Reconcile live Git without pull/reset/clean/stash; stale .git/index.lock and .git/HEAD.lock may exist, so use the GIT_INDEX_FILE / commit-tree workaround or ask Andy to delete them. Week 3 Sunday is fully graded in data/official-picks/user-placed-wagers-2026.json (Live Tracker: `node scripts/generate-live-tracker.mjs --week 3`). Today is MNF PHI @ CHI (5:15 PT): (1) ingest new Twitter bookmarks in .nfl/reports/twitter-bookmarks/ for PHI/CHI ideas and confirm CHI QB (Keenum vs Bagent), Saquon, DeVonta Smith and inactives; (2) help Andy finalize Novig trade credit #2 (pending 4-pick SGP Hurts ATD / Lemon 4+ rec / Kmet 20+ yds / Loveland 5+ rec, 65.02x — credits expire Tue 9/29 5:00 PM ET, must pay with the Trade Credit, min 1.50x) and the BKR MNF ladder in reports/bets/week3-mnf-phi-chi-island-ladder-2026-09-27.md (re-price on Monday's board); (3) after MNF, grade the master RR #739361263 (needs PHI −3), the Novig credit tickets and any MNF tickets, settle Week 3, and update the DEV-project ledger claude/recommendation-ledger-2026.md. Every player named must pass `npm run roster:vet -- --week 3 --date 2026-09-26 --fetch --strict`. No wagers, account actions, TheOddsAPI calls, Supabase writes or Bankroll sync without Andy's explicit per-action OK.
```
