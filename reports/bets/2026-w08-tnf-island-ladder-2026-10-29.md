# Week 8 TNF CAR @ GB — Island ladder proposals (October 29, 2026, about 3:35 PM PT)

**HOLD. Proposals only.** **Rule (Andy, 3:34 PM PT): no full-game spreads or totals in these stacks.** Nothing has been placed or logged. Template: `docs/NFL_WEEKLY_CARD_PROCESS.md` slot 9. Tier 1 is $10 at +600–1000, Tier 2 is $5 at +1800–3000, and Tier 3 is $5 at +6500–20000. Legs are diversified and no leg is shared across stacks; overlaps on the same player in a different market are flagged SOFT.

**Prices** are individual-leg observations, not SGP quotes:
- BEO: Oct 29, 10:10 AM PT.
- BKR: Oct 28, 5:26 PM PT (about 22 h old).
- DKP (DraftKings Predictions): Oct 28, 8:20 PM PT. These are pre-fee contract prices, and only game lines and TD markets were captured.

The combined odds below are simple products of the leg prices. Real SGP prices will be lower when the legs are positively correlated. BKR SGPs take no INT legs, and no defensive player props (tackles, defender sacks) were captured at any book. DEF legs are therefore BEO-only: QB INTs and team or game sacks.

Gates before any ticket:
1. Inactives (about 3:45 PM PT), especially Golden (Q) and GB/CAR OL.
2. A live SGP quote for each stack.
3. DK Predictions combo availability and the profit-boost terms.
4. Andy's slip check.

## Leg prices (best in bold)

| Game | Leg | BEO | BKR | DKP |
|---|---|---|---|---|
| CAR@GB | Josh Jacobs ATD | −145 | −154 | **−127** |
| CAR@GB | Chuba Hubbard ATD | −125 | −115 | **−108** |
| CAR@GB | Christian Watson ATD | +125 | +120 | **+144** |
| CAR@GB | Tucker Kraft ATD | +170 | **+170** | +194* |
| CAR@GB | Tetairoa McMillan ATD | +175 | **+180** | +203* |
| CAR@GB | Jalen Coker ATD | **+180** | +190† | +213* |
| CAR@GB | Christian Watson o4.5 rec | −130 | **−116** | — |
| CAR@GB | Tucker Kraft o4.5 rec | **−105** | −106 | — |
| CAR@GB | John Metchie III o1.5 rec | −135 | **−126** | — |
| CAR@GB | Chuba Hubbard o2.5 rec | +100 | **+116** | — |
| CAR@GB | Josh Jacobs o15.5 carries | −105 | **−104** | — |
| CAR@GB | Josh Jacobs o76.5 rush+rec | **−125** | n/c | — |
| CAR@GB | Bryce Young o22.5 completions | −120 | **−108** | — |
| CAR@GB | Bryce Young o1.5 pass TD | −115 | **+103** | — |
| CAR@GB | Jordan Love 3+ pass TD | — | **+209** | — |
| CAR@GB | Jordan Love o5.5 rush yds | **−105** | n/c | — |
| CAR@GB | Bryce Young o0.5 INT | **−130** | no INT | — |
| CAR@GB | Jordan Love o0.5 INT | **−125** | no INT | — |
| CAR@GB | Darren Waller o18.5 rec yds | **−115** | u20.5 −107 | — |
| CAR@GB | Jalen Coker 6+ rec | o4.5 −140 | **+119** | — |
| CAR@GB | GB O2.5 team sacks | **−175** | — | — |
| CAR@GB | Bryce Young u10.5 rush yds | **−125** | n/c | — |

\* DKP pre-fee; executable price after fees is lower. † BKR Coker ATD +190 on the Wed shop; this proposal plays it at BEO with S4. "n/c" means not captured.

## The five stacks

| # | Tier | Book | Legs | Product | Script |
|---|---|---|---|---|---|
| S1 | T1 ($10) | BEO | Jacobs o76.5 rush+rec −125; **Young o0.5 INT −130**; Kraft o4.5 rec −105; Young u10.5 rush yds −125 | +1019 (SGP likely about +700–950) | GB controls on the ground and pressures Young |
| S2 | T1 ($10) | **DK, use the 20% boost** | Jacobs ATD −127; Watson ATD +144; Hubbard ATD −108 | +740, **+888 with boost** (pre-fee) | Both backs score plus GB's deep threat |
| S3 | T2 ($5) | BKR | Young o22.5 cmp −108; Metchie o1.5 rec −126; Hubbard o2.5 rec +116; Watson o4.5 rec −116; Jacobs o15.5 carries −104 | +2625 (same legs at BEO about +2100) | CAR throws underneath from behind; GB feeds Jacobs |
| S4 | T2 ($5) | BEO | **Love o0.5 INT −125**; **GB O2.5 team sacks −175**; Waller o18.5 rec yds −115; Coker ATD +180; Love o5.5 rush −105 | +2791 | Sloppy, pressured game with a Carolina TD |
| S5 | T3 ($5) | BKR | Love 3+ pass TD +209; Young o1.5 pass TD +103; McMillan ATD +180; Kraft ATD +170; Coker 6+ rec +119 | +10285 | Shootout moonshot; deliberately the opposite script to S1 |

