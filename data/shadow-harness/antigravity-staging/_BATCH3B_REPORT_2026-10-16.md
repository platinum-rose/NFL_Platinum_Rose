# Platinum Rose: Antigravity Intel Collection — Batch 3b Report (Friday Retry)

**Run Timestamp:** 2026-10-16 08:15 PT  
**Target:** NFL Week 6 (Sunday 2026-10-18 slate)  
**Execution Constraints Enforced:** Zero paid API calls (no Gemini, OpenAI, Claude), no Supabase calls, no git commits/staging, no sportsbook logins, work strictly confined to `data/shadow-harness/antigravity-staging/`.

---

## 1. Executive Summary & Friday Morning Retry Results

1. **Browser Transcript Panel Retries (`YwW6cqRBOao`, `LAcTapfzSH0`, `BlFH_PEwxhc`, `M77HPuZkC5Q`, `mzT6ReHpq2Q`):**
   - Connected via Playwright CDP directly to the running signed-in Chrome session (`http://localhost:9222`).
   - For each video, the browser loaded the watch page, expanded the video description, and clicked the on-page "Show transcript" button.
   - **Network Inspection Finding:** When YouTube’s frontend makes the browser-internal fetch to `https://www.youtube.com/api/timedtext`, YouTube responds with **HTTP 429: Too Many Requests** (`<html><title>Sorry...</title>`). Because of this network-level IP rate limit, the YouTube transcript panel renders skeleton loaders and returns 0 transcript segments.
   - Consistent with Rule 1 & Step 1, these episodes remain properly documented in staging with `"status": "no_transcript"` and honest duration/coverage fields.

2. **The Joe Holka Show Channel Harvest (`UCkz9wOHIZR62kbQ1600htZQ`):**
   - Harvested the 20 most recent uploads.
   - Only two videos were published on or after 2026-10-13:
     - `tLexfj6cm5o` (2026-10-15): *Seahawks vs. Broncos Prediction: Best Bet for NFL Week 6* (Thursday Night Football).
     - `szXtHPTD3fI` (2026-10-15): *long-term winner just bet $278,000 on one TNF play* (Thursday Night Football).
   - Per explicit instruction ("Skip TNF (SEA@DEN is played)"), both videos were skipped. There are currently zero Sunday-slate Week 6 videos published on Holka's channel (his weekend slate videos typically drop Friday afternoon / Saturday).

