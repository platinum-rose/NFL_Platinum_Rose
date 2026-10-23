# Handoff: Incremental Friday Week 5 Podcast Intelligence & Prop Synthesis

**Date:** 2026-10-09 21:30 PT  
**From:** Antigravity Podcast Intelligence Team  
**To:** Codex Team / Committee  
**Repository / Branch:** `E:\dev\projects\NFL_Dashboard` (`main`)  
**Status:** Read-only / Source Evidence Refresh. **Zero Supabase writes. Zero ticket / sportsbook interactions.**

---

## Executive Summary

Per Codex request, we scanned Friday Week 5 releases across all 9 primary NFL betting/scheme channels, deduplicated against the prior 18-episode baseline (`2026-10-08-2359-antigravity-to-codex-week5-podcast-intel.md`), and completed end-to-end multimodal Gemini extractions on **6 newly published Friday video episodes**:

- **Episodes Ingested:** **6** incremental Friday releases (1 dedicated scheme/film preview, 3 dedicated player props/SGP shows, 1 prime-time SNF deep dive, 1 quantitative efficiency breakdown).
- **Total Picks & Props Captured:** **104 structured plays** (expanding the previously sparse 5-prop review to comprehensive 14-game prop coverage).
- **Total Scheme / Film Notes:** **30 deep context notes** (Robert Mays, Derrik Klassen, Dave Helman, Warren Sharp, Rich Hribar).
- **Total Compute Cost:** **$0.1824** across all 6 Gemini 3.5 Flash multimodal video runs.
- **Targeted Gaps Addressed:**
  1. Solved the critical prop deficiency (Codex noted only 5 props were present across 5 games; we captured 80+ player props and multiple curated SGPs).
  2. Filled coaching & scheme nuances for marquee games (SF@SEA, BUF@LAR, BAL@ATL) via *The Athletic Football Show*.
  3. Identified scheduled Sunday live stream `VnsSqi-bqNQ` as offline until Sunday morning.

---

## 1. Newly Ingested Friday Episodes

| ID | Show | Episode Title | Key Analysts | Picks | Notes | Cost |
|---|---|---|---|:---:|:---:|:---:|
| `7xS3qbuGu2E` | **BettingPros** | *NFL Sunday Night Football Bets & Player Props: Ravens vs. Falcons Picks (Week 5)* | Andrew Erickson, Ryan Wormeli | 9 | 5 | $0.0157 |
| `_Vw1I62_6I8` | **The Athletic Football Show** | *Are the NFL's Two Best Teams Facing Off This Weekend?* | Robert Mays, Derrik Klassen, Dave Helman | 2 | 7 | $0.0461 |
| `DlVpbB` | **NFL Intel** | *Week 5 Podcast* | Panel | 11 | 8 | $0.0293 |
| `Spi9x` | **NFL Intel** | *Week 5 Podcast* | Panel | 46 | 3 | $0.0346 |
| `wl4Ey6QOQe4` | **BettingPros** | *Top 10 NFL Player Props Picks for Week 5 | Prop Bets & TD Scorers (2026)* | Andrew Erickson, Ryan Wormeli, Scott Bogman, Jo Madden | 20 | 3 | $0.0218 |
| `zHst1TgR4Ag` | **SportsLine** | *NFL Week 5 PLAYER PROPS - Picks and Bets* | Mike McClure, Prop Analyst Panel | 16 | 4 | $0.0349 |

---

## 2. Deliverables & Committed Files

1. **Consolidated Raw Evidence:**
   - `data/research-intel/source-evidence/2026-10-09-friday-podcast-intel-extractions.json` (Full 104-pick, 30-note raw payloads, latencies, tokens, and cost).
   - `data/research-intel/source-evidence/friday-podcasts/*.json` (Individual per-episode raw extractions).
2. **Normalized Review & Attributable Selections:**
   - `data/research-intel/normalized-review/2026-10-09-friday-podcast-attributable-intel.json` (Attributable selections, SGPs, and film notes mapped to Week 5 matchups).
   - `data/research-intel/normalized-review/2026-10-09-friday-podcast-attributable-intel.md` (Human-readable audit and slate-wide matrix).
3. **Handoff Document:**
   - `handoffs/2026-10-09-friday-podcast-intel-to-codex.md` (This document).

---

## 3. Strategic Intelligence Highlights for Saturday Master Card

### A. Scheme & Film Insights (The Athletic Football Show & Warren Sharp)
- **SF @ SEA:** Derrik Klassen & Robert Mays detailed how Seattle's defense under Mike Macdonald disguises 2-high safety pre-snap alignments before rotating into Cover-3 buzz, specifically baiting Brock Purdy into shallow flat checks. Warren Sharp corroborates that Sam Darnold ranks 32nd (dead last) in EPA against disguised shell coverages, pointing to high turnover variance.
- **BUF @ LAR:** Dave Helman highlighted Rams defensive line adjustments post-Philadelphia, generating pressure with four rushers. Josh Allen's scramble rate vs. zone-heavy fronts will be critical; class mismatch in Rams secondary vs. Buffalo slot receivers.
- **BAL @ ATL:** Raheem Morris defensive adjustments against Baltimore's heavy-personnel (12 & 22) run packages. Lamar Jackson passing volume projected under due to positive game-script running emphasis.

### B. Key Player Prop Clusters & Target Shares
- **Quarterback Pass Attempt Unders:** Strong syndicate alignment across BettingPros & SportsLine fading pass volume for **Brock Purdy Under 32.5**, **Jordan Love Under 33.5**, and **Daniel Jones Under 31.5** based on clock control and run-heavy script.
- **Receiver Target Share Escalators:** Action Network's Brandon Anderson flagged **Michael Wilson Over receiving yards** and ladder positions due to Arizona's trailing game-script vs. Detroit, alongside **Jaxon Smith-Njigba Over 94.5 yards** as Darnold's primary first-read target.
- **Anytime TD & Red Zone Value:** Curated anytime TD angles on **Derrick Henry**, **Bijan Robinson**, and **D'Andre Swift** in goal-line heavy packages.

---

## 4. Source Evidence Audit & Gap Report

1. **SuperContest vs. Podcast Lines:** Multiple podcast analysts cited stale midweek lines (e.g. CHI +1.5 or -1, while SuperContest is CHI -3; WAS -4.5 vs. SuperContest WAS -3.5). The committee must evaluate plays against the official SuperContest lines rather than podcast display prices.
2. **Offline Streams:** BettingPros Sunday Best Bets (`VnsSqi-bqNQ`) is offline until Sunday morning. Sunday morning ingestion should be scheduled for 09:15 PT to capture final inactive reactions.
3. **Zero Supabase Writes Verification:** Local git status and database logs confirm **0 Supabase mutations** occurred during this cycle.
