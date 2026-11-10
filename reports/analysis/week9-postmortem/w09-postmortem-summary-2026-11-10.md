# Week 9 post-mortem summary (2026-11-10)

Page: `reports/bets/season-recap/week9-post-mortem.html` (write-up pass done; no auto-draft text left).
Run index: `reports/bets/season-recap/work/w9/postmortem_w9.md`; scorecard `work/w9/scorecard_w9.md`; rules `work/w9/rules_w9.md`.

## Result
- Cash: 21 tickets, 5 cashed, $223.11 staked, $433.23 back, **net +$210.12** (second straight winning week).
  Ledger ticket-level net incl. bankroll-exempt and promo: +$224.31 (27 tickets, 6-21). Supabase `user_bankroll_bets` W9 = 27 rows (6 won / 21 lost), in sync.
- Promo: 6 tickets, $45.00 credit -> $11.69.
- Season cash to date: W1-W9 net -$222.49 (W6 +$1,282.79, W8 +$267.83, W9 +$210.12).
- Placed legs 76/123 (62%). TB@CHI 28/37 best; BUF@MIN 18/38 (BUF 23-6 killed every Over/TD leg).

## What worked / didn't
- Island SGP ladders the only profitable family: 12 tickets, 3 cashed, +$304.53 (BKR SNF SGP6 $15 -> $216.60; Pick6 MNF Cook TD 4-pick $127.41; DK SNF 4-pick $83.23).
- Game-line parlays -$64.43 (SC 5-team on NYJ +9.5; two SNF Under 48.5 2-picks lost at 51; BKR MNF Over 44.5 / MIN +3.5). Non-island prop parlays 0/3.
- 7+ leg cash 0/4 (-$37.88); 4-6 leg cash +$297.43.
- Anytime TDs the bleed again (Henry, Swift, Kraft x2, St. Brown, Jefferson, Allen, Hockenson, Coleman).
- AI: AI-backed props 4/5, unplaced AI props 9/12, Andy-only props 48/77. TNF C1 (Fagnano U165.5 / 1+ INT / BAL TT U16.5) went 3/3 unplaced.
  S1 2/3 (Gibbs 74 vs 79+), S2 1/2, S3 teaser 2/3, S4 dogs 0/3.
- SuperContest: AI five 2-3 (HOU, TB); official 3-2 (SF, TB, HOU).
- **Historical note (Andy 11/10):** the BKR SC 5-team open spot (leg 5) was meant to be live ARI +12.5 and was never filled. For season accuracy, count it as ARI +12.5 = LOST (ARI 3-17). Recorded on the ledger leg (`intended_selection`, `hypothetical_result`, `history_note`; status stays NOT_FILLED, ticket result unchanged) and in `crosscheck-adjudications.json`.
- Fair lines: winners 13/14 (miss GB@NE), home-margin MAE 7.7, total bias -1.4; five games finished under 35.

## Rules
- C1 (max 4 legs) broken on 11 of 21 cash tickets -> **retired**; replaced by **R9-1: cash max 6 legs, 7+ promo only** (Andy accepted 11/10, effective W10).
- C2, C4, C5 followed. C3 (lowest receiving rung) broken 3x; compliant tickets netted more (+156.76 vs +53.36). C2-C5 stay active.

## Tooling fixes this run (backups *.bak-claude-20261110-*)
- `scripts/crosscheck-adjudications.json`: SC 5-team open spot (#5) adjudicated LOST as intended ARI +12.5 (never filled). Market is `open_spot`, the crosscheck skip only knows `open_slot`.
- `scripts/scorecard.py`: reads the W9+ fair-lines format ({meta, games}, `fair_line`); previous crash `'str' object has no attribute 'get'`.
- `scripts/cfg_w9.py`: PROJ key LAR@WAS -> LAR@WSH (ESPN code), so 14 games are scored.
