# STATE — NFL_Dashboard (single current-state file; rewrite, don't append; max 40 lines)
Updated: Fri 2026-11-27 ~11:50 AM PT (Claude Team 2, W12 Wed/Thu wrap). Another session was active in the repo 11-27 AM (logged FDP 2H ticket, rebuilt mobile state) — reconcile live git first.

## Repo
- Branch `claude/w5-prop-cards-2026-10-11`. This session's commit is LOCAL ONLY (device push blocked) — Andy pushes. Commit named paths only (temp-index method; see STATE.md.bak-claude-20261126-close).
- Device VM can't reach ESPN; settle from `public/live-tracker-mobile-state.json` (built 11-27 11:21 PT by the other session) via `python3 scripts/settle_from_mobile_state.py` (dry run, then --apply).

## W12 Wed/Thu — SETTLED 11-27 (32 by settler + 5 by hand)
- Finals: LAR 26-13 GB; CHI 39-35 DET; PHI 39-38 DAL; BUF 13-10 KC.
- Cashed: FDP 3-leg +$19.20; BKR CHI@DET SGP 742375974 +$224.60; BKR KC+3.5/U47.5 742416836 +$86. RR 742351627: 5 of 8 legs → 5 combos, returned $83.12 (net -$21.88). Everything else lost.
- Net W12 so far: official bankroll +$79.13; all books incl. DKP/FDP/Pick6 -$96.44.
- Hand-graded losses: BOL 1019155914-1 (DAL ML), BOL 1019185837, DKP Andy 10-pick, Pick6 8-pick, FDP 2H 4-sel (other session's row).
- Alejandro: Wed split and Thu split both lost (he owes $5 each). The DKP 6-pick ATD "split" was never placed → moved to Imaginary (`paper_w12_thu_alejandro_6pick_atd_not_placed`); copy kept at `data/official-picks/unconfirmed-w12-alejandro-6pick-atd.json`. Andy runs `npm run tracker:alejandro:publish`.

## Still PENDING (W12)
- DKP 8-pick M1 alt ($10→$525): Thu legs all WON (Cook TD, Cook 117 rush, Kelce 4 rec); Sun: WAS -6.5, LV +6.5, NYG -5.5, MIN ML, BAL/HOU o42.5.
- DKP DEN@PIT, Fri 12:00 PT: 5-pick +20% boost ($9.94→$100.01) and 4-pick +10% boost ($9.94→$92.51: Warren TD / Bernard 3+ rec / U45.5 / Boswell 1+ FG), and 6-pick +10% boost ($9.94→$146.41: o33.5 / Lutz 2+ FG / Bernard 20+ yds / Rudolph INT / Coleman TD / Coleman 60+).
- Imaginary/paper W12 tickets not graded.

## Tracker change this session
- `scripts/generate-live-tracker.mjs`: Round Robins ignore manual card burns; they go to Burnt only when zero combos are alive (Andy 11-26). Backup `.bak-rr-burn-20261126`.
- Ledger conventions: 2H legs use market second_half_spread/second_half_total (check-wager-legs warns "missing player" — harmless). Allen 3+ pass+rush TD (`pass_rush_td`) and Pick6 rush_rec_td legs need hand grading.

## W12 rules
- R11-1 ($60/game) enforcement deferred to W13; W11 card rule waived for W12 holiday tickets.

## NEXT SESSION GOAL
- Grade DEN@PIT boost after Fri final. Sunday: build stacks from Sunday slate after Fri injury reports (edge_w12.py-style usage + hit-rate checks first). Grade M1 alt Sunday legs.
- Backlog: schedule.json W12 kickoff times wrong (TEN@JAX is 1:05 PM, NE@LAC, LV@CLE); paper W9/W10/W12 grading; season-recap half-sack grading; roster_vet plain-name gap.

## Where older context lives
- `HANDOFF.md`, `handoffs/`, `docs/CLAUDE_REFERENCE.md` (grep), `docs/MOBILE_LIVE_TRACKER.md`, `STATE.md.bak-claude-20261126-close`, `STATE.md.bak-claude-20261127`.
