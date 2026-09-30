# BetOnline.ag NFL Conference Outrights — captured 2026-09-29 ~21:50 PT

Source: https://www.betonline.ag/sportsbook/futures-and-props/nfl-futures/conference-futures (logged in, Andy's own Chrome session).
Captured with a console snippet reading the rendered DOM (raw: `docs/futures-odds-20260929/BEO_Conference_20260929.txt`).
Fair % = vig removed proportionally within each conference. BetUS column from `docs/futures-odds-20260929/BetUS_Futures_20260929.txt` (same night; BetUS 'Ev' = +100).
**Best price** = the book paying more on a winning bet; 'gain' is the extra return on a winning bet (decimal return), not edge.

**Supersedes** the conference tables in `BetOnline_Futures_20260829.md` (site timestamps Sep 09) for current pricing — those were ~3 weeks stale (e.g. Chargers AFC 9.8% then, 1.8% now).

## NFC Winner 2026/27
BetOnline overround 107.8% · BetUS overround 115.0%

| Team | BetOnline | BOL fair % | BetUS | BetUS fair % | Best price | Gain | BetUS price vs BOL fair (EV) |
|---|---|---|---|---|---|---|---|
| Los Angeles Rams | +400 | 18.5% | +350 | 19.3% | **BetOnline** | +11% | -16.5% |
| San Francisco 49ers | +425 | 17.7% | +400 | 17.4% | **BetOnline** | +5% | -11.7% |
| Seattle Seahawks | +650 | 12.4% | +550 | 13.4% | **BetOnline** | +15% | -19.6% |
| Philadelphia Eagles | +950 | 8.8% | +900 | 8.7% | **BetOnline** | +5% | -11.7% |
| Minnesota Vikings | +1000 | 8.4% | +1100 | 7.2% | **BetUS** | +9% | +1.2% |
| Detroit Lions | +1100 | 7.7% | +900 | 8.7% | **BetOnline** | +20% | -22.7% |
| Chicago Bears | +1200 | 7.1% | +1100 | 7.2% | **BetOnline** | +8% | -14.4% |
| Dallas Cowboys | +2000 | 4.4% | +1500 | 5.4% | **BetOnline** | +31% | -29.3% |
| New Orleans Saints | +2800 | 3.2% | +3300 | 2.6% | **BetUS** | +17% | +8.7% |
| Green Bay Packers | +3500 | 2.6% | +3000 | 2.8% | **BetOnline** | +16% | -20.1% |
| Washington Commanders | +4000 | 2.3% | +6000 | 1.4% | **BetUS** | +49% | +38.0% |
| Carolina Panthers | +5000 | 1.8% | +6000 | 1.4% | **BetUS** | +20% | +10.9% |
| Tampa Bay Buccaneers | +6000 | 1.5% | +6500 | 1.3% | **BetUS** | +8% | +0.3% |
| New York Giants | +6000 | 1.5% | +7000 | 1.2% | **BetUS** | +16% | +7.9% |
| Atlanta Falcons | +6000 | 1.5% | +6000 | 1.4% | same | — | -7.3% |
| Arizona Cardinals | +20000 | 0.5% | +20000 | 0.4% | same | — | -7.3% |

## AFC Winner 2026/27
BetOnline overround 107.8% · BetUS overround 115.1%

| Team | BetOnline | BOL fair % | BetUS | BetUS fair % | Best price | Gain | BetUS price vs BOL fair (EV) |
|---|---|---|---|---|---|---|---|
| Buffalo Bills | +350 | 20.6% | +325 | 20.4% | **BetOnline** | +6% | -12.4% |
| Baltimore Ravens | +475 | 16.1% | +425 | 16.6% | **BetOnline** | +10% | -15.3% |
| Kansas City Chiefs | +550 | 14.3% | +450 | 15.8% | **BetOnline** | +18% | -21.5% |
| Cincinnati Bengals | +800 | 10.3% | +800 | 9.7% | same | — | -7.2% |
| Jacksonville Jaguars | +900 | 9.3% | +900 | 8.7% | same | — | -7.2% |
| Denver Broncos | +1000 | 8.4% | +1000 | 7.9% | same | — | -7.2% |
| New England Patriots | +1600 | 5.5% | +1400 | 5.8% | **BetOnline** | +13% | -18.1% |
| Houston Texans | +2200 | 4.0% | +2000 | 4.1% | **BetOnline** | +10% | -15.3% |
| Indianapolis Colts | +3300 | 2.7% | +4000 | 2.1% | **BetUS** | +21% | +11.9% |
| Las Vegas Raiders | +3300 | 2.7% | +3500 | 2.4% | **BetUS** | +6% | -1.7% |
| Pittsburgh Steelers | +4000 | 2.3% | +3500 | 2.4% | **BetOnline** | +14% | -18.5% |
| Los Angeles Chargers | +5000 | 1.8% | +4000 | 2.1% | **BetOnline** | +24% | -25.4% |
| New York Jets | +12500 | 0.7% | +10000 | 0.9% | **BetOnline** | +25% | -25.6% |
| Cleveland Browns | +15000 | 0.6% | +15000 | 0.6% | same | — | -7.2% |
| Tennessee Titans | +25000 | 0.4% | +25000 | 0.3% | same | — | -7.2% |
| Miami Dolphins | +50000 | 0.2% | +50000 | 0.2% | same | — | -7.2% |

