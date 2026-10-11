# Week 5 Prop Cards Handoff (2026-10-11, Sunday)

Proposed-only research; Opus synthesis edge ~0. Andy builds from existing Opus runs, digest, Saturday-night BKR (06:21Z) / BEO (06:24Z) captures. **Do NOT re-run packets/synthesis.**

## Placed tickets (all logged in data/official-picks/user-placed-wagers-2026.json, status PENDING)
| Slot | Book | Ticket # | Stake / To win | Notes |
|---|---|---|---|---|
| 7a 6-leg | BEO | 1004397711 | $10 / $550 | |
| 7b 6-leg | BEO | 1004398638 | $5 / $315 | adds Purdy 2+ pass TD |
| 7d hybrid 8-leg (orig) | BEO | 1004400836 | $5 / $770 | has Tuten O66.5 (Tuten hit yardage, leg likely WON - Andy to confirm), Jones 17+ carries |
| 7d rebuild 8-leg | BEO | 1004494024 | $5 / $980 | Tuten replaced; extra exposure |
| 7e ATD 7-leg | BEO | 1004403046 | $5 / $5,230 | |
| 8a FTD 3-leg | BEO | 1004401991 | $5 / $516.70 | Taylor, McCaffrey, Gibbs |
| 8b 2+TD 3-leg | BEO | 1004399154 | $5 / $225 | Taylor, JSN, Gibbs |
| TD lottery 7-leg | BEO | 1004236400 | $5 / $1,100 | placed 10/10; leg 7 Tuten 1+ TD |
| ATD 7-leg (Collins etc.) | BEO | 1004387953 | $5 / $2,450 | |
| TD rebuild 6-leg | BEO | 1004495970 | $2.73 / $674.31 | stake-limited |
| SuperContest 5-team parlay | BKR | 740087500 | $25 / $538.23 | CIN -7, ARI +6, ATL -3, LV +3.5, NO +3 |
| SuperContest RR 5x2 | BKR | 740087501 | $15 / $37.23 | 5th selection inferred (paste truncated) |
| 7-team parlay | BKR | 740093896 | $25 / $553.41 | cash-out offered $9.99 |
| earlier BKR tickets | BKR | 740069722, 740070028, 740070029, 740070077, 740070347 | | prior session |

## Open items
- 7c SNF/evening combos: not built. Andy places after morning slate ends (BAL@ATL 5:20 PM PT, BUF@LAR Mon 5:15 PM PT; DK Predictions combos per docs/NFL_WEEKLY_CARD_PROCESS.md).
- Confirm: Tuten yardage leg WON on #1004400836? Did Tuten score a TD (affects #1004236400)?
- Confirm book = BetOnline for 10-digit tickets (inferred from format) and 5th SuperContest RR selection (Saints).
- Settle legs as games finish; Live Tracker regenerates with `node scripts/generate-live-tracker.mjs` (ESPN fetch fails offline).
- Bankroll sync (`scripts/sync-placed-wagers-to-bankroll.mjs`): Andy runs in PowerShell only; no Supabase writes from Claude.

## Guardrails
Append-only ledger edits with backup; never `git add -A` (other lanes have uncommitted work); concentration: Taylor ~5 tickets, JSN, Gibbs, McCaffrey, ATL, LV, CIN, WAS, DEN. Week 4 lesson: 5+ leg straight parlays went 0 for 58. Flag everything as proposed-only research.

## Resume prompt
> Continue the Week 5 NFL_Dashboard card as Claude Team 3 pickup. Read reports/handoff-snapshots/2026-10-11-w5-prop-cards/HANDOFF.md and data/official-picks/user-placed-wagers-2026.json. Do NOT re-run packets or Opus synthesis; build only from existing outputs and the Saturday BKR/BEO captures. First ask Andy for any pasted slips/results, then: settle finished legs (append-only with backup), regenerate the Live Tracker, and build 7c SNF/evening combos for BAL@ATL and MNF BUF@LAR when he asks. No Supabase writes (Andy runs the sync). Never `git add -A`; stage explicit paths only. Treat all picks as proposed-only research.
