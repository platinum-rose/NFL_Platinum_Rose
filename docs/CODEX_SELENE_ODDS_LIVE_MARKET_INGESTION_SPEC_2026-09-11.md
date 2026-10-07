# Spec: Under-the-Hood Selene Odds Live Market Ingestion & Best-Price Engine

**Date:** 2026-09-11  
**Status:** ❌ REJECTED pending written authorization and comprehensive redesign (2026-09-11). Recorded in uncommitted working tree pending Andy's review.  
**Review Verdict:** Reject pending authorization and redesign. Prototype rolled back and completely deleted from repository (zero executable code remaining); active pipelines restored to authorized sources.  

---

## Codex Review Verdict & Mandatory Redesign Roadmap

### 1. Legal / Terms of Service Blocker
* The proposed source is an undocumented, reverse-engineered endpoint.
* [Selene Terms of Service](https://app.seleneodds.com/terms) explicitly prohibit automated/robotic access and unauthorized monitoring/copying, treating data feeds as confidential service data.
* An unauthenticated endpoint is not authorization to scrape or automate.
* **Mandatory Requirement**: Obtain written automated-access permission or a licensed data agreement from Selene before any further ingestion or scheduling.
* "Zero quota limits" claim is unsupported; Selene advertises a free board and paid terminal, not an unrestricted public API.

### 2. Technical Findings Recorded & Addressed in Rollback
* **P1 (Premature implementation & complete removal)**: Ingestion agent, tests, and toolbox wiring were created and run prior to authorization. **Action taken**: Completely rolled back from `package.json`, `scripts/toolbox.mjs`, and `scripts/toolbox-app-server.mjs`. All prototype scripts (`agents/selene-odds-ingest.js`, `scratch/prototype-selene-odds-ingest.js`, and tests) have been deleted entirely from the workspace to eliminate any executable code contacting the endpoint. Live snapshot deleted; `data/supercontest/live-market-comparison.json` restored via official `sync-live-market-lines.mjs`. This record and spec exist in the uncommitted working tree awaiting Andy's decision.
* **P1 (Week 1 mislabeling across future slate)**: The endpoint returns 50 fixtures extending through October, but all games were stamped as Week 1 (e.g. `nfl_2026_w01_DAL_at_HOU`). **Required fix**: Must derive each game's canonical week dynamically from `kickoff_utc` using `weekFromDate()` from `packages/shared/src/week-utils.js`.
* **P1 (Game ID format violation)**: Game IDs used non-standard `nfl_2026_w01_AWAY_at_HOME` instead of the canonical `2026_01_HOME_AWAY` format from `buildGameId()`.
* **P1 (Unimplemented props)**: `--include-props` pulled raw data but only parsed spread/ML/total; no player prop schema or output was produced.
* **P1 (Fictional clock schedule)**: Toolbox day cases are manual CLI runners, not automated cron daemons; promised multi-capture Sunday schedule (06:30 and 12:45) was not implemented.
* **P1 (Lack of price freshness & staleness checks)**: No quote timestamps, latency tracking, or stale price exclusion. Monitored venues reported all 6 books even if absent.
* **P2 (Benchmark limitation)**: Promised "Pinnacle and Circa" benchmarking only extracted Pinnacle.
* **P2 (Missing outputs & non-atomic writes)**: No historical snapshots written; writes did not use write-then-rename atomic guards.
* **P2 (SuperContest compatibility unproved)**: Silently returned null if weekly lines were missing; reported completed games as "Event not found".
* **P2 (Incomplete test suite)**: Tests lacked coverage for network errors, pagination, staleness, atomic writes, and multi-week filtering.

### 3. Redesign Approval Conditions
Any future ingestion implementation will be considered for approval only after:
1. Written automated-access or licensed API agreement from Selene is secured.
2. Raw-response fixture and documented schema contract are frozen in `data/fixtures/`.
3. Canonical week derivation and `buildGameId()` compliance are enforced.
4. Quote timestamps, staleness filters, and atomic snapshot writes are implemented.
5. Props and prediction markets are separated into independently gated phases.
6. Toolbox integration remains strictly manual until offline fixture tests pass review.

---

## 1. Executive Summary & Problem Statement

### 1.1 The Problem: Upstream Odds Ingestion Bottlenecks
The repository currently relies on two sources for game-level market odds and SuperContest comparisons:
1. **TheOddsAPI (`agents/game-odds-ingest.js` & `scripts/sync-live-market-lines.mjs`)**:
   - **Severe Quota Throttling**: Free-tier limit of 500 requests/month severely caps automated gameday polling.
   - **Missing Sharp Market Makers**: Does not provide live market feeds for **Pinnacle**, **Circa Sports**, or **BookMaker** on basic tiers.
   - **Missing Prediction Markets**: Zero coverage for **Kalshi** or **Polymarket** contracts.
   - **Zero Player Props**: Excludes all player passing, rushing, receiving, and touchdown markets on standard tiers.
2. **Manual / Static Odds Seeding**: Stale spreads and totals degrade Closing Line Value (CLV) calculations in portfolio synthesis and limit the Betting Agent's ability to identify true best-in-market pricing.

### 1.2 The Solution: Selene Odds Direct REST Ingestion Engine
Through reverse-engineering the production network stack of `app.seleneodds.com`, we discovered that its underlying backend REST API at `https://api.seleneodds.com` is directly queryable:
* **Zero API Key / Zero Quota Limits**: Clean REST endpoints requiring no secret tokens or paid credits for public market reads.
* **33 Monitored Sportsbooks**: Complete simultaneous coverage of sharp market makers (Pinnacle, Circa, BookMaker), direct placeable books (BetOnline, BetUS), proxy placeable books (BetMGM, Caesars), retail reference books (DraftKings, FanDuel), and prediction markets (Kalshi, Polymarket).
* **39 Market Types & 16,000+ Props per Game**: Unlocks full game lines (spreads, moneylines, totals, halves, quarters, team totals) and comprehensive player props.

---

## 2. Hard Scope Boundaries & Architectural Guardrails

To preserve architectural integrity and avoid unintended coupling across subsystems, this specification establishes **strict, non-negotiable boundaries**:

| Boundary Class | Status | Specification Rule |
| :--- | :---: | :--- |
| **Live Sunday Tracker** | 🚫 **OFF-LIMITS** | **Zero modifications** to `public/live-tracker-sunday.html` or `scripts/generate-live-tracker.mjs`. The Sunday Tracker remains strictly an operational gameday tool for live parlay ticket tracking, player gauge tracking, and the Alejandro ledger. |
| **Fantasy & Yahoo Ingestion** | 🚫 **OFF-LIMITS** | **Zero modifications** to any fantasy league or Yahoo scraper/ingest files. Standing repository rule: all fantasy files remain untouched. |
| **Sportsbook Account Mutation** | 🚫 **OFF-LIMITS** | Ingestion is **strictly read-only**. No betting execution, automated bet slips, or credential writes. |
| **Execution Venue Compliance** | ✅ **MANDATORY** | All ingested odds **MUST** be filtered and categorized strictly according to `src/lib/executionVenues.js`. Market-context-only books (DraftKings, FanDuel) must **never** be labeled as executable best prices. |
| **Local-First & Offline Safe** | ✅ **MANDATORY** | The ingestion engine must fail gracefully (zero unhandled exceptions) if the external API is unreachable or offline. It must save locally to `data/odds/` and `data/supercontest/`. |

---

## 3. Execution Venue Registry Mapping & Price Governance

Per Andy's authoritative `src/lib/executionVenues.js`, all sportsbooks ingested from Selene Odds are partitioned into three immutable tiers:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SELENE ODDS INGESTION STREAM                                 │
│                           33 Sportsbooks Captured via REST API                                │
└───────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
   ┌───────────────────────────┐  ┌───────────────────────────┐  ┌───────────────────────────┐
   │    PLACEABLE VENUES       │  │   BENCHMARK & CONTEXT     │  │    PREDICTION MARKETS     │
   │  (Eligible for Best Price)│  │ (Fair Value Reference)    │  │(Implied Probability Check)│
   ├───────────────────────────┤  ├───────────────────────────┤  ├───────────────────────────┤
   │ Direct:                   │  │ • Pinnacle (Sharp anchor) │  │ • Kalshi                  │
   │ • BookMaker (bookmaker)   │  │ • DraftKings (draftkings) │  │ • Polymarket (polymarket) │
   │ • BetOnline (betonline)   │  │ • FanDuel (fanduel)       │  │ • Polymarket US           │
   │ • BetUS (betus)           │  │ • Novig                   │  └───────────────────────────┘
   │                           │  │ • Rebet, Fliff, etc.      │
   │ Proxy:                    │  └───────────────────────────┘
   │ • Circa Sports (circa)    │
   │ • Caesars (caesars)       │
   │ • BetMGM (betmgm)         │
   └───────────────────────────┘
```

### 3.1 Pricing Algorithm: `best_placeable_price` vs `market_consensus`
For every game spread, total, and moneyline:
1. **Best Placeable Price Calculation**:
   - Filter available quotes exclusively to the 6 placeable books (`bookmaker`, `betonline`, `betus`, `circa`, `caesars`, `betmgm`).
   - For **Spreads**: Identify the book offering the most favorable spread hook; if tied on line, select the lowest juice (e.g. `CIN -3.5 (-100)` at BookMaker vs `CIN -3.5 (-110)` at Caesars).
   - For **Moneylines**: Identify the book offering the highest decimal/American payout (e.g. `TB (+180)` at BetOnline vs `TB (+170)` at BetMGM).
   - For **Totals**: Identify best Over (lowest total / least juice) and best Under (highest total / least juice).
2. **Sharp Benchmark & Devigged Fair Value**:
   - Extract the two-way line from **Pinnacle** and **Circa Sports**.
   - Calculate the devigged (no-vig) win probability:
     $$\text{Implied Prob}_1 = \frac{|\text{price}_1|}{|\text{price}_1| + 100} \quad \text{(if negative)}$$
     $$\text{Fair Prob} = \frac{\text{Implied Prob}}{\sum \text{Implied Probs}}$$
3. **Edge Identification**:
   - Compare the best placeable price against the devigged sharp benchmark.
   - If Placeable Implied Prob < Fair Benchmark Prob, calculate edge in basis points / cents.

---

## 4. System Architecture & Ingestion Pipeline

### 4.1 New Ingestion Agent: `agents/selene-odds-ingest.js`
A standalone Node.js ES module with zero external scraping dependencies (uses native `fetch`):

* **CLI Signature**:
  ```powershell
  node agents/selene-odds-ingest.js [--season 2026] [--week 1] [--include-props] [--dry-run]
  ```
* **Target Output Files**:
  1. `data/odds/live-market-odds-latest.json`: Master snapshot of all active games, placeable best prices, consensus lines, and sharp benchmarks.
  2. `data/supercontest/live-market-comparison.json`: Updates existing SuperContest comparison file with live consensus lines and CLV deltas, fully replacing the quota-capped TheOddsAPI script.
  3. `data/odds/snapshots/market-odds-YYYY-MM-DD-HHmm.json`: Historical time-series snapshot for Closing Line Value audit.

### 4.2 Target Data Contract (`live-market-odds-latest.json`)
```json
{
  "schema": "selene_live_market_odds_v1",
  "generated_at": "2026-09-11T20:30:00.000Z",
  "season": 2026,
  "week": 1,
  "game_count": 16,
  "books_scanned": 24,
  "placeable_venues_monitored": ["bookmaker", "betonline", "circa", "caesars", "betmgm"],
  "games": [
    {
      "game_id": "nfl_2026_w01_TB_at_CIN",
      "fixture_id": "20260913459E30BF",
      "kickoff_utc": "2026-09-13T17:00:00.000Z",
      "away_team": "TB",
      "home_team": "CIN",
      "consensus": {
        "spread": -3.5,
        "total": 50.5,
        "home_ml": -185,
        "away_ml": +160
      },
      "sharp_benchmark": {
        "pinnacle": {
          "spread": { "line": -3.5, "home_price": -105, "away_price": -105 },
          "moneyline": { "home_price": -182, "away_price": +155 },
          "total": { "line": 50.5, "over_price": -108, "under_price": -108 }
        },
        "devigged_fair_home_prob": 0.618
      },
      "best_placeable": {
        "home_spread": { "book": "bookmaker", "line": -3.5, "price": -100 },
        "away_spread": { "book": "circa", "line": +4.0, "price": -110 },
        "home_ml": { "book": "betonline", "price": -175 },
        "away_ml": { "book": "bookmaker", "price": +180 },
        "total_over": { "book": "caesars", "line": 50.0, "price": -110 },
        "total_under": { "book": "betmgm", "line": 50.5, "price": -105 }
      },
      "prediction_markets": {
        "kalshi": { "under_50_5_price": -116, "max_liquidity": 12674.99 },
        "polymarket": { "home_win_prob": 0.645, "max_liquidity": 7695.48 }
      }
    }
  ]
}
```

---

## 5. Automated Gameday Firing Cadence

The ingestion engine is integrated into `scripts/toolbox.mjs` and scheduled for execution during critical market windows:

| Day & Time | Operational Event | Pipeline Action | Consuming Subsystems |
| :--- | :--- | :--- | :--- |
| **Thursday 15:00 PT** | Pre-TNF Kickoff Freeze | `node agents/selene-odds-ingest.js --include-props` | Locks TNF best prices; updates SuperContest lines |
| **Saturday 20:00 PT** | Pre-Sunday Card Lock | `node agents/selene-odds-ingest.js` | Audits sharp CLV line moves for Official Pick Ledger |
| **Sunday 06:30 PT** | Early Slate Steam Check | `node agents/selene-odds-ingest.js` | Final pre-kickoff best executable price check |
| **Sunday 12:45 PT** | Late Slate Line Refresh | `node agents/selene-odds-ingest.js` | Afternoon game line freeze |
| **Monday 15:00 PT** | Pre-MNF Kickoff Freeze | `node agents/selene-odds-ingest.js` | Final MNF line capture |

### 5.1 Toolbox Integration
In `scripts/toolbox.mjs`:
* In `case 'thursday':`, replace `sync-live-market-lines.mjs` with `node agents/selene-odds-ingest.js`.
* In `case 'saturday':`, run `node agents/selene-odds-ingest.js` during Card Lock.
* In `case 'sunday':`, run `node agents/selene-odds-ingest.js` as step 1.5 (before Tracker compilation, without polluting Tracker UI).

---

## 6. Verification & Test Plan

1. **Unit Test Suite (`tests/unit/seleneOddsIngest.test.js`)**:
   * **Venue Rule Enforcement**: Verifies that `best_placeable` strictly pulls from `SPORTSBOOK_VENUES` (`access: 'direct'` or `'proxy'`) and never selects `draftkings` or `fanduel`.
   * **Normalization & Mapping**: Asserts that all 32 NFL teams correctly normalize through `src/lib/teams.js` and match canonical game IDs.
   * **Offline Resilience**: Tests graceful mock fallback when network requests fail or return non-200 responses.
   * **Pricing & Devigging Accuracy**: Validates mathematical precision of two-way devigging formulas.
2. **Full Test Suite Gate**:
   * Running `npx vitest run` must maintain **100% green pass rate** across all test files.
3. **Dry-Run CLI Execution**:
   * Executing `node agents/selene-odds-ingest.js --dry-run` must output formatted price comparisons to stdout with zero file mutations.

---

## 7. Codex Review Request & Authorization Checklist

Codex team is requested to review this specification against repository guardrails:
- [ ] Conformance to `RULES.md` and venue governance in `src/lib/executionVenues.js`.
- [ ] Confirmation that `public/live-tracker-sunday.html` remains completely untouched.
- [ ] Schema validation for `data/odds/live-market-odds-latest.json` and SuperContest compatibility.
- [ ] Absence of unauthenticated Supabase writes or paid third-party API mutations.
