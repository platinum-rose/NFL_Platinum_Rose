---
name: nfl-analytical-reference
description: NFL advanced metric reference for betting — DVOA, EPA, CPOE, PFF grades, and situational splits. Load when interpreting analytics from PFF, Football Outsiders, Action Network, or FTN research notes, or when a pick signal references efficiency metrics. Explains what each metric means, its predictive weight, and how to combine metrics into a tiered bet signal.
compatibility: Designed for Platinum Rose NFL BETTING agent
metadata:
  author: andrewlrose
  version: "1.0"
  season: "2026"
---

# NFL Analytical Models — Betting Reference

> **Load when:** a research note, intel tweet, or pick analysis references DVOA, EPA, CPOE, or PFF
> grades and you need to interpret them in a betting context.

---

## Metric Glossary

### DVOA — Defense-adjusted Value Over Average

**Source:** Football Outsiders  
**What it measures:** Efficiency vs. the average NFL team, adjusted for opponent strength.
Positive % = above average offense (or below average defense). Negative = opposite.

**Betting use:**

- Use for season-long matchup framing — DVOA is noisy before week 5; do not use for first 4 weeks
- A 15+ point gap in relevant DVOA (e.g., pass offense DVOA vs. pass defense DVOA) is a meaningful
  edge that the market may not fully price
- DVOA is best as a *confirming signal*, not a primary trigger — the market already prices DVOA
  quickly in weeks 6+
- **Trap:** High-DVOA teams can be overpriced favorites. When spread already reflects DVOA gap,
  the edge is gone — use DVOA to confirm, not to bet against the line

---

### EPA — Expected Points Added

**Source:** ESPN Stats & Info, PFF, nflfastR  
**What it measures:** Points added above expectation per play, adjusting for down, distance, and
field position.

**Betting use:**

- EPA/play is more predictive of future performance than yards/play
- Pass EPA vs. Rush EPA ratio reveals offensive identity (useful for game script modeling)
- Negative EPA/play on defense = efficient defense (often undervalued by public)
- **Key signal:** A team with positive EPA/play on both sides but a losing record is likely
  undervalued — look for line regression opportunity as market catches up
- Team EPA/game ranges roughly -15 to +15; single-game EPA is noisy; use 4-game rolling average

---

### CPOE — Completion Percentage Over Expected

**Source:** Next Gen Stats, PFF  
**What it measures:** QB actual completion % minus expected completion %, given air yard depth,
receiver separation, and pressure.

**Benchmarks:**

| Tier | CPOE Range | Example |
|------|-----------|---------|
| Elite | +5% to +10% | Mahomes, Allen |
| Above average | +2% to +5% | Most top-12 QBs |
| Average | -2% to +2% | Replacement-level starters |
| Below average | < -3% | Starting QBs under pressure to start |

**Betting use:**

- Best single-metric predictor for QB-dependent teams in good weather
- CPOE drops sharply in adverse weather — apply a -2 to -4% adjustment for wind > 15 mph or rain
- A QB with high CPOE but negative EPA suggests the scheme is limiting him — potential underdog value
- **Note:** CPOE is unstable before week 5; use career CPOE + prior season for new/young starters

---

### PFF Grade

**Source:** Pro Football Focus  
**What it measures:** Contextual 0-100 grade per player per play.

**Benchmarks:**

| Grade | Interpretation |
|-------|---------------|
| 80+ | Excellent |
| 70–79 | Above average |
| 60–69 | Average/starter-level |
| < 60 | Below average |

**Betting use:**

- **Most useful matchup:** O-line pass-blocking grade vs. opposing pass-rush grade. This matchup
  is the single strongest predictor of spread outcomes beyond point spread itself.
- WR/CB matchup grades are more useful for props than full-game lines
- **Caution:** PFF grades can lag trajectory changes — use 4-week rolling, not season-to-date,
  for players on hot/cold streaks
- Single-game PFF grades: informational only, do not bet on them directly

---

## Combining Metrics — Tiered Signal Framework

### Tier 1 — Strong Confirming Evidence

All three conditions met:

1. DVOA gap 15+ points on the relevant side (e.g., offense vs. opposing defense)
2. EPA/play confirms (same direction)
3. O-line PFF grade advantage aligns with pass-rush matchup data

> **Action:** This is meaningful edge. Use to confirm a spread lean or increase unit size on a Tier 2 pick.

---

### Tier 2 — Supporting Evidence

One or two conditions met:

- One metric is favorable + sharp money % aligns (Action Network showing 60%+ sharp on same side)
- OR two metrics agree without the third confirming

> **Action:** Supporting evidence for a pick. Do not bet on Tier 2 alone — requires additional
> signal (injury situation, coaching angle, or weather advantage).

---

### Tier 3 — Noise

Only one metric favorable, OR:

- Data is from weeks 1–4 (small sample)
- Coaching/scheme change occurred this season (invalidates historical DVOA)
- Opponent-adjustment makes the metric misleading (weak schedule effect)

> **Action:** Note it; do not weight it in the decision.

---

## Weather Adjustment Table

| Condition | Effect | Metric Adjustment |
|-----------|--------|------------------|
| Wind > 20 mph | Pass game suppressed | Reduce pass EPA expectation 25–30%; lean under |
| Rain | Ball security risk, sloppy | Reduce passing CPOE by 2–3%; favor run-dominant teams |
| Cold (< 25°F) | Kicker accuracy drops | Fade FG-dependent totals; reduce spread by 1.5 pts for dome teams playing outdoors |
| Dome game | No weather impact | Use raw metrics without adjustment |
| High altitude (Denver) | Slight passing advantage | Minimal effect; disregard for modern analytics |

---

## Data Freshness Rules

| Source | Reliable After | Notes |
|--------|---------------|-------|
| DVOA | Week 5 | Too noisy before week 5 |
| EPA | Week 3 | More stable early than DVOA |
| PFF grade | 4-week rolling window | Single-game grades: informational only |
| CPOE | Week 4 | Use career context for new starters |
| Injury-adjusted projections | Any week | Refresh within 24h of game time |

---

## Reference Files

The following files should be maintained in `references/` as the 2026 season progresses:

- `references/dvoa-league-averages.md` — Current-season DVOA snapshots by team (update weekly)
- `references/team-2026-profiles.md` — Per-team metric snapshots (offense + defense efficiency)

These files are empty at initial commit and populated by the analyst as season data accumulates.