3. **New Friday Morning Uploads (Published 2026-10-16):**
   - **Warren Sharp:** [`youtube-tGNDVneDeEQ`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-tGNDVneDeEQ.json) (*(39-15, 72%) NFL Week 6 Best Bets & Player Props 2026: Cowboys-Packers, Bears-Falcons...* — 2910s).
   - **Ross Tucker:** [`youtube--aQZO-z-wkw`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube--aQZO-z-wkw.json) (*Greg Cosell's 2026 NFL Week 6 PREVIEW: Part 2 + Broncos - Seahawks Recap* — 1668s).
   - **The Action Network:**
     - [`youtube-C8cDtGmsRoc`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-C8cDtGmsRoc.json) (*NFL Week 6 Best Bets: Player Props, SGPs & Longshots | Brandon Anderson...* — 3157s).
     - [`youtube-ji7mGtqc9Ys`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-ji7mGtqc9Ys.json) (*Steelers vs. Buccaneers Picks & Predictions | NFL Week 6 Best Bets* — 450s).
   - Browser panel checks on these four new uploads encountered the same HTTP 429 on `timedtext`. Staging JSON files have been initialized with `"status": "no_transcript"`.

4. **Corrections Applied to [`youtube-5AikVQLaJEg.json`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-5AikVQLaJEg.json):**
   - **(a) CAR@PHI:** `side` set to `"CAR"` and `line` set to `null` with rationale noting Doug plays Carolina because the Eagles are a home dog; uncertainty flag added for unstated numerical line.
   - **(b) DAL@GB Total:** `line` set to `null`, `team` set to `null`, `side` is `"OVER"`; uncertainty flag added.
   - **(c) HOU & DAL Teasers:** `line` set to `null` for both legs; rationale updated to include `"teaser, 6 pts"`; uncertainty flags added.
   - **(d) ATL +510:** `market` updated from `"moneyline"` to `"parlay_price_note"`.
   - **(e) Total Picks:** `team` set to `null` for both `BAL@CLE` Under 43.0 and `DAL@GB` Over.
   - **(f) Speaker Segments:** Expanded from 10 isolated snippets to **129 continuous 30–45s speaker blocks** covering the entire video from `0.0s` to `4625.6s` (video duration 4647s).

---

## 2. Processed Videos Table (Batch 3 + Batch 3b)

| Episode ID | Channel | Title | Date | Status | Picks | Notes | End Reached | Transcript Source / Failure Details |
|---|---|---|---|---|---|---|---|---|
| [`youtube-5AikVQLaJEg`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-5AikVQLaJEg.json) | The Action Network | NFL Week 6 Best Bets: Our Picks for EVERY Game! | 2026-10-14 | `extracted` | 13 | 5 | Yes (`4625s/4647s`) | `auto_captions` (129 speaker segments, full captions saved to [`youtube-5AikVQLaJEg.captions.txt`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-5AikVQLaJEg.captions.txt)) |
| [`youtube-tGNDVneDeEQ`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-tGNDVneDeEQ.json) | Warren Sharp | NFL Week 6 Best Bets & Player Props 2026 | 2026-10-16 | `no_transcript` | 0 | 0 | No (`0s/2910s`) | Browser panel timedtext returned HTTP 429 Too Many Requests |
| [`youtube--aQZO-z-wkw`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube--aQZO-z-wkw.json) | Ross Tucker | Greg Cosell: Week 6 Preview Part 2 | 2026-10-16 | `no_transcript` | 0 | 0 | No (`0s/1668s`) | Browser panel timedtext returned HTTP 429 Too Many Requests |
| [`youtube-C8cDtGmsRoc`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-C8cDtGmsRoc.json) | The Action Network | Week 6 Best Bets: Player Props, SGPs & Longshots | 2026-10-16 | `no_transcript` | 0 | 0 | No (`0s/3157s`) | Browser panel timedtext returned HTTP 429 Too Many Requests |
| [`youtube-ji7mGtqc9Ys`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-ji7mGtqc9Ys.json) | The Action Network | Steelers vs. Buccaneers Picks & Predictions | 2026-10-16 | `no_transcript` | 0 | 0 | No (`0s/450s`) | Browser panel timedtext returned HTTP 429 Too Many Requests |
| [`youtube-YwW6cqRBOao`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-YwW6cqRBOao.json) | Ross Tucker | Greg Cosell: Week 6 Preview Part 1 | 2026-10-15 | `no_transcript` | 0 | 0 | No (`0s/1669s`) | Browser panel timedtext returned HTTP 429 Too Many Requests |
| [`youtube-LAcTapfzSH0`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-LAcTapfzSH0.json) | Ross Tucker | Week 6 Power Rankings & Bills-Rams Reaction | 2026-10-13 | `no_transcript` | 0 | 0 | No (`0s/1728s`) | Browser panel timedtext returned HTTP 429 Too Many Requests |
| [`youtube-BlFH_PEwxhc`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-BlFH_PEwxhc.json) | Sharp or Square | NFL Week 6 Spotlight: HOU vs JAX | 2026-10-14 | `no_transcript` | 0 | 0 | No (`0s/489s`) | Browser panel timedtext returned HTTP 429 Too Many Requests |
| [`youtube-M77HPuZkC5Q`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-M77HPuZkC5Q.json) | BettingPros | 10 Best Bets for NFL Week 6 | 2026-10-15 | `no_transcript` | 0 | 0 | No (`0s/2176s`) | Browser panel timedtext returned HTTP 429 Too Many Requests |
| [`youtube-mzT6ReHpq2Q`](file:///E:/dev/projects/NFL_Dashboard/data/shadow-harness/antigravity-staging/youtube-mzT6ReHpq2Q.json) | The Action Network | Week 6 Preview & Picks (The Favorites Pod) | 2026-10-15 | `no_transcript` | 0 | 0 | No (`0s/4648s`) | Captions disabled by creator on YouTube |

---

## 3. Skipped Videos and Justifications

### A. Thursday Night Football (SEA@DEN Already Played)
- `tLexfj6cm5o` (Joe Holka): *Seahawks vs. Broncos Prediction: Best Bet for NFL Week 6*
- `szXtHPTD3fI` (Joe Holka): *long-term winner just bet $278,000 on one TNF play*
- `aflz1x0ayag` (The Action Network): *Seahawks vs. Broncos Picks & Predictions*
- `cHHd13wvnDI` (BettingPros): *Top NFL Picks for Seahawks vs. Broncos*
- `zuAINjMHJmQ` (Sharp or Square): *Hotline Week 6 - Calls on Seahawks vs. Broncos*

### B. Pre-Specified Skip IDs
- `EC4r_E6mc0E`, `Di8EC4Nu_XE`, `0XtOHyz2LRs` (Batch 1 extracted)
- `slfl5V7gaOY`, `b_vEEqWIg2c`, `06-42WRzKQI` (Batch 1/2 `no_transcript`)
- `DgU_WrFcn-Q`, `2vGRyoc6V2A`, `36yrqXIiZ40`, `Id4ZG8i0BuA`, `3beH43dMxA` (Batch 2 processed)

### C. Non-NFL Sports / College Football
- `S88BU31f3cU` (Action Network): UFC Vegas 122 (Joaquin Buckley vs. Mike Malott)
- `I8ceJ2f9N8g` (BettingPros): College Football Week 7 + MLB Playoffs
- `tu_QVzFM-9M`, `moega-a0piM` (Action Network): CFB Week 7
- `xjbTadsUJ4Y` (Action Network): NBA Futures Win Totals
- `28d6KIvysLk` (Action Network): NASCAR

### D. Fantasy Football / Non-Betting Shows
- `DflRQvGJ1Ic`, `NnSrEoBfSYQ` (Action Network): Week 6 Fantasy rankings and waiver wire
- All Sal Vetri uploads (`2zUMnfLh9EM`, `62pUH9Kr2_8`, etc.): Fantasy trades and waiver advice
