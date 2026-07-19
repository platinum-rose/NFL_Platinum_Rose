# Spec — Win-Total Distribution Fit + Schedule Monte Carlo Coherence Model

**Status:** proposed · **Follows:** S274 (portfolio dossier / A/B synthesis) · **Date:** 2026-07-18
**Motivation:** `report-fable-conclusions-2026-07-16.html` — the four headline win-total "edges" on the 07-16 boards were cross-line artifacts (Conclusion 1), and the only surviving edges were found by hand-checking one market against another (Conclusion 3). Feature A makes the artifact impossible; Feature B automates the cross-market check and turns it into a longshot generator.

Two features, one dependency direction: **B consumes A's output.** A ships alone; B requires A.

## Locked decisions (2026-07-18, with Andy)

1. **Calibration data:** unknown whether `futures_odds_snapshots` holds prior-season data → **build starts with a probe script** (`agents/lib/probe-history.js` or a one-off query): report season coverage, snapshot dates, and line variance per season. If 2025-near-closing data exists, calibrate `SIGMA_PRIOR` and HFA/s against 2025 closings + actual outcomes; else fall back to 2026 multi-line teams + division-market fit (§B.2).
2. **Scraper cadence: will be increased (target 2×/day through preseason).** Both features assume this — recency-weighted fit points as specced, and the persistence column becomes meaningful within a week of the cadence change. **Dependency: bump the scraper schedule before the first production dossier run on the new code.**
3. **Validator mode: annotate-and-keep.** Violating recs stay visible, stamped with the violation, rendered red in HTML. Never silently dropped or auto-repaired.
4. **`superbowl_matchup`: sim-price, never card.** Rows keep `sim.prob` for context; `value_gap` suppressed; validator blocks any rec sourced from it (same class as most/least wins).

## Data findings that shaped the spec (from dossier-2026-07-16.json)

- Only **11/32 teams have ≥2 distinct win-total lines** in the current window; 9 had an in-window line move. The σ-prior path is the **dominant** fit path, not the fallback — which is why decision #1 (calibrating that prior) matters and why cadence (#2) directly buys fit quality.
- The wins market currently captures **only 3 books (bookmaker/betus/betonline) — no FanDuel/DraftKings rows**, unlike the 6-book superbowl market. FD/DK are legal as fair-value context; adding their win totals to the scraper would roughly double fit points per team at zero contract risk. **Recommended (not blocking): extend the scraper to FD/DK win totals alongside the cadence bump.**

---

## Feature A — Per-team win-total distribution fit

### A.1 Goal

Replace the `best_over` / `over_prob_median` juxtaposition in `buildOddsView()` (`agents/portfolio-dossier.js:181-192`) with a fitted probability curve per team, so that **every quote is priced at its own line** and edges are computed matched-line only. Secondary output: a tail table (`P(W ≥ k)` for all k) that prices alt-lines and feeds Feature B.

### A.2 Non-goals

- No new data sources. Input is exactly the `futures_odds_snapshots` wins rows already fetched.
- No change to the synthesize API contract shape beyond additive fields (existing consumers keep working).
- Not a team-strength model — the fit is a *market reading*, not an opinion.

### A.3 Math

**Step 1 — de-vig each book's over/under pair.**
For a book quoting over price `o` and under price `u` at line `L`:
`p_o = amToProb(o)`, `p_u = amToProb(u)`, overround `v = p_o + p_u` (typically 1.04–1.08).
Use **power de-vig**: solve `p_o^k + p_u^k = 1` for `k` (bisection, ~20 iterations), fair over = `p_o^k`. Power de-vig shrinks the favorite side less than proportional and is the standard correction for favorite-longshot bias; for near-even win-total pairs it ≈ proportional, so this is cheap insurance, not a behavior change. Fall back to proportional (`p_o / v`) if bisection fails.

**Step 2 — collect fit points.**
Each (book, snapshot-window) contributes a point `(L, q)` where `q = fair P(W > L)`. Because lines move (bookmaker hung 5.5 → 6.5 on LV within one window), one book can contribute points at **two distinct lines** — use `first_line`/`last_line` snapshots as separate points with recency weights (last = 1.0, first = 0.5). This is exactly the data that exposed the artifact; now it feeds the fit.

