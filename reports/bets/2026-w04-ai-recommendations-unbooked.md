# Week 4 — unbooked AI recommendations

Paper-only accuracy ledger created 2026-10-04 after reconciling `reports/bets/2026-w04-card.md` against `data/official-picks/user-placed-wagers-2026.json`.

These records are proposals, not wagers. They are in `data/official-picks/paper-wagers-2026.json`, are excluded from cash totals and bankroll sync, and will be visible as paper tickets in the Live Tracker.

## Ticket proposals not booked

| Paper ID | Original proposal | Paper stake | Reference price |
|---|---|---:|---:|
| `paper_20261004_ai_slot4_afternoon` | Slot 4 Afternoon parlay | $20 | +1378 |
| `paper_20261004_ai_slot5_hybrid` | Slot 5 Hybrid game-line parlay | $20 | +1295 |
| `paper_20261004_ai_ari_jax_ml` | ARI ML + JAX ML | $10 | +298 |
| `paper_20261004_ai_supercontest_a` | SuperContest A 5-team parlay | $15 | +2495 |
| `paper_20261004_ai_7a_morning_props` | 7a Morning prop stack | $5 | +21403 |
| `paper_20261004_ai_7b_afternoon_props` | 7b Afternoon prop stack | $5 | +393 |
| `paper_20261004_ai_7d_hybrid_props` | 7d Hybrid prop stack | $10 | +16362 |
| `paper_20261004_ai_8b_2td` | 8b 2+ TD 3-leg | $5 | +2300 |
| `paper_20261004_ai_7e_atd` | 7e Anytime TD 4-leg | $5 | +6596 |
| `paper_20261004_ai_8a_first_td` | 8a First TD 3-leg | $5 | +23525 |
| `paper_20261004_ai_wong_teaser` | 6-point Wong teaser JAX-DEN-ATL | $10 | +160 est. |

Paper stake: **$110.00**. The paper ledger keeps the original ticket composition even where one or more legs were independently booked later.

## Exact prop legs not booked

These are the unique recommended prop thresholds that do not appear as the same threshold on a placed ticket.

| Source | Unbooked exact leg(s) |
|---|---|
| 7a Morning | Jacoby Brissett 2+ pass TD; Matthew Stafford 2+ pass TD; Puka Nacua anytime TD; Jakobi Meyers anytime TD; Tony Pollard anytime TD |
| 7b Afternoon | Sam Darnold 2+ pass TD; Patrick Mahomes 2+ pass TD; Malik Willis over 0.5 interceptions |
| 7d Hybrid | Puka Nacua 7+ receptions; Tony Pollard 48+ rushing yards; James Cook 85+ rushing yards; Christian McCaffrey 41+ receiving yards; Jameson Williams anytime TD |
| 8b 2+ TD | Derrick Henry 2+ TD |
| 7e Anytime TD | Michael Wilson anytime TD; Jameson Williams anytime TD (also in 7d; one underlying player proposition) |
| 8a First TD | James Cook first TD; Derrick Henry first TD; Travis Kelce first TD |

## Not paper-tracked as unbooked

- Slot 3 Morning parlay was effectively booked as ticket `739714258`: identical teams/markets, with GB/TB Under 40 rather than the proposal's Under 38.5.
- The MIA, GB/TB Under, and NYJ singles were covered at equal or better placed thresholds.
- Exact booked prop matches: Jameis Winston over 0.5 interceptions, Jalon Daniels over 0.5 interceptions, Parker Washington over 5.5 receptions (6+), David Montgomery 2+ TD, Jahmyr Gibbs 2+ TD, Lamar Jackson anytime TD, and Garrett Wilson anytime TD.
- Related but not exact thresholds remain in the paper ledger: Brissett and Stafford over 1.5 passing TDs were booked instead of 2+; Mahomes over 1.5 was booked instead of 2+; Cook 76+ rushing was booked instead of 85+; McCaffrey over 41.5 receiving was booked instead of the proposed 41+.
