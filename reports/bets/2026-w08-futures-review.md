# Week 8 futures portfolio review — October 28, 2026

Research only. The ledger is dated October 22 and was not reconciled against an account. BetOnline prices were captured October 27 at 2:56:55 PM Pacific; they are not verified current or executable. No positions were changed.

## Exposure

- 27 open ledger positions: 2 Super Bowl winners, 23 matchup bets, 1 win total, and 1 playoff bet.
- Cash stakes: $393.09; promotional stakes: $47.66; combined nominal stakes: $440.75. Previously tracked promotional winnings are not subtracted from stake.
- Super Bowl markets alone: $353.09 cash plus $47.66 promotional stakes = $400.75 nominal. The two $20 regular-season positions are excluded from the Super Bowl matrix because their settlement is separate.
- Open parlays: see "Open parlays as hedge equity" below (confirmed live Oct 28). The ledger leaves playoff cash reserve unspecified.
- Cash-only Super Bowl anchor cap room is Buffalo $140.91 and Green Bay $140.00; including the Green Bay $9.12 promotional stake leaves $130.88 under a $200 inclusive interpretation. Confirm the cap convention before making a proposal.

## Positions added October 29

BetOnline ticket 1009963278, accepted Oct 29, recorded in the ledger:

| Pairing | Stake | Price | To win | Funding |
|---|---:|---:|---:|---|
| Green Bay vs Jacksonville | $7.00 | +14,600 | $1,022.00 | Cash (bankroll) |
| Seattle vs Cincinnati | $13.00 | +7,700 | $1,001.00 | Cash (bankroll) |
| Seattle vs Buffalo | $19.09 | +3,400 | $649.06 | Promo: $10 cash reward + $9.09 promo winnings (both now $0) |

Super Bowl stakes are now $439.84 nominal: $373.09 cash and $66.75 promo. Cash stakes across the ledger, including the two $20 regular-season bets, total $413.09 against the $500 primary cap. The matrix below is still the Oct 22 snapshot. Changed outcomes (`playoff_hedge_planner.py`, current ledger):

| Super Bowl | Before (AFC wins / NFC wins) | Now |
|---|---|---|
| Seattle vs Buffalo | +$1,263 / +$618 | **+$1,892 / +$1,247** |
| Seattle vs Cincinnati | −$401 / −$401 | **+$574 / +$574** |
| Green Bay vs Jacksonville | −$401 / +$2,590 | **+$589 / +$3,580** |
| Every other outcome | as before | $39.09 lower (total-loss outcomes now −$439.84) |

Green Bay vs New England and Green Bay vs Houston are still uncovered (−$440 if Green Bay loses), so those Super Bowls still need a hedge.

## Super Bowl matchup matrix

Each row is mutually exclusive with every other row. Values are nominal net results for Super Bowl positions only: matching-ticket return plus the winning anchor ticket return, less $400.75 in all nominal Super Bowl stakes. Promotional cash is treated as stake-returning; verify its rules. Regular-season bets and contingent parlays are excluded. Matchup bets pay on the finalist pairing regardless of the Super Bowl winner (confirmed by Andy, Oct 28 7:51 PM PT).

| Finalists | Matchup profit if paired | NFC team wins: nominal net | AFC team wins: nominal net |
|---|---:|---:|---:|
| Green Bay Packers vs Buffalo Bills | $6150.00 | $8800.29 | $6454.70 |
| Seattle Seahawks vs Buffalo Bills | $993.72 | $617.97 | $1263.42 |
| Detroit Lions vs Buffalo Bills | $385.00 | $-10.75 | $634.70 |
| Philadelphia Eagles vs Buffalo Bills | $335.00 | $-60.75 | $584.70 |
| Green Bay Packers vs Baltimore Ravens | $2884.00 | $5494.29 | $2503.25 |
| Green Bay Packers vs Kansas City Chiefs | $4336.00 | $6953.29 | $3962.25 |
| Green Bay Packers vs Cincinnati Bengals | $1782.00 | $4382.29 | $1391.25 |
| Green Bay Packers vs Pittsburgh Steelers | $4667.00 | $7264.29 | $4273.25 |
| Green Bay Packers vs Denver Broncos | $1975.00 | $4570.29 | $1579.25 |
| Chicago Bears vs Kansas City Chiefs | $1100.00 | $719.25 | $719.25 |
| Chicago Bears vs Buffalo Bills | $1080.00 | $699.25 | $1344.70 |
| San Francisco 49ers vs Buffalo Bills | $847.88 | $485.67 | $1131.12 |
| Seattle Seahawks vs Kansas City Chiefs | $430.00 | $39.25 | $39.25 |
| Los Angeles Rams vs Kansas City Chiefs | $410.00 | $19.25 | $19.25 |
| Los Angeles Rams vs Buffalo Bills | $350.00 | $-40.75 | $604.70 |

