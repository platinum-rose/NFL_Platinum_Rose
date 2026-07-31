# Handoff — 2026-07-30 — Futures Data-Package Gap Analysis

**Platform:** copilot (VS Code) → next fresh session (any)
**Prereq commit:** `e273e4f` — `docs(futures): add master synthesis prompt with placeable prediction-market venues`
**Working tree:** DIRTY with an active Codex data-gathering sprint (~50 untracked/modified files). **Do NOT `git add -A`.** Commit only files you deliberately create.

---

## Objective (next session)

Run a **deep analysis on the quality and depth of the "data package"** that feeds the
frontier-LLM futures synthesis, and produce a **prioritized data-enhancement backlog**:
which gaps, if filled, most increase the frontier model's ability to run deep,
sophisticated analysis. This is a *synthesis + audit* task — most gaps are already
documented in scattered form; do not re-derive from scratch.

**Deliverable:** a single ranked backlog (leverage × effort), each item mapped to the
specific dossier field(s) it improves (see the v1.0 schema in the master prompt), with
a concrete "how to gather" note and a source-of-truth pointer. Docs-only; no Supabase
writes, no paid/frontier calls, no pick persistence.

---

## What just shipped (this session)

- Created `agents/product/tier1/FUTURES_PORTFOLIO_MASTER.md` — the canonical,
  model-agnostic master synthesis prompt. Four deliverables: 32 per-team dossiers
  (JSON schema v1.0 + MD render), dossier-refresh automation audit, portfolio
  report + act/wait/monitor roadmap, and portfolio-monitor automation audit.
- **Kalshi & Polymarket are now PLACEABLE venues** in the prompt (not just a price
  signal). The cross-venue rule: convert Yes/No cents → **net fee-adjusted** odds via
  `src/lib/predictionMarkets.js` (`calculateNetOdds`; Kalshi fee `0.07·p·(1−p)`,
  Polymarket ~1.5%, order-book **ask**), compare vs best sportsbook price
  (`compareMarketOdds`), route to whichever nets the higher decimal payout **and** has
  liquidity. Dossier fields aligned to the exact engine keys.

## Read FIRST (seed context — do not skip)

1. `agents/product/tier1/FUTURES_PORTFOLIO_MASTER.md` — the target consumer; its
   `## INPUTS` table + dossier schema v1.0 define *what the frontier model needs*.
2. `docs/FUTURES_SYNTHESIS_SOURCE_READINESS_2026-07-30.md`
3. `docs/FUTURES_SYNTHESIS_REQUIREMENT_AUDIT_2026-07-30.md`
4. `docs/FUTURES_PORTFOLIO_FRONTIER_SYNTHESIS_PACKET_2026-07-30.md`
5. Latest `.nfl/source-audit/*.json` + `docs/NFL_INTEL_SOURCE_AUDIT_LATEST.html`
   (current counts: Current 2 / Review 22 / Stale 0 / Context 9)
6. `handoffs/2026-07-30-1612-data-gathering-sprint-checkpoint.md` and
   `handoffs/2026-07-30-1452-data-gathering-sprint-handoff.md` — the in-flight Codex
   sprint (training camp, projected starters, availability digest, prediction-market
   map). **Your analysis must build on this, not duplicate it.**
7. `docs/FUTURES_AGENT_DATA_INVENTORY_2026-07-21.md` — wired vs. unwired sources.

## Data-package assembly (the code that builds the payload)

- `agents/portfolio-dossier.js` — assembles the compact market/team payload.
- `agents/portfolio-synthesize.js` — the committee that consumes it (gold-standard
  `SYSTEM_PROMPT` for reference on what fields matter).
- `src/lib/predictionMarkets.js` + `predictionMarketStore.js` +
  `scripts/build-prediction-market-map.js` — prediction-market engine/mapping.

## Known gaps (starting inventory — validate, quantify, rank, extend)

| # | Gap | Current state | Why it caps frontier depth | Dossier field(s) affected |
| --- | --- | --- | --- | --- |
| 1 | **Prediction-market mapping** | 5 mapped / 132 unmapped contracts | Prompt now treats Kalshi/Polymarket as placeable, but only ~5 NFL contracts route → cross-venue shopping is mostly dark | `market_snapshot.prediction_markets.*` |
| 2 | Training-camp coverage | 10/32 real source; 22/32 need confirmation | Thin scheme/depth/health for 2/3 of league | `coaching.*`, `roster.*` |
| 3 | Projected/likely starters | 307 estimated, 0 manual confirmed | No authoritative depth charts | `roster.qb1/qb_depth/positional_grades` |
| 4 | Podcast/YouTube freshness | Jul 24–30 sweep pending review | Stale/incomplete expert-lean attribution | `intel.expert_backers/podcast_signals` |
| 5 | Raw BKR/BetUS normalization | Partially structured manual imports | Manual book prices not fully machine-usable | `market_snapshot.*.best_price/best_book` |
| 6 | Player availability | 790 events, noisy labels | Injury/availability theses under-trusted | `roster.injuries/player_availability` |
| 7 | 2026 projection baselines | Incomplete | Weak priors for regression theses | `analytics.*`, `power_rating.*` |

**Extend the table** — likely additional gaps to probe: DVOA/EPA snapshot freshness &
coverage, officiating assignments (near-zero preseason), CLV/line-movement history
depth, roster-churn snapshot cadence, strength-of-schedule completeness, coaching
tendency staleness, and futures-market breadth beyond SB/division/wins (awards, exact
matchup liquidity).

## Suggested method

1. For each `## INPUTS` block in the master prompt, score: **coverage** (how many of 32
   teams / N markets populated), **freshness**, **trust** (source-stamped vs inferred),
   **granularity** (enough for a deep thesis?).
2. Cross-reference the source-audit's Review/Context items — those are pre-flagged
   weak spots.
3. Rank by **leverage × effort**: leverage = how much it unlocks frontier depth,
   effort = local-scriptable vs needs new source/manual/paid API.
4. Output the backlog; flag which items are already in the Codex sprint's scope (avoid
   collision) vs genuinely new.

## Guardrails

- Do NOT `git add -A`. The tree has another agent's active sprint. Commit only files
  you author, individually.
- Docs-only analysis. No Supabase writes, no paid/frontier model calls, no pick
  proposals/persistence, no open-parlay changes.
- Hot files (App.jsx, storage.js, picksDatabase.js) require PM lock — not expected for
  this task.

## Resume command

Resume Platinum Rose NFL futures data-package gap analysis. HEAD = e273e4f (main).
Master prompt committed; Kalshi/Polymarket now placeable venues. Task: deep
quality/depth audit of the frontier data package → prioritized enhancement backlog.
Read this handoff's "Read FIRST" list before touching anything. Build on the Codex
data-gathering sprint (tree is dirty — never `git add -A`).
