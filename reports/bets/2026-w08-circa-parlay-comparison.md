# Circa AFC+NFC parlay vs current market references — October 28, 2026 (evening)

Research only. No wager, ledger or account action. Built 7:55 PM PT under Andy's rule: analyze with existing lines less than 24 hours old; no refresh tonight.

## Inputs and freshness (as of 7:51 PM PT Oct 28)

| Source | Captured | Age | Used? |
|---|---|---|---|
| Circa conference futures (`data/futures-imports/circa-2026-10-28.json`) | Oct 28 7:18–7:20 PM PT | <1 h | Yes — priced side |
| Bookmaker (BKR) public conference board (from `2026-w08-missing-exacta-composite.md`) | Oct 28 9:21 AM PT | ~10.5 h | Yes — independent reference |
| Prediction-market coherence (`data/prediction-markets/cross-market-coherence-latest.json`) | Oct 28 3:00 PM PT | ~5 h | Sensitivity only (gross, 2 ranked teams missing, see caveat) |
| DraftKings editorial board | "Oct 27", no time | unknown, likely >24 h | **Excluded** (also: DK offers no matchup/exacta bets; reference only) |
| BetOnline matchup capture | Oct 27 2:56:55 PM PT | ~29 h | **Excluded** (context only) |

## Contract terms (Andy, Oct 28 7:51 PM PT)

- Super Bowl matchup ("exacta") bets pay when the two named teams are the finalists, **regardless of who wins the Super Bowl**. This confirms the assumption used in `2026-w08-futures-review.md`.
- An AFC champion + NFC champion parlay is available at Circa (Andy has placed one in past seasons). Any actionable bet would be placed by a proxy on site in Las Vegas.
- **Still assumed:** the Circa payout is the product of the two decimal prices at ticket time, with no parlay payout cap. The proxy should confirm the price and any limit at the window. Prices here are historical displays, not quotes.

## Method

- Circa parlay = AFC decimal × NFC decimal (assumption above).
- Overround is removed proportionally within each conference market, per book. Circa: AFC 17.6% / NFC 17.6%. BKR: AFC 17.0% / NFC 17.1%. Proportional de-vig leaves some favorite–longshot bias in place.
- Fair pairing probability = P(AFC team wins AFC) × P(NFC team wins NFC). Conference champions never meet before the Super Bowl, so treating them as independent is reasonable, but not exact.
- EV = Circa decimal × fair probability − 1. Three references: BKR no-vig alone (independent of Circa); the Circa+BKR no-vig average; and gross prediction-market conference prices.
- "Circa vs BKR payout" = how much more (or less) Circa's parlay pays than the same parlay built from BKR's prices.

## Findings

1. **No ranked pairing is +EV against either sportsbook reference.** All 42 run from −12.9% to −46.5% against the BKR no-vig price. That is roughly what two ~17% overrounds compounded produce (1/1.17² ≈ 0.73). No ranked pairing is close to break-even.
2. **Circa pays more than BKR's synthetic parlay on 23 of 42 ranked pairings.** Circa is relatively long on Buffalo (+300 vs BKR +262), Cincinnati, Seattle, Green Bay and Minnesota, and short on Kansas City (+350 vs +450) and Detroit (+800 vs +904). Every KC and DET pairing is cheaper at Circa than at BKR.
3. **Green Bay–Buffalo (main goal):** Circa +7,900 vs BKR synthetic +6,630 (+18.9% more payout), but still −13.2% vs BKR fair (fair ≈ +9,100) and −20.6% vs the blend (fair ≈ +10,000). Context only, outside the 24-hour rule: BetOnline displayed +9,800 on Oct 27, near those fair estimates. If more GB–BUF exposure is wanted, a fresh BetOnline price is the comparison to make before using Circa.
4. **Least-bad missing pairings at Circa:** MIN–BUF +3,300, SEA–CIN +6,205, GB–CIN (held) +19,300, MIN–CIN +8,145, DAL–BUF +7,100. All are still −15% to −22% against the blend.
5. **Prediction-market KC signal — do not act on it.** The prediction-market conference prices make every KC pairing look +20% to +26%. That comes entirely from a gross 30% KC conference price. It is inconsistent with the same source's 10% KC Super Bowl price, and its AFC conference prices sum to 115%. Treat it as a data-quality flag, not an edge.

## All 42 ranked pairings (sorted by EV vs blend)