If no listed matchup occurs, a Buffalo title gives $244.70, a Green Bay title gives $2590.29, and any other champion gives $-400.75.

## Prices and review candidates

- Buffalo Super Bowl: held cash tickets +1000 and +950 (ledger blended +992); BetOnline snapshot +750. DraftKings published +700 on October 27. Lower prices do not satisfy the entry-price condition for an add absent independent evidence that the thesis improved.
- Green Bay Super Bowl: held cash tickets +2500 and +6600, plus a +6600 promotional ticket. BetOnline snapshot +4500 versus the ledger cash blended +3867; DraftKings published +3200 on October 27. **Watchlist only:** fresh executable pricing and independent current thesis support are needed. A hypothetical $10 at +4500 adds $450 profit if Green Bay wins and adds $10 stake at risk; cash anchor cap room would fall from $140 to $130. This increases existing correlated Green Bay exposure.
- BetOnline October 27 matchup displays: Green Bay/Buffalo +9800; Green Bay/Kansas City +10400; San Francisco/Buffalo +1600; Seattle/Buffalo +3400. Existing entries vary by ticket. Matchups remain monitor-only absent reliable comparable-market prices and confirmed contract rules. Update Oct 28 evening: Circa AFC+NFC parlay vs current references is in `2026-w08-circa-parlay-comparison.md`. No ranked pairing is +EV against no-vig sportsbook references; Circa pays more than Bookmaker's synthetic price on 23/42 ranked pairings, including GB/BUF (+7,900 vs +6,630).
- Green Bay playoff Yes was held at -120; BetOnline displayed +120. Buffalo held over 10.5 wins at -135; the later board listed over 12.5 at -120, a different contract. These prices show movement, not independently established value.

## Playoff hedge reserve (added October 28 evening)

Andy's current focus is playoff hedging, not new Buffalo or Green Bay futures. Planner: `scripts/futures/playoff_hedge_planner.py` (local and read-only; `selftest` reproduces every value in the matrix above). Modes: `sb` (Super Bowl set: 0/50/100% hedge), `conf` (both conference games set: best floor across the four possible Super Bowls, with a cash cap), `reserve` (the table below).

**What the table says.** Probabilities are a blend of the Circa 10/28 7:18 PM and Bookmaker 10/28 9:21 AM conference prices, with the bookmaker margin removed and the two conferences treated as independent. Hedge stakes are what it takes to make both Super Bowl outcomes pay the same, before any conference-round hedge.

- **Most outcomes can't be hedged.** About 68% (probability-weighted) of possible Super Bowls lose all $400.75 whoever wins; there is no live ticket to protect. Hedging only matters in the other ~32%.
- **Buffalo in the Super Bowl:** about $280–$390 equalizes it against any NFC team. The gap is always the Buffalo title payout. That locks a profit against NFC teams you have a matchup with (SF about +$808, SEA +$941, CHI +$1,022, DET +$312, LAR +$282 at even money). Against NFC teams you don't have (MIN, DAL, ATL, CAR …) it locks about −$78, so a partial hedge or none may be better.
- **Green Bay in the Super Bowl:** about $1,020–$1,795 equalizes, depending on the line. GB–BUF locks about $7,500–$7,630 (you win both ways anyway). GB–KC locks about $5,460. GB against an AFC team you don't have locks about $1,095 at even money.

