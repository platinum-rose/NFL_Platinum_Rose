# Fantasy Value-vs-ADP — Feature Spec (draft)

**Status:** draft / not built · **Date:** 2026-07-16
**Source material:** `docs/fantasy_football/Fantasy_Football_Notes_1` (curated 2026 draft-target threads)
**Depends on:** `player_stats` / `player_season_stats` (mig 032), and — for the sharpest version —
`player_prop_odds` (mig 033) once season-long props are sourced.

---

## 1. The idea

Sportsbooks post **season-long player props** (e.g. receiving yards, receiving TDs, rushing yards).
Books are sharp at projecting median usage. Convert those props into **projected fantasy points**,
compare against a player's **ADP** (average draft position), and surface players the betting market
values materially higher than the fantasy draft consensus. This is the exact method the
`@StartSitEmFF` thread in the notes uses (Garrett Wilson, Terry McLaurin, Mike Evans, Drake London),
generalized and grounded in our own data.

The output answers one question per player: **"Does Vegas think this player is better than his draft
cost?"** — a ranked value board for draft prep.

## 2. Two grounding sources (build in this order)

**Phase A — projection from history (available now).** Baseline projected fantasy points from
`player_season_stats` (prior-year PPR points, games, target share, usage), regressed toward
position mean, adjusted for known situation changes (manual, from the notes). No prop odds needed —
ships today.

**Phase B — projection from season-long props (the sharp version).** When season-long player props
are sourced into `player_prop_odds` (market values like `player_reception_yds_season`,
`player_reception_tds_season`), convert directly:

```
proj_ppr ≈ (rec_yds × 0.1) + (rec × 1.0 PPR) + (rec_tds × 6) + (rush_yds × 0.1) + (rush_tds × 6)
         + (pass_yds × 0.04) + (pass_tds × 4) − (int × 2)     # scoring configurable
```

Phase B is the differentiator — it's the market's median projection, not ours. Phase A is the
fallback and the sanity check.

## 3. ADP source

ADP is external (FantasyPros / Underdog / Sleeper / ESPN consensus). Options:
- **Manual seed** (fastest): a small `data/fantasy/adp-<date>.csv` (player, position, adp, adp_round),
  refreshed periodically — matches how the notes were captured. **Recommended for v1.**
- **Scraped/API** later if a reliable free ADP feed is found.

Store in a new `fantasy_adp` table (player_id, player, position, adp, adp_round, source, as_of_date)
— parallels the futures-imports staging pattern.

## 4. The value calculation

For each player:
1. `proj_ppr` — from Phase A or B.
2. `positional_rank_proj` — rank of proj_ppr within position (e.g. proj WR14).
3. `adp_positional_rank` — where the draft market has them (e.g. drafted as WR20).
4. **`value_gap = adp_positional_rank − positional_rank_proj`** — positive = market/history sees more
   than the draft room (a *value*); negative = overdrafted.
5. `tier` — `strong_value` (gap ≥ 6), `value` (3–5), `fair` (−2..2), `reach` (≤ −3).

Surface each with the driver in plain language ("projected WR14, drafted WR20 → +6 value; 1,050 proj
rec yds, low TD projection may be the market discount"), mirroring the notes' style.

## 5. Deliverables

- **`agents/fantasy-value-report.js`** — reads `player_season_stats` (+ `player_prop_odds` in Phase B)
  + `fantasy_adp`, computes the value board, writes `docs/fantasy/value-board-<date>.{json,md,html}`
  (same output pattern as the futures/portfolio reports).
- **`fantasy_adp` table** + `scripts/parse-adp.js` (CSV → table), like `parse-futures-text.js`.
- **(Phase B) season-long prop markets** added to `PROP_MARKETS` and written to `player_prop_odds`.
- Optional dashboard tab later (renders the stored HTML, no React work — same as Futures tab).

## 6. Scope / discipline

- **Decision support, not advice** — same framing as the portfolio synthesizer: show the projection,
  the ADP, the gap, and the driver; the drafter decides. League scoring (PPR/half/standard) is a
  parameter, not a hardcode.
- **Injuries & situation changes** are the known blind spot of a pure props/history model (the notes
  lean heavily on them — ACL returns, target vacancies, scheme changes). v1 flags them as manual
  context, not modeled inputs.
- **No fabrication** — if a player lacks a prop or prior-year row, say so; don't invent a projection.

## 7. Open questions for Andy

1. League format for the default projection — full PPR, half-PPR, or standard?
2. ADP source for v1 — manual CSV seed, or wait for a scrape/API?
3. Ship Phase A (history-based) now, or hold for Phase B (season-long props) — which depends on the
   same prop-odds source hunt as the props subsystem?

## 8. Relationship to the props subsystem

Phase B shares the **exact** integration seam as player props: both need real player-prop odds in
`player_prop_odds`. Sourcing one season-long-props feed unlocks *both* the props agent's line data and
this fantasy value board — one source, two features. See `docs/PROPS_ARCHITECTURE_READINESS.md`.
