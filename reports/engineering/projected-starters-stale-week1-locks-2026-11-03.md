# Projected starters: stale Week 1 locks and IR starters (proposal, not applied)

Found 11/03 by Claude (read-only analysis of `data/projected-starters/2026/latest.json`, built 11/03 10 AM PT).

## Problem

`scripts/build-projected-starters.js` reads **every** JSON in `data/projected-starters/2026/manual/`, including
`week1-usage-locks.json` (written 09-15). Week 1 locks never expire, and no manual row is checked against the availability
snapshot. Result: 46 starter rows come only from the Week 1 file, and 7 listed starters are currently IR/Out:

| Team | Player | Pos | Status (latest) | Source of the starter row |
|---|---|---|---|---|
| BAL | Lamar Jackson | QB | IR (11/03) | week1-usage-locks.json (Fagnano is also listed, from week-usage-locks) |
| PHI | Jalen Hurts | QB | IR (11/03) | week1-usage-locks.json (McKee is also listed) |
| NYG | Jaxson Dart | QB | IR (11/03) | week1-usage-locks.json (**NYG has no other QB row: no valid starter**) |
| WAS | Jacory Croskey-Merritt | RB | IR (11/03) | week1-usage-locks.json |
| LAC | David Njoku | TE | IR (11/03) | week1-usage-locks.json |
| CHI | Coby Bryant | S | IR (11/03) | ESPN injuries API (starter language) |
| TB | Yaya Diaby | LB | OUT (11/02) | tb-depth-chart-2026-10-27.json |

Risk: the TNF/Sunday roster gate can pass a pick whose rationale assumes Lamar/Hurts/Dart start (the W09 prompt explicitly
asks to flag those). It also inflates "known starter" coverage.

## Proposed fix (two small rules in build-projected-starters.js)

1. **Newest lock wins per team+position.** When `week-usage-locks.json` has a starter for a team+position, drop the
   `week1-usage-locks.json` row for that team+position (keep Week 1 rows only where no newer lock exists). Alternatively,
   retire `week1-usage-locks.json` now that weekly locks run every Tuesday.
2. **Availability veto.** If the player's latest availability event (by `published_at`) is IR / OUT / PUP / SUSPENDED,
   keep the row but set `role: "unavailable"` and `needs_human_review: true`, and exclude it from `known`.
   DOUBTFUL/QUESTIONABLE stay as starters (Andy: only Q/D are genuinely ambiguous).

NYG still needs its current QB: add a manual row, or let the Week 9 usage lock pick it up.

Not applied: this changes roster-gate behaviour for the whole pipeline, so it's Andy's call.
