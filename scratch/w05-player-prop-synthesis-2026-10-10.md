# Week 5 Player-Prop Synthesis — Research Review

**Built:** 2026-10-10 PT  
**Status:** proposed research only. This is not a wager instruction, placed ticket, official card, or bankroll/portfolio record.

## Evidence boundary

- Analyst-call source: `data/research-intel/review/player-props-intel-latest.json`, built 2026-10-09T22:00:20Z from attributable Week 5 article records.
- Board comparison: BKR normalized capture `data/generated/props/bookmaker-live-2026-10-10-week5.json`, captured **2026-10-10T04:41:26Z**. It is a captured offer, not confirmation that the offer remains executable now.
- The BEO capture at 2026-10-10T06:15:09Z did not provide a better matching row for the calls below.
- All entries remain `unpriced_thesis`; no probability has been estimated or frozen, and none is eligible for CLV/calibration treatment yet.

## Shortlist for final-price and inactive review

| Priority | Proposed research leg | Source selection | Current captured BKR match | Why it survives comparison | Gate |
| --- | --- | --- | --- | --- | --- |
| 1 | Greg Dulcich Over 25.5 receiving yards | Dustin Swedelson, VSiN: Over 26.5 (-125) | Over 25.5 (-109) | Current capture is one yard lower with a less expensive price. The source excerpt says, “We bet Greg Dulcich over receiving yards last week.” | Reconfirm price and active status before any decision. |
| 2 | Quinshon Judkins Under 59.5 rushing yards | Josh Shepardson, Sharp Football: Under 59.5 (-112) | Under 59.5 (-108) | Exact threshold and four cents better price. The thesis is efficiency-based, not a game-script stack. | Recheck final availability and expected role; the available usage note is from Oct. 2. |

These are review priorities, not selections to combine or execute.

## Held, not promoted

| Source call | Current captured board | Decision | Reason |
| --- | --- | --- | --- |
| Zay Flowers 6+ receptions, ESPN NFL panel (-109) | 6+ receptions (-105) | Hold | Threshold and price improve, but Flowers is listed questionable (foot) in the latest availability digest. Need confirmed active status. |
| Romeo Doubs Over 50.5 receiving yards, Zachary Cohen / VSiN (-115) | Over 51.5 (+112) | Hold | The price improves but the threshold is one yard worse; do not call that a comparable edge without a forecast. |
| Sam LaPorta Over 50.5 receiving yards, Josh Shepardson / Sharp Football (-120) | Over 51.5 (-107) | Blocked | The captured threshold is one yard worse; source price cannot be carried forward. |
| Bhayshul Tuten 50+ rushing yards, Steve Krebs / BettingPros (-184) | Main total 66.5; ladders 47+ (-470), 57+ (-217) | Blocked | No exact 50+ offer in the captured board. Do not substitute a ladder rung. |
| Kalif Raymond 4+ receptions, ESPN NFL panel (+123) | No matching BKR/BEO row | Blocked | No captured offer. |
| Isaiah Likely Over 40.5 receiving yards, Josh Shepardson / Sharp Football (-125) | No matching BKR/BEO row | Blocked | No captured offer. |
| Jameis Winston Over 1.5 passing TDs, Zachary Cohen / VSiN (+162) | No matching BKR/BEO row | Blocked | No captured offer. |

## Required before any authorization

1. Re-capture the current book offer for either surviving priority.
2. Confirm inactives/role news, especially Flowers and Judkins.
3. If a quantitative forecast is available, record a frozen probability; otherwise preserve `unpriced_thesis` and do not describe the leg as model edge.
4. Keep any user-approved ticket separate from these recommendation records, including accepted book, exact line, price, timestamp, and settlement.

