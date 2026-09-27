# Week 3 Game Card Record — 2026-09-27

## Official Platinum Rose paper recommendation (not placed)

Andy explicitly approved the following as an official Platinum Rose AI paper recommendation, then disregarded it when placing the final ticket:

- Four-leg parlay: SF -7.5, LAR-DEN Under 45, CIN-PIT Under 43.5, PHI-CHI Under 43.
- Bookmaker display: $20 risk to win $218.13, approximately +1091; observed in Capture5 at approximately 02:33 PT.
- Status: `official_paper_disregarded_by_user`; paper benchmark only, not a wager.
- Divergence: the placed ticket used SF -7 instead of SF -7.5 and added BUF -6.5; the three totals were retained.

## User-placed exposure — review-only, pending grading

### Ticket 739361263 — Compact Round Robin (70P-4T)

- Bookmaker; placed 2026-09-27 02:14 PT.
- Risk: $105.00. Maximum win: $1,210.51. Status: pending.
- Legs: CIN -3 -115; SF -8 -103; PHI -3 -118; TEN +2.5 -115; IND +2.5 -119; LAR-DEN Under 44.5 -115; NYJ-DET Over 47.5 -120; JAX -3 -105.
- Grade against bookmaker’s 70-combination settlement; do not infer a single parlay result.

### Ticket 739361262 — 8-team parlay

- Bookmaker; placed 2026-09-27 02:14 PT.
- Risk: $5.00. Maximum win: $778.66. Status: pending.
- Same eight legs as ticket 739361263.

### Ticket 739361521 — Final 5-team parlay

- Bookmaker; placed 2026-09-27 02:34 PT.
- Risk: $20.47. Maximum win: $390.32. Status: pending.
- Legs: SF -7 -128; LAR-DEN Under 45 -121; CIN-PIT Under 43.5 -121; PHI-CHI Under 43 -115; BUF -6.5 -124.
- This is Andy’s final placed game card and is separate from the four-leg paper recommendation.

## Tracking boundary

This file is a local, append-only tracking record because the shared official-pick and placed-wager JSON files were locked by concurrent tooling during closeout. No Supabase write, Bankroll sync, sportsbook action, or official-pick mutation was performed. Reconcile these ticket numbers and stated risk/win amounts into the local Bankroll ledger when the concurrent lock clears; use the bookmaker settlement to grade them.

## Recommendation ledger — pending import

The official paper recommendation and the three placed tickets above are the complete Week 3 game-parlay record for the next synthesis session. Player-prop work remains open and must not inherit these game legs as recommendations.
