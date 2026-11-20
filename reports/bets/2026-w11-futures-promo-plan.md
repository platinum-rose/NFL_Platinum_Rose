# W11 futures: BetOnline promo money (Wed 11/18 ~10:45 PM PT)
Proposal only. Prices: BOL futures capture Tue 11/17 4:54 PM PT (data/futures-imports/betonline-2026-11-18.json), vig removed. Matrix: reports/bets/futures_matrix_w11.py.
Promo money: VIP Reloads $26.40 (ledger) + boosts/casino since 11/7 $8.47 = ~$34.87; plus $17.39 BUF-only credit.

- Portfolio EV at Tuesday prices +$53 (was +$186 on 11/10); loses in 72% of Super Bowls.
- BOL prices every SB matchup at ~86% of fair (AFC x NFC product minus a flat margin). JAX/SF is worse: +1200 vs fair +1502 (81%).
  Conference prices are better value: JAX AFC +325 and SF NFC +225 both ~93% of fair.
- Biggest holes (net -$440): JAX/SF 6.2%, CIN/SF 4.8%, KC/SF 4.4%, JAX/CHI 3.5%, DEN/SF 3.1%.

| Option ($34.87 + BUF credit on BUF SB +575) | EV | JAX/SF | CIN/SF | KC/SF | JAX/CHI |
|---|---:|---:|---:|---:|---:|
| nothing | 53.3 | -440 | -440 | -440 | -440 |
| JAX/SF $34.87 @+1200 | 44.8 | -39 | -492 | -492 | -492 |
| JAX/SF $20 + JAX/CHI $14.87 @+2300 | 45.3 | -232 | -492 | -492 | -135 |
| JAX AFC $34.87 @+325 | 48.9 | -344 | -492 | -492 | -344 |
| SF NFC $34.87 @+225 | 48.9 | -379 | -379 | -379 | -492 |

## Kalshi check (Wed 11/18 ~10:55 PM PT, public API; snapshot data/futures-imports/kalshi-sb-outcome-2026-11-18.json)
Matchups (buy both directions, asks + taker fee): JAX/SF +964 (BEO +1200, fair +1502); JAX/CHI +1270 (BEO +2300); JAX/MIN +1539 (BEO +3000); CIN/SF +567 (BEO +1600). Books are thin (bids 0.1c). BEO is far better on every matchup.
Conference / SB (after fee): JAX AFC +317 (BEO +325), SF NFC +212 (BEO +225), CHI NFC +376 (BEO +475), JAX SB +669 (BEO +750), SF SB +456 (BEO +550); only CIN SB is better on Kalshi (+1011 vs +1000). Kalshi needs cash; the promo money is BEO-only.
