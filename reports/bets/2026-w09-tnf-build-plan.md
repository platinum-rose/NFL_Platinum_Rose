# TNF JAX @ BAL build plan (Week 9, Thu 11/05 5:15 PM PT)

Prepared Wed 11/04 ~7:45 PM PT so Thursday is "fill in prices, check inactives, paste slips". **Proposals only; nothing placed.**
Prices: none posted Wed night (BEO, DK Predictions, BKR). Lines to fill from Thursday captures.

## Market (Wed 6:50 PM PT)
- BEO: JAX -10.5 (+100), o/u 39.5; team totals JAX 26.5 / BAL 16.5 (u -150). DK Predictions: JAX -9.5 (53%), o/u 39.5, JAX win 82%.
- DK Predictions anytime TD: Tuten 48%, Rodriguez 47%, Henry 42%, P. Washington 38%, Strange 28%, Meyers 23%, Flowers 20%.

## Evidence (Weeks 1-8, `player-games.csv`)
| Leg idea | Game log | Read |
|---|---|---|
| Roquan Smith T+A | 11/8/9/6/8/5/8/11 (8+ in 6 of 8) | strongest defensive leg; lowest rung 7.5 |
| Foyesade Oluokun T+A | 4/7/6/7/10/8/9 (7+ in 5 of 7; rising) | lowest rung 6.5 |
| Fagnano pass yds | W8: 10/21, 91 yds, 1 INT, 3 sacks taken | Under; take the lowest-risk alt line within -350 |
| Fagnano 1+ INT | 1 INT in his only start; JAX +7 TO margin | BEO / DK only (no INT at BKR) |
| JAX run game | 183 rush yds W8; 95-137 the other weeks | Tuten 66-104 when healthy; Rodriguez 6 car/g as RB2 |
| Rodriguez (if Tuten out) | 11 car / 55 yds in W6 (Tuten 12 car) | lead-back volume only when Tuten is inactive |
| BAL sacks taken | 2/3/0/2/4/3/4/4 (4 in 3 of last 4) | JAX team sacks 2.5+ if offered |

## Constraints that apply
- **Exposure already held (FDP N1/N2a/N2b):** Henry ATD x2, Strange 2+ rec x2, Lawrence yds + 1+ TD, JAX ML, Tuten ATD, Rodriguez ATD + 30+ rush, Henry 40+ rush.
  **Cash tickets add no Henry, Strange or Lawrence.** Promo tickets may reuse anything.
- **C1** max 4 legs per cash ticket. **C2** one read on at most 2-3 cash tickets (Roquan, Oluokun, Fagnano Under each appear on 2 below).
- **C3** rushing lane first; any receiving leg at its lowest rung (none planned on cash).
- **C4 (JAX@BAL registered):** Fagnano + Roquan is a BAL same-team stack, and BAL TT is a total, so **no cash ticket goes in before the ~3:45 PM PT inactives.**
- **C5** no master RR. Leg floor -350. No full-game spreads/totals inside prop parlays. INT props not at BKR (BKR = single-game parlays only).

## Cash tickets (place after inactives)
**C1 "BAL can't move it" (3 legs; BEO or BKR SGP):** Fagnano Under pass yds (alt, within -350) / Roquan Smith 8+ T+A / Oluokun 7+ T+A.
Swap-in: Fagnano 1+ INT for the pass-yds Under at BEO if the Under is shorter than -350.

**C2, branch on Tuten (3 legs):**
- *Tuten active:* Tuten rush yds over (lowest rung offered, around 55+) / Oluokun 7+ T+A / Fagnano Under pass yds.
- *Tuten inactive:* Rodriguez rush yds over (lowest rung, around 45+) / Roquan Smith 8+ T+A / JAX team sacks 2.5+ (or Fagnano 1+ INT at BEO).

That's 2 cash tickets. Suggested stakes are Andy's call (template: $10 / $5). A third cash ticket would push a read past C2; skip it.

## Promo / bonus tickets (exempt from C1-C4; reuse allowed)
- **DK Predictions promo (if a TNF boost is offered):** active lead back ATD + Henry ATD + JAX win + Roquan 8+ (+ Oluokun 7+) as a 4-5 pick.
- **FDP bonus (if one lands):** same shape; FDP didn't post defensive props last week, so use ATD / rush yds / JAX win there.

## Thursday checklist
1. Morning cadence: `node scripts/toolbox.mjs --cadence thursday` (injuries, SuperContest lines, TNF props intel).
2. Captures: `runbkrprops.cmd` (open the BKR Chrome on 9222 first if it timed out), `rundkprops.cmd`, `runbolprops.cmd`.
3. Claude fills prices, checks the -350 floor, writes final C1/C2 + promo to the card, and logs every proposal with
   `ai_record.py add --week 9` (status proposed).
4. ~3:45 PM PT inactives (Tuten; Fagnano active; BAL/JAX defenders) -> pick the C2 branch -> roster gate on every named player.
5. Andy pastes each slip before placing.