## Notes
- 'EV' column = expected return per $1 at the BetUS price if BetOnline's no-vig probability were the true probability. It is a market-consistency check, not a model edge; large positives (e.g. Commanders) may mean BetUS is stale or disagrees.
- Exact-matchup market (BetOnline, same night) = product of these two conference outrights within rounding (median ratio 0.99 across 67 matchups); ~17% overround vs ~7.8% per conference. `+999999` is BetOnline's max posted price, a real price ≈ 0.001%.
- Matchup capture: `docs/futures-odds-20260929/BEO_SB_Exact_Matchups_20260929.txt` and `BEO_SB_Exact_Matchups_fair_20260929.csv`.

## DraftKings Predictions comparison (added 2026-09-29 ~22:00 PT)
Source: `docs/futures-odds-20260929/DK_Predictions_Conf_20260929.txt` (pasted page text, whole-percent prices; bid/ask and fees not shown). DK → American = price as a probability converted to fair-payout odds; **no fee/vig adjustment**. Whole-percent rounding badly distorts longshots (a 3¢ floor vs a true ~0.2%). DK 'EV' = BOL no-vig fair ÷ DK price − 1.

### NFC — DK prices sum to 126%

| Team | DK price | DK as American | BetOnline | BetUS | Best of 3 | DK EV vs BOL fair |
|---|---|---|---|---|---|---|
| Los Angeles Rams | 19% | +426 | +400 | +350 | **DraftKings** +426 | -2.4% |
| San Francisco 49ers | 19% | +426 | +425 | +400 | **DraftKings** +426 | -7.0% |
| Seattle Seahawks | 15% | +567 | +650 | +550 | **BetOnline** +650 | -17.6% |
| Philadelphia Eagles | 10% | +900 | +950 | +900 | **BetOnline** +950 | -11.7% |
| Minnesota Vikings | 10% | +900 | +1000 | +1100 | **BetUS** +1100 | -15.7% |
| Detroit Lions | 9% | +1011 | +1100 | +900 | **BetOnline** +1100 | -14.1% |
| Chicago Bears | 9% | +1011 | +1200 | +1100 | **BetOnline** +1200 | -20.7% |
| Dallas Cowboys | 6% | +1567 | +2000 | +1500 | **BetOnline** +2000 | -26.4% |
| New Orleans Saints | 4% | +2400 | +2800 | +3300 | **BetUS** +3300 | -20.0% |
| Green Bay Packers | 4% | +2400 | +3500 | +3000 | **BetOnline** +3500 | -35.6% |
| Washington Commanders | 3% | +3233 | +4000 | +6000 | **BetUS** +6000 | -24.6% |
| Carolina Panthers | 4% | +2400 | +5000 | +6000 | **BetUS** +6000 | -54.5% |
| Tampa Bay Buccaneers | 3% | +3233 | +6000 | +6500 | **BetUS** +6500 | -49.3% |
| New York Giants | 4% | +2400 | +6000 | +7000 | **BetUS** +7000 | -62.0% |
| Atlanta Falcons | 4% | +2400 | +6000 | +6000 | **BetOnline** +6000 | -62.0% |
| Arizona Cardinals | 3% | +3233 | +20000 | +20000 | **BetOnline** +20000 | -84.6% |

### AFC — DK prices sum to 130%

| Team | DK price | DK as American | BetOnline | BetUS | Best of 3 | DK EV vs BOL fair |
|---|---|---|---|---|---|---|
| Buffalo Bills | 25% | +300 | +350 | +325 | **BetOnline** +350 | -17.5% |
| Baltimore Ravens | 17% | +488 | +475 | +425 | **DraftKings** +488 | -5.1% |
| Kansas City Chiefs | 16% | +525 | +550 | +450 | **BetOnline** +550 | -10.8% |
| Cincinnati Bengals | 11% | +809 | +800 | +800 | **DraftKings** +809 | -6.3% |
| Jacksonville Jaguars | 11% | +809 | +900 | +900 | **BetOnline** +900 | -15.6% |
| Denver Broncos | 9% | +1011 | +1000 | +1000 | **DraftKings** +1011 | -6.3% |
| New England Patriots | 6% | +1567 | +1600 | +1400 | **BetOnline** +1600 | -9.0% |
| Houston Texans | 6% | +1567 | +2200 | +2000 | **BetOnline** +2200 | -32.8% |
| Indianapolis Colts | 4% | +2400 | +3300 | +4000 | **BetUS** +4000 | -31.8% |
| Las Vegas Raiders | 4% | +2400 | +3300 | +3500 | **BetUS** +3500 | -31.8% |
| Pittsburgh Steelers | 4% | +2400 | +4000 | +3500 | **BetOnline** +4000 | -43.4% |
| Los Angeles Chargers | 4% | +2400 | +5000 | +4000 | **BetOnline** +5000 | -54.5% |
| New York Jets | 3% | +3233 | +12500 | +10000 | **BetOnline** +12500 | -75.5% |
| Cleveland Browns | 4% | +2400 | +15000 | +15000 | **BetOnline** +15000 | -84.6% |
| Tennessee Titans | 3% | +3233 | +25000 | +25000 | **BetOnline** +25000 | -87.7% |
| Miami Dolphins | 3% | +3233 | +50000 | +50000 | **BetOnline** +50000 | -93.8% |