| Matchup (NFC vs AFC) | Held? | Circa parlay | BKR synthetic | Circa vs BKR payout | Fair (BKR no-vig) | Fair (Circa+BKR blend) | EV vs BKR fair | EV vs blend | EV vs pred. mkt (gross) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Seattle Seahawks vs Buffalo Bills | held | +2,500 | +2,079 | +19.3% | +2,885 | +3,170 | -12.9% | -20.5% | -18.1% |
| Green Bay Packers vs Buffalo Bills | held | +7,900 | +6,630 | +18.9% | +9,117 | +9,979 | -13.2% | -20.6% | — |
| Minnesota Vikings vs Buffalo Bills |  | +3,300 | +2,807 | +17.0% | +3,881 | +4,220 | -14.6% | -21.3% | -15.8% |
| Seattle Seahawks vs Cincinnati Bengals |  | +6,205 | +5,318 | +16.4% | +7,321 | +7,933 | -15.0% | -21.5% | -11.7% |
| Green Bay Packers vs Cincinnati Bengals | held | +19,300 | +16,631 | +16.0% | +22,816 | +24,662 | -15.3% | -21.7% | — |
| Minnesota Vikings vs Cincinnati Bengals |  | +8,145 | +7,127 | +14.1% | +9,798 | +10,513 | -16.7% | -22.3% | -9.3% |
| Dallas Cowboys vs Buffalo Bills |  | +7,100 | +6,260 | +13.2% | +8,611 | +9,202 | -17.4% | -22.6% | -19.0% |
| Seattle Seahawks vs Jacksonville Jaguars |  | +4,125 | +3,693 | +11.4% | +5,095 | +5,405 | -18.7% | -23.3% | -23.1% |
| Green Bay Packers vs Jacksonville Jaguars |  | +12,900 | +11,612 | +11.0% | +15,941 | +16,870 | -19.0% | -23.4% | — |
| Dallas Cowboys vs Cincinnati Bengals |  | +17,360 | +15,713 | +10.4% | +21,558 | +22,753 | -19.4% | -23.6% | -12.7% |
| Minnesota Vikings vs Jacksonville Jaguars |  | +5,425 | +4,959 | +9.2% | +6,829 | +7,173 | -20.3% | -24.0% | -21.0% |
| San Francisco 49ers vs Buffalo Bills | held | +1,320 | +1,225 | +7.2% | +1,715 | +1,785 | -21.7% | -24.7% | -20.1% |
| Chicago Bears vs Buffalo Bills | held | +2,900 | +2,716 | +6.5% | +3,757 | +3,895 | -22.2% | -24.9% | -19.0% |
| Dallas Cowboys vs Jacksonville Jaguars |  | +11,600 | +10,969 | +5.7% | +15,061 | +15,562 | -22.8% | -25.3% | -23.9% |
| San Francisco 49ers vs Cincinnati Bengals |  | +3,343 | +3,194 | +4.5% | +4,412 | +4,532 | -23.7% | -25.7% | -13.9% |
| Seattle Seahawks vs Denver Broncos |  | +5,750 | +5,499 | +4.5% | +7,568 | +7,771 | -23.7% | -25.7% | -26.3% |
| Green Bay Packers vs Denver Broncos | held | +17,900 | +17,189 | +4.1% | +23,579 | +24,163 | -24.0% | -25.8% | — |
| Chicago Bears vs Cincinnati Bengals |  | +7,175 | +6,902 | +3.9% | +9,490 | +9,716 | -24.1% | -25.9% | -12.7% |
| Seattle Seahawks vs New England Patriots |  | +7,050 | +6,823 | +3.3% | +9,382 | +9,575 | -24.6% | -26.1% | -19.9% |
| Green Bay Packers vs New England Patriots |  | +21,900 | +21,278 | +2.9% | +29,181 | +29,726 | -24.9% | -26.2% | — |
| Minnesota Vikings vs Denver Broncos |  | +7,550 | +7,368 | +2.4% | +10,128 | +10,299 | -25.2% | -26.4% | -24.3% |
| Minnesota Vikings vs New England Patriots |  | +9,250 | +9,135 | +1.3% | +12,548 | +12,683 | -26.1% | -26.9% | -17.7% |
| San Francisco 49ers vs Jacksonville Jaguars |  | +2,208 | +2,206 | +0.1% | +3,058 | +3,074 | -26.9% | -27.3% | -25.0% |
| Detroit Lions vs Buffalo Bills | held | +3,500 | +3,534 | -0.9% | +4,878 | +4,866 | -27.7% | -27.5% | — |
| Chicago Bears vs Jacksonville Jaguars |  | +4,775 | +4,801 | -0.5% | +6,613 | +6,627 | -27.4% | -27.5% | -24.0% |
| Dallas Cowboys vs Denver Broncos |  | +16,100 | +16,240 | -0.9% | +22,280 | +22,293 | -27.6% | -27.7% | -27.1% |
| Dallas Cowboys vs New England Patriots |  | +19,700 | +20,106 | -2.0% | +27,574 | +27,426 | -28.5% | -28.1% | -20.8% |
| Detroit Lions vs Cincinnati Bengals |  | +8,630 | +8,936 | -3.4% | +12,276 | +12,100 | -29.5% | -28.4% | — |
| San Francisco 49ers vs Denver Broncos |  | +3,095 | +3,304 | -6.1% | +4,562 | +4,439 | -31.5% | -29.6% | -28.1% |
| Chicago Bears vs Denver Broncos |  | +6,650 | +7,135 | -6.7% | +9,810 | +9,518 | -31.9% | -29.8% | -27.1% |
| San Francisco 49ers vs New England Patriots |  | +3,805 | +4,109 | -7.2% | +5,665 | +5,479 | -32.3% | -30.0% | -21.9% |
| Detroit Lions vs Jacksonville Jaguars |  | +5,750 | +6,225 | -7.5% | +8,563 | +8,261 | -32.5% | -30.0% | — |
| Chicago Bears vs New England Patriots |  | +8,150 | +8,847 | -7.8% | +12,154 | +11,723 | -32.7% | -30.2% | -20.8% |
| Seattle Seahawks vs Kansas City Chiefs | held | +2,825 | +3,211 | -11.7% | +4,435 | +4,160 | -35.5% | -31.3% | +22.9% |
| Green Bay Packers vs Kansas City Chiefs | held | +8,900 | +10,124 | -12.0% | +13,904 | +13,033 | -35.7% | -31.5% | — |
| Minnesota Vikings vs Kansas City Chiefs |  | +3,725 | +4,317 | -13.4% | +5,949 | +5,528 | -36.8% | -32.0% | +26.2% |
| Detroit Lions vs Denver Broncos |  | +8,000 | +9,237 | -13.3% | +12,689 | +11,854 | -36.7% | -32.2% | — |
| Detroit Lions vs New England Patriots |  | +9,800 | +11,446 | -14.3% | +15,714 | +14,595 | -37.4% | -32.6% | — |
| Dallas Cowboys vs Kansas City Chiefs |  | +8,000 | +9,564 | -16.2% | +13,136 | +12,020 | -38.8% | -33.2% | +21.5% |
| San Francisco 49ers vs Kansas City Chiefs |  | +1,498 | +1,913 | -20.6% | +2,657 | +2,357 | -42.1% | -35.0% | +19.8% |
| Chicago Bears vs Kansas City Chiefs | held | +3,275 | +4,179 | -21.1% | +5,761 | +5,106 | -42.4% | -35.2% | +21.5% |