**Step 3 — fit a discretized-normal CDF.**
Model wins `W` as normal(μ, σ) with continuity correction:
`P(W ≥ k) = 1 − Φ((k − 0.5 − μ) / σ)`, so a quote at line `L = k − 0.5` gives `P(W > L) = P(W ≥ k)`.
Fit by weighted least squares on the probit scale: for each point, `Φ⁻¹(q) = (μ − L − 0.5 + L_frac_adjust) / σ` is linear in `(μ, σ)` → closed-form weighted regression, no iterative optimizer needed.

- **≥ 2 distinct lines:** fit both μ and σ.
- **1 distinct line** (common in July): fit μ only, with σ fixed to a prior. Default `SIGMA_PRIOR = 2.7` wins (league-typical for a 17-game season; make it a constant, calibrate later against seasons where alt totals exist). Flag `sigma_source: "prior"` in output.
- Clamp σ to `[1.8, 3.6]`; clamp μ to `[2, 14]`. Out-of-clamp fits set `fit_quality: "degenerate"` and fall back to single-point mode.

**Step 4 — matched-line edge per quote.**
For every placeable book/side: `edge = fitted P(side at that book's line) − amToProb(price)`.
This is the number the July boards needed: Raiders o6.5 +130 gets priced against `P(W ≥ 7)`, not against the 5.5 median.

**Step 5 — steam/stale classifier.**
Per book: compare its (line, price)-implied fair move over the window against the consensus move.
- `steam`: book moved the same direction as (or ahead of) consensus — its price is a response, discount the "edge".
- `stale`: book unmoved while consensus moved through it — its price is a leftover, upgrade.
- `noise`: everything else.
Emit `move_class` per book. (This rule alone separates the 07-16 Raiders trap from the 49ers-under opportunity.)

### A.4 Code changes

New module `agents/lib/win-dist.js` (pure functions, no I/O, ~200 LOC):

```js
export function devigPair(overAm, underAm)            // -> { pOver, k, method }
export function fitWinDist(points, opts)              // points: [{line, q, w}] -> { mu, sigma, sigma_source, rmse, fit_quality, n_points }
export function probAtLeast(dist, k)                  // P(W >= k) from fitted dist
export function tailTable(dist, {min=1, max=16})      // -> { "4":0.91, "5":0.83, ... }
export function classifyMove(bookSeries, consensusSeries) // -> 'steam'|'stale'|'noise'
```

`agents/portfolio-dossier.js` — in the `isWins` branch of `buildOddsView()`:

1. Build fit points from `per_book` (+ first/last snapshots), call `fitWinDist`.
2. Emit on each wins row (additive):

```jsonc
"win_dist": { "mu": 6.9, "sigma": 2.7, "sigma_source": "prior", "fit_quality": "ok", "rmse": 0.011, "n_points": 4 },
"tails": { "5": 0.72, "6": 0.61, "7": 0.49, "8": 0.37 },
"books": { "bookmaker": { /* existing fields */, "over_edge": 0.012, "under_edge": -0.061, "move_class": "steam" } },
"best_edge_over":  { "book": "bookmaker", "line": 6.5, "price": 130, "edge": 0.012 },
"best_edge_under": { "book": "betus",     "line": 5.5, "price": 115, "edge": -0.020 }
```

3. **Deprecate in the prompt, keep in JSON:** `over_prob_median`, `best_over`, `best_under` remain for one release, but `SYSTEM_PROMPT` in `portfolio-synthesize.js` switches to: *"Edges are pre-computed matched-line in `best_edge_over/under` and per-book `over_edge/under_edge`; `best_over` without its line is context only. Every win-total card MUST state book + line + price, and they must co-exist in `books`."*

### A.5 Validation & acceptance

- **Unit:** synthetic team with known binomial(17, p) — fitted μ within ±0.15, σ within ±0.3 given 3 noisy lines. De-vig round trip: `devigPair` on a fair pair returns the pair.
- **Regression fixture:** run against `dossier-2026-07-16.json` inputs; assert the four artifact cases — LV bookmaker o6.5 `over_edge < 0.03`, CIN bookmaker o10.5 `over_edge ∈ [0.01, 0.05]`, NE o10.5 `|over_edge| < 0.02`, PIT o8.5 `|over_edge| < 0.02` — and SF bookmaker u9.5 `under_edge > 0.03`. These encode the manual audit as tests.
- **Mechanical board validator** (new, `agents/lib/board-validate.js`, run inside `portfolio-synthesize.js` after `parseJSON`): every rec must reference an existing book+line+price combo in the dossier, book ∈ BETTABLE_BOOKS, `n_books ≥ 3` for the market (kills `most_wins`/`least_wins` cards), and recomputed edge within 2pts of the model's claim; violations get stamped onto the rec (`"validation": ["line_mismatch: bookmaker is 6.5 not 5.5"]`) and rendered in red in the HTML.