**Coverage:**
- QB: S1 and S4 (INTs), S3 (Young completions), S4 (Love rushing), S5 (both QBs' passing TDs).
- RB: S1, S2, S3.
- WR/TE: S1 (Kraft), S3, S4, S5.
- DEF: S1 and S4 (INTs, team sacks).
- TD: S2, S4, S5.

**SOFT overlaps (same player, different market):**
- Jacobs: S1, S2, S3.
- Watson: S2, S3.
- Hubbard: S2, S3.
- Kraft: S1, S5.
- Coker: S4, S5.
- Young: S1, S3, S5.
- Love: S4, S5.

**Hard constraints:** only S4 has a leg shorter than −150 (team sacks at −175). No stack has more than two legs shorter than −200, and every leg is inside the −350 barrier. QB INT legs carry a stated matchup fit:
- **Young:** CAR is missing four OL starters; he faces a league-high pressure rate; GB leads the league in INTs.
- **Love:** GB is starting its third-string center (Rhyan out, Glover out); he has thrown an INT in 5 of 7 games (Cody Brown).

**Sources for each leg** (detail in `reports/bets/2026-w08-tnf-sgp-proposals-2026-10-29.md` and `reports/engineering/week8-pools-tnf-2026-10-29/x-bookmarks-pass-2026-10-29.md`):
- Jacobs volume and TD: Moody/Bowen (ESPN), PFF, Farley, Harry Lock, Cody Brown, Gartenberg, Holka, Kaufman.
- Young rushing under: Holka (under projection five straight games; 0 designed runs; GB allows 3.5 YPC to QBs).
- Kraft receptions: DanGambleAI.
- Watson: PFF, Sharp, Murray, Hribar.
- Hubbard TD: PFF, Holka.
- Hubbard receptions: Moody.
- Metchie: xEP projection of 26 yards; Linemate 6/6.
- Young completions: Gartenberg; MySpariEdge hit rate.
- Waller: Cody Brown.
- Love INT: Cody Brown.
- Love rushing: Linemate most-action.
- Coker: Holka.
- McMillan TD: Gallant, Action Island.
- Kraft TD: Neiffer, ParlayScience.
- Love 3+ and Young 2+ passing TDs: price-driven, tier 4.

## Update, about 3:55 PM PT

**Placed by Andy (as he reported it; not logged to any ledger):** DraftKings Predictions 6-pick combo, $10, 30% profit boost, payout $276 boosted to $355.80. Legs:
- Hubbard anytime TD
- McKinney 4+ tackles + assists
- Jacobs 15+ rushing attempts
- Bryce Young 1+ INT
- Kraft 4+ receptions
- Watson 5+ receptions

This replaces S1 and S2 as the Tier 1 ticket.

**Inactives (posted about 3:47–3:53 PM PT; Packers beat writers and JBH on X):**
- GB: TE Jonnu Smith, RB Kaleb Johnson, LB Zaire Franklin, G Donovan Jennings, C Sean Rhyan, G Travis Glover. **Golden, Nixon and Wyatt are active.**
- CAR: TE Ja'Tavion Sanders, OLB Jaelan Phillips, QB Haynes King (emergency third QB), RB AJ Dillon, G Torricelli Simpkins, G Damien Lewis, **DT Bobby Brown**.
- All six players on the placed ticket are active.

**Tier 2 revision:** S3 dropped its Watson-receptions and Jacobs-carries legs because they duplicate the placed ticket. The new BKR stack is S3b: Young o22.5 cmp −108, Metchie o1.5 rec −126, Hubbard o2.5 rec +116, Love o1.5 pass TD −144, McMillan 6+ rec +106. Product about +2500, using BKR prices from Oct 28 at 5:26 PM. S4 (BEO) is unchanged.

## Update, about 4:00 PM PT: fresh BEO SGP board (Andy's 3:59 PM pull)

Saved at `reports/engineering/week8-pools-tnf-2026-10-29/beo-sgp-board-car-gb-2026-10-29-1559.txt`. This is BEO's same-game-parlay builder board, the same format as Andy's slips. It has **no team-sacks market**; the 10:10 AM "Total Sacks <team>" rows came from the straight-bet board. It does list individual sacks, tackles + assists, and INT markets.

**S4 rebuilt (Tier 2, BEO SGP; legs are 3:59 PM board prices):**

| Game | Leg | Price |
|---|---|---|
| CAR@GB | Jordan Love 1+ pass INT | −127 |
| CAR@GB | Lukas Van Ness 1+ sack | +150 |
| CAR@GB | Darren Waller 22+ rec yds | −115 |
| CAR@GB | Jalen Coker 1+ TD | +190 |

- Product is about +2323; the SGP price will be lower.
- Love 16+ rushing (+270) was dropped. The board has no low QB rushing line, and keeping it pushes the stack past the Tier 2 band.
- Alternative sack leg: Dani Dennis-Sutton 1+ sack (+200), product about +2807.
- No leg overlaps the placed DK ticket.
- Van Ness, Dennis-Sutton, Waller, Coker and Love are on the ESPN roster and not on the inactive list.

## Placed, about 4:48 PM PT (as reported by Andy; not logged to any ledger)

- **Tier 2 (BEO SGP):** Love 1+ INT −127; Coker 1+ TD +190; Van Ness 1+ sack +140; Waller 22+ rec yds −117. Odds +2300, wager $6.02, return $144.48.
- **Tiebreakers:** Andy submitted both before the 5:10 PM PT lock.
- **Tier 1:** the DK Predictions 6-pick combo from about 3:53 PM PT (see the update above).
