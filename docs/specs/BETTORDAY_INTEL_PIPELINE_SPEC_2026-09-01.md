# 🏈 BettorDay Intelligence Pipeline: Technical Architecture & Specification

**Document Title**: NFL Dashboard BettorDay Holistic Intel Pipeline Specification  
**Date**: September 1, 2026 (revised September 2, 2026 per audit findings)  
**Audience**: Claude Engineering Team, Data Architects & System Evaluators  
**Status**: Pre-Production Review / Audited  
**Corpus Root**: `e:/dev/projects/NFL_Dashboard`  

---

## 1. Executive Summary & Source Description

**Source Name**: BettorDay ("32 in 32" Daily Preseason Newsletters & In-Season Matchup/Trench Reports)  
**Host / Platform**: Ghost CMS (`https://www.bettorday.com`)  
**Publication Cadence**: Daily (Mon–Fri 6:00 AM ET) during preseason & regular season  
**Primary Authors**: Scott Seidenberg, Michael Fiddle, David Bearman, AJ Hoffman, Mackenzie Rivers  

### Core Value to the NFL Intel Ecosystem
While traditionally betting-focused, BettorDay provides distinct, high-value signals across multiple dimensions of the NFL Dashboard:

1. **The Trench Engine (O-Line vs. D-Line Composites):**
   - Quantified z-scores across two distinct 32-team datasets:
     - **Team Quality Composites (`metric_type='team_composite'`):** Raw line-of-scrimmage power ratings across **Run Block (RB)**, **Pass Block (PB)**, **Run Defense (RD)**, and **Pass Rush (PR)**.
     - **Schedule Difficulty SOS (`metric_type='schedule_sos'`):** Strength of opposing line units faced over the 2026 schedule (`vs_run_def_z`, `vs_pass_rush_z`, `vs_run_block_z`, `vs_pass_block_z`).
   - Cross-impacts offensive RB efficiency, QB sack/pressure risk, defensive DST ceilings, and IDP linebacker clean-pursuit lanes.
2. **Game Script & Regression Trajectories:**
   - Evaluates market win totals and pricing inefficiencies to identify positive/negative game-script funnels:
     - **Miami Dolphins (`monday-august-31st-2026`):** Win total 3.5; market betting them for fewest wins (+270), funneling trailing pass-game script.
     - **Minnesota Vikings (`friday-august-21st-2026`):** 11 of 17 games indoors with Kyler Murray under center, elevating offensive volume and efficiency floor.
     - **Los Angeles Rams (`tuesday-september-1st-2026`):** Market pricing warning — Stafford (MVP), Puka Nacua, and Davante Adams all hit 95th-percentile ceiling outcomes in 2025; regression risk unpriced by market.
     - **Denver Broncos (`thursday-august-6th-2026`):** 14-win regression candidate — market pricing them for step back after overperforming underlying metrics.
3. **Personnel, Scheme & Injury Severity Signals:**
   - **Ashton Jeanty / LV (`monday-august-24th-2026`, `tuesday-august-25th-2026`):** Genuine injury alarm regarding an ankle sprain with potential high-ankle severity; source flagged missed time risk and elevated Mike Washington Jr. as backup.
   - **DJ Moore / BUF (`friday-august-28th-2026`):** Preseason lower-leg injury tracking following trade from Chicago.
   - **Green Bay Receiving Corps (`thursday-august-20th-2026`):** "No 1,000-yard receiver since 2021" confirms heavily rotational target distribution.

---

## 2. Ingestion Architecture & Data Flow

