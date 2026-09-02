# 🏈 Antigravity Handoff: BettorDay Holistic Intel Pipeline & IDP Dossier Hardening

> **Date:** September 1, 2026 (20:30 PDT)  
> **Author:** Antigravity  
> **Target:** Master State / Cross-Agent Sync (Claude, Antigravity, Andy)  
> **Status:** BettorDay Ingestion Agent & Spec Audited & Committed (`e95137d`); IDP 40-Player Dossier Suite 100% CSV-Verified across MD, HTML, and DOCX; Ready for Draft Day & Next Project Expansion.

---

## 🎯 1. Master IDP Dossier Suite & Watchlist Verification State

All IDP strategic assets are 100% synchronized with the live production board (`docs/fantasy/2026_Rose_Bowl_Custom_Rankings.csv`):

| Document | Commit | Verification & Integrity State |
|---|---|---|
| [`docs/fantasy/2026_MASTER_IDP_40_PLAYER_DOSSIER_SUITE.md`](file:///e:/dev/projects/NFL_Dashboard/docs/fantasy/2026_MASTER_IDP_40_PLAYER_DOSSIER_SUITE.md) | `1d6ba2c` | **40/40 Verified OK.** All player headings queried directly from CSV via `scratch/verify-dossier-ranks.mjs`. Tier 4 lineup completely updated with actual board LBs (Jihaad Campbell `#208`, Drue Tranquill `#216`, Quincy Williams `#223`, Payton Wilson `#227`, Christian Elliss `#235`). All non-pipeline numbers tagged `*(editorial estimate)*`. |
| [`docs/fantasy/2026_MASTER_IDP_40_PLAYER_DOSSIER_SUITE.html`](file:///e:/dev/projects/NFL_Dashboard/docs/fantasy/2026_MASTER_IDP_40_PLAYER_DOSSIER_SUITE.html) | `1d6ba2c` | Dark war-room theme, tier color codes, responsive player cards, print stylesheet. |
| [`docs/fantasy/2026_MASTER_IDP_40_PLAYER_DOSSIER_SUITE.docx`](file:///e:/dev/projects/NFL_Dashboard/docs/fantasy/2026_MASTER_IDP_40_PLAYER_DOSSIER_SUITE.docx) | `1d6ba2c` | Formatted Word document with Table of Contents. |
| [`docs/fantasy/2026_IN_SEASON_IDP_WATCHLIST.md`](file:///e:/dev/projects/NFL_Dashboard/docs/fantasy/2026_IN_SEASON_IDP_WATCHLIST.md) | `b6d8471` | **All Starter Ranks Verified.** Queen (`#204`), Landman (`#166`), Overshown (`#181`) tagged `*(CSV-verified)*`. Josiah Trotter / Alex Anzalone row properly relabeled as off-board NFL depth-chart context only. |
| `public/` mirrors | `1d6ba2c` | Mirrors synced for all four files. |

---

## 🔬 2. BettorDay Holistic Intel Pipeline & Audit Resolution

A new automated intelligence source has been specified, built, audited, and resolved.

### Architecture Overview
*   **Source:** BettorDay ("32 in 32" daily preseason newsletters + Trench Strength of Schedule report).
*   **Access Mode:** Native Node `fetch` with browser headers against Ghost server-side rendered HTML (`https://www.bettorday.com/sitemap-posts.xml`). Zero headless browser dependencies.
*   **Strict Isolation:** Ingests strictly to `.nfl/receipts/`, `data/intel/`, and Supabase tables (`intel_newsletters`, `nfl_trench_ratings`). **Never touches** `docs/fantasy/2026_Rose_Bowl_*` or `public/2026_Rose_Bowl_*`.

### Claude Audit Findings & Resolutions (Commit `e95137d`):
1.  **Two-Table Conflation Bug Fixed:** `fetchTrenchReport()` in `agents/bettorday-newsletter-ingest.js` now separately parses:
    *   **Table 1 (`metric_type='team_composite'`):** Raw line-of-scrimmage power ratings (32 teams).
    *   **Table 3 (`metric_type='schedule_sos'`):** Schedule difficulty faced across opposing lines (32 teams).
    *   Supabase schema and conflict key updated to `(team, season, week, metric_type, as_of_date)`.
2.  **Denver 14-Win Correction:** Re-attributed the 14-win regression narrative from New England to the **Denver Broncos** (`thursday-august-6th-2026`).
3.  **Ashton Jeanty Injury Risk Reframed:** Corrected narrative from "confirmed mild" to active high-ankle concern with missed-time risk (`monday-august-24th-2026`, `tuesday-august-25th-2026`).
4.  **Audit Citations Added:** Added post dates and URL slugs for every narrative claim in `docs/specs/BETTORDAY_INTEL_PIPELINE_SPEC_2026-09-01.md`.

---

## 📊 3. Key Baseline Datasets Available

1.  **Trench Ratings Baseline:** `data/intel/bettorday_trench_ratings_2026.json` (64 records: 32 team composites + 32 schedule SOS).
    *   *Top O-Lines:* LAR (`+2.71` Run Block), PHI (`+2.12` Pass Block), DEN (`+1.86` Run Block), SF (`+1.99` Run Block).
    *   *Top Pass Rushes:* LAR (`+2.66`), HOU (`+2.38`), PIT (`+1.42`), PHI (`+1.16`).
    *   *Leakiest Run Defenses (High IDP Tackle Environments):* LV (`-2.22`), CIN (`-1.96`), GB (`-1.48`).
2.  **Newsletter Receipts:** `.nfl/receipts/bettorday_newsletters_2026-09-02.json` (Structured JSON containing full text, timestamps, detected teams, and key section extracts).

---

## 🚀 4. Draft Day State & Next Development Vectors

### Draft Day Readiness (Rose Bowl — Tomorrow)
*   **Draft Slot:** Pick 3 (1.03) in 12-team Full PPR, no kickers, 3 required IDP LB starters.
*   **Turns:** 1.03, 2.10, 3.03, 4.10, 5.03, 6.10, 7.03, 8.10 (IDP window opens ~Round 8–11).
*   **Board:** `docs/fantasy/2026_Rose_Bowl_Custom_Rankings.csv` (280 players, 40 LBs interleaved index-proportionally across Ranks 85–235, IR stashes appended post-280).

### Next Development Vectors in NFL Dashboard
1.  **Weekly Matchup & Start/Sit Engine:** Integrate `nfl_trench_ratings` into in-season weekly matchup projections (matching offensive line pass protection vs. opponent pass rush z-scores).
2.  **Automated Daily Ingest Cron:** Wire `agents/bettorday-newsletter-ingest.js` into regular season morning scheduling.
3.  **Cross-League In-Season Roster Monitoring:** Build weekly waiver wire scanners cross-referencing injury reports against `docs/fantasy/2026_IN_SEASON_IDP_WATCHLIST.md`.

---

## 📋 5. Resume Prompt

Copy and paste the following prompt to resume the next session:

```markdown
Resume NFL Dashboard development from handoff: `handoffs/2026-09-01-2030-antigravity-bettorday-intel-and-dossier-hardening-handoff.md`.

Context snapshot:
- IDP Dossier Suite (docs/fantasy/2026_MASTER_IDP_40_PLAYER_DOSSIER_SUITE.md / .html / .docx) is 100% verified against the live board CSV (commit 1d6ba2c).
- In-Season IDP Watchlist (docs/fantasy/2026_IN_SEASON_IDP_WATCHLIST.md) is CSV-verified (commit b6d8471).
- BettorDay Ingestion Agent (agents/bettorday-newsletter-ingest.js) & Spec (docs/specs/BETTORDAY_INTEL_PIPELINE_SPEC_2026-09-01.md) audited and committed (commit e95137d), partitioning team composites from schedule SOS.
- Claude team is integrating the pipeline into the live production runner.

Standing constraints:
- Pipeline Ownership Rule: `agents/fantasy-rose-bowl-build.js` is the sole owner of `docs/fantasy/2026_Rose_Bowl_*` and `public/2026_Rose_Bowl_*`.
- No scratch scripts writing to live production draft files.

Please inspect current repository state and ask for the next operational objective or proceed with in-season matchup / dashboard tooling.
```
