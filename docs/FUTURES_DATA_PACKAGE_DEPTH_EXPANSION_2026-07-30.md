# Futures Data-Package Depth Expansion — Net-New Domains — 2026-07-30

**Author:** Copilot (VS Code) · HEAD `bb99351` (main) · docs-only
**Companion to:** `docs/FUTURES_DATA_PACKAGE_ENHANCEMENT_BACKLOG_2026-07-30.md`
(that doc ranks the 10 *already-catalogued* gaps; **this** doc goes wider — net-new
data domains the dossier schema doesn't capture, or captures only shallowly, that would
let a frontier LLM run genuinely sophisticated football + betting analysis).

**Guardrails:** no Supabase writes, no paid/frontier model calls, no pick persistence,
no `git add -A`. Every domain is mapped to the `FUTURES_PORTFOLIO_MASTER.md` dossier
schema v1.0 — existing field, or a **proposed** new field where the schema has no home
for it yet.

---

## The headline insight: most of this is *plumbing*, not new collection

The 2026-07-21 data-inventory doc found twice that "missing data" was really an
un-plumbed free source (rest/travel and CLV both turned out to already be in
nflverse's `schedules.csv`, fetched and discarded). **That same pattern dominates this
analysis.** Grounding checks this session:

- `scripts/fetch_nflverse_data.py` pulls only **7** datasets: schedules, games,
  player_stats weekly/seasonal, team_stats, ftn_charting, espn QBR, rosters_weekly.
- The GHA refresh (`.github/workflows/nflverse-data-refresh.yml`) runs **`--no-pbp`**
  for speed — so the entire play-by-play layer (situational EPA, red-zone, third-down,
  win-probability, turnover context) is available but routinely **not built**.
- **Entirely unfetched, all free via nflverse/`nfl_data_py`:** Next Gen Stats
  (`import_ngs_data`), snap counts (`import_snap_counts`), official depth charts
  (`import_depth_charts`), PFR advanced pass/rush/rec (`import_pfr_*`), historical Vegas
  win totals (`import_win_totals`), referee assignments (`import_officials`), draft
  capital (`import_draft_picks`), combine (`import_combine_data`).

**Consequence:** the Codex sprint is *manually* confirming depth charts (307 estimated,
0 confirmed) while `import_snap_counts` (prior-season snap %) + `import_depth_charts`
(official weekly charts) would supply authoritative roster truth for **free**. And the
dossier's `analytics.*` block ships without any of the regression signals a real futures
analyst leans on — all derivable from the pbp layer that CI skips.

### Verified this session: migration-044 tables are ~50% null *by design*

Inspecting the generated snapshots
(`data/generated/team-profiles/team-analytic-snapshots-2025-w18.json`,
`…coaching-tendency-snapshots-2025-w18.json`) confirms the "plumbing, not missing-data"
thesis empirically — the rich schema is half-empty because the builders derive only from
`team_stats.csv` aggregates, never from pbp/charting:

- **`team_analytic_snapshots` — populated:** `off/def_epa_per_play` (+ranks),
  `epa_per_dropback`, `qb_epa_per_dropback`, `cpoe`, `sack_rate_allowed/generated`,
  `neutral_pass_rate`.
- **`team_analytic_snapshots` — NULL for all 32 teams:** `success_rate`,
  `dropback_success_rate`, `explosive_play/pass/run_rate`,
  `pressure_rate_allowed/generated`, `early_down_pass_rate`, `shotgun_rate`,
  `no_huddle_rate`, `play_action_rate`, `motion_rate`. The file's own `attribution_note`
  says these "require play-level or charting data and are intentionally left null in this
  v1 builder."
- **`team_coaching_tendency_snapshots` — NULL for all 32 teams:** OC/DC names,
  `coordinator_continuity`, `fourth_down_aggression_rate/tier`, `shotgun/no_huddle/
  play_action/motion/rpo_rate`, `pace_seconds_per_play`, `red_zone_pass_rate`,
  `two_minute_aggression_tier` (only `neutral_pass_rate` + `ats_by_role` are filled).

So domains **D** (trench: `pressure_rate_*` exists-but-null), **E** (NGS/charting), and
**H** (coaching tendencies) are **plumbing fixes** — run `seed-historical-stats.py`
*without* `--no-pbp` locally and extend the builders to read charting/pbp — not new
schema. Only the pbp/NGS *inputs* need adding to the nflverse fetch.

So the framing below is deliberately **acquisition-path-first**: `FREE-PLUMB` (already in
or trivially added to the nflverse pipeline), `FREE-NEW` (free public source, new
fetcher), `PAID` (needs a paid API/service), `MANUAL` (sustained human curation).

---

## Domain map (leverage × effort × acquisition)

Leverage 1–5 = how much it deepens frontier analysis. `∆schema` = does the dossier
already have a field, or is a new field proposed.

| # | Domain | Lev | Acquisition | ∆schema | Dossier field(s) |
| --- | --- | :---: | --- | --- | --- |
| A | **Regression / luck signals** (turnover, red-zone, Pythag, one-score) | 5 | FREE-PLUMB (pbp) | **new** | `analytics.regression.*` (new) · `thesis.regression_direction` |
| B | **Projection / power-rating ensemble** (FPI, nfelo, DVOA-proj, SRS) | 5 | FREE-NEW + MANUAL | exists, **unfed** | `power_rating.model_rank` · `power_rating.delta` |
| C | **Authoritative roster depth** (snap %, depth charts, continuity) | 5 | FREE-PLUMB | exists (inferred) | `roster.qb_depth` · `roster.positional_grades` |
| D | **Offensive-line / trench quality** (PBWR/RBWR, continuity, pressure allowed) | 4 | FREE-PLUMB (PFR) + PAID | **new** | `roster.positional_grades.OL` · `analytics.trench.*` (new) |
| E | **Next Gen Stats** (separation, TTT, CPOE, RYOE, coverage) | 4 | FREE-NEW (NGS) | partial | `analytics.*` · `roster.positional_grades` |
| F | **Cross-market coherence / arbitrage** (SB vs conf vs div vs wins) | 4 | FREE-PLUMB (own data) | **new** | `market_snapshot.cross_market_coherence.*` (new) |
| G | **Derivative / tangential markets** (alt win ladders, exact wins, stage-of-elim, team totals, stat-race) | 4 | MANUAL + FREE-NEW | partial | `market_snapshot.awards[]` · `…derivatives.*` (new) |
| H | **Coordinator track record + scheme-change flags** | 4 | FREE-PLUMB + MANUAL | partial | `coaching.scheme_*` · `coaching.coordinator_changes` |
| I | **Base-rate / calibration priors** (win-total hit rates, favorite conversion) | 4 | FREE-NEW (win_totals hist) | **new** | `power_rating.*` · run-level meta |
| J | **Schedule environment** (travel/body-clock, weather feed, QB-adj SoS) | 3 | FREE-PLUMB + FREE-NEW | partial | `schedule.notable_spots` · `schedule.*` (new sub-fields) |
| K | **Futures market microstructure** (futures splits, hold/vig, opening lines) | 3 | PAID + FREE-PLUMB | **new** | `market_snapshot.line_movement` · `…microstructure.*` (new) |
| L | **Injury sophistication** (value-weighted, durability, practice trend, suspensions) | 3 | FREE-NEW + MANUAL | partial | `roster.injuries` · `roster.player_availability` |
| M | **Special teams** (FG%, kicker, return, ST-DVOA detail) | 2 | FREE-PLUMB | partial | `analytics.dvoa.st` · `analytics.special_teams.*` (new) |
| N | **Personnel / cap / roster-construction context** (draft capital, age, cap window) | 2 | FREE-NEW | **new** | `roster.construction.*` (new) |
| O | **Broad public sentiment / contrarian breadth** | 2 | PAID/FREE-NEW | partial | `intel.contrarian_flags` |

---

## Model-tier routing

Per `.claude/rules/model-tiering.md`. Tiers: `code` (deterministic, no LLM) ·
`flash` (extract/classify/normalize) · `standard` (moderate judgment) ·
`frontier` (synthesis/strategy). Compound = pipeline. Note how much of this is
`code` — the depth gains are pipeline work, not LLM calls.

| Domain | Model tier | Rationale |
| --- | --- | --- |
| A · Regression / luck signals | `code` | pbp math (turnover/Pythag/one-score/red-zone) |
| B · Projection / power-rating ensemble | `code + flash` | Ingest lines (code); flash extracts ranks from unstructured pages |
| C · Authoritative roster depth | `code` | nflverse snap_counts / depth_charts |
| D · OL / trench quality | `code` | PFR advanced + continuity math (paid grades optional) |
| E · Next Gen Stats | `code` | NGS parquet ingest |
| F · Cross-market coherence / arbitrage | `code` | Devig + coherence math — pure code edge |
| G · Derivative / tangential markets | `flash` | Normalize book exports → structured markets |
| H · Coordinator track record + scheme-change flags | `flash + standard` | Flash extracts history/scheme text; standard judges scheme-personnel fit |
| I · Base-rate / calibration priors | `code` | Historical win-total hit rates |
| J · Schedule environment | `code` | Travel/body-clock/weather compute (weather feed = code) |
| K · Futures market microstructure | `code` | Hold/vig math (splits feed = paid ingest) |
| L · Injury sophistication | `code + flash` | Durability math (code) + practice/suspension extraction (flash) |
| M · Special teams | `code` | pbp / PFR derivation |
| N · Roster-construction context | `code` | Draft capital / age / cap ingest |
| O · Public sentiment breadth | `flash` | Sentiment classification at scale |
| — · Final dossier synthesis (consumer) | `frontier` | Thesis + market-vs-model edge + skeptic/risk passes |

---

## Detail by domain

### A · Regression & luck signals — *the single biggest analytical hole* (Lev 5, FREE-PLUMB)

A sharp futures analyst's first move is separating **skill from luck** in last year's
record. None of these are in the package today; all derive from the pbp layer CI skips:

- **Turnover margin & luck** — fumble-recovery rate (regresses hard to ~50%),
  interception rate on defense (largely non-repeatable), giveaway/takeaway margin. Teams
  that won on +TO margin are prime *unders*; teams that lost despite good process are
  *overs*.
- **Pythagorean wins vs actual** — expected wins from points for/against; the gap is the
  canonical win-total mean-reversion signal.
- **One-score-game record** — 11–3 in one-score games is unsustainable; flags
  over-performers due to fade.
- **Red-zone TD% (off & def)** — high RZ-TD rate regresses; a team that scored on
  efficiency + RZ luck is a different bet than one that moved the ball everywhere.
- **Third-down conversion over/under expected** — situational variance.
- **Points/yards per drive, drive success rate** — game-script-independent efficiency.
- **Adjusted / opponent-adjusted EPA** — the stored EPA is raw; early-season raw EPA is
  schedule-polluted. DVOA is opponent-adjusted but only 2025 is loaded.

**Why it caps depth:** `thesis.regression_direction` is a *required* dossier field, but
the model has no quantitative basis to set it — it's guessing from memory.
**Proposed field:** `analytics.regression { pythag_wins, pythag_win_delta,
one_score_record, fumble_recovery_pct, takeaway_margin, rz_td_pct_off, rz_td_pct_def,
third_down_over_expected }`.
**Acquisition:** run the existing pbp path (drop `--no-pbp` for a local seed) and add a
`derive-regression-signals` script off `data/vault-seed/nflverse` play-by-play. Free.

### B · Projection / power-rating ensemble — *fills a dead schema field* (Lev 5)

The schema already has `power_rating.market_implied_rank`, `power_rating.model_rank`,
and `power_rating.delta` — but **no source feeds `model_rank`**. `delta`
(market-vs-model) is the purest "where is the market wrong" signal and it is currently
un-computable.

- **Ensemble sources:** ESPN FPI, nfelo, DVOA preseason projections, Sagarin, SRS,
  Massey, PFF projected wins, Football Outsiders / SumerSports. A median of 3–5 gives a
  robust `model_rank` and a defensible market-vs-model `delta`.
- **Why it caps depth:** without an independent model rank, every "market is mispricing
  this team" thesis rests on the model's own training memory — which the prompt
  explicitly distrusts. A quantified `delta` turns hand-waving into `edge_type: thesis`
  with a number behind it.
- **Acquisition:** `import_win_totals` (nflverse, free) gives historical Vegas lines for
  base-rating; FPI/nfelo are scrapeable/free-tier; a few are `MANUAL` snapshot pulls.
- **∆schema:** exists — needs a feeder, not a new field.

### C · Authoritative roster depth — *reframes backlog #3* (Lev 5, FREE-PLUMB)

Backlog #3 proposes *manual* depth-chart confirmation. But nflverse gives this for free:

- **`import_snap_counts`** — prior-season snap % per player: the truest "who actually
  plays" signal, and it quantifies backup dropoff.
- **`import_depth_charts`** — official weekly depth charts, all 32 teams.
- **Returning production %** — % of last season's snaps / receiving yards / carries
  returning (a top-tier preseason predictor of continuity).

**Why it caps depth:** `roster.qb_depth` and `roster.positional_grades` are model-filled
guesses today (`needs_human_review: true` on any roster thesis). Snap-count-weighted
depth turns them into evidence.
**Acquisition:** add `snap_counts` + `depth_charts` to `fetch_nflverse_data.py` (two new
`_read_parquets` entries), derive returning-production from `player_stats_seasonal`
(already fetched). Free.
**Reframe note:** the sprint's manual-confirmation effort should be *reserved for what
nflverse can't give* (camp-battle winners, scheme-fit judgment), not for depth-chart
order the free feed already resolves.

### D · Offensive-line & trench quality (Lev 4)

OL is the largest hidden variable in team quality and the least represented in the
package (`roster.positional_grades.OL` is a lone nullable number).

- **Pass-block / run-block win rate**, sacks & pressures allowed, adjusted line yards,
  stuff rate — `import_pfr_*` advanced (free) covers much; ESPN PBWR/RBWR and PFF grades
  are `PAID`/proxy.
- **OL continuity** — games with the same starting five; a top continuity predictor.
- **Trench differential** — a team's OL vs its schedule of opposing DLs (and vice-versa).

**Proposed field:** `analytics.trench { pass_block_win_rate, run_block_win_rate,
sacks_allowed_rate, ol_continuity_games, pass_rush_win_rate, pressure_rate_generated,
trench_sos }`. Migration 044's `team_analytic_snapshots` already has
`pressure_rate_allowed/generated` and `sack_rate_*` columns — **check if populated**;
if null, this is a plumbing fix, not new schema.

### E · Next Gen Stats & advanced charting (Lev 4, FREE-NEW)

`import_ngs_data` (passing/rushing/receiving) is free and unfetched:

- **Passing:** time-to-throw, aggressiveness, CPOE, air yards, expected completion %.
- **Rushing:** rush yards over expected (RYOE), efficiency, 8-in-the-box rate.
- **Receiving:** separation, cushion, YAC over expected, target share.
- **FTN charting** (already fetched) + PFR add: pressure rate, blitz rate, man/zone
  split, personnel groupings (11/12/21), play-action, RPO.

**Why it caps depth:** lets the model reason about *how* a unit succeeds (scheme-driven
YAC vs contested-catch WR, pressure-proof QB vs clean-pocket-only) — the difference
between a shallow and a sophisticated per-team thesis.

### F · Cross-market coherence / internal arbitrage (Lev 4, FREE-PLUMB)

A team's own markets should imply one consistent win probability. They often don't —
and the model already has all four prices in hand.

- Devig SB, conference, division, playoff, and win-total prices into implied
  probabilities and check **coherence** (e.g., a division price implying 41% while the
  conference price implies a path that requires 48%). Incoherence = a code-detectable,
  pure-math edge — the strongest kind (`edge_type: math`).
- **Anti-correlation across teams** — division rivals' make-playoffs / division prices
  can't all be right; surfaces the softest side.

**Proposed field:** `market_snapshot.cross_market_coherence { implied_win_pct_by_market,
max_divergence, softest_market }`. Code owns the math (aligns with the "code owns
math/correlation" division of labor); the model explains the dislocation.

### G · Derivative & tangential markets (Lev 4)

The package covers SB / conf / div / wins / playoffs / awards / matchup. Missing markets
that carry real convex value and hedging utility:

- **Alternate win-total ladders** (Over 8.5 / 9.5 / 10.5 as a ladder), **exact-win
  totals**, **highest/lowest seed**, **stage-of-elimination**, **to miss playoffs (No)**,
  **first-half win totals**, **division exact order** (already partly ingested S293).
- **Season team totals** — most/fewest points, most points allowed — pair naturally with
  over/under theses.
- **Stat-race markets** — passing-yards / rushing-TD / sack leaders — correlate with team
  success and offer longshot convexity the crown tier wants.
- **Awards depth** — OPOY/DPOY/OROY/DROY/CPOY/COY beyond MVP.

**Acquisition:** mostly `MANUAL` normalization of BKR/BetUS/BetOnline exports (overlaps
backlog #4/#10) + `FREE-NEW` for prediction-market equivalents (domain #1 in the
backlog). **Proposed field:** `market_snapshot.derivatives[]`.

### H · Coordinator track record + scheme-change flags (Lev 4)

`coaching.scheme_offense/defense` are free-text and `coordinator_changes` is an empty
array. Scheme *change* is a leading indicator the package can't currently reason about.

- **Coordinator prior-stop performance** — this OC's offenses' EPA/scoring rank at prior
  jobs; this DC's coverage scheme and prior defensive ranks.
- **Scheme-transition flags** — zone→gap run scheme, Cover-3→Cover-2 shell, air-raid→
  wide-zone — with a personnel-fit note (does the roster match the new scheme?).
- **Play-caller identity & aggressiveness over expected** — 4th-down go rate vs expected,
  timeout/clock management (feeds `coaching.tendencies.fourth_down_tier`, live-totals).

Migration 044's `team_coaching_tendency_snapshots` already models many tendency fields
(`rpo_rate`, `play_action_rate`, `pace_seconds_per_play`, `two_minute_aggression_tier`) —
**verify population**; likely a derive-from-pbp plumbing task via
`derive_coach_tendencies.py`.

### I · Base-rate & calibration priors (Lev 4, FREE-NEW)

The frontier model reasons better when anchored to historical base rates:

- **Win-total hit rates by tier** — how often teams at each preseason win-total line hit
  the over/under (via `import_win_totals`, free, multi-season).
- **Futures conversion base rates** — how often the preseason SB favorite wins, playoff
  rate by preseason odds tier, division-favorite conversion.
- **Regression base rates** — 13+ win teams' next-year record, 4-win teams' bounce-back,
  new-HC first-year swing, rookie-QB team performance.

**Why it caps depth:** turns "this feels high" into "teams priced at 10.5 hit the under
57% since 2015." Feeds run-level calibration and `confidence` grounding.

### J · Schedule environment (Lev 3, mostly FREE-PLUMB)

`schedules.csv` already carries `away_rest`/`home_rest`/`roof`/`surface`/`temp`/`wind`
(migration 039 loaded some). Under-exploited:

- **Travel & body-clock** — miles traveled, timezone crossings, West→East 1pm ET (body-
  clock disadvantage), consecutive road trips. Compute from stadium coords + schedule.
- **Weather exposure** — outdoor cold-weather late slate, dome team going outdoors; the
  inventory flags weather as static prose only. A live forecast feed is `FREE-NEW`
  (NWS/Open-Meteo) closer to kickoff.
- **QB-adjusted SoS** — current SoS is opponent win-total based; adjusting for opponent
  *QB* quality faced (backup-QB softness) is sharper.
- **Schedule variance / clustering** — not just average difficulty but a brutal opening
  4 or a soft close (feeds `schedule.first_quarter_difficulty` / `closing_stretch`).
- **Per-team home-field-advantage magnitude** — HFA isn't uniform (Seattle, KC, Buffalo,
  Denver altitude); derive from historical home margins.

### K · Futures market microstructure (Lev 3)

- **Futures betting splits** — `game_splits` exists for game lines; **futures** ticket%
  vs money% (sharp vs public futures money) is not collected. Reveals where sharp futures
  money sits. `PAID` (splits provider) or scrape.
- **Hold / vig comparison across books** — which book prices the tightest (sharpest)
  market per futures type; a cheap code metric off existing multi-book imports.
- **Opening lines & line origination** — where the number opened vs now (CLV on futures);
  overlaps backlog #8 (odds-movement cadence).

**Proposed field:** `market_snapshot.microstructure { hold_by_book, sharpest_book,
futures_split }`.

### L · Injury sophistication (Lev 3)

Beyond counts and cluster flags:

- **Value-weighted injury impact** — a WAR/snap-weighted severity (losing a top-5 QB ≠
  losing a backup guard), not a raw count.
- **Durability profiles** — chronic-injury-risk players as a season-long risk factor.
- **Practice-participation trend** (DNP/limited/full) — leading indicator ahead of game
  status.
- **Suspensions & holdouts & retirement watch** — inventory flags suspensions as
  entirely missing; Kalshi's `KXNFLRETIRE-*` markets show retirement risk is priced.

`FREE-NEW` (`import_injuries` historical for durability; ESPN practice reports) +
`MANUAL` for suspensions/holdouts.

### M · Special teams (Lev 2, FREE-PLUMB)

`analytics.dvoa.st` is a lone number. Kicker reliability (FG% by distance), return game,
and ST-EPA break outs matter for close-game (one-score) regression and totals. Derivable
from pbp / PFR. Low leverage for futures but cheap.

### N · Roster-construction context (Lev 2, FREE-NEW)

- **Draft capital** (`import_draft_picks`) — premium-position high picks likely to
  contribute.
- **Roster age / aging-curve exposure** — teams on the wrong side of the curve.
- **Cap / contract window** — win-now vs rebuild, notable holdouts (`FREE-NEW` via OTC /
  Spotrac scrape).

**Proposed field:** `roster.construction { draft_capital_index, avg_age_weighted,
contention_window }`.

### O · Broad public sentiment / contrarian breadth (Lev 2)

`x_sharp_tweets` is curated-handle only. A broad social-volume / public-betting-percentage
breadth signal (contrarian indicator) is absent (inventory-flagged). `PAID`/`FREE-NEW`.

---

## What to build first (net-new, ranked)

Ordered by leverage per unit effort, favoring free plumbing:

1. **A · Regression/luck signals** (Lev 5, FREE-PLUMB) — run the pbp path, derive
   turnover/Pythag/one-score/red-zone. Directly powers the *required*
   `thesis.regression_direction`. Biggest depth gain for the least new collection.
2. **C · Authoritative roster depth** (Lev 5, FREE-PLUMB) — add snap_counts +
   depth_charts to the nflverse fetcher; reframes manual backlog #3 as free.
3. **B · Projection ensemble** (Lev 5) — feed the dead `power_rating.model_rank` /
   `delta`; unlocks quantified market-vs-model edge.
4. **F · Cross-market coherence** (Lev 4, FREE-PLUMB) — pure-math edge from data already
   in hand; strongest `edge_type`.
5. **E · NGS** + **D · trench** (Lev 4) — verify migration 044's pressure/sack columns
   are populated; add NGS/PFR fetches for the rest.
6. **I · base rates** + **H · coordinator track record** (Lev 4) — anchor calibration and
   scheme-change reasoning.
7. Everything else as depth polish.

## Free-vs-paid summary

- **FREE (nflverse/public), high-leverage, mostly un-plumbed:** A (regression), C (snap
  counts/depth charts), E (NGS), F (cross-market — own data), I (win-total history/base
  rates), J (travel/weather), M (special teams), N (draft capital), plus much of B, D, H.
- **PAID or MANUAL:** futures betting splits (K), PFF/ESPN win-rate grades (D partial),
  broad public sentiment (O), suspensions/holdouts (L partial), derivative-market
  normalization (G — manual from book exports).

**Bottom line:** the largest depth gains — separating skill from luck (A), authoritative
depth charts (C), a real model rank (B), and internal market arbitrage (F) — are
**free** and mostly a matter of running the pbp path CI skips and adding a handful of
nflverse fetches. The paid/manual items are real but secondary.

---

## Schema deltas proposed (for `FUTURES_PORTFOLIO_MASTER.md` v1.1 consideration)

Non-breaking additions (all nullable), so a stale block stays visible:

- `analytics.regression { … }` (domain A)
- `analytics.trench { … }` (domain D) — or populate existing 044 columns
- `analytics.special_teams { … }` (domain M)
- `market_snapshot.cross_market_coherence { … }` (domain F)
- `market_snapshot.derivatives[]` (domain G)
- `market_snapshot.microstructure { … }` (domain K)
- `roster.construction { … }` (domain N)
- `power_rating.model_rank` / `delta` — **already present; wire a feed** (domain B)

*Docs-only. No prices, picks, schema files, or portfolio state were created or persisted.*
