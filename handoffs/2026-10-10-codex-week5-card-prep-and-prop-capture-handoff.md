# Week 5 card-prep and prop-capture handoff — 2026-10-10 PT

## Start here

1. Read `HANDOFF.md`, then this file.
2. Reconcile live Git (`git status -sb`, current branch, recent log) before trusting this prose. The shared checkout is intentionally dirty; preserve unrelated files and use an explicit temporary Git index for any later commit.
3. Continue only the Week 5 research/card-prep lane. This handoff does **not** authorize a wager, ticket, bankroll/portfolio/ledger mutation, Supabase write, or sportsbook/cashier action.

## Verified state

- Week 5 readiness preflight passed with zero stale gates on 2026-10-10. The legacy Week 4 SuperContest comparison is excluded; `data/supercontest/week-05-2026-verified-lines.json` is the verified Week 5 reference.
- `scripts/fetch_nflverse_data.py` now has an NFLverse `games.csv` fallback for Python environments where archived `nfl_data_py` cannot install. The 2026 games refresh and `scripts/build-power-ratings.js --season 2026` completed locally.
- Current analysis layers are review-only:
  - `reports/intel/master-intel-narratives-2026-w05.md`
  - `scratch/w05-synthesis-digest-sat.md`
  - `reports/bets/2026-w05-card.md`
  - `scratch/w05-player-prop-synthesis-2026-10-10.md`
  - `data/research-intel/hypothesis-ledger/2026-w05-pilot.json`
- The proposed side shortlist is LV +3.5, CHI -1.5, and BUF +3. These remain `review` / `unpriced_thesis`, not tickets. The prop-review priorities are Greg Dulcich over 25.5 receiving yards and Quinshon Judkins under 59.5 rushing yards, each awaiting final offer/availability verification.
- Roster vet passed with zero blocking issues. Its unresolved rows are info-only source-data identity issues; do not silently convert them into player-leg approval.

## Fresh capture evidence

- Bookmaker capture: 14 Week 5 games found and raw/normalized evidence refreshed. Some parser categories remain explicitly unavailable/unpublished; preserve those as unavailable rather than fabricating a substitute market.
- BetOnline capture: 14 games, 976 rows, 78 players, 24 markets, zero unknown markets and zero invalid odds in the latest normalized capture.
- Capture commands from PowerShell:
  - BKR: `npm run props:bkr:launch`, then `npm run props:bkr:cron` (or `./bkrp`)
  - BEO: `npm run props:bol:launch`, then `npm run props:bol:cron` (or `./bolp`)
  - PowerShell does not run current-directory command files without the `./` prefix.
- Both runners operate in dedicated capture tabs. The browser sessions may be authenticated, but all capture work is read-only.

## Next work

1. Re-capture prices close to decision time and preserve the timestamped raw snapshot.
2. Recheck official inactives and availability for each surviving side/prop.
3. Keep market-price verification separate from analyst evidence. Leave `unpriced_thesis` in place unless a defensible probability is actually calculated and frozen.
4. Update the proposed card and Master Intel report only after that verification. SuperContest decisions are a separate workflow; do not copy sportsbook prices or selections automatically.
5. If the user later authorizes real tickets, record the recommendation and accepted ticket separately, with accepted book/price/time. No current authorization exists.

## Stop conditions

- Stop and report a stale/missing capture, changed line, unavailable market, or status conflict.
- Do not stage broadly, reset/clean/stash, or alter unrelated shared changes.
- Do not place bets or write official records without fresh, explicit authorization.
