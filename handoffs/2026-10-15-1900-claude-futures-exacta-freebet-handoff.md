# 2026-10-15 19:00 PT — Futures/exacta tooling, free-bet tracking, Thursday cadence

Branch `claude/w5-prop-cards-2026-10-11`. Local commits ahead of origin (Andy pushes): `95d8f63`, `544c402`, `7ccee23`, plus the final handoff commit on top of `d968cf2`.

## Done this session
- ESPN roster snapshots now archived by date (`data/nfl-rosters/espn-full-rosters-YYYY-MM-DD.json`); W6 projected-starters snapshots committed; four stale `.bak` files deleted.
- BEO futures scraper -> `data/futures-imports/<book>-YYYY-MM-DD.json` (`scripts/props/beo-futures-to-imports.mjs`, wired into `cron-bol-futures-scrape.mjs`). Rows carry `selection` + `implied_prob`.
- Tracker (`scripts/generate-live-tracker.mjs`): odds-derived probability fallback, exacta pair canonicalization, primary book = freshest, other books shown alongside, best last payout starred. Price watch now BUF, CHI, SF, LAR, BAL, SEA (SB winner + exacta, 25%); exacta books = BetOnline + BetUS.
- BetOnline prop parser fixed ("Scoring a Touchdown" ATD, Total Sacks); W6 capture gate passed 14/14 games, 770 rows.
- Free bet tracked: BEO ticket **1005591415**, LV +4.5 -110 vs BUF (Sun 10/18 4:25 PM ET), $10 free, to win $9.09, PENDING. Recorded `funding_type: free_bet`, `cash_risk_usd: 0` (NOT bankroll). If it wins, the $9.09 goes to the futures portfolio. Week 3 Bills-win credit marked used in `promotions-2026.json`; Week 5 credit (BUF 37-34 OT at LAR) logged `expected_unverified`.

## Not committed / deliberately left
- `public/live-tracker-sunday.html` + `docs/tracked-wagers/live-tracker-sunday.html` are regenerated into the **Week 6 board**; HEAD still holds Week 5. Andy to decide: commit W6 board or restore W5.
- 8 older wagers in `user-placed-wagers-2026.json` carry uncommitted working-tree edits from another session (settlements). My commit added only the new free-bet entry on top of HEAD; those edits remain dirty in the working tree.
- Per-game BetOnline capture files and `.raw.txt` in `data/generated/props/` (volatile; TNF recapture pending).
- Ledger `andy-portfolio-ledger-2026.json` NOT updated (as_of 10/08).

## Free money for futures (confirm vs BetOnline cashier first)
Slots $3.96 + $11.90, reloads $2.85 + $4.83 (unreconciled), birthday gift $15.00 = **$38.54** cash-equivalent. Free-bet credits are NOT futures money. Proposed (awaiting Andy's go): BUF-LAR +2500 $10, BUF-SF +2200 $8, BUF-SEA +3500 $5, BAL-LAR +2600 $5, BAL-SF +2250 $5, BAL-SEA +3600 $5.54. Caps: $200 per SB anchor (BUF, GB).

## Andy's next steps
1. Push the branch.
2. `node scripts/backfill-futures-imports.js --dry-run`, then real, so Supabase gets `implied_prob` for betonline-2026-10-13; then Regenerate on Bankroll & Futures -> Intel Report.
3. TNF SEA@DEN (5:15 PM PT): recapture BEO (`props:bol:cron`), Bookmaker (`props:bkr:cron`), DK Predictions (`props:dkp:cron -- --expected-games 14`) 30-45 min before kickoff, then `node scripts/build-player-props-intel.js`.
4. Supply Week 6 QBs (CHI QB needed before any CHI exposure) and the go for the quant synthesis (`--week 6 --dry-run` first).
5. Recapture BetUS and Bookmaker futures (still 10/7).

## Open small items
Import Bookmaker 10/13 SB board (`data/odds/BKR_futures_1013_1123.md`); dedupe "J.K Dobbins"; split operator-reported IR in `build-w06-availability-layer.py`; hold 3 tracked player-availability `.bak`; remaining cleanup groups; SuperContest comparison used Week 5 locked lines.

## Git on this mount
Plumbing commits via temp index. `.git/HEAD.lock` reappears after each update-ref; `mv` it to `.git/stale-HEAD-lock-<ts>`. `.git/index.lock` (07:54) is a stale harmless lock.