| Super Bowl | Prob | You net if AFC wins | if NFC wins | Hedge side | Stake @ +100 | @ -150 | @ +130 | Locked @ +100 |
|---|---:|---:|---:|---|---:|---:|---:|---:|
| SF vs BUF | 5.30% | $1,131.12 | $485.67 | SF | $322.72 | $387.27 | $280.63 | $808.39 |
| GB vs BUF | 0.99% | $6,454.70 | $8,800.29 | BUF | $1,172.80 | $1,407.35 | $1,019.82 | $7,627.50 |
| GB vs KC | 0.76% | $3,962.25 | $6,953.29 | KC | $1,495.52 | $1,794.62 | $1,300.45 | $5,457.77 |
| SEA vs BUF | 3.06% | $1,263.42 | $617.97 | SEA | $322.73 | $387.27 | $280.63 | $940.70 |
| GB vs JAX | 0.59% | -$400.75 | $2,590.29 | JAX | $1,495.52 | $1,794.62 | $1,300.45 | $1,094.77 |
| LAR vs BUF | 2.59% | $604.70 | -$40.75 | LAR | $322.73 | $387.27 | $280.63 | $281.98 |
| CHI vs BUF | 2.50% | $1,344.70 | $699.25 | CHI | $322.73 | $387.27 | $280.63 | $1,021.98 |
| MIN vs BUF | 2.32% | $244.70 | -$400.75 | MIN | $322.73 | $387.27 | $280.63 | -$78.02 |
| DET vs BUF | 2.01% | $634.70 | -$10.75 | DET | $322.73 | $387.27 | $280.63 | $311.98 |
| DAL vs BUF | 1.08% | $244.70 | -$400.75 | DAL | $322.73 | $387.27 | $280.63 | -$78.02 |
| ATL vs BUF | 0.59% | $244.70 | -$400.75 | ATL | $322.73 | $387.27 | $280.63 | -$78.02 |
| CAR vs BUF | 0.55% | $244.70 | -$400.75 | CAR | $322.73 | $387.27 | $280.63 | -$78.02 |
Full 256-pairing table: `python3 scripts/futures/playoff_hedge_planner.py reserve --min-prob 0`.

**Conference round.** Hedging the conference championship games needs cash on top of any later Super Bowl hedge. Illustrative example (placeholder lines BUF −150 / KC +130, GB +200 / SF −240, with Super Bowl lookahead lines): with no cap the planner wants $4,500 to raise the worst case to +$1,918. A $500 cap (all on KC) raises the worst case from −$401 to +$249 for about $17 of expected cost. A $1,000 cap gives +$460 for about $36; most of the floor comes from the first few hundred dollars. Peak cash in those capped runs, conference hedge plus a later Super Bowl hedge, was $1,803 at a $500 cap and $2,303 at $1,000.

**Reserve options for Andy to choose** (`playoff_cash_hedge_reserve_usd` is still null; not edited):

| Reserve | Covers |
|---:|---|
| ~$400 | A full Super Bowl hedge in every Buffalo scenario, at any likely line. |
| ~$1,800 | A full Super Bowl hedge in every scenario, including Green Bay with the hedge side a −150 favorite. |
| ~$2,300–$2,500 | A capped (~$500–$1,000) conference-round hedge followed by a full Super Bowl hedge in the Green Bay scenarios. |

Hedges buy certainty, not value: each one pays the book's margin, about 2–4% of the hedge stake at normal lines. Matchup tickets pay only after the Super Bowl, and open parlays are unverified, so the reserve must be separate cash. Re-run the planner with real lines once the bracket is set.

## Open parlays as hedge equity (added October 28 evening)

**Status change: Andy confirmed on Oct 28 (8:45 PM PT) that all six Bookmaker open parlays from March 2026 are live and actionable.** With Andy's OK, the ledger's `open_parlays` block was updated the same evening to `live_actionable` / `eligible_as_required_hedge_resource: true`, with $1,070.36 of equity and the pending rule checks listed. Filling any slot still needs his per-action approval.

