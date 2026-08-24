# Futures Data-Package Enhancement Backlog — 2026-07-30

**Author:** Copilot (VS Code) analysis session · HEAD `bb99351` (main)
**Scope:** Docs-only. No Supabase writes, no paid/frontier model calls, no pick
persistence, no `git add -A`. Builds on the active Codex data-gathering sprint
(`handoffs/2026-07-30-1452-…` + `-1612-…`) — does **not** duplicate it.

**Consumer of this analysis:** `agents/product/tier1/FUTURES_PORTFOLIO_MASTER.md`
dossier schema **v1.0**. Every gap below is mapped to the exact dossier field(s) it
feeds so the frontier model's blind spots are traceable.

---

## TL;DR — the one thing that matters most

The handoff's headline gap — *"prediction-market mapping: 5 mapped / 132 unmapped"* —
is **a symptom, not the root cause.** The binding constraint is **feed acquisition,
not contract mapping.** The mapper (`build-prediction-market-map.js`) is working
correctly; it is being **starved of NFL contracts upstream**.

Verified against `data/prediction-markets/latest.json` (137 contracts) this session:

| Fact | Evidence |
| --- | --- |
| Kalshi NFL contracts present are **novelty-only** | The 5 "mapped" are all `KXNFLENDSTREAK-40NYJ-*` ("which season will the Jets *next* make the playoffs") — a multi-season endstreak market, **not** the 2026 make-playoffs market. Remaining NFL-tagged Kalshi rows are `KXNFLRETIRE-*` player-retirement props (Wilson, Stafford, Evans, Henry…). |
| **Zero** core NFL futures contracts in the feed | No Super Bowl champion, division, conference, or win-total Kalshi contracts appear at all. The 132 "unmapped" are overwhelmingly `KXUSCPIYEAR-*` CPI inflation markets — non-NFL noise the mapper correctly rejects. |
| **Zero** Polymarket NFL contracts | All 41 Polymarket rows are geopolitics / crypto / celebrity (Macron, NATO, GTA VI, Taylor Swift). The NFL query is being ignored. |

**Root cause in code** (`scripts/build-prediction-markets.js`):

- **Kalshi:** fetches `GET /events?limit=100` (a generic, unsorted first-100 slice)
  then keyword-filters for `nfl|football|super bowl`. It never targets the NFL
  **series tickers** where the real markets live, so it never reaches Super Bowl,
  division, conference, or win-total series. The 15-event cap compounds this.
- **Polymarket:** fetches `GET /events?query=NFL&closed=false`. The gamma-api
  `/events` endpoint **does not support a `query` param** — it silently returns
  trending events, which is why 41 unrelated markets land in the feed.

**Consequence for the frontier model:** the master prompt (§3 "Placeable venues") now
treats Kalshi/Polymarket as **placeable** and requires every recommendation to be
shopped across both venue classes (`self_check.net_payout_shopped_across_venues`,
`market_snapshot.prediction_markets.vs_sportsbook`). With the feed starved, that entire
cross-venue discipline **runs dark** — the model has no NFL prediction-market prices to
compare against sportsbook prices for 31 of 32 teams and for every market except a Jets
novelty. This is the single highest-leverage fix in the backlog.

---

## Method

For each `## INPUTS` block in the master prompt, the block was scored on four axes:
**coverage** (teams/markets populated), **freshness** (as-of date vs. useful window),
**trust** (source-stamped vs. inferred), **granularity** (deep enough for a thesis).
Findings were cross-referenced against the source-audit (Current 2 / Review 22 /
Context 9) and the Codex sprint's completed vs. deferred workstreams, then ranked by
**leverage × effort**.

- **Leverage** = how much filling the gap unlocks *frontier depth* (1–5).
- **Effort** = `LOW` (local-scriptable, free/public data) · `MED` (semi-manual or new
  local source) · `HIGH` (sustained manual curation or paid API).