## Per-team Circa conference price vs no-vig references

| Conf | Team | Circa | BKR | Circa EV vs BKR fair | Circa EV vs blend | Pred. mkt gross |
|---|---|---:|---:|---:|---:|---:|
| AFC | Buffalo Bills | +300 | +262 | -5.5% | -10.3% | 22% |
| AFC | Kansas City Chiefs | +350 | +450 | -30.1% | -22.5% | 30% |
| AFC | Cincinnati Bengals | +870 | +800 | -7.9% | -11.4% | 10% |
| AFC | Jacksonville Jaguars | +550 | +530 | -11.8% | -13.4% | 13% |
| AFC | New England Patriots | +1,000 | +1,050 | -18.2% | -16.6% | 8% |
| AFC | Denver Broncos | +800 | +830 | -17.3% | -16.1% | 9% |
| NFC | San Francisco 49ers | +255 | +266 | -17.2% | -16.1% | 25% |
| NFC | Seattle Seahawks | +550 | +502 | -7.8% | -11.4% | 14% |
| NFC | Chicago Bears | +650 | +678 | -17.7% | -16.3% | 12% |
| NFC | Detroit Lions | +800 | +904 | -23.4% | -19.2% | — |
| NFC | Green Bay Packers | +1,900 | +1,759 | -8.1% | -11.5% | — |
| NFC | Dallas Cowboys | +1,700 | +1,657 | -12.5% | -13.7% | 5% |
| NFC | Minnesota Vikings | +750 | +703 | -9.6% | -12.3% | 11% |

Held status is from the October 22 local ledger and has not been reconciled with an account. Recompute from the repo root: `python3 reports/bets/2026-w08-circa-parlay-comparison.py .`