Equity is what each ticket is worth now: the original risk times every completed leg's decimal odds. Filling one slot at decimal odds d returns equity × d if that leg wins, and $0 if it loses. Using a slot is therefore a hedge bet of the equity amount that needs no new cash.

| Ticket | Priority (Andy's rule) | Open slots | Risk | Equity now | Return if slots filled at -110 |
|---|---|---:|---:|---:|---:|
| 730888303 | crown: playoff hedges only | 2 | $30.00 | $312.64 | $1,139.46 |
| 730737412 | crown: playoff hedges only | 2 | $20.00 | $238.90 | $870.71 |
| 730846806 | save: one pre-identified playoff hedge | 1 | $37.50 | $237.06 | $452.57 |
| 731062665 | flexible: 1 mid-season, 1 playoff | 2 | $30.00 | $104.32 | $380.21 |
| 731063264 | flexible: 1 mid-season, 1 playoff | 2 | $20.00 | $100.42 | $365.99 |
| 731536472 | flexible: any time | 2 | $25.00 | $77.01 | $280.68 |
| **Total** | | **11** | **$162.50** | **$1,070.36** | **$3,489.62** |

**Why this matters more than new small bets:** a slot is filled only after the bracket shows which branch is happening, so the same equity can cover whichever Super Bowl actually occurs. Small matchup bets ("seeds") have to be bought now for each branch separately.

**Bookmaker open-spot rule (Andy, Oct 28 9:40 PM PT):** a two-spot ticket can be filled with one side and one total, not two sides or two totals. Each two-spot ticket therefore carries at most one hedge side, and a single ticket cannot bet "both my teams lose" across the AFC and NFC games.

**Plan by ticket:**

| Ticket | Equity now | Spots | Plan |
|---|---:|---:|---|
| 730846806 (save) | $237.06 | 1 | One side: the Super Bowl hedge, or one conference game. |
| 730888303 (crown) | $312.64 | 2 | Total in the Wild Card or Divisional round; side on conference weekend. |
| 730737412 (crown) | $238.90 | 2 | Same as 730888303. |
| 731062665, 731063264, 731536472 (flexible) | $281.75 | 2 each | Total in the regular season or early playoffs; side later. |

**What filling the total early costs.** Each total is roughly a coin flip at −110. A win multiplies equity by 1.91 and leaves one open side spot (730888303 would carry about $597). A loss ends the ticket. Across the five two-spot tickets ($833.29 now), expect 2–3 to survive, about $795 of expected side equity (≈4.5% margin drag), ranging from $0 to about $1,590. Settling the totals early shows the actual hedge capacity before conference weekend, instead of stacking a coin flip on the hedge itself. Pick totals in different games, so one result can't end several tickets. A total on a Buffalo or Green Bay game is fine; totals don't depend on the winner.

Illustrative uses (placeholder lines, not quotes):
- **Save ticket on the Super Bowl:** Green Bay vs Jacksonville, Jaguars +110 → if Jacksonville wins, −$401 becomes +$97. Paired with $1,187 cash, both outcomes lock +$1,403 (cash alone needs $1,424 to lock +$1,166). Buffalo vs Minnesota, Vikings +130 → if Minnesota wins, +$144, so no cash hedge is needed.
- **Conference weekend, one side per ticket, one ticket per game:** for example, a surviving 730888303 (~$597) on Kansas City +130 returns about $1,373 if Buffalo loses the AFC game, and a surviving 730737412 (~$456) on San Francisco −240 returns about $646 if Green Bay loses the NFC game. Each hedges its own game.
- **Flexible tickets:** cover the ~$280–$320 Buffalo Super Bowl hedges.

**Effect on earlier recommendations.** The Buffalo-side seed bets (MIN/DAL/ATL/CAR–BUF) are no longer needed: parlay spots cover that branch. The Green Bay seeds (GB–JAX/NE/HOU) are still recommended because no single parlay spot can cover them for certain. The cash reserve for a full Green Bay Super Bowl hedge falls to about $1,190–$1,560 when the save ticket is used.

**Bookmaker rules still to verify:**
1. Whether a side and a total from the same game are allowed. If yes, a two-spot ticket could go entirely on the Super Bowl (side plus game total).
2. Whether an open spot may be left unfilled.
3. Each ticket's exact expiry (placed Mar 20–Apr 4, 2026).
4. Any maximum payout.
5. Whether futures can fill a spot.

## Seeding and hedge pricing (added October 29, early morning)

Andy's point: seeding sets which side of each hedge is the favorite, and that sets how much cash a hedge needs (stake = gap ÷ hedge-side decimal odds). Prediction markets as of 3:00 PM Oct 28 (gross display prices, not quotes): Buffalo 74% to win its division, 93% to make the playoffs, about 12.9 projected wins, so likely a top-two seed. Green Bay 9% for the division, 44% for the playoffs, about 10.0 projected wins, so a wild card at best.

- **Buffalo is likely favored every round.** Its opponents are underdogs, so hedges on them are cheap in cash. On the spread, there is a **middle**: if Buffalo wins by less than the spread, Buffalo advances *and* the underdog-plus-points hedge cashes. This matters most in the AFC rounds, where a Buffalo loss ends the Buffalo branch.
- **Green Bay is likely the road underdog every round.** Hedges must go on the favorite, which takes a lot of cash and has no middle: betting the favorite minus points loses whenever Green Bay wins. Open spots stretch less on a favorite side (about ×1.3–1.5). The NFC Championship is the portfolio's biggest single swing. The three small Green Bay matchup bets (GB–JAX/NE/HOU) matter more for this reason: they make every Green Bay Super Bowl non-losing without a hedge.
- **The vig cost is similar either way.** Seeding changes how much cash a hedge needs and how far an open spot stretches, not the expected cost.

**Seeding-adjusted Super Bowl hedge stakes.** The hedge side is priced at +175 when the hedge is on Buffalo's opponent (an underdog), −250 when it is on Green Bay's opponent (a favorite), and +100 otherwise. These are assumptions, not quotes. `python3 scripts/futures/playoff_hedge_planner.py reserve`:

| Super Bowl | Prob | You net if AFC wins | if NFC wins | Hedge side | Stake @ +100 | @ -150 | @ +130 | Seeded price | Stake @ seeded | Locked @ +100 |
|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| SF vs BUF | 5.30% | $1,131.12 | $485.67 | SF | $322.72 | $387.27 | $280.63 | +175 | $234.71 | $808.39 |
| GB vs BUF | 0.99% | $6,454.70 | $8,800.29 | BUF | $1,172.80 | $1,407.35 | $1,019.82 | -250 | $1,675.42 | $7,627.50 |
| GB vs KC | 0.76% | $3,962.25 | $6,953.29 | KC | $1,495.52 | $1,794.62 | $1,300.45 | -250 | $2,136.46 | $5,457.77 |
| SEA vs BUF | 3.06% | $1,263.42 | $617.97 | SEA | $322.73 | $387.27 | $280.63 | +175 | $234.71 | $940.70 |
| GB vs JAX | 0.59% | -$400.75 | $2,590.29 | JAX | $1,495.52 | $1,794.62 | $1,300.45 | -250 | $2,136.46 | $1,094.77 |
| LAR vs BUF | 2.59% | $604.70 | -$40.75 | LAR | $322.73 | $387.27 | $280.63 | +175 | $234.71 | $281.98 |
| CHI vs BUF | 2.50% | $1,344.70 | $699.25 | CHI | $322.73 | $387.27 | $280.63 | +175 | $234.71 | $1,021.98 |
| MIN vs BUF | 2.32% | $244.70 | -$400.75 | MIN | $322.73 | $387.27 | $280.63 | +175 | $234.71 | -$78.02 |
| DET vs BUF | 2.01% | $634.70 | -$10.75 | DET | $322.73 | $387.27 | $280.63 | +175 | $234.71 | $311.98 |
| DAL vs BUF | 1.08% | $244.70 | -$400.75 | DAL | $322.73 | $387.27 | $280.63 | +175 | $234.71 | -$78.02 |
| ATL vs BUF | 0.59% | $244.70 | -$400.75 | ATL | $322.73 | $387.27 | $280.63 | +175 | $234.71 | -$78.02 |
| CAR vs BUF | 0.55% | $244.70 | -$400.75 | CAR | $322.73 | $387.27 | $280.63 | +175 | $234.71 | -$78.02 |

Buffalo Super Bowl hedges fall to about $235. Green Bay Super Bowl hedges rise to about $1,675–$2,136; GB–BUF and GB–KC are optional, since both outcomes already pay.

**One-game examples.** `middle` mode uses illustrative lines, a normal margin model (SD 13.5; it ignores the key numbers 3 and 7, so treat middle percentages as rough), and parlay rows that count the spot's equity like a stake.

*AFC Championship, Buffalo −7 (−300) vs Jacksonville +240.* Branch values are the expected net if each team reaches the Super Bowl, with a 60% Super Bowl win probability. `middle --protect BUF:-300 --opp JAX:+240 --line -7 --adv auto:BUF --out auto:JAX --sb-win-prob 0.6 --parlay 596.86`

_auto:BUF: expected net if BUF reaches the Super Bowl, over the no-vig field, SB win prob 0.6: $863.82._

_auto:JAX: expected net if JAX reaches the Super Bowl, over the no-vig field, SB win prob 0.6: -$347.83._


Lines: BUF -300, JAX +240; spread price -110. No-vig BUF win 71.8%. Margin model: normal, mean +7.8, SD 13.5 (approximation; ignores key numbers 3 and 7).

Portfolio value if BUF advances: $863.82; if eliminated: -$347.83. Parlay rows treat the spot's equity like a stake (it is worth that much unused), so they compare directly with cash rows.

| Plan | Cash staked | advance, dog does not cover (52.4%) | MIDDLE: advance and dog covers (19.5%) | eliminated (dog wins) (28.2%) | Expected |
|---|---:|---:|---:|---:|---:|
| No hedge | $0.00 | $863.82 | $863.82 | -$347.83 | $522.51 |
| Moneyline only (equalize) | $356.37 | $507.45 | $507.45 | $507.45 | $507.45 |
| Spread only (equalize advance vs eliminated-and-covered) | $634.68 | $229.15 | $1,440.80 | $229.15 | $465.01 |
| Mix: half the protection from each | $495.52 | $368.30 | $974.13 | $368.30 | $486.23 |
| Parlay spot: $596.86 equity on JAX moneyline (no new cash) | $0.00 | $266.96 | $266.96 | $1,084.63 | $497.29 |
| Parlay spot: $596.86 equity on JAX +7 (no new cash) | $0.00 | $266.96 | $1,406.42 | $194.77 | $468.44 |

*Super Bowl, Buffalo −6.5 (−270) vs Minnesota +220 (no matchup ticket).*

Lines: BUF -270, MIN +220; spread price -110. No-vig BUF win 70.0%. Margin model: normal, mean +7.1, SD 13.5 (approximation; ignores key numbers 3 and 7).

Portfolio value if BUF advances: $244.70; if eliminated: -$400.75. Parlay rows treat the spot's equity like a stake (it is worth that much unused), so they compare directly with cash rows.

| Plan | Cash staked | advance, dog does not cover (51.7%) | MIDDLE: advance and dog covers (18.3%) | eliminated (dog wins) (30.0%) | Expected |
|---|---:|---:|---:|---:|---:|
| No hedge | $0.00 | $244.70 | $244.70 | -$400.75 | $51.17 |
| Moneyline only (equalize) | $201.70 | $43.00 | $43.00 | $43.00 | $43.00 |
| Spread only (equalize advance vs eliminated-and-covered) | $338.09 | -$93.39 | $552.06 | -$93.39 | $24.63 |
| Mix: half the protection from each | $269.90 | -$25.20 | $297.53 | -$25.20 | $33.82 |
| Parlay spot: $237.06 equity on MIN moneyline (no new cash) | $0.00 | $7.64 | $7.64 | $120.78 | $41.56 |
| Parlay spot: $237.06 equity on MIN +6.5 (no new cash) | $0.00 | $7.64 | $460.21 | -$185.24 | $32.56 |

*NFC Championship, Green Bay +5.5 (+200) at San Francisco −240.* Green Bay's Super Bowl win probability is 40%. `middle --protect GB:+200 --opp SF:-240 --line 5.5 --adv auto:GB --out auto:SF --sb-win-prob 0.4 --parlay 596.86`

_auto:GB: expected net if GB reaches the Super Bowl, over the no-vig field, SB win prob 0.4: $3,803.92._

_auto:SF: expected net if SF reaches the Super Bowl, over the no-vig field, SB win prob 0.4: -$115.03._


Lines: GB +200, SF -240; spread price -110. No-vig GB win 32.1%. Margin model: normal, mean -6.3, SD 13.5 (approximation; ignores key numbers 3 and 7).

Portfolio value if GB advances: $3,803.92; if eliminated: -$115.03. Parlay rows treat the spot's equity like a stake (it is worth that much unused), so they compare directly with cash rows.

| Plan | Cash staked | advance (32.1%) | eliminated, favorite does not cover (15.6%) | eliminated, favorite covers (52.3%) | Expected |
|---|---:|---:|---:|---:|---:|
| No hedge | $0.00 | $3,803.92 | -$115.03 | -$115.03 | $1,141.99 |
| Moneyline only (equalize) | $2,766.32 | $1,037.60 | $1,037.60 | $1,037.60 | $1,037.60 |
| Spread only (equalize advance vs eliminated-and-covered) | $2,052.78 | $1,751.14 | -$2,167.81 | $1,751.14 | $1,139.60 |
| Mix: half the protection from each | $2,409.55 | $1,394.37 | -$565.11 | $1,394.37 | $1,088.60 |
| Parlay spot: $596.86 equity on SF moneyline (no new cash) | $0.00 | $3,207.06 | $133.66 | $133.66 | $1,119.47 |
| Parlay spot: $596.86 equity on SF -5.5 (no new cash) | $0.00 | $3,207.06 | -$711.89 | $427.57 | $1,141.30 |

**Takeaways:**
1. **Buffalo games: hedge with the underdog, and use the spread when it's ~7.** In the AFC Championship example, the spread hedge turns a ~19% middle into +$1,441 (cash) or +$1,406 (a surviving crown spot). The moneyline hedge flattens every outcome at a lower expected cost. A mix sits between them.
2. **Green Bay's NFC Championship: never hedge on the favorite's spread.** If Green Bay loses by less than the spread, you lose both the Green Bay branch and the hedge (−$2,168 in the cash example). Use the moneyline, or an open spot on the favorite's moneyline, sized to how much of the ~$3,900 swing Andy wants to protect. A full cash equalization needs about $2,770.
3. **Where open spots go:** underdog sides on Buffalo's opponents get the most from each spot (×2.5–3.4); favorite sides against Green Bay get the least. The save ticket and surviving crown spots are best used against Buffalo's AFC opponents. Green Bay protection should come mainly from the small matchup bets and a deliberate, partial NFC Championship decision.

## Hedge planning

No opposing price or dedicated cash reserve was verified. For a single return-bearing future, full equalization is gross winning return divided by opposing decimal odds; 50% is half that stake. Portfolio hedges require the whole correlated scenario matrix, settlement terms, and reserve. Example only: against a hypothetical even-money opponent, Buffalo anchor gross return $645.45 implies $322.73 for full equalization or $161.36 for 50%, before other tickets; this is not a quote or recommendation.

Sources: `data/futures-imports/andy-portfolio-ledger-2026.json`; `data/futures-imports/betonline-2026-10-27.json`; https://dknetwork.draftkings.com/2026/09/08/nfl-super-bowl-odds/.