**Effort:** ~1 day. No new dependencies (probit/Φ via rational approximation, ~15 LOC).

---

## Feature B — Schedule Monte Carlo coherence model

### B.1 Goal

Produce internally consistent probabilities for **every** market the books price (division, playoffs, seeds, conference, SB, most/least wins, exact SB matchup) from one simulation seeded by Feature A's μ's and the real schedule (already fetched by `fetchSchedule()` from `games`). Every large, stable deviation between the sim and a placeable price is a candidate edge — this is the automated version of the Giants-playoffs-vs-wins-market check, and the only honest way to price thin/single-book markets (sim replaces "fair" where n_books < 3).

### B.2 Model

**Step 1 — market-implied power ratings.**
Find ratings `r_1..r_32` such that each team's *expected* season wins under the game model equals its fitted `μ_i`:

- Game model: `P(i beats j at i's home) = logistic((r_i − r_j + HFA) / s)`.
- 32 equations (Σ over team i's schedule of game probs = μ_i), 32 unknowns; one d.o.f. is gauge (mean rating := 0). Solve by damped fixed-point: `r_i ← r_i + λ · s · (μ_i − E[wins_i])`, λ ≈ 0.5, converges in ~50 iterations (each iteration = 272 logistic evals; microseconds).
- Global params: `HFA` (init 0.28 rating units ≈ 57% home) and scale `s` (init 1.0). **Calibrate only these two** by minimizing total squared deviation between sim division probs and de-vigged book division probs across all 32 teams. Two global d.o.f. cannot absorb per-team edges — that's deliberate: after calibration, *per-team* residuals are signal, not model error.

**Step 2 — regular season simulation.**
`N = 100,000` seasons (CLI `--sims`), seeded PRNG (mulberry32, `--seed`) for reproducibility. Per season: Bernoulli each of the 272 games. Optionally inject rating uncertainty: each season draws `r_i' = r_i + ε`, `ε ~ N(0, σ_r)` with `σ_r` from Feature A's fit rmse (default 0.15) — this widens tails realistically, which matters for longshot pricing.

**Step 3 — standings and tiebreakers.**
Implement in fidelity order: (1) head-to-head, (2) division record, (3) conference record, (4) **random**. Document that strength-of-victory and beyond are approximated by random — the error this introduces is far below the edge threshold (§B.4), and exact SOV requires common-games bookkeeping that isn't worth it at v1. Seed 1–7 per conference per NFL rules (division winners 1–4 by record, wildcards 5–7).

**Step 4 — playoff simulation.**
Standard bracket (7-team, №1 bye, reseeding), same game model with `HFA_playoff = HFA`. Produces per-sim conference champion, SB winner, and SB matchup.

**Step 5 — aggregate.**
Per team: `sim_division`, `sim_playoffs`, `sim_seed1`, `sim_conference`, `sim_superbowl`, `sim_most_wins`, `sim_least_wins`, `win_dist_sim` (full sim win histogram — cross-check against Feature A's parametric fit; large disagreement = schedule-shape effect the normal can't see, e.g. extreme SoS). Per pair: `sim_matchup[a][b]`. Also persist the **joint outcome matrix** needed for correlation-aware sizing: for each pair of candidate plays, `P(both hit)` from the same sims.

### B.3 Coherence report (the edge finder)

For every outright row in `synthesis_input`, attach:

```jsonc
"sim": { "prob": 0.291, "gap": 0.050, "gap_ci90": [0.021, 0.079], "n_eff_books": 3 }
```

- `gap = sim_prob − amToProb(best_price)` (positive = placeable price is generous vs. the coherent model).
- `gap_ci90` from bootstrap over rating uncertainty (20 re-solves with jittered μ's; cheap). **A gap only qualifies as a candidate edge if its CI excludes zero** — this is the guard against promoting simulation noise into "edges", the failure mode that produced gpt-4o's least-wins card.
- Markets where `n_books < 3` (most/least wins, matchup): `sim.prob` is the *only* fair number reported; `value_gap` is suppressed (set null) so no downstream consumer can repeat the +17.55%-edge-on-a-single-book mistake.

New artifact `.nfl/portfolio/sim-<date>.json` (full histograms + joint matrix) and a top-10 table appended to the dossier `.md` (`## Coherence gaps (sim vs placeable price)`), sorted by CI-lower-bound of |gap|.

### B.4 Thresholds (initial, tune after one season of CLV grading)

| Market class | flag if CI-lower |gap| > | rationale |
|---|---|---|
| division / playoffs | 0.025 | liquid enough that 2.5pts is real |
| conference | 0.015 | longer odds, smaller absolute gaps matter |
| superbowl / matchup / most-least | 0.010 | tails; favorite-longshot bias makes small positive gaps meaningful |

### B.5 Code changes

New `agents/portfolio-simulate.js` (~450 LOC, imports `win-dist.js` + `normalizeTeam`):

```
node agents/portfolio-simulate.js --dossier .nfl/portfolio/dossier-<date>.json
     [--sims 100000] [--seed 274] [--sigma-r 0.15] [--out sim-<date>.json]
```

Steps: read dossier → require `win_dist` on ≥ 28 teams (else abort with message to re-run dossier) → fetch schedule (reuse `fetchSchedule`; or read from dossier if we also persist the schedule there — preferred, add `meta.schedule` to dossier so the sim is fully offline-reproducible) → solve ratings → calibrate HFA/s → simulate → write sim json → **patch the dossier in place** with `sim` fields per row (idempotent, keyed by `meta.sim_version`).

`portfolio-dossier.js`: persist `schedule: [{week, home, away}]` in the JSON (small; enables offline sim). `portfolio-synthesize.js`: `SYSTEM_PROMPT` gains one paragraph: *"Rows may carry `sim` — a schedule-based Monte Carlo probability that is internally consistent across all markets. A `gap` whose `gap_ci90` excludes zero is a pre-qualified candidate edge; still name the mechanism (which book, steam/stale, intel) before carding it. Where `value_gap` is null (single-book markets), `sim.prob` is the only fair reference."*

### B.6 Validation & acceptance

- **Conservation tests:** division probs sum to 1.0 per division (±0.002); playoff probs sum to 14.0 per league; SB probs sum to 1.0; matchup marginals equal conference-champ probs.
- **Consistency test:** `win_dist_sim` mean within ±0.1 of input μ per team (the rating solve worked).
- **Known-case fixture (07-16 dossier):** sim should independently reproduce the hand-found result — NYG `sim_playoffs` materially above the +315 implied 0.241 — and should *not* flag Cardinals u4.5 or Lions +175 as positive-gap. If it flags something the manual pass missed, that's the feature working; review it by hand once.
- **Calibration honesty check:** after HFA/s calibration, mean |gap| across division markets should be < 0.02 — if it isn't, the model disagrees with the market systematically and per-team gaps are untrustworthy; abort flagging and report.
- **Determinism:** same seed → byte-identical sim json.

**Effort:** 2–3 days including tests. No new dependencies. Runtime target < 30s for 100k sims (272 logistics × 100k ≈ 27M draws + playoff brackets; trivially within budget in Node).

---

## Rollout order & follow-ups

1. **A** ship + regression fixtures → re-run dossier for current date → re-run synthesis A/B; expect the win-total sections of all boards to change materially (that's the point).
2. **Board validator** (A.5) wired into synthesize — it protects against every failure class in the conclusions report regardless of which model runs.
3. **B** ship → one manual review cycle of the coherence table before it's fed to models → then add `sim` to the prompt.
4. **Later (out of scope here):** persistence column (`gap` vs. previous dossier date) in `buildSynthesisInput`; CLV grading ledger; source-deduped intel weights (the Chargers u5-that-is-really-Sharp-×5 fix); correlation-aware stake suggestions from B's joint matrix.

## Remaining open items (non-blocking)

- σ prior (2.7) and σ_r (0.15) resolve via the history probe (Locked decision #1) — path chosen at build time, both paths specced.
- Ties: currently ignored (Bernoulli). NFL ties run ~0.4%/season; add a tie prob to the game model only if grading shows it matters for exact-wins markets.

## Build order (final)

0. History probe (decision #1) + scraper cadence bump & FD/DK win totals (decision #2) — data prerequisites, ~half day.
1. Feature A + regression fixtures.
2. Board validator, annotate-and-keep mode (decision #3), wired into `portfolio-synthesize.js`.
3. Feature B, with matchup policy per decision #4; one manual review of the coherence table before `sim` enters the prompt.