```mermaid
flowchart TD
    subgraph ExternalSource ["External Web Source"]
        Sitemap["https://www.bettorday.com/sitemap-posts.xml"]
        Posts["https://www.bettorday.com/{date-slug}/"]
        Trench["https://www.bettorday.com/the-2026-trench-strength-of-schedule-report/"]
    end

    subgraph IngestionAgent ["Ingestion Layer: agents/bettorday-newsletter-ingest.js"]
        A1["Fetch Sitemap & Filter 2026 Posts"]
        A2["Fetch & Parse Server-Side HTML (Zero Browser Automation)"]
        A3["Extract Table 1 (Team Composites) & Table 3 (Schedule SOS)"]
        A4["Extract Key Sections: Market, Notes, Injury Flags, Best Bets"]
    end

    subgraph StorageLayer ["Storage & Receipt Layer"]
        R1[".nfl/receipts/bettorday_newsletters_*.json"]
        R2["data/intel/bettorday_trench_ratings_2026.json"]
        DB1[("Supabase: intel_newsletters")]
        DB2[("Supabase: nfl_trench_ratings")]
    end

    subgraph ConsumerLayer ["Downstream Consumers"]
        C1["In-Season Matchup Analyzers"]
        C2["IDP Tackle Environment Evaluator"]
        C3["Offensive RB/QB Matchup Matchers"]
    end

    Sitemap --> A1
    Posts --> A2
    Trench --> A3
    A1 & A2 --> A4
    A3 --> R2 & DB2
    A4 --> R1 & DB1
    DB1 & DB2 --> ConsumerLayer
```

---

## 3. Strict Boundary & Pipeline Ownership Rules

Per the engineering audit standards:
1. **Zero Overwrites to Live Board Files:** `agents/bettorday-newsletter-ingest.js` **never** writes to `docs/fantasy/2026_Rose_Bowl_*` or `public/2026_Rose_Bowl_*`. Those files are strictly owned by `agents/fantasy-rose-bowl-build.js`.
2. **Native HTTP Only:** Operates via standard Node `fetch` with browser headers. Zero heavy headless browser dependencies or interactive sessions required.
3. **Explicit Data Discrimination:** `metric_type` explicitly partitions raw team composites (`'team_composite'`) from schedule difficulty scores (`'schedule_sos'`).
4. **Explicit Lineage:** All ingested text notes, projected totals, and z-score rankings are tagged `source='bettorday'` to maintain clear data lineage.

---

## 4. Target Database Schema (Supabase)

### Table 1: `intel_newsletters`
Captures individual newsletter editions, market quotes, and player mentions.

| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `TEXT` | Primary key (`bettorday_{slug}`) |
| `source` | `TEXT` | Hardcoded `'bettorday'` |
| `title` | `TEXT` | Full article headline |
| `published_at` | `TIMESTAMPTZ` | Timestamp from Ghost post metadata |
| `url` | `TEXT` | Original post URL |
| `teams_mentioned` | `TEXT[]` | Array of three-letter NFL team codes (e.g. `['NYJ', 'LAR']`) |
| `summary` | `TEXT` | Clean extracted prose of the analysis |
| `raw_content` | `TEXT` | Sanitized full article text |
| `captured_at` | `TIMESTAMPTZ` | Ingestion timestamp (`now()`) |

### Table 2: `nfl_trench_ratings`
Captures the line of scrimmage ratings per team, partitioned by metric type.

| Column | Type | Constraints / Description |
|---|---|---|
| `team` | `TEXT` | Three-letter team abbreviation (PK component) |
| `season` | `INT` | e.g. `2026` (PK component) |
| `week` | `INT` | `0` for Preseason Baseline, `1..18` for In-Season (PK component) |
| `metric_type` | `TEXT` | `'team_composite'` or `'schedule_sos'` (PK component) |
| `rank_overall` | `INT` | League rank 1–32 within metric type |
| `score_overall` | `NUMERIC(4,2)` | Overall z-score |
| `run_block_z` | `NUMERIC(4,2)` | Run block / facing run block z-score |
| `pass_block_z` | `NUMERIC(4,2)` | Pass block / facing pass block z-score |
| `run_defense_z` | `NUMERIC(4,2)` | Run defense / facing run defense z-score |
| `pass_rush_z` | `NUMERIC(4,2)` | Pass rush / facing pass rush z-score |
| `as_of_date` | `DATE` | Publication / captured date |

**Conflict Key:** `(team, season, week, metric_type, as_of_date)`

---

## 5. Ingest Script CLI Specification

**File:** `agents/bettorday-newsletter-ingest.js`

```bash
# Ingest latest newsletters and trench report (dry run, saves to .nfl/receipts/ and data/intel/)
node agents/bettorday-newsletter-ingest.js --dry-run

# Full ingest writing to Supabase and local archives
node agents/bettorday-newsletter-ingest.js --season 2026

# Ingest specific post or limit history sweep
node agents/bettorday-newsletter-ingest.js --limit 10
```
