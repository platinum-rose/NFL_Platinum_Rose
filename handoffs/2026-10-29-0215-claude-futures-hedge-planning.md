# Claude handoff — futures hedge planning, October 29, 2026 2:15 AM PT

## Resume

Read `HANDOFF.md`, reconcile live Git, then `AGENTS.md` / `CLAUDE.md`. Branch `claude/w5-prop-cards-2026-10-11`. This session's work is in the commit that contains this file, on top of `866e1f0`. Live Git wins. The working tree still holds extensive unrelated dirty/generated/private work (39 modified, ~875 untracked at session start). Preserve it; no broad staging, reset, clean or stash. `AGENT_LOCK.json` was empty.

**TNF is today: CAR @ GB, Thu Oct 29 5:15 PM PT.** Nothing for TNF was run this session. The Week 8 card (`reports/bets/2026-w08-card.md`) is still a HOLD draft. Thursday cadence, the strict roster gate and any Supabase/account step need Andy's per-action OK (see the 10/28 7:40 PM handoff, `handoffs/2026-10-28-1940-codex-claude-week8-futures-tnf.md`, for TNF detail).

## What this session did (all futures; no TNF work)

- **Circa parlay comparison:** `reports/bets/2026-w08-circa-parlay-comparison.md` (+ `.py`). Uses only lines under 24 hours old (Andy's rule): Circa 10/28 7:18 PM and Bookmaker 10/28 9:21 AM. BetOnline 10/27 (~29 h) and DraftKings (no time; also offers no exactas) are excluded. Result: no ranked AFC×NFC pairing is +EV at Circa; Circa beats Bookmaker's synthetic price on 23/42.
- **Playoff hedge planner:** `scripts/futures/playoff_hedge_planner.py` (local, read-only; `selftest` passes and is pinned to the Oct 22 positions behind the review matrix). Modes:
  - `sb`: Super Bowl 0/50/100% hedge.
  - `conf`: maximin hedge across both conference games, with a budget cap.
  - `reserve`: every SB pairing, including a seeding-priced column.
  - `middle`: moneyline vs spread vs mix for one game, with `auto:TEAM` branch values and a parlay-spot alternative. The margin model is normal with SD 13.5 and ignores the key numbers 3 and 7; replace it with real playoff margin data before January.
- **Futures review** `reports/bets/2026-w08-futures-review.md` gained these sections: Positions added Oct 29; Playoff hedge reserve; Open parlays as hedge equity; Seeding and hedge pricing.
- **Open parlays (Bookmaker, 6 tickets, 11 spots, $1,070.36 equity):** Andy confirmed them live and actionable. Andy's rule: a two-spot ticket takes one side plus one total, never two sides or two totals. Plan: fill each two-spot ticket's total before conference weekend so it arrives with one side spot. Recorded in `data/futures-imports/open-parlays-2026.json` (`bookmaker_open_spot_rules`) and the ledger's `open_parlays` block (`live_actionable`, confirmed rule, pending checks).
- **Placed by Andy, recorded in the ledger:** BetOnline ticket 1009963278 (10/29):
  - GB–JAX $7 @ +14600, cash
  - SEA–CIN $13 @ +7700, cash
  - SEA–BUF $19.09 @ +3400, promo ($10 cash reward + $9.09 promo winnings, both now $0 in `data/sportsbooks/promotions-2026.json`)
  - SB stakes are now $439.84 nominal ($373.09 cash + $66.75 promo); ledger cash $413.09 vs the $500 cap.

## Andy's confirmed positions and preferences (this session)

- Exactas pay on the finalist pairing regardless of the SB winner.
- Circa AFC+NFC parlays are available via an on-site proxy in Las Vegas. Payout assumed to be the product of the two legs; the price, cap and minimum are unconfirmed.
- Analyze with existing lines under 24 h old; no mid-week refresh needed.
- Skip new GB/BUF outright futures. Focus is low-wager, high-output positions that become useful hedges in the playoffs, not mid-season hedges.
- Seeding matters: BUF is likely a top seed (opponents are underdogs → cheap hedges and spread middles). GB is likely a wild card / road underdog (hedge side is the favorite → expensive, no middle). He concluded **not** to build NFC-champion positions for GB protection; added SEA exactas as value/gap-fill instead.

## Open items

1. **Uncovered GB Super Bowls:** GB–NE (BEO +25,100 on 10/27) and GB–HOU (Circa +47,900 on 10/28; Andy considered $5 via proxy; **not placed**). Each is −$440 if GB loses.
2. **Bookmaker open-spot checks still pending:** same-game side+total allowed? may a spot stay unfilled? exact expiry per ticket; maximum payout; can futures fill a spot?
3. **Balances to verify:** the $20 BetOnline free-bet balance (−110 sides/totals only; Andy planned to use it on BUF's next game); whether the Week 5 Bills credit is inside it; Bookmaker BetPoints cash value (6,899 points as of 9/21).
4. **Playoff cash hedge reserve:** `limits.playoff_cash_hedge_reserve_usd` is still null and is Andy's decision. Options are in the review (~$400 / ~$1,800 / ~$2,300–2,500 before seeding adjustments).
5. **Ledger not reconciled with accounts** since 10/22 except the 10/29 ticket. The promo-stake-returned assumption is still unverified (planner flag `--promo-stake-not-returned`).
6. **M6 checkout** was last at `71c6b4f`. Not reachable from this session; reinspect before updating.
7. **`FuturesPortfolio.jsx` visual check** (from the prior handoff) is still not done.

## Guardrails (unchanged)

No wager, account, ledger/portfolio, Supabase, paid API/model or publication action without Andy's per-action OK. No player-named output without a current strict roster gate pass. Do not claim dashboard integration for local futures files. Debris from this session's device link (deletes are blocked there): a few empty `.git/objects/*/tmp_obj_*` files, `E:\dev\tmp_ignore\_locktest_b`, and pre-change backups kept outside the repo.