- **Codex flag** = `NEW` (not in sprint), `EXTENDS` (sprint built a layer, this is the
  next step it deferred), or `IN-SPRINT` (sprint already owns it — avoid collision).

Two "gaps" are called out separately as **preseason-inherent** — they are structurally
empty today and self-heal once Week 1 is played; do not spend effort forcing them now.

---

## Ranked backlog (leverage × effort)

| # | Gap | Leverage | Effort | Priority | Codex flag | Dossier field(s) |
| --- | --- | :---: | :---: | :---: | --- | --- |
| 1 | **PM feed acquisition** (target NFL series/tags) | 5 | LOW–MED | **P0** | NEW | `market_snapshot.prediction_markets.best_contract.*` · `…vs_sportsbook.*` |
| 2 | **2026 projection baseline layer** | 5 | MED | **P0** | EXTENDS (deferred WS#5) | `power_rating.*` · `analytics.prior.*` · `thesis.market_vs_model_gap` |
| 3 | Projected/likely starters — authoritative confirm | 4 | MED | P1 | EXTENDS | `roster.qb1` · `roster.qb_depth` · `roster.positional_grades` |
| 4 | Raw book normalization — awards/exactas/No-side | 4 | MED | P1 | IN-SPRINT (next step) | `market_snapshot.awards[]` · `superbowl_matchup` · `playoffs` |
| 5 | Super Bowl **exact-matchup** two-team liquidity | 4 | MED | P1 | NEW | `superbowl_matchup` (anchor: Bills×Packers exacta live) |
| 6 | Training-camp true source coverage (22/32) | 3 | MED–HIGH | P2 | IN-SPRINT | `coaching.*` · `roster.*` |
| 7 | Podcast/YouTube freshness reconciliation | 3 | LOW–MED | P2 | IN-SPRINT (next step) | `intel.expert_backers` · `intel.podcast_signals` |
| 8 | Futures **odds-movement** time-series depth | 3 | LOW | P2 | NEW | `market_snapshot.line_movement.*` |
| 9 | Player-availability label denoising | 2 | LOW | P3 | EXTENDS | `roster.injuries` · `roster.player_availability` |
| 10 | Awards-market breadth (MVP/OPOY/OROY…) | 2 | MED | P3 | NEW | `market_snapshot.awards[]` · `intel.lean_by_market` |
| — | *Analytics / EPA / officiating / CLV* | — | — | **wait** | preseason-inherent | `analytics.*` · `officiating_context.*` · `clv_signal.*` |

---

## Model-tier routing

Per `.claude/rules/model-tiering.md`. Tiers: `code` (deterministic, no LLM) ·
`flash` (extract/classify/normalize) · `standard` (moderate judgment) ·
`frontier` (synthesis/strategy). Compound = pipeline.

| # | Gap | Model tier | Rationale |
| --- | --- | --- | --- |
| 1 | PM feed acquisition | `code + flash` | Code targets NFL series/tags; flash classifies contract → team + market_type |
| 2 | 2026 projection baseline | `code` | Data ingest / seed; deterministic |
| 3 | Projected starters — authoritative confirm | `code + flash` | nflverse depth_charts/snap_counts (code) + flash to confirm starter language from intel text |
| 4 | Raw book normalization (awards/exactas/No-side) | `flash` | Parse messy odds exports → fixed JSON schema |
| 5 | SB exact-matchup two-team liquidity | `code` | Odds join / liquidity math |
| 6 | Training-camp source coverage | `flash` | Extract + `signal_type`-tag camp notes from articles/transcripts |
| 7 | Podcast/YouTube freshness | `flash` | Date, dedup, relevance-classify transcripts |
| 8 | Futures odds-movement time-series | `code` | Snapshot diff / time-series build |
| 9 | Player-availability label denoising | `flash` | Classification cleanup over noisy labels |
| 10 | Awards-market breadth | `code + flash` | Ingest (code) + contract mapping (flash) |
| — | Final dossier synthesis (consumer) | `frontier` | 3-stage analyst committee in `portfolio-synthesize.js` |

---

## Implementation status — updated 2026-07-30 (Gemini/Codex Flash suite, commit `0030cf9`)

The parallel Gemini/Codex agent shipped the **flash ingestion tier** — every task tagged
`flash` (or the flash half of a compound task) is now built. The `code`-tier items,
including the **P0 upstream feed fix**, remain open.

| # | Gap | Tier | Status | Engine / note |
| --- | --- | --- | :---: | --- |
| 1 | PM feed acquisition | `code + flash` | ⬜ **P0 OPEN** (flash half ✅) | `build-prediction-market-map.js` classifies contracts ✅ — but the **upstream `code` fetch is still starved** (`build-prediction-markets.js:58` unchanged). See fix spec: `docs/PREDICTION_MARKET_FEED_FIX_SPEC_2026-07-30.md` |
| 2 | 2026 projection baseline | `code` | ⬜ OPEN | Deterministic compose-from-local; not covered by a flash suite |
| 3 | Projected starters — confirm | `code + flash` | ◐ PARTIAL | `build-projected-starters.js` (0 conflicts) ✅ flash confirm; **nflverse `import_depth_charts`/`import_snap_counts` `code` half still open** (see Expansion C) |
| 4 | Raw book normalization | `flash` | ✅ **DONE** | `build-sportsbook-exports-normalizer.js` — 3,352 records (awards/exactas/derivatives) |
| 5 | SB exact-matchup liquidity | `code` | ⬜ OPEN | Odds join / liquidity math |
| 6 | Training-camp coverage | `flash` | ✅ **DONE** | `build-host-citations.js` + `training-camp-rss-scout.js` |
| 7 | Podcast/YouTube freshness | `flash` | ✅ **DONE** | `build-host-citations.js` — 1,496 citations |
| 8 | Futures odds-movement series | `code` | ⬜ OPEN | Cadence / snapshot-diff plumbing |
| 9 | Availability denoising | `flash` | ✅ **DONE** | `build-player-availability.js` |
| 10 | Awards-market breadth | `code + flash` | ✅ **DONE** (flash half) | classification via normalizer; `code` ingest folds into #4 |
| — | Final synthesis | `frontier` | ⬜ downstream | 3-stage committee, consumes the above |

**Net:** flash ingestion tier ✅ (#4/#6/#7/#9/#10 + PM classify + starter confirm). The
single highest-leverage item — **#1 upstream feed acquisition (`code`)** — is **not**
addressed by the flash suite and remains the top open work. Other open `code` items:
backlog #2, #5, #8, plus the depth-expansion `code` domains (A regression, B
power-rating, C nflverse depth, F cross-market coherence).

---

## Detail (highest leverage first)

### P0 · #1 — Prediction-market **feed acquisition** — ⬜ OPEN (`code`; flash half ✅)

*Reframes handoff Gap #1. The mapper is fine; the fetch is starved.*

> **Status 2026-07-30:** the `flash` classification half is ✅ done
> (`scripts/build-prediction-market-map.js`, commit `0030cf9`). The **`code` upstream
> fetch fix remains OPEN** — `build-prediction-markets.js:58` still uses the generic
> `events?limit=100` keyword filter and never targets NFL series tickers. Full
> implementation spec: **`docs/PREDICTION_MARKET_FEED_FIX_SPEC_2026-07-30.md`**.

- **Current state:** 5 mapped contracts (all Jets endstreak novelty), 0 core NFL
  markets, 0 Polymarket NFL. 48 liquidity warnings on a feed that is 96% non-NFL.
- **Why it caps depth:** the master prompt's cross-venue best-price rule (§3) and its
  self-check (`net_payout_shopped_across_venues`) are unsatisfiable — no NFL PM prices
  exist to compare against the sportsbook `best_price`. The model can only ever emit
  `betterMarket: sportsbook` by default, defeating the placeable-PM upgrade shipped in
  `e273e4f`.
- **How to gather** (local-scriptable, free public APIs — no paid tier):
  1. **Kalshi** — replace the generic `events?limit=100` slice with **series-targeted**
     fetches. Enumerate NFL series tickers (Super Bowl champion, AFC/NFC conference,
     the 8 division series, win-total series, make-playoffs) via
     `GET /series?category=Sports` (or hard-code the known `KXNFL*` series roots), then
     `GET /markets?series_ticker=<root>&status=open` with pagination (`cursor`). This
     reaches the outright markets the current code structurally cannot see.
  2. **Polymarket** — drop the unsupported `?query=NFL`. Use tag-based discovery:
     `GET /events?tag_id=<NFL tag>&closed=false&limit=…` (resolve the NFL tag id once
     via `/tags`), or `GET /public-search?q=Super%20Bowl`. Pull the multi-outcome
     "Super Bowl Champion 2027" and division-winner events, whose `markets[]` each carry
     a team outcome.
  3. Re-run `prediction-markets:map` — the existing mapper + `calculateNetOdds` /
     `compareMarketOdds` engine then works end-to-end with real inputs.
- **Source of truth:** `scripts/build-prediction-markets.js` (fetch);
  `scripts/build-prediction-market-map.js` (map); math in `src/lib/predictionMarkets.js`.
- **Codex flag:** **NEW.** The Codex sprint delivered the *mapper* (correctly). This is
  the distinct **upstream** fix it did not touch — complements, does not duplicate.
- **Acceptance:** ≥1 real Kalshi Super Bowl/division/conference/win-total contract per
  contending team, and ≥1 Polymarket Super Bowl champion multi-outcome event, flowing
  into `team_market_map_latest.json` with `mapped: true` and non-null `net_american_odds`.

### P0 · #2 — 2026 projection baseline layer

*Codex sprint workstream #5 — explicitly deferred, file confirmed absent this session.*

- **Current state:** does **not** exist
  (`data/generated/team-profiles/team-2026-preseason-projection-baseline.json` not
  present). Priors are scattered across DVOA-2025 (`data/vault-seed/dvoa/dvoa-2025.json`,
  32 teams — the correct last-completed-season prior), market-implied win totals, and
  roster/availability layers, but never composited per team.
- **Why it caps depth:** without a structured `known / estimated / missing` baseline per
  team, the model has no coherent prior to anchor regression theses on
  (`thesis.regression_direction`, `power_rating.model_rank`, `analytics.prior`). It falls
  back to stale training memory (which the prompt explicitly distrusts).
- **How to gather:** compose the artifacts that already exist locally — DVOA-2025,
  July-29 market-implied win totals, projected starters, availability digest,
  coaching/scheme notes, SoS — into one per-team baseline with explicit `known`,
  `estimated`, `missing` fields. Local-scriptable; no new source.
- **Source of truth:** Codex sprint handoff §"Add 2026 Projection Baseline Layer";
  feeds `power_rating.*` and `analytics.prior.*`.
- **Codex flag:** **EXTENDS** — sprint sequenced it (order step 7) but deferred it; this
  is the next genuine build, not a duplicate.

### P1 · #3 — Projected/likely starters, authoritative confirmation — ◐ PARTIAL (`code + flash`)

> **Flash confirm delivered 2026-07-30** by `scripts/build-projected-starters.js`
> (commit `0030cf9`, 0 starter conflicts). **Still open (`code`):** it consumes
> `manual_depth_chart_rows`, not the free nflverse `import_depth_charts` /
> `import_snap_counts` feeds — see Depth Expansion domain **C**.

- **Current state:** 307 **estimated** signals across 32 teams, **0 manually confirmed**
  depth-chart rows (`data/projected-starters/2026/latest.json`). Research context only.
- **Why it caps depth:** `roster.qb1`, `roster.qb_depth`, `roster.positional_grades`
  currently rest on inference — the model cannot trust a QB1/OL thesis, forcing
  `needs_human_review: true` on any roster-driven angle.
- **How to gather:** consensus-score ESPN + Ourlads + RotoWire + FantasyPros all-32 depth
  charts against the existing estimator; promote high-agreement rows to
  `starter_confidence: confirmed`.
- **Codex flag:** **EXTENDS** — sprint built the estimator; manual confirmation is the
  deferred next layer.

### P1 · #4 — Raw BKR/BetUS/BetOnline normalization expansion — ✅ DONE (`flash`)

> **Delivered 2026-07-30** by `scripts/build-sportsbook-exports-normalizer.js` (commit
> `0030cf9`) — 3,352 odds records normalized across awards/exactas/derivatives.

- **Current state:** core markets normalized (BetUS 416 / Bookmaker 128 / BetOnline 160
  rows). Missing: BetOnline **playoff No-side** (lives only in the manual-review MD, not
  the import), BKR/BetUS **exactas** and **alternate win ladders**, **award** and
  **stat-race** markets.
- **Why it caps depth:** `market_snapshot.awards[]`, the `superbowl_matchup` exacta, and
  playoff No pricing are machine-invisible, so the model can't shop or size them.
- **How to gather:** extend `scripts/parse-futures-text.js` / the BetOnline importer to
  emit these market types as structured (inference-tagged) rows; validate by
  book/market/team counts.
- **Codex flag:** **IN-SPRINT** — named as the sprint's explicit next step. Coordinate;
  do not race it.

### P1 · #5 — Super Bowl exact-matchup two-team liquidity

- **Current state:** BetUS carries `superbowl_matchup` rows; BetOnline's July-29 bundle
  does **not**. Exactas are monitor-only pending secondary price-shopping validation.
- **Why it caps depth:** the **live anchor** is a Bills×Packers exacta at +6500 ($100).
  Deliverable 3 requires the model to insure the anchors, but with one-book exact-matchup
  coverage it cannot cross-shop or hedge the crown tier.
- **How to gather:** add a second placeable book's exact-matchup grid (or a Kalshi/Poly
  matchup contract if one surfaces from #1); resolve against actual two-team rows.
- **Codex flag:** **NEW.**

### P2 · #6 — Training-camp true source coverage — ✅ DONE (`flash`)

> **Delivered 2026-07-30** by `scripts/build-host-citations.js` +
> `agents/training-camp-rss-scout.js` (commit `0030cf9`).

- **Current state:** 32/32 teams have *local context* after the sprint's coverage-fill,
  but only **10/32** carry source-stamped camp intel; 22/32 still need real
  confirmation (10 article-fill-ready, 12 availability-only). Anchors GB & KC are
  availability-only.
- **Why it caps depth:** `coaching.scheme_*`, `coaching.tendencies`, and camp-driven
  `roster` health for 2/3 of the league are thin/inferred.
- **Codex flag:** **IN-SPRINT** — sprint owns coverage-fill; the residual 22-team
  source confirmation is its open remainder.

### P2 · #7 — Podcast/YouTube freshness reconciliation — ✅ DONE (`flash`)

> **Delivered 2026-07-30** by `scripts/build-host-citations.js` (commit `0030cf9`) —
> 1,496 dated podcast citations classified.

- **Current state:** Jul 24–30 sweep pending review; YouTube review lane shows 46
  pending + 3 needs-review (45 promoted, 10 rejected, 11 context) against anchor-team
  gaps. Podcast base is 57 episodes through Jul 23.
- **Why it caps depth:** `intel.expert_backers` / `intel.podcast_signals` under-attribute
  current expert lean, especially for BUF/GB/KC/CIN/NO/NYG.
- **Codex flag:** **IN-SPRINT** — sprint's recommended next step; keep pending/rejected
  rows out of accepted summaries.

### P2 · #8 — Futures odds-movement time-series depth

- **Current state:** only discrete manual snapshots (7/14, 7/21, 7/29). No dense series,
  so `market_snapshot.line_movement.window_7d/30d/direction` is largely null.
- **Why it caps depth:** the model can't detect steam/drift or stale prices — a core
  `edge_type: stale_price` signal — without movement history.
- **How to gather:** the plumbing exists (`getFuturesOddsHistory()` /
  `get_futures_odds_movement`); this is a **cadence** problem — schedule regular futures
  snapshots so a real series accumulates. LOW effort, compounding value.
- **Codex flag:** **NEW.**

### P3 · #9 — Player-availability label denoising — ✅ DONE (`flash`)

> **Delivered 2026-07-30** by `scripts/build-player-availability.js` (commit `0030cf9`).

- **Current state:** 620 digest events from 790 raw (307 starter-matched); classification
  warnings explicit where labels conflict with text.
- **Why it caps depth:** noisy Active/Questionable/limited labels make injury theses
  under-trusted (`roster.injuries`, `roster.player_availability`).
- **Codex flag:** **EXTENDS** — digest built; label refinement is incremental.

### P3 · #10 — Awards-market breadth — ✅ DONE (flash half) (`code + flash`)

> **Flash half delivered 2026-07-30** by `scripts/build-sportsbook-exports-normalizer.js`
> (commit `0030cf9`); the `code` ingest folds into #4.

- **Current state:** award schema fields exist (`market_snapshot.awards[]`,
  `intel.lean_by_market`), TheOddsAPI returned 14/15 futures markets unavailable, and
  award prices aren't normalized from the July book exports.
- **Codex flag:** **NEW** (overlaps #4's award sub-item).

---

## Preseason-inherent — do **not** force now (self-heal in-season)

These blocks are structurally empty in late July and fill automatically once games are
played. Effort spent forcing them is wasted; flag as `wait` in the roadmap.

- **`analytics.*` (EPA, success rate, CPOE, explosive, pressure/sack, formation):**
  `currentAnalytics()` correctly returns `null` (not zeros) for an unpopulated 2026
  season. Populates after Week 1 via `player-stats-ingest.js`. **Prior is covered** —
  DVOA-2025 (32 teams) is the correct preseason baseline and is already local.
- **`officiating_context.*`:** referee assignments don't exist until ~kickoff each week;
  near-zero coverage preseason is expected. Small-sample rules in the prompt already
  guard it.
- **`clv_signal.*`:** requires tracked game-line open→close history; accrues in-season.
  The prompt already forbids either signal from carrying a thesis alone.

---

## Collision map vs. the Codex sprint (avoid duplication)

| Backlog # | Codex sprint status | This session's non-overlapping contribution |
| --- | --- | --- |
| 1 (PM feed) | Built the *mapper* | Identifies the **upstream fetch** as the true constraint — untouched by sprint |
| 2 (projection baseline) | Deferred (WS#5) | Confirms absence; specifies compose-from-local recipe |
| 3 (starters) | Built estimator | Specifies authoritative-confirmation layer |
| 4 (book normalization) | Named next step | Maps each missing market type to a dossier field |
| 5 (exact matchup) | Not in sprint | New — anchor-critical |
| 6 (training camp) | Owns coverage-fill | Quantifies residual 22/32 to dossier fields |
| 7 (podcast/YouTube) | Named next step | Quantifies review backlog + anchor gaps |
| 8 (odds movement) | Not in sprint | New — cadence fix, LOW effort |
| 9 (availability denoise) | Built digest | Incremental refinement scope |
| 10 (awards) | Not in sprint | New |

---

## Recommended sequence

1. **#1 PM feed acquisition** — highest leverage, unblocks the whole cross-venue
   discipline; free/public APIs; genuinely new vs. Codex.
2. **#2 projection baseline** — highest-leverage *content* gap; composes existing local
   evidence.
3. Let the Codex sprint finish **#4, #6, #7** (it already owns them).
4. Layer **#3, #5, #8** as independent local scripts.
5. Treat **#9, #10** as polish; leave the preseason-inherent blocks to self-heal.

*Docs-only deliverable. No prices, picks, or portfolio state were created or persisted.*
