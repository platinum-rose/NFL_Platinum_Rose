# NFL Dashboard — Session Handoff: Podcast Backlog Cleared & Melbourne Player Props Prep

**Date:** 2026-09-10T13:50:00-07:00 (~20:50 UTC)  
**Branch:** `main`  
**Primary Focus for Fresh Session:** **Player Props for Tonight's Game (LAR vs SF in Melbourne)**  

---

## 1. What Was Accomplished in This Session

### A. In-Season Ingestion Pipelines Fully Updated
- **Workflow Schedules Aligned for 2026 Regular Season**:
  - `.github/workflows/podcast-ingest.yml`: Running Tue–Fri 08:30 UTC (`30 8 * * 2,3,4,5`), `max_per_run: 6`.
  - `.github/workflows/odds-ingest.yml`: In-season every 4 hours (`0 */4 * * *`).
  - `.github/workflows/injury-ingest.yml`: Aligned with official 90-min inactives (Sun 15:45 & 19:15 UTC; Sun/Mon/Thu 23:00 UTC).
  - `.github/workflows/research-intel-ingest.yml`: Added Sunday gameday sweep at 15:00 UTC (11:00 AM ET).
- **Groq API Integration**:
  - `GROQ_API_KEY` added to `.env` and verified active (access to `whisper-large-v3` at 7,200s/hr free tier for single-host shows).

### B. Complete Podcast Backlog Audited & Cleared in Supabase
- **18 Obsolete Episodes Cleared Out**:
  - Category A: Action Network Golf previews (3 error episodes) -> `skipped_non_nfl`
  - Category B: Warren Sharp March free agency/combine (8 episodes) -> `skipped_preseason`
  - Category C: BettingPros Summer/College/HOF guides (5 episodes) -> `skipped_preseason`
  - Move the Sticks preseason episodes (2 episodes) -> `skipped_preseason`
- **12 Targeted Episodes of The Athletic Football Show Ingested**:
  - 10 Category D summer training camp & division previews + 2 Category E early September previews.
  - Transcribed with **AssemblyAI Universal-2 with full speaker diarization** (`speaker_labels: true`).
  - Extracted with **Gemini 3.8 Flash** structured extraction for picks, division expectations, and football intel.
  - Inserted to Supabase `podcast_transcripts` and marked `done` in `podcast_episodes`.
  - Archived locally as JSON and companion Markdown in `data/podcasts/m6-diarized/`.
- **Database Status**:
  - **Pending / Error Queue across ALL shows: `0`**.
  - 186 episodes `done`, 56 `skipped_non_nfl`, 15 `skipped_preseason`.

### C. Offline Deep-Dives Rebuilt & Test Suite 100% Green
- `data/podcasts/m6-diarized/manifest.json` updated with all 85 episodes.
- `scripts/build-podcast-transcript-deep-dives.js --source data/podcasts/m6-diarized` executed cleanly.
- `docs/podcast-transcript-deep-dives/index.html` updated with all 85 reports (including all 8 division previews + camp tours).
- Full Vitest suite: **96/96 test files passing, 1,464 unit tests green**.

---

## 2. Immediate Pickup for the Fresh Session: Tonight's Game Player Props (LAR vs SF in Melbourne)

Tonight marks the official 2026 NFL Kickoff game in Melbourne: **Los Angeles Rams vs. San Francisco 49ers**.

### Primary Target Files & Data Sources
1. **Player Props Intelligence Review**:
   - `data/research-intel/review/player-props-intel-latest.json`
   - `data/research-intel/review/player-props-intel-latest.html` & `.md`
   - Currently contains 5 vetted Melbourne props:
     - Kyle Juszczyk (SF) receiving yards OVER 4.5 (-120) [Zachary Cohen, VSiN]
     - Puka Nacua (LAR) First TD (+800) [Mike Spector, BettingPros]
     - Mike Evans (SF) Anytime TD (+175) [Mike Spector, BettingPros]
     - Terrance Ferguson (LAR) Anytime TD (+400) [Mike Spector, BettingPros]
     - Christian McCaffrey (SF) Rushing Yards OVER 61+ (-115) [Steve Krebs, BettingPros]
2. **Dedicated Podcast Intelligence for Tonight**:
   - `data/podcasts/m6-diarized/2026-09-10-bettingpros-podcast-49ers-vs-rams-predictions-best-bets-props-and-same-game-parlay-ep-1054.json` (BettingPros Ep. 1054 dedicated strictly to 49ers vs Rams TNF picks, props & SGPs).
   - `data/podcasts/m6-diarized/2026-09-10-even-money-2026-nfl-week-1-prop-bets-and-parlays.json` (Ross Tucker & Steve Fezzik props breakdown).
   - `data/podcasts/m6-diarized/athletic_football_show_2026_nfc_west_preview.json` (Robert Mays & Derek Klassen deep schematic breakdown of Rams & 49ers: Blake Corum explosive run usage vs Kyron Williams, Terrence Ferguson slot mismatch role, Brock Purdy facing Myles Garrett & Aaron Donald).
3. **StatTree Projection Models for Melbourne**:
   - `scratch/stattree_melbourne_raw.json`
   - Inspect script: `scratch/dump_melbourne_props.mjs`
4. **Builder Script**:
   - `scripts/build-player-props-intel.js` (generates the latest JSON/HTML/MD review artifacts).

### Immediate Next Steps in Fresh Session
1. Ingest/synthesize the newest prop recommendations from BettingPros Ep. 1054 and Even Money Week 1 Props into `data/research-intel/review/player-props-intel-latest.json`.
2. Cross-reference StatTree hit rates and edge scores for Melbourne props (Puka Nacua reception share, Kyron Williams/Blake Corum rushing splits, Christian McCaffrey volume, George Kittle/Kyle Juszczyk targets).
3. Present the finalized Player Props Card & Same Game Parlays (SGPs) for tonight's game to Andy for execution review.
