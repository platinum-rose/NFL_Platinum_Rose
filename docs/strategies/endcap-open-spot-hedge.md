# Endcap + legacy open-spot hedge strategy (Andy, 2026-11-15)

Goal: keep the 5 legacy Bookmaker open-spot parlays (data/official-picks/legacy-open-spot-parlays.json) in active use through the playoffs by pairing them with fresh weekly longshot ML "endcap" parlays.

## Endcap ticket (build 1-2 per week)
- Stake $10-15, moneyline-heavy parlay (spreads/totals allowed sparingly).
- Target payout above the open-spot hedge it pairs with: >= ~$1,000-1,500 (roughly +7,500 to +12,000 on $10-15).
- Order the legs so the LAST unresolved leg is in the latest window: SNF or MNF (or TNF for a Thursday build). That is the endcap leg.
- Prefer an endcap leg whose opposite side is a plus-money ML (dog +120 to +200) so the hedge pays well.

## Hedge with a legacy open spot (when the endcap reaches its last leg alive)
- All 5 remaining legacy tickets have 2 open spots and BOTH must win.
- Step 1 (earlier in the week, or same day before the endcap game): fill spot 1 with a near-lock (ML -300 to -500). This converts the ticket to a single-spot hedge shell. Risk: if the near-lock loses, the ticket dies, so use the safest leg on the board.
- Step 2 (live or pregame): fill spot 2 with the OPPOSITE side of the endcap leg (opposite ML, or opposite spread).
- Open spots accept live lines (confirmed 2026-11-15). Alt totals were not offered pregame. Live prices move fast on slow starts; wait a series or two when the script favors you.

## Hedge return reference (spot 1 = -400 near-lock, spot 2 = opposite ML)
| Ticket | Locked value | opp +120 | opp +150 | opp +200 |
|---|---|---|---|---|
| 730888303 | $313 | $860 | $977 | $1,172 |
| 730737412 | $239 | $657 | $747 | $896 |
| 731062665 | $104 | $287 | $326 | $391 |
| 731063264 | $100 | $276 | $314 | $377 |
| 731536472 | $77 | $212 | $241 | $289 |

Pairing rule: big endcaps (>= $1,200 to win) hedge with 730888303 or 730737412; smaller endcaps ($400-800) with the other three. Log every fill in both legacy-open-spot-parlays.json and user-placed-wagers-2026.json.

## Totals as endcap legs (Andy, 2026-11-15, from W10 SNF PIT@CIN)
- The endcap leg does not need to be a ML; game totals are often better because the live total moves every series and allows middles (a ML hedge cannot middle).
- The hedge gets cheap when the endcap side is WINNING the script:
  - Endcap UNDER + slow start -> live total drops -> hedge live OVER at a lower number (W10 SNF: 48.5 pregame -> 43.5 by mid-Q2 at 10-0; 4-5 pt middle available).
  - Endcap OVER (high total) + fast start -> live total rises -> hedge live UNDER at a higher number.
  - Script going against the endcap -> hedge is expensive and leaves a dead zone; hedge small or accept the variance.
- Process: do not hedge pregame; watch Q1 and fill the open spot as the line moves toward you, by halftime at the latest (or use the 2H total per scratch/w10-snf-live-hedge-price-log-2026-11-15.md).
- Prefer high-total games for Over endcaps (bigger pace swings), with the opening number at or below the model number.
